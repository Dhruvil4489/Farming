import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { MarketDataService } from '@/services/MarketDataService';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * POST /api/v1/admin/market/sync
 *
 * Triggers a sync from the configured market provider (AGMARKNET or demo)
 * into the database.  Admin-only.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    // Check for admin role
    const isAdmin = user.roles?.some(
      (ur: any) => ur.role?.name === 'ADMIN'
    );
    if (!isAdmin) {
      return apiError('Admin access required', 'forbidden', 403);
    }

    // Parse optional body filters
    let state: string | undefined;
    let commodity: string | undefined;
    let limit: number | undefined;

    try {
      const body = await request.json();
      state = body.state || undefined;
      commodity = body.commodity || undefined;
      limit = body.limit ? parseInt(String(body.limit), 10) : undefined;
    } catch {
      // Empty body is fine — sync with defaults
    }

    const result = await MarketDataService.syncFromProvider({
      state,
      commodity,
      limit,
      triggerSource: 'manual',
    });

    if (result.status === 'skipped_locked') {
      return apiSuccess(
        result,
        {
          locked: true,
          lockedUntil: result.lockedUntil,
          message: 'A sync job is already in progress. Overlapping manual run avoided.',
        },
        409
      );
    }

    const httpStatus = result.status === 'failed' ? 502 : 200;

    return apiSuccess(result, {
      syncRunId: result.syncRunId,
      status: result.status,
    }, httpStatus);
  } catch (err: any) {
    console.error('Error in /api/v1/admin/market/sync:', err.message);
    return apiError(
      err.message || 'Market sync failed',
      'market_sync_error',
      500
    );
  }
}

/**
 * GET /api/v1/admin/market/sync
 *
 * Returns full market synchronization health metrics for the admin console:
 * last success, last attempt, next scheduled run, lock state, rows changed, and recent audit logs.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const isAdmin = user.roles?.some(
      (ur: any) => ur.role?.name === 'ADMIN'
    );
    if (!isAdmin) {
      return apiError('Admin access required', 'forbidden', 403);
    }

    const health = await MarketDataService.getSyncHealth();
    return apiSuccess(health);
  } catch (err: any) {
    console.error('Error in GET /api/v1/admin/market/sync:', err.message);
    return apiError(
      err.message || 'Failed to fetch sync health',
      'market_sync_health_error',
      500
    );
  }
}

