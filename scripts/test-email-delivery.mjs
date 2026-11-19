#!/usr/bin/env node
/**
 * SmartFarm AI — Real Email Delivery Test
 * Usage: node scripts/test-email-delivery.mjs --to recipient@example.com
 *
 * Sends a real test verification email using the provider configured in .env.
 * Requires SMTP or RESEND_API_KEY to be configured.
 */

import { createTransport } from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ENV_PATH = resolve(process.cwd(), '.env');

function loadEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const lines = readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const toArg = process.argv.find(a => a.startsWith('--to='))?.split('=')[1] ||
              process.argv[process.argv.indexOf('--to') + 1];

if (!toArg || !toArg.includes('@')) {
  console.error('Usage: node scripts/test-email-delivery.mjs --to recipient@example.com');
  process.exit(1);
}

const toEmail = toArg.trim().toLowerCase();
const fromEmail = env.EMAIL_FROM?.trim() || 'SmartFarm AI <no-reply@smartfarm.ai>';
const RESEND_KEY = env.RESEND_API_KEY?.trim() || '';
const SMTP_HOST = env.SMTP_HOST?.trim() || '';
const SMTP_PORT = parseInt(env.SMTP_PORT || '587', 10);
const SMTP_USER = env.SMTP_USER?.trim() || '';
const SMTP_PASS = env.SMTP_PASS?.trim() || '';
const SMTP_SECURE = SMTP_PORT === 465 || env.SMTP_SECURE === 'true';

const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;padding:32px;">
<h2 style="color:#143D2A;">🌱 SmartFarm AI — Email Delivery Test</h2>
<p>This is a test email confirming that your SmartFarm AI email delivery is working correctly.</p>
<div style="background:#ECFDF5;border:2px solid #6EE7B7;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
  <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#065F46;font-family:monospace;">123456</div>
  <div style="font-size:12px;color:#6B7280;margin-top:6px;">Sample OTP (this is a test — not a real code)</div>
</div>
<p style="color:#57534E;font-size:13px;">
  Sent at: ${new Date().toISOString()}<br>
  To: ${toEmail}<br>
  Provider: ${RESEND_KEY ? 'Resend' : (SMTP_HOST ? `SMTP (${SMTP_HOST}:${SMTP_PORT})` : 'UNCONFIGURED')}
</p>
</body></html>`;

const text = `SmartFarm AI — Email Delivery Test\n\nIf you receive this, email delivery is working correctly.\nSent at: ${new Date().toISOString()}\nTo: ${toEmail}`;

console.log(`\n🚀 SmartFarm AI — Email Delivery Test`);
console.log(`   From: ${fromEmail}`);
console.log(`   To:   ${toEmail}`);

if (RESEND_KEY) {
  console.log(`   Provider: Resend HTTPS API\n`);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: [toEmail], subject: 'SmartFarm AI — Email Delivery Test', html, text }),
      signal: AbortSignal.timeout(12000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`✅ SUCCESS! Email sent via Resend.`);
      console.log(`   Message ID: ${body?.id}`);
      console.log(`\n   → Check the inbox of ${toEmail}`);
    } else {
      console.error(`❌ FAILED: ${body?.message || `HTTP ${res.status}`}`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ ERROR: ${e?.message || e}`);
    process.exit(1);
  }
} else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  console.log(`   Provider: SMTP (${SMTP_HOST}:${SMTP_PORT}, secure=${SMTP_SECURE})\n`);
  try {
    const transporter = createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 15000,
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    console.log(`   SMTP connection: OK`);
    const info = await transporter.sendMail({ from: fromEmail, to: toEmail, subject: 'SmartFarm AI — Email Delivery Test', html, text });
    console.log(`✅ SUCCESS! Email sent via SMTP.`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`\n   → Check the inbox of ${toEmail}`);
  } catch (e) {
    console.error(`❌ FAILED: ${e?.message || e}`);
    console.error(`\nCommon fixes:`);
    console.error(`  • Gmail: Use an App Password (not your login password) — https://myaccount.google.com/apppasswords`);
    console.error(`  • Brevo: Use your SMTP key from Account → SMTP & API`);
    console.error(`  • Port 587: set SMTP_SECURE=false | Port 465: set SMTP_SECURE=true`);
    process.exit(1);
  }
} else {
  console.error(`\n❌ NO EMAIL PROVIDER CONFIGURED.`);
  console.error(`   Set RESEND_API_KEY or SMTP_HOST+SMTP_USER+SMTP_PASS in .env`);
  console.error(`   Run: node scripts/setup-email.mjs for setup instructions`);
  process.exit(1);
}
