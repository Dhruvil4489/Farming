/**
 * SmartFarm AI — Centralized Authentication Error Codes & Structured Response Builder
 *
 * Ensures every auth/registration failure returns:
 * - Meaningful machine-readable `code`
 * - Appropriate HTTP status
 * - Clear, farmer-friendly `message`
 * - Exact `field` / `fieldErrors` mapping for inline UI validation
 * - Backwards-compatible `{ success: false, code, message, field, fieldErrors, error: {...} }` envelope
 * - Zero leakage of stack traces, SQL queries, or SMTP credentials
 */

import { NextResponse } from 'next/server';

export type AuthErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_EMAIL'
  | 'MISSING_FULL_NAME'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_MISMATCH'
  | 'INVALID_LOCATION'
  | 'INVALID_PINCODE'
  | 'TERMS_NOT_ACCEPTED'
  | 'VALIDATION_ERROR'
  | 'INVALID_REQUEST'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_TOKEN'
  | 'DATABASE_UNAVAILABLE'
  | 'EMAIL_DELIVERY_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface AuthErrorOptions {
  code: AuthErrorCode;
  message: string;
  status: number;
  field?: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
  retryAfter?: number;
}

export function authErrorResponse(opts: AuthErrorOptions) {
  const details: Record<string, string[]> = {};
  if (opts.fieldErrors) {
    for (const [k, v] of Object.entries(opts.fieldErrors)) {
      details[k] = [v];
    }
  } else if (opts.field) {
    details[opts.field] = [opts.message];
  }

  const res = NextResponse.json(
    {
      success: false,
      code: opts.code,
      message: opts.message,
      ...(opts.field ? { field: opts.field } : {}),
      ...(opts.fieldErrors ? { fieldErrors: opts.fieldErrors } : opts.field ? { fieldErrors: { [opts.field]: opts.message } } : {}),
      error: {
        code: opts.code,
        message: opts.message,
        ...(opts.field ? { field: opts.field } : {}),
        ...(Object.keys(details).length > 0 ? { details } : {}),
        ...(opts.requestId ? { request_id: opts.requestId } : {}),
      },
    },
    { status: opts.status }
  );

  if (opts.retryAfter !== undefined) {
    res.headers.set('Retry-After', String(opts.retryAfter));
  }

  return res;
}

/**
 * Classifies Prisma / SQLite / PostgreSQL runtime errors into safe, actionable AuthErrorOptions.
 */
export function classifyAuthDatabaseError(err: any, requestId: string): AuthErrorOptions {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');

  // Unique constraint race condition (concurrent duplicate email)
  if (
    code === 'P2002' ||
    /unique constraint failed/i.test(msg) ||
    msg.includes('SQLITE_CONSTRAINT_UNIQUE') ||
    msg.includes('duplicate key value')
  ) {
    return {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'This email address is already registered. Please sign in or use another email.',
      status: 409,
      field: 'email',
      fieldErrors: {
        email: 'This email address is already registered. Please sign in or use another email.',
      },
      requestId,
    };
  }

  // Database connection / lock / timeout errors
  if (
    ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028', 'P2034'].includes(code) ||
    /ECONNREFUSED|SQLITE_BUSY|database is locked|Can't reach database server/i.test(msg)
  ) {
    return {
      code: 'DATABASE_UNAVAILABLE',
      message: 'We are temporarily unable to create your account. Please try again shortly.',
      status: 503,
      requestId,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong while creating your account. Please try again later.',
    status: 500,
    requestId,
  };
}
