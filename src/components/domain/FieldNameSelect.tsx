'use client';

/**
 * Re-export CropNameSelect as FieldNameSelect for backward compatibility.
 * All field naming now utilizes the agricultural crop database.
 */
export {
  CropNameSelect as FieldNameSelect,
  CropNameSelect,
  type CropNameSelectProps as FieldNameSelectProps,
} from './CropNameSelect';

export {
  PREDEFINED_CROP_NAMES,
  PREDEFINED_FIELD_NAMES,
  AGRICULTURAL_CROP_GROUPS,
  isPredefinedCrop,
  searchAgriculturalCrops,
} from '@/lib/agricultural-crops';
