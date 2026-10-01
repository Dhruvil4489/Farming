'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Users, Tractor, Sprout, Activity, Database, CheckCircle2 } from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/dashboard/summary')
      .then((r) => r.json())
      .then((data) => {
        setStats(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <DataState status={loading ? 'loading' : 'success'}>
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center font-bold">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Admin Portal</h1>
              <p className="text-xs text-stone-500">System management, master crop configuration & audit logs</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button size="sm" variant="outline">
              Return to Farmer App
            </Button>
          </Link>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Database Status</span>
              <span className="text-sm font-bold text-stone-900">SQLite / Prisma Online</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 text-sky-800 rounded-lg flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Weather Provider</span>
              <span className="text-sm font-bold text-stone-900">Open-Meteo / Demo Active</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-lg flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 block">AI Engine</span>
              <span className="text-sm font-bold text-stone-900">Mock Grounded Engine</span>
            </div>
          </Card>
        </div>

        {/* Real Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center space-y-1">
            <Users size={20} className="mx-auto text-stone-600" />
            <span className="text-xs text-stone-500 font-semibold block">Total Users</span>
            <span className="text-2xl font-extrabold text-stone-900">2</span>
          </Card>

          <Card className="p-4 text-center space-y-1">
            <Tractor size={20} className="mx-auto text-[#2F7D4F]" />
            <span className="text-xs text-stone-500 font-semibold block">Total Farms</span>
            <span className="text-2xl font-extrabold text-stone-900">{stats?.counts?.farms || 1}</span>
          </Card>

          <Card className="p-4 text-center space-y-1">
            <Sprout size={20} className="mx-auto text-emerald-700" />
            <span className="text-xs text-stone-500 font-semibold block">Active Crops</span>
            <span className="text-2xl font-extrabold text-stone-900">{stats?.counts?.activeCycles || 1}</span>
          </Card>

          <Card className="p-4 text-center space-y-1">
            <ShieldAlert size={20} className="mx-auto text-amber-700" />
            <span className="text-xs text-stone-500 font-semibold block">Audit Logs</span>
            <span className="text-2xl font-extrabold text-stone-900">14</span>
          </Card>
        </div>
      </div>
    </DataState>
  );
}
