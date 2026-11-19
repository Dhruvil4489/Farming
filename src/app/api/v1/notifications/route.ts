import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { EmailService } from '@/services/EmailService';
import { ReminderSchedulerService, translateNotificationText } from '@/services/ReminderSchedulerService';
import { z } from 'zod';

const DEFAULT_PREF_TYPES = [
  'crop_stage',
  'task',
  'irrigation',
  'fertilizer',
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

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const url = new URL(req.url);
    const langParam = url.searchParams.get('lang');
    const cookieLocale = req.cookies.get('locale')?.value;
    const locale = (langParam || cookieLocale || user.preferredLanguage || 'en') as 'en' | 'hi' | 'gu';

    // 1. Run dynamic crop activity scanner and due reminder processor in background
    try {
      await ReminderSchedulerService.scanAndGenerateCropNotifications(user.id);
      await ReminderSchedulerService.processDueReminders({ userId: user.id });
    } catch (scanErr) {
      console.warn('[GET /api/v1/notifications] Background scanner notice:', scanErr);
    }

    // 2. Fetch notifications, unread count, preferences, recent delivery logs
    const [rawNotifications, unreadCount, prefs, recentEmails] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 60,
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

    // 3. Multilingual localization mapping
    const notifications = rawNotifications.map((n) => {
      let title = n.titleKey;
      let body = n.bodyKey;
      let category = n.type;
      let actionUrl = '';
      let cropName = '';
      let fieldName = '';

      try {
        const p = JSON.parse(n.paramsJson || '{}');
        if (p.translations && p.translations[locale]) {
          title = p.translations[locale].title || title;
          body = p.translations[locale].body || body;
        } else if (locale !== 'en') {
          title = translateNotificationText(title, locale);
          body = translateNotificationText(body, locale);
        }
        if (p.category) category = p.category;
        if (p.actionUrl) actionUrl = p.actionUrl;
        if (p.cropName) cropName = p.cropName;
        if (p.fieldName) fieldName = p.fieldName;
      } catch {
        if (locale !== 'en') {
          title = translateNotificationText(title, locale);
          body = translateNotificationText(body, locale);
        }
      }

      return {
        id: n.id,
        userId: n.userId,
        type: n.type,
        category,
        title,
        body,
        actionUrl,
        cropName,
        fieldName,
        readAt: n.readAt,
        createdAt: n.createdAt,
      };
    });

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
      locale,
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

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const all = url.searchParams.get('all') === 'true';
    const readOnly = url.searchParams.get('readOnly') === 'true';

    // 1. Delete all notifications
    if (all) {
      const res = await prisma.notification.deleteMany({
        where: { userId: user.id },
      });
      return apiSuccess({ deletedCount: res.count, all: true });
    }

    // 2. Delete all read notifications
    if (readOnly) {
      const res = await prisma.notification.deleteMany({
        where: { userId: user.id, readAt: { not: null } },
      });
      return apiSuccess({ deletedCount: res.count, readOnly: true });
    }

    // 3. Delete single notification by URL param
    if (id) {
      const res = await prisma.notification.deleteMany({
        where: { id, userId: user.id },
      });
      return apiSuccess({ id, deleted: res.count > 0 });
    }

    // 4. Also check JSON body if URL params not provided
    const body = await req.json().catch(() => ({}));
    if (body?.all) {
      const res = await prisma.notification.deleteMany({
        where: { userId: user.id },
      });
      return apiSuccess({ deletedCount: res.count, all: true });
    }
    if (body?.readOnly) {
      const res = await prisma.notification.deleteMany({
        where: { userId: user.id, readAt: { not: null } },
      });
      return apiSuccess({ deletedCount: res.count, readOnly: true });
    }
    if (body?.id) {
      const res = await prisma.notification.deleteMany({
        where: { id: String(body.id), userId: user.id },
      });
      return apiSuccess({ id: body.id, deleted: res.count > 0 });
    }

    return apiError('Provide notification id or all: true to delete.', 'validation_failed', 422);
  } catch (err) {
    console.error('[DELETE /api/v1/notifications] Error:', err);
    return apiError('Could not delete notification.', 'delete_failed', 500);
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
