# SmartFarm AI (સંચાલિત સ્માર્ટ ફાર્મ)

> **Precision Agriculture & Decision-Support System for Smallholder Farmers**  
> Full-Stack Next.js 16 Web Application with Decoupled PyTorch Vision AI, IoT Telemetry Pipeline, Grounded Agricultural Extension RAG, and Real-Time Mandi Market Intelligence.

---

## 1. Project Overview

SmartFarm AI is an engineering-grade precision agriculture platform designed for Indian smallholder farming ecosystems (with initial agronomic calibrations for Gujarat, Maharashtra, and Central India). The system binds the complete farm lifecycle—from field parcel mapping, phenological crop cycle tracking, in-situ capacitive sensor telemetry, and weather-triggered spray advisories to APMC mandi price tracking, fertilizer e-commerce, crop disease diagnosis, and evidence-grounded AI consultation.

### Academic & Project Metadata
- **Project Type:** Final-Year Engineering Project / Capstone Project
- **Primary Domain:** Precision Agriculture, IoT Telemetry, Computer Vision, Retrieval-Augmented Generation (RAG)
- **Primary Languages:** TypeScript (Full-Stack), Python (Vision AI Microservice)
- **Frameworks:** Next.js 16 (App Router), React 19, Tailwind CSS, Prisma ORM, FastAPI, PyTorch / Torchvision

---

## 2. Working Feature Status Matrix

In adherence to academic integrity guidelines, all platform capabilities are explicitly labeled according to their implementation and verification status in this repository:

| Feature Module | Working Status | Backend Route / Service | Verification Evidence |
|---|---|---|---|
| **Multi-Tenant Authentication** | ✅ Verified Complete | `/api/v1/auth/*` | JWT in HttpOnly cookie; rate-limited; IDOR protected; verified in `test-api-integration.mjs` |
| **Farm & Field Management** | ✅ Verified Complete | `/api/v1/farms`, `/api/v1/fields` | Full CRUD with soft deletion; Leaflet geospatial polygon support |
| **Crop Cycle & Stages** | ✅ Verified Complete | `/api/v1/crop-cycles` | Automatic phenological stage materialization based on GDD/DAS templates |
| **Agronomic Activity Tasks** | ✅ Verified Complete | `/api/v1/tasks` | Task creation, status updates, completion audit trail |
| **Field Scouting Logging** | ✅ Verified Complete | `/api/v1/observations` | Persistent observations with category, severity (1–3), and notes |
| **Irrigation Event Logging** | ✅ Verified Complete | `/api/v1/irrigation` | Persistent logging with water source, duration, and field binding |
| **Weather & Advisory Engine** | ✅ Verified Complete | `/api/v1/weather`, `/api/v1/advisories` | Dynamic hourly alignment via Open-Meteo; rain delay, heat, and wind spray drift rules |
| **APMC Mandi Market Prices** | ✅ Verified Complete | `/api/v1/market/*` | Dual-mode: Live data.gov.in AGMARKNET API or deterministic `DemoMarketProvider` |
| **Scheduled Mandi Sync** | ✅ Verified Complete | `/api/v1/scheduled/market-sync` | Mutex lock with `syncAuditLog` telemetry; timing-safe `CRON_SECRET` authorization |
| **IoT Telemetry Ingestion** | ✅ Verified Complete | `/api/v1/iot/telemetry` | SHA-256 hashed Bearer tokens; non-clamping quality flags; clock-skew validation |
| **In-Situ Sensor Simulator** | ✅ Verified Complete | `scripts/simulate-iot.mjs` | Deterministic realistic telemetry stream with diurnal curves and packet bursts |
| **Crop Disease Vision AI** | ✅ Verified Complete (Microservice Decoupled) | `/api/v1/diagnosis/*`, `services/disease-service` | ResNet-50 transfer model; magic byte verification; foliage filter; offline fail-safe |
| **Grounded RAG Assistant** | ✅ Verified Complete | `/api/v1/assistant/*` | In-database BM25 retrieval over ICAR/AAU docs; anti-injection prompts; strict citations |
| **Store, Cart & Checkout** | ✅ Verified Complete | `/api/v1/store/*` | Fertilizer catalog, server cart persistence, durable order snapshots (`SF-2026-XXXXX`) |
| **Admin Panel & RBAC** | ✅ Verified Complete | `/admin`, `/api/v1/admin/*` | Role checks (`role === 'ADMIN'`); sync controls and health telemetry |
| **Physical ESP32 Deployment** | ⚠️ Pending Physical Hardware | ESP32 Hardware Probe | Firmware & pinout documented; simulated via `scripts/simulate-iot.mjs` |
| **Onboarding DB Auto-Save** | ⚠️ Partial (UI Only) | `/onboarding` | UI wizard functions; form entries currently rely on manual farm creation |
| **Soil Card OCR** | 📋 Planned (Future Scope) | `/soil` | Manual soil parameter entry active; automated OCR parser on future roadmap |
| **P2P Marketplace** | 📋 Planned (Future Scope) | — | Fertilizer store active; farmer-to-farmer crop trading planned for future phase |

