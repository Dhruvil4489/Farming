'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  MapPin,
  ShieldCheck,
  Info,
  X,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';

export default function MarketPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<{ district: string; state: string }[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);

  const [selectedState, setSelectedState] = useState('Gujarat');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item for Detailed Modal & Historical Chart
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRange, setHistoryRange] = useState<7 | 30>(7);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch('/api/v1/market/filters');
        if (res.ok) {
          const json = await res.json();
          setStates(json.data.states || []);
          setDistricts(json.data.districts || []);
          setMarkets(json.data.markets || []);
          setCommodities(json.data.commodities || []);
        }
      } catch (e) {
        console.error('Error fetching market filters:', e);
      }
    };
    fetchFilters();
  }, []);

  // Fetch prices with comparison
  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (selectedMarket) params.append('market', selectedMarket);
      if (selectedCrop) params.append('commodity', selectedCrop);

      const res = await fetch(`/api/v1/market/prices?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load mandi price records');
      const json = await res.json();

      setPrices(json.data || []);
      setPublicationDate(json.meta?.date || '');
      setTotalRecords(json.meta?.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [selectedState, selectedDistrict, selectedMarket, selectedCrop]);

  // Load history when modal opens or range changes
  useEffect(() => {
    if (!activeItem) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(
          `/api/v1/market/history?commodityId=${activeItem.commodityId}&locationId=${activeItem.locationId}&days=${historyRange}`
        );
        if (res.ok) {
          const json = await res.json();
          setHistoryData(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [activeItem, historyRange]);

  const resetFilters = () => {
    setSelectedState('Gujarat');
    setSelectedDistrict('');
    setSelectedMarket('');
    setSelectedCrop('');
    setSearchQuery('');
  };

  const filteredPrices = prices.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.commodityName.toLowerCase().includes(q) ||
      (item.variety && item.variety.toLowerCase().includes(q)) ||
      item.marketName.toLowerCase().includes(q) ||
      item.district.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />

      {/* Hero Header */}
      <div className="bg-[#0F2D1F] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
            <ShieldCheck size={14} /> Official AGMARKNET / data.gov.in Feed
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            India Crop Market Intelligence
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
            Explore daily government-published mandi prices across Gujarat and India. Compare latest modal rates against previous trading days to discover peak trading windows.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Filter Controls Bar */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crop, variety or market..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-stone-500">
                Latest publication: <strong className="text-stone-800">{publicationDate || 'Today'}</strong>
              </span>
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Dropdown Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* State */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('');
                  setSelectedMarket('');
                }}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">All States</option>
                {states.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedMarket('');
                }}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">All Districts</option>
                {districts
                  .filter((d) => !selectedState || d.state === selectedState)
                  .map((d) => (
                    <option key={d.district} value={d.district}>{d.district}</option>
                  ))}
              </select>
            </div>

            {/* Mandi / Market */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Mandi / Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">All Mandis</option>
                {markets
                  .filter((m) => (!selectedState || m.state === selectedState) && (!selectedDistrict || m.district === selectedDistrict))
                  .map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
              </select>
            </div>

            {/* Commodity */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Crop / Commodity</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">All Commodities</option>
                {commodities.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw size={28} className="mx-auto text-emerald-600 animate-spin" />
              <p className="text-xs text-stone-500">Querying verified mandi observations from database...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 space-y-2">
              <p className="font-bold text-sm">Failed to retrieve market records</p>
              <p className="text-xs text-stone-500">{error}</p>
              <button
                onClick={fetchPrices}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold mt-2"
              >
                Retry Query
              </button>
            </div>
          ) : filteredPrices.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="font-bold text-stone-800 text-sm">No price records found for this combination</p>
              <p className="text-xs text-stone-500">Try choosing "All States" or clearing specific district filters.</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold mt-2 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-6">Commodity & Variety</th>
                    <th className="py-4 px-6">Mandi Location</th>
                    <th className="py-4 px-6 text-right">Min Price</th>
                    <th className="py-4 px-6 text-right">Max Price</th>
                    <th className="py-4 px-6 text-right">Modal Rate</th>
                    <th className="py-4 px-6 text-right">vs Previous Trading Day</th>
                    <th className="py-4 px-6 text-center">Date</th>
                    <th className="py-4 px-6 text-center">Trend & Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredPrices.map((row) => {
                    const isUp = row.comparison?.priceChange > 0;
                    const isDown = row.comparison?.priceChange < 0;

                    return (
                      <tr key={row.id} className="hover:bg-emerald-50/40 transition-colors group">
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-stone-900 text-sm">{row.commodityName}</span>
                          <p className="text-[11px] text-stone-500">{row.variety || 'Standard Grade'}</p>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-bold text-stone-800">{row.marketName}</span>
                          <p className="text-[11px] text-stone-500">{row.district}, {row.state}</p>
                        </td>

                        <td className="py-4 px-6 text-right text-stone-600">
                          ₹{row.minPrice.toLocaleString()}
                        </td>

                        <td className="py-4 px-6 text-right text-stone-600">
                          ₹{row.maxPrice.toLocaleString()}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <span className="text-base font-black text-[#0F2D1F]">
                            ₹{row.modalPrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-stone-500 block">{row.unit}</span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          {row.comparison?.previousModalPrice ? (
                            <div className="space-y-0.5">
                              {isUp ? (
                                <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                                  <TrendingUp size={12} className="mr-1" /> +₹{row.comparison.priceChange} ({row.comparison.percentageChange}%)
                                </span>
                              ) : isDown ? (
                                <span className="inline-flex items-center text-rose-600 font-bold bg-rose-100/70 px-2 py-0.5 rounded">
                                  <TrendingDown size={12} className="mr-1" /> -₹{Math.abs(row.comparison.priceChange)} ({row.comparison.percentageChange}%)
                                </span>
                              ) : (
                                <span className="text-stone-500 text-[11px]">Unchanged</span>
                              )}
                              <p className="text-[10px] text-stone-400">
                                was ₹{row.comparison.previousModalPrice} on {row.comparison.previousPriceDate}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">Previous price unavailable</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center text-stone-500 whitespace-nowrap">
                          {row.priceDate}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setActiveItem(row)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#2F7D4F] hover:text-white font-bold text-[11px] text-stone-700 transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <BarChart3 size={13} /> View Trend
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL WITH HISTORICAL CHART & EXACT SOURCE METADATA */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {activeItem.state} APMC
                </span>
                <h3 className="text-2xl font-extrabold text-[#0F2D1F] mt-1">
                  {activeItem.commodityName} ({activeItem.variety || 'Common'})
                </h3>
                <p className="text-xs text-stone-500">
                  {activeItem.marketName} • {activeItem.district}, {activeItem.state}
                </p>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Metrics Snapshot */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100 text-center">
              <div>
                <span className="text-[11px] text-stone-500 font-semibold">Min Price</span>
                <p className="text-lg font-bold text-stone-800">₹{activeItem.minPrice.toLocaleString()}</p>
              </div>
              <div className="border-x border-stone-200">
                <span className="text-[11px] text-emerald-800 font-bold">Modal Price</span>
                <p className="text-2xl font-black text-[#0F2D1F]">₹{activeItem.modalPrice.toLocaleString()}</p>
                <span className="text-[10px] text-stone-500">{activeItem.unit}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 font-semibold">Max Price</span>
                <p className="text-lg font-bold text-stone-800">₹{activeItem.maxPrice.toLocaleString()}</p>
              </div>
            </div>

            {/* Historical Price Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <BarChart3 size={16} className="text-[#2F7D4F]" /> Historical Modal Price Trend
                </h4>
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setHistoryRange(7)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      historyRange === 7 ? 'bg-white text-[#2F7D4F] shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setHistoryRange(30)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      historyRange === 30 ? 'bg-white text-[#2F7D4F] shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    30 Days
                  </button>
                </div>
              </div>

              {historyLoading ? (
                <div className="h-44 bg-stone-50 rounded-2xl flex items-center justify-center text-xs text-stone-400">
                  Loading trend points...
                </div>
              ) : historyData.length === 0 ? (
                <div className="h-44 bg-stone-50 rounded-2xl flex items-center justify-center text-xs text-stone-400 italic">
                  Historical series unavailable for this mandi yet.
                </div>
              ) : (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-3">
                  {/* SVG Trend Line */}
                  <div className="relative h-28 w-full flex items-end justify-between gap-1 pt-4">
                    {historyData.map((pt, idx) => {
                      const maxModal = Math.max(...historyData.map((d) => d.modalPrice));
                      const minModal = Math.min(...historyData.map((d) => d.modalPrice));
                      const range = maxModal - minModal || 1;
                      const heightPercent = Math.max(15, ((pt.modalPrice - minModal) / range) * 85);

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-stone-700 bg-white px-1 rounded shadow-xs">
                            ₹{pt.modalPrice}
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[20px] rounded-t-md bg-[#2F7D4F] group-hover:bg-[#143D2A] transition-colors"
                          />
                          <span className="text-[9px] text-stone-400 truncate max-w-[28px]">
                            {pt.date.split('-').slice(1).join('/')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Provenance and Data Source Audit */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1.5 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Info size={14} /> Official Data Source & Provenance
              </div>
              <p className="text-[11px] leading-relaxed">
                Published by: <strong>{activeItem.source}</strong>. Recorded on trading date: <strong>{activeItem.priceDate}</strong>.
              </p>
              <p className="text-[10px] text-stone-500 italic">
                Units reported strictly as per market board standards (1 Quintal = 100 Kilograms). Modal rates represent the most frequently occurring wholesale transaction value of the trading session.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
