import React, { Suspense } from 'react';
import { SiteHeader } from '@/components/domain/SiteHeader';
import { MarketExplorer } from '@/components/market/MarketExplorer';
import { RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Mandi Prices & Agricultural Market Intelligence | SmartFarm AI',
  description: 'Track daily wholesale mandi rates, official modal prices, and historical trends across APMCs in Gujarat and India.',
};

export default function PublicMarketPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />
      <Suspense
        fallback={
          <div className="min-h-[50vh] bg-[#FAF6EF] flex items-center justify-center">
            <RefreshCw size={24} className="text-emerald-600 animate-spin" />
          </div>
        }
      >
        <MarketExplorer variant="public" />
      </Suspense>
    </div>
  );
}
