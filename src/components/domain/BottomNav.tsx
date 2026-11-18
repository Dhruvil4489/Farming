'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Grid, Sprout, TrendingUp, Bot } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    { href: '/dashboard', key: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/fields', key: 'fields', label: 'Fields', icon: Grid },
    { href: '/crops', key: 'crops', label: 'Crops', icon: Sprout },
    { href: '/mandi', key: 'mandi', label: 'Mandi', icon: TrendingUp },
    { href: '/assistant', key: 'assistant', label: 'AI', icon: Bot },
  ];

  return (
          <nav
            aria-label="Mobile Bottom Navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-2 py-1 shadow-lg"
          >
            <div className="flex items-center justify-around">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                        }`}
            >
              <Icon size={19} className={isActive ? 'text-[#2F7D4F]' : 'text-stone-400'} />
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">
                {t(item.key, item.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
