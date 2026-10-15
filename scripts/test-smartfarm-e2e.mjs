import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=================================================================');
  console.log('🌾 SMARTFARM AI — END-TO-END AUTOMATED VERIFICATION SUITE');
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

  // TEST 1: Public Homepage Market Snapshot API
  await test('1. Homepage market cards with valid API response (limit=4)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/market/prices?limit=4`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json.data), 'Expected json.data to be an array');
    assert(json.data.length > 0, 'Expected at least 1 record');
    assert(json.data.length <= 4, `Expected at most 4 records, got ${json.data.length}`);
    const first = json.data[0];
    assert(first.commodityName, 'Expected commodityName');
    assert(first.marketName, 'Expected marketName');
    assert(typeof first.modalPrice === 'number' && first.modalPrice > 0, 'Expected positive modalPrice');
    assert(first.source, 'Expected provenance source');
  });

  // TEST 2: Market API with specific commodity & district filter
  await test('2. Market API with specific filter (Cotton, Rajkot)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/market/prices?commodity=Cotton&district=Rajkot`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data), 'Expected array');
    for (const r of json.data) {
      assert.strictEqual(r.commodityName, 'Cotton');
      assert.strictEqual(r.district, 'Rajkot');
    }
  });

  // TEST 3: Market API with non-existent commodity (Honest empty response)
  await test('3. Market API with non-existent commodity returns clean empty array', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/market/prices?commodity=NonExistentCrop12345`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.deepStrictEqual(json.data, []);
    assert.strictEqual(json.meta?.total, 0);
  });

  // TEST 4: Full Market Filters API
  await test('4. Full market filters API returns states, districts, and commodities', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/market/filters`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data.states) && json.data.states.includes('Gujarat'));
    assert(Array.isArray(json.data.districts) && json.data.districts.length > 0);
    assert(Array.isArray(json.data.commodities) && json.data.commodities.length > 0);
  });

  // TEST 5: Public Soil Moisture API (Government NRSC VIC Model)
  await test('5. Public soil moisture API returns verified NRSC model data & trend', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/soil-moisture?district=Vadodara`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.state, 'Gujarat');
    assert.strictEqual(json.selectedDistrict, 'Vadodara');
    assert(Array.isArray(json.observations) && json.observations.length > 0);
    assert.strictEqual(json.observations[0].depthRangeCm, '0-50 cm');
    assert.strictEqual(json.observations[0].isGovernmentModel, true);
    assert(Array.isArray(json.trend) && json.trend.length > 0);
    assert(json.metadata?.sourceAuthority.includes('NRSC / ISRO'));
  });

  // TEST 6: Unauthenticated access to /dashboard redirects to /login
  await test('6. Unauthenticated visitor requesting /dashboard gets 307 redirect', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    assert.strictEqual(res.status, 307, `Expected 307 redirect, got ${res.status}`);
    const location = res.headers.get('location');
    assert(location && location.includes('/login'), `Expected redirect to /login, got ${location}`);
    assert(location.includes('redirect=%2Fdashboard'), `Expected preserved redirect parameter`);
  });

  // TEST 7: Unauthenticated access to /farms redirects to /login
  await test('7. Unauthenticated visitor requesting /farms gets 307 redirect', async () => {
    const res = await fetch(`${BASE_URL}/farms`, { redirect: 'manual' });
    assert.strictEqual(res.status, 307);
    const location = res.headers.get('location');
    assert(location && location.includes('/login'));
    assert(location.includes('redirect=%2Ffarms'));
  });

  // TEST 8: Farmer login with valid credentials
  let sessionCookie = '';
  await test('8. Farmer login via /api/v1/auth/login issues valid session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'farmer@smartfarm.ai',
        password: 'farmer123456',
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.data.name, 'Ramesh Patel');
    assert.strictEqual(json.data.email, 'farmer@smartfarm.ai');
    assert(Array.isArray(json.data.roles) && json.data.roles.includes('FARMER'));

    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('smartfarm_token='), 'Expected smartfarm_token cookie');
    sessionCookie = setCookie.split(';')[0];
  });

  // TEST 9: Authenticated Farmer Dashboard Summary API
  await test('9. Authenticated farmer retrieves real database-backed dashboard records', async () => {
    assert(sessionCookie, 'Need sessionCookie from login test');
    const res = await fetch(`${BASE_URL}/api/v1/dashboard/summary`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.userName, 'Ramesh Patel');
    assert(json.data.counts.farms >= 1, 'Expected at least 1 farm');
    assert(json.data.counts.fields >= 1, 'Expected at least 1 field');
    assert(Array.isArray(json.data.farms) && json.data.farms.length > 0);
    assert.strictEqual(json.data.farms[0].name, 'Patel Organic Farm');
    assert.strictEqual(json.data.farms[0].state, 'Gujarat');
  });

  // TEST 10: Authenticated access to /dashboard succeeds
  await test('10. Authenticated farmer accessing /dashboard returns 200 OK (no redirect)', async () => {
    assert(sessionCookie, 'Need sessionCookie');
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: sessionCookie },
      redirect: 'manual',
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
  });

  // TEST 11: Farmer logout invalidates session
  await test('11. Farmer logout via /api/v1/auth/logout clears session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && (setCookie.includes('Expires=Thu, 01 Jan 1970') || setCookie.includes('Max-Age=0')), 'Expected cookie clearance header');
  });

  // TEST 12: Public Weather API
  await test('12. Weather API returns current conditions & forecast', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/weather?lat=22.24&lng=73.08`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.data?.current, 'Expected current weather data');
    assert(typeof json.data.current.temperatureC === 'number');
  });

  console.log('\n=================================================================');
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
