import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { evaluatePasswordStrength } from '@/lib/password-policy';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { checkRateLimit } from '@/lib/rate-limit';
import { AuthTokenService } from '@/services/AuthTokenService';
import { EmailService } from '@/services/EmailService';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string().trim().optional(),
  email: z.string().trim().email('Please enter a valid email address').optional(),
  otp: z.string().trim().optional(),
  newPassword: z.string().min(1, 'Please enter a new password'),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const limit = checkRateLimit(`reset_pwd:${clientIp}`, 10, 120);
    if (!limit.allowed) {
      return apiError('Too many attempts. Please wait a couple of minutes.', 'rate_limited', 429);
    }

    const body = await req.json();
    const parsed = resetSchema.parse(body);

    const strength = evaluatePasswordStrength(parsed.newPassword);
    if (!strength.valid) {
      return apiError(
        strength.error || 'Password does not meet security requirements.',
        'weak_password',
        422
      );
    }

    let consumed = null;
    if (parsed.token) {
      consumed = await AuthTokenService.consumeByToken(parsed.token, 'password_reset');
    } else if (parsed.email && parsed.otp) {
      consumed = await AuthTokenService.consumeByEmailOtp(parsed.email, parsed.otp, 'password_reset');
    } else {
      return apiError('Please provide your reset link token or email + 6-digit code.', 'validation_failed', 422);
    }

    if (!consumed?.user) {
      return apiError(
        'Password reset link or code is invalid or expired. Please request a new one.',
        'invalid_token',
        400
      );
    }

    const passwordHash = await hashPassword(parsed.newPassword);
    await prisma.user.update({
      where: { id: consumed.user.id },
      data: { passwordHash },
    });

    if (consumed.user.email) {
      EmailService.sendTemplate({
        userId: consumed.user.id,
        toEmail: consumed.user.email,
        templateKey: 'password_changed',
        locale: (consumed.user.preferredLanguage as any) || 'en',
        preferenceType: 'security',
        isTransactional: true,
        data: {
          name: consumed.user.name,
          loginUrl: EmailService.getAppUrl('/login'),
        },
      }).catch(() => {});
    }

    return apiSuccess({
      reset: true,
      message: 'Your password has been updated. You can now sign in with your email and new password.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Please check your password reset details.', 'validation_failed', 422);
    }
    console.error('[POST /api/v1/auth/reset-password]', err);
    return apiError('Unable to reset password right now. Please try again.', 'reset_failed', 500);
  }
}
