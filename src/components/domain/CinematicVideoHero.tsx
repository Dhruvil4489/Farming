'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CinematicVideoHeroProps {
  children: React.ReactNode;
}

/**
 * Full-screen cinematic agricultural video hero background.
 * - Full-bleed absolute-positioned <video> with object-fit: cover
 * - Autoplay, loop, muted, playsInline, zero controls
 * - Local verified HD irrigated farmland video (/videos/hero-farming.mp4)
 * - High-resolution farmland poster (/images/hero-farmland-poster.jpg)
 * - Respects prefers-reduced-motion with graceful static fallback
 * - Balanced emerald-dark scrim for guaranteed text readability without hiding the video
 */
export function CinematicVideoHero({ children }: CinematicVideoHeroProps) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  // Ensure autoplay starts reliably after mount (especially on client navigation)
  useEffect(() => {
    const el = videoRef.current;
    if (!el || prefersReducedMotion || videoFailed) return;
    if (el.readyState >= 2) {
      setVideoReady(true);
    }
    el.play().catch(() => {
      // Autoplay blocked by browser power-saving mode: poster remains cleanly visible
    });
  }, [prefersReducedMotion, videoFailed]);

  const posterImage = '/images/hero-farmland-poster.jpg';

  return (
    <section
      aria-label="SmartFarm AI Hero"
      className="relative w-full min-h-[calc(100vh-4.25rem)] flex items-center justify-center overflow-hidden bg-[#0A2217]"
    >
      {/* 1. High-resolution static farmland backdrop (instant paint & reduced-motion/error fallback) */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-[1.01]"
        style={{ backgroundImage: `url(${posterImage})` }}
        aria-hidden="true"
      />

          {/* 2. Full-bleed HD Farming Background Video */ }
      {!prefersReducedMotion && !videoFailed && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={posterImage}
          onCanPlay={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className={`absolute inset-0 z-[1] w-full h-full object-cover pointer-events-none transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            aria-hidden="true"
          >
            <source src="/videos/hero-farming.mp4" type="video/mp4" />
          </video>
      )}

        {/* 3. Subtle emerald-dark atmospheric scrim so farmland video shines through clearly while keeping text sharp */}
        <div
          className="absolute inset-0 z-[2] bg-gradient-to-b from-[#071D13]/70 via-[#0B281B]/48 to-[#071D13]/80 pointer-events-none"
          aria-hidden="true"
        />

        {/* 4. Subtle vignette for focal readability */}
        <div
          className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,rgba(8,30,20,0.12)_0%,rgba(6,22,15,0.58)_100%)] pointer-events-none"
          aria-hidden="true"
        />

          {/* 5. Foreground Hero Content (Always above video & overlays) */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center">
            {children}
          </div>
    </section>
  );
}
