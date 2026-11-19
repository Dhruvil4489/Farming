'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sprout,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MailCheck,
  ArrowLeft,
  Mail,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState(emailParam);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!tokenParam) return;
    setStatus('verifying');
    fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(tokenParam)}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok) {
          setStatus('verified');
          setVerifiedEmail(j?.data?.user?.email || emailParam);
          setMessage(
            j?.data?.message ||
            'Your email address has been verified and your account is now active!'
          );
        } else {
          setStatus('error');
          setMessage(j?.error?.message || 'Verification link is invalid or expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not verify your email right now. Please try again.');
      });
  }, [tokenParam, emailParam]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('verifying');
    setMessage('');
    try {
      const res = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Invalid or expired verification code.');
      setStatus('verified');
      setVerifiedEmail(json?.data?.user?.email || email.trim().toLowerCase());
      setMessage(json?.data?.message || 'Your email has been verified and your account is active!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Verification failed.');
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your registered email address to resend verification.');
      return;
    }
    setResending(true);
    setMessage('');
    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Unable to resend verification email.');
      setStatus('idle');
      setMessage(json?.data?.message || 'Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-7 sm:p-9 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto bg-gradient-to-br from-[#2F7D4F] to-[#143D2A] text-white rounded-2xl flex items-center justify-center shadow-lg">
          {status === 'verified' ? <CheckCircle2 size={28} /> : <Mail size={26} />}
        </div>
        <h1 className="text-2xl font-extrabold text-[#0F2D1F]">
          {status === 'verified' ? 'Email Verified!' : 'Verify Your Email Address'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          {status === 'verified'
            ? 'Your SmartFarm AI farmer account is now active and ready to use.'
            : 'We sent a secure verification link and 6-digit code to your registered email address.'}
        </p>
      </div>

      {status === 'verified' ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <CheckCircle2 size={17} className="text-[#2F7D4F]" /> Account Activated
            </div>
            <p>{message}</p>
          </div>
          <Link
            href={`/login?verified=1${verifiedEmail ? `&email=${encodeURIComponent(verifiedEmail)}` : ''}`}
          >
            <Button className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3 font-bold">
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 ${status === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                }`}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <Input
              label="6-Digit Verification Code"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 482910"
              required
            />
            <Button
              type="submit"
              isLoading={status === 'verifying'}
              className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3 font-bold"
            >
              <MailCheck size={16} className="mr-2" /> Verify &amp; Activate Account
            </Button>
          </form>

          <div className="flex items-center justify-between pt-4 border-t border-stone-200 text-xs">
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 font-bold text-[#2F7D4F] hover:underline cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={resending ? 'animate-spin' : ''} /> Resend Verification Email
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-stone-500 hover:text-[#143D2A]"
            >
              <ArrowLeft size={13} /> Back to Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center p-4 sm:p-8 space-y-6">
      <Link href="/" className="inline-flex items-center gap-2">
        <div className="w-9 h-9 bg-[#143D2A] text-white rounded-xl flex items-center justify-center">
          <Sprout size={20} />
        </div>
        <span className="font-extrabold text-lg text-[#143D2A]">SmartFarm AI</span>
      </Link>
      <Suspense fallback={<div className="text-xs text-stone-500">Loading verification...</div>}>
        <VerifyEmailInner />
      </Suspense>
    </div>
  );
}
