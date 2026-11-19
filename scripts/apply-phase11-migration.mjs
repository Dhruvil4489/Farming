/**
 * Idempotent, Non-Destructive SQLite Migration for SmartFarm AI Advanced Intelligence Upgrade.
 * Safely checks PRAGMA table_info before adding any column, and creates new tables IF NOT EXISTS.
 * Also keeps prisma/schema.sqlite.prisma and prisma/schema.postgres.prisma in sync.
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addColumnIfMissing(table, column, sqlDef) {
  const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
  const exists = cols.some((c) => c.name === column);
  if (!exists) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${sqlDef}`);
    console.log(`  [+] Added ${table}.${column}`);
  }
}

async function main() {
  console.log('Running safe additive SQLite schema upgrade...');

  // 1. User columns
  await addColumnIfMissing('User', 'pincode', 'TEXT');
  await addColumnIfMissing('User', 'lat', 'REAL');
  await addColumnIfMissing('User', 'lng', 'REAL');
  await addColumnIfMissing('User', 'timezone', "TEXT NOT NULL DEFAULT 'Asia/Kolkata'");

  // 2. Field columns
  await addColumnIfMissing('Field', 'areaInputValue', 'REAL');
  await addColumnIfMissing('Field', 'areaInputUnit', "TEXT DEFAULT 'acre'");

  // Backfill Field.areaInputValue from areaHa where missing (without overwriting existing)
  await prisma.$executeRawUnsafe(`
    UPDATE "Field"
    SET "areaInputValue" = ROUND("areaHa" / 0.40468564224, 2),
        "areaInputUnit" = COALESCE("areaInputUnit", 'acre')
    WHERE "areaHa" IS NOT NULL AND "areaInputValue" IS NULL
  `);

  // 3. Crop columns
  await addColumnIfMissing('Crop', 'scientificName', 'TEXT');
  await addColumnIfMissing('Crop', 'climate', 'TEXT');
  await addColumnIfMissing('Crop', 'soilSuitability', 'TEXT');
  await addColumnIfMissing('Crop', 'sowingPeriod', 'TEXT');
  await addColumnIfMissing('Crop', 'irrigationGuidance', 'TEXT');
  await addColumnIfMissing('Crop', 'nutrientGuidance', 'TEXT');
  await addColumnIfMissing('Crop', 'commonWeeds', 'TEXT');
  await addColumnIfMissing('Crop', 'commonDiseases', 'TEXT');
  await addColumnIfMissing('Crop', 'commonPests', 'TEXT');
  await addColumnIfMissing('Crop', 'harvestGuidance', 'TEXT');
  await addColumnIfMissing('Crop', 'storageGuidance', 'TEXT');
  await addColumnIfMissing('Crop', 'sourceAuthority', 'TEXT');
  await addColumnIfMissing('Crop', 'lastVerifiedAt', 'DATETIME');

  // 4. CropStage columns
  await addColumnIfMissing('CropStage', 'whatToDo', 'TEXT');
  await addColumnIfMissing('CropStage', 'whyImportant', 'TEXT');
  await addColumnIfMissing('CropStage', 'howToDo', 'TEXT');
  await addColumnIfMissing('CropStage', 'precautions', 'TEXT');
  await addColumnIfMissing('CropStage', 'materials', 'TEXT');
  await addColumnIfMissing('CropStage', 'isEssential', 'BOOLEAN NOT NULL DEFAULT 1');

  // 5. KnowledgeDocument columns
  await addColumnIfMissing('KnowledgeDocument', 'region', 'TEXT');
  await addColumnIfMissing('KnowledgeDocument', 'lastVerifiedAt', 'DATETIME');

  // 6. New tables
  await prisma.$executeRawUnsafe(`
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
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt")`);

  await prisma.$executeRawUnsafe(`
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
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ScheduledReminder_dedupeKey_key" ON "ScheduledReminder"("dedupeKey")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ScheduledReminder_userId_status_scheduledFor_idx" ON "ScheduledReminder"("userId", "status", "scheduledFor")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ScheduledReminder_status_scheduledFor_idx" ON "ScheduledReminder"("status", "scheduledFor")`);

  await prisma.$executeRawUnsafe(`
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
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_userId_createdAt_idx" ON "EmailDeliveryLog"("userId", "createdAt")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_dedupeKey_idx" ON "EmailDeliveryLog"("dedupeKey")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailDeliveryLog_status_createdAt_idx" ON "EmailDeliveryLog"("status", "createdAt")`);

  // Sync schema.sqlite.prisma and schema.postgres.prisma
  const baseSchema = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  fs.writeFileSync(path.join(process.cwd(), 'prisma/schema.sqlite.prisma'), baseSchema, 'utf8');
  const pgSchema = baseSchema.replace('provider = "sqlite"', 'provider = "postgresql"');
  fs.writeFileSync(path.join(process.cwd(), 'prisma/schema.postgres.prisma'), pgSchema, 'utf8');

  console.log('Safe additive migration & Prisma schema sync completed successfully.');
}

main()
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
