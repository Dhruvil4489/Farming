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
  FlaskConical,
  Eye,
  Droplet,
  Bot,
  TrendingUp,
  Package,
  BookOpen,
  ShoppingBag,
  ShieldAlert,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farms', label: 'My Farms', icon: Tractor },
  { href: '/fields', label: 'Fields', icon: Grid },
  { href: '/crops', label: 'Crops & Cycles', icon: Sprout },
  { href: '/tasks', label: 'Tasks & Activities', icon: CheckSquare },
  { href: '/weather', label: 'Weather', icon: CloudSun },
  { href: '/market', label: 'Live Mandi Prices', icon: TrendingUp },
  { href: '/fertilizers', label: 'Fertilizer Store', icon: Package },
  { href: '/fertilizers/guide', label: 'Nutrient Guidance', icon: BookOpen },
  { href: '/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/soil', label: 'Soil Health', icon: FlaskConical },
  { href: '/scouting', label: 'Scouting', icon: Eye },
  { href: '/irrigation', label: 'Irrigation', icon: Droplet },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/admin', label: 'Admin Panel', icon: ShieldAlert },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-stone-200 min-h-[calc(100vh-4rem)] p-4 space-y-1">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
        Platform Spine
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
            <span>{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
};
