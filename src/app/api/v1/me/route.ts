import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const updateMeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
  preferredLanguage: z.enum(['en', 'hi', 'gu']).optional(),
  experienceMode: z.enum(['simple', 'expert']).optional(),
  state: z.string().trim().nullable().optional(),
  district: z.string().trim().nullable().optional(),
  village: z.string().trim().nullable().optional(),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

    let parsedOnboarding: Record<string, any> = {};
    try {
      parsedOnboarding = JSON.parse(user.onboardingStatus || '{}');
    } catch {
      parsedOnboarding = {};
    }

    return apiSuccess({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      state: user.state,
      district: user.district,
      village: user.village,
      isDemo: user.isDemo,
      experienceMode: user.experienceMode,
      onboardingStatus: parsedOnboarding,
      roles: user.roles.map((r) => r.role.name),
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('[GET /api/v1/me] Error:', err);
    return apiError('Unable to load user profile.', 'profile_load_failed', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Unauthorized', 'unauthorized', 401);

      const body = await req.json();
      const parsed = updateMeSchema.parse(body);

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(parsed.name ? { name: parsed.name } : {}),
          ...(parsed.phone !== undefined && parsed.phone !== '' ? { phone: parsed.phone } : {}),
          ...(parsed.preferredLanguage ? { preferredLanguage: parsed.preferredLanguage } : {}),
          ...(parsed.experienceMode ? { experienceMode: parsed.experienceMode } : {}),
          ...(parsed.state !== undefined ? { state: parsed.state || null } : {}),
          ...(parsed.district !== undefined ? { district: parsed.district || null } : {}),
          ...(parsed.village !== undefined ? { village: parsed.village || null } : {}),
        },
      });

      return apiSuccess({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        preferredLanguage: updated.preferredLanguage,
        experienceMode: updated.experienceMode,
        state: updated.state,
        district: updated.district,
        village: updated.village,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return apiError(err.issues[0]?.message || 'Invalid profile data', 'validation_failed', 422);
      }
      if (err?.code === 'P2002') {
        return apiError('That phone number is already registered with another account.', 'duplicate_phone', 409);
      }
      console.error('[PATCH /api/v1/me] Error:', err);
      return apiError('Failed to update user profile.', 'update_failed', 400);
    }
  }
