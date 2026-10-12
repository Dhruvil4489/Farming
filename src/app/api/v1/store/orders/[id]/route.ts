import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';
import { StoreService } from '@/services/StoreService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getEffectiveUserId();
    const { id } = await params;

    const order = await StoreService.getOrderById(id, userId || undefined);
    if (!order) {
      return apiError('Order not found', 'not_found', 404);
    }

    return apiSuccess(order);
  } catch (err: any) {
    return apiError(err.message, 'order_detail_error', 500);
  }
}
