'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Sprout, Tractor } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { validateAreaInput } from '@/lib/area-validation';

export default function NewFieldPage() {
  const router = useRouter();
  const [farms, setFarms] = useState<any[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState({
    farmId: '',
    name: '',
    areaInputValue: '',
    areaInputUnit: 'acre',
    irrigationType: 'drip',
    soilType: 'unknown',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/farms')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((farmRes) => {
        const farmList = Array.isArray(farmRes?.data) ? farmRes.data : [];
        setFarms(farmList);
        if (farmList.length > 0) {
          setForm((prev) => ({ ...prev, farmId: farmList[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingInit(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.farmId) {
      setError('Please add or select a farm first.');
      return;
    }

    const areaCheck = validateAreaInput(form.areaInputValue);
    if (!areaCheck.valid) {
      setError(areaCheck.error || 'Please enter a valid field area.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId: form.farmId,
          name: form.name,
          areaInputValue: areaCheck.value ?? undefined,
          areaInputUnit: form.areaInputUnit,
          irrigationType: form.irrigationType,
          soilType: form.soilType,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message || 'Could not save field.');

      router.push('/fields');
    } catch (err: any) {
      setError(err.message || 'Could not save field.');
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
        <ArrowLeft size={16} /> Back to My Fields
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#143D2A]">Add a New Field</h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Register your land plot first. You can then plant seasonal crop cycles on this field anytime without losing crop history.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {!loadingInit && farms.length === 0 ? (
        <Card className="p-8 text-center space-y-4 rounded-2xl">
          <div className="w-14 h-14 bg-emerald-50 text-[#2F7D4F] rounded-2xl mx-auto flex items-center justify-center">
            <Tractor size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="font-bold text-stone-900 text-base">Add Your Farm First</h2>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              Fields belong to a farm location. Create your farm in 30 seconds, then add your fields.
            </p>
          </div>
          <Link href="/farms/new">
            <Button size="sm" className="bg-[#2F7D4F] hover:bg-[#143D2A] text-white">
              <Plus size={15} className="mr-1" /> Add Your First Farm
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-6 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Field Name */}
            <Input
              label="Field Name *"
              placeholder="e.g. North Plot, Plot A, Behind Borewell"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            {/* 2. Farm / Location */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">
                Farm / Village Location *
              </label>
              <select
                value={form.farmId}
                onChange={(e) => setForm({ ...form, farmId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                required
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.village || f.district
                      ? ` (${[f.village, f.district].filter(Boolean).join(', ')})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Field Area & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Field Area"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 10, 5, or 2.5"
                value={form.areaInputValue}
                onChange={(e) => setForm({ ...form, areaInputValue: e.target.value })}
              />
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-stone-800">Area Unit</label>
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

            {/* Clean IA workflow note */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
              <Sprout size={15} className="text-[#2F7D4F] shrink-0 mt-0.5" />
              <span>
                <strong>Crop planting is managed in Crops &amp; Cycles:</strong> After saving this field, choose your crop &amp; sowing date to unlock automated growth stages and farming reminders.
              </span>
            </div>

            {/* Progressive disclosure for optional details */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7D4F] hover:text-[#143D2A] cursor-pointer"
              >
                {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {showAdvanced
                  ? 'Hide Optional Soil & Irrigation Details'
                  : 'Add Soil Type, Irrigation or Notes (Optional)'}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 bg-[#F7F8F5] rounded-xl border border-stone-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">
                        Irrigation Method
                      </label>
                      <select
                        value={form.irrigationType}
                        onChange={(e) => setForm({ ...form, irrigationType: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                      >
                        <option value="drip">Drip (ટપક / ड्रिप)</option>
                        <option value="sprinkler">Sprinkler (ફુવારા / फव्वारा)</option>
                        <option value="flood">Flood / Canal (ધોરિયા / नहर)</option>
                        <option value="rainfed">Rainfed (વરસાદ આધારિત / वर्षा)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">
                        Soil Type (मिट्टी / જમીન)
                      </label>
                      <select
                        value={form.soilType}
                        onChange={(e) => setForm({ ...form, soilType: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                      >
                        <option value="unknown">I don&apos;t know (No problem)</option>
                        <option value="black">Black Soil (કાળી / काली)</option>
                        <option value="loamy">Loamy (ગોરાડુ / दोमट)</option>
                        <option value="alluvial">Alluvial (કાંપવાળી / जलोढ़)</option>
                        <option value="clay">Clay (ચીકણી / चिकनी)</option>
                        <option value="sandy">Sandy (રેતાળ / रेतीली)</option>
                        <option value="red">Red Soil (લાલ / लाल)</option>
                      </select>
                    </div>
                  </div>
                  <Input
                    label="Notes (Optional)"
                    placeholder="e.g. Near borewell, good drainage"
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
              Save Field
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
