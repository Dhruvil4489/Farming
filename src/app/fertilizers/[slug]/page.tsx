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
  ArrowLeft,
  ArrowRight,
  Package,
  Sprout,
  Info,
  Calendar,
  Star,
  HelpCircle,
  Clock,
  PhoneCall,
  Check,
} from 'lucide-react';
import { SiteHeader } from '@/components/domain/SiteHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { getProductSpecification, ProductSpecification } from '@/lib/product-specifications';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<any | null>(null);
  const [specs, setSpecs] = useState<ProductSpecification | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedPackSize, setSelectedPackSize] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'agronomy' | 'safety' | 'specs' | 'reviews' | 'faqs'>('agronomy');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/v1/store/products/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setProduct(json.data);
          const s = getProductSpecification(slug, json.data);
          setSpecs(s);
          setSelectedPackSize(json.data.packSize || s.availablePackSizes[0] || 'Standard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async (goToCheckout = false) => {
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
        if (goToCheckout) {
          router.push('/checkout');
        } else {
          setToastMsg(`Added ${quantity} × ${product.name} to cart!`);
          setTimeout(() => setToastMsg(''), 3500);
        }
      } else if (res.status === 401) {
        router.push(`/login?redirect=/fertilizers/${slug}`);
      } else {
        const json = await res.json().catch(() => null);
        setToastMsg(json?.error?.message || 'Could not add to cart');
        setTimeout(() => setToastMsg(''), 3500);
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
        <div className="max-w-7xl mx-auto p-16 text-center text-xs text-stone-500">
          Loading verified product specifications...
        </div>
      </div>
    );
  }

  if (!product || !specs) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
        <SiteHeader />
        <div className="max-w-7xl mx-auto p-16 text-center space-y-4">
          <p className="font-bold text-lg text-stone-800">Product Not Found</p>
          <p className="text-xs text-stone-500">The requested agricultural product is not available in the regional database.</p>
          <Link href="/store" className="inline-block px-4 py-2 bg-[#2F7D4F] text-white text-xs font-bold rounded-xl shadow-xs">
            ← Back to Fertilizer Store
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stock >= quantity;
  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2D1F] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
          <Link href="/cart" className="ml-2 text-amber-300 underline hover:text-white">
            View Cart →
          </Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
          <Link href="/store" className="text-[#2F7D4F] hover:underline flex items-center gap-1">
            <ArrowLeft size={13} /> Fertilizer Store
          </Link>
          <span>/</span>
          <span className="text-stone-400">{product.category?.name || specs.category}</span>
          <span>/</span>
          <span className="text-stone-800 font-bold truncate max-w-[200px] sm:max-w-md">{product.name}</span>
        </div>

        {/* TOP SECTION: IMAGE + PURCHASE MODULE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 sm:p-10 rounded-3xl border border-stone-200/90 shadow-xs">
          {/* Left Column: Product Image Showcase */}
          <div className="space-y-4">
            <div className="relative h-[340px] sm:h-[420px] rounded-2xl overflow-hidden bg-[#F5F7F4] border border-stone-200/80 flex items-center justify-center p-6">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-stone-900 font-extrabold text-xs shadow-xs border border-stone-200/80">
                {product.brand?.name || specs.brand}
              </span>
              <span
                className={`absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                  inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {inStock ? `${product.stock} units in stock` : 'Out of Stock'}
              </span>
              {discountPercent > 0 && (
                <span className="absolute bottom-3.5 left-3.5 px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-xs shadow-xs">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Quick Assurances */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-2">
                <Truck size={16} className="text-[#2F7D4F] shrink-0" />
                <div>
                  <p className="font-bold text-stone-800">Farm-Gate Delivery</p>
                  <p className="text-[10px] text-stone-500">Free delivery on orders over ₹1,000</p>
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#2F7D4F] shrink-0" />
                <div>
                  <p className="font-bold text-stone-800">100% Genuine Quality</p>
                  <p className="text-[10px] text-stone-500">Certified Cooperative Sourcing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Pack Size, Cart Actions */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded">
                    {product.category?.name || specs.category}
                  </span>
                  <span className="text-[10px] font-bold text-stone-400">SKU: {specs.sku}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-snug">
                  {product.name}
                </h1>
                <p className="text-xs font-semibold text-emerald-800 mt-1 flex items-center gap-1.5">
                  <Sprout size={14} className="text-[#2F7D4F]" />
                  <span>Active Composition: {product.composition || specs.activeIngredients}</span>
                </p>
              </div>

              {/* Price & MRP Block */}
              <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-100 space-y-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-[#0F2D1F]">
                    ₹{product.price.toFixed(2)}
                  </span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="text-sm text-stone-400 line-through">
                      MRP ₹{product.mrp.toFixed(2)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      Save ₹{(product.mrp - product.price).toFixed(0)} ({discountPercent}% off)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500">Inclusive of all agricultural subsidies and GST.</p>
              </div>

              {/* Available Pack Sizes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Select Pack Size:</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {specs.availablePackSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedPackSize(size)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedPackSize === size
                          ? 'bg-[#143D2A] text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overview Brief */}
              <p className="text-xs text-stone-600 leading-relaxed pt-1">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector & Purchase Buttons */}
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-stone-700">Quantity:</span>
                <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-200 font-bold transition-colors cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-black text-xs text-stone-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-200 font-bold transition-colors cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-stone-500">
                  Total: <strong className="text-stone-900">₹{(product.price * quantity).toFixed(2)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={!inStock || adding}
                  className="py-3.5 rounded-2xl border-2 border-[#2F7D4F] hover:bg-emerald-50 text-[#2F7D4F] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} /> Add to Cart
                </button>

                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  disabled={!inStock || adding}
                  className="py-3.5 rounded-2xl bg-[#2F7D4F] hover:bg-[#25663f] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  Buy Now <ArrowRight size={16} />
                </button>
              </div>

              {/* Regulatory Assurance */}
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>License: <strong>{product.sellerLicense || specs.manufacturerDetails.regulatoryLicense}</strong></span>
                <span>Cooperative Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: COMPREHENSIVE AGRICULTURAL, SAFETY & SPECIFICATIONS TABS */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-2 bg-stone-50 border-b border-stone-200 overflow-x-auto scrollbar-none text-xs">
            <button
              onClick={() => setActiveTab('agronomy')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'agronomy' ? 'bg-white text-[#143D2A] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sprout size={14} className="text-[#2F7D4F]" /> Agricultural Usage &amp; Dosage
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'safety' ? 'bg-white text-[#143D2A] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <AlertTriangle size={14} className="text-amber-600" /> Safety &amp; Storage
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'specs' ? 'bg-white text-[#143D2A] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Package size={14} className="text-blue-600" /> Specifications &amp; Manufacturer
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'reviews' ? 'bg-white text-[#143D2A] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Star size={14} className="text-amber-500" /> Farmer Reviews ({specs.reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'faqs' ? 'bg-white text-[#143D2A] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HelpCircle size={14} className="text-purple-600" /> FAQs ({specs.faqs.length})
            </button>
          </div>

          {/* Tab 1: Agricultural Usage & Dosage */}
          {activeTab === 'agronomy' && (
            <div className="p-6 sm:p-8 space-y-6 text-xs text-stone-700">
              {/* Suitable Crops */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <Sprout size={16} className="text-[#2F7D4F]" /> Suitable Agricultural Crops:
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {specs.suitableCrops.map((crop) => (
                    <span
                      key={crop}
                      className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>

              {/* Purpose and Benefits */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-stone-900 text-sm">Key Agricultural Benefits:</h3>
                <ul className="space-y-1.5">
                  {specs.purposeAndBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-[#2F7D4F] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Application Methodology */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                  <span className="font-bold text-stone-900 block text-xs">Application Method:</span>
                  <p className="text-stone-600 leading-relaxed">{specs.applicationMethod}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                  <span className="font-bold text-stone-900 block text-xs">Recommended Dosage:</span>
                  <p className="text-stone-600">
                    <strong>Per Acre:</strong> {specs.dosagePerAcre}
                  </p>
                  <p className="text-stone-600">
                    <strong>Per Liter Water:</strong> {specs.dosagePerLiterWater}
                  </p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                  <span className="font-bold text-stone-900 block text-xs">Application Timing:</span>
                  <p className="text-stone-600 leading-relaxed">{specs.applicationTiming}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                  <span className="font-bold text-stone-900 block text-xs">Application Frequency:</span>
                  <p className="text-stone-600 leading-relaxed">{specs.frequency}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Safety & Storage */}
          {activeTab === 'safety' && (
            <div className="p-6 sm:p-8 space-y-6 text-xs text-stone-700">
              {specs.preHarvestIntervalDays && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                  <Clock size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-amber-950 text-sm">
                      Mandatory Pre-Harvest Interval (PHI): {specs.preHarvestIntervalDays} Days
                    </h4>
                    <p className="text-amber-900 text-xs mt-0.5">
                      Do not harvest or pick edible crop produce within {specs.preHarvestIntervalDays} days of applying this product to guarantee zero residue above MRL.
                    </p>
                  </div>
                </div>
              )}

              {/* Precautions */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-stone-900 text-sm">Important Precautions:</h3>
                <ul className="space-y-1.5">
                  {specs.precautions.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Personal Protective Equipment */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-stone-900 text-sm">Required Personal Protective Gear (PPE):</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {specs.safetyEquipment.map((eq) => (
                    <span
                      key={eq}
                      className="px-3 py-1 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 font-bold"
                    >
                      🛡️ {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Storage Instructions */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <h4 className="font-bold text-stone-900">Storage &amp; Disposal Instructions:</h4>
                <p className="text-stone-600 leading-relaxed">{specs.storageInstructions}</p>
              </div>
            </div>
          )}

          {/* Tab 3: Specifications & Manufacturer */}
          {activeTab === 'specs' && (
            <div className="p-6 sm:p-8 space-y-6 text-xs text-stone-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <h4 className="font-bold text-stone-900 text-sm">Technical Specifications:</h4>
                  <div className="divide-y divide-stone-200/60 text-xs">
                    <div className="py-1.5 flex justify-between">
                      <span className="text-stone-500">Product SKU:</span>
                      <strong className="text-stone-900">{specs.sku}</strong>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-stone-500">Formulation Type:</span>
                      <strong className="text-stone-900">{specs.formulation}</strong>
                    </div>
                    {specs.npkRatio && (
                      <div className="py-1.5 flex justify-between">
                        <span className="text-stone-500">NPK Nutrient Ratio:</span>
                        <strong className="text-emerald-800">{specs.npkRatio}</strong>
                      </div>
                    )}
                    <div className="py-1.5 flex justify-between">
                      <span className="text-stone-500">Guaranteed Shelf-Life:</span>
                      <strong className="text-stone-900">{specs.shelfLifeMonths} Months</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <h4 className="font-bold text-stone-900 text-sm">Manufacturer Information:</h4>
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <p>
                      <strong>Manufacturer:</strong> {specs.manufacturerDetails.company}
                    </p>
                    <p>
                      <strong>Headquarters:</strong> {specs.manufacturerDetails.headquarters}
                    </p>
                    <p>
                      <strong>Regulatory License:</strong> {specs.manufacturerDetails.regulatoryLicense}
                    </p>
                    <p className="flex items-center gap-1.5 text-emerald-800 font-bold pt-1">
                      <PhoneCall size={13} /> Farmer Helpline: {specs.manufacturerDetails.tollFreeSupport}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Customer Reviews */}
          {activeTab === 'reviews' && (
            <div className="p-6 sm:p-8 space-y-6 text-xs text-stone-700">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-[#0F2D1F]">5.0</div>
                  <div>
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={15} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500">Based on {specs.reviews.length} verified farmer orders</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                  100% Genuine Farmer Feedback
                </span>
              </div>

              <div className="space-y-3">
                {specs.reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-xs">{r.farmerName}</span>
                        <span className="text-[10px] text-stone-400">({r.location})</span>
                        {r.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                            <CheckCircle2 size={11} /> Verified Order
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">{r.date}</span>
                    </div>
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-stone-600 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: FAQs */}
          {activeTab === 'faqs' && (
            <div className="p-6 sm:p-8 space-y-4 text-xs text-stone-700">
              {specs.faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-2">
                    <HelpCircle size={15} className="text-[#2F7D4F] shrink-0" /> {faq.question}
                  </h4>
                  <p className="text-stone-600 pl-6 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
