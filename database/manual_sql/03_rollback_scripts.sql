-- =====================================================================
-- SMARTFARM AI — POSTGRESQL MANUAL ROLLBACK SCRIPTS
-- Rollback actions for scripts 01 and 02
-- USE WITH CAUTION: This will drop tables and newly added columns.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Rollback for 02_iot_and_assistant_support.sql
-- ---------------------------------------------------------------------
BEGIN;
DROP TABLE IF EXISTS "AssistantMessage" CASCADE;
DROP TABLE IF EXISTS "AssistantConversation" CASCADE;
DROP TABLE IF EXISTS "MarketSyncLock" CASCADE;
DROP TABLE IF EXISTS "IotDeviceEvent" CASCADE;
DROP TABLE IF EXISTS "IotTelemetryReading" CASCADE;
DROP TABLE IF EXISTS "IotDevice" CASCADE;
COMMIT;

-- ---------------------------------------------------------------------
-- Rollback for 01_upgrade_irrigation_and_diagnosis.sql
-- ---------------------------------------------------------------------
BEGIN;
DROP TABLE IF EXISTS "CropDiagnosisRecord" CASCADE;

-- If reverting IrrigationRecord columns:
ALTER TABLE "IrrigationRecord" DROP CONSTRAINT IF EXISTS "IrrigationRecord_userId_fkey";
DROP INDEX IF EXISTS "IrrigationRecord_userId_irrigatedAt_idx";
ALTER TABLE "IrrigationRecord" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "IrrigationRecord" DROP COLUMN IF EXISTS "updatedAt";
COMMIT;

