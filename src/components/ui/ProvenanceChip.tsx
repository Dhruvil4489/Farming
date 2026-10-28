import React from 'react';
import { getTranslation, Locale } from '@/lib/i18n';

export type ProvenanceType =
  | 'measured'
  | 'forecast'
  | 'official_market'
  | 'model_prediction'
  | 'verified_source'
  | 'simulated'
  | 'stale_cached'
  // Legacy aliases
  | 'user_entered'
  | 'weather_service'
  | 'ai_analysis'
  | 'estimate'
  | 'demo';

interface ProvenanceChipProps {
  type: ProvenanceType;
  label?: string;
  timestamp?: string | Date | null;
  source?: string | null;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  locale?: Locale;
  /**
   * Set highContrast when rendered on dark cards or complex backgrounds
   */
  highContrast?: boolean;
}

const config: Record<
  ProvenanceType,
  { bg: string; text: string; dot: string; defaultLabel: string; darkBg: string }
> = {
  measured: {
    bg: 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold',
    darkBg: 'dark:bg-emerald-950 dark:border-emerald-600 dark:text-emerald-100',
    text: 'text-emerald-950',
    dot: 'bg-emerald-600 ring-1 ring-emerald-300',
    defaultLabel: 'In-Situ Sensor',
  },
  forecast: {
    bg: 'bg-sky-50 border-sky-400 text-sky-950 font-semibold',
    darkBg: 'dark:bg-sky-950 dark:border-sky-600 dark:text-sky-100',
    text: 'text-sky-950',
    dot: 'bg-sky-600 ring-1 ring-sky-300',
    defaultLabel: 'Weather Forecast',
  },
  official_market: {
    bg: 'bg-teal-50 border-teal-400 text-teal-950 font-semibold',
    darkBg: 'dark:bg-teal-950 dark:border-teal-600 dark:text-teal-100',
    text: 'text-teal-950',
    dot: 'bg-teal-600 ring-1 ring-teal-300',
    defaultLabel: 'Official APMC',
  },
  model_prediction: {
    bg: 'bg-purple-50 border-purple-400 text-purple-950 font-semibold',
    darkBg: 'dark:bg-purple-950 dark:border-purple-600 dark:text-purple-100',
    text: 'text-purple-950',
    dot: 'bg-purple-600 ring-1 ring-purple-300',
    defaultLabel: 'AI Prediction',
  },
  verified_source: {
    bg: 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold',
    darkBg: 'dark:bg-indigo-950 dark:border-indigo-600 dark:text-indigo-100',
    text: 'text-indigo-950',
    dot: 'bg-indigo-600 ring-1 ring-indigo-300',
    defaultLabel: 'Verified ICAR/AAU',
  },
  simulated: {
    bg: 'bg-amber-100 border-amber-500 text-amber-950 font-bold',
    darkBg: 'dark:bg-amber-950 dark:border-amber-600 dark:text-amber-100',
    text: 'text-amber-950',
    dot: 'bg-amber-600 ring-1 ring-amber-300',
    defaultLabel: 'SIMULATED DATA',
  },
  stale_cached: {
    // Ultra high contrast slate/stone with dark card fallback (12.4:1 contrast ratio)
    bg: 'bg-stone-200 border-stone-400 text-stone-950 font-semibold',
    darkBg: 'dark:bg-stone-900 dark:border-stone-500 dark:text-stone-100',
    text: 'text-stone-950',
    dot: 'bg-stone-600 ring-1 ring-stone-400',
    defaultLabel: 'Cached / Stale',
  },

  // Backward-compatible legacy aliases
  user_entered: {
    bg: 'bg-blue-50 border-blue-400 text-blue-950 font-semibold',
    darkBg: 'dark:bg-blue-950 dark:border-blue-600 dark:text-blue-100',
    text: 'text-blue-950',
    dot: 'bg-blue-600 ring-1 ring-blue-300',
    defaultLabel: 'You Entered',
  },
  weather_service: {
    bg: 'bg-sky-50 border-sky-400 text-sky-950 font-semibold',
    darkBg: 'dark:bg-sky-950 dark:border-sky-600 dark:text-sky-100',
    text: 'text-sky-950',
    dot: 'bg-sky-600 ring-1 ring-sky-300',
    defaultLabel: 'Weather Service',
  },
  ai_analysis: {
    bg: 'bg-purple-50 border-purple-400 text-purple-950 font-semibold',
    darkBg: 'dark:bg-purple-950 dark:border-purple-600 dark:text-purple-100',
    text: 'text-purple-950',
    dot: 'bg-purple-600 ring-1 ring-purple-300',
    defaultLabel: 'AI Analysis',
  },
  estimate: {
    bg: 'bg-amber-50 border-amber-400 text-amber-950 font-semibold',
    darkBg: 'dark:bg-amber-950 dark:border-amber-600 dark:text-amber-100',
    text: 'text-amber-950',
    dot: 'bg-amber-600 ring-1 ring-amber-300',
    defaultLabel: 'Model Estimate',
  },
  demo: {
    bg: 'bg-amber-100 border-amber-500 text-amber-950 font-bold',
    darkBg: 'dark:bg-amber-950 dark:border-amber-600 dark:text-amber-100',
    text: 'text-amber-950',
    dot: 'bg-amber-600 ring-1 ring-amber-300',
    defaultLabel: 'DEMO DATA',
  },
};

export const ProvenanceChip: React.FC<ProvenanceChipProps> = ({
  type,
  label,
  timestamp,
  source,
  size = 'sm',
  className = '',
  locale,
  highContrast = false,
}) => {
  const style = config[type] || config.estimate;
  const i18nKey = `provenance_${type}`;
  const translatedLabel = locale ? getTranslation(i18nKey, locale) : null;
  const displayLabel = label || translatedLabel || style.defaultLabel;

  const sizeClass =
    size === 'xs'
      ? 'px-1.5 py-0.2 text-[10px]'
      : size === 'md'
      ? 'px-2.5 py-1 text-xs'
      : 'px-2 py-0.5 text-[11px]';

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const contrastClass = highContrast
    ? 'bg-stone-900 border-stone-300 text-stone-100 shadow-sm'
    : `${style.bg} ${style.darkBg}`;

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded font-medium border ${contrastClass} ${sizeClass} ${className}`}
      title={source ? `Source: ${source}` : undefined}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} aria-hidden="true" />
      <span>{displayLabel}</span>
      {formattedTime && (
        <span className="text-[10px] opacity-90 font-medium">({formattedTime})</span>
      )}
    </span>
  );
};
