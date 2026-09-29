# SMARTFARM AI — MASTER PRODUCT & BUILD SPECIFICATION

*Your Intelligent Digital Farming Companion*

**Audience:** Google Antigravity (autonomous coding agent) and senior engineers.
**How to use:** Sections 1–27 are the specification. Section 28 is the copy-pasteable execution instruction. Give Antigravity this whole file plus the Section 28 prompt.

**Research note (honest scope):** Section 2 is based on publicly documented product concepts known at the time of writing, not a live crawl. Anything marked **[VERIFY]** (API terms, endpoints, licensing, scheme details) must be checked against the official source by Antigravity or a human before it is relied on.

---

## 1. EXECUTIVE PRODUCT VISION

SmartFarm AI is a farmer-first digital agriculture platform that supports the full farming lifecycle:

DISCOVER → PLAN → PREPARE → SOW → GROW → MONITOR → PROTECT → IRRIGATE → HARVEST → SELL → ANALYZE

**Core philosophy:** *Do not force farmers to provide technical information they are unlikely to know.* The product gets smarter as data accumulates, but is useful on day one with only a name, a location, and a crop.

**The connected spine (the most important architectural idea):**
Farm → Field → Crop Cycle → Crop Stage → Weather → Task → Observation → Diagnosis → AI → Harvest → Market → Finance → Report.
Every module reads from and writes to this spine. A module that doesn't connect to it should not be built.

**Non-negotiable product principles**

| # | Principle | Consequence |
|---|---|---|
| P1 | Farmer-first | Simple words, large touch targets, mobile-first, progressive disclosure |
| P2 | Never force unavailable data | Every technical field has Skip / I don't know / Add later |
| P3 | Explain everything | Each recommendation shows WHY, WHAT, SOURCE, CONFIDENCE, LIMITATIONS |
| P4 | Never fabricate | No invented weather, prices, sensor/satellite values, schemes, soil values, diagnoses, or confidence scores |
| P5 | Label provenance | Every datum is tagged: measured / user-entered / external / AI-generated / estimated / predicted / assumed / demo |
| P6 | Decision support, not authority | No invented pesticide/fertilizer dosages; defer to official/local guidance and experts |
| P7 | Replaceable providers | Weather, market, AI, embeddings, vector store, maps, notifications, storage all behind interfaces |
| P8 | Modular monolith | No microservices/Kubernetes for MVP. One backend + one Python AI service |

---

## 2. RESEARCH FINDINGS

### 2.1 Reference platforms and the pattern each teaches

| Platform | Publicly documented pattern | What SmartFarm AI takes (original implementation) | Data/hardware dependency |
|---|---|---|---|
| **Cropwise (Syngenta)** | Field-centric management, field boundaries, satellite vegetation monitoring, scouting, weather per field, crop-stage tracking | Field as the central object; scouting with geotagged notes; NDVI-ready layer | Satellite provider, boundary data |
| **DeHaat** | Full-stack farmer services: advisory, input supply, market linkage, agronomist support | Advisory + expert consultation + marketplace-ready architecture | Operational network (not software-only) |
| **FarmRise** | Localized, multilingual, crop-specific advisory and mandi prices, community | Language-first design, crop-calendar advisory, market watch | Curated content, market feed |
| **Plantix** | Photo-based crop problem diagnosis, community, treatment info | Multi-image diagnosis with confidence gating, always "Consult Expert" | Trained model or vision API |
| **AgroStar** | Advisory + AI + agri-input marketplace + expert helpline | Advisory-to-action linkage; marketplace as modular later phase | Commerce/logistics ops |
| **AGRIVI** | Crop planning, operations logging, inventory, finance, analytics per field/crop | Activity log, cost per acre, profitability per crop cycle, inventory | None (pure software) — high value |
| **e-NAM / Agmarknet** | Government market/mandi price and arrival information | Market module fed by a provider abstraction over official data **[VERIFY]** | Official API/data.gov.in key **[VERIFY]** |
| **Soil Health Card ecosystem** | Government soil testing → card with nutrient status + recommendations | Upload + OCR + farmer-confirmed structured soil test; never mandatory | OCR pipeline, farmer confirmation |

### 2.2 What farmers actually need (workflow-derived, not feature-derived)

1. **"What do I do today?"** → tasks + weather + crop stage, in one glance. This is the daily-open reason.
2. **"What is wrong with my crop?"** → photo → possible causes → next step → expert. Highest-trust and highest-risk feature.
3. **"What's the price?"** → mandi price for *my* crop near *me*, with date and source.
4. **"Did I make money?"** → simple expense/income per crop cycle, in local language and rupees.
5. **"Can I trust this?"** → source labels, dates, "demo" flags, expert confirmation.

### 2.3 Feasibility classification

| Feature | Practical now? | Needs external API | Needs hardware | Needs AI/ML | Recommendation |
|---|---|---|---|---|---|
| Farm/field/crop/task/finance/inventory | Yes | No | No | No | **MVP** |
| Crop calendar (admin-configured) | Yes | No | No | No | **MVP** |
| Weather | Yes | Yes (provider) | No | No | **MVP** (with demo mode) |
| Soil workflow (type + upload) | Yes | No | No | OCR later | **MVP** (manual + upload; OCR Phase 2) |
| Dashboard | Yes | Partly | No | No | **MVP** |
| AI assistant (grounded) | Yes | LLM provider | No | Yes | **MVP-lite architecture, full Phase 2** |
| Disease diagnosis | Difficult | Vision model/API | No | Yes | **Phase 2**, mock service until real model |
| RAG knowledge | Yes | Embeddings/LLM | No | Yes | **Phase 2** |
| Market prices | Data-dependent | Yes (official feed) | No | Forecast later | **Phase 2** |
| Community/experts | Yes | No | No | Moderation | **Phase 3** |
| Marketplace | Ops-heavy | Payments | No | No | **Phase 3, listings/inquiries only** |
| IoT | Hardware-dependent | No | Yes | Later | **Phase 3, ingestion only** |
| Satellite/NDVI | Data-dependent | Yes (imagery) | No | Some | **Phase 3, adapter only** |
| Crop recommendation ML | Data-hungry | No | No | Yes | **Phase 3; refuse when inputs missing** |
| Yield/price forecasting | Very data-hungry | Yes | No | Yes | **Later**, only interface now |

### 2.4 Key strategic conclusions

- The **pure-software, high-value core** (AGRIVI-style operations + finance) is what makes a *usable* first release. Build that first.
- **Diagnosis and satellite are the flashiest and the most likely to fail**; they must be honest (confidence gating, "unavailable" states).
- **Localization is a product feature**, not a translation task afterward (FarmRise pattern).
- **Trust labelling** differentiates a serious product from a demo.

---

## 3. PRODUCT FEATURE MATRIX

Legend: **M** = MVP (Phase 1), **2** = Phase 2, **3** = Phase 3, **A** = architecture/interface only, **—** = not planned.

| Module | Build depth | Notes |
|---|---|---|
| Auth (email/password, phone/OTP-ready) | M | OTP provider behind interface |
| Onboarding (skippable) | M | Every step has Complete Later |
| Farms / Fields / Boundaries / Map | M | Leaflet + OSM-compatible tiles |
| Crops master, varieties, stages (admin) | M | Advisory content is admin-configurable, never hard-coded |
| Crop cycles + calendar | M | |
| Tasks + activities | M | Recurring = data model ready, engine Phase 2 |
| Weather + weather-aware advisory | M | Provider abstraction, demo mode |
| Soil profile (type/unknown/skip) + report upload | M | OCR extraction Phase 2 |
| Dashboard (farmer) | M | |
| Irrigation records (manual) | M | Sensor data A |
| Scouting/observations | M | Feeds AI later |
| Notifications (in-app) | M | Email/SMS/push A → 2 |
| i18n en/hi/gu | M | |
| Admin foundation (users, crops, stages, content) | M | |
| Audit logs | M | |
| AI assistant | 2 (M: provider interface + stub) | |
| Diagnosis | 2 | MockDiagnosisService labelled |
| Knowledge hub + RAG | 2 | |
| Market | 2 | |
| Finance, inventory, machinery | 2 | (Finance could move to M if capacity allows; see §25) |
| Reports/exports | 2 | |
| Government schemes | 2 | Admin-entered, verified-date required |
| Community, experts | 3 | |
| Marketplace | 3 | |
| IoT, satellite | 3 (A earlier) | |
| ML crop/yield/price | 3 (A earlier) | |
| Voice | A | |
| Offline/PWA | A → 2 | Drafts + retry queue first |

---

## 4. USER ROLES

| Role | Implement now? | Purpose |
|---|---|---|
| **Farmer** | Yes (MVP) | Primary user |
| **Admin** | Yes (MVP foundation) | Content, users, config |
| **Expert** | Role & permissions defined MVP; workflows Phase 3 | Answers, advisory |
| **Buyer** | Role defined; features Phase 3 | Listings, inquiries |
| Agronomist / Field Officer / Organization / Institution | Future-ready via role+permission tables and nullable `organization_id` | Do not build UI now |

**RBAC design:** roles ↔ permissions many-to-many; users have one or more roles. Permissions are strings, e.g. `farmer.manage_farms`, `farmer.manage_crops`, `farmer.view_market`, `expert.answer_questions`, `admin.manage_users`, `admin.manage_content`, `admin.manage_schemes`, `admin.manage_market`, `admin.manage_ai`, `admin.view_audit`. Authorization checks permissions, never role names, in code. **Ownership** is enforced separately: a farmer can only access rows whose farm belongs to them (policy layer).

---

## 5. USER JOURNEYS

### 5.1 Farmer end-to-end

1. **Registration.** Name, mobile, optional email, state, district, village, language. ≤ 7 fields. *Why:* low friction; language and location power everything. Outcome: account + session.
2. **Profile.** Reached via onboarding or later. Language, notification prefs, "experience level" optional (drives Simple/Expert mode default).
3. **Farm creation.** Farm name, village/district/state prefilled, optional GPS pin (map tap or "use my location"), total area with unit (acre/hectare/bigha/guntha; stored canonically in m²/ha with original unit preserved). Multiple farms allowed.
4. **Field creation.** Name, area, optional boundary (draw on map), irrigation type, soil path (§10.9). Empty field is valid ("Empty" status).
5. **Crop selection.** Search crops by local name (Gujarati/Hindi aliases). "Not sure yet" allowed.
6. **Crop cycle.** Crop, variety (optional), sowing date (or planned), expected harvest (auto-suggested from crop master duration, editable, labelled *estimate*), area, irrigation, seed info.
7. **Crop calendar.** Generated from admin-defined stage templates offset from sowing date; shown as a timeline with current stage highlighted. Stage can be advanced manually (farmer truth wins).
8. **Weather.** Per-farm location. Today / Tomorrow / 7-day. Weather alerts only from real provider data.
9. **Tasks.** Auto-suggested from stage templates (as *suggestions* the farmer accepts) plus custom tasks.
10. **Irrigation.** Log irrigation events; manual moisture note; sensor link later.
11. **Scouting.** Field observation with photo, GPS, category, notes.
12. **Disease detection.** Multi-photo → quality check → possible issue with confidence → next steps → Consult Expert (always visible).
13. **AI assistance.** Assistant grounded in farm context.
14. **Harvest.** Record actual harvest date, quantity, cycle → Harvested/Completed.
15. **Market.** See relevant mandi prices; optionally create listing (Phase 3).
16. **Sale.** Record income (quantity, price, buyer, deductions).
17. **Expense/profit analysis.** Per cycle, per field, per acre; "estimated" when incomplete.
18. **Historical records.** Archived cycles with timeline, activities, diagnoses, finances.

