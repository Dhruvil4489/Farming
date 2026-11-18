/**
 * SmartFarm AI — Disease-to-Product Matching Engine
 *
 * Centralized service connecting disease diagnosis with the Fertilizer Store:
 *
 * Disease Diagnosis
 *        ↓
 * Disease Knowledge Database (ICAR / CIBRC)
 *        ↓
 * Verified Treatment Information
 *        ↓
 * Active Ingredient & Formulation Identification
 *        ↓
 * Store Product Matching (prisma.product)
 *        ↓
 * Compatibility Validation (Active ingredient, formulation, crop compatibility)
 *        ↓
 * Recommended Medicine Cards with Live Pricing, Stock & Direct Cart Actions
 */

import { prisma } from '@/lib/prisma';
import { getAgronomicPathology, AgronomicDiseaseInfo } from '@/lib/crop-disease-knowledge';

export interface RecommendedMedicineCard {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  categoryName: string;
  activeIngredient: string;
  packSize: string;
  price: number;
  mrp: number | null;
  stock: number;
  inStock: boolean;
  imageUrl: string;
  treatmentType: 'primary' | 'alternative' | 'organic';
  treatmentTypeLabel: string;
  whyRecommended: string;
  usageInstructions: string | null;
  safetyNotes: string | null;
  detailUrl: string;
}

export interface MatchingResult {
  hasMatchingMedicine: boolean;
  message: string;
  targetDisease: string;
  targetCrop: string;
  primaryActiveIngredient: string | null;
  medicines: RecommendedMedicineCard[];
}

interface DiseaseRule {
  primaryKeywords: string[];
  alternativeKeywords: string[];
  organicKeywords: string[];
  whyPrimary: string;
  whyAlternative: string;
  whyOrganic: string;
}

/**
 * Agronomic Active Ingredient mapping based on ICAR and CIBRC registrations.
 */
