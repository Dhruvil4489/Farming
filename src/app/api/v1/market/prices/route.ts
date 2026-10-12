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

    const data = await MarketDataService.getPricesWithComparison({
      state,
      district,
      market,
      commodity,
      date,
    });

    return apiSuccess(data.records, {
      date: data.date,
      total: data.total,
    });
  } catch (err: any) {
    console.error('Error in /api/v1/market/prices:', err);
    return apiError(err.message || 'Failed to fetch market prices', 'market_fetch_error', 500);
  }
}
