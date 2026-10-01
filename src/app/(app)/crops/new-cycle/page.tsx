'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sprout } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NewCropCyclePage() {
  const router = useRouter();
  const [fields, setFields] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);

  const [form, setForm] = useState({
    fieldId: '',
    cropId: '',
    sowingDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/fields').then((r) => r.json()),
      fetch('/api/v1/crops').then((r) => r.json()),
    ]).then(([fieldRes, cropRes]) => {
      const fList = fieldRes.data || [];
      const cList = cropRes.data || [];

      setFields(fList);
      setCrops(cList);

      if (fList.length > 0) setForm((p) => ({ ...p, fieldId: fList[0].id }));
      if (cList.length > 0) setForm((p) => ({ ...p, cropId: cList[0].id }));
    });
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
          notes: form.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to start crop cycle');

      router.push('/crops');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Crops
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#143D2A]">Start New Crop Cycle</h1>
        <p className="text-xs text-stone-600">Materialize stage timeline and task recommendations</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Select Field Plot *</label>
            <select
              value={form.fieldId}
              onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              required
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.farm?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Select Crop *</label>
            <select
              value={form.cropId}
              onChange={(e) => setForm({ ...form, cropId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              required
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.typicalDurationDays} Days Duration)
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Sowing Date *"
            type="date"
            value={form.sowingDate}
            onChange={(e) => setForm({ ...form, sowingDate: e.target.value })}
            whyAsk="Sowing date calculates stage milestones and automated task schedules."
            required
          />

          <Button type="submit" isLoading={loading} className="w-full">
            Start Crop Cycle
          </Button>
        </form>
      </Card>
    </div>
  );
}
