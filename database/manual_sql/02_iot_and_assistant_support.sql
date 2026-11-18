-- =====================================================================
-- SMARTFARM AI — POSTGRESQL MANUAL MIGRATION SCRIPT 02
-- Module: IoT Device Registry, Telemetry Readings & Assistant Storage
-- Execution Order: 02 (Run after 01_upgrade_irrigation_and_diagnosis.sql)
-- Idempotent: Safe to run multiple times without data loss
-- =====================================================================

BEGIN;

-- 1. IoT Device Registry
CREATE TABLE IF NOT EXISTS "IotDevice" (
    "id" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hardwareModel" TEXT DEFAULT 'ESP32-SoilV1',
    "farmId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "lastIp" TEXT,
    "firmwareVersion" TEXT,
    "batteryVoltage" DOUBLE PRECISION,
    "calibrationJson" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IotDevice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "IotDevice_deviceCode_key" UNIQUE ("deviceCode")
);

-- 2. IoT Telemetry Readings (Time-series data from capacitive soil probes)
CREATE TABLE IF NOT EXISTS "IotTelemetryReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "eventId" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soilMoistureRaw" INTEGER,
    "soilMoisturePct" DOUBLE PRECISION,
    "depthCm" INTEGER DEFAULT 15,
    "airTempC" DOUBLE PRECISION,
    "airHumidityPct" DOUBLE PRECISION,
    "lightLux" DOUBLE PRECISION,
    "batteryVoltage" DOUBLE PRECISION,
    "batteryPct" DOUBLE PRECISION,
    "waterLevelSwitch" BOOLEAN,
    "qualityStatus" TEXT NOT NULL DEFAULT 'clean',
    "qualityFlags" TEXT DEFAULT '[]',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IotTelemetryReading_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "IotTelemetryReading_deviceId_eventId_key" UNIQUE ("deviceId", "eventId")
);

-- 3. IoT Device Event Logs
CREATE TABLE IF NOT EXISTS "IotDeviceEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "detailsJson" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IotDeviceEvent_pkey" PRIMARY KEY ("id")
);

-- 4. Market Sync Distributed Lock
CREATE TABLE IF NOT EXISTS "MarketSyncLock" (
    "id" TEXT NOT NULL DEFAULT 'market_sync',
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketSyncLock_pkey" PRIMARY KEY ("id")
);

-- 5. AI Assistant Conversation & Messages
CREATE TABLE IF NOT EXISTS "AssistantConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssistantMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "structuredJson" TEXT,
    "providerId" TEXT,
    "model" TEXT,
    "confidence" TEXT,
    "isHelpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys & Constraints
DO $$
BEGIN
    -- IotDevice
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IotDevice_farmId_fkey') THEN
        ALTER TABLE "IotDevice" ADD CONSTRAINT "IotDevice_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IotDevice_fieldId_fkey') THEN
        ALTER TABLE "IotDevice" ADD CONSTRAINT "IotDevice_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- IotTelemetryReading
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IotTelemetryReading_deviceId_fkey') THEN
        ALTER TABLE "IotTelemetryReading" ADD CONSTRAINT "IotTelemetryReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IotTelemetryReading_fieldId_fkey') THEN
        ALTER TABLE "IotTelemetryReading" ADD CONSTRAINT "IotTelemetryReading_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- IotDeviceEvent
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IotDeviceEvent_deviceId_fkey') THEN
        ALTER TABLE "IotDeviceEvent" ADD CONSTRAINT "IotDeviceEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- AssistantConversation
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AssistantConversation_userId_fkey') THEN
        ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- AssistantMessage
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AssistantMessage_conversationId_fkey') THEN
        ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "IotDevice_farmId_idx" ON "IotDevice"("farmId");
CREATE INDEX IF NOT EXISTS "IotDevice_fieldId_idx" ON "IotDevice"("fieldId");
CREATE INDEX IF NOT EXISTS "IotDevice_status_idx" ON "IotDevice"("status");

CREATE INDEX IF NOT EXISTS "IotTelemetryReading_deviceId_measuredAt_idx" ON "IotTelemetryReading"("deviceId", "measuredAt");
CREATE INDEX IF NOT EXISTS "IotTelemetryReading_fieldId_measuredAt_idx" ON "IotTelemetryReading"("fieldId", "measuredAt");
CREATE INDEX IF NOT EXISTS "IotTelemetryReading_receivedAt_idx" ON "IotTelemetryReading"("receivedAt");

CREATE INDEX IF NOT EXISTS "IotDeviceEvent_deviceId_createdAt_idx" ON "IotDeviceEvent"("deviceId", "createdAt");

CREATE INDEX IF NOT EXISTS "AssistantConversation_userId_createdAt_idx" ON "AssistantConversation"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AssistantMessage_conversationId_createdAt_idx" ON "AssistantMessage"("conversationId", "createdAt");

COMMIT;

