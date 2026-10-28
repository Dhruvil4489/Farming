import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { MarketDataService } from '@/services/MarketDataService';
import { verifyCronAuth } from '@/lib/cron-auth';

/**
 * POST /api/v1/scheduled/market-sync
 *
 * Protected scheduled trigger endpoint for automated market feed polling.
 * Must be invoked with `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`.
 *
 * Security:
 * - Constant-time comparison prevents timing analysis.
 * - Server-only secret is never logged or exposed to client bundle.
 * - Overlapping runs are guarded by a database lock, returning HTTP 409 if active.
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate trigger
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) {
    return apiError(
      authResult.reason || 'Unauthorized: invalid or missing cron authentication token',
      'cron_unauthorized',
      401
    );
  }

  try {
    // 2. Parse optional query or body limits
    let state: string | undefined;
    let commodity: string | undefined;
    let limit: number | undefined;

    try {
      const body = await request.json();
      state = body.state || undefined;
      commodity = body.commodity || undefined;
      limit = body.limit ? parseInt(String(body.limit), 10) : undefined;
    } catch {
      // Empty body is standard for cron triggers
    }

    // 3. Execute sync with 'scheduled' triggerSource and lock guard
    const result = await MarketDataService.syncFromProvider({
      state,
      commodity,
      limit,
      triggerSource: 'scheduled',
    });

    // 4. Handle lock collision (overlapping execution avoided)
    if (result.status === 'skipped_locked') {
      return apiSuccess(
        result,
        {
          locked: true,
          lockedUntil: result.lockedUntil,
          message: 'Overlapping sync job already in progress. Run skipped.',
        },
        409
      );
    }

    const httpStatus = result.status === 'failed' ? 502 : 200;

    return apiSuccess(
      result,
      {
        syncRunId: result.syncRunId,
        status: result.status,
        recordsFetched: result.recordsFetched,
        recordsStored: result.recordsStored,
        durationMs: result.durationMs,
      },
      httpStatus
    );
  } catch (err: any) {
    console.error('[ScheduledMarketSync] Execution error:', err.message);
    return apiError(
      err.message || 'Scheduled market sync failed',
      'scheduled_sync_error',
      500
    );
  }
}

/**
 * GET /api/v1/scheduled/market-sync
 * Some external webhook/cron services use GET with Authorization header.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
