'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Droplets,
  Radio,
  Layers,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Cpu,
  Battery,
  AlertCircle,
  Activity,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { useI18n } from '@/providers/I18nProvider';

interface FieldOption {
  id: string;
  name: string;
  farm?: { name: string; id: string };
  soilType?: string;
  cropCycles?: Array<{ customCropName?: string; crop?: { slug: string } }>;
}

interface TelemetryData {
  fieldId: string;
  fieldName: string;
  cropName: string;
  soilType: string;
  hasSensor: boolean;
  sensorConnected: boolean;
  sensorNotice?: string | null;
  device?: {
    id: string;
    deviceCode: string;
    name: string;
    hardwareModel: string | null;
    status: string;
    lastSeenAt: string | null;
    batteryVoltage: number | null;
  } | null;
  latestReading?: {
    id: string;
    moisturePct: number;
    temperatureC: number | null;
    batteryPct: number | null;
    measuredAt: string;
    depthCm: number;
    source: 'live_iot' | 'historical_iot' | 'manual' | 'none';
    category: {
      level: 'dry' | 'optimal' | 'wet' | 'critical';
      label: string;
      badgeClass: string;
      description: string;
    };
  } | null;
  dataSource: 'live_iot' | 'historical_iot' | 'manual' | 'none';
  thresholds: {
    low: number;
    optimal: number;
    high: number;
    cropName: string;
    soilType: string;
  };
  recommendation: {
    action: string;
    reason: string;
    urgency: string;
  };
}

interface HistoryPoint {
  id: string;
  timestamp: string;
  moisturePct: number;
  temperatureC: number | null;
  source: string;
}

interface HistoryData {
  timeframe: string;
  points: HistoryPoint[];
  statistics: {
    totalReadings: number;
    minMoisture: number | null;
    maxMoisture: number | null;
    avgMoisture: number | null;
  };
}

export default function SoilMoisturePage() {
  const { t, formatDate, formatNumber } = useI18n();

  // Fields
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  // Telemetry & Sensor State
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // History Chart State
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Manual Measurement Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    moisturePct: '',
    depthCm: 15,
    temperatureC: '',
    notes: '',
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // ISRO / NRSC Satellite District Soil Moisture Explorer (distinct from in-situ IoT sensor)
  const [satState, setSatState] = useState('Gujarat');
  const [satDistrict, setSatDistrict] = useState('');
  const [satData, setSatData] = useState<any>(null);
  const [satLoading, setSatLoading] = useState(false);

  const loadSatelliteMoisture = useCallback(async (st: string, dist?: string) => {
    setSatLoading(true);
    try {
      const qs = new URLSearchParams();
      if (st.trim()) qs.set('state', st.trim());
      if (dist && dist.trim()) qs.set('district', dist.trim());
      const res = await fetch(`/api/v1/soil-moisture?${qs.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSatData(json);
      } else {
        setSatData(null);
      }
    } catch {
      setSatData(null);
    } finally {
      setSatLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/v1/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const uState = json?.data?.state || 'Gujarat';
        const uDist = json?.data?.district || '';
        setSatState(uState);
        setSatDistrict(uDist);
        loadSatelliteMoisture(uState, uDist);
      })
      .catch(() => loadSatelliteMoisture('Gujarat'));
  }, [loadSatelliteMoisture]);

  // Load fields once on mount
  useEffect(() => {
    fetch('/api/v1/fields')
      .then((r) => r.json())
      .then((json) => {
        const list = json.data || [];
        setFields(list);
          if (list.length > 0) {
            setSelectedFieldId((prev) => prev || list[0].id);
          }
        })
      .catch (() => { });
}, []);

// Load field telemetry
const loadTelemetry = useCallback(async (fieldId: string) => {
  if (!fieldId) return;
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/v1/soil-moisture/sensor?fieldId=${encodeURIComponent(fieldId)}`);
    if (!res.ok) {
      throw new Error(`Failed to load moisture telemetry (HTTP ${res.status})`);
    }
    const json = await res.json();
    setTelemetry(json.data || json.telemetry || null);
  } catch (err: any) {
    setError(err.message || 'Unable to connect to soil moisture service');
  } finally {
    setLoading(false);
  }
}, []);

// Load historical measurements
const loadHistory = useCallback(async (fieldId: string, tf: '24h' | '7d' | '30d') => {
  if (!fieldId) return;
  setHistoryLoading(true);
  try {
    const res = await fetch(
      `/api/v1/soil-moisture/history?fieldId=${encodeURIComponent(fieldId)}&timeframe=${tf}`
    );
    if (res.ok) {
      const json = await res.json();
      setHistory(json.data || null);
    }
  } catch {
    // Fallback
  } finally {
    setHistoryLoading(false);
  }
}, []);

  useEffect(() => {
    if (selectedFieldId) {
      loadTelemetry(selectedFieldId);
      loadHistory(selectedFieldId, timeframe);

      // Continuous 3-second live polling for USB hardware serial bridge updates
      const timer = setInterval(() => {
        loadTelemetry(selectedFieldId);
      }, 3000);

      return () => clearInterval(timer);
    }
  }, [selectedFieldId, timeframe, loadTelemetry, loadHistory]);

// Handle Manual Log Submit
const handleManualSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedFieldId) return;
  const pct = parseFloat(manualForm.moisturePct);
  if (isNaN(pct) || pct < 0 || pct > 100) {
    setManualError('Please enter a valid moisture percentage between 0% and 100%.');
    return;
  }

  setManualSubmitting(true);
  setManualError(null);
  setManualSuccess(false);

  try {
    const res = await fetch('/api/v1/soil-moisture/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldId: selectedFieldId,
        moisturePct: pct,
        depthCm: Number(manualForm.depthCm) || 15,
        temperatureC: manualForm.temperatureC ? parseFloat(manualForm.temperatureC) : undefined,
        notes: manualForm.notes.trim() || undefined,
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to save measurement');

    setManualSuccess(true);
    setTimeout(() => {
      setShowManualModal(false);
      setManualSuccess(false);
      setManualForm({ moisturePct: '', depthCm: 15, temperatureC: '', notes: '' });
    }, 1500);

    loadTelemetry(selectedFieldId);
    loadHistory(selectedFieldId, timeframe);
  } catch (err: any) {
    setManualError(err.message || 'Failed to record measurement');
  } finally {
    setManualSubmitting(false);
  }
};

