# SmartFarm AI — System Architecture & Engineering Blueprint

This document details the software architecture, system topology, security boundaries, provider abstraction patterns, database design, and data flows of SmartFarm AI.

---

## 1. System Topology & Full-Stack Component Overview

SmartFarm AI is architected as a modular, full-stack Next.js 16 application with decoupled auxiliary microservices for compute-heavy visual AI and hardware telemetry ingestion:

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  - Next.js 16 App Router (React 19 Server & Client Components)                        |
|  - Tailwind CSS v4 Design Tokens (WCAG 2.1 AA Compliant)                              |
|  - Leaflet Geospatial Field Mapping                                                   |
|  - Provenance Badging System & ARIA Live Regions                                      |
+-------------------------------------------+-------------------------------------------+
                                            | HTTPS / JSON Envelopes
                                            v
+---------------------------------------------------------------------------------------+
|                              NEXT.JS FULL-STACK SERVER                                |
|                                                                                       |
|  +---------------------------+  +--------------------------+  +--------------------+  |
|  | Auth & Security Guard     |  | API Controllers          |  | Response Envelope  |  |
|  | - JWT in HttpOnly Cookie  |  | - REST Endpoints         |  | - Success Data     |  |
|  | - RBAC (Farmer vs Admin)  |  |   (/api/v1/*)            |  | - Standard Errors  |  |
|  | - Anti-IDOR Tenant Scope  |  | - Rate Limiter (Token Bkt|  | - Request IDs      |  |
|  +-------------+-------------+  +------------+-------------+  +---------+----------+  |
|                |                             |                          |             |
|                +-----------------------------+--------------------------+             |
|                                              |                                        |
|                                              v                                        |
|  +---------------------------------------------------------------------------------+  |
|  |                              DOMAIN SERVICE LAYER                               |  |
|  |  - Farm & Field Management       - Advisory & Rule Engine                       |  |
|  |  - Phenological Stage Generator  - In-Database BM25 RAG Service                 |  |
|  |  - IoT Quality Evaluator         - Scheduled Market Sync Mutex                  |  |
|  +-------------------------------------------+-------------------------------------+  |
|                                              |                                        |
|                                              v                                        |
|  +---------------------------------------------------------------------------------+  |
|  |                            PROVIDER ABSTRACTION LAYER                           |  |
|  |  - IMarketProvider  ──► AgmarknetProvider / DemoMarketProvider                   |  |
|  |  - IWeatherProvider ──► OpenMeteoProvider / DemoWeatherProvider                   |  |
|  |  - IAIProvider      ──► GoogleGemini / OpenAI / Anthropic / MockAIProvider      |  |
|  |  - IStorageProvider ──► Local Disk Storage / S3-Compatible Abstraction          |  |
|  +-------------------------------------------+-------------------------------------+  |
+----------------------------------------------+----------------------------------------+
         |                                     |                         |
         | Prisma ORM                          | HTTP (Internal)         | HTTP / Bearer
         v                                     v                         v
+-----------------------+          +-----------------------+   +------------------------+
|   DATABASE ENGINE     |          |  DISEASE INFERENCE    |   |     IoT HARDWARE       |
|  - SQLite (Dev/Test)  |          |  (FastAPI + PyTorch)  |   |  - ESP32 Capacitive    |
|  - PostgreSQL +       |          |  - ResNet-50 Model    |   |    Soil Sensor Probes  |
|    pgvector (Prod)    |          |  - Magic Byte Check   |   |  - LoRaWAN Gateways    |
|  - Tenant-Scoped Data |          |  - Foliage Gate       |   |  - Software Simulator  |
+-----------------------+          +-----------------------+   +------------------------+
```

---

## 2. The Connected Agronomic Spine (Data Flow)

Agricultural workflows are rarely isolated: an irrigation decision depends on sensor readings and weather forecasts; pesticide spray depends on wind speed and disease diagnosis; marketing depends on mandi trends and yield timing. 

SmartFarm AI binds all modules into a single, cohesive relational chain ("The Connected Spine"):

```
[ User (Farmer) ]
       │
       ▼
  [ Farm Plot ] ──────────────► [ Regional Weather Forecast ] ──► [ Weather Advisories ]
       │                                                                  │
       ▼                                                                  ▼
 [ Field Parcel ] ◄─────────── [ In-Situ IoT Soil Probe ]           [ Daily Tasks ]
       │                                                                  ▲
       ▼                                                                  │
 [ Crop Cycle ] ──► [ Stage Materialization ] ──► [ Field Scouting Observation ]
       │                                                  │
       ▼                                                  ▼
[ Harvest & Sales ] ◄── [ APMC Mandi Rates ] ◄─── [ Disease Vision AI Screening ]
       │                                                  │
       ▼                                                  ▼
[ Store / Fertilizer Orders ] ◄────────────────── [ Grounded Extension RAG ]
```

### Stage Materialization Engine
When a farmer creates a `CropCycle` (e.g. Cotton sown on June 15), the system automatically queries the master `CropStage` templates and materializes concrete `CycleStage` timeline records. Days After Sowing (DAS) and Growing Degree Day (GDD) baselines compute expected dates for:
1. Land Preparation & Basal Fertilizer
2. Germination & Seedling Emergence
3. Vegetative Growth & First Inter-culturing
4. Square Formation & Flowering
5. Boll Development
6. Defoliation & Harvest

---

## 3. Security, Authentication & Tenant Boundaries

### 3.1 Authentication Architecture
- **Stateless Session Tokens**: JSON Web Tokens (JWT) signed with HMAC-SHA256.
- **Transport Security**: Delivered exclusively via `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookies (`auth_token`). JavaScript in the browser cannot read or extract session tokens, eliminating XSS credential harvesting.
- **Startup Secret Guard**: The application checks `JWT_SECRET` at initialization. In production (`NODE_ENV=production`), secrets under 32 characters or matching known defaults trigger an immediate startup exception.
- **Open-Redirect Hardening**: All post-login redirections pass through `getSafeRedirect()`, strictly preventing open redirects across `//evil.com`, triple slashes, backslashes (`/\evil.com`), encoded slash sequences (`%2F%2F`), CRLF, and null-byte bypasses.

### 3.2 Tenant Isolation & In-Depth IDOR Defense
Every private domain record (Farm, Field, CropCycle, Task, Observation, Irrigation, Device, Conversation) is strictly tenant-isolated:
1. **Server-Side Session Resolution**: Handlers never trust a client-submitted `userId`.
2. **Relational Verification**: Nested queries verify that child resources join to a farm belonging to the authenticated user:
   ```typescript
   // Example: Verifying field ownership
   const field = await prisma.field.findFirst({
     where: { id: fieldId, farm: { userId: user.id }, deletedAt: null },
   });
   if (!field) return apiError('Field not found or unowned', 'not_found', 404);
   ```
3. **No Cross-Tenant Information Leaks**: When Farmer B requests Farmer A's resource ID, the API returns a clean `404 Not Found` rather than `403 Forbidden`, preventing resource enumeration attacks.

### 3.3 Role-Based Access Control (RBAC)
- **Roles**: `FARMER`, `ADMIN`, `EXPERT`, `BUYER`.
- **Administrative Perimeter**: All administrative routes (`/admin`) and sync operations (`/api/v1/admin/*`) verify `user.roles.some(r => r.role.name === 'ADMIN')`. Unauthorized callers receive `HTTP 403 Forbidden`.

---

## 4. Provider Abstraction Layer

To ensure reproducible testing and zero reliance on paid commercial APIs during continuous integration, external boundaries use the Provider Pattern:

```
                      +-------------------+
                      |   IMarketProvider |
                      +---------+---------+
                                |
                +---------------+---------------+
                |                               |
                v                               v
    +-----------------------+       +-----------------------+
    |   AgmarknetProvider   |       |   DemoMarketProvider  |
    |  - data.gov.in API    |       |  - Deterministic      |
    |  - Timeout & Retry    |       |  - Off-line / Demo    |
    |  - Anomaly Filter     |       |  - isDemo: true       |
    +-----------------------+       +-----------------------+
```

### 4.1 Mandi Market Intelligence
- `AgmarknetProvider`: Fetches official government mandi trade records from data.gov.in (catalog `9ef84268-d588-465a-a308-a864a43d0070`). Implements anomaly detection: handles comma-formatted strings, strips non-numeric characters, and flags inverted price ranges (`minPrice > maxPrice`).
- `DemoMarketProvider`: Deterministic fallback delivering authentic APMC commodity figures for Gujarat, Maharashtra, and Central India with explicit `isDemo: true` provenance.

### 4.2 Meteorological Services
- `OpenMeteoProvider`: Consumes open numerical weather models. Solves timezone offsets by dynamically indexing `data.hourly.time` to current UTC hour, eliminating 5–17 hour daylight offsets in Indian Standard Time (IST).
- `DemoWeatherProvider`: Deterministic meteorological fallback with realistic diurnal temperature and humidity cycles.

### 4.3 AI Consultation & Grounding
- `AIProviderFactory`: Selects between `GoogleGeminiProvider`, `OpenAIProvider`, `AnthropicProvider`, and `MockAIProvider`.
- Guardrail: When `NODE_ENV=production`, `MockAIProvider` is rejected unless explicitly permitted via `ALLOW_MOCK_AI=true`.
- Fallback: Missing keys or API connection failures return transparent service notifications without hallucinating unverified agronomic advice.

---

## 5. Database Schema & Relational Model

The database supports both SQLite (zero-config development and testing) and PostgreSQL with pgvector (production):

```
+---------------+       1:N       +---------------+       1:N       +---------------+
|     User      | ──────────────► |     Farm      | ──────────────► |     Field     |
+---------------+                 +---------------+                 +---------------+
  │       │                                                           │       │
  │ 1:N   │ 1:N                                                   1:N │       │ 1:N
  │       ▼                                                           ▼       ▼
  │   +-----------------------+                               +-----------+ +-----------+
  │   | AssistantConversation |                               | CropCycle | | IotDevice |
  │   +-----------------------+                               +-----------+ +-----------+
  │               │ 1:N                                             │ 1:N         │ 1:N
  │               ▼                                                 ▼             ▼
  │   +-----------------------+                               +-----------+ +-----------+
  │   |   AssistantMessage    |                               |CycleStage | |Telemetry  |
  │   +-----------------------+                               +-----------+ | Reading   |
  │                                                                 │       +-----------+
  │ 1:N                                                         1:N │
  ▼                                                                 ▼
+-----------------------+                                     +-----------+
|  CropDiagnosisRecord  |                                     |   Task    |
+-----------------------+                                     +-----------+
```

### Core Schema Models:
- **`User` & `Role`**: Identity, credentials, state, district, and authorization pivots (`UserRole`).
- **`Farm` & `Field`**: Spatial plots, total area in hectares, soil types, and irrigation infrastructure.
- **`Crop` & `CropStage`**: Agronomic crop taxonomy, baseline duration, and phenological stage templates.
- **`CropCycle` & `CycleStage`**: Concrete field plantings with materialized start/end dates and stage progress.
- **`Task`**: Agronomic activities (sowing, weeding, spraying, irrigation, harvest) with due dates and statuses.
- **`FarmObservation`**: Scouting records containing category (pest, disease, weed, nutrient), numeric severity (1–3), and notes.
- **`IrrigationRecord`**: Water source, duration in minutes, and pulse volume tracking.
- **`IotDevice` & `IotTelemetryReading`**: Hardware device registry, SHA-256 token hashes, calibration JSON, and non-clamped sensor readings.
- **`CropDiagnosisRecord`**: Visual diagnosis history, image paths, predicted labels, confidence, top-K softmax scores, and uncertainty reasons.
- **`AssistantConversation` & `AssistantMessage`**: Multi-turn grounded RAG dialogues with persistent structured JSON envelopes.
- **`KnowledgeDocument` & `KnowledgeChunk`**: Official ICAR and AAU extension publications segmented for BM25 retrieval.
- **`Product`, `CartItem`, & `Order`**: Store catalog, shopping cart persistence, and order history with frozen unit price snapshots.
- **`MandiRecord` & `MarketSyncLog`**: Mandi price cache, arrival dates, and background synchronization audit telemetry.

---

## 6. Scheduled Market Sync & Mutex Locking

The background market synchronization pipeline (`/api/v1/scheduled/market-sync` and `scripts/market-sync.mjs`) ensures fresh commodity intelligence while protecting upstream APIs:

1. **Authorization**: Validates the HTTP `Authorization: Bearer <CRON_SECRET>` header using timing-safe string comparison.
2. **Database Mutex Lock**: Before fetching from data.gov.in, the runner checks for an active lock in `MarketSyncLog` where `status = 'in_progress'` and `startedAt > now() - 15 minutes`. This prevents concurrent duplicate sync runs if a cron job fires prematurely.
3. **Price Normalization & Anomaly Detection**:
   - Strips currency symbols, commas, and whitespace.
   - Detects inverted ranges (`minPrice > maxPrice`) and sets `modalPrice = (minPrice + maxPrice) / 2`.
4. **Audit Telemetry**: Records duration, total records fetched, total records upserted, and errors in `MarketSyncLog`.

---

## 7. IoT Telemetry Ingestion & Hardware Boundaries

The IoT ingestion pipeline (`POST /api/v1/iot/telemetry`) is engineered for physical ESP32 field probes and LoRaWAN gateways:

1. **Token-Hash Authentication**: The device transmits `Authorization: Bearer <RAW_TOKEN>`. The server calculates `SHA-256(RAW_TOKEN)` and queries `IotDevice` where `tokenHash = hash`. The raw secret is never stored.
2. **Strict Server-Assigned Ownership**: Payloads cannot specify `farmId` or `fieldId`. The server resolves the associated field directly from the device registry.
3. **Idempotency & Deduplication**: Packets can include a UUID `eventId`. If network retries resubmit an identical `eventId`, the server acknowledges the packet without storing a duplicate row.
4. **Clock-Skew Validation**: Timestamps exceeding 10 minutes into the future or 7 days into the past are rejected with `HTTP 422 Unprocessable Entity`.
5. **Non-Clamping Data Quality**: Out-of-bounds readings are **never clamped** or modified. Physical measurements are stored verbatim alongside a `qualityStatus` flag (`clean`, `out_of_range`, `uncalibrated`) and transparent audit flags.

---

## 8. AI System Boundaries & Grounding Architecture

### 8.1 Decoupled Crop Disease Inference Microservice
Visual diagnosis is isolated in a standalone Python FastAPI service (`services/disease-service`):
- **Magic Byte Validation**: Before processing, the service validates binary headers (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `52 49 46 46`) to prevent spoofed file attacks.
- **Foliage Color Ratio Filter**: Rejects non-plant images (e.g. shoes, faces, machinery) if green/brown plant pigment coverage is below 8%.
- **Uncertainty & Rejection Logic**: If top-1 confidence is below 60% or the margin between the top two candidate classes is under 15%, the output is marked `status: "uncertain"`.
- **Fail-Safe Offline Mode**: If the microservice is down, the Next.js backend catches the connection failure and returns `status: "model_not_ready"` with a non-clinical disclaimer, ensuring the web portal never crashes.

### 8.2 Grounded Extension RAG Pipeline
The AI assistant uses an in-database BM25 retrieval engine:
1. **Context Building**: Gathers verified farm profile, current crop cycle, phenological stage, Days After Sowing, recent weather, and soil test parameters.
2. **Authoritative Retrieval**: Queries `KnowledgeChunk` records for official ICAR and Anand Agricultural University (AAU) extension practices matching the query.
3. **Prompt Delimitation**: Retrieved documents are enclosed within strict boundary delimiters:
   `<source_document index="1" title="..." issuing_org="..."> ... </source_document>`
4. **Untrusted Data Isolation**: The system prompt instructs the model to treat retrieved documents solely as agricultural facts and ignore any embedded command injection.
5. **No Invented Dosages**: The model is forbidden from inventing pesticide or chemical dosages; it defers strictly to registered product labels or extension officers.
