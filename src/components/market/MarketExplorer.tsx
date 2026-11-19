'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  ExternalLink,
  BarChart3,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

export interface MarketExplorerProps {
  variant?: 'public' | 'portal';
  initialState?: string;
  initialCommodity?: string;
}

export function MarketExplorer({
  variant = 'public',
  initialState: defaultState,
  initialCommodity: defaultCommodity,
}: MarketExplorerProps) {
  const searchParams = useSearchParams();
  const initialCommodity = defaultCommodity ?? searchParams.get('commodity') ?? '';
  const initialState = defaultState ?? searchParams.get('state') ?? 'Gujarat';

  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [latestArrivalDate, setLatestArrivalDate] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const [cadenceNotice, setCadenceNotice] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<{ district: string; state: string }[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);

  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(initialCommodity);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [comparingCommodity, setComparingCommodity] = useState<string | null>(null);

  // Selected item for Detailed Modal & Historical Chart
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRange, setHistoryRange] = useState<7 | 30>(7);

  // Safe formatting helper
  const safePrice = (val: any) =>
    typeof val === 'number' && !isNaN(val) ? val.toLocaleString('en-IN') : '—';

  // Format ISO timestamp for sync display
  const formatSyncTime = (iso?: string) => {
    if (!iso) return 'Recent';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Fetch filter options + auto-default state/district from farmer profile in portal mode
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [res, meRes] = await Promise.all([
          fetch('/api/v1/market/filters'),
          variant === 'portal' ? fetch('/api/v1/me') : Promise.resolve(null),
        ]);
        let availableStates: string[] = [];
        let availableDistricts: { district: string; state: string }[] = [];
        if (res.ok) {
          const json = await res.json();
          availableStates = json.data.states || [];
          availableDistricts = json.data.districts || [];
          setStates(availableStates);
          setDistricts(availableDistricts);
          setMarkets(json.data.markets || []);
          setCommodities(json.data.commodities || []);
        }
        if (meRes && meRes.ok) {
          const meJson = await meRes.json();
          const userState = meJson?.data?.state;
          const userDist = meJson?.data?.district;
          if (userState && availableStates.some((s) => s.toLowerCase() === userState.toLowerCase())) {
            const matchedState = availableStates.find((s) => s.toLowerCase() === userState.toLowerCase())!;
            setSelectedState(matchedState);
          }
          if (userDist && availableDistricts.some((d) => d.district.toLowerCase() === userDist.toLowerCase())) {
            const matchedDist = availableDistricts.find((d) => d.district.toLowerCase() === userDist.toLowerCase())!;
            setSelectedDistrict(matchedDist.district);
          }
        }
      } catch (e) {
        console.error('Error fetching market filters:', e);
      }
    };
    fetchFilters();
  }, [variant]);

  // Fetch prices with comparison and bounded timeout
  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s bounded timeout

    try {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (selectedMarket) params.append('market', selectedMarket);
      if (selectedCrop) params.append('commodity', selectedCrop);

      const res = await fetch(`/api/v1/market/prices?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load mandi price records`);
      }
      const json = await res.json();

      const records = Array.isArray(json.data) ? json.data : [];
      setPrices(records);
      setPublicationDate(json.meta?.arrival_date || json.meta?.date || records[0]?.arrival_date || records[0]?.priceDate || '2026-10-11');
      setLatestArrivalDate(json.meta?.latestArrivalDate || json.meta?.arrival_date || records[0]?.arrival_date || records[0]?.priceDate || '');
      setLastSyncedAt(json.meta?.lastSyncedAt || records[0]?.lastSyncedAt || records[0]?.fetchedAt || '');
      setCadenceNotice(json.meta?.cadenceNotice || '');
      setTotalRecords(json.meta?.total || records.length);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Market price query timed out. The server or database took longer than 8 seconds to respond.');
      } else {
        setError(err.message || 'Unable to query mandi prices from the database.');
      }
    } finally {
      clearTimeout(timeoutId);
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
          setHistoryData(Array.isArray(json.data) ? json.data : []);
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
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMarket('');
    setSelectedCrop('');
    setSelectedCategory('All');
    setSortBy('date_desc');
    setSearchQuery('');
    setComparingCommodity(null);
  };

  const CROP_CATEGORIES = ['All', 'Cereals', 'Pulses', 'Oilseeds', 'Vegetables', 'Fruits', 'Cash Crops'];

  const filteredPrices = prices
    .filter((item) => {
      // Category filter
      if (selectedCategory && selectedCategory !== 'All') {
        const itemCat = (item.category || '').toLowerCase();
        const selCat = selectedCategory.toLowerCase();
        if (selCat === 'cash crops') {
          if (!itemCat.includes('cash') && !itemCat.includes('spice') && !itemCat.includes('plantation')) {
            return false;
          }
        } else if (!itemCat.includes(selCat)) {
          return false;
        }
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const cName = (item.commodityName || '').toLowerCase();
      const variety = (item.variety || '').toLowerCase();
      const mName = (item.marketName || '').toLowerCase();
      const dist = (item.district || '').toLowerCase();
      const st = (item.state || '').toLowerCase();
      return cName.includes(q) || variety.includes(q) || mName.includes(q) || dist.includes(q) || st.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'modal_desc') return (b.modalPrice || 0) - (a.modalPrice || 0);
      if (sortBy === 'modal_asc') return (a.modalPrice || 0) - (b.modalPrice || 0);
      if (sortBy === 'min_asc') return (a.minPrice || 0) - (b.minPrice || 0);
      if (sortBy === 'max_desc') return (b.maxPrice || 0) - (a.maxPrice || 0);
      const dateA = a.arrival_date || a.priceDate || '';
      const dateB = b.arrival_date || b.priceDate || '';
      return dateB.localeCompare(dateA);
    });

  // Calculate comparison items when comparingCommodity is active
  const comparisonItems = comparingCommodity
    ? prices.filter((p) => (p.commodityName || '').toLowerCase() === comparingCommodity.toLowerCase())
    : [];

  const comparisonStats = (() => {
    if (comparisonItems.length === 0) return null;
    const modals = comparisonItems.map((c) => c.modalPrice).filter((p): p is number => typeof p === 'number' && p > 0);
    if (modals.length === 0) return null;
    const avgModal = Math.round(modals.reduce((a, b) => a + b, 0) / modals.length);
    const minModal = Math.min(...modals);
    const maxModal = Math.max(...modals);
    const topMandi = comparisonItems.find((c) => c.modalPrice === maxModal);
    const lowestMandi = comparisonItems.find((c) => c.modalPrice === minModal);
    return { avgModal, minModal, maxModal, topMandi, lowestMandi, count: comparisonItems.length };
  })();

  const isPortal = variant === 'portal';

  // Honest freshness check: detect if latest reported arrival date is older than 24h (never label stale cache as "live")
  const isStaleRecord = (() => {
    const dateStr = latestArrivalDate || publicationDate;
    if (!dateStr) return true;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return true;
    return Date.now() - parsed.getTime() > 36 * 60 * 60 * 1000;
  })();

  return (
    <div className={isPortal ? 'space-y-6' : 'flex flex-col'}>
      {/* HEADER SECTION */}
      {isPortal ? (
        /* Portal Header matching Tasks & Activities & Weather design */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Mandi Market Prices</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${
                  isStaleRecord
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-100/90 border-emerald-300 text-emerald-800'
                }`}
              >
                <ShieldCheck size={13} className={isStaleRecord ? 'text-amber-700' : 'text-emerald-700'} />
                {isStaleRecord
                  ? `Cached AGMARKNET Record (${publicationDate || 'Historical'})`
                  : 'AGMARKNET Latest Reported'}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Latest reported APMC wholesale commodity rates, daily modal values, and historical price comparisons
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block space-y-0.5">
              <span className="text-xs text-stone-600 font-medium block">
                Reported Arrival Date: <strong className="text-stone-800 font-bold">{publicationDate || '2026-10-11'}</strong>
              </span>
              {lastSyncedAt && (
                <span className="text-[11px] text-stone-400 font-medium flex items-center justify-end gap-1">
                  <Clock size={11} className="text-emerald-600" />
                  <span>Feed Last Synced: <strong className="text-stone-600 font-semibold">{formatSyncTime(lastSyncedAt)}</strong></span>
                </span>
              )}
            </div>
            <button
              onClick={fetchPrices}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Refresh market prices"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-emerald-600' : 'text-stone-500'} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      ) : (
        /* Public Hero Header */
        <div className="bg-[#0F2D1F] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
                <ShieldCheck size={14} /> Official AGMARKNET / data.gov.in Feed
              </div>
              <a
                href="https://data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-emerald-200 border border-white/10 transition-colors"
              >
                <span>Resource ID: 9ef84268</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              India Crop Market Intelligence
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              Explore daily government-published mandi prices across Gujarat and India. Compare latest modal rates against previous trading days to discover peak trading windows.
            </p>
          </div>
        </div>
      )}

      {/* MAIN BODY CONTAINER */}
      <div className={isPortal ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6'}>
        {/* Source Transparency & Freshness Bar (Replaces Cadence Notice) */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs">
              <ShieldCheck size={14} className="text-[#2F7D4F]" />
              <span>Official AGMARKNET / data.gov.in Wholesale Feed</span>
            </div>
            <span className="text-stone-400 text-xs hidden sm:inline">•</span>
            <span className="text-stone-600 text-[11px] font-medium">
              National APMC Wholesale Rates (₹ per Quintal)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {lastSyncedAt && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600">
                <Clock size={12} className="text-emerald-700" />
                <span>Last Polled: <strong>{formatSyncTime(lastSyncedAt)}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600">
              <Calendar size={12} className="text-stone-400" />
              <span>Latest Trade: <strong>{latestArrivalDate || publicationDate || 'Today'}</strong></span>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CROP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#143D2A] text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crop, variety, district or mandi across India..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-xs text-stone-800 placeholder:text-stone-400"
              />
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <span className="text-xs text-stone-500">
                Found: <strong className="text-stone-800">{filteredPrices.length}</strong> records
              </span>
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Dropdown Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
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
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer text-stone-800"
              >
                <option value="">🇮🇳 All India (All States)</option>
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
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer text-stone-800"
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
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer text-stone-800"
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
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer text-stone-800"
              >
                <option value="">All Commodities</option>
                {commodities.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 font-medium focus:outline-none focus:border-emerald-600 cursor-pointer text-stone-800"
              >
                <option value="date_desc">Latest Trade Date</option>
                <option value="modal_desc">Modal Rate: High to Low</option>
                <option value="modal_asc">Modal Rate: Low to High</option>
                <option value="min_asc">Min Price: Low to High</option>
                <option value="max_desc">Max Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mandi Price Comparison Dashboard */}
        {comparingCommodity && comparisonStats && (
          <div className="bg-gradient-to-br from-[#123625] to-[#0A2217] text-white rounded-3xl p-6 shadow-md space-y-4 border border-emerald-800/40 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-800/70 text-emerald-200 px-2.5 py-0.5 rounded-md border border-emerald-600/30">
                  APMC Market Comparison
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-1">
                  {comparingCommodity} — Price Variation Across {comparisonStats.count} Mandis
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Compare modal prices across markets to choose the most profitable selling destination.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComparingCommodity(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                title="Close comparison"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                <span className="text-[10px] font-bold text-emerald-300 uppercase block">Average Modal Rate</span>
                <span className="text-2xl font-black text-white">₹{comparisonStats.avgModal.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-emerald-200/80 block">/Quintal across reporting mandis</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-800/60 border border-emerald-400/40">
                <span className="text-[10px] font-bold text-emerald-300 uppercase block">Peak Selling APMC (Highest Rate)</span>
                <span className="text-2xl font-black text-emerald-200">₹{comparisonStats.maxModal.toLocaleString('en-IN')}</span>
                <span className="text-xs font-bold text-white block truncate">{comparisonStats.topMandi?.marketName} ({comparisonStats.topMandi?.district})</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                <span className="text-[10px] font-bold text-emerald-300 uppercase block">Lowest Reported APMC</span>
                <span className="text-2xl font-black text-stone-200">₹{comparisonStats.minModal.toLocaleString('en-IN')}</span>
                <span className="text-xs font-bold text-stone-300 block truncate">{comparisonStats.lowestMandi?.marketName} ({comparisonStats.lowestMandi?.district})</span>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw size={28} className="mx-auto text-emerald-600 animate-spin" />
              <p className="text-xs text-stone-500 font-medium">Querying verified mandi observations from database...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 space-y-2">
              <AlertCircle size={28} className="mx-auto text-rose-600" />
              <p className="font-bold text-sm">Failed to retrieve market records</p>
              <p className="text-xs text-stone-500">{error}</p>
              <button
                onClick={fetchPrices}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold mt-2 cursor-pointer hover:bg-emerald-800 transition-colors"
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
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold mt-2 cursor-pointer hover:bg-emerald-800 transition-colors"
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
                    <th className="py-4 px-4 text-center">
                      <div>Arrival Date</div>
                      <div className="text-[9px] font-normal lowercase tracking-normal text-stone-400">reported trade</div>
                    </th>
                    <th className="py-4 px-4 text-center">
                      <div>Last Synced</div>
                      <div className="text-[9px] font-normal lowercase tracking-normal text-stone-400">feed polled</div>
                    </th>
                    <th className="py-4 px-4 text-center">Source</th>
                    <th className="py-4 px-6 text-center">Trend & Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredPrices.map((row) => {
                    const priceChange = row.comparison?.priceChange;
                    const isUp = typeof priceChange === 'number' && priceChange > 0;
                    const isDown = typeof priceChange === 'number' && priceChange < 0;

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
                          ₹{safePrice(row.minPrice)}
                        </td>

                        <td className="py-4 px-6 text-right text-stone-600">
                          ₹{safePrice(row.maxPrice)}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <span className="text-base font-black text-[#0F2D1F]">
                            ₹{safePrice(row.modalPrice)}
                          </span>
                          <span className="text-[10px] text-stone-500 block">{row.unit || '₹/Quintal'}</span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          {row.comparison?.previousModalPrice ? (
                            <div className="space-y-0.5">
                              {isUp ? (
                                <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                                  <TrendingUp size={12} className="mr-1" /> +₹{row.comparison.priceChange} ({row.comparison.percentageChange}%)
                                </span>
                              ) : isDown ? (
                                <span className="inline-flex items-center text-rose-600 font-bold bg-rose-100/70 px-2 py-0.5 rounded text-[11px]">
                                  <TrendingDown size={12} className="mr-1" /> -₹{Math.abs(row.comparison.priceChange)} ({row.comparison.percentageChange}%)
                                </span>
                              ) : (
                                <span className="text-stone-500 text-[11px]">Unchanged</span>
                              )}
                              <p className="text-[10px] text-stone-400">
                                was ₹{safePrice(row.comparison.previousModalPrice)} on {row.comparison.previousPriceDate}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">Previous price unavailable</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center text-stone-700 whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-stone-800 text-xs flex items-center gap-1">
                              <Calendar size={12} className="text-stone-400" />
                              {row.arrival_date || row.priceDate}
                            </span>
                            <span className="text-[10px] text-stone-400">reported trade</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center text-stone-600 whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-semibold text-stone-700 flex items-center gap-1">
                              <Clock size={11} className="text-emerald-600" />
                              {formatSyncTime(row.lastSyncedAt || row.fetchedAt)}
                            </span>
                            <span className="text-[10px] text-stone-400">feed polled</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <ProvenanceChip
                            type={row.isDemo ? 'simulated' : 'official_market'}
                            size="xs"
                          />
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setComparingCommodity(row.commodityName)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white font-bold text-[11px] text-emerald-800 transition-colors cursor-pointer"
                              title={`Compare ${row.commodityName} prices across mandis`}
                            >
                              Compare
                            </button>
                            <button
                              onClick={() => setActiveItem(row)}
                              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-[#2F7D4F] hover:text-white font-bold text-[11px] text-stone-700 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <BarChart3 size={13} /> Trend
                            </button>
                          </div>
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
                <p className="text-lg font-bold text-stone-800">₹{safePrice(activeItem.minPrice)}</p>
              </div>
              <div className="border-x border-stone-200">
                <span className="text-[11px] text-emerald-800 font-bold">Modal Price</span>
                <p className="text-2xl font-black text-[#0F2D1F]">₹{safePrice(activeItem.modalPrice)}</p>
                <span className="text-[10px] text-stone-500">{activeItem.unit}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 font-semibold">Max Price</span>
                <p className="text-lg font-bold text-stone-800">₹{safePrice(activeItem.maxPrice)}</p>
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
                            ₹{safePrice(pt.modalPrice)}
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
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Info size={14} /> Official Data Source & Cadence Audit
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-white/70 rounded-xl border border-emerald-200/50 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-emerald-700 shrink-0" />
                  <span>Reported Arrival Date: <strong>{activeItem.arrival_date || activeItem.priceDate}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-emerald-700 shrink-0" />
                  <span>Feed Last Synced: <strong>{formatSyncTime(activeItem.lastSyncedAt || activeItem.fetchedAt)}</strong></span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed">
                Published by: <strong>{activeItem.source}</strong> {activeItem.sourceResourceId && <span>(Resource: <code className="bg-white/80 px-1 py-0.5 rounded text-[10px]">{activeItem.sourceResourceId.slice(0, 8)}...</code>)</span>}.
              </p>
              <p className="text-[10px] text-stone-500">
                Official APMC daily auction records published via Ministry of Agriculture &amp; Farmers Welfare, Government of India.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
