import fs from 'fs';
import path from 'path';

const files = [
  'prisma/schema.prisma',
  'prisma/schema.sqlite.prisma',
  'prisma/schema.postgres.prisma'
];

const cropDiagnosisBlock = `model CropDiagnosisRecord {
  id                    String     @id @default(uuid())
  userId                String
  fieldId               String
  cropCycleId           String?
  imagePath             String     // Stored in private uploads directory (relative path, never public)
  originalFilename      String
  mimeType              String
  fileSizeBytes         Int
  status                String     // accepted | uncertain | not_crop | in_validation | model_not_ready
  selectedCrop          String?    // Manually selected crop by farmer (e.g. Cotton, Wheat, Rice)
  detectedCrop          String?    // Botanically identified crop by CV detector
  predictedLabel        String?
  cropName              String?
  diseaseName           String?
  isHealthy             Boolean?
  confidence            Float?     // Softmax top-1 score (0.0 to 1.0)
  severity              String?    // mild | moderate | severe | none
  topKJson              String     @default("[]") // JSON string array of candidates
  uncertaintyReason     String?
  modelId               String?    // Specific model identifier (e.g. cotton-specialist-effnet-v2)
  modelName             String     @default("agri-plant-disease-resnet50")
  modelVersion          String     @default("1.0.0")
  source                String     @default("farmer_upload") // farmer_upload | field_scouting
  notes                 String?
  feedbackRating        Int?       // Farmer rating 1-5
  feedbackNotes         String?    // Farmer comments
  feedbackAccurate      Boolean?   // Farmer verified correctness
  metadataJson          String?    // Image resolution, blur score, chlorophyll ratio
  diagnosedAt           DateTime   @default(now())
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
  deletedAt             DateTime?

  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  field                 Field               @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  cropCycle             CropCycle?          @relation(fields: [cropCycleId], references: [id])
  feedbacks             DiagnosisFeedback[]

  @@index([userId, diagnosedAt])
  @@index([fieldId, diagnosedAt])
  @@index([selectedCrop])
  @@index([modelId])
}

model AiModelRegistry {
  id                    String     @id @default(uuid())
  modelId               String     @unique
  name                  String
  version               String
  architecture          String
  category              String     // specialist | general_benchmark | crop_detector
  targetCropsJson       String     // JSON array of crop slugs e.g. ["cotton"]
  supportedClassesCount Int
  classesJson           String     // JSON array of supported class labels
  datasetSource         String
  license               String
  accuracy              Float?
  precision             Float?
  recall                Float?
  f1Score               Float?
  status                String     @default("active") // active | in_validation | deprecated
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  @@index([modelId])
  @@index([status])
}

model DiagnosisFeedback {
  id                    String              @id @default(uuid())
  diagnosisId           String
  userId                String
  isAccurate            Boolean
  correctedDisease      String?
  rating                Int?
  comments              String?
  createdAt             DateTime            @default(now())

  diagnosis             CropDiagnosisRecord @relation(fields: [diagnosisId], references: [id], onDelete: Cascade)
  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([diagnosisId])
  @@index([userId])
}`;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // Add diagnosisFeedbacks to User if not present
  if (!content.includes('diagnosisFeedbacks DiagnosisFeedback[]')) {
    content = content.replace(
      'diagnoses          CropDiagnosisRecord[]',
      'diagnoses          CropDiagnosisRecord[]\n  diagnosisFeedbacks DiagnosisFeedback[]'
    );
  }

  // Replace model CropDiagnosisRecord block
  const regex = /model CropDiagnosisRecord\s*\{[\s\S]*?\n\}/m;
  if (regex.test(content)) {
    content = content.replace(regex, cropDiagnosisBlock);
  } else {
    content += '\n\n' + cropDiagnosisBlock;
  }

  fs.writeFileSync(f, content, 'utf8');
  console.log(`Updated ${f}`);
}

