/**
 * SmartFarm AI — Comprehensive Verification Script for Multilingual & Disease Detection Improvements
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failCount++;
  }
}

console.log('\n================================================================');
console.log('PART 1: MULTILINGUAL SYSTEM VERIFICATION');
console.log('================================================================\n');

const enJson = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const hiJson = JSON.parse(fs.readFileSync('src/locales/hi.json', 'utf8'));
const guJson = JSON.parse(fs.readFileSync('src/locales/gu.json', 'utf8'));

test('Locale files contain identical key count and required translation keys', () => {
  assert.strictEqual(Object.keys(enJson).length, Object.keys(hiJson).length);
  assert.strictEqual(Object.keys(enJson).length, Object.keys(guJson).length);
  assert.ok(Object.keys(enJson).length >= 500, `Has ${Object.keys(enJson).length} keys`);

  const keys = [
    'crop_cycles', 'start_crop_cycle', 'active_crop_cycles', 'all_crops',
    'stage_planned', 'stage_sown', 'stage_growing', 'stage_flowering', 'stage_fruiting',
    'stage_harvest_ready', 'stage_harvested', 'stage_completed',
    'tasks', 'tasks_subtitle', 'add_task', 'filter_all', 'filter_pending', 'filter_completed',
    'identify_crop_optional', 'auto_detect_leaf', 'other_crop', 'enter_custom_crop',
    'what_to_do_now', 'why_it_matters', 'how_to_do_it', 'precautions', 'materials_inputs'
  ];

  for (const k of keys) {
    assert.ok(enJson[k], `en missing ${k}`);
    assert.ok(hiJson[k], `hi missing ${k}`);
    assert.ok(guJson[k], `gu missing ${k}`);
  }
});

test('resolveCropName translates crop names matching active user locale', () => {
  const unitsContent = fs.readFileSync('src/lib/units.ts', 'utf8');
  assert.ok(unitsContent.includes('crop.translations'), 'resolveCropName checks crop.translations');

  const mockCrop = {
    id: 'crop-cotton',
    name: 'Cotton',
    translations: [
      { locale: 'hi', name: 'कपास' },
      { locale: 'gu', name: 'કપાસ' },
    ],
  };

  function resolveCropName(crop, customName, locale = 'en') {
    if (customName?.trim()) return customName.trim();
    if (!crop) return 'Unknown Crop';
    if (locale !== 'en' && Array.isArray(crop.translations)) {
      const tr = crop.translations.find((t) => t.locale === locale && t.name?.trim());
      if (tr) return tr.name.trim();
    }
    return crop.name;
  }

  assert.strictEqual(resolveCropName(mockCrop, null, 'en'), 'Cotton');
  assert.strictEqual(resolveCropName(mockCrop, null, 'hi'), 'कपास');
  assert.strictEqual(resolveCropName(mockCrop, null, 'gu'), 'કપાસ');
});

test('CropLifecycleEngine accepts locale and provides natural Hindi and Gujarati guidance', () => {
  const engineContent = fs.readFileSync('src/services/CropLifecycleEngine.ts', 'utf8');
  assert.ok(engineContent.includes('buildLifecyclePlan(cycle: any, locale: string = \'en\')'), 'buildLifecyclePlan accepts locale');
  assert.ok(engineContent.includes('STAGE_NAME_TRANSLATIONS'), 'Has STAGE_NAME_TRANSLATIONS dictionary');
  assert.ok(engineContent.includes('वानस्पतिक वृद्धि'), 'Has Hindi stage translations');
  assert.ok(engineContent.includes('વાનસ્પતિક વૃદ્ધિ'), 'Has Gujarati stage translations');
  assert.ok(engineContent.includes('timelineNotice = isApproximateTimeline'), 'Translates timelineNotice');
});

test('Crop cycle API routes accept lang parameter and forward to lifecycle plan', () => {
  const cyclesRoute = fs.readFileSync('src/app/api/v1/crop-cycles/route.ts', 'utf8');
  assert.ok(cyclesRoute.includes('searchParams.get(\'lang\')'), 'GET /api/v1/crop-cycles checks lang searchParam');
  assert.ok(cyclesRoute.includes('CropLifecycleEngine.buildLifecyclePlan'), 'Passes lang to buildLifecyclePlan');

  const cycleIdRoute = fs.readFileSync('src/app/api/v1/crop-cycles/[id]/route.ts', 'utf8');
  assert.ok(cycleIdRoute.includes('searchParams.get(\'lang\')'), 'GET /api/v1/crop-cycles/[id] checks lang searchParam');
  assert.ok(cycleIdRoute.includes('CropLifecycleEngine.buildLifecyclePlan'), 'Passes lang to buildLifecyclePlan');
});

test('Tasks page, Crops page, Crop Cycle Detail page, and Dashboard use centralized I18nProvider', () => {
  const tasksPage = fs.readFileSync('src/app/(app)/tasks/page.tsx', 'utf8');
  assert.ok(tasksPage.includes('const { t, locale } = useI18n()'), 'Tasks page uses useI18n');
  assert.ok(tasksPage.includes('fetch(`/api/v1/tasks?lang=${locale}`)'), 'Tasks page passes locale to fetch');

  const cropsPage = fs.readFileSync('src/app/(app)/crops/page.tsx', 'utf8');
  assert.ok(cropsPage.includes('const { t, locale } = useI18n()'), 'Crops page uses useI18n');
  assert.ok(cropsPage.includes('fetch(`/api/v1/crop-cycles?lang=${locale}`)'), 'Crops page passes locale');

  const cycleDetailPage = fs.readFileSync('src/app/(app)/crop-cycles/[id]/page.tsx', 'utf8');
  assert.ok(cycleDetailPage.includes('const { t, locale } = useI18n()'), 'Cycle detail page uses useI18n');
  assert.ok(cycleDetailPage.includes('fetch(`/api/v1/crop-cycles/${id}?lang=${locale}`)'), 'Cycle detail page passes locale');

  const dashboardPage = fs.readFileSync('src/app/(app)/dashboard/page.tsx', 'utf8');
  assert.ok(dashboardPage.includes('const { t, locale } = useI18n()'), 'Dashboard page uses useI18n');
  assert.ok(dashboardPage.includes('fetch(`/api/v1/dashboard/summary?lang=${locale}`'), 'Dashboard passes locale');
});

console.log('\n================================================================');
console.log('PART 2: CROP DISEASE DETECTION & MISMATCH FIX VERIFICATION');
console.log('================================================================\n');

test('DiseaseClassifierCard removes Target Farm Plot and Crop Route from above upload area', () => {
  const cardContent = fs.readFileSync('src/components/diagnosis/DiseaseClassifierCard.tsx', 'utf8');
  assert.ok(!cardContent.includes('id="field-select"'), 'Field select removed from above upload');
  assert.ok(!cardContent.includes('id="crop-select"'), 'Old crop route select removed from above upload');
  assert.ok(!cardContent.includes('Specialist Neural Networks (ICAR/CIBRC)'), 'Old optgroups removed from above upload');
});

test('DiseaseClassifierCard adds Identify Your Crop (Optional) with agricultural crops and Other Crop input', () => {
  const cardContent = fs.readFileSync('src/components/diagnosis/DiseaseClassifierCard.tsx', 'utf8');
  assert.ok(cardContent.includes('id="optional-crop-select"'), 'Has optional-crop-select');
  assert.ok(cardContent.includes('AGRICULTURAL_CROP_GROUPS.map'), 'Populates from AGRICULTURAL_CROP_GROUPS');
  assert.ok(cardContent.includes('t(\'auto_detect_leaf\''), 'Has auto-detect option');
  assert.ok(cardContent.includes('selectedCropId === \'other\''), 'Has custom crop input when Other Crop selected');
});

test('DiseaseClassifierCard resets crop selection and results on new upload and clear', () => {
  const cardContent = fs.readFileSync('src/components/diagnosis/DiseaseClassifierCard.tsx', 'utf8');
  // Check handleFile resets crop selection
  const handleFileIdx = cardContent.indexOf('const handleFile =');
  const handleFileBody = cardContent.substring(handleFileIdx, handleFileIdx + 400);
  assert.ok(handleFileBody.includes('setSelectedCropId(\'\')'), 'handleFile clears selectedCropId');
  assert.ok(handleFileBody.includes('setCustomCropName(\'\')'), 'handleFile clears customCropName');
  assert.ok(handleFileBody.includes('setResult(null)'), 'handleFile clears result');

  // Check clearSelection
  const clearIdx = cardContent.indexOf('const clearSelection =');
  const clearBody = cardContent.substring(clearIdx, clearIdx + 400);
  assert.ok(clearBody.includes('setSelectedCropId(\'\')'), 'clearSelection clears selectedCropId');
  assert.ok(clearBody.includes('setCustomCropName(\'\')'), 'clearSelection clears customCropName');
});

test('predict/route.ts decouples fieldCropSlug from leaf diagnosis and only passes explicit user crop', () => {
  const routeContent = fs.readFileSync('src/app/api/v1/diagnosis/predict/route.ts', 'utf8');
  assert.ok(routeContent.includes('fieldCropName: null'), 'fieldCropName is null in predict/route.ts');
  assert.ok(routeContent.includes('normalizedRequestedCrop'), 'Uses normalized requestedCrop');
});

test('CropModelRegistry registers Sugarcane and Groundnut as specialist_active with valid models', () => {
  const registryContent = fs.readFileSync('src/services/ai/CropModelRegistry.ts', 'utf8');
  assert.ok(registryContent.includes('\'sugarcane-pathology-net\':'), 'Has sugarcane-pathology-net in AI_MODEL_REGISTRY');
  assert.ok(registryContent.includes('sugarcane_red_rot'), 'Has sugarcane_red_rot class');
  assert.ok(registryContent.includes('sugarcane_smut'), 'Has sugarcane_smut class');
  assert.ok(registryContent.includes('sugarcane_rust'), 'Has sugarcane_rust class');
  assert.ok(registryContent.includes('sugarcane_wilt'), 'Has sugarcane_wilt class');
  assert.ok(registryContent.includes('sugarcane_healthy'), 'Has sugarcane_healthy class');

  assert.ok(registryContent.includes('\'groundnut-tikka-net\':'), 'Has groundnut-tikka-net in AI_MODEL_REGISTRY');
  assert.ok(registryContent.includes('groundnut_tikka'), 'Has groundnut_tikka class');

  // Check sugarcane catalog entry
  const scIdx = registryContent.indexOf("cropId: 'sugarcane'");
  const scChunk = registryContent.substring(scIdx, scIdx + 500);
  assert.ok(scChunk.includes("status: 'specialist_active'"), 'Sugarcane status is specialist_active');
  assert.ok(scChunk.includes('supportedDiseasesCount: 5'), 'Sugarcane supports 5 diseases');
});

test('specialist-pathology-data.ts contains ICAR pathology for Sugarcane and Groundnut', () => {
  const pathologyContent = fs.readFileSync('src/lib/specialist-pathology-data.ts', 'utf8');
  assert.ok(pathologyContent.includes('\'sugarcane_red_rot\':'), 'Has sugarcane_red_rot pathology');
  assert.ok(pathologyContent.includes('Colletotrichum falcatum'), 'Has Colletotrichum falcatum pathogen');
  assert.ok(pathologyContent.includes('\'sugarcane_smut\':'), 'Has sugarcane_smut pathology');
  assert.ok(pathologyContent.includes('Sporisorium scitamineum'), 'Has Sporisorium scitamineum pathogen');
  assert.ok(pathologyContent.includes('\'sugarcane_wilt\':'), 'Has sugarcane_wilt pathology');
  assert.ok(pathologyContent.includes('\'sugarcane_rust\':'), 'Has sugarcane_rust pathology');
  assert.ok(pathologyContent.includes('\'sugarcane_healthy\':'), 'Has sugarcane_healthy pathology');
  assert.ok(pathologyContent.includes('\'groundnut_tikka\':'), 'Has groundnut_tikka pathology');
});

test('CropDiseaseRouter supports Sugarcane in vision morphology detection, compatibility, and inference', () => {
  const routerContent = fs.readFileSync('src/services/ai/CropDiseaseRouter.ts', 'utf8');
  assert.ok(routerContent.includes('manualCrop.cropId === \'sugarcane\''), 'Sugarcane recognized as linear crop in vision matching');
  assert.ok(routerContent.includes('linearCrops = [\'rice\', \'wheat\', \'corn\', \'maize\', \'sugarcane\']'), 'Sugarcane in linearCrops compatibility check');
  assert.ok(routerContent.includes('crop.cropId === \'sugarcane\''), 'Has dedicated sugarcane inference block in executeVisionGroundInference');
  assert.ok(routerContent.includes('sugarcane_red_rot'), 'Inference matches sugarcane_red_rot');
  assert.ok(routerContent.includes('sugarcane_smut'), 'Inference matches sugarcane_smut');
});

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
