'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Grid,
  Plus,
  MapPin,
  Sprout,
  Edit2,
  Trash2,
  Eye,
  X,
  Droplets,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
} from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/providers/I18nProvider';
import { hectaresToAcres } from '@/lib/units';

interface FieldRecord {
  id: string;
  farmId: string;
  name: string;
  areaHa: number | null;
  irrigationType: string | null;
  soilType: string | null;
  status: string;
  notes: string | null;
  farm?: {
    id: string;
    name: string;
    village?: string | null;
    district?: string | null;
    state?: string | null;
  };
  cropCycles?: Array<{
    id: string;
    status: string;
    customCropName?: string | null;
    currentStageName?: string | null;
    crop?: { name?: string; slug?: string } | null;
  }>;
}

export default function FieldsPage() {
  const { t } = useI18n();
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [farms, setFarms] = useState<Array<{ id: string; name: string; village?: string; district?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

    // Detail, Edit, Delete Modal states
    const [detailField, setDetailField] = useState<FieldRecord | null>(null);
    const [editingField, setEditingField] = useState<FieldRecord | null>(null);
    const [editForm, setEditForm] = useState({
      name: '',
      farmId: '',
      areaInputValue: '',
      areaInputUnit: 'acre',
      irrigationType: 'drip',
      soilType: 'unknown',
      notes: '',
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState('');

    const [deletingField, setDeletingField] = useState<FieldRecord | null>(null);
    const [deletingBusy, setDeletingBusy] = useState(false);

    const fetchFields = useCallback(async () => {
      setLoading(true);
      setError('');
      try {
        const [fieldsRes, farmsRes] = await Promise.all([
          fetch('/api/v1/fields', { headers: { Accept: 'application/json' } }),
          fetch('/api/v1/farms', { headers: { Accept: 'application/json' } }),
        ]);

        if (fieldsRes.status === 401) {
          window.location.href = '/login?redirect=/fields';
          return;
        }

        const fieldsJson = await fieldsRes.json().catch(() => null);
        if (!fieldsRes.ok) {
          throw new Error(fieldsJson?.error?.message || 'Unable to load your fields. Please try again.');
        }
        setFields(Array.isArray(fieldsJson?.data) ? fieldsJson.data : []);

        if (farmsRes.ok) {
          const farmsJson = await farmsRes.json().catch(() => null);
          setFarms(Array.isArray(farmsJson?.data) ? farmsJson.data : []);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load your fields. Please try again.');
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchFields();
}, [fetchFields]);

const showNotice = (msg: string) => {
  setFeedback(msg);
  setTimeout(() => setFeedback(''), 3500);
};

const openEditModal = (field: FieldRecord) => {
  setEditingField(field);
  setEditError('');
  const acres = field.areaHa != null ? hectaresToAcres(field.areaHa) : null;
  setEditForm({
    name: field.name,
    farmId: field.farmId,
    areaInputValue: acres != null ? String(acres) : '',
    areaInputUnit: 'acre',
    irrigationType: field.irrigationType || 'drip',
    soilType: field.soilType || 'unknown',
    notes: field.notes || '',
  });
};

const handleSaveEdit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingField) return;
  setSavingEdit(true);
  setEditError('');
  try {
    const parsedArea = parseFloat(editForm.areaInputValue);
    const res = await fetch(`/api/v1/fields/${editingField.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        farmId: editForm.farmId,
        areaInputValue: !isNaN(parsedArea) && parsedArea > 0 ? parsedArea : null,
        areaInputUnit: editForm.areaInputUnit,
        irrigationType: editForm.irrigationType,
        soilType: editForm.soilType,
        notes: editForm.notes.trim() || null,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.error?.message || 'Could not update field.');
    }
    setEditingField(null);
    showNotice(`"${editForm.name}" updated successfully.`);
    await fetchFields();
  } catch (err: any) {
    setEditError(err.message || 'Could not update field.');
  } finally {
    setSavingEdit(false);
  }
};

const handleConfirmDelete = async () => {
  if (!deletingField) return;
  setDeletingBusy(true);
  try {
    const res = await fetch(`/api/v1/fields/${deletingField.id}`, { method: 'DELETE' });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.error?.message || 'Could not delete field.');
    }
    const deletedName = deletingField.name;
    setDeletingField(null);
    setFields((prev) => prev.filter((f) => f.id !== deletingField.id));
    showNotice(`"${deletedName}" was removed.`);
  } catch (err: any) {
    setError(err.message || 'Could not delete field.');
    setDeletingField(null);
  } finally {
    setDeletingBusy(false);
  }
};

const formatFieldArea = (areaHa: number | null) => {
  if (areaHa == null) return 'Not set';
  const acres = hectaresToAcres(areaHa);
  return `${acres} Acre`;
};

return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">
              {t('fields', 'My Fields')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              {t('fields_subtitle', 'Manage your farm plots, crops, irrigation, and soil details in one place')}
            </p>
          </div>
          <Link href="/fields/new">
              <Button className="bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl">
                <Plus size={16} className="mr-1.5" /> {t('add_field', 'Add New Field')}
              </Button>
          </Link>
            </div>

            {feedback && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#2F7D4F] shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            <DataState
              status={loading ? 'loading' : error ? 'error' : fields.length === 0 ? 'empty' : 'success'}
              errorTitle={t('status_error', 'Unable to load fields')}
              errorMessage={error}
              emptyTitle={t('fields_empty_title', 'No fields added yet.')}
              emptyDescription={t(
                'fields_empty_desc',
                'Add your first field plot to track crops, irrigation, soil health, and AI advisories.'
              )}
              emptyAction={
                <Link href="/fields/new">
                    <Button size="sm" className="bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl">
                      <Plus size={15} className="mr-1.5" /> {t('add_first_field', 'Add Your First Field')}
                    </Button>
                </Link>
              }
              onRetry={fetchFields}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {fields.map((field) => {
                  const activeCycle = field.cropCycles?.[0];
                  const locationText = [field.farm?.village, field.farm?.district]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <Card
                      key={field.id}
                      className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-4">
                        {/* Top Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 text-[#2F7D4F] flex items-center justify-center shrink-0">
                              <Grid size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-stone-900 text-base leading-snug">
                                {field.name}
                              </h3>
                              <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={12} className="text-[#2F7D4F] shrink-0" />
                                <span>
                                  {field.farm?.name || 'Farm'}
                                  {locationText ? ` • ${locationText}` : ''}
                                </span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide shrink-0 ${field.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-600'
                              }`}
                          >
                            {field.status}
                          </span>
                        </div>

                        {/* Quick Metrics */}
                        <div className="grid grid-cols-3 gap-2.5 bg-[#F7F8F5] p-3 rounded-xl border border-stone-200/70 text-xs text-center">
                          <div>
                            <span className="text-stone-500 block text-[10px] font-medium">Area</span>
                            <span className="font-bold text-stone-900">
                              {formatFieldArea(field.areaHa)}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 block text-[10px] font-medium">Irrigation</span>
                            <span className="font-bold text-stone-900 capitalize">
                              {field.irrigationType || 'Drip'}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 block text-[10px] font-medium">Soil</span>
                            <span className="font-bold text-stone-900 capitalize">
                              {field.soilType === 'unknown' ? 'Not set' : field.soilType || 'Not set'}
                            </span>
                          </div>
                        </div>

                        {/* Active Crop Strip */}
                        {activeCycle ? (
                          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Sprout size={16} className="text-[#2F7D4F] shrink-0" />
                              <div>
                                <span className="font-bold text-emerald-950 block">
                                  {activeCycle.crop?.name || activeCycle.customCropName || 'Active Crop'}
                                </span>
                                {activeCycle.currentStageName && (
                                  <span className="text-[11px] text-emerald-800">
                                    Stage: {activeCycle.currentStageName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Link
                              href={`/crop-cycles/${activeCycle.id}`}
                              className="text-[11px] font-bold text-[#2F7D4F] hover:underline"
                            >
                              Timeline →
                            </Link>
                          </div>
                        ) : (
                          <div className="p-3 bg-stone-50 rounded-xl border border-dashed border-stone-200 flex items-center justify-between text-xs">
                            <span className="text-stone-500">No active crop planted yet</span>
                            <Link
                              href="/crops/new-cycle"
                              className="font-bold text-[#2F7D4F] hover:underline"
                            >
                              + Add Crop
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Action Footer */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailField(field)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#143D2A] hover:text-[#2F7D4F] cursor-pointer"
                        >
                          <Eye size={14} /> View Details
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(field)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-emerald-50 hover:text-[#143D2A] transition-colors cursor-pointer"
                          >
                            <Edit2 size={13} /> {t('edit', 'Edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingField(field)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} /> {t('delete', 'Delete')}
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </DataState>

                    {/* Field Details Modal */}
                    {detailField && (
                      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                          <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                            <div>
                              <h3 className="text-lg font-extrabold text-[#143D2A]">{detailField.name}</h3>
                              <p className="text-xs text-stone-500">
                                {detailField.farm?.name}
                                {detailField.farm?.village ? ` • ${detailField.farm.village}` : ''}
                                {detailField.farm?.district ? `, ${detailField.farm.district}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => setDetailField(null)}
                              className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                              aria-label="Close"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200/70">
                              <span className="text-stone-500 block">Field Area</span>
                              <strong className="text-stone-900 text-sm">
                                {detailField.areaHa != null
                                  ? `${hectaresToAcres(detailField.areaHa)} Acre (${detailField.areaHa.toFixed(2)} Ha)`
                                  : 'Not specified'}
                              </strong>
                            </div>
                            <div className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200/70">
                              <span className="text-stone-500 block">Irrigation Method</span>
                              <strong className="text-stone-900 text-sm capitalize">
                                {detailField.irrigationType || 'Not set'}
                              </strong>
                            </div>
                            <div className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200/70">
                              <span className="text-stone-500 block">Soil Type</span>
                              <strong className="text-stone-900 text-sm capitalize">
                                {detailField.soilType === 'unknown' ? 'Not specified' : detailField.soilType}
                              </strong>
                            </div>
                            <div className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200/70">
                              <span className="text-stone-500 block">Current Crop</span>
                              <strong className="text-stone-900 text-sm">
                                {detailField.cropCycles?.[0]?.crop?.name ||
                                  detailField.cropCycles?.[0]?.customCropName ||
                                  'None'}
                              </strong>
                            </div>
                          </div>

                            {detailField.notes && (
                              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 text-xs">
                                <span className="font-bold text-stone-700 block mb-1">Field Notes</span>
                                <p className="text-stone-600">{detailField.notes}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 pt-2">
                              <Link
                                href={`/irrigation?fieldId=${detailField.id}`}
                                className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold text-center hover:bg-cyan-100 flex flex-col items-center gap-1"
                              >
                                <Droplets size={16} /> Irrigation
                              </Link>
                              <Link
                                href="/soil"
                                className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold text-center hover:bg-amber-100 flex flex-col items-center gap-1"
                              >
                                <Layers size={16} /> Soil Health
                              </Link>
                              <Link
                                href="/diagnosis"
                                className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold text-center hover:bg-emerald-100 flex flex-col items-center gap-1"
                              >
                                <ScanLine size={16} /> Disease AI
                              </Link>
                            </div>
                          </div>
                        </div>
      )}

                        {/* Edit Field Modal */}
                        {editingField && (
                          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
                              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                                <h3 className="text-base font-extrabold text-[#143D2A]">Edit Field</h3>
                                <button
                                  onClick={() => setEditingField(null)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 cursor-pointer"
                                  aria-label="Close"
                                >
                                  <X size={18} />
                                </button>
                              </div>

                              {editError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                                  {editError}
                                </div>
                              )}

                              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                                <div>
                                  <label className="block font-bold text-stone-700 mb-1">Field Name *</label>
                                  <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                                  />
                                </div>

                                {farms.length > 0 && (
                                  <div>
                                    <label className="block font-bold text-stone-700 mb-1">Farm</label>
                                    <select
                                      value={editForm.farmId}
                                      onChange={(e) => setEditForm({ ...editForm, farmId: e.target.value })}
                                      className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                                    >
                                      {farms.map((f) => (
                                        <option key={f.id} value={f.id}>
                                          {f.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block font-bold text-stone-700 mb-1">Field Area</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0.05"
                                      placeholder="e.g. 2.5"
                                      value={editForm.areaInputValue}
                                      onChange={(e) => setEditForm({ ...editForm, areaInputValue: e.target.value })}
                                      className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-stone-700 mb-1">Unit</label>
                                    <select
                                      value={editForm.areaInputUnit}
                                      onChange={(e) => setEditForm({ ...editForm, areaInputUnit: e.target.value })}
                                      className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                                    >
                                      <option value="acre">Acre</option>
                                      <option value="bigha">Bigha</option>
                                      <option value="hectare">Hectare</option>
                                      <option value="guntha">Guntha</option>
                                    </select>
                                  </div>
                                </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Irrigation</label>
                  <select
                    value={editForm.irrigationType}
                    onChange={(e) => setEditForm({ ...editForm, irrigationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  >
                    <option value="drip">Drip</option>
                    <option value="sprinkler">Sprinkler</option>
                    <option value="flood">Flood / Canal</option>
                    <option value="rainfed">Rainfed</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Soil Type</label>
                  <select
                    value={editForm.soilType}
                    onChange={(e) => setEditForm({ ...editForm, soilType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                  >
                    <option value="black">Black Soil (કાળી / काली)</option>
                    <option value="loamy">Loamy (ગોરાડુ / दोमट)</option>
                    <option value="alluvial">Alluvial (કાંપવાળી / जलोढ़)</option>
                    <option value="clay">Clay (ચીકણી / चिकनी)</option>
                    <option value="sandy">Sandy (રેતાળ / रेतीली)</option>
                    <option value="red">Red Soil (લાલ / लाल)</option>
                    <option value="unknown">Not sure</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingField(null)}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button type="submit" size="sm" isLoading={savingEdit}>
                  {t('save', 'Save Changes')}
                </Button>
              </div>
            </form>
                            </div>
                          </div>
      )}

                  {/* Delete Confirmation Modal */}
                  {deletingField && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-stone-900 text-base">Delete Field?</h3>
                            <p className="text-xs text-stone-500">This will remove &quot;{deletingField.name}&quot; from your active fields.</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingField(null)}
                            disabled={deletingBusy}
                          >
                            {t('cancel', 'Cancel')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            isLoading={deletingBusy}
                            onClick={handleConfirmDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            {t('delete', 'Delete Field')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
}
