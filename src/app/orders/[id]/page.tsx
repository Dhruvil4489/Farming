'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/v1/store/orders/${id}`);
        if (res.ok) {
          const json = await res.json();
          setOrder(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
        <SiteHeader />
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-stone-500">
          Loading order details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
        <SiteHeader />
        <div className="max-w-7xl mx-auto p-12 text-center space-y-4">
          <p className="font-bold text-lg text-stone-800">Order Not Found</p>
          <Link href="/orders" className="text-xs font-bold text-[#2F7D4F] underline">
            ← View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'confirmed', label: 'Order Confirmed', desc: 'Received & authorized' },
    { key: 'processing', label: 'Hub Processing', desc: 'Packing at cooperative hub' },
    { key: 'shipped', label: 'Dispatched / In Transit', desc: 'Out for farm delivery' },
    { key: 'delivered', label: 'Delivered', desc: 'Farm-gate handover completed' },
  ];

  const currentStepIdx =
    order.status === 'delivered'
      ? 3
      : order.status === 'shipped'
      ? 2
      : order.status === 'processing'
      ? 1
      : 0;

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                {order.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <Link
            href="/orders"
            className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Orders
          </Link>
        </div>

        {/* Live Delivery Status Progress Bar */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
            <Truck size={16} className="text-[#2F7D4F]" /> Farm-Gate Delivery Tracking
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
            {steps.map((st, idx) => {
              const isPast = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={st.key} className="space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isPast
                          ? 'bg-[#2F7D4F] text-white'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-[#0F2D1F]' : isPast ? 'text-stone-800' : 'text-stone-400'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 pl-9">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items Table & Delivery Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items (2 Cols) */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
              <Receipt size={18} className="text-[#2F7D4F]" /> Items Purchased
            </h2>

            <div className="divide-y divide-stone-100">
              {order.items?.map((it: any) => (
                <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-bold text-stone-900">{it.productNameSnapshot}</h3>
                    <p className="text-[11px] text-stone-500">
                      Pack: {it.packSizeSnapshot} • Qty: {it.quantity} × ₹{it.unitPriceSnapshot.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-black text-stone-900 text-sm">₹{it.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Farm-gate Delivery</span>
                <span>{order.deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${order.deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-black text-[#0F2D1F]">
                <span>Total Paid</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-1.5">
                <MapPin size={16} className="text-[#2F7D4F]" /> Dispatch Address
              </h2>

              <div className="space-y-1 text-stone-700">
                <p className="font-bold text-stone-900 text-sm">{order.deliveryName}</p>
                <p>Phone: {order.deliveryPhone}</p>
                <p>{order.deliveryAddress}</p>
                <p>
                  {order.deliveryVillage ? `${order.deliveryVillage}, ` : ''}
                  {order.deliveryDistrict}, {order.deliveryState} - {order.deliveryPincode}
                </p>
                {order.notes && (
                  <p className="text-[11px] text-stone-500 italic pt-1">
                    Note: "{order.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3 text-xs">
              <h2 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#2F7D4F]" /> Payment & Integrity Status
              </h2>

              <p className="text-stone-700">
                Method: <strong>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Verified Sandbox Test'}</strong>
              </p>
              <p className="text-emerald-800 font-bold">
                Payment Status: {order.paymentStatus === 'test_paid' ? 'Paid (Sandbox Integrity)' : order.paymentStatus}
              </p>
              <div className="p-3 bg-stone-50 rounded-xl text-[10px] text-stone-500">
                Verified against SmartFarm certified cooperative supply catalog. Order details stored permanently in database.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
