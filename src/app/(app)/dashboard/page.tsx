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
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  BookOpen,
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
  const [mandiPrices, setMandiPrices] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, weaRes, advRes, mandiRes, orderRes] = await Promise.all([
        fetch('/api/v1/dashboard/summary'),
        fetch('/api/v1/weather'),
        fetch('/api/v1/advisories'),
        fetch('/api/v1/market/prices?state=Gujarat'),
        fetch('/api/v1/store/orders'),
      ]);

      if (!sumRes.ok) throw new Error('Failed to load dashboard summary');

      const sumData = await sumRes.json();
      const weaData = await weaRes.json();
      const advData = await advRes.json();

      setSummary(sumData.data);
      setWeather(weaData.data);
      setAdvisories(advData.data || []);

      if (mandiRes.ok) {
        const mJson = await mandiRes.json();
        setMandiPrices(mJson.data?.slice(0, 3) || []);
      }

      if (orderRes.ok) {
        const oJson = await orderRes.json();
        setRecentOrders(oJson.data?.slice(0, 1) || []);
      }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#0F2D1F] tracking-tight">
                Good day, {summary?.userName || 'Farmer'}! 👋
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Gujarat Region
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Your farm overview • {summary?.counts?.farms || 0} Farms • {summary?.counts?.fields || 0} Fields • {summary?.counts?.activeCycles || 0} Active Crops
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            <Link href="/market">
              <Button size="sm" variant="outline">
                <TrendingUp size={14} className="mr-1" /> Mandi Rates
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
                className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-2xl text-amber-950 flex items-start gap-3 shadow-xs"
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
          <Card className="flex items-center gap-4 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-[#2F7D4F] rounded-xl flex items-center justify-center shrink-0">
              <Tractor size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">My Farms</p>
              <p className="text-2xl font-extrabold text-[#0F2D1F]">{summary?.counts?.farms || 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 rounded-2xl">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <Grid size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Fields</p>
              <p className="text-2xl font-extrabold text-[#0F2D1F]">{summary?.counts?.fields || 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 rounded-2xl">
            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center shrink-0">
              <Sprout size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Crops</p>
              <p className="text-2xl font-extrabold text-[#0F2D1F]">{summary?.counts?.activeCycles || 0}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 rounded-2xl">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <CheckSquare size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Pending Tasks</p>
              <p className="text-2xl font-extrabold text-[#0F2D1F]">{summary?.counts?.pendingTasks || 0}</p>
            </div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Mandi Intelligence Widget */}
            <Card className="space-y-4 rounded-3xl p-6 border border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <TrendingUp size={20} className="text-[#2F7D4F]" />
                  <h3 className="font-bold text-stone-900 text-base">Live APMC Mandi Rates</h3>
                </div>
                <Link href="/market" className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1">
                  All Mandis <ArrowRight size={14} />
                </Link>
              </div>

              {mandiPrices.length === 0 ? (
                <p className="text-xs text-stone-500 italic">Mandi feed is currently refreshing...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mandiPrices.map((item) => {
                    const isUp = item.comparison?.priceChange > 0;
                    const isDown = item.comparison?.priceChange < 0;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2"
                      >
                        <div>
                          <span className="text-xs font-extrabold text-stone-900 block">{item.commodityName}</span>
                          <span className="text-[10px] text-stone-500">{item.marketName}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-[#0F2D1F]">₹{item.modalPrice}</span>
                          <span className="text-[10px] text-stone-400">/{item.unit.replace('₹/', '')}</span>
                        </div>
                        {item.comparison?.previousModalPrice ? (
                          <div className="text-[10px] font-bold">
                            {isUp ? (
                              <span className="text-emerald-700 flex items-center">
                                <TrendingUp size={11} className="mr-0.5" /> +₹{item.comparison.priceChange}
                              </span>
                            ) : isDown ? (
                              <span className="text-rose-600 flex items-center">
                                <TrendingDown size={11} className="mr-0.5" /> -₹{Math.abs(item.comparison.priceChange)}
                              </span>
                            ) : (
                              <span className="text-stone-400">Unchanged</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Weather Widget */}
            <Card className="space-y-4 rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudSun size={20} className="text-[#2F7D4F]" />
                  <h3 className="font-bold text-stone-900 text-base">Weather & Spray Conditions</h3>
                </div>
                <ProvenanceChip type={weather?.current?.isDemo ? 'demo' : 'weather_service'} />
              </div>

              {weather?.current && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
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
                    <Card key={farm.id} className="space-y-3 rounded-3xl p-6">
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
                            <div key={field.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
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
            <Card className="space-y-4 rounded-3xl p-6">
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

            {/* Quick Agri-Input Procurement Shortcuts */}
            <Card className="space-y-3 rounded-3xl p-6 border border-stone-200">
              <div className="flex items-center gap-2 text-stone-900">
                <Package size={18} className="text-amber-600" />
                <h3 className="font-bold text-sm">Fertilizers & Inputs</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Procure certified urea, DAP, micronutrients, or inspect crop stage schedules.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/fertilizers"
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center transition-colors"
                >
                  🛒 Fertilizer Store
                </Link>
                <Link
                  href="/fertilizers/guide"
                  className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold text-center transition-colors"
                >
                  📖 Nutrient Guide
                </Link>
              </div>

              {recentOrders.length > 0 && (
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Order #{recentOrders[0].orderNumber}</span>
                  <Link href={`/orders/${recentOrders[0].id}`} className="font-bold text-[#2F7D4F] hover:underline">
                    Track ({recentOrders[0].status}) →
                  </Link>
                </div>
              )}
            </Card>

            {/* AI Insight Card */}
            <Card className="bg-gradient-to-br from-[#0F2D1F] to-[#2F7D4F] text-white space-y-3 rounded-3xl p-6 border-none shadow-md">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-300" />
                <h3 className="font-bold text-sm">Smart AI Agronomy Insight</h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Based on your cotton stage (Flowering) and current 58% humidity, inspect under-leaves for jassids during morning rounds.
              </p>
              <Link href="/assistant" className="inline-block pt-1">
                <span className="text-xs font-bold text-white underline hover:text-emerald-200 flex items-center gap-1">
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
