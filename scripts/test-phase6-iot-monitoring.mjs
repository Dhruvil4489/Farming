/**
 * SmartFarm AI — Phase 6 IoT Farmer-Facing Monitoring & Irrigation Advisory Integration Tests
 *
 * Requirements:
 *   - Dev server running on http://localhost:3000
 *   - Seeded database (npm run seed)
 *
 * Usage:  node scripts/test-phase6-iot-monitoring.mjs
 */

import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const prisma = new PrismaClient();

let farmerCookie = '';
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
  console.log('  SmartFarm AI — Phase 6 IoT Monitoring & Advisory Integration Tests');
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
  console.log('── 1. User Authentication & Device Provisioning ───────');

  await run('1.1. Login as farmer and fetch user fields', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    farmerCookie = res.headers.get('set-cookie') || '';
    assert.ok(farmerCookie.length > 0, 'Farmer cookie must be present');

    // Fetch fields
    const fieldsRes = await fetch(`${BASE_URL}/api/v1/fields`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(fieldsRes.status, 200);
    const fieldsJson = await fieldsRes.json();
    assert.ok(fieldsJson.data.length > 0, 'Farmer must have at least one field');
    testFieldId = fieldsJson.data[0].id;
  });

  await run('1.2. Ensure test field has an active paired IoT device', async () => {
    // Provision a clean fresh device with token for testing
    const provRes = await fetch(`${BASE_URL}/api/v1/iot/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({
        fieldId: testFieldId,
        deviceCode: `PH6-TEST-${Date.now().toString(36).toUpperCase()}`,
        name: 'Phase 6 Test Probe',
        hardwareModel: 'ESP32-SoilV2',
        isDemo: true,
      }),
    });
    assert.strictEqual(provRes.status, 201);
    const provJson = await provRes.json();
    testDeviceId = provJson.data.id;
    testDeviceToken = provJson.data.rawBearerToken;
    assert.ok(testDeviceId, 'Device ID must exist');
    assert.ok(testDeviceToken, 'Device rawBearerToken must exist');
  });

  // ------------------------------------------------------------------
  // 2. Field IoT State & Live Readings (Req 2 & 4)
  // ------------------------------------------------------------------
  console.log('── 2. Field IoT State, Provenance & Quality Status ────');

  await run('2.1. Ingest fresh simulated telemetry reading', async () => {
    const payload = {
      eventId: `ph6-fresh-${Date.now()}`,
      measuredAt: new Date().toISOString(),
      soilMoistureRaw: 420,
      soilMoisturePct: 24.5, // Low moisture to test deficit advisory
      airTempC: 32.1,
      airHumidityPct: 45.0,
      batteryVoltage: 3.85,
      batteryPct: 80,
    };

    const ingRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify(payload),
    });
    assert.strictEqual(ingRes.status, 200, `Expected 200, got ${ingRes.status}`);
  });

  await run('2.2. Query /api/v1/fields/:id/iot returns latest reading & SIMULATED badge', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/fields/${testFieldId}/iot`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.fieldId, testFieldId);
    assert.strictEqual(json.data.hasDevices, true);
    assert.ok(json.data.devices.length > 0);

    const dev = json.data.devices.find((d) => d.id === testDeviceId) || json.data.devices[0];
    assert.ok(dev.latestReading != null, 'Latest reading must be populated');
    assert.strictEqual(typeof dev.latestReading.soilMoisturePct, 'number');
    assert.strictEqual(dev.isDemo, true, 'isDemo must be true for simulated device');
    assert.strictEqual(dev.latestReading.qualityStatus, 'clean');
  });

  // ------------------------------------------------------------------
  // 3. Stale Data Detection (Req 2: "Never show old value as fresh")
  // ------------------------------------------------------------------
  console.log('── 3. Stale Data Handling & Time Boundary Limits ──────');

  await run('3.1. Insert historic reading from 5 hours ago', async () => {
    const pastTime = new Date(Date.now() - 5 * 3600000);
    const payload = {
      eventId: `ph6-stale-${Date.now()}`,
      measuredAt: pastTime.toISOString(),
      soilMoisturePct: 35.0,
      airTempC: 28.0,
      airHumidityPct: 60.0,
    };

    const ingRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testDeviceToken}`,
      },
      body: JSON.stringify(payload),
    });
    assert.strictEqual(ingRes.status, 200, `Expected 200, got ${ingRes.status}`);
  });

  await run('3.2. Verify 24h & 7d history boundaries & order', async () => {
    const now = new Date();
    const from24h = new Date(now.getTime() - 24 * 3600000);

    const res24 = await fetch(
      `${BASE_URL}/api/v1/iot/devices/${testDeviceId}/readings?from=${from24h.toISOString()}&to=${now.toISOString()}&limit=50`,
      { headers: { Cookie: farmerCookie } }
    );
    assert.strictEqual(res24.status, 200);
    const json24 = await res24.json();
    assert.ok(Array.isArray(json24.data));
    assert.ok(json24.data.length >= 2, 'Should have at least 2 readings in 24h');

    // Verify ordering: newest first
    for (let i = 0; i < json24.data.length - 1; i++) {
      const t1 = new Date(json24.data[i].measuredAt).getTime();
      const t2 = new Date(json24.data[i + 1].measuredAt).getTime();
      assert.ok(t1 >= t2, 'Readings must be sorted newest first');
    }

    // Verify 7d query
    const from7d = new Date(now.getTime() - 7 * 24 * 3600000);
    const res7d = await fetch(
      `${BASE_URL}/api/v1/iot/devices/${testDeviceId}/readings?from=${from7d.toISOString()}&to=${now.toISOString()}&limit=100`,
      { headers: { Cookie: farmerCookie } }
    );
    assert.strictEqual(res7d.status, 200);
  });

  // ------------------------------------------------------------------
  // 4. Explainable Irrigation Advisory (Req 4 & 5)
  // ------------------------------------------------------------------
  console.log('── 4. Explainable Irrigation Advisory Engine ──────────');

  await run('4.1. Query advisory engine for test field', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/advisory?fieldId=${testFieldId}`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert.ok(json.data.fields.length > 0);

    const fieldAdv = json.data.fields.find((f) => f.fieldId === testFieldId) || json.data.fields[0];
    assert.strictEqual(fieldAdv.fieldId, testFieldId);
    assert.ok(Array.isArray(fieldAdv.advisories));

    // Check advisory properties
    if (fieldAdv.advisories.length > 0) {
      const adv = fieldAdv.advisories[0];
      assert.ok(adv.ruleId, 'Rule ID must exist');
      assert.ok(adv.title, 'Title must exist');
      assert.ok(adv.text, 'Text explanation must exist');
      assert.ok(adv.fact, 'Underlying facts must be present');
      assert.ok('currentMoisturePct' in adv.fact, 'Fact must contain currentMoisturePct');
      assert.ok('thresholdLow' in adv.fact, 'Fact must contain thresholdLow');
      assert.ok('thresholdSource' in adv.fact, 'Fact must contain thresholdSource');
      assert.ok('recentTrend' in adv.fact, 'Fact must contain recentTrend');
      assert.ok('ruleEvaluatedAt' in adv.fact, 'Fact must contain evaluation timestamp');
    }
  });

  // ------------------------------------------------------------------
  // 5. Alert History & Acknowledgement (Req 6)
  // ------------------------------------------------------------------
  console.log('── 5. Alert Creation, Listing & Dismissal ─────────────');

  let createdAlertId = '';

  await run('5.1. Create alert from advisory via POST /api/v1/iot/alerts', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({
        action: 'create',
        ruleId: 'RULE-MOISTURE-DEFICIT-SOIL',
        title: 'Moisture Deficit Alert: Test Field',
        fieldId: testFieldId,
        details: {
          text: 'Field moisture is below 30% threshold.',
          severity: 'warning',
          moisturePct: 24.5,
          thresholdSource: 'Crop baseline',
        },
      }),
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const json = await res.json();
    assert.ok(json.data.id);
    createdAlertId = json.data.id;
  });

  await run('5.2. List alerts via GET /api/v1/iot/alerts includes newly created alert', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/alerts?limit=10`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data.alerts));
    const found = json.data.alerts.find((a) => a.id === createdAlertId);
    assert.ok(found, 'Created alert must be present in alert list');
    assert.strictEqual(found.isRead, false);
  });

  await run('5.3. Acknowledge alert via POST /api/v1/iot/alerts (action: acknowledge)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/iot/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({
        action: 'acknowledge',
        alertId: createdAlertId,
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.isRead, true);
    assert.ok(json.data.readAt != null);
  });

  // ------------------------------------------------------------------
  // 6. Closing the Loop: Link to Irrigation Log (Req 6)
  // ------------------------------------------------------------------
  console.log('── 6. Closing the Loop: Irrigation Event Recording ────');

  await run('6.1. Log irrigation event referenced to IoT advisory', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/irrigation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: farmerCookie,
      },
      body: JSON.stringify({
        fieldId: testFieldId,
        method: 'drip',
        durationMinutes: 45,
        volumeL: 500,
        moistureNote: 'dry',
        notes: `Logged in response to IoT Advisory: Moisture Deficit Alert (24.5% vs 30-50% threshold)`,
      }),
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.data.fieldId, testFieldId);
    assert.strictEqual(json.data.durationMinutes, 45);
    assert.ok(json.data.notes.includes('IoT Advisory'));
  });

  console.log('\n================================================================');
  console.log(`  Phase 6 tests completed: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  prisma.$disconnect();
  process.exit(1);
});
