import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE INVENTORY AUDIT ===');
  const userCount = await prisma.user.count();
  const farmCount = await prisma.farm.count();
  const fieldCount = await prisma.field.count();
  const cropCycleCount = await prisma.cropCycle.count();
  const taskCount = await prisma.task.count();
  const soilReportCount = await prisma.soilReport.count();
  const soilTestCount = await prisma.soilTest.count();
  const soilProfileCount = await prisma.soilProfile.count();
  const sensorMoistureCount = await prisma.farmSensorMoisture.count();
  const productCount = await prisma.product.count();
  const productCategoryCount = await prisma.productCategory.count();
  const productBrandCount = await prisma.productBrand.count();
  const guidanceCount = await prisma.cropFertilizerGuidance.count();
  const fertilizerCategoryCount = await prisma.fertilizerCategory.count();
  const orderCount = await prisma.order.count();
  const marketCommodityCount = await prisma.marketCommodity.count();
  const marketLocationCount = await prisma.marketLocation.count();
  const marketObservationCount = await prisma.marketPriceObservation.count();

  console.log({
    users: userCount,
    farms: farmCount,
    fields: fieldCount,
    cropCycles: cropCycleCount,
    tasks: taskCount,
    soilReports: soilReportCount,
    soilTests: soilTestCount,
    soilProfiles: soilProfileCount,
    sensorMoistures: sensorMoistureCount,
    products: productCount,
    productCategories: productCategoryCount,
    productBrands: productBrandCount,
    guidance: guidanceCount,
    fertilizerCategories: fertilizerCategoryCount,
    orders: orderCount,
    marketCommodities: marketCommodityCount,
    marketLocations: marketLocationCount,
    marketObservations: marketObservationCount,
  });

  const sampleProducts = await prisma.product.findMany({ take: 3, select: { id: true, name: true, price: true, stock: true } });
  console.log('Sample Products:', sampleProducts);

  const sampleGuidances = await prisma.cropFertilizerGuidance.findMany({ take: 3, select: { id: true, cropName: true, cropStage: true, nutrientRequirement: true } });
  console.log('Sample Guidances:', sampleGuidances);

  const sampleSoilTests = await prisma.soilTest.findMany({ take: 3 });
  console.log('Sample Soil Tests:', sampleSoilTests);
}

main().catch(console.error).finally(() => prisma.$disconnect());
