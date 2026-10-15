-- =====================================================================================
-- SMARTFARM AI - POSTGRESQL 18 SCHEMA & INTEGRITY VERIFICATION SUITE
-- Target Database: "Farmer"
-- Schema: "public"
-- Usage: Execute in pgAdmin 4 Query Tool (F5) to verify database health and schema status
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- TEST 1: VERIFY TOTAL APPLICATION TABLE COUNT (Expected: 43 tables in public schema)
-- -------------------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_tables_created,
    CASE 
        WHEN COUNT(*) >= 43 THEN '✔ PASS - All 43 SmartFarm AI tables detected'
        ELSE '❌ INCOMPLETE - Less than 43 tables found'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- -------------------------------------------------------------------------------------
-- TEST 2: LIST ALL 41 SMARTFARM AI TABLES WITH COLUMN COUNTS
-- -------------------------------------------------------------------------------------
SELECT 
    table_name,
    COUNT(column_name) AS total_columns
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name ASC;

-- -------------------------------------------------------------------------------------
-- TEST 3: VERIFY PRIMARY KEY CONSTRAINTS (Expected: 41 Primary Keys)
-- -------------------------------------------------------------------------------------
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
   AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- -------------------------------------------------------------------------------------
-- TEST 4: VERIFY FOREIGN KEY CONSTRAINTS AND CASCADING RULES
-- -------------------------------------------------------------------------------------
SELECT 
    tc.table_name AS child_table,
    kcu.column_name AS foreign_key_column,
    ccu.table_name AS parent_table,
    ccu.column_name AS primary_key_column,
    rc.delete_rule AS on_delete_action,
    rc.update_rule AS on_update_action,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- -------------------------------------------------------------------------------------
-- TEST 5: VERIFY UNIQUE CONSTRAINTS AND INDEXES
-- -------------------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- -------------------------------------------------------------------------------------
-- TEST 6: RECORD COUNT AUDIT ACROSS ALL SEEDED CORE TABLES
-- -------------------------------------------------------------------------------------
SELECT 'User' AS table_name, COUNT(*) AS row_count FROM "User"
UNION ALL
SELECT 'Role', COUNT(*) FROM "Role"
UNION ALL
SELECT 'UserRole', COUNT(*) FROM "UserRole"
UNION ALL
SELECT 'Farm', COUNT(*) FROM "Farm"
UNION ALL
SELECT 'Field', COUNT(*) FROM "Field"
UNION ALL
SELECT 'Crop', COUNT(*) FROM "Crop"
UNION ALL
SELECT 'CropTranslation', COUNT(*) FROM "CropTranslation"
UNION ALL
SELECT 'CropStage', COUNT(*) FROM "CropStage"
UNION ALL
SELECT 'CropStageTranslation', COUNT(*) FROM "CropStageTranslation"
UNION ALL
SELECT 'CropCycle', COUNT(*) FROM "CropCycle"
UNION ALL
SELECT 'Task', COUNT(*) FROM "Task"
UNION ALL
SELECT 'MarketCommodity', COUNT(*) FROM "MarketCommodity"
UNION ALL
SELECT 'MarketLocation', COUNT(*) FROM "MarketLocation"
UNION ALL
SELECT 'MarketPriceObservation', COUNT(*) FROM "MarketPriceObservation"
UNION ALL
SELECT 'FertilizerCategory', COUNT(*) FROM "FertilizerCategory"
UNION ALL
SELECT 'CropFertilizerGuidance', COUNT(*) FROM "CropFertilizerGuidance"
UNION ALL
SELECT 'ProductCategory', COUNT(*) FROM "ProductCategory"
UNION ALL
SELECT 'ProductBrand', COUNT(*) FROM "ProductBrand"
UNION ALL
SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Order', COUNT(*) FROM "Order"
UNION ALL
SELECT 'OrderItem', COUNT(*) FROM "OrderItem"
UNION ALL
SELECT 'SoilMoistureObservation', COUNT(*) FROM "SoilMoistureObservation"
UNION ALL
SELECT 'FarmSensorMoisture', COUNT(*) FROM "FarmSensorMoisture"
ORDER BY table_name;

-- -------------------------------------------------------------------------------------
-- TEST 7: REFERENTIAL INTEGRITY CHECK (Verify Zero Orphan Records)
-- -------------------------------------------------------------------------------------
-- 7a. Farms without valid users
SELECT COUNT(*) AS orphan_farms FROM "Farm" f 
LEFT JOIN "User" u ON f."userId" = u."id" 
WHERE u."id" IS NULL;

-- 7b. Fields without valid farms
SELECT COUNT(*) AS orphan_fields FROM "Field" fl 
LEFT JOIN "Farm" fm ON fl."farmId" = fm."id" 
WHERE fm."id" IS NULL;

-- 7c. CropCycles without valid fields or crops
SELECT COUNT(*) AS orphan_crop_cycles FROM "CropCycle" cc 
LEFT JOIN "Field" f ON cc."fieldId" = f."id"
LEFT JOIN "Crop" c ON cc."cropId" = c."id"
WHERE f."id" IS NULL OR c."id" IS NULL;

-- 7d. OrderItems without valid orders or products
SELECT COUNT(*) AS orphan_order_items FROM "OrderItem" oi
LEFT JOIN "Order" o ON oi."orderId" = o."id"
LEFT JOIN "Product" p ON oi."productId" = p."id"
WHERE o."id" IS NULL OR p."id" IS NULL;

-- 7e. MarketPriceObservations without valid location or commodity
SELECT COUNT(*) AS orphan_market_observations FROM "MarketPriceObservation" mpo
LEFT JOIN "MarketLocation" ml ON mpo."locationId" = ml."id"
LEFT JOIN "MarketCommodity" mc ON mpo."commodityId" = mc."id"
WHERE ml."id" IS NULL OR mc."id" IS NULL;

-- 7f. FarmSensorMoisture records without valid fields
SELECT COUNT(*) AS orphan_sensor_moistures FROM "FarmSensorMoisture" fsm
LEFT JOIN "Field" f ON fsm."fieldId" = f."id"
WHERE f."id" IS NULL;
