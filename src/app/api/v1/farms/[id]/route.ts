import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const farm = await prisma.farm.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: {
      fields: {
        where: { deletedAt: null },
        include: {
          cropCycles: {
            where: { deletedAt: null },
            include: { crop: true, stages: true },
          },
        },
      },
    },
  });

  if (!farm) return apiError('Farm not found', 'not_found', 404);
  return apiSuccess(farm);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const existing = await prisma.farm.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!existing) return apiError('Farm not found', 'not_found', 404);

  try {
    const body = await req.json();
    const updated = await prisma.farm.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.village !== undefined ? { village: body.village } : {}),
        ...(body.district !== undefined ? { district: body.district } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.lat !== undefined ? { lat: body.lat } : {}),
        ...(body.lng !== undefined ? { lng: body.lng } : {}),
        ...(body.areaInputValue !== undefined ? { areaInputValue: body.areaInputValue } : {}),
        ...(body.areaInputUnit !== undefined ? { areaInputUnit: body.areaInputUnit } : {}),
        ...(body.farmType !== undefined ? { farmType: body.farmType } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
    });

    return apiSuccess(updated);
  } catch (err) {
    return apiError('Failed to update farm', 'update_failed', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const existing = await prisma.farm.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!existing) return apiError('Farm not found', 'not_found', 404);

  await prisma.farm.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return apiSuccess({ message: 'Farm soft-deleted successfully' });
}
