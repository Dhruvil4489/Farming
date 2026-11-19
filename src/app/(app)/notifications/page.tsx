'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  CheckCheck,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Droplet,
  Sprout,
  ShieldAlert,
  AlertTriangle,
  Wheat,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';
import { useI18n, type Locale } from '@/providers/I18nProvider';

type FilterTab = 'all' | 'unread' | 'irrigation' | 'fertilizer' | 'crop_care' | 'harvesting';

interface NotificationItem {
  id: string;
  type: string;
  category?: string;
  title: string;
  body: string;
  actionUrl?: string;
  cropName?: string;
  fieldName?: string;
  readAt: string | null;
  createdAt: string;
}

const TAB_LABELS: Record<Locale, Record<FilterTab, string>> = {
  en: {
    all: 'All Alerts',
    unread: 'Unread',
    irrigation: 'Irrigation',
    fertilizer: 'Fertilizer',
    crop_care: 'Crop Care & Pest',
    harvesting: 'Harvesting',
  },
  hi: {
    all: 'सभी सूचनाएं',
    unread: 'अपठित',
    irrigation: 'सिंचाई',
    fertilizer: 'उर्वरक',
    crop_care: 'फसल देखभाल व कीट',
    harvesting: 'कटाई तैयारी',
  },
  gu: {
    all: 'તમામ સૂચનાઓ',
    unread: 'ન વાંચેલ',
    irrigation: 'સિંચાઈ',
    fertilizer: 'ખાતર',
    crop_care: 'પાક સંભાળ અને જીવાત',
    harvesting: 'કાપણી તૈયારી',
  },
};

const UI_TEXT: Record<Locale, Record<string, string>> = {
  en: {
    title: 'Farmer Notification Center & Activity Reminders',
    subtitle: 'Automated reminders for irrigation, fertilizer dosage, crop scouting, sprays, and approaching harvest.',
    checkDue: 'Check Due Reminders',
    markAllRead: 'Mark All Read',
    clearRead: 'Clear Read Alerts',
    markRead: 'Mark Read',
    delete: 'Dismiss',
    openAction: 'View Details',
    noAlerts: 'No alerts found in this category.',
    noAlertsSub: 'Automated notifications will appear here as your crop cycles advance and field activities become due.',
    emailEngine: 'Email Delivery Engine',
    dedupeBadge: 'Smart Deduplication Active',
    preferencesTitle: 'Notification & Email Channel Preferences',
    recentLogs: 'Recent Email Delivery Audit Outbox',
  },
  hi: {
    title: 'किसान अधिसूचना केंद्र एवं कृषि कार्य अनुस्मारक',
    subtitle: 'सिंचाई, खाद, फसल रोग निगरानी, छिड़काव और कटाई की तैयारी के लिए स्वचालित रिमाइंडर।',
    checkDue: 'बकाया अनुस्मारक जांचें',
    markAllRead: 'सभी को पढ़ा हुआ चिन्हित करें',
    clearRead: 'पढ़ी गई सूचनाएं हटाएं',
    markRead: 'पढ़ा हुआ',
    delete: 'हटाएं',
    openAction: 'विवरण देखें',
    noAlerts: 'इस श्रेणी में कोई सूचना नहीं है।',
    noAlertsSub: 'जैसे-जैसे फसल चक्र आगे बढ़ेगा और कार्य देय होंगे, यहां स्वचालित अलर्ट दिखाई देंगे।',
    emailEngine: 'ईमेल वितरण प्रणाली',
    dedupeBadge: 'स्मार्ट डुप्लीकेशन नियंत्रण सक्रिय',
    preferencesTitle: 'अधिसूचना एवं ईमेल चैनल प्राथमिकताएं',
    recentLogs: 'हालिया ईमेल आउटबॉक्स लॉग',
  },
  gu: {
    title: 'ખેડૂત સૂચના કેન્દ્ર અને કૃષિ કાર્ય રીમાઇન્ડર્સ',
    subtitle: 'પિયત, ખાતર, પાક સંભાળ, જંતુનાશક છંટકાવ અને કાપણી તૈયારી માટેના સમયસર ઓટોમેટેડ એલર્ટ.',
    checkDue: 'બાકી રીમાઇન્ડર્સ તપાસો',
    markAllRead: 'બધા વાંચેલા તરીકે માર્ક કરો',
    clearRead: 'વાંચેલ સૂચનાઓ દૂર કરો',
    markRead: 'વાંચેલ',
    delete: 'દૂર કરો',
    openAction: 'વિગતો જુઓ',
    noAlerts: 'આ શ્રેણીમાં કોઈ સૂચના નથી.',
    noAlertsSub: 'જેમ જેમ તમારા પાકનો વિકાસ આગળ વધશે, તેમ અહીં સમયસર ઓટોમેટેડ એલર્ટ જોવા મળશે.',
    emailEngine: 'ઇમેઇલ વિતરણ સિસ્ટમ',
    dedupeBadge: 'સ્માર્ટ ડુપ્લિકેશન સુરક્ષા સક્રિય',
    preferencesTitle: 'સૂચના અને ઇમેઇલ ચેનલ પસંદગીઓ',
    recentLogs: 'તાજેતરના ઇમેઇલ આઉટબૉક્સ લૉગ',
  },
};

