import { createJiti } from 'jiti';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const jiti = createJiti(__filename, {
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
  },
});

async function run() {
  console.log('Testing diagnosis prediction flow directly...');
  const { prisma } = jiti('../src/lib/prisma.ts');
  const { DiseaseDiagnosisService } = jiti('../src/services/DiseaseDiagnosisService.ts');
  const { saveDiagnosisImage } = jiti('../src/lib/storage.ts');

  // Find farmer user
  const user = await prisma.user.findFirst({
    where: { email: 'farmer@smartfarm.ai' },
    include: { farms: { include: { fields: true } } }
  });
  console.log('User found:', user?.email, user?.id);

  const field = user?.farms[0]?.fields[0];
  console.log('Field found:', field?.name, field?.id);

  // Create synthetic leaf image
  const buffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, ...new Array(64).fill(0x7a),
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x64, 0x00, 0x64, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    ...new Array(1200).fill(0x7a),
    0xff, 0xd9
  ]);

  console.log('Saving diagnosis image...');
  const saved = await saveDiagnosisImage(buffer, 'test_leaf.jpg');
  console.log('Image saved:', saved);

  console.log('Running prediction service...');
  const prediction = await DiseaseDiagnosisService.predict(buffer, saved.filename, saved.mimeType, {
    requestedCrop: 'Cotton',
    fieldCropName: 'cotton',
  });
  console.log('Prediction status:', prediction.status, 'disease:', prediction.disease);

  console.log('Testing prisma.cropDiagnosisRecord...');
  console.log('Type of prisma.cropDiagnosisRecord:', typeof prisma.cropDiagnosisRecord);
  console.log('Type of prisma.cropDiagnosisRecord.create:', typeof prisma.cropDiagnosisRecord?.create);

  try {
    const record = await prisma.cropDiagnosisRecord.create({
      data: {
        userId: user.id,
        fieldId: field.id,
        imagePath: saved.relativePath,
        originalFilename: 'test_leaf.jpg',
        mimeType: saved.mimeType,
        fileSizeBytes: saved.sizeBytes,
        status: prediction.status,
        selectedCrop: prediction.selectedCrop || 'Cotton',
        detectedCrop: prediction.detectedCrop || null,
        predictedLabel: prediction.predictedLabel || null,
        cropName: prediction.crop || null,
        diseaseName: prediction.disease || null,
        isHealthy: prediction.isHealthy,
        confidence: prediction.confidence,
        severity: prediction.severity || 'none',
        topKJson: JSON.stringify(prediction.topK || []),
        uncertaintyReason: prediction.uncertainty.reason || null,
        modelId: prediction.model.name,
        modelName: prediction.model.name,
        modelVersion: prediction.model.version,
        source: 'farmer_upload',
        metadataJson: JSON.stringify(prediction.model),
        diagnosedAt: new Date(prediction.timestamp),
      },
    });
    console.log('Record created successfully! ID:', record.id);
  } catch (err) {
    console.error('ERROR creating record:', err);
  }
}

run().catch(console.error);

