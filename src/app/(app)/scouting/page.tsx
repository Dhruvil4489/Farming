'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Eye, Camera, CheckCircle2, AlertCircle, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

// ----------------------------------------------------------------
// Types matching the API response shape
// ----------------------------------------------------------------
interface ObservationField {
  id: string;
  name: string;
}

interface Observation {
  id: string;
  fieldId: string;
  field: ObservationField;
  category: string;
  severity: number;
  notes: string;
  observedAt: string;
  status: string;
  source: string;
  createdAt: string;
}

interface ApiMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const CATEGORY_OPTIONS = [
  { value: 'pest', label: 'Pest Sighting (कीट)' },
  { value: 'disease', label: 'Disease Symptom (रोग)' },
  { value: 'nutrient_issue', label: 'Nutrient / Yellowing (पोषण)' },
  { value: 'weed', label: 'Weeds (खरपतवार)' },
  { value: 'irrigation_issue', label: 'Irrigation / Moisture' },
  { value: 'general', label: 'General Observation' },
];

const SEVERITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Low', color: 'bg-emerald-100 text-emerald-800' },
  2: { label: 'Medium', color: 'bg-amber-100 text-amber-800' },
  3: { label: 'High', color: 'bg-red-100 text-red-800' },
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export default function ScoutingPage() {
  // ------- Form state -------
  const [fields, setFields] = useState<ObservationField[]>([]);
  const [form, setForm] = useState({
    fieldId: '',
    category: 'pest',
    severity: 1,
    notes: '',
  });

  // ------- List state -------
  const [observations, setObservations] = useState<Observation[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ------- Submit state -------
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ------- Deletion state -------
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---- Load the user's fields so the form can show a selector ----
  useEffect(() => {
    fetch('/api/v1/fields')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) {
          setFields(json.data);
          if (json.data.length > 0 && !form.fieldId) {
            setForm((f) => ({ ...f, fieldId: json.data[0].id }));
          }
        }
      })
      .catch(() => {/* non-fatal: user can still type a field ID */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Load observation history ----
  const loadObservations = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch('/api/v1/observations?limit=20&page=1');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setObservations(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err: any) {
      setListError(err.message || 'Failed to load observations');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  // ---- Submit new observation ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fieldId) {
      setSubmitError('Please select a field first.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch('/api/v1/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: form.fieldId,
          category: form.category,
          severity: form.severity,
          notes: form.notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg =
          json.error?.message ||
          Object.values(json.error?.details ?? {}).flat().join(', ') ||
          'Failed to save observation';
        throw new Error(msg);
      }

      setSubmitSuccess(true);
      setForm((f) => ({ ...f, category: 'pest', severity: 1, notes: '' }));
      // Prepend new record without refetching to avoid flash
      setObservations((prev) => [json.data, ...prev]);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save observation');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete an observation ----
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this observation permanently?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/observations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setObservations((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert('Could not delete observation. Please try again.');
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
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Field Scouting</h1>
          <p className="text-xs text-stone-600 mt-1">Record observations, pest sightings, and crop health notes</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadObservations} disabled={listLoading} aria-label="Refresh observations">
          <RefreshCw size={14} className={listLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* AI Crop Disease Screening Callout */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#143D2A] text-emerald-300 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950">Universal Crop Disease AI Engine</h4>
            <p className="text-[11px] text-emerald-800">
              Have a leaf photograph? Run computer vision screening across specialist models for Cotton, Wheat, Rice, and Horticultural Benchmark networks with explainable differential diagnostics.
            </p>
          </div>
        </div>
        <Link href="/diagnosis">
          <Button size="sm" className="bg-[#143D2A] hover:bg-[#0F2D1F] text-white text-xs h-8">
            Analyze Leaf Photo →
          </Button>
        </Link>
      </div>

      {/* Form card */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-stone-900 text-base">Log New Field Observation</h3>

        {submitSuccess && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} /> Observation saved to field history.
          </div>
        )}

        {submitError && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field selector */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Field</label>
            {fields.length > 0 ? (
              <select
                id="scouting-field-select"
                value={form.fieldId}
                onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                required
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-stone-600">No fields added yet.</span>
                <Link href="/fields/new" className="font-bold text-[#2F7D4F] hover:underline">
                  Add Your First Field →
                </Link>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Observation Category</label>
            <select
              id="scouting-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Severity Rating (1 = Low, 3 = High)</label>
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  id={`scouting-severity-${sev}`}
                  onClick={() => setForm({ ...form, severity: sev })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${form.severity === sev
                      ? 'bg-[#2F7D4F] text-white border-[#2F7D4F]'
                      : 'bg-stone-50 border-stone-300 text-stone-700'
                    }`}
                >
                  Level {sev} {sev === 3 ? '(Urgent)' : ''}
                </button>
              ))}
            </div>
          </div>

          <Input
            id="scouting-notes"
            label="Observation Notes"
            placeholder="Describe what you observed on the leaves, stem, or soil..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            required
          />

          <Button type="submit" className="w-full" isLoading={submitting} disabled={submitting}>
            <Camera size={16} className="mr-2" /> Log Observation
          </Button>
        </form>
      </Card>

      {/* History list */}
      <div className="space-y-3">
        <h3 className="font-bold text-stone-900 text-base">
          Recent Field Observations
          {meta && (
            <span className="text-xs font-normal text-stone-500 ml-2">({meta.total} total)</span>
          )}
        </h3>

        {/* Loading */}
        {listLoading && (
          <div className="flex items-center justify-center py-10 text-stone-500 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading observations...
          </div>
        )}

        {/* Error + retry */}
        {!listLoading && listError && (
          <Card className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} /> {listError}
            </div>
            <Button variant="outline" size="sm" onClick={loadObservations}>Retry</Button>
          </Card>
        )}

        {/* Empty state */}
        {!listLoading && !listError && observations.length === 0 && (
          <Card className="p-6 text-center text-stone-500 text-sm">
            <Eye size={28} className="mx-auto mb-2 text-stone-300" />
            No observations logged yet. Submit the form above to start tracking.
          </Card>
        )}

        {/* Records */}
        {!listLoading && !listError && observations.map((obs) => {
          const sev = SEVERITY_LABELS[obs.severity] ?? SEVERITY_LABELS[1];
          const catLabel = CATEGORY_OPTIONS.find((c) => c.value === obs.category)?.label ?? obs.category;
          return (
            <Card key={obs.id} className="p-4 flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#143D2A]">{catLabel}</span>
                  <span className="text-[10px] text-stone-400">•</span>
                  <span className="text-[10px] text-stone-500">{obs.field?.name ?? obs.fieldId}</span>
                  <ProvenanceChip
                    type={obs.source === 'diagnosis' ? 'model_prediction' : 'user_entered'}
                    size="xs"
                    timestamp={obs.observedAt}
                  />
                </div>
                <p className="text-xs text-stone-700 break-words">{obs.notes}</p>
                <span className="text-[10px] text-stone-400 block">
                  {new Date(obs.observedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${sev.color}`}>
                  Sev {obs.severity}
                </span>
                <button
                  aria-label="Delete observation"
                  onClick={() => handleDelete(obs.id)}
                  disabled={deletingId === obs.id}
                  className="text-stone-400 hover:text-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
