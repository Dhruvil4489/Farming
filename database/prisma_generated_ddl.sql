-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "state" TEXT,
    "district" TEXT,
    "village" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "experienceMode" TEXT NOT NULL DEFAULT 'simple',
    "onboardingStatus" TEXT NOT NULL DEFAULT '{}',
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "village" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "totalAreaHa" DOUBLE PRECISION,
    "areaInputValue" DOUBLE PRECISION,
    "areaInputUnit" TEXT DEFAULT 'acre',
    "farmType" TEXT DEFAULT 'irrigated',
    "waterSources" TEXT DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaHa" DOUBLE PRECISION,
    "areaSource" TEXT NOT NULL DEFAULT 'manual',
    "boundaryGeoJson" TEXT,
    "centroidLat" DOUBLE PRECISION,
    "centroidLng" DOUBLE PRECISION,
    "irrigationType" TEXT DEFAULT 'drip',
    "soilType" TEXT DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'empty',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'cereal',
    "seasons" TEXT NOT NULL DEFAULT '[]',
    "typicalDurationDays" INTEGER,
    "displayColor" TEXT NOT NULL DEFAULT '#2F7D4F',
    "icon" TEXT DEFAULT 'sprout',
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropTranslation" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,

    CONSTRAINT "CropTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropVariety" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationDays" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',

    CONSTRAINT "CropVariety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropStage" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "startOffsetDays" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',

    CONSTRAINT "CropStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropStageTranslation" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CropStageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropStageAdvisory" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "requiresLocalConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'published',

    CONSTRAINT "CropStageAdvisory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropStageAdvisoryTranslation" (
    "id" TEXT NOT NULL,
    "advisoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "CropStageAdvisoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropCycle" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "varietyId" TEXT,
    "customCropName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "sowingDate" TIMESTAMP(3),
    "expectedHarvestDate" TIMESTAMP(3),
    "expectedHarvestBasis" TEXT DEFAULT 'estimate_from_master',
    "actualHarvestDate" TIMESTAMP(3),
    "areaHa" DOUBLE PRECISION,
    "irrigationType" TEXT,
    "seedInfo" TEXT,
    "quantityHarvested" DOUBLE PRECISION,
    "quantityUnit" TEXT DEFAULT 'kg',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CropCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CycleStage" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "templateStageId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "orderIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "CycleStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "fieldId" TEXT,
    "cropCycleId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "recurrenceRule" TEXT,
    "reminderMinutes" INTEGER,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completionDetails" TEXT,
    "skippedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherRecord" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "latRound" DOUBLE PRECISION NOT NULL,
    "lngRound" DOUBLE PRECISION NOT NULL,
    "kind" TEXT NOT NULL,
    "validAt" TIMESTAMP(3) NOT NULL,
    "payloadNormalized" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'open-meteo',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisoryRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "conditionJson" TEXT NOT NULL,
    "messageKey" TEXT NOT NULL,
    "appliesToTaskTypes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisoryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilProfile" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "soilType" TEXT NOT NULL DEFAULT 'unknown',
    "pathChosen" TEXT NOT NULL DEFAULT 'unknown',
    "notes" TEXT,

    CONSTRAINT "SoilProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilReport" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "fileId" TEXT,
    "reportType" TEXT NOT NULL DEFAULT 'health_card',
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "labName" TEXT,
    "sampledOn" TIMESTAMP(3),
    "extractedPayload" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoilReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilTest" (
    "id" TEXT NOT NULL,
    "soilReportId" TEXT,
    "fieldId" TEXT NOT NULL,
    "testedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'farmer_report',
    "confirmed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SoilTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilParameter" (
    "id" TEXT NOT NULL,
    "soilTestId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "rating" TEXT,

    CONSTRAINT "SoilParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmObservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL DEFAULT 'general',
    "severity" INTEGER NOT NULL DEFAULT 1,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "stageSnapshot" TEXT,
    "notes" TEXT,
    "photosJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IrrigationRecord" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "irrigatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'drip',
    "durationMinutes" INTEGER,
    "volumeL" DOUBLE PRECISION,
    "waterSource" TEXT,
    "moistureNote" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IrrigationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalNameSanitized" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'general',
    "attachableType" TEXT,
    "attachableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titleKey" TEXT NOT NULL,
    "bodyKey" TEXT NOT NULL,
    "paramsJson" TEXT NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" TEXT,
    "newValues" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketCommodity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "cropSlug" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketCommodity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPriceObservation" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "modalPrice" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '₹/Quintal',
    "priceDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'AGMARKNET / data.gov.in',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "MarketPriceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSyncLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "recordsStored" INTEGER NOT NULL DEFAULT 0,
    "sourcePublicationDate" TIMESTAMP(3),
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MarketSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizerCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nutrientProfile" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "applicationRole" TEXT NOT NULL,
    "precautions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FertilizerCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropFertilizerGuidance" (
    "id" TEXT NOT NULL,
    "cropSlug" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Gujarat & Western India',
    "cropStage" TEXT NOT NULL,
    "nutrientRequirement" TEXT NOT NULL,
    "fertilizerCategoryId" TEXT,
    "recommendedTiming" TEXT NOT NULL,
    "applicationMethod" TEXT NOT NULL,
    "guidanceText" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "importantPrecautions" TEXT NOT NULL,
    "sourceAuthority" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'verified',

    CONSTRAINT "CropFertilizerGuidance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT 'package',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'India',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "cropTarget" TEXT,
    "description" TEXT NOT NULL,
    "composition" TEXT,
    "packSize" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "mrp" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 50,
    "imageUrl" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "usageInstructions" TEXT,
    "safetyNotes" TEXT,
    "sellerName" TEXT NOT NULL DEFAULT 'SmartFarm Certified Agri-Input Cooperative',
    "sellerLicense" TEXT DEFAULT 'GJ-AGRI-COOP-2026-88',
    "isDemoProduct" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'demo_checkout',
    "paymentStatus" TEXT NOT NULL DEFAULT 'test_paid',
    "isDemoOrder" BOOLEAN NOT NULL DEFAULT true,
    "deliveryName" TEXT NOT NULL,
    "deliveryPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryVillage" TEXT,
    "deliveryDistrict" TEXT NOT NULL,
    "deliveryState" TEXT NOT NULL DEFAULT 'Gujarat',
    "deliveryPincode" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "unitPriceSnapshot" DOUBLE PRECISION NOT NULL,
    "packSizeSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_state_district_idx" ON "User"("state", "district");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "Farm_userId_idx" ON "Farm"("userId");

-- CreateIndex
CREATE INDEX "Field_farmId_idx" ON "Field"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_slug_key" ON "Crop"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CropTranslation_cropId_locale_key" ON "CropTranslation"("cropId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "CropStage_cropId_orderIndex_key" ON "CropStage"("cropId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CropStageTranslation_stageId_locale_key" ON "CropStageTranslation"("stageId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "CropStageAdvisoryTranslation_advisoryId_locale_key" ON "CropStageAdvisoryTranslation"("advisoryId", "locale");

-- CreateIndex
CREATE INDEX "CropCycle_fieldId_status_idx" ON "CropCycle"("fieldId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CycleStage_cropCycleId_orderIndex_key" ON "CycleStage"("cropCycleId", "orderIndex");

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");

-- CreateIndex
CREATE INDEX "WeatherRecord_fetchedAt_idx" ON "WeatherRecord"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisoryRule_code_key" ON "AdvisoryRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SoilProfile_fieldId_key" ON "SoilProfile"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "SoilParameter_soilTestId_code_key" ON "SoilParameter"("soilTestId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_channel_key" ON "NotificationPreference"("userId", "type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "MarketCommodity_name_variety_key" ON "MarketCommodity"("name", "variety");

-- CreateIndex
CREATE INDEX "MarketLocation_state_district_idx" ON "MarketLocation"("state", "district");

-- CreateIndex
CREATE UNIQUE INDEX "MarketLocation_name_state_district_key" ON "MarketLocation"("name", "state", "district");

-- CreateIndex
CREATE INDEX "MarketPriceObservation_commodityId_priceDate_idx" ON "MarketPriceObservation"("commodityId", "priceDate");

-- CreateIndex
CREATE INDEX "MarketPriceObservation_locationId_priceDate_idx" ON "MarketPriceObservation"("locationId", "priceDate");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPriceObservation_locationId_commodityId_priceDate_sou_key" ON "MarketPriceObservation"("locationId", "commodityId", "priceDate", "source");

-- CreateIndex
CREATE UNIQUE INDEX "FertilizerCategory_slug_key" ON "FertilizerCategory"("slug");

-- CreateIndex
CREATE INDEX "CropFertilizerGuidance_cropSlug_cropStage_idx" ON "CropFertilizerGuidance"("cropSlug", "cropStage");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBrand_name_key" ON "ProductBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_productId_key" ON "CartItem"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropTranslation" ADD CONSTRAINT "CropTranslation_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropVariety" ADD CONSTRAINT "CropVariety_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropStage" ADD CONSTRAINT "CropStage_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropStageTranslation" ADD CONSTRAINT "CropStageTranslation_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "CropStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropStageAdvisory" ADD CONSTRAINT "CropStageAdvisory_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "CropStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropStageAdvisoryTranslation" ADD CONSTRAINT "CropStageAdvisoryTranslation_advisoryId_fkey" FOREIGN KEY ("advisoryId") REFERENCES "CropStageAdvisory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropCycle" ADD CONSTRAINT "CropCycle_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropCycle" ADD CONSTRAINT "CropCycle_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropCycle" ADD CONSTRAINT "CropCycle_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "CropVariety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleStage" ADD CONSTRAINT "CycleStage_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "CropCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleStage" ADD CONSTRAINT "CycleStage_templateStageId_fkey" FOREIGN KEY ("templateStageId") REFERENCES "CropStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "CropCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherRecord" ADD CONSTRAINT "WeatherRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilProfile" ADD CONSTRAINT "SoilProfile_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilReport" ADD CONSTRAINT "SoilReport_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilTest" ADD CONSTRAINT "SoilTest_soilReportId_fkey" FOREIGN KEY ("soilReportId") REFERENCES "SoilReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilTest" ADD CONSTRAINT "SoilTest_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilParameter" ADD CONSTRAINT "SoilParameter_soilTestId_fkey" FOREIGN KEY ("soilTestId") REFERENCES "SoilTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmObservation" ADD CONSTRAINT "FarmObservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmObservation" ADD CONSTRAINT "FarmObservation_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmObservation" ADD CONSTRAINT "FarmObservation_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "CropCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationRecord" ADD CONSTRAINT "IrrigationRecord_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IrrigationRecord" ADD CONSTRAINT "IrrigationRecord_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "CropCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPriceObservation" ADD CONSTRAINT "MarketPriceObservation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "MarketLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPriceObservation" ADD CONSTRAINT "MarketPriceObservation_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "MarketCommodity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropFertilizerGuidance" ADD CONSTRAINT "CropFertilizerGuidance_fertilizerCategoryId_fkey" FOREIGN KEY ("fertilizerCategoryId") REFERENCES "FertilizerCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

