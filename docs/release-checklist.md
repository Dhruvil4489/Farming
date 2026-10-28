# SmartFarm AI — Comprehensive Release & Final Verification Checklist

This checklist must be executed and signed off prior to final-year project demonstration, viva evaluation, or production deployment.

---

## 1. Environment & Prerequisites

- [ ] **Node.js Runtime**: Verified Node version is between `18.x` and `24.x` (`node -v` shows `v24.14.0`).
- [ ] **npm Package Manager**: Verified npm version is 9.x+ (`npm -v` shows `11.9.0`).
- [ ] **Python Microservice Runtime** (Optional): Verified Python 3.10–3.12 (`python --version`).
- [ ] **Dependencies**: Clean installation completed (`npm install` exits 0 with no peer dependency conflicts).
- [ ] **Local Storage**: Storage directory exists and is writable (`./uploads`).

---

## 2. Secrets & Configuration Hygiene

- [ ] **Environment File**: `.env` created from `.env.example`.
- [ ] **Git Exclusion**: Verified `.env` and `*.db` are listed in `.gitignore` and **not committed** to git (`git status` clean).
- [ ] **JWT Secret Strength**: `JWT_SECRET` is set to a secure string of at least 32 characters.
- [ ] **Session Secret**: `SESSION_SECRET` is configured.
- [ ] **Cron Secret**: `CRON_SECRET` is configured with a high-entropy string for scheduled market sync protection.
- [ ] **No Hardcoded Secrets**: Ran `node scripts/test-db-utils.mjs` to audit environment files for leaked production credentials.

---

## 3. Database Initialization & Migration Sequence

- [ ] **Driver Selection**: Switched to target database driver (`npm run db:switch:sqlite` for local dev; `npm run db:switch:postgres` for production).
- [ ] **Schema Push**: Executed `npm run db:push` to ensure all 25+ models are synchronized.
- [ ] **Reset Guardrail**: Confirmed `scripts/test-db-utils.mjs` rejects attempts to wipe non-test databases.
- [ ] **Deterministic Seeding**: Executed `npm run seed` to populate crops, stages, fertilizers, ICAR knowledge chunks, and test personas.
- [ ] **Seed Idempotency**: Re-ran `npm run seed` to confirm no duplicate users, products, or knowledge records are created.

---

## 4. Automated Code Quality & Testing Suite

Execute the following commands in exact order. All must exit with code 0:

- [ ] `npm run type-check` (0 TypeScript compiler errors across all routes and components).
- [ ] `npm run lint` (0 ESLint errors across `src/`).
- [ ] `npm run test:unit` (All 44 unit tests pass in Vitest).
- [ ] `npm run test:provider` (All 65 provider contract tests pass in Vitest).
- [ ] `npm test` (Master release suite runs all 10 steps; exits 0 with **12/12 passed suites**).
- [ ] `npm run build` (Next.js production build completes with 0 errors; static & dynamic routes compiled).

---

## 5. Market Synchronization & Scheduler Verification

- [ ] **Authorized Trigger**: Verified `GET /api/v1/scheduled/market-sync` with valid `CRON_SECRET` succeeds (`200 OK`).
- [ ] **Unauthorized Rejection**: Verified requests without authorization or with wrong secret receive `401 Unauthorized`.
- [ ] **Admin Sync RBAC**: Verified `POST /api/v1/admin/market/sync` returns `403 Forbidden` for non-admin farmers and `200 OK` for administrators.
- [ ] **Mutex Lock**: Confirmed database lock prevents duplicate overlapping sync executions.

---

## 6. Vision AI Microservice & Fallback Verification

- [ ] **Health Probe**: Evaluated `services/disease-service/main.py` via `python download_model.py` and `uvicorn main:app --port 8000`.
- [ ] **Magic Byte Check**: Verified that non-image binary uploads are rejected (`422 Unprocessable Entity`).
- [ ] **Foliage Color Gate**: Verified non-plant images are rejected (`status: "not_crop"`).
- [ ] **Offline Circuit-Breaker**: Stopped the Python service and submitted a leaf photo; verified Next.js safely returns `status: "model_not_ready"` without crashing.

---

## 7. IoT Pipeline & Sensor Simulator Verification

- [ ] **Device Registration**: Provisioned test probe via `POST /api/v1/iot/devices`; received one-time raw Bearer token.
- [ ] **Telemetry Ingestion**: Ingested reading via `POST /api/v1/iot/telemetry` with Bearer token; verified `200 OK` and `qualityStatus: "clean"`.
- [ ] **Simulator Scenarios**: Ran `node scripts/simulate-iot.mjs --scenario=dry_to_wet` and verified real-time UI moisture update.
- [ ] **Hardware Status Disclosure**: Confirmed documentation explicitly marks physical breadboard setup as **pending field deployment** while software simulator is active.

---

## 8. Final Viva & Demonstration Readiness

- [ ] **Demo Personas**: Verified credentials work:
  - Farmer: `farmer@smartfarm.ai` / `farmer123456`
  - Admin: `admin@smartfarm.ai` / `admin123456`
- [ ] **Demo Script Review**: Reviewed 7–10 minute demonstration sequence in `docs/demo-script.md`.
- [ ] **Viva Q&A Review**: Prepared for all 15 technical viva questions in `docs/demo-script.md`.
- [ ] **Offline Contingency**: Confirmed local fallback providers (`DemoMarketProvider`, `DemoWeatherProvider`, `MockAIProvider`) function without active WAN internet.
- [ ] **Release Report**: Verified latest test run report is generated at `docs/SMARTFARM_RELEASE_TEST_REPORT.md`.
