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
  X,
  Plus,
  Minus,
  Truck,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

export interface FertilizerStoreExplorerProps {
  variant?: 'public' | 'portal';
  initialCategory?: string;
  initialCrop?: string;
}

export function FertilizerStoreExplorer({
  variant = 'public',
  initialCategory = '',
  initialCrop = '',
}: FertilizerStoreExplorerProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartAdding, setCartAdding] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Cart Drawer State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<any | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);

  const [catalogError, setCatalogError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setCatalogError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (initialCrop) params.append('crop', initialCrop);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/v1/store/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load fertilizer store catalog`);
      }
      const json = await res.json();
      setProducts(json.data || []);
      if (json.meta?.categories) setCategories(json.meta.categories);
      if (json.meta?.brands) setBrands(json.meta.brands);
    } catch (e: any) {
      console.error('Failed to load catalog:', e);
      setCatalogError(e.message || 'Unable to connect to fertilizer store service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, selectedBrand, searchQuery, initialCrop]);

  const fetchCart = async () => {
    setCartLoading(true);
    try {
      const res = await fetch('/api/v1/store/cart');
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch cart:', e);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    const handleCartUpdated = () => fetchCart();
    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
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
        setToastMsg(`Added "${productName}" to your cart!`);
        setTimeout(() => setToastMsg(''), 3000);
      } else {
        const json = await res.json();
        if (res.status === 401) {
          setToastMsg('Please sign in to add items to your cart.');
        } else {
          setToastMsg(json.error?.message || 'Failed to add item to cart');
        }
        setTimeout(() => setToastMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setToastMsg('Network error while updating cart');
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setTimeout(() => setCartAdding(null), 500);
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, newQty: number) => {
    try {
      const res = await fetch(`/api/v1/store/cart/${cartItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch('/api/v1/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryName: 'Ramesh Patel',
          deliveryPhone: '+919876543211',
          deliveryAddress: 'Survey No. 42, Patel Organic Farm, Near Padra Canal',
          deliveryVillage: 'Padra',
          deliveryDistrict: 'Vadodara',
          deliveryState: 'Gujarat',
          deliveryPincode: '391440',
          paymentMethod: 'demo_checkout',
          notes: 'Standard farm gate delivery request',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setCheckoutSuccess(json.data);
        fetchCart();
        setToastMsg(`Order #${json.data.orderNumber} confirmed successfully!`);
      } else {
        const json = await res.json();
        setToastMsg(json.error?.message || 'Checkout failed');
      }
    } catch (e: any) {
      setToastMsg(e.message || 'Error executing checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  const isPortal = variant === 'portal';
  const totalCartCount = cart?.items?.reduce((sum: number, it: any) => sum + it.quantity, 0) || 0;

  return (
    <div className={isPortal ? 'space-y-6' : 'flex flex-col'}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2D1F] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      {isPortal ? (
        /* Portal Header matching Tasks & Activities layout */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">Fertilizer Store</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-[11px] font-bold text-emerald-800">
                <ShieldCheck size={13} className="text-emerald-700" /> Authentic Co-op Inputs
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Procure certified chemical fertilizers, water-soluble foliar sprays, and micronutrients for your plots
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/guidance">
              <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors shadow-xs cursor-pointer">
                <BookOpen size={14} className="text-[#2F7D4F]" />
                <span>Nutrient Guidance</span>
              </button>
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#143D2A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer relative"
            >
              <ShoppingBag size={15} />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-amber-400 text-stone-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Public Hero Header */
        <div className="bg-[#0F2D1F] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
              <ShieldCheck size={14} /> 100% Authentic Government & Co-op Certified Agri Inputs
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              Certified Fertilizer & Input Depot
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              Procure authentic fertilizers, water-soluble foliar sprays, organic vermicompost, and targeted micronutrients directly delivered to your farm plot.
            </p>
          </div>
        </div>
      )}

      {/* MAIN BODY CONTAINER */}
      <div className={isPortal ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8'}>
        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-colors cursor-pointer border ${
              !selectedCategory
                ? 'bg-[#2F7D4F] text-white border-emerald-600 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-colors cursor-pointer border ${
                selectedCategory === c.slug
                  ? 'bg-[#2F7D4F] text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search & Brand Filter */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by fertilizer name, composition (e.g. 19-19-19)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-xs text-stone-800 placeholder:text-stone-400"
            />
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="p-2 rounded-xl border border-stone-200 bg-stone-50/50 font-medium text-xs focus:outline-none focus:border-emerald-600 cursor-pointer text-stone-800"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              <strong>{products.length}</strong> items
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-stone-200 animate-pulse space-y-4">
                <div className="h-40 bg-stone-100 rounded-2xl" />
                <div className="h-4 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
                <div className="h-8 bg-stone-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : catalogError ? (
          <div className="p-12 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
            <AlertCircle size={32} className="mx-auto text-rose-600" />
            <p className="font-bold text-rose-950 text-sm">Failed to Load Fertilizer Catalog</p>
            <p className="text-xs text-rose-700 max-w-sm mx-auto">{catalogError}</p>
            <button
              onClick={fetchCatalog}
              className="px-4 py-2 bg-[#2F7D4F] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#256841]"
            >
              Retry Loading Catalog
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
            <Package size={32} className="mx-auto text-stone-400" />
            <p className="font-bold text-stone-800 text-sm">No fertilizers matched your criteria</p>
            <p className="text-xs text-stone-500">Try clearing filters or search term to explore available stock.</p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedBrand('');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#2F7D4F] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const inStock = p.stock > 0;
              const isAdding = cartAdding === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="space-y-3">
                    <div className="relative h-44 bg-gradient-to-b from-stone-50 to-stone-100/60 rounded-2xl flex items-center justify-center p-3 overflow-hidden border border-stone-100">
                      <Package size={52} className="text-[#2F7D4F]/40 group-hover:scale-105 transition-transform" />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-stone-700 shadow-xs border border-stone-200">
                        {p.brand?.name}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inStock ? `${p.stock} in stock` : 'Out of Stock'}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-3 text-[10px] font-bold text-stone-500 bg-white/90 px-2 py-0.5 rounded-md">
                        {p.packSize}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {p.category?.name}
                      </span>
                      <h3 className="font-extrabold text-stone-900 text-sm mt-1.5 line-clamp-1 leading-snug">
                        {p.name}
                      </h3>
                      {p.composition && (
                        <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                          {p.composition}
                        </p>
                      )}
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-black text-[#0F2D1F]">₹{p.price.toLocaleString('en-IN')}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="text-[11px] text-stone-400 line-through ml-1.5">
                          ₹{p.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(p.id, p.name)}
                      disabled={!inStock || isAdding}
                      className="px-3.5 py-2 rounded-xl bg-[#2F7D4F] hover:bg-[#143D2A] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    >
                      <ShoppingBag size={13} />
                      <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PORTAL CART DRAWER OVERLAY */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#2F7D4F]" />
                <h3 className="font-extrabold text-stone-900 text-base">Your Fertilizer Cart</h3>
                <span className="text-xs text-stone-500 font-medium">({totalCartCount} items)</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartLoading ? (
                <div className="p-12 text-center text-xs text-stone-500 font-medium">Loading cart items...</div>
              ) : !cart || cart.items?.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Package size={36} className="mx-auto text-stone-400" />
                  <p className="font-bold text-stone-800 text-sm">Your cart is currently empty</p>
                  <p className="text-xs text-stone-500">
                    Browse the verified catalog to add authentic fertilizers and crop nutrients.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 bg-[#2F7D4F] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map((it: any) => (
                    <div
                      key={it.id}
                      className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-stone-900 truncate">{it.product.name}</h4>
                        <p className="text-[11px] text-stone-500">
                          {it.product.packSize} • ₹{it.product.price} each
                        </p>
                        <span className="text-xs font-black text-[#0F2D1F] block mt-1">
                          ₹{(it.product.price * it.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(it.id, it.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-800">{it.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(it.id, it.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Success Banner */}
              {checkoutSuccess && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    <span>Order Successfully Placed!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Order Number: <strong>{checkoutSuccess.orderNumber}</strong>. Total Amount: ₹
                    {checkoutSuccess.totalAmount}. Farm delivery will be prepared.
                  </p>
                  <Link href={`/orders/${checkoutSuccess.id}`}>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-2 text-xs font-bold text-[#2F7D4F] underline cursor-pointer"
                    >
                      View Order Tracking →
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Footer with Checkout */}
            {cart && cart.items?.length > 0 && (
              <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span>₹{cart.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Delivery to Farm Gate</span>
                    <span>{cart.deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${cart.deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-black text-sm pt-2 border-t border-stone-200">
                    <span>Total Amount</span>
                    <span>₹{cart.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={handleQuickCheckout}
                  disabled={checkingOut}
                  className="w-full py-3 bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-2xl font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Truck size={15} />
                  <span>{checkingOut ? 'Placing Order...' : 'Confirm Farm Delivery (Demo Checkout)'}</span>
                </button>
                <p className="text-[10px] text-stone-400 text-center italic">
                  Instant transactional test order write to database with real inventory decrement.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