### 5.2 Other journeys (summary)
- **Expert (Phase 3):** queue → open question → view images/context → answer → mark resolved → optional publish as knowledge.
- **Buyer (Phase 3):** search listings by crop/location → inquiry → farmer reply.
- **Admin (MVP):** manage crops → define stages → publish advisory templates → manage users/roles → review audit log.

---

## 6. INFORMATION ARCHITECTURE

```
Public site
Auth (login, register, forgot/reset)
Farmer app
├─ Dashboard
├─ My Farm
│  ├─ Farms → Farm detail (map, fields)
│  └─ Fields → Field detail (health, crop, soil, activities, observations)
├─ Crops
│  ├─ Crop cycles → Cycle detail (calendar, tasks, costs)
│  └─ Crop history
├─ Tasks & Activities (list / calendar)
├─ Weather
├─ Soil Health
├─ Doctor (Diagnosis)              [Phase 2]
├─ Farm Assistant (AI)             [Phase 2; stub in MVP]
├─ Market                          [Phase 2]
├─ Money (expenses, income, profit)[Phase 2]
├─ Inventory & Machinery           [Phase 2]
├─ Knowledge                       [Phase 2]
├─ Community & Experts             [Phase 3]
├─ Schemes                         [Phase 2]
├─ Reports                         [Phase 2]
├─ Notifications
└─ Settings (profile, language, notifications, mode)
Admin app (separate route group /admin, permission-gated)
```

**Navigation:**
- **Desktop:** left sidebar (Dashboard, My Farm, Crops, Tasks, Weather, Soil, then Assistant/Market/Money/More as they ship), top bar (farm switcher, language, notifications, profile).
- **Mobile:** bottom nav with 5 slots: **Home · My Farm · Crops · Assistant · More**. Quick-action floating button: **Photo · Add task · Record activity**. Any core action ≤ 2 taps.
- **Farm switcher** is global context; selected farm persisted per user.

---

## 7. PAGE / SITEMAP

### 7.1 Public pages

For each: purpose · sections · CTA · data. All responsive (single column < 640px, 2 col ≥ 768, 3–4 col ≥ 1024). All copy in translation files.

| Route | Purpose | Sections | Primary CTA | Data |
|---|---|---|---|---|
| `/` | Communicate product in <10s | Hero ("Smarter Farming. Better Decisions."; subtext; **Start Your Farm** / **Explore Features**), lifecycle strip, 6 feature cards, "how it works" 3 steps, trust/data-honesty strip, language showcase, footer | Start Your Farm | Static (CMS-ready) |
| `/about` | Mission, principles | Story, principles (farmer-first, honest data), team placeholder | Register | Static |
| `/features` | Full capability overview | Feature grid grouped by lifecycle stage, each linking to module page | Start Your Farm | Static |
| `/how-it-works` | Onboarding expectations | 4 steps: add farm → add crop → get daily guidance → track results | Register | Static |
| `/crop-management` | Explain crop cycles/calendar | Timeline visual, sample calendar (labelled *sample*) | Register | Static |
| `/weather` | Explain weather intelligence | Fact-vs-advice explainer, sample card (labelled *demo*) | Register | Static |
| `/ai-crop-diagnosis` | Explain diagnosis with honesty | Flow diagram, confidence explanation, safety note | Register | Static |
| `/ai-assistant` | Explain assistant | Example questions, grounding/sources explanation | Register | Static |
| `/soil-health` | Explain flexible soil paths | 6 soil paths, "no need to know NPK" message | Register | Static |
| `/market` | Explain mandi info | Data-source explainer; live public read-only widget only if provider connected | Register | Provider or demo-labelled |
| `/knowledge` | Public articles | Search, category filters, article cards | Read / Register | DB (published) |
| `/community` | Teaser | Public read-only recent questions (Phase 3) | Join | DB |
| `/schemes` | Public scheme directory | Filters (state, category), cards with official URL and *last verified* | Check eligibility | DB |
| `/contact` | Support | Form (validated, rate-limited, honeypot), email/phone from settings | Send | POST /contact |
| `/login`, `/register` | Auth | Forms, language switcher, forgot password | — | Auth API |

### 7.2 Authenticated routes (App Router)

```
/app/dashboard
/app/farms, /app/farms/new, /app/farms/[id], /app/farms/[id]/edit
/app/fields, /app/fields/new, /app/fields/[id]
/app/crops, /app/crop-cycles/new, /app/crop-cycles/[id], /app/crop-cycles/[id]/calendar
/app/tasks, /app/tasks/new, /app/tasks/[id]
/app/weather
/app/soil, /app/soil/reports/new, /app/soil/reports/[id]
/app/scouting, /app/scouting/new
/app/irrigation
/app/notifications
/app/settings
/app/onboarding/[step]
--- Phase 2+ ---
/app/diagnosis, /app/diagnosis/new, /app/diagnosis/[id]
/app/assistant
/app/market
/app/money (expenses, income, profitability)
/app/inventory, /app/machinery
/app/knowledge, /app/schemes, /app/reports
--- Phase 3 ---
/app/community, /app/experts, /app/marketplace
/admin/... (dashboard, users, roles, crops, stages, diseases, pests, knowledge, schemes, market, notifications, ai, rag, settings, audit)
```

---

## 8. UX / UI SYSTEM

### 8.1 Visual identity
- **Direction:** natural, modern, premium, trustworthy, accessible. Not a template dashboard.
- **Palette (tokens):**
  - `--green-900 #143D2A` (deep), `--green-600 #2F7D4F` (leaf), `--green-100 #E4F1E8`
  - `--earth-700 #7A5A3A`, `--earth-300 #D9C3A5`, `--sand-50 #FAF6EF` (warm background), `--surface #FFFFFF`
  - Status: success `#2E7D32`, warning `#B7791F`, danger `#C0392B`, info `#2B6CB0`
  - Use green for brand/primary only; use earth/sand for structure; status colours only for meaning.
- **Typography:** a readable humanist sans (e.g., Inter or Noto Sans) with **Noto Sans Devanagari** and **Noto Sans Gujarati** fallbacks loaded by locale. Base 16px (mobile 17px), line-height 1.5, contrast ≥ 4.5:1 (WCAG AA).
- **Shape:** 12–16px radius, soft shadows, generous spacing. Field cards use a crop colour chip + crop icon. Crop colours are defined in the crops table (`display_color`).
- **Iconography:** one icon set (Lucide), always paired with text labels for primary actions.

### 8.2 Interaction rules
- Touch targets ≥ 48px. Forms: one primary question per screen on mobile onboarding.
- Every technical field has a "Why we ask" expandable and Skip/Not available/Add later.
- **Simple mode (default)** vs **Expert mode** (toggle in settings/admin default): Expert shows raw metrics, confidence values, model metadata.
- **Farmer wording:** "Chance of rain" not "precipitation probability"; "Water loss estimate" not "evapotranspiration" (technical details in an expander).
- **Provenance chips** on any datum: `Measured` `You entered` `Weather service` `AI analysis` `Estimate` `Demo data`.

