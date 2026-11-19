import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { toHectares, resolveCropName } from '@/lib/units';
import { areaInputValueSchema, areaInputUnitSchema, normalizeAreaUnit } from '@/lib/area-validation';
import { StageMaterializer } from '@/services/StageMaterializer';
import { z } from 'zod';

const fieldSchema = z.object({
  farmId: z.string().min(1, 'Please select a farm'),
  name: z.string().trim().min(2, 'Crop name must be at least 2 characters'),
  areaHa: z.number().positive().optional(),
  areaInputValue: areaInputValueSchema,
  areaInputUnit: areaInputUnitSchema,
  areaSource: z.enum(['manual', 'computed']).default('manual'),
  boundaryGeoJson: z.string().optional(),
  centroidLat: z.number().optional(),
  centroidLng: z.number().optional(),
  irrigationType: z.enum(['drip', 'sprinkler', 'flood', 'rainfed', 'other', 'unknown']).optional(),
  soilType: z.enum(['sandy', 'loamy', 'clay', 'black', 'red', 'alluvial', 'other', 'unknown']).optional(),
  status: z.enum(['empty', 'planned', 'active', 'fallow']).default('empty'),
  notes: z.string().optional(),
  // Optional crop info if provided programmatically (removed from Add Field UI per Phase 4)
  cropId: z.string().optional(),
  customCropName: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to view your fields.', 'unauthorized', 401);

    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get('farm_id');

          const fields = await prisma.field.findMany({
            where: {
              farm: { userId: user.id, deletedAt: null },
              ...(farmId ? { farmId } : {}),
              deletedAt: null,
            },
                  include: {
                    farm: {
                      select: {
                        id: true,
                        name: true,
                        village: true,
                        district: true,
                        state: true,
                        lat: true,
                        lng: true,
                      },
                    },
                      cropCycles: {
                        where: { deletedAt: null, status: { notIn: ['completed'] } },
                        include: {
                          crop: {
                            include: { translations: true },
                          },
                          variety: true,
                          stages: {
                            orderBy: { orderIndex: 'asc' },
                          },
                        },
                        orderBy: { createdAt: 'desc' },
                      },
                      diagnoses: {
                        where: { deletedAt: null },
                        orderBy: { diagnosedAt: 'desc' },
                        take: 3,
                        select: {
                          id: true,
                          cropName: true,
                          diseaseName: true,
                          severity: true,
                          isHealthy: true,
                          diagnosedAt: true,
                        },
                      },
                    },
          orderBy: { createdAt: 'desc' },
        });

    // Normalize crop names and current stage snapshot for consistent UI consumption
    const normalized = fields.map((field) => ({
      ...field,
      cropCycles: field.cropCycles.map((cycle) => {
        const currentStage =
          cycle.stages.find((s) => s.status === 'current') || cycle.stages[0] || null;
        return {
          ...cycle,
          crop: cycle.crop
            ? {
              ...cycle.crop,
              name: resolveCropName(cycle.crop, cycle.customCropName, user.preferredLanguage),
            }
            : null,
          currentStageName: currentStage?.nameSnapshot || null,
        };
      }),
    }));

    return apiSuccess(normalized);
  } catch (err) {
    console.error('[GET /api/v1/fields] Error:', err);
    return apiError(
      'Unable to load your fields right now. Please try again.',
      'fields_load_failed',
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to add a field.', 'unauthorized', 401);

      const body = await req.json();
      const parsed = fieldSchema.parse(body);

      const farm = await prisma.farm.findFirst({
        where: { id: parsed.farmId, userId: user.id, deletedAt: null },
      });
      if (!farm) return apiError('Selected farm was not found.', 'not_found', 404);

      const unit = normalizeAreaUnit(parsed.areaInputUnit);
      const areaVal = parsed.areaInputValue ?? null;
      const computedAreaHa =
        parsed.areaHa ?? (areaVal != null ? toHectares(areaVal, unit) : null);

      const hasInitialCrop = Boolean(parsed.cropId && parsed.cropId.trim());

      const field = await prisma.field.create({
        data: {
          farmId: parsed.farmId,
          name: parsed.name,
          areaHa: computedAreaHa,
          areaInputValue: areaVal,
          areaInputUnit: unit,
          areaSource: parsed.areaSource,
          boundaryGeoJson: parsed.boundaryGeoJson || null,
          centroidLat: parsed.centroidLat ?? farm.lat ?? null,
          centroidLng: parsed.centroidLng ?? farm.lng ?? null,
          irrigationType: parsed.irrigationType || 'drip',
          soilType: parsed.soilType || 'unknown',
          status: hasInitialCrop ? 'active' : parsed.status,
          notes: parsed.notes?.trim() || null,
        },
        include: {
          farm: {
            select: { id: true, name: true, village: true, district: true, state: true },
          },
        },
      });

      // Optional initial crop cycle if farmer chose a crop during creation
      if (hasInitialCrop && parsed.cropId) {
        const cropExists = await prisma.crop.findUnique({ where: { id: parsed.cropId } });
        if (cropExists) {
          const sowing = new Date();
          const cycle = await prisma.cropCycle.create({
            data: {
              fieldId: field.id,
              cropId: cropExists.id,
              customCropName: parsed.customCropName?.trim() || null,
              sowingDate: sowing,
              areaHa: computedAreaHa,
              irrigationType: field.irrigationType,
              status: 'growing',
            },
          });
          await StageMaterializer.materialize(cycle.id, cropExists.id, sowing).catch(() => { });
        }
      }

      return apiSuccess(field, undefined, 201);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const firstMsg = err.issues[0]?.message || 'Please check the entered field details.';
        return apiError(firstMsg, 'validation_failed', 422, err.flatten().fieldErrors as any);
      }
      console.error('[POST /api/v1/fields] Error:', err);
      return apiError('Could not save this field. Please try again.', 'create_failed', 400);
    }
  }
