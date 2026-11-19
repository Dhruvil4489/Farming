'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sprout, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Unable to send reset email.');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to send password reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2F7D4F] to-[#143D2A] text-white rounded-2xl flex items-center justify-center shadow-md">
              <Sprout size={26} />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#0F2D1F]">Forgot Password?</h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Enter your registered email address and we will send you a secure password reset link and 6-digit code.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle2 size={17} className="text-[#2F7D4F]" /> Reset Instructions Sent
              </div>
              <p>
                If an account exists for <strong>{email}</strong>, a password reset link and 6-digit OTP code have been sent. The code expires in 30 minutes.
              </p>
            </div>
            <Link href={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`}>
              <Button className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3">
                Enter Reset Code
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. farmer@smartfarm.ai"
              required
            />
            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3 font-bold"
            >
              <Mail size={16} className="mr-2" /> Send Reset Link &amp; Code
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
    </div>
  );
}
