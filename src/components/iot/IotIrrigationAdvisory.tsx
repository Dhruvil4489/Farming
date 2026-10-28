'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Info,
  CloudRain,
  Sprout,
  Clock,
  TrendingDown,
  TrendingUp,
  Minus,
  Eye,
  X,
  RefreshCw,
  ChevronRight,
  Droplet,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

interface AdvisoryFact {
  currentMoisturePct: number | null;
  thresholdLow: number | null;
  thresholdOptimal: number | null;
  thresholdSource: string;
  recentTrend: string;
  trendReadings: number;
  forecastRainPct: number | null;
  forecastSource: string | null;
  dataAgeMinutes: number | null;
  qualityStatus: string | null;
  soilType: string | null;
  ruleEvaluatedAt: string;
}

interface Advisory {
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  text: string;
  action: string;
  fact: AdvisoryFact;
  suppressed: boolean;
  suppressionReason?: string;
}

interface FieldAdvisory {
  fieldId: string;
  fieldName: string;
  farmName: string;
  deviceCode: string | null;
  isDemo: boolean;
  cropSlug: string | null;
  cropStage: string | null;
  soilType: string | null;
  latestReading: {
    moisturePct: number | null;
    airTempC: number | null;
    airHumidityPct: number | null;
    qualityStatus: string;
    measuredAt: string;
  } | null;
  advisories: Advisory[];
}

