import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
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

    if (!parsed.email && !parsed.phone) {
      return apiError('Either email or mobile number must be provided', 'validation_failed', 422);
    }

    if (parsed.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: parsed.email } });
      if (existingEmail) {
        return apiError('An account with this email already exists', 'duplicate_user', 409);
      }
    }

    if (parsed.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: parsed.phone } });
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
        email: parsed.email || null,
        phone: parsed.phone || null,
        passwordHash,
        state: parsed.state || null,
        district: parsed.district || null,
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

    const token = signToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      roles: user.roles.map((r) => r.role.name),
    });

    await setAuthCookie(token);

    return apiSuccess(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        roles: user.roles.map((r) => r.role.name),
      },
      undefined,
      201
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError('Validation failed', 'validation_failed', 422, err.flatten().fieldErrors as any);
    }
    console.error('Registration error:', err);
    return apiError('Internal server error', 'server_error', 500);
  }
}
