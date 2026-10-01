'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Grid } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MapView } from '@/components/domain/MapView';

export default function NewFieldPage() {
  const router = useRouter();
  const [farms, setFarms] = useState<any[]>([]);
  const [form, setForm] = useState({
    farmId: '',
    name: '',
    areaHa: '',
    irrigationType: 'drip',
    soilType: 'unknown',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/farms')
      .then((res) => res.json())
      .then((data) => {
        const farmList = data.data || [];
        setFarms(farmList);
        if (farmList.length > 0) {
          setForm((prev) => ({ ...prev, farmId: farmList[0].id }));
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId: form.farmId,
          name: form.name,
          areaHa: form.areaHa ? parseFloat(form.areaHa) : undefined,
          irrigationType: form.irrigationType,
          soilType: form.soilType,
          notes: form.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create field');

      router.push('/fields');
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
        <ArrowLeft size={16} /> Back to Field Plots
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#143D2A]">Add New Field Plot</h1>
        <p className="text-xs text-stone-600">Create a specific field partition under a farm</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <Card className="p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Select Farm *</label>
            <select
              value={form.farmId}
              onChange={(e) => setForm({ ...form, farmId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              required
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.district}, {f.state})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Field Plot Name *"
            placeholder="e.g. North Field (Cotton Plot)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            whyAsk="A clear name helps you assign tasks and view scouting observations for this plot."
            required
          />

          <Input
            label="Plot Area in Hectares (Optional)"
            type="number"
            step="0.1"
            placeholder="e.g. 1.2"
            value={form.areaHa}
            onChange={(e) => setForm({ ...form, areaHa: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Irrigation System</label>
              <select
                value={form.irrigationType}
                onChange={(e) => setForm({ ...form, irrigationType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                <option value="drip">Drip Irrigation</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="flood">Flood / Surface</option>
                <option value="rainfed">Rainfed</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Soil Type (Optional)</label>
              <select
                value={form.soilType}
                onChange={(e) => setForm({ ...form, soilType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                <option value="black">Black Soil (काली मिट्टी)</option>
                <option value="alluvial">Alluvial Soil (जलोढ़)</option>
                <option value="loamy">Loamy Soil (दोमट)</option>
                <option value="clay">Clay Soil (चिकनी)</option>
                <option value="sandy">Sandy Soil (रेतीली)</option>
                <option value="red">Red Soil (लाल)</option>
                <option value="unknown">I don't know</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-stone-800">Map Boundary Preview</label>
            <MapView className="h-[200px]" />
          </div>

          <Button type="submit" isLoading={loading} className="w-full">
            Save Field Plot
          </Button>
        </form>
      </Card>
    </div>
  );
}
