import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { evaluatePasswordStrength } from '@/lib/password-policy';
import { authErrorResponse, classifyAuthDatabaseError, type AuthErrorCode } from '@/lib/auth-errors';
import { checkRateLimit } from '@/lib/rate-limit';
import { AuthTokenService } from '@/services/AuthTokenService';
import { EmailService } from '@/services/EmailService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface NormalizedRegistrationInput {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  state: string;
  district: string;
  village: string;
  pincode: string | null;
  acceptedTerms: boolean;
  preferredLanguage: 'en' | 'hi' | 'gu';
}

function validateRegistrationPayload(raw: Record<string, any>): {
  ok: true;
  data: NormalizedRegistrationInput;
} | {
  ok: false;
  code: AuthErrorCode;
  message: string;
  field?: string;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const password = typeof raw.password === 'string' ? raw.password : '';
  const hasConfirm = raw.confirmPassword !== undefined;
  const confirmPassword = typeof raw.confirmPassword === 'string' ? raw.confirmPassword : undefined;
  const state = typeof raw.state === 'string' ? raw.state.trim() : '';
  const district = typeof raw.district === 'string' ? raw.district.trim() : '';
  const village = typeof raw.village === 'string' ? raw.village.trim() : '';
  const pincodeRaw = typeof raw.pincode === 'string' ? raw.pincode.trim() : '';
  const acceptedTerms = raw.acceptedTerms !== false;
  const langRaw = typeof raw.preferredLanguage === 'string' ? raw.preferredLanguage.trim() : 'en';
  const preferredLanguage: 'en' | 'hi' | 'gu' =
    langRaw === 'hi' || langRaw === 'gu' ? langRaw : 'en';

  if (!name || name.length < 2) {
    fieldErrors.name = 'Please enter your full name.';
  } else if (name.length > 100) {
    fieldErrors.name = 'Full name must be 100 characters or fewer.';
  }

  if (!email || !EMAIL_REGEX.test(email) || email.length > 160) {
    fieldErrors.email = 'Please enter a valid email address.';
  }

  const strength = evaluatePasswordStrength(password);
  if (!strength.valid) {
    fieldErrors.password =
      strength.error ||
      'Your password is too weak. Use at least 8 characters with both letters and numbers.';
  }

  if (hasConfirm && confirmPassword !== password) {
    fieldErrors.confirmPassword = 'Passwords do not match. Please check both password fields.';
  }

  if (!state || state.length < 2) {
    fieldErrors.state = 'Please select your state.';
  }
  if (!district || district.length < 2) {
    fieldErrors.district = 'Please select your district.';
  }
  if (!village || village.length < 2) {
    fieldErrors.village = 'Please enter your village or city.';
  }

  if (pincodeRaw && !/^\d{6}$/.test(pincodeRaw)) {
    fieldErrors.pincode = 'PIN Code must be a valid 6-digit number.';
  }

  if (!acceptedTerms) {
    fieldErrors.acceptedTerms = 'Please accept the Terms & Conditions to create your account.';
  }

  const errorKeys = Object.keys(fieldErrors);
  if (errorKeys.length > 0) {
    const primaryField = errorKeys[0];
    let code: AuthErrorCode = 'VALIDATION_ERROR';
    let message = 'Some information is missing or incorrect. Please review the highlighted fields.';

    if (errorKeys.length === 1) {
      if (primaryField === 'name') {
        code = 'MISSING_FULL_NAME';
        message = 'Please enter your full name.';
      } else if (primaryField === 'email') {
        code = 'INVALID_EMAIL';
        message = 'Please enter a valid email address.';
      } else if (primaryField === 'password') {
        code = 'WEAK_PASSWORD';
        message = `Your password is too weak. ${strength.error || 'Please use at least 8 characters with both letters and numbers.'}`;
      } else if (primaryField === 'confirmPassword') {
        code = 'PASSWORD_MISMATCH';
        message = 'Passwords do not match. Please check both password fields.';
      } else if (primaryField === 'state' || primaryField === 'district' || primaryField === 'village') {
        code = 'INVALID_LOCATION';
        message = 'Please select a valid state, district, and village or city.';
      } else if (primaryField === 'pincode') {
        code = 'INVALID_PINCODE';
        message = fieldErrors.pincode;
      } else if (primaryField === 'acceptedTerms') {
        code = 'TERMS_NOT_ACCEPTED';
        message = fieldErrors.acceptedTerms;
      }
    } else if (errorKeys.every((k) => ['state', 'district', 'village'].includes(k))) {
      code = 'INVALID_LOCATION';
      message = 'Please select a valid state, district, and village or city.';
    }

    return { ok: false, code, message, field: primaryField, fieldErrors };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      password,
      confirmPassword,
      state,
      district,
      village,
      pincode: pincodeRaw || null,
      acceptedTerms,
      preferredLanguage,
    },
  };
}

