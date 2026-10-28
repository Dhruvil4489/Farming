import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

export interface CronAuthResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Validates an incoming scheduled trigger request against the server-side CRON_SECRET.
 *
 * Security requirements:
 * 1. Constant-time comparison using `crypto.timingSafeEqual` prevents timing attacks.
 * 2. Never logs or prints the secret value.
 * 3. Never exposes the secret to the client bundle.
 * 4. Fails safe: if CRON_SECRET is not configured or empty, all incoming calls are rejected.
 * 5. Accepts `Authorization: Bearer <secret>` or `x-cron-secret` header.
 */
export function verifyCronAuth(request: Request | NextRequest): CronAuthResult {
  const serverSecret = process.env.CRON_SECRET;

  // Fail-safe: if no secret is configured, reject all requests
  if (!serverSecret || serverSecret.trim().length === 0) {
    return { authorized: false, reason: 'CRON_SECRET is not configured on server' };
  }

  // Extract token from Authorization header or custom x-cron-secret
  let providedToken: string | null = null;

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      providedToken = match[1].trim();
    }
  }

  if (!providedToken) {
    const customHeader = request.headers.get('x-cron-secret');
    if (customHeader) {
      providedToken = customHeader.trim();
    }
  }

  if (!providedToken) {
    return { authorized: false, reason: 'Missing authorization header' };
  }

  const isValid = constantTimeCompare(providedToken, serverSecret);
  if (!isValid) {
    return { authorized: false, reason: 'Invalid authorization secret' };
  }

  return { authorized: true };
}

/**
 * Compares two strings in constant time.
 * If string lengths differ, executes dummy constant-time comparison to prevent timing leaks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  if (bufA.length !== bufB.length) {
    // Constant-time dummy compare against itself so execution time is indistinguishable
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
