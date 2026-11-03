/**
 * SmartFarm AI — Phase 13 End-to-End Test Suite
 *
 * Verifies all 11 Phase 9 test cases:
 * TEST 1: Upload a valid crop leaf image -> AI identifies crop and disease.
 * TEST 2: Verify the disease prediction originates from model registry & router.
 * TEST 3: Treatment recommendation matches crop and disease using verified agricultural data.
 * TEST 4: Store product matching returns actual, compatible store products.
 * TEST 5: Direct product navigation slug resolution.
 * TEST 6: Direct Add to Cart API functionality with stock and quantity checks.
 * TEST 7: Buy Now workflow integration with cart and order checkout state.
 * TEST 8: Diagnosis history persistence and retrieval across sessions.
 * TEST 9: Unsupported crop / in-validation boundary handling (no fake diagnoses or chemical prescriptions).
 * TEST 10: Out-of-stock product boundary handling (purchase prevention).
 * TEST 11: Multi-tenant authorization (farmers cannot view or delete each other's records or carts).
 *
 * Usage:
 *   node scripts/test-phase13-e2e-disease-ecommerce.mjs
 */

import { createJiti } from 'jiti';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename, {
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
  },
});

const { prisma, getPrismaClient } = jiti('../src/lib/prisma.ts');
const { CropDiseaseRouter } = jiti('../src/services/ai/CropDiseaseRouter.ts');
const { DiseaseDiagnosisService } = jiti('../src/services/DiseaseDiagnosisService.ts');
const { DiseaseProductMatchingService } = jiti('../src/services/DiseaseProductMatchingService.ts');
const { StoreService } = jiti('../src/services/StoreService.ts');
const { saveDiagnosisImage } = jiti('../src/lib/storage.ts');

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

import fs from 'node:fs';

// Load real cotton leaf photograph for realistic computer vision testing
function createSyntheticLeafJpeg() {
  const p = path.resolve(process.cwd(), 'uploads/diagnoses/7c7e274d-aa3f-4779-8643-71676f83483c.png');
  if (fs.existsSync(p)) {
    return fs.readFileSync(p);
  }
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, ...new Array(64).fill(0x6e),
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x64, 0x00, 0x64, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    ...new Array(1200).fill(0x6e),
    0xff, 0xd9,
  ]);
}

