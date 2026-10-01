# SMARTFARM AI — ARCHITECTURE SPECIFICATION

*Version:* 1.0.0  
*Status:* Active Implementation Blueprint  

---

## 1. System Overview

SmartFarm AI is designed as a **connected full-stack digital agriculture platform**. The system connects all agricultural operations into a unified central data model (the "Connected Spine"):

$$\text{User/Farmer} \rightarrow \text{Farm} \rightarrow \text{Field} \rightarrow \text{Crop Cycle} \rightarrow \text{Crop Stage} \rightarrow \text{Weather} \rightarrow \text{Task} \rightarrow \text{Observation} \rightarrow \text{Diagnosis} \rightarrow \text{AI} \rightarrow \text{Harvest} \rightarrow \text{Market} \rightarrow \text{Finance} \rightarrow \text{Report}$$

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|  Responsive Web App (Next.js / React / TypeScript / Tailwind CSS / Leaflet)       |
|  Supported Locales: English (en), Hindi (hi), Gujarati (gu)                      |
+----------------------------------------+------------------------------------------+
                                         | REST APIs / HTTPS
                                         v
+-----------------------------------------------------------------------------------+
|                             NEXT.JS FULL-STACK SERVER                             |
|                                                                                   |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  |   Auth & RBAC Middleware  |  | API Controllers & Routes|  |  Data Transformation  |  |
|  |  (Farmer/Admin/Expert)|  |     (/api/v1/*)       |  |  & Response Envelopes |  |
|  +-----------+-----------+  +-----------+-----------+  +-----------+-----------+  |
|              |                      |                      |                      |
|              v                      v                      v                      |
|  +-----------------------------------------------------------------------------+  |
|  |                              DOMAIN SERVICES                                |  |
|  |  - FarmService       - FieldService     - CropCycleService - TaskService     |  |
|  |  - WeatherEngine     - AdvisoryEngine   - SoilService      - ScoutingService |  |
|  |  - FinanceService    - MarketService    - NotificationSvc  - AuditService    |  |
|  +-------------------------------------+---------------------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |                          PROVIDER ABSTRACTION LAYER                         |  |
|  |  - WeatherProvider (OpenMeteo / DemoWeather)                                |  |
|  |  - MarketProvider (Agmarknet / DemoMarket)                                  |  |
|  |  - AIProvider (OpenAI / Anthropic / Gemini / MockAI)                        |  |
|  |  - StorageProvider (Local Disk / S3 Abstraction)                            |  |
|  +-------------------------------------+---------------------------------------+  |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                DATABASE & STORAGE                                 |
|  - Relational Storage: PostgreSQL / SQLite via Prisma ORM                        |
|  - File Storage: Protected File Storage (`/storage/uploads`)                      |
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack Choice & Rationale

1. **Frontend**:
   - **Next.js 14+ (App Router)**: Hybrid Server & Client Rendering for fast page loads and seamless routing.
   - **Tailwind CSS**: Custom token-driven styling implementing the earth & natural green palette (`#143D2A`, `#2F7D4F`, `#7A5A3A`, `#FAF6EF`).
   - **TanStack Query (React Query)**: Optimistic updates, background re-validation, state caching.
   - **Leaflet & React-Leaflet**: Open-source, high-performance mapping for field boundaries and GPS locations.

2. **Backend**:
   - **Next.js Route Handlers**: Type-safe REST APIs co-located with application code.
   - **Prisma ORM**: Strongly typed database interactions with automated schema migrations.
   - **Zod**: Runtime validation schemas shared between frontend forms and backend API endpoints.

3. **Data Storage**:
   - **Database**: PostgreSQL / SQLite (via Prisma) containing normalized relational tables.
   - **File Storage**: Local filesystem abstraction with MIME validation, UUID file keys, and private signed URL access.

---

## 4. Architectural Principles & Patterns

1. **Provider Abstraction Pattern**:
   External integrations (Weather, Market prices, AI models, Storage) are hidden behind clear TypeScript interface abstractions (`IWeatherProvider`, `IMarketProvider`, `IAIProvider`). If API credentials are not provided, system seamlessly falls back to labelled `DEMO DATA` providers.

2. **Data Provenance & Honesty**:
   Every field and response carries provenance tags (`Measured`, `User Entered`, `External API`, `AI Analysis`, `Estimate`, `Demo Data`). Demo data is strictly isolated from real user statistics.

3. **Progressive Disclosure**:
   Farmers are never forced to supply complex agricultural parameters (e.g. NPK, EC, organic carbon). Every optional input provides "Skip", "I don't know", and "Add later" options.
