'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

export interface MarketPriceRecord {
  id: string;
  commodityId?: string;
  commodityName: string;
  variety?: string | null;
  category?: string | null;
  locationId?: string;
  marketName: string;
  state: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  priceDate: string;
  arrival_date?: string;
  arrivalDate?: string;
  lastSyncedAt?: string;
  fetchedAt?: string;
  source?: string;
  isDemo?: boolean;
  comparison?: {
    previousModalPrice?: number | null;
    previousPriceDate?: string | null;
    priceChange?: number | null;
    percentageChange?: number | null;
    status?: 'up' | 'down' | 'stable' | 'unavailable';
  } | null;
}

interface MarketPriceCardProps {
  item: MarketPriceRecord;
  onSelect?: (item: MarketPriceRecord) => void;
}

export function MarketPriceCard({ item, onSelect }: MarketPriceCardProps) {
  // Defensive fallbacks for all data fields
  const commodityName = item.commodityName || 'Commodity';
  const variety = item.variety || 'Standard Grade';
  const marketName = item.marketName || 'APMC Mandi';
  const state = item.state || 'Gujarat';
  const district = item.district || '';
  const modalPrice = typeof item.modalPrice === 'number' ? item.modalPrice : 0;
  const minPrice = typeof item.minPrice === 'number' ? item.minPrice : modalPrice;
  const maxPrice = typeof item.maxPrice === 'number' ? item.maxPrice : modalPrice;
  const unit = (item.unit || '₹/Quintal').replace('₹/', '');
  const priceDate = item.priceDate || 'Recent';

  const comp = item.comparison;
  const priceChange = typeof comp?.priceChange === 'number' ? comp.priceChange : null;
  const percentageChange = typeof comp?.percentageChange === 'number' ? comp.percentageChange : null;
  const isUp = priceChange !== null && priceChange > 0;
  const isDown = priceChange !== null && priceChange < 0;
  const isUnchanged = priceChange !== null && priceChange === 0;

  return (
    <div
      onClick={() => onSelect && onSelect(item)}
      className="p-5 rounded-2xl bg-white hover:bg-stone-50/90 border border-stone-200/90 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group"
    >
      {/* Header: Commodity & State Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-stone-900 text-base tracking-tight truncate group-hover:text-emerald-800 transition-colors">
            {commodityName}
          </h3>
          <p className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-stone-400 shrink-0" />
            <span>{marketName}</span>
            {variety && <span className="text-stone-400">• {variety}</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ProvenanceChip
            type={item.isDemo ? 'simulated' : 'official_market'}
            size="xs"
          />
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold uppercase tracking-wider border border-stone-200/60">
            {state}
          </span>
        </div>
      </div>

      {/* Main Metric: Modal Price & Comparison */}
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-[#0F2D1F] tracking-tight">
            ₹{modalPrice.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-stone-500 font-medium">/{unit}</span>
        </div>

        {/* Previous Trading Day Comparison */}
        <div className="mt-1.5 min-h-[22px] flex items-center">
          {priceChange !== null && percentageChange !== null ? (
            <div className="flex items-center gap-1.5 text-xs">
              {isUp ? (
                <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 text-[11px]">
                  <TrendingUp size={13} className="mr-0.5 shrink-0" />
                  +₹{priceChange} ({percentageChange > 0 ? `+${percentageChange}` : percentageChange}%)
                </span>
              ) : isDown ? (
                <span className="inline-flex items-center font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60 text-[11px]">
                  <TrendingDown size={13} className="mr-0.5 shrink-0" />
                  -₹{Math.abs(priceChange)} ({percentageChange}%)
                </span>
              ) : isUnchanged ? (
                <span className="inline-flex items-center font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                  <Minus size={13} className="mr-0.5 shrink-0" />
                  Unchanged
                </span>
              ) : null}
              <span className="text-[10px] text-stone-400">vs prev day</span>
            </div>
          ) : (
            <span className="text-[11px] text-stone-400 italic">
              Previous trading observation pending
            </span>
          )}
        </div>
      </div>

      {/* Cadence Badges: Arrival Date vs Last Synced */}
      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1 text-[10px] text-stone-500">
        <span className="inline-flex items-center gap-1 font-medium text-stone-600" title="Reported APMC Mandi Auction Date">
          <Calendar size={11} className="text-stone-400 shrink-0" />
          <span>Arrival: <strong className="text-stone-800 font-semibold">{item.arrival_date || item.priceDate}</strong></span>
        </span>
        {(item.lastSyncedAt || item.fetchedAt) && (
          <span className="inline-flex items-center gap-1 text-stone-500 text-[10px]" title={`Feed synchronized: ${item.lastSyncedAt || item.fetchedAt}`}>
            <Clock size={10} className="text-emerald-600 shrink-0" />
            <span>Synced: <strong className="text-stone-700">{new Date(item.lastSyncedAt || item.fetchedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </span>
        )}
      </div>

      {/* Footer: Daily Price Range & Navigation */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
        <span className="font-medium text-stone-600">
          Range: <strong className="text-stone-800 font-semibold">₹{minPrice.toLocaleString('en-IN')}</strong> - <strong className="text-stone-800 font-semibold">₹{maxPrice.toLocaleString('en-IN')}</strong>
        </span>
        <span className="font-bold text-[#2F7D4F] group-hover:text-emerald-700 inline-flex items-center gap-0.5">
          Details <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}

/**
 * High-quality skeleton card that looks like a real card during loading
 * rather than an empty blank grey rectangle!
 */
export function MarketPriceCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-28 bg-stone-200 rounded-md" />
          <div className="h-3 w-36 bg-stone-100 rounded-md" />
        </div>
        <div className="h-4 w-12 bg-stone-200 rounded-md" />
      </div>

      <div className="space-y-2 py-1">
        <div className="h-7 w-24 bg-stone-200 rounded-md" />
        <div className="h-4 w-32 bg-stone-100 rounded-md" />
      </div>

      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
        <div className="h-3 w-28 bg-stone-100 rounded-md" />
        <div className="h-3 w-12 bg-stone-100 rounded-md" />
      </div>
    </div>
  );
}
