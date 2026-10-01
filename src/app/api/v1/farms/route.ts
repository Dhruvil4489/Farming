import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const farmSchema = z.object({
  name: z.string().min(2, 'Farm name must be at least 2 characters'),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  totalAreaHa: z.number().positive().optional(),
  areaInputValue: z.number().positive().optional(),
  areaInputUnit: z.enum(['acre', 'hectare', 'bigha', 'guntha']).optional(),
  farmType: z.enum(['irrigated', 'rainfed', 'mixed', 'orchard', 'greenhouse', 'other']).optional(),
  waterSources: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const farms = await prisma.farm.findMany({
    where: { userId: user.id, deletedAt: null },
    include: {
      fields: {
        where: { deletedAt: null },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess(farms);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  try {
    const body = await req.json();
    const parsed = farmSchema.parse(body);

    const farm = await prisma.farm.create({
      data: {
        userId: user.id,
        name: parsed.name,
        village: parsed.village || user.village || null,
        district: parsed.district || user.district || null,
        state: parsed.state || user.state || null,
        lat: parsed.lat || null,
        lng: parsed.lng || null,
        totalAreaHa: parsed.totalAreaHa || (parsed.areaInputValue ? parsed.areaInputValue * 0.404686 : null),
        areaInputValue: parsed.areaInputValue || null,
        areaInputUnit: parsed.areaInputUnit || 'acre',
        farmType: parsed.farmType || 'irrigated',
        waterSources: parsed.waterSources ? JSON.stringify(parsed.waterSources) : '[]',
        notes: parsed.notes || null,
      },
    });

    return apiSuccess(farm, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    return apiError('Failed to create farm', 'create_failed', 400);
  }
}
