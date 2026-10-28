'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Droplet, CheckCircle2, AlertCircle, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface IrrigationField {
  id: string;
  name: string;
}

interface IrrigationRecord {
  id: string;
  fieldId: string;
  field: IrrigationField;
  method: string;
  durationMinutes: number | null;
  volumeL: number | null;
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

const METHOD_OPTIONS = [
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler' },
  { value: 'flood', label: 'Flood / Surface' },
  { value: 'rainfed', label: 'Rainfed' },
  { value: 'other', label: 'Other' },
];

// ----------------------------------------------------------------
// Inner Component
// ----------------------------------------------------------------
function IrrigationFormContent() {
  const searchParams = useSearchParams();
  const paramFieldId = searchParams.get('fieldId');
  const paramNotes = searchParams.get('notes');
  const paramMoisture = searchParams.get('moistureNote');

  // ------- Field list -------
  const [fields, setFields] = useState<IrrigationField[]>([]);

  // ------- Form state -------
  const [form, setForm] = useState({
    fieldId: paramFieldId || '',
    method: 'drip',
    durationMinutes: 60,
    moistureNote: (paramMoisture as 'dry' | 'moist' | 'wet') || 'dry',
    volumeL: '',    // string so the input is controllable; blank = not provided
    notes: paramNotes || '',
  });

  // Track if prefilled from IoT advisory
  const [prefilledFromIot, setPrefilledFromIot] = useState(Boolean(paramNotes || paramFieldId));

  // ------- List state -------
  const [logs, setLogs] = useState<IrrigationRecord[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ------- Submit state -------
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ------- Deletion -------
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync searchParams if they arrive after mount
  useEffect(() => {
    if (paramNotes || paramFieldId || paramMoisture) {
      setForm((prev) => ({
        ...prev,
        fieldId: paramFieldId || prev.fieldId,
        notes: paramNotes || prev.notes,
        moistureNote: (paramMoisture as any) || prev.moistureNote,
      }));
      setPrefilledFromIot(true);
    }
  }, [paramNotes, paramFieldId, paramMoisture]);

  // Load fields for selector
  useEffect(() => {
    fetch('/api/v1/fields')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) {
          setFields(json.data);
          setForm((f) => {
            if (f.fieldId && json.data.some((x: any) => x.id === f.fieldId)) {
              return f;
            }
            const matching = paramFieldId && json.data.find((x: any) => x.id === paramFieldId);
            return { ...f, fieldId: matching ? matching.id : (json.data[0]?.id || '') };
          });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramFieldId]);

  // Load irrigation history
  const loadLogs = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch('/api/v1/irrigation?limit=20&page=1');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLogs(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err: any) {
      setListError(err.message || 'Failed to load irrigation records');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Submit
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fieldId) {
      setSubmitError('Please select a field first.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // volumeL: only include in payload when the user typed a positive number
    const parsedVolume = parseFloat(form.volumeL);
    const volumePayload = !isNaN(parsedVolume) && parsedVolume > 0 ? parsedVolume : undefined;

    try {
      const res = await fetch('/api/v1/irrigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: form.fieldId,
          method: form.method,
          durationMinutes: form.durationMinutes,
          moistureNote: form.moistureNote,
          ...(volumePayload !== undefined ? { volumeL: volumePayload } : {}),
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg =
          json.error?.message ||
          Object.values(json.error?.details ?? {}).flat().join(', ') ||
          'Failed to save irrigation event';
        throw new Error(msg);
      }

      setSubmitSuccess(true);
      setForm((f) => ({ ...f, durationMinutes: 60, moistureNote: 'moist', volumeL: '', notes: '' }));
      setLogs((prev) => [json.data, ...prev]);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save irrigation event');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this irrigation record permanently?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/irrigation/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert('Could not delete record. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Irrigation Management</h1>
          <p className="text-xs text-stone-600 mt-1">Record water application and soil moisture levels</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadLogs} disabled={listLoading} aria-label="Refresh irrigation logs">
          <RefreshCw size={14} className={listLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Form card */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-stone-900 text-base">Record Irrigation Event</h3>

        {submitSuccess && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} /> Irrigation event saved.
          </div>
        )}

        {submitError && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> {submitError}
          </div>
        )}

        {prefilledFromIot && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Pre-filled from IoT Irrigation Advisory:</strong> Details have been populated from field telemetry. Review and save to record this irrigation event.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPrefilledFromIot(false)}
              className="text-[10px] text-emerald-700 hover:underline font-bold shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-4">
          {/* Field selector */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Field</label>
            <select
              id="irrigation-field-select"
              value={form.fieldId}
              onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              required
            >
              {fields.length === 0 && (
                <option value="" disabled>Loading fields…</option>
              )}
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Method */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Irrigation Method</label>
              <select
                id="irrigation-method"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                {METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Duration (Minutes)</label>
              <input
                id="irrigation-duration"
                type="number"
                min={1}
                max={1440}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              />
            </div>
          </div>

          {/* Volume — optional; blank = not provided; never fabricated */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">
              Water Volume (Litres) <span className="text-stone-400 font-normal">— optional</span>
            </label>
            <input
              id="irrigation-volume"
              type="number"
              min={0}
              step={0.1}
              placeholder="Leave blank if unknown"
              value={form.volumeL}
              onChange={(e) => setForm({ ...form, volumeL: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            />
            <p className="text-[10px] text-stone-400">Only enter if you measured or estimated the actual volume applied.</p>
          </div>

          {/* Moisture note */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Farmer Soil Moisture Note</label>
            <div className="grid grid-cols-3 gap-3">
              {(['dry', 'moist', 'wet'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  id={`irrigation-moisture-${m}`}
                  onClick={() => setForm({ ...form, moistureNote: m })}
                  className={`p-3 border rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    form.moistureNote === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-stone-50 border-stone-300 text-stone-700'
                  }`}
                >
                  {m} Soil
                </button>
              ))}
            </div>
          </div>

          {/* Notes — optional */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">
              Notes <span className="text-stone-400 font-normal">— optional</span>
            </label>
            <textarea
              id="irrigation-notes"
              rows={2}
              placeholder="Any additional observations about this irrigation event..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F] resize-none"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={submitting} disabled={submitting}>
            <Droplet size={16} className="mr-2" /> Log Irrigation Event
          </Button>
        </form>
      </Card>

      {/* History */}
      <div className="space-y-3">
        <h3 className="font-bold text-stone-900 text-base">
          Irrigation History
          {meta && (
            <span className="text-xs font-normal text-stone-500 ml-2">({meta.total} total)</span>
          )}
        </h3>

        {listLoading && (
          <div className="flex items-center justify-center py-10 text-stone-500 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading records...
          </div>
        )}

        {!listLoading && listError && (
          <Card className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} /> {listError}
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs}>Retry</Button>
          </Card>
        )}

        {!listLoading && !listError && logs.length === 0 && (
          <Card className="p-6 text-center text-stone-500 text-sm">
            <Droplet size={28} className="mx-auto mb-2 text-stone-300" />
            No irrigation events logged yet. Submit the form above to start tracking.
          </Card>
        )}

        {!listLoading && !listError && logs.map((log) => (
          <Card key={log.id} className="p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold text-stone-900 capitalize">{log.method} Irrigation</span>
                <ProvenanceChip
                  type={log.source === 'sensor_advisory' || log.source === 'iot' ? 'measured' : 'user_entered'}
                  size="xs"
                  timestamp={log.irrigatedAt}
                />
              </div>
              <p className="text-xs text-stone-500">
                {log.field?.name && <><span className="font-medium">{log.field.name}</span> · </>}
                {log.durationMinutes != null && <>Duration: {log.durationMinutes} mins · </>}
                {log.volumeL != null && <>Volume: {log.volumeL}L · </>}
                Soil: <strong className="capitalize">{log.moistureNote ?? '—'}</strong>
              </p>
              {log.notes && <p className="text-[10px] text-stone-400 mt-0.5 truncate">{log.notes}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-[10px] text-stone-400 font-semibold">
                {new Date(log.irrigatedAt).toLocaleString()}
              </span>
              <button
                aria-label="Delete irrigation record"
                onClick={() => handleDelete(log.id)}
                disabled={deletingId === log.id}
                className="text-stone-400 hover:text-red-600 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function IrrigationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-stone-500">
          Loading irrigation management...
        </div>
      }
    >
      <IrrigationFormContent />
    </Suspense>
  );
}
