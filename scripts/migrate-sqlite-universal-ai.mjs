import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Applying Universal Crop Disease AI schema enhancements to SQLite dev.db...');

  // 1. Add columns to CropDiagnosisRecord
  const columnsToAdd = [
    { name: 'selectedCrop', type: 'TEXT' },
    { name: 'detectedCrop', type: 'TEXT' },
    { name: 'modelId', type: 'TEXT' },
    { name: 'severity', type: 'TEXT' },
    { name: 'feedbackRating', type: 'INTEGER' },
    { name: 'feedbackNotes', type: 'TEXT' },
    { name: 'feedbackAccurate', type: 'BOOLEAN' },
    { name: 'metadataJson', type: 'TEXT' }
  ];

  const tableInfo = await prisma.$queryRawUnsafe(`PRAGMA table_info("CropDiagnosisRecord");`);
  const existingCols = new Set(tableInfo.map((c) => c.name));

  for (const col of columnsToAdd) {
    if (!existingCols.has(col.name)) {
      console.log(`  + Adding column "${col.name}" ${col.type} to CropDiagnosisRecord...`);
      await prisma.$queryRawUnsafe(`ALTER TABLE "CropDiagnosisRecord" ADD COLUMN "${col.name}" ${col.type};`);
    } else {
      console.log(`  ✔ Column "${col.name}" already exists on CropDiagnosisRecord.`);
    }
  }

  // 2. Create AiModelRegistry table
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AiModelRegistry" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "modelId" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "version" TEXT NOT NULL,
      "architecture" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "targetCropsJson" TEXT NOT NULL,
      "supportedClassesCount" INTEGER NOT NULL,
      "classesJson" TEXT NOT NULL,
      "datasetSource" TEXT NOT NULL,
      "license" TEXT NOT NULL,
      "accuracy" REAL,
      "precision" REAL,
      "recall" REAL,
      "f1Score" REAL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('  ✔ Created AiModelRegistry table.');

  // 3. Create DiagnosisFeedback table
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DiagnosisFeedback" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "diagnosisId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "isAccurate" BOOLEAN NOT NULL,
      "correctedDisease" TEXT,
      "rating" INTEGER,
      "comments" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("diagnosisId") REFERENCES "CropDiagnosisRecord"("id") ON DELETE CASCADE,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    );
  `);
  console.log('  ✔ Created DiagnosisFeedback table.');

  console.log('\n✅ SQLite schema upgrade complete!');
  await prisma.$disconnect();
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});