### 8.3 Required states (every data component)
Loading (skeleton) · Success · Empty (what's missing, why it matters, next action button) · Error (plain message + Retry) · Offline/unavailable (`Data unavailable` or `Connect weather service`). A shared `<DataState>` wrapper enforces this.

### 8.4 Dashboard layout

**Desktop (≥1024):** 12-col grid. Row 1: greeting + farm switcher; AI insight banner (only if a real insight exists). Row 2: Farm overview (fields/acres) · Today's weather · Today's tasks. Row 3: Crop status (cycle cards with stage progress) · Field health. Row 4: Irrigation · Market watch · Alerts. Row 5: Recent activity · Recent expenses · Profitability snapshot. Widgets independently fetch (no dashboard mega-request) and lazy-load below the fold.

**Tablet (640–1023):** 2 columns; sidebar collapses to icon rail.

**Mobile (<640):** single column, order: Alerts → Today's tasks → Weather → Crop status → Field cards (horizontal scroll) → Insight → Market → Activity. Bottom nav + quick-action button.

**Sample greeting/copy:** "Good morning, {name}" · "3 fields · 12.5 acres" · "Chance of rain 40%" · "2 tasks pending".

**Widget rules:** Farm Health Score shows only if crop-stage, at least one recent observation/task activity, and weather are present; otherwise "Farm Health Score unavailable — add more field information." Market Watch shows "Demo Market Data" label if provider not connected.

### 8.5 Accessibility
Keyboard-navigable, visible focus ring, semantic landmarks, labelled inputs with `aria-describedby` errors, colour never sole indicator, `prefers-reduced-motion` respected, screen-reader text for icon buttons, form errors summarized at top and inline.

---

## 9. FARMER WORKFLOW (module connections)

| From | To | Mechanism |
|---|---|---|
| Crop cycle created | Stage timeline + suggested tasks | Stage templates offset by sowing date |
| Weather forecast | Farm advisory | Rules engine reads forecast + active cycle + pending tasks (see §10.5) |
| Task (spraying/irrigation) | Weather check | Warn on tasks due when strong wind/rain forecast |
| Scouting observation | Diagnosis / expert / AI context | Observation can spawn a diagnosis |
| Diagnosis | Task | "Add follow-up task" from result |
| Task completion | Activity log, inventory decrement (Phase 2), cost entry (Phase 2) | Event handlers |
| Harvest record | Market watch, income prompt | Cycle → Harvested; prompt to record sale |
| Income + expenses | Profitability | Aggregates by cycle/field/crop |
| All of the above | AI context builder | Read-only assembly (§16) |

Implement cross-module effects through **domain events** (in-process event dispatcher in Laravel), e.g. `CropCycleCreated`, `TaskCompleted`, `ObservationRecorded`, `HarvestRecorded`. This keeps modules decoupled without introducing a message bus.

---

## 10. MODULE SPECIFICATIONS

### 10.1 Auth & onboarding
- Register/login/logout, forgot/reset, session (Sanctum cookie session for web; token for future mobile), email verification optional, phone OTP behind `OtpProvider` interface (disabled until configured; UI hides it rather than showing a dead button).
- Rate limit: login 5/min/IP+identifier; register 10/hr/IP; password reset 3/hr.
- Onboarding steps (each skippable, progress saved, "Complete later"): 1 personal, 2 farm location, 3 land area, 4 fields, 5 current crop, 6 irrigation, 7 optional soil, 8 language, 9 notifications. A "Finish setup" checklist card persists on the dashboard until done or dismissed. **Registration + skip-all must still produce a working dashboard.**

### 10.2 Farm management
Create/edit/soft-delete farm (delete requires confirmation and cascades soft-delete to fields with a 30-day restore window). Fields: name, village/district/state, lat/lng (optional), total area + display unit, farm type (enum: irrigated, rainfed, mixed, orchard, greenhouse, other), water sources (multi), notes. Farm detail: map with field polygons, field cards, summary.

### 10.3 Field management
Name, area (manual or computed from boundary; computed labelled *estimate from map*), boundary (GeoJSON polygon, validated: valid geometry, ≤ 500 vertices, area sanity check), GPS centroid, irrigation type, soil summary, current cycle, status (Empty/Planned/Active/Fallow), notes. Views: list with filters, detail with tabs (Overview · Crop · Soil · Activity · Observations · Irrigation · Health). Map: Leaflet; polygon fill by crop colour; label with name + crop; layer switcher listing Base (OSM-compatible), Satellite (disabled with "Connect satellite provider" until configured), Weather overlay (disabled), Vegetation index (disabled). Disabled layers show why; no dead toggles.

### 10.4 Crop management & calendar
- **Master data (admin):** crops (names + aliases per language, category, season, typical duration days, display colour), varieties, **stage templates** (ordered stages per crop with `start_offset_days`, `duration_days`, description) and **advisory items per stage** (activity type, text, source, authority, `requires_local_confirmation` flag). All translatable and status-managed (draft/published).
- **Crop cycle:** crop, variety, sowing date (nullable if Planned), expected harvest (estimate), actual harvest, area (≤ field area, validated), irrigation type, seed source/lot, notes, status enum (Planned, Sown, Growing, Flowering, Fruiting, Harvest Ready, Harvested, Completed). One *active* cycle per field per overlapping period (validated; intercropping allowed only via explicit flag).
- **Calendar:** cycle instance stages materialized from templates on creation; farmer can shift dates. Current stage = manual override if set else computed from dates (labelled *estimated from sowing date*). Advisory items are shown with the source; pesticide/fertilizer items must not contain invented dosages — they show "Follow local/official guidance" and the source if present.

### 10.5 Tasks & activities
- Types: irrigation, fertilizer, scouting, spraying, sowing, harvesting, machinery, labour, custom. Fields: title, description, field, crop cycle, due date/time, priority (low/medium/high), status (Pending, In Progress, Completed, Skipped), notes, attachments, `source` (manual / suggested / system), reminder offset, recurrence rule (RRULE string; **stored now, engine Phase 2**).
- Views: Today, Upcoming, Overdue, Calendar, History. Completing a task records `completed_at`, actor, optional actual details (e.g., water hours) and emits `TaskCompleted`.
- **Weather-aware advisory (fact vs interpretation):** an `AdvisoryRuleEngine` evaluates rules like *rain probability ≥ 60% within 24h AND irrigation/spray task due* → advisory "Review today's irrigation/spraying plan." Output object: `{fact: {...weather values, source, fetched_at}, advice: {text, rule_id, type: "rule"|"ai"}, related: {field, task}}`. UI shows a **Weather fact** block and a separate **Suggestion** block. Rules are admin-editable data, not code constants. If weather is unavailable, no advisory is generated.

### 10.6 Weather
- `WeatherProvider` interface: `current(lat,lng)`, `hourly(lat,lng,hours)`, `daily(lat,lng,days)`, `alerts(lat,lng)`; returns normalized DTOs with `source`, `fetched_at`, `units`.
- Adapters: `OpenMeteoProvider` (no key; check terms for commercial use **[VERIFY]**), `DemoWeatherProvider` (labelled **DEMO DATA**, deterministic), optional others (IMD/OpenWeather etc. **[VERIFY]**). Selected by `WEATHER_PROVIDER` env; default `demo` if unconfigured, with setup instructions shown to admins.
- Cache by rounded coordinates (e.g., 0.1°) TTL 30 min current / 3 h forecast; store snapshots in `weather_records` for history/AI. Stale data shows "Updated X ago"; provider failure shows error state with Retry and last cached value marked *stale*.
- Views: Today, Tomorrow, 7-day; hourly strip; alerts (heavy rain, high temperature, strong wind, frost risk, high humidity) generated by threshold config **only from real provider data** — never in demo mode except when the demo alert is explicitly labelled.
- Farmer wording: "Chance of rain", "Wind", "Feels hot"; technical panel optional.

### 10.7 Soil health
Six farmer paths on `/app/soil` as large cards: **A** Soil Health Card upload, **B** Soil test report upload, **C** I know my soil type (Sandy, Loamy, Clay, Black, Red, Alluvial, Other), **D** I don't know (Skip), **E** I want a soil test (Phase 2: informational page + admin-managed list of testing labs; if none configured, show official Soil Health Card portal link **[VERIFY]**), **F** I have sensor data (disabled until IoT enabled, with explanation).

Upload pipeline (state machine `uploaded → scanning → extracted → needs_confirmation → confirmed | failed`):
1. Validate (ext pdf/jpg/jpeg/png, MIME by content sniffing, ≤ 10 MB, filename discarded, storage key = UUID).
2. Virus-scan hook (ClamAV optional interface).
3. Store original in private storage.
4. **MVP:** farmer can view the file and *manually enter* any values they choose (all optional). **Phase 2:** OCR (Tesseract/cloud OCR behind `OcrProvider`) → parameter detection → unit normalization → range validation → **farmer confirms each value** before saving as structured `soil_tests`/`soil_parameters` with `source = farmer_report` and `confirmed_at`.
5. Dashboard: overall status shown only if enough parameters exist (rule-defined; else "Not enough data"), each parameter with value, unit, source, date; "Unknown values: N"; button **Improve soil data**. Never derive or fill missing values. Recommendations only when required parameters exist, referencing the report as source.

### 10.8 Irrigation
Record events (field, date, method, duration, water source, optional volume, notes), manual moisture observation (dry/moist/wet scale — farmer-friendly, no numeric requirement), irrigation schedule (links to recurring tasks). Sensor readings appear only if a device is registered and sending data; otherwise "No sensor connected."

### 10.9 Scouting
Observation: field, cycle (optional), date, GPS (auto if permitted, editable), category (pest, disease, weed, nutrient issue, irrigation issue, growth issue, other), severity (1–3, farmer scale), photos (≤ 6), notes, crop stage snapshot. Actions from an observation: create task, start diagnosis, ask expert. Data retained for AI context and analytics.

### 10.10 Notifications
Types: weather, crop_task, irrigation, disease, market, inventory, harvest, expert_reply, community_reply, scheme_update. Channels via `NotificationProvider`: in-app (MVP), email (Phase 2), SMS/push (adapter only). Per-user preferences per type × channel, quiet hours, language. Queue jobs with retry; `notifications` table is the in-app inbox; delivery attempts logged.

### 10.11 Phase-2/3 module specifications (summarized here, detailed in §16–21 and §26)
Diagnosis, assistant, knowledge, market, finance, inventory, machinery, schemes, reports, community, experts, marketplace as described in the sections referenced above and the phase plan.

### 10.12 Multi-language & voice
- Frontend: `next-intl` (or existing i18n) with `/locales/{en,hi,gu}/*.json` namespaced per feature. Lint rule/test fails on hard-coded JSX strings. Backend messages via error codes + translation keys. Content tables (crops, stages, advisory, knowledge, schemes) use a translations table pattern (`*_translations` with `locale`), falling back to English with a "Shown in English" indicator.
- Adding a language = add locale folder + font + `languages` row.
- **Voice readiness:** define `POST /api/ai/chat` to accept `input_mode` (`text|voice_transcript`) and `locale`; frontend `useVoiceInput` hook interface with a no-op implementation; `SpeechProvider` (STT/TTS) interface in backend. No voice UI in MVP.

### 10.13 Offline readiness
MVP: local draft persistence for long forms (IndexedDB), explicit "Saved on this device" vs "Saved" indicators, retry with exponential backoff for failed mutations, connection status banner. Phase 2: service worker cached shell + queued mutations with idempotency keys and sync status. **Never show "saved offline" unless a queue actually exists.**

### 10.14 Demo mode
`DEMO_MODE` seeder creates a clearly flagged demo tenant: `users.is_demo = true` and every demo row carries `is_demo` (or belongs to a demo user). Demo farmer: 1 farm, 3 fields (wheat, cotton, empty), crop cycles with stages, tasks, expenses, weather placeholder (demo provider), market placeholder, 2 diagnosis history entries (from `MockDiagnosisService`, labelled). UI shows a persistent **DEMO DATA** ribbon. Aggregations, admin stats, and analytics exclude demo rows by default. Demo and real data never share a user account.

---

## 11. DATABASE ARCHITECTURE (PostgreSQL)

### 11.1 Conventions
- PK: `id BIGINT GENERATED ALWAYS AS IDENTITY` for internal; `uuid UUID UNIQUE DEFAULT gen_random_uuid()` for public references in URLs/APIs.
- Timestamps `created_at`, `updated_at TIMESTAMPTZ NOT NULL`; soft delete `deleted_at TIMESTAMPTZ NULL` where marked **SD**.
- Content tables add `status` (draft/published/archived), `created_by`, `updated_by` (FK users).
- Money: `NUMERIC(14,2)` + `currency CHAR(3) DEFAULT 'INR'`. Area: `NUMERIC(12,4)` in **hectares** canonical + `area_input_value`/`area_input_unit` preserved. Coordinates: PostGIS `geometry(Point,4326)`/`geometry(Polygon,4326)` if PostGIS available, else `lat/lng NUMERIC(9,6)` + `boundary_geojson JSONB` (**decision rule:** check whether PostGIS extension is available; prefer it).
- Enums as `VARCHAR` + CHECK (or lookup tables) to ease migrations.
- Index every FK; partial unique indexes must respect `deleted_at IS NULL`.
- JSONB only for: `boundary_geojson` (fallback), AI structured responses, raw provider payloads, device payloads, settings.
- Extensions: `postgis` (optional), `pgvector`, `pg_trgm`, `citext`.

### 11.2 Core tables — full specification

**users** (SD)
| Column | Type | Null | Notes |
|---|---|---|---|
| id, uuid | | NN | PK / unique |
| name | varchar(120) | NN | |
| email | citext | Y | unique where not null |
| phone | varchar(20) | Y | E.164; unique where not null; at least one of email/phone required |
| password_hash | varchar | Y | null if OTP-only |
| preferred_language | varchar(8) | NN default 'en' | FK-like to languages.code |
| state, district, village | varchar(100) | Y | |
| is_demo | bool | NN default false | |
| experience_mode | varchar(10) | NN default 'simple' | simple/expert |
| onboarding_status | jsonb | NN default '{}' | step completion |
| email_verified_at, phone_verified_at, last_login_at | timestamptz | Y | |
Indexes: unique(email), unique(phone), idx(state, district). Relations: hasMany farms, role_user, notifications.

**roles** (id, name unique, label) · **permissions** (id, name unique, group) · **role_permission** (role_id, permission_id, PK composite) · **role_user** (user_id, role_id, PK composite). Seeded: farmer, expert, buyer, admin.

**farms** (SD)
| Column | Type | Null | Notes |
|---|---|---|---|
| id, uuid | | NN | |
| user_id | FK users | NN | idx |
| name | varchar(120) | NN | unique per user (partial, not deleted) |
| village, district, state, country | varchar | Y/NN country default 'IN' | |
| location | geometry(Point) or lat/lng | Y | |
| total_area_ha | numeric(12,4) | Y | |
| area_input_value, area_input_unit | numeric / varchar(20) | Y | |
| farm_type | varchar(20) | Y | CHECK enum |
| water_sources | text[] or jsonb | Y | |
| notes | text | Y | |

**fields** (SD)
| id, uuid | | | |
|---|---|---|---|
| farm_id | FK farms | NN | idx |
| name | varchar(120) | NN | unique(farm_id,name) partial |
| area_ha | numeric(12,4) | Y | |
| area_source | varchar(20) | NN | 'manual' or 'computed' |
| boundary | geometry(Polygon) or boundary_geojson jsonb | Y | GiST index if PostGIS |
| centroid | point or lat/lng | Y | |
| irrigation_type | varchar(20) | Y | drip/sprinkler/flood/rainfed/other/unknown |
| soil_type | varchar(20) | Y | includes 'unknown' |
| status | varchar(20) | NN default 'empty' | empty/planned/active/fallow |
| notes | text | Y | |

**crops** (content; translations in `crop_translations`)
id, slug unique, category, season(s) text[], typical_duration_days int Y, display_color char(7), icon, status, created_by, updated_by.
**crop_translations**: crop_id, locale, name, aliases text[], description; unique(crop_id, locale); trigram index on name/aliases.
**crop_varieties**: id, crop_id FK, name, duration_days Y, notes, status.
**crop_stages** (templates): id, crop_id FK, order_index, code, start_offset_days, duration_days, status; unique(crop_id, order_index). **crop_stage_translations**: stage_id, locale, name, description.
**crop_stage_advisories**: id, stage_id, activity_type, requires_local_confirmation bool, source_id FK knowledge_sources Y, status; **crop_stage_advisory_translations**: advisory_id, locale, text.

**crop_cycles** (SD)
| id, uuid | | | |
|---|---|---|---|
| field_id | FK fields | NN | idx |
| crop_id | FK crops | NN | idx |
| variety_id | FK crop_varieties | Y | |
| custom_crop_name | varchar | Y | for crops not in master |
| status | varchar(20) | NN default 'planned' | CHECK 8 values |
| sowing_date | date | Y | |
| expected_harvest_date | date | Y | |
| expected_harvest_basis | varchar | Y | 'estimate_from_master'/'farmer' |
| actual_harvest_date | date | Y | |
| area_ha | numeric | Y | ≤ field area (app-validated) |
| irrigation_type | varchar | Y | |
| seed_info | text | Y | |
| current_stage_override_id | FK cycle_stages | Y | |
| quantity_harvested, quantity_unit | numeric / varchar | Y | |
| notes | text | Y | |
Indexes: (field_id, status), (crop_id), (sowing_date).

**cycle_stages** (materialized): id, crop_cycle_id FK, template_stage_id FK Y, name_snapshot, start_date, end_date, order_index, status(pending/current/done/skipped). Unique(crop_cycle_id, order_index).

**tasks** (SD)
id, uuid, user_id, farm_id, field_id Y, crop_cycle_id Y, type, title, description, due_at timestamptz, priority, status, source (manual/suggested/system), recurrence_rule Y, reminder_minutes Y, completed_at Y, completed_by Y, completion_details jsonb Y, skipped_reason Y. Indexes: (user_id,status,due_at), (field_id), (crop_cycle_id).
**task_attachments** / generic **files** table: id, uuid, owner_user_id, storage_key, original_name_sanitized, mime, size_bytes, sha256, purpose, `attachable_type/attachable_id` (polymorphic), created_at; index (attachable_type, attachable_id).

**weather_records**: id, farm_id Y, lat_round, lng_round, kind (current/hourly/daily), valid_at, payload_normalized jsonb, provider, fetched_at; unique(lat_round,lng_round,kind,valid_at,provider); index fetched_at.
**weather_alerts**: id, farm_id, type, severity, starts_at, ends_at, source_provider, raw_ref, status.
**advisory_rules**: id, code unique, condition jsonb, message_key, applies_to_task_types text[], status, created_by. **advisories**: id, user_id, farm_id, field_id Y, task_id Y, rule_id, fact jsonb, message_key, generated_at, dismissed_at.

**soil_profiles**: id, field_id unique FK, soil_type, path_chosen (health_card/report/known_type/unknown/test_requested/sensor), notes.
**soil_reports**: id, uuid, field_id, file_id FK, report_type (health_card/lab_report), status (state machine §10.7), lab_name Y, sampled_on Y, extracted_payload jsonb Y, confirmed_at Y, failure_reason Y.
**soil_tests**: id, soil_report_id Y, field_id, tested_on Y, source (farmer_report/manual/sensor/lab), confirmed bool.
**soil_parameters**: id, soil_test_id FK, code (ph, ec, oc, n, p, k, s, zn, fe, cu, mn, b), value numeric, unit, rating Y (low/medium/high as printed on report, not computed), unique(soil_test_id, code).

**crop_diagnoses** (Phase 2): id, uuid, user_id, field_id Y, crop_cycle_id Y, observation_id Y, detected_crop_id Y, status (queued/quality_failed/completed/inconclusive), result jsonb (structured; see §16), confidence_label (high/medium/low), confidence_score numeric Y (only if model returns it), model_name, model_version, is_mock bool NN, expert_question_id Y, created_at. **diagnosis_images**: id, diagnosis_id, file_id, view_type (whole_plant/leaf_close/stem/fruit/leaf_underside), quality_result jsonb. **diseases** / **pests** (content + translations): id, slug, crop_ids m2m (`crop_disease`), symptoms, management_notes, source_id, status.

**farm_observations**: id, uuid, user_id, field_id, crop_cycle_id Y, observed_at, category, severity smallint Y, location point Y, stage_snapshot, notes; photos via `files`.
**irrigation_records**: id, field_id, crop_cycle_id Y, irrigated_at, method, duration_minutes Y, volume_l Y, water_source Y, moisture_note (dry/moist/wet) Y, notes, source (manual/sensor).

### 11.3 Phase 2/3 tables (purpose + key columns)
| Table | Purpose | Key columns |
|---|---|---|
| inventory_items (SD) | Stock items | user_id, farm_id, category, name, unit, quantity, min_stock, supplier, unit_cost, expiry_date Y |
| inventory_transactions | Stock movements | item_id, type (purchase/use/adjust), quantity, related_task_id Y, occurred_on |
| machinery, machinery_maintenance | Equipment + service | machinery: user_id, type, purchase_date, cost, next_service_due; maintenance: machinery_id, serviced_on, cost, notes |
| expenses (SD) | Costs | user_id, farm_id, field_id Y, crop_cycle_id Y, category, amount, date, vendor, receipt_file_id Y, note |
| income_records (SD) | Sales | crop_cycle_id, quantity, unit, price_per_unit, gross_amount, buyer, market, sold_on, transport_cost, other_deductions |
| market_commodities, market_markets | Reference | commodity: crop_id Y, name, variety; market: name, state, district, lat/lng, external_id |
| market_prices | Price observations | market_id, commodity_id, price_date, min_price, max_price, modal_price Y, arrival_qty Y, unit, source, fetched_at, is_demo; unique(market_id, commodity_id, price_date, source) |
| knowledge_sources | Authority registry | name, authority_type (government/research/expert/internal), url, license_note |
| knowledge_documents | Documents | source_id, title, doc_type, crop_id Y, state Y, language, topic, published_on Y, file_id Y, status, ingest_status |
| knowledge_chunks | RAG chunks | document_id, chunk_index, content, section_ref Y, metadata jsonb, embedding vector(N), tsv tsvector; HNSW/IVFFlat index + GIN(tsv) |
| ai_conversations, ai_messages | Chat | user_id, title; message: role, content, structured jsonb, context_refs jsonb, model, tokens_in/out, safety_flags |
| ai_usage_logs | Cost/usage | user_id, provider, model, latency_ms, tokens, intent, success |
| recommendations | Explainable output | user_id, field_id, cycle_id, action, reason, evidence jsonb, confidence_label, provenance (rule/ai/ml), generated_at, expires_at, dismissed_at |
| government_schemes | Schemes | state Y, category, official_url NN, last_verified_on NN, status; + translations (name, description, eligibility, benefits, documents) |
| community_posts, community_comments, community_likes, content_reports | Community | post: user_id, type (post/question), crop_id Y, location tag, body; comment: post_id, user_id, is_expert_answer |
| expert_questions, expert_answers | Consultation | question: user_id, status (open/under_review/answered/closed), diagnosis_id Y, field/crop refs; answer: expert_id, body |
| marketplace_listings | Listings | user_id, crop_id, quantity, unit, expected_price, harvest_date, location, quality_notes, status; **listing_inquiries** |
| iot_devices, iot_readings | Sensors | device: field_id, type, external_id, api_key_hash, last_seen; readings: device_id, metric, value, unit, recorded_at (partition by month if large) |
| satellite_observations | Remote sensing | field_id, provider, captured_on, index_type (ndvi…), stats jsonb, cloud_cover, tile_ref |
| notifications, notification_preferences, notification_deliveries | Inbox/prefs | notif: user_id, type, title_key, body_key, params jsonb, read_at; prefs: user_id, type, channel, enabled |
| audit_logs | Accountability | actor_id, action, resource_type, resource_id, old_values jsonb, new_values jsonb, ip, user_agent, created_at (append-only) |
| system_settings, ai_configurations, languages, analytics_events | Config | settings key/value jsonb (secrets never stored here); ai_configurations versioned rows |

### 11.4 ER relationships (narrative)
- `users 1—N farms 1—N fields 1—N crop_cycles`; `crop_cycles N—1 crops`, `crop_cycles 1—N cycle_stages`, `crops 1—N crop_stages (templates)`.
- `fields 1—1 soil_profiles`, `fields 1—N soil_reports 1—N soil_tests 1—N soil_parameters`.
- `tasks`, `farm_observations`, `irrigation_records`, `expenses` attach to `field` and optionally `crop_cycle`; finance rolls up through the cycle.
- `crop_diagnoses 1—N diagnosis_images`, optionally linked to an observation and an expert question.
- `knowledge_documents 1—N knowledge_chunks`; `ai_messages` reference retrieved chunk ids in `context_refs` for citations.
- `roles N—N permissions`, `users N—N roles`.
- Polymorphic `files` used by tasks, observations, receipts, diagnosis images, reports.
- **Ownership chain for authorization:** any row → field → farm → user. Store `farm_id` denormalized on high-volume tables (tasks, expenses) to make policy checks and queries cheap.

---

## 12. API ARCHITECTURE

### 12.1 Conventions
- Base `/api/v1`. JSON. Auth: session cookie (SPA) with CSRF token, or `Authorization: Bearer` for tokens. Locale via `Accept-Language` or `X-Locale`.
- **Success envelope:** `{"data": {...}, "meta": {"page":1,"per_page":20,"total":135}}` (`meta` only for lists).
- **Error envelope:** `{"error": {"code":"validation_failed","message":"...","details":{"field":["msg_key"]},"request_id":"..."}}`. HTTP: 400, 401, 403, 404, 409, 413, 415, 422 (validation), 429, 500, 503 (provider unavailable → `code: provider_unavailable`).
- Pagination: `page`, `per_page` (max 100); filters as query params; sorting `sort=-created_at`.
- Idempotency: `Idempotency-Key` header on POSTs that create records from queued clients.
- Public IDs are UUIDs. Every list endpoint is scoped to the authenticated owner by policy.
- OpenAPI 3.1 file generated/maintained (e.g., Scribe/L5-Swagger) and served at `/api/docs` in non-production.

### 12.2 MVP endpoints

Auth: role column `—` = any authenticated; `F` = farmer; `A` = admin permission.

| Method | URL | Purpose | Auth | Key request | Validation | Success | Errors |
|---|---|---|---|---|---|---|---|
| POST | /auth/register | Create farmer | none | name, mobile|email, password, state, district, village, language | name 2–120; at least one of mobile/email; mobile E.164; password ≥ 10; unique | 201 user + session | 422, 429 |
| POST | /auth/login | Login | none | identifier, password | required | 200 user | 401 `invalid_credentials`, 429 |
| POST | /auth/logout | Logout | user | — | — | 204 | 401 |
| POST | /auth/forgot-password | Send reset | none | identifier | required | 202 (always, no enumeration) | 429 |
| POST | /auth/reset-password | Reset | none | token, password | strong password | 200 | 422 `token_invalid` |
| GET/PATCH | /me | Profile, language, mode, notification prefs | user | partial fields | language in supported list | 200 | 422 |
| PATCH | /me/onboarding | Save step | user | step, data, skipped | step enum | 200 | 422 |
| GET | /farms | List own farms | F | page | — | 200 list | 401 |
| POST | /farms | Create | F | name, state, district, village, lat?, lng?, area{value,unit}?, farm_type?, water_sources? | name required; area>0; lat/lng ranges; farm limit per user (config) | 201 | 422 |
| GET | /farms/{id} | Detail with field summaries | F owner | — | — | 200 | 403, 404 |
| PUT | /farms/{id} | Update | F owner | as create | | 200 | 403,404,422 |
| DELETE | /farms/{id} | Soft delete | F owner | — | | 204 | 403,404,409 if active cycles unless `force` |
| GET | /fields?farm_id= | List | F | | | 200 | |
| POST | /fields | Create | F | farm_id, name, area?, boundary(GeoJSON)?, irrigation_type?, soil_type? | valid GeoJSON polygon; ≤ 500 vertices; area sanity | 201 | 422 |
| GET/PUT/DELETE | /fields/{id} | Detail/update/delete | F owner | | | | |
| GET | /crops?q=&season= | Search crop master (localized) | — | | | 200 | |
| GET | /crops/{id}/stages | Stage templates | — | | | 200 | |
| GET | /crop-cycles?field_id=&status= | List | F | | | 200 | |
| POST | /crop-cycles | Create + materialize stages | F | field_id, crop_id | custom_crop_name, variety_id?, sowing_date?, expected_harvest_date?, area?, irrigation_type?, status? | area ≤ field area; harvest ≥ sowing; no overlap unless intercrop | 201 with stages | 409 `cycle_overlap`, 422 |
| GET/PUT | /crop-cycles/{id} | Detail/update | F owner | | | | |
| POST | /crop-cycles/{id}/advance-stage | Manual stage set | F owner | stage_id | belongs to cycle | 200 | 422 |
| POST | /crop-cycles/{id}/harvest | Record harvest | F owner | actual_date, quantity?, unit? | date ≥ sowing | 200 | 422 |
| GET | /tasks?status=&due=today&field_id= | List | F | | | 200 | |
| POST | /tasks | Create | F | title, type, due_at?, field_id?, crop_cycle_id?, priority, notes, recurrence_rule? | title 2–200; due valid; refs owned | 201 | 422 |
| PATCH | /tasks/{id} | Update / status | F owner | | status enum | 200 | |
| POST | /tasks/{id}/complete | Complete | F owner | details? | | 200 | |
| GET | /weather?farm_id= | Current + provider status | F | | | 200 `{data, source, fetched_at, is_demo, stale}` | 503 `provider_unavailable` |
| GET | /weather/forecast?farm_id=&range=today|tomorrow|7d | Forecast | F | | | 200 | 503 |
| GET | /weather/alerts?farm_id= | Alerts | F | | | 200 (empty in demo) | |
| GET | /advisories?farm_id= | Weather-aware advisories (fact + advice) | F | | | 200 | |
| GET | /soil/profile?field_id= · PUT | Soil path/type | F | soil_type, path | enum | 200 | |
| POST | /soil/reports | Upload (multipart) | F | field_id, report_type, file | ext/MIME/size; owned field | 201 status `uploaded` | 413, 415, 422 |
| GET | /soil/reports/{id} | Status + parameters | F owner | | | 200 | |
| PUT | /soil/reports/{id}/parameters | Manual/confirmed values | F owner | list{code,value,unit} | code enum; plausible ranges (warn, don't block) | 200 | 422 |
| GET | /soil/summary?field_id= | Dashboard summary | F | | | 200 with `unknown_count`, `data_sufficient` | |
| POST/GET | /observations | Scouting | F | field_id, category, notes, photos[] | | | |
| POST/GET | /irrigation-records | Irrigation | F | | | | |
| GET | /dashboard/summary | Lightweight counts only; widgets call their own endpoints | F | | | 200 | |
| GET | /notifications, POST /notifications/{id}/read, PUT /notification-preferences | Inbox/prefs | F | | | | |
| GET | /files/{uuid} | Signed private download | owner | | | 302 signed URL | 403 |
| GET | /meta/languages, /meta/config | Public config | none | | | | |
| — | **Admin (permission `admin.*`)** | | | | | | |
| GET/POST/PUT/DELETE | /admin/users, /admin/roles, /admin/permissions | User/RBAC management | admin.manage_users | | | | audit logged |
| CRUD | /admin/crops, /admin/crops/{id}/stages, /admin/stages/{id}/advisories, /admin/advisory-rules | Content | admin.manage_content | | status workflow | | audit logged |
| GET | /admin/audit-logs | View logs | admin.view_audit | filters | | | |
| GET | /admin/system/health | Providers status (weather/market/AI), queue, DB | admin | | | | |

### 12.3 Phase 2/3 endpoints (contract-level)
- `POST /diagnosis` (multipart, images[], field_id?, cycle_id?), `GET /diagnosis/{id}`, `GET /diagnosis?field_id=` — 202 async when queued, poll or SSE.
- `POST /ai/chat` (`{conversation_id?, message, input_mode, locale, attachments[], farm_id?, field_id?}`) → structured response (§16); `GET /ai/conversations`, `GET /ai/conversations/{id}`.
- `GET /market/prices?crop=&state=&district=&market=&from=&to=`, `GET /market/trends`, `GET /market/markets/nearby?farm_id=`; `GET /market/status`.
- `GET/POST /expenses`, `/income`, `GET /finance/profitability?cycle_id|field_id|from|to`.
- `CRUD /inventory-items`, `/inventory-transactions`, `/machinery`, `/machinery/{id}/maintenance`.
- `GET /knowledge`, `GET /knowledge/{slug}`, `GET /search?q=&types=`; `GET /schemes`, `GET /schemes/{id}`.
- `GET /reports/{type}?format=pdf|csv|xlsx` → async job → signed file URL.
- `GET/POST /community/posts`, `/community/posts/{id}/comments`, `POST /content-reports`; `POST /expert-questions`, `PATCH /expert-questions/{id}` (expert), `POST /expert-questions/{id}/answers`.
- `POST /marketplace/listings`, `GET /marketplace/listings?…`, `POST /marketplace/listings/{id}/inquiries`.
- `POST /iot/readings` (device key auth, HMAC-signed, rate-limited), `GET /iot/devices`, `GET /fields/{id}/sensor-readings`.
- `GET /fields/{id}/vegetation?from&to` → 200 `{available:false, reason:"no_provider"}` until adapter is configured.
- Admin: `/admin/ai-config`, `/admin/rag/documents` (upload, ingest, reindex), `/admin/market/import`, `/admin/schemes`, `/admin/analytics`.

---

## 13. FRONTEND ARCHITECTURE

**Rule zero:** inspect the repository first. If a frontend exists (framework, router, UI kit, state library), **keep it** unless there is a documented blocking reason. The stack below is the default only for a greenfield frontend.

**Default stack:** Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS with design tokens · TanStack Query (server state) · React Hook Form + Zod (forms/validation) · Zustand or React context (small UI state only: selected farm, mode) · next-intl · Leaflet (+ react-leaflet) · Recharts · Lucide icons · Playwright + Vitest + Testing Library + MSW.

```
src/
  app/                    # routes, layouts (public), (auth), (app), (admin)
  features/
    farms/ fields/ crops/ tasks/ weather/ soil/ scouting/ irrigation/
    dashboard/ notifications/ onboarding/ settings/
    diagnosis/ assistant/ market/ finance/ inventory/ knowledge/ schemes/   # Phase 2
    community/ experts/ marketplace/ iot/ satellite/                        # Phase 3
    admin/
      (each feature: components/ hooks/ api.ts schemas.ts types.ts index.ts)
  components/ui/          # Button, Input, Card, Dialog, Tabs, Skeleton, Toast, Chip...
  components/domain/      # DataState, ProvenanceChip, FieldCard, CropStageBar, StatTile, MapView
  lib/                    # api-client, auth, i18n, format (units/dates/currency), analytics
  hooks/                  # useOnlineStatus, useDraft, useSelectedFarm, useVoiceInput(stub)
  services/               # thin wrappers only if features/*/api.ts is insufficient
  types/ utils/
  locales/{en,hi,gu}/*.json
```

**API client:** single typed fetch wrapper: base URL from env, CSRF handling, locale header, error-envelope parsing into typed `ApiError`, retry with backoff for idempotent GETs, request-id propagation, 401 → redirect to login preserving destination. Types generated from OpenAPI where possible.

**State rules:** server data in TanStack Query with feature-scoped keys; never copy server data into global stores. Forms use Zod schemas mirrored from backend rules (backend remains the authority).

**Component rules:** no component > ~250 lines; every data component uses `<DataState status …>` supplying loading/empty/error/unavailable; every user-facing string comes from i18n; every icon-only button has an `aria-label`; provenance chips required wherever data has a source.

**Performance:** route-level code splitting; Leaflet/Recharts dynamically imported; images via `next/image` with resizing; client-side compression of photo uploads (max ~1600px) before upload; dashboard widgets fetch independently and lazily; lists paginated.

**PWA readiness (MVP):** manifest, icons, `useDraft` hook. Service worker in Phase 2.

---

## 14. BACKEND ARCHITECTURE

**Rule zero:** inspect the repository first. If a backend exists (Laravel, Node, Django, etc.), extend it. The default below is for greenfield.

**Default:** Laravel (PHP 8.3+) modular monolith · PostgreSQL 15+ · Redis (cache, queues, rate limiting) · Laravel Sanctum · Laravel Horizon or queue workers · S3-compatible storage via Flysystem.

**Module layout (`app/Modules/*` or domain folders):** `Identity, Farms, Crops, Tasks, Weather, Soil, Diagnosis, Assistant, Knowledge, Market, Finance, Inventory, Community, Marketplace, Notifications, Admin, Iot, Satellite, Reports, Audit`.
Each module: `Http/Controllers` (thin) · `Http/Requests` (validation) · `Http/Resources` (response shaping) · `Actions/Services` (business logic) · `Policies` · `Models` · `Events/Listeners` · `Jobs` · `Contracts` (provider interfaces) · `Providers` (adapters) · `Tests`.

**Cross-cutting:**
- Policies enforce ownership (`farm.user_id`), gates enforce permissions.
- Form Requests for all validation; error codes/keys, not raw English strings.
- Domain events for cross-module reactions (§9). Queue heavy work (OCR, embeddings, reports, notifications, diagnosis).
- Central exception handler → error envelope; `request_id` middleware; structured JSON logs.
- Rate limiting per route group; `throttle:auth`, `throttle:uploads`, `throttle:ai`.
- Audit logging via model observers for configured models + explicit calls for admin actions.
- Scheduler: weather refresh for active farms (batched by rounded coordinates), task reminder dispatch, low-stock checks, market ingestion, scheme "last verified" staleness flag.

**Provider interfaces (in `Contracts`, bound by config):**
`WeatherProvider`, `MarketDataProvider`, `AIProvider` (chat, vision, structured output), `EmbeddingProvider`, `VectorStore`, `MapProvider` (frontend tile config), `NotificationProvider`, `StorageProvider`, `OcrProvider`, `SpeechProvider`, `SatelliteProvider`, `DiagnosisModel`, `OtpProvider`. Each has a `Demo/Mock` implementation clearly labelled, a real adapter, a `status()` method (for admin health), and contract tests run against all implementations.

**Config (`.env.example`, every variable commented):** `APP_*`, `DB_*`, `REDIS_*`, `FILESYSTEM_DISK`, `S3_*`, `WEATHER_PROVIDER`, `WEATHER_API_KEY`, `MARKET_PROVIDER`, `MARKET_API_KEY`, `AI_PROVIDER`, `AI_API_KEY`, `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`, `EMBEDDING_PROVIDER`, `VECTOR_STORE`, `OCR_PROVIDER`, `MAIL_*`, `SMS_*`, `PUSH_*`, `MAP_TILE_URL`, `DEMO_MODE`, `SENTRY_DSN`. Secrets never reach the frontend; only `NEXT_PUBLIC_*` non-secret values.

---

## 15. AI ARCHITECTURE

### 15.1 Topology
Laravel (source of truth, auth, data) ⇄ **Python FastAPI AI service** (LLM orchestration, retrieval, vision, OCR, ML). Laravel calls the AI service over internal HTTP with a service token; the AI service never receives raw database access — Laravel passes an assembled, minimal **context bundle**. The frontend never talks to the AI service or provider directly.

### 15.2 Provider abstraction
`AIProvider` interface: `chat(messages, tools?, response_schema?)`, `vision(images, prompt, schema)`, `embed(texts)`. Adapters selected by admin config (OpenAI / Anthropic / Google / local) **[VERIFY current SDK/model names at implementation time]**. No application logic keyed to a specific vendor's message format. Config (model, temperature, max tokens, system prompt version, thresholds) lives in versioned `ai_configurations`; changes audited; keys only in env/secret store.

### 15.3 Assistant pipeline (context engine)
```
User message
 → Safety pre-check (length, injection heuristics, attachments scanned)
 → Intent detection (small classifier/LLM call with fixed label set)
 → Context planner (intent → required context set)
 → Retrievers (farm/crop/weather/soil/activity/knowledge/market) with freshness metadata
 → Context bundle (compact, provenance-tagged, token-budgeted)
 → LLM with system prompt + rules + schema
 → Post-checks (schema valid, citations exist, no dosage without source, no invented numbers)
 → Structured response → UI render → log (ai_messages, ai_usage_logs)
```

### 15.4 Intent → required context

| Intent | Farm ctx | Crop/stage | Weather | Soil | Activities/obs | Knowledge (RAG) | Market | Notes |
|---|---|---|---|---|---|---|---|---|
| today_plan ("What should I do today?") | farms/fields | active cycles + stage | 48h forecast | — | pending/overdue tasks, last 7d activity | stage advisories | — | Uses rule advisories as inputs |
| crop_check | field | cycle, stage, days since sowing | last 7d + next 3d | summary | recent observations/diagnoses | crop guide | — | |
| harvest_ready | field | expected/actual dates, stage | next 7d | — | observations | crop maturity docs | recent price (if available) | Must state uncertainty; never confirm from dates alone |
| leaf_problem / disease | field, crop | stage | humidity/rain trend | — | recent observations | disease docs (crop+region filtered) | — | If image attached, route to vision/diagnosis; always offer expert |
| irrigation_timing | field, irrigation type | stage water need docs | rain forecast | soil type | last irrigation, moisture note | irrigation docs | — | |
| explain_soil_report | field | current crop | — | confirmed parameters only | — | soil interpretation docs | — | Only confirmed values; state missing ones |
| crop_planning | farm/fields | previous crop | season climate | soil type/report | history | crop suitability docs | prices (context, labelled) | If insufficient inputs → ask to add data; no prediction |
| market_info | crop, location | — | — | — | — | — | provider prices + freshness | If provider unavailable → say so |
| scheme_info | state | — | — | — | — | schemes table (verified only) | — | Quote official URL + last verified |
| general_agri | minimal | — | — | — | — | RAG | — | |
| out_of_scope / unsafe | — | — | — | — | — | — | — | Polite decline |

### 15.5 Structured response schema
```json
{
  "summary": "string",
  "observations": [{"text": "", "provenance": "measured|user_entered|external|estimate|assumption"}],
  "recommendations": [{"action": "", "reason": "", "evidence_refs": ["ev1"], "priority": "low|medium|high", "needs_expert_confirmation": false}],
  "evidence": [{"id": "ev1", "type": "weather|soil_report|task|knowledge|market|observation", "label": "", "source": "", "date": "", "section": null, "url": null}],
  "confidence": "high|medium|low|insufficient_data",
  "limitations": ["string"],
  "follow_up_questions": ["string"],
  "disclaimer_key": "agri_decision_support"
}
```
UI renders sections with provenance chips and a "Sources" list. Server-side validator rejects responses that cite non-existent evidence ids.

### 15.6 Guardrails
- System prompt rules: don't invent current facts; use only provided context for weather/market/soil; say "I don't have that information" when absent; never give pesticide/fertilizer **dosages** unless quoted from a cited official document in context, otherwise say to follow the product label / local agriculture officer; recommend expert confirmation for chemical, high-cost, or irreversible decisions; respond in the user's language.
- **Prompt injection:** retrieved documents and uploaded files are delimited as untrusted data; system prompt states instructions inside them are to be ignored; strip/flag suspicious patterns; tool use is allow-listed and read-only; the model cannot trigger writes (any write is a user-confirmed action in the UI).
- **Data leakage:** context bundle includes only the requesting user's data; PII minimized (no phone/email in prompts); per-user conversation isolation; provider data-retention settings reviewed **[VERIFY]**.
- Rate limits and daily quotas per user; cost logging.
- Evaluation set (golden Q&A per intent, Gujarati/Hindi included) run in CI against the mock provider and manually against real providers before release.

### 15.7 Diagnosis service
`DiagnosisModel` interface: `analyze(images[], context) → {crop, issues[{name, kind(disease|pest|deficiency|stress), likelihood_label, confidence_score?, symptoms_observed[], next_steps[]}], quality, limitations}`.
1. **Image quality check** (blur, brightness, size, subject presence) → if failed, return actionable guidance ("Take a closer photo of the leaf in daylight").
2. Crop detection (or use the cycle's crop; disagreement is surfaced).
3. Issue analysis via chosen model. **Production model is a separate decision** (vision LLM vs. purpose-trained classifier vs. third-party API); implement the interface + `MockDiagnosisService` (returns clearly flagged sample outputs, `is_mock=true`, UI banner "Sample result — no real model connected").
4. **Confidence gating:** thresholds from config; below threshold → "I could not confidently identify the issue. Please upload a clearer image or consult an agriculture expert." Never show numeric accuracy claims unless the model returns calibrated scores; wording is "Possible / Likely / Needs confirmation".
5. Result screen: possible issue(s), symptoms matched, next steps (from knowledge base with sources; no invented dosages), **Consult Expert** (always), Add follow-up task, Save to field history.

---

## 16. RAG ARCHITECTURE

**Store:** PostgreSQL + `pgvector` (default) with hybrid search; alternative `VectorStore` adapters possible.

**Ingestion pipeline (async jobs, per document):**
1. **Register** document with source (authority type is mandatory), crop, state, language, topic, doc type, date, license note.
2. **Parse:** PDF (text-layer first; OCR fallback), HTML, DOCX, Markdown. Preserve headings/page numbers.
3. **Clean** (dedupe headers/footers), language-detect.
4. **Chunk:** structure-aware (by heading), 300–600 tokens, ~10–15% overlap, keep `section_ref` and page.
5. **Metadata:** inherit document metadata + per-chunk section/page; add `authority_rank`.
6. **Embed** via `EmbeddingProvider` (multilingual model required for Hindi/Gujarati **[VERIFY quality]**); store `embedding_model` version per chunk so re-embedding is possible.
7. **Index:** vector index (HNSW) + `tsvector` GIN (language-appropriate config) + btree on metadata.
8. **Status:** `ingest_status` (queued/parsed/embedded/failed); admin can reindex.
9. **Review gate:** only `published` documents are retrievable; user-uploaded farmer documents are scoped private to that user and never mixed into global retrieval.

**Retrieval (hybrid):** metadata filter (crop, region incl. state→national fallback, language incl. English fallback) → parallel semantic top-k (e.g., 20) + keyword/BM25-style top-k (20) → Reciprocal Rank Fusion → optional cross-encoder rerank to top 5–8 → authority boost (government/official > research > expert > internal) and recency boost for time-sensitive topics → context assembly with citation ids.
Example: "cotton pest control Gujarat" → filters crop=cotton, region∈{Gujarat, India}, language∈{user, en}.

**Citations:** each answer lists Source name, document title, date, section/page, and URL when available. If nothing relevant is retrieved above a similarity threshold, the assistant says the knowledge base has no matching guidance (no ungrounded fabrication dressed as a source).

**Security:** documents treated as untrusted (§15.6); ingest via allow-listed types, size limits, scan; admin-only global ingestion; audit every ingest/delete.

**Quality:** retrieval evaluation set (query → expected docs), tracked recall@k; admin RAG screen shows chunk counts, failures, last indexed.

---

## 17. ML ARCHITECTURE

Interfaces only until data and models justify more; each independently replaceable and never called from UI code.

| Interface | Input | Output | Preconditions (else return `insufficient_data`) | Status |
|---|---|---|---|---|
| `CropRecommendationModel` | location, season, climate normals/rainfall, soil type (or report), irrigation availability, previous crop | ranked crops + reasons + confidence label | location + season + (soil type or irrigation) minimum | Phase 3; rules-based baseline using admin-managed crop suitability tables first |
| `DiseaseDiagnosisModel` | images + context | see §15.7 | quality passed | Mock → real |
| `YieldPredictionModel` | cycle history, weather, inputs | range + uncertainty | ≥ N historical cycles/region data | Later |
| `PriceForecastModel` | historical prices | range + uncertainty | ≥ N months history for that market/crop | Later |

Each prediction stores model name/version, inputs hash, output, confidence, timestamp, and is labelled **Prediction** in UI. Refuse rather than guess: response `{"status":"insufficient_data","missing":["soil_type","season"],"message_key":"add_more_farm_info"}` → UI "Add more farm information to generate a recommendation."

---

## 18. WEATHER / MARKET INTEGRATIONS

### 18.1 Weather
Covered in §10.6. Adapter checklist: normalize units (°C, mm, km/h, %); timezone-correct (`Asia/Kolkata` default per farm); rate-limit and cache; map provider alert codes to internal types; store `source` + `fetched_at`; contract tests with recorded fixtures; graceful degradation.

### 18.2 Market / Mandi
- `MarketDataProvider`: `prices(filters)`, `markets(state, district)`, `commodities()`, `history(market, commodity, range)`, `status()`.
- **Adapters:** `AgmarknetProvider` via official open data (data.gov.in daily mandi price resource; requires API key) **[VERIFY endpoint, schema, terms, update frequency]**; `CsvImportProvider` (admin uploads official CSV); `DemoMarketProvider` (**"Demo Market Data"** watermark).
- **Ingestion:** scheduled job fetches, normalizes (units to ₹/quintal, name matching to `market_commodities` via alias table), upserts on unique key, records `fetched_at`; failures logged and surfaced in admin "Market data status" with last successful run.
- **UI:** filters (crop, state, district, market, date), table (market, location, min, max, modal, arrival, date, **source**, **fetched/updated time**), price-trend chart (from stored history only), nearest markets by farm coordinates, "Last updated" always visible. If data older than threshold: "Latest available price is from {date}". If provider missing: setup/demo state. **No hard-coded prices anywhere.**

---

## 19. IOT ARCHITECTURE

**Scope by phase:** Phase 1 – schema-free (manual moisture only). Phase 3 – ingestion + display.

Flow: `Sensor → ESP32 → HTTPS POST (or MQTT via broker bridge) → IoT ingestion endpoint → validation → iot_readings → dashboard`.

- **Device registry:** admin/farmer registers device → system issues `device_id` + secret (shown once, stored hashed) bound to a field.
- **HTTP contract:** `POST /api/v1/iot/readings` headers `X-Device-Id`, `X-Signature` (HMAC-SHA256 of body+timestamp), body `{ts, readings:[{metric:"soil_moisture_pct", value, unit}]}`; reject timestamps skewed > 5 min, replay via nonce, out-of-range values flagged not stored as valid; rate limit per device.
- **MQTT (optional):** topic `smartfarm/{device_id}/telemetry`; broker (e.g., Mosquitto/EMQX) with per-device credentials; a small bridge worker writes to the same ingestion service. Do not add a broker until a real device needs it.
- **Display:** current value with `last_updated`, sensor status (online if seen within 2× interval, else "Offline since …"), pump status only if device reports it, history chart. **No sensor connected → "No sensor connected" state**, never placeholder values. Control commands (pump on/off) are out of scope until security review; if added, require explicit user confirmation, signed commands, and audit.
- Document a reference ESP32 firmware sketch and payload examples in `IOT.md`, marked as example.

---

## 20. SATELLITE ARCHITECTURE

`SatelliteProvider` interface: `available(field)`, `observations(field, from, to, index)`, `tile(field, date, index)`; index types: NDVI (first), moisture/stress later.
- Candidate sources: Sentinel-2 via Copernicus/Sentinel Hub or Google Earth Engine / Planet **[VERIFY licensing, quotas, cost]**.
- Processing: per field polygon → cloud mask → index statistics (mean/min/max, coverage %, cloud cover) → store in `satellite_observations`; imagery tiles served from provider or object storage.
- UI: field detail "Vegetation" tab and map layer, both **disabled with explanation** ("Connect a satellite provider to see vegetation health") until configured; when enabled show date of the image, cloud cover, and a plain-language interpretation labelled *estimate*. Never show synthetic NDVI without a **DEMO DATA** ribbon.
- Interpretation ("crop stress") is advisory, uses baseline comparison across dates, and states limitations (clouds, small fields, mixed pixels).

---

## 21. SECURITY

| Area | Requirements |
|---|---|
| Authn | Argon2id/bcrypt, min length 10, breach-list check optional, secure cookies (HttpOnly, Secure, SameSite=Lax), session rotation on login, lockout/rate limits, no user enumeration on reset |
| Authz | Policy per model (ownership) + permission gates; **deny by default**; tests for IDOR on every resource |
| Validation | Server-side Form Requests for every input; whitelist fields (no mass-assignment); GeoJSON and file validation |
| Injection | Eloquent/parameterized queries only; no raw SQL with interpolation; output escaping; CSP header; sanitize rich text (admin content) with allow-list |
| CSRF/CORS | CSRF tokens for cookie auth; strict CORS origins from env |
| Rate limiting | Per route group and per user/IP; stricter on auth, uploads, AI, contact form |
| Uploads (§21.1) | see below |
| Secrets | `.env`/secret manager only; never committed; rotate; frontend gets no secrets; admin UI never displays stored keys (write-only fields) |
| Transport | HTTPS only, HSTS |
| Privacy | Collect minimum PII; farm GPS is sensitive (owner-only; not exposed in public pages/marketplace beyond district level unless user opts in); data export/delete on request; retention policy for images and chat logs |
| Audit | Append-only `audit_logs`: who, what, when, resource, old/new values, IP; mandatory for AI config, schemes, market data, content, roles/permissions, user status |
| AI | §15.6 |
| Dependencies | Lockfiles, `npm audit`/`composer audit` in CI, Dependabot/Renovate |
| Headers | CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (geolocation/camera scoped) |

### 21.1 File upload security
Allow-list extension **and** server-side content-sniffed MIME (finfo) **and** magic bytes; size limits (images ≤ 10 MB, PDFs ≤ 15 MB); re-encode images (strips EXIF except optionally GPS captured deliberately); ignore client filename — store as `{uuid}.{ext}` under non-web-root private storage; serve only through authorized signed URLs with `Content-Disposition` and correct type; optional AV scan hook; PDF: no active content processed in the app, OCR in a sandboxed worker; quota per user.

---

## 22. TESTING

| Layer | Tooling (adapt to repo) | Must cover |
|---|---|---|
| Unit | PHPUnit/Pest; Vitest | Area/unit conversion, stage materialization, expected-harvest calc, advisory rule engine, profit math (incl. "estimated" when incomplete), soil sufficiency rules, i18n key completeness |
| API/Feature | Pest/PHPUnit + DB | Auth (register/login/logout/reset/rate limit), Farm/Field/Crop-cycle/Task CRUD, validation errors, pagination, envelope shape |
| Authorization | Feature tests | **IDOR matrix:** user B cannot read/update/delete user A's farm, field, cycle, task, report, file, diagnosis; permission gates for admin routes; expert/buyer role limits |
| File upload | Feature tests | Wrong ext, spoofed MIME, oversize, path traversal filename, double extension, zero-byte, other user's field |
| Provider contract | Shared test suite per interface | Weather/Market/AI/Embedding/Vector/Notification/Storage: every implementation (real via fixtures, demo/mock) obeys the same contract; **demo provider output always flagged** |
| AI service | pytest | Intent detection, context planner, schema validation, injection test corpus, citation validity, refusal on missing data, no-dosage rule |
| RAG | pytest | Chunking boundaries, metadata filters, hybrid fusion, threshold behavior |
| Database | Migration tests | Fresh migrate, rollback, constraints (unique/partial), seed idempotency, demo isolation |
| Integration/E2E | Playwright | Register → skip onboarding → dashboard; create farm → field → crop cycle → calendar → task → complete; soil report upload flow; language switch to Gujarati; demo-mode labelling; admin publishes crop stage → farmer sees it |
| Responsive/UI | Playwright viewports 360, 768, 1280 | No horizontal scroll, bottom nav on mobile, touch targets, empty/error/loading states via MSW/fixtures |
| Accessibility | axe-core in Playwright | No critical violations on main pages, keyboard flow |
| Performance | Lighthouse CI budget | Dashboard LCP, bundle size limits |
| "No fake data" checks | Custom tests/grep | No hard-coded prices/weather in source; demo rows excluded from real aggregates; demo ribbon present when `is_demo` |

CI order: lint → type-check → unit → feature → build → E2E (smoke). Merge blocked on failure.

---

## 23. DEPLOYMENT

- **Components:** Next.js frontend (Node runtime or static+edge as appropriate) · Laravel app (php-fpm/Octane) behind Nginx · queue workers + scheduler · PostgreSQL (managed if possible; extensions pgvector/PostGIS/pg_trgm) · Redis · FastAPI AI service (internal network only) · S3-compatible object storage · optional MQTT broker (Phase 3).
- **Containers:** Docker Compose for local/dev and single-server staging; production platform-neutral (VM with Compose is acceptable for MVP; do not require Kubernetes).
- **Environments:** local, staging, production with separate secrets and databases; `DEMO_MODE` allowed only in local/staging (production seeder for demo disabled by default).
- **CI/CD:** build → test → image → deploy with migrations run as a gated step; zero-downtime-safe migrations (expand/contract).
- **Logging/monitoring:** structured JSON logs to stdout → aggregator; error tracking (Sentry-compatible); uptime + queue-depth + provider-status alerts; admin `/system/health`.
- **Backups:** daily PostgreSQL backups with PITR if available, object storage versioning, tested restore procedure documented in `DEPLOYMENT.md`.
- **Scaling notes:** cache weather/market, paginate, index review, read replica later, move heavy AI/ingestion to separate workers.

---

## 24. ADMIN ARCHITECTURE

Separate route group `/admin`, same auth, permission-gated navigation (items hidden if no permission; API still enforces).

| Section | MVP | Function |
|---|---|---|
| Dashboard | Yes | Farmers, active farms/fields/cycles (demo excluded), sign-ups trend, crop distribution, provider status (Weather/Market/AI: connected/demo/error), queue health; AI queries/diagnoses/expert Qs shown as 0-state until modules ship |
| Users / Roles / Permissions | Yes | Search, view, suspend/restore, assign roles, edit role permissions (audited) |
| Farmers / Farms / Fields | Read-only + support actions | Support view with masked PII |
| Crops / Varieties / Stages / Advisories / Advisory rules | Yes | CRUD with translations tabs (en/hi/gu), draft→published workflow, preview timeline |
| Diseases / Pests | Phase 2 | Content + crop mapping + source |
| Knowledge / RAG | Phase 2 | Upload, metadata, ingest status, reindex, test retrieval console |
| Schemes | Phase 2 | Required fields: official URL and last verified date; stale flag |
| Market data | Phase 2 | Import, provider status, last run, failed rows |
| Notifications | Phase 2 | Templates, broadcast (audited) |
| AI config | Phase 2 | Provider, model, temperature, system prompt (versioned), thresholds, retrieval count, rerank toggle; secrets write-only; "test call" |
| Settings | Yes | Languages, feature flags, provider selection, contact info |
| Audit logs | Yes | Filter by actor/resource/date; diff view |

Every content item has `status`, `created_by`, `updated_by`, `created_at`, `updated_at`.

---

## 25. MVP SCOPE

**In MVP (Milestone 1 — a usable product, ~must ship together):**
Auth · skippable onboarding · farms · fields (+ Leaflet map, boundary draw) · crop master (seeded for a small starter set, e.g., wheat, cotton, groundnut, tomato — content marked draft until reviewed) · crop cycles + calendar · tasks (+ suggested tasks) · weather (provider abstraction, Open-Meteo or demo) + weather-aware advisory rules · soil paths (type/unknown/report upload storage + manual confirmed values) · scouting · manual irrigation log · in-app notifications · farmer dashboard · i18n en/hi/gu · admin foundation (users, roles, crops, stages, advisories, audit, settings, health) · AI provider interface + stub (no chat UI, or a disabled "Coming in next release" with honest label) · demo seeder · docs · tests.

**Judgment call for Antigravity/owner:** if capacity allows, pull **expenses/income** into Milestone 1 (they are pure software and high value); otherwise they lead Milestone 2.

**Explicitly NOT in MVP:** diagnosis with a real model, live AI chat, RAG, market feed, inventory/machinery, reports export, community, experts, marketplace, IoT ingestion, satellite, ML predictions, SMS/push, voice, full offline. Their **interfaces, tables (where cheap), and disabled/labelled UI states** may exist; no dead buttons.

---

## 26. PHASED IMPLEMENTATION PLAN

Practical milestones (not 20+ micro-phases). Each starts with an inspect step and ends with quality gate §28.4.

### Milestone 0 — Repository assessment (no feature code)
Objective: understand what exists. Outputs: `ARCHITECTURE.md` assessment (stack, routes, DB, auth, env, deploy, reusable components, risks), decision log for keep/replace. Acceptance: report reviewed; decisions recorded.

### Milestone 1 — Usable Foundation (MVP)
Sub-steps in dependency order:
1. **Foundation:** repo structure, env config, lint/type/test tooling, CI, design tokens, i18n scaffold, API client, error envelope, provider interface skeletons, audit/logging.
2. **Identity:** users, roles/permissions, auth flows, policies, rate limits. *DB:* users, roles, permissions, pivots, languages. *Tests:* auth + IDOR harness.
3. **Farms & fields:** CRUD, map, boundary. *DB:* farms, fields, files. 
4. **Crops:** master data + admin CRUD, cycles, stage materialization, calendar. *DB:* crops(+translations), varieties, crop_stages(+translations), advisories, crop_cycles, cycle_stages.
5. **Tasks:** CRUD, suggested tasks, today/upcoming/overdue, notifications (in-app). *DB:* tasks, notifications, preferences.
6. **Weather:** provider interface, Open-Meteo + demo adapters, cache, views, alerts, advisory rules engine. *DB:* weather_records, weather_alerts, advisory_rules, advisories.
7. **Soil, scouting, irrigation:** soil profile paths, report upload/storage, manual confirmed parameters, observations, irrigation records.
8. **Dashboard + onboarding:** widgets (each independent), setup checklist, empty/error/loading states everywhere.
9. **Admin foundation:** as §24 MVP column.
10. **Demo seed, docs, hardening:** demo mode, README/docs, security review, a11y/responsive pass.

*Acceptance (Milestone 1):* see §27.

### Milestone 2 — Intelligence & Money
- **2a Finance:** expenses, income, profitability, receipts, charts. **2b Inventory & machinery** (+ low-stock notifications, task-linked usage). **2c Market:** provider abstraction, ingestion, UI, charts. **2d Knowledge + RAG:** ingestion, hybrid retrieval, citations, admin console. **2e AI assistant:** context engine, structured responses, quotas, admin AI config. **2f Diagnosis:** multi-image upload, quality check, `DiagnosisModel` (mock → selected real), confidence gating, expert CTA (links to Phase 3 workflow or "Ask via contact" until it exists). **2g Soil OCR** with confirmation. **2h Schemes, reports/exports, email notifications, service-worker offline queue.**
- *Dependencies:* 2d before 2e (grounding); 2f uses knowledge for next steps; reports after 2a–2c.
- *Acceptance:* assistant answers grounded with valid citations or refuses; diagnosis never shows unflagged mock results; market screen never shows unlabeled demo; profit numbers reconcile with source records.

### Milestone 3 — Ecosystem
Community, expert consultation, marketplace listings/inquiries, advanced analytics (product analytics events + admin charts), IoT ingestion + dashboards, satellite adapter + NDVI layer, crop recommendation (rules baseline → ML), voice (STT/TTS providers), SMS/push. Each independently shippable behind feature flags.

### Dependency graph
```
Foundation → Identity → Farms → Fields → Crops/Cycles → Tasks
                                   ├→ Weather → Advisory rules → Dashboard
                                   ├→ Soil / Scouting / Irrigation ─┐
Crops/Cycles → Finance → Reports                                     ├→ AI context
Knowledge/RAG → AI Assistant → Diagnosis(next steps) → Experts       │
Market → (AI context, Marketplace)                                   │
IoT / Satellite → (Field health, AI context)  ←──────────────────────┘
```

---

## 27. ACCEPTANCE CRITERIA

### 27.1 Milestone 1 (all must pass)
1. A new user can register with only name + mobile/email + password + location, **skip every onboarding step**, and land on a working dashboard with helpful empty states.
2. Farmer can create farm → field (with drawn boundary) → crop cycle → see the crop calendar with a current-stage indicator → create/complete tasks → see them on the dashboard.
3. Weather shows real data when provider configured, or a clearly labelled **DEMO DATA** state with setup instructions when not; provider failure shows error + Retry + last cached (stale-labelled) value.
4. At least one weather-aware advisory demonstrably appears (using a test fixture) with **separate Fact and Suggestion blocks**, and none appears without weather data.
5. Soil: all six paths present; unavailable ones are disabled with reasons; report upload validated and stored privately; manual values optional; summary shows "Unknown values: N" and never fabricates values.
6. UI available in English, Hindi, Gujarati; switching persists; no hard-coded strings (automated check passes); fonts render correctly.
7. Authorization: IDOR test matrix passes; admin routes inaccessible to non-admins; permission changes audited.
8. Admin can create a crop with stage templates and advisories (translated), publish it, and a farmer sees it in a new cycle.
9. Every data component demonstrates loading, empty, error states; no blank screens; no dead buttons.
10. Responsive: usable at 360px width, bottom nav on mobile, touch targets ≥ 48px, no horizontal overflow; axe has no critical violations on core pages.
11. `lint`, `type-check`, all tests, and production build pass in CI; `.env.example` complete; README lets a new developer run the project in < 30 minutes.
12. Demo mode: seeded demo farmer visible with DEMO ribbon; demo data excluded from admin real metrics; no demo rows in real accounts.
13. Grep/tests confirm no hard-coded prices, weather values, or fake sensor/satellite data in application code paths.

### 27.2 Milestone 2 (highlights)
Financial totals reconcile; market data shows source + timestamp and staleness; RAG answers cite existing documents only and refuse when nothing relevant; prompt-injection test corpus passes; diagnosis low-confidence path tested; mock results always flagged; OCR values require farmer confirmation; exports open correctly (PDF/CSV/XLSX).

### 27.3 Milestone 3 (highlights)
IoT: signature/replay tests pass, offline state shown, no fabricated readings; satellite layer hidden/disabled without provider; community moderation/reporting works; expert workflow states transition correctly with notifications; marketplace never exposes precise farm GPS by default.

---

# 28. ANTIGRAVITY MASTER BUILD INSTRUCTION

> **Copy everything below this line into Antigravity. Attach this whole specification file to the workspace (e.g., `docs/SPEC.md`) so it can be referenced.**

---

**You are working inside an existing repository.** Your mission is to build SMARTFARM AI, a farmer-first digital agriculture platform, according to `docs/SPEC.md` (the master specification). You are a senior full-stack engineer, architect, security engineer and QA engineer acting autonomously. Work incrementally. Never do a massive rewrite in one operation.

## 28.1 Non-negotiable rules
1. **Inspect before changing.** Never overwrite working functionality blindly. Preserve the existing stack unless you document a compelling reason.
2. **Never fabricate data.** No invented real-time weather, market prices, sensor readings, satellite values, government scheme details, AI confidence, diagnoses, or soil values. When unavailable, show an unavailable / setup / clearly labelled **DEMO DATA** state. Demo data must never mix with real user data.
3. **Farmer-first.** Never make technical fields (NPK, EC, OC, sensor, satellite) mandatory. Every optional technical input has Skip / I don't know / Add later. Simple language; large touch targets; mobile-first.
4. **Explainable recommendations.** Every recommendation shows why, what, source, confidence and limitations, and distinguishes measured / user-entered / external / AI / estimate / demo.
5. **No dead buttons.** Unimplemented features are disabled with an explanation or omitted. No "Coming Soon" placeholder pages for features in the current milestone.
6. **No invented agrochemical dosages.** Defer to cited official/local guidance; encourage expert confirmation.
7. **Secrets** only in environment/secret stores; never in frontend code or git.
8. **Provider abstractions** for weather, market, AI, embeddings, vector store, maps, notifications, storage, OCR, speech, satellite, diagnosis.
9. **No hard-coded UI strings** — use locale files (en, hi, gu).
10. **Ask a question only if a decision cannot be inferred** from the repository and spec and materially affects architecture; otherwise decide, record it in the decision log, and proceed. Do not ask unnecessary questions.

## 28.2 Step 0 — Repository assessment (do this first; no feature code)
1. List the repository tree; read README, package/composer/requirements files, lockfiles, Docker/CI configs, `.env*`.
2. Identify: frontend framework and version; backend framework and version; database and migrations; authentication mechanism; existing routes/pages/API endpoints; environment configuration; reusable components and design tokens; existing tests and tooling; deployment configuration; existing functionality that works.
3. Run the existing install, lint, type-check, test and build commands; record baseline results.
4. Write `docs/ARCHITECTURE.md` containing: current architecture, existing stack, existing features, gaps versus the spec, technical risks, recommended architecture (keep/extend/replace with justification), database plan, API plan, UI plan, AI plan, dependency order.
5. Write `docs/IMPLEMENTATION_PLAN.md` mapping Milestone 1 sub-steps to concrete tasks for this repository, plus a `docs/DECISIONS.md` log.
6. If the repository is empty, scaffold the default stack in the spec (Next.js + TypeScript + Tailwind; Laravel; PostgreSQL), keeping the modular monolith approach. Do not introduce microservices, Kubernetes, event buses or multiple databases.
7. Do not stop after documentation; proceed into Milestone 1 if the assessment shows the repository is ready.

## 28.3 Autonomous working behavior
- When a task is clearly defined, inspect the relevant code and implement it.
- Before a destructive change (deleting files, rewriting migrations, changing auth): inspect, verify impact, prefer additive migrations, and note it in `docs/DECISIONS.md`.
- Before adding a dependency: check whether an existing dependency solves it; prefer well-maintained, licensed-compatible packages; record why.
- Before creating a component: search for reusable components. Before creating an API endpoint: search existing endpoints. Before creating a table: inspect the existing schema and reuse/extend.
- Make small, logical, reviewable changes. Commit-sized units. Keep code consistent with the existing conventions.
- Use the database schema in spec §11 and API conventions in §12 as the target; adapt names to existing conventions if the repo already has them, and document the mapping.

## 28.4 Quality gate — after every meaningful feature
1. Run unit/feature tests; add tests for the new behavior (auth, ownership/IDOR, validation, file upload, provider contracts as applicable).
2. Run lint and type-check.
3. Run the production build.
4. Run the app and **inspect the browser**: verify the real flow end-to-end, not just that pages render.
5. Verify **loading, empty, error, and unavailable** states (simulate slow/failed API).
6. Verify **responsive** layout at 360px, 768px, 1280px; verify bottom nav on mobile.
7. Verify **language switching** (en/hi/gu) on the new screens; no missing keys.
8. Verify **API integration** (real requests, response envelope, validation errors) and **database changes** (migration up/down, constraints, indexes).
9. Verify **authorization** (another user cannot access the resource; admin gates hold).
10. Verify **no fake data** and correct provenance/demo labels.
11. Fix every discovered issue **before** moving on. Do not proceed to the next milestone step with failing checks.

## 28.5 Execution order
1. Complete **Step 0**.
2. Implement **Milestone 1** sub-steps 1 → 10 in order (spec §26), applying the quality gate after each. Milestone 1 must result in a usable product meeting all criteria in spec §27.1.
3. Only after §27.1 is satisfied, produce a **Milestone 1 report** (what was built, what was tested, what is disabled/planned and why, known issues) and continue to Milestone 2 (sub-steps 2a–2h in dependency order), then Milestone 3 behind feature flags.
4. Continue to the next milestone **only after** the previous milestone's acceptance criteria are satisfied.

## 28.6 Documentation to maintain (keep synchronized with the implementation; do not write filler)
`README.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md` (plus OpenAPI), `FEATURES.md`, `IMPLEMENTATION_PLAN.md`, `AI_ARCHITECTURE.md`, `RAG.md`, `IOT.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, `DECISIONS.md`. Create each when the corresponding area is first implemented; update when it changes. README must include setup, env variables (`.env.example` fully commented), seeding, demo mode, test commands.

## 28.7 Product quality bar
The result must feel like a real AgTech product, not a CRUD project or generic dashboard template. Modules must feel **connected**: Farm → Field → Crop → Stage → Weather → Task → Observation → Disease → AI → Harvest → Market → Finance → Report. Use the design system in spec §8 (deep green, leaf green, earth tones, warm neutrals, white surfaces; green not overused), strong hierarchy, field cards with crop colours, crop stage timelines, map views, contextual advisories, and useful empty states.

## 28.8 Final deliverable per milestone
Working frontend and backend, migrations and seeds, authentication and roles, admin, tests passing in CI, production build passing, docs updated, demo mode functioning, and a written report listing acceptance criteria with pass/fail evidence.

Begin now with **Step 0 — Repository assessment**.

---
*End of specification.*
