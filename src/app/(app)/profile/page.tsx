'use client';

import React, { useEffect, useState } from 'react';
import { User, MapPin, Phone, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
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
    preferredLanguage: 'en',
  });

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
        preferredLanguage: d.preferredLanguage || 'en',
      });
    } catch (err: any) {
      setError(err.message || 'Unable to load your profile.');
    } finally {
      setLoading(false);
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
