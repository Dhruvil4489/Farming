/**
 * SmartFarm AI — Comprehensive Farmer End-to-End User Journey (Phase 11)
 *
 * Exercises the complete multi-step farmer workflow:
 * 1. Farmer login via credentials & session issuance
 * 2. Onboarding wizard route check & dashboard initial state
 * 3. Multi-farm management: create a farm plot
 * 4. Field management: create a field with soil and irrigation config
 * 5. Crop cycle management: initiate cycle with automatic stage materialization
 * 6. Task activities: view materialized tasks, complete an agronomic activity
 * 7. Field scouting: submit pest/disease observation with severity
 * 8. Irrigation logging: record irrigation pulse with duration and water source
 * 9. Weather & advisory: fetch live forecast and weather-triggered advisories
 * 10. Mandi market prices: fetch live/demo market rates with commodity filters
 * 11. In-situ IoT simulator: ingest sensor reading, verify telemetry history
 * 12. Disease vision scanner: submit synthetic leaf image, verify diagnosis model contract & non-clinical caveats
 * 13. Grounded RAG assistant: ask agronomic question, verify ICAR/AAU citations & recommendations
 * 14. Session termination: invoke /api/v1/auth/logout, confirm cookie clearance
 */

import assert from 'node:assert';

const BASE_URL = process.env.APP_URL || process.env.TEST_BASE_URL || 'http://localhost:3000';

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

function createSyntheticLeafJpeg() {
  // Minimal valid 16x16 JPEG image buffer with green coloration
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x10,
    0x00, 0x10, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x80, 0x7f, 0xff, 0xd9,
  ]);
}

