import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { resolveCropName } from '@/lib/units';
import { StageMaterializer } from '@/services/StageMaterializer';
import { CropLifecycleEngine } from '@/services/CropLifecycleEngine';
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
        crop: { include: { translations: true } },
        variety: true,
        field: { select: { id: true, name: true, farm: { select: { id: true, name: true } } } },
        stages: {
          orderBy: { orderIndex: 'asc' },
          include: { templateStage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const normalized = cycles.map((cycle) => {
      const resolvedCropName = resolveCropName(cycle.crop, cycle.customCropName, user.preferredLanguage);
      const cropWithName = cycle.crop ? { ...cycle.crop, name: resolvedCropName } : null;
      const lifecycle = CropLifecycleEngine.buildLifecyclePlan({
        ...cycle,
        crop: cropWithName,
      });

      return {
        ...cycle,
        crop: cropWithName,
        lifecycle: {
          daysAfterSowing: lifecycle.daysAfterSowing,
          totalDurationDays: lifecycle.totalDurationDays,
          progressPct: lifecycle.progressPct,
          currentStageName: lifecycle.currentStage?.name || null,
          nextStageName: lifecycle.nextStage?.name || null,
          daysUntilNextStage: lifecycle.daysUntilNextStage,
          isApproximateTimeline: lifecycle.isApproximateTimeline,
        },
      };
    });

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
        include: { farm: true },
      }),
      prisma.crop.findUnique({
        where: { id: parsed.cropId },
        include: { translations: true },
      }),
    ]);

    if (!field) return apiError('Selected field was not found.', 'not_found', 404);
    if (!crop) return apiError('Selected crop was not found.', 'not_found', 404);

    let variety = null;
    if (parsed.varietyId) {
      variety = await prisma.cropVariety.findFirst({
        where: { id: parsed.varietyId, cropId: crop.id },
      });
    }

    const sowing = parsed.sowingDate ? new Date(parsed.sowingDate) : new Date();
    const durationDays = variety?.durationDays || crop.typicalDurationDays || 120;
    const expectedHarvest = parsed.expectedHarvestDate
      ? new Date(parsed.expectedHarvestDate)
      : new Date(sowing.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const cycle = await prisma.cropCycle.create({
      data: {
        fieldId: parsed.fieldId,
        cropId: parsed.cropId,
        varietyId: variety?.id || null,
        customCropName: parsed.customCropName?.trim() || null,
        sowingDate: sowing,
        expectedHarvestDate: expectedHarvest,
        expectedHarvestBasis: variety ? 'variety_duration' : 'estimate_from_master',
        areaHa: parsed.areaHa || field.areaHa || null,
        irrigationType: parsed.irrigationType || field.irrigationType || null,
        seedInfo: parsed.seedInfo || null,
        notes: parsed.notes?.trim() || null,
        status: sowing.getTime() > Date.now() ? 'planned' : 'growing',
      },
    });

    const stages = await StageMaterializer.materialize(cycle.id, parsed.cropId, sowing);

    await prisma.field.update({
      where: { id: field.id },
      data: { status: 'active' },
    });

    const cropName = resolveCropName(crop, parsed.customCropName, user.preferredLanguage);

    // Auto-generate stage-linked Tasks, ScheduledReminders & Notifications
    const automation = await CropLifecycleEngine.initializeTasksAndReminders({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userLocale: user.preferredLanguage,
      farmId: field.farmId,
      fieldId: field.id,
      fieldName: field.name,
      cropCycleId: cycle.id,
      cropName,
      sowingDate: sowing,
      stages,
    });

    const lifecycle = CropLifecycleEngine.buildLifecyclePlan({
      ...cycle,
      crop: { ...crop, name: cropName },
      variety,
      stages,
    });

    return apiSuccess({ ...cycle, stages, lifecycle, automation }, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(
        err.issues[0]?.message || 'Validation failed',
        'validation_failed',
        422,
        err.flatten().fieldErrors as any
      );
    }
    console.error('[POST /api/v1/crop-cycles] Error:', err);
    return apiError('Failed to start crop cycle. Please try again.', 'create_failed', 400);
  }
}
