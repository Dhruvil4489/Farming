/**
 * Agricultural land area conversion utilities for Indian farming units.
 *
 * Conversion factors to Hectares (ha):
 * - 1 hectare = 1.0 ha
 * - 1 acre    = 0.404686 ha
 * - 1 bigha   = 0.25 ha (standard Indian/Gujarat metric bigha approximation)
 * - 1 guntha  = 0.010117 ha (40 gunthas = 1 acre)
 */

export type AreaUnit = 'acre' | 'hectare' | 'bigha' | 'guntha';

const UNIT_TO_HA: Record<AreaUnit, number> = {
  hectare: 1,
  acre: 0.404686,
  bigha: 0.25,
  guntha: 0.010117,
};

export function toHectares(value: number | null | undefined, unit?: string | null): number | null {
  if (value === null || value === undefined || isNaN(value) || value <= 0) return null;
  const key = (unit || 'acre').toLowerCase() as AreaUnit;
  const factor = UNIT_TO_HA[key] ?? UNIT_TO_HA.acre;
  return Number((value * factor).toFixed(4));
}

export function hectaresToAcres(areaHa: number | null | undefined): number | null {
  if (areaHa === null || areaHa === undefined || isNaN(areaHa)) return null;
  return Number((areaHa / 0.404686).toFixed(2));
}

export function formatAreaDisplay(areaHa: number | null | undefined, preferredUnit?: string | null, preferredValue?: number | null): string {
  if (preferredValue && preferredUnit) {
    return `${preferredValue} ${preferredUnit}`;
  }
  if (areaHa === null || areaHa === undefined) return 'Not specified';
  const acres = hectaresToAcres(areaHa);
  return `${acres} Acre (${Number(areaHa).toFixed(2)} Ha)`;
}

/**
 * Safely extract human-readable crop name from Prisma Crop with optional translations.
 */
export function resolveCropName(
  crop?: { slug?: string; name?: string; translations?: Array<{ locale: string; name: string }> } | null,
  customCropName?: string | null,
  locale = 'en'
): string {
  if (customCropName && customCropName.trim()) return customCropName.trim();
  if (!crop) return 'Crop';
  if (Array.isArray(crop.translations) && crop.translations.length > 0) {
    const exact = crop.translations.find((t) => t.locale === locale);
    if (exact?.name) return exact.name;
    if (locale === 'en' && crop.name) return crop.name;
    const en = crop.translations.find((t) => t.locale === 'en');
    if (en?.name) return en.name;
    if (crop.translations[0]?.name) return crop.translations[0].name;
  }
  if (crop.name) return crop.name;
  if (crop.slug) {
    return crop.slug.charAt(0).toUpperCase() + crop.slug.slice(1).replace(/_/g, ' ');
  }
  return 'Crop';
}
