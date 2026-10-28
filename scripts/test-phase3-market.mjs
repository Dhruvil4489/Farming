/**
 * SmartFarm AI — Phase 3 Mandi Market Provider & Synchronization Tests
 *
 * Requirements:
 *   - Dev server running on http://localhost:3000
 *   - Seeded database
 *
 * Usage:  node scripts/test-phase3-market.mjs
 */

import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

let farmerCookie = '';
let adminCookie = '';

// Helper
async function test(name, fn) {
  try {
    process.stdout.write(`  • ${name}... `);
    await fn();
    console.log('✔ PASSED');
    return true;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n========================================================');
  console.log('  SmartFarm AI — Phase 3 Mandi Market Integration Tests');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;
  const run = async (name, fn) => {
    const ok = await test(name, fn);
    ok ? passed++ : failed++;
  };

  // 1. Public Prices API
  console.log('── Public Market Prices Endpoint ───────────────────────');
  await run('1. GET /api/v1/market/prices returns 200 with structured data', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/market/prices?limit=5`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json.data), 'Expected json.data array');
    assert(json.meta, 'Expected meta object');
    assert(typeof json.meta.total === 'number', 'Expected meta.total number');
    assert(json.meta.provenance, 'Expected meta.provenance');
    assert(json.meta.arrival_date, 'Expected meta.arrival_date');
    assert(json.meta.lastSyncedAt, 'Expected meta.lastSyncedAt');
    assert.strictEqual(json.meta.feedCadence, 'daily_wholesale', 'Expected feedCadence = daily_wholesale');
    assert(json.meta.cadenceNotice, 'Expected meta.cadenceNotice');
  });

  await run('2. Observations separate arrival_date and lastSyncedAt with quality fields', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/market/prices?limit=10`);
    const json = await res.json();
    assert(json.data.length > 0, 'Expected at least 1 observation');

    for (const obs of json.data) {
      assert(typeof obs.isDemo === 'boolean', 'Expected isDemo boolean');
      assert(typeof obs.source === 'string', 'Expected source string');
      assert(typeof obs.qualityStatus === 'string', 'Expected qualityStatus string');
      assert(obs.priceDate, 'Expected priceDate');
      assert(obs.arrival_date, 'Expected arrival_date distinct field');
      assert(/^\d{4}-\d{2}-\d{2}$/.test(obs.arrival_date), 'arrival_date must be YYYY-MM-DD');
      assert(obs.lastSyncedAt, 'Expected lastSyncedAt distinct field');
      assert(!isNaN(new Date(obs.lastSyncedAt).getTime()), 'lastSyncedAt must be valid ISO timestamp');
      // Verify null price safety — price must either be a positive number or null, never negative
      if (obs.modalPrice !== null) {
        assert(typeof obs.modalPrice === 'number' && obs.modalPrice >= 0, 'modalPrice must be non-negative number or null');
      }
    }
  });

  await run('3. Commodity and State filtering works', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/market/prices?commodity=Cotton&state=Gujarat`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data), 'Expected json.data array');
    if (json.data.length > 0) {
      for (const obs of json.data) {
        assert.strictEqual(obs.commodityName.toLowerCase(), 'cotton');
        assert.strictEqual(obs.state.toLowerCase(), 'gujarat');
      }
    }
  });

  // 2. Admin Auth & Sync
  console.log('\n── Admin Sync Endpoint & RBAC ──────────────────────────');
  await run('4. POST /api/v1/admin/market/sync fails with 401 without auth', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5 }),
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  // Login as farmer (non-admin)
  await run('5. Login as farmer and attempt admin sync -> 403 Forbidden', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
    });
    farmerCookie = loginRes.headers.get('set-cookie') || '';

    const syncRes = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({ limit: 5 }),
    });
    assert.strictEqual(syncRes.status, 403, `Expected 403 Forbidden for farmer, got ${syncRes.status}`);
  });

  // Login as admin
  await run('6. Login as admin and trigger demo sync -> 200 with MarketSyncResult', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@smartfarm.ai', password: 'admin123456' }),
    });
    adminCookie = loginRes.headers.get('set-cookie') || '';
    assert(adminCookie.includes('smartfarm_token='), 'Expected admin auth cookie');

    const syncRes = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ limit: 5 }),
    });
    assert.strictEqual(syncRes.status, 200, `Expected 200, got ${syncRes.status}`);
    const syncJson = await syncRes.json();
    assert(syncJson.data, 'Expected sync data');
    assert(syncJson.data.recordsStored > 0, `Expected records stored > 0, got ${syncJson.data.recordsStored}`);
    assert(syncJson.data.provider.includes('Demo') || syncJson.data.provider.includes('AGMARKNET'), `Expected recognized provider, got ${syncJson.data.provider}`);
  });

  await run('7. Admin GET /api/v1/admin/market/sync returns sync logs', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const logs = Array.isArray(json.data) ? json.data : json.data?.recentLogs;
    assert(Array.isArray(logs), 'Expected array of sync logs');
    assert(logs.length > 0, 'Expected at least 1 sync log');
    assert(logs[0].provider, 'Expected provider field in log');
    assert(logs[0].status, 'Expected status field in log');
  });

  console.log('\n========================================================');
  console.log(`  Tests completed: ${passed} passed, ${failed} failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
