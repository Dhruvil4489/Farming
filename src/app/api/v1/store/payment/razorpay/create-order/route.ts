import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';
import { StoreService } from '@/services/StoreService';
import { RazorpayService } from '@/services/RazorpayService';

export async function POST(req: NextRequest) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return apiError('Please sign in to proceed with payment.', 'unauthorized', 401);
    }

    if (!RazorpayService.isConfigured()) {
      return apiError(
        'Razorpay payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file or choose Cash on Delivery.',
        'payment_gateway_not_configured',
        400
      );
    }

    const cart = await StoreService.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      return apiError('Your cart is empty', 'empty_cart', 400);
    }

    // Verify in-stock
    for (const item of cart.items) {
      if (item.isOutOfStock) {
        return apiError(
          `Insufficient stock for "${item.product.name}". Available: ${item.stockAvailable}`,
          'insufficient_stock',
          400
        );
      }
    }

    const receipt = `rcpt_${Date.now()}_${userId.slice(0, 8)}`;
    const rzOrder = await RazorpayService.createOrder({
      amount: cart.total,
      currency: 'INR',
      receipt,
      notes: {
        userId,
        itemCount: String(cart.itemCount),
      },
    });

    return apiSuccess({
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: RazorpayService.getClientKeyId(),
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      total: cart.total,
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    return apiError(err.message || 'Payment initiation failed', 'payment_initiation_error', 500);
  }
}
