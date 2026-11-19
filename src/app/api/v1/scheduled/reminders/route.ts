import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { ReminderSchedulerService } from '@/services/ReminderSchedulerService';

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthorized) {
      const user = await getAuthenticatedUser();
      if (!user) return apiError('Unauthorized', 'unauthorized', 401);
      const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');
      const targetUserId = isAdmin ? undefined : user.id;

      // 1. Scan active crop cycles and pending tasks for timely alerts
      const scanSummary = await ReminderSchedulerService.scanAndGenerateCropNotifications(targetUserId);

      // 2. Process due scheduled reminders
      const dueSummary = await ReminderSchedulerService.processDueReminders(
        isAdmin ? {} : { userId: user.id }
      );

      return apiSuccess({
        ...dueSummary,
        scannedCycles: scanSummary.checkedCycles,
        scannedTasks: scanSummary.checkedTasks,
        createdFromScan: scanSummary.createdNotifications,
      });
    }

    const scanSummary = await ReminderSchedulerService.scanAndGenerateCropNotifications();
    const dueSummary = await ReminderSchedulerService.processDueReminders();
    return apiSuccess({
      ...dueSummary,
      scannedCycles: scanSummary.checkedCycles,
      scannedTasks: scanSummary.checkedTasks,
      createdFromScan: scanSummary.createdNotifications,
    });
  } catch (err) {
    console.error('[POST /api/v1/scheduled/reminders] Error:', err);
    return apiError('Reminder dispatch job failed.', 'reminder_job_failed', 500);
  }
}