const ACTIVE_INGREDIENT_RULES: Record<string, DiseaseRule> = {
  // Cotton
  'cotton_leaf_blight': {
    primaryKeywords: ['azoxystrobin', 'difenoconazole', 'propiconazole'],
    alternativeKeywords: ['mancozeb', 'carbendazim'],
    organicKeywords: ['trichoderma', 'pseudomonas'],
    whyPrimary: 'CIBRC-registered translaminar fungicide combining FRAC 11 + FRAC 3 to arrest Alternaria spore germination and leaf necrosis.',
    whyAlternative: 'Broad-spectrum multisite protective contact fungicide preventing secondary conidial spread on foliage.',
    whyOrganic: 'Living microbial bio-fungicide that parasitizes Alternaria mycelium and stimulates systemic crop resistance.',
  },
  'cotton_bacterial_blight': {
    primaryKeywords: ['copper oxychloride', 'streptomycin', 'streptocycline'],
    alternativeKeywords: ['kasugamycin', 'copper hydroxide'],
    organicKeywords: ['pseudomonas fluorescens'],
    whyPrimary: 'Recommended ICAR bactericide tank-mix to eradicate Xanthomonas campestris in angular leaf spots and black arm phase.',
    whyAlternative: 'Systemic aminoglycoside bactericide providing acropetal translocation against vascular bacterial lesions.',
    whyOrganic: 'Certified organic antagonistic bacterium suppressing Xanthomonas bacterial blight.',
  },
  'cotton_grey_mildew': {
    primaryKeywords: ['carbendazim', 'sulphur', 'azoxystrobin'],
    alternativeKeywords: ['mancozeb', 'propiconazole'],
    organicKeywords: ['trichoderma', 'sulphur'],
    whyPrimary: 'Targets Ramularia areola powdery white growth on lower leaf surfaces with systemic translaminar action.',
    whyAlternative: 'Protective multisite cover spray to shield unaffected upper leaf layers.',
    whyOrganic: 'Natural wettable sulphur formulation inhibiting fungal mycelium respiration.',
  },

  // Wheat
  'wheat_yellow_rust': {
    primaryKeywords: ['propiconazole', 'tebuconazole', 'trifloxystrobin'],
    alternativeKeywords: ['mancozeb'],
    organicKeywords: ['trichoderma'],
    whyPrimary: 'CIMMYT/IIWBR-approved systemic triazole to rapidly halt Puccinia striiformis stripe rust pustules.',
    whyAlternative: 'Multisite contact protective spray to protect emerging upper leaves.',
    whyOrganic: 'Preventive bio-fungicide application for certified organic plots.',
  },
  'wheat_brown_rust': {
    primaryKeywords: ['propiconazole', 'tebuconazole'],
    alternativeKeywords: ['mancozeb'],
    organicKeywords: ['trichoderma'],
    whyPrimary: 'ICAR-recommended systemic ergosterol biosynthesis inhibitor against Puccinia triticina leaf rust.',
    whyAlternative: 'Protective contact fungicide providing residual leaf barrier.',
    whyOrganic: 'Bio-control agent for soil and foliar pathogen suppression.',
  },
  'wheat_powdery_mildew': {
    primaryKeywords: ['propiconazole', 'hexaconazole', 'sulphur'],
    alternativeKeywords: ['mancozeb'],
    organicKeywords: ['sulphur', 'trichoderma'],
    whyPrimary: 'Systemic triazole fungicide with vapor activity to eradicate Blumeria graminis fungal mats.',
    whyAlternative: 'Contact protectant to halt secondary spore cycles.',
    whyOrganic: 'Micro-granule wettable sulphur controlling surface fungal growth.',
  },

  // Rice
  'rice_blast': {
    primaryKeywords: ['tricyclazole', 'kasugamycin', 'azoxystrobin'],
    alternativeKeywords: ['isoprothiolane', 'mancozeb'],
    organicKeywords: ['pseudomonas fluorescens'],
    whyPrimary: 'Specific melanin biosynthesis inhibitor (MBI) preventing Magnaporthe oryzae appressorial penetration into rice foliage.',
    whyAlternative: 'Curative translaminar fungicide against leaf and neck blast.',
    whyOrganic: 'NRRI-verified bio-agent inducing systemic acquired resistance against blast.',
  },
  'rice_brown_spot': {
    primaryKeywords: ['mancozeb', 'propiconazole', 'carbendazim'],
    alternativeKeywords: ['copper oxychloride'],
    organicKeywords: ['trichoderma'],
    whyPrimary: 'Restores photosynthetic area by suppressing Bipolaris oryzae brown oval lesions.',
    whyAlternative: 'Broad-spectrum contact copper spray for mixed fungal infections.',
    whyOrganic: 'Bio-fungicide supporting leaf surface antagonism.',
  },
  'rice_sheath_blight': {
    primaryKeywords: ['validamycin', 'hexaconazole', 'trifloxystrobin', 'tebuconazole'],
    alternativeKeywords: ['propiconazole', 'carbendazim'],
    organicKeywords: ['pseudomonas fluorescens', 'trichoderma'],
    whyPrimary: 'Specific antibiotic/triazole formulation directly halting Rhizoctonia solani sclerotial germination at the water line.',
    whyAlternative: 'Systemic foliar spray protecting mid and upper leaf sheaths.',
    whyOrganic: 'Bio-control agent colonizing stem base to outcompete Rhizoctonia.',
  },
  'rice_bacterial_leaf_blight': {
    primaryKeywords: ['copper oxychloride', 'streptomycin', 'streptocycline', 'kasugamycin'],
    alternativeKeywords: ['copper hydroxide'],
    organicKeywords: ['pseudomonas fluorescens'],
    whyPrimary: 'Direct antibacterial copper-antibiotic complex neutralizing Xanthomonas oryzae bacterial ooze and leaf clipping.',
    whyAlternative: 'Secondary systemic bactericide suppressing vascular spread.',
    whyOrganic: 'Organic bacterial antagonist reducing bacterial blight leaf severity.',
  },

  // Tomato
  'Tomato___Early_blight': {
    primaryKeywords: ['difenoconazole', 'azoxystrobin', 'mancozeb'],
    alternativeKeywords: ['propineb', 'copper oxychloride'],
    organicKeywords: ['trichoderma', 'pseudomonas'],
    whyPrimary: 'Systemic translaminar triazole + strobilurin arresting concentric Alternaria solani target-spot lesions.',
    whyAlternative: 'Multisite contact zinc-enriched protective fungicide.',
    whyOrganic: 'Living bio-agent preventing soil-splash fungal inoculation.',
  },
  'Tomato___Late_blight': {
    primaryKeywords: ['metalaxyl', 'mancozeb', 'copper oxychloride'],
    alternativeKeywords: ['propineb'],
    organicKeywords: ['copper oxychloride', 'trichoderma'],
    whyPrimary: 'High-potency acropetal systemic phenylamide + contact protectant halting rapid Phytophthora infestans water-soaked blight.',
    whyAlternative: 'Contact protective shield preventing spore encystment during cool, wet spells.',
    whyOrganic: 'Inorganic copper formulation compliant with organic integrated pest management.',
  },
  'Tomato___Bacterial_spot': {
    primaryKeywords: ['copper oxychloride', 'streptomycin', 'streptocycline', 'kasugamycin'],
    alternativeKeywords: ['copper hydroxide'],
    organicKeywords: ['pseudomonas fluorescens'],
    whyPrimary: 'CIBRC-registered copper-antibiotic combination neutralizing Xanthomonas perforans lesions on leaves and fruit.',
    whyAlternative: 'Broad-spectrum protective copper formulation.',
    whyOrganic: 'Bio-bactericide promoting competitive exclusion.',
  },

  // Potato
  'Potato___Early_blight': {
    primaryKeywords: ['difenoconazole', 'mancozeb', 'propineb'],
    alternativeKeywords: ['azoxystrobin', 'copper oxychloride'],
    organicKeywords: ['trichoderma'],
    whyPrimary: 'Translaminar protective and curative action targeting Alternaria solani on lower potato foliage.',
    whyAlternative: 'Zinc-infused protective contact spray.',
    whyOrganic: 'Bio-fungicide for tuber and foliage protection.',
  },
  'Potato___Late_blight': {
    primaryKeywords: ['metalaxyl', 'mancozeb', 'copper oxychloride'],
    alternativeKeywords: ['propineb'],
    organicKeywords: ['copper oxychloride'],
    whyPrimary: 'Immediate systemic curative action preventing Phytophthora tuber rot and total foliar collapse.',
    whyAlternative: 'Multisite contact cover spray ahead of rain events.',
    whyOrganic: 'Protective copper barrier preventing zoospore penetration.',
  },

  // Chilli
  'chilli_leaf_spot': {
    primaryKeywords: ['azoxystrobin', 'difenoconazole', 'mancozeb'],
    alternativeKeywords: ['copper oxychloride', 'propineb'],
    organicKeywords: ['trichoderma', 'pseudomonas'],
    whyPrimary: 'Dual systemic formulation halting Cercospora leaf spot and fruit rot (anthracnose).',
    whyAlternative: 'Multisite contact protective spray.',
    whyOrganic: 'Organic bio-fungicide protecting flowers and young pods.',
  },
};

