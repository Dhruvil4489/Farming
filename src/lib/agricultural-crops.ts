/**
 * Agricultural Crop Database & Categorization for SmartFarm AI
 * Provides standardized crop master data, category grouping, and vernacular alias search.
 */
import rawCropGroups from './agricultural-crops-data.json';

export interface CropItem {
  name: string;
  category: string;
  aliases: string[];
  scientificName?: string;
}

export interface CropCategoryGroup {
  group: string;
  categoryKey: string;
  options: CropItem[];
}

export interface SearchResultItem extends CropItem {
  matchedAlias?: string;
}

export interface SearchResultGroup {
  group: string;
  categoryKey: string;
  options: SearchResultItem[];
}

export const AGRICULTURAL_CROP_GROUPS: CropCategoryGroup[] = rawCropGroups as CropCategoryGroup[];

/**
 * Flat array of all predefined agricultural crop names
 */
export const PREDEFINED_CROP_NAMES: readonly string[] = AGRICULTURAL_CROP_GROUPS.flatMap((group) =>
  group.options.map((opt) => opt.name)
);

/**
 * Backward compatibility alias for any existing imports
 */
export const PREDEFINED_FIELD_NAMES = PREDEFINED_CROP_NAMES;

/**
 * Check if a given crop name is in the predefined database
 */
export function isPredefinedCrop(name: string | null | undefined): boolean {
  if (!name) return false;
  const lower = name.trim().toLowerCase();
  return PREDEFINED_CROP_NAMES.some((crop) => crop.toLowerCase() === lower);
}

/**
 * Smart search across crop display names, aliases, and scientific names
 */
export function searchAgriculturalCrops(
  query: string,
  groups: CropCategoryGroup[] = AGRICULTURAL_CROP_GROUPS
): { groups: SearchResultGroup[]; totalMatches: number } {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    const resultGroups = groups.map((g) => ({
      group: g.group,
      categoryKey: g.categoryKey,
      options: g.options.map((opt) => ({ ...opt })),
    }));
    const totalMatches = resultGroups.reduce((acc, g) => acc + g.options.length, 0);
    return { groups: resultGroups, totalMatches };
  }

  const resultGroups: SearchResultGroup[] = [];
  let totalMatches = 0;

  for (const group of groups) {
    const matchedOptions: SearchResultItem[] = [];

    for (const opt of group.options) {
      const nameLower = opt.name.toLowerCase();
      const sciLower = opt.scientificName?.toLowerCase() || '';

      // Check if primary name directly matches
      if (nameLower.includes(cleanQuery)) {
        matchedOptions.push({ ...opt });
        continue;
      }

      // Check scientific name
      if (sciLower.includes(cleanQuery)) {
        matchedOptions.push({ ...opt, matchedAlias: opt.scientificName });
        continue;
      }

      // Check vernacular Indian aliases
      const matchedAlias = opt.aliases.find((alias) => alias.toLowerCase().includes(cleanQuery));
      if (matchedAlias) {
        matchedOptions.push({ ...opt, matchedAlias });
        continue;
      }
    }

    if (matchedOptions.length > 0) {
      resultGroups.push({
        group: group.group,
        categoryKey: group.categoryKey,
        options: matchedOptions,
      });
      totalMatches += matchedOptions.length;
    }
  }

  return { groups: resultGroups, totalMatches };
}
