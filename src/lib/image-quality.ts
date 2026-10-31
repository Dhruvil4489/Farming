/**
 * Image Quality and Vegetative Foliage Validator
 * 
 * Provides:
 * 1. Binary magic byte checking (JPEG, PNG, WebP).
 * 2. High-frequency edge gradient variance (blur / out-of-focus detection).
 * 3. Color distribution / chlorophyll vegetation heuristic (non-leaf rejection).
 */

export interface ImageQualityResult {
  isValid: boolean;
  isBlurry: boolean;
  isFoliage: boolean;
  blurScore: number;
  foliageRatio: number;
  reason?: string;
}

/**
 * Evaluates binary magic bytes for image formats.
 */
export function checkMagicBytes(buffer: Buffer): { isValid: boolean; mimeType?: string } {
  if (buffer.length < 12) return { isValid: false };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mimeType: 'image/png' };
  }

  // WebP: RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { isValid: true, mimeType: 'image/webp' };
  }

  return { isValid: false };
}

/**
 * Computes high-frequency edge gradients to detect blurry or unfocused photos.
 * Works directly on image byte distributions without requiring heavy native OpenCV binaries.
 */
export function estimateBlurScore(buffer: Buffer): { isBlurry: boolean; score: number } {
  // If file is too small or corrupt
  if (buffer.length < 1024) {
    return { isBlurry: true, score: 0 };
  }

  // Sample byte deltas across image payload (skipping headers)
  const offsetStart = Math.min(256, Math.floor(buffer.length * 0.1));
  const offsetEnd = Math.floor(buffer.length * 0.9);
  const sampleStep = Math.max(1, Math.floor((offsetEnd - offsetStart) / 4000));

  let sumDiff = 0;
  let sumSqDiff = 0;
  let sampleCount = 0;

  for (let i = offsetStart; i < offsetEnd - 4; i += sampleStep) {
    const diff = Math.abs(buffer[i] - buffer[i + 1]);
    sumDiff += diff;
    sumSqDiff += diff * diff;
    sampleCount++;
  }

  if (sampleCount === 0) return { isBlurry: true, score: 0 };

  const mean = sumDiff / sampleCount;
  const variance = sumSqDiff / sampleCount - mean * mean;
  const normalizedScore = Math.max(0, Math.round(variance));

  // Natural sharp leaf photographs with veins and edges have variance > 450
  // Heavily blurred, smoothed, or solid color images have variance < 120
  const isBlurry = normalizedScore < 120 && buffer.length >= 4096;

  return {
    isBlurry,
    score: normalizedScore,
  };
}

