'use client';

import React from 'react';
import Link from 'next/link';
import { Microscope, ArrowLeft, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { DiseaseClassifierCard } from '@/components/diagnosis/DiseaseClassifierCard';

export default function DiagnosisPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-600" />
              Computer Vision Assistant
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#143D2A] tracking-tight">
            Crop Disease Classifier
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Upload leaf photographs to screen for 38 common crop diseases across 14 economic crops.
            Provides explainable visual similarity rankings with explicit non-clinical caveats.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/scouting"
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ArrowLeft size={14} /> Back to Scouting
          </Link>
        </div>
      </div>

      {/* Main Classifier Card */}
      <DiseaseClassifierCard />

      {/* Methodology & Limitations Disclosure */}
      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200/80 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
          <BookOpen size={14} className="text-[#2F7D4F]" />
          Model Methodology, Dataset & Disclosures
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-600">
          <div className="space-y-1">
            <strong className="block text-stone-800 font-bold">1. Pretrained Backbone</strong>
            <p className="leading-relaxed">
              Utilizes ResNet-50 fine-tuned on the PlantVillage benchmark dataset under an <strong>Apache-2.0</strong> open source license. Evaluated locally on a held-out test split.
            </p>
          </div>
          <div className="space-y-1">
            <strong className="block text-stone-800 font-bold">2. Non-Plant Rejection Gate</strong>
            <p className="leading-relaxed">
              Images pass through vegetative color distribution and texture variance screening to reject non-foliage photos, documents, and domestic scenes before classification.
            </p>
          </div>
          <div className="space-y-1">
            <strong className="block text-stone-800 font-bold">3. Conservative Action Boundary</strong>
            <p className="leading-relaxed">
              Never outputs chemical pesticide prescriptions or dosage. Encourages non-chemical cultural management and referral to certified district agricultural officers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
