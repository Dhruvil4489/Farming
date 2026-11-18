'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sprout,
  LogIn,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getSafeRedirect } from '@/lib/auth-utils';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validate redirect target to prevent open redirect vulnerabilities
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirect(rawRedirect, '/dashboard');

  const queryError = searchParams.get('error');
  const initialError =
    queryError === 'invalid_credentials'
      ? 'Unable to sign in with those details. Check your credentials and try again.'
      : queryError === 'rate_limited'
        ? 'Too many login attempts. Please wait a minute before trying again.'
        : '';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (loading) return;

    setError('');

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError('Please enter your registered mobile number or email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          identifier: trimmedIdentifier,
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg =
          data?.error?.message ||
          (res.status === 429
            ? 'Too many login attempts. Please wait a minute before trying again.'
            : 'Unable to sign in with those details. Check your credentials and try again.');
        throw new Error(errorMsg);
      }

      // Determine final destination: prioritize safe URL param, then default role destination
      const intendedDestination = rawRedirect ? safeRedirect : data?.data?.defaultRedirect || safeRedirect;

      // Perform clean hard redirect to update active server session and cookie context
      window.location.href = intendedDestination;
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please verify your connection and try again.');
      setLoading(false);
    }
  };

  const isProtectedNotice = rawRedirect && (safeRedirect.startsWith('/dashboard') || safeRedirect.startsWith('/farms') || safeRedirect.startsWith('/admin'));

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-2xl p-7 sm:p-9 space-y-6">
      {/* Top Branding (Mobile / Centered Card) */}
      <div className="space-y-2 text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2 group mb-1">
          <div className="w-12 h-12 bg-gradient-to-br from-[#2F7D4F] to-[#143D2A] text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Sprout size={28} />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2D1F] tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Sign in to manage your farm and continue your farming journey.
        </p>
      </div>

      {/* Access Gate Notice */}
      {isProtectedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-medium text-emerald-900 flex items-center gap-2.5 shadow-xs">
          <Lock size={16} className="text-emerald-700 shrink-0" />
          <span>Please sign in to access your farmer records and dashboard.</span>
        </div>
      )}

      {/* Accessible Error Callout */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      {/* Sign In Form */}
      <form
        onSubmit={handleSubmit}
        method="POST"
        action="/api/v1/auth/login"
        className="space-y-4"
        noValidate={false}
      >
        <Input
          id="login-identifier"
          name="identifier"
          label="Mobile Number or Email"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="e.g. 9876543211 or farmer@smartfarm.ai"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          disabled={loading}
          required
        />

        <Input
          id="login-password"
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-stone-400 hover:text-stone-700 focus:outline-none cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="pt-2">
          <Button
            id="login-submit-button"
            type="submit"
            isLoading={loading}
            className="w-full min-h-[48px] bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-sm rounded-xl shadow-md transition-all hover:shadow-lg active:scale-[0.99] cursor-pointer"
          >
            <LogIn size={18} className="mr-2" /> Sign In
          </Button>
        </div>
      </form>

      {/* Navigation Footer */}
      <div className="pt-4 border-t border-stone-200 space-y-3 text-center">
        <p className="text-xs text-stone-600">
          Don't have an account?{' '}
          <Link
            href={`/register${rawRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`}
            className="font-bold text-[#2F7D4F] hover:underline hover:text-[#1e5735]"
          >
            Register as Farmer
          </Link>
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to SmartFarm AI Homepage
        </Link>
      </div>
    </div>
  );
}
