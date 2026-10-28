#!/usr/bin/env node
/**
 * SmartFarm AI — Mandi Price Synchronization CLI Runner
 *
 * Standalone utility to trigger or execute wholesale market price sync.
 *
 * Usage:
 *   node scripts/market-sync.mjs
 *   npm run market:sync
 *
 * Behavior:
 *   1. Reads configuration from environment (.env / .env.local).
 *   2. If a local or remote server is reachable at APP_URL / BASE_URL,
 *      sends an authenticated POST to /api/v1/scheduled/market-sync using CRON_SECRET.
 *   3. If the server is offline, connects directly via Prisma and the market
 *      provider to perform the synchronization with database-backed lock guard.
 *   4. Outputs execution timing, stored/skipped record counts, and status
 *      without logging secrets or API keys.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

// 1. Load environment
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const BASE_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`;
const CRON_SECRET = process.env.CRON_SECRET;

async function runViaHttp() {
  if (!CRON_SECRET) {
    return { ok: false, reason: 'CRON_SECRET is not configured in environment' };
  }

  const endpoint = `${BASE_URL.replace(/\/$/, '')}/api/v1/scheduled/market-sync`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const json = await res.json().catch(() => ({}));
    return {
      ok: true,
      statusCode: res.status,
      data: json.data || null,
      error: json.error || null,
    };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, error: err.message };
  }
}

async function runDirectly() {
  const prisma = new PrismaClient();
  const startTime = Date.now();
  const runId = `cli_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const lockId = 'market_sync';
  const lockTtlMs = 10 * 60 * 1000;

  console.log(`[market:sync] Standalone direct execution (Run ID: ${runId})`);

  // Acquire Lock
  const now = new Date();
  const expiresAt = new Date(now.getTime() + lockTtlMs);

  try {
    const existingLock = await prisma.marketSyncLock.findUnique({ where: { id: lockId } });
    if (existingLock && existingLock.expiresAt > now) {
      console.warn(`[market:sync] Sync skipped: Active lock held by "${existingLock.lockedBy}" until ${existingLock.expiresAt.toISOString()}`);
      await prisma.$disconnect();
      return { status: 'skipped_locked', lockedUntil: existingLock.expiresAt.toISOString() };
    }

    await prisma.marketSyncLock.upsert({
      where: { id: lockId },
      create: { id: lockId, lockedAt: now, lockedBy: runId, expiresAt },
      update: { lockedAt: now, lockedBy: runId, expiresAt },
    });

    // Create Sync Log
    const syncLog = await prisma.marketSyncLog.create({
      data: {
        provider: process.env.DATA_GOV_IN_API_KEY ? 'AGMARKNET (DMI Official)' : 'Demo Gujarat & National APMC',
        status: 'running',
        triggerSource: 'cli',
        recordsFetched: 0,
        recordsStored: 0,
        recordsSkipped: 0,
      },
    });

    // Fetch records (Official or Grounded Demo fallback)
    let records = [];
    let isDemo = false;
    let providerName = 'Demo Gujarat & National APMC';

    if (process.env.DATA_GOV_IN_API_KEY) {
      providerName = 'AGMARKNET (DMI Official)';
      try {
        const apiKey = process.env.DATA_GOV_IN_API_KEY;
        const resourceId = process.env.DATA_GOV_IN_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';
        const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=50`;
        const resp = await fetch(url, { headers: { Accept: 'application/json' } });
        if (resp.ok) {
          const body = await resp.json();
          const rows = body.records || [];
          records = rows.map((r) => {
            const minP = parseFloat(r.min_price || r.Min_Price || '0') || 0;
            const maxP = parseFloat(r.max_price || r.Max_Price || '0') || 0;
            const modalP = parseFloat(r.modal_price || r.Modal_Price || '0') || 0;
            let dateObj = new Date();
            const rawDate = r.arrival_date || r.Arrival_Date;
            if (rawDate) {
              const parts = rawDate.split('/');
              if (parts.length === 3) {
                dateObj = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
              }
            }
            return {
              market: (r.market || r.Market || 'Unknown').trim(),
              state: (r.state || r.State || 'Gujarat').trim(),
              district: (r.district || r.District || 'General').trim(),
              commodity: (r.commodity || r.Commodity || 'Wheat').trim(),
              variety: (r.variety || r.Variety || 'Other').trim(),
              grade: (r.grade || r.Grade || '').trim(),
              minPrice: minP,
              maxPrice: maxP,
              modalPrice: modalP,
              unit: '₹/Quintal',
              priceDate: dateObj,
              source: 'agmarknet',
              isDemo: false,
              qualityStatus: modalP > 0 && maxP >= minP ? 'clean' : 'anomaly_price_order',
            };
          });
        }
      } catch (e) {
        console.warn(`[market:sync] Upstream official fetch failed, falling back to grounded cache: ${e.message}`);
      }
    }

    if (records.length === 0) {
      isDemo = true;
      providerName = 'Demo Gujarat & National APMC';
      // Load fallback seeds
      records = [
        { market: 'Gondal APMC', state: 'Gujarat', district: 'Rajkot', commodity: 'Groundnut', variety: 'Bold', grade: 'FAQ', minPrice: 6200, maxPrice: 6850, modalPrice: 6600, unit: '₹/Quintal', priceDate: new Date('2026-10-12T05:30:00Z'), source: 'demo', isDemo: true, qualityStatus: 'clean' },
        { market: 'Gondal APMC', state: 'Gujarat', district: 'Rajkot', commodity: 'Cotton', variety: 'Shankar-6', grade: 'Medium Staple', minPrice: 7100, maxPrice: 7650, modalPrice: 7420, unit: '₹/Quintal', priceDate: new Date('2026-10-12T05:30:00Z'), source: 'demo', isDemo: true, qualityStatus: 'clean' },
        { market: 'Rajkot APMC', state: 'Gujarat', district: 'Rajkot', commodity: 'Wheat', variety: 'Lokwan', grade: 'FAQ', minPrice: 2450, maxPrice: 2780, modalPrice: 2650, unit: '₹/Quintal', priceDate: new Date('2026-10-12T05:30:00Z'), source: 'demo', isDemo: true, qualityStatus: 'clean' },
        { market: 'Unjha APMC', state: 'Gujarat', district: 'Mehsana', commodity: 'Cumin', variety: 'Gujarat Cumin-4', grade: 'Super Fine', minPrice: 24500, maxPrice: 28200, modalPrice: 26800, unit: '₹/Quintal', priceDate: new Date('2026-10-12T05:30:00Z'), source: 'demo', isDemo: true, qualityStatus: 'clean' },
        { market: 'Lasalgaon APMC', state: 'Maharashtra', district: 'Nashik', commodity: 'Onion', variety: 'Red', grade: 'Medium', minPrice: 1850, maxPrice: 2450, modalPrice: 2200, unit: '₹/Quintal', priceDate: new Date('2026-10-12T05:30:00Z'), source: 'demo', isDemo: true, qualityStatus: 'clean' },
      ];
    }

    let recordsStored = 0;
    let recordsSkipped = 0;

    for (const rec of records) {
      try {
        const location = await prisma.marketLocation.upsert({
          where: { name_state_district: { name: rec.market, state: rec.state, district: rec.district } },
          create: { name: rec.market, state: rec.state, district: rec.district },
          update: {},
        });

        const commodity = await prisma.marketCommodity.upsert({
          where: { name_variety: { name: rec.commodity, variety: rec.variety } },
          create: { name: rec.commodity, variety: rec.variety, category: null },
          update: {},
        });

        await prisma.marketPriceObservation.upsert({
          where: {
            locationId_commodityId_priceDate_source_grade: {
              locationId: location.id,
              commodityId: commodity.id,
              priceDate: rec.priceDate,
              source: rec.source,
              grade: rec.grade || '',
            },
          },
          create: {
            locationId: location.id,
            commodityId: commodity.id,
            grade: rec.grade || '',
            minPrice: rec.minPrice,
            maxPrice: rec.maxPrice,
            modalPrice: rec.modalPrice,
            unit: rec.unit,
            priceDate: rec.priceDate,
            source: rec.source,
            isDemo: rec.isDemo,
            qualityStatus: rec.qualityStatus,
            syncRunId: syncLog.id,
            fetchedAt: new Date(),
          },
          update: {
            minPrice: rec.minPrice,
            maxPrice: rec.maxPrice,
            modalPrice: rec.modalPrice,
            qualityStatus: rec.qualityStatus,
            syncRunId: syncLog.id,
            fetchedAt: new Date(),
          },
        });
        recordsStored++;
      } catch (err) {
        recordsSkipped++;
      }
    }

    const durationMs = Date.now() - startTime;
    await prisma.marketSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'success',
        recordsFetched: records.length,
        recordsStored,
        recordsSkipped,
        durationMs,
        completedAt: new Date(),
      },
    });

    await prisma.marketSyncLock.deleteMany({ where: { id: lockId, lockedBy: runId } });
    await prisma.$disconnect();

    return {
      status: 'success',
      provider: providerName,
      recordsFetched: records.length,
      recordsStored,
      recordsSkipped,
      durationMs,
      triggerSource: 'cli',
    };
  } catch (err) {
    await prisma.marketSyncLock.deleteMany({ where: { id: lockId, lockedBy: runId } }).catch(() => {});
    await prisma.$disconnect();
    return {
      status: 'failed',
      error: err.message,
      durationMs: Date.now() - startTime,
    };
  }
}

async function main() {
  console.log('========================================================');
  console.log('  SmartFarm AI — Mandi Price Synchronization Runner    ');
  console.log('========================================================');
  console.log(`Time: ${new Date().toISOString()} (${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)`);

  // Try HTTP first
  console.log(`Checking running server at ${BASE_URL}...`);
  const httpResult = await runViaHttp();

  if (httpResult.ok) {
    if (httpResult.statusCode === 200) {
      const d = httpResult.data;
      console.log('✔ Synchronization Succeeded (via HTTP API):');
      console.log(`  • Provider:       ${d.provider}`);
      console.log(`  • Status:         ${d.status}`);
      console.log(`  • Records:        ${d.recordsStored} stored, ${d.recordsSkipped || 0} skipped, ${d.recordsFetched} fetched`);
      console.log(`  • Duration:       ${d.durationMs}ms`);
      console.log(`  • Source:         ${d.triggerSource}`);
      process.exit(0);
    } else if (httpResult.statusCode === 409) {
      console.warn('⚠ Synchronization Skipped (409 Conflict):');
      console.warn(`  • ${httpResult.error?.message || 'Lock active: another job is running'}`);
      process.exit(0);
    } else {
      console.error(`❌ Server returned HTTP ${httpResult.statusCode}: ${httpResult.error?.message || 'Unknown error'}`);
      process.exit(1);
    }
  }

  // If HTTP could not connect (e.g. server offline), run direct
  console.log(`Server not reachable at ${BASE_URL} (${httpResult.error || httpResult.reason}). Falling back to standalone direct sync...`);
  const directResult = await runDirectly();

  if (directResult.status === 'success') {
    console.log('✔ Direct Synchronization Succeeded:');
    console.log(`  • Provider:       ${directResult.provider}`);
    console.log(`  • Records:        ${directResult.recordsStored} stored, ${directResult.recordsSkipped} skipped, ${directResult.recordsFetched} fetched`);
    console.log(`  • Duration:       ${directResult.durationMs}ms`);
    process.exit(0);
  } else if (directResult.status === 'skipped_locked') {
    console.warn(`⚠ Direct Synchronization Skipped: Lock held until ${directResult.lockedUntil}`);
    process.exit(0);
  } else {
    console.error(`❌ Direct Synchronization Failed: ${directResult.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Fatal sync error: ${err.message}`);
  process.exit(1);
});
