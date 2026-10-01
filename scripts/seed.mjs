import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SmartFarm AI database...');

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
  const demoFarm = await prisma.farm.create({
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

  const wheatCrop = await prisma.crop.findUnique({ where: { slug: 'cotton' } });
  if (wheatCrop) {
    const cycle = await prisma.cropCycle.create({
      data: {
        fieldId: demoField.id,
        cropId: wheatCrop.id,
        sowingDate: new Date(),
        status: 'growing',
        areaHa: 1.2,
      },
    });

    // Create a demo task
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

  console.log('✔ Demo Farm, Field, Cycle & Task seeded');
  console.log('✔ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
