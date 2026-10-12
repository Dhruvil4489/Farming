import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';
import { StoreService } from '@/services/StoreService';

export async function GET() {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) return apiError('User session required to view orders', 'unauthorized', 401);

    const orders = await StoreService.getUserOrders(userId);
    return apiSuccess(orders, { total: orders.length });
  } catch (err: any) {
    console.error('Error in /api/v1/store/orders:', err);
    return apiError(err.message, 'orders_fetch_error', 500);
  }
}
