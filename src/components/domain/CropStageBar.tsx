import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';

export interface StageItem {
  id: string;
  name: string;
  status: 'pending' | 'current' | 'done' | 'skipped';
  startDate?: string;
  endDate?: string;
}

interface CropStageBarProps {
  stages: StageItem[];
  onSelectStage?: (stageId: string) => void;
}

export const CropStageBar: React.FC<CropStageBarProps> = ({ stages, onSelectStage }) => {
  const { t } = useI18n();

  if (!stages || stages.length === 0) {
    return <div className="text-xs text-stone-500 italic">{t('no_stages_defined', 'No stages defined for this crop cycle.')}</div>;
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
        {stages.map((stage, idx) => {
          const isDone = stage.status === 'done';
          const isCurrent = stage.status === 'current';

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStage && onSelectStage(stage.id)}
              className={`flex-1 min-w-[100px] flex flex-col items-center text-center p-2 rounded-lg cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-emerald-100/80 border-2 border-[#2F7D4F] shadow-sm'
                  : isDone
                  ? 'bg-stone-100 border border-stone-200'
                  : 'bg-stone-50 border border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-700" />
                ) : isCurrent ? (
                  <Clock size={16} className="text-[#2F7D4F] animate-pulse" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-stone-400 text-[10px] flex items-center justify-center font-bold text-stone-600">
                    {idx + 1}
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold line-clamp-1 ${isCurrent ? 'text-emerald-950 font-bold' : 'text-stone-700'}`}>
                {stage.name}
              </span>
              <span className="text-[10px] text-stone-500 mt-0.5 capitalize">
                {t(`stage_${stage.status}`, stage.status)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
