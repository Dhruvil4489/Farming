import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { AuthTokenService } from '@/services/AuthTokenService';
import { EmailService } from '@/services/EmailService';
import { z } from 'zod';

const bindEmailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

/**
 * Initiates verified email association for an authenticated user without writing an unverified
 * email directly to User.email until verification completes.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return apiError('Please sign in first.', 'unauthorized', 401);

    const body = await req.json();
    const { email } = bindEmailSchema.parse(body);
    const normalizedEmail = email.toLowerCase();

    const duplicate = await prisma.user.findFirst({
      where: { email: normalizedEmail, id: { not: user.id }, deletedAt: null },
    });
    if (duplicate) {
      return apiError('This email address is already registered with another account.', 'duplicate_email', 409);
    }

    const { rawToken, otpCode } = await AuthTokenService.createToken(user.id, 'email_migration', {
      pendingEmail: normalizedEmail,
    });
    const verifyUrl = EmailService.getAppUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);

    const emailResult = await EmailService.sendTemplate({
      userId: user.id,
      toEmail: normalizedEmail,
      templateKey: 'verification',
      locale: (user.preferredLanguage as any) || 'en',
      isTransactional: true,
      data: { name: user.name, otpCode, verifyUrl },
    });

    if (emailResult.status === 'failed') {
      return apiError('Unable to send verification email right now. Please try again.', 'email_delivery_failed', 502);
    }

    return apiSuccess({
      pendingEmail: normalizedEmail,
      verified: false,
      deliveryStatus: emailResult.status,
      message: 'Verification link and code sent. Your email will be activated once verified.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Please enter a valid email address.', 'validation_failed', 422);
    }
    console.error('[POST /api/v1/auth/bind-email]', err);
    return apiError('Unable to send verification email right now.', 'bind_failed', 500);
  }
}
