# SmartFarm AI — Known Limitations

> **Status date:** 2026-10-27
> This document records limitations verified by source-code inspection during the Phase 0
> engineering audit. It will be updated as each phase is completed.

---

## L-01 · AI Farming Assistant — Hardcoded Static Response

**Status:** RESOLVED in Phase 8.
Converted from static setTimeout mock to real provider-backed RAG workflow grounded in tenant farm context, BM25 retrieval over curated ICAR/AAU publications, and durable conversation persistence.

---

## L-02 · Mandi Market Prices — Static Reference Data Labelled as Live

**Status:** RESOLVED in Phase 3 & 4.
Wired to live APMC/data.gov.in integration with scheduled background refresh, mutex sync locking, sync audit telemetry, and dual trade arrival vs sync timestamp transparency.

---

## L-03 · Field Scouting — Data Not Persisted

**Status:** RESOLVED in Phase 2.
Backed by durable database `FarmObservation` model and authenticated `/api/v1/observations` routes with field and farm ownership checks.

---

## L-04 · Irrigation Logging — Data Not Persisted

**Status:** RESOLVED in Phase 2.
Backed by durable database `IrrigationRecord` model and authenticated `/api/v1/irrigation` routes with field and farm ownership checks.

---

## L-05 · Onboarding Wizard — Form Data Not Saved

**Status:** Present in current codebase.
The 6-step farmer onboarding wizard at `/onboarding` collects farm name, location, area,
crop, and irrigation type. When the farmer clicks "Finish" or "Complete Later", the page
calls `router.push('/dashboard')` without writing any of the entered data to the database.

A new farmer who completes onboarding will find no farms or fields pre-created.

**Plan:** Update the final onboarding step to call `/api/v1/farms` and `/api/v1/fields`.

---

## L-06 · Soil Card OCR — Upload Parsed on UI Only

**Status:** Present in current codebase.
The Soil Health Card upload at `/soil` accepts a PDF or image file via a file input.
No server-side upload, parsing, or OCR is performed. Clicking "upload" shows a success
banner but no data is extracted or stored. Farmers must still enter all soil parameters
manually.

**Plan:** Implement file upload to `/api/v1/soil/reports`; OCR extraction is future roadmap.

---

## L-07 · Weather Humidity and Rain Probability — Off-by-Hour

**Status:** RESOLVED in Phase 10.
Updated `OpenMeteoProvider.ts` to compute current UTC hour and dynamically match against `data.hourly.time`, eliminating 5-17 hour offset during Indian Standard Time (IST) daylight hours.

---

## L-08 · Hardcoded Fallback JWT Secret in Source

**Status:** RESOLVED in Phase 10.
Hardened in `src/lib/auth-utils.ts` and `src/lib/auth.ts`: production environments require a non-fallback `JWT_SECRET` of at least 32 characters, throwing a startup security exception otherwise.

---

## L-09 · Not Yet Built — Features in Specification Only

The following features are described in the project specification:

| Feature | Spec Reference | Current Status |
|---|---|---|
| Crop Disease Vision AI (photo diagnosis) | `SMARTFARM_AI_MASTER_SPEC.md` Phase 2 | RESOLVED in Phase 7 (ResNet-50 PyTorch service) |
| RAG Knowledge Hub (vector/keyword search over agri docs) | `RAG.md` | RESOLVED in Phase 8 (In-database BM25 over ICAR/AAU docs) |
| IoT Hardware Sensor Telemetry Ingestion | `IOT.md` | RESOLVED in Phase 5 & 6 (Telemetry pipeline & monitoring) |
| Farmer Finance Module (income/expense tracking) | `FEATURES.md` Phase 2 | Planned Future Phase |
| Community Forum and Expert Q&A | `FEATURES.md` Phase 3 | Planned Future Phase |
| Satellite NDVI Vegetation Index Layer | `FEATURES.md` Phase 3 | Planned Future Phase |
| Marketplace Listings | `SMARTFARM_AI_MASTER_SPEC.md` Phase 3 | Store & Fertilizer Guidance active; open farmer-to-farmer P2P marketplace planned |

---

## L-10 · Admin RBAC Not Enforced on Admin Panel

**Status:** Partially mitigated in Phase 4 & 5.
Backend sync and device admin endpoints enforce `role === 'ADMIN'` (`403 Forbidden`). Route-level redirection for non-admin farmers is enforced on sensitive admin operations.

---

## L-11 · Accessibility and Assistive Technology Disclosures

**Status:** Documented and Mitigated in Phase 9.

While Phase 9 achieved substantial WCAG 2.1 AA improvements across the SmartFarm UI (including high-contrast provenance badges with 12.4:1 contrast ratios, ARIA live regions for async streams, and keyboard focus indicators), the following technical constraints remain:

1. **Geospatial Map Vector Tabbing**:
   - Leaflet interactive polygon vertices on `/fields` and field detail pages can intermittently capture keyboard focus loops inside browser SVG renderers.
   - *Mitigation implemented:* Automated SVG sanitization (`focusable="false"`, `tabindex` stripping) and an accessible skip link (`"Skip map and jump to field coordinates"`) were added to `MapView.tsx`. Full WCAG 2.1 AAA compliance for geospatial editing requires third-party assistive device testing across all screen readers (NVDA, JAWS, VoiceOver).

2. **Multilingual Screen Reader Phonetics**:
   - Screen reader pronunciation of Gujarati (`gu`) agricultural terminology and local commodity names (e.g., જીરું / Cumin, કપાસ / Cotton) depends on the local text-to-speech engine and browser voice synthesizer. While `lang="gu"` and `lang="hi"` tags are set correctly, speech fidelity varies across operating systems.

3. **AI Vision and Agronomic Advice Non-Clinical Notice**:
   - AI disease predictions and RAG advice carry non-clinical disclaimers and explicit model provenance. Field confirmation by a qualified KVK extension agronomist or plant pathologist remains necessary before applying chemical interventions.

---

*Document updated 2026-10-27 following Phase 2–10 completion.*
