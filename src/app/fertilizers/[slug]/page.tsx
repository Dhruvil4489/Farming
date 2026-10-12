'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Truck,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Package,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/v1/store/products/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setProduct(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async (goToCart = false) => {
    if (!product) return;
    setAdding(true);
    try {
      const res = await fetch('/api/v1/store/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event('cart-updated'));
        if (goToCart) {
          router.push('/cart');
        } else {
          setToastMsg(`Added ${quantity} × ${product.name} to cart!`);
          setTimeout(() => setToastMsg(''), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
        <SiteHeader />
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-stone-500">
          Loading product details...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
        <SiteHeader />
        <div className="max-w-7xl mx-auto p-12 text-center space-y-4">
          <p className="font-bold text-lg text-stone-800">Product Not Found</p>
          <Link href="/fertilizers" className="text-xs font-bold text-[#2F7D4F] underline">
            ← Back to Fertilizer Store
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stock >= quantity;

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2D1F] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
          <Link href="/cart" className="ml-2 text-amber-300 underline hover:text-white">
            Open Cart
          </Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <Link
          href="/fertilizers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7D4F] hover:underline"
        >
          <ArrowLeft size={14} /> Back to Fertilizer Catalog
        </Link>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-6 sm:p-10 rounded-3xl border border-stone-200/90 shadow-sm">
          {/* Left: Image Showcase */}
          <div className="space-y-4">
            <div className="relative h-[380px] sm:h-[460px] rounded-2xl overflow-hidden bg-stone-100 border border-stone-100">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-stone-900 font-extrabold text-xs shadow-md">
                Brand: {product.brand?.name}
              </span>
              <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-900 text-white font-bold text-xs shadow-md">
                Pack: {product.packSize}
              </span>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between text-xs text-stone-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Truck size={16} className="text-[#2F7D4F]" /> Farm-gate delivery available
              </span>
              <span className="font-bold text-emerald-800">Free delivery above ₹1,000</span>
            </div>
          </div>

          {/* Right: Specifications & Purchase Actions */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2F7D4F]">
                  {product.category?.name}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                  {product.name}
                </h1>
                <p className="text-xs font-semibold text-emerald-800 mt-1">
                  Active Composition: {product.composition || 'Official Standard Specification'}
                </p>
              </div>

              {/* Price Block */}
              <div className="flex items-baseline gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <span className="text-3xl font-black text-[#0F2D1F]">
                  ₹{product.price.toFixed(2)}
                </span>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-sm text-stone-400 line-through">
                    MRP ₹{product.mrp}
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-700 ml-auto">
                  Govt Subsidized Control Rate
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1.5 text-xs text-stone-700 leading-relaxed">
                <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Overview:</p>
                <p>{product.description}</p>
              </div>

              {/* Usage Instructions */}
              {product.usageInstructions && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1 text-xs">
                  <p className="font-bold text-[#0F2D1F]">Application & Timing Instructions:</p>
                  <p className="text-emerald-950 leading-relaxed">{product.usageInstructions}</p>
                </div>
              )}

              {/* Safety Precautions */}
              {product.safetyNotes && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-950">
                  <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Handling & Storage Precaution:</strong> {product.safetyNotes}
                  </p>
                </div>
              )}

              {/* Seller Integrity Information */}
              <div className="text-[11px] text-stone-500 space-y-0.5 pt-2">
                <p>Fulfilment Partner: <strong>{product.sellerName}</strong></p>
                <p>Agri-Input License No: <strong>{product.sellerLicense}</strong></p>
              </div>
            </div>

            {/* Purchase Controls */}
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-stone-700">Quantity:</span>
                <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-bold text-xs text-stone-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <span className="text-xs text-stone-500">
                  ({product.stock} bags available in regional warehouse)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={!inStock || adding}
                  className="py-3.5 rounded-2xl border-2 border-[#2F7D4F] hover:bg-emerald-50 text-[#2F7D4F] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={15} /> Add to Cart
                </button>

                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={!inStock || adding}
                  className="py-3.5 rounded-2xl bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  Buy Now <ArrowRight size={15} />
                </button>
              </div>

              {/* Related Guidance Link */}
              <div className="pt-2 text-center">
                <Link
                  href="/fertilizers/guide"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7D4F] hover:underline"
                >
                  <BookOpen size={14} /> View Verified University Fertilizer Schedule For Your Crop →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
