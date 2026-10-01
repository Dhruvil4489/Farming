'use client';

import React, { useEffect, useState } from 'react';
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
  Droplet,
  ShieldCheck,
} from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { CropStageBar } from '@/components/domain/CropStageBar';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [advisories, setAdvisories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, weaRes, advRes] = await Promise.all([
        fetch('/api/v1/dashboard/summary'),
        fetch('/api/v1/weather'),
        fetch('/api/v1/advisories'),
      ]);

      if (!sumRes.ok) throw new Error('Failed to load dashboard summary');

      const sumData = await sumRes.json();
      const weaData = await weaRes.json();
      const advData = await advRes.json();

      setSummary(sumData.data);
      setWeather(weaData.data);
      setAdvisories(advData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error}
      onRetry={fetchDashboardData}
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">
              Good day, {summary?.userName || 'Farmer'}! 👋
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              Your farm overview • {summary?.counts?.farms || 0} Farms • {summary?.counts?.fields || 0} Fields • {summary?.counts?.activeCycles || 0} Active Crops
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/farms/new">
              <Button size="sm" variant="outline">
                <Plus size={14} className="mr-1" /> Add Farm
              </Button>
            </Link>
            <Link href="/crops/new-cycle">
              <Button size="sm">
                <Plus size={14} className="mr-1" /> Start Crop Cycle
              </Button>
            </Link>
          </div>
        </div>

        {/* Weather Advisories Alert Banner */}
        {advisories.length > 0 && (
          <div className="space-y-2">
            {advisories.map((adv, idx) => (
              <div
                key={idx}
                className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl text-amber-950 flex items-start gap-3 shadow-xs"
              >
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{adv.advice.title}</span>
                    <ProvenanceChip type={weather?.current?.isDemo ? 'demo' : 'weather_service'} />
                  </div>
                  <p className="text-amber-900 leading-relaxed">{adv.advice.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-[#2F7D4F] rounded-xl flex items-center justify-center shrink-0">
              <Tractor size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">My Farms</p>
              <p className="text-2xl font-extrabold text-[#143D2A]">{summary?.counts?.farms || 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <Grid size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Fields</p>
              <p className="text-2xl font-extrabold text-[#143D2A]">{summary?.counts?.fields || 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center shrink-0">
              <Sprout size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Crops</p>
              <p className="text-2xl font-extrabold text-[#143D2A]">{summary?.counts?.activeCycles || 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <CheckSquare size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Pending Tasks</p>
              <p className="text-2xl font-extrabold text-[#143D2A]">{summary?.counts?.pendingTasks || 0}</p>
            </div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weather Widget */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudSun size={20} className="text-[#2F7D4F]" />
                  <h3 className="font-bold text-stone-900 text-base">Weather & Forecast</h3>
                </div>
                <ProvenanceChip type={weather?.current?.isDemo ? 'demo' : 'weather_service'} />
              </div>

              {weather?.current && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-center">
                  <div>
                    <span className="text-[11px] text-stone-500 font-medium">Temperature</span>
                    <p className="text-xl font-extrabold text-stone-900">{weather.current.temperatureC}°C</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 font-medium">Humidity</span>
                    <p className="text-xl font-extrabold text-stone-900">{weather.current.humidityPct}%</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 font-medium">Wind Speed</span>
                    <p className="text-xl font-extrabold text-stone-900">{weather.current.windSpeedKmh} km/h</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 font-medium">Rain Chance</span>
                    <p className="text-xl font-extrabold text-stone-900">{weather.current.rainProbabilityPct}%</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Farm & Field Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-base">My Farms & Active Crop Stages</h3>
                <Link href="/farms" className="text-xs font-semibold text-[#2F7D4F] hover:underline flex items-center gap-1">
                  View All Farms <ArrowRight size={14} />
                </Link>
              </div>

              {summary?.farms?.length === 0 ? (
                <DataState
                  status="empty"
                  emptyTitle="No farms registered yet"
                  emptyDescription="Add your first farm to start tracking your crops, weather, and tasks."
                  emptyAction={
                    <Link href="/farms/new">
                      <Button size="sm">Add First Farm</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {summary?.farms?.map((farm: any) => (
                    <Card key={farm.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-stone-900 text-base">{farm.name}</h4>
                          <p className="text-xs text-stone-500">
                            {farm.village ? `${farm.village}, ` : ''}{farm.district}, {farm.state} • {farm.areaInputValue} {farm.areaInputUnit}
                          </p>
                        </div>
                        <ProvenanceChip type="user_entered" />
                      </div>

                      {farm.fields?.length > 0 ? (
                        <div className="space-y-3 pt-2">
                          {farm.fields.map((field: any) => (
                            <div key={field.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-stone-800">{field.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
                                  {field.status}
                                </span>
                              </div>
                              {field.cropCycles?.[0] && (
                                <CropStageBar
                                  stages={field.cropCycles[0].stages?.map((st: any) => ({
                                    id: st.id,
                                    name: st.nameSnapshot,
                                    status: st.status,
                                  }))}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 italic">No fields created under this farm yet.</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">
            {/* Today's Tasks */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-[#2F7D4F]" />
                  <h3 className="font-bold text-stone-900 text-base">Today's Tasks</h3>
                </div>
                <Link href="/tasks" className="text-xs font-semibold text-[#2F7D4F] hover:underline">
                  Manage
                </Link>
              </div>

              {summary?.tasks?.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4">No tasks due today. You're all caught up!</p>
              ) : (
                <div className="space-y-2">
                  {summary?.tasks?.map((task: any) => (
                    <div
                      key={task.id}
                      className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-900">{task.title}</p>
                        <p className="text-[10px] text-stone-500">
                          {task.farm?.name} • Priority: <span className="capitalize font-semibold">{task.priority}</span>
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md uppercase">
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* AI Insight Card */}
            <Card className="bg-gradient-to-br from-[#143D2A] to-[#2F7D4F] text-white space-y-3 border-none shadow-md">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-300" />
                <h3 className="font-bold text-sm">Smart AI Insight</h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Based on your cotton stage (Flowering) and current 62% humidity forecast, monitor for bollworm pests during morning inspections.
              </p>
              <Link href="/assistant" className="inline-block">
                <span className="text-xs font-bold text-white underline hover:text-emerald-200">
                  Ask AI Assistant →
                </span>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </DataState>
  );
}
