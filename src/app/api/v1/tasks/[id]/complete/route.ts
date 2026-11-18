import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';

  export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
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
    } catch (err) {
      console.error('[POST /api/v1/tasks/[id]/complete] Error:', err);
      return apiError('Failed to complete task.', 'complete_failed', 500);
    }
  }
