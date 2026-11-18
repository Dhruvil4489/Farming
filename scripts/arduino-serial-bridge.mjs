#!/usr/bin/env node
/**
 * SmartFarm AI — Arduino Uno USB Serial to Cloud Bridge
 * =====================================================
 * Reads newline-delimited JSON from the Arduino Uno via USB Serial (9600 baud)
 * and dispatches authenticated HTTP POST telemetry to the SmartFarm AI backend.
 * 
 * Hardware Data Flow:
 * -------------------
 * Capacitive Sensor v1.2 -> Arduino Uno (A0) -> USB Serial (9600 baud)
 *   -> This Node.js Bridge -> POST http://localhost:3000/api/v1/iot/telemetry
 *   -> Prisma Database -> SmartFarm AI Farmer Dashboard
 * 
 * Usage:
 *   node scripts/arduino-serial-bridge.mjs                 # Auto-detects COM port
 *   node scripts/arduino-serial-bridge.mjs --port=COM3     # Explicit COM port
 *   node scripts/arduino-serial-bridge.mjs --demo          # Software simulation mode
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_BAUD_RATE = 9600;
const DEFAULT_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api/v1/iot/telemetry';
const DEFAULT_TOKEN = process.env.IOT_BEARER_TOKEN || 'sf_dev_demo_test_token_2026_deterministic_simulation';

// Parse command line arguments
const args = process.argv.slice(2);
const isDemoMode = args.includes('--demo') || args.includes('--simulate');
let targetPortName = null;
let baudRate = DEFAULT_BAUD_RATE;
let endpoint = DEFAULT_ENDPOINT;
let bearerToken = DEFAULT_TOKEN;

for (const arg of args) {
  if (arg.startsWith('--port=')) targetPortName = arg.split('=')[1];
  if (arg.startsWith('--baud=')) baudRate = parseInt(arg.split('=')[1], 10) || DEFAULT_BAUD_RATE;
  if (arg.startsWith('--endpoint=')) endpoint = arg.split('=')[1];
  if (arg.startsWith('--token=')) bearerToken = arg.split('=')[1];
}

console.log('================================================================');
console.log('🌾 SMARTFARM AI — ARDUINO UNO HARDWARE SERIAL BRIDGE');
console.log('================================================================');
console.log(`📡 Ingestion Target : ${endpoint}`);
console.log(`🔑 Bearer Token    : ${bearerToken.slice(0, 15)}...`);
console.log(`⚙️  Baud Rate       : ${baudRate}`);
console.log(`💧 Pump Safety Mode : NOT_CONNECTED (Circuit Protection Active)`);
console.log('----------------------------------------------------------------\n');

/**
 * Dispatches normalized telemetry packet to Next.js API
 */
async function dispatchTelemetry(rawPacket) {
  const deviceId = rawPacket.deviceId || rawPacket.deviceCode || 'UNO-001';
  const moistureRaw = rawPacket.moistureRaw !== undefined ? rawPacket.moistureRaw : rawPacket.soilMoistureRaw;
  const moisturePct = rawPacket.moisturePct !== undefined ? rawPacket.moisturePct : rawPacket.soilMoisturePct;
  const soilStatus = rawPacket.soilStatus || (moisturePct < 30 ? 'DRY' : moisturePct > 60 ? 'WET' : 'MODERATE');
  const recommendation = rawPacket.recommendation || (moisturePct < 30 ? 'IRRIGATION_RECOMMENDED' : 'MONITOR_SOIL');
  const pumpState = rawPacket.pumpState || 'NOT_CONNECTED';

  const eventId = `uno-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const measuredAt = new Date().toISOString();

  const payload = {
    eventId,
    measuredAt,
    soilMoistureRaw: Math.round(Number(moistureRaw) || 0),
    soilMoisturePct: Math.round((Number(moisturePct) || 0) * 100) / 100,
    depthCm: Number(rawPacket.depthCm) || 15,
    airTempC: rawPacket.airTempC !== undefined ? Number(rawPacket.airTempC) : undefined,
    airHumidityPct: rawPacket.airHumidityPct !== undefined ? Number(rawPacket.airHumidityPct) : undefined,
    batteryMv: Number(rawPacket.batteryMv) || 5000,
  };

  const startTime = Date.now();
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(payload),
    });

    const elapsed = Date.now() - startTime;
    const json = await res.json().catch(() => ({}));

    if (res.ok) {
      const qStatus = json.data?.qualityStatus || 'clean';
      const readingId = json.data?.id ? json.data.id.slice(0, 8) : 'ok';
      console.log(
        `[${new Date().toLocaleTimeString()}] ✔ TELEMETRY INGESTED [${deviceId}] | Raw: ${payload.soilMoistureRaw} | Moisture: ${payload.soilMoisturePct}% | Status: ${soilStatus} | Advice: ${recommendation} | Pump: ${pumpState} | Quality: ${qStatus} (${elapsed}ms)`
      );
      if (soilStatus === 'DRY') {
        console.warn(`  ⚠️  [NOTIFICATION] Dry soil detected (${payload.soilMoisturePct}%) -> Irrigation Recommended alert active on Dashboard!`);
      }
    } else {
      console.error(
        `[${new Date().toLocaleTimeString()}] ❌ INGESTION REJECTED (${res.status}): ${json.error?.message || json.message || 'Unknown error'}`
      );
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ NETWORK ERROR: ${err.message}`);
  }
}

