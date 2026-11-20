'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Tractor,
  Grid,
  Sprout,
  CheckSquare,
  CloudSun,
  Plus,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Package,
  ShieldCheck,
  Droplets,
  ScanLine,
  Bot,
  MapPin,
} from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { CropStageBar } from '@/components/domain/CropStageBar';
import { useI18n } from '@/providers/I18nProvider';

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const [summary, setSummary] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [mandiPrices, setMandiPrices] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [soilMoisture, setSoilMoisture] = useState<any>(null);
  const [sensorTelemetry, setSensorTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const sumController = new AbortController();
      const sumTimeout = setTimeout(() => sumController.abort(), 8000);

      const sumRes = await fetch(`/api/v1/dashboard/summary?lang=${locale}`, {
        signal: sumController.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(sumTimeout);

      if (sumRes.status === 401) {
        window.location.href = '/login?redirect=/dashboard';
        return;
      }

      if (!sumRes.ok) {
        throw new Error(`Unable to load your dashboard right now.`);
      }

      const sumData = await sumRes.json();
      const profileSummary = sumData.data || null;
      setSummary(profileSummary);

      const userState = profileSummary?.state || 'Gujarat';
      const primaryFarmId = profileSummary?.farms?.[0]?.id;
      const primaryFieldId = profileSummary?.farms?.[0]?.fields?.[0]?.id;
      const farmQs = primaryFarmId ? `?farm_id=${encodeURIComponent(primaryFarmId)}&lang=${locale}` : `?lang=${locale}`;

      const fetchWithTimeout = async (url: string, ms = 6000) => {
        const c = new AbortController();
        const timer = setTimeout(() => c.abort(), ms);
        try {
          const res = await fetch(url, { signal: c.signal, headers: { Accept: 'application/json' } });
          return res.ok ? await res.json() : null;
        } catch {
          return null;
        } finally {
          clearTimeout(timer);
        }
      };

      const [weaRes, advRes, mandiRes, orderRes, soilRes, sensorRes] = await Promise.allSettled([
        fetchWithTimeout(`/api/v1/weather${farmQs}`),
        fetchWithTimeout(`/api/v1/advisories${farmQs}`),
        fetchWithTimeout(`/api/v1/market/prices?limit=3&lang=${locale}`),
        fetchWithTimeout('/api/v1/store/orders'),
        fetchWithTimeout(`/api/v1/soil-moisture?state=${encodeURIComponent(userState)}&lang=${locale}`),
        primaryFieldId ? fetchWithTimeout(`/api/v1/soil-moisture/sensor?fieldId=${encodeURIComponent(primaryFieldId)}&lang=${locale}`) : Promise.resolve(null),
      ]);

      if (weaRes.status === 'fulfilled' && weaRes.value?.data) setWeather(weaRes.value.data);
      if (advRes.status === 'fulfilled' && Array.isArray(advRes.value?.data)) setAdvisories(advRes.value.data);
      if (mandiRes.status === 'fulfilled' && Array.isArray(mandiRes.value?.data)) {
        setMandiPrices(mandiRes.value.data.slice(0, 3));
      }
      if (orderRes.status === 'fulfilled' && Array.isArray(orderRes.value?.data)) {
        setRecentOrders(orderRes.value.data.slice(0, 1));
      }
      if (soilRes.status === 'fulfilled' && soilRes.value?.observations?.[0]) {
        setSoilMoisture(soilRes.value.observations[0]);
      }
      if (sensorRes.status === 'fulfilled' && sensorRes.value?.data) {
        setSensorTelemetry(sensorRes.value.data);
      }
    } catch (err: any) {
      setError(
        err.name === 'AbortError'
          ? 'Connection timed out while loading your dashboard.'
          : err.message || 'Unable to load dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => {
      fetchDashboardData();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  // Build real dynamic insight from user's actual crops & live weather (never fabricated!)
  const firstActiveCycle = summary?.farms
    ?.flatMap((f: any) => f.fields || [])
    ?.flatMap((fld: any) => fld.cropCycles || [])?.[0];
  const activeCropName = firstActiveCycle?.crop?.name || firstActiveCycle?.customCropName || null;
  const userLocation = [summary?.district, summary?.state].filter(Boolean).join(', ');

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error}
      onRetry={fetchDashboardData}
    >
      <div className="space-y-6">
        {/* Executive Welcome & Quick Actions */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-[#0F2D1F] tracking-tight">
                {t('welcome_farmer', 'Good day')}, {summary?.userName || 'Farmer'}
              </h1>
              {userLocation && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <MapPin size={11} /> {userLocation}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-600">
              {summary?.counts?.farms || 0} {t('my_farms', 'Farms')} • {summary?.counts?.fields || 0}{' '}
              {t('fields', 'Fields')} • {summary?.counts?.activeCycles || 0}{' '}
              {t('active_crops', 'Active Crops')} • {summary?.counts?.pendingTasks || 0}{' '}
              {t('pending_tasks', 'Pending Tasks')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/fields/new">
              <Button size="sm" className="bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl">
                <Plus size={14} className="mr-1" /> {t('add_field', 'Add Field')}
              </Button>
            </Link>
            <Link href="/crops/new-cycle">
              <Button size="sm" variant="outline" className="rounded-xl">
                <Sprout size={14} className="mr-1 text-[#2F7D4F]" /> {t('start_crop_cycle', 'Start Crop')}
              </Button>
            </Link>
            <Link href="/diagnosis">
              <Button size="sm" variant="outline" className="rounded-xl">
                <ScanLine size={14} className="mr-1 text-rose-600" /> {t('crop_disease_ai', 'Scan Leaf')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Urgent In-Situ Soil Moisture Critical Alert */}
        {sensorTelemetry?.latestReading &&
          sensorTelemetry.latestReading.moisturePct < (sensorTelemetry.thresholds?.low || 30) && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 shadow-sm animate-pulse">
              <div className="flex items-start gap-3">
                <AlertTriangle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-rose-900">
                      ⚠️ Critical Soil Moisture Alert: Irrigation Recommended
                    </span>
                    <span className="bg-rose-200 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Moisture Deficit Stress
                    </span>
                  </div>
                  <p className="text-rose-800 leading-relaxed font-medium">
                    In-situ soil moisture in <strong>{sensorTelemetry.fieldName}</strong> has fallen to{' '}
                    <strong>{sensorTelemetry.latestReading.moisturePct.toFixed(1)}%</strong> (threshold: {sensorTelemetry.thresholds?.low || 30}%).
                    Irrigation is recommended immediately to prevent crop damage.
                  </p>
                </div>
              </div>
              <Link
                href="/soil-moisture"
                className="shrink-0 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
              >
                View Telemetry →
              </Link>
            </div>
          )}

        {/* Weather Advisory Alerts */}
        {advisories.length > 0 && (
          <div className="space-y-2">
            {advisories.map((adv, idx) => (
              <div
                key={idx}
                className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-2xl text-amber-950 flex items-start gap-3 shadow-xs"
              >
                <AlertTriangle size={19} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-sm">{adv.advice?.title}</span>
                    <ProvenanceChip type={weather?.current?.isDemo ? 'demo' : 'weather_service'} />
                  </div>
                  <p className="text-amber-900 leading-relaxed">{adv.advice?.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clickable KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/farms" className="group">
            <Card className="p-4 flex items-center gap-3.5 rounded-2xl hover:border-emerald-400 transition-all">
              <div className="w-11 h-11 bg-emerald-50 border border-emerald-200/70 text-[#2F7D4F] rounded-xl flex items-center justify-center shrink-0">
                <Tractor size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{t('my_farms', 'My Farms')}</p>
                <p className="text-2xl font-black text-[#0F2D1F]">{summary?.counts?.farms || 0}</p>
              </div>
            </Card>
          </Link>

          <Link href="/fields" className="group">
            <Card className="p-4 flex items-center gap-3.5 rounded-2xl hover:border-emerald-400 transition-all">
              <div className="w-11 h-11 bg-sky-50 border border-sky-200/70 text-sky-700 rounded-xl flex items-center justify-center shrink-0">
                <Grid size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{t('total_fields', 'Fields')}</p>
                <p className="text-2xl font-black text-[#0F2D1F]">{summary?.counts?.fields || 0}</p>
              </div>
            </Card>
          </Link>

          <Link href="/crops" className="group">
            <Card className="p-4 flex items-center gap-3.5 rounded-2xl hover:border-emerald-400 transition-all">
              <div className="w-11 h-11 bg-lime-50 border border-lime-200/70 text-lime-700 rounded-xl flex items-center justify-center shrink-0">
                <Sprout size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{t('active_crops', 'Active Crops')}</p>
                <p className="text-2xl font-black text-[#0F2D1F]">{summary?.counts?.activeCycles || 0}</p>
              </div>
            </Card>
          </Link>

          <Link href="/tasks" className="group">
            <Card className="p-4 flex items-center gap-3.5 rounded-2xl hover:border-emerald-400 transition-all">
              <div className="w-11 h-11 bg-amber-50 border border-amber-200/70 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                <CheckSquare size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{t('pending_tasks', 'Pending Tasks')}</p>
                <p className="text-2xl font-black text-[#0F2D1F]">{summary?.counts?.pendingTasks || 0}</p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Main 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weather Strip */}
            <Card className="space-y-4 rounded-2xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CloudSun size={19} className="text-[#2F7D4F]" />
                  <h3 className="font-bold text-stone-900 text-base">{t('weather', 'Weather & Spray Conditions')}</h3>
                </div>
                <Link href="/weather" className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1">
                  7-Day Forecast <ArrowRight size={13} />
                </Link>
              </div>

              {weather?.current ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F8F5] p-3.5 rounded-xl border border-stone-200/70 text-center">
                  <div>
                    <span className="text-[11px] text-stone-500 font-medium">Temperature</span>
                    <p className="text-lg font-extrabold text-stone-900">{weather.current.temperatureC}°C</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 font-medium">Humidity</span>
                    <p className="text-lg font-extrabold text-stone-900">{weather.current.humidityPct}%</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 font-medium">Wind</span>
                    <p className="text-lg font-extrabold text-stone-900">{weather.current.windSpeedKmh} km/h</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 font-medium">Rain Chance</span>
                    <p className="text-lg font-extrabold text-stone-900">{weather.current.rainProbabilityPct}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500">Weather forecast unavailable right now.</p>
              )}
            </Card>

            {/* Live Mandi Prices */}
            <Card className="space-y-4 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <TrendingUp size={19} className="text-[#2F7D4F]" />
                  <h3 className="font-bold text-stone-900 text-base">{t('live_mandi_rates', 'Live Mandi Prices')}</h3>
                </div>
                <Link href="/mandi" className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1">
                  {t('all_mandis', 'All Mandis')} <ArrowRight size={13} />
                </Link>
              </div>

              {mandiPrices.length === 0 ? (
                <p className="text-xs text-stone-500">Mandi price feed is refreshing...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mandiPrices.map((item) => {
                    const isUp = item.comparison?.priceChange > 0;
                    const isDown = item.comparison?.priceChange < 0;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 bg-[#F7F8F5] rounded-xl border border-stone-200/80 space-y-2 flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-xs font-extrabold text-stone-900 block">{item.commodityName}</span>
                            <span className="text-[10px] text-stone-500">{item.marketName}</span>
                          </div>
                          <ProvenanceChip type={item.isDemo ? 'simulated' : 'official_market'} size="xs" />
                        </div>

                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-[#0F2D1F]">₹{item.modalPrice}</span>
                            <span className="text-[10px] text-stone-400">/{item.unit?.replace('₹/', '') || 'qtl'}</span>
                          </div>
                          {item.comparison?.previousModalPrice ? (
                            <div className="text-[10px] font-bold mt-0.5">
                              {isUp ? (
                                <span className="text-emerald-700 flex items-center">
                                  <TrendingUp size={11} className="mr-0.5" /> +₹{item.comparison.priceChange}
                                </span>
                              ) : isDown ? (
                                <span className="text-rose-600 flex items-center">
                                  <TrendingDown size={11} className="mr-0.5" /> -₹{Math.abs(item.comparison.priceChange)}
                                </span>
                              ) : (
                                <span className="text-stone-400">Stable</span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Farms & Active Crops */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-base">{t('your_farms_crops', 'Your Farms & Active Crops')}</h3>
                <Link href="/fields" className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1">
                  {t('manage_fields', 'Manage Fields')} <ArrowRight size={13} />
                </Link>
              </div>

              {!summary?.farms || summary.farms.length === 0 ? (
                <Card className="p-8 text-center space-y-3 rounded-2xl">
                  <Tractor size={28} className="mx-auto text-stone-400" />
                  <p className="font-bold text-stone-800 text-sm">{t('no_farms_added', 'No farms added yet')}</p>
                  <p className="text-xs text-stone-500">{t('add_farm_desc', 'Add your first farm to track fields, crops, and weather.')}</p>
                  <Link href="/farms/new" className="inline-block">
                    <Button size="sm">{t('add_first_farm', 'Add Your First Farm')}</Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-3">
                  {summary.farms.map((farm: any) => (
                    <Card key={farm.id} className="space-y-3 rounded-2xl p-5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <Link href={`/farms/${farm.id}`} className="font-bold text-stone-900 text-base hover:text-[#2F7D4F]">
                            {farm.name}
                          </Link>
                          <p className="text-xs text-stone-500">
                            {[farm.village, farm.district, farm.state].filter(Boolean).join(', ')}
                            {farm.areaInputValue ? ` • ${farm.areaInputValue} ${farm.areaInputUnit || 'acre'}` : ''}
                          </p>
                        </div>
                        <Link href={`/farms/${farm.id}`} className="text-xs font-bold text-[#2F7D4F] hover:underline">
                          {t('details', 'Details')} →
                        </Link>
                      </div>

                      {farm.fields?.length > 0 ? (
                        <div className="space-y-2.5 pt-1">
                          {farm.fields.map((field: any) => (
                            <div key={field.id} className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200/70 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-stone-800">
                                  {field.name}
                                  {field.cropCycles?.[0]?.crop?.name ? ` — ${field.cropCycles[0].crop.name}` : ''}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                                  {field.status}
                                </span>
                              </div>
                              {
                                field.cropCycles?.[0]?.stages?.length > 0 && (
                                  <CropStageBar
                                    stages={
                                      field.cropCycles[0].stages.map((st: any) => ({
                                        id: st.id,
                                        name: st.nameSnapshot,
                                        status: st.status,
                                      }))
                                    }
                                  />
                                )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500">No fields added under this farm yet.</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Pending Tasks */}
            <Card className="space-y-3.5 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare size={17} className="text-[#2F7D4F]" />
                  <h3 className="font-bold text-stone-900 text-sm">{t('upcoming_tasks', 'Upcoming Tasks')}</h3>
                </div>
                <Link href="/tasks" className="text-xs font-bold text-[#2F7D4F] hover:underline">
                  {t('manage', 'Manage')}
                </Link>
              </div>

              {!summary?.tasks || summary.tasks.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4">{t('no_pending_tasks', "No pending tasks. You're all caught up!")}</p>
              ) : (
                <div className="space-y-2">
                  {
                    summary.tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="p-3 bg-[#F7F8F5] border border-stone-200/70 rounded-xl flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">{task.title}</p>
                          <p className="text-[10px] text-stone-500">{task.farm?.name}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded uppercase shrink-0">
                          {task.priority}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* In-Situ Hardware / Soil Moisture Card */}
            {sensorTelemetry?.latestReading ? (
              <Card className="space-y-3 rounded-2xl p-5 border border-cyan-200/80 bg-gradient-to-br from-white to-cyan-50/25">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets size={17} className="text-cyan-700" />
                    <h3 className="font-bold text-stone-900 text-sm">Soil Moisture Telemetry</h3>
                  </div>
                  <Link href="/soil-moisture" className="text-xs font-bold text-cyan-800 hover:underline">
                    Details →
                  </Link>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-cyan-100 shadow-xs">
                  <div>
                    <span className="text-[11px] text-stone-500 block truncate max-w-[130px]">
                      {sensorTelemetry.fieldName} ({sensorTelemetry.cropName || 'Field'})
                    </span>
                    <span className="text-2xl font-black text-cyan-900">
                      {sensorTelemetry.latestReading.moisturePct.toFixed(1)}%
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sensorTelemetry.latestReading.category?.badgeClass || 'bg-cyan-50 border-cyan-300 text-cyan-900'}`}
                  >
                    {sensorTelemetry.latestReading.moisturePct < (sensorTelemetry.thresholds?.low || 30) ? 'Dry / Irrigate' : 'Optimal'}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] pt-1 border-t border-stone-100 text-stone-600">
                  <div className="flex justify-between items-center">
                    <span>Device:</span>
                    <span className="font-bold text-stone-800 flex items-center gap-1.5">
                      {sensorTelemetry.device?.deviceCode || 'Arduino UNO-001'}
                      {sensorTelemetry.device?.lastSeenAt &&
                        Date.now() - new Date(sensorTelemetry.device.lastSeenAt).getTime() < 60000 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">Offline</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Irrigation Advice:</span>
                    <strong className={sensorTelemetry.latestReading.moisturePct < (sensorTelemetry.thresholds?.low || 30) ? 'text-rose-700' : 'text-emerald-700'}>
                      {sensorTelemetry.latestReading.moisturePct < (sensorTelemetry.thresholds?.low || 30)
                        ? 'Irrigation Recommended'
                        : 'Monitor Soil (Adequate)'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pump Control:</span>
                    <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                      NOT CONNECTED (Safety Lock)
                    </span>
                  </div>
                </div>
              </Card>
            ) : soilMoisture ? (
              <Card className="space-y-3 rounded-2xl p-5 border border-cyan-200/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets size={17} className="text-cyan-700" />
                    <h3 className="font-bold text-stone-900 text-sm">Soil Moisture</h3>
                  </div>
                  <Link href="/soil-moisture" className="text-xs font-bold text-cyan-800 hover:underline">
                    Details →
                  </Link>
                </div>
                <div className="flex items-center justify-between bg-cyan-50/50 p-3 rounded-xl border border-cyan-100">
                  <div>
                    <span className="text-[11px] text-stone-500 block">{soilMoisture.district}</span>
                    <span className="text-xl font-black text-cyan-900">{soilMoisture.normalizedPercentage}%</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${soilMoisture.category?.badgeClass}`}>
                    {soilMoisture.category?.label?.split('/')[0] || 'Optimal'}
                  </span>
                </div>
              </Card>
            ) : null}

            {/* Fertilizer Store & Orders Shortcut */}
            <Card className="space-y-3 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-stone-900">
                <Package size={17} className="text-amber-600" />
                <h3 className="font-bold text-sm">Fertilizer Store &amp; Orders</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/store"
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center transition-colors"
                >
                  Open Store
                </Link>
                <Link
                  href="/orders"
                  className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold text-center transition-colors"
                >
                  My Orders
                </Link>
              </div>
              {recentOrders.length > 0 && (
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Order #{recentOrders[0].orderNumber}</span>
                  <Link href={`/orders/${recentOrders[0].id}`} className="font-bold text-[#2F7D4F] hover:underline">
                    Track →
                  </Link>
                </div>
              )}
            </Card>

            {/* Dynamic AI Assistant Card */}
            <Card className="bg-gradient-to-br from-[#0F2D1F] to-[#24663F] text-white space-y-3 rounded-2xl p-5 border-none shadow-md">
              <div className="flex items-center gap-2">
                <Bot size={19} className="text-emerald-300" />
                <h3 className="font-bold text-sm">AI Farming Assistant</h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                {activeCropName && weather?.current
                  ? `Your ${activeCropName} crop is active with ${weather.current.temperatureC}°C and ${weather.current.rainProbabilityPct}% rain chance today. Ask for personalized stage advice.`
                  : 'Ask questions about your fields, fertilizers, irrigation timing, or mandi trends in English, Hindi, or Gujarati.'}
              </p>
              <Link
                href="/assistant"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-xl transition-colors"
              >
                <ShieldCheck size={14} className="text-emerald-300" /> Ask AI Assistant →
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </DataState>
  );
}