const selectedField = useMemo(
  () => fields.find((f) => f.id === selectedFieldId),
  [fields, selectedFieldId]
);

return (
  <div className="space-y-6 max-w-7xl mx-auto pb-12">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#143D2A] bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <Droplets size={12} className="text-[#2F7D4F]" />
            In-Situ Capacitive Telemetry
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#143D2A] tracking-tight">
          {t('moisture_title', 'Soil Moisture Intelligence Dashboard')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
          {t(
            'moisture_subtitle',
            'Real-time root-zone soil moisture monitoring, sensor status, and agronomic irrigation triggers.'
          )}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <Button
          onClick={() => setShowManualModal(true)}
          size="sm"
          className="text-xs font-bold bg-[#143D2A] hover:bg-[#0F2D1F] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <PlusCircle size={15} />
          {t('moisture_btn_manual_entry', 'Log Manual Measurement')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (selectedFieldId) {
              loadTelemetry(selectedFieldId);
              loadHistory(selectedFieldId, timeframe);
            }
          }}
          className="text-xs h-9 cursor-pointer"
        >
          <RefreshCw size={14} className="mr-1 text-stone-600" />
          {t('refresh', 'Refresh')}
        </Button>
      </div>
    </div>

    {/* Target Field Plot Selector */}
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
      <div className="flex items-center gap-3 flex-wrap">
        <Layers size={18} className="text-[#2F7D4F]" />
        <span className="text-xs font-bold text-stone-700">{t('target_field', 'Target Field Plot')}:</span>
        {fields.length === 0 ? (
          <span className="text-xs text-stone-500 italic">No registered fields</span>
        ) : (
          <select
            id="soil-moisture-field-select"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.farm?.name || 'Farm'}) — Soil: {f.soilType || 'Loamy'}
              </option>
            ))}
          </select>
        )}
      </div>

      {telemetry && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">Crop:</span>
          <strong className="text-stone-900 font-bold">{telemetry.cropName}</strong>
          <span className="text-stone-300">|</span>
          <span className="text-stone-500">Soil:</span>
          <strong className="capitalize text-stone-900 font-bold">{telemetry.soilType}</strong>
        </div>
      )}
    </div>

    {error && (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3">
        <AlertTriangle size={18} className="text-rose-600 shrink-0" />
        <span>{error}</span>
      </div>
    )}

    {/* Urgent Dry Soil Warning Notification Alert */}
    {telemetry?.latestReading &&
      telemetry.latestReading.moisturePct < (telemetry.thresholds?.low || 30) && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-700 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-rose-900">
                  ⚠️ Critical Soil Moisture Warning: Irrigation Recommended
                </span>
                <span className="bg-rose-200 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Root-Zone Stress
                </span>
              </div>
              <p className="text-rose-800 leading-relaxed font-medium">
                Soil moisture in <strong>{telemetry.fieldName}</strong> has fallen to{' '}
                <strong>{telemetry.latestReading.moisturePct.toFixed(1)}%</strong> (critical threshold: {telemetry.thresholds?.low || 30}%).
                Irrigation is recommended immediately.
              </p>
            </div>
          </div>
          <Link
            href={`/irrigation?fieldId=${selectedFieldId}&notes=${encodeURIComponent(
              telemetry.recommendation?.reason || 'Critical low soil moisture alert'
            )}`}
            className="shrink-0 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            Schedule Irrigation →
          </Link>
        </div>
      )}

    {/* Sensor Disconnected / Notice Banner */}
    {telemetry && !telemetry.sensorConnected && (
      <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Radio size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <strong className="font-bold block text-sm mb-0.5">
              {t('moisture_sensor_disconnected', 'Sensor Not Connected')}
            </strong>
            <p className="text-stone-700 leading-relaxed">
              {telemetry.sensorNotice ||
                'No physical capacitive soil sensor probe is paired with this field. Live wireless readings are inactive.'}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualModal(true)}
            className="text-xs h-8 bg-white border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer"
          >
            <PlusCircle size={14} className="mr-1 text-amber-700" />
            Log Manual Test
          </Button>
        </div>
      </div>
    )}

    {/* Main 4-Metric Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Current Moisture */}
      <Card className="p-5 rounded-3xl border border-stone-200 bg-white space-y-2">
        <div className="flex items-center justify-between text-stone-500">
          <span className="text-xs font-semibold">{t('moisture_current', 'Current Soil Moisture')}</span>
          <Droplets size={16} className="text-[#2F7D4F]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-[#143D2A] tracking-tight">
            {telemetry?.latestReading
              ? `${telemetry.latestReading.moisturePct.toFixed(1)}%`
              : '—'}
          </span>
          {telemetry?.latestReading && (
              <span className="text-[11px] text-stone-500 font-medium">
                at {telemetry.latestReading.depthCm || 15}cm root depth
              </span>
          )}
        </div>
        <div className="text-[11px] text-stone-500 pt-1 flex items-center gap-1.5">
          {telemetry?.latestReading?.source === 'live_iot' ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sensor Telemetry
            </span>
          ) : telemetry?.latestReading?.source === 'manual' ? (
            <span className="text-amber-700 font-medium">Manual Measurement</span>
          ) : (
            <span className="text-stone-400 italic">No measurement recorded</span>
          )}
        </div>
      </Card>

      {/* Metric 2: Moisture Status */}
      <Card className="p-5 rounded-3xl border border-stone-200 bg-white space-y-2">
        <div className="flex items-center justify-between text-stone-500">
          <span className="text-xs font-semibold">{t('moisture_status', 'Moisture Status')}</span>
          <Activity size={16} className="text-sky-600" />
        </div>
        <div>
          {telemetry?.latestReading?.category ? (
            <span
              className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${telemetry.latestReading.category.badgeClass}`}
            >
              {telemetry.latestReading.category.label}
            </span>
          ) : (
            <span className="text-xs text-stone-400 italic">Awaiting Measurement</span>
          )}
        </div>
        <p className="text-[11px] text-stone-500 pt-1">
          Crop-specific threshold for <strong className="text-stone-800">{telemetry?.thresholds?.cropName || 'Field'}</strong>
        </p>
      </Card>

      {/* Metric 3: Optimal Range */}
      <Card className="p-5 rounded-3xl border border-stone-200 bg-white space-y-2">
        <div className="flex items-center justify-between text-stone-500">
          <span className="text-xs font-semibold">{t('moisture_optimal_range', 'Optimal Range')}</span>
          <Layers size={16} className="text-[#2F7D4F]" />
        </div>
        <div className="text-2xl font-black text-stone-900 tracking-tight">
          {telemetry?.thresholds
            ? `${telemetry.thresholds.low}% – ${telemetry.thresholds.high}%`
            : '25% – 50%'}
        </div>
        <p className="text-[11px] text-stone-500 pt-1">
          Soil: <strong className="capitalize text-stone-800">{telemetry?.thresholds?.soilType || 'Loamy'}</strong> texture
        </p>
      </Card>

      {/* Metric 4: Soil Temperature / Last Update */}
      <Card className="p-5 rounded-3xl border border-stone-200 bg-white space-y-2">
        <div className="flex items-center justify-between text-stone-500">
          <span className="text-xs font-semibold">{t('moisture_soil_temp', 'Soil Temperature')}</span>
          <Thermometer size={16} className="text-amber-600" />
        </div>
        <div className="text-2xl font-black text-stone-900 tracking-tight">
          {telemetry?.latestReading?.temperatureC != null
            ? `${telemetry.latestReading.temperatureC.toFixed(1)}°C`
            : '—'}
        </div>
        <p className="text-[11px] text-stone-500 pt-1 truncate">
          {telemetry?.latestReading?.measuredAt
            ? `Updated ${formatDate(telemetry.latestReading.measuredAt, {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short',
            })}`
            : 'No sensor updates'}
        </p>
      </Card>
    </div>

    {/* Visualizations & Smart Advisory Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Moisture Gauge & Historical Trend Chart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Real-Time Gauge Card */}
        <Card className="p-6 rounded-3xl space-y-4 border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Droplets size={18} className="text-[#2F7D4F]" />
              {t('moisture_gauge_title', 'Root-Zone Moisture Level Gauge')}
            </h3>
            <ProvenanceChip
              type={telemetry?.dataSource === 'live_iot' ? 'measured' : 'user_entered'}
              label={
                telemetry?.dataSource === 'live_iot'
                  ? 'Capacitive Probe'
                  : telemetry?.dataSource === 'manual'
                    ? 'Manual Reading'
                    : 'Awaiting Hardware'
              }
              source="In-situ measurement"
            />
          </div>

          {/* Visual Gauge Bar */}
          <div className="space-y-3 pt-2">
            <div className="relative w-full h-8 bg-stone-100 rounded-2xl overflow-hidden border border-stone-200/80 p-1 flex">
              {/* 0 - low: Dry band */}
              <div
                style={{ width: `${telemetry?.thresholds?.low || 30}%` }}
                className="h-full bg-amber-200/70 border-r border-amber-300 flex items-center justify-center text-[10px] font-bold text-amber-900"
              >
                Dry
              </div>
              {/* low - high: Optimal band */}
              <div
                style={{
                  width: `${(telemetry?.thresholds?.high || 65) - (telemetry?.thresholds?.low || 30)
                    }%`,
                }}
                className="h-full bg-emerald-200/80 border-r border-emerald-300 flex items-center justify-center text-[10px] font-bold text-[#143D2A]"
              >
                Optimal Available Water
              </div>
              {/* high - 100: Wet / Saturation */}
              <div className="flex-1 h-full bg-cyan-200/70 flex items-center justify-center text-[10px] font-bold text-cyan-900">
                Saturation
              </div>

              {/* Needle indicator if reading exists */}
              {telemetry?.latestReading && (
                <div
                  className="absolute top-0 bottom-0 w-2.5 bg-stone-900 border-2 border-white rounded-full -ml-1 transition-all duration-700 shadow-md"
                  style={{
                    left: `${Math.min(
                      Math.max(telemetry.latestReading.moisturePct, 2),
                      98
                    )}%`,
                  }}
                  title={`Current: ${telemetry.latestReading.moisturePct.toFixed(1)}%`}
                />
              )}
            </div>

            {/* Gauge Legend */}
            <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Below {telemetry?.thresholds?.low || 30}%: Moisture Stress
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#143D2A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2F7D4F]" />
                {telemetry?.thresholds?.low || 30}% - {telemetry?.thresholds?.high || 65}%: Optimal Root Zone
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Above {telemetry?.thresholds?.high || 65}%: Saturation
              </span>
            </div>
          </div>
        </Card>

        {/* Moisture History Chart */}
        <Card className="p-6 rounded-3xl space-y-4 border border-stone-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#2F7D4F]" />
                {t('moisture_history_title', 'Soil Moisture Trends & History')}
              </h3>
              <span className="text-xs text-stone-500">
                Actual stored in-situ capacitive sensor observations
              </span>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeframe('24h')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${timeframe === '24h' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600'
                  }`}
              >
                {t('moisture_filter_24h', '24 Hours')}
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('7d')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${timeframe === '7d' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600'
                  }`}
              >
                {t('moisture_filter_7d', '7 Days')}
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('30d')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${timeframe === '30d' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600'
                  }`}
              >
                {t('moisture_filter_30d', '30 Days')}
              </button>
            </div>
          </div>

          {/* Min / Max / Avg Summary Stats */}
          {history?.statistics && (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  {t('moisture_min', 'Min Moisture')}
                </span>
                <span className="text-base font-black text-amber-800">
                  {history.statistics.minMoisture != null
                    ? `${history.statistics.minMoisture.toFixed(1)}%`
                    : '—'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  {t('moisture_avg', 'Average Moisture')}
                </span>
                <span className="text-base font-black text-[#143D2A]">
                  {history.statistics.avgMoisture != null
                    ? `${history.statistics.avgMoisture.toFixed(1)}%`
                    : '—'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  {t('moisture_max', 'Max Moisture')}
                </span>
                <span className="text-base font-black text-cyan-800">
                  {history.statistics.maxMoisture != null
                    ? `${history.statistics.maxMoisture.toFixed(1)}%`
                    : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Chart Rendering / List */}
          {historyLoading ? (
            <div className="py-12 text-center text-stone-400">
              <RefreshCw size={24} className="animate-spin mx-auto text-[#2F7D4F]" />
              <p className="text-xs mt-2">{t('loading', 'Loading data...')}</p>
            </div>
          ) : !history?.points || history.points.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <Radio size={24} className="mx-auto text-stone-400" />
              <p className="text-xs font-semibold text-stone-700">No historical measurements stored for this timeframe.</p>
              <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                Click &quot;Log Manual Measurement&quot; above to add your tensiometer or probe readings.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Visual Bar representation of time-series points */}
              <div className="h-44 w-full flex items-end gap-1.5 pt-4 px-2 bg-stone-50 rounded-2xl border border-stone-200/70 overflow-x-auto">
                {history.points.map((pt, i) => {
                  const heightPct = Math.min(Math.max((pt.moisturePct / 80) * 100, 8), 100);
                  const isDry = pt.moisturePct < (telemetry?.thresholds?.low || 30);
                  const isSat = pt.moisturePct > (telemetry?.thresholds?.high || 65);

                  return (
                    <div
                      key={pt.id || i}
                      className="flex-1 min-w-[20px] max-w-[36px] flex flex-col items-center gap-1 group relative"
                    >
                      {/* Tooltip */}
                      <div className="hidden group-hover:block absolute bottom-full mb-1 z-20 bg-stone-900 text-white text-[10px] p-2 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                        <strong className="block font-bold">{pt.moisturePct.toFixed(1)}% VWC</strong>
                        <span>{formatDate(pt.timestamp, { month: 'short', day: 'numeric', hour: '2-digit' })}</span>
                        {pt.temperatureC != null && <span> · {pt.temperatureC.toFixed(1)}°C</span>}
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-md transition-all ${isDry ? 'bg-amber-400' : isSat ? 'bg-cyan-500' : 'bg-[#2F7D4F]'
                          }`}
                      />
                      <span className="text-[8px] text-stone-400 font-mono rotate-45 mt-1 origin-top-left">
                        {new Date(pt.timestamp).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right 1 Col: Smart Recommendations & Hardware Pairing */}
      <div className="space-y-6">
        {/* Smart Irrigation Advisory Card */}
        <Card className="p-6 rounded-3xl space-y-4 border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sparkles size={16} className="text-[#2F7D4F]" />
              {t('moisture_smart_advisory', 'Smart Irrigation Advisory')}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Action Trigger
              </span>
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${telemetry?.recommendation.action === 'irrigate_now'
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : telemetry?.recommendation.action === 'delay_irrigation'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-[#143D2A] border-emerald-300'
                  }`}
              >
                {telemetry?.recommendation.action === 'irrigate_now'
                  ? t('moisture_irrigation_needed', 'Irrigation Required')
                  : telemetry?.recommendation.action === 'delay_irrigation'
                    ? t('moisture_irrigation_delay', 'Delay Irrigation')
                    : t('moisture_irrigation_sufficient', 'Soil Moisture Sufficient')}
              </span>
              <p className="text-stone-700 leading-relaxed pt-1">
                {telemetry?.recommendation.reason}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <Link
                href={`/irrigation?fieldId=${selectedFieldId}&notes=${encodeURIComponent(
                  telemetry?.recommendation.reason || ''
                )}`}
                className="w-full h-10 text-xs font-bold bg-[#143D2A] hover:bg-[#0F2D1F] text-white rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <Droplets size={14} /> Schedule Irrigation for this Field <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </Card>

        {/* Hardware & Sensor Info Card */}
        <Card className="p-6 rounded-3xl space-y-4 border border-stone-200 bg-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Cpu size={15} className="text-[#2F7D4F]" />
            IoT Hardware Architecture
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">{t('moisture_hardware_type', 'Hardware Type')}:</span>
              <strong className="text-stone-900">
                {telemetry?.device?.hardwareModel || 'Arduino Uno R3 + Capacitive v1.2'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">{t('moisture_sensor_id', 'Device ID')}:</span>
              <strong className="font-mono text-stone-900">
                {telemetry?.device?.deviceCode || 'UNO-001'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Connection Status:</span>
              {telemetry?.device?.lastSeenAt &&
              Date.now() - new Date(telemetry.device.lastSeenAt).getTime() < 60000 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online (USB Bridge)
                </span>
              ) : (
                <span className="text-stone-500 font-medium">Offline</span>
              )}
            </div>

            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">Irrigation Advice:</span>
              <strong
                className={
                  telemetry?.latestReading?.moisturePct &&
                  telemetry.latestReading.moisturePct < (telemetry.thresholds?.low || 30)
                    ? 'text-rose-700'
                    : 'text-emerald-700'
                }
              >
                {telemetry?.recommendation?.action === 'irrigate_now' ||
                (telemetry?.latestReading?.moisturePct &&
                  telemetry.latestReading.moisturePct < (telemetry.thresholds?.low || 30))
                  ? 'Irrigation Recommended'
                  : telemetry?.recommendation?.action === 'delay_irrigation'
                    ? 'No Irrigation Needed'
                    : 'Monitor Soil (Adequate)'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-100 items-center">
              <span className="text-stone-500">Pump Control:</span>
              <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                NOT CONNECTED (Safety Lock)
              </span>
            </div>

            {telemetry?.device?.batteryVoltage != null && (
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">USB / VCC Supply:</span>
                <strong className="text-stone-900 font-mono">
                  {telemetry.device.batteryVoltage.toFixed(2)}V (5.0V USB)
                </strong>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
            <strong className="block font-bold">⚠️ Hardware Circuit Protection Notice</strong>
            <p className="text-stone-600 leading-relaxed">
              Mini DC water pump is kept electrically disconnected for circuit safety. Arduino Uno GPIO pins (rated 20mA) cannot directly switch inductive motor loads. The system operates in automatic monitoring & advisory mode.
            </p>
          </div>
        </Card>
      </div>
    </div>

    {/* ISRO / NRSC Satellite Area-Level Soil Moisture Explorer (Explicitly Separated from Field Sensors) */}
    <Card className="p-6 rounded-3xl border border-stone-200 bg-white space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-200 text-[10px] font-bold uppercase tracking-wider mb-1">
            NRSC / ISRO Satellite Hydrological Estimate (0–50 cm)
          </span>
          <h2 className="text-lg font-extrabold text-[#143D2A]">
            Regional District Soil Moisture Lookup (Satellite Area Estimate)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Macro-scale district average derived from ISRO/NRSC VIC hydrological model — distinct from point-level IoT field probes above.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadSatelliteMoisture(satState, satDistrict);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={satState}
            onChange={(e) => setSatState(e.target.value)}
            placeholder="State (e.g. Gujarat)"
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 w-36"
          />
          <input
            type="text"
            value={satDistrict}
            onChange={(e) => setSatDistrict(e.target.value)}
            placeholder="District (e.g. Vadodara, Rajkot)"
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 w-44"
          />
          <Button type="submit" size="sm" isLoading={satLoading}>
            Lookup District
          </Button>
        </form>
      </div>

      {satLoading ? (
        <div className="py-8 text-center text-xs text-stone-500">Loading NRSC / ISRO district dataset...</div>
      ) : !satData?.observations || satData.observations.length === 0 ? (
        <div className="p-5 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center space-y-1">
          <p className="text-xs font-bold text-stone-800">
            No verified NRSC/ISRO satellite soil moisture records available for {satDistrict || satState}.
          </p>
          <p className="text-[11px] text-stone-500">
            SmartFarm AI never fabricates soil moisture percentages. Try a covered district (e.g. Vadodara, Rajkot, Ahmedabad, Anand, Surat) or log a manual/IoT field test above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {satData.observations.slice(0, 6).map((obs: any) => (
              <div
                key={obs.id}
                className="p-4 rounded-2xl bg-[#F7F8F5] border border-stone-200 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-stone-900 text-sm">
                    {obs.district}, {obs.state}
                  </strong>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold">
                    {obs.isDemo ? 'Baseline Model' : 'NRSC VIC'}
                  </span>
                </div>
                <div className="text-2xl font-black text-[#143D2A]">
                  {typeof obs.normalizedPercentage === 'number'
                    ? `${obs.normalizedPercentage.toFixed(1)}%`
                    : '—'}
                </div>
                <p className="text-[11px] text-stone-500">
                  Depth: {obs.depthRangeCm || '0-50 cm'} • Date:{' '}
                  {obs.observationDate ? new Date(obs.observationDate).toLocaleDateString('en-IN') : '—'}
                </p>
                <p className="text-[10px] text-stone-400 truncate">{obs.modelProvider}</p>
              </div>
            ))}
          </div>
          {satData.metadata?.disclaimer && (
            <p className="text-[11px] text-stone-500 italic">{satData.metadata.disclaimer}</p>
          )}
        </div>
      )}
    </Card>

    {/* Manual Measurement Modal */}
    {showManualModal && (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 rounded-3xl bg-white shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <PlusCircle size={18} className="text-[#2F7D4F]" />
              {t('moisture_manual_modal_title', 'Record Manual Soil Moisture Reading')}
            </h3>
            <button
              onClick={() => setShowManualModal(false)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label htmlFor="manual-moisture-pct" className="font-semibold text-stone-700 block">
                {t('moisture_manual_val_label', 'Measured Soil Moisture (%)')} *
              </label>
              <input
                id="manual-moisture-pct"
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                placeholder="e.g. 38.5"
                value={manualForm.moisturePct}
                onChange={(e) => setManualForm({ ...manualForm, moisturePct: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="manual-depth-cm" className="font-semibold text-stone-700 block">
                  {t('moisture_manual_depth_label', 'Measurement Depth (cm)')}
                </label>
                <input
                  id="manual-depth-cm"
                  type="number"
                  min="5"
                  max="100"
                  value={manualForm.depthCm}
                  onChange={(e) => setManualForm({ ...manualForm, depthCm: parseInt(e.target.value, 10) || 15 })}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="manual-temp-c" className="font-semibold text-stone-700 block">
                  {t('moisture_manual_temp_label', 'Soil Temp (°C - Optional)')}
                </label>
                <input
                  id="manual-temp-c"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 24.5"
                  value={manualForm.temperatureC}
                  onChange={(e) => setManualForm({ ...manualForm, temperatureC: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="manual-notes" className="font-semibold text-stone-700 block">
                {t('moisture_manual_notes_label', 'Notes / Soil Condition')}
              </label>
              <input
                id="manual-notes"
                type="text"
                placeholder="e.g. Hand feel test: loose moist ball, topsoil cracked"
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            {manualSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#143D2A] flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#2F7D4F]" />
                <span>Manual reading saved successfully!</span>
              </div>
            )}

            {manualError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600" />
                <span>{manualError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowManualModal(false)}
                className="cursor-pointer"
              >
                {t('cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={manualSubmitting}
                size="sm"
                className="bg-[#143D2A] hover:bg-[#0F2D1F] text-white cursor-pointer"
              >
                {manualSubmitting ? 'Saving...' : t('moisture_manual_submit', 'Save Measurement')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    )}
  </div>
);
}