/**
 * Runs software simulation mode when physical hardware is disconnected
 */
function runSimulationMode() {
  console.log('ℹ️  Running in DEMO / SIMULATION mode (no physical COM port required).');
  console.log('Emitting physical-like soil moisture sequence every 2.5 seconds...\n');

  let currentMoisturePct = 28.0; // Starts dry to demonstrate immediate alert!
  let rawAdc = 520;

  setInterval(async () => {
    // Slowly fluctuate around demo levels
    currentMoisturePct = Math.round((currentMoisturePct + (Math.random() * 2 - 1)) * 10) / 10;
    if (currentMoisturePct < 15) currentMoisturePct = 22;
    if (currentMoisturePct > 65) currentMoisturePct = 32;

    const mockPacket = {
      deviceId: 'UNO-001',
      moistureRaw: rawAdc,
      moisturePct: currentMoisturePct,
      soilStatus: currentMoisturePct < 30 ? 'DRY' : currentMoisturePct > 60 ? 'WET' : 'MODERATE',
      recommendation: currentMoisturePct < 30 ? 'IRRIGATION_RECOMMENDED' : 'MONITOR_SOIL',
      pumpState: 'NOT_CONNECTED',
      mode: 'MONITORING',
    };

    await dispatchTelemetry(mockPacket);
  }, 2500);
}

/**
 * Discovers and connects to physical Arduino serial port
 */
async function startSerialBridge() {
  if (isDemoMode) {
    runSimulationMode();
    return;
  }

  let SerialPortPkg;
  let ReadlineParserPkg;
  try {
    const sp = await import('serialport');
    SerialPortPkg = sp.SerialPort;
    const pr = await import('@serialport/parser-readline');
    ReadlineParserPkg = pr.ReadlineParser;
  } catch {
    console.warn('⚠️  "serialport" package not detected or native build unavailable.');
    console.log('Switching automatically to fallback simulation mode.\n');
    runSimulationMode();
    return;
  }

  // List available serial ports
  const ports = await SerialPortPkg.list();
  if (ports.length === 0 && !targetPortName) {
    console.warn('⚠️  No active COM / Serial ports detected on this computer.');
    console.log('Possible causes:');
    console.log('  1. Arduino Uno is not connected via USB cable.');
    console.log('  2. CH340 / FTDI USB-to-Serial drivers are not installed.');
    console.log('\nStarting software simulation mode instead so testing can proceed...');
    runSimulationMode();
    return;
  }

  console.log('🔍 Detected COM Ports:');
  for (const p of ports) {
    console.log(`   - ${p.path} [${p.manufacturer || p.friendlyName || 'Unknown Device'}]`);
  }

  // Resolve target port
  let selectedPort = targetPortName;
  if (!selectedPort) {
    const arduinoPort = ports.find(
      (p) =>
        (p.manufacturer && p.manufacturer.toLowerCase().includes('arduino')) ||
        (p.friendlyName && p.friendlyName.toLowerCase().includes('arduino')) ||
        (p.friendlyName && p.friendlyName.toLowerCase().includes('ch340'))
    );
    selectedPort = arduinoPort ? arduinoPort.path : ports[0].path;
  }

  console.log(`\n🔌 Connecting to Arduino Uno on ${selectedPort} at ${baudRate} baud...`);

  const port = new SerialPortPkg({
    path: selectedPort,
    baudRate,
    autoOpen: true,
  });

  const parser = port.pipe(new ReadlineParserPkg({ delimiter: '\r\n' }));

  port.on('open', () => {
    console.log(`✅ Serial port ${selectedPort} opened successfully!`);
    console.log('Listening for JSON telemetry lines from Arduino Uno (Close Arduino Serial Monitor!)...\n');
  });

  port.on('error', (err) => {
    console.error(`❌ Serial Port Error: ${err.message}`);
    console.log('Switching to software simulation mode...\n');
    runSimulationMode();
  });

  parser.on('data', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.event === 'DEVICE_STARTED' || parsed.event === 'boot') {
          console.log(`🚀 [ARDUINO BOOT] Device ${parsed.deviceId || parsed.device} started in MONITORING mode`);
          return;
        }
        if (parsed.moistureRaw !== undefined || parsed.soilMoistureRaw !== undefined) {
          await dispatchTelemetry(parsed);
        }
      } catch {
        console.warn(`[SERIAL RAW] Malformed line: ${trimmed}`);
      }
    } else {
      console.log(`[ARDUINO DEBUG] ${trimmed}`);
    }
  });
}

startSerialBridge();
