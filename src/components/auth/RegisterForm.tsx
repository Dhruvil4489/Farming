'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Mail,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { evaluatePasswordStrength } from '@/lib/password-policy';

interface RegisterFormProps {
  onSwitchToSignIn?: (email?: string) => void;
}

type FieldErrorMap = Partial<
  Record<
    | 'name'
    | 'email'
    | 'password'
    | 'confirmPassword'
    | 'state'
    | 'district'
    | 'village'
    | 'pincode'
    | 'acceptedTerms',
    string
  >
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function RegisterForm({ onSwitchToSignIn }: RegisterFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    state: 'Gujarat',
    district: 'Vadodara',
    village: '',
    pincode: '',
    acceptedTerms: false,
    preferredLanguage: 'en',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [bannerError, setBannerError] = useState<{ code?: string; message: string } | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    emailDeliveryFailed: boolean;
    message: string;
    nextUrl: string;
  } | null>(null);
  const [resending, setResending] = useState(false);
  const [resendState, setResendState] = useState<{ ok: boolean; message: string } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwdStrength = useMemo(() => evaluatePasswordStrength(form.password), [form.password]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key as keyof FieldErrorMap]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FieldErrorMap];
        return next;
      });
    }
    if (bannerError) setBannerError(null);
  };

  const validateClientFields = (): FieldErrorMap => {
    const errs: FieldErrorMap = {};

    if (!form.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (form.name.trim().length < 2) {
      errs.name = 'Please enter your full name (at least 2 characters).';
    }

    const cleanEmail = form.email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!pwdStrength.valid) {
      errs.password =
        pwdStrength.error ||
        'Your password is too weak. Use at least 8 characters with both letters and numbers.';
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match. Please check both password fields.';
    }

    if (!form.state.trim() || form.state.trim().length < 2) {
      errs.state = 'Please select your state.';
    }
    if (!form.district.trim() || form.district.trim().length < 2) {
      errs.district = 'Please select your district.';
    }
    if (!form.village.trim() || form.village.trim().length < 2) {
      errs.village = 'Please enter your village or city.';
    }

    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      errs.pincode = 'PIN Code must be a 6-digit number (or leave blank).';
    }

    if (!form.acceptedTerms) {
      errs.acceptedTerms = 'Please accept the Terms & Conditions to create your account.';
    }

    return errs;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (loading) return;

    setBannerError(null);
    const localErrors = validateClientFields();
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setBannerError({
        code: 'VALIDATION_ERROR',
        message: 'Some information is missing or incorrect. Please review the highlighted fields.',
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: normalizedEmail,
          password: form.password,
          confirmPassword: form.confirmPassword,
          state: form.state.trim(),
          district: form.district.trim(),
          village: form.village.trim(),
          pincode: form.pincode.trim() || undefined,
          acceptedTerms: form.acceptedTerms,
          preferredLanguage: form.preferredLanguage,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errCode = data?.code || data?.error?.code || 'INTERNAL_ERROR';
        const errMessage =
          data?.message ||
          data?.error?.message ||
          'Something went wrong while creating your account. Please try again later.';

        // Populate exact field-level errors returned from backend
        if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
          setFieldErrors(data.fieldErrors as FieldErrorMap);
        } else if (data?.field) {
          setFieldErrors({ [data.field]: errMessage });
        }

        setBannerError({ code: errCode, message: errMessage });
        setLoading(false);
        return;
      }

      const payload = data?.data || {};
      const nextUrl =
        payload.nextUrl || `/verify-email?email=${encodeURIComponent(normalizedEmail)}`;

      setPendingVerification({
        email: normalizedEmail,
        emailDeliveryFailed: Boolean(payload.emailDeliveryFailed),
        message:
          payload.message ||
          'Your account has been created successfully. Please verify your email address to continue.',
        nextUrl,
      });
      setLoading(false);

      // If verification email dispatched cleanly, smoothly transition to verification screen
      if (!payload.emailDeliveryFailed) {
        setTimeout(() => {
          window.location.href = nextUrl;
        }, 1200);
      }
    } catch (err: any) {
      // Genuine network / connectivity error
      const isNetworkErr =
        err instanceof TypeError ||
        String(err?.message || '').toLowerCase().includes('fetch') ||
        String(err?.message || '').toLowerCase().includes('network');
      setBannerError({
        code: isNetworkErr ? 'NETWORK_ERROR' : 'INTERNAL_ERROR',
        message: isNetworkErr
          ? 'Unable to connect to the server. Please check your internet connection and try again.'
          : 'Something went wrong while creating your account. Please try again later.',
      });
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerification?.email || resending) return;
    setResending(true);
    setResendState(null);
    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerification.email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setResendState({
          ok: false,
          message:
            json?.message ||
            json?.error?.message ||
            "We couldn't send your verification email right now. Please try again shortly.",
        });
        return;
      }
      setResendState({
        ok: true,
        message:
          json?.data?.message ||
          json?.message ||
          'Your verification email has been accepted for sending. Please check your inbox.',
      });
    } catch {
      setResendState({
        ok: false,
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
      });
    } finally {
      setResending(false);
    }
  };

  const strengthColor =
    pwdStrength.score >= 4
      ? 'bg-emerald-600'
      : pwdStrength.score === 3
        ? 'bg-[#2F7D4F]'
        : pwdStrength.score === 2
          ? 'bg-amber-500'
          : 'bg-rose-500';

  // Post-registration confirmation / email delivery recovery screen
  if (pendingVerification) {
    return (
      <div className="space-y-5 py-2">
        <div
          className={`p-5 rounded-2xl border space-y-3 ${pendingVerification.emailDeliveryFailed
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
        >
          <div className="flex items-start gap-3">
            {pendingVerification.emailDeliveryFailed ? (
              <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={22} className="text-[#2F7D4F] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h2 className="text-base font-extrabold">
                {pendingVerification.emailDeliveryFailed
                  ? 'Your account is pending email verification.'
                  : 'Your account has been created successfully.'}
              </h2>
              <p className="text-xs leading-relaxed">{pendingVerification.message}</p>
              <p className="text-xs font-semibold pt-1 flex items-center gap-1.5">
                <Mail size={13} /> {pendingVerification.email}
              </p>
            </div>
          </div>
        </div>

        {resendState && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold border ${resendState.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            {resendState.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link href={pendingVerification.nextUrl} className="flex-1">
            <Button className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3 font-bold">
              Continue to Email Verification
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            isLoading={resending}
            onClick={handleResendVerification}
            className="rounded-xl py-3 font-bold"
          >
            <RefreshCw size={14} className="mr-1.5" /> Resend Verification Email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#0F2D1F] tracking-tight">
          Create Farmer Account
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Register with your email address to unlock crop lifecycle plans, weather alerts, and AI guidance.
        </p>
      </div>

      {/* Structured Top Callout for Duplicate Email / Network / Rate Limit / Summary */}
      {bannerError && (
        <div
          role="alert"
          aria-live="polite"
          className={`p-3.5 rounded-2xl text-xs font-semibold space-y-2.5 border ${bannerError.code === 'EMAIL_ALREADY_EXISTS'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              size={16}
              className={`shrink-0 mt-0.5 ${bannerError.code === 'EMAIL_ALREADY_EXISTS' ? 'text-amber-700' : 'text-red-600'
                }`}
            />
            <div className="flex-1 leading-relaxed">{bannerError.message}</div>
          </div>

          {bannerError.code === 'EMAIL_ALREADY_EXISTS' && (
            <div className="pl-6">
              {onSwitchToSignIn ? (
                <button
                  type="button"
                  onClick={() => onSwitchToSignIn(form.email.trim().toLowerCase())}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#143D2A] hover:bg-[#2F7D4F] text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  <LogIn size={13} /> Sign In with this Email
                </button>
              ) : (
                <Link
                  href={`/login?email=${encodeURIComponent(form.email.trim().toLowerCase())}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#143D2A] hover:bg-[#2F7D4F] text-white text-xs font-bold"
                >
                  <LogIn size={13} /> Sign In with this Email
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <Input
          id="reg-name"
          name="name"
          label="Full Name *"
          type="text"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g. Ramesh Patel"
          autoComplete="name"
          error={fieldErrors.name}
          disabled={loading}
          required
        />

        <Input
          id="reg-email"
          name="email"
          label="Email Address *"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="e.g. ramesh@example.com"
          autoComplete="email"
          autoCapitalize="none"
          error={fieldErrors.email}
          disabled={loading}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="reg-password"
            name="password"
            label="Password *"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="Min 8 chars (letter + number)"
            autoComplete="new-password"
            error={fieldErrors.password}
            disabled={loading}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />

          <Input
            id="reg-confirm-password"
            name="confirmPassword"
            label="Confirm Password *"
            type={showConfirm ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            disabled={loading}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />
        </div>

        {/* Live Password Requirements & Strength Meter */}
        {form.password.length > 0 && (
          <div className="p-2.5 bg-[#F7F8F5] rounded-xl border border-stone-200 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-600">Password Strength:</span>
              <span className="font-bold text-[#143D2A]">{pwdStrength.label}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 h-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`rounded-full transition-colors ${pwdStrength.score >= step ? strengthColor : 'bg-stone-200'
                    }`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-stone-600 pt-0.5">
              <span className={pwdStrength.checks.minLength ? 'text-emerald-700 font-bold' : ''}>
                {pwdStrength.checks.minLength ? '✓' : '•'} 8+ chars
              </span>
              <span className={pwdStrength.checks.hasLetter ? 'text-emerald-700 font-bold' : ''}>
                {pwdStrength.checks.hasLetter ? '✓' : '•'} Letter
              </span>
              <span className={pwdStrength.checks.hasNumber ? 'text-emerald-700 font-bold' : ''}>
                {pwdStrength.checks.hasNumber ? '✓' : '•'} Number
              </span>
              {form.confirmPassword.length > 0 && (
                <span
                  className={
                    form.password === form.confirmPassword
                      ? 'text-emerald-700 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {form.password === form.confirmPassword ? '✓ Matches' : '✗ Does not match'}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="reg-state"
            name="state"
            label="State *"
            type="text"
            value={form.state}
            onChange={(e) => updateField('state', e.target.value)}
            placeholder="e.g. Gujarat"
            error={fieldErrors.state}
            disabled={loading}
            required
          />
          <Input
            id="reg-district"
            name="district"
            label="District *"
            type="text"
            value={form.district}
            onChange={(e) => updateField('district', e.target.value)}
            placeholder="e.g. Vadodara"
            error={fieldErrors.district}
            disabled={loading}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="reg-village"
            name="village"
            label="Village / City *"
            type="text"
            value={form.village}
            onChange={(e) => updateField('village', e.target.value)}
            placeholder="e.g. Padra"
            error={fieldErrors.village}
            disabled={loading}
            required
          />
          <Input
            id="reg-pincode"
            name="pincode"
            label="PIN Code (Optional)"
            type="text"
            inputMode="numeric"
            value={form.pincode}
            onChange={(e) => updateField('pincode', e.target.value)}
            placeholder="e.g. 391440"
            error={fieldErrors.pincode}
            disabled={loading}
          />
        </div>

        {/* Terms & Conditions with inline error */}
        <div className="space-y-1">
          <label
            className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs text-stone-700 cursor-pointer select-none ${fieldErrors.acceptedTerms
              ? 'bg-red-50/60 border-red-300'
              : 'bg-[#F7F8F5] border-stone-200/80'
              }`}
          >
            <input
              id="reg-terms"
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(e) => updateField('acceptedTerms', e.target.checked)}
              className="mt-0.5 rounded border-stone-300 text-[#2F7D4F] focus:ring-[#2F7D4F]"
            />
            <span className="leading-relaxed">
              I agree to SmartFarm AI&apos;s{' '}
              <strong className="text-[#143D2A]">Terms &amp; Conditions</strong> and consent to receive email verification and essential farming alerts.
            </span>
          </label>
          {fieldErrors.acceptedTerms && (
            <p className="text-xs text-red-600 font-medium pl-1">{fieldErrors.acceptedTerms}</p>
          )}
        </div>

        <Button
          id="register-submit-button"
          type="submit"
          isLoading={loading}
          disabled={loading}
          className="w-full min-h-[48px] bg-[#2F7D4F] hover:bg-[#143D2A] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
        >
          <UserPlus size={18} className="mr-2" /> Create Account
        </Button>
      </form>

      <div className="text-center text-xs text-stone-600 pt-1">
        Already have an account?{' '}
        {onSwitchToSignIn ? (
          <button
            type="button"
            onClick={() => onSwitchToSignIn(form.email.trim().toLowerCase())}
            className="font-bold text-[#2F7D4F] hover:underline cursor-pointer"
          >
            Sign In
          </button>
        ) : (
          <Link href="/login" className="font-bold text-[#2F7D4F] hover:underline">
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
