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
  Lock,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { useI18n } from '@/providers/I18nProvider';

export default function CheckoutPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [cart, setCart] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [gatewayStatus, setGatewayStatus] = useState<any | null>(null);

  // Form Fields — dynamically populated from authenticated farmer profile
  const [formData, setFormData] = useState({
    deliveryName: '',
    deliveryPhone: '',
    deliveryAddress: '',
    deliveryVillage: '',
    deliveryDistrict: '',
    deliveryState: 'Gujarat',
    deliveryPincode: '',
    paymentMethod: 'cod', // cod | online_razorpay
    notes: '',
  });

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [cartRes, meRes, gwRes] = await Promise.all([
          fetch('/api/v1/store/cart'),
          fetch('/api/v1/me'),
          fetch('/api/v1/store/payment/status'),
        ]);

        if (cartRes.status === 401) {
          router.push('/login?redirect=/checkout');
          return;
        }

        if (cartRes.ok) {
          const json = await cartRes.json();
          setCart(json.data);
          if (!json.data || json.data.items?.length === 0) {
            router.push('/cart');
            return;
          }
        }

        if (meRes.ok) {
          const meJson = await meRes.json();
          const u = meJson?.data;
          if (u) {
            setFormData((prev) => ({
              ...prev,
              deliveryName: prev.deliveryName || u.name || '',
              deliveryPhone: prev.deliveryPhone || u.phone || '',
              deliveryVillage: prev.deliveryVillage || u.village || '',
              deliveryDistrict: prev.deliveryDistrict || u.district || '',
              deliveryState: prev.deliveryState || u.state || 'Gujarat',
            }));
          }
        }

        if (gwRes.ok) {
          const gwJson = await gwRes.json();
          setGatewayStatus(gwJson.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [router]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setSubmitting(true);
    setError('');

    try {
      // 1. Create order on backend
      const res = await fetch('/api/v1/store/payment/razorpay/create-order', {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Could not initiate online payment');
      }

      const { razorpayOrderId, amount, currency, keyId } = json.data;

      // 2. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway SDK. Please check your internet connection.');
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'SmartFarm AI Store',
        description: 'Certified Agricultural Inputs Checkout',
        order_id: razorpayOrderId,
        prefill: {
          name: formData.deliveryName,
          contact: formData.deliveryPhone,
        },
        theme: {
          color: '#143D2A',
        },
        handler: async (response: any) => {
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await fetch('/api/v1/store/payment/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                ...formData,
              }),
            });

            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyJson.error?.message || 'Payment signature verification failed.');
            }

            window.dispatchEvent(new Event('cart-updated'));
            router.push(`/orders/${verifyJson.data.id}`);
          } catch (err: any) {
            setError(err.message || 'Payment verification error. Please contact support.');
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.paymentMethod === 'online_razorpay') {
      if (!gatewayStatus?.isConfigured) {
        setError(
          'Razorpay online gateway is awaiting API credentials in .env (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET). Please select Cash on Delivery to place your order now, or configure credentials.'
        );
        return;
      }
      await handleRazorpayPayment();
      return;
    }

    // Cash on Delivery Flow
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
        <div className="max-w-7xl mx-auto p-16 text-center text-xs text-stone-500">
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
        {/* Header with Step Tracker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {t('checkout_title', 'Order Checkout')} &amp; Farm Delivery
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Secure checkout for certified fertilizers, foliar inputs, and agricultural medicines.
            </p>
          </div>
          <Link
            href="/cart"
            className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ArrowLeft size={14} /> Back to Cart
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-2xl text-rose-900 text-xs flex items-start gap-3 animate-in fade-in">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Checkout Notice</p>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Address and Payment (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1 & 2: Delivery Address Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Truck size={18} className="text-[#2F7D4F]" /> Farm Plot Delivery Address
                </h2>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Step 2 of 3
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Full Name / Farmer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryName}
                    onChange={(e) => setFormData({ ...formData, deliveryName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-stone-900 font-medium"
                    placeholder="e.g. Ramesh Patel"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mobile Phone (Driver Contact) *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                    value={formData.deliveryPhone}
                    onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-stone-900 font-medium"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 mb-1">Farm Plot Address / Landmark *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    placeholder="Survey Number, Farm gate, Near Canal, Substation, or Main Road..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Village / Town</label>
                  <input
                    type="text"
                    value={formData.deliveryVillage}
                    onChange={(e) => setFormData({ ...formData, deliveryVillage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-stone-900 font-medium"
                    placeholder="Village name"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryDistrict}
                    onChange={(e) => setFormData({ ...formData, deliveryDistrict: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-stone-900 font-medium"
                    placeholder="District"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryState}
                    onChange={(e) => setFormData({ ...formData, deliveryState: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-stone-900 font-medium"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    title="Please enter a valid 6-digit postal PIN code"
                    value={formData.deliveryPincode}
                    onChange={(e) => setFormData({ ...formData, deliveryPincode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-stone-900 font-medium"
                    placeholder="6-digit PIN code"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 text-xs">Special Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Call before arrival, tractor delivery accessible..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 text-xs text-stone-900"
                />
              </div>
            </div>

            {/* Step 3: Payment Method Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Banknote size={18} className="text-[#2F7D4F]" /> Payment Method
                </h2>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Step 3 of 3
                </span>
              </div>

              <div className="space-y-3">
                {/* Cash on Delivery (Recommended for Farmers) */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    formData.paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className="mt-1"
                  />
                  <div className="text-xs space-y-1">
                    <span className="font-extrabold text-stone-900 block flex items-center gap-2">
                      <Truck size={15} className="text-[#2F7D4F]" /> Cash on Delivery (Pay at Farm Gate)
                    </span>
                    <p className="text-stone-600 leading-relaxed">
                      Pay cash to the cooperative delivery tractor/truck driver upon bag unloading and weight inspection. No online credentials needed.
                    </p>
                  </div>
                </label>

                {/* Razorpay Online Payment */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    formData.paymentMethod === 'online_razorpay'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online_razorpay"
                    checked={formData.paymentMethod === 'online_razorpay'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'online_razorpay' })}
                    className="mt-1"
                  />
                  <div className="text-xs space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-stone-900 flex items-center gap-2">
                        <CreditCard size={15} className="text-blue-600" /> Razorpay Online (UPI, Google Pay, Cards, Netbanking)
                      </span>
                      {gatewayStatus?.isConfigured ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Live Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Requires Credentials
                        </span>
                      )}
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      Secure instant UPI and card payment via Razorpay. Cryptographically verified on backend.
                    </p>
                    {!gatewayStatus?.isConfigured && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 mt-2 flex items-start gap-2">
                        <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                        <span>
                          To activate online payments, configure <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> in <code>.env</code>. Select Cash on Delivery to place your order now without credentials.
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Step 1 Cart Review & Confirmation (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900">
                  Step 1: Cart Review ({cart?.itemCount || 0} items)
                </h2>
                <Link href="/cart" className="text-xs font-bold text-[#2F7D4F] hover:underline">
                  Edit
                </Link>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-2.5 text-xs pb-2 border-b border-stone-50">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F5F7F4] border border-stone-200/70 shrink-0">
                      <ProductImage
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-stone-900 line-clamp-1">{item.product.name}</p>
                      <p className="text-[10px] text-stone-400">
                        {item.quantity} × ₹{item.product.price} ({item.product.packSize})
                      </p>
                    </div>
                    <span className="font-bold text-stone-900 shrink-0">₹{item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
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
                  <span>Total Payable</span>
                  <span className="text-xl">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#2F7D4F] hover:bg-[#25663f] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting
                  ? 'Processing Order...'
                  : formData.paymentMethod === 'online_razorpay'
                  ? 'Proceed to Pay with Razorpay'
                  : 'Confirm & Place Cash on Delivery Order'}{' '}
                <ArrowRight size={15} />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 text-center">
                <Lock size={11} className="text-[#2F7D4F]" />
                <span>SSL Encrypted Transaction • Verified Cooperative Dispatch</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
