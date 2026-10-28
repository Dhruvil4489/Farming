/**
 * SmartFarm AI — Phase 2 Scouting & Irrigation Integration Tests
 *
 * Requirements:
 *   - Dev server running on http://localhost:3000
 *   - Database seeded with demo farmer: farmer@smartfarm.ai / farmer123456
 *
 * Usage:  node scripts/test-phase2-scouting-irrigation.mjs
 */

import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

let sessionCookie = '';
let farmerFieldId = '';
let createdObsId = '';
let createdIrrId = '';

// ----------------------------------------------------------------
// Helper
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
// Suite
// ----------------------------------------------------------------
async function runTests() {
  console.log('\n========================================================');
  console.log('  SmartFarm AI — Phase 2 Scouting & Irrigation Tests');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;
  const run = async (name, fn) => {
    const ok = await test(name, fn);
    ok ? passed++ : failed++;
  };

  // ------ 1. Login ------
  console.log('── Authentication ─────────────────────────────────────');
  await run('1. Farmer login returns session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie?.includes('smartfarm_token='), 'Expected smartfarm_token cookie');
    sessionCookie = setCookie.split(';')[0];
  });

  // ------ 2. Get a field id owned by this farmer ------
  await run('2. Farmer has at least one field', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/fields`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data) && json.data.length > 0, 'Expected at least one field');
    farmerFieldId = json.data[0].id;
    assert(farmerFieldId, 'Expected field.id to be set');
  });

  // ================================================================
  // SCOUTING OBSERVATIONS
  // ================================================================
  console.log('\n── Scouting Observations ──────────────────────────────');

  // 3. Unauthenticated create → 401
  await run('3. Unauthenticated POST /observations returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldId: farmerFieldId, notes: 'test', category: 'pest', severity: 1 }),
    });
    assert.strictEqual(res.status, 401);
  });

  // 4. Unauthenticated list → 401
  await run('4. Unauthenticated GET /observations returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations`);
    assert.strictEqual(res.status, 401);
  });

  // 5. Invalid severity → 422
  await run('5. POST /observations with severity=5 returns 422', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ fieldId: farmerFieldId, notes: 'test', category: 'pest', severity: 5 }),
    });
    assert.strictEqual(res.status, 422, `Expected 422, got ${res.status}`);
    const json = await res.json();
    assert(json.error?.code === 'validation_failed', 'Expected validation_failed code');
  });

  // 6. Missing notes → 422
  await run('6. POST /observations with empty notes returns 422', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ fieldId: farmerFieldId, notes: '', category: 'pest', severity: 1 }),
    });
    assert.strictEqual(res.status, 422);
  });

  // 7. Invalid category → 422
  await run('7. POST /observations with invalid category returns 422', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ fieldId: farmerFieldId, notes: 'ok', category: 'alien_invasion', severity: 1 }),
    });
    assert.strictEqual(res.status, 422);
  });

  // 8. Unowned field → 404
  await run('8. POST /observations with non-existent fieldId returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ fieldId: 'nonexistent-field-000', notes: 'test', category: 'pest', severity: 1 }),
    });
    assert.strictEqual(res.status, 404);
  });

  // 9. Valid create
  await run('9. POST /observations with valid data creates record and returns 201', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        fieldId: farmerFieldId,
        category: 'pest',
        severity: 2,
        notes: 'Whitefly on leaf undersides — moderate infestation on south plot.',
        source: 'manual',
        status: 'open',
      }),
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const json = await res.json();
    assert(json.data?.id, 'Expected id in response');
    assert.strictEqual(json.data.category, 'pest');
    assert.strictEqual(json.data.severity, 2);
    assert.strictEqual(json.data.status, 'open');
    assert(json.data.field?.name, 'Expected field.name joined');
    assert(!json.data.volumeL, 'FarmObservation should not have volumeL');
    createdObsId = json.data.id;
  });

  // 10. List — returns created record
  await run('10. GET /observations returns the created record', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data), 'Expected array');
    assert(json.meta?.total >= 1, 'Expected at least 1 total');
    const found = json.data.find((o) => o.id === createdObsId);
    assert(found, 'Expected the created observation in list');
  });

  // 11. List empty when filtered to non-existent field
  await run('11. GET /observations?field_id=nonexistent returns empty array', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations?field_id=nonexistent-000`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.deepStrictEqual(json.data, []);
    assert.strictEqual(json.meta.total, 0);
  });

  // 12. Get by id
  await run('12. GET /observations/[id] returns correct record', async () => {
    assert(createdObsId, 'Need createdObsId');
    const res = await fetch(`${BASE_URL}/api/v1/observations/${createdObsId}`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.id, createdObsId);
  });

  // 13. PATCH — update status to resolved
  await run('13. PATCH /observations/[id] updates status to resolved', async () => {
    assert(createdObsId, 'Need createdObsId');
    const res = await fetch(`${BASE_URL}/api/v1/observations/${createdObsId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ status: 'resolved', notes: 'Treated with neem spray — resolved.' }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.data.status, 'resolved');
    assert(json.data.notes.includes('resolved'));
  });

  // 14. PATCH — invalid status value → 422
  await run('14. PATCH /observations/[id] with invalid status returns 422', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations/${createdObsId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ status: 'deleted_by_magic' }),
    });
    assert.strictEqual(res.status, 422);
  });

  // ================================================================
  // IRRIGATION RECORDS
  // ================================================================
  console.log('\n── Irrigation Records ─────────────────────────────────');

  // 15. Unauthenticated create → 401
  await run('15. Unauthenticated POST /irrigation returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldId: farmerFieldId, method: 'drip', durationMinutes: 60 }),
    });
    assert.strictEqual(res.status, 401);
  });

  // 16. Unauthenticated list → 401
  await run('16. Unauthenticated GET /irrigation returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`);
    assert.strictEqual(res.status, 401);
  });

  // 17. Invalid method → 422
  await run('17. POST /irrigation with invalid method returns 422', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ fieldId: farmerFieldId, method: 'underground_laser', durationMinutes: 30 }),
    });
    assert.strictEqual(res.status, 422);
  });

  // 18. Duration too large → 422
  await run('18. POST /irrigation with durationMinutes=9999 returns 422', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ fieldId: farmerFieldId, method: 'drip', durationMinutes: 9999 }),
    });
    assert.strictEqual(res.status, 422);
  });

  // 19. Unowned field → 404
  await run('19. POST /irrigation with unowned fieldId returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ fieldId: 'nonexistent-000', method: 'drip', durationMinutes: 60 }),
    });
    assert.strictEqual(res.status, 404);
  });

  // 20. Valid create without volume (no fabrication)
  await run('20. POST /irrigation without volumeL stores null volumeL (no fabrication)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        fieldId: farmerFieldId,
        method: 'drip',
        durationMinutes: 90,
        moistureNote: 'moist',
      }),
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const json = await res.json();
    assert(json.data?.id, 'Expected id');
    assert.strictEqual(json.data.volumeL, null, 'volumeL must be null when not supplied');
    assert.strictEqual(json.data.method, 'drip');
    assert.strictEqual(json.data.durationMinutes, 90);
    assert(json.data.field?.name, 'Expected field.name joined');
    createdIrrId = json.data.id;
  });

  // 21. Valid create WITH volume
  await run('21. POST /irrigation with explicit volumeL stores it correctly', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        fieldId: farmerFieldId,
        method: 'sprinkler',
        durationMinutes: 45,
        volumeL: 1200.5,
        moistureNote: 'wet',
      }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.data.volumeL, 1200.5);
  });

  // 22. Negative volume → 422
  await run('22. POST /irrigation with negative volumeL returns 422', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ fieldId: farmerFieldId, method: 'drip', durationMinutes: 30, volumeL: -50 }),
    });
    assert.strictEqual(res.status, 422);
  });

  // 23. List returns records
  await run('23. GET /irrigation returns created records with pagination meta', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data) && json.data.length >= 1, 'Expected at least one record');
    assert(typeof json.meta?.total === 'number', 'Expected meta.total');
    assert(typeof json.meta?.total_pages === 'number', 'Expected meta.total_pages');
  });

  // 24. Get by id
  await run('24. GET /irrigation/[id] returns correct record', async () => {
    assert(createdIrrId, 'Need createdIrrId');
    const res = await fetch(`${BASE_URL}/api/v1/irrigation/${createdIrrId}`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.id, createdIrrId);
  });

  // 25. PATCH — update method and notes
  await run('25. PATCH /irrigation/[id] updates method and notes', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation/${createdIrrId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ method: 'flood', notes: 'Switched to flood due to pump failure.' }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.method, 'flood');
    assert(json.data.notes.includes('pump failure'));
  });

  // 26. Access other farmer's observation → 404
  // We test this by requesting a made-up ID (simulates another farmer's record)
  await run('26. GET /observations/nonexistent returns 404 (other-farmer isolation)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations/non-existent-other-farmer-id`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 404);
  });

  // 27. DELETE observation
  await run('27. DELETE /observations/[id] removes record (returns deleted:true)', async () => {
    assert(createdObsId, 'Need createdObsId');
    const res = await fetch(`${BASE_URL}/api/v1/observations/${createdObsId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.deleted, true);
  });

  // 28. GET after delete → 404
  await run('28. GET /observations/[id] after delete returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observations/${createdObsId}`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 404);
  });

  // 29. DELETE irrigation record
  await run('29. DELETE /irrigation/[id] removes record', async () => {
    assert(createdIrrId, 'Need createdIrrId');
    const res = await fetch(`${BASE_URL}/api/v1/irrigation/${createdIrrId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.deleted, true);
  });

  // 30. GET after delete → 404
  await run('30. GET /irrigation/[id] after delete returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation/${createdIrrId}`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 404);
  });

  // ---- Summary ----
  console.log('\n========================================================');
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed out of ${passed + failed} tests`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('\nUnhandled error in test runner:', err.message);
  process.exit(1);
});
