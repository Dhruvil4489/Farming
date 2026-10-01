'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Grid, Plus, Layers, MapPin, Sprout } from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapView } from '@/components/domain/MapView';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

export default function FieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFields = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/fields');
      if (!res.ok) throw new Error('Failed to load fields');
      const data = await res.json();
      setFields(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : fields.length === 0 ? 'empty' : 'success'}
      errorMessage={error}
      emptyTitle="No field plots created"
      emptyDescription="Create specific field plots under your farm to associate crop cycles, soil reports, and tasks."
      emptyAction={
        <Link href="/fields/new">
          <Button size="sm">
            <Plus size={14} className="mr-1" /> Add Your First Field Plot
          </Button>
        </Link>
      }
      onRetry={fetchFields}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Field Plots</h1>
            <p className="text-xs text-stone-600 mt-1">Manage field boundaries and soil parameters</p>
          </div>
          <Link href="/fields/new">
            <Button>
              <Plus size={16} className="mr-1" /> Add New Field Plot
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <Card key={field.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">{field.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Farm: {field.farm?.name}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                  {field.status}
                </span>
              </div>

              <MapView lat={field.centroidLat || 22.2405} lng={field.centroidLng || 73.0848} className="h-[180px]" />

              <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs text-center">
                <div>
                  <span className="text-stone-500 block text-[10px]">Area</span>
                  <span className="font-bold text-stone-900">{field.areaHa || 1.0} Ha</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">Irrigation</span>
                  <span className="font-bold text-stone-900 capitalize">{field.irrigationType}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">Soil Type</span>
                  <span className="font-bold text-stone-900 capitalize">{field.soilType}</span>
                </div>
              </div>

              {field.cropCycles?.[0] ? (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sprout size={16} className="text-[#2F7D4F]" />
                    <span className="font-bold text-emerald-950">
                      Active: {field.cropCycles[0].crop?.name || 'Crop'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                    Stage: {field.cropCycles[0].status}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic">No active crop cycle in this field.</p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </DataState>
  );
}
