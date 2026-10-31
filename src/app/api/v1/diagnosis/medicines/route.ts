/**
 * GET /api/v1/diagnosis/medicines
 *
 * Disease-to-Store Medicine Recommendation Endpoint.
 * Given a diagnosed crop and disease, returns verified, compatible store products
 * categorized into Primary, Alternative, and Organic treatments with live store prices,
 * real stock, pack sizes, and direct add-to-cart actions.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { DiseaseProductMatchingService } from '@/services/DiseaseProductMatchingService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get('crop');
    const disease = searchParams.get('disease');
    const label = searchParams.get('label');
    const isHealthy = searchParams.get('isHealthy') === 'true';
    const status = searchParams.get('status');

    if (!crop && !disease && !label) {
      return apiError('Crop or disease parameter is required to find matching medicines', 'bad_request', 400);
    }

    const result = await DiseaseProductMatchingService.getRecommendationsForDiagnosis({
      crop: crop || 'General Crop',
      disease: disease || 'Crop Foliage Disease',
      label: label || undefined,
      isHealthy,
      status: status || undefined,
    });

    return apiSuccess(result);
  } catch (error: any) {
    console.error('[API /api/v1/diagnosis/medicines GET] Error:', error.message);
    return apiError(error.message || 'Failed to match store medicines', 'matching_error', 500);
  }
}

