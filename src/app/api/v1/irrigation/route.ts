import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

// -----------------------------------------------------------------
// Validation schema — supports all agronomic methods & optional volume
// volumeL is NEVER auto-filled — only stored when caller supplies it
// -----------------------------------------------------------------
const irrigationSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  cropCycleId: z.string().optional().nullable(),
  irrigatedAt: z.string().optional(), // ISO date string; defaults to now()
  method: z
    .enum(['drip', 'sprinkler', 'flood', 'furrow', 'manual', 'rainfed', 'other'])
    .default('drip'),
  durationMinutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours (1440 minutes)')
    .optional()
    .nullable(),
  volumeL: z
    .number()
    .positive('Water volume must be positive when supplied')
    .max(1_000_000, 'Volume exceeds plausible maximum')
    .optional()
    .nullable(), // Never fabricated — only stored when explicitly provided
  waterSource: z.string().max(100).optional().nullable(),
  moistureNote: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  source: z.enum(['manual', 'sensor']).default('manual'),
});

// -----------------------------------------------------------------
// GET /api/v1/irrigation
// Query params: field_id, crop_cycle_id, method, from_date, to_date, limit, page
// -----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const fieldId = searchParams.get('field_id') || searchParams.get('fieldId');
  const cropCycleId = searchParams.get('crop_cycle_id') || searchParams.get('cropCycleId');
  const method = searchParams.get('method');
  const fromDate = searchParams.get('from_date');
  const toDate = searchParams.get('to_date');
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      userId: user.id,
      ...(fieldId ? { fieldId } : {}),
      ...(cropCycleId ? { cropCycleId } : {}),
      ...(method && method !== 'all' ? { method } : {}),
    };

    if (fromDate || toDate) {
      where.irrigatedAt = {};
      if (fromDate) where.irrigatedAt.gte = new Date(fromDate);
      if (toDate) {
        const toD = new Date(toDate);
        toD.setHours(23, 59, 59, 999);
        where.irrigatedAt.lte = toD;
      }
    }

    const [records, total] = await Promise.all([
      prisma.irrigationRecord.findMany({
        where,
        include: {
          field: { select: { id: true, name: true, farm: { select: { id: true, name: true } } } },
          cropCycle: {
            select: {
              id: true,
              customCropName: true,
              crop: { select: { id: true, slug: true } },
            },
          },
        },
        orderBy: { irrigatedAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.irrigationRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      per_page: limit,
      total,
      total_pages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    console.error('[irrigation:GET] Error:', err);
    return apiError(err.message || 'Failed to load irrigation records', 'db_error', 500);
  }
}

// -----------------------------------------------------------------
// POST /api/v1/irrigation
// -----------------------------------------------------------------
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  try {
    const body = await req.json();
    const parsed = irrigationSchema.parse(body);

    // Verify field ownership
    const field = await prisma.field.findFirst({
      where: { id: parsed.fieldId, farm: { userId: user.id }, deletedAt: null },
      include: {
        cropCycles: {
          where: { deletedAt: null, status: { not: 'completed' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!field) return apiError('Field not found or does not belong to your account', 'not_found', 404);

    let resolvedCropCycleId = parsed.cropCycleId;

    // If cropCycleId supplied, verify it belongs to this field
    if (resolvedCropCycleId) {
      const cycle = await prisma.cropCycle.findFirst({
        where: { id: resolvedCropCycleId, fieldId: field.id, deletedAt: null },
      });
      if (!cycle) return apiError('Crop cycle not found or does not belong to field', 'not_found', 404);
    } else if (field.cropCycles.length > 0) {
      // Auto-associate with current active crop cycle on the field
      resolvedCropCycleId = field.cropCycles[0].id;
    }

    const record = await prisma.irrigationRecord.create({
      data: {
        userId: user.id,
        fieldId: parsed.fieldId,
        cropCycleId: resolvedCropCycleId || null,
        irrigatedAt: parsed.irrigatedAt ? new Date(parsed.irrigatedAt) : new Date(),
        method: parsed.method,
        durationMinutes: parsed.durationMinutes ?? null,
        // volumeL: only persisted when caller explicitly provides it — never fabricated
        volumeL: parsed.volumeL !== undefined && parsed.volumeL !== null ? parsed.volumeL : null,
        waterSource: parsed.waterSource || null,
        moistureNote: parsed.moistureNote || null,
        notes: parsed.notes || null,
        source: parsed.source,
      },
      include: {
        field: { select: { id: true, name: true, farm: { select: { id: true, name: true } } } },
        cropCycle: {
          select: {
            id: true,
            customCropName: true,
            crop: { select: { id: true, slug: true } },
          },
        },
      },
    });

    return apiSuccess(record, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    console.error('[irrigation:POST] Error:', err);
    return apiError(err.message || 'Failed to create irrigation record', 'create_failed', 500);
  }
}
