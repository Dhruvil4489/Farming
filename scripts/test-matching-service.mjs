import { createJiti } from 'jiti';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename, {
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
  },
});

async function main() {
  console.log('Testing DiseaseProductMatchingService...');
  const { DiseaseProductMatchingService } = jiti('../src/services/DiseaseProductMatchingService.ts');

  // Test 1: Cotton Leaf Blight
  const r1 = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: 'Cotton',
    disease: 'Cotton Leaf Blight (Alternaria macrospora)',
    label: 'cotton_leaf_blight'
  });
  console.log('\n--- Test 1: Cotton Leaf Blight ---');
  console.log('hasMatchingMedicine:', r1.hasMatchingMedicine);
  console.log('medicines count:', r1.medicines.length);
  r1.medicines.forEach(m => {
    console.log(`  [${m.treatmentType.toUpperCase()}] ${m.name} - ₹${m.price} (${m.packSize}, Stock: ${m.stock}, InStock: ${m.inStock})`);
  });

  // Test 2: Cotton Bacterial Blight
  const r2 = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: 'Cotton',
    disease: 'Bacterial Blight / Angular Leaf Spot (Black Arm)',
    label: 'cotton_bacterial_blight'
  });
  console.log('\n--- Test 2: Cotton Bacterial Blight ---');
  console.log('hasMatchingMedicine:', r2.hasMatchingMedicine);
  console.log('medicines count:', r2.medicines.length);
  r2.medicines.forEach(m => {
    console.log(`  [${m.treatmentType.toUpperCase()}] ${m.name} - ₹${m.price} (${m.packSize})`);
  });

  // Test 3: Rice Blast
  const r3 = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: 'Rice',
    disease: 'Rice Blast (Magnaporthe oryzae)',
    label: 'rice_blast'
  });
  console.log('\n--- Test 3: Rice Blast ---');
  console.log('hasMatchingMedicine:', r3.hasMatchingMedicine);
  console.log('medicines count:', r3.medicines.length);
  r3.medicines.forEach(m => {
    console.log(`  [${m.treatmentType.toUpperCase()}] ${m.name} - ₹${m.price}`);
  });

  // Test 4: Healthy Leaf
  const r4 = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: 'Cotton',
    disease: 'Healthy Leaf',
    isHealthy: true
  });
  console.log('\n--- Test 4: Healthy Leaf ---');
  console.log('hasMatchingMedicine:', r4.hasMatchingMedicine);
  console.log('message:', r4.message);

  // Test 5: Crop In Validation (Sugarcane)
  const r5 = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
    crop: 'Sugarcane',
    disease: 'Sugarcane Foliage (Model in Validation)',
    status: 'in_validation'
  });
  console.log('\n--- Test 5: Crop In Validation ---');
  console.log('hasMatchingMedicine:', r5.hasMatchingMedicine);
  console.log('message:', r5.message);
}

main().catch(console.error);

