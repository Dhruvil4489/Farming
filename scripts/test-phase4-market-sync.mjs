/**
 * SmartFarm AI — Phase 4 Scheduled Market Sync & Operational Health Tests
 *
 * Requirements:
 *   - Dev server running on http://localhost:3000
 *   - Seeded database
 *
 * Usage:  node scripts/test-phase4-market-sync.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const prisma = new PrismaClient();

// Load CRON_SECRET from .env if not in process.env
function getCronSecret() {
  if (process.env.CRON_SECRET) return process.env.CRON_SECRET;
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const l of lines) {
      const match = l.match(/^CRON_SECRET=["']?([^"']+)["']?/);
      if (match) return match[1].trim();
    }
  }
  return 'smartfarm_super_secret_cron_token_2026';
}

const CRON_SECRET = getCronSecret();

let farmerCookie = '';
let adminCookie = '';

// Test helper
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
  console.log('  SmartFarm AI — Phase 4 Scheduled Sync Integration Tests');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;
  const run = async (name, fn) => {
    const ok = await test(name, fn);
    ok ? passed++ : failed++;
  };

  // Ensure lock table is clean before starting
  await prisma.marketSyncLock.deleteMany({ where: { id: 'market_sync' } }).catch(() => {});

  // 1. Scheduled Endpoint Authentication
  console.log('── 1. Scheduled Endpoint Authentication (Timing-Safe) ──');

  await run('1.1. Missing auth header returns HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const json = await res.json();
    assert(json.error, 'Expected error object in envelope');
    assert.strictEqual(json.error.code, 'cron_unauthorized');
  });

  await run('1.2. Invalid Bearer token returns HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wrong-and-fake-token-value',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const json = await res.json();
    assert(json.error, 'Expected error object in envelope');
    assert.strictEqual(json.error.code, 'cron_unauthorized');
  });

  await run('1.3. Error response never leaks the secret or token', async () => {
    const probeToken = 'probe_canary_leak_check_99';
    const res = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${probeToken}`,
      },
    });
    const text = await res.text();
    assert(!text.includes(CRON_SECRET), 'Response leaked CRON_SECRET!');
    assert(!text.includes(probeToken), 'Response reflected back provided token!');
  });

  // 2. Successful Scheduled Invocations
  console.log('\n── 2. Authorized Scheduled Triggers ───────────────────');

  await run('2.1. Valid Bearer token triggers sync -> HTTP 200 with metadata', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit: 5 }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.data, 'Expected json.data');
    assert.strictEqual(json.data.triggerSource, 'scheduled');
    assert(typeof json.data.recordsStored === 'number');
    assert(typeof json.data.durationMs === 'number');
  });

  await run('2.2. Valid x-cron-secret header triggers sync -> HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'POST',
      headers: {
        'x-cron-secret': CRON_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit: 3 }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.data, 'Expected json.data');
    assert.strictEqual(json.data.triggerSource, 'scheduled');
  });

  await run('2.3. GET /api/v1/scheduled/market-sync supported for webhook schedulers', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.data, 'Expected json.data');
  });

  // 3. Concurrency Run Guard (Database-Backed Lock)
  console.log('\n── 3. Database-Backed Concurrency Lock Guard ──────────');

  await run('3.1. Active lock blocks overlapping scheduled invocation -> HTTP 409', async () => {
    // Manually place an active lock
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60000);
    await prisma.marketSyncLock.upsert({
      where: { id: 'market_sync' },
      create: {
        id: 'market_sync',
        lockedAt: now,
        lockedBy: 'simulated_concurrent_worker_test',
        expiresAt,
      },
      update: {
        lockedAt: now,
        lockedBy: 'simulated_concurrent_worker_test',
        expiresAt,
      },
    });

    const res = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    assert.strictEqual(res.status, 409, `Expected 409 Conflict, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.data.status, 'skipped_locked');
    assert(json.data.lockedUntil, 'Expected lockedUntil timestamp');

    // Clean up simulated lock
    await prisma.marketSyncLock.deleteMany({ where: { id: 'market_sync' } });
  });

  await run('3.2. Normal sync succeeds once lock is cleared', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
  });

  // 4. Admin Sync Health & Monitoring
  console.log('\n── 4. Admin Sync Health Telemetry & Role Checks ───────');

  await run('4.1. Unauthenticated request to /api/v1/admin/market/sync is rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/market/sync`);
    assert(res.status === 401 || res.status === 403, `Expected 401 or 403, got ${res.status}`);
  });

  await run('4.2. Login as farmer -> 403 Forbidden on manual trigger and health', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
    });
    farmerCookie = loginRes.headers.get('set-cookie') || '';
    assert(farmerCookie.includes('smartfarm_token='), 'Expected farmer cookie');

    const healthRes = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      headers: { Cookie: farmerCookie },
    });
    assert.strictEqual(healthRes.status, 403, `Expected 403 for farmer, got ${healthRes.status}`);

    const syncRes = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: farmerCookie },
      body: JSON.stringify({}),
    });
    assert.strictEqual(syncRes.status, 403, `Expected 403 for farmer manual sync, got ${syncRes.status}`);
  });

  await run('4.3. Login as admin -> GET /api/v1/admin/market/sync returns full sync health telemetry', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@smartfarm.ai', password: 'admin123456' }),
    });
    adminCookie = loginRes.headers.get('set-cookie') || '';
    assert(adminCookie.includes('smartfarm_token='), 'Expected admin cookie');

    const res = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.data, 'Expected json.data');
    const health = json.data;

    // Verify all Phase 4 telemetry fields
    assert(health.provider, 'Expected provider');
    assert(typeof health.isLocked === 'boolean', 'Expected isLocked boolean');

    // Last success
    assert(health.lastSuccess, 'Expected lastSuccess object');
    assert(health.lastSuccess.timestamp, 'Expected lastSuccess.timestamp');
    assert(typeof health.lastSuccess.recordsStored === 'number', 'Expected lastSuccess.recordsStored');

    // Last attempt
    assert(health.lastAttempt, 'Expected lastAttempt object');
    assert(health.lastAttempt.status, 'Expected lastAttempt.status');
    assert(health.lastAttempt.triggerSource, 'Expected lastAttempt.triggerSource');

    // Next scheduled run
    assert(health.nextScheduledRun, 'Expected nextScheduledRun object');
    assert.strictEqual(health.nextScheduledRun.timezone, 'Asia/Kolkata');
    assert.strictEqual(health.nextScheduledRun.cronExpressionUtc, '0 1,13 * * *');
    assert(health.nextScheduledRun.nextRunFormattedIST.includes('IST'));

    // Data freshness
    assert(health.dataFreshness, 'Expected dataFreshness');
    assert(typeof health.dataFreshness.totalStoredRecords === 'number');

    // Recent logs audit trail
    assert(Array.isArray(health.recentLogs), 'Expected recentLogs array');
    assert(health.recentLogs.length > 0, 'Expected at least 1 recent log');
    assert(health.recentLogs[0].triggerSource, 'Expected triggerSource on recent log');
  });

  await run('4.4. Admin manual POST /api/v1/admin/market/sync executes with triggerSource: "manual"', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ limit: 5 }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.data.triggerSource, 'manual');
    assert(json.data.recordsStored > 0);
  });

  // 5. Idempotent Upserts
  console.log('\n── 5. Data Integrity & Idempotency Safeguards ─────────');

  await run('5.1. Repeated runs do not inflate record counts or cause duplicates', async () => {
    const countBefore = await prisma.marketPriceObservation.count();

    // Trigger sync again with identical scope
    await fetch(`${BASE_URL}/api/v1/scheduled/market-sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CRON_SECRET}` },
    });

    const countAfter = await prisma.marketPriceObservation.count();
    assert.strictEqual(countAfter, countBefore, `Duplicate rows created! Before: ${countBefore}, After: ${countAfter}`);
  });

  console.log('\n========================================================');
  console.log(`  Phase 4 tests completed: ${passed} passed, ${failed} failed`);
  console.log('========================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(async (err) => {
  console.error('Fatal test error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
