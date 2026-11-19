import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { EmailService } from '@/services/EmailService';
import { z } from 'zod';

const DEFAULT_PREF_TYPES = [
  'crop_stage',
  'task',
  'irrigation',
  'weather',
  'disease',
  'order',
  'market',
  'security',
];

const updatePrefSchema = z.object({
  type: z.string().min(1),
  channel: z.enum(['in_app', 'email']),
  enabled: z.boolean(),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const [notifications, unreadCount, prefs, recentEmails] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
      prisma.notificationPreference.findMany({
        where: { userId: user.id },
      }),
      prisma.emailDeliveryLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          templateKey: true,
          subject: true,
          status: true,
          provider: true,
          sentAt: true,
          createdAt: true,
        },
      }),
    ]);

    // Build complete preference matrix (default enabled=true)
    const prefMap = new Map(prefs.map((p) => [`${p.type}:${p.channel}`, p.enabled]));
    const preferences = DEFAULT_PREF_TYPES.map((type) => ({
      type,
      in_app: prefMap.get(`${type}:in_app`) ?? true,
      email: prefMap.get(`${type}:email`) ?? true,
    }));

    return apiSuccess({
      notifications,
      unreadCount,
      preferences,
      recentEmails,
      emailProvider: EmailService.getProviderInfo(),
    });
  } catch (err) {
    console.error('[GET /api/v1/notifications] Error:', err);
    return apiError('Unable to load notifications.', 'notifications_failed', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const body = await req.json().catch(() => ({}));
    if (body?.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return apiSuccess({ markedAllRead: true });
    }

    if (body?.id) {
      await prisma.notification.updateMany({
        where: { id: String(body.id), userId: user.id },
        data: { readAt: new Date() },
      });
      return apiSuccess({ id: body.id, read: true });
    }

    return apiError('Provide notification id or markAllRead: true.', 'validation_failed', 422);
  } catch (err) {
    console.error('[PATCH /api/v1/notifications] Error:', err);
    return apiError('Could not update notification status.', 'update_failed', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const body = await req.json();
    const parsed = updatePrefSchema.parse(body);

    const updated = await prisma.notificationPreference.upsert({
      where: {
        userId_type_channel: {
          userId: user.id,
          type: parsed.type,
          channel: parsed.channel,
        },
      },
      update: { enabled: parsed.enabled },
      create: {
        userId: user.id,
        type: parsed.type,
        channel: parsed.channel,
        enabled: parsed.enabled,
      },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Invalid preference payload', 'validation_failed', 422);
    }
    console.error('[PUT /api/v1/notifications] Error:', err);
    return apiError('Could not save notification preference.', 'pref_save_failed', 500);
  }
}
