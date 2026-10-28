/**
 * Client-safe authentication and redirect utilities.
 * This file has NO server dependencies (no prisma, bcrypt, or next/headers)
 * and is 100% safe to import in both Client Components and Server Components.
 */

/**
 * Normalizes user identifier (email or phone) into query-ready values.
 * Mobile numbers in India can be formatted as:
 * - 10 digits: 9876543210
 * - Country code: +919876543210
 * - With spacing/hyphens: +91 98765 43210 or 98765-43210
 * - Trunk prefix: 09876543210
 */
export function normalizeIdentifier(raw: string): {
  isEmail: boolean;
  email?: string;
  phoneCandidates: string[];
  cleanPhone?: string;
} {
  const trimmed = (raw || '').trim();

  if (trimmed.includes('@')) {
    return {
      isEmail: true,
      email: trimmed.toLowerCase(),
      phoneCandidates: [],
    };
  }

  // Treat as potential mobile number
  const digitsOnly = trimmed.replace(/\D/g, '');
  const candidates: string[] = [trimmed];

  let tenDigit = '';
  if (digitsOnly.length === 10) {
    tenDigit = digitsOnly;
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    tenDigit = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    tenDigit = digitsOnly.slice(1);
  }

  if (tenDigit) {
    candidates.push(tenDigit);
    candidates.push(`+91${tenDigit}`);
    candidates.push(`+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}`);
    candidates.push(`+91 ${tenDigit}`);
    candidates.push(`0${tenDigit}`);
  }

  // Deduplicate candidates
  const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));

  return {
    isEmail: false,
    phoneCandidates: uniqueCandidates,
    cleanPhone: tenDigit ? `+91${tenDigit}` : trimmed,
  };
}

const DEFAULT_DEV_FALLBACK = 'smartfarm_jwt_super_secret_key_2026';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim().length === 0) {
      throw new Error('[Security Hardening] JWT_SECRET must be configured in production environment.');
    }
    if (secret === DEFAULT_DEV_FALLBACK) {
      throw new Error('[Security Hardening] Default development JWT_SECRET cannot be used in production.');
    }
    if (secret.length < 32) {
      throw new Error('[Security Hardening] Production JWT_SECRET must be at least 32 characters in length.');
    }
    return secret;
  }

  return secret || DEFAULT_DEV_FALLBACK;
}

/**
 * Validates redirect destination to prevent open-redirect vulnerabilities.
 * Allows only strictly relative same-origin paths.
 */
export function getSafeRedirect(target: string | null | undefined, fallback: string = '/dashboard'): string {
  if (!target || typeof target !== 'string') return fallback;

  const trimmed = target.trim();

  // Must begin with a single slash, not double slash or backslash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Reject URLs containing a protocol (e.g. javascript:, http:, https:, data:)
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    return fallback;
  }

  // Reject newline / carriage-return / null byte injection
  if (/[\r\n\t\0]/.test(trimmed)) {
    return fallback;
  }

  // Also check decoded representation to prevent URL-encoded bypasses (%2f, %5c, etc.)
  try {
    const decoded = decodeURIComponent(trimmed);
    if (
      !decoded.startsWith('/') ||
      decoded.startsWith('//') ||
      decoded.startsWith('/\\') ||
      /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(decoded) ||
      /[\r\n\t\0]/.test(decoded)
    ) {
      return fallback;
    }
  } catch {
    // Malformed URI sequence
    return fallback;
  }

  return trimmed;
}
