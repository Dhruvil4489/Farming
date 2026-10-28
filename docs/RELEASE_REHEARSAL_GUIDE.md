# SMARTFARM AI — RELEASE REHEARSAL & OPERATIONAL GUIDE

This guide details the fresh-machine release rehearsal procedure, runtime prerequisites, database migration sequence, environment variables, and verification commands for SmartFarm AI (Phase 11).

---

## 1. System Requirements & Runtime Versions

| Component | Supported Versions | Validated Runtime | Notes |
|---|---|---|---|
| **Node.js** | 18.x, 20.x, 22.x, 24.x (LTS recommended) | `v24.14.0` | Node Next.js 16 runtime |
| **npm** | 9.x - 11.x | `11.9.0` | Included with Node.js |
| **Python** | 3.10 - 3.12 | `3.11.x` | Decoupled crop disease vision service |
| **Database** | SQLite (dev/test), PostgreSQL 15+ with pgvector (prod) | SQLite `dev.db` | Dual driver support via Prisma schema switcher |

---

## 2. Environment Variables Specification (`.env`)

### 2.1 Core Platform Variables (Required)

```env
# Application Runtime
NODE_ENV=development # options: development, production, test
APP_URL=http://localhost:3000
DATABASE_URL="file:./dev.db" # Or postgresql://user:pass@host:5432/smartfarm

# Authentication & Sessions (Minimum 32 characters in production)
JWT_SECRET=smartfarm-super-secure-jwt-secret-key-32chars-min
SESSION_SECRET=smartfarm-super-secure-session-secret-key-32chars-min

# Automated Scheduled Sync Protection
CRON_SECRET=smartfarm-cron-dev-secret-phase4-2026

# External Providers Default (Zero-Cost / Offline CI Mode)
WEATHER_PROVIDER=demo       # options: demo, open-meteo
MARKET_PROVIDER=demo        # options: demo, agmarknet
AI_PROVIDER=mock            # options: mock, gemini, openai, anthropic
ALLOW_MOCK_AI=true          # Guardrail permitting mock in production if needed

# Local File Storage
STORAGE_DISK=local          # options: local, s3
UPLOAD_DIR=./uploads
```

### 2.2 Optional Provider Keys & Weights (Live Production Mode)

