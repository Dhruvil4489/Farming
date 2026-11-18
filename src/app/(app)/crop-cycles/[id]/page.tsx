'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sprout,
  Calendar,
  CheckCircle2,
  Trash2,
  MapPin,
  Clock,
} from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CropStageBar } from '@/components/domain/CropStageBar';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'sown', label: 'Sown' },
  { value: 'growing', label: 'Growing' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruiting', label: 'Fruiting / Pod Stage' },
  { value: 'harvest_ready', label: 'Ready to Harvest' },
  { value: 'harvested', label: 'Harvested' },
  { value: 'completed', label: 'Completed' },
];

export default function CropCycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notice, setNotice] = useState('');

  const loadCycle = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/crop-cycles/${id}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Crop cycle not found.');
      setCycle(json.data);
    } catch (err: any) {
      setError(err.message || 'Unable to load crop cycle.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycle();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/crop-cycles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Could not update status.');
      setNotice('Crop stage status updated.');
      setTimeout(() => setNotice(''), 3000);
      await loadCycle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove this crop cycle from your records?')) return;
    const res = await fetch(`/api/v1/crop-cycles/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/crops');
  };

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error}
      onRetry={loadCycle}
    >
      {cycle && (
        <div className="space-y-6">
          <Link
            href="/crops"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={15} /> Back to Crops & Cycles
          </Link>

          {notice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#2F7D4F]" /> {notice}
            </div>
          )}

          {/* Header */}
          <Card className="p-6 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: cycle.crop?.displayColor || '#2F7D4F' }}
                >
                  <Sprout size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-[#143D2A]">
                    {cycle.crop?.name || cycle.customCropName || 'Crop Cycle'}
                  </h1>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-[#2F7D4F]" />
                    Field: <strong>{cycle.field?.name}</strong>
                    {cycle.field?.farm?.name ? ` • ${cycle.field.farm.name}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Crop Cycle Status"
                  value={cycle.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  className="text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-stone-200/70 text-xs">
              <div>
                <span className="text-stone-500 flex items-center gap-1">
                  <Calendar size={12} /> Sowing Date
                </span>
                <strong className="text-stone-900 text-sm block mt-0.5">
                  {cycle.sowingDate ? new Date(cycle.sowingDate).toLocaleDateString('en-IN') : 'Not set'}
                </strong>
              </div>
              <div>
                <span className="text-stone-500 flex items-center gap-1">
                  <Clock size={12} /> Expected Harvest
                </span>
                <strong className="text-stone-900 text-sm block mt-0.5">
                  {cycle.expectedHarvestDate
                    ? new Date(cycle.expectedHarvestDate).toLocaleDateString('en-IN')
                    : 'Estimated automatically'}
                </strong>
              </div>
              <div>
                <span className="text-stone-500 block">Irrigation</span>
                <strong className="text-stone-900 text-sm capitalize block mt-0.5">
                  {cycle.irrigationType || cycle.field?.irrigationType || 'Drip'}
                </strong>
              </div>
            </div>

            {cycle.stages?.length > 0 && (
              <div className="pt-2">
                <CropStageBar
                  stages={cycle.stages.map((st: any) => ({
                    id: st.id,
                    name: st.nameSnapshot,
                    status: st.status,
                  }))}
                />
              </div>
            )}
          </Card>

          {/* Stage-by-Stage Timeline */}
          <Card className="p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-extrabold text-[#143D2A]">Growth Stage Timeline</h2>
            {!cycle.stages || cycle.stages.length === 0 ? (
              <p className="text-xs text-stone-500">
                Growth stages will appear here for master catalog crops.
              </p>
            ) : (
              <div className="space-y-3">
                {cycle.stages.map((stage: any, idx: number) => (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      stage.status === 'current'
                        ? 'bg-emerald-50 border-emerald-300'
                        : stage.status === 'done'
                        ? 'bg-stone-50 border-stone-200 opacity-80'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                          stage.status === 'current'
                            ? 'bg-[#2F7D4F] text-white'
                            : stage.status === 'done'
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">{stage.nameSnapshot}</h3>
                        <p className="text-[11px] text-stone-500">
                          {stage.startDate
                            ? new Date(stage.startDate).toLocaleDateString('en-IN')
                            : '—'}{' '}
                          to{' '}
                          {stage.endDate
                            ? new Date(stage.endDate).toLocaleDateString('en-IN')
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase self-start sm:self-center ${
                        stage.status === 'current'
                          ? 'bg-[#2F7D4F] text-white'
                          : stage.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </DataState>
  );
}