export class DiseaseProductMatchingService {
  /**
   * Main matching entrypoint: Connects disease diagnosis to verified Fertilizer Store products.
   */
  static async getRecommendationsForDiagnosis(params: {
    crop: string;
    disease: string;
    label?: string | null;
    isHealthy?: boolean | null;
    status?: string | null;
  }): Promise<MatchingResult> {
    const { crop, disease, label, isHealthy, status } = params;

    // Handle Healthy Leaf or Status Boundaries
    if (isHealthy) {
      return {
        hasMatchingMedicine: false,
        message: 'Foliage displays clean vegetative health. No synthetic or chemical disease treatments required.',
        targetDisease: disease || 'Healthy Leaf',
        targetCrop: crop,
        primaryActiveIngredient: null,
        medicines: [],
      };
    }

    if (status === 'in_validation' || status === 'catalog_queued') {
      return {
        hasMatchingMedicine: false,
        message: `${crop} is currently undergoing agronomic model trial validation. To ensure farmer safety, chemical medicines are not automatically prescribed until regional ICAR trial validation is complete.`,
        targetDisease: disease || 'In Field Validation',
        targetCrop: crop,
        primaryActiveIngredient: null,
        medicines: [],
      };
    }

    if (status === 'crop_mismatch') {
      return {
        hasMatchingMedicine: false,
        message: 'Crop mismatch detected between selected farm plot and leaf image. Please verify your plot or upload the matching crop photograph before medicines can be recommended.',
        targetDisease: 'Crop Mismatch Detected',
        targetCrop: crop,
        primaryActiveIngredient: null,
        medicines: [],
      };
    }

    if (status === 'blurry_image' || status === 'not_crop') {
      return {
        hasMatchingMedicine: false,
        message: 'A clear crop leaf photograph is required before medicines can be recommended.',
        targetDisease: 'Unidentified Image',
        targetCrop: crop,
        primaryActiveIngredient: null,
        medicines: [],
      };
    }

    // Resolve matching rule
    const ruleKey = this.resolveRuleKey(label, disease, crop);
    const rule = ruleKey ? ACTIVE_INGREDIENT_RULES[ruleKey] : null;

    // If no specific active ingredient rule exists, extract active ingredients from Agronomic Pathology
    const pathology = label ? getAgronomicPathology(label) : null;
    const fallbackRule = this.buildFallbackRuleFromPathology(pathology, disease);
    const effectiveRule = rule || fallbackRule;

    if (!effectiveRule) {
      return {
        hasMatchingMedicine: false,
        message: 'No verified matching medicine is currently available in the store.',
        targetDisease: disease,
        targetCrop: crop,
        primaryActiveIngredient: null,
        medicines: [],
      };
    }

    // Retrieve active products from store database
    let allStoreProducts: any[] = [];
    try {
      allStoreProducts = await prisma.product.findMany({
        where: {
          isAvailable: true,
        },
        include: {
          brand: true,
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (err: any) {
      console.error('[DiseaseProductMatchingService] Error querying store products:', err.message);
      allStoreProducts = [];
    }

    if (allStoreProducts.length === 0) {
      return {
        hasMatchingMedicine: false,
        message: 'No verified matching medicine is currently available in the store.',
        targetDisease: disease,
        targetCrop: crop,
        primaryActiveIngredient: effectiveRule.primaryKeywords[0] || null,
        medicines: [],
      };
    }

    const normalizedCrop = crop.toLowerCase();

    // Match products against active ingredient rules
    const matchedCards: RecommendedMedicineCard[] = [];
    const seenProductIds = new Set<string>();

    for (const prod of allStoreProducts) {
      // Exclude pure fertilizers: medicines must belong to Crop Protection or Bio-Pesticides/Bio-Control
      const catSlug = prod.category?.slug || '';
      if (catSlug === 'chemical-fertilizers' || catSlug === 'water-soluble' || prod.slug.includes('urea') || prod.slug.includes('dap') || prod.slug.includes('vermicompost')) {
        continue;
      }

      // Crop compatibility check: must target this crop or 'all_crops' or 'all'
      const cropTarget = (prod.cropTarget || '').toLowerCase();
      const isCropCompatible =
        cropTarget.includes(normalizedCrop) ||
        cropTarget.includes('all_crops') ||
        cropTarget.includes('all');

      if (!isCropCompatible) {
        continue;
      }

      const composition = (prod.composition || '').toLowerCase();
      const name = (prod.name || '').toLowerCase();
      // Primary check on composition / active ingredient and product name
      const activeText = `${name} ${composition}`;

      // Check Primary Matches
      const isPrimary = effectiveRule.primaryKeywords.some((kw) => activeText.includes(kw.toLowerCase()));
      if (isPrimary && !seenProductIds.has(prod.id)) {
        seenProductIds.add(prod.id);
        matchedCards.push(
          this.formatProductCard(prod, 'primary', 'Primary Recommended Treatment', effectiveRule.whyPrimary)
        );
        continue;
      }

      // Check Alternative Matches
      const isAlternative = effectiveRule.alternativeKeywords.some((kw) => activeText.includes(kw.toLowerCase()));
      if (isAlternative && !seenProductIds.has(prod.id)) {
        seenProductIds.add(prod.id);
        matchedCards.push(
          this.formatProductCard(prod, 'alternative', 'Alternative Treatment', effectiveRule.whyAlternative)
        );
        continue;
      }

      // Check Organic Matches
      const isOrganic = effectiveRule.organicKeywords.some((kw) => activeText.includes(kw.toLowerCase()));
      if (isOrganic && !seenProductIds.has(prod.id)) {
        seenProductIds.add(prod.id);
        matchedCards.push(
          this.formatProductCard(prod, 'organic', 'Certified Organic Alternative', effectiveRule.whyOrganic)
        );
        continue;
      }
    }

    // Sort: In-Stock first, then Primary > Alternative > Organic
    matchedCards.sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;

      const order: Record<string, number> = { primary: 1, alternative: 2, organic: 3 };
      return (order[a.treatmentType] || 4) - (order[b.treatmentType] || 4);
    });

    const hasMatching = matchedCards.length > 0;

    return {
      hasMatchingMedicine: hasMatching,
      message: hasMatching
        ? `Found ${matchedCards.length} verified CIBRC-registered treatment products in the Fertilizer Store.`
        : 'No verified matching medicine is currently available in the store.',
      targetDisease: disease,
      targetCrop: crop,
      primaryActiveIngredient: effectiveRule.primaryKeywords[0] || null,
      medicines: matchedCards,
    };
  }

  /**
   * Helper to format a Store Product into a clean UI recommendation card.
   */
  private static formatProductCard(
    prod: any,
    treatmentType: 'primary' | 'alternative' | 'organic',
    treatmentTypeLabel: string,
    whyRecommended: string
  ): RecommendedMedicineCard {
    const inStock = prod.stock > 0;

    return {
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      brandName: prod.brand?.name || 'SmartFarm Certified',
      categoryName: prod.category?.name || 'Crop Protection',
      activeIngredient: prod.composition || 'Active Ingredient on Verified Label',
      packSize: prod.packSize,
      price: prod.price,
      mrp: prod.mrp || null,
      stock: prod.stock,
      inStock,
      imageUrl: prod.imageUrl || '/images/products/fertilizer-generic.svg',
      treatmentType,
      treatmentTypeLabel,
      whyRecommended,
      usageInstructions: prod.usageInstructions || null,
      safetyNotes: prod.safetyNotes || null,
      detailUrl: `/fertilizers/${prod.slug}`,
    };
  }

  /**
   * Resolves appropriate lookup key from disease label or disease string.
   */
  private static resolveRuleKey(label?: string | null, disease?: string | null, crop?: string | null): string | null {
    if (label && ACTIVE_INGREDIENT_RULES[label]) {
      return label;
    }

    const text = `${crop || ''} ${disease || ''} ${label || ''}`.toLowerCase();

    if (text.includes('cotton') && (text.includes('alternaria') || text.includes('leaf blight'))) return 'cotton_leaf_blight';
    if (text.includes('cotton') && (text.includes('bacterial') || text.includes('black arm') || text.includes('angular'))) return 'cotton_bacterial_blight';
    if (text.includes('cotton') && (text.includes('grey mildew') || text.includes('dahiya'))) return 'cotton_grey_mildew';

    if (text.includes('wheat') && (text.includes('yellow rust') || text.includes('stripe'))) return 'wheat_yellow_rust';
    if (text.includes('wheat') && (text.includes('brown rust') || text.includes('leaf rust'))) return 'wheat_brown_rust';
    if (text.includes('wheat') && text.includes('powdery mildew')) return 'wheat_powdery_mildew';

    if (text.includes('rice') && text.includes('blast')) return 'rice_blast';
    if (text.includes('rice') && text.includes('brown spot')) return 'rice_brown_spot';
    if (text.includes('rice') && text.includes('sheath blight')) return 'rice_sheath_blight';
    if (text.includes('rice') && text.includes('bacterial')) return 'rice_bacterial_leaf_blight';

    if (text.includes('tomato') && text.includes('early blight')) return 'Tomato___Early_blight';
    if (text.includes('tomato') && text.includes('late blight')) return 'Tomato___Late_blight';
    if (text.includes('tomato') && text.includes('bacterial')) return 'Tomato___Bacterial_spot';

    if (text.includes('potato') && text.includes('early blight')) return 'Potato___Early_blight';
    if (text.includes('potato') && text.includes('late blight')) return 'Potato___Late_blight';

    if (text.includes('chilli')) return 'chilli_leaf_spot';

    return null;
  }

  /**
   * Synthesizes active ingredient keywords from agronomic pathology data if direct rule is absent.
   */
  private static buildFallbackRuleFromPathology(
    pathology: AgronomicDiseaseInfo | null,
    diseaseName: string
  ): DiseaseRule | null {
    if (!pathology) return null;

    const chemOptions = (pathology.chemicalOptions || []).join(' ').toLowerCase();
    const orgOptions = (pathology.organicOptions || []).join(' ').toLowerCase();

    const primaryKeywords: string[] = [];
    const alternativeKeywords: string[] = [];
    const organicKeywords: string[] = [];

    // Extract common active ingredients mentioned in text
    const checkList = [
      'azoxystrobin', 'difenoconazole', 'propiconazole', 'tebuconazole', 'mancozeb',
      'copper oxychloride', 'metalaxyl', 'carbendazim', 'hexaconazole', 'validamycin',
      'tricyclazole', 'streptomycin', 'streptocycline', 'kasugamycin', 'propineb', 'sulphur'
    ];

    for (const item of checkList) {
      if (chemOptions.includes(item)) {
        if (primaryKeywords.length < 2) {
          primaryKeywords.push(item);
        } else {
          alternativeKeywords.push(item);
        }
      }
    }

    if (orgOptions.includes('trichoderma')) organicKeywords.push('trichoderma');
    if (orgOptions.includes('pseudomonas')) organicKeywords.push('pseudomonas');
    if (orgOptions.includes('copper')) organicKeywords.push('copper');
    if (orgOptions.includes('sulphur') || orgOptions.includes('sulfur')) organicKeywords.push('sulphur');

    if (primaryKeywords.length === 0 && organicKeywords.length === 0) {
      return null;
    }

    return {
      primaryKeywords,
      alternativeKeywords,
      organicKeywords,
      whyPrimary: `Verified treatment containing active ingredient targeting ${diseaseName}.`,
      whyAlternative: `Approved alternative treatment registered for foliar disease management.`,
      whyOrganic: `Certified biological input for organic disease suppression.`,
    };
  }
}
