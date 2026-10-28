# SmartFarm AI — Mandi Market Price Scheduler & Operational Guide

## Overview

SmartFarm AI synchronizes wholesale mandi prices from the official Government of India Open Data Platform (`data.gov.in`) and the Directorate of Marketing and Inspection (DMI) AGMARKNET resource.

Because AGMARKNET is a daily wholesale trading reporting system—where Agriculture Produce Market Committees (APMCs) submit minimum, maximum, and modal transaction prices following auction closure—data updates occur once or twice daily. Polling on a second-by-second basis is inappropriate and risks IP rate limits (HTTP 429).

This document details:
1. The official cadence and cron expressions in UTC and Indian Standard Time (`Asia/Kolkata`).
2. Timing-safe HTTP trigger authentication (`CRON_SECRET`).
3. Database-backed run guards and idempotency safeguards.
4. Deployment configurations for Linux Crontab, Systemd Timers, GitHub Actions, Vercel Cron, Container Cron, and Cloud Webhooks.
5. Local manual synchronization commands (`npm run market:sync`).

---

## 1. Cadence & Cron Expressions

AGMARKNET APMC physical auctions conclude in the early afternoon, with official portal uploads consolidating between late afternoon and morning. SmartFarm AI configures a conservative twice-daily polling schedule:

- **Morning Sync (06:30 IST / 01:00 UTC):** Captures late uploads and consolidated national records from the previous trading day.
- **Evening Sync (18:30 IST / 13:00 UTC):** Captures same-day APMC afternoon auction closures.

| Dimension | Target Timezone (IST) | Coordinated Universal Time (UTC) |
|---|---|---|
| **Timezone** | `Asia/Kolkata` (UTC+05:30) | `UTC` |
| **Morning Run** | `06:30 IST` | `01:00 UTC` |
| **Evening Run** | `18:30 IST` | `13:00 UTC` |
| **Cron String** | `30 6,18 * * *` | `0 1,13 * * *` |
| **Platform Format** | Native timezone schedulers (e.g. Systemd) | Standard POSIX crontab / GitHub Actions / Vercel |

---

## 2. Security & Timing-Safe Authentication

The scheduled synchronization endpoint `/api/v1/scheduled/market-sync` is protected by a dedicated server-only token (`CRON_SECRET`).

### Security Controls:
1. **Timing-Safe Comparison:** Compares credentials using `crypto.timingSafeEqual` in `src/lib/cron-auth.ts`. If string lengths differ, dummy constant-time operations are performed so request processing time provides zero information to attackers.
2. **Never Leaked or Logged:** `CRON_SECRET` is never logged in server output, never returned in API envelopes or error messages, and never bundled into client JavaScript.
3. **Fail-Safe Default:** If `CRON_SECRET` is empty or unset, all incoming calls to `/api/v1/scheduled/market-sync` are immediately rejected with HTTP 401.
4. **Header Options:**
   - Standard: `Authorization: Bearer <CRON_SECRET>`
   - Custom: `x-cron-secret: <CRON_SECRET>`

---

## 3. Concurrency Run Guards & Data Idempotency

### Concurrency Protection (MarketSyncLock):
In containerized, autoscaling, or multi-instance deployments, overlapping cron invocations could cause race conditions or duplicate computations.
- Before executing a sync, the service attempts to acquire a single-row lock in the `MarketSyncLock` table (`id: 'market_sync'`) with a 10-minute Time-To-Live (TTL).
- If a lock is already held and unexpired, the incoming invocation immediately exits with HTTP 409 Conflict (`status: 'skipped_locked'`) and logs the collision without altering data.
- If a background worker crashes unexpectedly, stale locks automatically expire after 10 minutes, allowing future runs to recover without manual intervention.

### Idempotent Upserts:
- Even if a concurrent request bypasses the lock guard, database upserts are keyed by the compound unique constraint:
  `@@unique([locationId, commodityId, priceDate, source, grade])`
- Re-running the sync against the same date overwrites existing price observations with the freshest modal calculations rather than creating duplicate rows.

---

## 4. Deployment Configuration Guides

### A. Linux Host (Crontab)

