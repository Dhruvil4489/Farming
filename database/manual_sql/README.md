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
   - Safe rollback statements with transaction blocks for scripts 01 and 02.

4. **`04_universal_crop_ai_registry.sql`**
   - Adds multi-model columns (`selectedCrop`, `detectedCrop`, `modelId`, `severity`, feedback fields, `metadataJson`) to `CropDiagnosisRecord`.
   - Creates `AiModelRegistry` and `DiagnosisFeedback` tables.
   - Creates compound indexes on `[selectedCrop]` and `[modelId]`.

5. **`05_rollback_universal_crop_ai.sql`**
   - Safe rollback statements for script 04.

6. **`06_crop_disease_medicines.sql`**
   - Adds Product Categories for Crop Protection & Bio-Pesticides (`crop-protection-fungicides`, `bio-pesticides`).
   - Adds verified Indian agricultural input brands (`Syngenta India`, `Bayer CropScience`, `Dhanuka Agritech`, `UPL Limited`, `Rallis India (Tata Enterprise)`, `Multiplex Bio-Tech`, `Indofil Industries`, `Hindustan Antibiotics`).
   - Seeds 18 CIBRC-registered Crop Protection Products, Fungicides, Bactericides & Bio-Controls into `Product` table.
   - Creates performance index on `Product(cropTarget)`.

7. **`07_rollback_crop_disease_medicines.sql`**
   - Safe rollback statements for script 06.

## Execution via psql

```bash
# Connect to PostgreSQL and apply in numerical order:
psql -U postgres -d Farmer -f database/manual_sql/01_upgrade_irrigation_and_diagnosis.sql
psql -U postgres -d Farmer -f database/manual_sql/02_iot_and_assistant_support.sql
psql -U postgres -d Farmer -f database/manual_sql/04_universal_crop_ai_registry.sql
psql -U postgres -d Farmer -f database/manual_sql/06_crop_disease_medicines.sql
```
