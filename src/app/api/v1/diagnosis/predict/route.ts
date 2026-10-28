/**
 * POST /api/v1/diagnosis/predict
 *
 * Authenticated crop disease prediction endpoint.
 *
 * Workflow:
 * 1. Authenticate user.
 * 2. Validate field ownership (if fieldId provided).
 * 3. Validate actual binary magic bytes (JPEG, PNG, WebP) and size limit (10MB).
 * 4. Store image in private storage directory (never public).
 * 5. Call Python inference service with safe timeout.
 * 6. Save CropDiagnosisRecord to database with tenant scoping.
 * 7. Return standard envelope response with full transparency and caveat flags.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { saveDiagnosisImage, validateImageMagicBytes, MAX_IMAGE_SIZE_BYTES } from '@/lib/storage';
import { DiseaseDiagnosisService } from '@/services/DiseaseDiagnosisService';

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
        include: { farm: true },
      });
      if (!field) {
        return apiError('Specified field does not exist or does not belong to your account', 'field_not_found', 404);
      }
    } else {
      // Find user's first field as default if none specified
      field = await prisma.field.findFirst({
        where: { farm: { userId: user.id } },
        include: { farm: true },
      });
      if (field) {
        resolvedFieldId = field.id;
      } else {
        return apiError('No fields registered. Please register a farm plot before running diagnosis.', 'no_fields', 400);
      }
    }

    // Save image to private storage directory
    const saved = await saveDiagnosisImage(buffer, file.name);

    // Call Python inference microservice
    const prediction = await DiseaseDiagnosisService.predict(buffer, saved.filename, saved.mimeType);

    // Persist diagnosis record to database
    const diagnosisRecord = await prisma.cropDiagnosisRecord.create({
      data: {
        userId: user.id,
        fieldId: resolvedFieldId,
        imagePath: saved.relativePath,
        originalFilename: file.name || saved.filename,
        mimeType: saved.mimeType,
        fileSizeBytes: saved.sizeBytes,
        status: prediction.status,
        predictedLabel: prediction.predictedLabel || null,
        cropName: prediction.crop || null,
        diseaseName: prediction.disease || null,
        isHealthy: prediction.isHealthy,
        confidence: prediction.confidence,
        topKJson: JSON.stringify(prediction.topK || []),
        uncertaintyReason: prediction.uncertainty.reason || null,
        modelName: prediction.model.name,
        modelVersion: prediction.model.version,
        source: 'farmer_upload',
        notes: notes || null,
        diagnosedAt: new Date(prediction.timestamp),
      },
      include: {
        field: {
          select: { id: true, name: true, farm: { select: { id: true, name: true } } },
        },
      },
    });

    return apiSuccess({
      diagnosis: {
        id: diagnosisRecord.id,
        status: diagnosisRecord.status,
        predictedLabel: diagnosisRecord.predictedLabel,
        crop: diagnosisRecord.cropName,
        disease: diagnosisRecord.diseaseName,
        isHealthy: diagnosisRecord.isHealthy,
        confidence: diagnosisRecord.confidence,
        topK: prediction.topK,
        uncertainty: prediction.uncertainty,
        explanation: prediction.explanation,
        model: prediction.model,
        field: diagnosisRecord.field,
        diagnosedAt: diagnosisRecord.diagnosedAt.toISOString(),
        imageFilename: saved.filename,
      },
    }, undefined, 201);
  } catch (error: any) {
    console.error('[API /api/v1/diagnosis/predict POST] Error:', error.message);
    return apiError(error.message || 'Failed to process crop diagnosis', 'diagnosis_error', 500);
  }
}
