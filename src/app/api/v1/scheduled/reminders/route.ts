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
      // Non-admin farmer can trigger processing of ONLY their own due reminders
      const summary = await ReminderSchedulerService.processDueReminders(
        isAdmin ? {} : { userId: user.id }
      );
      return apiSuccess(summary);
    }

    const summary = await ReminderSchedulerService.processDueReminders();
    return apiSuccess(summary);
  } catch (err) {
    console.error('[POST /api/v1/scheduled/reminders] Error:', err);
    return apiError('Reminder dispatch job failed.', 'reminder_job_failed', 500);
  }
}
