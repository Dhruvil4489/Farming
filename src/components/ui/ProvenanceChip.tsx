import React from 'react';

export type ProvenanceType =
  | 'measured'
  | 'user_entered'
  | 'weather_service'
  | 'ai_analysis'
  | 'estimate'
  | 'demo';

interface ProvenanceChipProps {
  type: ProvenanceType;
  label?: string;
}

const config: Record<ProvenanceType, { bg: string; text: string; defaultLabel: string }> = {
  measured: {
    bg: 'bg-emerald-100 border-emerald-300',
    text: 'text-emerald-800',
    defaultLabel: 'Measured',
  },
  user_entered: {
    bg: 'bg-blue-100 border-blue-300',
    text: 'text-blue-800',
    defaultLabel: 'You Entered',
  },
  weather_service: {
    bg: 'bg-sky-100 border-sky-300',
    text: 'text-sky-800',
    defaultLabel: 'Weather Service',
  },
  ai_analysis: {
    bg: 'bg-purple-100 border-purple-300',
    text: 'text-purple-800',
    defaultLabel: 'AI Analysis',
  },
  estimate: {
    bg: 'bg-amber-100 border-amber-300',
    text: 'text-amber-800',
    defaultLabel: 'Estimate',
  },
  demo: {
    bg: 'bg-orange-100 border-orange-400 font-bold',
    text: 'text-orange-900',
    defaultLabel: 'DEMO DATA',
  },
};

export const ProvenanceChip: React.FC<ProvenanceChipProps> = ({ type, label }) => {
  const style = config[type] || config.estimate;
  const displayLabel = label || style.defaultLabel;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${style.text}`}
    >
      {displayLabel}
    </span>
  );
};
