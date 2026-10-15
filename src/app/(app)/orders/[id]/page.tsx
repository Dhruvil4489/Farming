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
import { Button } from '@/components/ui/Button';

export default function FarmerPortalOrderDetailPage() {
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
      <div className="p-16 text-center text-xs text-stone-500 font-medium bg-white rounded-3xl border border-stone-200">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-stone-200">
        <p className="font-bold text-lg text-stone-800">Order Not Found</p>
        <Link href="/orders">
          <Button size="sm">Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7D4F] hover:underline"
        >
          <ArrowLeft size={14} /> Back to My Orders
        </Link>
        <span className="text-xs text-stone-500">
          Order placed on {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs uppercase tracking-wider">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Payment Method: <strong>{order.paymentMethod}</strong> (Status: {order.paymentStatus})
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-2xl font-black text-[#0F2D1F]">
              ₹{order.totalAmount?.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-stone-400 block">Total Billed Amount</span>
          </div>
        </div>

        {/* Delivery Address Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <MapPin size={12} className="text-[#2F7D4F]" /> Farm Plot Delivery Location
            </span>
            <p className="font-extrabold text-stone-900">{order.deliveryName}</p>
            <p className="text-stone-600 leading-relaxed">
              {order.deliveryAddress}, {order.deliveryVillage && `${order.deliveryVillage}, `}
              {order.deliveryDistrict}, {order.deliveryState} - {order.deliveryPincode}
            </p>
            <p className="text-stone-500 text-[11px]">Phone: {order.deliveryPhone}</p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-stone-200 sm:pl-4">
            <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Truck size={12} className="text-[#2F7D4F]" /> Fulfillment Hub
            </span>
            <p className="font-bold text-stone-800">SmartFarm Certified Input Hub</p>
            <p className="text-stone-500 leading-relaxed text-[11px]">
              Direct dispatch via verified agricultural cooperative vehicle network.
            </p>
            {order.notes && (
              <p className="text-amber-800 text-[11px] font-semibold mt-1">
                Note: {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-stone-900 text-sm uppercase tracking-wider">
            Purchased Inputs ({order.items?.length || 0})
          </h3>
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
            {order.items?.map((it: any) => (
              <div key={it.id} className="p-4 bg-white flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">{it.productNameSnapshot}</h4>
                  <p className="text-stone-500 mt-0.5">
                    {it.packSizeSnapshot} • ₹{it.unitPriceSnapshot?.toLocaleString('en-IN')} each
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 text-[11px] block">Qty: {it.quantity}</span>
                  <span className="font-black text-stone-900 text-sm">
                    ₹{it.totalPrice?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Breakdown */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Delivery Fee</span>
            <span>
              {order.deliveryFee === 0 ? (
                <strong className="text-emerald-700">FREE</strong>
              ) : (
                `₹${order.deliveryFee}`
              )}
            </span>
          </div>
          <div className="flex justify-between text-stone-900 font-black text-sm pt-2 border-t border-stone-200">
            <span>Total Paid</span>
            <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
