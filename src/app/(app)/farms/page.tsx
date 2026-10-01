'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tractor, Plus, MapPin, Grid, ArrowRight } from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

export default function FarmsPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFarms = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/farms');
      if (!res.ok) throw new Error('Failed to load farms');
      const data = await res.json();
      setFarms(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : farms.length === 0 ? 'empty' : 'success'}
      errorMessage={error}
      emptyTitle="No farms registered yet"
      emptyDescription="Create your first farm location to begin field mapping and crop management."
      emptyAction={
        <Link href="/farms/new">
          <Button size="sm">
            <Plus size={14} className="mr-1" /> Add Your First Farm
          </Button>
        </Link>
      }
      onRetry={fetchFarms}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">My Farms</h1>
            <p className="text-xs text-stone-600 mt-1">Manage your agricultural locations and plots</p>
          </div>
          <Link href="/farms/new">
            <Button>
              <Plus size={16} className="mr-1" /> Add New Farm
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farms.map((farm) => (
            <Card key={farm.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-[#2F7D4F] rounded-xl flex items-center justify-center font-bold">
                    <Tractor size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">{farm.name}</h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {farm.village ? `${farm.village}, ` : ''}{farm.district}, {farm.state}
                    </p>
                  </div>
                </div>
                <ProvenanceChip type="user_entered" />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500 block">Total Area:</span>
                  <span className="font-bold text-stone-900">{farm.areaInputValue || farm.totalAreaHa} {farm.areaInputUnit || 'ha'}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Farm Type:</span>
                  <span className="font-bold text-stone-900 capitalize">{farm.farmType || 'irrigated'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-stone-500 font-medium">
                  {farm.fields?.length || 0} Fields Registered
                </span>
                <Link href={`/farms/${farm.id}`}>
                  <Button size="sm" variant="outline">
                    View Details <ArrowRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DataState>
  );
}
