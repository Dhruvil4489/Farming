import React, { Suspense } from 'react';
import { SiteHeader } from '@/components/domain/SiteHeader';
import { FertilizerStoreExplorer } from '@/components/domain/FertilizerStoreExplorer';
import { RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Certified Fertilizer & Input Depot | SmartFarm AI',
  description: 'Procure authentic fertilizers, foliar sprays, vermicompost, and targeted micronutrients delivered to your farm plot.',
};

export default function PublicFertilizerStorePage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1C2526] flex flex-col font-sans">
      <SiteHeader />
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <RefreshCw size={24} className="text-emerald-600 animate-spin" />
          </div>
        }
      >
        <FertilizerStoreExplorer variant="public" />
      </Suspense>
    </div>
  );
}
