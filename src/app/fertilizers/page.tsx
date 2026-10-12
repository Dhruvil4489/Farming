'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  ShoppingBag,
  CheckCircle2,
  Filter,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Star,
  Info,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';

export default function FertilizerStorePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartAdding, setCartAdding] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedBrand) params.append('brand', selectedBrand);
        if (searchQuery) params.append('q', searchQuery);

        const res = await fetch(`/api/v1/store/products?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setProducts(json.data || []);
          if (json.meta?.categories) setCategories(json.meta.categories);
          if (json.meta?.brands) setBrands(json.meta.brands);
        }
      } catch (e) {
        console.error('Failed to load catalog:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [selectedCategory, selectedBrand, searchQuery]);

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
        setToastMsg(`Added "${productName}" to your cart!`);
        setTimeout(() => setToastMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setCartAdding(null), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2D1F] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
          <Link href="/cart" className="ml-2 text-amber-300 underline hover:text-white">
            View Cart
          </Link>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-[#0F2D1F] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
            <ShieldCheck size={14} /> Certified Cooperative Agri-Inputs • Regulated Rates
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Fertilizer & Agri-Input Store
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
            Procure authentic fertilizers, water-soluble foliar sprays, organic vermicompost, and targeted micronutrients directly delivered to your farm plot.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-colors cursor-pointer border ${
              !selectedCategory
                ? 'bg-[#2F7D4F] text-white border-emerald-600 shadow-sm'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-colors cursor-pointer border ${
                selectedCategory === c.slug
                  ? 'bg-[#2F7D4F] text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search & Brand Filter */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fertilizer name, composition..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="p-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Brands (IFFCO, GSFC, GNFC...)</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <Link
              href="/cart"
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <ShoppingBag size={14} /> View Cart
            </Link>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-80 bg-white rounded-3xl border border-stone-200 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-2">
            <p className="font-bold text-stone-800 text-sm">No products matched your criteria</p>
            <p className="text-xs text-stone-500">Try clearing your search query or selecting "All Products".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const inStock = p.stock > 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-stone-200/90 hover:border-emerald-500/40 shadow-xs hover:shadow-xl transition-all agri-card flex flex-col justify-between overflow-hidden"
                >
                  {/* Image with Brand Pill */}
                  <div className="relative h-48 bg-stone-100 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-stone-900 text-[10px] font-extrabold shadow-xs">
                      {p.brand?.name}
                    </span>
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-900 text-white text-[10px] font-bold">
                      {p.packSize}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-stone-900 text-sm line-clamp-1">{p.name}</h3>
                      <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                        Composition: {p.composition || 'Standard Specification'}
                      </p>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-black text-[#0F2D1F]">₹{p.price.toFixed(2)}</span>
                          {p.mrp && p.mrp > p.price && (
                            <span className="text-[11px] text-stone-400 line-through ml-1.5">₹{p.mrp}</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inStock ? `In Stock (${p.stock})` : 'Out of Stock'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link
                          href={`/fertilizers/${p.slug}`}
                          className="py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-[11px] font-bold text-stone-700 text-center transition-colors"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleAddToCart(p.id, p.name)}
                          disabled={!inStock || cartAdding === p.id}
                          className="py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#25663f] disabled:opacity-50 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <ShoppingBag size={13} /> {cartAdding === p.id ? 'Adding...' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
