-- Safe, non-destructive additive schema sync for SQLite (dev.db)
-- Aligns MarketPriceObservation, MarketSyncLog, KnowledgeDocument, and KnowledgeChunk
-- with prisma/schema.prisma without deleting any existing records.

-- 1. MarketPriceObservation
ALTER TABLE "MarketPriceObservation" ADD COLUMN "grade" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MarketPriceObservation" ADD COLUMN "sourceResourceId" TEXT;
ALTER TABLE "MarketPriceObservation" ADD COLUMN "syncRunId" TEXT;
ALTER TABLE "MarketPriceObservation" ADD COLUMN "qualityStatus" TEXT NOT NULL DEFAULT 'ok';

-- 2. MarketSyncLog
ALTER TABLE "MarketSyncLog" ADD COLUMN "triggerSource" TEXT NOT NULL DEFAULT 'scheduled';
ALTER TABLE "MarketSyncLog" ADD COLUMN "recordsSkipped" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MarketSyncLog" ADD COLUMN "durationMs" INTEGER;

-- 3. KnowledgeDocument
ALTER TABLE "KnowledgeDocument" ADD COLUMN "issuingOrg" TEXT NOT NULL DEFAULT 'ICAR / SAU';
ALTER TABLE "KnowledgeDocument" ADD COLUMN "publicationDate" DATETIME;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "crop" TEXT;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "license" TEXT NOT NULL DEFAULT 'GODL-India';
ALTER TABLE "KnowledgeDocument" ADD COLUMN "checksum" TEXT NOT NULL DEFAULT 'legacy-seed';
ALTER TABLE "KnowledgeDocument" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT 1;
UPDATE "KnowledgeDocument" SET "issuingOrg" = COALESCE("publisher", 'ICAR / SAU'), "crop" = "cropSlug", "license" = COALESCE("licenseNote", 'GODL-India') WHERE "issuingOrg" = 'ICAR / SAU';

-- 4. KnowledgeChunk
ALTER TABLE "KnowledgeChunk" ADD COLUMN "chunkIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "KnowledgeChunk" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "KnowledgeChunk" ADD COLUMN "tokenCount" INTEGER NOT NULL DEFAULT 120;
ALTER TABLE "KnowledgeChunk" ADD COLUMN "crop" TEXT;
ALTER TABLE "KnowledgeChunk" ADD COLUMN "topic" TEXT;
ALTER TABLE "KnowledgeChunk" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "KnowledgeChunk" ADD COLUMN "checksum" TEXT NOT NULL DEFAULT 'legacy-chunk';
UPDATE "KnowledgeChunk" SET "chunkIndex" = COALESCE("orderIndex", 0), "title" = COALESCE("heading", '') WHERE "title" = '';

-- 5. FarmObservation
ALTER TABLE "FarmObservation" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "FarmObservation" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "FarmObservation" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
