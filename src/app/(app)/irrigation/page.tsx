'use client';

import React, { useState } from 'react';
import { Droplet, Plus, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function IrrigationPage() {
  const [logs, setLogs] = useState<any[]>([
    {
      id: 'irr_1',
      method: 'drip',
      durationMinutes: 120,
      moistureNote: 'moist',
      date: new Date().toLocaleDateString(),
    },
  ]);

  const [form, setForm] = useState({
    method: 'drip',
    durationMinutes: 60,
    moistureNote: 'moist',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setLogs([
      {
        id: `irr_${Date.now()}`,
        method: form.method,
        durationMinutes: form.durationMinutes,
        moistureNote: form.moistureNote,
        date: new Date().toLocaleDateString(),
      },
      ...logs,
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Irrigation Management</h1>
          <p className="text-xs text-stone-600 mt-1">Record water application and soil moisture levels</p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-stone-900 text-base">Record Irrigation Event</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Irrigation Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                <option value="drip">Drip Irrigation</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="flood">Flood / Surface</option>
                <option value="rainfed">Rainfed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Duration (Minutes)</label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Farmer Soil Moisture Note</label>
            <div className="grid grid-cols-3 gap-3">
              {['dry', 'moist', 'wet'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, moistureNote: m })}
                  className={`p-3 border rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    form.moistureNote === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-stone-50 border-stone-300 text-stone-700'
                  }`}
                >
                  {m} Soil
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Droplet size={16} className="mr-2" /> Log Irrigation Event
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold text-stone-900 text-base">Irrigation History</h3>
        {logs.map((log) => (
          <Card key={log.id} className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-900 capitalize">{log.method} Irrigation</span>
              <p className="text-xs text-stone-500">
                Duration: {log.durationMinutes} mins • Soil State: <strong className="capitalize">{log.moistureNote}</strong>
              </p>
            </div>
            <span className="text-[10px] text-stone-400 font-semibold">{log.date}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
