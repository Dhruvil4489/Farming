'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Agritech3DScene } from './Agritech3DScene';
import { Sparkles, Activity, ShieldCheck, Sun, CloudRain } from 'lucide-react';

interface CinematicVideoHeroProps {
  children: React.ReactNode;
}

export function CinematicVideoHero({ children }: CinematicVideoHeroProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // When video can play
  const handleCanPlay = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = () => {
    console.info('Hero background video fallback activated (high-res cinematic farm poster + 3D terrain).');
    setVideoError(true);
  };

  // High-res agricultural sunset over fertile Indian farmland
  const posterImage =
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85';

  return (
    <div className="relative min-h-[75vh] lg:min-h-[82vh] flex items-center justify-center overflow-hidden bg-[#0F2D1F]">
      {/* 1. Cinematic Background Video with Triple Failover & Poster Fallback */}
      {!prefersReducedMotion && !videoError ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={posterImage}
          onCanPlay={handleCanPlay}
          onError={handleVideoError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-40 scale-100' : 'opacity-0 scale-105'
          }`}
          aria-hidden="true"
        >
          {/* Primary & mirror agricultural video sources */}
          <source
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            type="video/mp4"
          />
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-cornfield-with-golden-sunlight-41829-large.mp4"
            type="video/mp4"
          />
        </video>
      ) : null}

      {/* 2. Cinematic Agricultural High-Res Backdrop (Always active as rich layer) */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-25"
        style={{ backgroundImage: `url(${posterImage})` }}
        aria-hidden="true"
      />

      {/* 3. Three.js Interactive Precision Topography & Atmospheric Spores */}
      <Agritech3DScene />

      {/* 4. Ambient Gradient Overlays for Guaranteed Text Readability */}
      {/* Dark vignette to keep nav & text 100% accessible */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0F2D1F]/95 via-[#0F2D1F]/80 to-[#0F2D1F] pointer-events-none z-2"
        aria-hidden="true"
      />

      {/* Golden dawn sunrise glow radial */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[460px] bg-amber-400/10 blur-[130px] rounded-full pointer-events-none z-2"
        aria-hidden="true"
      />

      {/* Subtle bottom transition gradient into the market section */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#FAF6EF] to-transparent pointer-events-none z-3 opacity-90"
        aria-hidden="true"
      />

      {/* 5. Floating Interactive Agritech Indicator Badges (Layered Foreground Depth) */}
      <div className="hidden xl:block absolute left-8 top-1/3 z-10 pointer-events-none animate-in fade-in slide-in-from-left duration-1000">
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 backdrop-blur-md text-emerald-100 text-xs shadow-xl space-y-1 max-w-[210px] pointer-events-auto hover:border-emerald-400 transition-colors">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
            <Activity size={13} className="animate-pulse" />
            <span>AGRONOMIC TELEMETRY</span>
          </div>
          <p className="text-[11px] text-emerald-200/90 font-medium leading-snug">
            Kharif Cotton in <strong>Squaring Stage</strong> across 3.7 ha
          </p>
          <span className="text-[10px] text-emerald-400/80 block pt-1 border-t border-emerald-800/60">
            • JAU Extension Verified
          </span>
        </div>
      </div>

      <div className="hidden xl:block absolute right-8 top-1/3 z-10 pointer-events-none animate-in fade-in slide-in-from-right duration-1000">
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-amber-500/30 backdrop-blur-md text-amber-100 text-xs shadow-xl space-y-1 max-w-[210px] pointer-events-auto hover:border-amber-400 transition-colors">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
            <Sparkles size={13} />
            <span>LIVE APMC BENCHMARK</span>
          </div>
          <p className="text-[11px] text-amber-200/90 font-medium leading-snug">
            Rajkot Shankar-6 Cotton at <strong>₹7,520/Q</strong> (+1.48%)
          </p>
          <span className="text-[10px] text-amber-400/80 block pt-1 border-t border-amber-800/60">
            • AGMARKNET Official Feed
          </span>
        </div>
      </div>

      {/* 6. Foreground Content with Proper Responsive Padding */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-14 sm:pt-28 sm:pb-16 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
