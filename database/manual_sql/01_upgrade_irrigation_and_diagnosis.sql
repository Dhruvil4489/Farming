-- =====================================================================
-- SMARTFARM AI — POSTGRESQL MANUAL MIGRATION SCRIPT 01
-- Module: Irrigation Record Fixes & Crop Diagnosis Record Creation
-- Execution Order: 01 (Run after base postgresql_complete_schema.sql)
-- Idempotent: Safe to run multiple times without data loss
-- =====================================================================

BEGIN;

-- 1. Ensure IrrigationRecord has userId column with foreign key to User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'IrrigationRecord' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "IrrigationRecord" ADD COLUMN "userId" TEXT;
        RAISE NOTICE 'Added column userId to IrrigationRecord';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'IrrigationRecord' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "IrrigationRecord" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added column updatedAt to IrrigationRecord';
    END IF;
END $$;

-- Backfill userId on existing IrrigationRecord rows from Field -> Farm -> User
UPDATE "IrrigationRecord"
SET "userId" = f."userId"
FROM "Field" fl
JOIN "Farm" f ON fl."farmId" = f."id"
WHERE "IrrigationRecord"."fieldId" = fl."id"
  AND "IrrigationRecord"."userId" IS NULL;

-- Make userId NOT NULL only after backfill, if table is non-empty
DO $$
BEGIN
    -- Add foreign key constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'IrrigationRecord_userId_fkey'
    ) THEN
        ALTER TABLE "IrrigationRecord" 
        ADD CONSTRAINT "IrrigationRecord_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Added foreign key IrrigationRecord_userId_fkey';
    END IF;
END $$;

-- Indexes for IrrigationRecord
CREATE INDEX IF NOT EXISTS "IrrigationRecord_userId_irrigatedAt_idx" 
ON "IrrigationRecord"("userId", "irrigatedAt");

CREATE INDEX IF NOT EXISTS "IrrigationRecord_fieldId_irrigatedAt_idx" 
ON "IrrigationRecord"("fieldId", "irrigatedAt");


-- 2. Create CropDiagnosisRecord Table
CREATE TABLE IF NOT EXISTS "CropDiagnosisRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "imagePath" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "predictedLabel" TEXT,
    "cropName" TEXT,
    "diseaseName" TEXT,
    "isHealthy" BOOLEAN,
    "confidence" DOUBLE PRECISION,
    "topKJson" TEXT NOT NULL DEFAULT '[]',
    "uncertaintyReason" TEXT,
    "modelName" TEXT NOT NULL DEFAULT 'agri-plant-disease-resnet50',
    "modelVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "source" TEXT NOT NULL DEFAULT 'farmer_upload',
    "notes" TEXT,
    "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CropDiagnosisRecord_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys for CropDiagnosisRecord
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CropDiagnosisRecord_userId_fkey') THEN
        ALTER TABLE "CropDiagnosisRecord" 
        ADD CONSTRAINT "CropDiagnosisRecord_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CropDiagnosisRecord_fieldId_fkey') THEN
        ALTER TABLE "CropDiagnosisRecord" 
        ADD CONSTRAINT "CropDiagnosisRecord_fieldId_fkey" 
        FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CropDiagnosisRecord_cropCycleId_fkey') THEN
        ALTER TABLE "CropDiagnosisRecord" 
        ADD CONSTRAINT "CropDiagnosisRecord_cropCycleId_fkey" 
        FOREIGN KEY ("cropCycleId") REFERENCES "CropCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes for CropDiagnosisRecord
CREATE INDEX IF NOT EXISTS "CropDiagnosisRecord_userId_diagnosedAt_idx" 
ON "CropDiagnosisRecord"("userId", "diagnosedAt");

CREATE INDEX IF NOT EXISTS "CropDiagnosisRecord_fieldId_diagnosedAt_idx" 
ON "CropDiagnosisRecord"("fieldId", "diagnosedAt");

COMMIT;

