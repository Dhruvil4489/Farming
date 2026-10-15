import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  Sprout,
  ShieldCheck,
  TrendingUp,
  Droplets,
  CheckCircle2,
} from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In — SmartFarm AI',
  description: 'Sign in to access your farmer records, field advisories, and APMC market intelligence.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#FAF6EF]">
      {/* Left Agritech Visual Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#071B12] via-[#0F2D1F] to-[#143D2A] text-white flex-col justify-between p-12 overflow-hidden border-r border-emerald-950">
        {/* Subtle decorative background contours */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(47, 125, 79, 0.4) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />

        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2F7D4F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 bg-[#2F7D4F] text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Sprout size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">SmartFarm AI</h2>
              <p className="text-xs text-emerald-300 font-medium">Digital Agriculture & Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Center Editorial Showcase */}
        <div className="relative z-10 space-y-8 my-auto py-10 max-w-lg">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 text-xs font-semibold">
              <ShieldCheck size={14} className="text-emerald-400" />
              Verified Agricultural Platform
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Real-time farm management & agronomy intelligence.
            </h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Connect your fields, track crop stages, inspect verified APMC mandi prices, and access hydrological soil moisture data tailored to your region.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-emerald-800/80 rounded-xl flex items-center justify-center text-emerald-200 shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">APMC Mandi Transparency</h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">Live commodity prices synchronized across regional agricultural markets.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-cyan-900/80 rounded-xl flex items-center justify-center text-cyan-200 shrink-0">
                <Droplets size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Hydrological Soil Moisture</h3>
                <p className="text-xs text-cyan-200/80 mt-0.5">Government NRSC VIC model root-zone moisture tracking from 0–50 cm.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 bg-amber-900/80 rounded-xl flex items-center justify-center text-amber-200 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Crop Stage Guidance</h3>
                <p className="text-xs text-amber-200/80 mt-0.5">Scientific fertilizer timing and pest scouting advisories for every growth phase.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="relative z-10 pt-6 border-t border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300/80">
          <span>SmartFarm AI • Production Release</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Regional Nodes
          </span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#2F7D4F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-medium">Initializing secure sign in...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
