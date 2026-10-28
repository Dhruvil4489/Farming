/**
 * GET/POST /api/v1/iot/alerts
 *
 * Manages IoT irrigation advisory alerts stored as Notification records.
 * - GET: Returns unread + recent IoT-related notifications for the farmer.
 * - POST: Creates an advisory notification or acknowledges/dismisses one.
 *
 * Uses the existing Notification model (type: 'irrigation').
 * User actions are persisted server-side, not session-only.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // 'unread' | 'read' | 'all'
    const limitStr = searchParams.get('limit');
    const limit = Math.min(parseInt(limitStr || '20', 10) || 20, 100);

    const where: any = {
      userId: user.id,
      type: 'irrigation',
    };
    if (status === 'unread') where.readAt = null;
    if (status === 'read') where.readAt = { not: null };

    const alerts = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, type: 'irrigation', readAt: null },
    });

    return apiSuccess({
      alerts: alerts.map((a) => ({
        id: a.id,
        ruleId: a.titleKey,
        title: a.bodyKey,
        detailsJson: a.paramsJson,
        isRead: a.readAt != null,
        readAt: a.readAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error: any) {
    console.error('[API /api/v1/iot/alerts GET] Error:', error.message);
    return apiError('Failed to fetch IoT alerts', 'alerts_error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const body = await request.json();
    const { action, alertId, ruleId, title, details, fieldId } = body;

    // Action: acknowledge/dismiss an existing alert
    if (action === 'acknowledge' || action === 'dismiss') {
      if (!alertId) {
        return apiError('alertId is required for acknowledge/dismiss', 'missing_alert_id', 400);
      }

      const alert = await prisma.notification.findFirst({
        where: { id: alertId, userId: user.id, type: 'irrigation' },
      });

      if (!alert) {
        return apiError('Alert not found', 'alert_not_found', 404);
      }

      const updated = await prisma.notification.update({
        where: { id: alertId },
        data: { readAt: new Date() },
      });

      return apiSuccess({
        id: updated.id,
        isRead: true,
        readAt: updated.readAt?.toISOString(),
        action,
      });
    }

    // Action: create a new advisory notification
    if (action === 'create') {
      if (!ruleId || !title) {
        return apiError('ruleId and title are required', 'missing_fields', 400);
      }

      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'irrigation',
          titleKey: ruleId,
          bodyKey: title,
          paramsJson: JSON.stringify({
            ...(details || {}),
            fieldId: fieldId || null,
            createdVia: 'iot_advisory',
          }),
        },
      });

      return apiSuccess(
        {
          id: notification.id,
          ruleId: notification.titleKey,
          title: notification.bodyKey,
          createdAt: notification.createdAt.toISOString(),
        },
        undefined,
        201
      );
    }

    return apiError('Invalid action. Expected: create, acknowledge, or dismiss', 'invalid_action', 400);
  } catch (error: any) {
    console.error('[API /api/v1/iot/alerts POST] Error:', error.message);
    return apiError('Failed to process IoT alert', 'alert_error', 500);
  }
}
