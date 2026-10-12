import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { StoreService } from '@/services/StoreService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await StoreService.getProductBySlug(slug);

    if (!product) {
      return apiError('Product not found', 'not_found', 404);
    }

    return apiSuccess(product);
  } catch (err: any) {
    console.error('Error in /api/v1/store/products/[slug]:', err);
    return apiError(err.message, 'store_product_detail_error', 500);
  }
}
