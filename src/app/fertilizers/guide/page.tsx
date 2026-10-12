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
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';

export default function FertilizerGuidePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [guidances, setGuidances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, []);

  const filteredGuidances = guidances.filter((g) => {
    if (selectedCrop && g.cropSlug !== selectedCrop.toLowerCase()) return false;
    if (selectedCategory && g.fertilizerCategory?.slug !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        g.cropName.toLowerCase().includes(q) ||
        g.cropStage.toLowerCase().includes(q) ||
        g.nutrientRequirement.toLowerCase().includes(q) ||
        g.guidanceText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />

      {/* Header Banner */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Fertilizer Category Quick Cards */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-stone-900">Standard Agricultural Nutrient Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer agri-card ${
                  selectedCategory === cat.slug
                    ? 'bg-[#143D2A] text-white border-emerald-500 shadow-md scale-[1.02]'
                    : 'bg-white text-stone-900 border-stone-200 hover:border-emerald-300'
                }`}
              >
                <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                  selectedCategory === cat.slug ? 'text-emerald-300' : 'text-[#2F7D4F]'
                }`}>
                  {cat.nutrientProfile}
                </span>
                <p className="font-bold text-sm mt-0.5">{cat.name}</p>
                <p className={`text-[11px] line-clamp-1 mt-1 ${
                  selectedCategory === cat.slug ? 'text-stone-300' : 'text-stone-500'
                }`}>
                  {cat.applicationRole}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stage, crop, nutrient..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Crops</option>
              <option value="wheat">Wheat</option>
              <option value="cotton">Cotton</option>
              <option value="groundnut">Groundnut</option>
            </select>

            {(selectedCrop || selectedCategory || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCrop('');
                  setSelectedCategory('');
                  setSearchQuery('');
                }}
                className="text-xs text-stone-500 hover:text-stone-800 font-bold px-3 py-2 border rounded-xl"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Guidance Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-white rounded-3xl border border-stone-200 animate-pulse" />
            ))}
          </div>
        ) : filteredGuidances.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-2">
            <p className="font-bold text-stone-800 text-sm">No specific schedule found for these filters</p>
            <p className="text-xs text-stone-500">Try clearing filters to see all university-approved crop schedules.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGuidances.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#0F2D1F] text-xs font-extrabold uppercase">
                        {item.cropName}
                      </span>
                      <span className="text-xs font-bold text-stone-500">• {item.cropStage}</span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mt-1">
                      Nutrient Target: {item.nutrientRequirement}
                    </h3>
                  </div>

                  <div className="text-xs text-stone-500 sm:text-right">
                    <span className="block font-semibold text-stone-700">Recommended Timing</span>
                    <span className="text-emerald-700 font-bold">{item.recommendedTiming}</span>
                  </div>
                </div>

                {/* Agronomic Guidance & Why It Matters */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2">
                    <p className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                      Application Method & Instructions:
                    </p>
                    <p className="text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      {item.guidanceText}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Method: <strong>{item.applicationMethod}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                      Agronomic Role (Why It Matters):
                    </p>
                    <p className="text-stone-700 leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/60">
                      {item.whyItMatters}
                    </p>
                  </div>
                </div>

                {/* Important Precautions */}
                {item.importantPrecautions && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-950">
                    <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Important Precaution:</strong> {item.importantPrecautions}
                    </p>
                  </div>
                )}

                {/* Citation & Store Link */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Source: <strong>{item.sourceAuthority}</strong></span>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2F7D4F] hover:underline ml-1 inline-flex items-center"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/fertilizers?crop=${item.cropSlug}`}
                    className="inline-flex items-center gap-1 font-bold text-[#2F7D4F] hover:text-[#143D2A]"
                  >
                    Procure Fertilizers For {item.cropName} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
