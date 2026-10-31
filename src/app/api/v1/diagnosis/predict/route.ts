/**
 * POST /api/v1/diagnosis/predict
 *
 * Authenticated crop disease prediction & store medicine recommendation endpoint.
 *
 * Workflow:
 * 1. Authenticate user.
 * 2. Validate field ownership (if fieldId provided) or assign default plot.
 * 3. Validate binary magic bytes (JPEG, PNG, WebP) and size limit (10MB).
 * 4. Check active crop of the field to guard against unsupported benchmark classes.
 * 5. Store image in private storage directory (never public).
 * 6. Execute disease prediction service with botanical identification, multi-model router, and ICAR pathology.
 * 7. Retrieve verified matching store medicines from the existing Fertilizer Store database.
 * 8. Persist CropDiagnosisRecord to database with fail-safe database insertion.
 * 9. Return standard envelope response with full diagnostic transparency, severity, ICAR treatment, and matching store products.
 */

import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { saveDiagnosisImage, validateImageMagicBytes, MAX_IMAGE_SIZE_BYTES } from '@/lib/storage';
import { DiseaseDiagnosisService } from '@/services/DiseaseDiagnosisService';
import { DiseaseProductMatchingService } from '@/services/DiseaseProductMatchingService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required to perform crop diagnosis', 'auth_required', 401);
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const fieldId = formData.get('fieldId') as string | null;
    const notes = formData.get('notes') as string | null;
    const requestedCrop = formData.get('crop') as string | null;

    if (!file) {
      return apiError('Image file is required', 'missing_image', 400);
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return apiError(
        `File size exceeds maximum allowable limit of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB provided)`,
        'file_too_large',
        413
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Security: Validate actual binary magic bytes
    const byteCheck = validateImageMagicBytes(buffer);
    if (!byteCheck.isValid || !byteCheck.mimeType) {
      return apiError(
        'Uploaded file is not a valid image. Supported formats: JPEG, PNG, WebP.',
        'unsupported_format',
        422
      );
    }

    // Verify field ownership if provided
    let resolvedFieldId = fieldId;
    let field = null;

    if (resolvedFieldId) {
      field = await prisma.field.findFirst({
        where: { id: resolvedFieldId, farm: { userId: user.id } },
        include: {
          farm: true,
          cropCycles: {
            where: { deletedAt: null },
            include: { crop: { select: { slug: true } } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      if (!field) {
        return apiError('Specified field does not exist or does not belong to your account', 'field_not_found', 404);
      }
    } else {
      // Find user's first field as default if none specified
      field = await prisma.field.findFirst({
        where: { farm: { userId: user.id } },
        include: {
          farm: true,
          cropCycles: {
            where: { deletedAt: null },
            include: { crop: { select: { slug: true } } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      if (field) {
        resolvedFieldId = field.id;
      } else {
        return apiError('No fields registered. Please register a farm plot before running diagnosis.', 'no_fields', 400);
      }
    }

    const fieldCropSlug = field?.cropCycles?.[0]?.crop?.slug || field?.cropCycles?.[0]?.customCropName || null;

    // Save image to private storage directory
    const saved = await saveDiagnosisImage(buffer, file.name);

    // Call inference service with crop and blur checks
    const prediction = await DiseaseDiagnosisService.predict(buffer, saved.filename, saved.mimeType, {
      requestedCrop,
      fieldCropName: fieldCropSlug,
    });

    // Query matching store medicines from Fertilizer Store
    const recommendations = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
      crop: prediction.crop || requestedCrop || 'General Crop',
      disease: prediction.disease || 'Unidentified Foliage Condition',
      label: prediction.predictedLabel,
      isHealthy: prediction.isHealthy,
      status: prediction.status,
    });

    // Enrich metadata with model details and recommended product IDs
    const metadataPayload = {
      ...prediction.model,
      recommendedProductIds: recommendations.medicines.map((m) => m.id),
      hasMatchingStoreMedicine: recommendations.hasMatchingMedicine,
    };

    const recordData = {
      userId: user.id,
      fieldId: resolvedFieldId,
      imagePath: saved.relativePath,
      originalFilename: file.name || saved.filename,
      mimeType: saved.mimeType,
      fileSizeBytes: saved.sizeBytes,
      status: prediction.status,
      selectedCrop: prediction.selectedCrop || requestedCrop || null,
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
      notes: notes || null,
      metadataJson: JSON.stringify(metadataPayload),
      diagnosedAt: new Date(prediction.timestamp),
    };

    // Resilient database persistence ensuring record is 100% saved in PostgreSQL / SQLite
    let diagnosisRecord: any = null;
    try {
      if (prisma.cropDiagnosisRecord && typeof prisma.cropDiagnosisRecord.create === 'function') {
        diagnosisRecord = await prisma.cropDiagnosisRecord.create({
          data: recordData,
          include: {
            field: {
              select: { id: true, name: true, farm: { select: { id: true, name: true } } },
            },
          },
        });
      }
    } catch (dbErr: any) {
      console.warn('[API /api/v1/diagnosis/predict POST] Delegate create failed, falling back to direct SQL:', dbErr.message);
    }

    if (!diagnosisRecord) {
      // Direct raw SQL insertion fallback
      const recordId = crypto.randomUUID();
      const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');

      const cols = [
        'id', 'userId', 'fieldId', 'imagePath', 'originalFilename', 'mimeType',
        'fileSizeBytes', 'status', 'selectedCrop', 'detectedCrop', 'predictedLabel',
        'cropName', 'diseaseName', 'isHealthy', 'confidence', 'severity',
        'topKJson', 'uncertaintyReason', 'modelId', 'modelName', 'modelVersion',
        'source', 'notes', 'metadataJson', 'diagnosedAt'
      ];

      const vals = [
        recordId,
        recordData.userId,
        recordData.fieldId,
        recordData.imagePath,
        recordData.originalFilename,
        recordData.mimeType,
        recordData.fileSizeBytes,
        recordData.status,
        recordData.selectedCrop,
        recordData.detectedCrop,
        recordData.predictedLabel,
        recordData.cropName,
        recordData.diseaseName,
        isSqlite ? (recordData.isHealthy ? 1 : 0) : recordData.isHealthy,
        recordData.confidence,
        recordData.severity,
        recordData.topKJson,
        recordData.uncertaintyReason,
        recordData.modelId,
        recordData.modelName,
        recordData.modelVersion,
        recordData.source,
        recordData.notes,
        recordData.metadataJson,
        recordData.diagnosedAt.toISOString(),
      ];

      const colNames = cols.map((c) => `"${c}"`).join(', ');
      const placeholders = isSqlite ? cols.map(() => '?').join(', ') : cols.map((_, i) => `$${i + 1}`).join(', ');

      await prisma.$executeRawUnsafe(
        `INSERT INTO "CropDiagnosisRecord" (${colNames}) VALUES (${placeholders})`,
        ...vals
      );

      diagnosisRecord = {
        id: recordId,
        ...recordData,
        field: {
          id: field.id,
          name: field.name,
          farm: { id: field.farm?.id, name: field.farm?.name },
        },
      };
    }

    return apiSuccess(
      {
        diagnosis: {
          id: diagnosisRecord.id,
          status: diagnosisRecord.status,
          selectedCrop: diagnosisRecord.selectedCrop,
          detectedCrop: diagnosisRecord.detectedCrop,
          predictedLabel: diagnosisRecord.predictedLabel,
          crop: diagnosisRecord.cropName,
          disease: diagnosisRecord.diseaseName,
          isHealthy: diagnosisRecord.isHealthy,
          confidence: diagnosisRecord.confidence,
          severity: diagnosisRecord.severity || prediction.severity || 'none',
          topK: prediction.topK,
          uncertainty: prediction.uncertainty,
          pathology: prediction.pathology || null,
          validationNotice: prediction.validationNotice || null,
          explanation: prediction.explanation,
          model: prediction.model,
          field: diagnosisRecord.field,
          diagnosedAt: (diagnosisRecord.diagnosedAt instanceof Date)
            ? diagnosisRecord.diagnosedAt.toISOString()
            : new Date(diagnosisRecord.diagnosedAt).toISOString(),
          imageFilename: saved.filename,
          recommendations,
        },
      },
      undefined,
      201
    );
  } catch (error: any) {
    console.error('[API /api/v1/diagnosis/predict POST] Error:', error.message);
    return apiError(error.message || 'Failed to process crop diagnosis', 'diagnosis_error', 500);
  }
}
