'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Tractor,
  MapPin,
  Grid,
  Plus,
  Edit2,
  Trash2,
  Sprout,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatExactArea, validateAreaInput } from '@/lib/area-validation';

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');

  const [editForm, setEditForm] = useState({
    name: '',
    village: '',
    district: '',
    state: '',
    areaInputValue: '',
    areaInputUnit: 'acre',
    farmType: 'irrigated',
    notes: '',
  });

  const loadFarm = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/farms/${id}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Farm not found.');
      const data = json.data;
      setFarm(data);
      setEditForm({
        name: data.name || '',
        village: data.village || '',
        district: data.district || '',
        state: data.state || '',
        areaInputValue: data.areaInputValue != null ? String(data.areaInputValue) : '',
        areaInputUnit: data.areaInputUnit || 'acre',
        farmType: data.farmType || 'irrigated',
        notes: data.notes || '',
      });
    } catch (err: any) {
      setError(err.message || 'Unable to load farm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarm();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const areaCheck = validateAreaInput(editForm.areaInputValue);
    if (!areaCheck.valid) {
      setError(areaCheck.error || 'Please enter a valid land area.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/farms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          village: editForm.village.trim() || null,
          district: editForm.district.trim() || null,
          state: editForm.state.trim() || null,
          areaInputValue: areaCheck.value,
          areaInputUnit: editForm.areaInputUnit,
          farmType: editForm.farmType,
          notes: editForm.notes.trim() || null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Could not update farm.');
      setEditing(false);
      setNotice('Farm details updated.');
      setTimeout(() => setNotice(''), 3000);
      await loadFarm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/farms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete farm.');
      router.push('/farms');
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error}
      onRetry={loadFarm}
    >
      {farm && (
        <div className="space-y-6">
          <Link
            href="/farms"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={15} /> Back to My Farms
          </Link>

          {notice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#2F7D4F]" /> {notice}
            </div>
          )}

          {/* Header Card */}
          <Card className="p-6 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#2F7D4F] flex items-center justify-center shrink-0">
                  <Tractor size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-[#143D2A]">{farm.name}</h1>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                    <MapPin size={13} className="text-[#2F7D4F]" />
                    {[farm.village, farm.district, farm.state].filter(Boolean).join(', ') || 'Location not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
                  <Edit2 size={14} className="mr-1" /> {editing ? 'Cancel Edit' : 'Edit Farm'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-700 border-rose-200 hover:bg-rose-50"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            </div>

            {!editing ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-stone-200/70 text-xs">
                <div>
                  <span className="text-stone-500 block">Total Area</span>
                  <strong className="text-stone-900 text-sm">
                    {formatExactArea(farm.areaInputValue, farm.areaInputUnit, farm.totalAreaHa)}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Farm Type</span>
                  <strong className="text-stone-900 text-sm capitalize">
                    {farm.farmType || 'Irrigated'}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Registered Fields</span>
                  <strong className="text-stone-900 text-sm">{farm.fields?.length || 0}</strong>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-stone-100 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Farm Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Village</label>
                    <input
                      type="text"
                      value={editForm.village}
                      onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">District</label>
                    <input
                      type="text"
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">State</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Total Area</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 10 or 9.95"
                      value={editForm.areaInputValue}
                      onChange={(e) => setEditForm({ ...editForm, areaInputValue: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Unit</label>
                    <select
                      value={editForm.areaInputUnit}
                      onChange={(e) => setEditForm({ ...editForm, areaInputUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                    >
                      <option value="acre">Acre</option>
                      <option value="bigha">Bigha</option>
                      <option value="hectare">Hectare</option>
                      <option value="guntha">Guntha</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={saving}>
                    Save Farm Changes
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Fields belonging to this farm */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#143D2A]">Fields in this Farm</h2>
              <Link href="/fields/new">
                <Button size="sm">
                  <Plus size={14} className="mr-1" /> Add Field
                </Button>
              </Link>
            </div>

            {!farm.fields || farm.fields.length === 0 ? (
              <Card className="p-8 text-center space-y-2 rounded-2xl">
                <Grid size={28} className="mx-auto text-stone-400" />
                <p className="font-bold text-stone-800 text-sm">No fields added to this farm yet.</p>
                <Link href="/fields/new" className="inline-block pt-1">
                  <Button size="sm">Add First Field</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {farm.fields.map((fld: any) => (
                  <Card key={fld.id} className="p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-stone-900 text-sm">{fld.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                        {fld.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Area: {formatExactArea(fld.areaInputValue, fld.areaInputUnit, fld.areaHa)} • Irrigation:{' '}
                      <span className="capitalize">{fld.irrigationType || 'Drip'}</span>
                    </p>
                    {fld.cropCycles?.[0] && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold pt-1">
                        <Sprout size={14} />
                        <span>Active Crop: {fld.cropCycles[0].crop?.name || 'Crop'}</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {confirmDelete && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900">Delete Farm?</h3>
                    <p className="text-xs text-stone-500">
                      This will archive &quot;{farm.name}&quot; and its fields.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    isLoading={deleting}
                    onClick={handleDelete}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Confirm Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DataState>
  );
}
