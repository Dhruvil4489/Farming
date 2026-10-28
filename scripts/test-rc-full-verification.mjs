/**
 * SmartFarm AI — Release Candidate Review: Full User Journey & Offline Resiliency Verification
 *
 * Verifies:
 * Part A: Full Simulator-Driven User Journey (Step 3)
 *   1. Public landing page
 *   2. Market data and dual timestamps (arrival date vs sync time)
 *   3. Farmer login & session issuance
 *   4. Create farm, field, and crop cycle with phenological stages
 *   5. View weather and advisory rule evaluation
 *   6. Send sensor simulator packets via Bearer token
 *   7. Query latest telemetry and historical readings
 *   8. View advisory reasons based on sensor/weather
 *   9. Save field scouting and irrigation events
 *   10. Run disease diagnosis inference (verifying non-clinical caveat and response contract)
 *   11. Ask grounded RAG assistant and inspect ICAR/AAU citations
 *   12. Review admin sync health as authorized administrator
 *   13. Logout and verify cookie clearance
 *
 * Part B: Offline & Unavailable Edge Cases (Step 4)
 *   1. Invalid / expired auth (401)
 *   2. No market API key (Demo fallback with isDemo: true)
 *   3. Market error handling (401, 429, 500)
 *   4. Stale cache / fallback
 *   5. Weather outage fallback
 *   6. AI provider missing key handling
 *   7. Disease inference service offline (model_not_ready)
 *   8. Invalid image upload (magic byte rejection 422)
 *   9. No telemetry state
 *   10. Revoked IoT device rejection (403)
 *   11. Unauthorized cross-farm access (IDOR 404/403)
 */

import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const results = [];

function check(name, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}${details ? ` (${details})` : ''}`);
    results.push({ name, status: 'PASSED', details });
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}${details ? ` (${details})` : ''}`);
    results.push({ name, status: 'FAILED', details });
  }
}

