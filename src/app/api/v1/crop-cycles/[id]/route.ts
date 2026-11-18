import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { resolveCropName } from '@/lib/units';
import { z } from 'zod';

const updateCycleSchema = z.object({
  status: z
    .enum(['planned', 'sown', 'growing', 'flowering', 'fruiting', 'harvest_ready', 'harvested', 'completed'])
    .optional(),
  expectedHarvestDate: z.string().nullable().optional(),
  actualHarvestDate: z.string().nullable().optional(),
  quantityHarvested: z.number().nonnegative().nullable().optional(),
  quantityUnit: z.string().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const { id } = await params;
    const cycle = await prisma.cropCycle.findFirst({
      where: {
        id,
        deletedAt: null,
        field: { deletedAt: null, farm: { userId: user.id, deletedAt: null } },
      },
      include: {
        crop: { include: { translations: true } },
        variety: true,
        field: {
          include: {
            farm: { select: { id: true, name: true, village: true, district: true, state: true } },
          },
        },
        stages: {
          orderBy: { orderIndex: 'asc' },
          include: {
            templateStage: {
              include: {
                translations: true,
                advisories: { include: { translations: true } },
              },
            },
          },
        },
        tasks: {
          where: { deletedAt: null },
          orderBy: { dueAt: 'asc' },
        },
      },
    });

    if (!cycle) return apiError('Crop cycle not found', 'not_found', 404);

    return apiSuccess({
      ...cycle,
      crop: cycle.crop
        ? {
            ...cycle.crop,
            name: resolveCropName(cycle.crop, cycle.customCropName, user.preferredLanguage),
          }
        : null,
    });
  } catch (err) {
    console.error('[GET /api/v1/crop-cycles/[id]] Error:', err);
    return apiError('Unable to load crop cycle details.', 'cycle_detail_failed', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.cropCycle.findFirst({
      where: {
        id,
        deletedAt: null,
        field: { deletedAt: null, farm: { userId: user.id, deletedAt: null } },
      },
    });
    if (!existing) return apiError('Crop cycle not found', 'not_found', 404);

    const body = await req.json();
    const parsed = updateCycleSchema.parse(body);

    const updated = await prisma.cropCycle.update({
      where: { id },
      data: {
        ...(parsed.status ? { status: parsed.status } : {}),
        ...(parsed.expectedHarvestDate !== undefined
          ? { expectedHarvestDate: parsed.expectedHarvestDate ? new Date(parsed.expectedHarvestDate) : null }
          : {}),
        ...(parsed.actualHarvestDate !== undefined
          ? { actualHarvestDate: parsed.actualHarvestDate ? new Date(parsed.actualHarvestDate) : null }
          : {}),
        ...(parsed.quantityHarvested !== undefined ? { quantityHarvested: parsed.quantityHarvested } : {}),
        ...(parsed.quantityUnit ? { quantityUnit: parsed.quantityUnit } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
      },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Validation failed', 'validation_failed', 422);
    }
    console.error('[PATCH /api/v1/crop-cycles/[id]] Error:', err);
    return apiError('Failed to update crop cycle.', 'update_failed', 400);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.cropCycle.findFirst({
      where: {
        id,
        deletedAt: null,
        field: { deletedAt: null, farm: { userId: user.id, deletedAt: null } },
      },
    });
    if (!existing) return apiError('Crop cycle not found', 'not_found', 404);

    await prisma.cropCycle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ id, message: 'Crop cycle deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/v1/crop-cycles/[id]] Error:', err);
    return apiError('Failed to delete crop cycle.', 'delete_failed', 500);
  }
}
