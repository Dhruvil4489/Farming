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
  Droplets,
  Bot,
  ScanLine,
  CloudSun,
  TrendingUp,
  Package,
  BookOpen,
  User,
  Globe,
} from 'lucide-react';
import { useI18n, type Locale } from '@/providers/I18nProvider';

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const [platformOpen, setPlatformOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

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
        // silent for guest visitors
      }
    };

    fetchCart();
    window.addEventListener('cart-updated', fetchCart);
    return () => window.removeEventListener('cart-updated', fetchCart);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
            ? 'bg-[#0C261A]/95 backdrop-blur-md shadow-xl border-b border-emerald-900/50 py-3'
            : 'bg-[#0C261A] border-b border-emerald-950/80 py-3.5'
        } text-white`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                  <div className="w-10 h-10 bg-[#2F7D4F] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-emerald-400/25">
                    <Sprout size={22} className="text-white" />
                  </div>
                  <div>
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-emerald-300 transition-colors block leading-none">
                      SmartFarm AI
                    </span>
                    <p className="text-[11px] text-emerald-200/75 font-medium mt-0.5 hidden sm:block">
                      {t('app_tagline', 'Intelligent Farming Companion')}
                    </p>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1 font-medium text-sm">
                  <Link
                    href="/"
                    className={`px-3.5 py-2 rounded-lg transition-colors ${isActive('/') ? 'text-white bg-white/10 font-bold' : 'text-emerald-100 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {t('home', 'Home')}
                  </Link>

                  {/* Platform Dropdown */}
                  <div
                    className="relative"
                    onMouseEnter={() => setPlatformOpen(true)}
                    onMouseLeave={() => setPlatformOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setPlatformOpen((prev) => !prev)}
                      className={`flex items-center gap-1 px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${platformOpen ? 'text-white bg-white/10' : 'text-emerald-100 hover:text-white hover:bg-white/5'
                        }`}
                      aria-expanded={platformOpen}
                    >
                      Platform <ChevronDown size={15} className={`transition-transform duration-200 ${platformOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {platformOpen && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[700px] pt-2">
                                <div className="bg-[#123625] border border-emerald-700/50 rounded-2xl p-6 shadow-2xl grid grid-cols-3 gap-6">
                                  <div className="space-y-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                                      <Tractor size={13} /> Farm & Crops
                                    </p>
                                      <ul className="space-y-1 text-xs">
                                        <li>
                                            <Link href="/farms" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                              <Tractor size={14} className="text-emerald-400" /> {t('farms', 'My Farms')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/fields" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                              <Grid size={14} className="text-emerald-400" /> {t('fields', 'Fields')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/crops" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                              <Calendar size={14} className="text-emerald-400" /> {t('crops', 'Crops & Cycles')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/tasks" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                              <CheckSquare size={14} className="text-emerald-400" /> {t('tasks', 'Tasks & Activities')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/irrigation" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                              <Droplet size={14} className="text-emerald-400" /> {t('irrigation', 'Irrigation')}
                                            </Link>
                                        </li>
                                      </ul>
                                  </div>

                                      <div className="space-y-2.5">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                                          <Bot size={13} /> AI Intelligence
                                        </p>
                                          <ul className="space-y-1 text-xs">
                                            <li>
                                                <Link href="/diagnosis" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                                  <ScanLine size={14} className="text-rose-300" /> {t('crop_disease_ai', 'Crop Disease AI')}
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/assistant" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                                  <Bot size={14} className="text-purple-300" /> {t('assistant', 'AI Assistant')}
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/soil-moisture" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                                  <Droplets size={14} className="text-cyan-400" /> {t('soil_moisture', 'Soil Moisture')}
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/weather" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                                  <CloudSun size={14} className="text-sky-300" /> {t('weather', 'Weather & Forecast')}
                                                </Link>
                                            </li>
                                          </ul>
                                      </div>

                                          <div className="space-y-2.5">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                                              <TrendingUp size={13} /> Market & Store
                                            </p>
                                              <ul className="space-y-1 text-xs">
                                                <li>
                                                    <Link href="/market" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white font-semibold">
                                                      <TrendingUp size={14} className="text-emerald-400" /> {t('mandi', 'Live Mandi Prices')}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/fertilizers" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white font-semibold">
                                                      <Package size={14} className="text-amber-400" /> {t('store', 'Fertilizer Store')}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/orders" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-stone-200 hover:text-white">
                                                      <ShoppingBag size={14} className="text-emerald-300" /> {t('orders', 'My Orders')}
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
                                  className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${isActive('/market') ? 'text-white bg-white/10 font-bold' : 'text-emerald-100 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  {t('mandi', 'Live Mandi')}
                                </Link>

                                <Link
                                  href="/fertilizers"
                                  className={`px-3.5 py-2 rounded-lg transition-colors ${isActive('/fertilizers') ? 'text-white bg-white/10 font-bold' : 'text-emerald-100 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                  {t('store', 'Fertilizer Store')}
                                </Link>
                              </nav>

                                {/* Right Actions: Language, Cart, Farmer Portal */}
                                <div className="flex items-center gap-2 sm:gap-2.5">
                                  {/* Language Switcher */}
                                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 rounded-xl text-xs font-medium border border-white/10">
                                    <Globe size={13} className="text-emerald-300 shrink-0" />
                                    <select
                                      value={locale}
                                      aria-label="Select Language"
                                      onChange={(e) => setLocale(e.target.value as Locale)}
                                      className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
                                    >
                                      <option value="en" className="text-stone-900">EN</option>
                                      <option value="hi" className="text-stone-900">हिंदी</option>
                                      <option value="gu" className="text-stone-900">ગુજરાતી</option>
                                    </select>
                                  </div>

                                  {/* Cart Button */}
                                  <Link
                                    href="/cart"
                                    className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors flex items-center justify-center border border-white/10"
                                    aria-label="Shopping Cart"
                                  >
                                    <ShoppingBag size={17} />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-stone-950 font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-md">
                                          {cartCount}
                                        </span>
              )}
                                      </Link>

                                    {/* Dashboard CTA */}
                                    <Link
                                      href="/dashboard"
                                      className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                                    >
                                      <User size={14} />
                                      <span>{t('dashboard', 'Farmer Portal')}</span>
                                    </Link>

                                    {/* Mobile Menu Trigger */}
                                    <button
                                      type="button"
                                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                      className="lg:hidden p-2 rounded-xl bg-white/10 text-white cursor-pointer"
                                      aria-label="Toggle navigation menu"
                                    >
                                      {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                    </button>
                                </div>
                              </div>

                              {/* Mobile Navigation Drawer */}
                              {mobileMenuOpen && (
                                  <div className="lg:hidden pt-4 pb-5 border-t border-emerald-900/60 mt-3.5 space-y-4">
                                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                        <Link href="/" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100">
                                          {t('home', 'Home')}
                                        </Link>
                                          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-[#2F7D4F] rounded-xl text-white font-bold">
                                            {t('dashboard', 'Farmer Dashboard')}
                                          </Link>
                                            <Link href="/market" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100">
                                              {t('mandi', 'Live Mandi Prices')}
                                            </Link>
                                              <Link href="/fertilizers" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100">
                                                {t('store', 'Fertilizer Store')}
                                              </Link>
                                                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100">
                                                  {t('orders', 'My Orders')}
                                                </Link>
                                                  <Link href="/diagnosis" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-emerald-100">
                                                    {t('crop_disease_ai', 'Crop Disease AI')}
                                                  </Link>
                                                </div>
                                                    <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between text-xs">
                                                      <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-emerald-200">
                                                        <ShoppingBag size={15} /> Cart ({cartCount})
                                                      </Link>
                                                        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="font-bold text-emerald-300 hover:underline">
                                                          Sign In →
                                                        </Link>
                                                    </div>
                                                </div>
        )}
                                              </div>
                                            </header>
                                            );
}