---

## 3. Technology Stack & Prerequisites

### Required Runtimes
- **Node.js**: `v18.x` through `v24.x` (Tested and validated on `v24.14.0`)
- **npm**: `v9.x` through `v11.x` (Tested on `11.9.0`)
- **Python** (Optional, for Vision Microservice): `3.10` through `3.12` (Tested on `3.11.x`)
- **Operating System**: Platform-agnostic (Windows, macOS, Ubuntu / Debian Linux)

### Primary Libraries
- **Frontend / Full-Stack**: Next.js 16.3.7 (Turbopack, App Router), React 19.3.0, Tailwind CSS v4, Lucide React, Leaflet, Three.js
- **Database ORM**: Prisma 6.4.0 (SQLite for local/test; PostgreSQL with pgvector for production)
- **Validation & Auth**: Zod 4.6.5, JSON Web Token (jsonwebtoken 9.0.3), bcryptjs 3.0.3
- **Test Framework**: Vitest 5.0.5, Native Node.js test runners

---

## 4. Environment Variables Checklist

Create a `.env` file in the project root based on `.env.example`:

```env
# Application Runtime
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"

# Authentication & Session Security (Min 32 characters in production)
JWT_SECRET=smartfarm-dev-secret-key-at-least-32-chars-long
SESSION_SECRET=smartfarm-dev-session-secret-at-least-32-chars

# Scheduled Synchronization Security
CRON_SECRET=smartfarm-cron-dev-secret-phase4-2026

# External Integration Defaults (Default: Zero-cost / Offline CI mode)
WEATHER_PROVIDER=demo       # options: demo, open-meteo
MARKET_PROVIDER=demo        # options: demo, agmarknet
AI_PROVIDER=mock            # options: mock, gemini, openai, anthropic
ALLOW_MOCK_AI=true          # Permits mock AI fallback in development/demo

# Optional Production API Keys (Leave blank to use verified demo fallbacks)
MARKET_API_KEY=             # data.gov.in API key for live Agmarknet prices
GEMINI_API_KEY=             # Google AI Studio API key
OPENAI_API_KEY=             # OpenAI API key
ANTHROPIC_API_KEY=          # Anthropic Claude API key

# Vision AI Microservice (Decoupled Python Service)
DISEASE_SERVICE_URL=http://127.0.0.1:8000
DISEASE_SERVICE_TIMEOUT_MS=10000

# Storage
STORAGE_DISK=local
UPLOAD_DIR=./uploads
```

---

## 5. Quick Start & Setup Guide

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd Farming
npm install
```

### 2. Database Initialization & Deterministic Seeding
SmartFarm AI features a dual database switch utility. For local evaluation and test runs, use the default SQLite database:

```bash
# Generate Prisma client and push schema to SQLite dev.db
npm run db:switch:sqlite
npm run db:push

# Seed deterministic agronomic catalog, demo farmers, and knowledge docs
npm run seed
```

*Note on Seed Safety: `scripts/test-db-utils.mjs` enforces a database safety guardrail that blocks database resets on any connection string not explicitly designated as a test database (`test.db` or `:memory:`).*

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Demo Login Credentials
- **Farmer Persona:** `farmer@smartfarm.ai` / `farmer123456` (Ramesh Patel, Padra, Vadodara)
- **Admin Persona:** `admin@smartfarm.ai` / `admin123456` (Platform Administrator)

---

## 6. Build & Test Verification Commands

The repository includes a comprehensive, multi-layer verification suite. Execute these commands to reproduce test evidence:

```bash
# 1. Static Type Checking (tsc --noEmit)
npm run type-check

