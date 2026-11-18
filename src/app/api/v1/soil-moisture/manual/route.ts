import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SoilMoistureService } from '@/services/SoilMoistureService';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const manualSchema = z.object({
  fieldId: z.string().min(1, 'fieldId is required'),
  moisturePct: z.number().min(0).max(100, 'moisturePct must be between 0% and 100%'),
  depthCm: z.number().int().min(1).max(200).optional(),
  temperatureC: z.number().min(-40).max(85).optional(),
  notes: z.string().max(1000).optional(),
});

// POST /api/v1/soil-moisture/manual — Record manual tensiometer / probe reading
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const body = await request.json();
    const parsed = manualSchema.parse(body);

    // Verify field ownership
    const field = await prisma.field.findFirst({
      where: { id: parsed.fieldId, farm: { userId: user.id }, deletedAt: null },
    });
    if (!field) {
      return apiError('Field not found or access denied', 'not_found', 404);
    }

    const recorded = await SoilMoistureService.recordManualMeasurement({
      fieldId: parsed.fieldId,
      moisturePct: parsed.moisturePct,
      depthCm: parsed.depthCm,
      temperatureC: parsed.temperatureC,
      notes: parsed.notes,
    });

    return apiSuccess(
      {
        message: 'Manual soil moisture observation recorded successfully',
        reading: recorded,
      },
      undefined,
      201
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiError('Validation error', 'validation_error', 422, error.flatten().fieldErrors as any);
    }
    console.error('[API /api/v1/soil-moisture/manual POST] Error:', error);
    return apiError(error.message || 'Failed to record manual measurement', 'create_error', 500);
  }
}

