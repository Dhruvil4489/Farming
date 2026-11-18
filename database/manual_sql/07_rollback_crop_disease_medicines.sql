-- =============================================================================
-- SMARTFARM AI — ROLLBACK MIGRATION 07: CROP DISEASE MEDICINES CATALOG
--
-- Description:
-- Safely rolls back changes from 06_crop_disease_medicines.sql.
-- Removes the 18 seeded medicine products, custom brands, and categories,
-- preserving any cart items or orders previously created.
-- =============================================================================

BEGIN;

-- 1. Delete seeded crop protection products
DELETE FROM "Product"
WHERE "slug" IN (
    'syngenta-amistar-top-200ml',
    'indofil-m45-mancozeb-1kg',
    'dhanuka-tilt-propiconazole-250ml',
    'tata-rallis-blitox-500g',
    'hindustan-antibiotics-streptocycline-60g',
    'bayer-ridomil-gold-500g',
    'upl-saaf-carbendazim-mancozeb-500g',
    'bayer-nativo-tebuconazole-trifloxystrobin-100g',
    'dhanuka-baan-tricyclazole-120g',
    'upl-shemar-validamycin-500ml',
    'tata-rallis-contaf-plus-hexaconazole-500ml',
    'multiplex-bio-jodi-trichoderma-viride-1kg',
    'multiplex-bio-cure-pseudomonas-fluorescens-1kg',
    'iffco-sulfer-sulphur-80-wdg-1kg',
    'syngenta-score-difenoconazole-250ml',
    'dhanuka-kasu-b-kasugamycin-500ml',
    'bayer-antracol-propineb-500g',
    'upl-phoskill-out-of-stock-500ml'
);

-- 2. Delete crop protection categories if no other products reference them
DELETE FROM "ProductCategory"
WHERE "slug" IN ('crop-protection-fungicides', 'bio-pesticides')
  AND NOT EXISTS (SELECT 1 FROM "Product" WHERE "categoryId" = "ProductCategory"."id");

-- 3. Delete added brands if no other products reference them
DELETE FROM "ProductBrand"
WHERE "name" IN (
    'Syngenta India',
    'Bayer CropScience',
    'Dhanuka Agritech',
    'UPL Limited',
    'Rallis India (Tata Enterprise)',
    'Multiplex Bio-Tech',
    'Indofil Industries',
    'Hindustan Antibiotics'
)
AND NOT EXISTS (SELECT 1 FROM "Product" WHERE "brandId" = "ProductBrand"."id");

-- 4. Drop index if exists
DROP INDEX IF EXISTS "Product_cropTarget_idx";

COMMIT;

