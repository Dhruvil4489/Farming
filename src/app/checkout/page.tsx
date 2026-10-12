'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Truck,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    deliveryName: 'Ramesh Patel',
    deliveryPhone: '+919876543211',
    deliveryAddress: 'Survey No. 42, Patel Organic Farm, Near Padra Canal',
    deliveryVillage: 'Padra',
    deliveryDistrict: 'Vadodara',
    deliveryState: 'Gujarat',
    deliveryPincode: '391440',
    paymentMethod: 'demo_checkout', // demo_checkout | cod
    notes: 'Please call driver upon arrival at farm gate.',
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch('/api/v1/store/cart');
        if (res.ok) {
          const json = await res.json();
          setCart(json.data);
          if (!json.data || json.data.items?.length === 0) {
            router.push('/cart');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/v1/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Checkout failed');
      }

      window.dispatchEvent(new Event('cart-updated'));
      router.push(`/orders/${json.data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
        <SiteHeader />
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-stone-500">
          Preparing checkout workflow...
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Order Checkout & Farm Delivery
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Specify your farm plot delivery address and review payment mode.
            </p>
          </div>
          <Link
            href="/cart"
            className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Cart
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl text-rose-900 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Address and Payment (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Truck size={18} className="text-[#2F7D4F]" /> Farm Plot Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Full Name / Farmer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryName}
                    onChange={(e) => setFormData({ ...formData, deliveryName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mobile Phone (For Driver Contact) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.deliveryPhone}
                    onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1">Farm Plot Address / Landmark *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    placeholder="Survey Number, Farm gate, Near Canal or Substation..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Village / Town</label>
                  <input
                    type="text"
                    value={formData.deliveryVillage}
                    onChange={(e) => setFormData({ ...formData, deliveryVillage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryDistrict}
                    onChange={(e) => setFormData({ ...formData, deliveryDistrict: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryState}
                    onChange={(e) => setFormData({ ...formData, deliveryState: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryPincode}
                    onChange={(e) => setFormData({ ...formData, deliveryPincode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 text-xs">Delivery Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Banknote size={18} className="text-[#2F7D4F]" /> Payment Method
              </h2>

              <div className="space-y-3">
                {/* Demo Checkout Option */}
                <label className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  formData.paymentMethod === 'demo_checkout'
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="demo_checkout"
                    checked={formData.paymentMethod === 'demo_checkout'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'demo_checkout' })}
                    className="mt-1"
                  />
                  <div className="text-xs space-y-0.5">
                    <span className="font-extrabold text-stone-900 block">
                      Test / Demo Instant Checkout (Honest Sandbox Flow)
                    </span>
                    <p className="text-stone-500 leading-relaxed">
                      Instant verified test checkout for development. Does not process real credit or debit charges. Confirms order and generates tracking immediately.
                    </p>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  formData.paymentMethod === 'cod'
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className="mt-1"
                  />
                  <div className="text-xs space-y-0.5">
                    <span className="font-extrabold text-stone-900 block">
                      Cash on Delivery (COD at Farm Gate)
                    </span>
                    <p className="text-stone-500 leading-relaxed">
                      Pay cash to the cooperative delivery tractor/truck driver upon bag unloading and weight inspection.
                    </p>
                  </div>
                </label>
              </div>

              {/* Integrity Notice */}
              <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-600">
                Payment gateway credentials for production merchant UPI integration remain unconfigured. All transactions are explicitly processed under Sandbox test integrity.
              </div>
            </div>
          </div>

          {/* Right: Order Summary Review (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100">
                Order Review ({cart.itemCount} items)
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs pb-2 border-b border-stone-50">
                    <div>
                      <p className="font-bold text-stone-900 line-clamp-1">{item.product.name}</p>
                      <p className="text-[10px] text-stone-400">
                        {item.quantity} × ₹{item.product.price} ({item.product.packSize})
                      </p>
                    </div>
                    <span className="font-bold text-stone-900">₹{item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Farm Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-[#0F2D1F]">
                  <span>Total Amount</span>
                  <span className="text-xl">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#2F7D4F] hover:bg-[#25663f] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? 'Placing Order...' : 'Confirm & Place Order'} <ArrowRight size={15} />
              </button>

              <div className="text-center text-[10px] text-stone-400">
                Transactional inventory adjustment and receipt generation.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
