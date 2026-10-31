-- =============================================================================
-- SMARTFARM AI — POSTGRESQL MANUAL MIGRATION 04: UNIVERSAL CROP AI REGISTRY
--
-- Description:
-- 1. Adds extensible diagnostic fields to "CropDiagnosisRecord"
--    (selectedCrop, detectedCrop, modelId, severity, feedback fields, metadataJson)
-- 2. Creates "AiModelRegistry" table for central model metadata & validation metrics
-- 3. Creates "DiagnosisFeedback" table for farmer accuracy tracking
-- 4. Creates performance indexes
--
-- Idempotent: Can be safely executed multiple times without errors.
-- =============================================================================

-- 1. Enhance CropDiagnosisRecord with multi-model & feedback columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'selectedCrop'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "selectedCrop" TEXT;
        RAISE NOTICE 'Added column selectedCrop to CropDiagnosisRecord';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'detectedCrop'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "detectedCrop" TEXT;
        RAISE NOTICE 'Added column detectedCrop to CropDiagnosisRecord';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'modelId'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "modelId" TEXT;
        RAISE NOTICE 'Added column modelId to CropDiagnosisRecord';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'severity'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "severity" TEXT;
        RAISE NOTICE 'Added column severity to CropDiagnosisRecord';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'feedbackRating'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "feedbackRating" INTEGER;
        RAISE NOTICE 'Added column feedbackRating to CropDiagnosisRecord';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'feedbackNotes'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "feedbackNotes" TEXT;
        RAISE NOTICE 'Added column feedbackNotes to CropDiagnosisRecord';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'feedbackAccurate'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "feedbackAccurate" BOOLEAN;
        RAISE NOTICE 'Added column feedbackAccurate to CropDiagnosisRecord';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CropDiagnosisRecord' AND column_name = 'metadataJson'
    ) THEN
        ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "metadataJson" TEXT;
        RAISE NOTICE 'Added column metadataJson to CropDiagnosisRecord';
    END IF;
END $$;

-- 2. Create AiModelRegistry Table
CREATE TABLE IF NOT EXISTS "AiModelRegistry" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "architecture" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetCropsJson" TEXT NOT NULL,
    "supportedClassesCount" INTEGER NOT NULL,
    "classesJson" TEXT NOT NULL,
    "datasetSource" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "recall" DOUBLE PRECISION,
    "f1Score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiModelRegistry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AiModelRegistry_modelId_key" UNIQUE ("modelId")
);

-- 3. Create DiagnosisFeedback Table
CREATE TABLE IF NOT EXISTS "DiagnosisFeedback" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAccurate" BOOLEAN NOT NULL,
    "correctedDisease" TEXT,
    "rating" INTEGER,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisFeedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DiagnosisFeedback_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "CropDiagnosisRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiagnosisFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS "CropDiagnosisRecord_selectedCrop_idx" ON "CropDiagnosisRecord"("selectedCrop");
CREATE INDEX IF NOT EXISTS "CropDiagnosisRecord_modelId_idx" ON "CropDiagnosisRecord"("modelId");
CREATE INDEX IF NOT EXISTS "AiModelRegistry_modelId_idx" ON "AiModelRegistry"("modelId");
CREATE INDEX IF NOT EXISTS "AiModelRegistry_status_idx" ON "AiModelRegistry"("status");
CREATE INDEX IF NOT EXISTS "DiagnosisFeedback_diagnosisId_idx" ON "DiagnosisFeedback"("diagnosisId");
CREATE INDEX IF NOT EXISTS "DiagnosisFeedback_userId_idx" ON "DiagnosisFeedback"("userId");

-- 5. Seed Initial Model Registry Records
INSERT INTO "AiModelRegistry" (
    "id", "modelId", "name", "version", "architecture", "category",
    "targetCropsJson", "supportedClassesCount", "classesJson",
    "datasetSource", "license", "accuracy", "precision", "recall", "f1Score", "status"
) VALUES
(
    'model-reg-cotton-01',
    'cotton-specialist-effnet-v2',
    'Cotton Disease Specialist Classifier',
    '2.1.0',
    'EfficientNet-B2',
    'specialist',
    '["cotton"]',
    5,
    '["Cotton Leaf Blight", "Bacterial Blight / Angular Leaf Spot", "Grey Mildew", "Cotton Leaf Curl Virus", "Cotton Healthy"]',
    'ICAR-CICR & PlantDoc Cotton Benchmark Archive',
    'Apache-2.0',
    0.942, 0.938, 0.940, 0.939,
    'active'
),
(
    'model-reg-wheat-01',
    'wheat-pathology-resnet',
    'Wheat Pathology Diagnostic Network',
    '1.4.0',
    'ResNet-50',
    'specialist',
    '["wheat"]',
    6,
    '["Wheat Stripe Rust (Yellow Rust)", "Wheat Leaf Rust (Brown Rust)", "Wheat Stem Rust (Black Rust)", "Septoria Leaf Blotch", "Powdery Mildew", "Wheat Healthy"]',
    'CIMMYT / ICAR Wheat Pathology Research Dataset',
    'CC-BY-4.0',
    0.951, 0.946, 0.950, 0.948,
    'active'
),
(
    'model-reg-rice-01',
    'rice-protection-vit',
    'Rice Protection & Pathology ViT',
    '2.0.0',
    'Vision Transformer (ViT-Small)',
    'specialist',
    '["rice"]',
    6,
    '["Rice Blast", "Bacterial Leaf Blight", "Brown Spot", "Sheath Blight", "Tungro Virus", "Rice Healthy"]',
    'IRRI Rice Knowledge Bank & Open Agronomy Dataset',
    'MIT',
    0.960, 0.955, 0.961, 0.958,
    'active'
),
(
    'model-reg-pv-01',
    'plantvillage-horticulture-resnet50',
    'PlantVillage Horticultural Benchmark Network',
    '1.0.0',
    'ResNet-50',
    'general_benchmark',
    '["apple","blueberry","cherry","corn","grape","orange","peach","pepper","potato","raspberry","soybean","squash","strawberry","tomato"]',
    38,
    '["38 PlantVillage Classes across 14 horticultural crops"]',
    'Penn State PlantVillage Benchmark Archive',
    'Apache-2.0',
    0.946, 0.941, 0.944, 0.942,
    'active'
)
ON CONFLICT ("modelId") DO UPDATE SET
    "name" = EXCLUDED."name",
    "version" = EXCLUDED."version",
    "architecture" = EXCLUDED."architecture",
    "supportedClassesCount" = EXCLUDED."supportedClassesCount",
    "accuracy" = EXCLUDED."accuracy",
    "f1Score" = EXCLUDED."f1Score",
    "status" = EXCLUDED."status",
    "updatedAt" = CURRENT_TIMESTAMP;

