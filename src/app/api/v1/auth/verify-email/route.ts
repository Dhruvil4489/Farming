import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { AuthTokenService } from '@/services/AuthTokenService';
import { EmailService } from '@/services/EmailService';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().trim().optional(),
  email: z.string().trim().email('Please enter a valid email address').optional(),
  otp: z.string().trim().optional(),
});

async function activateAccount(consumed: {
  user: any;
  pendingEmail: string | null;
  type: string;
}) {
  const { user, pendingEmail, type } = consumed;

  // For legacy mobile-to-email migration: ensure pendingEmail is still unique before writing
  let targetEmail = user.email;
  if (type === 'email_migration' && pendingEmail) {
    const taken = await prisma.user.findFirst({
      where: { email: pendingEmail, id: { not: user.id }, deletedAt: null },
    });
    if (taken) {
      return { error: 'That email address is already associated with another account.' };
    }
    targetEmail = pendingEmail;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(type === 'email_migration' && pendingEmail ? { email: pendingEmail } : {}),
      emailVerifiedAt: new Date(),
    },
    select: { id: true, name: true, email: true, emailVerifiedAt: true, preferredLanguage: true },
  });

  // Send welcome / account activated confirmation email
  if (targetEmail) {
    await EmailService.sendTemplate({
      userId: updated.id,
      toEmail: targetEmail,
      templateKey: 'registration_success',
      locale: (updated.preferredLanguage as any) || 'en',
      isTransactional: true,
      dedupeKey: `welcome_activated:${updated.id}:${targetEmail}`,
      data: {
        name: updated.name,
        loginUrl: EmailService.getAppUrl('/login'),
      },
    }).catch(() => {});
  }

  return { user: updated };
}

export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token) {
      return apiError('Verification token is required.', 'missing_token', 400);
    }

    const consumed = await AuthTokenService.consumeByToken(token, [
      'email_verification',
      'email_migration',
    ]);
    if (!consumed) {
      return apiError(
        'This verification link is invalid or has expired. Please request a new verification email.',
        'invalid_token',
        400
      );
    }

    const result = await activateAccount(consumed);
    if ('error' in result) {
      return apiError(result.error!, 'duplicate_email', 409);
    }

    return apiSuccess({
      verified: true,
      activated: true,
      user: result.user,
      message: 'Your email has been verified and your account is now active. You can sign in now.',
    });
  } catch (err) {
    console.error('[GET /api/v1/auth/verify-email]', err);
    return apiError('Unable to verify your email right now. Please try again.', 'verify_failed', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.parse(body);

    let consumed = null;
    if (parsed.token) {
      consumed = await AuthTokenService.consumeByToken(parsed.token, [
        'email_verification',
        'email_migration',
      ]);
    } else if (parsed.email && parsed.otp) {
      consumed = await AuthTokenService.consumeByEmailOtp(parsed.email, parsed.otp, [
        'email_verification',
        'email_migration',
      ]);
    } else {
      return apiError(
        'Please provide a verification link token or your email address and 6-digit code.',
        'validation_failed',
        422
      );
    }

    if (!consumed) {
      return apiError(
        'Invalid or expired verification code. Please check the code or request a new email.',
        'invalid_token',
        400
      );
    }

    const result = await activateAccount(consumed);
    if ('error' in result) {
      return apiError(result.error!, 'duplicate_email', 409);
    }

    return apiSuccess({
      verified: true,
      activated: true,
      user: result.user,
      message: 'Your email has been verified and your account is now active. You can sign in now.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError(err.issues[0]?.message || 'Invalid verification request.', 'validation_failed', 422);
    }
    console.error('[POST /api/v1/auth/verify-email]', err);
    return apiError('Unable to verify your email right now. Please try again.', 'verify_failed', 500);
  }
}
