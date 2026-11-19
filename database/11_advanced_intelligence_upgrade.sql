-- SmartFarm AI — Additive Schema Upgrade (SQLite / PostgreSQL Reference)
-- Non-destructive migration: preserves all existing farmer accounts, farms, fields, crops, orders, and records.

-- 1. User location & timezone extensions
ALTER TABLE "User" ADD COLUMN "pincode" TEXT;
ALTER TABLE "User" ADD COLUMN "lat" REAL;
ALTER TABLE "User" ADD COLUMN "lng" REAL;
ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- 2. Field exact area input preservation
ALTER TABLE "Field" ADD COLUMN "areaInputValue" REAL;
ALTER TABLE "Field" ADD COLUMN "areaInputUnit" TEXT DEFAULT 'acre';

-- 3. Crop rich agronomic attributes
ALTER TABLE "Crop" ADD COLUMN "scientificName" TEXT;
ALTER TABLE "Crop" ADD COLUMN "climate" TEXT;
ALTER TABLE "Crop" ADD COLUMN "soilSuitability" TEXT;
ALTER TABLE "Crop" ADD COLUMN "sowingPeriod" TEXT;
ALTER TABLE "Crop" ADD COLUMN "irrigationGuidance" TEXT;
ALTER TABLE "Crop" ADD COLUMN "nutrientGuidance" TEXT;
ALTER TABLE "Crop" ADD COLUMN "commonWeeds" TEXT;
ALTER TABLE "Crop" ADD COLUMN "commonDiseases" TEXT;
ALTER TABLE "Crop" ADD COLUMN "commonPests" TEXT;
ALTER TABLE "Crop" ADD COLUMN "harvestGuidance" TEXT;
ALTER TABLE "Crop" ADD COLUMN "storageGuidance" TEXT;
ALTER TABLE "Crop" ADD COLUMN "sourceAuthority" TEXT;
ALTER TABLE "Crop" ADD COLUMN "lastVerifiedAt" DATETIME;

-- 4. CropStage structured actionable guidance
ALTER TABLE "CropStage" ADD COLUMN "whatToDo" TEXT;
ALTER TABLE "CropStage" ADD COLUMN "whyImportant" TEXT;
ALTER TABLE "CropStage" ADD COLUMN "howToDo" TEXT;
ALTER TABLE "CropStage" ADD COLUMN "precautions" TEXT;
ALTER TABLE "CropStage" ADD COLUMN "materials" TEXT;
ALTER TABLE "CropStage" ADD COLUMN "isEssential" BOOLEAN NOT NULL DEFAULT 1;

-- 5. KnowledgeDocument metadata extensions
ALTER TABLE "KnowledgeDocument" ADD COLUMN "region" TEXT;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "lastVerifiedAt" DATETIME;

-- 6. AuthToken table (Email verification & Password reset)
CREATE TABLE IF NOT EXISTS "AuthToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "otpCodeHash" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type");
CREATE INDEX IF NOT EXISTS "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");

-- 7. ScheduledReminder table (Lifecycle & task reminders with dedupeKey)
CREATE TABLE IF NOT EXISTS "ScheduledReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "taskId" TEXT,
    "fieldId" TEXT,
    "category" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduledReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ScheduledReminder_dedupeKey_key" ON "ScheduledReminder"("dedupeKey");
CREATE INDEX IF NOT EXISTS "ScheduledReminder_userId_status_scheduledFor_idx" ON "ScheduledReminder"("userId", "status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "ScheduledReminder_status_scheduledFor_idx" ON "ScheduledReminder"("status", "scheduledFor");

-- 8. EmailDeliveryLog table (Delivery auditing, retry tracking, idempotency)
CREATE TABLE IF NOT EXISTS "EmailDeliveryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "toEmail" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "dedupeKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "provider" TEXT NOT NULL DEFAULT 'local_outbox',
    "providerMessageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "errorMessage" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailDeliveryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_userId_createdAt_idx" ON "EmailDeliveryLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_dedupeKey_idx" ON "EmailDeliveryLog"("dedupeKey");
CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_status_createdAt_idx" ON "EmailDeliveryLog"("status", "createdAt");
