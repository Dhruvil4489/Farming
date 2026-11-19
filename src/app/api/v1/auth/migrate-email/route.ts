import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, normalizeIdentifier } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { checkRateLimit } from '@/lib/rate-limit';
import { AuthTokenService } from '@/services/AuthTokenService';
import { EmailService } from '@/services/EmailService';
import { z } from 'zod';

const migrateSchema = z.object({
  legacyPhone: z.string().trim().min(10, 'Please enter your legacy registered mobile number'),
  password: z.string().min(1, 'Please enter your existing account password'),
  newEmail: z.string().trim().email('Please enter a valid email address'),
});

/**
 * Safe one-time account transition for pre-existing legacy mobile-only accounts (where email IS NULL).
 * - Verifies ownership via existing password
 * - Does NOT attach an unverified email to User.email
 * - Sends a verification link & 6-digit OTP to `newEmail` stored in AuthToken.pendingEmail
 * - Only AFTER email verification is User.email updated and emailVerifiedAt activated!
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const limit = checkRateLimit(`migrate_email:${clientIp}`, 5, 120);
    if (!limit.allowed) {
      return apiError('Too many attempts. Please wait a couple of minutes.', 'rate_limited', 429);
    }

    const body = await req.json();
    const parsed = migrateSchema.parse(body);
    const normalizedEmail = parsed.newEmail.toLowerCase();

    // Check email is not already in use
    const existingEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });
    if (existingEmail) {
      return apiError('This email address is already registered with another account.', 'duplicate_email', 409);
    }

    // Locate legacy account where email IS NULL
    const phoneNorm = normalizeIdentifier(parsed.legacyPhone);
    const legacyUser = await prisma.user.findFirst({
      where: {
        email: null,
        phone: { in: phoneNorm.phoneCandidates },
        deletedAt: null,
      },
    });

    if (!legacyUser || !legacyUser.passwordHash) {
      return apiError(
        'No legacy mobile-only account matched those credentials. If you already have an email account, please sign in directly.',
        'invalid_credentials',
        401
      );
    }

    const validPwd = await verifyPassword(parsed.password, legacyUser.passwordHash);
    if (!validPwd) {
      return apiError('Invalid credentials for legacy account migration.', 'invalid_credentials', 401);
    }

    // Create email_migration token storing pendingEmail (User.email remains NULL until verified!)
    const { rawToken, otpCode } = await AuthTokenService.createToken(
      legacyUser.id,
      'email_migration',
      { pendingEmail: normalizedEmail }
    );

    const verifyUrl = EmailService.getAppUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);
    const emailResult = await EmailService.sendTemplate({
      userId: legacyUser.id,
      toEmail: normalizedEmail,
      templateKey: 'verification',
      locale: (legacyUser.preferredLanguage as any) || 'en',
      isTransactional: true,
      data: { name: legacyUser.name, otpCode, verifyUrl },
    });

    if (emailResult.status === 'failed') {
      return apiError(
        'Unable to send verification email right now. Please try again shortly.',
        'email_delivery_failed',
        502
      );
    }

    return apiSuccess({
      verificationSent: true,
      pendingEmail: normalizedEmail,
      deliveryStatus: emailResult.status,
      message:
        'Verification email sent. Please verify your email address to activate email login — all your existing farm records will remain intact.',
      nextUrl: `/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Please check the entered details.', 'validation_failed', 422);
    }
    console.error('[POST /api/v1/auth/migrate-email]', err);
    return apiError('Unable to process account email transition right now.', 'migrate_failed', 500);
  }
}