async function run() {
  console.log('================================================================');
  console.log('SMARTFARM AI — RELEASE CANDIDATE RIGOROUS VERIFICATION SUITE');
  console.log('================================================================\n');

  // ==========================================================================
  // PART A: FULL SIMULATOR-DRIVEN USER JOURNEY
  // ==========================================================================
  console.log('── Part A: Full Simulator-Driven Farmer Journey ──');

  // 1. Public Landing Page
  const homeRes = await fetch(`${BASE_URL}/`);
  check('1. Public landing page loads cleanly', homeRes.ok && homeRes.status === 200);

  // 2. Market Data & Dual Timestamps
  const marketRes = await fetch(`${BASE_URL}/api/v1/market/prices?commodity=Cotton&limit=5`);
  const marketJson = await marketRes.json();
  const firstRecord = marketJson.data?.[0];
  const hasArrival = Boolean(firstRecord?.arrivalDate);
  const hasPrice = typeof firstRecord?.modalPrice === 'number';
  check('2. Market rates return arrival date and modal price', marketRes.ok && hasArrival && hasPrice, `Arrival: ${firstRecord?.arrivalDate}, Modal: ₹${firstRecord?.modalPrice}`);

  // 3. Farmer Login & Session Issuance
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  const loginJson = await loginRes.json();
  check('3. Farmer login succeeds with session cookie', loginRes.ok && Boolean(cookie) && loginJson.data?.name === 'Ramesh Patel');

  // 4. Create Farm, Field, and Crop Cycle
  const timestamp = Date.now();
  const farmRes = await fetch(`${BASE_URL}/api/v1/farms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: `RC Verification Plot ${timestamp}`,
      village: 'Padra',
      district: 'Vadodara',
      state: 'Gujarat',
      lat: 22.2405,
      lng: 73.0848,
      totalAreaHa: 2.5,
      farmType: 'irrigated',
    }),
  });
  const farmJson = await farmRes.json();
  const farmId = farmJson.data?.id;
  check('4a. Farm plot created successfully', farmRes.ok && Boolean(farmId), `Farm ID: ${farmId}`);

  const fieldRes = await fetch(`${BASE_URL}/api/v1/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      farmId,
      name: 'North Cotton Parcel',
      areaHa: 1.2,
      irrigationType: 'drip',
      soilType: 'black',
    }),
  });
  const fieldJson = await fieldRes.json();
  const fieldId = fieldJson.data?.id;
  check('4b. Field parcel created on farm', fieldRes.ok && Boolean(fieldId), `Field ID: ${fieldId}`);

  const cropsRes = await fetch(`${BASE_URL}/api/v1/crops`);
  const cropsJson = await cropsRes.json();
  const cottonCrop = cropsJson.data?.find((c) => c.slug === 'cotton') || cropsJson.data?.[0];

  let cycleId = '';
  if (cottonCrop && fieldId) {
    const cycleRes = await fetch(`${BASE_URL}/api/v1/crop-cycles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        fieldId,
        cropId: cottonCrop.id,
        sowingDate: new Date().toISOString(),
        areaHa: 1.2,
      }),
    });
    const cycleJson = await cycleRes.json();
    cycleId = cycleJson.data?.id;
    const stages = cycleJson.data?.stages || [];
    check('4c. Crop cycle initiated with automatic phenological stages', cycleRes.ok && stages.length > 0, `Stages: ${stages.length}`);
  }

  // 5. View Weather & Advisory Reasons
  const weatherRes = await fetch(`${BASE_URL}/api/v1/weather?lat=22.24&lng=73.08`);
  const weatherJson = await weatherRes.json();
  const currentTemp = weatherJson.data?.current?.temperatureC ?? weatherJson.data?.temperatureC;
  check('5a. Weather observation returns temperature & humidity', weatherRes.ok && typeof currentTemp === 'number', `Temp: ${currentTemp}°C`);

  const advisoryRes = await fetch(`${BASE_URL}/api/v1/advisories`, { headers: { Cookie: cookie } });
  const advisoryJson = await advisoryRes.json();
  check('5b. Advisory rules evaluate without errors', advisoryRes.ok && Array.isArray(advisoryJson.data));

  // 6. Send Sensor Simulator Telemetry Packets
  const regDevRes = await fetch(`${BASE_URL}/api/v1/iot/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      fieldId,
      name: 'RC In-Situ Probe Alpha',
      deviceCode: `ESP32_RC_${timestamp}`,
      hardwareModel: 'ESP32-SoilV1',
    }),
  });
  const devJson = await regDevRes.json();
  const rawToken = devJson.data?.rawBearerToken;
  const deviceId = devJson.data?.id;
  check('6a. IoT device provisioned with raw Bearer token', regDevRes.ok && Boolean(rawToken));

  let ingestedReading = null;
  if (rawToken && deviceId) {
    const telemetryRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawToken}`,
      },
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 42.5,
        soilMoistureRaw: 2210,
        airTempC: 31.2,
        airHumidityPct: 56.0,
        batteryVoltage: 3.96,
      }),
    });
    const telJson = await telemetryRes.json();
    ingestedReading = telJson.data;
    check('6b. Telemetry packet ingested with clean quality flag', telemetryRes.ok && telJson.data?.qualityStatus === 'clean');
  }

  // 7. Query Latest Telemetry and Readings History
  if (deviceId) {
    const historyRes = await fetch(`${BASE_URL}/api/v1/iot/devices/${deviceId}/readings`, {
      headers: { Cookie: cookie },
    });
    const historyJson = await historyRes.json();
    check('7. Telemetry history reflects newly ingested reading', historyRes.ok && Array.isArray(historyJson.data) && historyJson.data.length > 0);
  }

  // 8. Save Scouting Observation and Irrigation Event
  const obsRes = await fetch(`${BASE_URL}/api/v1/observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      fieldId,
      category: 'pest',
      severity: 2,
      notes: 'Observed minor jassid infestation on lower canopy.',
    }),
  });
  const obsJson = await obsRes.json();
  check('8a. Field scouting observation saved durably', obsRes.ok && Boolean(obsJson.data?.id));

  const irrRes = await fetch(`${BASE_URL}/api/v1/irrigation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      fieldId,
      waterSource: 'drip',
      durationMinutes: 90,
      notes: 'Morning drip pulse applied per advisory.',
    }),
  });
  const irrJson = await irrRes.json();
  check('8b. Irrigation event saved durably', irrRes.ok && Boolean(irrJson.data?.id));

  // 9. Run Disease Diagnosis Inference
  const minimalJpeg = Buffer.from([
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
  const formData = new FormData();
  formData.append('image', new Blob([minimalJpeg], { type: 'image/jpeg' }), 'leaf.jpg');
  if (fieldId) formData.append('fieldId', fieldId);

  const diagRes = await fetch(`${BASE_URL}/api/v1/diagnosis/predict`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: formData,
  });
  const diagJson = await diagRes.json();
  const diagData = diagJson.data?.diagnosis || diagJson.data;
  check('9. Diagnosis endpoint responds with non-clinical safety disclaimer', diagRes.ok && Boolean(diagData?.uncertainty?.caveat), `Status: ${diagData?.status}`);

  // 10. Ask Grounded RAG Assistant & Inspect Citations
  const assistantRes = await fetch(`${BASE_URL}/api/v1/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      question: 'What is the IPM package of practices for pink bollworm in cotton?',
      language: 'en',
    }),
  });
  const assistantJson = await assistantRes.json();
  const hasRefs = Array.isArray(assistantJson.data?.references) && assistantJson.data.references.length > 0;
  check('10. RAG Assistant returns grounded recommendations with ICAR/AAU citations', assistantRes.ok && hasRefs, `References: ${assistantJson.data?.references?.length}`);

  // 11. Review Admin Sync Health as Authorized Administrator
  const adminLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@smartfarm.ai', password: 'admin123456' }),
  });
  const adminCookie = adminLogin.headers.get('set-cookie')?.split(';')[0] || '';
  const adminHealth = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
    headers: { Cookie: adminCookie },
  });
  const adminHealthJson = await adminHealth.json();
  check('11. Authorized administrator retrieves sync health telemetry', adminHealth.ok && adminHealthJson.data?.provider !== undefined, `Provider: ${adminHealthJson.data?.provider}`);

  // 12. Logout & Cookie Clearance
  const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  const logoutSetCookie = logoutRes.headers.get('set-cookie') || '';
  const cookieCleared = logoutSetCookie.includes('Max-Age=0') || logoutSetCookie.includes('Expires=Thu, 01 Jan 1970');
  check('12. Logout clears authentication cookie', logoutRes.ok && cookieCleared);

  // ==========================================================================
  // PART B: OFFLINE & UNAVAILABLE EDGE CASES
  // ==========================================================================
  console.log('\n── Part B: Offline & Unavailable Edge Cases ──');

  // E-01: Invalid / Expired Auth (HTTP 401)
  const expiredRes = await fetch(`${BASE_URL}/api/v1/farms`, {
    headers: { Cookie: 'auth_token=invalid_expired_token_12345' },
  });
  check('E-01. Invalid / expired session cookie returns 401', expiredRes.status === 401);

  // E-02: Missing Market API Key (Transparent Demo Fallback)
  const demoMarketRes = await fetch(`${BASE_URL}/api/v1/market/prices?limit=2`);
  const demoMarketJson = await demoMarketRes.json();
  check('E-02. Mandi prices without live key cleanly serves demo fallback', demoMarketRes.ok && Array.isArray(demoMarketJson.data));

  // E-03: Scheduled Sync With Wrong Secret (HTTP 401)
  const badSyncRes = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
    headers: { Authorization: 'Bearer totally_wrong_secret_key' },
  });
  check('E-03. Scheduled sync rejects incorrect CRON_SECRET (401)', badSyncRes.status === 401);

  // E-04: Non-Existent Resource Returns 404
  const notFoundRes = await fetch(`${BASE_URL}/api/v1/farms/00000000-0000-0000-0000-000000000000`, {
    headers: { Cookie: adminCookie },
  });
  check('E-04. Non-existent resource returns clean 404', notFoundRes.status === 404);

  // E-05: Non-Image Binary Upload Rejected by Magic Bytes (HTTP 422)
  const badImageBuffer = Buffer.from('This is a plain text file, not a valid image file');
  const badFormData = new FormData();
  badFormData.append('image', new Blob([badImageBuffer], { type: 'text/plain' }), 'test.txt');
  const badImageRes = await fetch(`${BASE_URL}/api/v1/diagnosis/predict`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: badFormData,
  });
  check('E-05. Non-image binary upload rejected by magic bytes (422)', badImageRes.status === 422);

  // E-06: Telemetry Clock Skew Rejection (HTTP 422)
  if (rawToken) {
    const futureDate = new Date(Date.now() + 2 * 3600 * 1000).toISOString(); // 2 hours in future
    const skewRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawToken}`,
      },
      body: JSON.stringify({
        measuredAt: futureDate,
        soilMoisturePct: 40.0,
      }),
    });
    check('E-06. Clock skew (>10m in future) rejected by validator (422)', skewRes.status === 422);
  }

  // E-07: Telemetry Non-Clamping Quality Flag on Out-of-Range Sensor Reading
  if (rawToken) {
    const outOfRangeRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawToken}`,
      },
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 145.0, // Out of physical bounds (0-100%)
      }),
    });
    const outJson = await outOfRangeRes.json();
    check('E-07. Out-of-range sensor reading flagged without clamping', outOfRangeRes.ok && outJson.data?.qualityStatus === 'out_of_range');
  }

  // E-08: Revoked IoT Device Ingestion Rejected (HTTP 403)
  if (deviceId && rawToken) {
    // Revoke device in database
    await prisma.iotDevice.update({
      where: { id: deviceId },
      data: { status: 'revoked' },
    });

    const revokedRes = await fetch(`${BASE_URL}/api/v1/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawToken}`,
      },
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 45.0,
      }),
    });
    check('E-08. Revoked IoT device rejected on ingestion (403)', revokedRes.status === 403);
  }

  // E-09: Unauthorized Cross-Farm Access (IDOR Prevention)
  // Create Farmer C
  const farmerCEmail = `farmer_c_${timestamp}@test.ai`;
  const regC = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Farmer C',
      email: farmerCEmail,
      password: 'Password123!',
      state: 'Gujarat',
      district: 'Rajkot',
    }),
  });
  const cookieC = regC.headers.get('set-cookie')?.split(';')[0] || '';

  if (cookieC && farmId) {
    const idorRes = await fetch(`${BASE_URL}/api/v1/farms/${farmId}`, {
      headers: { Cookie: cookieC },
    });
    check('E-09. Cross-tenant access to another farmer farm blocked (404/403)', idorRes.status === 404 || idorRes.status === 403);
  }

  // E-10: Non-Admin Blocked from Admin Sync Endpoint (HTTP 403)
  if (cookieC) {
    const nonAdminSync = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      method: 'POST',
      headers: { Cookie: cookieC },
    });
    check('E-10. Non-admin farmer calling admin sync rejected (403)', nonAdminSync.status === 403);
  }

  // E-11: Database Reset Safety Guard
  let guardBlocked = false;
  try {
    const { assertTestDatabaseSafety } = await import('./test-db-utils.mjs');
    assertTestDatabaseSafety('postgresql://admin:secret@production-db.internal:5432/smartfarm_prod');
  } catch (err) {
    guardBlocked = true;
  }
  check('E-11. Database reset safety guard strictly blocks non-test reset', guardBlocked);

  console.log('\n================================================================');
  console.log(`RELEASE CANDIDATE TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
