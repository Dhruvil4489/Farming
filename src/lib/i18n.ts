import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import gu from '@/locales/gu.json';

export type Locale = 'en' | 'hi' | 'gu';

const translations: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
  gu: gu as Record<string, string>,
};

export function getTranslation(key: string, locale: Locale = 'en'): string {
  const dict = translations[locale] || translations.en;
  return dict[key] || translations.en[key] || key;
}

export { I18nProvider, useI18n } from '@/providers/I18nProvider';
