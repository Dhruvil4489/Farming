import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Applying Safe Schema Updates to Local SQLite dev.db ---');

  // 1. Check & Add missing columns to IrrigationRecord
  const irrigationCols = await prisma.$queryRawUnsafe('PRAGMA table_info(IrrigationRecord)');
  const colNames = irrigationCols.map((c) => c.name);

  if (!colNames.includes('userId')) {
    console.log('Adding column "userId" to IrrigationRecord...');
    await prisma.$queryRawUnsafe('ALTER TABLE IrrigationRecord ADD COLUMN userId TEXT;');
  }

  if (!colNames.includes('updatedAt')) {
    console.log('Adding column "updatedAt" to IrrigationRecord...');
    await prisma.$queryRawUnsafe('ALTER TABLE IrrigationRecord ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP;');
  }

  // Populate any existing irrigation records userId from Field.farm.userId
  await prisma.$queryRawUnsafe(`
    UPDATE IrrigationRecord 
    SET userId = (
      SELECT f.userId 
      FROM Field fl 
      JOIN Farm f ON fl.farmId = f.id 
      WHERE fl.id = IrrigationRecord.fieldId
    )
    WHERE userId IS NULL;
  `);

  // 2. Create CropDiagnosisRecord
  console.log('Creating CropDiagnosisRecord table if not exists...');
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CropDiagnosisRecord" (
      "id" TEXT PRIMARY KEY NOT NULL,
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
      "confidence" REAL,
      "topKJson" TEXT NOT NULL DEFAULT '[]',
      "uncertaintyReason" TEXT,
      "modelName" TEXT NOT NULL DEFAULT 'agri-plant-disease-resnet50',
      "modelVersion" TEXT NOT NULL DEFAULT '1.0.0',
      "source" TEXT NOT NULL DEFAULT 'farmer_upload',
      "notes" TEXT,
      "diagnosedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deletedAt" DATETIME,
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("fieldId") REFERENCES "Field" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("cropCycleId") REFERENCES "CropCycle" ("id") ON DELETE SET NULL
    );
  `);
  await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS "CropDiagnosisRecord_userId_diagnosedAt_idx" ON "CropDiagnosisRecord"("userId", "diagnosedAt");`);
  await prisma.$queryRawUnsafe(`CREATE INDEX IF NOT EXISTS "CropDiagnosisRecord_fieldId_diagnosedAt_idx" ON "CropDiagnosisRecord"("fieldId", "diagnosedAt");`);

  // 3. Create IotDevice
  console.log('Creating IotDevice table if not exists...');
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IotDevice" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "deviceCode" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "hardwareModel" TEXT DEFAULT 'ESP32-SoilV1',
      "farmId" TEXT NOT NULL,
      "fieldId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "isDemo" BOOLEAN NOT NULL DEFAULT 0,
      "lastSeenAt" DATETIME,
      "lastIp" TEXT,
      "firmwareVersion" TEXT,
      "batteryVoltage" REAL,
      "calibrationJson" TEXT DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("fieldId") REFERENCES "Field" ("id") ON DELETE CASCADE
    );
  `);

  // 4. Create IotTelemetryReading
  console.log('Creating IotTelemetryReading table if not exists...');
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IotTelemetryReading" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "deviceId" TEXT NOT NULL,
      "fieldId" TEXT NOT NULL,
      "eventId" TEXT,
      "measuredAt" DATETIME NOT NULL,
      "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "soilMoistureRaw" INTEGER,
      "soilMoisturePct" REAL,
      "depthCm" INTEGER DEFAULT 15,
      "airTempC" REAL,
      "airHumidityPct" REAL,
      "lightLux" REAL,
      "batteryVoltage" REAL,
      "batteryPct" REAL,
      "waterLevelSwitch" BOOLEAN,
      "qualityStatus" TEXT NOT NULL DEFAULT 'clean',
      "qualityFlags" TEXT DEFAULT '[]',
      "isDemo" BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY ("deviceId") REFERENCES "IotDevice" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("fieldId") REFERENCES "Field" ("id") ON DELETE CASCADE,
      UNIQUE("deviceId", "eventId")
    );
  `);

  // 5. Create IotDeviceEvent
  console.log('Creating IotDeviceEvent table if not exists...');
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IotDeviceEvent" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "deviceId" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "severity" TEXT NOT NULL DEFAULT 'info',
      "detailsJson" TEXT DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("deviceId") REFERENCES "IotDevice" ("id") ON DELETE CASCADE
    );
  `);

  // 6. Create MarketSyncLock
  console.log('Creating MarketSyncLock table if not exists...');
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MarketSyncLock" (
      "id" TEXT PRIMARY KEY NOT NULL DEFAULT 'market_sync',
      "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lockedBy" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL
    );
  `);

  // 7. Create AssistantConversation & AssistantMessage
  console.log('Creating AssistantConversation and AssistantMessage tables if not exists...');
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AssistantConversation" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "title" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
    );
  `);

  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AssistantMessage" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "conversationId" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "structuredJson" TEXT,
      "providerId" TEXT,
      "model" TEXT,
      "confidence" TEXT,
      "isHelpful" BOOLEAN,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation" ("id") ON DELETE CASCADE
    );
  `);

  console.log('✔ All tables and columns verified successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
