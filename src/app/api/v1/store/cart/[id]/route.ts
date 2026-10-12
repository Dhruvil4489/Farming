import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';
import { StoreService } from '@/services/StoreService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) return apiError('Unauthorized', 'unauthorized', 401);

    const { id } = await params;
    const body = await req.json();
    const { quantity } = body;

    if (quantity === undefined) {
      return apiError('quantity is required', 'bad_request', 400);
    }

    await StoreService.updateCartQuantity(userId, id, Number(quantity));
    const updatedCart = await StoreService.getCart(userId);

    return apiSuccess(updatedCart);
  } catch (err: any) {
    return apiError(err.message, 'cart_update_error', 400);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) return apiError('Unauthorized', 'unauthorized', 401);

    const { id } = await params;
    await StoreService.removeFromCart(userId, id);
    const updatedCart = await StoreService.getCart(userId);

    return apiSuccess(updatedCart);
  } catch (err: any) {
    return apiError(err.message, 'cart_delete_error', 400);
  }
}
