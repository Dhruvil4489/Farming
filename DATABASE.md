# SMARTFARM AI — DATABASE SPECIFICATION

*ORM:* Prisma ORM  
*Supported Databases:* PostgreSQL (Production) / SQLite (Local Execution)  

---

## 1. Data Model Overview

The SmartFarm AI database schema follows strict relational normalization rules. Every core entity is tied back to the central spine.

```
Users ──< Farms ──< Fields ──< CropCycles ──< CycleStages
                     │             │
                     ├──< Soil     ├──< Tasks
                     │    Profiles ├──< Observations
                     │             ├──< Expenses
                     └──< Weather  └──< Harvest / Sales
```

---

## 2. Entity Relational Definitions

### 2.1 Core User & RBAC Tables
- **`users`**: Stores user authentication data, contact details, language preferences, location, experience mode, onboarding status, and demo flags.
- **`roles`**: System roles (`FARMER`, `ADMIN`, `EXPERT`, `BUYER`).
- **`permissions`**: Granular action permissions (e.g. `farm.manage`, `admin.content`).
- **`user_roles`**: Many-to-many pivot table for users and roles.
- **`role_permissions`**: Pivot table mapping permissions to roles.

### 2.2 Farm & Field Management
- **`farms`**: Represents physical farming locations. Belongs to a User. Contains area, village, district, state, farm type, water sources.
- **`fields`**: Specific field partitions inside a farm. Contains area, boundary GeoJSON, irrigation type, soil type, and status (`EMPTY`, `PLANNED`, `ACTIVE`, `FALLOW`).

### 2.3 Crop Management & Lifecycle
- **`crops`**: Admin-managed crop master catalog (e.g. Wheat, Cotton, Tomato). Contains translations, category, season, typical duration days, display color.
- **`crop_varieties`**: Specific seed/crop varieties under a master crop.
- **`crop_stages`**: Stage template sequence for a crop (e.g., Land Preparation, Sowing, Vegetative, Flowering, Fruiting, Harvest).
- **`crop_stage_advisories`**: Recommended activities per crop stage.
- **`crop_cycles`**: Active or historical crop growing instances in a field. Stores sowing date, expected harvest date, actual harvest date, status (`PLANNED`, `SOWN`, `GROWING`, `FLOWERING`, `FRUITING`, `HARVEST_READY`, `HARVESTED`, `COMPLETED`).
- **`cycle_stages`**: Materialized stage timeline for a specific crop cycle.

### 2.4 Operations & Activity Management
- **`tasks`**: Field tasks (irrigation, fertilizer application, spraying, scouting, harvest, custom). Statuses: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`.
- **`farm_observations`**: Field scouting entries with category, severity, notes, and photos.
- **`irrigation_records`**: Manual or sensor-based irrigation events.

### 2.5 Weather & Soil Health
- **`weather_records`**: Cached historical and forecast weather snapshots per farm location.
- **`weather_alerts`**: Weather warning alerts (heavy rain, high heat, frost).
- **`advisory_rules`**: Rules mapping weather conditions to task advisories.
- **`soil_profiles`**: Field soil path tracking.
- **`soil_reports`**: Uploaded Soil Health Cards / lab test documents.
- **`soil_parameters`**: Confirmed numeric parameter values (pH, EC, Organic Carbon, N, P, K, etc.).

### 2.6 Finance & System Logs
- **`expenses`**: Farm/field/crop cycle financial costs (seeds, fertilizer, labor, fuel, machinery).
- **`income_records`**: Crop sales and harvest revenue entries.
- **`notifications`**: In-app user notifications.
- **`audit_logs`**: System security and administrative change logs.
