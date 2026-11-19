'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Grid, Plus, Search, Sprout, CheckCircle2, Info } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/providers/I18nProvider';

export default function NewCropCyclePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [fields, setFields] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [category, setCategory] = useState('all');
  const [cropSearch, setCropSearch] = useState('');

  const categoryTabs = [
    { id: 'all', label: t('all_crops', 'All Crops') },
    { id: 'cereal', label: t('crop_categories.cereals', 'Cereals') },
    { id: 'pulse', label: t('crop_categories.pulses', 'Pulses') },
    { id: 'oilseed', label: t('crop_categories.oilseeds', 'Oilseeds') },
    { id: 'cash_crop', label: t('crop_categories.cash_crops', 'Cash Crops') },
    { id: 'vegetable', label: t('crop_categories.vegetables', 'Vegetables') },
    { id: 'fruit', label: t('crop_categories.fruits', 'Fruits') },
    { id: 'spice', label: t('crop_categories.spices', 'Spices') },
    { id: 'plantation', label: t('crop_categories.plantation', 'Plantation') },
    { id: 'fodder', label: t('crop_categories.fodder', 'Fodder') },
    { id: 'regional', label: t('crop_categories.regional', 'Regional') },
  ];

  const [form, setForm] = useState({
    fieldId: '',
    cropId: '',
    varietyId: '',
    sowingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/fields').then((r) => (r.ok ? r.json() : { data: [] })),
      fetch(`/api/v1/crops?lang=${locale}`).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([fieldRes, cropRes]) => {
        const fList = Array.isArray(fieldRes?.data) ? fieldRes.data : [];
        const cList = Array.isArray(cropRes?.data) ? cropRes.data : [];
        setFields(fList);
        setCrops(cList);
        if (fList.length > 0) setForm((p) => ({ ...p, fieldId: fList[0].id }));
        if (cList.length > 0) setForm((p) => ({ ...p, cropId: cList[0].id }));
      })
      .catch(() => {})
      .finally(() => setLoadingInit(false));
  }, [locale]);

  const filteredCrops = useMemo(() => {
    const q = cropSearch.trim().toLowerCase();
    return crops.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (!q) return true;
      const haystack = [
        c.name,
        c.slug,
        c.scientificName,
        c.names?.en,
        c.names?.hi,
        c.names?.gu,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [crops, category, cropSearch]);

  const selectedCrop = useMemo(
    () => crops.find((c) => c.id === form.cropId) || null,
    [crops, form.cropId]
  );

  const handleSelectCrop = (cropId: string) => {
    setForm((prev) => ({ ...prev, cropId, varietyId: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cropId) {
      setError('Please select a crop from the catalog.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/crop-cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: form.fieldId,
          cropId: form.cropId,
          varietyId: form.varietyId || undefined,
          sowingDate: form.sowingDate,
          expectedHarvestDate: form.expectedHarvestDate || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to start crop cycle.');

      const createdId = data?.data?.id;
      router.push(createdId ? `/crop-cycles/${createdId}` : '/crops');
    } catch (err: any) {
      setError(err.message || 'Failed to start crop cycle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
      >
        <ArrowLeft size={16} /> {t('back_to_crops', 'Back to Crops & Cycles')}
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#143D2A]">{t('start_crop_cycle', 'Start New Crop Cycle')}</h1>
        <p className="text-xs sm:text-sm text-stone-600">
          {t('new_cycle_subtitle', 'Search 60+ Indian crops in English, Hindi, or Gujarati. SmartFarm AI automatically generates crop-specific growth stages, farming tasks, and email reminders.')}
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {!loadingInit && fields.length === 0 ? (
        <Card className="p-8 text-center space-y-4 rounded-2xl">
          <div className="w-14 h-14 bg-emerald-50 text-[#2F7D4F] rounded-2xl mx-auto flex items-center justify-center">
            <Grid size={26} />
          </div>
          <div className="space-y-1">
            <h2 className="font-bold text-stone-900 text-base">{t('add_field_first', 'Add a Field First')}</h2>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              {t('add_field_first_desc', 'You need at least one field plot before planting a crop cycle.')}
            </p>
          </div>
          <Link href="/fields/new">
            <Button size="sm" className="bg-[#2F7D4F] hover:bg-[#143D2A] text-white">
              <Plus size={15} className="mr-1" /> {t('add_first_field', 'Add Your First Field')}
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-6 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Search & Filter Crop Catalogue */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-stone-900">
                1. {t('choose_crop', 'Choose Crop')} ({crops.length} {t('indian_crops_available', 'Indian Crops Available')}) *
              </label>

              {/* Search box */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={cropSearch}
                  onChange={(e) => setCropSearch(e.target.value)}
                  placeholder={t('search_crop_multilingual_placeholder', 'Search by English, Hindi, or Gujarati (e.g. Wheat, गेहूं, ઘઉં, કપાસ, જીરું)...')}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F7F8F5] border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {categoryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategory(tab.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      category === tab.id
                        ? 'bg-[#143D2A] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-emerald-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Crop Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 border border-stone-200 rounded-xl bg-stone-50/60">
                {filteredCrops.length === 0 ? (
                  <div className="col-span-full py-6 text-center text-xs text-stone-500">
                    {t('no_crops_found', 'No crops found matching search.')}
                  </div>
                ) : (
                  filteredCrops.map((c) => {
                    const active = form.cropId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCrop(c.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-50 border-[#2F7D4F] ring-1 ring-[#2F7D4F]'
                            : 'bg-white border-stone-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-xs text-stone-900 leading-snug">
                            {c.names?.en || c.name}
                          </span>
                          {active && <CheckCircle2 size={14} className="text-[#2F7D4F] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {c.names?.hi} • {c.names?.gu}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                          <span className="capitalize">{c.category.replace('_', ' ')}</span>
                          <span>~{c.typicalDurationDays || 120} {t('days', 'days')}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selected Crop Quick Info Preview */}
              {selectedCrop && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-extrabold text-[#143D2A] flex items-center gap-1.5">
                      <Sprout size={15} className="text-[#2F7D4F]" />
                      {selectedCrop.names?.en} ({selectedCrop.names?.hi} / {selectedCrop.names?.gu})
                    </span>
                    {selectedCrop.scientificName && (
                      <span className="italic text-[11px] text-emerald-800">{selectedCrop.scientificName}</span>
                    )}
                  </div>
                  {selectedCrop.sowingPeriod && (
                    <p className="text-emerald-900">
                      <strong>{t('typical_sowing', 'Typical Sowing')}:</strong> {selectedCrop.sowingPeriod} •{' '}
                      <strong>{t('duration', 'Duration')}:</strong> ~{selectedCrop.typicalDurationDays} {t('days', 'days')}
                    </p>
                  )}
                  {selectedCrop.soilSuitability && (
                    <p className="text-stone-700">
                      <strong>{t('soil', 'Soil')}:</strong> {selectedCrop.soilSuitability}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Field, Variety, Sowing Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-stone-800">2. {t('select_field', 'Select Field')} *</label>
                <select
                  value={form.fieldId}
                  onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  required
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.farm?.name || 'Farm'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-stone-800">
                  {t('variety', 'Variety')} ({t('optional', 'Optional')})
                </label>
                <select
                  value={form.varietyId}
                  onChange={(e) => setForm({ ...form, varietyId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                >
                  <option value="">{t('variety_standard_estimate', 'Not sure / Standard duration estimate')}</option>
                  {(selectedCrop?.varieties || []).map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.durationDays ? `(~${v.durationDays}d)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`3. ${t('sowing_date', 'Sowing / Planting Date')} *`}
                type="date"
                value={form.sowingDate}
                onChange={(e) => setForm({ ...form, sowingDate: e.target.value })}
                required
              />

              <Input
                label={`${t('expected_harvest', 'Expected Harvest Date')} (${t('optional', 'Optional')})`}
                type="date"
                value={form.expectedHarvestDate}
                onChange={(e) => setForm({ ...form, expectedHarvestDate: e.target.value })}
                whyAsk={t('expected_harvest_hint', 'Leave empty to auto-estimate from your crop duration & sowing date.')}
              />
            </div>

            {!form.varietyId && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5 text-amber-700" />
                <span>
                  {t('variety_notice', 'Without a specific variety selected, stage dates will use standard ICAR/SAU approximate timelines (±5–10 days depending on weather & seed variety).')}
                </span>
              </div>
            )}

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3 font-bold"
            >
              {t('generate_lifecycle_plan', 'Generate Crop Lifecycle Plan & Reminders')}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
