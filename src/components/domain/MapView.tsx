'use client';

import React, { useEffect, useState } from 'react';

export interface MapViewProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  boundaryGeoJson?: string;
  onBoundaryChange?: (geoJson: string) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  lat = 22.3072,
  lng = 73.1812,
  zoom = 13,
  boundaryGeoJson,
  onBoundaryChange,
  className = 'h-[300px]',
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`w-full bg-stone-200 rounded-xl flex items-center justify-center text-stone-500 font-medium ${className}`}>
        Loading Interactive Map...
      </div>
    );
  }

  return (
    <div className={`w-full relative rounded-xl overflow-hidden border border-stone-300 shadow-inner bg-emerald-950/10 ${className}`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-emerald-900/5 backdrop-blur-xs text-center z-20">
        <div className="bg-white/95 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-emerald-800/20 max-w-xs">
          <p className="text-xs font-semibold text-emerald-950 mb-1">Interactive Farm Map</p>
          <p className="text-[11px] text-stone-600 mb-2">
            Location: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
          </p>
          {boundaryGeoJson ? (
            <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-full border border-emerald-300">
              Field Boundary Polygon Loaded
            </span>
          ) : (
            <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-700 text-[11px] font-medium rounded-full border border-stone-300">
              Point Location Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
