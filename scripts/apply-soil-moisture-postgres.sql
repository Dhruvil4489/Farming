CREATE TABLE IF NOT EXISTS "SoilMoistureObservation" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "moistureValue" DOUBLE PRECISION NOT NULL,
    "originalUnit" TEXT NOT NULL DEFAULT 'm3/m3',
    "normalizedPercentage" DOUBLE PRECISION NOT NULL,
    "depthRangeCm" TEXT NOT NULL DEFAULT '0-50 cm',
    "spatialResolution" TEXT NOT NULL DEFAULT 'district_level_vic_model',
    "modelProvider" TEXT NOT NULL DEFAULT 'NRSC / ISRO Hydrological VIC Model',
    "datasetCatalog" TEXT NOT NULL DEFAULT 'Open Government Data (data.gov.in / daily-data-soil-moisture)',
    "resourceId" TEXT,
    "sourceUrl" TEXT NOT NULL DEFAULT 'https://data.gov.in/catalog/daily-data-soil-moisture',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualityStatus" TEXT NOT NULL DEFAULT 'verified_model_estimate',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoilMoistureObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FarmSensorMoisture" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "sensorId" TEXT,
    "hardwareType" TEXT,
    "readingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depthCm" INTEGER NOT NULL DEFAULT 15,
    "moisturePct" DOUBLE PRECISION NOT NULL,
    "temperatureC" DOUBLE PRECISION,
    "batteryPct" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "FarmSensorMoisture_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SoilMoistureObservation_state_district_observationDate_spat_key" 
    ON "SoilMoistureObservation"("state", "district", "observationDate", "spatialResolution");
CREATE INDEX IF NOT EXISTS "SoilMoistureObservation_state_district_observationDate_idx" 
    ON "SoilMoistureObservation"("state", "district", "observationDate");
CREATE INDEX IF NOT EXISTS "SoilMoistureObservation_observationDate_idx" 
    ON "SoilMoistureObservation"("observationDate");
CREATE INDEX IF NOT EXISTS "FarmSensorMoisture_fieldId_readingAt_idx" 
    ON "FarmSensorMoisture"("fieldId", "readingAt");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FarmSensorMoisture_fieldId_fkey') THEN
        ALTER TABLE "FarmSensorMoisture" ADD CONSTRAINT "FarmSensorMoisture_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
