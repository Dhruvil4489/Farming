import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

// -----------------------------------------------------------------
// Validation schema — mirrors IrrigationRecord exactly
// volumeL is NEVER auto-filled — only stored when caller supplies it
// -----------------------------------------------------------------
const irrigationSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  cropCycleId: z.string().optional(),
  irrigatedAt: z.string().optional(), // ISO date string; defaults to now()
  method: z.enum(['drip', 'sprinkler', 'flood', 'rainfed', 'other']).default('drip'),
  durationMinutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours (1440 minutes)')
    .optional(),
  volumeL: z
    .number()
    .positive('Water volume must be positive when supplied')
    .max(1_000_000, 'Volume exceeds plausible maximum')
    .optional(), // Never fabricated — only stored when explicitly provided
  waterSource: z.string().max(100).optional(),
  moistureNote: z.enum(['dry', 'moist', 'wet']).optional(),
  notes: z.string().max(2000).optional(),
  source: z.enum(['manual', 'sensor']).default('manual'),
});

// -----------------------------------------------------------------
// GET /api/v1/irrigation
// Query params: field_id, crop_cycle_id, method, limit, page
// -----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const fieldId = searchParams.get('field_id');
  const cropCycleId = searchParams.get('crop_cycle_id');
  const method = searchParams.get('method');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const skip = (page - 1) * limit;

  try {
    const where = {
      userId: user.id,
      ...(fieldId ? { fieldId } : {}),
      ...(cropCycleId ? { cropCycleId } : {}),
      ...(method ? { method } : {}),
    };

    const [records, total] = await Promise.all([
      prisma.irrigationRecord.findMany({
        where,
        include: {
          field: { select: { id: true, name: true } },
          cropCycle: { select: { id: true, crop: { select: { id: true, slug: true } } } },
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
      total_pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[irrigation:GET]', err);
    return apiError('Failed to load irrigation records', 'db_error', 500);
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
    });
    if (!field) return apiError('Field not found or unowned', 'not_found', 404);

    // If cropCycleId supplied, verify it belongs to this field
    if (parsed.cropCycleId) {
      const cycle = await prisma.cropCycle.findFirst({
        where: { id: parsed.cropCycleId, fieldId: field.id, deletedAt: null },
      });
      if (!cycle) return apiError('Crop cycle not found or does not belong to field', 'not_found', 404);
    }

    const record = await prisma.irrigationRecord.create({
      data: {
        userId: user.id,
        fieldId: parsed.fieldId,
        cropCycleId: parsed.cropCycleId || null,
        irrigatedAt: parsed.irrigatedAt ? new Date(parsed.irrigatedAt) : new Date(),
        method: parsed.method,
        durationMinutes: parsed.durationMinutes ?? null,
        // volumeL: only persisted when caller explicitly provides it — never fabricated
        volumeL: parsed.volumeL !== undefined ? parsed.volumeL : null,
        waterSource: parsed.waterSource || null,
        moistureNote: parsed.moistureNote || null,
        notes: parsed.notes || null,
        source: parsed.source,
      },
      include: {
        field: { select: { id: true, name: true } },
        cropCycle: { select: { id: true, crop: { select: { id: true, slug: true } } } },
      },
    });

    return apiSuccess(record, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    console.error('[irrigation:POST]', err);
    return apiError('Failed to create irrigation record', 'create_failed', 500);
  }
}
