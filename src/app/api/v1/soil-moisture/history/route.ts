import { NextRequest } from 'next/server';
import { SoilMoistureService } from '@/services/SoilMoistureService';
import { apiSuccess, apiError } from '@/lib/api-envelope';

export const dynamic = 'force-dynamic';

// GET /api/v1/soil-moisture/history?fieldId=...&timeframe=24h|7d|30d
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');
    const timeframeParam = searchParams.get('timeframe') || '7d';

    if (!fieldId) {
      return apiError('fieldId query parameter is required', 'missing_field_id', 400);
    }

    const timeframe =
      timeframeParam === '24h' || timeframeParam === '30d' ? timeframeParam : '7d';

    const historyData = await SoilMoistureService.getHistoryChartData(fieldId, timeframe);

    return apiSuccess(historyData);
  } catch (error: any) {
    console.error('[API /api/v1/soil-moisture/history] Error:', error);
    return apiError(error.message || 'Failed to retrieve moisture history', 'history_error', 500);
  }
}

