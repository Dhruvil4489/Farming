'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';

export default function CartPage() {
  const [cart, setCart] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/v1/store/cart');
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (cartItemId: string, newQty: number) => {
    setUpdating(cartItemId);
    try {
      const res = await fetch(`/api/v1/store/cart/${cartItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    setUpdating(cartItemId);
    try {
      const res = await fetch(`/api/v1/store/cart/${cartItemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
        <SiteHeader />
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-stone-500">
          Loading your cart items...
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const deliveryFee = cart?.deliveryFee || 0;
  const total = cart?.total || 0;

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Agricultural Input Shopping Cart
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Review your selected fertilizers and delivery summary before dispatch.
            </p>
          </div>
          <Link
            href="/fertilizers"
            className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <ShoppingBag size={28} />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Your Cart is Currently Empty</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore Government-subsidized fertilizers, water-soluble nutrients, and organic inputs to add items to your cart.
            </p>
            <Link
              href="/fertilizers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2F7D4F] text-white font-bold text-xs shadow-md hover:bg-[#25663f] transition-colors"
            >
              Explore Fertilizer Catalog <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-2xl object-cover bg-stone-100 shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F7D4F]">
                        {item.product.brand?.name} • {item.product.packSize}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 line-clamp-1">{item.product.name}</h3>
                      <p className="text-xs font-black text-[#0F2D1F]">
                        ₹{item.product.price.toFixed(2)} <span className="text-[10px] text-stone-400 font-normal">/ pack</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50 text-xs">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={updating === item.id}
                        className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-200 font-bold transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-1.5 font-bold text-stone-900">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updating === item.id || item.quantity >= item.stockAvailable}
                        className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-200 font-bold transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-stone-900">₹{item.lineTotal.toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={updating === item.id}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary (1 Col) */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100">
                  Order Summary
                </h2>

                <div className="space-y-2.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.itemCount} items)</span>
                    <span className="font-bold text-stone-900">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Farm Delivery Fee</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <strong className="text-emerald-700">FREE</strong>
                      ) : (
                        `₹${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  {subtotal < 1000 && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg">
                      Add ₹{(1000 - subtotal).toFixed(2)} more to qualify for Free Delivery!
                    </p>
                  )}

                  <div className="pt-3 border-t border-stone-200 flex justify-between text-sm font-black text-[#0F2D1F]">
                    <span>Total Payable</span>
                    <span className="text-xl">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-3.5 bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight size={15} />
                </Link>

                <div className="pt-2 text-center text-[11px] text-stone-400">
                  Server-side pricing and inventory validated.
                </div>
              </div>

              {/* Delivery Guarantee Card */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck size={16} className="text-[#2F7D4F]" /> Cooperative Quality Guarantee
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  All fertilizers and chemicals originate directly from certified state cooperatives (GSFC / IFFCO / KRIBHCO) with batch testing certificates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
