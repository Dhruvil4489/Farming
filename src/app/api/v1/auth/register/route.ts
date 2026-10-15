import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  signToken,
  setAuthCookie,
  normalizeIdentifier,
  TOKEN_NAME,
} from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  state: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  preferredLanguage: z.enum(['en', 'hi', 'gu']).default('en'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const email = parsed.email ? parsed.email.toLowerCase() : null;
    const phone = parsed.phone ? parsed.phone.trim() : null;

    if (!email && !phone) {
      return apiError('Either email or mobile number must be provided', 'validation_failed', 422);
    }

    // Check duplicate email
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email, deletedAt: null },
      });
      if (existingEmail) {
        return apiError('An account with this email already exists', 'duplicate_user', 409);
      }
    }

    // Check duplicate phone across formatting variants
    if (phone) {
      const normalizedPhone = normalizeIdentifier(phone);
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: { in: normalizedPhone.phoneCandidates },
          deletedAt: null,
        },
      });
      if (existingPhone) {
        return apiError('An account with this phone number already exists', 'duplicate_user', 409);
      }
    }

    const passwordHash = await hashPassword(parsed.password);

    // Get or create FARMER role
    let farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    if (!farmerRole) {
      farmerRole = await prisma.role.create({
        data: { name: 'FARMER', label: 'Farmer' },
      });
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: email || null,
        phone: phone || null,
        passwordHash,
        state: parsed.state || 'Gujarat',
        district: parsed.district || 'Vadodara',
        village: parsed.village || null,
        preferredLanguage: parsed.preferredLanguage,
        roles: {
          create: {
            roleId: farmerRole.id,
          },
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    const roleNames = user.roles.map((r) => r.role.name);
    const token = signToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      roles: roleNames,
    });

    await setAuthCookie(token);

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      roles: roleNames,
    };

    const response = apiSuccess(
      {
        ...userData,
        user: userData,
        defaultRedirect: '/dashboard',
      },
      undefined,
      201
    );

    response.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const fieldErrors = err.flatten().fieldErrors as Record<string, string[] | undefined>;
      const firstErrorMessage =
        fieldErrors.name?.[0] ||
        fieldErrors.password?.[0] ||
        fieldErrors.email?.[0] ||
        'Validation failed';
      return apiError(firstErrorMessage, 'validation_failed', 422, fieldErrors as any);
    }
    console.error('[Registration error]:', err);
    return apiError('Internal server error during registration', 'server_error', 500);
  }
}
