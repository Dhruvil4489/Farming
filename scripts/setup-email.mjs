#!/usr/bin/env node
/**
 * SmartFarm AI — Email Delivery Diagnostic & Configuration Guide
 * Usage: node scripts/setup-email.mjs
 *
 * What this script does:
 *  1. Reads current .env email configuration
 *  2. Diagnoses the exact delivery problem
 *  3. Tests SMTP or Resend connectivity
 *  4. Optionally sends a real test email
 *  5. Shows step-by-step setup guides for all supported providers
 *  6. Reports DNS/SPF requirements
 */

import { createTransport } from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ENV_PATH = resolve(process.cwd(), '.env');

// ── Load .env manually (without dotenv package) ───────────────────────────────
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

const SMTP_HOST = env.SMTP_HOST?.trim() || '';
const SMTP_PORT = parseInt(env.SMTP_PORT || '587', 10);
const SMTP_USER = env.SMTP_USER?.trim() || '';
const SMTP_PASS = env.SMTP_PASS?.trim() || '';
const SMTP_SECURE = SMTP_PORT === 465 || env.SMTP_SECURE === 'true';
const RESEND_KEY = env.RESEND_API_KEY?.trim() || '';
const EMAIL_FROM = env.EMAIL_FROM?.trim() || 'SmartFarm AI <no-reply@smartfarm.ai>';
const APP_URL = env.APP_URL?.trim() || 'http://localhost:3000';

const sep = '─'.repeat(70);

function banner(text) {
  console.log('\n' + sep);
  console.log('  ' + text);
  console.log(sep);
}

function ok(msg) { console.log('  ✅  ' + msg); }
function warn(msg) { console.log('  ⚠️   ' + msg); }
function err(msg) { console.log('  ❌  ' + msg); }
function info(msg) { console.log('  ℹ️   ' + msg); }
function step(msg) { console.log('\n  → ' + msg); }

// ── 1. DIAGNOSIS ─────────────────────────────────────────────────────────────
banner('SMARTFARM AI — EMAIL DELIVERY DIAGNOSTIC');

console.log('\n📋 Current Configuration:');
console.log(`   APP_URL      = ${APP_URL}`);
console.log(`   EMAIL_FROM   = ${EMAIL_FROM}`);
console.log(`   RESEND_KEY   = ${RESEND_KEY ? '***set***' : '(empty)'}`);
console.log(`   SMTP_HOST    = ${SMTP_HOST || '(empty)'}`);
console.log(`   SMTP_PORT    = ${SMTP_PORT}`);
console.log(`   SMTP_USER    = ${SMTP_USER || '(empty)'}`);
console.log(`   SMTP_PASS    = ${SMTP_PASS ? '***set***' : '(empty)'}`);
console.log(`   SMTP_SECURE  = ${SMTP_SECURE}`);

banner('PHASE 1 — ROOT CAUSE ANALYSIS');

if (!RESEND_KEY && !SMTP_HOST) {
  err('NO EMAIL PROVIDER CONFIGURED.');
  console.log(`
  This is the root cause of missing emails.

  Your .env file has NEITHER:
    • RESEND_API_KEY  (Resend HTTPS API)
    • SMTP_HOST       (SMTP server like Gmail, Brevo, Mailgun)

  Every email is recorded in EmailDeliveryLog with:
    status   = "simulated"
    provider = "local_outbox"

  This means emails are logged internally but NEVER sent to any inbox.
  The farmer's inbox receives nothing.

  RESOLUTION: Choose one of the providers below and add credentials to .env.
  `);
} else if (RESEND_KEY) {
  ok('Resend API key is configured. Testing connectivity...');
} else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  ok(`SMTP configured: ${SMTP_HOST}:${SMTP_PORT} (user: ${SMTP_USER})`);
} else {
  warn('SMTP_HOST is set but SMTP_USER or SMTP_PASS is missing. Email delivery will fail.');
}

