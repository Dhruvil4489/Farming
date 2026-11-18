'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  HelpCircle,
  CheckCircle2,
  Droplets,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const SOIL_TYPES = [
  {
    id: 'black',
    title: 'Black Soil',
    local: 'કાળી જમીન / काली मिट्टी',
    tip: 'Holds water well. Great for Cotton, Groundnut, and Soybean.',
  },
  {
    id: 'loamy',
    title: 'Loamy Soil',
    local: 'ગોરાડુ જમીન / दोमट मिट्टी',
    tip: 'Balanced soft soil. Works well for Wheat, Vegetables, and most crops.',
  },
  {
    id: 'alluvial',
    title: 'Alluvial / River Soil',
    local: 'કાંપવાળી જમીન / जलोढ़ मिट्टी',
    tip: 'Naturally fertile and easy to irrigate.',
  },
  {
    id: 'clay',
    title: 'Clay / Heavy Soil',
    local: 'ચીકણી જમીન / चिकनी मिट्टी',
    tip: 'Drains slowly — avoid over-watering.',
  },
  {
    id: 'sandy',
    title: 'Sandy Soil',
    local: 'રેતાળ જમીન / रेतीली मिट्टी',
    tip: 'Dries quickly — drip irrigation and organic compost help a lot.',
  },
  {
    id: 'unknown',
    title: "I Don't Know My Soil Type",
    local: 'મને ખબર નથી / मुझे नहीं पता',
    tip: 'No problem! SmartFarm AI will use safe regional farming baselines.',
  },
];

