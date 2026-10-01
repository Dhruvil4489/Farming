'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tractor, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NewFarmPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    village: '',
    district: 'Vadodara',
    state: 'Gujarat',
    areaInputValue: '',
    areaInputUnit: 'acre',
    farmType: 'irrigated',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          village: form.village,
          district: form.district,
          state: form.state,
          areaInputValue: form.areaInputValue ? parseFloat(form.areaInputValue) : undefined,
          areaInputUnit: form.areaInputUnit,
          farmType: form.farmType,
          notes: form.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create farm');

      router.push('/farms');
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
        <ArrowLeft size={16} /> Back to Farms
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#143D2A]">Add New Farm</h1>
        <p className="text-xs text-stone-600">Register a new agricultural plot or land location</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Farm Name *"
            placeholder="e.g. Patel Organic Farm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            whyAsk="A distinct farm name helps organize your fields, crops, and task reminders."
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Village / Town"
              placeholder="e.g. Padra"
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
            />
            <Input
              label="District"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>

          <Input
            label="State"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Land Area"
              type="number"
              step="0.1"
              placeholder="e.g. 5"
              value={form.areaInputValue}
              onChange={(e) => setForm({ ...form, areaInputValue: e.target.value })}
            />
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Area Unit</label>
              <select
                value={form.areaInputUnit}
                onChange={(e) => setForm({ ...form, areaInputUnit: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                <option value="acre">Acre</option>
                <option value="bigha">Bigha</option>
                <option value="hectare">Hectare</option>
                <option value="guntha">Guntha</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Farm Type</label>
            <select
              value={form.farmType}
              onChange={(e) => setForm({ ...form, farmType: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            >
              <option value="irrigated">Irrigated Plot</option>
              <option value="rainfed">Rainfed Plot</option>
              <option value="mixed">Mixed Irrigation</option>
              <option value="orchard">Orchard / Plantation</option>
              <option value="greenhouse">Greenhouse / Protected</option>
            </select>
          </div>

          <Button type="submit" isLoading={loading} className="w-full">
            Save Farm Profile
          </Button>
        </form>
      </Card>
    </div>
  );
}
