/**
 * SmartFarm AI — Reminder Processing & Email Dispatch Scheduler
 *
 * Processes due ScheduledReminder rows with:
 * - Strict deduplication (dedupeKey)
 * - Retry tracking (up to 3 attempts)
 * - In-app Notification creation + EmailService dispatch
 */

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/EmailService';

export interface ReminderRunSummary {
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
}

export class ReminderSchedulerService {
  static async processDueReminders(options: { userId?: string; limit?: number } = {}): Promise<ReminderRunSummary> {
    const now = new Date();
    const dueReminders = await prisma.scheduledReminder.findMany({
      where: {
        ...(options.userId ? { userId: options.userId } : {}),
        scheduledFor: { lte: now },
        status: { in: ['pending', 'failed'] },
        attempts: { lt: 3 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            preferredLanguage: true,
            timezone: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: options.limit || 50,
    });

    const summary: ReminderRunSummary = {
      checked: dueReminders.length,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    for (const rem of dueReminders) {
      let payload: Record<string, any> = {};
      try {
        payload = JSON.parse(rem.payloadJson || '{}');
      } catch {
        payload = {};
      }

      // 1. Always create in-app notification once
      if (rem.attempts === 0) {
        await prisma.notification.create({
          data: {
            userId: rem.userId,
            type: rem.category,
            titleKey: rem.title,
            bodyKey: rem.body,
            paramsJson: rem.payloadJson || '{}',
          },
        });
      }

      // 2. Dispatch email if user has an email address
      if (!rem.user?.email) {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: {
            status: 'skipped',
            attempts: rem.attempts + 1,
            lastError: 'No email address registered on account',
          },
        });
        summary.skipped++;
        continue;
      }

      const templateKey =
        rem.category === 'crop_stage'
          ? 'crop_stage'
          : rem.category === 'weather'
            ? 'weather_alert'
            : rem.category === 'disease'
              ? 'disease_alert'
              : 'task_reminder';

      const result = await EmailService.sendTemplate({
        userId: rem.userId,
        toEmail: rem.user.email,
        templateKey,
        locale: (rem.user.preferredLanguage as any) || 'en',
        preferenceType: rem.category,
        dedupeKey: `rem:${rem.dedupeKey}`,
        data: {
          name: rem.user.name,
          title: rem.title,
          body: rem.body,
          dueDate: rem.scheduledFor.toLocaleDateString('en-IN'),
          ...payload,
          actionUrl: payload.actionUrl || EmailService.getAppUrl('/tasks'),
        },
      });

      if (result.status === 'sent' || result.delivered) {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: {
            status: 'sent',
            attempts: rem.attempts + 1,
            sentAt: new Date(),
            lastError: null,
          },
        });
        summary.sent++;
      } else if (result.status === 'skipped_duplicate' || result.status === 'skipped_preference') {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: {
            status: 'skipped',
            attempts: rem.attempts + 1,
            lastError: result.status,
          },
        });
        summary.skipped++;
      } else {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: {
            status: 'failed',
            attempts: rem.attempts + 1,
            lastError: result.error || 'Delivery failed',
          },
        });
        summary.failed++;
      }
    }

    return summary;
  }
}
