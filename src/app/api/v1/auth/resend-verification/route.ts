import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { checkRateLimit } from '@/lib/rate-limit';
import { AuthTokenService } from '@/services/AuthTokenService';
import { EmailService } from '@/services/EmailService';

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const limit = checkRateLimit(`resend_verify:${clientIp}`, 5, 120);
    if (!limit.allowed) {
      return apiError(
        'Please wait a couple of minutes before requesting another verification email.',
        'rate_limited',
        429
      );
    }

    const body = await req.json().catch(() => ({}));
    const authedUser = await getAuthenticatedUser();
    const targetEmail = (body?.email || authedUser?.email || '').trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      return apiError('Please enter a valid email address.', 'missing_email', 422);
    }

    const user = await prisma.user.findFirst({
      where: { email: targetEmail, deletedAt: null },
    });

    // Always return a neutral message if email not found (no enumeration)
    if (!user) {
      return apiSuccess({
        sent: true,
        deliveryStatus: 'neutral',
        message: 'If that email address is registered and unverified, a fresh verification email has been sent.',
      });
    }

    if (user.emailVerifiedAt) {
      return apiSuccess({
        alreadyVerified: true,
        message: 'Your email address is already verified. You can sign in now.',
      });
    }

    // Generate fresh token & OTP (invalidates previous unused tokens)
    const { rawToken, otpCode } = await AuthTokenService.createToken(user.id, 'email_verification');
    const verifyUrl = EmailService.getAppUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);

    // Check provider status before sending so we can give a meaningful message
    const providerInfo = EmailService.getProviderInfo();

    const emailResult = await EmailService.sendTemplate({
      userId: user.id,
      toEmail: targetEmail,
      templateKey: 'verification',
      locale: (user.preferredLanguage as any) || 'en',
      isTransactional: true,
      data: { name: user.name, otpCode, verifyUrl },
    });

    // ── Honest status responses ─────────────────────────────────────────────
    if (!providerInfo.configured) {
      // No SMTP/Resend configured — email was NOT actually sent
      return apiSuccess({
        sent: false,
        deliveryStatus: 'unconfigured',
        provider: 'local_outbox',
        message:
          'Email delivery is not configured on this server. ' +
          'Please ask your administrator to configure SMTP or Resend credentials in .env, then try again.',
        adminNote:
          'Set SMTP_HOST + SMTP_USER + SMTP_PASS (or RESEND_API_KEY) in the .env file to enable real email delivery.',
      });
    }

    if (emailResult.status === 'failed') {
      return apiError(
        `We could not send your verification email right now (${emailResult.error || 'delivery failed'}). ` +
        `Please try again in a few minutes.`,
        'email_delivery_failed',
        502
      );
    }

    // Email was accepted by SMTP/Resend
    return apiSuccess({
      sent: true,
      deliveryStatus: emailResult.status,  // 'sent'
      provider: emailResult.provider,
      logId: emailResult.logId,
      message:
        'Your verification email has been sent. Please check your inbox (and spam folder) for the 6-digit code and verification link.',
    });

  } catch (err) {
    console.error('[POST /api/v1/auth/resend-verification]', err);
    return apiError('Unable to resend verification email right now. Please try again.', 'resend_failed', 500);
  }
}
