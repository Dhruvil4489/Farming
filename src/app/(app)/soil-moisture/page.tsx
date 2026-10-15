'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Droplets,
  Radio,
  Building2,
  Calendar,
  Layers,
  Info,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SoilObservation {
  id: string;
  state: string;
  district: string;
  observationDate: string;
  moistureValue: number;
  originalUnit: string;
  normalizedPercentage: number;
  depthRangeCm: string;
  spatialResolution: string;
  modelProvider: string;
  datasetCatalog: string;
  sourceUrl: string;
  qualityStatus: string;
  isDemo: boolean;
  notes?: string;
  fetchedAt: string;
  category: {
    level: 'deficit' | 'optimum' | 'surplus';
    label: string;
    badgeClass: string;
    description: string;
  };
  isGovernmentModel: boolean;
}

interface TrendPoint {
  date: string;
  moistureValue: number;
  normalizedPercentage: number;
  depthRangeCm: string;
  category: {
    level: string;
    label: string;
  };
}

export default function SoilMoisturePage() {
  const [activeTab, setActiveTab] = useState<'government' | 'sensor'>('government');
  const [selectedState, setSelectedState] = useState('Gujarat');
  const [selectedDistrict, setSelectedDistrict] = useState('Vadodara');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [observations, setObservations] = useState<SoilObservation[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [providerInfo, setProviderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Field sensor telemetry state
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [sensorTelemetry, setSensorTelemetry] = useState<any>(null);
  const [sensorLoading, setSensorLoading] = useState(false);

  const fetchSoilMoistureData = async (district: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/soil-moisture?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(district)}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load government soil moisture (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to retrieve observations');
      }

      setObservations(data.observations || []);
      setTrend(data.trend || []);
      setAvailableDistricts(data.availableDistricts || []);
      setProviderInfo(data.provider);
      if (!district && data.selectedDistrict) {
        setSelectedDistrict(data.selectedDistrict);
      }
    } catch (err: any) {
      console.error('[SoilMoisturePage] Error:', err);
      setError(err.message || 'Unable to connect to Soil Moisture service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const res = await fetch('/api/v1/fields');
      if (res.ok) {
        const json = await res.json();
        const fList = json.data || [];
        setFields(fList);
        if (fList.length > 0 && !selectedFieldId) {
          setSelectedFieldId(fList[0].id);
          fetchSensorData(fList[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load user fields for sensor pairing check');
    }
  };

  const fetchSensorData = async (fieldId: string) => {
    if (!fieldId) return;
    setSensorLoading(true);
    try {
      const res = await fetch(`/api/v1/soil-moisture/sensor?fieldId=${encodeURIComponent(fieldId)}`);
      if (res.ok) {
        const json = await res.json();
        setSensorTelemetry(json.telemetry);
      }
    } catch (e) {
      console.error('Error querying field sensor:', e);
    } finally {
      setSensorLoading(false);
    }
  };

  useEffect(() => {
    fetchSoilMoistureData(selectedDistrict);
    fetchFields();
  }, []);

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    fetchSoilMoistureData(newDistrict);
  };

  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    fetchSensorData(fieldId);
  };

  const currentObs = observations.find((o) => o.district === selectedDistrict) || observations[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-700 flex items-center justify-center font-bold">
              <Droplets size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0F2D1F] tracking-tight">Soil Moisture Intelligence</h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Official NRSC VIC Hydrological Model Baselines vs. In-Situ IoT Field Sensors
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl border border-stone-200 shrink-0">
          <button
            onClick={() => setActiveTab('government')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'government'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building2 size={15} className="text-cyan-600" />
            Government Model (District)
          </button>
          <button
            onClick={() => setActiveTab('sensor')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sensor'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Radio size={15} className="text-emerald-600" />
            Farm Field Sensor (In-Situ)
          </button>
        </div>
      </div>

      {/* Critical Scientific Provenance Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5">
        <Info size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <span className="font-bold text-amber-900 block text-sm mb-0.5">
            Important Agricultural Data Distinction
          </span>
          <span className="text-stone-700">
            <strong>Government model soil moisture</strong> represents regional macro-scale estimates (0–50 cm depth)
            derived from the Variable Infiltration Capacity (VIC) hydrological model run by the National Remote Sensing
            Centre (NRSC / ISRO). It is not an in-situ plot measurement. Do not make automated irrigation decisions solely
            from district averages — combine this baseline with your crop stage, physical field feel, and localized soil test data.
          </span>
        </div>
      </div>

      {/* TAB 1: GOVERNMENT HYDROLGICAL MODEL DATA */}
      {activeTab === 'government' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                <MapPin size={16} className="text-[#2F7D4F]" />
                <span>State:</span>
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-stone-900 font-extrabold border border-stone-200">
                  {selectedState}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                <span>District:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                >
                  {availableDistricts.length === 0 ? (
                    <option value="Vadodara">Vadodara</option>
                  ) : (
                    availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSoilMoistureData(selectedDistrict)}
                disabled={loading}
                className="text-xs h-8"
              >
                <RefreshCw size={12} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Feed
              </Button>
            </div>
          </div>

          {/* Main Content States */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-stone-100 animate-pulse rounded-3xl" />
              <div className="h-64 bg-stone-100 animate-pulse rounded-3xl md:col-span-2" />
            </div>
          ) : error ? (
            <Card className="p-8 text-center space-y-4 border-rose-200 bg-rose-50/50">
              <AlertTriangle size={36} className="mx-auto text-rose-600" />
              <h3 className="text-base font-bold text-rose-950">Error Loading Soil Moisture Data</h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">{error}</p>
              <Button size="sm" onClick={() => fetchSoilMoistureData(selectedDistrict)}>
                Retry
              </Button>
            </Card>
          ) : currentObs ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Big Dial & Key Metrics */}
              <Card className="p-6 rounded-3xl space-y-5 border border-stone-200/90 shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      {currentObs.district} Baseline
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${currentObs.category.badgeClass}`}>
                    {currentObs.category.label}
                  </span>
                </div>

                {/* Big Metric Display */}
                <div className="text-center py-4 bg-stone-50/80 rounded-2xl border border-stone-100">
                  <span className="text-xs font-bold text-stone-500 block">Volumetric Water Content (VWC)</span>
                  <div className="flex items-baseline justify-center gap-1.5 my-2">
                    <span className="text-5xl font-black text-[#0F2D1F] tracking-tight">
                      {currentObs.normalizedPercentage}%
                    </span>
                    <span className="text-xs font-bold text-stone-400">volumetric</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-stone-600 font-mono bg-white px-3 py-1 rounded-full border border-stone-200">
                    <span>Raw Unit:</span>
                    <strong className="text-stone-900 font-bold">{currentObs.moistureValue} m³/m³</strong>
                  </div>
                </div>

                {/* Agronomic Interpretation */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-stone-900 block">Agronomic Interpretation</span>
                  <p className="text-stone-600 leading-relaxed bg-cyan-50/50 p-3 rounded-xl border border-cyan-100/70">
                    {currentObs.category.description}
                  </p>
                </div>

                {/* Provenance Details */}
                <div className="pt-3 border-t border-stone-100 space-y-2 text-[11px] text-stone-600">
                  <div className="flex justify-between py-1 border-b border-stone-50">
                    <span className="text-stone-400">Model Provider:</span>
                    <span className="font-semibold text-stone-800 text-right">{currentObs.modelProvider}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-50">
                    <span className="text-stone-400">Root Depth:</span>
                    <span className="font-semibold text-stone-800">{currentObs.depthRangeCm}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-50">
                    <span className="text-stone-400">Resolution:</span>
                    <span className="font-semibold text-stone-800">District macroscale average</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-50">
                    <span className="text-stone-400">Observation Date:</span>
                    <span className="font-bold text-stone-900">{currentObs.observationDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">Quality Status:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> {currentObs.qualityStatus}
                    </span>
                  </div>
                </div>

                {/* Source Catalog Link */}
                <a
                  href={currentObs.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-800 hover:text-cyan-900 hover:underline pt-1 text-center"
                >
                  Verify at data.gov.in Catalog <ExternalLink size={12} />
                </a>
              </Card>

              {/* Right Column (2 Cols): Trend Visualizer & District Comparison */}
              <div className="lg:col-span-2 space-y-6">
                {/* Historical Trend Card */}
                <Card className="p-6 rounded-3xl space-y-5 border border-stone-200/90 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">
                        {currentObs.district} Historical Moisture Trend
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Macroscale hydrological root-zone saturation profile over recent dates
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
                      Depth: 0–50 cm
                    </span>
                  </div>

                  {trend.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-500 italic">
                      No historical trend dates archived for this district yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Interactive Bar Chart Representation */}
                      <div className="space-y-3 pt-2">
                        {trend.map((pt, i) => {
                          const pct = pt.normalizedPercentage;
                          const barWidth = Math.min(100, Math.max(15, (pct / 45) * 100));
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-mono text-stone-600 font-semibold">{pt.date}</span>
                                <span className="font-bold text-stone-900">
                                  {pct}% ({pt.moistureValue} m³/m³)
                                </span>
                              </div>
                              <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden p-0.5">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                        <span>Wilting threshold (~15%)</span>
                        <span className="font-semibold text-emerald-700">Optimal PAW (20–34%)</span>
                        <span>Near Saturation (&gt;35%)</span>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Other Gujarat Districts Snapshot */}
                <Card className="p-6 rounded-3xl space-y-4 border border-stone-200/90 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-stone-900">Gujarat Agro-Climatic Districts Comparison</h3>
                    <span className="text-xs text-stone-500">Latest available observation date</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {observations.map((obs) => {
                      const isSelected = obs.district === selectedDistrict;
                      return (
                        <div
                          key={obs.id}
                          onClick={() => handleDistrictChange(obs.district)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-50/70 border-cyan-500 ring-2 ring-cyan-500/20 shadow-xs'
                              : 'bg-stone-50 hover:bg-white border-stone-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-stone-900">{obs.district}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${obs.category.badgeClass}`}>
                              {obs.category.level}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-xl font-black text-[#0F2D1F]">{obs.normalizedPercentage}%</span>
                            <span className="text-[10px] text-stone-400 font-mono">({obs.moistureValue} m³/m³)</span>
                          </div>
                          <span className="text-[10px] text-stone-500 block mt-1">{obs.observationDate}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center text-xs text-stone-500">
              No observations found for {selectedDistrict}.
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: IN-SITU PHYSICAL FARM SENSOR TELEMETRY */}
      {activeTab === 'sensor' && (
        <div className="space-y-6">
          {/* Field Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-700">Select Field Plot:</span>
              {fields.length === 0 ? (
                <span className="text-xs text-stone-500 italic">No registered fields found in your account</span>
              ) : (
                <select
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

            <Link href="/fields">
              <Button variant="outline" size="sm" className="text-xs h-8">
                Manage Farm Fields →
              </Button>
            </Link>
          </div>

          {/* Sensor Status Display */}
          {sensorLoading ? (
            <div className="h-48 bg-stone-100 animate-pulse rounded-3xl" />
          ) : sensorTelemetry?.hasSensor ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Connected Sensor Card */}
              <Card className="p-6 rounded-3xl space-y-4 border border-emerald-200 bg-emerald-50/20">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-emerald-900 uppercase">Live Sensor Active</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800">
                    {sensorTelemetry.sensorId}
                  </span>
                </div>

                <div className="text-center py-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                  <span className="text-xs text-stone-500 font-semibold">Local Root-Zone Moisture</span>
                  <p className="text-5xl font-black text-emerald-950 my-2">
                    {sensorTelemetry.latestReading?.moisturePct}%
                  </p>
                  <span className="text-xs text-stone-500">Capacitance probe at {sensorTelemetry.depthCm} cm depth</span>
                </div>

                <div className="space-y-2 text-xs text-stone-700">
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-400">Soil Temperature:</span>
                    <span className="font-bold text-stone-900">{sensorTelemetry.latestReading?.temperatureC}°C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-400">Sensor Battery:</span>
                    <span className="font-bold text-stone-900">{sensorTelemetry.latestReading?.batteryPct}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">Last Telemetry:</span>
                    <span className="font-bold text-stone-900 font-mono">
                      {new Date(sensorTelemetry.latestReading?.readingAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* In-Situ Trend History */}
              <Card className="p-6 rounded-3xl space-y-4 md:col-span-2 border border-stone-200">
                <h3 className="text-base font-bold text-stone-900">Recent In-Situ Sensor Telemetry Logs</h3>
                <div className="space-y-2">
                  {sensorTelemetry.historicalReadings?.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-stone-600 font-semibold">
                        {new Date(r.readingAt).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-stone-900">{r.moisturePct}% VWC</span>
                        {r.temperatureC && <span className="text-stone-500">{r.temperatureC}°C</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            /* Clear Disconnected State - Zero Fabrication */
            <Card className="p-10 rounded-3xl text-center space-y-5 border-2 border-dashed border-stone-300 bg-stone-50/60 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-stone-200/80 text-stone-600 flex items-center justify-center mx-auto">
                <Cpu size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-stone-900">Field IoT Sensor Not Connected</h3>
                <p className="text-xs text-stone-600 leading-relaxed max-w-lg mx-auto">
                  No physical hardware soil probe (such as an FDR / TDR capacitive sensor) is currently paired with this
                  plot. In-situ sensors measure real-time micro-zone hydration at a fixed 15 cm depth.
                </p>
              </div>

              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl text-left text-xs text-cyan-950 space-y-1">
                <strong className="block text-cyan-900 font-bold">Recommended Guidance:</strong>
                <p className="text-stone-700">
                  Until you install and link a SmartFarm LoRaWAN / GSM field probe, reference the{' '}
                  <button
                    onClick={() => setActiveTab('government')}
                    className="font-bold text-cyan-800 underline cursor-pointer"
                  >
                    Government NRSC VIC Model Moisture Tab
                  </button>{' '}
                  for your district’s hydrological baseline.
                </p>
              </div>

              <div className="pt-2">
                <Link href="/assistant?prompt=How do I install and configure an IoT soil moisture sensor for my field?">
                  <Button size="sm" variant="outline" className="text-xs">
                    Pairing Guide & Supported Sensors →
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
