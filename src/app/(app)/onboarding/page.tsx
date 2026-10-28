'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout, ArrowRight, SkipForward, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [farmData, setFarmData] = useState({
    name: '',
    village: '',
    district: '',
    state: 'Gujarat',
    totalArea: '',
    areaUnit: 'acre',
    fieldName: '',
    cropName: 'Cotton',
    irrigationType: 'drip',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (farmData.name.trim()) {
        setSubmitting(true);
        try {
          // 1. Create Farm
          const farmRes = await fetch('/api/v1/farms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: farmData.name.trim(),
              village: farmData.village.trim() || undefined,
              state: farmData.state,
              totalAreaHa: parseFloat(farmData.totalArea) || 1.0,
              areaInputValue: parseFloat(farmData.totalArea) || 1.0,
              areaInputUnit: farmData.areaUnit || 'acre',
              farmType: farmData.irrigationType || 'irrigated',
            }),
          });
          const farmJson = await farmRes.json();
          const farmId = farmJson.data?.id;

          // 2. Create Field Plot if farm was created
          if (farmId) {
            const fieldRes = await fetch('/api/v1/fields', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                farmId,
                name: farmData.fieldName.trim() || 'Primary Field Block',
                areaHa: parseFloat(farmData.totalArea) || 1.0,
                irrigationType: ['drip', 'sprinkler', 'flood', 'rainfed'].includes(farmData.irrigationType)
                  ? farmData.irrigationType
                  : 'drip',
                soilType: 'black',
                status: 'active',
              }),
            });
            const fieldJson = await fieldRes.json();
            const fieldId = fieldJson.data?.id;

            // 3. Create Crop Cycle with Stage Materialization
            if (fieldId && farmData.cropName && farmData.cropName !== 'Other') {
              try {
                const cropsRes = await fetch('/api/v1/crops');
                const cropsJson = await cropsRes.json();
                const matchedCrop = (cropsJson.data || []).find(
                  (c: any) =>
                    c.name?.toLowerCase().includes(farmData.cropName.toLowerCase()) ||
                    farmData.cropName.toLowerCase().includes(c.name?.toLowerCase())
                );
                if (matchedCrop) {
                  await fetch('/api/v1/crop-cycles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fieldId,
                      cropId: matchedCrop.id,
                      sowingDate: new Date().toISOString().split('T')[0],
                      irrigationType: farmData.irrigationType || 'drip',
                    }),
                  });
                }
              } catch (cropErr) {
                console.warn('Could not auto-create crop cycle in onboarding:', cropErr);
              }
            }
          }
        } catch (e) {
          console.warn('Could not auto-save onboarding farm:', e);
        } finally {
          setSubmitting(false);
        }
      }
      router.push('/dashboard');
    }
  };

  const handleSkipAll = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto py-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-[#2F7D4F] text-white rounded-xl mx-auto flex items-center justify-center shadow-md">
          <Sprout size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#143D2A]">Welcome to SmartFarm AI</h1>
        <p className="text-xs text-stone-600">
          Step {step} of {totalSteps} — Set up your farm profile (All steps optional)
        </p>
      </div>

      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#2F7D4F] h-full transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        ></div>
      </div>

      <Card className="p-8 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-lg">Step 1: Your Farm Location</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Where is your primary farming location situated?
            </p>
            <Input
              label="Farm Name"
              placeholder="e.g. Patel Organic Farm"
              value={farmData.name}
              onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
            />
            <Input
              label="Village / Town"
              placeholder="e.g. Padra"
              value={farmData.village}
              onChange={(e) => setFarmData({ ...farmData, village: e.target.value })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-lg">Step 2: Land Area</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              What is the total area of your farm? (Skip if you don't know exact numbers)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Total Area"
                type="number"
                placeholder="e.g. 5"
                value={farmData.totalArea}
                onChange={(e) => setFarmData({ ...farmData, totalArea: e.target.value })}
              />
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-stone-800">Unit</label>
                <select
                  value={farmData.areaUnit}
                  onChange={(e) => setFarmData({ ...farmData, areaUnit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
                >
                  <option value="acre">Acre</option>
                  <option value="bigha">Bigha</option>
                  <option value="hectare">Hectare</option>
                  <option value="guntha">Guntha</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-lg">Step 3: First Field Plot</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Give a name to your primary field plot.
            </p>
            <Input
              label="Field Plot Name"
              placeholder="e.g. North Field"
              value={farmData.fieldName}
              onChange={(e) => setFarmData({ ...farmData, fieldName: e.target.value })}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-lg">Step 4: Current Crop</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Which crop are you currently growing or planning to sow?
            </p>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-stone-800">Select Crop</label>
              <select
                value={farmData.cropName}
                onChange={(e) => setFarmData({ ...farmData, cropName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                <option value="Cotton">Cotton (કપાસ / कपास)</option>
                <option value="Wheat">Wheat (ઘઉં / गेहूं)</option>
                <option value="Groundnut">Groundnut (મગફળી / मूंगफली)</option>
                <option value="Tomato">Tomato (ટામેટા / टमाटर)</option>
                <option value="Other">Other / Not sure yet</option>
              </select>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-lg">Step 5: Irrigation System</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              How do you irrigate your fields?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['drip', 'sprinkler', 'flood', 'rainfed'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFarmData({ ...farmData, irrigationType: type })}
                  className={`p-4 border rounded-xl text-left capitalize font-semibold text-xs transition-all ${
                    farmData.irrigationType === type
                      ? 'bg-emerald-100 border-[#2F7D4F] text-[#143D2A]'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  {type} Irrigation
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-[#2F7D4F] rounded-full mx-auto flex items-center justify-center">
              <Check size={24} />
            </div>
            <h3 className="font-bold text-stone-900 text-lg">Setup Complete!</h3>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              Your digital farming profile is ready. You can now access weather forecasts, task reminders, and crop stage advisory.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <button
            onClick={handleSkipAll}
            type="button"
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1"
          >
            <SkipForward size={14} /> Skip All Setup
          </button>

          <Button onClick={handleNext} isLoading={submitting} disabled={submitting}>
            {step === totalSteps ? 'Go to Dashboard' : 'Next Step'} <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
