'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, Globe, User, LogOut } from 'lucide-react';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { useI18n } from '@/providers/I18nProvider';

interface NavbarProps {
  userName?: string;
  isDemo?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ userName = 'Farmer', isDemo = false }) => {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 bg-[#143D2A] text-white shadow-md">
      {isDemo && (
        <div className="bg-orange-500 text-white text-center text-xs py-1 font-bold tracking-wide">
          {t('demo_banner')}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-[#2F7D4F] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sprout size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight text-white">{t('app_name', 'SmartFarm AI')}</h1>
            <p className="text-[11px] text-emerald-200/80 leading-none mt-0.5">{t('app_tagline', 'Digital Agriculture')}</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium">
            <Globe size={14} className="text-emerald-300" />
            <select
              value={locale}
              aria-label="Select Language"
              onChange={(e) => setLocale(e.target.value as any)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="en" className="text-stone-900">English</option>
              <option value="hi" className="text-stone-900">हिंदी</option>
              <option value="gu" className="text-stone-900">ગુજરાતી</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-emerald-800">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white border border-emerald-500">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline text-xs font-semibold text-emerald-100">{userName}</span>
            <button
              id="logout-button"
              onClick={handleLogout}
              title={t('sign_out', 'Sign Out')}
              aria-label="Sign out"
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
