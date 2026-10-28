import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const updateSchema = z.object({
  category: z
    .enum(['pest', 'disease', 'weed', 'nutrient_issue', 'irrigation_issue', 'growth_issue', 'general'])
    .optional(),
  severity: z.number().int().min(1).max(3).optional(),
  observedAt: z.string().optional(),
  notes: z.string().min(1).max(2000).optional(),
  stageSnapshot: z.string().max(200).optional(),
  photosJson: z.string().optional(),
  status: z.enum(['open', 'resolved', 'monitoring']).optional(),
});

// Helper: verify observation belongs to the requesting user
async function getOwnedObservation(id: string, userId: string) {
  return prisma.farmObservation.findFirst({
    where: { id, userId },
    include: {
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, crop: { select: { id: true, slug: true } } } },
    },
  });
}

// -----------------------------------------------------------------
// GET /api/v1/observations/[id]
// -----------------------------------------------------------------
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const observation = await getOwnedObservation(id, user.id);
  if (!observation) return apiError('Observation not found', 'not_found', 404);

  return apiSuccess(observation);
}

// -----------------------------------------------------------------
// PATCH /api/v1/observations/[id]
// -----------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const existing = await getOwnedObservation(id, user.id);
  if (!existing) return apiError('Observation not found', 'not_found', 404);

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    // Validate photosJson if supplied
    let photosJson: string | undefined = undefined;
    if (parsed.photosJson !== undefined) {
      try {
        const arr = JSON.parse(parsed.photosJson);
        if (!Array.isArray(arr)) throw new Error();
        photosJson = parsed.photosJson;
      } catch {
        return apiError('photosJson must be a valid JSON array', 'validation_failed', 422);
      }
    }

    const updated = await prisma.farmObservation.update({
      where: { id },
      data: {
        ...(parsed.category !== undefined ? { category: parsed.category } : {}),
        ...(parsed.severity !== undefined ? { severity: parsed.severity } : {}),
        ...(parsed.observedAt !== undefined ? { observedAt: new Date(parsed.observedAt) } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
        ...(parsed.stageSnapshot !== undefined ? { stageSnapshot: parsed.stageSnapshot } : {}),
        ...(photosJson !== undefined ? { photosJson } : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      },
      include: {
        field: { select: { id: true, name: true } },
        cropCycle: { select: { id: true, crop: { select: { id: true, slug: true } } } },
      },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    console.error('[observations/:id PATCH]', err);
    return apiError('Failed to update observation', 'update_failed', 500);
  }
}

// -----------------------------------------------------------------
// DELETE /api/v1/observations/[id]
// -----------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const existing = await getOwnedObservation(id, user.id);
  if (!existing) return apiError('Observation not found', 'not_found', 404);

  await prisma.farmObservation.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