export async function POST(req: NextRequest) {
  const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
  let normalizedEmailForCatch: string | null = null;

  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Rate limit: 30 registration attempts per IP per minute (accommodates shared NAT/office IPs & form retries)
    const ipLimit = checkRateLimit(`register_ip:${clientIp}`, 30, 60);
    if (!ipLimit.allowed) {
      return authErrorResponse({
        code: 'RATE_LIMITED',
        message: 'Too many registration attempts. Please wait a few minutes and try again.',
        status: 429,
        requestId,
        retryAfter: ipLimit.resetSeconds,
      });
    }

    let rawBody: Record<string, any> = {};
    try {
      rawBody = await req.json();
    } catch {
      return authErrorResponse({
        code: 'INVALID_REQUEST',
        message: 'Invalid registration request. Please refresh the page and try again.',
        status: 400,
        requestId,
      });
    }

    const validation = validateRegistrationPayload(rawBody);
    if (!validation.ok) {
      return authErrorResponse({
        code: validation.code,
        message: validation.message,
        status: 422,
        field: validation.field,
        fieldErrors: validation.fieldErrors,
        requestId,
      });
    }

    const parsed = validation.data;
    normalizedEmailForCatch = parsed.email;

    // Case-insensitive duplicate email check (DB unique index remains final guard for concurrency)
    const existingUsers = await prisma.user.findMany({
      where: { email: { not: null }, deletedAt: null },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    const duplicate = existingUsers.find((u) => (u.email || '').trim().toLowerCase() === parsed.email);
    if (duplicate) {
      return authErrorResponse({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'This email address is already registered. Please sign in or use another email.',
        status: 409,
        field: 'email',
        fieldErrors: {
          email: 'This email address is already registered. Please sign in or use another email.',
        },
        requestId,
      });
    }

    const passwordHash = await hashPassword(parsed.password);

    // Atomic transaction: create User (unverified, phone=null) + FARMER role + AuthToken
    // Uses core fields inside tx.user.create and updates optional `pincode` via parameterized SQL
    // so even an un-restarted dev server with a pre-migration Prisma DMMF never throws Unknown argument 'pincode'!
    const { user, rawToken, otpCode } = await prisma.$transaction(async (tx) => {
      let farmerRole = await tx.role.findUnique({ where: { name: 'FARMER' } });
      if (!farmerRole) {
        farmerRole = await tx.role.create({
          data: { name: 'FARMER', label: 'Farmer' },
        });
      }

      const createdUser = await tx.user.create({
        data: {
          name: parsed.name,
          email: parsed.email,
          phone: null, // Strictly email-only authentication
          passwordHash,
          state: parsed.state,
          district: parsed.district,
          village: parsed.village,
          preferredLanguage: parsed.preferredLanguage,
          emailVerifiedAt: null,
          roles: {
            create: { roleId: farmerRole.id },
          },
        },
        include: {
          roles: { include: { role: true } },
        },
      });

      if (parsed.pincode) {
        const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
        await tx.$executeRawUnsafe(
          `UPDATE "User" SET "pincode" = ${isSqlite ? '?' : '$1'} WHERE "id" = ${isSqlite ? '?' : '$2'}`,
          parsed.pincode,
          createdUser.id
        );
      }

      const tokenPair = await AuthTokenService.createToken(createdUser.id, 'email_verification', {
        db: tx,
      });

      return { user: createdUser, ...tokenPair };
    });

    // Dispatch verification email (resilient: logs failure & preserves recoverable pending account)
    const verifyUrl = EmailService.getAppUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);
    const emailResult = await EmailService.sendTemplate({
      userId: user.id,
      toEmail: parsed.email,
      templateKey: 'verification',
      locale: parsed.preferredLanguage,
      isTransactional: true,
      data: {
        name: user.name,
        otpCode,
        verifyUrl,
      },
    });

    const emailDeliveryFailed = emailResult.status === 'failed';

    const responseCode = emailDeliveryFailed ? 'EMAIL_DELIVERY_FAILED' : 'REGISTRATION_SUCCESS';
    const responseMessage = emailDeliveryFailed
      ? 'Your account has been created, but we could not send the verification email. Please try sending the verification email again.'
      : 'Registration successful. Please verify your email address to activate your account.';

    // Never issue an authenticated session cookie for an unverified account.
    return NextResponse.json(
      {
        success: true,
        code: responseCode,
        message: responseMessage,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: false,
          requiresEmailVerification: true,
          code: responseCode,
          emailDeliveryStatus: emailResult.status,
          emailDeliveryProvider: emailResult.provider,
          emailDeliveryFailed,
          message: responseMessage,
          nextUrl: `/verify-email?email=${encodeURIComponent(parsed.email)}`,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(`[API Registration Error ${requestId}]:`, {
      code: err?.code,
      name: err?.name,
      message: err?.message,
    });

    // If a concurrent registration request won the race under DB contention, always surface 409 EMAIL_ALREADY_EXISTS
    if (normalizedEmailForCatch) {
      const racedExisting = await prisma.user
        .findFirst({
          where: { email: normalizedEmailForCatch, deletedAt: null },
          select: { id: true },
        })
        .catch(() => null);
      if (racedExisting) {
        return authErrorResponse({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'This email address is already registered. Please sign in or use another email.',
          status: 409,
          field: 'email',
          fieldErrors: {
            email: 'This email address is already registered. Please sign in or use another email.',
          },
          requestId,
        });
      }
    }

    return authErrorResponse(classifyAuthDatabaseError(err, requestId));
  }
}
