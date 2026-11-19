/**
 * SmartFarm AI — Shared Password Strength Policy (Client + Server)
 */

export interface PasswordStrengthResult {
  valid: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  error?: string;
  checks: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
    hasUpperOrSymbol: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const pwd = password || '';
  const minLength = pwd.length >= 8;
  const hasLetter = /[A-Za-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasUpperOrSymbol = /[A-Z]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd);

  let score = 0;
  if (minLength) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  if (hasUpperOrSymbol && pwd.length >= 10) score++;

  const valid = minLength && hasLetter && hasNumber && pwd.length <= 128;

  let error: string | undefined;
  if (pwd.length > 128) {
    error = 'Password must be 128 characters or fewer.';
  } else if (!minLength) {
    error = 'Password must be at least 8 characters long.';
  } else if (!hasLetter || !hasNumber) {
    error = 'Password must include both letters and numbers.';
  }

  const label: PasswordStrengthResult['label'] =
    score >= 4 ? 'Strong' : score === 3 ? 'Good' : score === 2 ? 'Fair' : 'Weak';

  return {
    valid,
    score: score as 0 | 1 | 2 | 3 | 4,
    label,
    error,
    checks: { minLength, hasLetter, hasNumber, hasUpperOrSymbol },
  };
}
