import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { EmailService, maskEmail } from '@/services/EmailService';

export async function GET(_req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');
    if (!isAdmin) return apiError('Forbidden. Admin privilege required.', 'forbidden', 403);

    // 1. Fetch live provider configuration status (hygienic, no secrets)
    const providerInfo = EmailService.getProviderInfo();
    const safeProviderSummary = {
      configured: providerInfo.configured,
      provider: providerInfo.provider,
      fromEmail: providerInfo.fromEmail,
      fromDomain: providerInfo.fromDomain,
      appUrl: providerInfo.appUrl,
      isLocalhostUrl: providerInfo.isLocalhostUrl,
      warnings: providerInfo.warnings,
      details: providerInfo.provider === 'smtp' ? {
        host: providerInfo.smtp?.host,
        port: providerInfo.smtp?.port,
        secure: providerInfo.smtp?.secure,
        userMasked: providerInfo.smtp?.userMasked,
      } : providerInfo.provider === 'resend' ? {
        apiKeyConfigured: true,
      } : null,
    };

    // 2. Fetch aggregate email counts from EmailDeliveryLog
    const statsRows = await prisma.$queryRawUnsafe<Array<{ status: string; count: bigint | number }>>(
      `SELECT "status", COUNT(*) as "count" FROM "EmailDeliveryLog" GROUP BY "status"`
    ).catch(() => [] as any[]);

    const counts: Record<string, number> = {
      total: 0,
      pending: 0,
      accepted: 0,
      delivered: 0,
      failed: 0,
      bounced: 0,
      simulated: 0,
      skipped: 0,
    };

    for (const row of statsRows) {
      const c = Number(row.count);
      counts.total += c;
      const st = String(row.status).toLowerCase();
      if (st === 'pending' || st === 'queued' || st === 'retrying') counts.pending += c;
      else if (st === 'accepted' || st === 'sent') counts.accepted += c;
      else if (st === 'delivered') counts.delivered += c;
      else if (st === 'failed' || st === 'rejected') counts.failed += c;
      else if (st === 'bounced') counts.bounced += c;
      else if (st === 'not_configured' || st === 'simulated') counts.simulated += c;
      else if (st.startsWith('skipped')) counts.skipped += c;
    }

    // 3. Fetch recent 50 delivery logs
    const recentLogs = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "userId", "toEmail", "templateKey", "subject", "locale",
              "status", "deliveryStatus", "provider", "providerMessageId",
              "attempts", "maxAttempts", "errorMessage", "sentAt", "createdAt"
       FROM "EmailDeliveryLog"
       ORDER BY "createdAt" DESC
       LIMIT 50`
    ).catch(() => [] as any[]);

    const formattedLogs = recentLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      toEmailMasked: maskEmail(log.toEmail),
      toEmail: log.toEmail,
      templateKey: log.templateKey,
      subject: log.subject,
      locale: log.locale,
      status: log.status,
      deliveryStatus: log.deliveryStatus || 'unknown',
      provider: log.provider,
      providerMessageId: log.providerMessageId,
      attempts: Number(log.attempts || 1),
      maxAttempts: Number(log.maxAttempts || 3),
      errorMessage: log.errorMessage,
      sentAt: log.sentAt ? new Date(log.sentAt).toISOString() : null,
      createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
      canRetry: (log.status === 'failed' || log.status === 'not_configured' || log.status === 'rejected') && Number(log.attempts || 1) < 5,
    }));

    return apiSuccess({
      provider: safeProviderSummary,
      counts,
      logs: formattedLogs,
    });
  } catch (err: any) {
    console.error('[GET /api/v1/admin/email-diagnostics] Error:', err);
    return apiError('Unable to load email diagnostics telemetry.', 'diagnostics_failed', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');
    if (!isAdmin) return apiError('Forbidden. Admin privilege required.', 'forbidden', 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'retry';

    if (action === 'verify_provider') {
      const testResult = await EmailService.verifyProvider();
      return apiSuccess(testResult);
    }

    if (action === 'retry') {
      const logId = body.logId;
      if (!logId) return apiError('logId is required for retry.', 'missing_param', 400);

      const retryResult = await EmailService.retryFailedLog(logId);
      return apiSuccess({
        logId,
        accepted: retryResult.accepted,
        status: retryResult.status,
        provider: retryResult.provider,
        providerMessageId: retryResult.providerMessageId,
        error: retryResult.error,
        message: retryResult.accepted
          ? 'Email retry accepted by provider.'
          : `Retry failed: ${retryResult.error || 'Provider rejected request'}`,
      });
    }

    if (action === 'process_queue') {
      const queueResult = await EmailService.processRetryQueue(25);
      return apiSuccess(queueResult);
    }

    return apiError('Unknown action requested.', 'invalid_action', 400);
  } catch (err: any) {
    console.error('[POST /api/v1/admin/email-diagnostics] Error:', err);
    return apiError('Failed to execute email management action.', 'action_failed', 500);
  }
}