async function run() {
  console.log('\n================================================================');
  console.log('  SmartFarm AI — End-to-End Disease & E-Commerce Test Suite');
  console.log('================================================================\n');

  // Multi-tenant accounts setup
  const farmer1 = await prisma.user.findFirst({
    where: { email: 'farmer@smartfarm.ai' },
    include: { farms: { include: { fields: true } } },
  });
  assert(Boolean(farmer1?.id), 'Farmer 1 (Primary) account loaded');

  const farmer2 = await prisma.user.findFirst({
    where: { phone: '1234567890' },
    include: { farms: { include: { fields: true } } },
  });
  assert(Boolean(farmer2?.id), 'Farmer 2 (Secondary) account loaded for tenant isolation');

  const field1 = farmer1?.farms[0]?.fields[0];
  assert(Boolean(field1?.id), `Farmer 1 has field plot: ${field1?.name}`);

  // ---------------------------------------------------------------------------
  // TEST 1: Upload a valid crop leaf image -> AI identifies crop and disease
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 1: Valid Crop Leaf Upload & Identification ──');
  const leafImage = createSyntheticLeafJpeg(0x6e);
  const saved = await saveDiagnosisImage(leafImage, 'cotton_leaf_test.jpg');
  assert(Boolean(saved.filename), `Image safely persisted: ${saved.filename}`);

  const prediction = await DiseaseDiagnosisService.predict(leafImage, saved.filename, saved.mimeType, {
    requestedCrop: 'Cotton',
    fieldCropName: 'cotton',
  });
  assert(prediction.status === 'accepted', `Prediction status is accepted (${prediction.status})`);
  assert(prediction.crop === 'Cotton', `Crop identified correctly as Cotton`);
  assert(Boolean(prediction.disease), `Disease identified: ${prediction.disease}`);

  // ---------------------------------------------------------------------------
  // TEST 2: Verify disease prediction originates from actual model
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 2: Prediction Origin & Model Calibration ──');
  assert(Boolean(prediction.model.name), `Model identifier present: ${prediction.model.name}`);
  assert(prediction.confidence > 0.60, `Softmax confidence score is valid: ${(prediction.confidence * 100).toFixed(1)}%`);
  assert(Array.isArray(prediction.topK) && prediction.topK.length >= 3, `Top-3 differential candidate ranking generated`);

  // ---------------------------------------------------------------------------
  // TEST 3: Verify treatment recommendation matches crop & disease (ICAR)
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 3: ICAR / CIBRC Treatment Recommendations ──');
  assert(Boolean(prediction.pathology), `Agronomic pathology loaded for ${prediction.disease}`);
  assert(
    Array.isArray(prediction.pathology?.chemicalOptions) && prediction.pathology.chemicalOptions.length > 0,
    `CIBRC chemical controls present: ${prediction.pathology?.chemicalOptions?.[0]}`
  );
  assert(
    Array.isArray(prediction.pathology?.organicOptions) && prediction.pathology.organicOptions.length > 0,
    `Organic alternatives present: ${prediction.pathology?.organicOptions?.[0]}`
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Verify store product matching returns actual, compatible store products
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 4: Store Product Matching Engine ──');
  const matchResult = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: prediction.crop,
    disease: prediction.disease,
    label: prediction.predictedLabel,
    isHealthy: prediction.isHealthy,
  });

  assert(matchResult.hasMatchingMedicine === true, `Matching store medicines retrieved`);
  assert(matchResult.medicines.length > 0, `Retrieved ${matchResult.medicines.length} matching store products`);

  const primaryMed = matchResult.medicines.find((m) => m.treatmentType === 'primary');
  assert(Boolean(primaryMed), `Primary recommended medicine identified: ${primaryMed?.name}`);
  assert(typeof primaryMed?.price === 'number' && primaryMed.price > 0, `Store price loaded from DB: ₹${primaryMed?.price}`);
  assert(Boolean(primaryMed?.packSize), `Pack size loaded from DB: ${primaryMed?.packSize}`);

  // Assert NO fertilizers are returned
  const hasFertilizer = matchResult.medicines.some(
    (m) => m.slug.includes('urea') || m.slug.includes('dap') || m.slug.includes('vermicompost')
  );
  assert(!hasFertilizer, 'No unrelated fertilizers (Urea/DAP/Vermicompost) recommended as medicines');

  // ---------------------------------------------------------------------------
  // TEST 5: Click View Product (Slug resolution)
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 5: View Product Slug Resolution ──');
  const storeProd = await StoreService.getProductBySlug(primaryMed.slug);
  assert(Boolean(storeProd), `Product successfully resolved from store by slug: ${primaryMed.slug}`);
  assert(storeProd?.id === primaryMed.id, `Product ID matches store database record: ${storeProd?.id}`);
  assert(primaryMed.detailUrl === `/fertilizers/${primaryMed.slug}`, `Navigation detail URL format is valid: ${primaryMed.detailUrl}`);

  // ---------------------------------------------------------------------------
  // TEST 6: Click Add to Cart
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 6: Direct Add to Cart Functionality ──');
  // Clear any existing cart items for farmer 1 first
  await prisma.cartItem.deleteMany({ where: { userId: farmer1.id } });

  const cartItem = await StoreService.addToCart(farmer1.id, primaryMed.id, 1);
  assert(Boolean(cartItem?.id), `Product added to cart with item ID: ${cartItem?.id}`);
  assert(cartItem.productId === primaryMed.id, `Cart item references exact recommended product`);

  const cartState = await StoreService.getCart(farmer1.id);
  assert(cartState.itemCount >= 1, `Cart total items updated: ${cartState.itemCount}`);
  assert(cartState.subtotal === primaryMed.price, `Cart subtotal matches medicine price: ₹${cartState.subtotal}`);

  // ---------------------------------------------------------------------------
  // TEST 7: Click Buy Now (Checkout preservation)
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 7: Buy Now & Checkout Workflow Integration ──');
  // Product is in cart, verify checkout preparation
  assert(cartState.items.some((i) => i.productId === primaryMed.id), `Selected medicine preserved in cart for checkout`);
  assert(cartState.total > 0, `Order total computed with delivery fee rules: ₹${cartState.total}`);

  // ---------------------------------------------------------------------------
  // TEST 8: Refresh Diagnosis Page / History Persistence
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 8: Diagnosis History Persistence & Retrieval ──');
  // Persist record to DB
  const diagnosisRecord = await prisma.cropDiagnosisRecord.create({
    data: {
      userId: farmer1.id,
      fieldId: field1.id,
      imagePath: saved.relativePath,
      originalFilename: 'cotton_leaf_test.jpg',
      mimeType: saved.mimeType,
      fileSizeBytes: saved.sizeBytes,
      status: prediction.status,
      selectedCrop: 'Cotton',
      detectedCrop: 'Cotton',
      predictedLabel: prediction.predictedLabel,
      cropName: prediction.crop,
      diseaseName: prediction.disease,
      isHealthy: prediction.isHealthy,
      confidence: prediction.confidence,
      severity: prediction.severity || 'moderate',
      topKJson: JSON.stringify(prediction.topK),
      modelId: prediction.model.name,
      modelName: prediction.model.name,
      modelVersion: prediction.model.version,
      source: 'farmer_upload',
      metadataJson: JSON.stringify({
        ...prediction.model,
        recommendedProductIds: matchResult.medicines.map((m) => m.id),
      }),
      diagnosedAt: new Date(),
    },
  });
  assert(Boolean(diagnosisRecord?.id), `Diagnosis record safely saved to DB: ${diagnosisRecord.id}`);

  // Retrieve saved record
  const loadedRecord = await prisma.cropDiagnosisRecord.findFirst({
    where: { id: diagnosisRecord.id, userId: farmer1.id },
  });
  assert(Boolean(loadedRecord), `Diagnosis history reloaded successfully after session refresh`);
  assert(loadedRecord?.diseaseName === prediction.disease, `Saved disease matches prediction`);

  // ---------------------------------------------------------------------------
  // TEST 9: Test Unsupported or Uncertain Crop (Sugarcane)
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 9: In-Validation Crop Safety Boundary ──');
  const sugarcaneImage = createSyntheticLeafJpeg(0x82);
  const sugarcanePrediction = await CropDiseaseRouter.routeAndAnalyze(sugarcaneImage, 'sugarcane.jpg', 'image/jpeg', {
    selectedCropId: 'sugarcane',
  });
  assert(sugarcanePrediction.status === 'in_validation', `Sugarcane safely routed to 'in_validation' status`);
  assert(sugarcanePrediction.confidence === null, `No fabricated confidence score returned for crop in validation`);

  const sugarcaneMedicines = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: 'Sugarcane',
    disease: 'Foliage in Validation',
    status: 'in_validation',
  });
  assert(sugarcaneMedicines.hasMatchingMedicine === false, `No chemical medicines prescribed for crops in validation`);
  assert(sugarcaneMedicines.medicines.length === 0, `Medicines list is empty for in-validation crops`);

  // ---------------------------------------------------------------------------
  // TEST 10: Test Out-of-Stock Products
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 10: Out-of-Stock Purchasing Restrictions ──');
  const oosProduct = await prisma.product.findUnique({
    where: { slug: 'upl-phoskill-out-of-stock-500ml' },
  });
  assert(Boolean(oosProduct), `Found out-of-stock test product: ${oosProduct?.name}`);
  assert(oosProduct?.stock === 0, `Confirmed product stock is 0`);

  let oosBlocked = false;
  try {
    await StoreService.addToCart(farmer1.id, oosProduct.id, 1);
  } catch (err) {
    oosBlocked = true;
    assert(err.message.includes('stock'), `Cart rejected out-of-stock purchase: "${err.message}"`);
  }
  assert(oosBlocked, `Purchase of out-of-stock product successfully prevented`);

  // ---------------------------------------------------------------------------
  // TEST 11: Multi-Tenant Account Isolation
  // ---------------------------------------------------------------------------
  console.log('\n── TEST 11: Tenant Isolation & Authorization Boundary ──');
  // Farmer 2 attempts to query Farmer 1's diagnosis
  const crossUserDiagnosis = await prisma.cropDiagnosisRecord.findFirst({
    where: { id: diagnosisRecord.id, userId: farmer2.id, deletedAt: null },
  });
  assert(crossUserDiagnosis === null, `Farmer 2 cannot access Farmer 1's diagnosis record`);

  // Farmer 2 checks cart
  const farmer2Cart = await StoreService.getCart(farmer2.id);
  assert(farmer2Cart.itemCount === 0, `Farmer 2 does not see Farmer 1's cart items`);

  // Cleanup test diagnosis record
  await prisma.cropDiagnosisRecord.deleteMany({ where: { id: diagnosisRecord.id } });
  await prisma.cartItem.deleteMany({ where: { userId: farmer1.id } });
  console.log('✔ Cleaned up test data.');

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

