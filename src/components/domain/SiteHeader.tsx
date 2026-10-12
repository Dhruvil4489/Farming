'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sprout,
  ChevronDown,
  ShoppingBag,
  Menu,
  X,
  Tractor,
  Grid,
  Calendar,
  CheckSquare,
  Droplet,
  Bot,
  Bug,
  Layers,
  CloudSun,
  TrendingUp,
  Package,
  BookOpen,
  ArrowRight,
  User,
} from 'lucide-react';

export function SiteHeader() {
  const pathname = usePathname();
  const [platformOpen, setPlatformOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch cart count on mount and after cart events
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch('/api/v1/store/cart');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.itemCount !== undefined) {
            setCartCount(json.data.itemCount);
          }
        }
      } catch {
        // silent fallback
      }
    };

    fetchCart();
    window.addEventListener('cart-updated', fetchCart);
    return () => window.removeEventListener('cart-updated', fetchCart);
  }, []);

  // Track scroll position for header glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0F2D1F]/95 backdrop-blur-md shadow-xl border-b border-emerald-900/50 py-3'
          : 'bg-[#0F2D1F] border-b border-emerald-950/80 py-4'
      } text-white`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#2F7D4F] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200 border border-emerald-400/20">
              <Sprout size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  SmartFarm AI
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/70 font-medium">Your Digital Farming Companion</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 font-medium text-sm">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                isActive('/') ? 'text-white bg-white/10 font-bold' : 'text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>

            {/* Platform Mega Menu Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPlatformOpen(true)}
              onMouseLeave={() => setPlatformOpen(false)}
            >
              <button
                type="button"
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  platformOpen ? 'text-white bg-white/10' : 'text-emerald-100 hover:text-white hover:bg-white/5'
                }`}
                aria-expanded={platformOpen}
              >
                Platform <ChevronDown size={15} className={`transition-transform duration-200 ${platformOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Overlay */}
              {platformOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[720px] pt-2">
                  <div className="bg-[#143D2A] border border-emerald-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-xl grid grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-150">
                    {/* Column 1: Farm Management */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <Tractor size={14} /> Farm Management
                      </p>
                      <ul className="space-y-1.5 text-xs">
                        <li>
                          <Link href="/farms" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <Tractor size={14} className="text-emerald-400" /> My Farms
                          </Link>
                        </li>
                        <li>
                          <Link href="/fields" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <Grid size={14} className="text-emerald-400" /> Fields & Soil Plots
                          </Link>
                        </li>
                        <li>
                          <Link href="/crops" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <Calendar size={14} className="text-emerald-400" /> Crop Lifecycle & Calendar
                          </Link>
                        </li>
                        <li>
                          <Link href="/tasks" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <CheckSquare size={14} className="text-emerald-400" /> Operations & Tasks
                          </Link>
                        </li>
                        <li>
                          <Link href="/irrigation" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <Droplet size={14} className="text-emerald-400" /> Irrigation Scheduling
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Column 2: Intelligence */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <Bot size={14} /> Intelligence
                      </p>
                      <ul className="space-y-1.5 text-xs">
                        <li>
                          <Link href="/assistant" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <Bot size={14} className="text-purple-300" /> Grounded AI Assistant
                          </Link>
                        </li>
                        <li>
                          <Link href="/scouting" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <Bug size={14} className="text-amber-400" /> Crop Health & Scouting
                          </Link>
                        </li>
                        <li>
                          <Link href="/soil" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <Layers size={14} className="text-amber-400" /> Soil Health & Testing
                          </Link>
                        </li>
                        <li>
                          <Link href="/weather" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <CloudSun size={14} className="text-sky-300" /> Weather & Spray Advisories
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Column 3: Business & Trade */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <TrendingUp size={14} /> Business & Inputs
                      </p>
                      <ul className="space-y-1.5 text-xs">
                        <li>
                          <Link href="/market" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white font-semibold">
                            <TrendingUp size={14} className="text-emerald-400" /> Live Mandi Prices
                          </Link>
                        </li>
                        <li>
                          <Link href="/fertilizers" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white font-semibold">
                            <Package size={14} className="text-amber-400" /> Fertilizer Store
                          </Link>
                        </li>
                        <li>
                          <Link href="/fertilizers/guide" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <BookOpen size={14} className="text-emerald-300" /> Crop Fertilizer Guide
                          </Link>
                        </li>
                        <li>
                          <Link href="/orders" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-stone-200 hover:text-white">
                            <Package size={14} className="text-emerald-300" /> My Orders & Delivery
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/market"
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                isActive('/market') ? 'text-white bg-white/10 font-bold' : 'text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Mandi Prices
            </Link>

            <Link
              href="/fertilizers"
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                isActive('/fertilizers') ? 'text-white bg-white/10 font-bold' : 'text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              Fertilizers
            </Link>

            <Link
              href="/fertilizers/guide"
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                isActive('/fertilizers/guide') ? 'text-white bg-white/10 font-bold' : 'text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              Knowledge Center
            </Link>
          </nav>

          {/* Action CTAs: Cart & Account */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors flex items-center justify-center border border-white/10"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-stone-950 font-extrabold text-[11px] rounded-full flex items-center justify-center shadow-md animate-scale">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Dashboard / Auth Link */}
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
            >
              <User size={14} />
              Farmer Portal
            </Link>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/10 text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-6 border-t border-emerald-900/60 mt-4 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100"
              >
                🏠 Home
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-emerald-800/60 rounded-xl hover:bg-emerald-800 text-white font-bold"
              >
                🌾 Dashboard
              </Link>
              <Link
                href="/market"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100"
              >
                📈 Live Mandi Prices
              </Link>
              <Link
                href="/fertilizers"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100"
              >
                🛒 Fertilizer Store
              </Link>
              <Link
                href="/fertilizers/guide"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100"
              >
                📖 Agronomic Guidance
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100"
              >
                📦 My Orders
              </Link>
            </div>

            <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs text-emerald-200"
              >
                <ShoppingBag size={16} /> Cart ({cartCount} items)
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-emerald-300 hover:underline"
              >
                Sign In →
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
