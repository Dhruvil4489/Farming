import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  signToken,
  setAuthCookie,
  normalizeIdentifier,
  TOKEN_NAME,
} from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Please enter your mobile number or email address'),
  password: z.string().min(1, 'Please enter your password'),
});

const NEUTRAL_ERROR_MESSAGE = 'Unable to sign in with those details. Check your credentials and try again.';

export async function POST(req: NextRequest) {
  const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
  const acceptHeader = req.headers.get('accept') || '';
  const isHtmlNavigation = acceptHeader.includes('text/html') && !acceptHeader.includes('application/json');

  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. Resilient request payload parsing (JSON, form-urlencoded, or multipart)
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
          identifier: formData.get('identifier')?.toString() || '',
          password: formData.get('password')?.toString() || '',
        };
      } catch {
        return apiError('Malformed form data received', 'invalid_form_data', 400, undefined, requestId);
      }
    } else {
      // Automatic fallback parser
      try {
        rawBody = await req.json();
      } catch {
        try {
          const formData = await req.formData();
          rawBody = {
            identifier: formData.get('identifier')?.toString() || '',
            password: formData.get('password')?.toString() || '',
          };
        } catch {
          rawBody = {};
        }
      }
    }

    const parsed = loginSchema.parse(rawBody);

    // 2. Check brute-force rate limit (5 attempts per IP+identifier per minute, 20 per IP per minute)
    const rateLimitKey = `login:${clientIp}:${parsed.identifier.toLowerCase()}`;
    const ipRateLimitKey = `login_ip:${clientIp}`;

    const idLimit = checkRateLimit(rateLimitKey, 5, 60);
    const ipLimit = checkRateLimit(ipRateLimitKey, 20, 60);

    if (!idLimit.allowed || !ipLimit.allowed) {
      const waitTime = Math.max(idLimit.resetSeconds, ipLimit.resetSeconds);
      if (isHtmlNavigation) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('error', 'rate_limited');
        return NextResponse.redirect(loginUrl);
      }

      const res = apiError(
        'Too many sign in attempts. Please wait a minute before trying again.',
        'rate_limited',
        429,
        undefined,
        requestId
      );
      res.headers.set('Retry-After', String(waitTime));
      return res;
    }

    // 3. Normalize identifier and build search criteria
    const normalized = normalizeIdentifier(parsed.identifier);
    let whereCondition: any;

    if (normalized.isEmail && normalized.email) {
      whereCondition = {
        email: normalized.email,
        deletedAt: null,
      };
    } else {
      // Search matching either normalized phone candidates or exact raw value
      whereCondition = {
        OR: [
          { phone: { in: normalized.phoneCandidates } },
          { email: parsed.identifier.toLowerCase() },
        ],
        deletedAt: null,
      };
    }

    // 4. Query user from database
    const user = await prisma.user.findFirst({
      where: whereCondition,
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      if (isHtmlNavigation) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('error', 'invalid_credentials');
        return NextResponse.redirect(loginUrl);
      }
      return apiError(NEUTRAL_ERROR_MESSAGE, 'invalid_credentials', 401, undefined, requestId);
    }

    // 5. Verify password hash
    const isValid = await verifyPassword(parsed.password, user.passwordHash);
    if (!isValid) {
      if (isHtmlNavigation) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('error', 'invalid_credentials');
        return NextResponse.redirect(loginUrl);
      }
      return apiError(NEUTRAL_ERROR_MESSAGE, 'invalid_credentials', 401, undefined, requestId);
    }

    // 6. Reset rate limit on successful credentials verification
    resetRateLimit(rateLimitKey);
    resetRateLimit(ipRateLimitKey);

    // 7. Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 8. Sign session token and establish secure session cookie
    const roleNames = user.roles.map((r) => r.role.name);
    const token = signToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      roles: roleNames,
    });

    // Determine default role destination
    const isAdminOnly = roleNames.includes('ADMIN') && !roleNames.includes('FARMER');
    const defaultRedirect = isAdminOnly ? '/admin' : '/dashboard';

    // Synchronize cookie in Next.js cookie store
    await setAuthCookie(token);

    // If native browser HTML navigation, redirect directly to dashboard with cookie
    if (isHtmlNavigation) {
      const redirectUrl = new URL(defaultRedirect, req.url);
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

    // Build API response and attach Set-Cookie directly for guaranteed header persistence
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      roles: roleNames,
    };

    const response = apiSuccess({
      ...userData,
      user: userData,
      defaultRedirect,
    });

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
        fieldErrors.identifier?.[0] || fieldErrors.password?.[0] || 'Please provide required credentials';
      return apiError(firstErrorMessage, 'validation_failed', 422, fieldErrors as any, requestId);
    }

    console.error(`[API Login Error ${requestId}]:`, err?.name, err?.message);
    return apiError('An unexpected server error occurred. Please try again.', 'server_error', 500, undefined, requestId);
  }
}
