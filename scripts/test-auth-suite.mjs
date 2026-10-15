import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runSuite() {
  console.log('=================================================================');
  console.log('🛡️ SMARTFARM AI — PRODUCTION AUTHENTICATION VERIFICATION SUITE');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• ${name}... `);
      await fn();
      console.log('✔ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED:', err.message);
      failed++;
    }
  }

  // TEST 1: Missing credentials rejected with 422
  await test('1. Missing credentials returns 422 validation failure', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '', password: '' }),
    });
    assert.strictEqual(res.status, 422);
    const json = await res.json();
    assert.strictEqual(json.error.code, 'validation_failed');
  });

  // TEST 2: Non-existent user returns neutral 401 message (no user enumeration)
  await test('2. Unknown user returns neutral 401 error without account enumeration', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'nonexistent999@smartfarm.ai', password: 'SomePassword123' }),
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.error.message, 'Unable to sign in with those details. Check your credentials and try again.');
  });

  // TEST 3: Incorrect password returns identical neutral 401 message
  await test('3. Incorrect password returns identical neutral 401 error', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'WrongPassword999!' }),
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.error.message, 'Unable to sign in with those details. Check your credentials and try again.');
  });

  // TEST 4: Lowercase email login succeeds
  let farmerCookie = '';
  await test('4. Standard email login (farmer@smartfarm.ai) succeeds & returns session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.user.email, 'farmer@smartfarm.ai');
    assert.strictEqual(json.data.user.name, 'Ramesh Patel');
    assert.strictEqual(json.data.defaultRedirect, '/dashboard');

    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('smartfarm_token='), 'Expected smartfarm_token cookie');
    farmerCookie = setCookie.split(';')[0];
  });

  // TEST 5: Uppercase / Mixed-case email login succeeds (mobile keyboards)
  await test('5. Uppercase email (Farmer@smartfarm.ai) normalizes and succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'Farmer@SmartFarm.ai', password: 'farmer123456' }),
    });
    assert.strictEqual(res.status, 200);
  });

  // TEST 6: Email with trailing whitespace succeeds (autocomplete copy-paste)
  await test('6. Email with whitespace (  farmer@smartfarm.ai  ) trims and succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '  farmer@smartfarm.ai  ', password: 'farmer123456' }),
    });
    assert.strictEqual(res.status, 200);
  });

  // TEST 7: 10-digit phone number lookup (stored as +91 in DB)
  await test('7. 10-digit phone login (9876543211) matches +91 DB record and succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9876543211', password: 'farmer123456' }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.user.name, 'Ramesh Patel');
  });

  // TEST 8: Phone with +91 and spaces (+91 98765 43211) succeeds
  await test('8. Spaced phone (+91 98765 43211) normalizes and succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '+91 98765 43211', password: 'farmer123456' }),
    });
    assert.strictEqual(res.status, 200);
  });

  // TEST 9: Admin login succeeds & returns admin default redirect
  let adminCookie = '';
  await test('9. Admin login (admin@smartfarm.ai) succeeds with defaultRedirect=/admin', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@smartfarm.ai', password: 'admin123456' }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.defaultRedirect, '/admin');
    assert(json.data.user.roles.includes('ADMIN'));

    const setCookie = res.headers.get('set-cookie');
    adminCookie = setCookie.split(';')[0];
  });

  // TEST 10: Unauthenticated access to /dashboard redirects to /login?redirect=/dashboard
  await test('10. Unauthenticated access to /dashboard returns 307 redirect to /login', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    assert.strictEqual(res.status, 307);
    const loc = res.headers.get('location');
    assert(loc && loc.includes('/login'));
    assert(loc.includes('redirect=%2Fdashboard'));
  });

  // TEST 11: Unauthenticated access to /admin redirects to /login?redirect=/admin
  await test('11. Unauthenticated access to /admin returns 307 redirect to /login', async () => {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
    assert.strictEqual(res.status, 307);
    const loc = res.headers.get('location');
    assert(loc && loc.includes('/login'));
    assert(loc.includes('redirect=%2Fadmin'));
  });

  // TEST 12: Authenticated Farmer accessing /dashboard succeeds (200 OK)
  await test('12. Authenticated farmer accessing /dashboard returns 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: farmerCookie },
      redirect: 'manual',
    });
    assert.strictEqual(res.status, 200);
  });

  // TEST 13: Farmer accessing /api/v1/dashboard/summary retrieves real user records
  await test('13. Authenticated farmer retrieves real database records via summary API', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard/summary`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.userName, 'Ramesh Patel');
    assert(json.data.counts.farms >= 1);
  });

  // TEST 14: Non-admin Farmer accessing /admin is redirected away
  await test('14. Non-admin farmer accessing /admin gets redirected to /dashboard', async () => {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: farmerCookie },
      redirect: 'manual',
    });
    assert.strictEqual(res.status, 307);
    const loc = res.headers.get('location');
    assert(loc && loc.includes('/dashboard'), `Expected redirect to /dashboard, got ${loc}`);
  });

  // TEST 15: Admin accessing /admin succeeds (200 OK)
  await test('15. Authenticated admin accessing /admin returns 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: adminCookie },
      redirect: 'manual',
    });
    assert.strictEqual(res.status, 200);
  });

  // TEST 16: Safe redirect utility verification
  await test('16. Safe redirect rejects external open redirects and accepts internal paths', async () => {
    const { getSafeRedirect } = await import('../src/lib/auth-utils.ts');
    assert.strictEqual(getSafeRedirect('/dashboard'), '/dashboard');
    assert.strictEqual(getSafeRedirect('/farms'), '/farms');
    assert.strictEqual(getSafeRedirect('http://evil.com'), '/dashboard');
    assert.strictEqual(getSafeRedirect('https://evil.com/phish'), '/dashboard');
    assert.strictEqual(getSafeRedirect('//evil.com'), '/dashboard');
    assert.strictEqual(getSafeRedirect('/\\evil.com'), '/dashboard');
    assert.strictEqual(getSafeRedirect('javascript:alert(1)'), '/dashboard');
  });

  // TEST 17: Logout clears session cookie
  await test('17. Logout invalidates session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && (setCookie.includes('Max-Age=0') || setCookie.includes('Expires=Thu, 01 Jan 1970')));
  });

  // TEST 18: Brute-force rate limiting triggers 429
  await test('18. Brute-force rate limiting triggers 429 after 5 failed attempts', async () => {
    const targetIdentifier = 'ratelimit-test@smartfarm.ai';
    let rateLimited = false;
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetIdentifier, password: 'WrongPassword!' }),
      });
      if (res.status === 429) {
        rateLimited = true;
        const retryAfter = res.headers.get('Retry-After');
        assert(retryAfter && Number(retryAfter) > 0, 'Expected Retry-After header');
        break;
      }
    }
    assert.strictEqual(rateLimited, true, 'Expected rate limiting to trigger 429');
  });

  console.log('\n=================================================================');
  console.log(`SUITE RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
