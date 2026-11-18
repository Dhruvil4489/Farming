import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { resolveCropName } from '@/lib/units';
import { StageMaterializer } from '@/services/StageMaterializer';
import { z } from 'zod';

const cycleSchema = z.object({
  fieldId: z.string().min(1, 'Field selection is required'),
  cropId: z.string().min(1, 'Crop selection is required'),
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
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to view your crops.', 'unauthorized', 401);

    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get('field_id');
    const status = searchParams.get('status');

          const cycles = await prisma.cropCycle.findMany({
            where: {
              field: { deletedAt: null, farm: { userId: user.id, deletedAt: null } },
              ...(fieldId ? { fieldId } : {}),
              ...(status ? { status } : {}),
              deletedAt: null,
            },
    include: {
      crop: {
        include: { translations: true },
      },
      field: { select: { id: true, name: true, farm: { select: { id: true, name: true } } } },
      stages: { orderBy: { orderIndex: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const normalized = cycles.map((cycle) => ({
    ...cycle,
    crop: cycle.crop
      ? {
        ...cycle.crop,
        name: resolveCropName(cycle.crop, cycle.customCropName, user.preferredLanguage),
      }
      : null,
  }));

  return apiSuccess(normalized);
} catch (err) {
  console.error('[GET /api/v1/crop-cycles] Error:', err);
  return apiError('Unable to load crop cycles right now.', 'cycles_load_failed', 500);
}
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to start a crop cycle.', 'unauthorized', 401);

      const body = await req.json();
      const parsed = cycleSchema.parse(body);

      const [field, crop] = await Promise.all([
        prisma.field.findFirst({
          where: { id: parsed.fieldId, deletedAt: null, farm: { userId: user.id, deletedAt: null } },
        }),
        prisma.crop.findUnique({ where: { id: parsed.cropId } }),
      ]);

      if (!field) return apiError('Selected field was not found.', 'not_found', 404);
      if (!crop) return apiError('Selected crop was not found.', 'not_found', 404);

      const sowing = parsed.sowingDate ? new Date(parsed.sowingDate) : new Date();
      const expectedHarvest = parsed.expectedHarvestDate
        ? new Date(parsed.expectedHarvestDate)
        : crop.typicalDurationDays
          ? new Date(sowing.getTime() + crop.typicalDurationDays * 24 * 60 * 60 * 1000)
          : null;

      const cycle = await prisma.cropCycle.create({
        data: {
          fieldId: parsed.fieldId,
          cropId: parsed.cropId,
          varietyId: parsed.varietyId || null,
          customCropName: parsed.customCropName?.trim() || null,
          sowingDate: sowing,
          expectedHarvestDate: expectedHarvest,
          areaHa: parsed.areaHa || field.areaHa || null,
          irrigationType: parsed.irrigationType || field.irrigationType || null,
          seedInfo: parsed.seedInfo || null,
          notes: parsed.notes?.trim() || null,
          status: 'growing',
        },
      });

      const stages = await StageMaterializer.materialize(cycle.id, parsed.cropId, sowing);

      await prisma.field.update({
        where: { id: field.id },
        data: { status: 'active' },
      });

      return apiSuccess({ ...cycle, stages }, undefined, 201);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return apiError(err.issues[0]?.message || 'Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
      }
      console.error('[POST /api/v1/crop-cycles] Error:', err);
      return apiError('Failed to start crop cycle. Please try again.', 'create_failed', 400);
    }
  }
