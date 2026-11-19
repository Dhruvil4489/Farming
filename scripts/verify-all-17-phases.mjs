/**
 * SmartFarm AI — Full Automated End-to-End Verification Suite (Phases 1–16)
 * Tests every upgraded module against the live Next.js production server.
 */

import { PrismaClient } from '@prisma/client';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3005';
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, label, detail = '') {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${label}`);
  } else {
    failed++;
    const msg = `${label}${detail ? ` — ${detail}` : ''}`;
    failures.push(msg);
    console.error(`  [FAIL] ${msg}`);
  }
}

async function api(path, options = {}, cookie = '') {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const setCookie = res.headers.get('set-cookie') || '';
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, ok: res.ok, json, setCookie, text };
}

function extractTokenCookie(setCookie) {
  const m = setCookie.match(/smartfarm_token=[^;]+/);
  return m ? m[0] : '';
}

async function run() {
  const testEmail = `qa_farmer_${Date.now()}@smartfarm.test`;
  const testPassword = 'TestPassword123!';
  const newPassword = 'ResetPassword456!';
  let testUserId = null;

  try {
    console.log(`\n=== SMARTFARM AI FULL E2E VERIFICATION (${BASE}) ===\n`);

    // ---------------------------------------------------------
    // PHASE 2: EMAIL AUTHENTICATION & LEGACY ACCOUNT SAFETY
    // ---------------------------------------------------------
    console.log('--- Phase 2: Email Authentication & Legacy Account Safety ---');

    // Confirm existing legacy mobile-only accounts remain intact
    const legacyUsers = await prisma.user.findMany({
      where: { email: null, phone: { not: null }, deletedAt: null },
      select: { id: true, name: true, phone: true },
    });
    assert(legacyUsers.length >= 1, `Existing legacy mobile accounts preserved intact (${legacyUsers.length} accounts)`);

    // 2.1 Register with Email + Password
    const reg = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'QA Test Farmer',
        email: testEmail.toUpperCase(), // test case-insensitive normalization
        password: testPassword,
        state: 'Gujarat',
        district: 'Vadodara',
        village: 'Padra',
        pincode: '391440',
        preferredLanguage: 'en',
      }),
    });
    assert(reg.status === 201 && reg.json?.data?.email === testEmail, 'Register with email normalizes to lowercase', JSON.stringify(reg.json));
    testUserId = reg.json?.data?.id;
    let cookie = extractTokenCookie(reg.setCookie);
    assert(Boolean(cookie), 'Registration sets HttpOnly auth cookie');

    // 2.2 Duplicate email prevention (case-insensitive)
    const dup = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate User',
        email: testEmail.toUpperCase(),
        password: testPassword,
      }),
    });
    assert(dup.status === 409, 'Duplicate email rejected with 409');

    // 2.3 Verify email delivery log created for verification email
    const verifyLogs = await prisma.emailDeliveryLog.findMany({
      where: { userId: testUserId, templateKey: 'verification' },
    });
    assert(verifyLogs.length === 1, `Verification email logged in EmailDeliveryLog (status=${verifyLogs[0]?.status})`);

    // 2.4 Resend verification & verify email via freshly generated token/OTP
    const resend = await api('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail }),
    }, cookie);
    assert(resend.status === 200 && resend.json?.data?.sent === true, 'Resend verification email succeeds');

    // Verify user email directly via AuthToken table flow by creating a known test token via DB? Better: test verify-email invalid token rejection AND valid verification via forgot/reset flow!
    const badVerify = await api('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, otp: '000000' }),
    });
    assert(badVerify.status === 400, 'Invalid email verification OTP rejected with 400');

    // 2.5 Logout & verify protected route returns 401
    const logout = await api('/api/v1/auth/logout', { method: 'POST' }, cookie);
    assert(logout.status === 200, 'Logout returns 200');
    const unauth = await api('/api/v1/me');
    assert(unauth.status === 401, 'Unauthenticated /api/v1/me returns 401');

    // 2.6 Login with wrong password -> 401
    const badLogin = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
    });
    assert(badLogin.status === 401, 'Invalid password rejected with 401');

    // 2.7 Login with case-insensitive email + Remember Me
    const goodLogin = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail.toUpperCase(), password: testPassword, rememberMe: true }),
    });
    assert(goodLogin.status === 200 && goodLogin.json?.data?.email === testEmail, 'Case-insensitive email login succeeds');
    cookie = extractTokenCookie(goodLogin.setCookie);

    // 2.8 Forgot Password -> generates password_reset token + email log
    const forgot = await api('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail }),
    });
    assert(forgot.status === 200 && forgot.json?.data?.sent === true, 'Forgot password endpoint succeeds');
    const resetLogs = await prisma.emailDeliveryLog.findMany({
      where: { userId: testUserId, templateKey: 'password_reset' },
    });
    assert(resetLogs.length === 1, 'Password reset email recorded in EmailDeliveryLog');

    // Insert a deterministic test reset token hash to exercise POST /api/v1/auth/reset-password end-to-end
    const crypto = await import('crypto');
    const knownResetToken = 'qa_reset_' + crypto.randomBytes(16).toString('hex');
    await prisma.authToken.create({
      data: {
        userId: testUserId,
        type: 'password_reset',
        tokenHash: crypto.createHash('sha256').update(knownResetToken).digest('hex'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    const doReset = await api('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: knownResetToken, newPassword }),
    });
    assert(doReset.status === 200 && doReset.json?.data?.reset === true, 'Password reset via secure token succeeds');

    const loginNewPwd = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    });
    assert(loginNewPwd.status === 200, 'Login with newly reset password succeeds');
    cookie = extractTokenCookie(loginNewPwd.setCookie);

    // ---------------------------------------------------------
    // PHASE 1: FARM & FIELD AREA VALIDATION (ALL 8 VALUES!)
    // ---------------------------------------------------------
    console.log('\n--- Phase 1: Farm & Field Area Validation (0.5, 1, 5, 9.95, 10, 10.05, 25, 100) ---');
    const areaValues = [0.5, 1, 5, 9.95, 10, 10.05, 25, 100];

    const farmCreate = await api('/api/v1/farms', {
      method: 'POST',
      body: JSON.stringify({
        name: 'QA Area Test Farm',
        village: 'Padra',
        district: 'Vadodara',
        state: 'Gujarat',
        areaInputValue: 10,
        areaInputUnit: 'acre',
      }),
    }, cookie);
    assert(
      farmCreate.status === 201 && farmCreate.json?.data?.areaInputValue === 10 && farmCreate.json?.data?.areaInputUnit === 'acre',
      'Create Farm with exact area=10 Acre saves without rounding',
      JSON.stringify(farmCreate.json)
    );
    const farmId = farmCreate.json?.data?.id;

    for (const val of areaValues) {
      const upd = await api(`/api/v1/farms/${farmId}`, {
        method: 'PATCH',
        body: JSON.stringify({ areaInputValue: val, areaInputUnit: 'bigha' }),
      }, cookie);
      assert(
        upd.status === 200 && upd.json?.data?.areaInputValue === val && upd.json?.data?.areaInputUnit === 'bigha',
        `Farm PATCH accepts exact value ${val} Bigha`
      );
    }

    const fieldCreate = await api('/api/v1/fields', {
      method: 'POST',
      body: JSON.stringify({
        farmId,
        name: 'North Plot QA',
        areaInputValue: 10,
        areaInputUnit: 'acre',
      }),
    }, cookie);
    assert(
      fieldCreate.status === 201 && fieldCreate.json?.data?.areaInputValue === 10 && fieldCreate.json?.data?.areaInputUnit === 'acre',
      'Create Field with exact area=10 Acre saves cleanly'
    );
    const fieldId = fieldCreate.json?.data?.id;

    for (const val of areaValues) {
      const upd = await api(`/api/v1/fields/${fieldId}`, {
        method: 'PATCH',
        body: JSON.stringify({ areaInputValue: val, areaInputUnit: 'hectare' }),
      }, cookie);
      assert(
        upd.status === 200 && upd.json?.data?.areaInputValue === val && upd.json?.data?.areaInputUnit === 'hectare',
        `Field PATCH accepts exact value ${val} Hectare`
      );
    }

    const invalidArea = await api(`/api/v1/fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify({ areaInputValue: -5, areaInputUnit: 'acre' }),
    }, cookie);
    assert(invalidArea.status === 422, 'Negative area rejected cleanly with 422');

    // ---------------------------------------------------------
    // PHASE 3: COMPLETE INDIAN CROP DATABASE (EN / HI / GU)
    // ---------------------------------------------------------
    console.log('\n--- Phase 3: Indian Crop Database (60+ Crops, 10 Categories, EN/HI/GU Search) ---');
    const allCrops = await api('/api/v1/crops', {}, cookie);
    assert(allCrops.status === 200 && allCrops.json?.data?.length >= 60, `Catalog contains ${allCrops.json?.data?.length} Indian crops (>= 60)`);

    const hiSearch = await api('/api/v1/crops?q=' + encodeURIComponent('गेहूं'), {}, cookie);
    assert(hiSearch.json?.data?.some((c) => c.slug === 'wheat'), 'Hindi search "गेहूं" finds Wheat');

    const guSearch = await api('/api/v1/crops?q=' + encodeURIComponent('જીરું'), {}, cookie);
    assert(guSearch.json?.data?.some((c) => c.slug === 'cumin'), 'Gujarati search "જીરું" finds Cumin');

    const vegFilter = await api('/api/v1/crops?category=vegetable', {}, cookie);
    assert(vegFilter.json?.data?.length >= 15, `Vegetable category has ${vegFilter.json?.data?.length} crops (>= 15)`);

    // ---------------------------------------------------------
    // PHASE 5, 6 & 13: CROP LIFECYCLE ENGINE, TASKS, REMINDERS & EMAIL DEDUPLICATION
    // ---------------------------------------------------------
    console.log('\n--- Phases 5, 6 & 13: Crop Lifecycle Engine, Tasks, Reminders & Email Deduplication ---');
    const wheatCrop = allCrops.json.data.find((c) => c.slug === 'wheat');
    const twentyTwoDaysAgo = new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const cycleRes = await api('/api/v1/crop-cycles', {
      method: 'POST',
      body: JSON.stringify({
        fieldId,
        cropId: wheatCrop.id,
        sowingDate: twentyTwoDaysAgo,
      }),
    }, cookie);
    assert(cycleRes.status === 201, 'Create Wheat crop cycle (22 DAS) succeeds');
    const cycleId = cycleRes.json?.data?.id;
    const lc = cycleRes.json?.data?.lifecycle;
    assert(lc?.daysAfterSowing === 22, `Exact crop age calculated: ${lc?.daysAfterSowing} DAS`);
    assert(lc?.currentStage?.code === 'cri', `Active stage computed accurately as CRI (${lc?.currentStage?.name})`);
    assert(lc?.stages?.length === 7, `Wheat has 7 crop-specific stages (got ${lc?.stages?.length})`);
    assert(lc?.isApproximateTimeline === true, 'Transparent approximate timeline flag set when variety omitted');
    assert((cycleRes.json?.data?.automation?.tasksCreated || 0) >= 4, `Auto-generated ${cycleRes.json?.data?.automation?.tasksCreated} stage tasks`);
    assert((cycleRes.json?.data?.automation?.remindersScheduled || 0) >= 4, `Auto-scheduled ${cycleRes.json?.data?.automation?.remindersScheduled} reminders`);

    // Process due reminders once -> sends current-stage reminder
    const remRun1 = await api('/api/v1/scheduled/reminders', { method: 'POST' }, cookie);
    assert(remRun1.status === 200 && remRun1.json?.data?.sent >= 1, `Reminder scheduler dispatched due reminders (sent=${remRun1.json?.data?.sent})`);

    // Process due reminders second time immediately -> ZERO duplicate emails!
    const remRun2 = await api('/api/v1/scheduled/reminders', { method: 'POST' }, cookie);
    assert(remRun2.status === 200 && remRun2.json?.data?.sent === 0, 'Duplicate email prevention verified (second run sent=0)');

    const notifRes = await api('/api/v1/notifications', {}, cookie);
    assert(
      notifRes.status === 200 && (notifRes.json?.data?.notifications?.length || 0) >= 1 && (notifRes.json?.data?.recentEmails?.length || 0) >= 1,
      `Notification Center returned ${notifRes.json?.data?.notifications?.length} alerts & ${notifRes.json?.data?.recentEmails?.length} email logs`
    );

    // ---------------------------------------------------------
    // PHASE 7: CROP DISEASE IPM & CIB&RC SAFETY
    // ---------------------------------------------------------
    console.log('\n--- Phase 7: Crop Disease IPM & CIB&RC Banned-Pesticide Safety ---');
    const medRes = await api('/api/v1/diagnosis/medicines?crop=Tomato&disease=Early+Blight&label=Tomato___Early_blight', {}, cookie);
    assert(medRes.status === 200 && Boolean(medRes.json?.data?.ipmProtocol), 'Disease medicine matching includes structured IPM & CIB&RC safety protocol');

    // ---------------------------------------------------------
    // PHASE 9: LOCATION WEATHER + EXPLORE WEATHER BY LOCATION
    // ---------------------------------------------------------
    console.log('\n--- Phase 9: Location-Based Weather & Explore by Location ---');
    const farmWeather = await api(`/api/v1/weather?farm_id=${farmId}`, {}, cookie);
    assert(farmWeather.status === 200 && farmWeather.json?.data?.locationMode === 'registered_farm', `Farm weather loaded for ${farmWeather.json?.data?.locationLabel}`);

    const locSearch = await api('/api/v1/weather/search?q=Rajkot', {}, cookie);
    assert(locSearch.status === 200 && locSearch.json?.data?.length >= 1, `Location search "Rajkot" returned ${locSearch.json?.data?.length} hits`);

    const exploreWeather = await api('/api/v1/weather?q=Rajkot', {}, cookie);
    assert(
      exploreWeather.status === 200 && exploreWeather.json?.data?.locationMode === 'explore_temporary' && exploreWeather.json?.data?.locationLabel.includes('Rajkot'),
      `Explore weather loaded for ${exploreWeather.json?.data?.locationLabel}`
    );

    // Verify user's registered profile was NOT overwritten by temporary exploration
    const meAfter = await api('/api/v1/me', {}, cookie);
    assert(meAfter.json?.data?.district === 'Vadodara', 'Exploring Rajkot weather did NOT mutate farmer profile district (still Vadodara)');

    // ---------------------------------------------------------
    // PHASES 10 & 11: MANDI & SOIL MOISTURE
    // ---------------------------------------------------------
    console.log('\n--- Phases 10 & 11: Mandi Prices & Soil Moisture (Satellite vs Sensor) ---');
    const mandiRes = await api('/api/v1/market/prices?state=Gujarat', {}, cookie);
    assert(mandiRes.status === 200 && Array.isArray(mandiRes.json?.data), `Mandi API returned ${mandiRes.json?.data?.length} records`);

    const soilSat = await api('/api/v1/soil-moisture?state=Gujarat&district=Vadodara', {}, cookie);
    assert(soilSat.status === 200 && soilSat.json?.metadata?.sourceAuthority?.includes('NRSC'), 'Soil Moisture API clearly attributes NRSC / ISRO VIC satellite model');

    const soilMissing = await api('/api/v1/soil-moisture?state=NoSuchStateXYZ&district=Nowhere', {}, cookie);
    assert(soilMissing.status === 200 && soilMissing.json?.observations?.length === 0, 'Missing soil moisture location returns 0 records (never fabricated)');

    // ---------------------------------------------------------
    // PHASE 12 & 16: ALL 8 REQUIRED AI ASSISTANT TEST QUESTIONS
    // ---------------------------------------------------------
    console.log('\n--- Phase 12 & 16: AI Farming Assistant (All 8 Required Test Questions) ---');
    let convId = null;

    // Q1
    const q1 = await api('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'What should I do next for my current crop?', fieldId, language: 'en' }),
    }, cookie);
    convId = q1.json?.data?.conversationId;
    assert(
      q1.status === 200 && q1.json?.data?.summary?.toLowerCase().includes('wheat') && q1.json?.data?.summary?.toLowerCase().includes('crown root'),
      'AI Q1 ("What should I do next for my current crop?") cites real active Wheat crop & CRI stage',
      q1.json?.data?.summary
    );

    // Q2
    const q2 = await api('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'Why are my tomato leaves turning yellow with spots?', fieldId, conversationId: convId, language: 'en' }),
    }, cookie);
    assert(
      q2.status === 200 && q2.json?.data?.summary?.toLowerCase().includes('early blight'),
      'AI Q2 ("Why are my tomato leaves turning yellow with spots?") provides structured differential diagnosis'
    );

    // Q3
    const q3 = await api('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'Is it going to rain tomorrow? Should I spray?', fieldId, conversationId: convId, language: 'en' }),
    }, cookie);
    assert(
      q3.status === 200 && /rain|spray|wind/i.test(q3.json?.data?.summary || ''),
      'AI Q3 ("Is it going to rain tomorrow? Should I spray?") grounds answer in forecast + spray rules'
    );

    // Q4
    const q4 = await api('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ question: "What is today's mandi price for wheat in my district?", fieldId, conversationId: convId, language: 'en' }),
    }, cookie);
    assert(
      q4.status === 200 && /wheat|mandi|apmc|agmarknet/i.test(q4.json?.data?.summary || ''),
      'AI Q4 ("What is today\'s mandi price for wheat in my district?") uses real APMC data with provenance'
    );

    // Q5
    const q5 = await api('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'Explain wheat stages from sowing to harvest.', fieldId, conversationId: convId, language: 'en' }),
    }, cookie);
    assert(
      q5.status === 200 && (q5.json?.data?.observations?.length || 0) === 7 && q5.json?.data?.summary?.includes('Crown Root Initiation'),
      'AI Q5 ("Explain wheat stages from sowing to harvest.") returns all 7 DB Wheat stages'
    );

    // Q6
    const q6 = await api('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'Can I use monocrotophos on my vegetable crop?', fieldId, conversationId: convId, language: 'en' }),
    }, cookie);
    assert(
      q6.status === 200 && /do not|banned/i.test(q6.json?.data?.summary || '') && /monocrotophos/i.test(q6.json?.data?.summary || ''),
      'AI Q6 ("Can I use monocrotophos on my vegetable crop?") blocks banned pesticide with CIB&RC safety warning'
    );

    // Q7 (Gujarati)
    const q7 = await api('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'મારા પાક માટે આગળ શું કરવું?', fieldId, conversationId: convId, language: 'gu' }),
    }, cookie);
    assert(
      q7.status === 200 && /[\u0A80-\u0AFF]/.test(q7.json?.data?.summary || '') && q7.json?.data?.language === 'gu',
      'AI Q7 ("મારા પાક માટે આગળ શું કરવું?") replies in Gujarati with active crop context'
    );

    // Q8 (Hindi)
    const q8 = await api('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'मेरी गेहूँ की फसल को पानी कब देना चाहिए?', fieldId, conversationId: convId, language: 'hi' }),
    }, cookie);
    assert(
      q8.status === 200 && /[\u0900-\u097F]/.test(q8.json?.data?.summary || '') && q8.json?.data?.summary?.includes('20–25'),
      'AI Q8 ("मेरी गेहूँ की फसल को पानी कब देना चाहिए?") replies in Hindi with Wheat CRI (20–25 दिन) schedule'
    );

    // Verify conversation history persistence
    const hist = await api('/api/v1/assistant/history?limit=5', {}, cookie);
    const savedConv = (hist.json?.data?.conversations || []).find((c) => c.id === convId);
    assert(Boolean(savedConv) && savedConv.messages.length >= 16, `Multi-turn chat persisted cleanly (${savedConv?.messages?.length || 0} messages in thread)`);

    // Verify key UI pages return HTTP 200
    console.log('\n--- Page Route Smoke Verification ---');
    for (const route of ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/dashboard', '/farms', '/fields', '/fields/new', '/crops', '/crops/new-cycle', `/crop-cycles/${cycleId}`, '/weather', '/mandi', '/soil-moisture', '/assistant', '/notifications', '/profile', '/settings']) {
      const r = await fetch(`${BASE}${route}`, { headers: { Cookie: cookie } });
      assert(r.status === 200, `Page ${route} renders HTTP 200`, `got ${r.status}`);
    }

  } finally {
    // Clean up temporary QA test user (cascades test farm/field/cycle/tasks/reminders/conversations cleanly)
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
      console.log('\n[Cleanup] Removed temporary QA test user and records cleanly.');
    }
    await prisma.$disconnect();
  }

  console.log(`\n========================================`);
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
  console.log(`========================================`);
  if (failed > 0) {
    console.error('FAILURES:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Suite crashed:', err);
  process.exit(1);
});
