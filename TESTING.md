# SMARTFARM AI — TESTING SPECIFICATION

---

## 1. Testing Strategy & Quality Gates

The SmartFarm AI platform enforces a continuous verification testing methodology across unit, API, integration, and UI layers.

### 1.1 Test Matrix

| Layer | Target | Tooling | Coverage Requirement |
|---|---|---|---|
| **Unit Tests** | Business logic, calculations, date math, advisory rules | Vitest | Stage materialization, profit math, weather rules |
| **API Integration Tests** | REST API endpoints, validation, response envelopes | Vitest / Supertest | All `/api/v1/*` routes |
| **Authorization Tests** | Ownership isolation, IDOR vulnerability prevention | Vitest | 100% IDOR matrix on user resources |
| **File Upload Tests** | MIME validation, size limits, security | Vitest | Invalid extensions, spoofed MIME, oversized files |
| **Provider Contract Tests** | Weather, Market, AI provider implementations | Vitest | Verify both live adapters and demo fallbacks |
| **End-to-End Tests** | Complete user journeys (onboarding, farm -> task -> harvest) | Playwright | Key farmer and admin workflows |

---

## 2. Automated Quality Gate Checks

Before declaring any release ready, the following commands must execute cleanly with zero errors:

```bash
npm run type-check       # TypeScript compilation check across all routes
npm run lint             # ESLint 9 static analysis
npm test                 # Master Phase 11 verification suite (orchestrates steps 1-10)
npm run build            # Next.js optimized production build
```

---

## 3. Granular Test Execution Commands

| Level / Layer | Command | Focus Area |
|---|---|---|
| **Unit Tests** | `npm run test:unit` | Input validators, DAS math, price normalization, moisture ADC calibration, rules, provenance labels |
| **Provider Tests** | `npm run test:provider` | Agmarknet, Open-Meteo, LLM providers (Gemini, OpenAI, Anthropic, Mock), Disease vision offline fail-safe |
| **API Integration** | `npm run test:integration` | Authentication, rate limiting, IDOR prevention, agronomic CRUD, IoT telemetry ingestion, timing-safe sync |
| **Admin Restrictions** | `npm run test:admin` | RBAC route guards, Farmer HTTP 403 blocks, sync health telemetry |
| **Store Regression** | `npm run test:regression` | Fertilizer store catalog, server cart persistence, checkout order snapshots, 17-route protection matrix |
| **Farmer E2E** | `npm run test:e2e` | 14-step farmer lifecycle rehearsal from plot setup to logout |
| **Live Integrations** | `npm run manual:live-integrations` | Opt-in check for real government API key, commercial LLM keys, and local Python vision microservice |

---

## 4. Release Test Report

Every master rehearsal execution writes a structured test report to:
`docs/SMARTFARM_RELEASE_TEST_REPORT.md`

Detailed instructions on fresh-machine setup and operational parameters are available in:
`docs/RELEASE_REHEARSAL_GUIDE.md`
