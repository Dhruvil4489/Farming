'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sprout,
  LogIn,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Droplets,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getSafeRedirect } from '@/lib/auth-utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validate redirect target to prevent open redirect vulnerabilities
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirect(rawRedirect, '/dashboard');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
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

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#FAF6EF]">
      {/* Left Agritech Visual Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#071B12] via-[#0F2D1F] to-[#143D2A] text-white flex-col justify-between p-12 overflow-hidden border-r border-emerald-950">
        {/* Subtle decorative background contours */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(47, 125, 79, 0.4) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />

        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2F7D4F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 bg-[#2F7D4F] text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Sprout size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">SmartFarm AI</h2>
              <p className="text-xs text-emerald-300 font-medium">Digital Agriculture & Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Center Editorial Showcase */}
        <div className="relative z-10 space-y-8 my-auto py-10 max-w-lg">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 text-xs font-semibold">
              <ShieldCheck size={14} className="text-emerald-400" />
              Verified Agricultural Platform
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Real-time farm management & agronomy intelligence.
            </h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Connect your fields, track crop stages, inspect verified APMC mandi prices, and access hydrological soil moisture data tailored to your region.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-emerald-800/80 rounded-xl flex items-center justify-center text-emerald-200 shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">APMC Mandi Transparency</h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">Live commodity prices synchronized across regional agricultural markets.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-cyan-900/80 rounded-xl flex items-center justify-center text-cyan-200 shrink-0">
                <Droplets size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Hydrological Soil Moisture</h3>
                <p className="text-xs text-cyan-200/80 mt-0.5">Government NRSC VIC model root-zone moisture tracking from 0–50 cm.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-amber-900/80 rounded-xl flex items-center justify-center text-amber-200 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Crop Stage Guidance</h3>
                <p className="text-xs text-amber-200/80 mt-0.5">Scientific fertilizer timing and pest scouting advisories for every growth phase.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="relative z-10 pt-6 border-t border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300/80">
          <span>SmartFarm AI • Production Release</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Regional Nodes
          </span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#2F7D4F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-medium">Initializing secure sign in...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
