'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sprout, KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { evaluatePasswordStrength } from '@/lib/password-policy';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const strength = evaluatePasswordStrength(newPassword);
    if (!strength.valid) {
      setError(strength.error || 'Password must be at least 8 characters with letters and numbers.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          tokenParam
            ? { token: tokenParam, newPassword }
            : { email: email.trim(), otp: otp.trim(), newPassword }
        ),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Unable to reset password.');
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-7 sm:p-9 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#2F7D4F] to-[#143D2A] text-white rounded-2xl flex items-center justify-center shadow-md">
          <Sprout size={26} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0F2D1F]">Set New Password</h1>
        <p className="text-xs sm:text-sm text-stone-600">
          {tokenParam
            ? 'Your secure reset link is ready. Choose a strong new password below.'
            : 'Enter your email, 6-digit reset code, and new password.'}
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {done ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <CheckCircle2 size={17} className="text-[#2F7D4F]" /> Password Updated
            </div>
            <p>Your password has been reset successfully. You can now sign in with your new password.</p>
          </div>
          <Link href="/login">
            <Button className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3 font-bold">
              Go to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!tokenParam && (
            <>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="6-Digit Reset Code"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="e.g. 482910"
                required
              />
            </>
          )}
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 chars (letters & numbers)"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
          />
          <Button
            type="submit"
            isLoading={loading}
            className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3 font-bold"
          >
            <KeyRound size={16} className="mr-2" /> Update Password
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-stone-200 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#143D2A]"
        >
          <ArrowLeft size={13} /> Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4 sm:p-8">
      <Suspense fallback={<div className="text-xs text-stone-500">Loading...</div>}>
        <ResetPasswordInner />
      </Suspense>
    </div>
  );
}
