/**
 * GET/DELETE /api/v1/diagnosis/history/[id]
 *
 * Detailed inspection and deletion of a diagnosis record with tenant authorization.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { deleteDiagnosisImage } from '@/lib/storage';
import { getAgronomicPathology } from '@/lib/crop-disease-knowledge';
import { DiseaseProductMatchingService } from '@/services/DiseaseProductMatchingService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const { id } = await params;

    const record = await prisma.cropDiagnosisRecord.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: {
        field: {
          select: { id: true, name: true, farm: { select: { id: true, name: true } } },
        },
      },
    });

    if (!record) {
      return apiError('Diagnosis record not found', 'not_found', 404);
    }

    let topK = [];
    try {
      topK = JSON.parse(record.topKJson);
    } catch {
      topK = [];
    }

    const filename = record.imagePath.replace(/^diagnoses[\/\\]/, '');
    const pathology = getAgronomicPathology(record.predictedLabel);

    const recommendations = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
      crop: record.cropName || record.selectedCrop || 'General Crop',
      disease: record.diseaseName || 'Crop Foliage Disease',
      label: record.predictedLabel,
      isHealthy: record.isHealthy,
      status: record.status,
    });

    return apiSuccess({
      diagnosis: {
        id: record.id,
        status: record.status,
        selectedCrop: record.selectedCrop,
        detectedCrop: record.detectedCrop,
        predictedLabel: record.predictedLabel,
        crop: record.cropName,
        disease: record.diseaseName,
        isHealthy: record.isHealthy,
        confidence: record.confidence,
        severity: record.severity || (record.isHealthy ? 'none' : pathology?.defaultSeverity || 'moderate'),
        topK,
        uncertaintyReason: record.uncertaintyReason,
        pathology,
        modelId: record.modelId || record.modelName,
        modelName: record.modelName,
        modelVersion: record.modelVersion,
        field: record.field,
        notes: record.notes,
        feedbackRating: record.feedbackRating,
        feedbackAccurate: record.feedbackAccurate,
        diagnosedAt: record.diagnosedAt.toISOString(),
        imageFilename: filename,
        fileSizeBytes: record.fileSizeBytes,
        recommendations,
      },
    });
  } catch (error: any) {
    console.error('[API /api/v1/diagnosis/history/[id] GET] Error:', error.message);
    return apiError('Failed to retrieve diagnosis record', 'server_error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const { id } = await params;

    const record = await prisma.cropDiagnosisRecord.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!record) {
      return apiError('Diagnosis record not found or already deleted', 'not_found', 404);
    }

    // Soft delete diagnosis record in database
    await prisma.cropDiagnosisRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Clean up stored image file from disk
    const filename = record.imagePath.replace(/^diagnoses[\/\\]/, '');
    await deleteDiagnosisImage(filename);

    return apiSuccess({
      deleted: true,
      id,
    });
  } catch (error: any) {
    console.error('[API /api/v1/diagnosis/history/[id] DELETE] Error:', error.message);
    return apiError('Failed to delete diagnosis record', 'server_error', 500);
  }
}
