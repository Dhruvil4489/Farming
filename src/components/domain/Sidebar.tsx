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
  FlaskConical,
  User,
  Settings,
} from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

  interface SidebarProps {
    isAdmin?: boolean;
  }

const navGroups = [
  {
    titleKey: 'nav_group_farm',
    titleFallback: 'My Farm',
    items: [
      { href: '/dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/farms', key: 'farms', label: 'My Farms', icon: Tractor },
      { href: '/fields', key: 'fields', label: 'Fields', icon: Grid },
      { href: '/crops', key: 'crops', label: 'Crops & Cycles', icon: Sprout },
      { href: '/tasks', key: 'tasks', label: 'Tasks & Activities', icon: CheckSquare },
    ],
  },
  {
    titleKey: 'nav_group_ai',
    titleFallback: 'Smart Monitoring & AI',
    items: [
      { href: '/diagnosis', key: 'crop_disease_ai', label: 'Crop Disease AI', icon: ScanLine },
      { href: '/assistant', key: 'assistant', label: 'AI Assistant', icon: Bot },
      { href: '/weather', key: 'weather', label: 'Weather & Forecast', icon: CloudSun },
      { href: '/soil', key: 'soil', label: 'Soil Health', icon: FlaskConical },
      { href: '/soil-moisture', key: 'soil_moisture', label: 'Soil Moisture', icon: Droplets },
      { href: '/irrigation', key: 'irrigation', label: 'Irrigation', icon: Droplet },
      { href: '/scouting', key: 'scouting', label: 'Field Scouting', icon: Eye },
    ],
  },
  {
    titleKey: 'nav_group_market',
    titleFallback: 'Mandi & Store',
    items: [
      { href: '/mandi', key: 'mandi', label: 'Live Mandi Prices', icon: TrendingUp },
      { href: '/store', key: 'store', label: 'Fertilizer Store', icon: Package },
      { href: '/guidance', key: 'guidance', label: 'Nutrient Guidance', icon: BookOpen },
      { href: '/orders', key: 'orders', label: 'My Orders', icon: ShoppingBag },
    ],
  },
  {
    titleKey: 'nav_group_account',
    titleFallback: 'Account',
    items: [
      { href: '/profile', key: 'profile', label: 'Farmer Profile', icon: User },
      { href: '/settings', key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

  export const Sidebar: React.FC<SidebarProps> = ({ isAdmin = false }) => {
    const pathname = usePathname();
    const { t } = useI18n();

    return (
          <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-stone-200/90 min-h-[calc(100vh-4rem)] p-4 space-y-5 shrink-0">
            {navGroups.map((group) => (
              <div key={group.titleKey} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  {t(group.titleKey, group.titleFallback)}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${isActive
                          ? 'bg-[#E4F1E8] text-[#143D2A] shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
                        }`}
                    >
                      <Icon size={17} className={isActive ? 'text-[#2F7D4F]' : 'text-stone-400'} />
                      <span className="truncate">{t(item.key, item.label)}</span>
                    </Link>
                  );
                })}
              </div>
            ))}

            {isAdmin && (
              <div className="pt-3 border-t border-stone-200 space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  Administration
                </div>
                <Link
            href="/admin"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${pathname.startsWith('/admin')
                      ? 'bg-[#0F2D1F] text-white'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                >
                  <ShieldAlert size={17} className={pathname.startsWith('/admin') ? 'text-emerald-300' : 'text-stone-400'} />
                  <span>{t('admin', 'Admin Panel')}</span>
                </Link>
              </div>
            )}
          </aside>
  );
};
