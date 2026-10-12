import { apiSuccess, apiError } from '@/lib/api-envelope';
import { MarketDataService } from '@/services/MarketDataService';

export async function GET() {
  try {
    const filters = await MarketDataService.getFilterOptions();
    return apiSuccess(filters);
  } catch (err: any) {
    console.error('Error in /api/v1/market/filters:', err);
    return apiError(err.message || 'Failed to fetch market filters', 'filters_fetch_error', 500);
  }
}
