'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CloudSun, Wind, Droplets, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { useI18n } from '@/providers/I18nProvider';

export default function WeatherPage() {
  const { t } = useI18n();
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      fetch('/api/v1/farms')
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json) => {
          const list = Array.isArray(json?.data) ? json.data : [];
          setFarms(list);
          if (list.length > 0) setSelectedFarmId(list[0].id);
        })
        .catch(() => { });
    }, []);

    const fetchWeather = useCallback(async (farmId?: string) => {
      setLoading(true);
      setError(null);
      try {
          const qs = farmId ? `?farm_id=${encodeURIComponent(farmId)}` : '';
          const [weaRes, advRes] = await Promise.all([
            fetch(`/api/v1/weather${qs}`),
            fetch(`/api/v1/advisories${qs}`),
          ]);
          if (!weaRes.ok) {
            throw new Error(`Weather service responded with status ${weaRes.status}`);
          }
          const weaJson = await weaRes.json();
          setWeatherData(weaJson.data);

          if (advRes.ok) {
            const advJson = await advRes.json();
            setAdvisories(Array.isArray(advJson?.data) ? advJson.data : []);
          }
        } catch (err: any) {
          setError(err.message || 'Unable to load weather forecast');
        } finally {
          setLoading(false);
        }
    }, []);

    useEffect(() => {
    fetchWeather(selectedFarmId || undefined);
  }, [selectedFarmId, fetchWeather]);

  const current = weatherData?.current;
  const forecast = weatherData?.forecast || [];

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error || undefined}
      errorTitle="Weather Service Unavailable"
      onRetry={() => fetchWeather(selectedFarmId || undefined)}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">
              {t('weather', 'Weather & Forecast')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 flex items-center gap-1">
              <MapPin size={13} className="text-[#2F7D4F]" />
              {weatherData?.locationLabel || 'Local Farm Weather'} • Spray & Irrigation Conditions
            </p>
          </div>
            <div className="flex items-center gap-2 flex-wrap">
              {farms.length > 0 && (
                <select
                  aria-label="Select farm for weather"
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-800"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
              <ProvenanceChip
                type={current?.isDemo ? 'simulated' : 'forecast'}
                label={current?.isDemo ? 'SIMULATED WEATHER' : 'Open-Meteo Forecast'}
                timestamp={current?.updatedAt || current?.time}
                source="Open-Meteo Meteorological Service"
              />
            </div>
          </div>

          {/* Spray & Weather Advisories */}
          {advisories.length > 0 ? (
            <div className="space-y-2.5">
              {advisories.map((adv, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-2xl text-amber-950 flex items-start gap-3 shadow-xs"
                >
                  <AlertTriangle size={19} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-sm">{adv.advice?.title || 'Field Advisory'}</p>
                    <p className="text-amber-900 leading-relaxed">{adv.advice?.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 flex items-center gap-3 text-xs font-semibold">
              <CheckCircle2 size={18} className="text-[#2F7D4F] shrink-0" />
              <span>Good field weather today — safe window for normal spraying and irrigation activities.</span>
            </div>
          )}

          {/* Current Weather Card */}
          {current && (
              <Card className="bg-gradient-to-br from-[#143D2A] to-[#25663f] text-white p-7 rounded-3xl shadow-lg space-y-6 border-none">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">
                      Current Conditions
                    </span>
                    <h2 className="text-4xl font-extrabold mt-1">{current.temperatureC}°C</h2>
                    <p className="text-sm text-emerald-100 mt-0.5">{current.condition}</p>
                  </div>
                  <CloudSun size={60} className="text-emerald-300 opacity-90" />
                </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-800/70 text-center text-xs">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur">
                      <Droplets size={18} className="mx-auto text-sky-300 mb-1" />
                      <span className="text-emerald-200 block text-[10px]">Humidity</span>
                      <span className="font-bold text-base text-white">{current.humidityPct}%</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur">
                      <Wind size={18} className="mx-auto text-emerald-300 mb-1" />
                      <span className="text-emerald-200 block text-[10px]">Wind Speed</span>
                      <span className="font-bold text-base text-white">{current.windSpeedKmh} km/h</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur">
                      <CloudSun size={18} className="mx-auto text-amber-300 mb-1" />
                      <span className="text-emerald-200 block text-[10px]">Rain Chance</span>
                      <span className="font-bold text-base text-white">{current.rainProbabilityPct}%</span>
                    </div>
                  </div>
              </Card>
        )}

              {/* 7-Day Forecast */}
              <div className="space-y-3">
                <h3 className="font-bold text-stone-900 text-base">7-Day Local Forecast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {forecast.map((day: any, idx: number) => (
                      <Card key={idx} className="p-3.5 rounded-2xl text-center space-y-2">
                        <p className="text-xs font-bold text-stone-800">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-[11px] text-stone-500">{day.date}</p>
                        <div className="py-1">
                          <p className="text-sm font-extrabold text-stone-900">{day.tempMaxC}°C</p>
                          <p className="text-[10px] text-stone-500">{day.tempMinC}°C Low</p>
                        </div>
                        <span className="inline-block px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded">
                          {day.rainProbabilityPct}% Rain
                        </span>
                      </Card>
            ))}
                    </div>
        </div>
              </div>
            </DataState>
          );
}
