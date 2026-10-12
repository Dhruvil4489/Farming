import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectDb() {
  console.log('--- Inspecting Existing SQLite Database ---');

  const models = [
    'user',
    'role',
    'permission',
    'userRole',
    'rolePermission',
    'farm',
    'field',
    'crop',
    'cropTranslation',
    'cropVariety',
    'cropStage',
    'cropStageTranslation',
    'cropStageAdvisory',
    'cropStageAdvisoryTranslation',
    'cropCycle',
    'cycleStage',
    'task',
    'weatherRecord',
    'advisoryRule',
    'soilProfile',
    'soilReport',
    'soilTest',
    'soilParameter',
    'farmObservation',
    'irrigationRecord',
    'file',
    'notification',
    'notificationPreference',
    'auditLog',
    'marketCommodity',
    'marketLocation',
    'marketPriceObservation',
    'marketSyncLog',
    'fertilizerCategory',
    'cropFertilizerGuidance',
    'productCategory',
    'productBrand',
    'product',
    'cartItem',
    'order',
    'orderItem',
  ];

  const results = {};
  let totalRows = 0;

  for (const model of models) {
    try {
      if (prisma[model] && typeof prisma[model].count === 'function') {
        const count = await prisma[model].count();
        results[model] = count;
        totalRows += count;
        console.log(`Table: ${model.padEnd(30)} Rows: ${count}`);
      } else {
        console.log(`Model ${model} not on Prisma Client instance`);
      }
    } catch (e) {
      console.log(`Table: ${model.padEnd(30)} Error: ${e.message}`);
    }
  }

  console.log('-------------------------------------------');
  console.log(`Total rows across all tables: ${totalRows}`);

  // Inspect users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, state: true, district: true },
  });
  console.log('\nUsers in DB:', users);

  // Inspect farms
  const farms = await prisma.farm.findMany({
    select: { id: true, name: true, village: true, district: true, state: true, userId: true },
  });
  console.log('\nFarms in DB:', farms);

  // Inspect products
  const products = await prisma.product.findMany({
    select: { id: true, name: true, packSize: true, price: true, stock: true },
  });
  console.log(`\nProducts count: ${products.length}`);

  // Inspect orders
  const orders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, totalAmount: true, status: true, paymentStatus: true },
  });
  console.log('\nOrders in DB:', orders);

  // Inspect market observations
  const obsCount = await prisma.marketPriceObservation.count();
  console.log(`\nMarket price observations: ${obsCount}`);

  await prisma.$disconnect();
}

inspectDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
