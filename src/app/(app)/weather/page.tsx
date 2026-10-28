'use client';

import React, { useEffect, useState } from 'react';
import { CloudSun, Wind, Droplets, Thermometer, ShieldAlert } from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/weather');
      if (!res.ok) {
        throw new Error(`Weather service responded with status ${res.status}`);
      }
      const data = await res.json();
      setWeatherData(data.data);
    } catch (err: any) {
      setError(err.message || 'Unable to load live weather forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const current = weatherData?.current;
  const forecast = weatherData?.forecast || [];

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error || undefined}
      errorTitle="Weather Service Unavailable"
      onRetry={fetchWeather}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Weather Intelligence</h1>
            <p className="text-xs text-stone-600 mt-1">Real-time localized meteorological forecasts</p>
          </div>
          <div className="flex items-center gap-2">
            <ProvenanceChip
              type={current?.isDemo ? 'simulated' : 'forecast'}
              label={current?.isDemo ? 'SIMULATED WEATHER' : 'Open-Meteo Forecast'}
              timestamp={current?.updatedAt || current?.time}
              source="Open-Meteo Meteorological Service"
            />
          </div>
        </div>

        {/* Current Weather Card */}
        {current && (
          <Card className="bg-gradient-to-br from-[#143D2A] to-[#25663f] text-white p-8 rounded-2xl shadow-lg space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Current Conditions</span>
                <h2 className="text-4xl font-extrabold mt-1">{current.temperatureC}°C</h2>
                <p className="text-sm text-emerald-100 mt-0.5">{current.condition}</p>
              </div>
              <CloudSun size={64} className="text-emerald-300 opacity-90" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-800 text-center text-xs">
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
              <Card key={idx} className="p-3 text-center space-y-2">
                <p className="text-xs font-bold text-stone-800">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-xs text-stone-500">{day.date}</p>
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
