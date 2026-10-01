import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const farmsCount = await prisma.farm.count({
    where: { userId: user.id, deletedAt: null },
  });

  const fieldsCount = await prisma.field.count({
    where: { farm: { userId: user.id }, deletedAt: null },
  });

  const activeCyclesCount = await prisma.cropCycle.count({
    where: {
      field: { farm: { userId: user.id } },
      status: { notIn: ['completed'] },
      deletedAt: null,
    },
  });

  const pendingTasksCount = await prisma.task.count({
    where: {
      userId: user.id,
      status: 'pending',
      deletedAt: null,
    },
  });

  const recentTasks = await prisma.task.findMany({
    where: { userId: user.id, deletedAt: null },
    take: 5,
    orderBy: { dueAt: 'asc' },
    include: {
      farm: { select: { name: true } },
      field: { select: { name: true } },
    },
  });

  const recentFarms = await prisma.farm.findMany({
    where: { userId: user.id, deletedAt: null },
    take: 3,
    include: {
      fields: {
        where: { deletedAt: null },
        include: {
          cropCycles: {
            where: { deletedAt: null, status: { notIn: ['completed'] } },
            include: { crop: true, stages: true },
          },
        },
      },
    },
  });

  return apiSuccess({
    userName: user.name,
    isDemo: user.isDemo,
    counts: {
      farms: farmsCount,
      fields: fieldsCount,
      activeCycles: activeCyclesCount,
      pendingTasks: pendingTasksCount,
    },
    tasks: recentTasks,
    farms: recentFarms,
  });
}
