'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sprout,
  Globe,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Tractor,
  Grid,
  CheckSquare,
  CloudSun,
  TrendingUp,
  Package,
  BookOpen,
  ShoppingBag,
  FlaskConical,
  Droplets,
  Droplet,
  Eye,
  ScanLine,
  Bot,
  User,
  Settings,
  ShieldAlert,
  Bell,
} from 'lucide-react';
import { useI18n, type Locale } from '@/providers/I18nProvider';

interface NavbarProps {
  userName?: string;
  isDemo?: boolean;
  isAdmin?: boolean;
}

  const MOBILE_NAV = [
    { href: '/dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/farms', key: 'farms', label: 'My Farms', icon: Tractor },
    { href: '/fields', key: 'fields', label: 'Fields', icon: Grid },
    { href: '/crops', key: 'crops', label: 'Crops & Cycles', icon: Sprout },
    { href: '/tasks', key: 'tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/diagnosis', key: 'crop_disease_ai', label: 'Crop Disease AI', icon: ScanLine },
    { href: '/assistant', key: 'assistant', label: 'AI Assistant', icon: Bot },
    { href: '/weather', key: 'weather', label: 'Weather', icon: CloudSun },
    { href: '/mandi', key: 'mandi', label: 'Live Mandi', icon: TrendingUp },
    { href: '/store', key: 'store', label: 'Fertilizer Store', icon: Package },
    { href: '/guidance', key: 'guidance', label: 'Nutrient Guide', icon: BookOpen },
    { href: '/orders', key: 'orders', label: 'My Orders', icon: ShoppingBag },
    { href: '/soil', key: 'soil', label: 'Soil Health', icon: FlaskConical },
    { href: '/soil-moisture', key: 'soil_moisture', label: 'Soil Moisture', icon: Droplets },
    { href: '/irrigation', key: 'irrigation', label: 'Irrigation', icon: Droplet },
    { href: '/scouting', key: 'scouting', label: 'Scouting', icon: Eye },
    { href: '/notifications', key: 'notifications', label: 'Notifications', icon: Bell },
    { href: '/profile', key: 'profile', label: 'Profile', icon: User },
    { href: '/settings', key: 'settings', label: 'Settings', icon: Settings },
  ];

  export const Navbar: React.FC<NavbarProps> = ({
    userName = 'Farmer',
    isDemo = false,
    isAdmin = false,
  }) => {
    const pathname = usePathname();
    const { locale, setLocale, t } = useI18n();
    const [drawerOpen, setDrawerOpen] = useState(false);

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
            <div className="bg-amber-600 text-white text-center text-[11px] py-1 px-3 font-bold tracking-wide">
              {t('demo_banner')}
            </div>
      )}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {/* Mobile menu trigger */}
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(!drawerOpen)}
                    aria-label="Open navigation menu"
                    className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white cursor-pointer"
                  >
                    {drawerOpen ? <X size={19} /> : <Menu size={19} />}
                  </button>

                      <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#2F7D4F] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                          <Sprout size={21} />
                        </div>
                        <div>
                          <span className="font-extrabold text-base sm:text-lg leading-none tracking-tight text-white block">
                            {t('app_name', 'SmartFarm AI')}
                          </span>
                          <p className="text-[10px] text-emerald-200/80 leading-none mt-1 hidden sm:block">
                            {t('app_tagline', 'Digital Agriculture')}
                          </p>
                        </div>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Language Switcher */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-xl text-xs font-medium border border-white/10">
                        <Globe size={14} className="text-emerald-300 shrink-0" />
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

                      {/* Notification Bell */}
                      <Link
                        href="/notifications"
                        title="Notifications & Email Alerts"
                        aria-label="Notifications"
                        className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <Bell size={17} />
                      </Link>

                      {/* Profile & Logout */}
                      <div className="flex items-center gap-2 pl-2 border-l border-emerald-800">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-xl transition-colors"
                          title="Farmer Profile"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white border border-emerald-500">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="hidden md:inline text-xs font-semibold text-emerald-100 max-w-[120px] truncate">
                            {userName}
                          </span>
                        </Link>
                        <button
                          id="logout-button"
                          type="button"
                          onClick={handleLogout}
                          title={t('sign_out', 'Sign Out')}
                          aria-label="Sign out"
                          className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Full Navigation Drawer */}
                  {drawerOpen && (
                    <div className="lg:hidden bg-[#0F2D1F] border-t border-emerald-800/80 px-4 py-4 max-h-[75vh] overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {MOBILE_NAV.map((item) => {
                          const Icon = item.icon;
                          const active = pathname === item.href || pathname.startsWith(item.href + '/');
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDrawerOpen(false)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold ${active ? 'bg-[#2F7D4F] text-white' : 'bg-white/5 text-emerald-100 hover:bg-white/10'
                                }`}
                            >
                              <Icon size={15} className="shrink-0" />
                              <span className="truncate">{t(item.key, item.label)}</span>
                            </Link>
                          );
                        })}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setDrawerOpen(false)}
                            className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30"
                          >
                            <ShieldAlert size={15} />
                            <span>{t('admin', 'Admin Panel')}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </header>
                );
};
