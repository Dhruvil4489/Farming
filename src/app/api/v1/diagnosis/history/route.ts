/**
 * GET /api/v1/diagnosis/history
 *
 * Returns paginated diagnosis history for the authenticated farmer with tenant isolation.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');
    const statusParam = searchParams.get('status');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50);

    const where: any = {
      userId: user.id,
      deletedAt: null,
    };

    if (fieldId) where.fieldId = fieldId;
    if (statusParam) where.status = statusParam;

    const [total, records] = await Promise.all([
      prisma.cropDiagnosisRecord.count({ where }),
      prisma.cropDiagnosisRecord.findMany({
        where,
        orderBy: { diagnosedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          field: {
            select: { id: true, name: true, farm: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    const formatted = records.map((r) => {
      let topK = [];
      try {
        topK = JSON.parse(r.topKJson);
      } catch {
        topK = [];
      }

      // Extract filename from imagePath
      const filename = r.imagePath.replace(/^diagnoses[\/\\]/, '');

      return {
        id: r.id,
        status: r.status,
        predictedLabel: r.predictedLabel,
        crop: r.cropName,
        disease: r.diseaseName,
        isHealthy: r.isHealthy,
        confidence: r.confidence,
        topK,
        uncertaintyReason: r.uncertaintyReason,
        modelName: r.modelName,
        modelVersion: r.modelVersion,
        field: r.field,
        notes: r.notes,
        diagnosedAt: r.diagnosedAt.toISOString(),
        imageFilename: filename,
        fileSizeBytes: r.fileSizeBytes,
      };
    });

    return apiSuccess(
      { history: formatted },
      {
        total,
        page,
        per_page: limit,
        total_pages: Math.ceil(total / limit) || 1,
      }
    );
  } catch (error: any) {
    console.error('[API /api/v1/diagnosis/history GET] Error:', error.message);
    return apiError('Failed to retrieve diagnosis history', 'history_error', 500);
  }
}
