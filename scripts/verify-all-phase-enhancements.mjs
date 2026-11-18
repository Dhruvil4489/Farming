import { PrismaClient } from '@prisma/client';
import { createJiti } from 'jiti';
import fs from 'fs';
import path from 'path';

const jiti = createJiti(import.meta.url, {
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
  },
});

const {
  SUPPORTED_BENCHMARK_CROPS,
  UNSUPPORTED_COMMON_CROPS,
  PLANT_VILLAGE_PATHOLOGY,
  getAgronomicPathology,
  isCropSupportedByModel,
  isCropSupportedByBenchmark,
} = jiti('../src/lib/crop-disease-knowledge.ts');

const { checkMagicBytes, estimateBlurScore } = jiti('../src/lib/image-quality.ts');
const { SoilMoistureService } = jiti('../src/services/SoilMoistureService.ts');

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  SmartFarm AI — Master System Verification Suite');
  console.log('======================================================\n');

  // --- TEST GROUP 1: Database & Schema Integrity ---
  console.log('── 1. Database & Schema Verification ──');
  assert(typeof prisma.cropDiagnosisRecord?.create === 'function', "prisma.cropDiagnosisRecord.create exists (Fixes 'reading create' bug)");
  assert(typeof prisma.irrigationRecord?.findMany === 'function', "prisma.irrigationRecord.findMany exists");

  // Verify farmer records preserved
  const userCount = await prisma.user.count();
  assert(userCount >= 12, `All 12 farmer user accounts are preserved (found ${userCount})`);

  // Verify IrrigationRecord columns in database
  const irrColumns = await prisma.$queryRawUnsafe(`PRAGMA table_info("IrrigationRecord");`);
  const colNames = irrColumns.map((c) => c.name);
  assert(colNames.includes('userId'), "IrrigationRecord has 'userId' column (Fixes HTTP 500 error)");
  assert(colNames.includes('updatedAt'), "IrrigationRecord has 'updatedAt' column");

  // Verify CropDiagnosisRecord table
  const diagTable = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' AND name='CropDiagnosisRecord';`);
  assert(diagTable.length > 0, "CropDiagnosisRecord table exists in database");

  // --- TEST GROUP 2: Crop Disease AI & Knowledge ---
  console.log('\n── 2. Crop Disease AI & Pathology Engine ──');
  const pathologyKeys = Object.keys(PLANT_VILLAGE_PATHOLOGY);
  assert(pathologyKeys.length === 38, `PlantVillage benchmark strictly has 38 classes (found ${pathologyKeys.length})`);
  assert(SUPPORTED_BENCHMARK_CROPS.length === 14, `PlantVillage benchmark strictly covers 14 crops (found ${SUPPORTED_BENCHMARK_CROPS.length})`);

  // Test Cotton limitation handling in legacy benchmark
  const cottonBenchmarkSupported = isCropSupportedByBenchmark('Cotton');
  assert(cottonBenchmarkSupported === false, "Cotton is strictly flagged as unsupported by PlantVillage benchmark (No hallucination)");

  // Test Cotton support in upgraded multi-model architecture
  const cottonMultiModelSupported = isCropSupportedByModel('Cotton');
  assert(cottonMultiModelSupported === true, "Cotton is registered as supported in the multi-model architecture");

  const cottonInUnsupported = UNSUPPORTED_COMMON_CROPS.includes('Cotton');
  assert(cottonInUnsupported === true, "Cotton is registered in UNSUPPORTED_COMMON_CROPS");

  // Test Pathology lookup for a known benchmark disease
  const tomatoBlight = getAgronomicPathology('Tomato___Late_blight');
  assert(tomatoBlight !== null, "Tomato Late Blight pathology is registered in knowledge base");
  assert(tomatoBlight?.symptoms?.length > 0, "Symptoms list is populated");
  assert(tomatoBlight?.organicOptions?.length > 0, "Organic treatments are populated");
  assert(tomatoBlight?.chemicalOptions?.length > 0, "Chemical treatment with safety guidelines is populated");
  assert(tomatoBlight?.whenToConsultExpert !== undefined, "KVK / Expert escalation guidance is present");

  // Test Image Quality Validator
  const fakePngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...new Array(500).fill(128)]);
  const magicCheck = checkMagicBytes(fakePngHeader);
  assert(magicCheck.isValid === true && magicCheck.mimeType === 'image/png', "Image validator correctly identifies PNG binary signature");

  const invalidHeader = Buffer.from([0x00, 0x01, 0x02, 0x03]);
  const invalidMagic = checkMagicBytes(invalidHeader);
  assert(invalidMagic.isValid === false, "Non-image buffer is rejected");

  const blurEvaluation = estimateBlurScore(Buffer.alloc(60000, 200));
  assert(blurEvaluation.isBlurry === true, "Solid / blur test pattern correctly flags blur");

  // --- TEST GROUP 3: Soil Moisture Redesign & Threshold Engine ---
  console.log('\n── 3. Soil Moisture & Multi-Factor Thresholds ──');
  const wheatLoam = SoilMoistureService.resolveThresholds('wheat', 'loamy');
  assert(wheatLoam.low === 40 && wheatLoam.optimal === 55 && wheatLoam.high === 70, `Wheat on loamy soil resolves low=${wheatLoam.low}%, opt=${wheatLoam.optimal}%, high=${wheatLoam.high}%`);

  const riceClay = SoilMoistureService.resolveThresholds('rice', 'clay');
  assert(riceClay.low >= 35 && riceClay.soilType === 'clay', "Rice on clay soil adjusts thresholds appropriately");

  // Categorization
  const dryCat = SoilMoistureService.categorizeMoistureWithThreshold(20, wheatLoam);
  assert(dryCat.level === 'dry', "20% moisture on Wheat/Loam categorized as 'dry'");

  const optCat = SoilMoistureService.categorizeMoistureWithThreshold(55, wheatLoam);
  assert(optCat.level === 'optimal', "55% moisture categorized as 'optimal'");

  const wetCat = SoilMoistureService.categorizeMoistureWithThreshold(72, wheatLoam);
  assert(wetCat.level === 'wet', "72% moisture categorized as 'wet'");

  const critCat = SoilMoistureService.categorizeMoistureWithThreshold(12, wheatLoam);
  assert(critCat.level === 'critical', "12% moisture categorized as 'critical'");

  // Test Hardware Absence Handling (No fake data)
  const existingField = await prisma.field.findFirst();
  assert(Boolean(existingField), `Found existing field plot in database: ${existingField?.name}`);
  if (existingField) {
    const fieldTelemetry = await SoilMoistureService.getFieldSensorTelemetry(existingField.id);
    assert(typeof fieldTelemetry.hasSensor === 'boolean', "Field telemetry returns valid hasSensor boolean");
    assert(fieldTelemetry.sensorNotice !== undefined, "Hardware status provides sensor connection notice");
  }

  // --- TEST GROUP 4: Multilingual Translation Dictionaries ---
  console.log('\n── 4. Multilingual Agricultural Dictionaries (en, hi, gu) ──');
  const enJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/locales/en.json'), 'utf8'));
  const hiJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/locales/hi.json'), 'utf8'));
  const guJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/locales/gu.json'), 'utf8'));

  assert(Boolean(enJson.soil_moisture && hiJson.soil_moisture && guJson.soil_moisture), "soil_moisture key exists in en, hi, gu");
  assert(Boolean(enJson.irrigation_advisory_title && hiJson.irrigation_advisory_title && guJson.irrigation_advisory_title), "irrigation_advisory_title key exists in en, hi, gu");
  assert(Boolean(enJson.diagnosis_cotton_unsupported_title && hiJson.diagnosis_cotton_unsupported_title && guJson.diagnosis_cotton_unsupported_title), "diagnosis_cotton_unsupported_title key exists in en, hi, gu");
  assert(Boolean(enJson.moisture_sensor_disconnected && hiJson.moisture_sensor_disconnected && guJson.moisture_sensor_disconnected), "moisture_sensor_disconnected key exists in en, hi, gu");
  assert(guJson.soil_moisture === 'જમીનની ભેજ', "Gujarati soil moisture translation is natural ('જમીનની ભેજ')");
  assert(hiJson.soil_moisture === 'मिट्टी की नमी', "Hindi soil moisture translation is natural ('मिट्टी की नमी')");

  // --- TEST GROUP 5: PostgreSQL Manual Migration Scripts ---
  console.log('\n── 5. Manual PostgreSQL SQL Files ──');
  const migration01 = fs.readFileSync(path.join(process.cwd(), 'database/manual_sql/01_upgrade_irrigation_and_diagnosis.sql'), 'utf8');
  assert(migration01.includes('CREATE TABLE IF NOT EXISTS "CropDiagnosisRecord"'), "PostgreSQL script creates CropDiagnosisRecord idempotently");
  assert(migration01.includes('ALTER TABLE "IrrigationRecord" ADD COLUMN "userId" TEXT'), "PostgreSQL script adds userId to IrrigationRecord idempotently");

  const rollback = fs.readFileSync(path.join(process.cwd(), 'database/manual_sql/03_rollback_scripts.sql'), 'utf8');
  assert(rollback.includes('DROP TABLE IF EXISTS "CropDiagnosisRecord"'), "PostgreSQL rollback script is provided");

  console.log('\n======================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
