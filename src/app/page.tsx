'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sprout,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  CloudSun,
  Layers,
  Bug,
  Droplet,
  Bot,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Tractor,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';
import { CinematicVideoHero } from '@/components/domain/CinematicVideoHero';
import { MarketSnapshotSection } from '@/components/market/MarketSnapshotSection';

// Lifecycle stage descriptions
const LIFECYCLE_STAGES = [
  {
    key: 'plan',
    title: '1. Plan',
    subtitle: 'Variety & Land Allocation',
    description: 'Select optimal crop varieties based on local soil test results, expected monsoon window, and historical regional yield averages.',
    feature: 'Crop Master & Field Allocation Planner',
    route: '/crops',
  },
  {
    key: 'prepare',
    title: '2. Prepare',
    subtitle: 'Deep Tillage & Basal Nutrition',
    description: 'Calculate precise basal phosphorus, potash, and organic vermicompost dosages per bigha/acre before creating planting furrows.',
    feature: 'Fertilizer Guidance & Soil Health Card OCR',
    route: '/fertilizers/guide',
  },
  {
    key: 'sow',
    title: '3. Sow',
    subtitle: 'Seed Rate & Moisture Check',
    description: 'Record germination dates to automatically materialize your field-specific phenological stage timeline and advisory triggers.',
    feature: 'Phenological Stage Materializer',
    route: '/crops/new-cycle',
  },
  {
    key: 'grow',
    title: '4. Grow',
    subtitle: 'Irrigation & Tillering Vigor',
    description: 'Synchronize drip cycles with evapo-transpiration forecasts. Track crown root initiation, vegetative branching, and square formation.',
    feature: 'Drip Scheduling & Task Manager',
    route: '/irrigation',
  },
  {
    key: 'protect',
    title: '5. Protect',
    subtitle: 'Weather-Grounded Scouting',
    description: 'Receive real-time spray advisories before high wind or rainfall. Photograph crop symptoms for guided diagnostic analysis.',
    feature: 'Weather-Aware Spray Engine & Scouting Log',
    route: '/scouting',
  },
  {
    key: 'harvest',
    title: '6. Harvest',
    subtitle: 'Maturity & Moisture Index',
    description: 'Log harvested quintals, picking dates, and store inventory records linked directly to your field cycle history.',
    feature: 'Harvest Record & Inventory System',
    route: '/crops',
  },
  {
    key: 'sell',
    title: '7. Sell',
    subtitle: 'Mandi Price Discovery',
    description: 'Compare official APMC mandi modal prices across Gujarat and India to trade your produce at peak regional market rates.',
    feature: 'Agmarknet Live Mandi Intelligence',
    route: '/market',
  },
];

