import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  return apiSuccess({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    preferredLanguage: user.preferredLanguage,
    state: user.state,
    district: user.district,
    village: user.village,
    experienceMode: user.experienceMode,
    onboardingStatus: JSON.parse(user.onboardingStatus || '{}'),
    roles: user.roles.map((r) => r.role.name),
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  try {
    const body = await req.json();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.preferredLanguage ? { preferredLanguage: body.preferredLanguage } : {}),
        ...(body.experienceMode ? { experienceMode: body.experienceMode } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.district !== undefined ? { district: body.district } : {}),
        ...(body.village !== undefined ? { village: body.village } : {}),
      },
    });

    return apiSuccess({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      preferredLanguage: updated.preferredLanguage,
      experienceMode: updated.experienceMode,
    });
  } catch (err) {
    return apiError('Failed to update user profile', 'update_failed', 400);
  }
}
