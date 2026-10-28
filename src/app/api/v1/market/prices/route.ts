import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { MarketDataService } from '@/services/MarketDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || undefined;
    const district = searchParams.get('district') || undefined;
    const market = searchParams.get('market') || undefined;
    const commodity = searchParams.get('commodity') || undefined;
    const date = searchParams.get('date') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const data = await MarketDataService.getPricesWithComparison({
      state,
      district,
      market,
      commodity,
      date,
      limit: limit && !isNaN(limit) ? limit : undefined,
    });

    return apiSuccess(data.records, {
      date: data.date,
      arrival_date: data.arrival_date,
      latestArrivalDate: data.latestArrivalDate,
      lastSyncedAt: data.lastSyncedAt,
      feedCadence: data.feedCadence,
      cadenceNotice: data.cadenceNotice,
      total: data.total,
      provenance: data.provenance,
    });
  } catch (err: any) {
    console.error('Error in /api/v1/market/prices:', err);
    return apiError(err.message || 'Failed to fetch market prices', 'market_fetch_error', 500);
  }
}

