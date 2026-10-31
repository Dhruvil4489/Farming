# SmartFarm AI — PostgreSQL Manual Migration Suite

This directory contains production-ready, idempotent manual PostgreSQL SQL migration scripts.

## Migration Files & Execution Order

1. **`01_upgrade_irrigation_and_diagnosis.sql`**
   - Adds `userId` and `updatedAt` to `IrrigationRecord` with foreign key linking to `User`.
   - Backfills existing irrigation records with the corresponding field owner's user ID.
   - Creates the `CropDiagnosisRecord` table for AI leaf disease diagnostics.
   - Creates all required indexes for performant querying.

2. **`02_iot_and_assistant_support.sql`**
   - Creates `IotDevice`, `IotTelemetryReading`, and `IotDeviceEvent` tables for hardware sensor monitoring (ESP32 / capacitive soil probes).
   - Creates `MarketSyncLock` for distributed APMC mandi price synchronization.
   - Creates `AssistantConversation` and `AssistantMessage` for grounded RAG conversational state.
   - Sets up all foreign keys, uniqueness constraints, and time-series compound indexes.

3. **`03_rollback_scripts.sql`**
   - Safe rollback statements with transaction blocks if reverting schema changes is needed.

## Execution via psql

```bash
# Connect to PostgreSQL and apply in numerical order:
psql -U postgres -d smartfarm_db -f database/manual_sql/01_upgrade_irrigation_and_diagnosis.sql
psql -U postgres -d smartfarm_db -f database/manual_sql/02_iot_and_assistant_support.sql
```

