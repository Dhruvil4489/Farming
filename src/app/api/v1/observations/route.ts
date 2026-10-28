import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

// -----------------------------------------------------------------
// Validation schema — mirrors FarmObservation exactly
// -----------------------------------------------------------------
const VALID_CATEGORIES = [
  'pest',
  'disease',
  'weed',
  'nutrient_issue',
  'irrigation_issue',
  'growth_issue',
  'general',
] as const;

const VALID_STATUSES = ['open', 'resolved', 'monitoring'] as const;

const observationSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  cropCycleId: z.string().optional(),
  observedAt: z.string().optional(), // ISO date string; defaults to now()
  category: z.enum(VALID_CATEGORIES).default('general'),
  severity: z.number().int().min(1).max(3, 'Severity must be 1, 2, or 3').default(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  stageSnapshot: z.string().max(200).optional(),
  notes: z.string().min(1, 'Notes are required').max(2000),
  photosJson: z.string().optional(), // JSON array of File UUIDs; validated as parseable JSON
  source: z.enum(['manual', 'sensor', 'expert']).default('manual'),
  status: z.enum(VALID_STATUSES).default('open'),
});

// -----------------------------------------------------------------
// GET /api/v1/observations
// Query params: field_id, crop_cycle_id, category, status, limit, page
// -----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const fieldId = searchParams.get('field_id');
  const cropCycleId = searchParams.get('crop_cycle_id');
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const skip = (page - 1) * limit;

  try {
    const where = {
      userId: user.id,
      ...(fieldId ? { fieldId } : {}),
      ...(cropCycleId ? { cropCycleId } : {}),
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    };

    const [observations, total] = await Promise.all([
      prisma.farmObservation.findMany({
        where,
        include: {
          field: { select: { id: true, name: true } },
          cropCycle: { select: { id: true, crop: { select: { id: true, slug: true } } } },
        },
        orderBy: { observedAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.farmObservation.count({ where }),
    ]);

    return apiSuccess(observations, {
      page,
      per_page: limit,
      total,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[observations:GET]', err);
    return apiError('Failed to load observations', 'db_error', 500);
  }
}

// -----------------------------------------------------------------
// POST /api/v1/observations
// -----------------------------------------------------------------
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  try {
    const body = await req.json();
    const parsed = observationSchema.parse(body);

    // Verify field ownership (join through Farm → User)
    const field = await prisma.field.findFirst({
      where: { id: parsed.fieldId, farm: { userId: user.id }, deletedAt: null },
    });
    if (!field) return apiError('Field not found or unowned', 'not_found', 404);

    // If cropCycleId supplied, verify it belongs to this field
    if (parsed.cropCycleId) {
      const cycle = await prisma.cropCycle.findFirst({
        where: { id: parsed.cropCycleId, fieldId: field.id, deletedAt: null },
      });
      if (!cycle) return apiError('Crop cycle not found or does not belong to field', 'not_found', 404);
    }

    // Validate photosJson is parseable if provided
    let photosJson = '[]';
    if (parsed.photosJson) {
      try {
        const arr = JSON.parse(parsed.photosJson);
        if (!Array.isArray(arr)) throw new Error('photosJson must be a JSON array');
        photosJson = parsed.photosJson;
      } catch {
        return apiError('photosJson must be a valid JSON array of file UUIDs', 'validation_failed', 422);
      }
    }

    const observation = await prisma.farmObservation.create({
      data: {
        userId: user.id,
        fieldId: parsed.fieldId,
        cropCycleId: parsed.cropCycleId || null,
        observedAt: parsed.observedAt ? new Date(parsed.observedAt) : new Date(),
        category: parsed.category,
        severity: parsed.severity,
        lat: parsed.lat ?? null,
        lng: parsed.lng ?? null,
        stageSnapshot: parsed.stageSnapshot || null,
        notes: parsed.notes,
        photosJson,
        source: parsed.source,
        status: parsed.status,
      },
      include: {
        field: { select: { id: true, name: true } },
        cropCycle: { select: { id: true, crop: { select: { id: true, slug: true } } } },
      },
    });

    return apiSuccess(observation, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    console.error('[observations:POST]', err);
    return apiError('Failed to create observation', 'create_failed', 500);
  }
}
