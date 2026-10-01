import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const taskSchema = z.object({
  farmId: z.string().min(1, 'Farm ID is required'),
  fieldId: z.string().optional(),
  cropCycleId: z.string().optional(),
  type: z.enum(['irrigation', 'fertilizer', 'scouting', 'spraying', 'sowing', 'harvesting', 'machinery', 'labour', 'custom']).default('custom'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  dueAt: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const farmId = searchParams.get('farm_id');
  const fieldId = searchParams.get('field_id');
  const status = searchParams.get('status');

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
    orderBy: { dueAt: 'asc' },
  });

  return apiSuccess(tasks);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  try {
    const body = await req.json();
    const parsed = taskSchema.parse(body);

    const farm = await prisma.farm.findFirst({
      where: { id: parsed.farmId, userId: user.id, deletedAt: null },
    });
    if (!farm) return apiError('Farm not found or unowned', 'not_found', 404);

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        farmId: parsed.farmId,
        fieldId: parsed.fieldId || null,
        cropCycleId: parsed.cropCycleId || null,
        type: parsed.type,
        title: parsed.title,
        description: parsed.description || null,
        dueAt: parsed.dueAt ? new Date(parsed.dueAt) : new Date(),
        priority: parsed.priority,
        status: 'pending',
        source: 'manual',
      },
    });

    return apiSuccess(task, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    return apiError('Failed to create task', 'create_failed', 400);
  }
}
