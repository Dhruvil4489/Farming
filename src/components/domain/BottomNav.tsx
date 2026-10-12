'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tractor, Sprout, Bot, TrendingUp } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/farms', label: 'My Farm', icon: Tractor },
    { href: '/market', label: 'Mandi', icon: TrendingUp },
    { href: '/crops', label: 'Crops', icon: Sprout },
    { href: '/assistant', label: 'Assistant', icon: Bot },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around relative">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 min-w-[64px] min-h-[48px] justify-center text-xs ${
                isActive ? 'text-[#2F7D4F] font-bold' : 'text-stone-500 font-medium'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#2F7D4F]' : 'text-stone-400'} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
