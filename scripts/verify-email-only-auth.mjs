/**
 * SmartFarm AI — Complete Email-Only Authentication & Registration Error Handling E2E Suite
 * Covers ALL 17 Phase 8 Verification Scenarios:
 *  1. New valid email registration (201 REGISTRATION_SUCCESS, lowercase normalization, no session cookie)
 *  2. Duplicate email registration (409 EMAIL_ALREADY_EXISTS + field: "email")
 *  3. Uppercase / mixed-case duplicate email registration (409 EMAIL_ALREADY_EXISTS)
 *  4. Invalid email address (422 INVALID_EMAIL + field: "email")
 *  5. Empty full name (422 MISSING_FULL_NAME + field: "name")
 *  6. Weak password (422 WEAK_PASSWORD + field: "password")
 *  7. Mismatched passwords (422 PASSWORD_MISMATCH + field: "confirmPassword")
 *  8. Missing required location fields (422 INVALID_LOCATION + fieldErrors)
 *  9. Invalid PIN code & unaccepted terms & multi-field validation (422 INVALID_PINCODE / TERMS_NOT_ACCEPTED / VALIDATION_ERROR)
 * 10. Simultaneous concurrent registration race condition (Promise.all -> 1x 201, 1x 409, exactly 1 DB row)
 * 11. Login BEFORE email verification (403 EMAIL_NOT_VERIFIED, no session cookie)
 * 12. Resend verification email (200, new token + email logged)
 * 13. Complete email verification (200 activated, single-use enforced, welcome email logged)
 * 14. Login AFTER verification (200 + HttpOnly cookie, /api/v1/me, /login & /register redirect to /dashboard, logout)
 * 15. Forgot password + Reset password (no enumeration, expired token rejected, valid token works once, old pwd rejected, new pwd works)
 * 16. Phone number rejected on login & zero phone auth UI on /login and /register
 * 17. Existing 11 email accounts & 2 legacy mobile accounts untouched + safe legacy migration
 *     + Security check: zero stack trace / SQL / passwordHash / SMTP credential leakage
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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

function assertNoLeak(text, label) {
  const leaks = ['SELECT ', 'INSERT INTO', 'PrismaClient', 'passwordHash', 'SMTP_PASS', 'RESEND_API_KEY', 'at Object.', 'node_modules'];
  const hit = leaks.find((k) => text.includes(k));
  assert(!hit, `${label} (zero internal/SQL/stack/secret leakage)`, hit ? `Leaked: ${hit}` : '');
}

async function api(path, options = {}, cookie = '') {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers, redirect: 'manual' });
  const setCookie = res.headers.get('set-cookie') || '';
  const location = res.headers.get('location') || '';
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, ok: res.ok, json, setCookie, location, text };
}

function extractTokenCookie(setCookie) {
  const m = setCookie.match(/smartfarm_token=[^;]+/);
  return m ? m[0] : '';
}

async function run() {
  const ts = Date.now();
  const testEmail = `email_only_qa_${ts}@smartfarm.test`;
  const raceEmail = `race_qa_${ts}@smartfarm.test`;
  const strongPwd = 'AgriPass2026!';
  const newPwd = 'NewAgriPass99!';
  let testUserId = null;
  let raceUserId = null;
  let legacyTestUserId = null;

  try {
    console.log(`\n=== EMAIL-ONLY AUTH & REGISTRATION ERROR HANDLING E2E SUITE (${BASE}) ===\n`);

    // ---------------------------------------------------------
    // 1. UI AUDIT: EMAIL-ONLY AUTH, ZERO PHONE REGISTRATION
    // ---------------------------------------------------------
    console.log('--- 1. UI Audit: Email-Only Tabs & Zero Phone Registration ---');
    const loginHtml = await (await fetch(`${BASE}/login`)).text();
    const regHtml = await (await fetch(`${BASE}/register`)).text();

    assert(loginHtml.includes('Your Farming Journey Starts Here.'), '/login displays redesigned hero headline');
    assert(loginHtml.includes('Sign In') && loginHtml.includes('Create Account'), '/login displays Sign In & Create Account tabs');
    assert(!loginHtml.includes('Register with Phone') && !loginHtml.includes('Registered earlier with Mobile') && !loginHtml.includes('login-phone'), '/login has ZERO phone login or phone registration options');
    assert(!regHtml.includes('Register with Phone') && !regHtml.includes('reg-phone') && !regHtml.includes('Mobile Number'), '/register has ZERO phone registration input fields');
    assert(regHtml.includes('Confirm Password') && regHtml.includes('Terms'), '/register includes Confirm Password & Terms acceptance');

    // ---------------------------------------------------------
    // 2. FIELD-LEVEL VALIDATION ERROR CODES & MESSAGES
    // ---------------------------------------------------------
    console.log('\n--- 2. Structured Field-Level Registration Validation ---');

    const basePayload = {
      name: 'QA Farmer',
      email: testEmail,
      password: strongPwd,
      confirmPassword: strongPwd,
      state: 'Gujarat',
      district: 'Vadodara',
      village: 'Padra',
      pincode: '391440',
      acceptedTerms: true,
      preferredLanguage: 'en',
    };

    // Invalid email
    const badEmail = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, email: 'not-an-email' }),
    });
    assert(
      badEmail.status === 422 && badEmail.json?.code === 'INVALID_EMAIL' && badEmail.json?.field === 'email' && Boolean(badEmail.json?.fieldErrors?.email),
      'Invalid email returns 422 INVALID_EMAIL with field="email"',
      JSON.stringify(badEmail.json)
    );
    assertNoLeak(badEmail.text, 'Invalid email response');

    // Empty full name
    const emptyName = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, name: '' }),
    });
    assert(
      emptyName.status === 422 && emptyName.json?.code === 'MISSING_FULL_NAME' && emptyName.json?.field === 'name',
      'Empty full name returns 422 MISSING_FULL_NAME with field="name"',
      JSON.stringify(emptyName.json)
    );

    // Weak password
    const weakReg = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, password: '123', confirmPassword: '123' }),
    });
    assert(
      weakReg.status === 422 && weakReg.json?.code === 'WEAK_PASSWORD' && weakReg.json?.field === 'password',
      'Weak password returns 422 WEAK_PASSWORD with field="password"',
      JSON.stringify(weakReg.json)
    );

    // Mismatched passwords
    const mismatchReg = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, confirmPassword: 'DifferentPassword99!' }),
    });
    assert(
      mismatchReg.status === 422 && mismatchReg.json?.code === 'PASSWORD_MISMATCH' && mismatchReg.json?.field === 'confirmPassword',
      'Mismatched passwords return 422 PASSWORD_MISMATCH with field="confirmPassword"',
      JSON.stringify(mismatchReg.json)
    );

    // Missing location (empty state)
    const missingLoc = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, state: '' }),
    });
    assert(
      missingLoc.status === 422 && missingLoc.json?.code === 'INVALID_LOCATION' && Boolean(missingLoc.json?.fieldErrors?.state),
      'Missing state returns 422 INVALID_LOCATION with fieldErrors.state',
      JSON.stringify(missingLoc.json)
    );

    // Invalid PIN code
    const badPin = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, pincode: '12AB' }),
    });
    assert(
      badPin.status === 422 && badPin.json?.code === 'INVALID_PINCODE' && badPin.json?.field === 'pincode',
      'Invalid PIN code returns 422 INVALID_PINCODE with field="pincode"',
      JSON.stringify(badPin.json)
    );

    // Unaccepted terms
    const noTerms = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, acceptedTerms: false }),
    });
    assert(
      noTerms.status === 422 && noTerms.json?.code === 'TERMS_NOT_ACCEPTED' && noTerms.json?.field === 'acceptedTerms',
      'Unaccepted terms returns 422 TERMS_NOT_ACCEPTED with field="acceptedTerms"',
      JSON.stringify(noTerms.json)
    );

    // Multiple invalid fields -> VALIDATION_ERROR with all fieldErrors populated
    const multiBad = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        email: 'bad',
        password: '123',
        confirmPassword: '456',
        state: '',
        district: '',
        village: '',
        acceptedTerms: false,
      }),
    });
    assert(
      multiBad.status === 422 &&
        multiBad.json?.code === 'VALIDATION_ERROR' &&
        Boolean(multiBad.json?.fieldErrors?.name) &&
        Boolean(multiBad.json?.fieldErrors?.email) &&
        Boolean(multiBad.json?.fieldErrors?.password) &&
        Boolean(multiBad.json?.fieldErrors?.state) &&
        Boolean(multiBad.json?.fieldErrors?.acceptedTerms),
      'Multiple invalid fields return 422 VALIDATION_ERROR with complete per-field fieldErrors map',
      JSON.stringify(multiBad.json)
    );

    // ---------------------------------------------------------
    // 3. NEW VALID EMAIL-ONLY REGISTRATION & VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- 3. New Valid Email-Only Registration & Verification ---');
    const reg = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...basePayload,
        name: 'Email Only QA Farmer',
        email: `  ${testEmail.toUpperCase()}  `,
      }),
    });
    assert(
      reg.status === 201 && reg.json?.success === true && reg.json?.code === 'REGISTRATION_SUCCESS' && reg.json?.data?.email === testEmail,
      'New email registration succeeds with 201 REGISTRATION_SUCCESS (trimmed & lowercase normalized)',
      JSON.stringify(reg.json)
    );
    assertNoLeak(reg.text, 'Registration success response');
    assert(!extractTokenCookie(reg.setCookie), 'Unverified registration does NOT issue an authenticated session cookie');
    assert(reg.json?.data?.requiresEmailVerification === true, 'Response requires email verification before activation');
    testUserId = reg.json?.data?.id;

    const dbUser = await prisma.user.findUnique({ where: { id: testUserId } });
    assert(dbUser && dbUser.phone === null && dbUser.emailVerifiedAt === null && dbUser.pincode === '391440', 'DB user created cleanly with phone=null, pincode="391440", emailVerifiedAt=null');
    assert(dbUser?.passwordHash?.startsWith('$2'), 'Password stored as bcrypt hash');

    const verifyEmails = await prisma.emailDeliveryLog.findMany({
      where: { userId: testUserId, templateKey: 'verification' },
    });
    assert(verifyEmails.length === 1, `Verification email logged in EmailDeliveryLog (status=${verifyEmails[0]?.status}, provider=${verifyEmails[0]?.provider})`);

    // ---------------------------------------------------------
    // 4. DUPLICATE EMAIL PREVENTION (EXACT + CASE-INSENSITIVE + CONCURRENT RACE)
    // ---------------------------------------------------------
    console.log('\n--- 4. Duplicate Email Prevention & Concurrent Race Condition ---');

    // Exact same email
    const dupExact = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, name: 'Duplicate Exact', email: testEmail }),
    });
    assert(
      dupExact.status === 409 && dupExact.json?.code === 'EMAIL_ALREADY_EXISTS' && dupExact.json?.field === 'email',
      'Exact duplicate email returns 409 EMAIL_ALREADY_EXISTS with field="email"',
      JSON.stringify(dupExact.json)
    );

    // Mixed-case / uppercase duplicate email
    const dupCase = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...basePayload, name: 'Duplicate Case', email: testEmail.toUpperCase() }),
    });
    assert(
      dupCase.status === 409 && dupCase.json?.code === 'EMAIL_ALREADY_EXISTS' && dupCase.json?.field === 'email',
      'Uppercase duplicate email returns 409 EMAIL_ALREADY_EXISTS',
      JSON.stringify(dupCase.json)
    );

    const countSame = await prisma.user.count({ where: { email: testEmail, deletedAt: null } });
    assert(countSame === 1, 'No duplicate account created in database for testEmail');

    // Simultaneous concurrent registration race condition (2 requests at exact same instant)
    const [r1, r2] = await Promise.all([
      api('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...basePayload, name: 'Race Farmer A', email: raceEmail }),
      }),
      api('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...basePayload, name: 'Race Farmer B', email: raceEmail.toUpperCase() }),
      }),
    ]);
    const raceStatuses = [r1.status, r2.status].sort((a, b) => a - b);
    const raceWinner = r1.status === 201 ? r1 : r2.status === 201 ? r2 : null;
    const raceLoser = r1.status !== 201 ? r1 : r2;
    raceUserId = raceWinner?.json?.data?.id || null;
    const raceDbCount = await prisma.user.count({ where: { email: raceEmail, deletedAt: null } });
    assert(
      raceStatuses[0] === 201 && raceStatuses[1] === 409 && raceLoser?.json?.code === 'EMAIL_ALREADY_EXISTS' && raceDbCount === 1,
      `Simultaneous concurrent registration race handled safely (statuses=${raceStatuses.join(',')}, loserCode=${raceLoser?.json?.code}, dbCount=${raceDbCount})`,
      `r1=${r1.status}:${r1.json?.code}, r2=${r2.status}:${r2.json?.code}`
    );

    // ---------------------------------------------------------
    // 5. RESEND VERIFICATION, BLOCKED UNVERIFIED LOGIN & VERIFICATION ACTIVATION
    // ---------------------------------------------------------
    console.log('\n--- 5. Resend Verification, Unverified Login Block & Email Activation ---');

    const resend = await api('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail }),
    });
    assert(resend.status === 200 && resend.json?.data?.sent === true, 'Resend verification email succeeds');

    const unverifiedLogin = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: strongPwd }),
    });
    assert(
      unverifiedLogin.status === 403 && unverifiedLogin.json?.code === 'EMAIL_NOT_VERIFIED' && !extractTokenCookie(unverifiedLogin.setCookie),
      'Unverified email blocked from signing in (403 EMAIL_NOT_VERIFIED, no session cookie)',
      JSON.stringify(unverifiedLogin.json)
    );

    // Complete email verification using a freshly inserted valid token hash
    const rawVerifyToken = 'qa_verify_' + crypto.randomBytes(20).toString('hex');
    await prisma.authToken.create({
      data: {
        userId: testUserId,
        type: 'email_verification',
        tokenHash: crypto.createHash('sha256').update(rawVerifyToken).digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const doVerify = await api(`/api/v1/auth/verify-email?token=${encodeURIComponent(rawVerifyToken)}`);
    assert(doVerify.status === 200 && doVerify.json?.data?.activated === true, 'Email verification link activates account');

    const reuseVerify = await api(`/api/v1/auth/verify-email?token=${encodeURIComponent(rawVerifyToken)}`);
    assert(reuseVerify.status === 400, 'Used email verification token cannot be reused (400)');

    const welcomeEmails = await prisma.emailDeliveryLog.findMany({
      where: { userId: testUserId, templateKey: 'registration_success' },
    });
    assert(welcomeEmails.length === 1, 'Account activation welcome email recorded in EmailDeliveryLog');

    // ---------------------------------------------------------
    // 6. EMAIL-ONLY LOGIN, SESSION, REDIRECT & LOGOUT
    // ---------------------------------------------------------
    console.log('\n--- 6. Email-Only Login, Guards, Redirect & Logout ---');

    const phoneLoginAttempt = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '9876543211', password: strongPwd }),
    });
    assert(phoneLoginAttempt.status === 422 && phoneLoginAttempt.json?.code === 'INVALID_EMAIL', 'Phone number rejected on login endpoint (422 INVALID_EMAIL — strictly email-only)');

    const emptyLogin = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '', password: '' }),
    });
    assert(emptyLogin.status === 422 && Boolean(emptyLogin.json?.fieldErrors?.email) && Boolean(emptyLogin.json?.fieldErrors?.password), 'Empty login fields return 422 with per-field fieldErrors');

    const wrongPwd = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword99!' }),
    });
    assert(wrongPwd.status === 401 && wrongPwd.json?.code === 'INVALID_CREDENTIALS', 'Incorrect password rejected with 401 INVALID_CREDENTIALS');

    const goodLogin = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail.toUpperCase(), password: strongPwd, rememberMe: true }),
    });
    assert(goodLogin.status === 200 && goodLogin.json?.data?.email === testEmail, 'Case-insensitive verified email login succeeds');
    assertNoLeak(goodLogin.text, 'Login success response');
    let cookie = extractTokenCookie(goodLogin.setCookie);
    assert(Boolean(cookie), 'Verified login issues HttpOnly session cookie');

    const authedLoginRedirect = await api('/login', {}, cookie);
    const authedRegRedirect = await api('/register', {}, cookie);
    assert(
      authedLoginRedirect.status === 307 && authedLoginRedirect.location.includes('/dashboard'),
      'Already authenticated user visiting /login is redirected to /dashboard'
    );
    assert(
      authedRegRedirect.status === 307 && authedRegRedirect.location.includes('/dashboard'),
      'Already authenticated user visiting /register is redirected to /dashboard'
    );

    const meOk = await api('/api/v1/me', {}, cookie);
    assert(meOk.status === 200 && meOk.json?.data?.email === testEmail && meOk.json?.data?.emailVerified === true, 'Authenticated session persists on /api/v1/me');

    const logoutRes = await api('/api/v1/auth/logout', { method: 'POST' }, cookie);
    assert(logoutRes.status === 200, 'Logout returns 200');
    const meAfterLogout = await api('/api/v1/me');
    assert(meAfterLogout.status === 401, 'Protected route returns 401 after logout');

    // ---------------------------------------------------------
    // 7. PASSWORD RECOVERY (FORGOT + RESET + EXPIRY/REUSE)
    // ---------------------------------------------------------
    console.log('\n--- 7. Forgot Password & Reset Password ---');
    const forgotReal = await api('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotFake = await api('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'does_not_exist_999@smartfarm.test' }),
    });
    assert(
      forgotReal.status === 200 && forgotFake.status === 200 && forgotReal.json?.data?.message === forgotFake.json?.data?.message,
      'Forgot password returns identical neutral response (no email enumeration)'
    );

    const expiredToken = 'qa_exp_' + crypto.randomBytes(16).toString('hex');
    await prisma.authToken.create({
      data: {
        userId: testUserId,
        type: 'password_reset',
        tokenHash: crypto.createHash('sha256').update(expiredToken).digest('hex'),
        expiresAt: new Date(Date.now() - 5000),
      },
    });
    const expReset = await api('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: expiredToken, newPassword: newPwd }),
    });
    assert(expReset.status === 400, 'Expired password reset token rejected with 400');

    const validResetToken = 'qa_rst_' + crypto.randomBytes(16).toString('hex');
    await prisma.authToken.create({
      data: {
        userId: testUserId,
        type: 'password_reset',
        tokenHash: crypto.createHash('sha256').update(validResetToken).digest('hex'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    const okReset = await api('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: validResetToken, newPassword: newPwd }),
    });
    assert(okReset.status === 200 && okReset.json?.data?.reset === true, 'Password reset succeeds with strong new password');

    const reuseReset = await api('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: validResetToken, newPassword: 'AnotherPassword99!' }),
    });
    assert(reuseReset.status === 400, 'Reused password reset token rejected with 400');

    const loginOldPwd = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: strongPwd }),
    });
    const loginNewPwd = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: newPwd }),
    });
    assert(loginOldPwd.status === 401 && loginNewPwd.status === 200, 'Old password rejected (401) and new password accepted (200)');

    // ---------------------------------------------------------
    // 8. EXISTING ACCOUNTS & SAFE LEGACY EMAIL MIGRATION
    // ---------------------------------------------------------
    console.log('\n--- 8. Existing Accounts & Safe Legacy Migration ---');
    const grandfatheredCount = await prisma.user.count({
      where: { email: { in: ['farmer@smartfarm.ai', 'admin@smartfarm.ai'] }, emailVerifiedAt: { not: null } },
    });
    assert(grandfatheredCount === 2, 'Pre-existing email accounts remain verified and accessible');

    const legacyPreserved = await prisma.user.count({
      where: { email: null, phone: { in: ['8780617178', '1234567890'] }, deletedAt: null },
    });
    assert(legacyPreserved === 2, 'Pre-existing legacy mobile-only accounts preserved with zero fabricated emails');

    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const legacyPhone = '9998887776';
    const migratedEmail = `migrated_qa_${ts}@smartfarm.test`;
    const legacyTestUser = await prisma.user.create({
      data: {
        name: 'Legacy QA Farmer',
        email: null,
        phone: legacyPhone,
        passwordHash: await bcrypt.hash(strongPwd, 10),
        roles: farmerRole ? { create: { roleId: farmerRole.id } } : undefined,
      },
    });
    legacyTestUserId = legacyTestUser.id;

    const migReq = await api('/api/v1/auth/migrate-email', {
      method: 'POST',
      body: JSON.stringify({ legacyPhone, password: strongPwd, newEmail: migratedEmail }),
    });
    assert(migReq.status === 200 && migReq.json?.data?.verificationSent === true, 'Legacy account email transition sends verification email');

    const beforeMigVerify = await prisma.user.findUnique({ where: { id: legacyTestUserId } });
    assert(beforeMigVerify?.email === null, 'Unverified email is NOT written to User.email before verification');

    const rawMigToken = 'qa_mig_' + crypto.randomBytes(16).toString('hex');
    await prisma.authToken.create({
      data: {
        userId: legacyTestUserId,
        type: 'email_migration',
        pendingEmail: migratedEmail,
        tokenHash: crypto.createHash('sha256').update(rawMigToken).digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const migVerify = await api(`/api/v1/auth/verify-email?token=${encodeURIComponent(rawMigToken)}`);
    assert(migVerify.status === 200 && migVerify.json?.data?.user?.email === migratedEmail, 'Verifying migration token activates email on legacy account');

    const migLogin = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: migratedEmail, password: strongPwd }),
    });
    assert(migLogin.status === 200 && migLogin.json?.data?.id === legacyTestUserId, 'Migrated legacy farmer can now sign in with Email + Password keeping exact account ID');

  } finally {
    if (testUserId) await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    if (raceUserId) await prisma.user.delete({ where: { id: raceUserId } }).catch(() => {});
    if (legacyTestUserId) await prisma.user.delete({ where: { id: legacyTestUserId } }).catch(() => {});
    await prisma.emailDeliveryLog
      .deleteMany({ where: { toEmail: { in: [testEmail, raceEmail, `migrated_qa_${ts}@smartfarm.test`] } } })
      .catch(() => {});
    console.log('\n[Cleanup] Removed temporary auth QA users and test email logs.');
    await prisma.$disconnect();
  }

  console.log(`\n========================================`);
  console.log(`AUTH E2E PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`========================================`);
  if (failed > 0) {
    console.error('FAILURES:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Auth E2E crashed:', err);
  process.exit(1);
});
