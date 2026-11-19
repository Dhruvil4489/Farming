import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { toHectares, resolveCropName } from '@/lib/units';
import { areaInputValueSchema, areaInputUnitSchema, normalizeAreaUnit } from '@/lib/area-validation';
import { z } from 'zod';

  const updateFarmSchema = z.object({
    name: z.string().trim().min(2, 'Farm name must be at least 2 characters').optional(),
    village: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
    areaInputValue: areaInputValueSchema,
    areaInputUnit: areaInputUnitSchema,
    farmType: z.enum(['irrigated', 'rainfed', 'mixed', 'orchard', 'greenhouse', 'other']).optional(),
    notes: z.string().nullable().optional(),
  });

            export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = await getAuthenticatedUser();
      if(!user) return apiError('Unauthorized', 'unauthorized', 401);

      const { id } = await params;
      const farm = await prisma.farm.findFirst({
        where: { id, userId: user.id, deletedAt: null },
        include: {
          fields: {
            where: { deletedAt: null },
            include: {
              cropCycles: {
                where: { deletedAt: null },
                include: {
                  crop: { include: { translations: true } },
                  stages: { orderBy: { orderIndex: 'asc' } },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
});

if (!farm) return apiError('Farm not found', 'not_found', 404);

const normalized = {
  ...farm,
  fields: farm.fields.map((f) => ({
    ...f,
    cropCycles: f.cropCycles.map((c) => ({
      ...c,
      crop: c.crop
        ? { ...c.crop, name: resolveCropName(c.crop, c.customCropName, user.preferredLanguage) }
        : null,
    })),
  })),
};

return apiSuccess(normalized);
  } catch (err) {
  console.error('[GET /api/v1/farms/[id]] Error:', err);
  return apiError('Unable to load farm details.', 'farm_detail_failed', 500);
}
}

  async function handleUpdate(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = await getAuthenticatedUser();
      if (!user) return apiError('Unauthorized', 'unauthorized', 401);

      const { id } = await params;
      const existing = await prisma.farm.findFirst({
        where: { id, userId: user.id, deletedAt: null },
      });
      if (!existing) return apiError('Farm not found', 'not_found', 404);

        const body = await req.json();
        const parsed = updateFarmSchema.parse(body);

        const nextUnit = normalizeAreaUnit(parsed.areaInputUnit || existing.areaInputUnit);
        const nextValue =
          parsed.areaInputValue !== undefined ? parsed.areaInputValue : existing.areaInputValue;
        const nextHa =
          parsed.areaInputValue !== undefined || parsed.areaInputUnit !== undefined
            ? nextValue != null
              ? toHectares(nextValue, nextUnit)
              : null
            : existing.totalAreaHa;

        const updated = await prisma.farm.update({
          where: { id },
          data: {
            ...(parsed.name ? { name: parsed.name } : {}),
            ...(parsed.village !== undefined ? { village: parsed.village } : {}),
            ...(parsed.district !== undefined ? { district: parsed.district } : {}),
            ...(parsed.state !== undefined ? { state: parsed.state } : {}),
            ...(parsed.lat !== undefined ? { lat: parsed.lat } : {}),
            ...(parsed.lng !== undefined ? { lng: parsed.lng } : {}),
            areaInputValue: nextValue,
            areaInputUnit: nextUnit,
            totalAreaHa: nextHa,
            ...(parsed.farmType !== undefined ? { farmType: parsed.farmType } : {}),
            ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
          },
        });

        return apiSuccess(updated);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return apiError(err.issues[0]?.message || 'Validation failed', 'validation_failed', 422);
        }
        console.error('[PATCH /api/v1/farms/[id]] Error:', err);
        return apiError('Failed to update farm', 'update_failed', 400);
      }
    }

      export const PUT = handleUpdate;
      export const PATCH = handleUpdate;

      export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        try {
          const user = await getAuthenticatedUser();
          if (!user) return apiError('Unauthorized', 'unauthorized', 401);

          const { id } = await params;
          const existing = await prisma.farm.findFirst({
            where: { id, userId: user.id, deletedAt: null },
            include: { fields: { select: { id: true } } },
          });
          if (!existing) return apiError('Farm not found', 'not_found', 404);

          const now = new Date();
          const fieldIds = existing.fields.map((f) => f.id);

          await prisma.$transaction([
            ...(fieldIds.length > 0
              ? [
                prisma.cropCycle.updateMany({
                  where: { fieldId: { in: fieldIds }, deletedAt: null },
                  data: { deletedAt: now },
                }),
                prisma.field.updateMany({
                  where: { id: { in: fieldIds }, deletedAt: null },
                  data: { deletedAt: now },
                }),
              ]
              : []),
            prisma.farm.update({
              where: { id },
              data: { deletedAt: now },
            }),
          ]);

          return apiSuccess({ message: 'Farm deleted successfully' });
        } catch (err) {
          console.error('[DELETE /api/v1/farms/[id]] Error:', err);
          return apiError('Failed to delete farm', 'delete_failed', 500);
        }
      }
