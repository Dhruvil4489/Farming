'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  ShieldCheck,
  TrendingUp,
  CloudSun,
  Bot,
  Globe,
  ArrowLeft,
} from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useI18n, type Locale } from '@/providers/I18nProvider';

interface AuthShellProps {
  initialTab?: 'signin' | 'signup';
}

export function AuthShell({ initialTab = 'signin' }: AuthShellProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [prefillEmail, setPrefillEmail] = useState('');
  const { locale, setLocale } = useI18n();

  const handleSwitchToSignIn = (email?: string) => {
    if (email) setPrefillEmail(email);
    setActiveTab('signin');
  };

  return (
    <div className="min-h-screen flex bg-[#FAF6EF]">
      {/* Left Agricultural Visual Panel (Desktop / Tablet Landscape) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative text-white flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-emerald-950">
        {/* Natural Farmland Background Image with Deep Agricultural Green Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('/images/hero-farmland-poster.jpg')` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#071B12]/92 via-[#0F2D1F]/88 to-[#143D2A]/90"
          aria-hidden="true"
        />

        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#2F7D4F]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar: Brand + Language Switcher */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 bg-[#2F7D4F] text-white rounded-2xl flex items-center justify-center shadow-lg border border-emerald-400/30 group-hover:scale-105 transition-transform">
              <Sprout size={24} />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white block leading-none">
                SmartFarm AI
              </span>
              <span className="text-[11px] text-emerald-300 font-medium mt-1 block">
                Intelligent Agriculture Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-xl text-xs font-medium border border-white/15 backdrop-blur-md">
            <Globe size={13} className="text-emerald-300" />
            <select
              value={locale}
              aria-label="Select Language"
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="en" className="text-stone-900">English</option>
              <option value="hi" className="text-stone-900">हिंदी</option>
              <option value="gu" className="text-stone-900">ગુજરાતી</option>
            </select>
          </div>
        </div>

        {/* Center Editorial Hero */}
        <div className="relative z-10 space-y-7 my-auto py-8 max-w-lg">
          <div className="space-y-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck size={14} className="text-emerald-400" />
              Verified Email-Secured Farmer Portal
            </span>
            <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.08]">
              Your Farming Journey Starts Here.
            </h2>
            <p className="text-sm xl:text-base text-emerald-100/90 leading-relaxed">
              Manage your farms, understand your crops, and make smarter farming decisions with AI.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3.5 bg-white/8 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-emerald-700/80 rounded-xl flex items-center justify-center text-emerald-100 shrink-0">
                <Sprout size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  60+ Indian Crops &amp; Automated Lifecycle
                </h3>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Crop-specific growth stages, daily tasks, and timely email reminders from sowing to harvest.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/8 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-sky-800/80 rounded-xl flex items-center justify-center text-sky-100 shrink-0">
                <CloudSun size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Weather &amp; APMC Mandi Rates
                </h3>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Location-aware forecasts, spray safety alerts, and verified government market prices.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/8 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-amber-700/80 rounded-xl flex items-center justify-center text-amber-100 shrink-0">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  ICAR-Grounded AI Agronomy Assistant
                </h3>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Ask questions in English, Hindi, or Gujarati with personalized field-stage context.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-5 border-t border-white/15 flex items-center justify-between text-xs text-emerald-200/80">
          <span>SmartFarm AI • Email-Secured Portal</span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <TrendingUp size={13} className="text-emerald-400" />
            English • हिंदी • ગુજરાતી
          </span>
        </div>
      </div>

      {/* Right Authentication Card Panel */}
      <div className="w-full lg:w-[52%] xl:w-[50%] flex flex-col items-center justify-center p-4 sm:p-8 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-lg space-y-5">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2F7D4F] to-[#143D2A] text-white rounded-xl flex items-center justify-center shadow-md">
                <Sprout size={22} />
              </div>
              <div>
                <span className="font-extrabold text-base text-[#143D2A] block leading-none">
                  SmartFarm AI
                </span>
                <span className="text-[11px] text-stone-500">Your Farming Journey Starts Here</span>
              </div>
            </Link>

            <select
              value={locale}
              aria-label="Select Language"
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-800"
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
              <option value="gu">ગુજરાતી</option>
            </select>
          </div>

          {/* Main Translucent / Clean Auth Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Two Clear Tabs: Sign In | Create Account */}
            <div
              role="tablist"
              aria-label="Authentication Mode"
              className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#F2F5F1] rounded-2xl border border-stone-200/80"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'signin'}
                onClick={() => setActiveTab('signin')}
                className={`py-2.5 px-4 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-[#143D2A] text-white shadow-sm'
                    : 'text-stone-600 hover:text-[#143D2A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'signup'}
                onClick={() => setActiveTab('signup')}
                className={`py-2.5 px-4 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-[#143D2A] text-white shadow-sm'
                    : 'text-stone-600 hover:text-[#143D2A]'
                }`}
              >
                Create Account
              </button>
            </div>

            {activeTab === 'signin' ? (
              <LoginForm
                initialEmail={prefillEmail}
                onSwitchToSignUp={() => setActiveTab('signup')}
              />
            ) : (
              <RegisterForm onSwitchToSignIn={handleSwitchToSignIn} />
            )}

            {/* Footer Link */}
            <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-semibold hover:text-[#143D2A] transition-colors"
              >
                <ArrowLeft size={13} /> Back to Homepage
              </Link>
              <Link
                href="/migrate-email"
                className="text-[11px] font-medium text-stone-400 hover:text-[#2F7D4F] transition-colors"
              >
                Need to migrate an older account to email?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
