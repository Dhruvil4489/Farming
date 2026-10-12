import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';
import { StoreService } from '@/services/StoreService';

export async function GET() {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return apiError('User session required for cart', 'unauthorized', 401);
    }

    const cart = await StoreService.getCart(userId);
    return apiSuccess(cart);
  } catch (err: any) {
    console.error('Error in GET /api/v1/store/cart:', err);
    return apiError(err.message, 'cart_error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return apiError('User session required for cart', 'unauthorized', 401);
    }

    const body = await req.json();
    const { productId, quantity } = body;

    if (!productId) {
      return apiError('productId is required', 'bad_request', 400);
    }

    const item = await StoreService.addToCart(userId, productId, quantity || 1);
    const updatedCart = await StoreService.getCart(userId);

    return apiSuccess({ item, cart: updatedCart });
  } catch (err: any) {
    console.error('Error in POST /api/v1/store/cart:', err);
    return apiError(err.message, 'cart_add_error', 400);
  }
}
