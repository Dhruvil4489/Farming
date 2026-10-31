-- =============================================================================
-- SMARTFARM AI — POSTGRESQL MANUAL ROLLBACK 05: ROLLBACK UNIVERSAL CROP AI REGISTRY
--
-- Description:
-- Safely drops tables and columns added by 04_universal_crop_ai_registry.sql
-- =============================================================================

DROP TABLE IF EXISTS "DiagnosisFeedback" CASCADE;
DROP TABLE IF EXISTS "AiModelRegistry" CASCADE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'selectedCrop'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" DROP COLUMN "selectedCrop";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'detectedCrop'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" DROP COLUMN "detectedCrop";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'modelId'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" DROP COLUMN "modelId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'severity'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" DROP COLUMN "severity";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'feedbackRating'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" DROP COLUMN "feedbackRating";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'feedbackNotes'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" DROP COLUMN "feedbackNotes";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'feedbackAccurate'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" DROP COLUMN "feedbackAccurate";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'metadataJson'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" DROP COLUMN "metadataJson";
    END IF;
END $$;