export default function HomePage() {
  const [activeStage, setActiveStage] = useState(0);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [cartAdding, setCartAdding] = useState<string | null>(null);

  // Fetch store products preview safely without blocking other modules
  useEffect(() => {
    let isMounted = true;
    const fetchStore = async () => {
      try {
        const res = await fetch('/api/v1/store/products');
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setStoreProducts(Array.isArray(json.data) ? json.data.slice(0, 4) : []);
          }
        }
      } catch (err) {
        console.warn('Store preview fetch note:', err);
      }
    };
    fetchStore();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = async (productId: string) => {
    setCartAdding(productId);
    try {
      const res = await fetch('/api/v1/store/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setCartAdding(null), 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      {/* Interactive Global Header */}
      <SiteHeader />

      {/* SECTION A — CINEMATIC HERO */}
      <CinematicVideoHero>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Trust indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-xs font-semibold text-emerald-200 backdrop-blur-md shadow-lg animate-in fade-in duration-500">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Official AGMARKNET Mandi Feeds • ICAR Agronomic Guidance • Provenance Grounded</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-md">
            Smarter Farming.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-200 to-amber-200">
              Better Decisions.
            </span>{' '}
            A Better Harvest.
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-xl text-emerald-100/90 max-w-2xl mx-auto leading-relaxed font-normal">
            Manage your farms, understand your crops, discover market prices, and make informed agricultural decisions from one intelligent platform.
          </p>

          {/* 3 Call-To-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-emerald-400/30"
            >
              Explore Your Farm <ArrowRight size={18} />
            </Link>

            <Link
              href="/market"
              className="w-full sm:w-auto px-7 py-4 bg-emerald-900/60 hover:bg-emerald-900/80 text-emerald-100 hover:text-white font-semibold text-base rounded-2xl border border-emerald-500/30 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <TrendingUp size={18} className="text-emerald-400" /> Explore Live Mandi Prices
            </Link>

            <Link
              href="/fertilizers"
              className="w-full sm:w-auto px-7 py-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-amber-100 font-semibold text-base rounded-2xl border border-amber-500/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Package size={18} className="text-amber-400" /> Explore Fertilizers
            </Link>
          </div>

          {/* Honest Disclaimer */}
          <p className="text-[11px] text-emerald-200/60 max-w-lg mx-auto italic">
            * SmartFarm AI provides source-backed decision support. Market observations reflect official AGMARKNET publications and SAU package of practices.
          </p>
        </div>
      </CinematicVideoHero>

      {/* SECTION B — LIVE MANDI MARKET SNAPSHOT (ROBUST STATE MACHINE & RETRY) */}
      <MarketSnapshotSection />

      {/* SECTION C — FARMING INTELLIGENCE (8 MODULE CARDS) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#2F7D4F] bg-emerald-100/70 px-3 py-1 rounded-full">
            Intelligent Agritech Stack
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2D1F] tracking-tight">
            Comprehensive Intelligence For Every Acre
          </h2>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Every module directly connects into the central agricultural spine: field boundaries, phenological stages, real weather advisories, and input procurement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Farm Management */}
          <Link
            href="/farms"
            className="p-6 bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all agri-card group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#2F7D4F] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tractor size={24} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#2F7D4F] transition-colors">
                Farm Management
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Map farm plots with Leaflet GPS boundaries, track irrigation infrastructure, soil textures, and total acreage.
              </p>
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore Farms →
            </span>
          </Link>

          {/* 2. Crop Planning */}
          <Link
            href="/crops"
            className="p-6 bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all agri-card group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#2F7D4F] transition-colors">
                Crop Planning & Stages
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Automatic phenological stage materialization from sowing date. Plan wheat, cotton, and groundnut cycles with verified calendars.
              </p>
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Plan Crop Cycles →
            </span>
          </Link>

          {/* 3. Weather Intelligence */}
          <Link
            href="/weather"
            className="p-6 bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all agri-card group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloudSun size={24} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#2F7D4F] transition-colors">
                Weather Intelligence
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Real-time hourly forecasts and agronomic spray rules. Never spray pesticide before heavy downpours or high wind drifts.
              </p>
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Spray Advisories →
            </span>
          </Link>

          {/* 4. Soil Health */}
          <Link
            href="/soil"
            className="p-6 bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all agri-card group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#2F7D4F] transition-colors">
                Soil Health & Cards
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                6-path soil framework. Upload Soil Health Card reports, confirm NPK and micronutrient parameters, and eliminate blind fertilization.
              </p>
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Check Soil Profiles →
            </span>
          </Link>

          {/* 5. Disease Diagnosis */}
          <Link
            href="/scouting"
            className="p-6 bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all agri-card group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bug size={24} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#2F7D4F] transition-colors">
                Disease & Scouting
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Geotagged scouting observations with severity rankings. Diagnose pest symptoms grounded in regional university extension guidelines.
              </p>
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Scout Field Issues →
            </span>
          </Link>

          {/* 6. AI Farming Assistant */}
          <Link
            href="/assistant"
            className="p-6 bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all agri-card group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot size={24} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#2F7D4F] transition-colors">
                AI Farming Assistant
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Grounded conversational decision support that answers in Gujarati, Hindi, or English using your farm's active cycle context.
              </p>
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Ask AI Assistant →
            </span>
          </Link>

          {/* 7. Irrigation */}
          <Link
            href="/irrigation"
            className="p-6 bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all agri-card group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Droplet size={24} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#2F7D4F] transition-colors">
                Irrigation Tracking
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Log water hours, volume liters, source (borewell vs canal), and method (drip, sprinkler, flood) per crop cycle.
              </p>
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage Irrigation →
            </span>
          </Link>

          {/* 8. Farm Finance & Mandi Linkage */}
          <Link
            href="/market"
            className="p-6 bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/50 shadow-sm hover:shadow-xl transition-all agri-card group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#2F7D4F] transition-colors">
                Mandi & Farm Commerce
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Live AGMARKNET mandi rates, input shopping for certified fertilizers, and profit-per-quintal financial rollups.
              </p>
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore Market & Inputs →
            </span>
          </Link>
        </div>
      </section>

      {/* SECTION D — CROP LIFECYCLE (INTERACTIVE TIMELINE) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0F2D1F] text-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-500/30">
              End-To-End Agronomy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              The Connected Crop Lifecycle
            </h2>
            <p className="text-emerald-100/80 text-sm">
              Follow every agricultural phase with intelligent platform guidance from land preparation to post-harvest sales.
            </p>
          </div>

          {/* Interactive Stage Tabs with Accessible Semantics */}
          <div
            role="tablist"
            aria-label="Crop Lifecycle Stages"
            className="flex items-center justify-between gap-2 overflow-x-auto pb-4 scrollbar-none focus-visible:outline-none"
          >
            {LIFECYCLE_STAGES.map((st, idx) => {
              const selected = activeStage === idx;
              return (
                <button
                  key={st.key}
                  id={`stage-tab-${st.key}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`stage-panel-${st.key}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveStage(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      const next = (idx + 1) % LIFECYCLE_STAGES.length;
                      setActiveStage(next);
                      document.getElementById(`stage-tab-${LIFECYCLE_STAGES[next].key}`)?.focus();
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const prev = (idx - 1 + LIFECYCLE_STAGES.length) % LIFECYCLE_STAGES.length;
                      setActiveStage(prev);
                      document.getElementById(`stage-tab-${LIFECYCLE_STAGES[prev].key}`)?.focus();
                    }
                  }}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0F2D1F] ${
                    selected
                      ? 'bg-[#2F7D4F] text-white border-emerald-400 shadow-lg scale-105 ring-1 ring-emerald-300/50'
                      : 'bg-white/5 text-emerald-200/70 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                      selected ? 'bg-white text-[#2F7D4F]' : 'bg-white/20 text-white'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{st.title.replace(`${idx + 1}. `, '')}</span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Details Card with Tabpanel Semantics */}
          <div
            id={`stage-panel-${LIFECYCLE_STAGES[activeStage].key}`}
            role="tabpanel"
            aria-labelledby={`stage-tab-${LIFECYCLE_STAGES[activeStage].key}`}
            className="bg-[#143D2A] border border-emerald-700/60 rounded-3xl p-8 sm:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center transition-all animate-in fade-in duration-200"
          >
            <div className="lg:col-span-2 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 inline-block">
                Phase {activeStage + 1} of 7 • {LIFECYCLE_STAGES[activeStage].subtitle}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {LIFECYCLE_STAGES[activeStage].title}
              </h3>
              <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
                {LIFECYCLE_STAGES[activeStage].description}
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Integrated with: <strong className="text-white">{LIFECYCLE_STAGES[activeStage].feature}</strong></span>
              </div>
            </div>

            <div className="bg-[#0F2D1F] p-6 rounded-2xl border border-emerald-800/80 space-y-4 text-center lg:text-left">
              <h4 className="text-sm font-bold text-white">Ready to operate this stage?</h4>
              <p className="text-xs text-emerald-200/70 leading-relaxed">
                Open the dedicated module to manage records and execute source-backed agronomic operations.
              </p>
              <Link
                href={LIFECYCLE_STAGES[activeStage].route}
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-xs transition-all shadow-md hover:scale-[1.02]"
              >
                Open {LIFECYCLE_STAGES[activeStage].title.replace(`${activeStage + 1}. `, '')} Module <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E — FERTILIZER STORE PREVIEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Fertilizer E-Commerce
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F2D1F] tracking-tight">
              Certified Agri-Inputs At Regulated Prices
            </h2>
            <p className="text-stone-600 text-sm max-w-xl">
              Procure Government-subsidized fertilizers, water-soluble foliar nutrients, and certified organic vermicompost.
            </p>
          </div>
          <Link
            href="/fertilizers"
            className="text-sm font-bold text-[#2F7D4F] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Browse Complete Catalog →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {storeProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-stone-200/80 hover:border-emerald-500/40 shadow-sm hover:shadow-xl transition-all agri-card flex flex-col justify-between overflow-hidden"
            >
              <div className="relative h-48 bg-stone-100 overflow-hidden">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-stone-800 text-[10px] font-bold shadow-xs">
                  {p.brand?.name || 'Verified'}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-bold">
                  {p.packSize}
                </span>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm line-clamp-1">{p.name}</h3>
                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-[#0F2D1F]">₹{p.price.toFixed(2)}</span>
                    {p.mrp && p.mrp > p.price && (
                      <span className="text-[11px] text-stone-400 line-through ml-1.5">₹{p.mrp}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/fertilizers/${p.slug}`}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-[11px] font-bold text-stone-700 transition-colors"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleAddToCart(p.id)}
                      disabled={cartAdding === p.id}
                      className="px-3 py-1.5 rounded-lg bg-[#2F7D4F] hover:bg-[#25663f] text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ShoppingBag size={13} /> {cartAdding === p.id ? 'Added!' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION F — AI FARMING ASSISTANT */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#143D2A] to-[#0F2D1F] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-500/30">
              Decision Support
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Meet Your Grounded AI Farming Assistant
            </h2>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Unlike generic chatbots, our assistant is grounded in your actual field boundary, current phenological stage, live OpenMeteo weather data, and official Indian agricultural extension guidelines.
            </p>
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Example Farmer Queries:</p>
              {[
                'What should I do for my crop today?',
                'Explain my soil report and fertilizer dosage.',
                'Help me identify a crop problem from scouting notes.',
                'Find the latest mandi price trends for cotton.',
                'Help me plan my rabi wheat irrigation schedule.',
              ].map((query, idx) => (
                <Link
                  key={idx}
                  href={`/assistant?q=${encodeURIComponent(query)}`}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-emerald-100 hover:text-white flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span>"{query}"</span>
                  <ArrowRight size={14} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-[#1a4a34] border border-emerald-600/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-emerald-700/60">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">SmartFarm AgroAssistant</h3>
                <p className="text-[11px] text-emerald-300">Multi-lingual • Grounded in Anand Agricultural University (AAU)</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-950/60 p-3.5 rounded-2xl text-emerald-100 border border-emerald-800">
                <p className="font-semibold text-emerald-300 mb-1">Farmer (Vadodara):</p>
                <p>"Should I apply urea on my cotton field today?"</p>
              </div>

              <div className="bg-emerald-900/60 p-4 rounded-2xl text-emerald-100 border border-emerald-600/30 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold">
                  <span>Assistant Response</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-200">Grounded Fact</span>
                </div>
                <p className="leading-relaxed">
                  "Based on your North Field cotton stage (<strong>Squaring & Flowering</strong>) and today's weather forecast (<strong>0% rain probability</strong>, wind 11 km/h):
                </p>
                <p className="leading-relaxed">
                  Yes, this is an optimal window for your second urea split (Neem Coated Urea). Incorporate near the root zone and run your drip irrigation for 90 minutes. Avoid excessive broadcasting if cloudy weather persists."
                </p>
                <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[10px] text-emerald-300">
                  <span>Source: JAU Cotton Package of Practices</span>
                  <span>Confidence: High</span>
                </div>
              </div>
            </div>

            <Link
              href="/assistant"
              className="block text-center w-full py-3 bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Open Full AI Assistant Interface →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION G — WEATHER & INSIGHTS PREVIEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
            Atmospheric Monitoring
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F2D1F] tracking-tight">
            Hyper-Local Spray & Field Weather
          </h2>
          <p className="text-stone-600 text-sm">
            Rules-driven spray advisories integrated with Open-Meteo satellite weather telemetry.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="text-xs text-stone-500 font-medium">Temperature</span>
            <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">31.4°C</p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">Normal for season</p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="text-xs text-stone-500 font-medium">Relative Humidity</span>
            <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">58%</p>
            <p className="text-[10px] text-amber-700 font-semibold mt-1">Moderate fungal risk</p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="text-xs text-stone-500 font-medium">Wind Speed</span>
            <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">11 km/h</p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">Optimal spray condition</p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="text-xs text-stone-500 font-medium">Precipitation (24h)</span>
            <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">0.0 mm</p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">No rain wash-off risk</p>
          </div>
        </div>
      </section>

      {/* SECTION H — KNOWLEDGE & GOVERNMENT RESOURCES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-stone-100/70 border-y border-stone-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2F7D4F] bg-emerald-100 px-3 py-1 rounded-full">
              Source-Backed Authorities
            </span>
            <h2 className="text-3xl font-extrabold text-[#0F2D1F] tracking-tight">
              Verified Agricultural Sources
            </h2>
            <p className="text-stone-600 text-sm">
              All crop calendars, fertilizer recommendations, and market data link directly to official Indian agricultural authorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="https://data.gov.in"
              target="_blank"
              rel="noreferrer"
              className="p-6 bg-white rounded-2xl border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all agri-card space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase">Open Data India</span>
                <ExternalLink size={16} className="text-stone-400 group-hover:text-emerald-700" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">AGMARKNET (DMI / data.gov.in)</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Daily commodity arrivals and modal prices published across all regulated APMC wholesale markets in India.
              </p>
            </a>

            <a
              href="https://aau.in"
              target="_blank"
              rel="noreferrer"
              className="p-6 bg-white rounded-2xl border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all agri-card space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase">State Agricultural University</span>
                <ExternalLink size={16} className="text-stone-400 group-hover:text-emerald-700" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Anand Agricultural University (AAU)</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Regional agronomic package of practices, fertilizer schedule schedules, and pest threshold advisories for Gujarat.
              </p>
            </a>

            <a
              href="https://soilhealth.dac.gov.in"
              target="_blank"
              rel="noreferrer"
              className="p-6 bg-white rounded-2xl border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all agri-card space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase">Ministry of Agriculture</span>
                <ExternalLink size={16} className="text-stone-400 group-hover:text-emerald-700" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Soil Health Card Portal</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                National soil nutrient ratings (Macro NPK, secondary Sulphur, and micronutrients Zn, Fe, Cu, Mn, B).
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION I — FINAL CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F2D1F] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Bring Your Entire Farm Into One Intelligent Platform.
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            From soil testing and seed planning to live Agmarknet prices and fertilizer delivery, take control of your agricultural yield today.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-base rounded-2xl border border-white/20 transition-all"
            >
              Sign In (Demo Account)
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION J — COMPREHENSIVE FOOTER */}
      <footer className="bg-[#091F15] text-stone-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-emerald-950 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-emerald-900/40">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#2F7D4F] flex items-center justify-center">
                <Sprout size={18} />
              </div>
              <span className="font-extrabold text-base tracking-tight">SmartFarm AI</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
              Your Intelligent Digital Farming Companion. Grounded decision support, live government-backed mandi intelligence, and direct agri-input procurement.
            </p>
            <p className="text-[11px] text-stone-500">
              © 2026 SmartFarm AI Platform. All rights reserved.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Platform</p>
            <ul className="space-y-2">
              <li><Link href="/farms" className="hover:text-white transition-colors">My Farms</Link></li>
              <li><Link href="/fields" className="hover:text-white transition-colors">Fields & Boundaries</Link></li>
              <li><Link href="/crops" className="hover:text-white transition-colors">Crop Calendar</Link></li>
              <li><Link href="/weather" className="hover:text-white transition-colors">Weather Advisories</Link></li>
              <li><Link href="/tasks" className="hover:text-white transition-colors">Task Management</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Intelligence</p>
            <ul className="space-y-2">
              <li><Link href="/market" className="hover:text-white transition-colors">Live Mandi Prices</Link></li>
              <li><Link href="/fertilizers" className="hover:text-white transition-colors">Fertilizer Store</Link></li>
              <li><Link href="/fertilizers/guide" className="hover:text-white transition-colors">Crop Nutrient Guide</Link></li>
              <li><Link href="/assistant" className="hover:text-white transition-colors">AI Farming Assistant</Link></li>
              <li><Link href="/soil" className="hover:text-white transition-colors">Soil Health</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Account & Legal</p>
            <ul className="space-y-2">
              <li><Link href="/login" className="hover:text-white transition-colors">Farmer Login</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Free Registration</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Order Tracking</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">System Admin</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p>Data provenance: All prices from official AGMARKNET publications. Agronomic schedules adapted from ICAR & SAUs.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white">Privacy Policy</Link>
            <Link href="/" className="hover:text-white">Terms of Service</Link>
            <Link href="/market" className="hover:text-white">Market Disclaimers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
