'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  FlaskConical,
  Sprout,
  HelpCircle,
  Info,
  Calendar,
  ShoppingBag,
} from 'lucide-react';

export interface NutrientGuidanceExplorerProps {
  variant?: 'public' | 'portal';
  initialCrop?: string;
}

export function NutrientGuidanceExplorer({
  variant = 'public',
  initialCrop = '',
}: NutrientGuidanceExplorerProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [guidances, setGuidances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Field context state (portal mode)
  const [fieldContext, setFieldContext] = useState<any | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  const [selectedCrop, setSelectedCrop] = useState(initialCrop);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isPortal = variant === 'portal';

  // 1. Fetch public categories & guidance
  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const [catRes, guideRes] = await Promise.all([
        fetch('/api/v1/fertilizers/categories'),
        fetch('/api/v1/fertilizers/guidance'),
      ]);

      if (catRes.ok) {
        const cJson = await catRes.json();
        setCategories(cJson.data || []);
      }
      if (guideRes.ok) {
        const gJson = await guideRes.json();
        setGuidances(gJson.data || []);
      }
    } catch (e) {
      console.error('Failed to load fertilizer guide data:', e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch field context in portal mode
  const fetchFieldContext = async (fieldId?: string) => {
    setLoading(true);
    try {
      const url = fieldId
        ? `/api/v1/fertilizers/field-context?fieldId=${encodeURIComponent(fieldId)}`
        : '/api/v1/fertilizers/field-context';

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setFieldContext(json.data);
        if (json.data?.selectedField?.id) {
          setSelectedFieldId(json.data.selectedField.id);
        }
        if (json.data?.guidances) {
          setGuidances(json.data.guidances);
        }
      }
    } catch (e) {
      console.error('Failed to load field context for nutrient guidance:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPortal) {
      fetchFieldContext(selectedFieldId);
    } else {
      fetchPublicData();
    }
  }, [isPortal, selectedFieldId]);

  // Also fetch categories in portal mode for reference
  useEffect(() => {
    if (isPortal) {
      fetch('/api/v1/fertilizers/categories')
        .then((r) => r.json())
        .then((j) => setCategories(j.data || []))
        .catch(console.error);
    }
  }, [isPortal]);

  const filteredGuidances = guidances.filter((g) => {
    if (selectedCrop && g.cropSlug !== selectedCrop.toLowerCase()) return false;
    if (selectedCategory && g.fertilizerCategory?.slug !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        g.cropName?.toLowerCase().includes(q) ||
        g.cropStage?.toLowerCase().includes(q) ||
        g.nutrientRequirement?.toLowerCase().includes(q) ||
        g.guidanceText?.toLowerCase().includes(q) ||
        g.fertilizerCategory?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const soilAudit = fieldContext?.soilAudit;
  const activeCrop = fieldContext?.cropCycle;
  const currentField = fieldContext?.selectedField;

  return (
    <div className={isPortal ? 'space-y-6' : 'flex flex-col'}>
      {/* HEADER SECTION */}
      {isPortal ? (
        /* Portal Header matching Tasks & Activities layout */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Crop Nutrient Guidance</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-[11px] font-bold text-emerald-800">
                <ShieldCheck size={13} className="text-emerald-700" /> ICAR & SAU Agronomy Verified
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Science-backed nutrient schedules, stage application timing, and soil-test audit for your farm plots
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/store">
              <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#143D2A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer">
                <ShoppingBag size={14} />
                <span>Fertilizer Store</span>
              </button>
            </Link>
          </div>
        </div>
      ) : (
        /* Public Hero Header */
        <div className="bg-[#0F2D1F] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
              <ShieldCheck size={14} /> ICAR & State Agricultural Universities Verified
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              Fertilizer & Agronomy Knowledge Center
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              Science-backed fertilizer timing, nutrient roles, and application methods. Eliminate blind input application and tailor nutrients to your crop's exact phenological stage.
            </p>
          </div>
        </div>
      )}

      {/* PORTAL PLOT & SOIL AUDIT BANNER */}
      {isPortal && fieldContext && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            {/* Field Plot Switcher */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E4F1E8] text-[#143D2A] flex items-center justify-center shrink-0">
                <Sprout size={20} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Target Field Plot
                </label>
                {fieldContext.allFields?.length > 0 ? (
                  <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                    className="mt-0.5 font-extrabold text-stone-900 text-sm bg-transparent border-none focus:outline-none cursor-pointer p-0"
                  >
                    {fieldContext.allFields.map((fld: any) => (
                      <option key={fld.id} value={fld.id}>
                        {fld.name} ({fld.farmName} • {fld.areaHa || 1} Ha)
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-sm text-stone-700">No registered fields yet</span>
                )}
              </div>
            </div>

            {/* Active Crop & Stage */}
            {activeCrop ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-950">
                  {activeCrop.cropName} • Stage: <strong>{activeCrop.stage}</strong>
                </span>
              </div>
            ) : (
              <div className="text-xs text-stone-500 italic">No active crop cycle linked to this plot.</div>
            )}
          </div>

          {/* Soil Test Audit & Completeness Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical size={16} className="text-[#2F7D4F]" />
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  Soil Laboratory Measurements Audit
                </h3>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${soilAudit?.hasLabTest ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}
              >
                {soilAudit?.hasLabTest ? 'Verified Lab Test On Record' : 'No Lab Test Linked (Baseline Advisory)'}
              </span>
            </div>

            {/* Measurements Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {soilAudit?.parameters &&
                Object.entries(soilAudit.parameters).map(([key, param]: [string, any]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-2xl border text-xs ${param.isKnown
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-stone-50 border-stone-200/80 text-stone-500'
                      }`}
                  >
                    <span className="text-[10px] font-bold block opacity-75">{param.label}</span>
                    <strong className="text-sm font-extrabold block mt-0.5">
                      {param.isKnown ? `${param.value} ${param.unit || ''}` : 'Unknown'}
                    </strong>
                    <span className="text-[9px] block mt-0.5">
                      {param.isKnown ? 'Measured' : 'Not Tested'}
                    </span>
                  </div>
                ))}
            </div>

            {/* Friendly Soil Context Notice — Never Forces Lab Values */}
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1.5 ${soilAudit?.hasLabTest
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              }`}
            >
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck size={16} className="text-[#2F7D4F]" />
              <span>
                {soilAudit?.hasLabTest
                ? 'Tailored to Your Soil Test Report'
                    : 'Ready to Use — No Lab Soil Test Needed'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {soilAudit?.advisoryNotes}
            </p>
            {!soilAudit?.hasLabTest && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                  <Link href="/soil" className="text-[11px] font-bold text-[#2F7D4F] underline hover:text-[#143D2A]">
                    Optional: Set your soil type or Soil Health Card →
                  </Link>
              </div>
            )}
          </div>
        </div>
        </div>
  )
}

{/* MAIN BODY CONTAINER */ }
<div className={isPortal ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8'}>
  {/* Category Quick Cards */}
  <div className="space-y-3">
    <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
      Standard Agricultural Nutrient Categories
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${selectedCategory === cat.slug
              ? 'bg-[#143D2A] text-white border-emerald-500 shadow-md scale-[1.01]'
              : 'bg-white text-stone-900 border-stone-200 hover:border-emerald-300'
            }`}
        >
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider block ${selectedCategory === cat.slug ? 'text-emerald-300' : 'text-[#2F7D4F]'
              }`}
          >
            {cat.nutrientProfile}
          </span>
          <p className="font-bold text-sm mt-0.5">{cat.name}</p>
          <p
            className={`text-[11px] line-clamp-1 mt-1 ${selectedCategory === cat.slug ? 'text-emerald-200' : 'text-stone-500'
              }`}
          >
            {cat.applicationRole}
          </p>
        </button>
      ))}
    </div>
  </div>

  {/* Filter Controls Bar */}
  <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
    <div className="relative flex-1 sm:max-w-md">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search stage (e.g. Basal, Flowering) or nutrient requirement..."
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-xs text-stone-800 placeholder:text-stone-400"
      />
    </div>

    <div className="flex items-center gap-3 justify-between sm:justify-end">
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Crop</label>
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="p-2 rounded-xl border border-stone-200 bg-stone-50/50 font-medium text-xs focus:outline-none focus:border-emerald-600 cursor-pointer text-stone-800"
        >
          <option value="">All Crops</option>
          <option value="wheat">Wheat</option>
          <option value="cotton">Cotton</option>
          <option value="groundnut">Groundnut</option>
        </select>
      </div>
      <button
        onClick={() => {
          setSelectedCrop('');
          setSelectedCategory('');
          setSearchQuery('');
        }}
        className="text-xs font-bold text-stone-500 hover:text-stone-800 px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
      >
        Reset Filters
      </button>
    </div>
  </div>

  {/* Stage-by-Stage Guidance Cards */}
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-extrabold text-stone-900 tracking-tight">
        Phenological Stage Nutrient Recommendations
      </h2>
      <span className="text-xs text-stone-500 font-medium">
        Showing <strong>{filteredGuidances.length}</strong> recommendations
      </span>
    </div>

    {loading ? (
      <div className="p-16 text-center text-xs text-stone-500">Loading agronomic guidance schedules...</div>
    ) : filteredGuidances.length === 0 ? (
      <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
        <BookOpen size={32} className="mx-auto text-stone-400" />
        <p className="font-bold text-stone-800 text-sm">No nutrient guidance found for this filter</p>
        <p className="text-xs text-stone-500">Try choosing "All Crops" or resetting category filters.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {filteredGuidances.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4 hover:border-emerald-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                    {item.cropName}
                  </span>
                  <span className="text-[10px] font-bold text-stone-500">{item.state}</span>
                </div>
                <h3 className="text-lg font-black text-stone-900 mt-1">
                  {item.cropStage}
                </h3>
                <p className="text-xs font-bold text-[#2F7D4F] mt-0.5">
                  Timing: {item.recommendedTiming} • Method: {item.applicationMethod}
                </p>
              </div>

              <div className="text-right sm:text-right text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Nutrient Requirement
                </span>
                <span className="font-extrabold text-[#0F2D1F] text-sm block mt-0.5">
                  {item.nutrientRequirement}
                </span>
                {item.fertilizerCategory && (
                  <span className="text-[11px] font-medium text-stone-500 block">
                    Suggested: {item.fertilizerCategory.name}
                  </span>
                )}
              </div>
            </div>

            {/* Guidance Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-4 bg-stone-50/70 rounded-2xl border border-stone-100">
                <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-700" /> Agronomic Application Protocol
                </h4>
                <p className="text-stone-600 leading-relaxed text-[11px]">{item.guidanceText}</p>
              </div>

              <div className="space-y-1.5 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/60">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Info size={14} className="text-emerald-700" /> Physiological Role & Precautions
                </h4>
                <p className="text-emerald-900 leading-relaxed text-[11px]">{item.whyItMatters}</p>
                {item.importantPrecautions && (
                  <p className="text-amber-800 text-[10px] font-semibold mt-1">
                    ⚠️ {item.importantPrecautions}
                  </p>
                )}
              </div>
            </div>

            {/* Footer with Source & Store Link */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-600" /> Published by: <strong>{item.sourceAuthority}</strong>
              </span>

              <Link href={`/store?crop=${item.cropSlug}`}>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#2F7D4F] hover:text-white text-xs font-bold text-stone-700 transition-colors cursor-pointer">
                  <Package size={13} />
                  <span>Procure Inputs for {item.cropName}</span>
                  <ArrowRight size={12} />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
    </div >
  );
}
