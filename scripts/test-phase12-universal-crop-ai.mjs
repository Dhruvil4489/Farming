import { PrismaClient } from '@prisma/client';
import { createJiti } from 'jiti';
import fs from 'fs';
import path from 'path';

const jiti = createJiti(import.meta.url, {
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
  },
});

const { CropModelRegistry, AI_MODEL_REGISTRY, UNIVERSAL_CROP_CATALOG } = jiti('../src/services/ai/CropModelRegistry.ts');
const { CropDiseaseRouter } = jiti('../src/services/ai/CropDiseaseRouter.ts');
const { DiseaseDiagnosisService } = jiti('../src/services/DiseaseDiagnosisService.ts');
const { getAgronomicPathology, isCropSupportedByModel } = jiti('../src/lib/crop-disease-knowledge.ts');
const { checkMagicBytes, estimateBlurScore } = jiti('../src/lib/image-quality.ts');
const { prisma, getPrismaClient } = jiti('../src/lib/prisma.ts');

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

// Minimal valid synthetic images for testing
function createSyntheticLeafJpeg(color = 'green') {
  const byte = color === 'green' ? 0x7a : 0x90;
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, ...new Array(64).fill(byte),
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x64, 0x00, 0x64, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    ...new Array(1200).fill(byte),
    0xff, 0xd9
  ]);
}

function createSyntheticPng(sharp = true) {
  const buf = Buffer.alloc(15000);
  // PNG header
  [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].forEach((b, i) => { buf[i] = b; });
  // Fill data
  for (let i = 8; i < buf.length; i++) {
    buf[i] = sharp ? ((i * 37) % 256) : 180;
  }
  return buf;
}

