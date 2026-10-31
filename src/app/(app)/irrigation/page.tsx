'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Droplet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Edit2,
  Eye,
  Calendar,
  Clock,
  Filter,
  Search,
  Sparkles,
  Info,
  CloudRain,
  ChevronRight,
  X,
  Layers,
  Thermometer,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { useI18n } from '@/providers/I18nProvider';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface IrrigationField {
  id: string;
  name: string;
  farm?: { name: string; id: string };
  cropCycles?: Array<{ id: string; customCropName?: string; crop?: { slug: string } }>;
}

interface IrrigationRecord {
  id: string;
  fieldId: string;
  field: { id: string; name: string };
  cropCycleId?: string | null;
  cropCycle?: { id: string; customCropName?: string; crop?: { slug: string } } | null;
  method: string;
  durationMinutes: number | null;
  volumeL: number | null;
  waterSource: string | null;
  moistureNote: string | null;
  notes: string | null;
  irrigatedAt: string;
  source: string;
}

interface ApiMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface AdvisoryData {
  fieldId: string;
  fieldName: string;
  cropName: string;
  hasSensor: boolean;
  currentMoisturePct: number | null;
  sensorTimestamp: string | null;
  thresholds: {
    low: number;
    optimal: number;
    high: number;
  };
  lastIrrigation: {
    irrigatedAt: string;
    method: string;
    durationMinutes: number | null;
    volumeL: number | null;
    daysAgo: number | null;
  } | null;
  weather: {
    rainForecastMm: number;
    isRainForecasted: boolean;
  };
  advisory: {
    action: 'irrigate_now' | 'delay_irrigation' | 'sufficient_moisture' | 'monitor';
    urgency: 'high' | 'medium' | 'low';
    overIrrigationRisk: 'low' | 'moderate' | 'high';
    recommendedTiming: string;
    estimatedWaterLitres: number | null;
    reason: string;
  };
}

const METHOD_OPTIONS = [
  { value: 'drip', key: 'irrigation_method_drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', key: 'irrigation_method_sprinkler', label: 'Sprinkler Irrigation' },
  { value: 'flood', key: 'irrigation_method_flood', label: 'Flood / Surface' },
  { value: 'furrow', key: 'irrigation_method_furrow', label: 'Furrow Irrigation' },
  { value: 'manual', key: 'irrigation_method_manual', label: 'Manual Watering' },
  { value: 'rainfed', key: 'irrigation_method_rainfed', label: 'Rainfed / Natural' },
  { value: 'other', key: 'irrigation_method_other', label: 'Other Method' },
];

