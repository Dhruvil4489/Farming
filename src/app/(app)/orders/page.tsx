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
import { Button } from '@/components/ui/Button';

export default function FarmerPortalOrdersPage() {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">
            My Orders & Input Deliveries
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Track certified fertilizers and farm plot deliveries
          </p>
        </div>
        <Link href="/store">
          <Button>
            <ShoppingBag size={14} className="mr-1.5" />
            <span>Order Fertilizers</span>
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-stone-500 font-medium bg-white rounded-3xl border border-stone-200">
          Loading your recent farm orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
          <Package size={40} className="mx-auto text-stone-400" />
          <h3 className="font-extrabold text-stone-900 text-lg">No orders placed yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Order authentic urea, DAP, foliar sprays, or micronutrients from our certified agricultural cooperative.
          </p>
          <Link href="/store">
            <Button size="sm">
              <ShoppingBag size={14} className="mr-1.5" />
              <span>Browse Fertilizer Store</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 text-base">
                      Order #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Placed on: {new Date(order.createdAt).toLocaleDateString()} • Destination: {order.deliveryVillage || order.deliveryDistrict}, {order.deliveryDistrict}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-lg font-black text-[#0F2D1F]">
                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-stone-400 block">
                    {order.paymentMethod === 'demo_checkout' ? 'Test Checkout / Verified' : order.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Order Items List */}
              <div className="divide-y divide-stone-100">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-800">{item.productNameSnapshot}</span>
                      <p className="text-[11px] text-stone-500">
                        {item.packSizeSnapshot} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-stone-900">
                      ₹{item.totalPrice?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Details & Tracking CTA */}
              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-stone-500">
                  <Truck size={14} className="text-[#2F7D4F]" />
                  <span>
                    Recipient: <strong>{order.deliveryName}</strong> ({order.deliveryPhone})
                  </span>
                </div>

                <Link
                  href={`/orders/${order.id}`}
                  className="font-bold text-[#2F7D4F] hover:underline flex items-center gap-1"
                >
                  <span>View Delivery Tracking</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
