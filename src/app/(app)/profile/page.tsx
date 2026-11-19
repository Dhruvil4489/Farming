'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';
import { useI18n } from '@/providers/I18nProvider';

export default function ProfilePage() {
  const { t, setLocale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    village: '',
    district: '',
    state: '',
    pincode: '',
    preferredLanguage: 'en',
  });
  const [bindEmailInput, setBindEmailInput] = useState('');
  const [bindingEmail, setBindingEmail] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/me');
      if (!res.ok) throw new Error('Unable to load your profile.');
      const json = await res.json();
      const d = json.data;
      setProfile(d);
      setForm({
        name: d.name || '',
        phone: d.phone || '',
        village: d.village || '',
        district: d.district || '',
        state: d.state || '',
        pincode: d.pincode || '',
        preferredLanguage: d.preferredLanguage || 'en',
      });
    } catch (err: any) {
      setError(err.message || 'Unable to load your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleBindEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindEmailInput.trim()) return;
    setBindingEmail(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/bind-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bindEmailInput.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Could not link email.');
      setSavedMsg(json?.data?.message || 'Email linked! Please verify using the sent link or code.');
      setBindEmailInput('');
      await loadProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBindingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    setBindingEmail(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Could not resend verification email.');
      setSavedMsg(json?.data?.message || 'Verification email resent.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBindingEmail(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      const res = await fetch('/api/v1/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Could not update profile.');
      setLocale(form.preferredLanguage as any);
      setSavedMsg('Your farmer profile has been updated.');
      setTimeout(() => setSavedMsg(''), 3500);
    } catch (err: any) {
      setError(err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataState
      status={loading ? 'loading' : error && !profile ? 'error' : 'success'}
      errorMessage={error}
      onRetry={loadProfile}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">
            {t('profile', 'Farmer Profile')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Keep your name, contact number, and village up to date for personalized weather, mandi, and delivery details.
          </p>
        </div>

        {/* Summary Header Card */}
        {profile && (
          <Card className="p-5 rounded-2xl flex items-center gap-4 bg-white">
            <div className="w-14 h-14 rounded-2xl bg-[#143D2A] text-white flex items-center justify-center text-xl font-black shrink-0">
              {(form.name || 'F').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-stone-900 text-lg truncate">{form.name || 'Farmer'}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <ShieldCheck size={11} /> Verified Farmer Account
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                {profile.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={12} /> {profile.email}
                  </span>
                )}
                {form.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={12} /> {form.phone}
                  </span>
                )}
                {(form.village || form.district) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {[form.village, form.district, form.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Email Verification / Legacy Account Transition Card */}
        {profile && !profile.email && (
          <Card className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-start gap-2.5 text-amber-950">
              <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h3 className="font-bold text-sm">Link Your Email Address for Faster Login &amp; Alerts</h3>
                <p>
                  Your account was created earlier using a mobile number. Add your email address below to sign in by email, recover your password, and receive crop stage &amp; weather email alerts — all your existing farms and records stay intact.
                </p>
              </div>
            </div>
            <form onSubmit={handleBindEmail} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={bindEmailInput}
                onChange={(e) => setBindEmailInput(e.target.value)}
                placeholder="Enter your email address (e.g. farmer@example.com)"
                className="flex-1 px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              />
              <Button type="submit" size="sm" isLoading={bindingEmail}>
                Link &amp; Verify Email
              </Button>
            </form>
          </Card>
        )}

        {profile && profile.email && !profile.emailVerified && (
          <Card className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-xs text-amber-950">
              <Mail size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <span>
                Your email <strong>{profile.email}</strong> is not verified yet. Verify it to ensure uninterrupted reminders and password recovery.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/verify-email?email=${encodeURIComponent(profile.email)}`}>
                <Button size="sm" variant="outline">
                  Enter Code
                </Button>
              </Link>
              <Button size="sm" onClick={handleResendVerification} isLoading={bindingEmail}>
                Resend Link
              </Button>
            </div>
          </Card>
        )}

        {savedMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#2F7D4F]" /> {savedMsg}
          </div>
        )}

        {error && profile && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <Card className="p-6 rounded-2xl">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Patel"
                required
              />
              <Input
                label="Mobile Number"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                label="Village / Town"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                placeholder="e.g. Padra"
              />
              <Input
                label="District"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                placeholder="e.g. Vadodara"
              />
              <Input
                label="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="e.g. Gujarat"
              />
              <Input
                label="PIN Code"
                inputMode="numeric"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                placeholder="e.g. 391440"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Preferred Language</label>
              <select
                value={form.preferredLanguage}
                onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>

            <Button
              type="submit"
              isLoading={saving}
              className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3"
            >
              Save Profile
            </Button>
          </form>
        </Card>
      </div>
    </DataState>
  );
}
