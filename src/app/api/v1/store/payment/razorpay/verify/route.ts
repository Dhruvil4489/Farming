import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';
import { StoreService } from '@/services/StoreService';
import { RazorpayService } from '@/services/RazorpayService';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/EmailService';
import { z } from 'zod';

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay order ID required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID required'),
  razorpaySignature: z.string().min(1, 'Payment signature required'),
  deliveryName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  deliveryPhone: z.string().trim().min(10, 'Phone must be at least 10 digits'),
  deliveryAddress: z.string().trim().min(5, 'Address is required'),
  deliveryVillage: z.string().optional(),
  deliveryDistrict: z.string().trim().min(2, 'District is required'),
  deliveryState: z.string().optional(),
  deliveryPincode: z.string().trim().min(6, 'Valid 6-digit Pincode required'),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return apiError('Please sign in to verify payment.', 'unauthorized', 401);
    }

    const body = await req.json();
    const parsed = verifyPaymentSchema.parse(body);

    // Cryptographic verification of payment signature
    const isValidSignature = RazorpayService.verifyPaymentSignature({
      razorpayOrderId: parsed.razorpayOrderId,
      razorpayPaymentId: parsed.razorpayPaymentId,
      razorpaySignature: parsed.razorpaySignature,
    });

    if (!isValidSignature) {
      return apiError(
        'Payment signature verification failed. The transaction authenticity could not be confirmed.',
        'payment_verification_failed',
        400
      );
    }

    // Process checkout transactionally
    const order = await StoreService.processCheckout(userId, {
      deliveryName: parsed.deliveryName,
      deliveryPhone: parsed.deliveryPhone,
      deliveryAddress: parsed.deliveryAddress,
      deliveryVillage: parsed.deliveryVillage,
      deliveryDistrict: parsed.deliveryDistrict,
      deliveryState: parsed.deliveryState || 'Gujarat',
      deliveryPincode: parsed.deliveryPincode,
      paymentMethod: 'online_razorpay',
      notes: parsed.notes
        ? `${parsed.notes} [Razorpay Payment ID: ${parsed.razorpayPaymentId}]`
        : `Razorpay Payment ID: ${parsed.razorpayPaymentId}`,
    });

    // Mark payment status as paid
    const confirmedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
        isDemoOrder: false,
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // In-app Notification
    await prisma.notification
      .create({
        data: {
          userId,
          type: 'order',
          titleKey: `Payment Verified: Order ${confirmedOrder.orderNumber}`,
          bodyKey: `Your payment of ₹${confirmedOrder.totalAmount} was verified successfully. Order is confirmed for dispatch.`,
          paramsJson: JSON.stringify({ orderId: confirmedOrder.id, actionUrl: '/orders' }),
        },
      })
      .catch(() => {});

    // Transactional confirmation email
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, preferredLanguage: true },
    });

    if (buyer?.email) {
      await EmailService.sendTemplate({
        userId,
        toEmail: buyer.email,
        templateKey: 'order_confirmation',
        locale: (buyer.preferredLanguage as any) || 'en',
        isTransactional: true,
        dedupeKey: `order_paid:${confirmedOrder.id}`,
        data: {
          name: buyer.name,
          orderNumber: confirmedOrder.orderNumber,
          totalAmount: confirmedOrder.totalAmount,
          deliveryAddress: `${parsed.deliveryAddress}, ${parsed.deliveryDistrict} - ${parsed.deliveryPincode}`,
          actionUrl: EmailService.getAppUrl('/orders'),
        },
      }).catch(() => {});
    }

    return apiSuccess(confirmedOrder, { orderNumber: confirmedOrder.orderNumber }, 201);
  } catch (err: any) {
    console.error('Error verifying Razorpay payment:', err);
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Validation failed', 'validation_error', 422);
    }
    return apiError(err.message || 'Payment verification failed', 'payment_error', 400);
  }
}
