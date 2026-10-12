import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { MarketDataService } from '@/services/MarketDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commodityId = searchParams.get('commodityId');
    const locationId = searchParams.get('locationId');
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (!commodityId || !locationId) {
      return apiError('commodityId and locationId are required parameters', 'missing_params', 400);
    }

    const history = await MarketDataService.getPriceHistory(commodityId, locationId, days);

    return apiSuccess(history, { days, count: history.length });
  } catch (err: any) {
    console.error('Error in /api/v1/market/history:', err);
    return apiError(err.message || 'Failed to fetch price history', 'history_fetch_error', 500);
  }
}
