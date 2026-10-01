import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });

  if (!task) return apiError('Task not found', 'not_found', 404);

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      completedBy: user.id,
    },
  });

  return apiSuccess(updated);
}
