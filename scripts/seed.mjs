import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SmartFarm AI database with Market, Fertilizer & Core Data...');

  // 1. Roles
  const roles = [
    { name: 'FARMER', label: 'Farmer' },
    { name: 'ADMIN', label: 'Administrator' },
    { name: 'EXPERT', label: 'Agricultural Expert' },
    { name: 'BUYER', label: 'Produce Buyer' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label },
      create: r,
    });
  }
  console.log('✔ Roles seeded');

  // 2. Admin User
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartfarm.ai' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@smartfarm.ai',
      phone: '+919876543210',
      passwordHash: adminPassword,
      preferredLanguage: 'en',
      state: 'Gujarat',
      district: 'Vadodara',
      village: 'Samiyala',
      roles: {
        create: { roleId: adminRole.id },
      },
    },
  });
  console.log('✔ Admin user created (admin@smartfarm.ai / admin123456)');

  // 3. Demo Farmer User
  const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
  const farmerPassword = await bcrypt.hash('farmer123456', 10);

  const demoFarmer = await prisma.user.upsert({
    where: { email: 'farmer@smartfarm.ai' },
    update: {},
    create: {
      name: 'Ramesh Patel',
      email: 'farmer@smartfarm.ai',
      phone: '+919876543211',
      passwordHash: farmerPassword,
      preferredLanguage: 'gu',
      state: 'Gujarat',
      district: 'Vadodara',
      village: 'Padra',
      isDemo: true,
      roles: {
        create: { roleId: farmerRole.id },
      },
    },
  });
  console.log('✔ Demo Farmer user created (farmer@smartfarm.ai / farmer123456)');

  // 4. Crops Catalog
  const cropsData = [
    {
      slug: 'wheat',
      category: 'cereal',
      seasons: JSON.stringify(['rabi']),
      typicalDurationDays: 120,
      displayColor: '#D9C3A5',
      icon: 'wheat',
      translations: [
        { locale: 'en', name: 'Wheat', description: 'Staple cereal crop grown during Rabi season.' },
        { locale: 'hi', name: 'गेहूं', description: 'रबी सीजन में उगाई जाने वाली प्रमुख खाद्यान्न फसल।' },
        { locale: 'gu', name: 'ઘઉં', description: 'રબી સીઝનમાં વવાતો મુખ્ય અનાજ પાક.' },
      ],
      stages: [
        { orderIndex: 1, code: 'land_prep', startOffsetDays: 0, durationDays: 10, nameEn: 'Land Preparation', nameHi: 'खेत की तैयारी', nameGu: 'જમીન તૈયારી' },
        { orderIndex: 2, code: 'sowing', startOffsetDays: 10, durationDays: 7, nameEn: 'Sowing & Germination', nameHi: 'बुवाई और अंकुरण', nameGu: 'વાવણી અને અંકુરણ' },
        { orderIndex: 3, code: 'crown_root', startOffsetDays: 17, durationDays: 20, nameEn: 'Crown Root Initiation', nameHi: 'मुकुट जड़ निर्माण', nameGu: 'મૂળ વિકાસ' },
        { orderIndex: 4, code: 'tillering', startOffsetDays: 37, durationDays: 25, nameEn: 'Tillering & Vegetative', nameHi: 'कल्ले निकलना', nameGu: 'ફૂટ આવવી' },
        { orderIndex: 5, code: 'flowering', startOffsetDays: 62, durationDays: 20, nameEn: 'Flowering & Heading', nameHi: 'फूल और बालियां निकलना', nameGu: 'ફૂલ અને ઉંબીઓ આવવી' },
        { orderIndex: 6, code: 'grain_filling', startOffsetDays: 82, durationDays: 25, nameEn: 'Grain Filling', nameHi: 'दाना भरना', nameGu: 'દાણા ભરાવા' },
        { orderIndex: 7, code: 'harvest', startOffsetDays: 107, durationDays: 13, nameEn: 'Maturity & Harvest', nameHi: 'कटाई', nameGu: 'કાપણી' },
      ],
    },
    {
      slug: 'cotton',
      category: 'cash_crop',
      seasons: JSON.stringify(['kharif']),
      typicalDurationDays: 160,
      displayColor: '#2F7D4F',
      icon: 'sparkles',
      translations: [
        { locale: 'en', name: 'Cotton', description: 'Major fiber cash crop.' },
        { locale: 'hi', name: 'कपास', description: 'प्रमुख नकदी रेशा फसल।' },
        { locale: 'gu', name: 'કપાસ', description: 'મુખ્ય રોકડીયો રેશા પાક.' },
      ],
      stages: [
        { orderIndex: 1, code: 'land_prep', startOffsetDays: 0, durationDays: 15, nameEn: 'Land Prep & Basal Fertilizer', nameHi: 'खेत तैयारी', nameGu: 'જમીન તૈયારી' },
        { orderIndex: 2, code: 'sowing', startOffsetDays: 15, durationDays: 10, nameEn: 'Sowing', nameHi: 'बुवाई', nameGu: 'વાવણી' },
        { orderIndex: 3, code: 'vegetative', startOffsetDays: 25, durationDays: 40, nameEn: 'Vegetative Growth', nameHi: 'वानस्पतिक वृद्धि', nameGu: 'વાનસ્પતિક વૃદ્ધિ' },
        { orderIndex: 4, code: 'square_flowering', startOffsetDays: 65, durationDays: 35, nameEn: 'Squaring & Flowering', nameHi: 'फूल और कलियाँ', nameGu: 'ચોરસ અને ફૂલ બેસવા' },
        { orderIndex: 5, code: 'boll_development', startOffsetDays: 100, durationDays: 45, nameEn: 'Boll Development', nameHi: 'घेंटे बनना', nameGu: 'ઝીંવા વિકાસ' },
        { orderIndex: 6, code: 'harvest', startOffsetDays: 145, durationDays: 15, nameEn: 'Picking / Harvest', nameHi: 'चुनाई / कटाई', nameGu: 'વીણી / કાપણી' },
      ],
    },
    {
      slug: 'groundnut',
      category: 'oilseed',
      seasons: JSON.stringify(['kharif', 'summer']),
      typicalDurationDays: 110,
      displayColor: '#D97706',
      icon: 'nut',
      translations: [
        { locale: 'en', name: 'Groundnut', description: 'Important oilseed crop predominantly grown in Saurashtra, Gujarat.' },
        { locale: 'hi', name: 'मूंगफली', description: 'महत्वपूर्ण तिलहन फसल।' },
        { locale: 'gu', name: 'મગફળી', description: 'સૌરાષ્ટ્ર અને ગુજરાતનો મુખ્ય તેલીબિયાં પાક.' },
      ],
      stages: [
        { orderIndex: 1, code: 'sowing', startOffsetDays: 0, durationDays: 15, nameEn: 'Sowing & Germination', nameHi: 'बुवाई और अंकुरण', nameGu: 'વાવણી અને અંકુરણ' },
        { orderIndex: 2, code: 'vegetative', startOffsetDays: 15, durationDays: 25, nameEn: 'Vegetative Growth', nameHi: 'वानस्पतिक वृद्धि', nameGu: 'વાનસ્પતિક વૃદ્ધિ' },
        { orderIndex: 3, code: 'pegging', startOffsetDays: 40, durationDays: 30, nameEn: 'Flowering & Pegging', nameHi: 'सुइयां बनना (पेगिंग)', nameGu: 'સૂયા બેસવા' },
        { orderIndex: 4, code: 'pod_filling', startOffsetDays: 70, durationDays: 25, nameEn: 'Pod Development', nameHi: 'फली विकास', nameGu: 'ડોડવા ભરાવા' },
        { orderIndex: 5, code: 'harvest', startOffsetDays: 95, durationDays: 15, nameEn: 'Harvesting', nameHi: 'कटाई', nameGu: 'કાપણી' },
      ],
    },
  ];

  for (const cropData of cropsData) {
    const crop = await prisma.crop.upsert({
      where: { slug: cropData.slug },
      update: {},
      create: {
        slug: cropData.slug,
        category: cropData.category,
        seasons: cropData.seasons,
        typicalDurationDays: cropData.typicalDurationDays,
        displayColor: cropData.displayColor,
        icon: cropData.icon,
      },
    });

    for (const t of cropData.translations) {
      await prisma.cropTranslation.upsert({
        where: { cropId_locale: { cropId: crop.id, locale: t.locale } },
        update: { name: t.name, description: t.description },
        create: { cropId: crop.id, locale: t.locale, name: t.name, description: t.description },
      });
    }

    for (const st of cropData.stages) {
      const stage = await prisma.cropStage.upsert({
        where: { cropId_orderIndex: { cropId: crop.id, orderIndex: st.orderIndex } },
        update: { code: st.code, startOffsetDays: st.startOffsetDays, durationDays: st.durationDays },
        create: {
          cropId: crop.id,
          orderIndex: st.orderIndex,
          code: st.code,
          startOffsetDays: st.startOffsetDays,
          durationDays: st.durationDays,
        },
      });

      const stageTrans = [
        { locale: 'en', name: st.nameEn },
        { locale: 'hi', name: st.nameHi },
        { locale: 'gu', name: st.nameGu },
      ];

      for (const str of stageTrans) {
        await prisma.cropStageTranslation.upsert({
          where: { stageId_locale: { stageId: stage.id, locale: str.locale } },
          update: { name: str.name },
          create: { stageId: stage.id, locale: str.locale, name: str.name },
        });
      }
    }
  }
  console.log('✔ Crops & Stage templates seeded');

  // 5. Demo Farm & Field for Ramesh Patel
  const existingFarm = await prisma.farm.findFirst({ where: { userId: demoFarmer.id } });
  let demoFarm = existingFarm;
  if (!existingFarm) {
    demoFarm = await prisma.farm.create({
      data: {
        userId: demoFarmer.id,
        name: 'Patel Organic Farm',
        village: 'Padra',
        district: 'Vadodara',
        state: 'Gujarat',
        lat: 22.2405,
        lng: 73.0848,
        totalAreaHa: 2.5,
        areaInputValue: 6.17,
        areaInputUnit: 'acre',
        farmType: 'irrigated',
        waterSources: JSON.stringify(['borewell', 'canal']),
        notes: 'Main agricultural farm plot with tube well irrigation.',
      },
    });

    const demoField = await prisma.field.create({
      data: {
        farmId: demoFarm.id,
        name: 'North Field (Cotton Plot)',
        areaHa: 1.2,
        irrigationType: 'drip',
        soilType: 'black',
        status: 'active',
      },
    });

    const cottonCrop = await prisma.crop.findUnique({ where: { slug: 'cotton' } });
    if (cottonCrop) {
      const cycle = await prisma.cropCycle.create({
        data: {
          fieldId: demoField.id,
          cropId: cottonCrop.id,
          sowingDate: new Date(),
          status: 'growing',
          areaHa: 1.2,
        },
      });

      await prisma.task.create({
        data: {
          userId: demoFarmer.id,
          farmId: demoFarm.id,
          fieldId: demoField.id,
          cropCycleId: cycle.id,
          type: 'irrigation',
          title: 'Check drip irrigation lines for blockages',
          description: 'Perform routine check on main drip emitter valves in North Field.',
          priority: 'high',
          dueAt: new Date(),
          status: 'pending',
          source: 'suggested',
        },
      });
    }
  }

  // 6. Live Mandi / Market Intelligence Seeding
  console.log('Seeding Live Mandi Locations & Commodities...');
  const locationsData = [
    { name: 'Rajkot APMC', state: 'Gujarat', district: 'Rajkot', lat: 22.3039, lng: 70.8022 },
    { name: 'Gondal APMC', state: 'Gujarat', district: 'Rajkot', lat: 21.9619, lng: 70.7938 },
    { name: 'Unjha APMC', state: 'Gujarat', district: 'Mehsana', lat: 23.8043, lng: 72.3923 },
    { name: 'Amreli APMC', state: 'Gujarat', district: 'Amreli', lat: 21.6032, lng: 71.2221 },
    { name: 'Surat APMC', state: 'Gujarat', district: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Mahuva APMC', state: 'Gujarat', district: 'Bhavnagar', lat: 21.0914, lng: 71.7618 },
    { name: 'Dahod APMC', state: 'Gujarat', district: 'Dahod', lat: 22.8344, lng: 74.2546 },
    { name: 'Indore Mandi', state: 'Madhya Pradesh', district: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Lasalgaon Mandi', state: 'Maharashtra', district: 'Nashik', lat: 20.1472, lng: 74.2274 },
    { name: 'Khanna Mandi', state: 'Punjab', district: 'Ludhiana', lat: 30.7046, lng: 76.2167 },
  ];

  const locationsMap = {};
  for (const loc of locationsData) {
    const record = await prisma.marketLocation.upsert({
      where: { name_state_district: { name: loc.name, state: loc.state, district: loc.district } },
      update: { lat: loc.lat, lng: loc.lng },
      create: loc,
    });
    locationsMap[`${loc.name}-${loc.district}`] = record.id;
  }

  const commoditiesData = [
    { name: 'Cotton', variety: 'Shankar-6', cropSlug: 'cotton', category: 'Fiber' },
    { name: 'Wheat', variety: 'Lokwan', cropSlug: 'wheat', category: 'Cereal' },
    { name: 'Groundnut', variety: 'GG-20 (Bold)', cropSlug: 'groundnut', category: 'Oilseed' },
    { name: 'Cumin (Jeera)', variety: 'Unjha Special', cropSlug: null, category: 'Spice' },
    { name: 'Mustard', variety: 'Varuna', cropSlug: null, category: 'Oilseed' },
    { name: 'Castor Seed', variety: 'GCH-7', cropSlug: null, category: 'Oilseed' },
    { name: 'Soybean', variety: 'JS-335', cropSlug: null, category: 'Oilseed' },
    { name: 'Onion', variety: 'Red Medium', cropSlug: null, category: 'Vegetable' },
    { name: 'Potato', variety: 'Kufri Pukhraj', cropSlug: null, category: 'Vegetable' },
    { name: 'Tomato', variety: 'Hybrid Desi', cropSlug: null, category: 'Vegetable' },
    { name: 'Gram (Chana)', variety: 'Desi Chana', cropSlug: null, category: 'Pulse' },
  ];

  const commoditiesMap = {};
  for (const cmd of commoditiesData) {
    const record = await prisma.marketCommodity.upsert({
      where: { name_variety: { name: cmd.name, variety: cmd.variety } },
      update: { category: cmd.category, cropSlug: cmd.cropSlug },
      create: cmd,
    });
    commoditiesMap[`${cmd.name}-${cmd.variety}`] = record.id;
  }

  // Generate today (Oct 11, 2026) and yesterday (Oct 10, 2026) trading observations, plus historical 7-30 days
  const today = new Date('2026-10-11T05:30:00Z');
  const yesterday = new Date('2026-10-10T05:30:00Z');

  const priceMatrix = [
    {
      loc: 'Rajkot APMC-Rajkot',
      cmd: 'Cotton-Shankar-6',
      today: { min: 7100, max: 7780, modal: 7520 },
      yesterday: { min: 7000, max: 7650, modal: 7410 },
      history: [7250, 7300, 7350, 7380, 7400, 7410, 7520],
    },
    {
      loc: 'Gondal APMC-Rajkot',
      cmd: 'Cotton-Shankar-6',
      today: { min: 7150, max: 7820, modal: 7560 },
      yesterday: { min: 7050, max: 7700, modal: 7480 },
      history: [7300, 7340, 7400, 7420, 7450, 7480, 7560],
    },
    {
      loc: 'Rajkot APMC-Rajkot',
      cmd: 'Groundnut-GG-20 (Bold)',
      today: { min: 5900, max: 6650, modal: 6320 },
      yesterday: { min: 5850, max: 6500, modal: 6220 },
      history: [6100, 6150, 6180, 6200, 6210, 6220, 6320],
    },
    {
      loc: 'Gondal APMC-Rajkot',
      cmd: 'Groundnut-GG-20 (Bold)',
      today: { min: 5950, max: 6700, modal: 6380 },
      yesterday: { min: 5900, max: 6600, modal: 6290 },
      history: [6120, 6180, 6220, 6250, 6270, 6290, 6380],
    },
    {
      loc: 'Unjha APMC-Mehsana',
      cmd: 'Cumin (Jeera)-Unjha Special',
      today: { min: 23500, max: 26800, modal: 25200 },
      yesterday: { min: 23000, max: 26400, modal: 24800 },
      history: [24100, 24300, 24500, 24650, 24700, 24800, 25200],
    },
    {
      loc: 'Surat APMC-Surat',
      cmd: 'Wheat-Lokwan',
      today: { min: 2650, max: 2980, modal: 2840 },
      yesterday: { min: 2680, max: 3020, modal: 2870 },
      history: [2890, 2880, 2890, 2880, 2860, 2870, 2840],
    },
    {
      loc: 'Dahod APMC-Dahod',
      cmd: 'Wheat-Lokwan',
      today: { min: 2550, max: 2860, modal: 2740 },
      yesterday: { min: 2520, max: 2820, modal: 2710 },
      history: [2650, 2680, 2700, 2710, 2690, 2710, 2740],
    },
    {
      loc: 'Mahuva APMC-Bhavnagar',
      cmd: 'Onion-Red Medium',
      today: { min: 1450, max: 2300, modal: 1920 },
      yesterday: { min: 1400, max: 2200, modal: 1850 },
      history: [1720, 1750, 1780, 1820, 1830, 1850, 1920],
    },
    {
      loc: 'Lasalgaon Mandi-Nashik',
      cmd: 'Onion-Red Medium',
      today: { min: 1550, max: 2450, modal: 2050 },
      yesterday: { min: 1500, max: 2380, modal: 1980 },
      history: [1800, 1850, 1900, 1920, 1950, 1980, 2050],
    },
    {
      loc: 'Indore Mandi-Indore',
      cmd: 'Soybean-JS-335',
      today: { min: 4200, max: 4850, modal: 4580 },
      yesterday: { min: 4150, max: 4780, modal: 4510 },
      history: [4420, 4450, 4480, 4500, 4520, 4510, 4580],
    },
    {
      loc: 'Khanna Mandi-Ludhiana',
      cmd: 'Wheat-Lokwan',
      today: { min: 2450, max: 2680, modal: 2580 },
      yesterday: { min: 2440, max: 2660, modal: 2570 },
      history: [2520, 2530, 2540, 2550, 2560, 2570, 2580],
    },
    {
      loc: 'Amreli APMC-Amreli',
      cmd: 'Gram (Chana)-Desi Chana',
      today: { min: 5300, max: 5950, modal: 5680 },
      yesterday: { min: 5250, max: 5900, modal: 5620 },
      history: [5450, 5500, 5550, 5580, 5600, 5620, 5680],
    },
  ];

  for (const item of priceMatrix) {
    const locationId = locationsMap[item.loc];
    const commodityId = commoditiesMap[item.cmd];
    if (!locationId || !commodityId) continue;

    // Today observation
    await prisma.marketPriceObservation.upsert({
      where: {
        locationId_commodityId_priceDate_source_grade: {
          locationId,
          commodityId,
          priceDate: today,
          source: 'Demo — AGMARKNET Reference',
          grade: '',
        },
      },
      update: {
        minPrice: item.today.min,
        maxPrice: item.today.max,
        modalPrice: item.today.modal,
      },
      create: {
        locationId,
        commodityId,
        grade: '',
        priceDate: today,
        minPrice: item.today.min,
        maxPrice: item.today.max,
        modalPrice: item.today.modal,
        unit: '₹/Quintal',
        source: 'Demo — AGMARKNET Reference',
        isDemo: true,
        qualityStatus: 'ok',
      },
    });

    // Yesterday observation
    await prisma.marketPriceObservation.upsert({
      where: {
        locationId_commodityId_priceDate_source_grade: {
          locationId,
          commodityId,
          priceDate: yesterday,
          source: 'Demo — AGMARKNET Reference',
          grade: '',
        },
      },
      update: {
        minPrice: item.yesterday.min,
        maxPrice: item.yesterday.max,
        modalPrice: item.yesterday.modal,
      },
      create: {
        locationId,
        commodityId,
        grade: '',
        priceDate: yesterday,
        minPrice: item.yesterday.min,
        maxPrice: item.yesterday.max,
        modalPrice: item.yesterday.modal,
        unit: '₹/Quintal',
        source: 'Demo — AGMARKNET Reference',
        isDemo: true,
        qualityStatus: 'ok',
      },
    });

    // Historical records for 7-day trend
    for (let dayIdx = 0; dayIdx < item.history.length; dayIdx++) {
      const histDate = new Date(today);
      histDate.setDate(today.getDate() - (6 - dayIdx));
      const histPrice = item.history[dayIdx];
      await prisma.marketPriceObservation.upsert({
        where: {
          locationId_commodityId_priceDate_source_grade: {
            locationId,
            commodityId,
            priceDate: histDate,
            source: 'Demo — AGMARKNET Reference',
            grade: '',
          },
        },
        update: { modalPrice: histPrice },
        create: {
          locationId,
          commodityId,
          grade: '',
          priceDate: histDate,
          minPrice: histPrice - 200,
          maxPrice: histPrice + 250,
          modalPrice: histPrice,
          unit: '₹/Quintal',
          source: 'Demo — AGMARKNET Reference',
          isDemo: true,
          qualityStatus: 'ok',
        },
      });
    }
  }
  console.log('✔ Live Mandi observations & historical records seeded');

  // 7. Fertilizer Knowledge Center Seeding
  console.log('Seeding Fertilizer Knowledge Center...');
  const fertCats = [
    {
      name: 'Urea (Neem Coated)',
      slug: 'urea',
      nutrientProfile: '46% Nitrogen (N)',
      description: 'The primary source of concentrated solid nitrogen in Indian agriculture. Neem coating slows nitrification, significantly reducing ammonia volatilization and nitrate leaching.',
      applicationRole: 'Rapid vegetative growth, lush green foliage synthesis, protein formation',
      precautions: 'Do not apply in excessive doses; avoid applying on waterlogged soils without drainage; split applications into 2-3 intervals to avoid burning and lodging.',
    },
    {
      name: 'DAP (Di-Ammonium Phosphate)',
      slug: 'dap',
      nutrientProfile: '18% Nitrogen (N), 46% Phosphorus (P2O5)',
      description: 'High-analysis phosphorus fertilizer that delivers readily available water-soluble phosphate for early root development alongside initial starter nitrogen.',
      applicationRole: 'Strong seedling root proliferation, tillering vigor, early crop establishment',
      precautions: 'Always apply at or below seed depth (basal placement). Never broadcast on surface; avoid direct seed contact to prevent ammonia seed toxicity.',
    },
    {
      name: 'SSP (Single Super Phosphate)',
      slug: 'ssp',
      nutrientProfile: '16% P2O5, 11% Sulphur (S), 19% Calcium (Ca)',
      description: 'Ideal phosphatic fertilizer for oilseeds and pulses due to high elemental sulphur and calcium content, enhancing oil synthesis and nodule formation.',
      applicationRole: 'Oil percentage enhancement in groundnut & mustard, root nodulation in pulses',
      precautions: 'Apply at sowing time; keep stored away from excessive moisture as SSP can cake easily.',
    },
    {
      name: 'MOP (Muriate of Potash / KCl)',
      slug: 'mop',
      nutrientProfile: '60% Potash (K2O)',
      description: 'The standard potassium fertilizer essential for water regulation, enzymatic activation, resistance against pests/drought, and grain filling.',
      applicationRole: 'Drought tolerance, disease resilience, sturdy stalk formation, plump grain filling',
      precautions: 'Avoid in chloride-sensitive crops (like tobacco and high-salinity orchards); incorporate thoroughly during basal or first top-dress.',
    },
    {
      name: 'NPK Complex (10:26:26)',
      slug: 'npk-10-26-26',
      nutrientProfile: '10% N, 26% P2O5, 26% K2O',
      description: 'Balanced compound fertilizer packed with high phosphorus and potash, particularly recommended for cotton, sugarcane, and potato.',
      applicationRole: 'Balanced nutrition promoting deep rooting, pest resistance, and fruit/boll sizing',
      precautions: 'Ensure proper soil moisture before and after application to maximize uptake.',
    },
    {
      name: 'Water Soluble NPK (19:19:19)',
      slug: 'npk-19-19-19',
      nutrientProfile: '19% N, 19% P, 19% K (100% Water Soluble)',
      description: 'Premium grade foliar and drip fertigation formula providing immediate plant-absorbable primary nutrients without soil fixation.',
      applicationRole: 'Instant vegetative pick-up, recovery after biotic stress, foliar correction',
      precautions: 'Use during early morning or late afternoon foliar spray; do not spray during harsh midday sun.',
    },
    {
      name: 'Zinc Sulphate Micronutrient (33% Zn)',
      slug: 'zinc-sulphate',
      nutrientProfile: '33% Zinc (Zn), 15% Sulphur (S)',
      description: 'Crucial micronutrient addressing widespread zinc deficiency in Indian alkaline and calcareous soils (especially Gujarat and Gangetic plains).',
      applicationRole: 'Chlorophyll synthesis, auxin auxin hormone activation, preventing "Khaira" disease in rice and leaf mottling',
      precautions: 'CRITICAL: Never mix zinc sulphate directly with DAP or water-soluble phosphate fertilizers, as insoluble zinc phosphate will precipitate out.',
    },
    {
      name: 'Enriched Organic Vermicompost',
      slug: 'vermicompost',
      nutrientProfile: '1.5-2.0% N, 1.0% P, 1.5% K + Beneficial Microflora',
      description: 'Aerobic earthworm castings rich in humic acids, beneficial soil microbes, and slow-release micronutrients that improve soil water holding capacity.',
      applicationRole: 'Soil structure improvement, microbial biomass activation, long-term fertility',
      precautions: 'Apply 1-2 tonnes per acre during summer ploughing / land preparation; maintain adequate moisture for biological activity.',
    },
  ];

  const catMap = {};
  for (const cat of fertCats) {
    const record = await prisma.fertilizerCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    catMap[cat.slug] = record.id;
  }

  // Crop-Wise Fertilizer Guidance
  const guidanceData = [
    {
      cropSlug: 'wheat',
      cropName: 'Wheat',
      state: 'Gujarat & Western India',
      cropStage: 'Basal / Land Preparation',
      nutrientRequirement: 'N: 60 kg, P2O5: 60 kg, K2O: 40 kg per ha',
      fertilizerCategoryId: catMap['dap'],
      recommendedTiming: 'At sowing time (placed 4-5 cm below seed)',
      applicationMethod: 'Deep soil placement via ferti-seed drill',
      guidanceText: 'Apply full dose of Phosphorus (DAP/SSP) and Potash (MOP) alongside 1/3rd of total Nitrogen requirement at the time of sowing. Deep placement ensures the young crown roots can tap nutrients without surface volatilization.',
      whyItMatters: 'Phosphorus is immobile in soil and directly fuels rapid initial embryonic root elongation and crown node anchoring.',
      importantPrecautions: 'Do not broadcast DAP on the soil surface; verify soil test report for available P prior to application to avoid luxury consumption.',
      sourceAuthority: 'Anand Agricultural University (AAU) / ICAR Directorate of Wheat Research',
      sourceUrl: 'https://aau.in',
    },
    {
      cropSlug: 'wheat',
      cropName: 'Wheat',
      state: 'Gujarat & Western India',
      cropStage: 'Crown Root Initiation (CRI - 21 Days)',
      nutrientRequirement: 'Nitrogen (N) 30 kg/ha',
      fertilizerCategoryId: catMap['urea'],
      recommendedTiming: '21 to 25 days after sowing, just prior to first irrigation',
      applicationMethod: 'Broadcasting uniform granules followed immediately by light irrigation',
      guidanceText: 'Top-dress 1/3rd of the remaining Nitrogen as Neem Coated Urea at the critical CRI stage. Irrigate the field promptly after application to incorporate urea into the root zone.',
      whyItMatters: 'Crown roots formed during this stage determine the total number of effective tillers per plant and final spike density.',
      importantPrecautions: 'Avoid applying urea in standing water pools; broadcast on moist soil before turning on irrigation.',
      sourceAuthority: 'ICAR-IIWBR Karnal / Anand Agricultural University',
      sourceUrl: 'https://iiwbr.icar.gov.in',
    },
    {
      cropSlug: 'cotton',
      cropName: 'Cotton (Bt Hybrid)',
      state: 'Gujarat (Saurashtra & Central)',
      cropStage: 'Land Preparation & Basal',
      nutrientRequirement: 'N: 40 kg, P2O5: 50 kg, K2O: 50 kg per ha',
      fertilizerCategoryId: catMap['npk-10-26-26'],
      recommendedTiming: 'At planting row preparation',
      applicationMethod: 'Band placement 7-10 cm away from seed row',
      guidanceText: 'Apply 10:26:26 complex or DAP + MOP along with 10 tonnes of FYM/Vermicompost per hectare. In Gujarat black soils, band placement prevents phosphorus fixation in alkaline calcium compounds.',
      whyItMatters: 'Bt cotton exhibits heavy early nutrient demand to sustain both vegetative branches and early sympodial fruiting branches.',
      importantPrecautions: 'Ensure soil moisture is sufficient; if soil zinc is below 0.6 ppm, apply Zinc Sulphate 25 kg/ha separately as basal.',
      sourceAuthority: 'Junagadh Agricultural University (JAU) & ICAR-CICR Nagpur',
      sourceUrl: 'https://jau.in',
    },
    {
      cropSlug: 'cotton',
      cropName: 'Cotton (Bt Hybrid)',
      state: 'Gujarat (Saurashtra & Central)',
      cropStage: 'Squaring & Flowering (60-75 Days)',
      nutrientRequirement: 'Nitrogen (N) 50 kg, Potash 25 kg + Foliar Boron',
      fertilizerCategoryId: catMap['urea'],
      recommendedTiming: '60 to 75 days after sowing during square emergence',
      applicationMethod: 'Split side-dressing in root zone followed by irrigation',
      guidanceText: 'Apply second split of Urea. Spray 1% 19:19:19 or 0.2% Boron (Solubor) if square drop is observed due to overcast or cloudy monsoon conditions.',
      whyItMatters: 'Square and boll formation is the peak sink period; nutrient starvation now results in premature square shedding and lower ginning percentage.',
      importantPrecautions: 'Do not over-apply nitrogen, which causes excessive vegetative lushness attractive to sucking pests like jassids and whiteflies.',
      sourceAuthority: 'Navsari Agricultural University (NAU) / ICAR-CICR',
      sourceUrl: 'https://nau.in',
    },
    {
      cropSlug: 'groundnut',
      cropName: 'Groundnut (Kharif/Summer)',
      state: 'Gujarat (Saurashtra)',
      cropStage: 'Land Preparation & Basal Sowing',
      nutrientRequirement: 'N: 25 kg, P2O5: 50 kg, Sulphur: 20 kg per ha',
      fertilizerCategoryId: catMap['ssp'],
      recommendedTiming: 'At last ploughing before furrow making',
      applicationMethod: 'Soil broadcast and shallow harrowing incorporation',
      guidanceText: 'Single Super Phosphate (SSP) is preferred over DAP for groundnut because it naturally supplies 11% elemental Sulphur and 19% Calcium, which are vital for gynophore (peg) development and kernel oil accumulation.',
      whyItMatters: 'Groundnut is a legume that fixes its own atmospheric nitrogen once nodules form; high phosphorus and sulphur are its true yield limiting nutrients.',
      importantPrecautions: 'Avoid heavy nitrogen basal applications, which suppress native Rhizobium nodule formation on the root tap system.',
      sourceAuthority: 'ICAR-Directorate of Groundnut Research (DGR) Junagadh',
      sourceUrl: 'https://dgr.icar.gov.in',
    },
    {
      cropSlug: 'groundnut',
      cropName: 'Groundnut (Kharif/Summer)',
      state: 'Gujarat (Saurashtra)',
      cropStage: 'Pegging to Pod Formation (40-50 Days)',
      nutrientRequirement: 'Calcium (Ca) as Gypsum 250 kg/ha',
      fertilizerCategoryId: null,
      recommendedTiming: '40 to 45 days after sowing during peg entry into soil',
      applicationMethod: 'Band application along the crop rows followed by light earthing up',
      guidanceText: 'Apply agricultural gypsum (250 kg/ha) near the root zone. Calcium is directly absorbed by the developing subterranean pods rather than through the plant roots.',
      whyItMatters: 'Calcium deficiency leads to "pops" (empty shells with missing kernels) and blackened plumules.',
      importantPrecautions: 'Apply gypsum only when soil is sufficiently moist; avoid disturbing entering pegs during weeding.',
      sourceAuthority: 'Junagadh Agricultural University (JAU)',
      sourceUrl: 'https://jau.in',
    },
  ];

  for (const g of guidanceData) {
    const existing = await prisma.cropFertilizerGuidance.findFirst({
      where: { cropSlug: g.cropSlug, cropStage: g.cropStage },
    });
    if (existing) {
      await prisma.cropFertilizerGuidance.update({
        where: { id: existing.id },
        data: g,
      });
    } else {
      await prisma.cropFertilizerGuidance.create({
        data: g,
      });
    }
  }
  console.log('✔ Fertilizer Guidance Center seeded with verified ICAR/SAU recommendations');

  // 8. Fertilizer E-Commerce Store Seeding
  console.log('Seeding Fertilizer E-Commerce Catalog...');
  const brandNames = [
    { name: 'IFFCO', origin: 'India (Cooperative)' },
    { name: 'GSFC (Gujarat State Fertilizers)', origin: 'Vadodara, Gujarat' },
    { name: 'GNFC (Gujarat Narmada Valley)', origin: 'Bharuch, Gujarat' },
    { name: 'KRIBHCO', origin: 'Surat, Gujarat' },
    { name: 'Tata Paras (Tata Chemicals)', origin: 'India' },
    { name: 'Coromandel Gromor', origin: 'India' },
  ];

  const brandMap = {};
  for (const b of brandNames) {
    const brand = await prisma.productBrand.upsert({
      where: { name: b.name },
      update: { origin: b.origin },
      create: b,
    });
    brandMap[b.name] = brand.id;
  }

  const prodCategories = [
    { name: 'Chemical Fertilizers', slug: 'chemical-fertilizers', description: 'Govt-subsidized and regulated macro nutrient fertilizers for main field crops.', icon: 'sprout' },
    { name: 'Water-Soluble & Foliar', slug: 'water-soluble', description: '100% soluble fertigation formulas for drip systems and foliar sprays.', icon: 'droplet' },
    { name: 'Organic & Bio-Fertilizers', slug: 'organic-bio', description: 'Earthworm compost, mycorrhiza, and bacterial consortia for living soil health.', icon: 'leaf' },
    { name: 'Micronutrients & Promoters', slug: 'micronutrients', description: 'Zinc, Boron, Magnesium and bio-stimulants for targeted crop deficiencies.', icon: 'sparkles' },
  ];

  const prodCatMap = {};
  for (const pc of prodCategories) {
    const pCat = await prisma.productCategory.upsert({
      where: { slug: pc.slug },
      update: pc,
      create: pc,
    });
    prodCatMap[pc.slug] = pCat.id;
  }

  const productsData = [
    {
      name: 'IFFCO Neem Coated Urea 46% N',
      slug: 'iffco-neem-coated-urea-45kg',
      brandId: brandMap['IFFCO'],
      categoryId: prodCatMap['chemical-fertilizers'],
      cropTarget: 'wheat,cotton,rice,maize',
      description: 'Official Government of India subsidized Neem Coated Urea. Specially treated with natural neem oil to slow nitrification, enhance nitrogen uptake efficiency by 15-20%, and reduce greenhouse emissions.',
      composition: '46% Total Ammoniacal & Amide Nitrogen',
      packSize: '45 kg Bag',
      price: 266.50,
      mrp: 266.50,
      stock: 120,
      imageUrl: '/images/products/urea-45kg.jpg',
      isAvailable: true,
      usageInstructions: 'Split into basal and CRI/tillering stages. Broadcast on moist field followed by light irrigation.',
      safetyNotes: 'Keep in dry covered warehouse away from livestock and children.',
      sellerName: 'SmartFarm Certified Agri-Input Cooperative',
      sellerLicense: 'IN-GJ-AGRI-COOP-2026-88',
      isDemoProduct: true,
    },
    {
      name: 'GSFC Sardar DAP (18:46:0)',
      slug: 'gsfc-sardar-dap-50kg',
      brandId: brandMap['GSFC (Gujarat State Fertilizers)'],
      categoryId: prodCatMap['chemical-fertilizers'],
      cropTarget: 'wheat,cotton,groundnut,mustard',
      description: 'Manufactured by Gujarat State Fertilizers & Chemicals in Vadodara. The gold standard phosphatic fertilizer delivering 46% P2O5 and 18% starter nitrogen in hard uniform granules.',
      composition: '18% Nitrogen, 46% Phosphorus Pentoxide (P2O5)',
      packSize: '50 kg Bag',
      price: 1350.00,
      mrp: 1350.00,
      stock: 85,
      imageUrl: '/images/products/dap-50kg.jpg',
      isAvailable: true,
      usageInstructions: 'Basal application at sowing depth using seed-cum-fertilizer drill.',
      safetyNotes: 'Wear gloves during handling; avoid inhalation of dust.',
      sellerName: 'SmartFarm Certified Agri-Input Cooperative',
      sellerLicense: 'IN-GJ-AGRI-COOP-2026-88',
      isDemoProduct: true,
    },
    {
      name: 'GSFC Sardar NPK (10:26:26)',
      slug: 'gsfc-sardar-npk-10-26-26-50kg',
      brandId: brandMap['GSFC (Gujarat State Fertilizers)'],
      categoryId: prodCatMap['chemical-fertilizers'],
      cropTarget: 'cotton,sugarcane,potato,vegetables',
      description: 'Complex granulated fertilizer tailored for potash- and phosphorus-hungry cash crops. Promotes vigorous bolls, frost tolerance, and premium quality lint.',
      composition: '10% N, 26% P2O5, 26% K2O',
      packSize: '50 kg Bag',
      price: 1470.00,
      mrp: 1520.00,
      stock: 60,
      imageUrl: '/images/products/npk-10-26-26.svg',
      isAvailable: true,
      usageInstructions: 'Apply at sowing or 30 days after sowing along the crop line.',
      safetyNotes: 'Store in dry place on wooden pallets.',
      sellerName: 'SmartFarm Certified Agri-Input Cooperative',
      sellerLicense: 'IN-GJ-AGRI-COOP-2026-88',
      isDemoProduct: true,
    },
    {
      name: 'KRIBHCO Muriate of Potash (MOP 60%)',
      slug: 'kribhco-mop-50kg',
      brandId: brandMap['KRIBHCO'],
      categoryId: prodCatMap['chemical-fertilizers'],
      cropTarget: 'wheat,cotton,sugarcane,paddy',
      description: 'Imported water-soluble potassium chloride supplying 60% K2O. Enhances cell wall rigidity, stomatal water regulation, and crop lodging resistance.',
      composition: '60% Potassium Oxide (K2O)',
      packSize: '50 kg Bag',
      price: 1650.00,
      mrp: 1700.00,
      stock: 45,
      imageUrl: '/images/products/mop-50kg.svg',
      isAvailable: true,
      usageInstructions: 'Basal placement or top dressing before flowering.',
      safetyNotes: 'Avoid in chloride-sensitive crops.',
      sellerName: 'SmartFarm Certified Agri-Input Cooperative',
      sellerLicense: 'IN-GJ-AGRI-COOP-2026-88',
      isDemoProduct: true,
    },
    {
      name: 'GSFC Single Super Phosphate (SSP) Granular',
      slug: 'gsfc-ssp-granular-50kg',
      brandId: brandMap['GSFC (Gujarat State Fertilizers)'],
      categoryId: prodCatMap['chemical-fertilizers'],
      cropTarget: 'groundnut,mustard,soybean,pulses',
      description: 'The preferred phosphate choice for Saurashtra groundnut and North Gujarat mustard farmers. Supplies vital sulphur and calcium alongside phosphorus.',
      composition: '16% P2O5, 11% Sulphur, 19% Calcium',
      packSize: '50 kg Bag',
      price: 595.00,
      mrp: 620.00,
      stock: 90,
      imageUrl: '/images/products/ssp-50kg.svg',
      isAvailable: true,
      usageInstructions: 'Broadcast and harrow into top 10 cm of soil during land preparation.',
      safetyNotes: 'Keep dry; handle with care.',
      sellerName: 'SmartFarm Certified Agri-Input Cooperative',
      sellerLicense: 'IN-GJ-AGRI-COOP-2026-88',
      isDemoProduct: true,
    },
    {
      name: 'IFFCO WSF 19:19:19 (Water Soluble)',
      slug: 'iffco-wsf-19-19-19-1kg',
      brandId: brandMap['IFFCO'],
      categoryId: prodCatMap['water-soluble'],
      cropTarget: 'cotton,vegetables,wheat,horticulture',
      description: 'Fully water-soluble balanced NPK foliar formula. Dissolves instantly in spray tanks without clogging drip emitters or nozzles.',
      composition: '19% N, 19% P2O5, 19% K2O (100% Water Soluble)',
      packSize: '1 kg Pouch',
      price: 145.00,
      mrp: 160.00,
      stock: 200,
      imageUrl: '/images/products/wsf-19-19-19.svg',
      isAvailable: true,
      usageInstructions: 'Foliar spray: 5 grams per litre of water (75-100 g per 15L pump). Spray early morning.',
      safetyNotes: 'Store sealed in pouch away from dampness.',
      sellerName: 'SmartFarm Certified Agri-Input Cooperative',
      sellerLicense: 'IN-GJ-AGRI-COOP-2026-88',
      isDemoProduct: true,
    },
    {
      name: 'Tata Paras Zinc Sulphate Monohydrate 33% Zn',
      slug: 'tata-paras-zinc-sulphate-5kg',
      brandId: brandMap['Tata Paras (Tata Chemicals)'],
      categoryId: prodCatMap['micronutrients'],
      cropTarget: 'wheat,rice,cotton,maize',
      description: 'High-purity soluble zinc sulphate addressing widespread zinc deficiency in alkaline Gujarat and North Indian alluvial soils.',
      composition: '33% Zinc (Zn), 15% Sulphur (S)',
      packSize: '5 kg Bucket',
      price: 480.00,
      mrp: 520.00,
      stock: 70,
      imageUrl: '/images/products/zinc-sulphate-5kg.jpg',
      isAvailable: true,
      usageInstructions: 'Soil application: 10 kg/acre or Foliar spray: 1.5 g/L with lime neutralizer.',
      safetyNotes: 'DO NOT mix with DAP or Phosphate fertilizers in the spray tank.',
      sellerName: 'SmartFarm Certified Agri-Input Cooperative',
      sellerLicense: 'IN-GJ-AGRI-COOP-2026-88',
      isDemoProduct: true,
    },
    {
      name: 'SmartFarm Enriched Organic Vermicompost',
      slug: 'smartfarm-vermicompost-40kg',
      brandId: brandMap['IFFCO'],
      categoryId: prodCatMap['organic-bio'],
      cropTarget: 'all_crops',
      description: 'Pure Eisenia Fetida worm castings enriched with beneficial Trichoderma viride and mycorrhizal fungi. Restores damaged microbial soil biology.',
      composition: 'Organic Matter >30%, Humic Acid 5%, Microflora Consortia',
      packSize: '40 kg Bag',
      price: 320.00,
      mrp: 350.00,
      stock: 150,
      imageUrl: '/images/products/vermicompost-40kg.jpg',
      isAvailable: true,
      usageInstructions: 'Mix 1-2 bags per bigha during bed preparation or fruit tree basins.',
      safetyNotes: 'Maintain moderate moisture; do not expose to direct prolonged sunlight.',
      sellerName: 'SmartFarm Certified Agri-Input Cooperative',
      sellerLicense: 'IN-GJ-AGRI-COOP-2026-88',
      isDemoProduct: true,
    },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log('✔ Fertilizer E-Commerce catalog seeded');

  // 9. Demo Order for Ramesh Patel
  const sampleProduct1 = await prisma.product.findUnique({ where: { slug: 'iffco-neem-coated-urea-45kg' } });
  const sampleProduct2 = await prisma.product.findUnique({ where: { slug: 'gsfc-sardar-dap-50kg' } });

  const existingOrder = await prisma.order.findFirst({ where: { userId: demoFarmer.id } });
  if (!existingOrder && sampleProduct1 && sampleProduct2) {
    const newOrder = await prisma.order.create({
      data: {
        orderNumber: 'SF-2026-10821',
        userId: demoFarmer.id,
        status: 'processing',
        subtotal: 1883.00,
        deliveryFee: 0,
        discount: 0,
        totalAmount: 1883.00,
        paymentMethod: 'demo_checkout',
        paymentStatus: 'test_paid',
        isDemoOrder: true,
        deliveryName: 'Ramesh Patel',
        deliveryPhone: '+919876543211',
        deliveryAddress: 'Survey No. 42, Patel Organic Farm, Near Padra Canal',
        deliveryVillage: 'Padra',
        deliveryDistrict: 'Vadodara',
        deliveryState: 'Gujarat',
        deliveryPincode: '391440',
        notes: 'Delivery requested at farm gate near tractor shed.',
        items: {
          create: [
            {
              productId: sampleProduct1.id,
              productNameSnapshot: sampleProduct1.name,
              unitPriceSnapshot: sampleProduct1.price,
              packSizeSnapshot: sampleProduct1.packSize,
              quantity: 2,
              totalPrice: sampleProduct1.price * 2,
            },
            {
              productId: sampleProduct2.id,
              productNameSnapshot: sampleProduct2.name,
              unitPriceSnapshot: sampleProduct2.price,
              packSizeSnapshot: sampleProduct2.packSize,
              quantity: 1,
              totalPrice: sampleProduct2.price * 1,
            },
          ],
        },
      },
    });

    // Also add 1 item into demo farmer's cart
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: demoFarmer.id, productId: sampleProduct1.id } },
      update: { quantity: 3 },
      create: {
        userId: demoFarmer.id,
        productId: sampleProduct1.id,
        quantity: 3,
      },
    });
    console.log('✔ Sample demo order & active cart item seeded for Ramesh Patel');
  }

  console.log('✔ All seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
