'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sprout, ShieldCheck, ArrowLeft, AlertCircle, Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function MigrateEmailPage() {
  const [legacyPhone, setLegacyPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/migrate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legacyPhone: legacyPhone.trim(),
          password,
          newEmail: newEmail.trim().toLowerCase(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Unable to start email transition.');
      window.location.href =
        json?.data?.nextUrl ||
        `/verify-email?email=${encodeURIComponent(newEmail.trim().toLowerCase())}`;
    } catch (err: any) {
      setError(err.message || 'Migration request failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center p-4 sm:p-8 space-y-6">
      <Link href="/" className="inline-flex items-center gap-2">
        <div className="w-9 h-9 bg-[#143D2A] text-white rounded-xl flex items-center justify-center">
          <Sprout size={20} />
        </div>
        <span className="font-extrabold text-lg text-[#143D2A]">SmartFarm AI</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-7 sm:p-9 space-y-5">
        <div className="space-y-1.5 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#2F7D4F] flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-extrabold text-[#143D2A]">
            Upgrade Legacy Account to Email Login
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            If you created an older account before SmartFarm AI moved to Email-Only authentication, verify your existing credentials and associate a verified email address without losing any farms, fields, or crop records.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Previous Account Mobile Number *"
            type="tel"
            value={legacyPhone}
            onChange={(e) => setLegacyPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            required
          />
          <Input
            label="Existing Account Password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your existing password"
            required
          />
          <Input
            label="Email Address to Associate & Verify *"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="e.g. yourname@example.com"
            required
          />
          <Button
            type="submit"
            isLoading={loading}
            className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3 font-bold"
          >
            <Mail size={16} className="mr-2" /> Send Verification Email
          </Button>
        </form>

        <div className="pt-4 border-t border-stone-200 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#143D2A]"
          >
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
