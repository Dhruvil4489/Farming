'use client';

import React, { useState, useEffect } from 'react';
import { Agritech3DScene } from './Agritech3DScene';

interface CinematicVideoHeroProps {
  children: React.ReactNode;
}

export function CinematicVideoHero({ children }: CinematicVideoHeroProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const posterImage =
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80';
  // Reliable royalty-free agricultural farm footage
  const videoSrc =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0F2D1F]">
      {/* 1. Cinematic Background Video or High-Res Poster Fallback */}
      {!prefersReducedMotion && !videoError ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={posterImage}
          onCanPlay={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-40' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          {/* High-quality agricultural field video */}
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-cornfield-with-golden-sunlight-41829-large.mp4"
            type="video/mp4"
          />
          <source
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            type="video/mp4"
          />
        </video>
      ) : null}

      {/* Static Fallback Poster if Video Fails or Reduced Motion */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 opacity-30"
        style={{ backgroundImage: `url(${posterImage})` }}
        aria-hidden="true"
      />

      {/* 2. Three.js 3D Interactive Agritech Topography & Atmospheric Spores */}
      <Agritech3DScene />

      {/* 3. Deep Atmospheric Contrast Overlay (Ensures AAA text accessibility) */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0F2D1F]/90 via-[#0F2D1F]/80 to-[#0F2D1F] pointer-events-none z-2"
        aria-hidden="true"
      />

      {/* Subtle radial golden glow to evoke sunrise lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none z-2"
        aria-hidden="true"
      />

      {/* 4. Interactive Foreground Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 lg:py-28">
        {children}
      </div>
    </div>
  );
}
