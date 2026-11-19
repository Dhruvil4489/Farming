'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  CloudSun,
  TrendingUp,
  ScanLine,
  Bot,
  Droplets,
  Package,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  Bell,
  Calendar,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';
import { CinematicVideoHero } from '@/components/domain/CinematicVideoHero';
import { MarketSnapshotSection } from '@/components/market/MarketSnapshotSection';

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [cartAdding, setCartAdding] = useState<string | null>(null);

  // Fetch store products preview safely without blocking other modules
  useEffect(() => {
    let isMounted = true;
    const loadHomePreviews = async () => {
      try {
        const [storeRes, weatherRes] = await Promise.allSettled([
          fetch('/api/v1/store/products'),
          fetch('/api/v1/weather'),
        ]);

        if (isMounted && storeRes.status === 'fulfilled' && storeRes.value.ok) {
          const json = await storeRes.value.json();
          const all: any[] = Array.isArray(json.data) ? json.data : [];
          setStoreProducts(all.filter((p) => p.stock > 0).slice(0, 4));
        }

        if (isMounted && weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
          const wJson = await weatherRes.value.json();
          setLiveWeather(wJson.data?.current || null);
        }
      } catch {
        // Non-blocking preview
      }
    };
    fetchStore();
    return () => {
      isMounted = false;
    };
  }, []);

  loadHomePreviews();
  return () => {
    isMounted = false;
  };
}, []);

const handleAddToCart = async (productId: string, productName: string) => {
  setCartAdding(productId);
  try {
    const res = await fetch('/api/v1/store/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    if (res.ok) {
      window.dispatchEvent(new Event('cart-updated'));
      setCartNotice(`Added "${productName}" to cart`);
      setTimeout(() => setCartNotice(''), 2800);
    } else if (res.status === 401) {
      router.push('/login?redirect=/fertilizers');
    }
  } catch (err) {
    console.error(err);
  } finally {
    setTimeout(() => setCartAdding(null), 400);
  }
};

const capabilities = [
  {
    icon: Calendar,
    title: 'Intelligent Crop Lifecycle Engine',
    desc: '60+ Indian crops with sowing-to-harvest growth stages, automatic farming tasks, and timely email reminders.',
    href: '/crops',
  },
  {
    icon: ScanLine,
    title: 'Crop Disease AI & IPM Safety',
    desc: 'Upload leaf photos for disease screening, organic/biological IPM hierarchy, and CIB&RC-verified treatments.',
    href: '/diagnosis',
  },
  {
    icon: Bot,
    title: 'Multilingual AI Agronomy Assistant',
    desc: 'Chat in English, Hindi, or Gujarati grounded in your active crops, ICAR/SAU guides, weather, and mandi data.',
    href: '/assistant',
  },
  {
    icon: CloudSun,
    title: 'Location Weather & Spray Alerts',
    desc: 'Live meteorological forecasts for your farm plus explore any village, city, district, or PIN across India.',
    href: '/weather',
  },
  {
    icon: TrendingUp,
    title: 'APMC Mandi Price Intelligence',
    desc: 'Track AGMARKNET wholesale modal, min, and max prices by state, district, and commodity with transparent dates.',
    href: '/mandi',
  },
  {
    icon: Droplets,
    title: 'Soil Moisture & Irrigation',
    desc: 'Combines NRSC/ISRO satellite hydrological estimates (0–50 cm) with in-situ capacitive IoT field probes.',
    href: '/soil-moisture',
  },
];