// ── 2. CONNECTIVITY TEST ─────────────────────────────────────────────────────
if (RESEND_KEY) {
  banner('PHASE 2 — RESEND CONNECTIVITY TEST');
  step('Testing Resend API key...');
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${RESEND_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      ok(`Resend API key is VALID. ${body?.data?.length ?? 0} domain(s) registered.`);
      if (body?.data?.length > 0) {
        console.log('   Registered domains:');
        for (const d of body.data) {
          console.log(`     • ${d.name}  (status: ${d.status})`);
          if (d.status !== 'verified') {
            warn(`Domain "${d.name}" is not verified in Resend. Emails from this domain may not deliver.`);
          }
        }
      } else {
        warn('No domains registered in Resend. When sending from a custom domain, verify it at resend.com/domains');
        info('For testing you can send from onboarding@resend.dev to your own email (no domain verification needed).');
      }
    } else {
      err(`Resend API key REJECTED: ${body?.message || `HTTP ${res.status}`}`);
      info('Get a valid key at: https://resend.com/api-keys');
    }
  } catch (e) {
    err(`Resend connectivity FAILED: ${e?.message || e}`);
    info('Check your internet connection and that api.resend.com is reachable.');
  }
} else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  banner('PHASE 2 — SMTP CONNECTIVITY TEST');
  step(`Testing SMTP connection to ${SMTP_HOST}:${SMTP_PORT} (secure=${SMTP_SECURE})...`);
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
    ok('SMTP connection SUCCESSFUL! Credentials are valid and server is reachable.');
  } catch (e) {
    err(`SMTP connection FAILED: ${e?.message || e}`);
    console.log(`
  Common causes:
    1. Wrong SMTP_HOST — check your provider's exact hostname
    2. Wrong SMTP_PORT — try 587 (STARTTLS) or 465 (SSL)
    3. Wrong SMTP_USER/SMTP_PASS — verify credentials in your email provider dashboard
    4. For Gmail: you must use an App Password (not your Google account password)
       See: https://myaccount.google.com/apppasswords
    5. Firewall blocking outbound port 587 — try port 465 or use Resend
    `);
  }
}

// ── 3. PROVIDER SETUP GUIDES ─────────────────────────────────────────────────
banner('PHASE 3 — EMAIL PROVIDER SETUP GUIDES');