export default function SoilPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [soilType, setSoilType] = useState('black');
  const [notes, setNotes] = useState('');
  const [showLabInputs, setShowLabInputs] = useState(false);
  const [labValues, setLabValues] = useState({ ph: '', n: '', p: '', k: '', oc: '' });

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/soil')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        const list = Array.isArray(json?.data) ? json.data : [];
        setFields(list);
        if (list.length > 0) {
          setSelectedFieldId(list[0].id);
          setSoilType(list[0].soilProfile?.soilType || list[0].soilType || 'unknown');
          setNotes(list[0].soilProfile?.notes || '');
        }
      })
      .catch(() => { });
  }, []);

  const handleFieldChange = (newFieldId: string) => {
    setSelectedFieldId(newFieldId);
    const fld = fields.find((f) => f.id === newFieldId);
    if (fld) {
      setSoilType(fld.soilProfile?.soilType || fld.soilType || 'unknown');
      setNotes(fld.soilProfile?.notes || '');
    }
    setSavedMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldId) {
      setError('Please add a field first in My Fields.');
      return;
    }
    setSaving(true);
    setError('');
    setSavedMsg('');

    try {
      const parameters: Record<string, number> = {};
      if (labValues.ph) parameters.ph = parseFloat(labValues.ph);
      if (labValues.n) parameters.n = parseFloat(labValues.n);
      if (labValues.p) parameters.p = parseFloat(labValues.p);
      if (labValues.k) parameters.k = parseFloat(labValues.k);
      if (labValues.oc) parameters.oc = parseFloat(labValues.oc);

      const hasLab = Object.keys(parameters).length > 0;
      const res = await fetch('/api/v1/soil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: selectedFieldId,
          soilType,
          pathChosen: hasLab ? 'health_card' : soilType === 'unknown' ? 'unknown' : 'known_type',
          notes: notes.trim() || undefined,
          ...(hasLab ? { parameters } : {}),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || 'Could not save soil profile.');

      setSavedMsg('Soil profile saved! Your nutrient and irrigation guidance is now tailored to this field.');
      setLabValues({ ph: '', n: '', p: '', k: '', oc: '' });
    } catch (err: any) {
      setError(err.message || 'Could not save soil profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Soil Health</h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Simple soil setup — no lab numbers or scientific knowledge required.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/soil-moisture">
                  <Button size="sm" variant="outline">
                    <Droplets size={14} className="mr-1 text-cyan-700" /> Soil Moisture
                  </Button>
              </Link>
              <Link href="/guidance">
                <Button size="sm">
                  <BookOpen size={14} className="mr-1" /> Nutrient Guidance
                </Button>
              </Link>
            </div>
          </div>

                {/* Friendly Reassurance Banner */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-950">
                  <Sparkles size={18} className="text-[#2F7D4F] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">You do not need pH or NPK lab numbers to use SmartFarm AI.</p>
                    <p className="text-emerald-800 mt-0.5 leading-relaxed">
                      Just pick how your field soil looks (or select &quot;I don&apos;t know&quot;). If you have a Government Soil Health Card, you can optionally add those numbers below.
                    </p>
                  </div>
                </div>

                    {
                      savedMsg && (
                        <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-950 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-[#2F7D4F] shrink-0" />
                          <span>{savedMsg}</span>
                        </div>
                      )
                    }

                          {error && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800">
                              {error}
                            </div>
                          )}

                          <Card className="p-6 rounded-2xl space-y-5">
                            <form onSubmit={handleSave} className="space-y-5">
                              {/* Step 1: Pick Field */}
                              <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-stone-800">1. Choose Your Field</label>
                                {fields.length === 0 ? (
                                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                                    <span className="text-stone-600">No fields added yet.</span>
                                    <Link href="/fields/new" className="font-bold text-[#2F7D4F] hover:underline">
                                      Add Your First Field →
                                    </Link>
                                  </div>
            ) : (
              <select
                value={selectedFieldId}
                onChange={(e) => handleFieldChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.farm?.name || 'Farm'})
                  </option>
                ))}
              </select>
            )}
          </div>

                                {/* Step 2: Simple Soil Type Cards */}
                                <div className="space-y-2">
                                  <label className="block text-sm font-bold text-stone-800">
                                    2. What does your soil look like? (જમીનનો પ્રકાર / मिट्टी का प्रकार)
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {SOIL_TYPES.map((st) => {
                                      const active = soilType === st.id;
                                      return (
                                        <button
                                          key={st.id}
                                          type="button"
                                          onClick={() => setSoilType(st.id)}
                                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${active
                                              ? 'border-[#2F7D4F] bg-emerald-50/70 shadow-xs'
                                              : 'border-stone-200 bg-white hover:border-emerald-300'
                                            }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-stone-900">{st.title}</span>
                                            {st.id === 'unknown' ? (
                                              <HelpCircle size={16} className="text-stone-400" />
                                            ) : (
                                              <FlaskConical size={16} className={active ? 'text-[#2F7D4F]' : 'text-stone-400'} />
                                            )}
                                          </div>
                                          <p className="text-[11px] font-semibold text-[#2F7D4F] mt-0.5">{st.local}</p>
                                          <p className="text-[11px] text-stone-500 mt-1.5 leading-snug">{st.tip}</p>
                                        </button>
                                      );
                                    })}
                                  </div>
                              </div>

                                  {/* Optional Step 3: Progressive Disclosure for Soil Health Card Lab Values */}
                                  <div className="pt-2 border-t border-stone-100">
                                    <button
                                      type="button"
                                      onClick={() => setShowLabInputs(!showLabInputs)}
                                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7D4F] hover:text-[#143D2A] cursor-pointer"
                                    >
                                      {showLabInputs ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                      Have a Soil Health Card? Enter Optional Lab Numbers (pH / NPK)
                                    </button>

                                    {showLabInputs && (
                                      <div className="mt-3 p-4 bg-[#F7F8F5] rounded-2xl border border-stone-200 space-y-3 text-xs">
                                        <p className="text-stone-600">
                                          All fields below are optional. Leave blank if you don&apos;t know them.
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          <div>
                                            <label className="block font-bold text-stone-700 mb-1">
                                              Soil pH <span className="font-normal text-stone-400">(Normal: 6.5–7.5)</span>
                                            </label>
                                            <input
                                              type="number"
                                              step="0.1"
                                              placeholder="e.g. 7.2"
                                              value={labValues.ph}
                                              onChange={(e) => setLabValues({ ...labValues, ph: e.target.value })}
                                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                                            />
                                          </div>
                                          <div>
                                            <label className="block font-bold text-stone-700 mb-1">Nitrogen N (kg/ha)</label>
                                            <input
                                              type="number"
                                              step="1"
                                              placeholder="e.g. 240"
                                              value={labValues.n}
                                              onChange={(e) => setLabValues({ ...labValues, n: e.target.value })}
                                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                                            />
                                          </div>
                                          <div>
                                            <label className="block font-bold text-stone-700 mb-1">Phosphorus P (kg/ha)</label>
                                            <input
                                              type="number"
                                              step="1"
                                              placeholder="e.g. 28"
                                              value={labValues.p}
                                              onChange={(e) => setLabValues({ ...labValues, p: e.target.value })}
                                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                                            />
                                          </div>
                                          <div>
                                            <label className="block font-bold text-stone-700 mb-1">Potassium K (kg/ha)</label>
                                            <input
                                              type="number"
                                              step="1"
                                              placeholder="e.g. 290"
                                              value={labValues.k}
                                              onChange={(e) => setLabValues({ ...labValues, k: e.target.value })}
                                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                                            />
                                          </div>
                                          <div>
                                            <label className="block font-bold text-stone-700 mb-1">Organic Carbon (%)</label>
                                            <input
                                              type="number"
                                              step="0.05"
                                              placeholder="e.g. 0.65"
                                              value={labValues.oc}
                                              onChange={(e) => setLabValues({ ...labValues, oc: e.target.value })}
                                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                            <Button
                              type="submit"
                              isLoading={saving}
                              disabled={!selectedFieldId}
                              className="w-full bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl py-3"
                            >
                              Save Soil Profile
                            </Button>
                          </form>
                      </Card>
    </div>
                );
}
