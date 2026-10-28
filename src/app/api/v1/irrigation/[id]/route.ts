import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const updateSchema = z.object({
  irrigatedAt: z.string().optional(),
  method: z.enum(['drip', 'sprinkler', 'flood', 'rainfed', 'other']).optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  volumeL: z.number().positive().max(1_000_000).optional(),
  waterSource: z.string().max(100).optional(),
  moistureNote: z.enum(['dry', 'moist', 'wet']).optional(),
  notes: z.string().max(2000).optional(),
});

// Helper: verify record belongs to the requesting user
async function getOwnedRecord(id: string, userId: string) {
  return prisma.irrigationRecord.findFirst({
    where: { id, userId },
    include: {
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, crop: { select: { id: true, slug: true } } } },
    },
  });
}

// -----------------------------------------------------------------
// GET /api/v1/irrigation/[id]
// -----------------------------------------------------------------
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const record = await getOwnedRecord(id, user.id);
  if (!record) return apiError('Irrigation record not found', 'not_found', 404);

  return apiSuccess(record);
}

// -----------------------------------------------------------------
// PATCH /api/v1/irrigation/[id]
// -----------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const existing = await getOwnedRecord(id, user.id);
  if (!existing) return apiError('Irrigation record not found', 'not_found', 404);

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const updated = await prisma.irrigationRecord.update({
      where: { id },
      data: {
        ...(parsed.irrigatedAt !== undefined ? { irrigatedAt: new Date(parsed.irrigatedAt) } : {}),
        ...(parsed.method !== undefined ? { method: parsed.method } : {}),
        ...(parsed.durationMinutes !== undefined ? { durationMinutes: parsed.durationMinutes } : {}),
        ...(parsed.volumeL !== undefined ? { volumeL: parsed.volumeL } : {}),
        ...(parsed.waterSource !== undefined ? { waterSource: parsed.waterSource } : {}),
        ...(parsed.moistureNote !== undefined ? { moistureNote: parsed.moistureNote } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
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
    console.error('[irrigation/:id PATCH]', err);
    return apiError('Failed to update irrigation record', 'update_failed', 500);
  }
}

// -----------------------------------------------------------------
// DELETE /api/v1/irrigation/[id]
// -----------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const existing = await getOwnedRecord(id, user.id);
  if (!existing) return apiError('Irrigation record not found', 'not_found', 404);

  await prisma.irrigationRecord.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
