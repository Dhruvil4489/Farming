'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NewFarmPage() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [form, setForm] = useState({
    name: '',
    village: '',
    district: '',
    state: '',
    areaInputValue: '',
    areaInputUnit: 'acre',
    farmType: 'irrigated',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill village/district/state from farmer profile if available
  useEffect(() => {
    fetch('/api/v1/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data) {
          setForm((prev) => ({
            ...prev,
            village: prev.village || json.data.village || '',
            district: prev.district || json.data.district || '',
            state: prev.state || json.data.state || '',
          }));
        }
      })
      .catch(() => { });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const parsedArea = parseFloat(form.areaInputValue);
      const res = await fetch('/api/v1/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          village: form.village.trim() || undefined,
          district: form.district.trim() || undefined,
          state: form.state.trim() || undefined,
          areaInputValue: !isNaN(parsedArea) && parsedArea > 0 ? parsedArea : undefined,
          areaInputUnit: form.areaInputUnit,
          farmType: form.farmType,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message || 'Could not save farm.');

      router.push('/farms');
    } catch (err: any) {
      setError(err.message || 'Could not save farm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to My Farms
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#143D2A]">Add a New Farm</h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Enter your farm name, village, and area — quick and simple.
        </p>
      </div>

      {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
            {error}
          </div>
      )}

            <Card className="p-6 rounded-2xl">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Farm Name *"
                  placeholder="e.g. Patel Farm, Village Road Land"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Village / Town"
                      placeholder="e.g. Padra"
                      value={form.village}
                      onChange={(e) => setForm({ ...form, village: e.target.value })}
                    />
                    <Input
                      label="District"
                      placeholder="e.g. Vadodara"
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Total Land Area"
                      type="number"
                      step="0.1"
                      min="0.05"
                      placeholder="e.g. 5"
                      value={form.areaInputValue}
                      onChange={(e) => setForm({ ...form, areaInputValue: e.target.value })}
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-stone-800">Unit</label>
                      <select
                        value={form.areaInputUnit}
                        onChange={(e) => setForm({ ...form, areaInputUnit: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                      >
                        <option value="acre">Acre (એકર / एकड़)</option>
                        <option value="bigha">Bigha (વીઘા / बीघा)</option>
                        <option value="hectare">Hectare (હેક્ટર / हेक्टेयर)</option>
                        <option value="guntha">Guntha (ગુંઠા / गुंठा)</option>
                      </select>
                    </div>
                  </div>

          <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowMore(!showMore)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7D4F] hover:text-[#143D2A] cursor-pointer"
                      >
                      {showMore ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {showMore ? 'Hide Optional Details' : 'State, Farm Type & Notes (Optional)'}
                    </button>

                    {showMore && (
                      <div className="mt-3 p-4 bg-[#F7F8F5] rounded-xl border border-stone-200 space-y-3">
                        <Input
                          label="State"
                          placeholder="e.g. Gujarat"
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                        />
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-stone-700">Farm Type</label>
                          <select
                            value={form.farmType}
                            onChange={(e) => setForm({ ...form, farmType: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                          >
                            <option value="irrigated">Irrigated (પિયત / सिंचित)</option>
                            <option value="rainfed">Rainfed (બિન-પિયત / वर्षा आधारित)</option>
                            <option value="mixed">Mixed</option>
                            <option value="orchard">Orchard / Fruit Trees</option>
                            <option value="greenhouse">Greenhouse / Polyhouse</option>
                          </select>
                        </div>
                        <Input
                          label="Notes (Optional)"
                          placeholder="Any helpful note about water or road access"
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                    <Button
                      type="submit"
                      isLoading={loading}
                      className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3"
                    >
                      Save Farm
                    </Button>
                  </form>
                </Card>
              </div>
              );
}
