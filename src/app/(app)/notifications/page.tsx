'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Mail, CheckCheck, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';

const PREF_LABELS: Record<string, string> = {
  crop_stage: 'Crop Growth Stage Updates',
  task: 'Scheduled Task Reminders',
  irrigation: 'Irrigation Alerts',
  weather: 'Weather & Spray Advisories',
  disease: 'Crop Disease Alerts',
  order: 'Fertilizer Store Orders',
  market: 'Mandi Price Alerts',
  security: 'Account Sign-In Security Notices',
};

export default function NotificationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/notifications');
      if (!res.ok) throw new Error('Unable to load notifications.');
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    setBusy(true);
    await fetch('/api/v1/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    await load();
    setBusy(false);
  };

  const triggerDueReminders = async () => {
    setBusy(true);
    const res = await fetch('/api/v1/scheduled/reminders', { method: 'POST' });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data) {
      setNotice(
        `Processed ${json.data.checked} due reminders (${json.data.sent} sent, ${json.data.skipped} skipped).`
      );
      setTimeout(() => setNotice(''), 4000);
    }
    await load();
    setBusy(false);
  };

  const togglePref = async (type: string, channel: 'in_app' | 'email', enabled: boolean) => {
    await fetch('/api/v1/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, channel, enabled }),
    });
    await load();
  };

  return (
    <DataState status={loading ? 'loading' : error ? 'error' : 'success'} errorMessage={error} onRetry={load}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#143D2A] flex items-center gap-2">
              <Bell size={22} className="text-[#2F7D4F]" /> Notification Center &amp; Email Alerts
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Track crop lifecycle reminders, weather alerts, store orders, and manage email preferences.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={triggerDueReminders} isLoading={busy}>
              <RefreshCw size={14} className="mr-1" /> Check Due Reminders
            </Button>
            <Button size="sm" onClick={markAllRead} isLoading={busy}>
              <CheckCheck size={14} className="mr-1" /> Mark All Read
            </Button>
          </div>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-[#2F7D4F]" /> {notice}
          </div>
        )}

        {/* Email Provider Status Banner */}
        {data?.emailProvider && (
          <Card className="p-4 rounded-2xl bg-[#F7F8F5] border border-stone-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-[#2F7D4F]" />
              <span>
                <strong>Email Delivery Engine:</strong>{' '}
                {data.emailProvider.configured
                  ? `Active (${data.emailProvider.provider.toUpperCase()})`
                  : 'Local Audit Outbox Mode (Configure SMTP_HOST or RESEND_API_KEY in .env for external inbox delivery)'}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              <ShieldCheck size={11} /> Deduplication Active
            </span>
          </Card>
        )}

        {/* In-App Notifications Feed */}
        <Card className="p-5 rounded-2xl space-y-3">
          <h2 className="font-bold text-stone-900 text-base">
            Recent Alerts ({data?.unreadCount || 0} unread)
          </h2>
          {!data?.notifications?.length ? (
            <p className="text-xs text-stone-500 py-6 text-center">
              No notifications yet. Start a crop cycle or place a store order to receive automated reminders.
            </p>
          ) : (
            <div className="space-y-2">
              {data.notifications.map((n: any) => {
                let actionUrl = '';
                try {
                  actionUrl = JSON.parse(n.paramsJson || '{}')?.actionUrl || '';
                } catch {}
                return (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      n.readAt ? 'bg-white border-stone-200' : 'bg-emerald-50/70 border-emerald-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {!n.readAt && <span className="w-2 h-2 rounded-full bg-[#2F7D4F]" />}
                        <span className="font-bold text-stone-900">{n.titleKey}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold">
                          {n.type}
                        </span>
                      </div>
                      <p className="text-stone-600 leading-relaxed">{n.bodyKey}</p>
                      <span className="text-[10px] text-stone-400">
                        {new Date(n.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {actionUrl && (
                      <Link href={actionUrl} className="text-xs font-bold text-[#2F7D4F] hover:underline shrink-0">
                        Open →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Notification Preferences */}
        {data?.preferences && (
          <Card className="p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-stone-900 text-base">Notification &amp; Email Preferences</h2>
            <div className="divide-y divide-stone-100 text-xs">
              {data.preferences.map((pref: any) => (
                <div key={pref.type} className="py-2.5 flex items-center justify-between gap-4">
                  <span className="font-semibold text-stone-800">{PREF_LABELS[pref.type] || pref.type}</span>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.in_app}
                        onChange={(e) => togglePref(pref.type, 'in_app', e.target.checked)}
                      />
                      <span>In-App</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.email}
                        onChange={(e) => togglePref(pref.type, 'email', e.target.checked)}
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Email Delivery Audit Log */}
        {data?.recentEmails && data.recentEmails.length > 0 && (
          <Card className="p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-stone-900 text-base">Recent Email Delivery Log</h2>
            <div className="space-y-2 text-xs">
              {data.recentEmails.map((em: any) => (
                <div
                  key={em.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-stone-900">{em.subject}</p>
                    <p className="text-[11px] text-stone-500">
                      Template: {em.templateKey} • Provider: {em.provider} •{' '}
                      {new Date(em.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      em.status === 'sent'
                        ? 'bg-emerald-100 text-emerald-800'
                        : em.status === 'simulated'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {em.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DataState>
  );
}
