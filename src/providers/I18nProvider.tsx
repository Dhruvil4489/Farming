'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import gu from '@/locales/gu.json';

export type Locale = 'en' | 'hi' | 'gu';

const dictionaries: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
  gu: gu as Record<string, string>,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key, fallback) => fallback || key,
  formatDate: (date) => (typeof date === 'string' ? date : date.toLocaleDateString()),
  formatNumber: (num) => num.toString(),
  formatCurrency: (amt) => `₹${amt}`,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load persisted language on client mount
  useEffect(() => {
    try {
      // 1. Check cookie
      const cookieMatch = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
      const cookieLocale = cookieMatch ? (cookieMatch[1] as Locale) : null;

      // 2. Check localStorage
      const localLocale = localStorage.getItem('smartfarm_locale') as Locale | null;

      const resolved = cookieLocale || localLocale || 'en';
      if (['en', 'hi', 'gu'].includes(resolved)) {
        setLocaleState(resolved);
      }
    } catch {
      // Ignore security errors in restricted environments
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!['en', 'hi', 'gu'].includes(newLocale)) return;
    setLocaleState(newLocale);

    try {
      localStorage.setItem('smartfarm_locale', newLocale);
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Fallback
    }

    // Try updating user profile preference in background
    fetch('/api/v1/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredLanguage: newLocale }),
    }).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = dictionaries[locale] || dictionaries.en;
      if (dict[key]) return dict[key];
      if (dictionaries.en[key]) return dictionaries.en[key];
      return fallback !== undefined ? fallback : key;
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return String(date);
        const localeCode = locale === 'hi' ? 'hi-IN' : locale === 'gu' ? 'gu-IN' : 'en-IN';
        return d.toLocaleDateString(localeCode, options || { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return String(date);
      }
    },
    [locale]
  );

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      try {
        const localeCode = locale === 'hi' ? 'hi-IN' : locale === 'gu' ? 'gu-IN' : 'en-IN';
        return new Intl.NumberFormat(localeCode, options).format(num);
      } catch {
        return String(num);
      }
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number): string => {
      try {
        const localeCode = locale === 'hi' ? 'hi-IN' : locale === 'gu' ? 'gu-IN' : 'en-IN';
        return new Intl.NumberFormat(localeCode, {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `₹${amount}`;
      }
    },
    [locale]
  );

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatDate,
      formatNumber,
      formatCurrency,
    }),
    [locale, setLocale, t, formatDate, formatNumber, formatCurrency]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

