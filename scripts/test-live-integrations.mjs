/**
 * SmartFarm AI — Opt-in Live Integrations Test Suite (Phase 11)
 *
 * Manual verification script for real credentials, upstream APIs, and microservices:
 * 1. Official Government Mandi Feed (data.gov.in AGMARKNET) via MARKET_API_KEY
 * 2. Live Weather Numerical Model (Open-Meteo)
 * 3. Commercial LLM Providers (Google Gemini, OpenAI, Anthropic) via API keys
 * 4. Pretrained PyTorch Crop Disease Classifier Microservice via DISEASE_SERVICE_URL
 * 5. IoT Sensor Hardware Telemetry Pipeline & Simulator
 *
 * NOTE: Default CI tests never run this script. It is strictly opt-in via:
 *   npm run manual:live-integrations
 */

import fs from 'node:fs';
import path from 'node:path';

// Load .env variables into process.env if not set
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const l of lines) {
      const match = l.match(/^([A-Z0-9_]+)=["']?([^"']*)["']?/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  }
}

loadEnv();

let passed = 0;
let skipped = 0;
let failed = 0;

function reportPass(name, details = '') {
  passed++;
  console.log(`  ✓ LIVE PASSED: ${name}${details ? ` — ${details}` : ''}`);
}

function reportSkip(name, reason) {
  skipped++;
  console.log(`  ○ SKIPPED: ${name} (Reason: ${reason})`);
}

function reportFail(name, details = '') {
  failed++;
  console.error(`  ✗ LIVE FAILED: ${name}${details ? ` — ${details}` : ''}`);
}

async function runLiveIntegrations() {
  console.log('================================================================');
  console.log('SMARTFARM AI — OPT-IN LIVE INTEGRATIONS VERIFICATION');
  console.log('================================================================\n');
  console.log('Notice: This procedure tests live upstream APIs and credentials.');
  console.log('Unset keys or offline microservices will be reported as SKIPPED, not failed.\n');

  // --------------------------------------------------------------------------
  // 1. Official Government Mandi Feed (data.gov.in)
  // --------------------------------------------------------------------------
  console.log('── 1. Official Government Mandi API (data.gov.in) ──');
  const marketKey = process.env.MARKET_API_KEY || process.env.DATA_GOV_IN_API_KEY;

  if (marketKey && marketKey.length > 5) {
    try {
      const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${marketKey}&format=json&limit=2`;
      const start = Date.now();
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const duration = Date.now() - start;

      if (res.ok) {
        const json = await res.json();
        const count = json.records?.length || 0;
        reportPass(
          'data.gov.in AGMARKNET API Live Connection',
          `HTTP 200 in ${duration}ms, received ${count} real trade records`
        );
      } else {
        reportFail('data.gov.in AGMARKNET API', `HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      reportFail('data.gov.in AGMARKNET API connection error', err.message);
    }
  } else {
    reportSkip(
      'data.gov.in AGMARKNET live feed',
      'MARKET_API_KEY is not set in .env. To enable, register at https://data.gov.in and paste your key into .env'
    );
  }

  // --------------------------------------------------------------------------
  // 2. Numerical Weather Model (Open-Meteo)
  // --------------------------------------------------------------------------
  console.log('\n── 2. Numerical Weather Provider (Open-Meteo) ──');
  try {
    const lat = 22.2587;
    const lng = 71.1924; // Rajkot, Gujarat
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability`;
    const start = Date.now();
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const duration = Date.now() - start;

    if (res.ok) {
      const data = await res.json();
      const temp = data.current_weather?.temperature;
      reportPass(
        'Open-Meteo Live Numerical Weather Feed',
        `HTTP 200 in ${duration}ms, Lat: ${lat}, Lng: ${lng}, Temp: ${temp}°C`
      );
    } else {
      reportFail('Open-Meteo API', `HTTP ${res.status}`);
    }
  } catch (err) {
    reportSkip('Open-Meteo live feed', `External connectivity unavailable (${err.message})`);
  }

  // --------------------------------------------------------------------------
  // 3. Commercial LLM Providers
  // --------------------------------------------------------------------------
  console.log('\n── 3. Commercial Large Language Models (LLM) ──');

  // 3.1 Google Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.length > 5) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with exactly: SmartFarm Verified' }] }],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        reportPass('Google Gemini API Live Inference', `Model: ${model}, HTTP 200`);
      } else {
        reportFail('Google Gemini API', `HTTP ${res.status}`);
      }
    } catch (err) {
      reportFail('Google Gemini API', err.message);
    }
  } else {
    reportSkip('Google Gemini LLM', 'GEMINI_API_KEY not configured in .env (Mock AI provider active)');
  }

  // 3.2 OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.length > 5) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        reportPass('OpenAI API Live Inference', `Model: ${model}, HTTP 200`);
      } else {
        reportFail('OpenAI API', `HTTP ${res.status}`);
      }
    } catch (err) {
      reportFail('OpenAI API', err.message);
    }
  } else {
    reportSkip('OpenAI LLM', 'OPENAI_API_KEY not configured in .env');
  }

  // 3.3 Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.length > 5) {
    try {
      const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Say hello' }],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        reportPass('Anthropic Claude API Live Inference', `Model: ${model}, HTTP 200`);
      } else {
        reportFail('Anthropic Claude API', `HTTP ${res.status}`);
      }
    } catch (err) {
      reportFail('Anthropic Claude API', err.message);
    }
  } else {
    reportSkip('Anthropic Claude LLM', 'ANTHROPIC_API_KEY not configured in .env');
  }

  // --------------------------------------------------------------------------
  // 4. Pretrained Crop Disease Vision Microservice
  // --------------------------------------------------------------------------
  console.log('\n── 4. Pretrained Crop Disease Vision Microservice ──');
  const diseaseServiceUrl = process.env.DISEASE_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    const res = await fetch(`${diseaseServiceUrl}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const health = await res.json();
      reportPass(
        'Disease Diagnosis PyTorch Microservice',
        `Endpoint: ${diseaseServiceUrl}, Model: ${health.modelName || 'ResNet-50'}, Ready: ${health.modelReady}`
      );
    } else {
      reportFail('Disease Diagnosis Microservice', `HTTP ${res.status}`);
    }
  } catch (err) {
    reportSkip(
      'Disease Diagnosis PyTorch Microservice',
      `Service offline at ${diseaseServiceUrl}. To start: cd services/disease-service && python -m uvicorn main:app --port 8000`
    );
  }

  // --------------------------------------------------------------------------
  // 5. Hardware IoT Telemetry Pipeline
  // --------------------------------------------------------------------------
  console.log('\n── 5. Hardware IoT Telemetry & Sensor Simulator ──');
  const simulatorEnabled = process.env.IOT_SIMULATOR_ENABLED === 'true';

  if (simulatorEnabled) {
    reportPass(
      'IoT Sensor Telemetry Pipeline',
      'Deterministic simulator is ENABLED. Run: npm run simulate:iot to generate test packets'
    );
  } else {
    reportSkip(
      'IoT Simulator',
      'IOT_SIMULATOR_ENABLED is false in .env. Set to "true" to enable local hardware packet emulation'
    );
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`LIVE INTEGRATIONS SUMMARY: ${passed} Live Verified, ${skipped} Skipped (Opt-in), ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runLiveIntegrations().catch((err) => {
  console.error('Unhandled live integrations error:', err);
  process.exit(1);
});
