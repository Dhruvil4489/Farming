import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';
import { StoreService } from '@/services/StoreService';
import { z } from 'zod';

const checkoutSchema = z.object({
  deliveryName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  deliveryPhone: z.string().trim().min(10, 'Phone must be at least 10 digits'),
  deliveryAddress: z.string().trim().min(5, 'Address is required'),
  deliveryVillage: z.string().optional(),
  deliveryDistrict: z.string().trim().min(2, 'District is required'),
  deliveryState: z.string().optional(),
  deliveryPincode: z.string().trim().min(6, 'Valid 6-digit Pincode required'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return apiError('Please sign in to place an order.', 'unauthorized', 401);
    }

    const body = await req.json();
    const parsed = checkoutSchema.parse(body);

    const order = await StoreService.processCheckout(userId, parsed);

    return apiSuccess(order, { orderNumber: order.orderNumber }, 201);
  } catch (err: any) {
    console.error('Error in /api/v1/store/checkout:', err);
      if (err instanceof z.ZodError) {
        return apiError(err.issues[0]?.message || 'Validation failed', 'validation_error', 422);
      }
      return apiError(err.message || 'Checkout failed', 'checkout_error', 400);
    }
  }
