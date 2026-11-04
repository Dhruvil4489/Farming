import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const fieldSchema = z.object({
  farmId: z.string().min(1, 'Farm ID is required'),
  name: z.string().min(2, 'Field name must be at least 2 characters'),
  areaHa: z.number().positive().optional(),
  areaSource: z.enum(['manual', 'computed']).default('manual'),
  boundaryGeoJson: z.string().optional(),
  centroidLat: z.number().optional(),
  centroidLng: z.number().optional(),
  irrigationType: z.enum(['drip', 'sprinkler', 'flood', 'rainfed', 'other', 'unknown']).optional(),
  soilType: z.enum(['sandy', 'loamy', 'clay', 'black', 'red', 'alluvial', 'other', 'unknown']).optional(),
  status: z.enum(['empty', 'planned', 'active', 'fallow']).default('empty'),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const farmId = searchParams.get('farm_id');

  const fields = await prisma.field.findMany({
    where: {
      farm: { userId: user.id },
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
          crop: true,
          variety: true,
          cycleStages: {
            where: { status: 'current' },
            take: 1,
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

  return apiSuccess(fields);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  try {
    const body = await req.json();
    const parsed = fieldSchema.parse(body);

    const farm = await prisma.farm.findFirst({
      where: { id: parsed.farmId, userId: user.id, deletedAt: null },
    });
    if (!farm) return apiError('Farm not found or unowned', 'not_found', 404);

    const field = await prisma.field.create({
      data: {
        farmId: parsed.farmId,
        name: parsed.name,
        areaHa: parsed.areaHa || null,
        areaSource: parsed.areaSource,
        boundaryGeoJson: parsed.boundaryGeoJson || null,
        centroidLat: parsed.centroidLat || farm.lat || null,
        centroidLng: parsed.centroidLng || farm.lng || null,
        irrigationType: parsed.irrigationType || 'drip',
        soilType: parsed.soilType || 'unknown',
        status: parsed.status,
        notes: parsed.notes || null,
      },
    });

    return apiSuccess(field, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    return apiError('Failed to create field', 'create_failed', 400);
  }
}
