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

Before declaring any phase complete, the following commands must execute cleanly with zero errors:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```
