import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Clock, ShieldAlert, FolderOpen, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

/**
 * Standardized Accessible Loading Spinner State
 */
export const LoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Loading farming data...', className = '' }) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex flex-col items-center justify-center p-8 text-center space-y-3 ${className}`}
  >
    <div className="w-7 h-7 border-3 border-[#2F7D4F] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-stone-600">{message}</span>
    <span className="sr-only">{message}</span>
  </div>
);

/**
 * Standardized Empty State
 */
export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}> = ({ title, description, icon, actionText, onAction, className = '' }) => (
  <Card className={`p-8 text-center space-y-3 bg-stone-50/60 border border-dashed border-stone-300 ${className}`}>
    <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
      {icon || <FolderOpen size={22} />}
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-stone-800">{title}</h3>
      <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
    {actionText && onAction && (
      <div className="pt-2">
        <Button onClick={onAction} variant="outline" size="sm">
          {actionText}
        </Button>
      </div>
    )}
  </Card>
);

/**
 * Standardized Error State with Retry
 */
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Unable to Load Data',
  message,
  errorCode,
  onRetry,
  className = '',
}) => (
  <Card className={`p-5 bg-rose-50/70 border border-rose-200 text-rose-900 space-y-3 ${className}`}>
    <div className="flex items-start gap-3">
      <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
      <div className="space-y-1 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">{title}</h4>
          {errorCode && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">
              Code: {errorCode}
            </span>
          )}
        </div>
        <p className="text-xs text-rose-800 leading-relaxed">{message}</p>
      </div>
    </div>
    {onRetry && (
      <div className="flex justify-end pt-1">
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-rose-300 text-rose-800 hover:bg-rose-100 text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Retry
        </Button>
      </div>
    )}
  </Card>
);

/**
 * Offline or Connection Interrupted Notice
 */
export const OfflineNotice: React.FC<{
  cachedTimestamp?: string | Date | null;
  onRefresh?: () => void;
  className?: string;
}> = ({ cachedTimestamp, onRefresh, className = '' }) => (
  <div
    role="alert"
    className={`p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3 ${className}`}
  >
    <div className="flex items-center gap-2">
      <WifiOff size={16} className="text-amber-700 shrink-0" />
      <span>
        <strong>Offline Mode:</strong> Displaying cached data.
        {cachedTimestamp && ` (Cached: ${new Date(cachedTimestamp).toLocaleTimeString()})`}
      </span>
    </div>
    {onRefresh && (
      <button
        onClick={onRefresh}
        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[11px] flex items-center gap-1"
      >
        <RefreshCw size={11} /> Reconnect
      </button>
    )}
  </div>
);

/**
 * Stale Data Notice with Last Sync Time
 */
export const StaleDataBanner: React.FC<{
  lastSyncedAt?: string | Date | null;
  onRefresh?: () => void;
  className?: string;
}> = ({ lastSyncedAt, onRefresh, className = '' }) => (
  <div
    className={`p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between gap-2 ${className}`}
  >
    <div className="flex items-center gap-2">
      <Clock size={14} className="text-amber-700 shrink-0" />
      <span>
        Data may be stale.
        {lastSyncedAt && ` Last updated: ${new Date(lastSyncedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`}
      </span>
    </div>
    {onRefresh && (
      <button
        onClick={onRefresh}
        className="px-2 py-0.5 text-[11px] font-semibold text-amber-900 hover:underline flex items-center gap-1"
      >
        <RefreshCw size={10} /> Refresh
      </button>
    )}
  </div>
);

/**
 * Permission Denied / Authorization Required
 */
export const PermissionDeniedState: React.FC<{
  title?: string;
  message?: string;
  loginUrl?: string;
  className?: string;
}> = ({
  title = 'Access Restricted',
  message = 'You do not have permission to view this farming resource or your session has expired.',
  loginUrl = '/login',
  className = '',
}) => (
  <Card className={`p-8 text-center space-y-3 bg-stone-50 border border-stone-200 ${className}`}>
    <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
      <ShieldAlert size={22} />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-stone-900">{title}</h3>
      <p className="text-xs text-stone-600 max-w-sm mx-auto">{message}</p>
    </div>
    <div className="pt-2">
      <a
        href={loginUrl}
        className="inline-flex items-center px-4 py-2 bg-[#2F7D4F] text-white rounded-lg text-xs font-semibold hover:bg-[#256841]"
      >
        Sign In with Authorized Account
      </a>
    </div>
  </Card>
);

/**
 * Demo Mode Active Banner
 */
export const DemoModeBanner: React.FC<{
  moduleName?: string;
  className?: string;
}> = ({ moduleName = 'SmartFarm', className = '' }) => (
  <div
    className={`p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 flex items-center gap-2 ${className}`}
  >
    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
    <span>
      <strong>Demo / Simulated Mode:</strong> Displaying simulated {moduleName} data for demonstration and testing purposes. Live farm sensors and official feeds are not affected.
    </span>
  </div>
);
