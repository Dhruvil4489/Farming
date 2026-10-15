'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Upload, FileText, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

export default function SoilPage() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [soilType, setSoilType] = useState('black');
  const [confirmed, setConfirmed] = useState(false);

  const soilPaths = [
    {
      id: 'health_card',
      title: 'I have a Soil Health Card',
      desc: 'Upload your government Soil Health Card document (PDF/Image)',
      icon: FileText,
      active: true,
    },
    {
      id: 'report',
      title: 'I have a Soil Test Report',
      desc: 'Upload a private lab soil test report for parameter confirmation',
      icon: Upload,
      active: true,
    },
    {
      id: 'known_type',
      title: 'I know my Soil Type',
      desc: 'Select your field soil type (Black, Loamy, Clay, Sandy, Alluvial)',
      icon: FlaskConical,
      active: true,
    },
    {
      id: 'unknown',
      title: "I don't know my Soil details",
      desc: 'No problem! SmartFarm AI will use regional soil baselines',
      icon: HelpCircle,
      active: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Soil Health</h1>
          <p className="text-xs text-stone-600 mt-1">Flexible soil paths — No mandatory chemical inputs required</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/soil-moisture">
            <Button size="sm" variant="outline" className="border-cyan-300 text-cyan-800 bg-cyan-50/50 hover:bg-cyan-100">
              💧 Live Soil Moisture →
            </Button>
          </Link>
          <ProvenanceChip type="user_entered" />
        </div>
      </div>

      <div className="p-4 bg-gradient-to-r from-cyan-900 to-[#143D2A] text-white rounded-2xl flex items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Official Government Soil Moisture (NRSC VIC Model)
          </span>
          <p className="text-xs text-stone-200">
            Monitor daily root-zone volumetric soil moisture estimates across Gujarat districts or check physical field probe telemetry.
          </p>
        </div>
        <Link href="/soil-moisture">
          <Button size="sm" className="bg-white text-[#143D2A] hover:bg-stone-100 shrink-0 font-bold">
            Open Moisture Dashboard →
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {soilPaths.map((path) => {
          const Icon = path.icon;
          const isSelected = selectedPath === path.id;

          return (
            <Card
              key={path.id}
              onClick={() => setSelectedPath(path.id)}
              className={`p-5 cursor-pointer transition-all border-2 ${
                isSelected
                  ? 'border-[#2F7D4F] bg-emerald-50/50 shadow-md'
                  : 'border-stone-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#2F7D4F] text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">{path.title}</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{path.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedPath === 'known_type' && (
        <Card className="p-6 space-y-4 bg-white border border-stone-200">
          <h3 className="font-bold text-stone-900 text-base">Select Soil Type for Your Plot</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'black', name: 'Black Soil (काली)' },
              { id: 'loamy', name: 'Loamy Soil (दोमट)' },
              { id: 'alluvial', name: 'Alluvial Soil (जलोढ़)' },
              { id: 'clay', name: 'Clay Soil (चिकनी)' },
              { id: 'sandy', name: 'Sandy Soil (रेतीली)' },
              { id: 'red', name: 'Red Soil (लाल)' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSoilType(st.id)}
                className={`p-3 border rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  soilType === st.id
                    ? 'bg-[#2F7D4F] text-white border-[#2F7D4F]'
                    : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>

          <Button onClick={() => setConfirmed(true)} className="w-full">
            Confirm Soil Profile
          </Button>

          {confirmed && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> Soil profile set to {soilType.toUpperCase()} soil.
            </div>
          )}
        </Card>
      )}

      {(selectedPath === 'health_card' || selectedPath === 'report') && (
        <Card className="p-6 space-y-4 border border-stone-200 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-[#2F7D4F] rounded-full mx-auto flex items-center justify-center">
            <Upload size={24} />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Upload Document (PDF / JPG / PNG)</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Files are stored privately in non-public storage. You will manually confirm all extracted values before saving.
          </p>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="soil-file" />
          <label htmlFor="soil-file">
            <Button variant="outline" className="cursor-pointer">
              Choose Document File
            </Button>
          </label>
        </Card>
      )}
    </div>
  );
}