function IrrigationContent() {
  const { t, formatDate, formatNumber } = useI18n();
  const searchParams = useSearchParams();
  const paramFieldId = searchParams.get('fieldId');
  const paramNotes = searchParams.get('notes');
  const paramMoisture = searchParams.get('moistureNote');

  // Fields
  const [fields, setFields] = useState<IrrigationField[]>([]);

  // Form State
  const [form, setForm] = useState({
    fieldId: paramFieldId || '',
    method: 'drip',
    durationMinutes: 60,
    volumeL: '',
    waterSource: '',
    moistureNote: paramMoisture || 'moist',
    notes: paramNotes || '',
    irrigatedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
  });

  // History state
  const [logs, setLogs] = useState<IrrigationRecord[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Filters
  const [filterFieldId, setFilterFieldId] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Advisory state
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);

  // Modals
  const [editingRecord, setEditingRecord] = useState<IrrigationRecord | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [detailRecord, setDetailRecord] = useState<IrrigationRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load fields
  useEffect(() => {
    fetch('/api/v1/fields')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) {
          setFields(json.data);
          if (json.data.length > 0 && !form.fieldId) {
            const initialId = paramFieldId || json.data[0].id;
            setForm((f) => ({ ...f, fieldId: initialId }));
          }
        }
      })
      .catch(() => { });
  }, [paramFieldId]);

  // Load smart irrigation advisory when selected field changes
  useEffect(() => {
    if (!form.fieldId) return;
    setAdvisoryLoading(true);
    fetch(`/api/v1/irrigation/advisory?fieldId=${encodeURIComponent(form.fieldId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setAdvisory(json.data);
        } else {
          setAdvisory(null);
        }
      })
      .catch(() => setAdvisory(null))
      .finally(() => setAdvisoryLoading(false));
  }, [form.fieldId]);

  // Load logs with filtering and pagination
  const loadLogs = useCallback(
    async (page = 1) => {
      setListLoading(true);
      setListError(null);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: '15',
        });
        if (filterFieldId) query.set('field_id', filterFieldId);
        if (filterMethod && filterMethod !== 'all') query.set('method', filterMethod);
        if (filterFromDate) query.set('from_date', filterFromDate);
        if (filterToDate) query.set('to_date', filterToDate);

        const res = await fetch(`/api/v1/irrigation?${query.toString()}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error?.message || `HTTP ${res.status}`);
        }
        const json = await res.json();
        setLogs(json.data ?? []);
        setMeta(json.meta ?? null);
        setCurrentPage(page);
      } catch (err: any) {
        setListError(err.message || 'Failed to load irrigation records');
      } finally {
        setListLoading(false);
      }
    },
    [filterFieldId, filterMethod, filterFromDate, filterToDate]
  );

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  // Handle Form Submit
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fieldId) {
      setSubmitError('Please select a target field plot.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const parsedVolume = parseFloat(form.volumeL);
    const volumePayload = !isNaN(parsedVolume) && parsedVolume > 0 ? parsedVolume : undefined;

    try {
      const res = await fetch('/api/v1/irrigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: form.fieldId,
          method: form.method,
          durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
          irrigatedAt: form.irrigatedAt ? new Date(form.irrigatedAt).toISOString() : undefined,
          moistureNote: form.moistureNote || undefined,
          waterSource: form.waterSource.trim() || undefined,
          volumeL: volumePayload,
          notes: form.notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to save irrigation event');
      }

      setSubmitSuccess(true);
      setForm((prev) => ({
        ...prev,
        volumeL: '',
        notes: '',
        irrigatedAt: new Date().toISOString().slice(0, 16),
      }));
      loadLogs(1);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save irrigation event');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Record
  const handleDelete = async (id: string) => {
    if (!confirm(t('irrigation_delete_confirm', 'Delete this irrigation record permanently?'))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/irrigation/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setLogs((prev) => prev.filter((l) => l.id !== id));
      if (meta) setMeta({ ...meta, total: Math.max(0, meta.total - 1) });
    } catch {
      alert('Could not delete record. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Open Edit Modal
  const openEdit = (log: IrrigationRecord) => {
    setEditingRecord(log);
    setEditForm({
      method: log.method,
      durationMinutes: log.durationMinutes || 60,
      volumeL: log.volumeL != null ? String(log.volumeL) : '',
      waterSource: log.waterSource || '',
      moistureNote: log.moistureNote || '',
      notes: log.notes || '',
      irrigatedAt: log.irrigatedAt ? new Date(log.irrigatedAt).toISOString().slice(0, 16) : '',
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const parsedVolume = parseFloat(editForm.volumeL);
    const volumePayload = !isNaN(parsedVolume) && parsedVolume > 0 ? parsedVolume : null;

    try {
      const res = await fetch(`/api/v1/irrigation/${editingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: editForm.method,
          durationMinutes: editForm.durationMinutes ? Number(editForm.durationMinutes) : null,
          volumeL: volumePayload,
          waterSource: editForm.waterSource.trim() || null,
          moistureNote: editForm.moistureNote || null,
          notes: editForm.notes.trim() || null,
          irrigatedAt: editForm.irrigatedAt ? new Date(editForm.irrigatedAt).toISOString() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Update failed');

      setLogs((prev) => prev.map((l) => (l.id === editingRecord.id ? json.data : l)));
      setEditingRecord(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update record');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#143D2A] bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Droplet size={12} className="text-[#2F7D4F]" />
              Water Scheduling Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#143D2A] tracking-tight">
            {t('irrigation_title', 'Irrigation Management & Water Logging')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            {t(
              'irrigation_subtitle',
              'Log field water applications, track irrigation history, and review smart water requirement recommendations.'
            )}
          </p>
        </div>
      </div>

      {/* Top Grid: Smart Advisory & Logging Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Log Irrigation Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 rounded-3xl space-y-5 border border-stone-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Droplet size={18} className="text-[#2F7D4F]" />
                {t('irrigation_log_event_title', 'Log Irrigation Event')}
              </h3>
              <ProvenanceChip
                type="user_entered"
                label="Farmer Logged"
                source="Manual Irrigation Log"
              />
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field Selection */}
                <div className="space-y-1">
                  <label htmlFor="irrigation-field-select" className="text-xs font-semibold text-stone-700 block">
                    {t('irrigation_field_label', 'Field Plot *')}
                  </label>
                  <select
                    id="irrigation-field-select"
                    value={form.fieldId}
                    onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  >
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.farm?.name || 'Farm'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Irrigation Method */}
                <div className="space-y-1">
                  <label htmlFor="irrigation-method-select" className="text-xs font-semibold text-stone-700 block">
                    {t('irrigation_method_label', 'Irrigation Method *')}
                  </label>
                  <select
                    id="irrigation-method-select"
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  >
                    {METHOD_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {t(m.key, m.label)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label htmlFor="irrigation-duration" className="text-xs font-semibold text-stone-700 block">
                    {t('irrigation_duration_label', 'Duration (Minutes) *')}
                  </label>
                  <input
                    id="irrigation-duration"
                    type="number"
                    min="1"
                    max="1440"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  />
                </div>

                {/* Optional Water Volume */}
                <div className="space-y-1">
                  <label htmlFor="irrigation-volume" className="text-xs font-semibold text-stone-700 block">
                    {t('irrigation_volume_label', 'Water Volume (Litres - Optional)')}
                  </label>
                  <input
                    id="irrigation-volume"
                    type="number"
                    placeholder="e.g. 15000"
                    value={form.volumeL}
                    onChange={(e) => setForm({ ...form, volumeL: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  />
                  <p className="text-[10px] text-stone-400">
                    {t('irrigation_volume_hint', 'Leave blank if unmetered. Volume is never guessed.')}
                  </p>
                </div>

                {/* Moisture condition before */}
                <div className="space-y-1">
                  <label htmlFor="irrigation-moisture-select" className="text-xs font-semibold text-stone-700 block">
                    {t('irrigation_moisture_before_label', 'Soil Moisture Condition Before')}
                  </label>
                  <select
                    id="irrigation-moisture-select"
                    value={form.moistureNote}
                    onChange={(e) => setForm({ ...form, moistureNote: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  >
                    <option value="dry">{t('irrigation_moisture_dry', 'Dry (Cracked / Dusty)')}</option>
                    <option value="moist">{t('irrigation_moisture_moist', 'Moist (Loose ball, not sticky)')}</option>
                    <option value="wet">{t('irrigation_moisture_wet', 'Wet (Muddy / Saturated)')}</option>
                  </select>
                </div>

                {/* Date & Time */}
                <div className="space-y-1">
                  <label htmlFor="irrigation-datetime" className="text-xs font-semibold text-stone-700 block">
                    {t('irrigation_date_label', 'Irrigation Date & Time')}
                  </label>
                  <input
                    id="irrigation-datetime"
                    type="datetime-local"
                    value={form.irrigatedAt}
                    onChange={(e) => setForm({ ...form, irrigatedAt: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  />
                </div>
              </div>

              {/* Water source & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="irrigation-source" className="text-xs font-semibold text-stone-700 block">
                    {t('irrigation_water_source_label', 'Water Source (Optional)')}
                  </label>
                  <input
                    id="irrigation-source"
                    type="text"
                    placeholder={t('irrigation_water_source_placeholder', 'e.g. Borewell #2, Canal, Drip Tank')}
                    value={form.waterSource}
                    onChange={(e) => setForm({ ...form, waterSource: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="irrigation-notes" className="text-xs font-semibold text-stone-700 block">
                    {t('irrigation_notes_label', 'Farmer Notes (Optional)')}
                  </label>
                  <input
                    id="irrigation-notes"
                    type="text"
                    placeholder={t('irrigation_notes_placeholder', 'e.g. Added soluble 19:19:19 via fertigation venturi')}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 text-sm font-bold bg-[#143D2A] hover:bg-[#0F2D1F] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      {t('irrigation_btn_saving', 'Recording Water Application...')}
                    </>
                  ) : (
                    <>
                      <Droplet size={16} className="mr-2 text-cyan-300" />
                      {t('irrigation_btn_save', 'Save Irrigation Event')}
                    </>
                  )}
                </Button>
              </div>

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#143D2A] flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#2F7D4F] shrink-0" />
                  <span>Irrigation application saved successfully to permanent farm records!</span>
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Right Column: Smart Irrigation Advisory Panel (1 Col) */}
        <div className="space-y-4">
          <Card className="p-6 rounded-3xl space-y-4 border border-stone-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Sparkles size={16} className="text-[#2F7D4F]" />
                {t('irrigation_advisory_title', 'Smart Irrigation Recommendations')}
              </h3>
              {advisoryLoading && <RefreshCw size={13} className="animate-spin text-stone-400" />}
            </div>

            {advisory ? (
              <div className="space-y-3.5 text-xs">
                {/* Action Badge */}
                <div className="p-3.5 rounded-2xl border space-y-1.5 bg-stone-50 border-stone-200/80">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    {t('irrigation_advisory_rec_title', 'Recommended Action')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${advisory.advisory.action === 'irrigate_now'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : advisory.advisory.action === 'delay_irrigation'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : advisory.advisory.action === 'sufficient_moisture'
                              ? 'bg-emerald-100 text-[#143D2A] border-emerald-300'
                              : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                    >
                      {advisory.advisory.action === 'irrigate_now'
                        ? 'IRRIGATION RECOMMENDED'
                        : advisory.advisory.action === 'delay_irrigation'
                          ? 'DELAY IRRIGATION'
                          : advisory.advisory.action === 'sufficient_moisture'
                            ? 'MOISTURE SUFFICIENT'
                            : 'CONTINUE MONITORING'}
                    </span>
                  </div>
                  <p className="text-stone-700 leading-relaxed pt-1">
                    {advisory.advisory.reason}
                  </p>
                </div>

                {/* Water Need Estimate */}
                {advisory.advisory.estimatedWaterLitres && (
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-cyan-50/60 border border-cyan-200">
                    <span className="text-stone-700 font-semibold">{t('irrigation_advisory_water_est', 'Estimated Water Need')}:</span>
                    <strong className="text-cyan-900 font-mono">
                      ~{formatNumber(advisory.advisory.estimatedWaterLitres)} Litres
                    </strong>
                  </div>
                )}

                {/* Best Timing */}
                <div className="space-y-1">
                  <span className="font-semibold text-stone-700 block flex items-center gap-1.5">
                    <Clock size={13} className="text-[#2F7D4F]" />
                    {t('irrigation_advisory_timing', 'Recommended Timing')}:
                  </span>
                  <p className="text-stone-600 pl-4">{advisory.advisory.recommendedTiming}</p>
                </div>

                {/* Rainfall Impact */}
                <div className="space-y-1">
                  <span className="font-semibold text-stone-700 block flex items-center gap-1.5">
                    <CloudRain size={13} className="text-sky-600" />
                    {t('irrigation_advisory_rain_factor', 'Rain Forecast Impact')}:
                  </span>
                  <p className="text-stone-600 pl-4">
                    {advisory.weather.isRainForecasted
                      ? `Rainfall predicted (${advisory.weather.rainForecastMm}mm). Postpone irrigation.`
                      : 'No significant rainfall predicted in the next 48h.'}
                  </p>
                </div>

                {/* Over-irrigation Risk */}
                <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-[11px]">
                  <span className="text-stone-500">{t('irrigation_advisory_risk', 'Over-Irrigation Risk')}:</span>
                  <span
                    className={`font-bold uppercase ${advisory.advisory.overIrrigationRisk === 'high'
                        ? 'text-rose-700'
                        : advisory.advisory.overIrrigationRisk === 'moderate'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                  >
                    {advisory.advisory.overIrrigationRisk}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic text-center py-4">
                Select a field to generate real-time soil moisture and crop water recommendations.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Section: Irrigation History with Filtering & Pagination */}
      <Card className="p-6 rounded-3xl space-y-4 border border-stone-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Calendar size={18} className="text-[#2F7D4F]" />
              {t('irrigation_history_title', 'Irrigation History Log')}
            </h3>
            <span className="text-xs text-stone-500">
              {meta ? `${meta.total} irrigation events recorded` : 'Loading records...'}
            </span>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Field Filter */}
            <select
              value={filterFieldId}
              onChange={(e) => setFilterFieldId(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-medium"
            >
              <option value="">{t('all_fields', 'All Fields')}</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* Method Filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-medium"
            >
              <option value="all">{t('irrigation_filter_method', 'All Methods')}</option>
              {METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {t(m.key, m.label)}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadLogs(1)}
              className="text-xs h-8 cursor-pointer"
            >
              <RefreshCw size={13} className="mr-1 text-stone-500" />
              {t('refresh', 'Refresh')}
            </Button>
          </div>
        </div>

        {listError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>{listError}</span>
          </div>
        )}

        {listLoading ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-[#2F7D4F]" />
            <p className="text-xs">{t('loading', 'Loading data...')}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Droplet size={24} />
            </div>
            <h4 className="text-sm font-bold text-stone-800">
              {t('irrigation_history_empty', 'No irrigation events recorded yet for this field.')}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Use the form above to record your water applications, track flow volumes, and monitor soil moisture recovery.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-500 font-bold uppercase tracking-wider">
                  <th className="pb-2 pr-3">{t('date', 'Date & Time')}</th>
                  <th className="pb-2 pr-3">{t('fields', 'Field Plot')}</th>
                  <th className="pb-2 pr-3">{t('crops', 'Crop')}</th>
                  <th className="pb-2 pr-3">Method</th>
                  <th className="pb-2 pr-3">Duration</th>
                  <th className="pb-2 pr-3">Volume</th>
                  <th className="pb-2 pr-3">Soil Moisture</th>
                  <th className="pb-2 pr-3">Notes</th>
                  <th className="pb-2 text-right">{t('actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="py-3 pr-3 font-mono text-stone-600 whitespace-nowrap">
                      {formatDate(log.irrigatedAt, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 pr-3 font-bold text-stone-900">{log.field?.name}</td>
                    <td className="py-3 pr-3 text-stone-700">
                      {log.cropCycle?.customCropName || log.cropCycle?.crop?.slug || 'General'}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="capitalize font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-mono">{log.durationMinutes ? `${log.durationMinutes}m` : '—'}</td>
                    <td className="py-3 pr-3 font-mono font-semibold text-[#143D2A]">
                      {log.volumeL != null ? `${formatNumber(log.volumeL)} L` : '—'}
                    </td>
                    <td className="py-3 pr-3">
                      {log.moistureNote ? (
                        <span className="capitalize text-stone-600">{log.moistureNote}</span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-stone-600 max-w-[180px] truncate" title={log.notes || ''}>
                      {log.notes || '—'}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailRecord(log)}
                          className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(log)}
                          className="text-stone-400 hover:text-[#2F7D4F] p-1 cursor-pointer"
                          title={t('edit', 'Edit')}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={deletingId === log.id}
                          className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                          title={t('delete', 'Delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {meta && meta.total_pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
                <span className="text-stone-500">
                  Page {meta.page} of {meta.total_pages} ({meta.total} records)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => loadLogs(meta.page - 1)}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.total_pages}
                    onClick={() => loadLogs(meta.page + 1)}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {editingRecord && editForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 rounded-3xl bg-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Edit2 size={16} className="text-[#2F7D4F]" />
                {t('irrigation_edit_modal_title', 'Edit Irrigation Record')}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="edit-irrigation-method" className="font-semibold text-stone-700 block">Method</label>
                  <select
                    id="edit-irrigation-method"
                    value={editForm.method}
                    onChange={(e) => setEditForm({ ...editForm, method: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                  >
                    {METHOD_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-irrigation-duration" className="font-semibold text-stone-700 block">Duration (min)</label>
                  <input
                    id="edit-irrigation-duration"
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-irrigation-volume" className="font-semibold text-stone-700 block">Volume (L)</label>
                  <input
                    id="edit-irrigation-volume"
                    type="number"
                    value={editForm.volumeL}
                    onChange={(e) => setEditForm({ ...editForm, volumeL: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-irrigation-datetime" className="font-semibold text-stone-700 block">Date & Time</label>
                  <input
                    id="edit-irrigation-datetime"
                    type="datetime-local"
                    value={editForm.irrigatedAt}
                    onChange={(e) => setEditForm({ ...editForm, irrigatedAt: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-irrigation-source" className="font-semibold text-stone-700 block">Water Source</label>
                <input
                  id="edit-irrigation-source"
                  type="text"
                  value={editForm.waterSource}
                  onChange={(e) => setEditForm({ ...editForm, waterSource: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-irrigation-notes" className="font-semibold text-stone-700 block">Notes</label>
                <input
                  id="edit-irrigation-notes"
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRecord(null)}
                  className="cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#143D2A] text-white hover:bg-[#0F2D1F] cursor-pointer"
                >
                  {t('save', 'Save Changes')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Detail View Modal */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 rounded-3xl bg-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Droplet size={18} className="text-[#2F7D4F]" />
                Irrigation Event Details
              </h3>
              <button
                onClick={() => setDetailRecord(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Field Plot:</span>
                <strong className="text-stone-900">{detailRecord.field?.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Crop Cycle:</span>
                <strong className="text-stone-900">
                  {detailRecord.cropCycle?.customCropName || detailRecord.cropCycle?.crop?.slug || 'General Plot'}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Method:</span>
                <strong className="capitalize text-stone-900">{detailRecord.method}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Duration:</span>
                <strong className="text-stone-900">{detailRecord.durationMinutes ? `${detailRecord.durationMinutes} minutes` : '—'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Water Volume:</span>
                <strong className="text-[#143D2A] font-mono">
                  {detailRecord.volumeL != null ? `${formatNumber(detailRecord.volumeL)} Litres` : 'Unmetered'}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Water Source:</span>
                <strong className="text-stone-900">{detailRecord.waterSource || '—'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Timestamp:</span>
                <strong className="text-stone-900 font-mono">
                  {formatDate(detailRecord.irrigatedAt, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </div>
              {detailRecord.notes && (
                <div className="pt-1">
                  <span className="text-stone-500 block mb-1">Farmer Notes:</span>
                  <p className="p-2.5 bg-stone-50 rounded-xl text-stone-800 border border-stone-200">
                    {detailRecord.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailRecord(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function IrrigationPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-stone-400">
          <RefreshCw size={24} className="animate-spin mx-auto text-[#2F7D4F]" />
          <p className="text-xs mt-2">Loading irrigation management...</p>
        </div>
      }
    >
      <IrrigationContent />
    </Suspense>
  );
}
