import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';
import { StoreService } from '@/services/StoreService';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/EmailService';
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

    // Send order confirmation email & in-app notification
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, preferredLanguage: true },
    });
    await prisma.notification
      .create({
        data: {
          userId,
          type: 'order',
          titleKey: `Order Confirmed: ${order.orderNumber}`,
          bodyKey: `Your SmartFarm Store order of ₹${order.totalAmount} has been confirmed for delivery to ${parsed.deliveryDistrict}.`,
          paramsJson: JSON.stringify({ orderId: order.id, actionUrl: '/orders' }),
        },
      })
      .catch(() => {});

    if (buyer?.email) {
      await EmailService.sendTemplate({
        userId,
        toEmail: buyer.email,
        templateKey: 'order_confirmation',
        locale: (buyer.preferredLanguage as any) || 'en',
        isTransactional: true,
        dedupeKey: `order_confirm:${order.id}`,
        data: {
          name: buyer.name,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          deliveryAddress: `${parsed.deliveryAddress}, ${parsed.deliveryDistrict} - ${parsed.deliveryPincode}`,
          actionUrl: EmailService.getAppUrl('/orders'),
        },
      }).catch(() => {});
    }

    return apiSuccess(order, { orderNumber: order.orderNumber }, 201);
  } catch (err: any) {
    console.error('Error in /api/v1/store/checkout:', err);
      if (err instanceof z.ZodError) {
        return apiError(err.issues[0]?.message || 'Validation failed', 'validation_error', 422);
      }
      return apiError(err.message || 'Checkout failed', 'checkout_error', 400);
    }
  }
