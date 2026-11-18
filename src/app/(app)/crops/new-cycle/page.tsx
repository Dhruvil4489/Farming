'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Grid, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NewCropCyclePage() {
  const router = useRouter();
  const [fields, setFields] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [form, setForm] = useState({
    fieldId: '',
    cropId: '',
    sowingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/fields').then((r) => (r.ok ? r.json() : { data: [] })),
        fetch('/api/v1/crops').then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([fieldRes, cropRes]) => {
        const fList = Array.isArray(fieldRes?.data) ? fieldRes.data : [];
        const cList = Array.isArray(cropRes?.data) ? cropRes.data : [];

        setFields(fList);
        setCrops(cList);

    if (fList.length > 0) setForm((p) => ({ ...p, fieldId: fList[0].id }));
    if (cList.length > 0) setForm((p) => ({ ...p, cropId: cList[0].id }));
  })
    .catch(() => { })
    .finally(() => setLoadingInit(false));
}, []);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const res = await fetch('/api/v1/crop-cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldId: form.fieldId,
        cropId: form.cropId,
        sowingDate: form.sowingDate,
        expectedHarvestDate: form.expectedHarvestDate || undefined,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message || 'Failed to start crop cycle.');

    router.push('/crops');
  } catch (err: any) {
    setError(err.message || 'Failed to start crop cycle.');
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
      <ArrowLeft size={16} /> Back to Crops
    </button>

    <div className="space-y-1">
      <h1 className="text-2xl font-extrabold text-[#143D2A]">Start New Crop Cycle</h1>
      <p className="text-xs sm:text-sm text-stone-600">
        Choose your crop, field, and sowing date — SmartFarm AI calculates your growth stages automatically.
      </p>
    </div>

    {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

            {!loadingInit && fields.length === 0 ? (
              <Card className="p-8 text-center space-y-4 rounded-2xl">
                <div className="w-14 h-14 bg-emerald-50 text-[#2F7D4F] rounded-2xl mx-auto flex items-center justify-center">
                  <Grid size={26} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-stone-900 text-base">Add a Field First</h2>
                  <p className="text-xs text-stone-600 max-w-sm mx-auto">
                    You need at least one field before planting a crop cycle.
                  </p>
                </div>
                <Link href="/fields/new">
                  <Button size="sm" className="bg-[#2F7D4F] hover:bg-[#143D2A] text-white">
                    <Plus size={15} className="mr-1" /> Add Your First Field
                  </Button>
                </Link>
              </Card>
            ) : (
        <Card className="p-6 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Crop Name *</label>
              <select
                value={form.cropId}
                onChange={(e) => setForm({ ...form, cropId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                required
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.typicalDurationDays} days)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Select Field *</label>
              <select
                value={form.fieldId}
                onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                required
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.farm?.name || 'Farm'})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Sowing Date *"
              type="date"
              value={form.sowingDate}
              onChange={(e) => setForm({ ...form, sowingDate: e.target.value })}
              required
            />

            <Input
              label="Expected Harvest Date (Optional)"
              type="date"
              value={form.expectedHarvestDate}
              onChange={(e) => setForm({ ...form, expectedHarvestDate: e.target.value })}
              whyAsk="Leave empty if unsure — we will estimate it automatically from your sowing date."
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3"
            >
              Start Crop Cycle
            </Button>
          </form>
        </Card>
      )}
      </div>
    );
}
