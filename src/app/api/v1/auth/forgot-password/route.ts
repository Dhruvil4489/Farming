import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { checkRateLimit } from '@/lib/rate-limit';
import { AuthTokenService } from '@/services/AuthTokenService';
import { EmailService } from '@/services/EmailService';
import { z } from 'zod';

const forgotSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const limit = checkRateLimit(`forgot_pwd:${clientIp}`, 5, 120);
    if (!limit.allowed) {
      return apiError(
        'Too many password reset requests. Please wait a couple of minutes before trying again.',
        'rate_limited',
        429
      );
    }

    const body = await req.json();
    const { email } = forgotSchema.parse(body);
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    if (user) {
      const { rawToken, otpCode } = await AuthTokenService.createToken(user.id, 'password_reset');
      const resetUrl = EmailService.getAppUrl(
        `/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(normalizedEmail)}`
      );

      await EmailService.sendTemplate({
        userId: user.id,
        toEmail: normalizedEmail,
        templateKey: 'password_reset',
        locale: (user.preferredLanguage as any) || 'en',
        isTransactional: true,
        data: {
          name: user.name,
          otpCode,
          resetUrl,
        },
      });
    }

    // Always return neutral response to prevent account enumeration
    return apiSuccess({
      sent: true,
      message:
        'If an account exists with that email address, we have sent a password reset link and 6-digit code.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Please enter a valid email address.', 'validation_failed', 422);
    }
    console.error('[POST /api/v1/auth/forgot-password]', err);
    return apiError('Unable to process password reset request.', 'forgot_failed', 500);
  }
}
