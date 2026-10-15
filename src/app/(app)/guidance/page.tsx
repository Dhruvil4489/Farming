import React, { Suspense } from 'react';
import { NutrientGuidanceExplorer } from '@/components/domain/NutrientGuidanceExplorer';
import { RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Crop Nutrient Guidance | SmartFarm AI Farmer Portal',
  description: 'Science-backed agronomic fertilizer schedules, stage timing, and soil test audit for SmartFarm AI farmers.',
};

export default function FarmerPortalGuidancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 flex items-center justify-center">
          <RefreshCw size={24} className="text-emerald-600 animate-spin" />
        </div>
      }
    >
      <NutrientGuidanceExplorer variant="portal" />
    </Suspense>
  );
}
