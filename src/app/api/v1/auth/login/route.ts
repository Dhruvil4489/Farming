import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: parsed.identifier }, { phone: parsed.identifier }],
        deletedAt: null,
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      return apiError('Invalid credentials', 'invalid_credentials', 401);
    }

    const isValid = await verifyPassword(parsed.password, user.passwordHash);
    if (!isValid) {
      return apiError('Invalid credentials', 'invalid_credentials', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      roles: user.roles.map((r) => r.role.name),
    });

    await setAuthCookie(token);

    return apiSuccess({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      roles: user.roles.map((r) => r.role.name),
    });
  } catch (err: any) {
    console.error('[API Login Error]:', err);
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    return apiError(err.message || 'Internal server error', 'server_error', 500);
  }
}