return (
  <div className="min-h-screen bg-[#FAF6EF] text-stone-900 flex flex-col">
    <SiteHeader />

    {/* Full-Screen Cinematic Farmland Video Hero */}
    <CinematicVideoHero>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-32 lg:pb-28 relative z-10">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/75 border border-emerald-400/40 text-emerald-200 text-xs font-bold backdrop-blur-md">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>ICAR / SAU / IMD / AGMARKNET Aligned Platform for Indian Farmers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-sm">
            {t('hero_title', 'Intelligent Farming from Sowing to Harvest.')}
          </h1>

          <p className="text-base sm:text-lg text-emerald-50/90 leading-relaxed max-w-2xl">
            {t(
              'hero_subtitle',
              'Manage your farms and fields simply, follow crop-specific growth stages for 60+ Indian crops, get automated task & email reminders, diagnose leaf diseases safely, and check live weather & APMC mandi rates.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#2F7D4F] hover:bg-[#24663F] text-white font-extrabold text-sm shadow-xl transition-all"
            >
              <Sprout size={18} /> Start Free Farmer Account <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-sm backdrop-blur-md transition-all"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Live Weather Pill */}
          {liveWeather && (
            <div className="inline-flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-2xl bg-black/45 border border-white/15 text-xs text-emerald-100 backdrop-blur-md mt-2">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <CloudSun size={15} className="text-amber-300" /> {liveWeather.temperatureC}°C •{' '}
                {liveWeather.condition}
              </span>
              <span>Humidity {liveWeather.humidityPct}%</span>
              <span>Wind {liveWeather.windSpeedKmh} km/h</span>
              <span className="text-emerald-300 font-semibold">Rain {liveWeather.rainProbabilityPct}%</span>
            </div>
          )}
        </div>
      </div>
    </CinematicVideoHero>

    {/* Core Platform Capabilities */}
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#2F7D4F]">
          Complete Agritech Ecosystem
        </span>
        <h2 className="text-3xl font-black text-[#143D2A] tracking-tight">
          Built for Practical Everyday Decisions in the Field
        </h2>
        <p className="text-sm text-stone-600">
          Simple enough for first-time smartphone users, powered by real agricultural science and verified public data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {capabilities.map((cap) => {
          const Icon = cap.icon;
          return (
            <Link
              key={cap.title}
              href={cap.href}
              className="group p-6 rounded-3xl bg-white border border-stone-200 hover:border-emerald-300 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2F7D4F] group-hover:bg-[#143D2A] group-hover:text-white transition-colors flex items-center justify-center">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-extrabold text-[#143D2A]">{cap.title}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{cap.desc}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2F7D4F] group-hover:translate-x-1 transition-transform">
                Explore Module <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>

    {/* Live APMC Mandi Snapshot */}
    <MarketSnapshotSection />

    {/* Featured Agri-Input & Fertilizer Store Preview */}
    {storeProducts.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#2F7D4F]">
                Verified Agri-Input Catalog
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#143D2A] tracking-tight mt-1">
                Fertilizer &amp; Crop Protection Store
              </h2>
            </div>
            <Link
              href="/fertilizers"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7D4F] hover:text-[#143D2A]"
            >
              Browse Full Catalog <ArrowRight size={14} />
            </Link>
          </div>

          {cartNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#2F7D4F]" /> {cartNotice}
            </div>
            <span className="pt-4 text-xs font-bold text-[#2F7D4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore Farms →
            </span>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {storeProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-[#F7F8F5] flex items-center justify-center p-4">
                    <ProductImage
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <div className="p-4 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {prod.category?.name || 'Agri Input'}
                    </span>
                    <h3 className="font-extrabold text-sm text-stone-900 line-clamp-1">{prod.name}</h3>
                    <p className="text-[11px] text-stone-500">
                      {prod.brand?.name || 'Certified'} • {prod.packSize}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-base font-black text-[#143D2A]">₹{prod.price}</span>
                  <button
                    type="button"
                    disabled={cartAdding === prod.id}
                    onClick={() => handleAddToCart(prod.id, prod.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143D2A] hover:bg-[#2F7D4F] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingCart size={13} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
)}

{/* Email & Reminder Automation Banner */ }
<section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
  <div className="rounded-3xl bg-gradient-to-br from-[#143D2A] to-[#235D3C] text-white p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
    <div className="space-y-2 max-w-2xl">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
        <Bell size={14} /> Automated Crop Stage &amp; Weather Alerts
      </span>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
        Never Miss a Critical Irrigation, Fertilizer, or Pest Scouting Window
      </h2>
      <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
        Register with your email to automatically schedule stage-specific farming tasks and receive clear reminders in English, Hindi, or Gujarati.
      </p>
    </div>
    <Link
      href="/register"
      className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-[#143D2A] hover:bg-emerald-50 font-extrabold text-sm shadow-md transition-colors"
    >
      Create Free Account <ArrowRight size={16} />
    </Link>
  </div>
</section>

{/* Footer */ }
<footer className="bg-[#0F2D1F] text-emerald-100/80 py-10 px-4 sm:px-6 lg:px-8 mt-auto border-t border-emerald-950">
  <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
    <div className="flex items-center gap-2 text-white font-extrabold text-sm">
      <Sprout size={18} className="text-emerald-400" />
      <span>SmartFarm AI — Intelligent Agriculture Platform</span>
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <Link href="/market" className="hover:text-white">Mandi Prices</Link>
      <Link href="/fertilizers" className="hover:text-white">Fertilizer Store</Link>
      <Link href="/login" className="hover:text-white">Farmer Login</Link>
      <Link href="/register" className="hover:text-white">Register</Link>
    </div>
  </div>
</footer>
    </div >
  );
}