const PREF_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    crop_stage: 'Crop Growth Stage Updates',
    task: 'Scheduled Task & Overdue Alerts',
    irrigation: 'Irrigation & Watering Reminders',
    fertilizer: 'Fertilizer Application Dates',
    weather: 'Weather & Spray Advisories',
    disease: 'Crop Disease & Pest Warnings',
    order: 'Fertilizer Store Orders',
    market: 'Live Mandi Price Alerts',
    security: 'Account Sign-In Notices',
  },
  hi: {
    crop_stage: 'फसल विकास अवस्था अपडेट',
    task: 'अनुसूचित कार्य एवं बकाया अलर्ट',
    irrigation: 'सिंचाई एवं जल प्रबंधन रिमाइंडर',
    fertilizer: 'उर्वरक अनुप्रयोग तिथियां',
    weather: 'मौसम एवं छिड़काव परामर्श',
    disease: 'फसल रोग एवं कीट चेतावनी',
    order: 'खाद एवं उर्वरक स्टोर ऑर्डर',
    market: 'मंडी भाव सूचनाएं',
    security: 'खाता सुरक्षा सूचनाएं',
  },
  gu: {
    crop_stage: 'પાક વૃદ્ધિ તબક્કા અપડેટ',
    task: 'નિર્ધારિત કાર્યો અને બાકી એલર્ટ',
    irrigation: 'પિયત અને સિંચાઈ રીમાઇન્ડર્સ',
    fertilizer: 'ખાતર આપવાની તારીખો',
    weather: 'હવામાન અને છંટકાવ માર્ગદર્શન',
    disease: 'પાક રોગ અને જીવાત ચેતવણી',
    order: 'ખાતર સ્ટોર ઓર્ડર્સ',
    market: 'લાઈવ માર્કેટ યાર્ડ ભાવ',
    security: 'એકાઉન્ટ સુરક્ષા સૂચનાઓ',
  },
};

