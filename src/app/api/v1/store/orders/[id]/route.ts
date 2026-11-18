import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getAuthenticatedUser } from '@/lib/auth';
import { StoreService } from '@/services/StoreService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Please sign in to view order details.', 'unauthorized', 401);
    }

    const { id } = await params;
    const isAdmin = user.roles.some((ur) => ur.role.name === 'ADMIN');

    // Enforce strict tenant isolation: farmers can ONLY read their own orders; admins can inspect any order
    const order = await StoreService.getOrderById(id, isAdmin ? undefined : user.id);
    if (!order) {
      return apiError('Order not found', 'not_found', 404);
    }

    return apiSuccess(order);
  } catch (err: any) {
    console.error('[GET /api/v1/store/orders/[id]] Error:', err);
    return apiError('Unable to load order details.', 'order_detail_error', 500);
  }
}
