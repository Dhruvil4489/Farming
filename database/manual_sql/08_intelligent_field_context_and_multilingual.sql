-- =============================================================================
-- SMARTFARM AI — POSTGRESQL MANUAL MIGRATION 08:
-- INTELLIGENT FIELD CONTEXT, DIAGNOSIS OPTIMIZATION & MULTILINGUAL PERSISTENCE
--
-- Description:
-- 1. Adds compound indexes on CropDiagnosisRecord for rapid farmer & field historical queries
-- 2. Adds composite indexes on Field & CropCycle for real-time field context materialization
-- 3. Verifies Product table active ingredient & category indexes for disease medicine matching
-- 4. Ensures idempotent execution across PostgreSQL 14 - 18
--
-- Compatibility: PostgreSQL 14, 15, 16, 17, 18
-- Author: Principal AI Engineer & PostgreSQL Database Architect
-- =============================================================================

BEGIN;

-- 1. Optimize Field Context retrieval: Quickly resolve user's active fields & farms
CREATE INDEX IF NOT EXISTS "idx_field_farm_active" 
ON "Field" ("farmId", "status") 
WHERE "deletedAt" IS NULL;

-- 2. Optimize Crop Cycle active stage lookup for intelligent field context
CREATE INDEX IF NOT EXISTS "idx_crop_cycle_field_active" 
ON "CropCycle" ("fieldId", "status", "createdAt" DESC) 
WHERE "deletedAt" IS NULL;

-- 3. Optimize Crop Diagnosis Record queries by field and diagnosis date
CREATE INDEX IF NOT EXISTS "idx_crop_diagnosis_field_date" 
ON "CropDiagnosisRecord" ("fieldId", "diagnosedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- 4. Optimize User-scoped diagnosis history with status filtering
CREATE INDEX IF NOT EXISTS "idx_crop_diagnosis_user_status_date" 
ON "CropDiagnosisRecord" ("userId", "status", "diagnosedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- 5. Optimize Disease Medicine Matching in Fertilizer Store
CREATE INDEX IF NOT EXISTS "idx_product_category_available" 
ON "Product" ("categoryId", "isAvailable", "stock") 
WHERE "isAvailable" = TRUE;

COMMIT;

