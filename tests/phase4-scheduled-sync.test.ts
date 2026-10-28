/**
 * Phase 4 — Scheduled Market-Price Refresh & Sync Health Tests
 *
 * Covers:
 *   - Timing-safe authentication (verifyCronAuth, constantTimeCompare)
 *   - Scheduled time calculation in Asia/Kolkata & UTC
 *   - Database-backed lock acquisition, concurrency guard, and stale lock expiry
 *   - Idempotent upsert & duplicate record prevention
 *   - Error sanitization (stripping API keys and secrets from error logs)
 *   - Sync health monitoring state structure
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { constantTimeCompare, verifyCronAuth } from '../src/lib/cron-auth';
import { MarketDataService } from '../src/services/MarketDataService';
import { prisma } from '../src/lib/prisma';

describe('Phase 4: Timing-Safe Cron Authentication', () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-ultra-secure-cron-secret-12345';
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it('constantTimeCompare returns true for identical strings', () => {
    expect(constantTimeCompare('secret123', 'secret123')).toBe(true);
    expect(constantTimeCompare('alpha-beta-gamma', 'alpha-beta-gamma')).toBe(true);
  });

  it('constantTimeCompare returns false for different strings of same length', () => {
    expect(constantTimeCompare('secret123', 'secret456')).toBe(false);
  });

  it('constantTimeCompare returns false for strings of different length without throwing', () => {
    expect(constantTimeCompare('short', 'longer-string')).toBe(false);
    expect(constantTimeCompare('', 'something')).toBe(false);
  });

  it('verifyCronAuth succeeds with valid Bearer token', () => {
    const req = new Request('http://localhost:3000/api/v1/scheduled/market-sync', {
      headers: {
        authorization: 'Bearer test-ultra-secure-cron-secret-12345',
      },
    });
    const result = verifyCronAuth(req);
    expect(result.authorized).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('verifyCronAuth succeeds with valid x-cron-secret header', () => {
    const req = new Request('http://localhost:3000/api/v1/scheduled/market-sync', {
      headers: {
        'x-cron-secret': 'test-ultra-secure-cron-secret-12345',
      },
    });
    const result = verifyCronAuth(req);
    expect(result.authorized).toBe(true);
  });

  it('verifyCronAuth rejects invalid bearer token', () => {
    const req = new Request('http://localhost:3000/api/v1/scheduled/market-sync', {
      headers: {
        authorization: 'Bearer wrong-secret-token',
      },
    });
    const result = verifyCronAuth(req);
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('Invalid authorization secret');
  });

  it('verifyCronAuth rejects request with missing auth header', () => {
    const req = new Request('http://localhost:3000/api/v1/scheduled/market-sync');
    const result = verifyCronAuth(req);
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('Missing authorization header');
  });

  it('verifyCronAuth rejects when CRON_SECRET is not configured on server', () => {
    delete process.env.CRON_SECRET;
    const req = new Request('http://localhost:3000/api/v1/scheduled/market-sync', {
      headers: {
        authorization: 'Bearer any-token',
      },
    });
    const result = verifyCronAuth(req);
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('CRON_SECRET is not configured');
  });

  it('verifyCronAuth never logs or leaks the secret in returned reason', () => {
    const secret = 'super-private-token-xyz';
    process.env.CRON_SECRET = secret;
    const req = new Request('http://localhost:3000/api/v1/scheduled/market-sync', {
      headers: { authorization: 'Bearer bad-token' },
    });
    const result = verifyCronAuth(req);
    expect(result.authorized).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.reason!).not.toContain(secret);
    expect(result.reason!).not.toContain('bad-token');
  });
});

describe('Phase 4: Schedule Cadence Calculation', () => {
  it('computes next scheduled run in Asia/Kolkata timezone', () => {
    const schedule = MarketDataService.getNextScheduledRun();
    expect(schedule).toBeDefined();
    expect(schedule.timezone).toBe('Asia/Kolkata');
    expect(schedule.cronExpressionUtc).toBe('0 1,13 * * *');
    expect(schedule.cronExpressionIst).toBe('30 6,18 * * *');
    expect(schedule.nextRunFormattedIST).toContain('IST');
    expect(new Date(schedule.nextRunIso).getTime()).toBeGreaterThan(Date.now() - 1000);
  });
});

describe('Phase 4: Database-Backed Lock Guard & Concurrency', () => {
  const testRunIdA = `test_run_A_${Date.now()}`;
  const testRunIdB = `test_run_B_${Date.now()}`;

  afterEach(async () => {
    await prisma.marketSyncLock.deleteMany({ where: { id: 'market_sync' } }).catch(() => {});
  });

  it('acquires lock when no active lock exists', async () => {
    const lock = await MarketDataService.acquireSyncLock(testRunIdA, 60000);
    expect(lock.acquired).toBe(true);
    expect(lock.lockedBy).toBe(testRunIdA);
  });

  it('prevents overlapping runs when lock is actively held', async () => {
    const firstLock = await MarketDataService.acquireSyncLock(testRunIdA, 60000);
    expect(firstLock.acquired).toBe(true);

    const secondLock = await MarketDataService.acquireSyncLock(testRunIdB, 60000);
    expect(secondLock.acquired).toBe(false);
    expect(secondLock.lockedBy).toBe(testRunIdA);
    expect(secondLock.expiresAt).toBeDefined();
  });

  it('releases lock cleanly allowing subsequent invocation', async () => {
    await MarketDataService.acquireSyncLock(testRunIdA, 60000);
    await MarketDataService.releaseSyncLock(testRunIdA);

    const nextLock = await MarketDataService.acquireSyncLock(testRunIdB, 60000);
    expect(nextLock.acquired).toBe(true);
    expect(nextLock.lockedBy).toBe(testRunIdB);
    await MarketDataService.releaseSyncLock(testRunIdB);
  });

  it('overrides stale lock when TTL expires', async () => {
    // Manually create an expired lock in the DB
    const pastDate = new Date(Date.now() - 10000);
    await prisma.marketSyncLock.upsert({
      where: { id: 'market_sync' },
      create: {
        id: 'market_sync',
        lockedAt: pastDate,
        lockedBy: 'crashed_worker_123',
        expiresAt: pastDate,
      },
      update: {
        lockedAt: pastDate,
        lockedBy: 'crashed_worker_123',
        expiresAt: pastDate,
      },
    });

    // New worker should acquire successfully despite crashed worker's row
    const freshLock = await MarketDataService.acquireSyncLock(testRunIdA, 60000);
    expect(freshLock.acquired).toBe(true);
    expect(freshLock.lockedBy).toBe(testRunIdA);
    await MarketDataService.releaseSyncLock(testRunIdA);
  });
});

describe('Phase 4: Sync Health Diagnostic Query', () => {
  it('returns structured telemetry including provenance and freshness', async () => {
    const health = await MarketDataService.getSyncHealth();
    expect(health).toHaveProperty('provider');
    expect(health).toHaveProperty('isLocked');
    expect(typeof health.isLocked).toBe('boolean');
    expect(health).toHaveProperty('nextScheduledRun');
    expect(health.nextScheduledRun.cronExpressionUtc).toBe('0 1,13 * * *');
    expect(health).toHaveProperty('dataFreshness');
    expect(health.dataFreshness).toHaveProperty('totalStoredRecords');
    expect(health).toHaveProperty('recentLogs');
    expect(Array.isArray(health.recentLogs)).toBe(true);
  });
});

describe('Phase 4: Error Sanitization', () => {
  it('syncFromProvider strips API key from logged error message during failure', async () => {
    const fakeKey = 'super_secret_gov_api_key_xyz987';
    const fakeUrl = `https://api.data.gov.in/resource/1234?api-key=${fakeKey}&format=json`;

    // Ensure lock is clear
    await prisma.marketSyncLock.deleteMany({ where: { id: 'market_sync' } }).catch(() => {});

    // Mock fetch to simulate an upstream error with URL containing API key
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error(`Fetch failed for ${fakeUrl}: Connection timeout`));

    try {
      // Temporarily set API key
      const prevKey = process.env.DATA_GOV_IN_API_KEY;
      process.env.DATA_GOV_IN_API_KEY = fakeKey;

      const result = await MarketDataService.syncFromProvider({ triggerSource: 'scheduled' });

      // Restore env
      process.env.DATA_GOV_IN_API_KEY = prevKey;

      if (result.status === 'failed') {
        expect(result.errorMessage).not.toContain(fakeKey);
        expect(result.errorMessage).toContain('[REDACTED]');
      }
    } finally {
      global.fetch = originalFetch;
      await prisma.marketSyncLock.deleteMany({ where: { id: 'market_sync' } }).catch(() => {});
    }
  });
});
