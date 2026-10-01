import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { StageMaterializer } from '@/services/StageMaterializer';
import { z } from 'zod';

const cycleSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  cropId: z.string().min(1, 'Crop ID is required'),
  varietyId: z.string().optional(),
  customCropName: z.string().optional(),
  sowingDate: z.string().optional(),
  expectedHarvestDate: z.string().optional(),
  areaHa: z.number().positive().optional(),
  irrigationType: z.string().optional(),
  seedInfo: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const fieldId = searchParams.get('field_id');
  const status = searchParams.get('status');

  const cycles = await prisma.cropCycle.findMany({
    where: {
      field: { farm: { userId: user.id } },
      ...(fieldId ? { fieldId } : {}),
      ...(status ? { status } : {}),
      deletedAt: null,
    },
    include: {
      crop: {
        include: { translations: true },
      },
      field: { select: { id: true, name: true } },
      stages: { orderBy: { orderIndex: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess(cycles);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  try {
    const body = await req.json();
    const parsed = cycleSchema.parse(body);

    const field = await prisma.field.findFirst({
      where: { id: parsed.fieldId, farm: { userId: user.id }, deletedAt: null },
    });
    if (!field) return apiError('Field not found or unowned', 'not_found', 404);

    const sowing = parsed.sowingDate ? new Date(parsed.sowingDate) : new Date();

    const cycle = await prisma.cropCycle.create({
      data: {
        fieldId: parsed.fieldId,
        cropId: parsed.cropId,
        varietyId: parsed.varietyId || null,
        customCropName: parsed.customCropName || null,
        sowingDate: sowing,
        expectedHarvestDate: parsed.expectedHarvestDate ? new Date(parsed.expectedHarvestDate) : null,
        areaHa: parsed.areaHa || field.areaHa || null,
        irrigationType: parsed.irrigationType || field.irrigationType || null,
        seedInfo: parsed.seedInfo || null,
        notes: parsed.notes || null,
        status: 'growing',
      },
    });

    // Materialize stages automatically from template
    const stages = await StageMaterializer.materialize(cycle.id, parsed.cropId, sowing);

    // Update field status to active
    await prisma.field.update({
      where: { id: field.id },
      data: { status: 'active' },
    });

    return apiSuccess({ ...cycle, stages }, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    return apiError('Failed to create crop cycle', 'create_failed', 400);
  }
}
