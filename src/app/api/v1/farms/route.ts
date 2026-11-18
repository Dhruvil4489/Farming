import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { toHectares } from '@/lib/units';
import { z } from 'zod';

const farmSchema = z.object({
  name: z.string().trim().min(2, 'Farm name must be at least 2 characters'),
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
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to view your farms.', 'unauthorized', 401);

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
} catch (err) {
  console.error('[GET /api/v1/farms] Error:', err);
  return apiError('Unable to load your farms right now.', 'farms_load_failed', 500);
}
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in to add a farm.', 'unauthorized', 401);

      const body = await req.json();
      const parsed = farmSchema.parse(body);

      const unit = parsed.areaInputUnit || 'acre';
      const computedHa = parsed.totalAreaHa ?? toHectares(parsed.areaInputValue, unit);

      const farm = await prisma.farm.create({
        data: {
          userId: user.id,
          name: parsed.name,
          village: parsed.village?.trim() || user.village || null,
          district: parsed.district?.trim() || user.district || null,
          state: parsed.state?.trim() || user.state || null,
          lat: parsed.lat ?? null,
          lng: parsed.lng ?? null,
          totalAreaHa: computedHa,
          areaInputValue: parsed.areaInputValue ?? null,
          areaInputUnit: unit,
          farmType: parsed.farmType || 'irrigated',
          waterSources: parsed.waterSources ? JSON.stringify(parsed.waterSources) : '[]',
          notes: parsed.notes?.trim() || null,
        },
      });

      return apiSuccess(farm, undefined, 201);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const firstMsg = err.issues[0]?.message || 'Please check the farm details.';
        return apiError(firstMsg, 'validation_failed', 422, err.flatten().fieldErrors as any);
      }
      console.error('[POST /api/v1/farms] Error:', err);
      return apiError('Could not save this farm. Please try again.', 'create_failed', 400);
    }
  }
