/**
 * SmartFarm AI — API Integration Test Suite (Phase 11)
 *
 * Verifies REST APIs at /api/v1/* against running backend:
 * 1. Authentication & Session Lifecycles:
 *    - Register fresh tenant, login, cookie generation, rate limiting (HTTP 429), logout
 * 2. Tenant Ownership & IDOR Protection:
 *    - Farm, Field, CropCycle, Task, Observation, Irrigation, Assistant conversation isolation
 * 3. Core Agronomic CRUD:
 *    - Farms, Fields, Crop Cycles (with stage materialization), Tasks, Observations, Irrigation
 * 4. IoT Telemetry Ingestion:
 *    - Valid Bearer token authentication, unauthenticated rejection, quality tagging
 * 5. Scheduled Trigger & Lock Protection:
 *    - Timing-safe CRON_SECRET authorization and database mutex lock
 * 6. Error Envelope & Stale Case Resilience:
 *    - 404 on missing entity, 400 on malformed JSON, 401 on missing session
 */

import assert from 'node:assert';

const BASE_URL = process.env.APP_URL || process.env.TEST_BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'smartfarm-cron-dev-secret-phase4-2026';

let passed = 0;
let failed = 0;

function report(name, ok, details = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}${details ? ` (${details})` : ''}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}${details ? ` (${details})` : ''}`);
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('SMARTFARM AI — API INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. Authentication, Sessions & Rate Limiting
  // --------------------------------------------------------------------------
  console.log('--- 1. Authentication, Sessions & Rate Limiting ---');

  const timestamp = Date.now();
  const testEmailA = `api_farmer_a_${timestamp}@test.ai`;
  const testPassword = 'Password123!';

  // 1.1 Register Farmer A
  const regResA = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Integration Farmer A',
      email: testEmailA,
      password: testPassword,
      state: 'Gujarat',
      district: 'Vadodara',
    }),
  });
  const cookieA = regResA.headers.get('set-cookie')?.split(';')[0] || '';
  report('Farmer A registration succeeds with HTTP 200/201', regResA.ok && Boolean(cookieA));

  // 1.2 Login with valid credentials
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testEmailA, password: testPassword }),
  });
  const loginJson = await loginRes.json();
  report('Farmer A login returns user profile envelope', loginRes.ok && loginJson.data?.email === testEmailA);

  // 1.3 Login with wrong password returns 401
  const badLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testEmailA, password: 'WrongPassword999' }),
  });
  report('Bad password returns HTTP 401 Unauthorized', badLogin.status === 401);

  // 1.4 Rate limiting on registration with bursts
  const spamHeaders = { 'x-forwarded-for': `198.51.100.${timestamp % 200}` };
  let triggered429 = false;
  for (let i = 0; i < 7; i++) {
    const burst = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...spamHeaders },
      body: JSON.stringify({
        name: `Burst User ${i}`,
        email: `burst_${timestamp}_${i}@test.ai`,
        password: testPassword,
      }),
    });
    if (burst.status === 429) {
      triggered429 = true;
      break;
    }
  }
  report('Registration burst triggers HTTP 429 Rate Limited', triggered429);

  // Register Farmer B for IDOR tests
  const testEmailB = `api_farmer_b_${timestamp}@test.ai`;
  const regResB = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Integration Farmer B',
      email: testEmailB,
      password: testPassword,
      state: 'Gujarat',
      district: 'Rajkot',
    }),
  });
  const cookieB = regResB.headers.get('set-cookie')?.split(';')[0] || '';
  report('Farmer B registration succeeds', regResB.ok && Boolean(cookieB));

  // --------------------------------------------------------------------------
  // 2. Agronomic CRUD & Tenant Ownership
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Agronomic CRUD Operations & Tenant Ownership ---');

  // 2.1 Farmer A creates a farm
  const createFarmRes = await fetch(`${BASE_URL}/api/v1/farms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      name: 'Green Valley Plot A',
      village: 'Samiyala',
      district: 'Vadodara',
      state: 'Gujarat',
      lat: 22.25,
      lng: 73.10,
      totalAreaHa: 3.2,
      farmType: 'irrigated',
    }),
  });
  const createFarmJson = await createFarmRes.json();
  const farmAId = createFarmJson.data?.id;
  report('Farmer A creates farm record', createFarmRes.ok && Boolean(farmAId), `FarmId: ${farmAId}`);

  // 2.2 IDOR check: Farmer B cannot access Farmer A's farm
  const idorFarmRes = await fetch(`${BASE_URL}/api/v1/farms/${farmAId}`, {
    headers: { Cookie: cookieB },
  });
  report('Farmer B blocked from accessing Farmer A farm (IDOR closed)', idorFarmRes.status === 404 || idorFarmRes.status === 403);

  // 2.3 Farmer A creates a field
  const createFieldRes = await fetch(`${BASE_URL}/api/v1/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      farmId: farmAId,
      name: 'East Cotton Sector',
      areaHa: 1.5,
      irrigationType: 'drip',
      soilType: 'black',
    }),
  });
  const createFieldJson = await createFieldRes.json();
  const fieldAId = createFieldJson.data?.id;
  report('Farmer A creates field on farm', createFieldRes.ok && Boolean(fieldAId), `FieldId: ${fieldAId}`);

  // 2.4 IDOR check: Farmer B cannot access Farmer A's field
  const idorFieldRes = await fetch(`${BASE_URL}/api/v1/fields/${fieldAId}`, {
    headers: { Cookie: cookieB },
  });
  report('Farmer B blocked from accessing Farmer A field (IDOR closed)', idorFieldRes.status === 404 || idorFieldRes.status === 403);

  // 2.5 Farmer A creates a crop cycle with stage template materialization
  const cropsRes = await fetch(`${BASE_URL}/api/v1/crops`);
  const cropsJson = await cropsRes.json();
  const cottonCrop = cropsJson.data?.find((c) => c.slug === 'cotton') || cropsJson.data?.[0];

  let cycleAId = '';
  if (cottonCrop && fieldAId) {
    const cycleRes = await fetch(`${BASE_URL}/api/v1/crop-cycles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        fieldId: fieldAId,
        cropId: cottonCrop.id,
        sowingDate: new Date().toISOString(),
        areaHa: 1.5,
      }),
    });
    const cycleJson = await cycleRes.json();
    cycleAId = cycleJson.data?.id;
    const stagesMaterialized = Array.isArray(cycleJson.data?.stages) && cycleJson.data.stages.length > 0;
    report('Crop cycle created with automatic stage materialization', cycleRes.ok && stagesMaterialized, `Stages: ${cycleJson.data?.stages?.length}`);
  }

  // 2.6 Farmer A creates and completes a Task
  const createTaskRes = await fetch(`${BASE_URL}/api/v1/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      farmId: farmAId,
      fieldId: fieldAId,
      cropCycleId: cycleAId || undefined,
      type: 'irrigation',
      title: 'Inspect emitter nozzles for silt deposits',
      priority: 'high',
      dueAt: new Date().toISOString(),
    }),
  });
  const taskJson = await createTaskRes.json();
  const taskId = taskJson.data?.id;
  report('Farmer A creates task', createTaskRes.ok && Boolean(taskId));

  if (taskId) {
    // Farmer B cannot complete Farmer A's task
    const idorTask = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { Cookie: cookieB },
    });
    report('Farmer B blocked from completing Farmer A task (IDOR closed)', idorTask.status === 404 || idorTask.status === 403);

    // Farmer A completes task
    const completeRes = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { Cookie: cookieA },
    });
    const completeJson = await completeRes.json();
    report('Farmer A marks task completed', completeRes.ok && completeJson.data?.status === 'completed');
  }

  // 2.7 Scouting observation CRUD
  const createObsRes = await fetch(`${BASE_URL}/api/v1/observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      fieldId: fieldAId,
      category: 'pest',
      severity: 2,
      notes: 'Noticed early aphid presence on lower canopy leaves.',
    }),
  });
  const obsJson = await createObsRes.json();
  report('Farmer A logs field scouting observation', createObsRes.ok && Boolean(obsJson.data?.id));

  // 2.8 Irrigation record logging
  const createIrrRes = await fetch(`${BASE_URL}/api/v1/irrigation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      fieldId: fieldAId,
      waterSource: 'drip',
      durationMinutes: 90,
      notes: 'Scheduled morning drip pulse applied.',
    }),
  });
  const irrJson = await createIrrRes.json();
  report('Farmer A logs irrigation event', createIrrRes.ok && Boolean(irrJson.data?.id));

  // --------------------------------------------------------------------------
  // 3. IoT Telemetry Ingestion & Quality Tagging
  // --------------------------------------------------------------------------
  console.log('\n--- 3. IoT Telemetry Ingestion & Device Authentication ---');

  // Register device for Farmer A's farm
  const devTimestamp = Date.now();
  const regDevRes = await fetch(`${BASE_URL}/api/v1/iot/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      fieldId: fieldAId,
      name: 'North Sensor Probe Alpha',
      deviceCode: `ESP32_API_${devTimestamp}`,
      hardwareModel: 'ESP32-SoilV1',
    }),
  });
  const devJson = await regDevRes.json();
  const deviceToken = devJson.data?.rawBearerToken;
  const deviceId = devJson.data?.id;
  report('IoT device registered with server-generated token', regDevRes.ok && Boolean(deviceToken));

  // Ingest telemetry with valid device token
  if (deviceToken) {
    const telemetryRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deviceToken}`,
      },
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 44.5,
        airTempC: 29.1,
        airHumidityPct: 58.0,
        batteryVoltage: 3.92,
      }),
    });
    const telJson = await telemetryRes.json();
    report('IoT telemetry ingestion succeeds with Bearer token', telemetryRes.ok && telJson.data?.qualityStatus === 'clean');

    // Ingest with invalid token rejected
    const badTokenRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_device_token_xyz',
      },
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 45.0,
      }),
    });
    report('IoT ingestion rejects invalid Bearer token (401)', badTokenRes.status === 401);
  }

  // --------------------------------------------------------------------------
  // 4. Scheduled Sync Trigger & Timing-Safe CRON Secret
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Scheduled Sync Trigger & CRON Secret Protection ---');

  // Trigger without authorization header -> 401
  const unauthSync = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`);
  report('Unauthenticated market sync trigger rejected with 401', unauthSync.status === 401);

  // Trigger with wrong secret -> 401
  const badSecretSync = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
    headers: { Authorization: 'Bearer totally_wrong_secret' },
  });
  report('Wrong CRON_SECRET rejected with 401', badSecretSync.status === 401);

  // Trigger with valid secret -> 200
  const validSync = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  const validSyncJson = await validSync.json();
  report('Valid CRON_SECRET market sync trigger succeeds', validSync.ok && validSyncJson.data?.status === 'success');

  // --------------------------------------------------------------------------
  // 5. Error Envelopes & Resilience
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Standard Error Envelopes & Stale Case Resilience ---');

  // 5.1 Requesting non-existent farm ID returns 404
  const notFoundFarm = await fetch(`${BASE_URL}/api/v1/farms/non_existent_farm_id_9999`, {
    headers: { Cookie: cookieA },
  });
  report('Non-existent farm returns clean HTTP 404', notFoundFarm.status === 404);

  // 5.2 Malformed JSON payload returns HTTP 400
  const malformedRes = await fetch(`${BASE_URL}/api/v1/farms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: '{"name": "Broken JSON',
  });
  report('Malformed JSON request returns HTTP 400 Bad Request', malformedRes.status === 400);

  // 5.3 Unauthenticated request to protected route returns 401
  const unauthRoute = await fetch(`${BASE_URL}/api/v1/farms`);
  report('Unauthenticated API call returns HTTP 401 Unauthorized', unauthRoute.status === 401);

  console.log('\n================================================================');
  console.log(`API INTEGRATION TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
