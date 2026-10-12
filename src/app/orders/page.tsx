'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/v1/store/orders');
        if (res.ok) {
          const json = await res.json();
          setOrders(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px]">Delivered</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold text-[11px]">In Transit</span>;
      case 'processing':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px]">Packing at Hub</span>;
      default:
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg font-bold text-[11px]">Confirmed</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              My Orders & Fertilizer Deliveries
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Track dispatched agri-input orders and view historical receipts.
            </p>
          </div>
          <Link
            href="/fertilizers"
            className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1"
          >
            <ShoppingBag size={14} /> Shop Fertilizers
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-white rounded-3xl border border-stone-200 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Package size={28} />
            </div>
            <h2 className="text-lg font-bold text-stone-800">No Orders Placed Yet</h2>
            <p className="text-xs text-stone-500">
              When you purchase fertilizers or micronutrients, your live delivery status will appear here.
            </p>
            <Link
              href="/fertilizers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2F7D4F] text-white font-bold text-xs shadow-md"
            >
              Start Shopping <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-stone-900 text-sm">
                      Order #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-3">
                    <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="text-base font-black text-[#0F2D1F]">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Items in Order:</p>
                    <ul className="mt-1 space-y-1">
                      {order.items?.map((it: any) => (
                        <li key={it.id} className="text-stone-800 font-medium">
                          • {it.quantity} × {it.productNameSnapshot} ({it.packSizeSnapshot})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="sm:text-right space-y-1">
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Destination:</p>
                    <p className="text-stone-700">
                      {order.deliveryAddress}, {order.deliveryDistrict}, {order.deliveryState}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-400">
                    Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Verified Sandbox Test'}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-bold text-[#2F7D4F] hover:text-[#143D2A] flex items-center gap-1"
                  >
                    Track Order & View Receipt <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
