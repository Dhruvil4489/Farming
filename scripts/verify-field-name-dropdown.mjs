import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function report(testName, ok, details = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${testName}${details ? ` (${details})` : ''}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName}${details ? ` (${details})` : ''}`);
  }
}

async function run() {
  console.log('================================================================');
  console.log('🌾 VERIFY CROP SELECTION SYSTEM IN FIELD NAVIGATION');
  console.log('================================================================\n');

  // 1. Static component inspection
  console.log('── Step 1: Component & Architecture Verification ──');

  const componentPath = path.resolve('src/components/domain/CropNameSelect.tsx');
  const fieldSelectPath = path.resolve('src/components/domain/FieldNameSelect.tsx');
  const addFieldPath = path.resolve('src/app/(app)/fields/new/page.tsx');
  const editFieldPath = path.resolve('src/app/(app)/fields/page.tsx');

  report('CropNameSelect component exists', fs.existsSync(componentPath));
  report('FieldNameSelect backward compatibility wrapper exists', fs.existsSync(fieldSelectPath));

  const compSource = fs.readFileSync(componentPath, 'utf8');
  const dataPath = path.resolve('src/lib/agricultural-crops-data.json');
  const cropData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const allCrops = cropData.flatMap((g) => g.options.map((o) => o.name));

  const sampleAgriculturalCrops = [
    'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane',
    'Tomato', 'Potato', 'Onion', 'Mango', 'Banana',
    'Turmeric', 'Ginger', 'Chickpea (Chana)', 'Sorghum (Jowar)'
  ];

  const hasAllSampleCrops = sampleAgriculturalCrops.every((opt) => allCrops.includes(opt));
  report('Contains genuine agricultural crops instead of generic names', hasAllSampleCrops, `${allCrops.length} total crops`);

  const hasGeneric = ['Field 1', 'North Field', 'Main Field'].some((gen) => allCrops.includes(gen));
  report('Generic field names (Field 1, North Field) are removed', !hasGeneric);

  report('Supports custom crop entry via "Other Crop..."', compSource.includes('Other Crop (Enter custom crop name)...'));
  report('Includes duplicate detection on the same farm', compSource.includes('isDuplicate'));
  report('Provides real-time search within crop options', compSource.includes('searchTerm'));

  // 2. Form usage inspection
  const addFieldSource = fs.readFileSync(addFieldPath, 'utf8');
  report(
    'src/app/(app)/fields/new/page.tsx uses <CropNameSelect> with label="Crop Name *"',
    addFieldSource.includes('<CropNameSelect') && addFieldSource.includes('label="Crop Name *"'),
  );

  const editFieldSource = fs.readFileSync(editFieldPath, 'utf8');
  report(
    'src/app/(app)/fields/page.tsx uses <CropNameSelect> in Edit Field modal',
    editFieldSource.includes('<CropNameSelect') && editFieldSource.includes('label="Crop Name *"'),
  );

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
