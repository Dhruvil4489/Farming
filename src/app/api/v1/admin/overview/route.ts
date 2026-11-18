import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) return { error: apiError('Authentication required', 'unauthorized', 401) };
  const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');
  if (!isAdmin) return { error: apiError('Administrator access required', 'forbidden', 403) };
  return { user };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const [totalFarmers, totalFarms, totalFields, totalOrders, totalProducts, orders] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.farm.count({ where: { deletedAt: null } }),
        prisma.field.count({ where: { deletedAt: null } }),
        prisma.order.count(),
        prisma.product.count({ where: { isAvailable: true } }),
        prisma.order.findMany({
          take: 25,
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        }),
      ]);

    return apiSuccess({
      counts: {
        farmers: totalFarmers,
        farms: totalFarms,
        fields: totalFields,
        orders: totalOrders,
        products: totalProducts,
      },
      databaseProvider: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'SQLite',
      weatherProvider: process.env.WEATHER_PROVIDER || 'demo',
      orders,
    });
  } catch (err) {
    console.error('[GET /api/v1/admin/overview] Error:', err);
    return apiError('Unable to load admin overview.', 'admin_overview_error', 500);
  }
}

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();
    const parsed = updateOrderStatusSchema.parse(body);

    const updated = await prisma.order.update({
      where: { id: parsed.orderId },
      data: { status: parsed.status },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Invalid status update', 'validation_failed', 422);
    }
    console.error('[PATCH /api/v1/admin/overview] Error:', err);
    return apiError('Failed to update order status.', 'order_update_failed', 400);
  }
}
