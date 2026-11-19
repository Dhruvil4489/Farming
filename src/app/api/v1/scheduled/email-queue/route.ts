import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { EmailService } from '@/services/EmailService';

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthorized) {
      const user = await getAuthenticatedUser();
      if (!user) return apiError('Unauthorized', 'unauthorized', 401);
      const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');
      if (!isAdmin) return apiError('Forbidden', 'forbidden', 403);
    }

    const result = await EmailService.processRetryQueue(25);
    return apiSuccess({
      message: `Processed ${result.processed} retries (${result.succeeded} accepted, ${result.failed} failed)`,
      ...result,
    });
  } catch (err) {
    console.error('[POST /api/v1/scheduled/email-queue] Error:', err);
    return apiError('Email retry queue processing failed.', 'queue_processing_failed', 500);
  }
}
