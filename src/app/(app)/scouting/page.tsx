'use client';

import React, { useState } from 'react';
import { Eye, Camera, Plus, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ScoutingPage() {
  const [observations, setObservations] = useState<any[]>([
    {
      id: 'obs_1',
      category: 'Pest Inspection',
      severity: 2,
      notes: 'Noticed slight whitefly presence on leaf undersides in North Cotton Field.',
      observedAt: new Date().toLocaleDateString(),
    },
  ]);

  const [form, setForm] = useState({
    category: 'Pest Inspection',
    severity: 1,
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setObservations([
      {
        id: `obs_${Date.now()}`,
        category: form.category,
        severity: form.severity,
        notes: form.notes,
        observedAt: new Date().toLocaleDateString(),
      },
      ...observations,
    ]);
    setSubmitted(true);
    setForm({ category: 'Pest Inspection', severity: 1, notes: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Field Scouting</h1>
          <p className="text-xs text-stone-600 mt-1">Record observations, pest sightings, and crop health notes</p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-stone-900 text-base">Log New Field Observation</h3>

        {submitted && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} /> Observation recorded in field history.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Observation Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            >
              <option value="Pest Inspection">Pest Sighting (कीट)</option>
              <option value="Disease Symptom">Disease Symptom (रोग)</option>
              <option value="Nutrient Issue">Nutrient / Yellowing (पोषण)</option>
              <option value="Weed Growth">Weeds (खरपतवार)</option>
              <option value="Irrigation Stress">Irrigation / Moisture</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Severity Rating (1 = Low, 3 = High)</label>
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setForm({ ...form, severity: sev })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    form.severity === sev
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
            label="Observation Notes"
            placeholder="Describe what you observed on the leaves, stem, or soil..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            required
          />

          <Button type="submit" className="w-full">
            <Camera size={16} className="mr-2" /> Log Observation
          </Button>
        </form>
      </Card>

      {/* Observation History */}
      <div className="space-y-3">
        <h3 className="font-bold text-stone-900 text-base">Recent Field Observations</h3>
        {observations.map((obs) => (
          <Card key={obs.id} className="p-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#143D2A]">{obs.category}</span>
              <p className="text-xs text-stone-700">{obs.notes}</p>
              <span className="text-[10px] text-stone-500 block">{obs.observedAt}</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                obs.severity === 3 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              Severity {obs.severity}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
