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

    return apiSuccess({
      diagnosis: {
        id: record.id,
        status: record.status,
        predictedLabel: record.predictedLabel,
        crop: record.cropName,
        disease: record.diseaseName,
        isHealthy: record.isHealthy,
        confidence: record.confidence,
        topK,
        uncertaintyReason: record.uncertaintyReason,
        modelName: record.modelName,
        modelVersion: record.modelVersion,
        field: record.field,
        notes: record.notes,
        diagnosedAt: record.diagnosedAt.toISOString(),
        imageFilename: filename,
        fileSizeBytes: record.fileSizeBytes,
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
      where: { id, userId: user.id },
    });

    if (!record) {
      return apiError('Diagnosis record not found', 'not_found', 404);
    }

    // Delete associated physical image
    const filename = record.imagePath.replace(/^diagnoses[\/\\]/, '');
    await deleteDiagnosisImage(filename);

    // Remove DB record
    await prisma.cropDiagnosisRecord.delete({
      where: { id },
    });

    return apiSuccess({ deleted: true, id });
  } catch (error: any) {
    console.error('[API /api/v1/diagnosis/history/[id] DELETE] Error:', error.message);
    return apiError('Failed to delete diagnosis record', 'server_error', 500);
  }
}