console.log(`
Choose ONE of these providers and add the variables to your .env file:
`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('OPTION A — RESEND (Recommended — Free tier: 100 emails/day, 3,000/month)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`
  1. Go to https://resend.com and sign up (free, no credit card needed)
  2. Create an API key at https://resend.com/api-keys
  3. Add to your .env:

     RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
     EMAIL_FROM="SmartFarm AI <noreply@yourdomain.com>"

  For testing without a custom domain, use:
     EMAIL_FROM="SmartFarm AI <onboarding@resend.dev>"

  To send from your own domain:
  4. Go to https://resend.com/domains → Add Domain → enter your domain
  5. Add the DNS records Resend shows you to your domain registrar
  6. Wait for domain to become "Verified"
  7. Update EMAIL_FROM to use your verified domain
`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('OPTION B — GMAIL (Using App Password — Free)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`
  IMPORTANT: You CANNOT use your regular Gmail password.
  You MUST create a Gmail App Password.

  1. Enable 2-Step Verification on your Google Account:
     https://myaccount.google.com/security

  2. Create an App Password:
     https://myaccount.google.com/apppasswords
     → Select app: "Mail" → Select device: "Other" → type "SmartFarm AI"
     → Click "Generate" → Copy the 16-character password

  3. Add to your .env:

     SMTP_HOST="smtp.gmail.com"
     SMTP_PORT="587"
     SMTP_SECURE="false"
     SMTP_USER="your.gmail@gmail.com"
     SMTP_PASS="xxxx xxxx xxxx xxxx"   ← 16-char App Password (spaces OK)
     EMAIL_FROM="SmartFarm AI <your.gmail@gmail.com>"

  Note: Gmail allows ~500 emails/day on personal accounts.
`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('OPTION C — BREVO / SENDINBLUE (Free: 300 emails/day)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`
  1. Sign up at https://app.brevo.com (free account)
  2. Go to: Account → SMTP & API → SMTP
  3. Note your SMTP key (use it as SMTP_PASS)
  4. Add to your .env:

     SMTP_HOST="smtp-relay.brevo.com"
     SMTP_PORT="587"
     SMTP_SECURE="false"
     SMTP_USER="your-brevo-login@example.com"
     SMTP_PASS="xsmtpsib-xxxxxxxxxxxxxxxx"
     EMAIL_FROM="SmartFarm AI <noreply@yourdomain.com>"
`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('OPTION D — MAILGUN (Free: 100 emails/day, 5,000/month for 3 months)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`
  1. Sign up at https://mailgun.com
  2. Add and verify your domain
  3. Get SMTP credentials from: Sending → Domain Settings → SMTP credentials
  4. Add to your .env:

     SMTP_HOST="smtp.mailgun.org"
     SMTP_PORT="587"
     SMTP_SECURE="false"
     SMTP_USER="postmaster@mg.yourdomain.com"
     SMTP_PASS="your-mailgun-smtp-password"
     EMAIL_FROM="SmartFarm AI <noreply@mg.yourdomain.com>"
`);

// ── 4. DNS / SPF / DKIM REQUIREMENTS ────────────────────────────────────────
banner('PHASE 4 — DNS, SPF, DKIM & DMARC REQUIREMENTS');
console.log(`
To ensure emails don't land in spam, your sending domain needs proper DNS records.

For Google Gmail senders reading this:
Google requires all bulk senders to have SPF, DKIM, and DMARC configured.
See: https://support.google.com/mail/answer/81126

WHAT EACH RECORD DOES:
  SPF   — Lists which servers are allowed to send email for your domain
  DKIM  — Cryptographic signature proving email wasn't tampered with
  DMARC — Policy telling receivers what to do with unauthenticated email

PROVIDER-MANAGED SETUP (Recommended):
  • Resend: Provides exact DNS records to add after domain verification
  • Brevo:  Shows required DNS records in Account → Senders & IP → Domains
  • Mailgun: Shows SPF, DKIM, DMARC records in Domain Settings

For Gmail @gmail.com senders:
  Google handles SPF and DKIM automatically for gmail.com.
  No DNS changes needed if you send FROM your @gmail.com address.

For custom domain senders (e.g., noreply@yourdomain.com):
  Add these records to your domain DNS panel (Cloudflare, GoDaddy, Namecheap, etc.):

  TYPE   NAME       VALUE
  TXT    @          v=spf1 include:[your-provider-spf] ~all
  TXT    [dkim]._domainkey.[yourdomain]   p=[your-provider-public-key]
  TXT    _dmarc     v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com

  → Get exact values from your chosen provider's setup wizard.
  → Never invent or guess DNS values.
`);

// ── 5. CURRENT USER STATUS ────────────────────────────────────────────────────
banner('PHASE 5 — PENDING VERIFICATION');
console.log(`
  User:  Karan Patel <dhruv99h@gmail.com>
  ID:    58609b27-a4b3-4e69-8a9b-e6af84f7029f
  Since: 2026-11-18 (account created but not yet verified)

  This account has 3 simulated verification emails in EmailDeliveryLog
  (none were actually delivered because no provider is configured).

  After configuring your email provider, ask Karan to:
    1. Click "Resend Verification Email" on the SmartFarm AI login page
    2. OR go to: ${APP_URL}/verify-email
    3. Enter their email dhruv99h@gmail.com and click Resend

  A real verification email will then be sent to dhruv99h@gmail.com.
`);

// ── 6. NEXT STEPS ─────────────────────────────────────────────────────────────
banner('NEXT STEPS (in order)');
console.log(`
  1. Choose a provider from OPTION A, B, C, or D above.

  2. Add the required environment variables to your .env file:
     ${ENV_PATH}

  3. Restart your development server:
        # Stop it (Ctrl+C) and run:
        npm run dev

  4. Test email delivery:
        node scripts/test-email-delivery.mjs --to your@email.com

  5. Ask Karan Patel (dhruv99h@gmail.com) to click "Resend Verification Email"
     on the login page — the real email will now reach their inbox.

  6. For production deployment, also set:
        APP_URL="https://your-production-domain.com"
     so verification links point to the live site, not localhost.
`);

banner('DIAGNOSTIC COMPLETE');
