import React, { Suspense } from 'react';
import { FertilizerStoreExplorer } from '@/components/domain/FertilizerStoreExplorer';
import { RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Fertilizer Store | SmartFarm AI Farmer Portal',
  description: 'Procure authentic fertilizers, foliar sprays, and micronutrients directly delivered to your farm plot.',
};

  export default async function FarmerPortalStorePage({
    searchParams,
  }: {
    searchParams: Promise<{ crop?: string; category?: string }>;
  }) {
    const params = await searchParams;
    return (
      <Suspense
        fallback={
          <div className="p-16 flex items-center justify-center">
            <RefreshCw size={24} className="text-emerald-600 animate-spin" />
          </div>
        }
      >
        <FertilizerStoreExplorer
          variant="portal"
          initialCrop={params?.crop || ''}
          initialCategory={params?.category || ''}
        />
      </Suspense>
    );
  }
