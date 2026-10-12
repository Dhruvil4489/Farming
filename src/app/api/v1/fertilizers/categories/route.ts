import { apiSuccess, apiError } from '@/lib/api-envelope';
import { FertilizerGuidanceService } from '@/services/FertilizerGuidanceService';

export async function GET() {
  try {
    const categories = await FertilizerGuidanceService.getCategories();
    return apiSuccess(categories);
  } catch (err: any) {
    return apiError(err.message, 'fertilizer_categories_error', 500);
  }
}
