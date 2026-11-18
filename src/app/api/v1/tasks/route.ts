import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const taskSchema = z.object({
  farmId: z.string().min(1, 'Please select a farm'),
  fieldId: z.string().optional(),
  cropCycleId: z.string().optional(),
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
    .default('custom'),
  title: z.string().trim().min(2, 'Task title must be at least 2 characters'),
  description: z.string().optional(),
  dueAt: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get('farm_id');
    const fieldId = searchParams.get('field_id');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100) : 100;

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        ...(farmId ? { farmId } : {}),
        ...(fieldId ? { fieldId } : {}),
        ...(status ? { status } : {}),
        deletedAt: null,
      },
      include: {
        farm: { select: { id: true, name: true } },
        field: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
      take: limit,
    });

    return apiSuccess(tasks);
  } catch (err) {
    console.error('[GET /api/v1/tasks] Error:', err);
    return apiError('Unable to load tasks right now.', 'tasks_load_failed', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

      const body = await req.json();
      const parsed = taskSchema.parse(body);

      const farm = await prisma.farm.findFirst({
        where: { id: parsed.farmId, userId: user.id, deletedAt: null },
      });
      if (!farm) return apiError('Selected farm not found.', 'not_found', 404);

      if (parsed.fieldId) {
        const ownedField = await prisma.field.findFirst({
          where: { id: parsed.fieldId, farmId: farm.id, deletedAt: null },
        });
        if (!ownedField) return apiError('Selected field does not belong to this farm.', 'not_found', 404);
      }

      if (parsed.cropCycleId) {
        const ownedCycle = await prisma.cropCycle.findFirst({
          where: { id: parsed.cropCycleId, field: { farm: { userId: user.id } }, deletedAt: null },
        });
        if (!ownedCycle) return apiError('Selected crop cycle not found.', 'not_found', 404);
      }

      const task = await prisma.task.create({
        data: {
          userId: user.id,
          farmId: parsed.farmId,
          fieldId: parsed.fieldId || null,
          cropCycleId: parsed.cropCycleId || null,
          type: parsed.type,
          title: parsed.title,
          description: parsed.description?.trim() || null,
          dueAt: parsed.dueAt ? new Date(parsed.dueAt) : new Date(),
          priority: parsed.priority,
          status: 'pending',
          source: 'manual',
        },
        include: {
          farm: { select: { id: true, name: true } },
          field: { select: { id: true, name: true } },
        },
      });

      return apiSuccess(task, undefined, 201);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return apiError(err.issues[0]?.message || 'Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
      }
      console.error('[POST /api/v1/tasks] Error:', err);
      return apiError('Failed to create task.', 'create_failed', 400);
    }
  }
