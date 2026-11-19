'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Sprout, Plus, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CropStageBar } from '@/components/domain/CropStageBar';
import { useI18n } from '@/providers/I18nProvider';

export default function CropsPage() {
  const { t, locale } = useI18n();
  const [cycles, setCycles] = useState<any[]>([]);
  const [cropsCatalog, setCropsCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCropsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cycRes, cropRes] = await Promise.all([
        fetch(`/api/v1/crop-cycles?lang=${locale}`),
        fetch(`/api/v1/crops?lang=${locale}`),
      ]);
      if (!cycRes.ok || !cropRes.ok) {
        throw new Error(`Failed to load crop records (HTTP ${cycRes.status}/${cropRes.status})`);
      }
      const [cycJson, cropJson] = await Promise.all([cycRes.json(), cropRes.json()]);
      setCycles(cycJson.data || []);
      setCropsCatalog(cropJson.data || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load crop cycles');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchCropsData();
  }, [fetchCropsData]);

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error || undefined}
      onRetry={fetchCropsData}
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">
              {t('crop_cycles', 'Crops & Cycles')}
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              {t('crop_cycles_desc', 'Track crop stage timelines and stage advisories')}
            </p>
          </div>
          <Link href="/crops/new-cycle">
            <Button>
              <Plus size={16} className="mr-1" /> {t('start_crop_cycle', 'Start Crop Cycle')}
            </Button>
          </Link>
        </div>

        {/* Active Cycles Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">{t('active_crop_cycles', 'Active Crop Cycles')}</h2>
          {cycles.length === 0 ? (
            <DataState
              status="empty"
              emptyTitle={t('no_active_crop_cycles', 'No active crop cycles')}
              emptyDescription={t('no_active_cycles_desc', 'Start a crop cycle in one of your fields to generate stage timelines and task recommendations.')}
              emptyAction={
                <Link href="/crops/new-cycle">
                  <Button size="sm">{t('start_first_cycle', 'Start First Crop Cycle')}</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cycles.map((cycle) => (
                <Card key={cycle.id} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: cycle.crop?.displayColor || '#2F7D4F' }}
                      >
                        <Sprout size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-base">
                          {cycle.crop?.name || cycle.customCropName}
                        </h3>
                        <p className="text-xs text-stone-500">{t('field', 'Field')}: {cycle.field?.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                      {t(`stage_${cycle.status}`, cycle.status)}
                    </span>
                  </div>

                  <CropStageBar
                    stages={cycle.stages?.map((st: any) => ({
                      id: st.id,
                      name: st.nameSnapshot,
                      status: st.status,
                    }))}
                  />

                  <div className="flex items-center justify-between pt-2 text-xs border-t border-stone-200">
                    <span className="text-stone-500">
                      {t('sowing_date', 'Sown')}:{' '}
                      <strong className="text-stone-800">
                        {cycle.sowingDate
                          ? new Date(cycle.sowingDate).toLocaleDateString(locale === 'hi' ? 'hi-IN' : locale === 'gu' ? 'gu-IN' : 'en-IN')
                          : 'N/A'}
                      </strong>
                    </span>
                    <Link href={`/crop-cycles/${cycle.id}`}>
                      <Button size="sm" variant="outline">
                        {t('view_timeline', 'View Timeline')} <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Master Crop Catalog Showcase */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <h2 className="text-lg font-bold text-stone-900">{t('supported_crops', 'Supported Master Crops')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cropsCatalog.map((crop) => (
              <Card key={crop.id} className="p-4 space-y-2 text-center">
                <div
                  className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: crop.displayColor }}
                >
                  <Sprout size={20} />
                </div>
                <h4 className="font-bold text-stone-900 text-sm">{crop.name}</h4>
                <p className="text-[11px] text-stone-500">{crop.typicalDurationDays} {t('days_duration', 'Days Duration')}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DataState>
  );
}
