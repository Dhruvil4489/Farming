import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-envelope';
import { CropModelRegistry } from '@/services/ai/CropModelRegistry';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const crops = CropModelRegistry.getAllCrops();
  return apiSuccess({
    totalCount: crops.length,
    activeSpecialistCount: crops.filter((c) => c.status === 'specialist_active').length,
    activeBenchmarkCount: crops.filter((c) => c.status === 'benchmark_active').length,
    inValidationCount: crops.filter((c) => c.status === 'in_validation').length,
    crops,
  });
}

