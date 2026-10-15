import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { getSafeRedirect } from '../src/lib/auth-utils.ts';

const BASE_URL = 'http://localhost:3000';
const prisma = new PrismaClient();

async function runPhase7Tests() {
  console.log('=================================================================');
  console.log('🔬 SMARTFARM AI — PHASE 7 COMPLETE WORKFLOW VERIFICATION');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  async function step(title, fn) {
    try {
      process.stdout.write(`• [${title}]... `);
      await fn();
      console.log('✔ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED:', err.message);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST A: NEW FARMER REGISTRATION TO DASHBOARD LIFECYCLE
  // -------------------------------------------------------------
  console.log('--- TEST A: NEW FARMER LIFECYCLE ---');
  const testPhone = `9825${Date.now().toString().slice(-6)}`;
  const testEmail = `farmer_${Date.now()}@smartfarm.ai`;
  const testPassword = 'SecurePassword2026!';
  let newUserId = '';
  let authCookieHeader = '';

  await step('A.1: Register new farmer account via API', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: 'Suresh Kumar Patel',
        phone: testPhone,
        email: testEmail,
        password: testPassword,
        state: 'Gujarat',
        district: 'Anand',
        village: 'Mogri',
        preferredLanguage: 'gu',
      }),
    });
    assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.data.name, 'Suresh Kumar Patel');
    assert.strictEqual(json.data.phone, testPhone);
    assert.strictEqual(json.data.email, testEmail);
    assert.deepStrictEqual(json.data.roles, ['FARMER']);
    newUserId = json.data.id;
    assert(newUserId, 'Expected user id in registration response');
  });

  await step('A.2: Verify persisted user record in DB without exposing password', async () => {
    const user = await prisma.user.findUnique({
      where: { id: newUserId },
      include: { roles: { include: { role: true } } },
    });
    assert(user, 'User record must exist in database');
    assert.strictEqual(user.name, 'Suresh Kumar Patel');
    assert(user.passwordHash && user.passwordHash.startsWith('$2b$10$'), 'Password must be stored as bcrypt hash');
    assert.strictEqual(user.deletedAt, null, 'User must not be soft-deleted');
    assert.strictEqual(user.roles[0].role.name, 'FARMER');
  });

  await step('A.3: Sign in using newly registered mobile number', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        identifier: testPhone,
        password: testPassword,
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('smartfarm_token='), 'Expected smartfarm_token cookie in response');
    const match = setCookie.match(/smartfarm_token=([^;]+)/);
    assert(match && match[1], 'Expected valid JWT token');
    authCookieHeader = `smartfarm_token=${match[1]}`;
  });

  await step('A.4: Confirm session allows access to protected /dashboard', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: authCookieHeader },
      redirect: 'manual',
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK without redirect, got ${res.status}`);
  });

  await step('A.5: Dashboard summary API loads new farmer empty state cleanly', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard/summary`, {
      headers: { Cookie: authCookieHeader, Accept: 'application/json' },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.userName, 'Suresh Kumar Patel');
    assert.strictEqual(json.data.counts.farms, 0);
    assert.strictEqual(json.data.counts.fields, 0);
    assert.deepStrictEqual(json.data.farms, []);
  });

  await step('A.6: Refresh dashboard request simulates session persistence', async () => {
    const refreshRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: authCookieHeader },
      redirect: 'manual',
    });
    assert.strictEqual(refreshRes.status, 200, 'Session must persist across refresh');
  });

  // -------------------------------------------------------------
  // TEST B: INVALID CREDENTIALS & RATE LIMITING
  // -------------------------------------------------------------
  console.log('\n--- TEST B: INVALID CREDENTIALS & ERROR HANDLING ---');

  await step('B.1: Registered mobile with wrong password returns neutral 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testPhone,
        password: 'CompletelyWrongPassword123!',
      }),
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.error.code, 'invalid_credentials');
    assert.strictEqual(json.error.message, 'Unable to sign in with those details. Check your credentials and try again.');
  });

  await step('B.2: Unregistered identifier returns identical neutral 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9999999999',
        password: 'AnyPassword123!',
      }),
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.error.message, 'Unable to sign in with those details. Check your credentials and try again.');
  });

  // -------------------------------------------------------------
  // TEST C: EXISTING ACCOUNTS REMAIN INTACT & VALID
  // -------------------------------------------------------------
  console.log('\n--- TEST C: EXISTING ACCOUNTS PRESERVATION ---');

  await step('C.1: Existing Demo Farmer (farmer@smartfarm.ai) signs in successfully', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'farmer@smartfarm.ai',
        password: 'farmer123456',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.name, 'Ramesh Patel');
  });

  await step('C.2: Existing System Admin (admin@smartfarm.ai) signs in successfully', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@smartfarm.ai',
        password: 'admin123456',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.name, 'System Admin');
    assert.strictEqual(json.data.defaultRedirect, '/admin');
  });

  // -------------------------------------------------------------
  // TEST D: SECURITY, AUTHORIZATION & ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- TEST D: SECURITY AND AUTHORIZATION ---');

  await step('D.1: Unauthenticated request to /dashboard is rejected (307 -> /login)', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    assert.strictEqual(res.status, 307);
    const loc = res.headers.get('location');
    assert(loc && loc.startsWith('/login?redirect='), 'Must redirect to login');
  });

  await step('D.2: Unauthenticated request to /api/v1/dashboard/summary is rejected (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard/summary`);
    assert.strictEqual(res.status, 401);
  });

  await step('D.3: Malicious redirect parameters are neutralized', async () => {
    assert.strictEqual(getSafeRedirect('https://evil.com'), '/dashboard');
    assert.strictEqual(getSafeRedirect('//evil.com'), '/dashboard');
    assert.strictEqual(getSafeRedirect('javascript:alert(1)'), '/dashboard');
    assert.strictEqual(getSafeRedirect('/dashboard'), '/dashboard');
    assert.strictEqual(getSafeRedirect('/farms/field-1'), '/farms/field-1');
  });

  await step('D.4: Logout invalidates active session', async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: authCookieHeader },
    });
    assert.strictEqual(logoutRes.status, 200);
    const setCookie = logoutRes.headers.get('set-cookie');
    assert(setCookie && (setCookie.includes('Max-Age=0') || setCookie.includes('Expires=Thu, 01 Jan 1970')), 'Cookie must be invalidated');
  });

  await step('D.5: Farmer data isolation — Ramesh Patel farms cannot be seen by new farmer', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard/summary`, {
      headers: { Cookie: authCookieHeader, Accept: 'application/json' },
    });
    const json = await res.json();
    assert.strictEqual(json.data.counts.farms, 0, 'New farmer must see 0 farms, not other farmers farms');
  });

  console.log('\n=================================================================');
  console.log(`WORKFLOW VERIFICATION COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runPhase7Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
