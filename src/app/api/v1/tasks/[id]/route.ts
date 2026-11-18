import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']).optional(),
  type: z
    .enum([
      'irrigation',
      'fertilizer',
      'scouting',
      'spraying',
      'sowing',
      'harvesting',
      'machinery',
      'labour',
      'custom',
    ])
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!existing) return apiError('Task not found', 'not_found', 404);

    const body = await req.json();
    const parsed = updateTaskSchema.parse(body);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(parsed.title ? { title: parsed.title } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.dueAt !== undefined ? { dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null } : {}),
        ...(parsed.priority ? { priority: parsed.priority } : {}),
        ...(parsed.type ? { type: parsed.type } : {}),
        ...(parsed.status
          ? {
              status: parsed.status,
              completedAt: parsed.status === 'completed' ? new Date() : null,
              completedBy: parsed.status === 'completed' ? user.id : null,
            }
          : {}),
      },
      include: {
        farm: { select: { id: true, name: true } },
        field: { select: { id: true, name: true } },
      },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Validation failed', 'validation_failed', 422);
    }
    console.error('[PATCH /api/v1/tasks/[id]] Error:', err);
    return apiError('Failed to update task.', 'update_failed', 400);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!existing) return apiError('Task not found', 'not_found', 404);

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ id, message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/v1/tasks/[id]] Error:', err);
    return apiError('Failed to delete task.', 'delete_failed', 500);
  }
}
