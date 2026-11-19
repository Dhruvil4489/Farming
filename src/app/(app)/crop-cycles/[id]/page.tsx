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
  AlertTriangle,
  Info,
  Wrench,
  BookOpen,
  CheckSquare,
  ShieldAlert,
  Sparkles,
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
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  const loadCycle = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/crop-cycles/${id}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Crop cycle not found.');
      setCycle(json.data);
      const currentStage = json.data?.lifecycle?.currentStage;
      if (currentStage?.id) setExpandedStageId(currentStage.id);
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
      setNotice('Crop cycle status updated.');
      setTimeout(() => setNotice(''), 3000);
      await loadCycle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const res = await fetch(`/api/v1/tasks/${taskId}/complete`, { method: 'POST' });
    if (res.ok) {
      setNotice('Task marked completed!');
      setTimeout(() => setNotice(''), 2500);
      await loadCycle();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove this crop cycle from your records?')) return;
    const res = await fetch(`/api/v1/crop-cycles/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/crops');
  };

  const lc = cycle?.lifecycle;
  const activeStage = lc?.currentStage;
  const stages = lc?.stages || [];

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
            <ArrowLeft size={15} /> Back to Crops &amp; Cycles
          </Link>

          {notice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#2F7D4F]" /> {notice}
            </div>
          )}

          {/* Header Summary Card */}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-[#143D2A]">
                      {cycle.crop?.name || cycle.customCropName || 'Crop Cycle'}
                    </h1>
                    {cycle.variety?.name && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        Variety: {cycle.variety.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-[#2F7D4F]" />
                    Field: <strong>{cycle.field?.name}</strong>
                    {cycle.field?.farm?.name ? ` • ${cycle.field.farm.name}` : ''}
                    {cycle.crop?.scientificName ? ` • ${cycle.crop.scientificName}` : ''}
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

            {/* Key Lifecycle Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-stone-200/70 text-xs">
              <div>
                <span className="text-stone-500 flex items-center gap-1">
                  <Sparkles size={12} className="text-[#2F7D4F]" /> Crop Age (DAS)
                </span>
                <strong className="text-[#143D2A] text-base block mt-0.5">
                  {lc?.isFutureSowing ? 'Planned' : `Day ${lc?.daysAfterSowing ?? 0}`}
                </strong>
                <span className="text-[10px] text-stone-500">
                  {lc?.progressPct ?? 0}% of ~{lc?.totalDurationDays ?? 120} days
                </span>
              </div>
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
                    : 'Estimated'}
                </strong>
              </div>
              <div>
                <span className="text-stone-500 block">Current Stage</span>
                <strong className="text-[#2F7D4F] text-sm block mt-0.5">
                  {activeStage?.name || cycle.status}
                </strong>
                {lc?.nextStage && (
                  <span className="text-[10px] text-stone-500">
                    Next: {lc.nextStage.name} ({lc.daysUntilNextStage}d)
                  </span>
                )}
              </div>
            </div>

            {/* Timeline accuracy disclosure */}
            {lc?.timelineNotice && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <span>{lc.timelineNotice}</span>
              </div>
            )}

            {stages.length > 0 && (
              <div className="pt-1">
                <CropStageBar
                  stages={stages.map((st: any) => ({
                    id: st.id,
                    name: st.name,
                    status: st.status,
                  }))}
                />
              </div>
            )}
          </Card>

          {/* Highlighted Current Stage Action Card */}
          {activeStage && (
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-[#143D2A] to-[#1f563a] text-white space-y-4 border-none shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    Current Active Stage • Days {activeStage.startOffsetDays}–
                    {activeStage.startOffsetDays + activeStage.durationDays}
                  </span>
                  <h2 className="text-xl font-extrabold mt-1.5">{activeStage.name}</h2>
                </div>
                <Link
                  href={`/assistant?q=${encodeURIComponent(
                    `What should I do now for my ${cycle.crop?.name} crop at Day ${lc?.daysAfterSowing ?? 0} (${activeStage.name})?`
                  )}`}
                >
                  <Button size="sm" className="bg-white text-[#143D2A] hover:bg-emerald-50 font-bold">
                    Ask AI Assistant About This Stage →
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur space-y-1">
                  <span className="font-bold text-emerald-200 uppercase text-[10px]">What To Do Now</span>
                  <p className="text-white leading-relaxed">{activeStage.whatToDo}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur space-y-1">
                  <span className="font-bold text-emerald-200 uppercase text-[10px]">Why It Matters</span>
                  <p className="text-emerald-50 leading-relaxed">{activeStage.whyImportant}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur space-y-1">
                  <span className="font-bold text-emerald-200 uppercase text-[10px]">How To Do It</span>
                  <p className="text-emerald-50 leading-relaxed">{activeStage.howToDo}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-300/30 space-y-1">
                  <span className="font-bold text-amber-200 uppercase text-[10px] flex items-center gap-1">
                    <AlertTriangle size={12} /> Precautions
                  </span>
                  <p className="text-amber-50 leading-relaxed">{activeStage.precautions}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-100 pt-1">
                <Wrench size={14} className="text-emerald-300 shrink-0" />
                <span>
                  <strong>Materials / Inputs:</strong> {activeStage.materials}
                </span>
              </div>
            </Card>
          )}

          {/* Complete Stage-by-Stage Lifecycle Roadmap */}
          <Card className="p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-extrabold text-[#143D2A]">
              Complete Crop-Specific Lifecycle Plan ({stages.length} Stages)
            </h2>
            <div className="space-y-3">
              {stages.map((stage: any, idx: number) => {
                const isOpen = expandedStageId === stage.id;
                return (
                  <div
                    key={stage.id}
                    className={`rounded-xl border transition-all ${
                      stage.status === 'current'
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : stage.status === 'done'
                          ? 'bg-stone-50 border-stone-200'
                          : 'bg-white border-stone-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedStageId(isOpen ? null : stage.id)}
                      className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left cursor-pointer"
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
                          <h3 className="font-bold text-stone-900 text-sm">{stage.name}</h3>
                          <p className="text-[11px] text-stone-500">
                            Days {stage.startOffsetDays}–{stage.startOffsetDays + stage.durationDays} •{' '}
                            {stage.startDate ? new Date(stage.startDate).toLocaleDateString('en-IN') : '—'} to{' '}
                            {stage.endDate ? new Date(stage.endDate).toLocaleDateString('en-IN') : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
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
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-stone-200/70 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-bold text-[#143D2A] block">What to do:</span>
                          <p className="text-stone-700 mt-0.5">{stage.whatToDo}</p>
                        </div>
                        <div>
                          <span className="font-bold text-[#143D2A] block">Why it matters:</span>
                          <p className="text-stone-700 mt-0.5">{stage.whyImportant}</p>
                        </div>
                        <div>
                          <span className="font-bold text-[#143D2A] block">How to do it:</span>
                          <p className="text-stone-700 mt-0.5">{stage.howToDo}</p>
                        </div>
                        <div>
                          <span className="font-bold text-amber-800 block">Precautions:</span>
                          <p className="text-amber-900 mt-0.5">{stage.precautions}</p>
                        </div>
                        <div className="md:col-span-2 text-[11px] text-stone-600 bg-white/80 p-2.5 rounded-lg border border-stone-200">
                          <strong>Materials / Checklist:</strong> {stage.materials} •{' '}
                          <span className="font-bold text-[#2F7D4F]">
                            {stage.isEssential ? 'Essential Stage' : 'Optional Advisory'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Auto-Generated Scheduled Tasks for this Cycle */}
          {cycle.tasks && cycle.tasks.length > 0 && (
            <Card className="p-6 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#143D2A] flex items-center gap-2">
                  <CheckSquare size={17} className="text-[#2F7D4F]" /> Scheduled Farming Tasks ({cycle.tasks.length})
                </h2>
                <Link href="/tasks" className="text-xs font-bold text-[#2F7D4F] hover:underline">
                  All Tasks →
                </Link>
              </div>
              <div className="space-y-2">
                {cycle.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-stone-200 bg-[#F7F8F5] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p
                        className={`font-bold ${
                          task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-900'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Due: {task.dueAt ? new Date(task.dueAt).toLocaleDateString('en-IN') : 'Flexible'} •{' '}
                        <span className="capitalize">{task.type}</span>
                      </p>
                    </div>
                    {task.status !== 'completed' ? (
                      <Button size="sm" variant="outline" onClick={() => handleCompleteTask(task.id)}>
                        Mark Done
                      </Button>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        Completed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Agronomic Reference Sheet from Indian Crop Database */}
          {cycle.crop && (cycle.crop.irrigationGuidance || cycle.crop.commonPests || cycle.crop.harvestGuidance) && (
            <Card className="p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base font-extrabold text-[#143D2A] flex items-center gap-2">
                  <BookOpen size={17} className="text-[#2F7D4F]" /> Verified Crop Agronomy Guide
                </h2>
                {cycle.crop.sourceAuthority && (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Source: {cycle.crop.sourceAuthority}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {cycle.crop.irrigationGuidance && (
                  <div className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200">
                    <strong className="text-[#143D2A] block mb-1">Irrigation Schedule</strong>
                    <p className="text-stone-700">{cycle.crop.irrigationGuidance}</p>
                  </div>
                )}
                {cycle.crop.nutrientGuidance && (
                  <div className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200">
                    <strong className="text-[#143D2A] block mb-1">Nutrient Guidance</strong>
                    <p className="text-stone-700">{cycle.crop.nutrientGuidance}</p>
                  </div>
                )}
                {cycle.crop.commonDiseases && (
                  <div className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200">
                    <strong className="text-[#143D2A] block mb-1 flex items-center gap-1">
                      <ShieldAlert size={13} className="text-amber-700" /> Watch Out: Diseases &amp; Pests
                    </strong>
                    <p className="text-stone-700">
                      <strong>Diseases:</strong> {cycle.crop.commonDiseases}
                      {cycle.crop.commonPests ? ` • Pests: ${cycle.crop.commonPests}` : ''}
                    </p>
                  </div>
                )}
                {cycle.crop.harvestGuidance && (
                  <div className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200">
                    <strong className="text-[#143D2A] block mb-1">Harvest &amp; Storage</strong>
                    <p className="text-stone-700">
                      {cycle.crop.harvestGuidance} {cycle.crop.storageGuidance || ''}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </DataState>
  );
}
