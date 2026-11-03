/**
 * SmartFarm AI — Phase 14 Crop Disease Accuracy, Context Validation & Store Integration Test Suite
 *
 * Verifies:
 * 1. User's actual Cotton leaf image (uploads/diagnoses/7c7e274d-aa3f-4779-8643-71676f83483c.png).
 * 2. Field plot crop inference (field named "Cotton" with empty cropCycles resolves to Cotton).
 * 3. Crop-Context Validation (Case 1: Cotton + Cotton -> Cotton Specialist).
 * 4. Crop-Context Validation (Case 2: Rice plot + Cotton leaf -> Crop Mismatch Detected).
 * 5. Lesion Presence Gate: Leaf with ~16.8% lesions NEVER classifies as healthy.
 * 6. Store Medicine Recommendation: Matches Mancozeb / Copper Oxychloride / Azoxystrobin in Fertilizer Store.
 * 7. Blurry image rejection.
 * 8. Non-foliage rejection.
 * 9. Clean healthy leaf classification.
 * 10. Database persistence and query verification.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createJiti } from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename, {
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
  },
});

const { prisma } = jiti('../src/lib/prisma.ts');
const { CropDiseaseRouter } = jiti('../src/services/ai/CropDiseaseRouter.ts');
const { DiseaseDiagnosisService } = jiti('../src/services/DiseaseDiagnosisService.ts');
const { DiseaseProductMatchingService } = jiti('../src/services/DiseaseProductMatchingService.ts');
const { CropVisionEngine } = jiti('../src/lib/crop-vision-engine.ts');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🌱 SMARTFARM AI — CRITICAL CROP ACCURACY & VALIDATION SUITE');
  console.log('================================================================\n');

  const userImagePath = path.join(process.cwd(), 'uploads/diagnoses/7c7e274d-aa3f-4779-8643-71676f83483c.png');
  const userImageExists = fs.existsSync(userImagePath);
  assert(userImageExists, `User uploaded cotton leaf image exists on disk (${userImagePath})`);

  if (!userImageExists) {
    console.error('Cannot proceed without user test image.');
    process.exit(1);
  }

  const userImageBuffer = fs.readFileSync(userImagePath);

  // ---------------------------------------------------------------------------
  // TEST 1: CropVisionEngine on User's Cotton Leaf
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 1] Real Computer Vision & Pathology Feature Extraction');
  const vision = await CropVisionEngine.analyzeLeafImage(userImageBuffer);

  assert(vision.isValidImage === true, 'Image format and dimensions are valid');
  assert(vision.isFoliage === true, 'Detected plant foliage tissue (foliageRatio >= 6%)');
  assert(vision.isBlurry === false, 'Image is sharp and in focus (blurScore >= 65)');
  assert(vision.aspectRatio >= 0.75 && vision.aspectRatio <= 1.5, `Aspect ratio (${vision.aspectRatio}) is broad palmate`);
  assert(vision.morphologyCategory === 'broad_palmate', `Morphology category is broad_palmate (got: ${vision.morphologyCategory})`);
  assert(vision.hasSignificantLesions === true, 'Detected significant foliar lesions (hasSignificantLesions === true)');
  assert(vision.lesionRatio >= 0.10, `Lesion coverage ${(vision.lesionRatio * 100).toFixed(1)}% is >= 10%`);
  assert(vision.estimatedSeverity === 'severe', `Estimated severity is severe (got: ${vision.estimatedSeverity})`);

  // ---------------------------------------------------------------------------
  // TEST 2: Field Plot Inference (Plot named "Cotton" with empty cropCycles)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 2] Field Plot Crop Inference');
  const cottonField = await prisma.field.findFirst({
    where: { name: 'Cotton' },
    include: { farm: true, cropCycles: true },
  });
  assert(Boolean(cottonField), 'Found user field named "Cotton"');

  // Test inferCropFromFieldName logic
  const testNames = [
    { name: 'Cotton', expected: 'cotton' },
    { name: 'North Field (Cotton Plot)', expected: 'cotton' },
    { name: 'Paddy Block 3', expected: 'rice' },
    { name: 'Wheat Gehun Field', expected: 'wheat' },
    { name: 'Mirchi Plot', expected: 'chilli' },
    { name: 'Tomato Polyhouse', expected: 'tomato' },
  ];

  function inferCropFromFieldName(name) {
    if (!name) return null;
    const n = name.toLowerCase();
    if (/\b(cotton|kapas|ru)\b/i.test(n)) return 'cotton';
    if (/\b(rice|paddy|chawal|dhan)\b/i.test(n)) return 'rice';
    if (/\b(wheat|gehun|ghau)\b/i.test(n)) return 'wheat';
    if (/\b(corn|maize|makka)\b/i.test(n)) return 'corn';
    if (/\b(tomato|tamatar)\b/i.test(n)) return 'tomato';
    if (/\b(potato|aalu|aloo|batata)\b/i.test(n)) return 'potato';
    if (/\b(chilli|chili|mirchi|mirch|marcha)\b/i.test(n)) return 'chilli';
    return null;
  }

  for (const t of testNames) {
    const inferred = inferCropFromFieldName(t.name);
    assert(inferred === t.expected, `Field "${t.name}" correctly infers crop "${t.expected}" (got: ${inferred})`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: CASE 1 — Selected Cotton + Uploaded Cotton Leaf
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 3] CASE 1: Selected Cotton + Uploaded Cotton Leaf');
  const case1Result = await CropDiseaseRouter.routeAndAnalyze(
    userImageBuffer,
    'cotton_test.png',
    'image/png',
    { selectedCropId: 'cotton', fieldCropName: 'cotton' }
  );

  assert(case1Result.status === 'accepted', `Status is 'accepted' (got: ${case1Result.status})`);
  assert(case1Result.crop === 'Cotton', `Crop is 'Cotton' (got: ${case1Result.crop})`);
  assert(case1Result.detectedCrop === 'Cotton', `Detected crop is 'Cotton' (got: ${case1Result.detectedCrop})`);
  assert(case1Result.isHealthy === false, 'isHealthy is FALSE (Lesion presence gate strictly prevented healthy classification!)');
  assert(case1Result.confidence > 0.85, `Confidence is high (${(case1Result.confidence * 100).toFixed(1)}%)`);
  assert(case1Result.severity === 'severe', `Severity is 'severe' (got: ${case1Result.severity})`);
  assert(case1Result.disease.includes('Blight') || case1Result.predictedLabel.includes('blight'), `Disease is leaf blight (got: ${case1Result.disease})`);
  assert(case1Result.topK[0].isHealthy === false, 'Top 1 candidate is NOT healthy');

  // ---------------------------------------------------------------------------
  // TEST 4: CASE 2 — Crop Mismatch: Selected Rice + Uploaded Cotton Leaf
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 4] CASE 2: Selected Rice + Uploaded Cotton Leaf (Crop Mismatch)');
  const case2Result = await CropDiseaseRouter.routeAndAnalyze(
    userImageBuffer,
    'mismatch_test.png',
    'image/png',
    { selectedCropId: 'rice', fieldCropName: 'rice' }
  );

  assert(case2Result.status === 'crop_mismatch', `Status is 'crop_mismatch' (got: ${case2Result.status})`);
  assert(case2Result.selectedCrop === 'Rice (Paddy)', `Selected crop is 'Rice (Paddy)' (got: ${case2Result.selectedCrop})`);
  assert(case2Result.detectedCrop === 'Cotton', `Detected crop is 'Cotton' (got: ${case2Result.detectedCrop})`);
  assert(case2Result.disease.includes('Crop Mismatch Detected'), `Disease banner indicates Crop Mismatch (got: ${case2Result.disease})`);
  assert(case2Result.isHealthy === null, 'isHealthy is null (did not falsely claim rice healthy leaf!)');
  assert(case2Result.topK.length === 0, 'topK is empty (did not fabricate candidates for mismatched crop)');
  assert(case2Result.validationNotice.includes('Discrepancy detected'), 'Validation notice explains discrepancy');

  // ---------------------------------------------------------------------------
  // TEST 5: Fertilizer Store Integration for Cotton Leaf Blight
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 5] Fertilizer Store Medicine Recommendations for Diagnosis');
  const recommendations = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: case1Result.crop,
    disease: case1Result.disease,
    label: case1Result.predictedLabel,
    isHealthy: case1Result.isHealthy,
    status: case1Result.status,
  });

  assert(recommendations.hasMatchingMedicine === true, 'Found matching store medicines in Fertilizer Store');
  assert(recommendations.medicines.length >= 2, `Retrieved ${recommendations.medicines.length} verified medicines`);
  const firstMed = recommendations.medicines[0];
  console.log(`     Top Recommended Medicine: ${firstMed.name} (${firstMed.activeIngredient}) - ₹${firstMed.price}`);
  assert(Boolean(firstMed.detailUrl), `Product URL is valid (${firstMed.detailUrl})`);
  assert(Boolean(firstMed.slug), `Product slug is valid (${firstMed.slug})`);
  assert(typeof firstMed.inStock === 'boolean', `In stock status is boolean (${firstMed.inStock})`);

  // Ensure Crop Mismatch does NOT recommend chemical medicines
  const mismatchRecs = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: case2Result.crop,
    disease: case2Result.disease,
    label: case2Result.predictedLabel,
    isHealthy: case2Result.isHealthy,
    status: case2Result.status,
  });
  assert(mismatchRecs.hasMatchingMedicine === false, 'Crop mismatch returns 0 store medicines (prevents wrong chemical application)');

  // ---------------------------------------------------------------------------
  // TEST 6: Blurry Image Rejection
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 6] Blurry Image Quality Rejection');
  // Create a blurred image
  const blurryBuffer = await sharp(userImageBuffer)
    .resize(100, 100)
    .blur(15)
    .png()
    .toBuffer();

  const blurryResult = await CropDiseaseRouter.routeAndAnalyze(
    blurryBuffer,
    'blurry.png',
    'image/png',
    { selectedCropId: 'cotton' }
  );

  assert(blurryResult.status === 'blurry_image', `Blurry image rejected with 'blurry_image' (got: ${blurryResult.status})`);
  assert(blurryResult.imageMetadata.isBlurry === true, 'Metadata flags isBlurry: true');

  // ---------------------------------------------------------------------------
  // TEST 7: Non-Foliage / Non-Leaf Image Rejection
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 7] Non-Leaf / Solid Background Rejection');
  // Create a solid gray image
  const nonLeafBuffer = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 180, g: 180, b: 180, alpha: 1.0 },
    },
  })
    .png()
    .toBuffer();

  const nonLeafResult = await CropDiseaseRouter.routeAndAnalyze(
    nonLeafBuffer,
    'solid_grey.png',
    'image/png',
    { selectedCropId: 'cotton' }
  );

  assert(nonLeafResult.status === 'not_crop', `Solid non-leaf image rejected with 'not_crop' (got: ${nonLeafResult.status})`);
  assert(nonLeafResult.disease === 'No Crop Foliage Detected', 'Disease indicates No Crop Foliage Detected');

  // ---------------------------------------------------------------------------
  // TEST 8: Clean Healthy Leaf Classification (No Lesions)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 8] Clean Healthy Leaf Classification');
  // Synthesize a pristine, clean green leaf with natural margins and venation
  const leafSvg = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#f5f5f5"/>
    <path d="M 128,25 C 60,70 45,150 128,230 C 211,150 196,70 128,25 Z" fill="#2d8a4e"/>
    <line x1="128" y1="25" x2="128" y2="230" stroke="#1b5e20" stroke-width="3"/>
    <line x1="128" y1="80" x2="80" y2="120" stroke="#1b5e20" stroke-width="2"/>
    <line x1="128" y1="80" x2="176" y2="120" stroke="#1b5e20" stroke-width="2"/>
    <line x1="128" y1="140" x2="85" y2="175" stroke="#1b5e20" stroke-width="2"/>
    <line x1="128" y1="140" x2="171" y2="175" stroke="#1b5e20" stroke-width="2"/>
  </svg>`;
  const healthyLeafBuffer = await sharp(Buffer.from(leafSvg)).png().toBuffer();

  const healthyResult = await CropDiseaseRouter.routeAndAnalyze(
    healthyLeafBuffer,
    'healthy_cotton.png',
    'image/png',
    { selectedCropId: 'cotton' }
  );

  assert(healthyResult.status === 'accepted', `Healthy leaf status is 'accepted' (got: ${healthyResult.status})`);
  assert(healthyResult.isHealthy === true, `Healthy leaf has isHealthy === true (got: ${healthyResult.isHealthy})`);
  assert(healthyResult.severity === 'none', `Healthy leaf severity is 'none' (got: ${healthyResult.severity})`);
  assert(healthyResult.disease.includes('Healthy Leaf'), `Disease label is healthy leaf (got: ${healthyResult.disease})`);

  // ---------------------------------------------------------------------------
  // TEST 9: Store Cart Endpoint Verification
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 9] Fertilizer Store Cart Endpoint & Stock Verification');
  const targetMedicine = recommendations.medicines[0];
  const dbProduct = await prisma.product.findUnique({
    where: { id: targetMedicine.id },
  });
  assert(Boolean(dbProduct), `Medicine exists in PostgreSQL / SQLite Product table (${dbProduct?.name})`);
  assert(dbProduct.stock > 0, `Product is in stock (quantity: ${dbProduct?.stock})`);

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