interface AlertItem {
  id: string;
  ruleId: string;
  title: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface IotIrrigationAdvisoryProps {
  fieldId: string;
  isDemo: boolean;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: typeof AlertTriangle; iconClass: string }> = {
  critical: { bg: 'bg-rose-50', border: 'border-rose-300', icon: AlertTriangle, iconClass: 'text-rose-600' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-300', icon: AlertTriangle, iconClass: 'text-amber-600' },
  info: { bg: 'bg-sky-50', border: 'border-sky-300', icon: Info, iconClass: 'text-sky-600' },
};

const TREND_ICONS: Record<string, { icon: typeof TrendingDown; label: string; className: string }> = {
  falling: { icon: TrendingDown, label: 'Falling', className: 'text-rose-600' },
  rising: { icon: TrendingUp, label: 'Rising', className: 'text-emerald-600' },
  stable: { icon: Minus, label: 'Stable', className: 'text-stone-600' },
  insufficient_data: { icon: Minus, label: 'Insufficient Data', className: 'text-stone-400' },
};

export function IotIrrigationAdvisory({ fieldId, isDemo }: IotIrrigationAdvisoryProps) {
  const [advisoryData, setAdvisoryData] = useState<FieldAdvisory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [savingAlert, setSavingAlert] = useState(false);

  const fetchAdvisory = useCallback(async () => {
    if (!fieldId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/iot/advisory?fieldId=${fieldId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setAdvisoryData(null);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const fieldData = json.data?.fields?.[0] || null;
      setAdvisoryData(fieldData);
    } catch (err: any) {
      setError(err.message || 'Failed to load advisory');
    } finally {
      setLoading(false);
    }
  }, [fieldId]);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch('/api/v1/iot/alerts?limit=10');
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.data?.alerts || []);
      }
    } catch {
      // Silently fail for alerts
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvisory();
    fetchAlerts();
  }, [fetchAdvisory, fetchAlerts]);

  const handleDismiss = async (alertId: string) => {
    setDismissingId(alertId);
    try {
      const res = await fetch('/api/v1/iot/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', alertId }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, isRead: true, readAt: new Date().toISOString() } : a))
        );
      }
    } catch {
      // Silently fail
    } finally {
      setDismissingId(null);
    }
  };

  const handleSaveAlert = async (advisory: Advisory) => {
    setSavingAlert(true);
    try {
      const res = await fetch('/api/v1/iot/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ruleId: advisory.ruleId,
          title: advisory.title,
          details: {
            text: advisory.text,
            severity: advisory.severity,
            moisturePct: advisory.fact.currentMoisturePct,
            thresholdSource: advisory.fact.thresholdSource,
          },
          fieldId,
        }),
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch {
      // Silently fail
    } finally {
      setSavingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 bg-stone-100 animate-pulse rounded-2xl" />
        <div className="h-24 bg-stone-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 space-y-3 border-rose-200 bg-rose-50/50 rounded-2xl">
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle size={18} />
          <span className="text-sm font-bold">Advisory Error</span>
        </div>
        <p className="text-xs text-stone-600">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchAdvisory}>
          <RefreshCw size={12} className="mr-1" /> Retry
        </Button>
      </Card>
    );
  }

  if (!advisoryData) {
    return (
      <Card className="p-6 text-center text-xs text-stone-500 rounded-2xl">
        <Info size={24} className="mx-auto mb-2 text-stone-400" />
        No advisory data available for this field. Pair an IoT device to receive irrigation guidance.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Advisories */}
      {advisoryData.advisories.map((adv, idx) => {
        const style = SEVERITY_STYLES[adv.severity] || SEVERITY_STYLES.info;
        const SeverityIcon = style.icon;
        const trendInfo = TREND_ICONS[adv.fact.recentTrend] || TREND_ICONS.insufficient_data;
        const TrendIcon = trendInfo.icon;

        return (
          <Card
            key={idx}
            className={`p-5 rounded-2xl space-y-3 border ${style.border} ${style.bg}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <SeverityIcon size={20} className={`${style.iconClass} shrink-0 mt-0.5`} />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{adv.title}</h4>
                  {adv.suppressed && adv.suppressionReason && (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded mt-1 inline-block">
                      Deferred: {adv.suppressionReason}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isDemo && <ProvenanceChip type="demo" />}
                <span className="text-[10px] text-stone-400 font-mono">
                  {new Date(adv.fact.ruleEvaluatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                </span>
              </div>
            </div>

            {/* Advisory Text */}
            <p className="text-xs text-stone-700 leading-relaxed">{adv.text}</p>

            {/* Reasoning Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {adv.fact.currentMoisturePct != null && (
                <div className="p-2 bg-white/60 rounded-lg border border-stone-200/50">
                  <span className="text-stone-500 block font-medium">Current</span>
                  <span className="font-extrabold text-stone-900">
                    {adv.fact.currentMoisturePct.toFixed(1)}%
                  </span>
                </div>
              )}
              {adv.fact.thresholdLow != null && (
                <div className="p-2 bg-white/60 rounded-lg border border-stone-200/50">
                  <span className="text-stone-500 block font-medium">Threshold</span>
                  <span className="font-extrabold text-stone-900">
                    {adv.fact.thresholdLow}–{adv.fact.thresholdOptimal}%
                  </span>
                </div>
              )}
              <div className="p-2 bg-white/60 rounded-lg border border-stone-200/50">
                <span className="text-stone-500 block font-medium">Trend</span>
                <span className={`font-bold flex items-center gap-1 ${trendInfo.className}`}>
                  <TrendIcon size={12} />
                  {trendInfo.label}
                </span>
              </div>
              {adv.fact.forecastRainPct != null && (
                <div className="p-2 bg-white/60 rounded-lg border border-stone-200/50">
                  <span className="text-stone-500 block font-medium">Rain Forecast</span>
                  <span className="font-bold text-sky-700 flex items-center gap-1">
                    <CloudRain size={12} />
                    {adv.fact.forecastRainPct}%
                  </span>
                </div>
              )}
            </div>

            {/* Threshold Source & Data Age */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-stone-500 pt-1 border-t border-stone-200/50">
              <span className="flex items-center gap-1">
                <Sprout size={11} />
                {adv.fact.thresholdSource}
              </span>
              {adv.fact.dataAgeMinutes != null && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Data age: {adv.fact.dataAgeMinutes < 60 ? `${adv.fact.dataAgeMinutes}m` : `${Math.round(adv.fact.dataAgeMinutes / 60)}h`}
                </span>
              )}
              {adv.fact.soilType && adv.fact.soilType !== 'unknown' && (
                <span>Soil: {adv.fact.soilType}</span>
              )}
            </div>

            {/* Action Buttons */}
            {(adv.action === 'inspect_irrigation' || adv.action === 'monitor') && (
              <div className="flex items-center gap-2 pt-1">
                {adv.action === 'inspect_irrigation' && (
                  <Link
                    href={`/irrigation?fieldId=${encodeURIComponent(fieldId)}&moistureNote=dry&notes=${encodeURIComponent(
                      `Logged in response to IoT Advisory: ${adv.title} (${adv.fact.currentMoisturePct != null ? adv.fact.currentMoisturePct.toFixed(1) + '%' : 'Moisture'} vs ${adv.fact.thresholdLow}-${adv.fact.thresholdOptimal}% threshold)`
                    )}`}
                  >
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      <Droplet size={12} className="mr-1" />
                      Log Irrigation Event
                    </Button>
                  </Link>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => handleSaveAlert(adv)}
                  disabled={savingAlert}
                >
                  <Eye size={12} className="mr-1" />
                  Save to Alerts
                </Button>
              </div>
            )}
          </Card>
        );
      })}

      {advisoryData.advisories.length === 0 && (
        <Card className="p-6 text-center rounded-2xl">
          <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-bold text-stone-900">No Advisories Active</p>
          <p className="text-xs text-stone-500 mt-1">
            All field conditions appear normal. Advisory rules will activate when sensor data indicates a potential irrigation need.
          </p>
        </Card>
      )}

      {/* Alert History */}
      {alerts.length > 0 && (
        <Card className="p-5 rounded-2xl space-y-3 border border-stone-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Shield size={16} className="text-[#2F7D4F]" />
              Recent Alert History
            </h4>
            <span className="text-[10px] text-stone-400">
              {alerts.filter((a) => !a.isRead).length} unread
            </span>
          </div>

          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  alert.isRead
                    ? 'bg-stone-50 border-stone-200 opacity-70'
                    : 'bg-white border-stone-300'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-stone-900 block truncate">{alert.title}</span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {new Date(alert.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {alert.isRead ? (
                    <span className="text-[10px] text-stone-400 font-semibold">Acknowledged</span>
                  ) : (
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      disabled={dismissingId === alert.id}
                      className="text-[10px] font-bold text-[#2F7D4F] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {dismissingId === alert.id ? 'Saving...' : 'Acknowledge'}
                    </button>
                  )}
                  <Link
                    href={`/irrigation?fieldId=${encodeURIComponent(fieldId)}&notes=${encodeURIComponent(
                      `Logged in response to IoT alert: ${alert.title}`
                    )}`}
                    className="text-[10px] font-bold text-stone-600 hover:text-[#2F7D4F] flex items-center gap-0.5"
                  >
                    Log <ChevronRight size={10} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="text-[10px] text-stone-500 leading-relaxed px-1">
        <strong>Advisory Disclaimer:</strong> Irrigation advisories are based on approximate sensor readings, crop-specific moisture thresholds, and weather forecasts.
        They suggest "inspect/consider irrigation" rather than guaranteeing watering is required. Always combine sensor data with physical field inspection.
        This system does not control pumps or automated irrigation equipment.
      </div>
    </div>
  );
}
