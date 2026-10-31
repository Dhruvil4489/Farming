/**
 * SmartFarm AI — Crop Disease Medicine Catalog Seeder
 *
 * Seeds CIBRC-registered crop protection products, fungicides, bactericides,
 * and bio-control inputs into the existing store database.
 * Reuses the existing Product, ProductCategory, and ProductBrand models.
 *
 * Usage:
 *   node scripts/seed-crop-medicines.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_CATEGORIES = [
  {
    name: 'Crop Protection & Fungicides',
    slug: 'crop-protection-fungicides',
    description: 'CIBRC-registered fungicides, bactericides, and disease control medicines for Indian field and horticultural crops.',
    icon: 'shield',
  },
  {
    name: 'Bio-Pesticides & Bio-Control',
    slug: 'bio-pesticides',
    description: 'Certified organic bio-fungicides and beneficial bacterial consortia (Trichoderma, Pseudomonas).',
    icon: 'leaf',
  },
];

const NEW_BRANDS = [
  { name: 'Syngenta India', origin: 'Switzerland / India' },
  { name: 'Bayer CropScience', origin: 'Germany / India' },
  { name: 'Dhanuka Agritech', origin: 'India' },
  { name: 'UPL Limited', origin: 'India' },
  { name: 'Rallis India (Tata Enterprise)', origin: 'India' },
  { name: 'Multiplex Bio-Tech', origin: 'India' },
  { name: 'Indofil Industries', origin: 'India' },
  { name: 'Hindustan Antibiotics', origin: 'India' },
];

const MEDICINE_PRODUCTS = [
  {
    name: 'Syngenta Amistar Top (Azoxystrobin + Difenoconazole SC)',
    slug: 'syngenta-amistar-top-200ml',
    brandName: 'Syngenta India',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'cotton,rice,tomato,chilli,maize,groundnut',
    composition: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
    packSize: '200 ml Bottle',
    price: 1150.0,
    mrp: 1320.0,
    stock: 45,
    imageUrl: '/images/products/amistar-top.png',
    isAvailable: true,
    description: 'Broad-spectrum dual-action systemic fungicide combining strobilurin (FRAC 11) and triazole (FRAC 3) chemistry with translaminar movement. Delivers superior curative and preventive protection against leaf spots and blights.',
    usageInstructions: '1.0 ml per liter of water (200 ml per acre in 200L water). Apply at the very first visual onset of leaf lesions.',
    safetyNotes: 'Mandatory Pre-Harvest Interval (PHI): 15-21 days. Wear protective nitrile gloves, eyewear, and mask. Do not spray during high pollinator activity.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Indofil M-45 (Mancozeb 75% WP)',
    slug: 'indofil-m45-mancozeb-1kg',
    brandName: 'Indofil Industries',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'cotton,wheat,rice,tomato,potato,chilli,maize,groundnut,mustard,all_crops',
    composition: 'Mancozeb 75% WP',
    packSize: '1 kg Bag',
    price: 340.0,
    mrp: 390.0,
    stock: 85,
    imageUrl: '/images/products/indofil-m45.png',
    isAvailable: true,
    description: 'Gold-standard multi-site contact protective fungicide (FRAC M03) containing 75% wettable powder Mancozeb with manganese and zinc. Prevents fungal spore germination without inducing resistance.',
    usageInstructions: '2.5 g per liter of water (500 g per acre in 200L water). Spray on both upper and lower foliage surfaces.',
    safetyNotes: 'PHI: 14 days. Avoid inhalation of powder during tank mix preparation. Wear gloves and protective mask.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Dhanuka Tilt (Propiconazole 25% EC)',
    slug: 'dhanuka-tilt-propiconazole-250ml',
    brandName: 'Dhanuka Agritech',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'wheat,cotton,rice,groundnut,soybean,maize',
    composition: 'Propiconazole 25% EC',
    packSize: '250 ml Bottle',
    price: 490.0,
    mrp: 560.0,
    stock: 60,
    imageUrl: '/images/products/tilt.png',
    isAvailable: true,
    description: 'Potent systemic triazole fungicide (FRAC 3) with protective, curative, and eradicative activity. Rapidly absorbed by plant tissue within 2 hours to halt fungal ergosterol synthesis.',
    usageInstructions: '1.0 ml per liter of water (200 ml per acre in 200L water). Repeat after 12-14 days if disease pressure persists.',
    safetyNotes: 'PHI: 25 days for wheat and rice. Wear full protective clothing and wash hands thoroughly after application.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Tata Rallis Blitox (Copper Oxychloride 50% WP)',
    slug: 'tata-rallis-blitox-500g',
    brandName: 'Rallis India (Tata Enterprise)',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'cotton,tomato,potato,chilli,rice,banana,mango,all_crops',
    composition: 'Copper Oxychloride 50% WP',
    packSize: '500 g Pack',
    price: 390.0,
    mrp: 450.0,
    stock: 70,
    imageUrl: '/images/products/blitox.png',
    isAvailable: true,
    description: 'Broad-spectrum inorganic contact copper fungicide and bactericide (FRAC M01). Released cupric ions penetrate and denature pathogen cellular proteins.',
    usageInstructions: '2.5 to 3.0 g per liter of water (500-600 g per acre in 200L water). Can be combined with Streptocycline for bacterial infections.',
    safetyNotes: 'PHI: 7-10 days. Non-phytotoxic when used at recommended dosages. Avoid spraying during extreme midday temperatures.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Streptocycline Agricultural Bactericide (60g Pack)',
    slug: 'hindustan-antibiotics-streptocycline-60g',
    brandName: 'Hindustan Antibiotics',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'cotton,rice,tomato,chilli,potato,all_crops',
    composition: 'Streptomycin Sulphate 90% + Tetracycline Hydrochloride 10% SP',
    packSize: '60 g Box (10 × 6g)',
    price: 320.0,
    mrp: 360.0,
    stock: 90,
    imageUrl: '/images/products/streptocycline.png',
    isAvailable: true,
    description: 'Official CIBRC-registered systemic antibacterial antibiotic formulation. Inhibits bacterial protein synthesis and rapidly suppresses Xanthomonas and Pseudomonas bacterial outbreaks.',
    usageInstructions: '0.1 g per liter of water (one 6g pouch per 60 liters of water). Typically tank-mixed with Copper Oxychloride 50% WP (2 g/L).',
    safetyNotes: 'Mandatory PHI: 21 days. Never exceed recommended dilution. Wear gloves and mask.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Bayer Ridomil Gold (Metalaxyl-M + Mancozeb WP)',
    slug: 'bayer-ridomil-gold-500g',
    brandName: 'Bayer CropScience',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'potato,tomato,mustard,grapes,chilli',
    composition: 'Metalaxyl-M 4% + Mancozeb 64% WP',
    packSize: '500 g Pack',
    price: 620.0,
    mrp: 710.0,
    stock: 55,
    imageUrl: '/images/products/ridomil-gold.png',
    isAvailable: true,
    description: 'Industry-standard dual systemic and contact fungicide for Oomycete pathogens. Metalaxyl-M provides acropetal translocation to protect new leaf flushes while Mancozeb forms an impenetrable outer shield.',
    usageInstructions: '2.5 g per liter of water (500 g per acre in 200L water). Apply preventively or at first blight forecasting alert.',
    safetyNotes: 'PHI: 14 days. Limit to maximum 2 consecutive sprays per season to manage resistance risk.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'UPL Saaf (Carbendazim 12% + Mancozeb 63% WP)',
    slug: 'upl-saaf-carbendazim-mancozeb-500g',
    brandName: 'UPL Limited',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'cotton,groundnut,potato,tomato,chilli,rice,soybean,chickpea',
    composition: 'Carbendazim 12% + Mancozeb 63% WP',
    packSize: '500 g Pack',
    price: 380.0,
    mrp: 430.0,
    stock: 80,
    imageUrl: '/images/products/saaf.png',
    isAvailable: true,
    description: 'Trusted broad-spectrum combination fungicide with both contact (Mancozeb) and systemic (Carbendazim) modes of action. Excellent cure for cotton grey mildew and groundnut tikka.',
    usageInstructions: '2.0 g per liter of water (400 g per acre in 200L water). Spray when white powdery or dark spots appear.',
    safetyNotes: 'PHI: 14 days. Store in cool, dry place away from foodstuffs and animal feed.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Bayer Nativo (Tebuconazole 50% + Trifloxystrobin 25% WG)',
    slug: 'bayer-nativo-tebuconazole-trifloxystrobin-100g',
    brandName: 'Bayer CropScience',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'rice,wheat,tomato,chilli,mango,groundnut',
    composition: 'Tebuconazole 50% + Trifloxystrobin 25% WG',
    packSize: '100 g Pack',
    price: 980.0,
    mrp: 1120.0,
    stock: 40,
    imageUrl: '/images/products/nativo.png',
    isAvailable: true,
    description: 'Advanced water-dispersible granule (WG) fungicide combining mesostemic action of Trifloxystrobin with high systemic mobility of Tebuconazole. Provides remarkable greening effect and disease knockdown.',
    usageInstructions: '0.8 g per liter of water (160 g per acre in 200L water). Spray at boot-leaf or flowering stage.',
    safetyNotes: 'PHI: 21 days for cereal crops. Adhere to all personal protective equipment norms.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Dhanuka Baan (Tricyclazole 75% WP)',
    slug: 'dhanuka-baan-tricyclazole-120g',
    brandName: 'Dhanuka Agritech',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'rice',
    composition: 'Tricyclazole 75% WP',
    packSize: '120 g Pack',
    price: 410.0,
    mrp: 470.0,
    stock: 65,
    imageUrl: '/images/products/baan.png',
    isAvailable: true,
    description: 'Highly specialized systemic blast fungicide. Inhibits melanin biosynthesis in appressoria of Pyricularia oryzae (Magnaporthe oryzae), halting fungal entry into the leaf epidermis.',
    usageInstructions: '0.6 g per liter of water (120 g per acre in 200L water). Spray at tillering or panicle emergence.',
    safetyNotes: 'PHI: 30 days for paddy. High selectivity for rice crops.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'UPL Shemar (Validamycin 3% L)',
    slug: 'upl-shemar-validamycin-500ml',
    brandName: 'UPL Limited',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'rice,potato,vegetables',
    composition: 'Validamycin 3% L',
    packSize: '500 ml Bottle',
    price: 350.0,
    mrp: 400.0,
    stock: 75,
    imageUrl: '/images/products/shemar.png',
    isAvailable: true,
    description: 'Fermentation-derived antibiotic fungicide. Specifically targets and inhibits trehalase enzyme in Rhizoctonia sheath blight, causing hyphal tipping and cessation of infection cushions.',
    usageInstructions: '2.0 ml per liter of water (400 ml per acre in 200L water). Direct foliar spray toward crop base.',
    safetyNotes: 'PHI: 15 days. Environmentally safe bio-antibiotic formulation.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Tata Rallis Contaf Plus (Hexaconazole 5% SC)',
    slug: 'tata-rallis-contaf-plus-hexaconazole-500ml',
    brandName: 'Rallis India (Tata Enterprise)',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'rice,wheat,chilli,groundnut,mango,grapes',
    composition: 'Hexaconazole 5% SC',
    packSize: '500 ml Bottle',
    price: 380.0,
    mrp: 440.0,
    stock: 60,
    imageUrl: '/images/products/contaf.png',
    isAvailable: true,
    description: 'Systemic triazole suspension concentrate (SC). Rapid absorption into leaf tissue provides long residual protection and prevents fungal sporulation.',
    usageInstructions: '2.0 ml per liter of water (400 ml per acre in 200L water).',
    safetyNotes: 'PHI: 20 days. Use protective eyewear and gloves during handling.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Multiplex Bio-Jodi Trichoderma Viride 1.0% WP',
    slug: 'multiplex-bio-jodi-trichoderma-viride-1kg',
    brandName: 'Multiplex Bio-Tech',
    categorySlug: 'bio-pesticides',
    cropTarget: 'cotton,wheat,rice,tomato,potato,chilli,groundnut,chickpea,mustard,sugarcane,all_crops',
    composition: 'Trichoderma viride 1.0% WP (2 × 10^6 CFU/g)',
    packSize: '1 kg Bag',
    price: 190.0,
    mrp: 230.0,
    stock: 110,
    imageUrl: '/images/products/trichoderma.png',
    isAvailable: true,
    description: 'Certified organic bio-fungicide containing living spores of Trichoderma viride. Parasitizes pathogenic fungi (mycoparasitism), secretes chitinase enzymes, and promotes root elongation.',
    usageInstructions: '5.0 g per liter of water for foliar spray; 1-2 kg per acre mixed in 100 kg farmyard manure or vermicompost for soil application.',
    safetyNotes: 'Zero PHI. Completely organic bio-input safe for humans, honeybees, and livestock.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Multiplex Bio-Cure Pseudomonas Fluorescens 0.5% WP',
    slug: 'multiplex-bio-cure-pseudomonas-fluorescens-1kg',
    brandName: 'Multiplex Bio-Tech',
    categorySlug: 'bio-pesticides',
    cropTarget: 'cotton,rice,tomato,potato,chilli,banana,ginger,all_crops',
    composition: 'Pseudomonas fluorescens 0.5% WP (1 × 10^8 CFU/g)',
    packSize: '1 kg Bag',
    price: 210.0,
    mrp: 250.0,
    stock: 95,
    imageUrl: '/images/products/pseudomonas.png',
    isAvailable: true,
    description: 'Certified organic bio-bactericide and plant growth-promoting rhizobacteria (PGPR). Secretes 2,4-diacetylphloroglucinol (DAPG) and siderophores to suppress bacterial and fungal pathogens.',
    usageInstructions: '5.0 g to 10 g per liter of water for foliar spray; seed treatment @ 10 g/kg seed.',
    safetyNotes: 'Zero PHI. Certified organic input for sustainable crop protection.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'IFFCO Sulfer (Wettable Sulphur 80% WDG)',
    slug: 'iffco-sulfer-sulphur-80-wdg-1kg',
    brandName: 'IFFCO',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'cotton,wheat,grapes,apple,mango,chilli,pulses,all_crops',
    composition: 'Sulphur 80% WDG',
    packSize: '1 kg Bag',
    price: 220.0,
    mrp: 260.0,
    stock: 90,
    imageUrl: '/images/products/sulphur-wdg.png',
    isAvailable: true,
    description: 'Micronized water-dispersible granule (WDG) delivering dual contact fungicidal and acaricidal action. Sulphur vapor acts on fungal respiratory enzymes.',
    usageInstructions: '2.5 to 3.0 g per liter of water (500-600 g per acre in 200L water).',
    safetyNotes: 'PHI: 5 days. Do not spray during extreme heat (>32°C) or in combination with oil sprays.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Syngenta Score (Difenoconazole 25% EC)',
    slug: 'syngenta-score-difenoconazole-250ml',
    brandName: 'Syngenta India',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'tomato,potato,cotton,chilli,apple,groundnut',
    composition: 'Difenoconazole 25% EC',
    packSize: '250 ml Bottle',
    price: 520.0,
    mrp: 590.0,
    stock: 50,
    imageUrl: '/images/products/score.png',
    isAvailable: true,
    description: 'Premium systemic fungicide with translaminar movement. Specifically recommended by ICAR for early blight in solanaceous crops.',
    usageInstructions: '0.5 ml per liter of water (100 ml per acre in 200L water). Spray at first sign of target spots.',
    safetyNotes: 'PHI: 14 days. High plant safety and rainfast within 2 hours.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Dhanuka Kasu-B (Kasugamycin 3% SL)',
    slug: 'dhanuka-kasu-b-kasugamycin-500ml',
    brandName: 'Dhanuka Agritech',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'rice,cotton,tomato,chilli',
    composition: 'Kasugamycin 3% SL',
    packSize: '500 ml Bottle',
    price: 460.0,
    mrp: 530.0,
    stock: 65,
    imageUrl: '/images/products/kasu-b.png',
    isAvailable: true,
    description: 'Systemic aminoglycoside bactericide and fungicide with preventative and curative action. Safe for beneficial insects.',
    usageInstructions: '2.0 ml per liter of water (400 ml per acre in 200L water).',
    safetyNotes: 'PHI: 21 days for rice and cotton.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'Bayer Antracol (Propineb 70% WP)',
    slug: 'bayer-antracol-propineb-500g',
    brandName: 'Bayer CropScience',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'potato,tomato,rice,chilli,apple,grapes',
    composition: 'Propineb 70% WP',
    packSize: '500 g Pack',
    price: 420.0,
    mrp: 480.0,
    stock: 70,
    imageUrl: '/images/products/antracol.png',
    isAvailable: true,
    description: 'Broad-spectrum contact fungicide with zinc infusion (contains 15.8% zinc). Protects foliage while delivering micronutrient zinc nutrition.',
    usageInstructions: '3.0 g per liter of water (600 g per acre in 200L water).',
    safetyNotes: 'PHI: 10-15 days. Highly rain-resistant formulation.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
  {
    name: 'UPL Phoskill (Monocrotophos 36% SL)',
    slug: 'upl-phoskill-out-of-stock-500ml',
    brandName: 'UPL Limited',
    categorySlug: 'crop-protection-fungicides',
    cropTarget: 'cotton',
    composition: 'Monocrotophos 36% SL',
    packSize: '500 ml Bottle',
    price: 310.0,
    mrp: 360.0,
    stock: 0, // OUT OF STOCK for testing purchase restrictions!
    imageUrl: '/images/products/phoskill.png',
    isAvailable: true,
    description: 'Organophosphate insecticide and acaricide for sucking pest control in cotton. Currently depleted inventory for testing out-of-stock purchasing boundaries.',
    usageInstructions: '1.5 ml per liter of water.',
    safetyNotes: 'Strict PPE mandatory. Highly restricted.',
    sellerName: 'SmartFarm Certified Agri-Input Cooperative',
    sellerLicense: 'GJ-CIBRC-AGRI-2026-921',
    isDemoProduct: true,
  },
];

async function seed() {
  console.log('🌱 Seeding Crop Disease Medicines into SmartFarm Fertilizer Store...');

  // 1. Upsert Categories
  const categoryMap = {};
  for (const cat of NEW_CATEGORIES) {
    const record = await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon },
      create: cat,
    });
    categoryMap[cat.slug] = record.id;
    console.log(`  ✔ Category: ${cat.name} (${record.id})`);
  }

  // 2. Upsert Brands
  const brandMap = {};
  for (const brand of NEW_BRANDS) {
    const record = await prisma.productBrand.upsert({
      where: { name: brand.name },
      update: { origin: brand.origin },
      create: brand,
    });
    brandMap[brand.name] = record.id;
    console.log(`  ✔ Brand: ${brand.name} (${record.id})`);
  }

  // Also resolve existing brand 'IFFCO'
  const iffco = await prisma.productBrand.findUnique({ where: { name: 'IFFCO' } });
  if (iffco) brandMap['IFFCO'] = iffco.id;

  // 3. Upsert Products
  let seededCount = 0;
  for (const item of MEDICINE_PRODUCTS) {
    const brandId = brandMap[item.brandName];
    const categoryId = categoryMap[item.categorySlug];

    if (!brandId || !categoryId) {
      console.warn(`  ⚠️ Missing brand or category for ${item.name}`);
      continue;
    }

    const { brandName, categorySlug, ...productData } = item;
    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        ...productData,
        brandId,
        categoryId,
      },
      create: {
        ...productData,
        brandId,
        categoryId,
      },
    });
    seededCount++;
    console.log(`  ✔ Seeded Medicine: ${item.name} [₹${item.price}] (Stock: ${item.stock})`);
  }

  console.log(`\n✅ Successfully seeded ${seededCount} crop disease medicines into Fertilizer Store!`);
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Error seeding medicines:', err);
  process.exit(1);
});

