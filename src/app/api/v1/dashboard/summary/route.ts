import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { resolveCropName } from '@/lib/units';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const [farmsCount, fieldsCount, activeCyclesCount, pendingTasksCount, recentTasks, recentFarms] =
      await Promise.all([
        prisma.farm.count({
          where: { userId: user.id, deletedAt: null },
        }),
        prisma.field.count({
          where: { farm: { userId: user.id, deletedAt: null }, deletedAt: null },
        }),
        prisma.cropCycle.count({
          where: {
            field: { deletedAt: null, farm: { userId: user.id, deletedAt: null } },
            status: { notIn: ['completed'] },
            deletedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            userId: user.id,
            status: 'pending',
            deletedAt: null,
          },
        }),
        prisma.task.findMany({
          where: { userId: user.id, status: 'pending', deletedAt: null },
          take: 5,
          orderBy: { dueAt: 'asc' },
          include: {
            farm: { select: { name: true } },
            field: { select: { name: true } },
          },
        }),
        prisma.farm.findMany({
          where: { userId: user.id, deletedAt: null },
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            fields: {
              where: { deletedAt: null },
              include: {
                cropCycles: {
                  where: { deletedAt: null, status: { notIn: ['completed'] } },
                  include: {
                    crop: { include: { translations: true } },
                    stages: { orderBy: { orderIndex: 'asc' } },
                  },
                },
              },
            },
          },
        }),
      ]);

    const normalizedFarms = recentFarms.map((farm) => ({
      ...farm,
      fields: farm.fields.map((field) => ({
        ...field,
        cropCycles: field.cropCycles.map((cycle) => ({
          ...cycle,
          crop: cycle.crop
            ? {
              ...cycle.crop,
              name: resolveCropName(cycle.crop, cycle.customCropName, user.preferredLanguage),
            }
            : null,
        })),
      })),
    }));

          return apiSuccess({
            userName: user.name,
            state: user.state,
            district: user.district,
            village: user.village,
            isDemo: user.isDemo,
            counts: {
              farms: farmsCount,
              fields: fieldsCount,
              activeCycles: activeCyclesCount,
              pendingTasks: pendingTasksCount,
            },
    tasks: recentTasks,
      farms: normalizedFarms,
    });
} catch (err) {
  console.error('[GET /api/v1/dashboard/summary] Error:', err);
  return apiError('Unable to load your dashboard right now.', 'dashboard_summary_failed', 500);
}
}
