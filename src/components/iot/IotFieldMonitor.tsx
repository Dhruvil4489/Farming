'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Radio,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Battery,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Shield,
  Sprout,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { IotHistoryChart } from '@/components/iot/IotHistoryChart';
import { IotIrrigationAdvisory } from '@/components/iot/IotIrrigationAdvisory';

// ---------- Types ----------
interface FieldOption {
  id: string;
  name: string;
  farm?: { name: string; id: string };
  soilType?: string;
  irrigationType?: string;
}

interface DeviceInfo {
  id: string;
  deviceCode: string;
  name: string;
  hardwareModel: string | null;
  status: string;
  isDemo: boolean;
  lastSeenAt: string | null;
  batteryVoltage: number | null;
  latestReading: LatestReading | null;
}

interface LatestReading {
  id: string;
  measuredAt: string;
  receivedAt: string;
  soilMoistureRaw: number | null;
  soilMoisturePct: number | null;
  airTempC: number | null;
  airHumidityPct: number | null;
  qualityStatus: string;
}

interface TelemetryPoint {
  id: string;
  measuredAt: string;
  receivedAt: string;
  soilMoisturePct: number | null;
  airTempC: number | null;
  airHumidityPct: number | null;
  lightLux: number | null;
  batteryPct: number | null;
  qualityStatus: string;
  isDemo: boolean;
  deviceCode: string;
  deviceName: string;
}

interface FieldIotData {
  fieldId: string;
  fieldName: string;
  farmName: string;
  hasDevices: boolean;
  devices: DeviceInfo[];
  recentTelemetry: TelemetryPoint[];
}

// ---------- Helpers ----------
const STALE_MINUTES = 120;

function getDataAge(isoDate: string | null): { minutes: number; label: string; isStale: boolean; isVeryStale: boolean } | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  const minutes = Math.round((Date.now() - d.getTime()) / 60000);
  const isStale = minutes > STALE_MINUTES;
  const isVeryStale = minutes > 360;

  let label: string;
  if (minutes < 1) label = 'Just now';
  else if (minutes < 60) label = `${minutes}m ago`;
  else if (minutes < 1440) label = `${Math.round(minutes / 60)}h ago`;
  else label = `${Math.round(minutes / 1440)}d ago`;

  return { minutes, label, isStale, isVeryStale };
}

