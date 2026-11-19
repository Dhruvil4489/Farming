import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || !rawBody.type || !rawBody.data) {
      return apiError('Invalid webhook payload', 'invalid_payload', 400);
    }

    const { type, data } = rawBody;
    const emailId = data.email_id || data.id;

    if (!emailId) {
      return apiSuccess({ received: true, updated: false, reason: 'No email_id' });
    }

    const nowIso = new Date().toISOString();

    if (type === 'email.delivered') {
      await prisma.$executeRawUnsafe(
        `UPDATE "EmailDeliveryLog"
         SET "status" = 'delivered',
             "deliveryStatus" = 'delivered',
             "updatedAt" = ?
         WHERE "providerMessageId" = ?`,
        nowIso,
        emailId
      );
    } else if (type === 'email.bounced') {
      await prisma.$executeRawUnsafe(
        `UPDATE "EmailDeliveryLog"
         SET "status" = 'bounced',
             "deliveryStatus" = 'bounced',
             "bounceStatus" = 'hard_bounce',
             "errorMessage" = ?,
             "updatedAt" = ?
         WHERE "providerMessageId" = ?`,
        data.bounce_message || 'Email bounced by recipient server',
        nowIso,
        emailId
      );
    } else if (type === 'email.complained') {
      await prisma.$executeRawUnsafe(
        `UPDATE "EmailDeliveryLog"
         SET "status" = 'bounced',
             "deliveryStatus" = 'bounced',
             "bounceStatus" = 'complained',
             "errorMessage" = 'Recipient marked as spam/complained',
             "updatedAt" = ?
         WHERE "providerMessageId" = ?`,
        nowIso,
        emailId
      );
    }

    return apiSuccess({ received: true, type, emailId });
  } catch (err: any) {
    console.error('[POST /api/v1/webhooks/resend] Webhook error:', err?.message);
    return apiError('Webhook processing error', 'webhook_error', 500);
  }
}
