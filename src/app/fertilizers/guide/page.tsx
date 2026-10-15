import React, { Suspense } from 'react';
import { SiteHeader } from '@/components/domain/SiteHeader';
import { NutrientGuidanceExplorer } from '@/components/domain/NutrientGuidanceExplorer';
import { RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Fertilizer & Agronomy Knowledge Center | SmartFarm AI',
  description: 'Science-backed fertilizer timing, nutrient roles, and application methods verified by ICAR & State Agricultural Universities.',
};

export default function PublicFertilizerGuidePage() {
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
        <NutrientGuidanceExplorer variant="public" />
      </Suspense>
    </div>
  );
}
