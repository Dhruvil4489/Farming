import React from 'react';
import { AlertTriangle, FolderOpen, RefreshCw } from 'lucide-react';

export interface DataStateProps {
  status: 'loading' | 'empty' | 'error' | 'success' | 'unavailable';
  loadingText?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export const DataState: React.FC<DataStateProps> = ({
  status,
  loadingText = 'Loading data...',
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display at this time.',
  emptyAction,
  errorTitle = 'Unable to load data',
  errorMessage = 'An error occurred while fetching information.',
  onRetry,
  children,
}) => {
  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur rounded-xl border border-emerald-900/10 min-h-[160px] animate-pulse"
      >
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-emerald-900/70">{loadingText}</p>
        <span className="sr-only">{loadingText}</span>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/90 rounded-xl border border-dashed border-emerald-800/20 text-center min-h-[200px]">
        <div className="w-12 h-12 bg-emerald-100/60 rounded-full flex items-center justify-center text-emerald-800 mb-3">
          <FolderOpen size={24} />
        </div>
        <h4 className="text-base font-semibold text-emerald-950 mb-1">{emptyTitle}</h4>
        <p className="text-sm text-stone-600 max-w-sm mb-4">{emptyDescription}</p>
        {emptyAction && <div>{emptyAction}</div>}
      </div>
    );
  }

  if (status === 'error' || status === 'unavailable') {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center p-8 bg-red-50/50 rounded-xl border border-red-200 text-center min-h-[180px]"
      >
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3">
          <AlertTriangle size={24} />
        </div>
        <h4 className="text-base font-semibold text-red-950 mb-1">{errorTitle}</h4>
        <p className="text-sm text-red-700 max-w-sm mb-4">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-800 font-medium text-sm rounded-lg hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
