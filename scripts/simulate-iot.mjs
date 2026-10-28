#!/usr/bin/env node
/**
 * SmartFarm AI — Deterministic IoT Sensor Hardware Simulator
 *
 * Emits physical-like telemetry sequences through the EXACT SAME authenticated
 * HTTP endpoint (/api/v1/iot/telemetry) as physical ESP32 field hardware.
 *
 * Scenarios supported:
 *   --scenario=dry_to_wet         (Soil depletion from 65% to 22%, followed by irrigation spike to 78%)
 *   --scenario=diurnal_weather    (Day/night solar cycle: temp rise, humidity drop, light peak)
 *   --scenario=missing_sensor     (Partial telemetry: moisture only, missing ambient sensors)
 *   --scenario=duplicate_retry    (Tests idempotency by repeating identical eventId)
 *   --scenario=invalid_payload    (Emits invalid numeric range to test 422 rejection)
 *   --scenario=revoked_device     (Tests 403 rejection on revoked hardware status)
 *
 * Usage:
 *   node scripts/simulate-iot.mjs --scenario=dry_to_wet --count=6
 *   node scripts/simulate-iot.mjs --scenario=duplicate_retry
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

// 1. Environment bootstrap
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
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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

// Parse CLI flags
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=')[1] : def;
};
const hasFlag = (name) => args.includes(`--${name}`);

const scenario = getArg('scenario', 'dry_to_wet');
const countArg = parseInt(getArg('count', '0'), 10);
const delayMs = parseInt(getArg('delay', '200'), 10);
const force = hasFlag('force');
const BASE_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
const INGEST_URL = `${BASE_URL.replace(/\/$/, '')}/api/v1/iot/telemetry`;

// 2. Production Safety Guard
const isProd = process.env.NODE_ENV === 'production';
const isSimulatorEnabled = process.env.IOT_SIMULATOR_ENABLED === 'true' || process.env.IOT_SIMULATOR_ENABLED === '1';

if (isProd && !isSimulatorEnabled && !force) {
  console.error('❌ IoT Simulator is disabled in production environments.');
  console.error('   To enable, set IOT_SIMULATOR_ENABLED=true in .env or pass --force.');
  process.exit(1);
}

// 3. Demo Device Credentials
const DEMO_DEVICE_CODE = 'SIM-ESP32-DEMO-01';
const DEMO_BEARER_TOKEN = 'sf_dev_demo_test_token_2026_deterministic_simulation';
const DEMO_TOKEN_HASH = crypto.createHash('sha256').update(DEMO_BEARER_TOKEN).digest('hex');

async function ensureDemoDevice(prisma) {
  let device = await prisma.iotDevice.findUnique({
    where: { deviceCode: DEMO_DEVICE_CODE },
    include: { field: true },
  });

  if (!device) {
    // Find an existing field to pair with
    const field = await prisma.field.findFirst({
      include: { farm: true },
    });

    if (!field) {
      throw new Error('No field found in database. Please seed the database first (npm run seed).');
    }

    device = await prisma.iotDevice.create({
      data: {
        deviceCode: DEMO_DEVICE_CODE,
        name: 'Simulated ESP32 Probe (Demo Field)',
        hardwareModel: 'ESP32-SoilV1-Simulated',
        farmId: field.farmId,
        fieldId: field.id,
        tokenHash: DEMO_TOKEN_HASH,
        status: 'active',
        isDemo: true,
        batteryVoltage: 3.95,
        calibrationJson: JSON.stringify({ rawDry: 3200, rawWet: 1400, version: 1 }),
      },
      include: { field: true },
    });
    console.log(`[Simulator] Created demo device ${DEMO_DEVICE_CODE} paired to field "${field.name}" (isDemo: true)`);
  }

  return device;
}

// 4. Deterministic Telemetry Generators
function generatePackets(scenarioType, limit) {
  const baseTime = Date.now();
  const packets = [];

  switch (scenarioType) {
    case 'dry_to_wet': {
      // 8-step sequence: Drying cycle (62% down to 21%), then irrigation pulse (up to 75%)
      const moistureCurve = [62.4, 54.1, 44.8, 33.5, 24.2, 21.0, 75.8, 72.3];
      const steps = limit > 0 ? Math.min(limit, moistureCurve.length) : moistureCurve.length;

      for (let i = 0; i < steps; i++) {
        const mTime = new Date(baseTime - (steps - 1 - i) * 3600 * 1000);
        const mPct = moistureCurve[i];
        // Raw ADC inversely proportional to capacitance in typical FDR sensors
        const mRaw = Math.round(3200 - (mPct / 100) * 1800);
        packets.push({
          eventId: `evt_d2w_${i}_${Date.now()}`,
          measuredAt: mTime.toISOString(),
          soilMoistureRaw: mRaw,
          soilMoisturePct: mPct,
          depthCm: 15,
          airTempC: 28.5 + (i % 3) * 1.5,
          airHumidityPct: 58.0 - (i % 3) * 4.0,
          lightLux: 35000 + i * 2000,
          batteryVoltage: 3.92 - i * 0.01,
          batteryPct: Math.round(85 - i * 0.5),
          waterLevelSwitch: mPct > 70.0,
        });
      }
      break;
    }

    case 'diurnal_weather': {
      // 6-step diurnal solar progression
      const steps = limit > 0 ? limit : 6;
      for (let i = 0; i < steps; i++) {
        const hourOffset = (i * 3) % 24;
        const temp = Math.round((22 + 14 * Math.sin((hourOffset / 24) * Math.PI)) * 10) / 10;
        const humidity = Math.round((85 - 45 * Math.sin((hourOffset / 24) * Math.PI)) * 10) / 10;
        const lux = Math.max(0, Math.round(75000 * Math.sin((hourOffset / 24) * Math.PI)));

        packets.push({
          eventId: `evt_diurnal_${i}_${Date.now()}`,
          measuredAt: new Date(baseTime - (steps - 1 - i) * 3600 * 1000).toISOString(),
          soilMoistureRaw: 2100,
          soilMoisturePct: 45.0,
          depthCm: 15,
          airTempC: temp,
          airHumidityPct: humidity,
          lightLux: lux,
          batteryVoltage: 3.90,
          batteryPct: 82,
        });
      }
      break;
    }

    case 'missing_sensor': {
      // Packets containing only soil moisture (no ambient temperature, humidity, or lux)
      const steps = limit > 0 ? limit : 4;
      for (let i = 0; i < steps; i++) {
        packets.push({
          eventId: `evt_missing_${i}_${Date.now()}`,
          measuredAt: new Date(baseTime - (steps - 1 - i) * 1800 * 1000).toISOString(),
          soilMoistureRaw: 2250,
          soilMoisturePct: 38.5,
          depthCm: 15,
          batteryVoltage: 3.88,
          // Intentionally omitting airTempC, airHumidityPct, lightLux
        });
      }
      break;
    }

    case 'duplicate_retry': {
      // Generates one packet with a fixed eventId that will be sent multiple times
      const fixedEventId = `evt_idempotency_fixed_${Date.now()}`;
      const payload = {
        eventId: fixedEventId,
        measuredAt: new Date().toISOString(),
        soilMoistureRaw: 2150,
        soilMoisturePct: 48.0,
        depthCm: 15,
        airTempC: 30.2,
        airHumidityPct: 60.5,
        batteryVoltage: 3.91,
      };
      packets.push(payload, payload); // Identical packet duplicated
      break;
    }

    case 'invalid_payload': {
      // Emits packet with out-of-range impossible value
      packets.push({
        eventId: `evt_invalid_${Date.now()}`,
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 999.0, // Exceeds schema max 150
        airTempC: 180.0, // Exceeds schema max 85
      });
      break;
    }

    case 'revoked_device': {
      packets.push({
        eventId: `evt_revoked_${Date.now()}`,
        measuredAt: new Date().toISOString(),
        soilMoisturePct: 40.0,
      });
      break;
    }

    default:
      throw new Error(`Unknown scenario: ${scenarioType}`);
  }

  return packets;
}

// 5. Execution Runner
async function run() {
  console.log('========================================================');
  console.log('  SmartFarm AI — IoT Sensor Telemetry Simulator        ');
  console.log('========================================================');
  console.log(`Scenario:       ${scenario}`);
  console.log(`Target URL:     ${INGEST_URL}`);
  console.log(`Timestamp:      ${new Date().toISOString()}`);

  const prisma = new PrismaClient();
  let device;

  try {
    device = await ensureDemoDevice(prisma);
  } finally {
    await prisma.$disconnect();
  }

  // Handle revoked_device test setup
  if (scenario === 'revoked_device') {
    const p = new PrismaClient();
    await p.iotDevice.update({
      where: { id: device.id },
      data: { status: 'revoked' },
    });
    await p.$disconnect();
    console.log(`[Simulator] Temporarily set device status to "revoked"`);
  }

  const packets = generatePackets(scenario, countArg);
  console.log(`Generated ${packets.length} packet(s) for simulation.\n`);

  let successCount = 0;
  let duplicateCount = 0;
  let rejectedCount = 0;

  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i];
    process.stdout.write(`  [${i + 1}/${packets.length}] Sending packet (${packet.eventId || 'no-event-id'})... `);

    try {
      const res = await fetch(INGEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEMO_BEARER_TOKEN}`,
        },
        body: JSON.stringify(packet),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 200) {
        if (json.meta?.idempotent) {
          duplicateCount++;
          console.log(`✔ HTTP 200 (IDEMPOTENT DUPLICATE ACKNOWLEDGED)`);
        } else {
          successCount++;
          console.log(`✔ HTTP 200 (STORED - Reading ID: ${json.data?.id?.substring(0, 8)}... Moists: ${packet.soilMoisturePct ?? 'N/A'}%)`);
        }
      } else if (res.status === 422) {
        rejectedCount++;
        console.log(`⚠ HTTP 422 EXPECTED VALIDATION REJECTION: ${json.error?.message || 'Validation error'}`);
      } else if (res.status === 403) {
        rejectedCount++;
        console.log(`⚠ HTTP 403 EXPECTED REVOKED DEVICE REJECTION: ${json.error?.message}`);
      } else {
        rejectedCount++;
        console.log(`❌ HTTP ${res.status}: ${json.error?.message || res.statusText}`);
      }
    } catch (err) {
      console.log(`❌ CONNECTION ERROR: ${err.message}`);
      rejectedCount++;
    }

    if (delayMs > 0 && i < packets.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  // Restore device to active if revoked_device test was run
  if (scenario === 'revoked_device') {
    const p = new PrismaClient();
    await p.iotDevice.update({
      where: { id: device.id },
      data: { status: 'active' },
    });
    await p.$disconnect();
    console.log(`\n[Simulator] Restored device status to "active"`);
  }

  console.log('\n========================================================');
  console.log(`  Simulation Summary:`);
  console.log(`  • Stored:      ${successCount}`);
  console.log(`  • Idempotent:  ${duplicateCount}`);
  console.log(`  • Rejections:  ${rejectedCount}`);
  console.log(`  • Total:       ${packets.length}`);
  console.log('========================================================\n');
}

run().catch((err) => {
  console.error('Fatal simulator error:', err.message);
  process.exit(1);
});
