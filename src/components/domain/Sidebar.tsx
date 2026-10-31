'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tractor,
  Grid,
  Sprout,
  CheckSquare,
  CloudSun,
  Eye,
  Droplet,
  Droplets,
  Bot,
  TrendingUp,
  Package,
  BookOpen,
  ShoppingBag,
  ShieldAlert,
  ScanLine,
} from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

const navItems = [
  { href: '/dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farms', key: 'farms', label: 'My Farms', icon: Tractor },
  { href: '/fields', key: 'fields', label: 'Fields', icon: Grid },
  { href: '/crops', key: 'crops', label: 'Crops & Cycles', icon: Sprout },
  { href: '/tasks', key: 'tasks', label: 'Tasks & Activities', icon: CheckSquare },
  { href: '/weather', key: 'weather', label: 'Weather', icon: CloudSun },
  { href: '/mandi', key: 'mandi', label: 'Live Mandi Prices', icon: TrendingUp },
  { href: '/store', key: 'store', label: 'Fertilizer Store', icon: Package },
  { href: '/guidance', key: 'guidance', label: 'Nutrient Guidance', icon: BookOpen },
  { href: '/orders', key: 'orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/soil-moisture', key: 'soil_moisture', label: 'Soil Moisture', icon: Droplets },
  { href: '/scouting', key: 'scouting', label: 'Scouting', icon: Eye },
  { href: '/diagnosis', key: 'crop_disease_ai', label: 'Crop Disease AI', icon: ScanLine },
  { href: '/irrigation', key: 'irrigation', label: 'Irrigation', icon: Droplet },
  { href: '/assistant', key: 'assistant', label: 'AI Assistant', icon: Bot },
  { href: '/admin', key: 'admin', label: 'Admin Panel', icon: ShieldAlert },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-stone-200 min-h-[calc(100vh-4rem)] p-4 space-y-1">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
        {t('platform_spine', 'Platform Navigation')}
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? 'bg-[#E4F1E8] text-[#143D2A] border border-[#2F7D4F]/30'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Icon size={18} className={isActive ? 'text-[#2F7D4F]' : 'text-stone-400'} />
            <span>{t(item.key, item.label)}</span>
          </Link>
        );
      })}
    </aside>
  );
};
