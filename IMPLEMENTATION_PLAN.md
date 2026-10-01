# SMARTFARM AI — IMPLEMENTATION PLAN

---

## Roadmap & Milestone Execution Schedule

### Phase 0: Repository Audit & Architectural Documentation (COMPLETED)
- Inspect workspace directory and host environment.
- Create `PROJECT_AUDIT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `FEATURES.md`, `UI_SPEC.md`, `AI_ARCHITECTURE.md`, `RAG.md`, `IOT.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, `IMPLEMENTATION_PLAN.md`.

### Phase 1: Project Scaffolding & Foundation (IN PROGRESS)
- Initialize Next.js 14 full-stack application with TypeScript, Tailwind CSS, Lucide Icons, Leaflet, and Prisma ORM.
- Configure design tokens, CSS theme variables (`#143D2A`, `#2F7D4F`, `#7A5A3A`, `#FAF6EF`), and multi-language i18n support.
- Implement standardized API response envelopes and error handling middleware.

### Phase 2: Database Schema & Migration
- Define Prisma schema covering Users, Roles, Permissions, Farms, Fields, Crops, CropVarieties, CropStages, CropStageAdvisories, CropCycles, CycleStages, Tasks, WeatherRecords, AdvisoryRules, SoilProfiles, SoilReports, SoilParameters, Scouting Observations, Notifications, and Audit Logs.
- Execute initial database migration and seed default roles, permissions, crop catalog, and stage templates.

### Phase 3: Authentication & RBAC
- Build User Registration, Login, Logout, Session validation, and password hashing.
- Enforce role-based access control (Farmer, Admin, Expert, Buyer) and ownership verification policy middleware.

### Phase 4: Farmer Onboarding Flow
- Build progressive 9-step skippable farmer onboarding UI (`/onboarding`).
- Support "Skip", "I don't know", and "Add later" options for all technical fields.

### Phase 5: Farm Management
- Build Farm CRUD endpoints (`/api/v1/farms`) and pages (`/app/farms`).
- Support location, total area, farm type, water sources, and multi-farm support.

### Phase 6: Field Management & Map Boundary Component
- Build Field CRUD endpoints (`/api/v1/fields`) and pages (`/app/fields`).
- Integrate interactive Leaflet map component with GeoJSON polygon drawing for field boundaries.

### Phase 7: Crop Management & Calendar Materialization
- Build Crop catalog endpoints (`/api/v1/crops`) and cycle management (`/api/v1/crop-cycles`).
- Implement automatic stage template materialization upon cycle creation based on sowing date.

### Phase 8: Crop Calendar & Lifecycle View
- Build visual stage progression component `<CropStageBar>` and cycle detail calendar page (`/app/crop-cycles/[id]`).
- Support manual stage advancement overrides.

### Phase 9: Tasks & Activities Module
- Build Task CRUD endpoints (`/api/v1/tasks`) and task management pages (`/app/tasks`).
- Link tasks to crop cycles, fields, priorities, due dates, and completion logging.

### Phase 10: Weather Module & Weather-Aware Advisory Engine
- Implement `IWeatherProvider` interface with `OpenMeteoProvider` and `DemoWeatherProvider` adapters.
- Build `AdvisoryRuleEngine` to evaluate rain/temperature forecasts against due tasks and output structured Fact + Suggestion blocks.

### Phase 11: Soil Health & Report Upload
- Build flexible 6-path Soil UI (`/app/soil`).
- Implement secure file upload handler for Soil Health Cards / lab test reports with manual parameter confirmation.

### Phase 12: Scouting & Irrigation Modules
- Build Scouting observation logging (`/app/scouting`) with severity ratings and photo attachments.
- Build Irrigation event logger (`/app/irrigation`) with soil moisture indicator notes.

### Phase 13: Farmer Dashboard
- Build multi-widget, responsive mobile-first Farmer Dashboard (`/app/dashboard`).
- Integrate Farm overview, Weather tile, Today's tasks, Crop stage cards, Irrigation status, and Weather advisories. Enforce `<DataState>` wrappers.

### Phase 14: Admin Panel
- Build administrative portal (`/admin`) for User management, Crop master editor, System health status, and Audit logs.

### Phase 15: Verification, Quality Assurance & Hardening
- Run linting, type-checking, automated unit/integration tests, and production build verification.