| Variable | Provider / Purpose | Default / Fallback | Where to Obtain |
|---|---|---|---|
| `MARKET_API_KEY` | data.gov.in AGMARKNET Mandi prices | Falls back to `DemoMarketProvider` | [https://data.gov.in](https://data.gov.in) (catalog `9ef84268-d588-465a-a308-a864a43d0070`) |
| `GEMINI_API_KEY` | Google Gemini 1.5 Pro / Flash | Falls back to `MockAIProvider` | Google AI Studio |
| `OPENAI_API_KEY` | OpenAI GPT-4o / GPT-4o-mini | Falls back to `MockAIProvider` | OpenAI Developer Platform |
| `ANTHROPIC_API_KEY` | Anthropic Claude 3.5 Sonnet | Falls back to `MockAIProvider` | Anthropic Console |
| `DISEASE_SERVICE_URL` | Decoupled PyTorch ResNet-50 vision microservice | Returns `model_not_ready` with non-clinical caveat | `http://127.0.0.1:8000` (`python services/disease_service/app.py`) |
| `DISEASE_MODEL_WEIGHTS` | ResNet-50 PyTorch checkpoint | Torchvision fallback / Hugging Face model hub | `services/disease_service/weights/resnet50_crop_v1.pt` |

---

## 3. Fresh-Machine Setup & Database Initialization

Follow this deterministic sequence to initialize SmartFarm AI on a fresh machine:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Database Driver Selection & Schema Push
SmartFarm AI supports both SQLite (default zero-dependency development/testing) and PostgreSQL (production with pgvector).

**For SQLite (Local Dev / CI / Fresh Testing):**
```bash
npm run db:switch:sqlite
npm run db:push
```

**For PostgreSQL (Production Deployments):**
```bash
npm run db:switch:postgres
npm run db:push
npm run db:verify
```

> [!NOTE]
> Database Reset Safety: `scripts/test-db-utils.mjs` enforces a strict safety guard preventing destructive table drops or resets on any connection string that is not explicitly marked as a test database (`test.db` or `:memory:`).

### Step 3: Deterministic Seeding
Populates all baseline reference entities:
- Agronomic Crops (Cotton, Wheat, Rice, Groundnut, Maize, Tomato, Onion)
- Phenological Crop Stages & Growing Degree Day templates
- Fertilizers & Plant Protection Products with NPKS formulas
- Official Demo Extension Knowledge Articles (ICAR / Anand Agricultural University guidelines)
- Demo Test Personas (Farmer: `farmer@smartfarm.ai` / `farmer123456`, Admin: `admin@smartfarm.ai` / `admin123456`)

```bash
npm run seed
```
*(Idempotent: Running `npm run seed` repeatedly will not create duplicate records).*

---

## 4. Development & Production Execution

### Dev Server
Starts the Next.js development server with hot-module reloading:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Build & Launch
Builds optimized production bundle (memory-bounded via `experimental: { cpus: 2 }` in `next.config.mjs`):
```bash
npm run build
npm run start
```

---

## 5. Automated Test Suites & Release Rehearsal

### Complete Master Release Verification (Recommended)
Executes all 10 verification steps sequentially and generates a markdown test report:
```bash
npm test
```
*Executes TypeScript type checking, ESLint static analysis, Vitest unit & provider contract tests, DB safety checks, seed idempotency, boots background server, runs API integration tests, admin restrictions, store regression, full farmer E2E rehearsal, UI route audit, and opt-in live probes.*

### Granular Layered Test Commands

| Layer | Command | Focus |
|---|---|---|
| **Static Types** | `npm run type-check` | `tsc --noEmit` across all 60+ routes & components |
| **Linting** | `npm run lint` | ESLint 9 flat config across `src/` |
| **Unit Tests** | `npm run test:unit` | Zod validators, clock skew, non-clamping quality flags, DAS math, area conversions, price parsing, moisture calibration curves, rule engine, provenance tokens |
| **Provider Tests** | `npm run test:provider` | Agmarknet (200, 401, 429, 500, price anomaly), Open-Meteo hourly index alignment, AI Provider factory fallback, Disease service offline fail-safe |
| **API Integration** | `npm run test:integration` | Authentication, rate limiting, IDOR tenant protection, CRUD, IoT telemetry ingestion, timing-safe CRON secret |
| **Admin Restrictions**| `npm run test:admin` | Unauthenticated route protection, Farmer 403 Forbidden, Admin 200 execution & sync health |
| **Store Regression** | `npm run test:regression` | Fertilizer catalog, cart item persistence, checkout `SF-2026-XXXXX` order creation, price snapshotting, 17-route protection |
| **Farmer E2E** | `npm run test:e2e` | 14-step farmer lifecycle from onboarding to logout |

---

## 6. Real Hardware & Live External Verification (Opt-In)

### In-Situ IoT Device Simulator
Simulates a physical ESP32 hardware probe transmitting real-time capacitive soil moisture, temperature, humidity, and battery voltage packets:
```bash
npm run simulate:iot
```

### Opt-In Live Credentials Probe
Verifies live government API keys, commercial LLMs, and Python inference service if configured in `.env`:
```bash
npm run manual:live-integrations
```
*This command is completely non-blocking: if keys are absent, it cleanly marks them as skipped and passes without failing automated CI.*

### Scheduled Mandi Price Synchronization
Manually triggers scheduled market price synchronization using the timing-safe `CRON_SECRET`:
```bash
npm run market:sync
```

---

## 7. Artifacts & Release Test Report

Every master rehearsal execution writes a structured test report to:
`docs/SMARTFARM_RELEASE_TEST_REPORT.md`

Includes:
- Timestamp & Node.js version
- Executive pass/fail test matrix
- Duration per test suite
- Evidence of zero unresolved items
