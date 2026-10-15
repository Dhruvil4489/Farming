import { NextRequest, NextResponse } from 'next/server';
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
  const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
  const acceptHeader = req.headers.get('accept') || '';
  const isHtmlNavigation = acceptHeader.includes('text/html') && !acceptHeader.includes('application/json');

  try {
    let rawBody: Record<string, any> = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        rawBody = await req.json();
      } catch {
        return apiError('Malformed JSON payload received', 'invalid_json', 400, undefined, requestId);
      }
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      try {
        const formData = await req.formData();
        rawBody = {
          name: formData.get('name')?.toString() || '',
          email: formData.get('email')?.toString() || '',
          phone: formData.get('phone')?.toString() || '',
          password: formData.get('password')?.toString() || '',
          state: formData.get('state')?.toString() || undefined,
          district: formData.get('district')?.toString() || undefined,
          village: formData.get('village')?.toString() || undefined,
          preferredLanguage: formData.get('preferredLanguage')?.toString() || 'en',
        };
      } catch {
        return apiError('Malformed form data received', 'invalid_form_data', 400, undefined, requestId);
      }
    } else {
      try {
        rawBody = await req.json();
      } catch {
        try {
          const formData = await req.formData();
          rawBody = {
            name: formData.get('name')?.toString() || '',
            email: formData.get('email')?.toString() || '',
            phone: formData.get('phone')?.toString() || '',
            password: formData.get('password')?.toString() || '',
            state: formData.get('state')?.toString() || undefined,
            district: formData.get('district')?.toString() || undefined,
            village: formData.get('village')?.toString() || undefined,
            preferredLanguage: formData.get('preferredLanguage')?.toString() || 'en',
          };
        } catch {
          rawBody = {};
        }
      }
    }

    const parsed = registerSchema.parse(rawBody);

    const email = parsed.email ? parsed.email.toLowerCase() : null;
    const phone = parsed.phone ? parsed.phone.trim() : null;

    if (!email && !phone) {
      return apiError('Either email or mobile number must be provided', 'validation_failed', 422, undefined, requestId);
    }

    // Check duplicate email
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email, deletedAt: null },
      });
      if (existingEmail) {
        return apiError('An account with this email already exists', 'duplicate_user', 409, undefined, requestId);
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
        return apiError('An account with this phone number already exists', 'duplicate_user', 409, undefined, requestId);
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

    if (isHtmlNavigation) {
      const redirectUrl = new URL('/onboarding', req.url);
      const htmlResponse = NextResponse.redirect(redirectUrl);
      htmlResponse.cookies.set(TOKEN_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
      return htmlResponse;
    }

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
      return apiError(firstErrorMessage, 'validation_failed', 422, fieldErrors as any, requestId);
    }
    console.error(`[API Registration Error ${requestId}]:`, err?.name, err?.message);
    return apiError('Internal server error during registration', 'server_error', 500, undefined, requestId);
  }
}