On a Linux VPS, Dedicated Server, or VM:

```bash
# 1. Edit the crontab for your application user
crontab -e

# 2. Add the scheduled curl trigger (UTC: 01:00 and 13:00)
0 1,13 * * * curl -s -X POST -H "Authorization: Bearer YOUR_SERVER_CRON_SECRET" -H "Content-Type: application/json" http://localhost:3000/api/v1/scheduled/market-sync >> /var/log/smartfarm-market-sync.log 2>&1
```

Or execute directly via the CLI runner:
```bash
0 1,13 * * * cd /opt/smartfarm/Farming && /usr/bin/node scripts/market-sync.mjs >> /var/log/smartfarm-market-sync.log 2>&1
```

---

### B. Systemd Service & Timer (Recommended for Production Linux)

Systemd timers natively support timezones, automatic retries, and comprehensive journal logging:

#### 1. Create `/etc/systemd/system/smartfarm-market-sync.service`:
```ini
[Unit]
Description=SmartFarm AI Mandi Market Price Refresh
After=network.target

[Service]
Type=oneshot
User=smartfarm
WorkingDirectory=/opt/smartfarm/Farming
EnvironmentFile=/opt/smartfarm/Farming/.env
ExecStart=/usr/bin/node scripts/market-sync.mjs
StandardOutput=journal
StandardError=journal
```

#### 2. Create `/etc/systemd/system/smartfarm-market-sync.timer`:
```ini
[Unit]
Description=Run SmartFarm AI Mandi Refresh twice daily in IST

[Timer]
OnCalendar=*-*-* 06:30:00 Asia/Kolkata
OnCalendar=*-*-* 18:30:00 Asia/Kolkata
Persistent=true

[Install]
WantedBy=timers.target
```

#### 3. Enable and start the timer:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now smartfarm-market-sync.timer
sudo systemctl list-timers --all
```

---

### C. GitHub Actions (Scheduled Workflow)

For repository-hosted scheduled runs:

Create `.github/workflows/market-sync.yml`:
```yaml
name: Scheduled Market Price Sync

on:
  schedule:
    # 01:00 UTC (06:30 IST) and 13:00 UTC (18:30 IST)
    - cron: '0 1,13 * * *'
  workflow_dispatch: # Allows manual trigger from GitHub UI

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger SmartFarm Market Sync
        run: |
          curl -f -s -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.SMARTFARM_APP_URL }}/api/v1/scheduled/market-sync"
```

Configure `CRON_SECRET` and `SMARTFARM_APP_URL` in **Settings > Secrets and variables > Actions**.

---

### D. Vercel Cron (`vercel.json`)

If deployed on Vercel:

```json
{
  "crons": [
    {
      "path": "/api/v1/scheduled/market-sync",
      "schedule": "0 1,13 * * *"
    }
  ]
}
```

Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` if `CRON_SECRET` is added to your Vercel Project Environment Variables.

---

### E. Cloud Webhook Schedulers (AWS EventBridge / GCP Cloud Scheduler / Upstash QStash)

- **Target URL:** `https://your-domain.com/api/v1/scheduled/market-sync`
- **HTTP Method:** `POST` (or `GET`)
- **Headers:**
  - `Authorization: Bearer <CRON_SECRET>`
  - `Content-Type: application/json`
- **Schedule:** `0 1,13 * * *` (UTC)

---

## 5. Local Manual Synchronization

To test synchronization without waiting for scheduled timers:

### Option 1: Via npm script
```bash
npm run market:sync
```

### Option 2: Via standalone Node script
```bash
node scripts/market-sync.mjs
```

### Option 3: Via curl
```bash
curl -X POST \
  -H "Authorization: Bearer smartfarm_super_secret_cron_token_2026" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/v1/scheduled/market-sync
```

### Option 4: Via Admin Web Console
1. Navigate to `/admin` in your browser.
2. Sign in as an administrator (`admin@smartfarm.ai` / `admin123456`).
3. In the **AGMARKNET Mandi Price Sync Engine** section, click **Sync Now (Manual)**.
4. View the real-time record count, execution duration, and audit table entries.
