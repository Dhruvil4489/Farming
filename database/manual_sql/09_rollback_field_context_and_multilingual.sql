-- =============================================================================
-- SMARTFARM AI — POSTGRESQL MANUAL ROLLBACK 09:
-- ROLLBACK FOR MIGRATION 08 (FIELD CONTEXT & DIAGNOSIS INDEXES)
-- =============================================================================

BEGIN;

DROP INDEX IF EXISTS "idx_field_farm_active";
DROP INDEX IF EXISTS "idx_crop_cycle_field_active";
DROP INDEX IF EXISTS "idx_crop_diagnosis_field_date";
DROP INDEX IF EXISTS "idx_crop_diagnosis_user_status_date";
DROP INDEX IF EXISTS "idx_product_category_available";

COMMIT;

