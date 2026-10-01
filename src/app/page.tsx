import Link from 'next/link';
import { Sprout, ShieldCheck, Tractor, CloudSun, Bot, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#143D2A] text-white py-4 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2F7D4F] rounded-xl flex items-center justify-center">
              <Sprout size={24} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight">SmartFarm AI</span>
              <p className="text-xs text-emerald-200">Your Digital Farming Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-emerald-100 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#2F7D4F] hover:bg-[#25663f] text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#143D2A] to-[#1a4a34] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-800/80 border border-emerald-600/40 rounded-full text-xs font-semibold text-emerald-200">
            <ShieldCheck size={14} /> Provenance-Aware & Grounded AI Agriculture
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Smarter Decisions For Every Acre & Every Season
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Connect your farms, fields, crop stages, live weather, and tasks into a unified intelligent platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Get Started Now <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-base rounded-xl border border-white/20 transition-all"
            >
              Demo Account Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-[#143D2A]">The Connected Digital Spine</h2>
          <p className="text-stone-600 text-sm max-w-xl mx-auto">
            From field boundaries to harvest recording, every module links into your central crop lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-[#2F7D4F] rounded-xl flex items-center justify-center">
              <Tractor size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Farm & Field Mapping</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Draw GPS boundaries, track field soil types, irrigation infrastructure, and active crop stages.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center">
              <CloudSun size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Weather-Aware Advisory</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Real-time Open-Meteo weather rules alert you before rain washes off pesticide sprays or high winds drift chemicals.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
              <Bot size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Grounded Farm Assistant</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Context-aware decision support grounded in your actual field data, weather forecasts, and official agricultural extension documents.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#143D2A] text-emerald-200/80 py-8 px-6 text-center text-xs border-t border-emerald-800">
        <p>© 2026 SmartFarm AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
