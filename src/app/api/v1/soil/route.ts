import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const soilSaveSchema = z.object({
  fieldId: z.string().min(1, 'Please select a field'),
  soilType: z
    .enum(['sandy', 'loamy', 'clay', 'black', 'red', 'alluvial', 'other', 'unknown'])
    .default('unknown'),
  pathChosen: z
    .enum(['health_card', 'report', 'known_type', 'unknown', 'test_requested', 'sensor'])
    .default('known_type'),
  notes: z.string().optional(),
  // Optional simple or lab-measured soil test parameters
  parameters: z
    .object({
      ph: z.number().min(3).max(11).optional(),
      n: z.number().min(0).max(2000).optional(),
      p: z.number().min(0).max(500).optional(),
      k: z.number().min(0).max(2000).optional(),
      oc: z.number().min(0).max(15).optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const fields = await prisma.field.findMany({
      where: { deletedAt: null, farm: { userId: user.id, deletedAt: null } },
      include: {
        farm: { select: { id: true, name: true, village: true, district: true, state: true } },
        soilProfile: true,
        soilTests: {
          orderBy: { testedOn: 'desc' },
          take: 1,
          include: { parameters: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(fields);
  } catch (err) {
    console.error('[GET /api/v1/soil] Error:', err);
    return apiError('Unable to load soil profiles right now.', 'soil_load_failed', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    const body = await req.json();
    const parsed = soilSaveSchema.parse(body);

    const field = await prisma.field.findFirst({
      where: { id: parsed.fieldId, deletedAt: null, farm: { userId: user.id, deletedAt: null } },
    });
    if (!field) return apiError('Selected field not found.', 'not_found', 404);

    // Upsert soil profile & mirror soilType onto Field
    const [soilProfile] = await prisma.$transaction([
      prisma.soilProfile.upsert({
        where: { fieldId: field.id },
        update: {
          soilType: parsed.soilType,
          pathChosen: parsed.pathChosen,
          notes: parsed.notes?.trim() || null,
        },
        create: {
          fieldId: field.id,
          soilType: parsed.soilType,
          pathChosen: parsed.pathChosen,
          notes: parsed.notes?.trim() || null,
        },
      }),
      prisma.field.update({
        where: { id: field.id },
        data: { soilType: parsed.soilType },
      }),
    ]);

    // Optionally save SoilTest if any optional numeric parameter was provided
    let createdTest = null;
    if (parsed.parameters) {
      const entries: Array<{ code: string; value: number; unit: string }> = [];
      if (parsed.parameters.ph !== undefined) entries.push({ code: 'ph', value: parsed.parameters.ph, unit: 'pH' });
      if (parsed.parameters.n !== undefined) entries.push({ code: 'n', value: parsed.parameters.n, unit: 'kg/ha' });
      if (parsed.parameters.p !== undefined) entries.push({ code: 'p', value: parsed.parameters.p, unit: 'kg/ha' });
      if (parsed.parameters.k !== undefined) entries.push({ code: 'k', value: parsed.parameters.k, unit: 'kg/ha' });
      if (parsed.parameters.oc !== undefined) entries.push({ code: 'oc', value: parsed.parameters.oc, unit: '%' });

      if (entries.length > 0) {
        createdTest = await prisma.soilTest.create({
          data: {
            fieldId: field.id,
            source: parsed.pathChosen === 'health_card' ? 'farmer_report' : 'manual',
            confirmed: true,
            parameters: {
              create: entries.map((e) => ({
                code: e.code,
                value: e.value,
                unit: e.unit,
              })),
            },
          },
          include: { parameters: true },
        });
      }
    }

    return apiSuccess({ soilProfile, soilTest: createdTest }, undefined, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Please check the soil details.', 'validation_failed', 422);
    }
    console.error('[POST /api/v1/soil] Error:', err);
    return apiError('Could not save soil details. Please try again.', 'soil_save_failed', 400);
  }
}
