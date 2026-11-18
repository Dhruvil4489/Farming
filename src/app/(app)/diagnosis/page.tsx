'use client';

import React from 'react';
import Link from 'next/link';
import { Microscope, ArrowLeft, Sparkles, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { DiseaseClassifierCard } from '@/components/diagnosis/DiseaseClassifierCard';
import { useI18n } from '@/providers/I18nProvider';

export default function DiagnosisPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#143D2A] bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#2F7D4F]" />
              {t('diagnosis_cv_badge', 'Multi-Model Crop Disease Intelligence Engine')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#143D2A] tracking-tight">
            {t('diagnosis_title', 'Universal Crop Disease AI Engine')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            {t(
              'diagnosis_subtitle',
              'Multi-model agricultural computer vision pipeline for Indian crops. Features specialist models for Cotton, Wheat, Rice, and Chilli alongside Horticultural Benchmark networks, botanical crop identification, and ICAR agronomic pathology guidance.'
            )}
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

      {/* Agricultural Advisory & Safety Disclosures */}
      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200/80 space-y-3 print:hidden">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#2F7D4F]" />
          {t('diagnosis_safety_title', 'Agricultural Diagnostic Standards & Evidence-Based Safety')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-600">
          <div className="space-y-1">
            <strong className="block text-stone-800 font-bold">
              {t('diagnosis_safety_s1_title', '1. Validated Crop Models')}
            </strong>
            <p className="leading-relaxed">
              {t(
                'diagnosis_safety_s1_desc',
                'Images are processed through crop-specific computer vision models aligned with ICAR and agricultural research protocols. Models are never applied to crops outside their validated domain.'
              )}
            </p>
          </div>
          <div className="space-y-1">
            <strong className="block text-stone-800 font-bold">
              {t('diagnosis_safety_s2_title', '2. Intelligent Field Context')}
            </strong>
            <p className="leading-relaxed">
              {t(
                'diagnosis_safety_s2_desc',
                'Your registered field information is checked against visual leaf morphology. When a discrepancy occurs, the system alerts you rather than generating an incorrect diagnosis.'
              )}
            </p>
          </div>
          <div className="space-y-1">
            <strong className="block text-stone-800 font-bold">
              {t('diagnosis_safety_s3_title', '3. Verified Treatments Only')}
            </strong>
            <p className="leading-relaxed">
              {t(
                'diagnosis_safety_s3_desc',
                'Medicines and biological controls strictly follow CIBRC registered label recommendations and official university package of practices. Unverified dosages are never generated.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