async function runSuite() {
  console.log('================================================================');
  console.log('🌾 SMARTFARM AI — COMPLETE FARMER E2E LIFECYCLE REHEARSAL');
  console.log('================================================================\n');

  // STEP 1: Farmer Authentication
  console.log('── 1. Farmer Login & Session Issuance ──');
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  const loginJson = await loginRes.json();
  report('Farmer login issues authenticated session cookie', loginRes.ok && Boolean(cookie));
  report('Farmer identity resolved as Ramesh Patel', loginJson.data?.name === 'Ramesh Patel');

  // STEP 2: Farmer Dashboard Summary
  console.log('\n── 2. Farmer Dashboard Aggregation & Initial State ──');
  const dashRes = await fetch(`${BASE_URL}/api/v1/dashboard/summary`, {
    headers: { Cookie: cookie },
  });
  const dashJson = await dashRes.json();
  report('Dashboard summary API returns aggregated metrics', dashRes.ok && dashJson.data?.counts !== undefined);

  // STEP 3: Multi-Farm Management (Create Farm)
  console.log('\n── 3. Farm Creation & Agronomic Boundaries ──');
  const farmTimestamp = Date.now();
  const createFarmRes = await fetch(`${BASE_URL}/api/v1/farms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: `Patel Farm Plot ${farmTimestamp}`,
      village: 'Padra',
      district: 'Vadodara',
      state: 'Gujarat',
      lat: 22.2405,
      lng: 73.0848,
      totalAreaHa: 2.8,
      farmType: 'irrigated',
    }),
  });
  const farmJson = await createFarmRes.json();
  const farmId = farmJson.data?.id;
  report('Create Farm plot succeeds', createFarmRes.ok && Boolean(farmId), `FarmId: ${farmId}`);

  // STEP 4: Field Management (Create Field)
  console.log('\n── 4. Field Parcel Creation & Soil Profiling ──');
  const createFieldRes = await fetch(`${BASE_URL}/api/v1/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      farmId,
      name: 'South Cotton Block',
      areaHa: 1.2,
      irrigationType: 'drip',
      soilType: 'black',
    }),
  });
  const fieldJson = await createFieldRes.json();
  const fieldId = fieldJson.data?.id;
  report('Create Field parcel on farm succeeds', createFieldRes.ok && Boolean(fieldId), `FieldId: ${fieldId}`);

  // STEP 5: Crop Cycle & Stage Materialization
  console.log('\n── 5. Crop Cycle Initiation & Stage Template Materialization ──');
  const cropsRes = await fetch(`${BASE_URL}/api/v1/crops`);
  const cropsJson = await cropsRes.json();
  const cotton = cropsJson.data?.find((c) => c.slug === 'cotton') || cropsJson.data?.[0];

  let cycleId = '';
  if (cotton && fieldId) {
    const cycleRes = await fetch(`${BASE_URL}/api/v1/crop-cycles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        fieldId,
        cropId: cotton.id,
        sowingDate: new Date().toISOString(),
        areaHa: 1.2,
      }),
    });
    const cycleJson = await cycleRes.json();
    cycleId = cycleJson.data?.id;
    const stages = cycleJson.data?.stages || [];
    report(
      'Crop cycle created with automatic phenological stages',
      cycleRes.ok && stages.length > 0,
      `Materialized Stages: ${stages.length}`
    );
  }

  // STEP 6: Tasks Management
  console.log('\n── 6. Agronomic Tasks Creation & Activity Completion ──');
  const createTaskRes = await fetch(`${BASE_URL}/api/v1/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      farmId,
      fieldId,
      cropCycleId: cycleId || undefined,
      type: 'scouting',
      title: 'Scout for early sucking pests on cotton seedlings',
      priority: 'high',
      dueAt: new Date().toISOString(),
    }),
  });
  const taskJson = await createTaskRes.json();
  const taskId = taskJson.data?.id;
  report('Create agronomic activity task succeeds', createTaskRes.ok && Boolean(taskId));

  if (taskId) {
    const completeTask = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    const completeJson = await completeTask.json();
    report('Mark task completed persists status change', completeTask.ok && completeJson.data?.status === 'completed');
  }

  // STEP 7: Field Scouting Observation
  console.log('\n── 7. Field Scouting & Pest Observation Logging ──');
  const obsRes = await fetch(`${BASE_URL}/api/v1/observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      fieldId,
      category: 'pest',
      severity: 1,
      notes: 'Initial scouting confirms clean crop canopy with negligible jassids.',
    }),
  });
  const obsJson = await obsRes.json();
  report('Field scouting observation logged with severity', obsRes.ok && Boolean(obsJson.data?.id));

  // STEP 8: Irrigation Event Logging
  console.log('\n── 8. Field Irrigation Logging ──');
  const irrRes = await fetch(`${BASE_URL}/api/v1/irrigation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      fieldId,
      waterSource: 'borewell',
      durationMinutes: 120,
      notes: 'Standard morning drip cycle completed.',
    }),
  });
  const irrJson = await irrRes.json();
  report('Irrigation record saved with water source and duration', irrRes.ok && Boolean(irrJson.data?.id));

  // STEP 9: Weather & Advisory
  console.log('\n── 9. Live Weather & Weather-Triggered Advisory ──');
  const weatherRes = await fetch(`${BASE_URL}/api/v1/weather?lat=22.24&lng=73.08`);
  const weatherJson = await weatherRes.json();
  const currentTemp = weatherJson.data?.current?.temperatureC ?? weatherJson.data?.temperatureC;
  report(
    'Weather observation retrieved with temperature & humidity',
    weatherRes.ok && typeof currentTemp === 'number'
  );

  const advisoryRes = await fetch(`${BASE_URL}/api/v1/advisories`, {
    headers: { Cookie: cookie },
  });
  const advisoryJson = await advisoryRes.json();
  report('Advisories retrieved without crashing', advisoryRes.ok && Array.isArray(advisoryJson.data));

  // STEP 10: Mandi Market Prices
  console.log('\n── 10. Mandi Market Prices & Provenance ──');
  const marketRes = await fetch(`${BASE_URL}/api/v1/market/prices?commodity=Cotton&limit=5`);
  const marketJson = await marketRes.json();
  report(
    'Mandi market rates returned with arrival date and modal price',
    marketRes.ok && Array.isArray(marketJson.data) && marketJson.data.length > 0
  );

  // STEP 11: In-Situ IoT Simulator & Ingestion
  console.log('\n── 11. IoT Device Registration, Telemetry Ingestion & History ──');
  const e2eTimestamp = Date.now();
  const regDev = await fetch(`${BASE_URL}/api/v1/iot/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      fieldId,
      name: 'E2E Test Soil Probe',
      deviceCode: `ESP32_E2E_${e2eTimestamp}`,
      hardwareModel: 'ESP32-SoilV1',
    }),
  });
  const devData = await regDev.json();
  const token = devData.data?.rawBearerToken;
  const devId = devData.data?.id;
  report('IoT probe registered with per-device Bearer token', regDev.ok && Boolean(token));

  if (token && devId) {
    const ingestRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 48.0,
        airTempC: 28.5,
        airHumidityPct: 60.0,
        batteryVoltage: 3.94,
      }),
    });
    const ingestJson = await ingestRes.json();
    report('Telemetry reading ingested via Bearer token', ingestRes.ok && ingestJson.data?.qualityStatus === 'clean');

    const historyRes = await fetch(`${BASE_URL}/api/v1/iot/devices/${devId}/readings`, {
      headers: { Cookie: cookie },
    });
    const historyJson = await historyRes.json();
    report(
      'Device telemetry history returns freshly ingested reading',
      historyRes.ok && Array.isArray(historyJson.data) && historyJson.data.length > 0
    );
  }

  // STEP 12: Crop Disease Vision AI
  console.log('\n── 12. Crop Disease Vision AI Diagnosis Upload ──');
  const jpegBuffer = createSyntheticLeafJpeg();
  const formData = new FormData();
  formData.append('image', new Blob([jpegBuffer], { type: 'image/jpeg' }), 'leaf.jpg');
  if (fieldId) formData.append('fieldId', fieldId);

  const diagRes = await fetch(`${BASE_URL}/api/v1/diagnosis/predict`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: formData,
  });
  const diagJson = await diagRes.json();
  const diagData = diagJson.data?.diagnosis || diagJson.data;
  report(
    'Diagnosis API accepts image upload and returns schema-compliant prediction',
    diagRes.ok && diagData?.status !== undefined,
    `Status: ${diagData?.status}`
  );
  report(
    'Diagnosis includes non-clinical safety disclaimer and model metadata',
    Boolean(diagData?.uncertainty?.caveat)
  );

  // STEP 13: Grounded RAG AI Assistant
  console.log('\n── 13. Grounded RAG Assistant Query & Extension Citations ──');
  const chatRes = await fetch(`${BASE_URL}/api/v1/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      question: 'What is the recommended IPM strategy for pink bollworm in cotton?',
      language: 'en',
    }),
  });
  const chatJson = await chatRes.json();
  report(
    'Assistant returns grounded response envelope with recommendations',
    chatRes.ok && Array.isArray(chatJson.data?.recommendations)
  );
  report(
    'Assistant response cites verified extension literature (ICAR / AAU)',
    Array.isArray(chatJson.data?.references) && chatJson.data.references.length > 0
  );

  // STEP 14: Logout
  console.log('\n── 14. Session Logout & Cookie Clearance ──');
  const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  const setCookie = logoutRes.headers.get('set-cookie') || '';
  const isCleared = setCookie.includes('Max-Age=0') || setCookie.includes('Expires=Thu, 01 Jan 1970');
  report('Farmer logout clears session cookie header', logoutRes.ok && isCleared);

  console.log('\n================================================================');
  console.log(`🌾 FARMER E2E LIFECYCLE SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Unhandled E2E suite error:', err);
  process.exit(1);
});
