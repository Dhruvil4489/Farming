import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { searchIndianLocations } from '@/lib/india-locations';

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get('q') || '';
    const results = await searchIndianLocations(q);
    return apiSuccess(results, { total: results.length, query: q });
  } catch (err) {
    console.error('[GET /api/v1/weather/search] Error:', err);
    return apiError('Unable to search locations right now.', 'location_search_failed', 500);
  }
}
