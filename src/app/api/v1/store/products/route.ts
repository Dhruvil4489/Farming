import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { StoreService } from '@/services/StoreService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const categorySlug = searchParams.get('category') || undefined;
    const brandId = searchParams.get('brand') || undefined;
    const crop = searchParams.get('crop') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sort = (searchParams.get('sort') as any) || undefined;

    const data = await StoreService.getProducts({
      query,
      categorySlug,
      brandId,
      crop,
      minPrice,
      maxPrice,
      sort,
    });

    return apiSuccess(data.products, {
      total: data.products.length,
      categories: data.categories,
      brands: data.brands,
    });
  } catch (err: any) {
    console.error('Error in /api/v1/store/products:', err);
    return apiError(err.message, 'store_products_error', 500);
  }
}