export default function NotificationsPage() {
  const { locale } = useI18n();
  const activeLocale = (['en', 'hi', 'gu'].includes(locale) ? locale : 'en') as Locale;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const ui = UI_TEXT[activeLocale] || UI_TEXT.en;
  const tabs = TAB_LABELS[activeLocale] || TAB_LABELS.en;
  const prefsLabels = PREF_LABELS[activeLocale] || PREF_LABELS.en;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/notifications?lang=${activeLocale}`);
      if (!res.ok) throw new Error('Unable to load notifications.');
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeLocale]);

  useEffect(() => {
    load();
  }, [load]);

  const notifyUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notifications-updated'));
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      await fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      // Optimistic update
      if (data?.notifications) {
        setData({
          ...data,
          unreadCount: 0,
          notifications: data.notifications.map((n: NotificationItem) => ({
            ...n,
            readAt: n.readAt || new Date().toISOString(),
          })),
        });
      }
      notifyUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (data?.notifications) {
        setData({
          ...data,
          unreadCount: Math.max(0, (data.unreadCount || 1) - 1),
          notifications: data.notifications.map((n: NotificationItem) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
          ),
        });
      }
      notifyUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSingle = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications?id=${id}`, {
        method: 'DELETE',
      });
      if (data?.notifications) {
        const deletedItem = data.notifications.find((n: NotificationItem) => n.id === id);
        const wasUnread = deletedItem && !deletedItem.readAt;
        setData({
          ...data,
          unreadCount: wasUnread ? Math.max(0, (data.unreadCount || 1) - 1) : data.unreadCount,
          notifications: data.notifications.filter((n: NotificationItem) => n.id !== id),
        });
      }
      notifyUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const clearReadAlerts = async () => {
    setBusy(true);
    try {
      await fetch('/api/v1/notifications?readOnly=true', {
        method: 'DELETE',
      });
      if (data?.notifications) {
        setData({
          ...data,
          notifications: data.notifications.filter((n: NotificationItem) => !n.readAt),
        });
      }
      notifyUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const triggerDueReminders = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/v1/scheduled/reminders', { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data) {
        const d = json.data;
        const msg =
          activeLocale === 'gu'
            ? `તપાસ પૂર્ણ: ${d.scannedCycles || 0} પાક જીવનચક્ર, ${d.createdFromScan || 0} નવા એલર્ટ નિર્ધારિત થયા.`
            : activeLocale === 'hi'
            ? `जांच पूर्ण: ${d.scannedCycles || 0} फसल चक्र, ${d.createdFromScan || 0} नए अलर्ट सृजित किए गए।`
            : `Sync complete: ${d.scannedCycles || 0} crop cycles scanned, ${d.createdFromScan || 0} new reminders generated.`;
        setNotice(msg);
        setTimeout(() => setNotice(''), 5000);
      }
      await load();
      notifyUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const togglePref = async (type: string, channel: 'in_app' | 'email', enabled: boolean) => {
    await fetch('/api/v1/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, channel, enabled }),
    });
    await load();
  };

  // Filtered notifications calculation & counts
  const allNotifications: NotificationItem[] = data?.notifications || [];

  const counts = useMemo(() => {
    return {
      all: allNotifications.length,
      unread: allNotifications.filter((n) => !n.readAt).length,
      irrigation: allNotifications.filter((n) => n.category === 'irrigation' || n.type === 'irrigation').length,
      fertilizer: allNotifications.filter((n) => n.category === 'fertilizer' || n.type === 'fertilizer').length,
      crop_care: allNotifications.filter(
        (n) =>
          n.category === 'scouting' ||
          n.category === 'spray' ||
          n.category === 'crop_stage' ||
          n.type === 'scouting' ||
          n.type === 'spray' ||
          n.type === 'disease' ||
          n.type === 'pest' ||
          n.type === 'crop_stage'
      ).length,
      harvesting: allNotifications.filter(
        (n) => n.category === 'harvest' || n.type === 'harvest' || n.type === 'harvesting'
      ).length,
    };
  }, [allNotifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return allNotifications.filter((n) => !n.readAt);
      case 'irrigation':
        return allNotifications.filter((n) => n.category === 'irrigation' || n.type === 'irrigation');
      case 'fertilizer':
        return allNotifications.filter((n) => n.category === 'fertilizer' || n.type === 'fertilizer');
      case 'crop_care':
        return allNotifications.filter(
          (n) =>
            n.category === 'scouting' ||
            n.category === 'spray' ||
            n.category === 'crop_stage' ||
            n.type === 'scouting' ||
            n.type === 'spray' ||
            n.type === 'disease' ||
            n.type === 'pest' ||
            n.type === 'crop_stage'
        );
      case 'harvesting':
        return allNotifications.filter(
          (n) => n.category === 'harvest' || n.type === 'harvest' || n.type === 'harvesting'
        );
      case 'all':
      default:
        return allNotifications;
    }
  }, [allNotifications, activeTab]);

  const getCategoryVisuals = (notif: NotificationItem) => {
    const cat = notif.category || notif.type;
    switch (cat) {
      case 'irrigation':
        return {
          icon: <Droplet size={18} className="text-blue-500 shrink-0" />,
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          badgeText: activeLocale === 'gu' ? 'સિંચાઈ' : activeLocale === 'hi' ? 'सिंचाई' : 'Irrigation',
        };
      case 'fertilizer':
        return {
          icon: <Sprout size={18} className="text-emerald-600 shrink-0" />,
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          badgeText: activeLocale === 'gu' ? 'ખાતર' : activeLocale === 'hi' ? 'उर्वरक' : 'Fertilizer',
        };
      case 'scouting':
      case 'disease':
      case 'pest':
        return {
          icon: <ShieldAlert size={18} className="text-amber-500 shrink-0" />,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          badgeText: activeLocale === 'gu' ? 'પાક સંભાળ' : activeLocale === 'hi' ? 'फसल जांच' : 'Crop Care',
        };
      case 'spray':
        return {
          icon: <Sparkles size={18} className="text-purple-500 shrink-0" />,
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          badgeText: activeLocale === 'gu' ? 'છંટકાવ' : activeLocale === 'hi' ? 'छिड़काव' : 'Spray',
        };
      case 'harvest':
      case 'harvesting':
        return {
          icon: <Wheat size={18} className="text-orange-600 shrink-0" />,
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
          badgeText: activeLocale === 'gu' ? 'કાપણી' : activeLocale === 'hi' ? 'कटाई' : 'Harvesting',
        };
      case 'task_overdue':
        return {
          icon: <AlertTriangle size={18} className="text-rose-600 shrink-0" />,
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          badgeText: activeLocale === 'gu' ? 'વિલંબિત' : activeLocale === 'hi' ? 'बकाया' : 'Overdue',
        };
      case 'crop_stage':
      default:
        return {
          icon: <Bell size={18} className="text-[#2F7D4F] shrink-0" />,
          badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
          badgeText: activeLocale === 'gu' ? 'તબક્કો' : activeLocale === 'hi' ? 'अवस्था' : 'Growth Stage',
        };
    }
  };

  return (
    <DataState status={loading ? 'loading' : error ? 'error' : 'success'} errorMessage={error} onRetry={load}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#143D2A] flex items-center gap-2.5">
              <span className="p-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                <Bell size={22} className="text-[#2F7D4F]" />
              </span>
              {ui.title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5 max-w-2xl leading-relaxed">
              {ui.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={triggerDueReminders} isLoading={busy} className="rounded-xl">
              <RefreshCw size={14} className="mr-1.5" /> {ui.checkDue}
            </Button>
            <Button size="sm" onClick={markAllRead} isLoading={busy} className="rounded-xl bg-[#2F7D4F] hover:bg-[#25633F]">
              <CheckCheck size={14} className="mr-1.5" /> {ui.markAllRead}
            </Button>
            {counts.all - counts.unread > 0 && (
              <Button size="sm" variant="ghost" onClick={clearReadAlerts} isLoading={busy} className="rounded-xl text-stone-500 hover:text-stone-800">
                <Trash2 size={13} className="mr-1" /> {ui.clearRead}
              </Button>
            )}
          </div>
        </div>

        {notice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center gap-2.5 shadow-sm animate-fade-in">
            <CheckCircle2 size={16} className="text-[#2F7D4F] shrink-0" /> {notice}
          </div>
        )}

        {/* Email Provider Status Banner */}
        {data?.emailProvider && (
          <div className="p-3.5 rounded-2xl bg-[#F7F8F5] border border-stone-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-[#2F7D4F]" />
              <span className="text-stone-700">
                <strong className="text-stone-900">{ui.emailEngine}:</strong>{' '}
                {data.emailProvider.configured
                  ? `Active (${data.emailProvider.provider.toUpperCase()})`
                  : 'Automated In-App Alerts & Local Outbox Log'}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              <ShieldCheck size={11} /> {ui.dedupeBadge}
            </span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'unread', 'irrigation', 'fertilizer', 'crop_care', 'harvesting'] as FilterTab[]).map((tab) => {
            const count = counts[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                  isActive
                    ? 'bg-[#143D2A] text-white border-[#143D2A] shadow-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <span>{tabs[tab]}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? tab === 'unread'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-stone-100 text-stone-700'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notifications Feed */}
        <Card className="p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
              <span>{tabs[activeTab]}</span>
              <span className="text-xs text-stone-500 font-normal">
                ({filteredNotifications.length}{' '}
                {activeLocale === 'gu' ? 'સૂચનાઓ' : activeLocale === 'hi' ? 'अलर्ट' : 'items'})
              </span>
            </h2>
            {counts.unread > 0 && activeTab === 'all' && (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                {counts.unread} {activeLocale === 'gu' ? 'ન વાંચેલ' : activeLocale === 'hi' ? 'अपठित' : 'unread'}
              </span>
            )}
          </div>

          {!filteredNotifications.length ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Bell size={22} />
              </div>
              <p className="text-sm font-bold text-stone-700">{ui.noAlerts}</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">{ui.noAlertsSub}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotifications.map((n) => {
                const visual = getCategoryVisuals(n);
                const isUnread = !n.readAt;

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                      isUnread
                        ? 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                        : 'bg-white border-stone-200/70 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">{visual.icon}</div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-[#2F7D4F] shrink-0" title="Unread" />
                          )}
                          <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                            {n.title}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${visual.badgeClass}`}
                          >
                            {visual.badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                          {n.body}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 pt-0.5">
                          <Clock size={11} />
                          <span>{new Date(n.createdAt).toLocaleString(activeLocale === 'gu' ? 'gu-IN' : activeLocale === 'hi' ? 'hi-IN' : 'en-IN')}</span>
                          {n.fieldName && <span>• {n.fieldName}</span>}
                          {n.cropName && <span>• {n.cropName}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 justify-end">
                      {n.actionUrl && (
                        <Link
                          href={n.actionUrl}
                          className="px-2.5 py-1 text-xs font-bold text-[#2F7D4F] hover:bg-emerald-50 rounded-xl transition-colors inline-flex items-center gap-1 border border-emerald-200 bg-white"
                        >
                          <span>{ui.openAction}</span>
                          <ExternalLink size={12} />
                        </Link>
                      )}

                      {isUnread && (
                        <button
                          onClick={() => markSingleRead(n.id)}
                          title={ui.markRead}
                          className="p-1.5 rounded-xl hover:bg-emerald-100 text-[#2F7D4F] transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                        >
                          <Check size={14} />
                        </button>
                      )}

                      <button
                        onClick={() => deleteSingle(n.id)}
                        title={ui.delete}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Notification Preferences */}
        {data?.preferences && (
          <Card className="p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-3">
            <h2 className="font-bold text-stone-900 text-sm sm:text-base">{ui.preferencesTitle}</h2>
            <div className="divide-y divide-stone-100 text-xs">
              {data.preferences.map((pref: any) => (
                <div key={pref.type} className="py-2.5 flex items-center justify-between gap-4">
                  <span className="font-semibold text-stone-800">
                    {prefsLabels[pref.type] || pref.type}
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-stone-700">
                      <input
                        type="checkbox"
                        checked={pref.in_app}
                        onChange={(e) => togglePref(pref.type, 'in_app', e.target.checked)}
                        className="rounded accent-[#2F7D4F]"
                      />
                      <span>In-App</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-stone-700">
                      <input
                        type="checkbox"
                        checked={pref.email}
                        onChange={(e) => togglePref(pref.type, 'email', e.target.checked)}
                        className="rounded accent-[#2F7D4F]"
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
          <Card className="p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-3">
            <h2 className="font-bold text-stone-900 text-sm sm:text-base">{ui.recentLogs}</h2>
            <div className="space-y-2 text-xs">
              {data.recentEmails.map((em: any) => (
                <div
                  key={em.id}
                  className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-stone-900">{em.subject}</p>
                    <p className="text-[11px] text-stone-500">
                      Template: {em.templateKey} • Provider: {em.provider} •{' '}
                      {new Date(em.createdAt).toLocaleString(activeLocale === 'gu' ? 'gu-IN' : activeLocale === 'hi' ? 'hi-IN' : 'en-IN')}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      em.status === 'sent'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : em.status === 'simulated'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200'
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
