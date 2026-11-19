import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  signToken,
  setAuthCookie,
  TOKEN_NAME,
} from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { apiSuccess } from '@/lib/api-envelope';
import { authErrorResponse, classifyAuthDatabaseError } from '@/lib/auth-errors';
import { EmailService } from '@/services/EmailService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;

  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    let rawBody: Record<string, any> = {};
    try {
      rawBody = await req.json();
    } catch {
      return authErrorResponse({
        code: 'INVALID_REQUEST',
        message: 'Invalid sign-in request. Please refresh the page and try again.',
        status: 400,
        requestId,
      });
    }

    const email = (rawBody.email ?? rawBody.identifier ?? '').toString().trim().toLowerCase();
    const password = typeof rawBody.password === 'string' ? rawBody.password : '';
    const rememberMe = rawBody.rememberMe !== false;

    const fieldErrors: Record<string, string> = {};
    if (!email || !EMAIL_REGEX.test(email)) {
      fieldErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      fieldErrors.password = 'Please enter your password.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      const firstField = Object.keys(fieldErrors)[0];
      return authErrorResponse({
        code: firstField === 'email' ? 'INVALID_EMAIL' : 'VALIDATION_ERROR',
        message: fieldErrors[firstField],
        status: 422,
        field: firstField,
        fieldErrors,
        requestId,
      });
    }

    // Brute-force rate limit: 5 attempts per IP+email per minute, 20 per IP per minute
    const rateLimitKey = `login:${clientIp}:${email}`;
    const ipRateLimitKey = `login_ip:${clientIp}`;
    const idLimit = checkRateLimit(rateLimitKey, 5, 60);
    const ipLimit = checkRateLimit(ipRateLimitKey, 20, 60);

    if (!idLimit.allowed || !ipLimit.allowed) {
      return authErrorResponse({
        code: 'RATE_LIMITED',
        message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
        status: 429,
        requestId,
        retryAfter: Math.max(idLimit.resetSeconds, ipLimit.resetSeconds),
      });
    }

    // Strictly Email-Only case-insensitive lookup
    let user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      const emailUsers = await prisma.user.findMany({
        where: { email: { not: null }, deletedAt: null },
        include: { roles: { include: { role: true } } },
      });
      user = emailUsers.find((u) => (u.email || '').trim().toLowerCase() === email) || null;
    }

    if (!user || !user.passwordHash) {
      return authErrorResponse({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password. Please check your credentials and try again.',
        status: 401,
        requestId,
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return authErrorResponse({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password. Please check your credentials and try again.',
        status: 401,
        requestId,
      });
    }

    if (!user.emailVerifiedAt) {
      return authErrorResponse({
        code: 'EMAIL_NOT_VERIFIED',
        message:
          'Please verify your email address before signing in. Check your inbox or click Resend Verification Email.',
        status: 403,
        field: 'email',
        fieldErrors: { email: 'Email address is pending verification.' },
        requestId,
      });
    }

    resetRateLimit(rateLimitKey);
    resetRateLimit(ipRateLimitKey);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    EmailService.sendTemplate({
      userId: user.id,
      toEmail: email,
      templateKey: 'security_login',
      locale: (user.preferredLanguage as any) || 'en',
      preferenceType: 'security',
      data: {
        name: user.name,
        loginTime: new Date().toLocaleString('en-IN', {
          timeZone: (user as any).timezone || 'Asia/Kolkata',
        }),
        ip: clientIp,
        settingsUrl: EmailService.getAppUrl('/settings'),
      },
    }).catch(() => {});

    const roleNames = user.roles.map((r) => r.role.name);
    const token = signToken(
      {
        userId: user.id,
        email,
        roles: roleNames,
      },
      rememberMe
    );

    const isAdminOnly = roleNames.includes('ADMIN') && !roleNames.includes('FARMER');
    const defaultRedirect = isAdminOnly ? '/admin' : '/dashboard';
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    await setAuthCookie(token, rememberMe);

    const userData = {
      id: user.id,
      name: user.name,
      email,
      emailVerified: true,
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
      maxAge,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error(`[API Login Error ${requestId}]:`, {
      code: err?.code,
      name: err?.name,
      message: err?.message,
    });
    const classified = classifyAuthDatabaseError(err, requestId);
    return authErrorResponse({
      ...classified,
      message:
        classified.code === 'DATABASE_UNAVAILABLE'
          ? 'We are temporarily unable to sign you in. Please try again shortly.'
          : 'Something went wrong while signing in. Please try again later.',
    });
  }
}