function getQualityBadge(status: string) {
  switch (status) {
    case 'clean':
      return { label: 'Clean', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'suspicious_skew':
      return { label: 'Clock Skew', className: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'out_of_range':
      return { label: 'Out of Range', className: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'uncalibrated':
      return { label: 'Uncalibrated', className: 'bg-orange-100 text-orange-800 border-orange-300' };
    default:
      return { label: status, className: 'bg-stone-100 text-stone-700 border-stone-300' };
  }
}

function getBatteryColor(pct: number | null | undefined): string {
  if (pct == null) return 'text-stone-400';
  if (pct > 60) return 'text-emerald-600';
  if (pct > 25) return 'text-amber-600';
  return 'text-rose-600';
}

// ---------- Component ----------
export function IotFieldMonitor() {
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [iotData, setIotData] = useState<FieldIotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState<'24h' | '7d'>('24h');
  const [historyData, setHistoryData] = useState<TelemetryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(true);

  // Load fields
  useEffect(() => {
    fetch('/api/v1/fields')
      .then((r) => r.json())
      .then((json) => {
        const fList: FieldOption[] = (json.data || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          farm: f.farm,
          soilType: f.soilType,
          irrigationType: f.irrigationType,
        }));
        setFields(fList);
        if (fList.length > 0 && !selectedFieldId) {
          setSelectedFieldId(fList[0].id);
        }
      })
      .catch(() => setFields([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch IoT data for selected field
  const fetchIotData = useCallback(async (fieldId: string) => {
    if (!fieldId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/fields/${fieldId}/iot`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setIotData(json.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load IoT data');
      setIotData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFieldId) fetchIotData(selectedFieldId);
  }, [selectedFieldId, fetchIotData]);

  // Fetch history data
  const fetchHistory = useCallback(async (fieldId: string, range: '24h' | '7d') => {
    if (!fieldId || !iotData?.devices?.length) return;
    setHistoryLoading(true);
    try {
      const deviceId = iotData.devices[0].id;
      const now = new Date();
      const from = new Date(now.getTime() - (range === '24h' ? 24 * 3600000 : 7 * 24 * 3600000));
      const limit = range === '24h' ? 288 : 336; // ~5min intervals for 24h, ~30min for 7d
      const res = await fetch(
        `/api/v1/iot/devices/${deviceId}/readings?from=${from.toISOString()}&to=${now.toISOString()}&limit=${limit}`
      );
      if (res.ok) {
        const json = await res.json();
        setHistoryData(json.data || []);
      } else {
        setHistoryData([]);
      }
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [iotData]);

  useEffect(() => {
    if (selectedFieldId && iotData?.hasDevices) {
      fetchHistory(selectedFieldId, historyRange);
    }
  }, [selectedFieldId, historyRange, iotData, fetchHistory]);

  const handleFieldChange = (id: string) => {
    setSelectedFieldId(id);
    setHistoryData([]);
  };

  // Derived state
  const primaryDevice = iotData?.devices?.[0] || null;
  const latestReading = primaryDevice?.latestReading || null;
  const dataAge = getDataAge(latestReading?.measuredAt ?? null);
  const isConnected = primaryDevice?.status === 'active' && dataAge && !dataAge.isVeryStale;
  const isDemo = primaryDevice?.isDemo ?? false;
  const qualityBadge = latestReading ? getQualityBadge(latestReading.qualityStatus) : null;

  return (
    <div className="space-y-6">
      {/* Field Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
        <div className="flex items-center gap-3 flex-wrap">
          <Radio size={16} className="text-emerald-600" />
          <span className="text-xs font-bold text-stone-700">Field Plot:</span>
          {fields.length === 0 ? (
            <span className="text-xs text-stone-500 italic">No registered fields</span>
          ) : (
            <select
              id="iot-field-select"
              value={selectedFieldId}
              onChange={(e) => handleFieldChange(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.farm?.name || 'Farm'})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchIotData(selectedFieldId)}
            disabled={loading}
            className="text-xs h-8"
          >
            <RefreshCw size={12} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-stone-100 animate-pulse rounded-3xl" />
          <div className="h-64 bg-stone-100 animate-pulse rounded-3xl md:col-span-2" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="p-8 text-center space-y-4 border-rose-200 bg-rose-50/50">
          <AlertTriangle size={36} className="mx-auto text-rose-600" />
          <h3 className="text-base font-bold text-rose-950">Error Loading IoT Data</h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">{error}</p>
          <Button size="sm" onClick={() => fetchIotData(selectedFieldId)}>
            Retry
          </Button>
        </Card>
      )}

      {/* No Devices State */}
      {!loading && !error && iotData && !iotData.hasDevices && (
        <Card className="p-10 rounded-3xl text-center space-y-5 border-2 border-dashed border-stone-300 bg-stone-50/60 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-stone-200/80 text-stone-600 flex items-center justify-center mx-auto">
            <WifiOff size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-stone-900">No IoT Devices Paired</h3>
            <p className="text-xs text-stone-600 leading-relaxed max-w-lg mx-auto">
              No physical sensor probe is currently paired with <strong>{iotData.fieldName}</strong>.
              Pair an IoT device to see live soil moisture, temperature, and humidity readings.
            </p>
          </div>
          <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl text-left text-xs text-cyan-950 space-y-1">
            <strong className="block text-cyan-900 font-bold">Until a sensor is installed:</strong>
            <p className="text-stone-700">
              Reference the <strong>Government NRSC VIC Model</strong> tab for district-level soil moisture baselines,
              or check the <Link href="/weather" className="font-bold text-cyan-800 underline">Weather</Link> page for forecast conditions.
            </p>
          </div>
        </Card>
      )}

      {/* Connected Device — Main IoT Monitor */}
      {!loading && !error && iotData?.hasDevices && primaryDevice && (
        <div className="space-y-6">
          {/* Stale Data Warning Banner */}
          {dataAge?.isStale && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <strong className="block text-sm text-amber-900">Sensor Data is {dataAge.isVeryStale ? 'Very ' : ''}Stale</strong>
                Last reading was <strong>{dataAge.label}</strong> ({new Date(latestReading!.measuredAt).toLocaleString()}).
                {dataAge.isVeryStale
                  ? ' The current field moisture may have changed significantly. Check device connectivity and battery.'
                  : ' Consider that moisture conditions may have changed since this measurement.'}
              </div>
            </div>
          )}

          {/* Top Grid: Live Readings + Device Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Big Moisture Reading */}
            <Card className="p-6 rounded-3xl space-y-5 border border-stone-200/90 shadow-sm">
              {/* Device Status Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                        {dataAge?.isStale ? 'Stale' : 'Connected'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                      <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Offline</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {isDemo && <ProvenanceChip type="demo" label="SIMULATED" />}
                  {!isDemo && <ProvenanceChip type="measured" label="REAL DEVICE" />}
                </div>
              </div>

              {/* Big Soil Moisture Display */}
              <div className="text-center py-4 bg-stone-50/80 rounded-2xl border border-stone-100">
                <span className="text-xs font-bold text-stone-500 block">
                  Soil Moisture Index (Approx. %)
                </span>
                {latestReading?.soilMoisturePct != null ? (
                  <div className="space-y-1 my-2">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-5xl font-black text-[#0F2D1F] tracking-tight">
                        {latestReading.soilMoisturePct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] text-stone-500 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} className="text-emerald-700 shrink-0" />
                        <span>Measured: <strong>{new Date(latestReading.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      </span>
                      <span>•</span>
                      <span>Received: <strong>{new Date(latestReading.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-stone-400 my-2">—</p>
                )}
                <p className="text-[10px] text-stone-500 px-4">
                  Approximate calibrated sensor index — not lab-verified volumetric water content (VWC).
                  Actual soil moisture depends on probe type, calibration, and installation depth.
                </p>
              </div>

              {/* Secondary Readings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
                  <Thermometer size={16} className="mx-auto text-orange-500 mb-1" />
                  <span className="text-[10px] text-stone-500 font-medium block">Air Temp</span>
                  <span className="text-lg font-extrabold text-stone-900">
                    {latestReading?.airTempC != null ? `${latestReading.airTempC.toFixed(1)}°C` : '—'}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
                  <Wind size={16} className="mx-auto text-sky-500 mb-1" />
                  <span className="text-[10px] text-stone-500 font-medium block">Humidity</span>
                  <span className="text-lg font-extrabold text-stone-900">
                    {latestReading?.airHumidityPct != null ? `${latestReading.airHumidityPct.toFixed(1)}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Provenance Details */}
              <div className="pt-3 border-t border-stone-100 space-y-1.5 text-[11px] text-stone-600">
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">Device:</span>
                  <span className="font-mono font-semibold text-stone-800">{primaryDevice.deviceCode}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">Model:</span>
                  <span className="font-semibold text-stone-800">{primaryDevice.hardwareModel || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">Last Received:</span>
                  <span className="font-semibold text-stone-800">
                    {dataAge ? dataAge.label : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">Quality:</span>
                  {qualityBadge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${qualityBadge.className}`}>
                      {qualityBadge.label}
                    </span>
                  )}
                </div>
                {primaryDevice.batteryVoltage != null && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-stone-400">Battery:</span>
                    <span className={`font-bold ${getBatteryColor(primaryDevice.batteryVoltage ? primaryDevice.batteryVoltage / 4.2 * 100 : null)}`}>
                      <Battery size={12} className="inline mr-1" />
                      {primaryDevice.batteryVoltage.toFixed(2)}V
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Right: History Chart */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 rounded-3xl space-y-4 border border-stone-200/90 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Telemetry History</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {iotData.fieldName} — sensor readings over time (IST)
                    </p>
                  </div>
                  <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <button
                      onClick={() => setHistoryRange('24h')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        historyRange === '24h'
                          ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      24 Hours
                    </button>
                    <button
                      onClick={() => setHistoryRange('7d')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        historyRange === '7d'
                          ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      7 Days
                    </button>
                  </div>
                </div>

                {historyLoading ? (
                  <div className="h-64 bg-stone-100 animate-pulse rounded-2xl flex items-center justify-center">
                    <RefreshCw size={20} className="animate-spin text-stone-400" />
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-stone-500 text-xs italic bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                    No telemetry readings recorded in the past {historyRange === '24h' ? '24 hours' : '7 days'}.
                  </div>
                ) : (
                  <IotHistoryChart
                    data={historyData}
                    range={historyRange}
                    isDemo={isDemo}
                  />
                )}
              </Card>
            </div>
          </div>

          {/* Irrigation Advisory Section */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAdvisory(!showAdvisory)}
              className="flex items-center gap-2 text-base font-bold text-stone-900 hover:text-[#2F7D4F] transition-colors cursor-pointer"
            >
              <Shield size={18} className="text-[#2F7D4F]" />
              Irrigation Advisory & Alerts
              {showAdvisory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdvisory && (
              <IotIrrigationAdvisory fieldId={selectedFieldId} isDemo={isDemo} />
            )}
          </div>

          {/* Recent Telemetry Log */}
          {iotData.recentTelemetry.length > 0 && (
            <Card className="p-6 rounded-3xl space-y-4 border border-stone-200/90">
              <h3 className="text-base font-bold text-stone-900">Recent Telemetry Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-stone-500 font-bold uppercase tracking-wider">
                      <th className="pb-2 pr-3">Time</th>
                      <th className="pb-2 pr-3">Moisture %</th>
                      <th className="pb-2 pr-3">Temp °C</th>
                      <th className="pb-2 pr-3">Humidity %</th>
                      <th className="pb-2 pr-3">Quality</th>
                      <th className="pb-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iotData.recentTelemetry.slice(0, 10).map((r) => {
                      const age = getDataAge(r.measuredAt);
                      const qb = getQualityBadge(r.qualityStatus);
                      return (
                        <tr key={r.id} className="border-b border-stone-100 hover:bg-stone-50">
                          <td className="py-2 pr-3 font-mono text-stone-700">
                            {new Date(r.measuredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                            {age?.isStale && (
                              <span className="ml-1.5 text-amber-600 text-[10px] font-bold">STALE</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 font-bold text-stone-900">
                            {r.soilMoisturePct != null ? `${r.soilMoisturePct.toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-2 pr-3 text-stone-700">
                            {r.airTempC != null ? `${r.airTempC.toFixed(1)}` : '—'}
                          </td>
                          <td className="py-2 pr-3 text-stone-700">
                            {r.airHumidityPct != null ? `${r.airHumidityPct.toFixed(1)}` : '—'}
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${qb.className}`}>
                              {qb.label}
                            </span>
                          </td>
                          <td className="py-2">
                            {r.isDemo ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-400">
                                SIMULATED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                DEVICE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Important Disclaimer */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700 leading-relaxed">
              <strong className="text-amber-900 block text-sm mb-0.5">Sensor Data Distinction</strong>
              <strong>IoT sensor soil moisture</strong> shown here is an approximate calibrated index from a field-installed probe.
              It differs from <strong>NRSC VIC Model estimates</strong> (district-scale macro averages) and
              <strong> Open-Meteo weather forecasts</strong> (atmosphere-level predictions).
              Do not compare these data sources directly. Combine sensor data with physical field inspection and crop stage before making irrigation decisions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
