'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Tractor,
  Sprout,
  Activity,
  Database,
  CheckCircle2,
  TrendingUp,
  Package,
  ShoppingBag,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Clock,
  Lock,
  Mail,
  Send,
  XCircle,
} from 'lucide-react';
import { DataState } from '@/components/ui/DataState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { PermissionDeniedState } from '@/components/ui/StatusFeedback';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [syncHealth, setSyncHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);

  const [emailDiag, setEmailDiag] = useState<any>(null);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailActionMsg, setEmailActionMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    try {
      const [overviewRes, mRes, pRes, healthRes, emailRes] = await Promise.all([
        fetch('/api/v1/admin/overview'),
        fetch('/api/v1/market/status'),
        fetch('/api/v1/store/products'),
        fetch('/api/v1/admin/market/sync'),
        fetch('/api/v1/admin/email-diagnostics'),
      ]);

      if (overviewRes.status === 401 || overviewRes.status === 403 || healthRes.status === 401 || healthRes.status === 403) {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      if (emailRes.ok) {
        const eData = await emailRes.json();
        if (eData?.data) setEmailDiag(eData.data);
      }

      if (!overviewRes.ok && !healthRes.ok) {
        throw new Error(`Failed to load admin telemetry (HTTP ${overviewRes.status})`);
      }

      if (overviewRes.ok) {
        const ov = await overviewRes.json();
        setStats(ov.data);
        setOrders(ov.data?.orders || []);
      }
      if (mRes.ok) {
        const m = await mRes.json();
        setMarketStatus(m.data);
      }
      if (pRes.ok) {
        const p = await pRes.json();
        setStoreProducts(p.data || []);
      }
      if (healthRes.ok) {
        const h = await healthRes.json();
        if (h?.data) {
          setSyncHealth(h.data);
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Unable to load admin console data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    setSyncError(null);
    try {
      const res = await fetch('/api/v1/admin/market/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.status === 409) {
        setSyncError(json?.meta?.message || json?.error?.message || 'Sync lock active: Another job is currently running.');
      } else if (res.ok && json.data) {
        const d = json.data;
        if (d.status === 'skipped_locked') {
          setSyncError(`Sync skipped: lock is held until ${d.lockedUntil || 'soon'}.`);
        } else {
          setSyncMsg(
            `Sync ${d.status}: ${d.recordsFetched} fetched, ${d.recordsStored} stored, ${d.recordsSkipped || 0} skipped, ${d.anomalies || 0} anomalies (${d.durationMs}ms). Source: ${d.triggerSource || 'manual'}`
          );
        }
      } else {
        setSyncError(`Sync failed: ${json.error?.message || res.statusText}`);
      }
      await fetchAdminData();
    } catch (e: any) {
      setSyncError(`Sync error: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleVerifyEmailProvider = async () => {
    setVerifyingEmail(true);
    setEmailActionMsg(null);
    try {
      const res = await fetch('/api/v1/admin/email-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_provider' }),
      });
      const json = await res.json();
      if (res.ok && json.data?.ok) {
        setEmailActionMsg(`Success: ${json.data.message} (${json.data.latencyMs}ms)`);
      } else {
        setEmailActionMsg(`Provider Check: ${json.data?.message || json.error?.message || 'Verification failed'}`);
      }
    } catch (e: any) {
      setEmailActionMsg(`Connection test error: ${e.message}`);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleRetryEmail = async (logId: string) => {
    setRetryingLogId(logId);
    setEmailActionMsg(null);
    try {
      const res = await fetch('/api/v1/admin/email-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', logId }),
      });
      const json = await res.json();
      if (res.ok) {
        setEmailActionMsg(json.data?.message || 'Retry completed.');
        const fresh = await fetch('/api/v1/admin/email-diagnostics').then((r) => r.json());
        if (fresh?.data) setEmailDiag(fresh.data);
      } else {
        setEmailActionMsg(`Retry failed: ${json.error?.message || 'Delivery error'}`);
      }
    } catch (e: any) {
      setEmailActionMsg(`Retry error: ${e.message}`);
    } finally {
      setRetryingLogId(null);
    }
  };

  if (permissionDenied) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <PermissionDeniedState
          title="Administrative Access Restricted"
          message="You do not have administrative permissions to view the operations console, or your session has expired. Please sign in with an administrator account."
          loginUrl="/login?redirect=/admin"
        />
      </div>
    );
  }

  return (
    <DataState
      status={loading ? 'loading' : error ? 'error' : 'success'}
      errorMessage={error || undefined}
      onRetry={fetchAdminData}
    >
      <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 font-sans">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0F2D1F] text-white rounded-xl flex items-center justify-center font-bold shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Admin & Operations Console</h1>
              <p className="text-xs text-stone-500">Mandi feed synchronization, fertilizer store catalog, and system provenance audits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button size="sm" variant="outline">
                Farmer App
              </Button>
            </Link>
            <Link href="/">
              <Button size="sm">
                Homepage
              </Button>
            </Link>
          </div>
        </div>

        {/* System Health Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Database Storage</span>
              <span className="text-sm font-bold text-stone-900">SQLite (dev.db)</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 text-sky-800 rounded-lg flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Weather Telemetry</span>
              <span className="text-sm font-bold text-stone-900">Open-Meteo & Demo</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Mandi Feed Source</span>
              <span className="text-sm font-bold text-stone-900">AGMARKNET (DMI)</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 block">Store Orders</span>
              <span className="text-sm font-bold text-stone-900">{orders.length} Active Orders</span>
            </div>
          </Card>
        </div>

        {/* Section: Market Synchronization Manager */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#2F7D4F]" /> AGMARKNET Mandi Price Sync Engine
                </h2>
                {syncHealth?.isLocked ? (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Lock size={10} /> Sync Lock Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={10} /> Lock Idle / Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Automated twice-daily wholesale price polling with database-backed run guards and provenance tracking
              </p>
            </div>
            <button
              onClick={handleTriggerSync}
              disabled={syncing || syncHealth?.isLocked}
              className="px-4 py-2 bg-[#2F7D4F] hover:bg-[#25663f] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Synchronizing...' : 'Sync Now (Manual)'}
            </button>
          </div>

          {syncMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>{syncMsg}</span>
            </div>
          )}

          {syncError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-medium flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-700 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {/* Sync Health Diagnostic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Last Success */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                <span>Last Successful Run</span>
                <CheckCircle2 size={14} className="text-emerald-600" />
              </div>
              <p className="font-extrabold text-stone-900 text-sm">
                {syncHealth?.lastSuccess
                  ? new Date(syncHealth.lastSuccess.timestamp).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }) + ' IST'
                  : 'No successful run yet'}
              </p>
              <p className="text-stone-500 text-[11px]">
                {syncHealth?.lastSuccess
                  ? `${syncHealth.lastSuccess.recordsStored} stored • ${syncHealth.lastSuccess.durationMs || 0}ms (${syncHealth.lastSuccess.triggerSource})`
                  : 'Awaiting initial trigger'}
              </p>
            </div>

            {/* 2. Last Attempt */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                <span>Last Attempt</span>
                <Activity size={14} className="text-stone-500" />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${syncHealth?.lastAttempt?.status === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : syncHealth?.lastAttempt?.status === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : syncHealth?.lastAttempt?.status === 'skipped_locked'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                >
                  {syncHealth?.lastAttempt?.status || 'None'}
                </span>
                <span className="font-bold text-stone-900 text-xs">
                  {syncHealth?.lastAttempt?.triggerSource || 'system'}
                </span>
              </div>
              <p className="text-stone-500 text-[11px] truncate">
                {syncHealth?.lastAttempt?.errorMessage
                  ? syncHealth.lastAttempt.errorMessage
                  : `${syncHealth?.lastAttempt?.recordsStored || 0} stored, ${syncHealth?.lastAttempt?.recordsSkipped || 0} skipped`}
              </p>
            </div>

            {/* 3. Next Scheduled Run */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                <span>Next Scheduled Run</span>
                <Clock size={14} className="text-sky-600" />
              </div>
              <p className="font-extrabold text-stone-900 text-sm">
                {syncHealth?.nextScheduledRun?.nextRunFormattedIST || '06:30 IST'}
              </p>
              <p className="text-stone-500 text-[11px]">
                {syncHealth?.nextScheduledRun?.cadence || 'Twice daily'} ({syncHealth?.nextScheduledRun?.cronExpressionUtc} UTC)
              </p>
            </div>

            {/* 4. Data Freshness & Provenance */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                <span>Data Freshness & Integrity</span>
                <Database size={14} className="text-purple-600" />
              </div>
              <p className="font-extrabold text-stone-900 text-sm">
                Arrival: {syncHealth?.dataFreshness?.latestReportedArrivalDate || 'N/A'}
              </p>
              <p className="text-stone-500 text-[11px]">
                Synced: {syncHealth?.dataFreshness?.latestLocalSyncTimestamp
                  ? new Date(syncHealth.dataFreshness.latestLocalSyncTimestamp).toLocaleTimeString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                  }) + ' IST'
                  : 'N/A'}{' '}
                • {syncHealth?.dataFreshness?.totalStoredRecords || 0} rows (
                {syncHealth?.dataFreshness?.isDemoData ? 'Demo/Fallback' : 'Live Official'})
              </p>
            </div>
          </div>

          {/* Recent Sync Audit Log Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center justify-between">
              <span>Recent Synchronization Runs (Audit Trail):</span>
              <span className="text-[11px] text-stone-500 font-normal">Last {syncHealth?.recentLogs?.length || 0} invocations</span>
            </h3>

            {(!syncHealth?.recentLogs || syncHealth.recentLogs.length === 0) ? (
              <p className="text-stone-500 text-xs italic py-2">No sync logs recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-stone-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Run Time (IST)</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Provider</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Fetched</th>
                      <th className="py-2.5 px-3 text-right">Stored</th>
                      <th className="py-2.5 px-3 text-right">Skipped</th>
                      <th className="py-2.5 px-3 text-right">Duration</th>
                      <th className="py-2.5 px-3">Details / Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {syncHealth.recentLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-stone-50/50">
                        <td className="py-2.5 px-3 font-semibold text-stone-900 whitespace-nowrap">
                          {new Date(log.startedAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 capitalize">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                            {log.triggerSource || 'scheduled'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 truncate max-w-[120px]">{log.provider}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : log.status === 'skipped_locked'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">{log.recordsFetched}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">{log.recordsStored}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-500">{log.recordsSkipped || 0}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-500">{log.durationMs != null ? `${log.durationMs}ms` : '-'}</td>
                        <td className="py-2.5 px-3 text-stone-500 text-[11px] truncate max-w-[200px]" title={log.errorMessage || 'Clean run'}>
                          {log.errorMessage ? (
                            <span className="text-rose-600">{log.errorMessage}</span>
                          ) : (
                            <span className="text-emerald-700">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Section: Fertilizer Store & Orders Manager */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Package size={18} className="text-amber-600" /> Fertilizer Catalog & Inventory
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Active cooperative products, real-time stock counts, and customer orders
              </p>
            </div>
            <Link
              href="/fertilizers"
              className="text-xs font-bold text-[#2F7D4F] hover:underline"
            >
              View Public Store →
            </Link>
          </div>

          {/* Active Product Inventory List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Active Cooperative Inventory ({storeProducts.length} Products):
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] border-b border-stone-100">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Brand</th>
                    <th className="py-2.5 px-3">Pack Size</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-center">Available Stock</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {storeProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 px-3 font-bold text-stone-900">{p.name}</td>
                      <td className="py-2.5 px-3 text-stone-600">{p.brand?.name}</td>
                      <td className="py-2.5 px-3 text-stone-600">{p.packSize}</td>
                      <td className="py-2.5 px-3 text-right font-black text-stone-900">₹{p.price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-800">{p.stock} units</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                          Live
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Customer Orders Dispatches ({orders.length} Total):
            </h3>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="p-3.5 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">Order #{o.orderNumber}</span>
                    <span className="text-stone-500 ml-2">• Customer: {o.deliveryName} ({o.deliveryDistrict})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-stone-900">₹{o.totalAmount.toFixed(2)}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px] uppercase">
                      {o.status}
                    </span>
                    <Link href={`/orders/${o.id}`} className="text-[#2F7D4F] font-bold hover:underline">
                      Inspect →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Email Delivery & Lifecycle Reminders Diagnostics */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Mail size={18} className="text-[#2F7D4F]" /> Email Infrastructure &amp; Crop Reminder Delivery
                </h2>
                {emailDiag?.provider?.configured ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={10} /> {emailDiag.provider.provider.toUpperCase()} Configured
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle size={10} /> Unconfigured (Local Outbox)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Truthful delivery telemetry for verification, password resets, crop stages, and farming reminders
              </p>
            </div>
            <button
              onClick={handleVerifyEmailProvider}
              disabled={verifyingEmail}
              className="px-4 py-2 bg-[#143D2A] hover:bg-[#2F7D4F] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <RefreshCw size={14} className={verifyingEmail ? 'animate-spin' : ''} />
              {verifyingEmail ? 'Testing Handshake...' : 'Verify Provider Handshake'}
            </button>
          </div>

          {emailActionMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>{emailActionMsg}</span>
            </div>
          )}

          {/* Metric Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-stone-500 block">Total Dispatches</span>
              <span className="text-lg font-extrabold text-stone-900">{emailDiag?.counts?.total ?? 0}</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-600 block">Accepted</span>
              <span className="text-lg font-extrabold text-emerald-800">{emailDiag?.counts?.accepted ?? 0}</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-blue-600 block">Delivered</span>
              <span className="text-lg font-extrabold text-blue-800">{emailDiag?.counts?.delivered ?? 0}</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-600 block">Pending/Queued</span>
              <span className="text-lg font-extrabold text-amber-800">{emailDiag?.counts?.pending ?? 0}</span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-rose-600 block">Failed/Bounced</span>
              <span className="text-lg font-extrabold text-rose-800">
                {(emailDiag?.counts?.failed ?? 0) + (emailDiag?.counts?.bounced ?? 0)}
              </span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-stone-500 block">Simulated</span>
              <span className="text-lg font-extrabold text-stone-700">{emailDiag?.counts?.simulated ?? 0}</span>
            </div>
          </div>

          {/* Warnings & Notes */}
          {emailDiag?.provider?.warnings?.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              {emailDiag.provider.warnings.map((w: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Email Delivery Audit Trail Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center justify-between">
              <span>Recent Email Delivery Logs ({emailDiag?.logs?.length || 0} Records):</span>
              <span className="text-[11px] text-stone-500 font-normal">Auto-logged with provider Message-IDs</span>
            </h3>

            {(!emailDiag?.logs || emailDiag.logs.length === 0) ? (
              <p className="text-stone-500 text-xs italic py-2">No email activity recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-stone-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Date (IST)</th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Provider</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Message ID</th>
                      <th className="py-2.5 px-3">Error / Status Details</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {emailDiag.logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-stone-50/50">
                        <td className="py-2.5 px-3 font-semibold text-stone-900 whitespace-nowrap">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-800 font-mono" title={log.toEmail}>
                          {log.toEmailMasked}
                        </td>
                        <td className="py-2.5 px-3 text-stone-700 capitalize">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                            {log.templateKey.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 uppercase font-bold text-[10px]">
                          {log.provider}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.status === 'delivered'
                                ? 'bg-blue-100 text-blue-800'
                                : log.status === 'accepted' || log.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'not_configured'
                                    ? 'bg-stone-100 text-stone-700'
                                    : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500 truncate max-w-[140px]" title={log.providerMessageId || 'N/A'}>
                          {log.providerMessageId ? log.providerMessageId.slice(0, 16) + '...' : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-500 text-[11px] truncate max-w-[200px]" title={log.errorMessage || 'Clean submission'}>
                          {log.errorMessage ? (
                            <span className="text-rose-600 font-medium">{log.errorMessage}</span>
                          ) : (
                            <span className="text-emerald-700">OK</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {log.canRetry && (
                            <button
                              onClick={() => handleRetryEmail(log.id)}
                              disabled={retryingLogId === log.id}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded text-[10px] cursor-pointer disabled:opacity-50"
                            >
                              {retryingLogId === log.id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DataState>
  );
}
