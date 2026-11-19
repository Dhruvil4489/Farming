/**
 * Comprehensive Verification for SmartFarm AI Field Navigation & Agricultural Crop Selection
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawDataPath = path.resolve('src/lib/agricultural-crops-data.json');
const AGRICULTURAL_CROP_GROUPS = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const PREDEFINED_CROP_NAMES = AGRICULTURAL_CROP_GROUPS.flatMap((group) =>
  group.options.map((opt) => opt.name)
);

function searchAgriculturalCrops(query, groups = AGRICULTURAL_CROP_GROUPS) {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return {
      groups: groups.map((g) => ({ ...g, options: g.options.map((o) => ({ ...o })) })),
      totalMatches: groups.reduce((acc, g) => acc + g.options.length, 0),
    };
  }

  const resultGroups = [];
  let totalMatches = 0;

  for (const group of groups) {
    const matchedOptions = [];
    for (const opt of group.options) {
      const nameLower = opt.name.toLowerCase();
      const sciLower = (opt.scientificName || '').toLowerCase();
      if (nameLower.includes(cleanQuery)) {
        matchedOptions.push({ ...opt });
        continue;
      }
      if (sciLower.includes(cleanQuery)) {
        matchedOptions.push({ ...opt, matchedAlias: opt.scientificName });
        continue;
      }
      const matchedAlias = opt.aliases.find((a) => a.toLowerCase().includes(cleanQuery));
      if (matchedAlias) {
        matchedOptions.push({ ...opt, matchedAlias });
        continue;
      }
    }
    if (matchedOptions.length > 0) {
      resultGroups.push({ group: group.group, categoryKey: group.categoryKey, options: matchedOptions });
      totalMatches += matchedOptions.length;
    }
  }
  return { groups: resultGroups, totalMatches };
}

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
  console.log('🌾 VERIFY FIELD NAVIGATION & AGRICULTURAL CROP SELECTION SYSTEM');
  console.log('================================================================\n');

  // ── Step 1: Database & Category Architecture ──
  console.log('── Step 1: Agricultural Crop Database & Categorization ──');

  report('PREDEFINED_CROP_NAMES exists and has crops', PREDEFINED_CROP_NAMES.length > 0, `${PREDEFINED_CROP_NAMES.length} crops`);

  const expectedCategories = [
    'Cereal Crops',
    'Pulse Crops',
    'Cash Crops',
    'Vegetable Crops',
    'Fruit Crops',
    'Spices and Plantation Crops',
  ];

  const actualCategories = AGRICULTURAL_CROP_GROUPS.map((g) => g.group);
  const hasAllCategories = expectedCategories.every((cat) => actualCategories.includes(cat));
  report('All 6 specified crop categories are present', hasAllCategories, actualCategories.join(', '));

  // Check required crops per category
  const expectedCrops = {
    'Cereal Crops': ['Rice', 'Wheat', 'Maize', 'Barley', 'Sorghum (Jowar)', 'Pearl Millet (Bajra)', 'Finger Millet (Ragi)', 'Oats'],
    'Pulse Crops': ['Chickpea (Chana)', 'Pigeon Pea (Tur)', 'Green Gram (Moong)', 'Black Gram (Urad)', 'Lentil (Masoor)', 'Field Pea'],
    'Cash Crops': ['Cotton', 'Sugarcane', 'Tobacco', 'Jute', 'Groundnut', 'Soybean', 'Sunflower', 'Mustard', 'Sesame'],
    'Vegetable Crops': [
      'Tomato', 'Potato', 'Onion', 'Garlic', 'Brinjal (Eggplant)', 'Cabbage', 'Cauliflower',
      'Spinach', 'Okra (Bhindi)', 'Green Chilli', 'Capsicum', 'Cucumber', 'Bottle Gourd',
      'Bitter Gourd', 'Pumpkin', 'Carrot', 'Radish',
    ],
    'Fruit Crops': [
      'Mango', 'Banana', 'Papaya', 'Guava', 'Pomegranate', 'Grapes', 'Orange', 'Lemon',
      'Watermelon', 'Muskmelon', 'Apple', 'Coconut', 'Sapota (Chikoo)',
    ],
    'Spices and Plantation Crops': [
      'Turmeric', 'Ginger', 'Coriander', 'Cumin (Jeera)', 'Fennel', 'Fenugreek (Methi)',
      'Cardamom', 'Black Pepper', 'Clove', 'Tea', 'Coffee',
    ],
  };

  let allCropsFound = true;
  for (const [catName, crops] of Object.entries(expectedCrops)) {
    const group = AGRICULTURAL_CROP_GROUPS.find((g) => g.group === catName);
    if (!group) {
      allCropsFound = false;
      report(`Category ${catName} found in database`, false);
      continue;
    }
    const groupNames = group.options.map((o) => o.name);
    const missing = crops.filter((c) => !groupNames.includes(c));
    if (missing.length > 0) {
      allCropsFound = false;
      report(`Category ${catName} has all crops`, false, `Missing: ${missing.join(', ')}`);
    } else {
      report(`Category ${catName} contains all ${crops.length} required crops`, true);
    }
  }

  // Verify generic names are completely eradicated
  const forbiddenGenericNames = [
    'Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5',
    'North Field', 'South Field', 'East Field', 'West Field',
    'Main Field', 'Farm Plot 1', 'Farm Plot 2', 'Farm Plot 3',
    'Specialized Fields', 'Numbered Fields', 'Directional Plots',
  ];

  const hasAnyGeneric = forbiddenGenericNames.some((gen) =>
    PREDEFINED_CROP_NAMES.some((crop) => crop.toLowerCase() === gen.toLowerCase())
  );
  report('No generic field names (Field 1, North Field, etc.) in predefined crop list', !hasAnyGeneric);

  // Check no duplicates in PREDEFINED_CROP_NAMES
  const uniqueCrops = new Set(PREDEFINED_CROP_NAMES.map((c) => c.toLowerCase()));
  report('No duplicate crops exist in predefined crop database', uniqueCrops.size === PREDEFINED_CROP_NAMES.length, `${uniqueCrops.size} unique crops`);

  // ── Step 2: Smart Search & Vernacular Name Verification ──
  console.log('\n── Step 2: Smart Search & Vernacular Name Matching ──');

  const englishSearchTests = [
    { query: 'Rice', expectIn: 'Rice' },
    { query: 'Wheat', expectIn: 'Wheat' },
    { query: 'Cotton', expectIn: 'Cotton' },
    { query: 'Tomato', expectIn: 'Tomato' },
    { query: 'Mango', expectIn: 'Mango' },
  ];

  for (const t of englishSearchTests) {
    const res = searchAgriculturalCrops(t.query);
    const names = res.groups.flatMap((g) => g.options.map((o) => o.name));
    report(`English search for "${t.query}" finds "${t.expectIn}"`, names.includes(t.expectIn));
  }

  const vernacularSearchTests = [
    { query: 'chana', expectIn: 'Chickpea (Chana)' },
    { query: 'jowar', expectIn: 'Sorghum (Jowar)' },
    { query: 'bajra', expectIn: 'Pearl Millet (Bajra)' },
    { query: 'ragi', expectIn: 'Finger Millet (Ragi)' },
    { query: 'arhar', expectIn: 'Pigeon Pea (Tur)' },
    { query: 'moong', expectIn: 'Green Gram (Moong)' },
    { query: 'urad', expectIn: 'Black Gram (Urad)' },
    { query: 'masoor', expectIn: 'Lentil (Masoor)' },
    { query: 'kapas', expectIn: 'Cotton' },
    { query: 'sarson', expectIn: 'Mustard' },
    { query: 'tamatar', expectIn: 'Tomato' },
    { query: 'aloo', expectIn: 'Potato' },
    { query: 'batata', expectIn: 'Potato' },
    { query: 'pyaz', expectIn: 'Onion' },
    { query: 'bhindi', expectIn: 'Okra (Bhindi)' },
    { query: 'karela', expectIn: 'Bitter Gourd' },
    { query: 'haldi', expectIn: 'Turmeric' },
    { query: 'adrak', expectIn: 'Ginger' },
    { query: 'jeera', expectIn: 'Cumin (Jeera)' },
    { query: 'methi', expectIn: 'Fenugreek (Methi)' },
    { query: 'elaichi', expectIn: 'Cardamom' },
    { query: 'chikoo', expectIn: 'Sapota (Chikoo)' },
  ];

  for (const t of vernacularSearchTests) {
    const res = searchAgriculturalCrops(t.query);
    const names = res.groups.flatMap((g) => g.options.map((o) => o.name));
    report(`Vernacular alias search "${t.query}" correctly resolves to "${t.expectIn}"`, names.includes(t.expectIn));
  }

  // ── Step 3: Component Implementation Verification ──
  console.log('\n── Step 3: UI Component Architecture Verification ──');

  const cropSelectPath = path.resolve('src/components/domain/CropNameSelect.tsx');
  const fieldSelectPath = path.resolve('src/components/domain/FieldNameSelect.tsx');
  const addFieldPagePath = path.resolve('src/app/(app)/fields/new/page.tsx');
  const fieldsPagePath = path.resolve('src/app/(app)/fields/page.tsx');

  report('CropNameSelect.tsx component exists', fs.existsSync(cropSelectPath));
  report('FieldNameSelect.tsx exists as backward compatibility layer', fs.existsSync(fieldSelectPath));

  const cropSelectSource = fs.readFileSync(cropSelectPath, 'utf8');
  report('Label defaults to "Crop Name *"', cropSelectSource.includes("label = 'Crop Name *'"));
  report('Placeholder defaults to "Search or select a crop"', cropSelectSource.includes("placeholder = 'Search or select a crop'"));
  report('Includes "Other Crop (Enter custom crop name)..." option', cropSelectSource.includes('Other Crop (Enter custom crop name)...'));
  report('Supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)',
    cropSelectSource.includes("e.key === 'ArrowDown'") &&
    cropSelectSource.includes("e.key === 'ArrowUp'") &&
    cropSelectSource.includes("e.key === 'Enter'") &&
    cropSelectSource.includes("e.key === 'Escape'")
  );
  report('Includes duplicate detection on the same farm', cropSelectSource.includes('isDuplicate'));

  const addFieldSource = fs.readFileSync(addFieldPagePath, 'utf8');
  report('fields/new/page.tsx uses <CropNameSelect>', addFieldSource.includes('<CropNameSelect'));
  report('fields/new/page.tsx has label="Crop Name *"', addFieldSource.includes('label="Crop Name *"'));
  report('fields/new/page.tsx has placeholder="Search or select a crop"', addFieldSource.includes('placeholder="Search or select a crop"'));
  report('fields/new/page.tsx does NOT prefill "Field 1" or "North Field"',
    !addFieldSource.includes("['Field 1', 'Field 2'") && !addFieldSource.includes("suggested")
  );

  const fieldsSource = fs.readFileSync(fieldsPagePath, 'utf8');
  report('fields/page.tsx Edit Field modal uses <CropNameSelect>', fieldsSource.includes('<CropNameSelect'));
  report('fields/page.tsx Edit Field modal has label="Crop Name *"', fieldsSource.includes('label="Crop Name *"'));

  // ── Step 4: Database Master Records & Field Records Verification ──
  console.log('\n── Step 4: Prisma Database Integrity & Operations ──');

  // Verify Prisma Crop table contains crops
  const dbCropCount = await prisma.crop.count();
  report(`Prisma master crop count in DB is healthy`, dbCropCount >= 64, `${dbCropCount} total crops in DB`);

  // Verify existing fields in database remain intact
  const existingFields = await prisma.field.findMany({
    select: { id: true, name: true, farmId: true, status: true },
  });
  report('Existing field records are intact in database', existingFields.length > 0, `${existingFields.length} existing fields preserved`);

  // Pick a farm to perform test operations
  const farm = await prisma.farm.findFirst({
    where: { deletedAt: null },
  });
  report('Test farm found in database', Boolean(farm), farm?.name);

  if (farm) {
    // Test creating a field with predefined crop "Rice"
    const testRiceField = await prisma.field.create({
      data: {
        farmId: farm.id,
        name: 'Rice',
        areaInputValue: 4.5,
        areaInputUnit: 'acre',
        areaHa: 1.82,
        irrigationType: 'flood',
        soilType: 'clay',
        status: 'empty',
      },
    });
    report('Created field with selected crop "Rice"', testRiceField.name === 'Rice', `ID: ${testRiceField.id}`);

    // Test creating a field with predefined crop "Cotton"
    const testCottonField = await prisma.field.create({
      data: {
        farmId: farm.id,
        name: 'Cotton',
        areaInputValue: 8.0,
        areaInputUnit: 'acre',
        areaHa: 3.24,
        irrigationType: 'drip',
        soilType: 'black',
        status: 'empty',
      },
    });
    report('Created field with selected crop "Cotton"', testCottonField.name === 'Cotton', `ID: ${testCottonField.id}`);

    // Test creating a field with "Other Crop" custom name
    const customCropName = `Organic Stevia Plot ${Date.now().toString().slice(-4)}`;
    const testCustomField = await prisma.field.create({
      data: {
        farmId: farm.id,
        name: customCropName,
        areaInputValue: 2.0,
        areaInputUnit: 'acre',
        areaHa: 0.81,
        irrigationType: 'sprinkler',
        soilType: 'loamy',
        status: 'empty',
      },
    });
    report('Created field with custom crop via "Other Crop" functionality', testCustomField.name === customCropName, testCustomField.name);

    // Test updating a field's crop to "Tomato"
    const updatedField = await prisma.field.update({
      where: { id: testCustomField.id },
      data: { name: 'Tomato' },
    });
    report('Updated field crop name to "Tomato"', updatedField.name === 'Tomato');

    // Clean up test records
    await prisma.field.deleteMany({
      where: { id: { in: [testRiceField.id, testCottonField.id, testCustomField.id] } },
    });
    report('Cleaned up verification test field records', true);
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