# 2. Static Code Quality & Linter (ESLint 9 flat config)
npm run lint

# 3. Unit Tests (Validators, ADC calibration, DAS math, rules)
npm run test:unit

# 4. Provider Contract Tests (Agmarknet, Open-Meteo, LLM factory, Disease offline)
npm run test:provider

# 5. Full Phase 11 Automated Master Release Rehearsal (Steps 1–10)
npm test

# 6. Production Optimized Build
npm run build

# 7. Start Production Server
npm start
```

---

## 7. Decoupled Vision AI & IoT Simulator Setup

### Running the Python Crop Disease Vision Microservice (Optional)
If evaluating live PyTorch ResNet-50 visual inference:

```bash
# Navigate to microservice directory
cd services/disease-service

# Create virtual environment and install requirements
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Download model checkpoint (if not present)
python download_model.py

# Launch FastAPI microservice on port 8000
uvicorn main:app --host 127.0.0.1 --port 8000
```
*Note: If the Python microservice is offline, the Next.js platform gracefully returns `status: "model_not_ready"` with non-clinical disclaimers without crashing.*

### Running the On-Farm IoT Telemetry Simulator
To simulate real-time packet bursts from an in-situ capacitive sensor probe:

```bash
# In the project root:
npm run simulate:iot
```
The simulator provisions a demo probe for your active field, generates authentic soil moisture ADC curves, and ingests readings via Bearer token to `/api/v1/iot/telemetry`.

---

## 8. Repository Documentation Sitemap

| Document | Purpose / Audience |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Component architecture, auth boundaries, database relations, data flows |
| [docs/api-reference.md](docs/api-reference.md) | Exhaustive REST API contract with schemas, error codes, and examples |
| [docs/data-provenance.md](docs/data-provenance.md) | Data source classification (Official vs Forecast vs Model vs Simulated) |
| [docs/testing-and-evaluation.md](docs/testing-and-evaluation.md) | Complete test matrix, dataset split, measured model evaluation metrics |
| [docs/ai-model-card.md](docs/ai-model-card.md) | PyTorch ResNet-50 model card, 38 classes, limitations, and safety gates |
| [docs/iot-build-and-calibration.md](docs/iot-build-and-calibration.md) | ESP32 hardware build guide, pin map, ADC calibration math, power cautions |
| [docs/demo-script.md](docs/demo-script.md) | 7–10 minute viva demo script, backup plans, and 15 technical viva Q&As |
| [docs/release-checklist.md](docs/release-checklist.md) | Final release rehearsal verification checklist |
| [docs/SMARTFARM_RELEASE_TEST_REPORT.md](docs/SMARTFARM_RELEASE_TEST_REPORT.md) | Auto-generated Phase 11 release rehearsal test report |

---

## 9. Known Limitations & Academic Disclaimers

1. **Non-Clinical Decision Support**: All agronomic diagnoses and AI assistant advisories are advisory screening tools. In adherence to Indian extension protocols, physical confirmation by a local Krishi Vigyan Kendra (KVK) officer or agronomist is recommended before chemical application.
2. **Onboarding Form Persistence**: The 6-step onboarding wizard collects farm and field data in client state; automated backend persistence is scheduled for future work (farmers create farms directly via `/farms/new`).
3. **Soil Card OCR**: Soil nutrient values must currently be entered manually or selected from district averages. Direct image OCR parsing is on the future roadmap.
4. **Physical Hardware Deployment**: While the IoT firmware, pin map, ADC calibration formulas, and ingestion APIs are complete, physical probe deployment in the field is labeled **pending physical installation** and verified via the deterministic software simulator.

---

## 10. Authors & Acknowledgments

- **Developed for:** Final-Year Engineering Capstone Project
- **Data & Extension Literature Acknowledgments:**
  - Official Mandi Price Feeds: [data.gov.in](https://data.gov.in) (Ministry of Agriculture and Farmers Welfare, AGMARKNET)
  - Meteorological Forecasts: [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
  - Agricultural Extension Guides: Indian Council of Agricultural Research (ICAR) & Anand Agricultural University (AAU)
  - Plant Disease Dataset: PlantVillage Benchmark (Penn State University / EPFL)
