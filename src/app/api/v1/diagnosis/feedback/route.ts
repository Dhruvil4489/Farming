import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required to submit feedback', 'unauthorized', 401);
    }

    const body = await req.json();
    const { diagnosisId, isAccurate, correctedDisease, rating, comments } = body;

    if (!diagnosisId) {
      return apiError('Diagnosis ID is required', 'missing_id', 400);
    }

    const diagnosis = await prisma.cropDiagnosisRecord.findFirst({
      where: { id: diagnosisId, userId: user.id },
    });

    if (!diagnosis) {
      return apiError('Diagnosis record not found or access denied', 'not_found', 404);
    }

    const feedback = await prisma.diagnosisFeedback.create({
      data: {
        diagnosisId,
        userId: user.id,
        isAccurate: Boolean(isAccurate),
        correctedDisease: correctedDisease || null,
        rating: rating ? parseInt(rating, 10) : null,
        comments: comments || null,
      },
    });

    // Update parent record audit flags
    await prisma.cropDiagnosisRecord.update({
      where: { id: diagnosisId },
      data: {
        feedbackAccurate: Boolean(isAccurate),
        feedbackRating: rating ? parseInt(rating, 10) : null,
        feedbackNotes: comments || null,
      },
    });

    return apiSuccess({
      message: 'Feedback recorded successfully. Thank you for helping improve SmartFarm AI.',
      feedbackId: feedback.id,
    });
  } catch (error: any) {
    console.error('[API /api/v1/diagnosis/feedback POST] Error:', error.message);
    return apiError(error.message || 'Failed to submit feedback', 'feedback_error', 500);
  }
}