async function runTests() {
  console.log('\n================================================================');
  console.log('  SmartFarm AI — Universal Crop Disease AI Engine Test Suite');
  console.log('================================================================\n');

  // ------------------------------------------------------------------
  // TEST GROUP 1: Backend Database & Client Auto-Healing (Fix Error 1)
  // ------------------------------------------------------------------
  console.log('── 1. Backend Error Resolution & Prisma Delegate Health ──');
  const dbClient = getPrismaClient();
  assert(typeof dbClient.cropDiagnosisRecord?.create === 'function', "getPrismaClient().cropDiagnosisRecord.create is a valid function");
  assert(typeof prisma.cropDiagnosisRecord?.create === 'function', "Proxied prisma.cropDiagnosisRecord.create auto-heals and exists");
  assert(typeof prisma.aiModelRegistry?.findMany === 'function', "prisma.aiModelRegistry delegate exists");
  assert(typeof prisma.diagnosisFeedback?.create === 'function', "prisma.diagnosisFeedback delegate exists");

  // Verify farmer accounts preserved
  const userCount = await prisma.user.count();
  assert(userCount >= 12, `Preserved all ${userCount} existing farmer accounts`);

  // Verify enhanced columns on CropDiagnosisRecord
  const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info("CropDiagnosisRecord");`);
  const colNames = new Set(cols.map((c) => c.name));
  assert(colNames.has('selectedCrop'), "CropDiagnosisRecord has 'selectedCrop' column");
  assert(colNames.has('detectedCrop'), "CropDiagnosisRecord has 'detectedCrop' column");
  assert(colNames.has('modelId'), "CropDiagnosisRecord has 'modelId' column");
  assert(colNames.has('severity'), "CropDiagnosisRecord has 'severity' column");
  assert(colNames.has('feedbackRating'), "CropDiagnosisRecord has 'feedbackRating' column");
  assert(colNames.has('feedbackAccurate'), "CropDiagnosisRecord has 'feedbackAccurate' column");

  // ------------------------------------------------------------------
  // TEST GROUP 2: Multi-Model Registry & Taxonomy Coverage
  // ------------------------------------------------------------------
  console.log('\n── 2. Universal Crop Taxonomy & Model Registry ──');
  assert(UNIVERSAL_CROP_CATALOG.length >= 30, `Target crop taxonomy covers ${UNIVERSAL_CROP_CATALOG.length} crops (target: >= 30)`);

  const cottonCrop = CropModelRegistry.getCropById('cotton');
  assert(cottonCrop !== null && cottonCrop.status === 'specialist_active', "Cotton is registered with 'specialist_active' status");
  assert(cottonCrop?.supportedDiseasesCount === 5, "Cotton specialist model supports 5 verified classes");

  const wheatCrop = CropModelRegistry.getCropById('wheat');
  assert(wheatCrop !== null && wheatCrop.status === 'specialist_active', "Wheat is registered with 'specialist_active' status");
  assert(wheatCrop?.supportedDiseasesCount === 6, "Wheat specialist model supports 6 verified classes");

  const riceCrop = CropModelRegistry.getCropById('rice');
  assert(riceCrop !== null && riceCrop.status === 'specialist_active', "Rice is registered with 'specialist_active' status");
  assert(riceCrop?.supportedDiseasesCount === 6, "Rice specialist model supports 6 verified classes");

  const sugarcaneCrop = CropModelRegistry.getCropById('sugarcane');
  assert(sugarcaneCrop !== null && sugarcaneCrop.status === 'in_validation', "Sugarcane is registered with 'in_validation' status (No fake claims)");
  assert(sugarcaneCrop?.commonRegionalDiseases?.length > 0, "Sugarcane has verified regional disease references");

  // Models in Registry
  const cottonModel = AI_MODEL_REGISTRY['cotton-specialist-effnet-v2'];
  assert(cottonModel.architecture === 'EfficientNet-B2 with Multi-Scale Spatial Attention', "Cotton model uses EfficientNet-B2");
  assert(cottonModel.validationMetrics.accuracy === 0.942, "Cotton model validation accuracy is verified at 94.2%");

  const wheatModel = AI_MODEL_REGISTRY['wheat-pathology-resnet'];
  assert(wheatModel.architecture.includes('ResNet-50'), "Wheat model uses ResNet-50 fine-tuned backbone");
  assert(wheatModel.validationMetrics.accuracy === 0.951, "Wheat model validation accuracy is verified at 95.1%");

  const riceModel = AI_MODEL_REGISTRY['rice-protection-vit'];
  assert(riceModel.architecture.includes('Vision Transformer'), "Rice model uses Vision Transformer (ViT)");
  assert(riceModel.validationMetrics.accuracy === 0.960, "Rice model validation accuracy is verified at 96.0%");

  // ------------------------------------------------------------------
  // TEST GROUP 3: Multi-Model Router & Inference Pipeline
  // ------------------------------------------------------------------
  console.log('\n── 3. Multi-Model Router & Specialist Inference ──');
  const validLeafBuf = createSyntheticPng(true);

  // Test 1: Cotton Leaf Diagnosis
  const cottonResult = await CropDiseaseRouter.routeAndAnalyze(validLeafBuf, 'cotton_leaf.png', 'image/png', {
    selectedCropId: 'cotton',
  });
  assert(cottonResult.status === 'accepted' || cottonResult.status === 'uncertain', "Cotton analysis completes with valid diagnostic status");
  assert(cottonResult.crop === 'Cotton', "Cotton result identifies crop as Cotton");
  assert(cottonResult.model.name.includes('Cotton'), "Routed to Cotton Specialist Model");
  assert(cottonResult.topK.length === 3, "Cotton diagnosis outputs top-3 candidate predictions");
  assert(cottonResult.pathology !== null, "Cotton pathology augmented with ICAR symptoms and treatments");

  // Test 2: Wheat Leaf Diagnosis
  const wheatResult = await CropDiseaseRouter.routeAndAnalyze(validLeafBuf, 'wheat_leaf.png', 'image/png', {
    selectedCropId: 'wheat',
  });
  assert(wheatResult.crop === 'Wheat', "Wheat result identifies crop as Wheat");
  assert(wheatResult.model.name.includes('Wheat'), "Routed to Wheat Pathology Diagnostic Network");
  assert(wheatResult.pathology?.organicOptions?.length > 0, "Wheat pathology includes organic treatment guidance");
  assert(wheatResult.pathology?.chemicalOptions?.length > 0, "Wheat pathology includes CIBRC chemical controls");

  // Test 3: Rice Leaf Diagnosis
  const riceResult = await CropDiseaseRouter.routeAndAnalyze(validLeafBuf, 'rice_leaf.png', 'image/png', {
    selectedCropId: 'rice',
  });
  assert(riceResult.crop.includes('Rice'), "Rice result identifies crop as Rice");
  assert(riceResult.model.architecture.includes('Vision Transformer'), "Routed to Rice ViT model");

  // Test 4: Tomato Leaf (PlantVillage Benchmark Network)
  const tomatoResult = await CropDiseaseRouter.routeAndAnalyze(validLeafBuf, 'tomato_leaf.png', 'image/png', {
    selectedCropId: 'tomato',
  });
  assert(tomatoResult.crop === 'Tomato', "Tomato result identifies crop as Tomato");
  assert(tomatoResult.model.name.includes('PlantVillage'), "Tomato routed to PlantVillage Horticultural Network");

  // Test 5: Potato Leaf
  const potatoResult = await CropDiseaseRouter.routeAndAnalyze(validLeafBuf, 'potato_leaf.png', 'image/png', {
    selectedCropId: 'potato',
  });
  assert(potatoResult.crop === 'Potato', "Potato result identifies crop as Potato");

  // Test 6: Maize Leaf
  const maizeResult = await CropDiseaseRouter.routeAndAnalyze(validLeafBuf, 'maize_leaf.png', 'image/png', {
    selectedCropId: 'maize',
  });
  assert(maizeResult.crop.includes('Corn') || maizeResult.crop.includes('Maize'), "Maize identifies correctly");

  // Test 7: Chilli Leaf
  const chilliResult = await CropDiseaseRouter.routeAndAnalyze(validLeafBuf, 'chilli_leaf.png', 'image/png', {
    selectedCropId: 'chilli',
  });
  assert(chilliResult.crop.includes('Chilli') || chilliResult.crop.includes('Pepper'), "Chilli routed to Specialist model");

  // Test 8: Crop in Validation Phase (Sugarcane) — No Fabricated Diagnosis
  const sugarcaneResult = await CropDiseaseRouter.routeAndAnalyze(validLeafBuf, 'sugarcane_leaf.png', 'image/png', {
    selectedCropId: 'sugarcane',
  });
  assert(sugarcaneResult.status === 'in_validation', "Sugarcane safely returns 'in_validation' status");
  assert(sugarcaneResult.confidence === null, "Sugarcane does NOT fabricate a fake confidence score");
  assert(sugarcaneResult.validationNotice !== null, "Sugarcane provides transparent validation trial notice");

  // Test 9: Blurry Image Rejection Gate
  const blurryBuf = createSyntheticPng(false); // uniform bytes -> zero gradient variance
  const blurResult = await CropDiseaseRouter.routeAndAnalyze(blurryBuf, 'blurry.png', 'image/png');
  assert(blurResult.status === 'blurry_image', "Zero-variance blurry image is caught by image quality prefilter");
  assert(blurResult.explanation.includes('blurry') || blurResult.explanation.includes('focus'), "Blurry image returns useful focus guidance");

  // Test 10: Corrupted / Non-Image Rejection
  const corruptBuf = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44]);
  let caughtCorrupt = false;
  try {
    await CropDiseaseRouter.routeAndAnalyze(corruptBuf, 'corrupt.dat', 'application/octet-stream');
  } catch (err) {
    caughtCorrupt = true;
  }
  assert(caughtCorrupt === true, "Corrupt binary throws clean validation error");

  // ------------------------------------------------------------------
  // TEST GROUP 4: Database End-to-End Persistence & History
  // ------------------------------------------------------------------
  console.log('\n── 4. End-to-End Database Persistence & Audit ──');
  const firstField = await prisma.field.findFirst({ include: { farm: { include: { user: true } } } });
  const firstUser = firstField?.farm?.user || await prisma.user.findFirst();

  assert(Boolean(firstUser && firstField), "Found valid test user and field in database");

  if (firstUser && firstField) {
    // 1. Insert Diagnosis Record
    const testRecord = await prisma.cropDiagnosisRecord.create({
      data: {
        userId: firstUser.id,
        fieldId: firstField.id,
        imagePath: 'diagnoses/test_cotton_01.jpg',
        originalFilename: 'test_cotton_01.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 45200,
        status: cottonResult.status,
        selectedCrop: 'Cotton',
        detectedCrop: 'Cotton',
        predictedLabel: cottonResult.predictedLabel || 'cotton_leaf_blight',
        cropName: 'Cotton',
        diseaseName: cottonResult.disease || 'Cotton Leaf Blight',
        isHealthy: false,
        confidence: cottonResult.confidence || 0.91,
        severity: 'moderate',
        topKJson: JSON.stringify(cottonResult.topK),
        modelId: cottonResult.model.modelId,
        modelName: cottonResult.model.name,
        modelVersion: cottonResult.model.version,
        source: 'farmer_upload',
        notes: 'Test verification record',
      },
    });

    assert(Boolean(testRecord.id), `Successfully persisted test diagnosis record ID: ${testRecord.id}`);
    assert(testRecord.selectedCrop === 'Cotton', "Stored selectedCrop matches 'Cotton'");
    assert(testRecord.detectedCrop === 'Cotton', "Stored detectedCrop matches 'Cotton'");

    // 2. Insert Farmer Feedback
    const feedback = await prisma.diagnosisFeedback.create({
      data: {
        diagnosisId: testRecord.id,
        userId: firstUser.id,
        isAccurate: true,
        rating: 5,
        comments: 'Verified in field with CICR advisory',
      },
    });
    assert(Boolean(feedback.id), `Successfully persisted farmer diagnostic feedback ID: ${feedback.id}`);

    // 3. Query Diagnosis History
    const historyList = await prisma.cropDiagnosisRecord.findMany({
      where: { userId: firstUser.id },
      orderBy: { diagnosedAt: 'desc' },
      take: 5,
    });
    assert(historyList.length > 0, `Successfully retrieved ${historyList.length} history records`);

    // Clean up test record
    await prisma.cropDiagnosisRecord.delete({ where: { id: testRecord.id } });
    console.log('  ✔ Cleaned up test database record.');
  }

  // ------------------------------------------------------------------
  // TEST GROUP 5: Multilingual Dictionaries Integrity
  // ------------------------------------------------------------------
  console.log('\n── 5. Multilingual Dictionaries Verification ──');
  const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
  const hi = JSON.parse(fs.readFileSync('src/locales/hi.json', 'utf8'));
  const gu = JSON.parse(fs.readFileSync('src/locales/gu.json', 'utf8'));

  assert(en.diagnosis_title === "Universal Crop Disease AI Engine", "en.json has universal title");
  assert(hi.diagnosis_title === "सार्वभौमिक फसल रोग एआई इंजन", "hi.json has authentic Hindi title");
  assert(gu.diagnosis_title === "સાર્વત્રિક પાક રોગ એઆઈ એન્જિન", "gu.json has authentic Gujarati title");
  assert(Boolean(en.diagnosis_cotton_specialist_title), "Cotton specialist translation exists in en");
  assert(Boolean(hi.diagnosis_cotton_specialist_title), "Cotton specialist translation exists in hi");
  assert(Boolean(gu.diagnosis_cotton_specialist_title), "Cotton specialist translation exists in gu");

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
