/**
 * SmartFarm AI — Phase 5 IoT Telemetry Pipeline & Hardware Simulator Integration Tests
 *
 * Requirements:
 *   - Dev server running on http://localhost:3000
 *   - Seeded database (npm run seed)
 *
 * Usage:  node scripts/test-phase5-iot-pipeline.mjs
 */

import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const prisma = new PrismaClient();

let farmerCookie = '';
let adminCookie = '';
let testFieldId = '';
let testDeviceId = '';
let testDeviceToken = '';

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
  console.log('\n================================================================');
  console.log('  SmartFarm AI — Phase 5 IoT Telemetry Pipeline Integration Tests');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const run = async (name, fn) => {
    const ok = await test(name, fn);
    ok ? passed++ : failed++;
  };

  // ------------------------------------------------------------------
  // 1. Authentication & Setup
  // ------------------------------------------------------------------
  console.log('── 1. User Authentication & Field Resolution ──────────');

  await run('1.1. Login as farmer and resolve field', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
    });
    assert.strictEqual(res.status, 200);
    farmerCookie = res.headers.get('set-cookie') || '';
    assert(farmerCookie.includes('smartfarm_token='));

    const fieldsRes = await fetch(`${BASE_URL}/api/v1/fields`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(fieldsRes.status, 200);
    const fieldsJson = await fieldsRes.json();
    assert(Array.isArray(fieldsJson.data) && fieldsJson.data.length > 0);
    testFieldId = fieldsJson.data[0].id;
    assert(testFieldId, 'Test field ID resolved');
  });

  await run('1.2. Login as admin', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@smartfarm.ai', password: 'admin123456' }),
    });
    assert.strictEqual(res.status, 200);
    adminCookie = res.headers.get('set-cookie') || '';
    assert(adminCookie.includes('smartfarm_token='));
  });

  // ------------------------------------------------------------------
  // 2. Device Provisioning & Registration
  // ------------------------------------------------------------------
  console.log('\n── 2. Device Registry & Provisioning ──────────────────');

  const testCode = `TEST-ESP32-${Date.now()}`;
  await run('2.1. Farmer provisions new device -> 201 with raw token', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({
        name: 'Test Moisture Probe #1',
        deviceCode: testCode,
        fieldId: testFieldId,
        hardwareModel: 'ESP32-SoilV1-Test',
        calibration: { rawDry: 3100, rawWet: 1350, version: 1 },
      }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert(json.data.id, 'Expected device id');
    assert(json.data.rawBearerToken, 'Expected one-time raw bearer token');
    assert(json.data.rawBearerToken.startsWith('sf_dev_'));

    testDeviceId = json.data.id;
    testDeviceToken = json.data.rawBearerToken;

    // Verify database stores tokenHash and NEVER raw token
    const dbDevice = await prisma.iotDevice.findUnique({ where: { id: testDeviceId } });
    assert(dbDevice.tokenHash, 'Expected tokenHash in database');
    assert.notStrictEqual(dbDevice.tokenHash, testDeviceToken, 'Raw token stored in database!');
    assert.strictEqual(dbDevice.status, 'active');
  });

  await run('2.2. Duplicate deviceCode is rejected with HTTP 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({
        name: 'Duplicate Probe',
        deviceCode: testCode, // identical code
        fieldId: testFieldId,
      }),
    });
    assert.strictEqual(res.status, 409);
  });

  // ------------------------------------------------------------------
  // 3. Telemetry Ingestion Authentication & Revocation
  // ------------------------------------------------------------------
  console.log('\n── 3. Telemetry Ingestion Authentication & Revocation ─');

  await run('3.1. Ingestion without token returns HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measuredAt: new Date().toISOString(), soilMoisturePct: 40 }),
    });
    assert.strictEqual(res.status, 401);
  });

  await run('3.2. Ingestion with invalid token returns HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sf_dev_fake_and_invalid_token_xyz',
      },
      body: JSON.stringify({ measuredAt: new Date().toISOString(), soilMoisturePct: 40 }),
    });
    assert.strictEqual(res.status, 401);
  });

  await run('3.3. Ingestion from revoked device returns HTTP 403 Forbidden', async () => {
    // Revoke device
    const patchRes = await fetch(`${BASE_URL}/api/v1/iot/devices/${testDeviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: farmerCookie },
      body: JSON.stringify({ status: 'revoked' }),
    });
    assert.strictEqual(patchRes.status, 200);

    // Attempt ingestion with revoked device's token
    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify({ measuredAt: new Date().toISOString(), soilMoisturePct: 40 }),
    });
    assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}`);

    // Re-activate device
    await fetch(`${BASE_URL}/api/v1/iot/devices/${testDeviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: farmerCookie },
      body: JSON.stringify({ status: 'active' }),
    });
  });

  await run('3.4. Valid token ingests telemetry successfully (HTTP 200)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        soilMoistureRaw: 2150,
        soilMoisturePct: 46.5,
        airTempC: 30.2,
        airHumidityPct: 62.1,
        batteryVoltage: 3.96,
        depthCm: 15,
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.data.id, 'Expected reading id');
    assert.strictEqual(json.data.fieldId, testFieldId, 'Server did not resolve correct fieldId');
    assert.strictEqual(json.data.deviceId, testDeviceId);
    assert.strictEqual(json.data.qualityStatus, 'clean');
  });

  // ------------------------------------------------------------------
  // 4. Idempotency & Deduplication
  // ------------------------------------------------------------------
  console.log('\n── 4. Idempotency & Duplicate Retries ─────────────────');

  const fixedEventId = `evt_fixed_nonce_${Date.now()}`;
  await run('4.1. First transmission of eventId stores new reading', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify({
        eventId: fixedEventId,
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 45.0,
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.meta.stored, true);
  });

  await run('4.2. Duplicate retry with same eventId acknowledged without creating duplicate row', async () => {
    const countBefore = await prisma.iotTelemetryReading.count({ where: { eventId: fixedEventId } });
    assert.strictEqual(countBefore, 1);

    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify({
        eventId: fixedEventId,
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 45.0,
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.meta.idempotent, true);
    assert.strictEqual(json.meta.stored, false);

    const countAfter = await prisma.iotTelemetryReading.count({ where: { eventId: fixedEventId } });
    assert.strictEqual(countAfter, 1, 'Duplicate row was erroneously inserted into database!');
  });

  // ------------------------------------------------------------------
  // 5. Validation & Clock Skew Policy
  // ------------------------------------------------------------------
  console.log('\n── 5. Validation Rules & Clock Skew Limits ────────────');

  await run('5.1. Future timestamp (>10m ahead) is rejected with HTTP 422', async () => {
    const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify({ measuredAt: futureDate, soilMoisturePct: 40 }),
    });
    assert.strictEqual(res.status, 422);
    const json = await res.json();
    assert.strictEqual(json.error.code, 'clock_skew_violation');
  });

  await run('5.2. Stale timestamp (>7 days old) is rejected with HTTP 422', async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();
    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify({ measuredAt: oldDate, soilMoisturePct: 40 }),
    });
    assert.strictEqual(res.status, 422);
    const json = await res.json();
    assert.strictEqual(json.error.code, 'clock_skew_violation');
  });

  await run('5.3. Out of range reading stored without clamping and tagged out_of_range', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 108.5, // Oversaturated beyond 100%
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.soilMoisturePct, 108.5, 'Raw value was silently clamped!');
    assert.strictEqual(json.data.qualityStatus, 'out_of_range');
  });

  // ------------------------------------------------------------------
  // 6. Farmer Query Endpoints & Ownership RBAC
  // ------------------------------------------------------------------
  console.log('\n── 6. Farmer Telemetry Endpoints & RBAC Isolation ────');

  await run('6.1. Farmer lists devices -> includes paired field details and latest reading', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/devices`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data));
    const found = json.data.find((d) => d.id === testDeviceId);
    assert(found, 'Device not found in farmer list');
    assert(found.field, 'Field details missing');
    assert(found.latestReading, 'Latest reading missing');
  });

  await run('6.2. Farmer queries device historical readings with bounds', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/devices/${testDeviceId}/readings?limit=10`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data));
    assert(json.data.length >= 2, 'Expected at least 2 readings');
    assert(json.data[0].measuredAt, 'measuredAt missing');
    assert(json.data[0].receivedAt, 'receivedAt missing');
  });

  await run('6.3. Farmer queries field IoT status -> returns paired devices and recent telemetry', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/fields/${testFieldId}/iot`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.fieldId, testFieldId);
    assert.strictEqual(json.data.hasDevices, true);
    assert(Array.isArray(json.data.devices));
    assert(Array.isArray(json.data.recentTelemetry));
  });

  await run('6.4. Admin can inspect cross-farm device details', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/devices/${testDeviceId}`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.id, testDeviceId);
  });

  // ------------------------------------------------------------------
  // 7. Full Hardware Simulator End-to-End Test
  // ------------------------------------------------------------------
  console.log('\n── 7. Hardware Sensor Simulator End-to-End Proof ─────');

  await run('7.1. Run scripts/simulate-iot.mjs --scenario=dry_to_wet --count=4', async () => {
    const output = execSync('node scripts/simulate-iot.mjs --scenario=dry_to_wet --count=4 --delay=50', {
      encoding: 'utf-8',
    });
    assert(output.includes('Stored:      4'));
  });

  await run('7.2. Run scripts/simulate-iot.mjs --scenario=duplicate_retry', async () => {
    const output = execSync('node scripts/simulate-iot.mjs --scenario=duplicate_retry --delay=50', {
      encoding: 'utf-8',
    });
    assert(output.includes('Stored:      1'));
    assert(output.includes('Idempotent:  1'));
  });

  await run('7.3. Verify simulated readings in DB are prominently flagged isDemo: true', async () => {
    const demoReadings = await prisma.iotTelemetryReading.findMany({
      where: { isDemo: true },
      take: 5,
    });
    assert(demoReadings.length > 0, 'No simulated demo readings found in database');
    for (const r of demoReadings) {
      assert.strictEqual(r.isDemo, true);
    }
  });

  console.log('\n================================================================');
  console.log(`  Phase 5 tests completed: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(async (err) => {
  console.error('Fatal test execution error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
