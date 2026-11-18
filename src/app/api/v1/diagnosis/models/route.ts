import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-envelope';
import { CropModelRegistry } from '@/services/ai/CropModelRegistry';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const models = CropModelRegistry.getAllModels();
  return apiSuccess({
    count: models.length,
    models,
  });
}

