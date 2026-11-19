'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LogIn,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  MailCheck,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getSafeRedirect } from '@/lib/auth-utils';

interface LoginFormProps {
  initialEmail?: string;
  onSwitchToSignUp?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function LoginForm({ initialEmail = '', onSwitchToSignUp }: LoginFormProps) {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirect(rawRedirect, '/dashboard');
  const verifiedParam = searchParams.get('verified') === '1';

  const [email, setEmail] = useState(initialEmail || searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setFieldErrors({});
      setError('');
    }
  }, [initialEmail]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (loading) return;

    setError('');
    setUnverifiedEmail(null);
    setResendMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    const errs: { email?: string; password?: string } = {};
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Please enter your password.';
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          rememberMe,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errCode = data?.code || data?.error?.code;
        const errMessage =
          data?.message ||
          data?.error?.message ||
          'Invalid email address or password. Please check your credentials and try again.';

        if (data?.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }

        if (errCode === 'EMAIL_NOT_VERIFIED' || errCode === 'email_not_verified') {
          setUnverifiedEmail(trimmedEmail);
          setError(errMessage);
          setLoading(false);
          return;
        }

        setError(errMessage);
        setLoading(false);
        return;
      }

      const intendedDestination = rawRedirect
        ? safeRedirect
        : data?.data?.defaultRedirect || safeRedirect;
      window.location.href = intendedDestination;
    } catch (err: any) {
      const isNetworkErr =
        err instanceof TypeError || String(err?.message || '').toLowerCase().includes('fetch');
      setError(
        isNetworkErr
          ? 'Unable to connect to the server. Please check your internet connection and try again.'
          : 'Unable to sign in right now. Please try again later.'
      );
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    setResendMessage('');
    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Unable to resend verification email.');
      setResendMessage(json?.data?.message || 'Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const isProtectedNotice =
    rawRedirect &&
    (safeRedirect.startsWith('/dashboard') ||
      safeRedirect.startsWith('/farms') ||
      safeRedirect.startsWith('/admin'));

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#0F2D1F] tracking-tight">
          Sign in to SmartFarm AI
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Enter your registered email address and password.
        </p>
      </div>

      {verifiedParam && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#2F7D4F] shrink-0" />
          <span>Your email has been verified! Sign in below to access your dashboard.</span>
        </div>
      )}

      {isProtectedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-900 flex items-center gap-2.5">
          <Lock size={16} className="text-emerald-700 shrink-0" />
          <span>Please sign in to access your farmer dashboard and records.</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 space-y-2.5"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>

          {unverifiedEmail && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
              <button
                type="button"
                disabled={resending}
                onClick={handleResendVerification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-900 hover:bg-red-100 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                Resend Verification Email
              </button>
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#143D2A] text-white text-xs font-bold hover:bg-[#2F7D4F]"
              >
                <MailCheck size={12} /> Enter Verification Code
              </Link>
            </div>
          )}
        </div>
      )}

      {resendMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-[#2F7D4F] shrink-0" />
          <span>{resendMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="login-email"
          name="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
            if (error) setError('');
          }}
          placeholder="e.g. farmer@smartfarm.ai"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          error={fieldErrors.email}
          disabled={loading}
          required
        />

        <Input
          id="login-password"
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            if (error) setError('');
          }}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={fieldErrors.password}
          disabled={loading}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-stone-400 hover:text-stone-700 focus:outline-none cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="inline-flex items-center gap-2 text-stone-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-stone-300 text-[#2F7D4F] focus:ring-[#2F7D4F]"
            />
            <span>Remember Me</span>
          </label>
          <Link
            href="/forgot-password"
            className="font-bold text-[#2F7D4F] hover:text-[#143D2A] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          id="login-submit-button"
          type="submit"
          isLoading={loading}
          disabled={loading}
          className="w-full min-h-[48px] bg-[#2F7D4F] hover:bg-[#143D2A] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
        >
          <LogIn size={18} className="mr-2" /> Sign In
        </Button>
      </form>

      <div className="text-center text-xs text-stone-600 pt-1">
        New to SmartFarm AI?{' '}
        {onSwitchToSignUp ? (
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-bold text-[#2F7D4F] hover:underline cursor-pointer"
          >
            Create New Account
          </button>
        ) : (
          <Link href="/register" className="font-bold text-[#2F7D4F] hover:underline">
            Create New Account
          </Link>
        )}
      </div>
    </div>
  );
}
