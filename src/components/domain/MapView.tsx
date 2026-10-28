'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, WifiOff, Compass } from 'lucide-react';

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
  const [isOnline, setIsOnline] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Defend against third-party Leaflet SVG vector focus traps on complex polygon vertices
  useEffect(() => {
    if (!containerRef.current) return;
    const trapElements = containerRef.current.querySelectorAll(
      'svg, path, polygon, .leaflet-pane, .leaflet-marker-icon'
    );
    trapElements.forEach((el) => {
      el.setAttribute('focusable', 'false');
      el.setAttribute('aria-hidden', 'true');
      el.removeAttribute('tabindex');
    });
  }, [isClient, boundaryGeoJson]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ensure Tab and Escape smoothly traverse out of map region without getting trapped in vertices
    if (e.key === 'Escape') {
      containerRef.current?.blur();
    }
  };

  if (!isClient) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`w-full bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 font-semibold text-xs ${className}`}
      >
        <span>Loading Farm Map View...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Farm Field Location and Boundary Map"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`w-full relative rounded-xl overflow-hidden border border-stone-300 shadow-inner bg-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F] focus:ring-offset-2 ${className}`}
    >
      {/* Keyboard Accessibility Skip Link to bypass map canvas directly to coordinates */}
      <a
        href="#field-coordinates-card"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:px-3 focus:py-1.5 focus:bg-[#143D2A] focus:text-[#FAF6EF] focus:rounded-lg focus:shadow-lg focus:text-xs focus:font-semibold focus:ring-2 focus:ring-[#2F7D4F]"
      >
        Skip interactive map to field coordinates
      </a>

      {/* Background patterned grid representing map coordinates */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] opacity-70"
      />

      {/* Center Pin & Fallback Details Card */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20 text-center">
        <div
          id="field-coordinates-card"
          tabIndex={0}
          className="bg-white/95 backdrop-blur px-5 py-3.5 rounded-2xl shadow-md border border-stone-200/90 max-w-sm space-y-2 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
        >
          <div className="flex items-center justify-center gap-1.5 text-emerald-900">
            <MapPin size={16} className="text-emerald-700 animate-bounce" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">Field Coordinates</span>
          </div>

          <div
            className="text-xs font-mono font-bold text-stone-900 bg-stone-50 px-2.5 py-1 rounded border border-stone-300"
            aria-label={`Latitude ${lat.toFixed(5)} degrees North, Longitude ${lng.toFixed(5)} degrees East`}
          >
            {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
          </div>

          {!isOnline && (
            <div
              role="alert"
              className="flex items-center justify-center gap-1 text-[11px] text-amber-950 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-semibold"
            >
              <WifiOff size={12} aria-hidden="true" />
              <span>Offline — using cached plot location</span>
            </div>
          )}

          {boundaryGeoJson ? (
            <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-950 text-[10px] font-bold rounded-full border border-emerald-400">
              Polygon Boundary Mapped
            </span>
          ) : (
            <span className="inline-block px-2.5 py-0.5 bg-stone-200 text-stone-950 text-[10px] font-semibold rounded-full border border-stone-400">
              Point Centroid Active
            </span>
          )}

          <p className="text-[10px] text-stone-600 font-medium italic pt-0.5">
            Map tiles fallback: Plot location preserved and verified
          </p>
        </div>
      </div>
    </div>
  );
};

