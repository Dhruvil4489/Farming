import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { toHectares, resolveCropName } from '@/lib/units';
import { areaInputValueSchema, areaInputUnitSchema, normalizeAreaUnit } from '@/lib/area-validation';
import { z } from 'zod';

const updateFieldSchema = z.object({
  farmId: z.string().min(1).optional(),
  name: z.string().trim().min(2, 'Crop name must be at least 2 characters').optional(),
  areaHa: z.number().positive().nullable().optional(),
  areaInputValue: areaInputValueSchema.optional(),
  areaInputUnit: areaInputUnitSchema.optional(),
  irrigationType: z.enum(['drip', 'sprinkler', 'flood', 'rainfed', 'other', 'unknown']).optional(),
  soilType: z.enum(['sandy', 'loamy', 'clay', 'black', 'red', 'alluvial', 'other', 'unknown']).optional(),
  status: z.enum(['empty', 'planned', 'active', 'fallow']).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to view field details.', 'unauthorized', 401);

    const { id } = await params;
    const field = await prisma.field.findFirst({
      where: {
        id,
        deletedAt: null,
        farm: { userId: user.id, deletedAt: null },
      },
      include: {
        farm: {
          select: { id: true, name: true, village: true, district: true, state: true, lat: true, lng: true },
        },
        cropCycles: {
          where: { deletedAt: null },
          include: {
            crop: { include: { translations: true } },
            variety: true,
            stages: { orderBy: { orderIndex: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        soilProfile: true,
        tasks: {
          where: { deletedAt: null },
          orderBy: { dueAt: 'asc' },
          take: 10,
        },
        observations: {
          orderBy: { observedAt: 'desc' },
          take: 5,
        },
        irrigationRecords: {
          orderBy: { irrigatedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!field) return apiError('Field not found.', 'not_found', 404);

    const normalized = {
      ...field,
      cropCycles: field.cropCycles.map((cycle) => ({
        ...cycle,
        crop: cycle.crop
          ? {
              ...cycle.crop,
              name: resolveCropName(cycle.crop, cycle.customCropName, user.preferredLanguage),
            }
          : null,
      })),
    };

    return apiSuccess(normalized);
  } catch (err) {
    console.error('[GET /api/v1/fields/[id]] Error:', err);
    return apiError('Unable to load field details.', 'field_detail_failed', 500);
  }
}

async function handleUpdate(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to update a field.', 'unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.field.findFirst({
      where: {
        id,
        deletedAt: null,
        farm: { userId: user.id, deletedAt: null },
      },
    });
    if (!existing) return apiError('Field not found.', 'not_found', 404);

    const body = await req.json();
    const parsed = updateFieldSchema.parse(body);

    // If changing farmId, verify new farm is also owned by this farmer
    if (parsed.farmId && parsed.farmId !== existing.farmId) {
      const targetFarm = await prisma.farm.findFirst({
        where: { id: parsed.farmId, userId: user.id, deletedAt: null },
      });
      if (!targetFarm) return apiError('Selected farm not found.', 'not_found', 404);
    }

    const nextUnit = normalizeAreaUnit(parsed.areaInputUnit || existing.areaInputUnit);
    const nextValue =
      parsed.areaInputValue !== undefined ? parsed.areaInputValue : existing.areaInputValue;
    let nextAreaHa = existing.areaHa;
    if (parsed.areaInputValue !== undefined || parsed.areaInputUnit !== undefined) {
      nextAreaHa = nextValue === null || nextValue === undefined ? null : toHectares(nextValue, nextUnit);
    } else if (parsed.areaHa !== undefined) {
      nextAreaHa = parsed.areaHa;
    }

    const updated = await prisma.field.update({
      where: { id },
      data: {
        ...(parsed.farmId ? { farmId: parsed.farmId } : {}),
        ...(parsed.name ? { name: parsed.name } : {}),
        areaHa: nextAreaHa,
        areaInputValue: nextValue ?? null,
        areaInputUnit: nextUnit,
        ...(parsed.irrigationType ? { irrigationType: parsed.irrigationType } : {}),
        ...(parsed.soilType ? { soilType: parsed.soilType } : {}),
        ...(parsed.status ? { status: parsed.status } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
      },
      include: {
        farm: {
          select: { id: true, name: true, village: true, district: true, state: true },
        },
      },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const firstMsg = err.issues[0]?.message || 'Please check the field details.';
      return apiError(firstMsg, 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    console.error('[PATCH /api/v1/fields/[id]] Error:', err);
    return apiError('Could not update this field. Please try again.', 'update_failed', 400);
  }
}

export const PATCH = handleUpdate;
export const PUT = handleUpdate;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to delete a field.', 'unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.field.findFirst({
      where: {
        id,
        deletedAt: null,
        farm: { userId: user.id, deletedAt: null },
      },
    });
    if (!existing) return apiError('Field not found.', 'not_found', 404);

    const now = new Date();
    await prisma.$transaction([
      prisma.cropCycle.updateMany({
        where: { fieldId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.field.update({
        where: { id },
        data: { deletedAt: now },
      }),
    ]);

    return apiSuccess({ id, message: 'Field deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/v1/fields/[id]] Error:', err);
    return apiError('Could not delete this field. Please try again.', 'delete_failed', 500);
  }
}
