'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, Sliders, CheckCircle2, LogOut, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useI18n, type Locale } from '@/providers/I18nProvider';

export default function SettingsPage() {
  const { locale, setLocale, t } = useI18n();
  const [experienceMode, setExperienceMode] = useState<'simple' | 'expert'>('simple');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    fetch('/api/v1/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data?.experienceMode === 'expert') {
          setExperienceMode('expert');
        }
      })
      .catch(() => {});
  }, []);

  const handleModeChange = async (mode: 'simple' | 'expert') => {
    setExperienceMode(mode);
    setSaving(true);
    try {
      const res = await fetch('/api/v1/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceMode: mode }),
      });
      if (res.ok) {
        setSavedMsg(`Switched to ${mode === 'simple' ? 'Simple Farmer' : 'Expert Agronomy'} mode.`);
        setTimeout(() => setSavedMsg(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLanguagePick = (lang: Locale) => {
    setLocale(lang);
    setSavedMsg('Language preference saved.');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">
          {t('settings', 'Settings')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Choose your preferred language and customize how SmartFarm AI works for you.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#2F7D4F]" /> {savedMsg}
        </div>
      )}

      {/* Language Selection */}
      <Card className="p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2.5">
          <Globe size={18} className="text-[#2F7D4F]" />
          <div>
            <h2 className="font-bold text-stone-900 text-base">App Language (ભાષા / भाषा)</h2>
            <p className="text-xs text-stone-500">Switch interface text across English, Hindi, and Gujarati.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { code: 'en' as Locale, title: 'English', sub: 'Default' },
            { code: 'hi' as Locale, title: 'हिंदी', sub: 'Hindi' },
            { code: 'gu' as Locale, title: 'ગુજરાતી', sub: 'Gujarati' },
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguagePick(lang.code)}
              className={`p-3.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                locale === lang.code
                  ? 'border-[#2F7D4F] bg-emerald-50 text-[#143D2A]'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300'
              }`}
            >
              <span className="font-extrabold text-sm block">{lang.title}</span>
              <span className="text-[11px] text-stone-500">{lang.sub}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Experience Mode */}
      <Card className="p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2.5">
          <Sliders size={18} className="text-[#2F7D4F]" />
          <div>
            <h2 className="font-bold text-stone-900 text-base">Farming Experience Mode</h2>
            <p className="text-xs text-stone-500">Keep forms ultra-simple or reveal advanced technical controls.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleModeChange('simple')}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              experienceMode === 'simple'
                ? 'border-[#2F7D4F] bg-emerald-50'
                : 'border-stone-200 hover:border-emerald-300'
            }`}
          >
            <span className="font-bold text-sm text-stone-900 block">Simple Farmer Mode (Recommended)</span>
            <span className="text-xs text-stone-500 mt-1 block">
              Short forms, plain language, and step-by-step guidance.
            </span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleModeChange('expert')}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              experienceMode === 'expert'
                ? 'border-[#2F7D4F] bg-emerald-50'
                : 'border-stone-200 hover:border-emerald-300'
            }`}
          >
            <span className="font-bold text-sm text-stone-900 block">Expert Agronomy Mode</span>
            <span className="text-xs text-stone-500 mt-1 block">
              Full technical telemetry, lab inputs, and advanced diagnostic metrics.
            </span>
          </button>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <User size={18} className="text-[#2F7D4F]" />
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Profile, Email Alerts &amp; Session</h3>
            <p className="text-xs text-stone-500">Manage personal details, email reminder preferences, or sign out.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/notifications">
            <Button size="sm" variant="outline">
              Email Alerts
            </Button>
          </Link>
          <Link href="/profile">
            <Button size="sm" variant="outline">
              Edit Profile
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={handleLogout}
            className="text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            <LogOut size={14} className="mr-1" /> {t('sign_out', 'Sign Out')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
