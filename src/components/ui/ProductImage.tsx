'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
}

const FALLBACK_IMAGE = '/images/products/fertilizer-generic.svg';

/**
 * Reliable agricultural product image component with smooth loading,
 * consistent aspect framing, and multi-tier fallback (never shows a broken image icon).
 */
export function ProductImage({
  src,
  alt,
  className = 'w-full h-full object-contain p-2',
  containerClassName = 'w-full h-full',
}: ProductImageProps) {
  const initialSrc = src && src.trim() ? src : FALLBACK_IMAGE;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [failedCompletely, setFailedCompletely] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = () => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
    } else {
      setFailedCompletely(true);
    }
  };

  if (failedCompletely) {
    return (
      <div
        className={`${containerClassName} flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50/70 to-stone-100 text-[#2F7D4F]`}
        aria-label={alt}
      >
        <Package size={40} className="opacity-60" />
        <span className="text-[10px] font-bold text-stone-500 mt-1.5 px-2 text-center line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} relative overflow-hidden bg-[#F5F7F4]`}>
      {!loaded && (
        <div className="absolute inset-0 bg-stone-100 animate-pulse" aria-hidden="true" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
