import React, { Suspense } from 'react';
import { MarketExplorer } from '@/components/market/MarketExplorer';
import { RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Mandi Prices | SmartFarm AI Farmer Portal',
  description: 'Latest reported APMC mandi prices and wholesale commodity rates across Gujarat and India for SmartFarm AI farmers.',
};

export default function FarmerPortalMandiPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 flex items-center justify-center">
          <RefreshCw size={24} className="text-emerald-600 animate-spin" />
        </div>
      }
    >
      <MarketExplorer variant="portal" />
    </Suspense>
  );
}
