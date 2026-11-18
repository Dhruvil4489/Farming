'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sprout,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getSafeRedirect } from '@/lib/auth-utils';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirect(rawRedirect, '/onboarding');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    state: 'Gujarat',
    district: 'Vadodara',
    village: '',
    preferredLanguage: 'en',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (loading) return;

    setError('');

    if (!form.name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!form.phone.trim() && !form.email.trim()) {
      setError('Please provide either a mobile number or an email address.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Registration failed. Please try again.');
      }

      // Hard redirect to refresh server state and initialize farmer onboarding
      window.location.href = safeRedirect;
    } catch (err: any) {
      setError(err.message || 'Unable to register. Please check your details.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200/90 shadow-2xl p-7 sm:p-9 space-y-6">
      {/* Top Header */}
      <div className="space-y-2 text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2 group mb-1">
          <div className="w-12 h-12 bg-gradient-to-br from-[#2F7D4F] to-[#143D2A] text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Sprout size={28} />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2D1F] tracking-tight">
          Register as a Farmer
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Create your SmartFarm AI profile to manage crops, soil, and mandi market feeds.
        </p>
      </div>

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

      {/* Registration Form */}
      <form
        onSubmit={handleSubmit}
        method="POST"
        action="/api/v1/auth/register"
        className="space-y-4"
      >
        <Input
          id="reg-name"
          name="name"
          label="Full Name *"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Ramesh Patel"
          whyAsk="Used to personalize your agronomic advisory and generated farm records."
          autoComplete="name"
          disabled={loading}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="reg-phone"
            name="phone"
            label="Mobile Number *"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 9876543210"
            whyAsk="Mobile number is used to log in securely and receive critical weather alerts."
            autoComplete="tel"
            disabled={loading}
            required
          />

          <Input
            id="reg-email"
            name="email"
            label="Email Address (Optional)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="e.g. ramesh@patel.in"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <Input
          id="reg-password"
          name="password"
          label="Password *"
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="At least 6 characters"
          autoComplete="new-password"
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

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="reg-state"
            name="state"
            label="State"
            type="text"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            disabled={loading}
          />
          <Input
            id="reg-district"
            name="district"
            label="District"
            type="text"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            disabled={loading}
          />
        </div>

        <Input
          id="reg-village"
          name="village"
          label="Village / Town (Optional)"
          type="text"
          value={form.village}
          onChange={(e) => setForm({ ...form, village: e.target.value })}
          placeholder="e.g. Padra"
          disabled={loading}
        />

        <div className="space-y-1.5">
          <label htmlFor="reg-lang" className="block text-sm font-semibold text-stone-800">
            Preferred Language
          </label>
          <select
            id="reg-lang"
            value={form.preferredLanguage}
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value as any })}
            disabled={loading}
            className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7D4F] min-h-[46px] cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
          </select>
        </div>

        <div className="pt-2">
          <Button
            id="register-submit-button"
            type="submit"
            isLoading={loading}
            className="w-full min-h-[48px] bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-sm rounded-xl shadow-md transition-all hover:shadow-lg active:scale-[0.99] cursor-pointer"
          >
            <UserPlus size={18} className="mr-2" /> Complete Registration
          </Button>
        </div>
      </form>

      {/* Navigation Footer */}
      <div className="pt-4 border-t border-stone-200 space-y-3 text-center">
        <p className="text-xs text-stone-600">
          Already registered?{' '}
          <Link
            href={`/login${rawRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`}
            className="font-bold text-[#2F7D4F] hover:underline hover:text-[#1e5735]"
          >
            Sign In to your account
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
