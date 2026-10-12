import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { FertilizerGuidanceService } from '@/services/FertilizerGuidanceService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get('crop') || undefined;
    const stage = searchParams.get('stage') || undefined;
    const category = searchParams.get('category') || undefined;

    const guidance = await FertilizerGuidanceService.getGuidance({
      crop,
      stage,
      categorySlug: category,
    });

    return apiSuccess(guidance, { count: guidance.length });
  } catch (err: any) {
    return apiError(err.message, 'fertilizer_guidance_error', 500);
  }
}
