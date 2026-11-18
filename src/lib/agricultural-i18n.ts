/**
 * SmartFarm AI — Comprehensive Agricultural Terminology & Localization Engine
 *
 * Implements the centralized language-independent diagnosis and treatment architecture:
 *
 * Selected User Language (en | hi | gu)
 *           ↓
 * Language Preference Service (useI18n)
 *           ↓
 * Canonical Structured Diagnosis Data (Language-independent IDs)
 *           ↓
 * Agricultural Terminology Dictionary (ICAR & State Agricultural Universities)
 *           ↓
 * Locale-Aware Explanation & Treatment Generator
 *           ↓
 * Farmer-Facing Result (Instantly reactive to language changes!)
 */

export type SupportedLocale = 'en' | 'hi' | 'gu';

export interface LocalizedCrop {
  id: string;
  name: string;
  scientificName: string;
  category: string;
}

export interface LocalizedDisease {
  id: string;
  cropId: string;
  name: string;
  vernacularName: string;
  scientificName: string;
  pathogenType: 'fungus' | 'bacterium' | 'virus' | 'pest' | 'none';
  pathogenLabel: string;
  observedSymptoms: string[];
  typicalSymptoms: string[];
  possibleCauses: string[];
  spreadConditions: string;
  potentialDamage: string;
  primaryTreatment: {
    title: string;
    activeIngredient: string;
    formulation: string;
    whyAppropriate: string;
    howItWorks: string;
    applicationMethod: string;
    dosageAndDilution: string;
    safetyPrecautions: string;
    protectiveEquipment: string;
    preHarvestInterval: string;
    applicationRestrictions: string;
    followUpMonitoring: string;
  };
  organicTreatment: {
    title: string;
    biologicalControl: string;
    organicSpray: string;
    culturalPractices: string;
    sanitation: string;
    preventiveManagement: string;
  };
  alternativeTreatments: Array<{
    name: string;
    activeIngredient: string;
    whySuitable: string;
  }>;
  preventionAndMonitoring: {
    immediateActions: string[];
    preventiveSteps: string[];
    monitoringSchedule: string;
    whenToConsultExpert: string;
  };
  overviewSummary: string;
}

// -----------------------------------------------------------------------------
// CANONICAL AGRICULTURAL TERMINOLOGY DICTIONARIES
// -----------------------------------------------------------------------------

export const AGRICULTURAL_CROPS: Record<SupportedLocale, Record<string, LocalizedCrop>> = {
  en: {
    cotton: { id: 'cotton', name: 'Cotton', scientificName: 'Gossypium hirsutum', category: 'Cash Crop / Fibre' },
    wheat: { id: 'wheat', name: 'Wheat', scientificName: 'Triticum aestivum', category: 'Cereal Grain' },
    rice: { id: 'rice', name: 'Rice (Paddy)', scientificName: 'Oryza sativa', category: 'Cereal Grain' },
    maize: { id: 'maize', name: 'Maize (Corn)', scientificName: 'Zea mays', category: 'Cereal Grain' },
    groundnut: { id: 'groundnut', name: 'Groundnut (Peanut)', scientificName: 'Arachis hypogaea', category: 'Oilseed' },
    soybean: { id: 'soybean', name: 'Soybean', scientificName: 'Glycine max', category: 'Oilseed & Legume' },
    chickpea: { id: 'chickpea', name: 'Chickpea (Gram)', scientificName: 'Cicer arietinum', category: 'Pulse' },
    mustard: { id: 'mustard', name: 'Mustard (Rai)', scientificName: 'Brassica juncea', category: 'Oilseed' },
    sugarcane: { id: 'sugarcane', name: 'Sugarcane', scientificName: 'Saccharum officinarum', category: 'Cash Crop' },
    tomato: { id: 'tomato', name: 'Tomato', scientificName: 'Solanum lycopersicum', category: 'Horticultural Vegetable' },
    potato: { id: 'potato', name: 'Potato', scientificName: 'Solanum tuberosum', category: 'Tuber Crop' },
    chilli: { id: 'chilli', name: 'Chilli (Mirchi)', scientificName: 'Capsicum annuum', category: 'Spices & Vegetable' },
    onion: { id: 'onion', name: 'Onion', scientificName: 'Allium cepa', category: 'Horticultural Vegetable' },
    brinjal: { id: 'brinjal', name: 'Brinjal (Eggplant)', scientificName: 'Solanum melongena', category: 'Horticultural Vegetable' },
    okra: { id: 'okra', name: 'Okra (Bhindi)', scientificName: 'Abelmoschus esculentus', category: 'Horticultural Vegetable' },
    banana: { id: 'banana', name: 'Banana', scientificName: 'Musa acuminata', category: 'Fruit Crop' },
    mango: { id: 'mango', name: 'Mango', scientificName: 'Mangifera indica', category: 'Fruit Crop' },
    grapes: { id: 'grapes', name: 'Grapes', scientificName: 'Vitis vinifera', category: 'Fruit Crop' },
    apple: { id: 'apple', name: 'Apple', scientificName: 'Malus domestica', category: 'Temperate Fruit' },
  },
  hi: {
    cotton: { id: 'cotton', name: 'कपास', scientificName: 'Gossypium hirsutum', category: 'नकदी फसल / रेशा' },
    wheat: { id: 'wheat', name: 'गेहूं', scientificName: 'Triticum aestivum', category: 'अनाज फसल' },
    rice: { id: 'rice', name: 'धान (चावल)', scientificName: 'Oryza sativa', category: 'अनाज फसल' },
    maize: { id: 'maize', name: 'मक्का', scientificName: 'Zea mays', category: 'अनाज फसल' },
    groundnut: { id: 'groundnut', name: 'मूंगफली', scientificName: 'Arachis hypogaea', category: 'तिलहन फसल' },
    soybean: { id: 'soybean', name: 'सोयाबीन', scientificName: 'Glycine max', category: 'तिलहन एवं दलहन' },
    chickpea: { id: 'chickpea', name: 'चना', scientificName: 'Cicer arietinum', category: 'दलहन फसल' },
    mustard: { id: 'mustard', name: 'सरसों (राई)', scientificName: 'Brassica juncea', category: 'तिलहन फसल' },
    sugarcane: { id: 'sugarcane', name: 'गन्ना', scientificName: 'Saccharum officinarum', category: 'नकदी फसल' },
    tomato: { id: 'tomato', name: 'टमाटर', scientificName: 'Solanum lycopersicum', category: 'सब्जी फसल' },
    potato: { id: 'potato', name: 'आलू', scientificName: 'Solanum tuberosum', category: 'कंद फसल' },
    chilli: { id: 'chilli', name: 'मिर्च', scientificName: 'Capsicum annuum', category: 'मसाला एवं सब्जी' },
    onion: { id: 'onion', name: 'प्याज', scientificName: 'Allium cepa', category: 'सब्जी फसल' },
    brinjal: { id: 'brinjal', name: 'बैंगन', scientificName: 'Solanum melongena', category: 'सब्जी फसल' },
    okra: { id: 'okra', name: 'भिंडी', scientificName: 'Abelmoschus esculentus', category: 'सब्जी फसल' },
    banana: { id: 'banana', name: 'केला', scientificName: 'Musa acuminata', category: 'फल फसल' },
    mango: { id: 'mango', name: 'आम', scientificName: 'Mangifera indica', category: 'फल फसल' },
    grapes: { id: 'grapes', name: 'अंगूर', scientificName: 'Vitis vinifera', category: 'फल फसल' },
    apple: { id: 'apple', name: 'सेब', scientificName: 'Malus domestica', category: 'फल फसल' },
  },
  gu: {
    cotton: { id: 'cotton', name: 'કપાસ', scientificName: 'Gossypium hirsutum', category: 'રોકડિયો પાક / રેશા' },
    wheat: { id: 'wheat', name: 'ઘઉં', scientificName: 'Triticum aestivum', category: 'ધાન્ય પાક' },
    rice: { id: 'rice', name: 'ડાંગર (ચોખા)', scientificName: 'Oryza sativa', category: 'ધાન્ય પાક' },
    maize: { id: 'maize', name: 'મકાઈ', scientificName: 'Zea mays', category: 'ધાન્ય પાક' },
    groundnut: { id: 'groundnut', name: 'મગફળી', scientificName: 'Arachis hypogaea', category: 'તેલીબિયાં પાક' },
    soybean: { id: 'soybean', name: 'સોયાબીન', scientificName: 'Glycine max', category: 'તેલીબિયાં અને કઠોળ' },
    chickpea: { id: 'chickpea', name: 'ચણા', scientificName: 'Cicer arietinum', category: 'કઠોળ પાક' },
    mustard: { id: 'mustard', name: 'રાઈ (સરસવ)', scientificName: 'Brassica juncea', category: 'તેલીબિયાં પાક' },
    sugarcane: { id: 'sugarcane', name: 'શેરડી', scientificName: 'Saccharum officinarum', category: 'રોકડિયો પાક' },
    tomato: { id: 'tomato', name: 'ટામેટા', scientificName: 'Solanum lycopersicum', category: 'શાકભાજી પાક' },
    potato: { id: 'potato', name: 'બટાકા', scientificName: 'Solanum tuberosum', category: 'કંદમૂળ પાક' },
    chilli: { id: 'chilli', name: 'મરચાં', scientificName: 'Capsicum annuum', category: 'મરી-મસાલા અને શાકભાજી' },
    onion: { id: 'onion', name: 'ડુંગળી', scientificName: 'Allium cepa', category: 'શાકભાજી પાક' },
    brinjal: { id: 'brinjal', name: 'રીંગણ', scientificName: 'Solanum melongena', category: 'શાકભાજી પાક' },
    okra: { id: 'okra', name: 'ભીંડા', scientificName: 'Abelmoschus esculentus', category: 'શાકભાજી પાક' },
    banana: { id: 'banana', name: 'કેળાં', scientificName: 'Musa acuminata', category: 'ફળ પાક' },
    mango: { id: 'mango', name: 'કેરી', scientificName: 'Mangifera indica', category: 'ફળ પાક' },
    grapes: { id: 'grapes', name: 'દ્રાક્ષ', scientificName: 'Vitis vinifera', category: 'ફળ પાક' },
    apple: { id: 'apple', name: 'સફરજન', scientificName: 'Malus domestica', category: 'ફળ પાક' },
  },
};

export const PATHOGEN_TYPE_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    fungus: 'Fungal Pathogen',
    bacterium: 'Bacterial Pathogen',
    virus: 'Viral Pathogen',
    pest: 'Insect / Pest Infestation',
    none: 'Non-pathogenic (Healthy)',
  },
  hi: {
    fungus: 'फफूंद / कवक जनित',
    bacterium: 'जीवाणु (बैक्टीरिया) जनित',
    virus: 'विषाणु (वायरस) जनित',
    pest: 'कीट / पीड़क प्रकोप',
    none: 'रोगमुक्त (स्वस्थ)',
  },
  gu: {
    fungus: 'ફૂગજન્ય રોગકારક',
    bacterium: 'જીવાણુ (બેક્ટેરિયા) જન્ય',
    virus: 'વિષાણુ (વાયરસ) જન્ય',
    pest: 'જીવાત / કીટક ઉપદ્રવ',
    none: 'રોગમુક્ત (તંદુરસ્ત)',
  },
};

export const SEVERITY_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    mild: 'Mild / Early Stage',
    moderate: 'Moderate / Active Stage',
    severe: 'Severe / Critical Stage',
    none: 'Healthy / No Pathology',
  },
  hi: {
    mild: 'हल्का / प्रारंभिक अवस्था',
    moderate: 'मध्यम / सक्रिय अवस्था',
    severe: 'गंभीर / अत्यधिक प्रकोप',
    none: 'स्वस्थ / कोई रोग नहीं',
  },
  gu: {
    mild: 'હળવો / પ્રારંભિક તબક્કો',
    moderate: 'મધ્યમ / સક્રિય તબક્કો',
    severe: 'ગંભીર / વધુ ઉપદ્રવ',
    none: 'તંદુરસ્ત / કોઈ રોગ નથી',
  },
};

// -----------------------------------------------------------------------------
// COMPLETE MULTILINGUAL DISEASE KNOWLEDGE BASE
// -----------------------------------------------------------------------------

export const LOCALIZED_DISEASE_CATALOG: Record<string, Record<SupportedLocale, LocalizedDisease>> = {
  // ---------------------------------------------------------------------------
  // COTTON LEAF BLIGHT
  // ---------------------------------------------------------------------------
  cotton_leaf_blight: {
    en: {
      id: 'cotton_leaf_blight',
      cropId: 'cotton',
      name: 'Cotton Leaf Blight',
      vernacularName: 'Alternaria Leaf Spot / Blight',
      scientificName: 'Alternaria macrospora Zimm. / A. alternata',
      pathogenType: 'fungus',
      pathogenLabel: 'Fungal Pathogen (Alternaria spp.)',
      observedSymptoms: [
        'Visible necrotic spots with characteristic reddish-brown to dark brown margins on leaf blade.',
        'Concentric target-board ring patterns visible on mature infected foliage.',
        'Early chlorotic yellow halo encircling primary necrotic lesions.',
      ],
      typicalSymptoms: [
        'Small, circular brown to reddish-purple necrotic spots on cotyledons and leaves.',
        'Spots enlarge and coalesce into irregular blighted patches with distinct concentric rings.',
        'Shot-hole formation where necrotic centres drop out under dry, windy conditions.',
        'Premature leaf drop (defoliation), square and boll shedding in severe infections.',
      ],
      possibleCauses: [
        'Frequent rain showers or high canopy humidity (>85%) combined with warm temperatures (25-30°C).',
        'Potassium deficiency or nutrient stress predisposing leaf tissue to Alternaria colonization.',
        'Dense vegetative canopy with inadequate sunlight penetration and poor air circulation.',
        'Surviving fungal spores (conidia) in previous crop stubble or infected seeds.',
      ],
      spreadConditions: 'Air-borne conidia dispersed by wind and splashing raindrops during cloudy, humid spells with continuous leaf wetness exceeding 6 hours.',
      potentialDamage: 'Severe infections can cause up to 25-40% defoliation, leading to reduced photosynthesis, poor boll opening, and reduced staple length.',
      primaryTreatment: {
        title: 'Targeted Systemic & Contact Fungicide Application',
        activeIngredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC or Mancozeb 75% WP',
        formulation: 'Suspension Concentrate (SC) / Wettable Powder (WP)',
        whyAppropriate: 'CIBRC-registered combination pairing translaminar strobilurin (FRAC 11) with systemic triazole (FRAC 3) to arrest fungal spore germination and stop lesion expansion.',
        howItWorks: 'Inhibits mitochondrial respiration in fungi while stopping ergosterol biosynthesis in cell walls, providing both preventive and curative protection.',
        applicationMethod: 'Foliar spray using a calibrated knapsack or motorized mist-blower, ensuring thorough coverage of both upper and lower leaf surfaces.',
        dosageAndDilution: '1.0 ml per liter of water (200 ml per acre in 200 L of water) for SC formulation; or 2.5 g per liter of water (500 g per acre in 200 L water) for Mancozeb 75% WP.',
        safetyPrecautions: 'Do not spray during peak midday heat or when wind exceeds 15 km/h. Avoid skin contact and inhalation.',
        protectiveEquipment: 'Wear chemical-resistant nitrile gloves, face mask, eye goggles, and full-sleeve protective clothing during spray preparation.',
        preHarvestInterval: 'Mandatory Pre-Harvest Interval (PHI) of 21 days for cotton.',
        applicationRestrictions: 'Do not exceed 2 consecutive applications of strobilurin/triazole; rotate with multi-site contact fungicides to prevent resistance.',
        followUpMonitoring: 'Inspect treated foliage 5-7 days after application; check whether lesion expansion has stopped.',
      },
      organicTreatment: {
        title: 'Biological Control & Certified Bio-Fungicides',
        biologicalControl: 'Foliar spray of Trichoderma viride 1% WP (5 g/L) or Pseudomonas fluorescens 0.5% WP (10 g/L) applied in the early morning.',
        organicSpray: 'Cold-pressed neem oil (1500 ppm) @ 3-5 ml/L mixed with soap nut solution (2 ml/L) as an early botanical barrier.',
        culturalPractices: 'Apply recommended muriate of potash (MOP) to improve plant cell wall strength and disease resilience.',
        sanitation: 'Collect and bury or burn severely blighted fallen leaves to reduce secondary inoculum.',
        preventiveManagement: 'Switch from furrow or overhead irrigation to drip irrigation to keep leaf canopy dry.',
      },
      alternativeTreatments: [
        {
          name: 'Indofil M-45 (Mancozeb 75% WP)',
          activeIngredient: 'Mancozeb 75% WP',
          whySuitable: 'Proven multi-site protective contact fungicide (FRAC M03) preventing spore germination without risk of resistance.',
        },
        {
          name: 'Syngenta Score (Difenoconazole 25% EC)',
          activeIngredient: 'Difenoconazole 25% EC',
          whySuitable: 'Rapid-action systemic triazole that halts established Alternaria infections inside leaf tissue.',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: [
          'Scout the field to determine the percentage of plants showing lesions.',
          'Avoid overhead spraying or irrigation that keeps foliage wet during late afternoon.',
          'Rake and destroy heavily blighted lower leaves from affected plant rows.',
        ],
        preventiveSteps: [
          'Maintain balanced N:P:K fertilization (avoid excess urea; ensure adequate potassium).',
          'Practice 2-year crop rotation with non-host crops like wheat, chickpea, or sorghum.',
          'Use certified, acid-delinted seeds treated with Trichoderma viride or approved seed dresser.',
        ],
        monitoringSchedule: 'Inspect 20 random plants across 4 quadrants twice weekly during active vegetative and boll-formation stages.',
        whenToConsultExpert: 'Consult local KVK or agricultural university extension officer if defoliation exceeds 20% on top leaves or if lesions fail to halt after spray.',
      },
      overviewSummary: 'Cotton Leaf Blight is a fungal infection caused by Alternaria macrospora, triggered by warm humid weather. Prompt action with verified fungicides protects crop yield.',
    },
    hi: {
      id: 'cotton_leaf_blight',
      cropId: 'cotton',
      name: 'कपास का पत्ती झुलसा रोग',
      vernacularName: 'अल्टरनेरिया पत्ती धब्बा / अंगमारी रोग',
      scientificName: 'Alternaria macrospora Zimm. / A. alternata',
      pathogenType: 'fungus',
      pathogenLabel: 'कवक जनित रोग (अल्टरनेरिया कवक)',
      observedSymptoms: [
        'पत्ती की सतह पर लाल-भूरे से गहरे भूरे रंग के धब्बे स्पष्ट दिखाई दे रहे हैं।',
        'पुरानी संक्रमित पत्तियों पर संकेन्द्री वलय (टारगेट बोर्ड जैसे छल्ले) बने हुए हैं।',
        'धब्बों के चारों ओर पीले रंग का घेरा (क्लोरोटिक हेलो) दिखाई दे रहा है।',
      ],
      typicalSymptoms: [
        'शुरुआत में पत्तियों पर छोटे, गोलाकार भूरे या लाल-बैंगनी रंग के धब्बे बनते हैं।',
        'धब्बे बड़े होकर आपस में मिल जाते हैं और पत्ती झुलस जाती है।',
        'सूखे मौसम में धब्बों का केंद्र सूखकर गिर जाता है, जिससे पत्ती में छेद (शॉट-होल) बन जाते हैं।',
        'गंभीर संक्रमण में पत्तियां, कलियां और गूलर समय से पहले गिरने लगते हैं।',
      ],
      possibleCauses: [
        'लगातार बारिश या अधिक आर्द्रता (>85%) तथा 25-30°C का गर्म तापमान।',
        'पोटाश (K) की कमी या पोषण तनाव के कारण पत्तियां कवक के प्रति संवेदनशील हो जाती हैं।',
        'घना पौधा छत्र जिससे धूप और हवा का आवागमन रुक जाता है।',
        'पिछली फसल के अवशेषों या संक्रमित बीजों में जीवित कवक बीजाणु।',
      ],
      spreadConditions: 'बादल छाए रहने और लगातार नमी रहने पर हवा तथा बारिश की बूंदों द्वारा बीजाणु तेजी से फैलते हैं।',
      potentialDamage: 'गंभीर संक्रमण में 25-40% तक पत्तियां गिर सकती हैं, जिससे गूलर का विकास रुक जाता है और कपास की गुणवत्ता घटती है।',
      primaryTreatment: {
        title: 'अनुमोदित प्रणालीगत एवं संपर्क कवकनाशी का छिड़काव',
        activeIngredient: 'एज़ोक्सीस्ट्रोबिन 18.2% + डिफेनोकोनाज़ोल 11.4% एससी अथवा मैंकोज़ेब 75% डब्ल्यूपी',
        formulation: 'सस्पेंशन कॉन्संट्रेट (SC) / वेटेबल पाउडर (WP)',
        whyAppropriate: 'सीआईबीआरसी (CIBRC) द्वारा पंजीकृत संयोजन जो कवक के बीजाणु अंकुरण को रोकता है और धब्बों का फैलाव तुरंत थामता है।',
        howItWorks: 'कवक की श्वसन क्रिया को बाधित करता है और कोशिका भित्ति निर्माण रोककर उपचारात्मक सुरक्षा देता है।',
        applicationMethod: 'नेप्सैक स्प्रेयर द्वारा पत्तियों के दोनों तरफ अच्छी तरह भीगने तक समान रूप से छिड़काव करें।',
        dosageAndDilution: 'एससी (SC) के लिए 1.0 मिली प्रति लीटर पानी (200 मिली प्रति एकड़ 200 लीटर पानी में); अथवा मैंकोज़ेब 75% डब्ल्यूपी 2.5 ग्राम प्रति लीटर पानी।',
        safetyPrecautions: 'तेज धूप या 15 किमी/घंटे से अधिक तेज हवा में छिड़काव न करें। दवा त्वचा व आंखों में न जाने दें।',
        protectiveEquipment: 'दवा मिलाते व छिड़कते समय रबर के दस्ताने, फेस मास्क, सुरक्षा चश्मा और पूरी आस्तीन के कपड़े पहनें।',
        preHarvestInterval: 'कपास के लिए कटाई पूर्व प्रतीक्षा अवधि (PHI) 21 दिन अनिवार्य है।',
        applicationRestrictions: 'लगातार 2 बार से अधिक एक ही कवकनाशी का उपयोग न करें; प्रतिरोध रोकने हेतु दवा बदलें।',
        followUpMonitoring: 'छिड़काव के 5-7 दिन बाद खेत का निरीक्षण करें और देखें कि धब्बों का फैलाव रुका है या नहीं।',
      },
      organicTreatment: {
        title: 'जैविक नियंत्रण एवं प्राकृतिक कवकनाशी',
        biologicalControl: 'ट्राइकोडर्मा विरिडी 1% डब्ल्यूपी (5 ग्राम/लीटर) या स्यूडोमोनास फ्लोरेसेंस (10 ग्राम/लीटर) का सुबह के समय छिड़काव करें।',
        organicSpray: 'नीम का तेल (1500 पीपीएम) 3-5 मिली प्रति लीटर पानी में साबुन के घोल के साथ मिलाकर प्राथमिक अवस्था में छिड़कें।',
        culturalPractices: 'पौधे की रोग प्रतिरोधक क्षमता बढ़ाने हेतु अनुशंसित म्यूरेट ऑफ पोटाश (MOP) का प्रयोग करें।',
        sanitation: 'रोगग्रस्त गिरी हुई पत्तियों को इकट्ठा कर खेत से दूर नष्ट करें या मिट्टी में दबा दें।',
        preventiveManagement: 'पत्तियों को सूखा रखने हेतु फव्वारा सिंचाई के बजाय टपक (ड्रिप) सिंचाई अपनाएं।',
      },
      alternativeTreatments: [
        {
          name: 'इंडोफिल एम-45 (मैंकोज़ेब 75% डब्ल्यूपी)',
          activeIngredient: 'मैंकोज़ेब 75% डब्ल्यूपी',
          whySuitable: 'सिद्ध बहु-स्थानिक सुरक्षात्मक कवकनाशी जो बीजाणु अंकुरण रोकता है और प्रतिरोध नहीं बनने देता।',
        },
        {
          name: 'सिंजेंटा स्कोर (डिफेनोकोनाज़ोल 25% ईसी)',
          activeIngredient: 'डिफेनोकोनाज़ोल 25% ईसी',
          whySuitable: 'तीव्र प्रणालीगत कवकनाशी जो पत्ती के अंदर फैले संक्रमण को तुरंत खत्म करता है।',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: [
          'खेत में घूमकर संक्रमित पौधों का प्रतिशत जांचें।',
          'शाम के समय पत्तियों को गीला रखने वाली सिंचाई तुरंत बंद करें।',
          'अत्यधिक संक्रमित निचली पत्तियों को तोड़कर नष्ट करें।',
        ],
        preventiveSteps: [
          'संतुलित खाद (एन:पी:के) दें; यूरिया का अत्यधिक उपयोग न करें, पोटाश पूरा दें।',
          'गेहूं, चना या ज्वार के साथ 2 वर्षीय फसल चक्र अपनाएं।',
          'प्रमाणित और उपचारित बीजों का ही उपयोग करें।',
        ],
        monitoringSchedule: 'वानस्पतिक और गूलर बनने की अवस्था में सप्ताह में दो बार 20 पौधों का निरीक्षण करें।',
        whenToConsultExpert: 'यदि 20% से अधिक पत्तियों पर धब्बे फैल जाएं या छिड़काव के बाद भी रोग न रुके तो नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।',
      },
      overviewSummary: 'कपास का पत्ती झुलसा रोग अल्टरनेरिया कवक के कारण होता है, जो गर्म और नम मौसम में तेजी से फैलता है। सही कवकनाशी से इसका समय पर नियंत्रण संभव है।',
    },
    gu: {
      id: 'cotton_leaf_blight',
      cropId: 'cotton',
      name: 'કપાસનો પાનનો સુકારો (અલ્ટરનેરિયા)',
      vernacularName: 'અલ્ટરનેરિયા પાનના ટપકાં અને સુકારો',
      scientificName: 'Alternaria macrospora Zimm. / A. alternata',
      pathogenType: 'fungus',
      pathogenLabel: 'ફૂગજન્ય રોગ (અલ્ટરનેરિયા ફૂગ)',
      observedSymptoms: [
        'પાંદડાની સપાટી પર લાલાશ પડતા કથ્થઈથી ઘેરા કથ્થઈ રંગના ટપકાં સ્પષ્ટ દેખાય છે.',
        'જૂના પાંદડા પર ગોળાકાર ચક્રો (ટાર્ગેટ બોર્ડ જેવી રીંગો) ઉપસી આવી છે.',
        'ટપકાંની ફરતે પીળાશ પડતો ઘેરો (ક્લોરોટિક હેલો) જોવા મળે છે.',
      ],
      typicalSymptoms: [
        'શરૂઆતમાં પાંદડા પર નાના, ગોળ કથ્થઈ કે લાલાશ પડતા જાંબુડિયા ટપકાં પડે છે.',
        'ટપકાં મોટા થઈને એકબીજા સાથે ભળી જાય છે અને પાંદડું સુકાઈને બળી ગયેલું દેખાય છે.',
        'સૂકા વાતાવરણમાં ટપકાંનો વચ્ચેનો ભાગ ખરી પડે છે જેથી પાનમાં કાણાં (શોટ-હોલ) પડી જાય છે.',
        'વધુ ઉપદ્રવમાં પાંદડા, કળીઓ અને ઝીંડવા સમય પહેલાં ખરી પડે છે.',
      ],
      possibleCauses: [
        'વારંવાર વરસાદ અથવા હવામાં વધુ ભેજ (>85%) સાથે 25-30°C ગરમ તાપમાન.',
        'પોટાશ ખાતરની ખામી અથવા પોષણની તાણથી પાંદડાં ફૂગ સામે નબળાં પડી જાય છે.',
        'છોડનું વધુ પડતું ઘટાદાર થવું જેથી હવા અને સૂર્યપ્રકાશ પૂરતો ન મળે.',
        'અગાઉના પાકના જમીનમાં પડેલા અવશેષો અથવા સંક્રમિત બિયારણમાં ફૂગના જીવાણુ રહેલા હોવા.',
      ],
      spreadConditions: 'વાદળછાયા અને ભેજવાળા વાતાવરણમાં પવન અને વરસાદના છાંટાથી ફૂગના બીજાણુઓ ઝડપથી ફેલાય છે.',
      potentialDamage: 'તીવ્ર ઉપદ્રવમાં 25-40% સુધી પાંદડાં ખરી પડે છે, જેનાથી ઝીંડવાનો વિકાસ અટકી જાય છે અને કપાસની ગુણવત્તા બગડે છે.',
      primaryTreatment: {
        title: 'ભલામણ કરેલ ફૂગનાશકનો યોગ્ય છંટકાવ',
        activeIngredient: 'એઝોક્સીસ્ટ્રોબિન 18.2% + ડીફેનોકોનાઝોલ 11.4% એસસી અથવા મેન્કોઝેબ 75% ડબલ્યુપી',
        formulation: 'સસ્પેન્શન કોન્સન્ટ્રેટ (SC) / વેટ્ટેબલ પાઉડર (WP)',
        whyAppropriate: 'સીઆઈબીઆરસી (CIBRC) દ્વારા માન્ય સંયોજન જે ફૂગના બીજાણુઓને અંકુરિત થતા અટકાવે છે અને પાન પર રોગનો ફેલાવો તુરંત રોકે છે.',
        howItWorks: 'ફૂગની શ્વસનક્રિયા અટકાવે છે અને કોષદીવાલનું નિર્માણ રોકીને અંદર સુધી રક્ષણ પૂરું પાડે છે.',
        applicationMethod: 'નેપસેક પંપ દ્વારા પાંદડાની ઉપર અને નીચે બંને સપાટી સારી રીતે ભીંજાય તે રીતે સમાન છંટકાવ કરવો.',
        dosageAndDilution: 'એસસી (SC) માટે 1.0 મિલી પ્રતિ લિટર પાણી (200 મિલી પ્રતિ એકર 200 લિટર પાણીમાં); અથવા મેન્કોઝેબ 75% ડબલ્યુપી 2.5 ગ્રામ પ્રતિ લિટર પાણી.',
        safetyPrecautions: 'બપોરના તીવ્ર તડકામાં અથવા 15 કિમી/કલાકથી વધુ પવન હોય ત્યારે છંટકાવ કરવો નહીં. દવા ચામડી કે આંખમાં ન પડે તેનું ધ્યાન રાખવું.',
        protectiveEquipment: 'દવા બનાવતી અને છાંટતી વખતે રબરના મોજાં, ફેસ માસ્ક, ચશ્મા અને પૂરી બાંયના કપડાં પહેરવાં.',
        preHarvestInterval: 'કપાસ માટે લણણી પહેલાંનો ફરજિયાત ગાળો (PHI) 21 દિવસ રાખવો.',
        applicationRestrictions: 'એક જ જૂથની દવાનો સતત 2 કરતાં વધુ વખત ઉપયોગ ન કરવો; રોગપ્રતિકારકતા રોકવા દવા બદલવી.',
        followUpMonitoring: 'છંટકાવના 5-7 દિવસ પછી ખેતરમાં જઈને નવાં પાંદડાં પર રોગ અટક્યો છે કે નહીં તે ચકાસવું.',
      },
      organicTreatment: {
        title: 'જૈવિક નિયંત્રણ અને ઓર્ગેનિક ઉપચાર',
        biologicalControl: 'ટ્રાઇકોડર્મા વિરીડી 1% ડબલ્યુપી (5 ગ્રામ/લિટર) અથવા સ્યુડોમોનાસ ફ્લુઓરેસન્સ (10 ગ્રામ/લિટર) વહેલી સવારે છાંટવું.',
        organicSpray: '1500 પીપીએમ લીંબોળીનું તેલ 3-5 મિલી પ્રતિ લિટર પાણીમાં સાબુના ફીણ સાથે મેળવીને પ્રાથમિક અવસ્થાએ છાંટવું.',
        culturalPractices: 'છોડની રોગપ્રતિકારક શક્તિ વધારવા માટે ભલામણ મુજબ મ્યુરેટ ઓફ પોટાશ (MOP) ખાતર આપવું.',
        sanitation: 'રોગિષ્ઠ ખરી પડેલા પાંદડા ભેગા કરીને ખેતર બહાર બાળી નાખવા અથવા ખાડામાં દાટી દેવા.',
        preventiveManagement: 'પાંદડાંને સૂકાં રાખવા માટે ફુવારા પદ્ધતિને બદલે ટપક (ડ્રિપ) પદ્ધતિથી પિયત આપવું.',
      },
      alternativeTreatments: [
        {
          name: 'ઇન્ડોફિલ એમ-45 (મેન્કોઝેબ 75% ડબલ્યુપી)',
          activeIngredient: 'મેન્કોઝેબ 75% ડબલ્યુપી',
          whySuitable: 'વિશ્વસનીય સંપર્ક ફૂગનાશક જે ફૂગના બીજાણુઓનો નાશ કરે છે અને પ્રતિકારકતા વધવા દેતું નથી.',
        },
        {
          name: 'સિંજેન્ટા સ્કોર (ડીફેનોકોનાઝોલ 25% ઈસી)',
          activeIngredient: 'ડીફેનોકોનાઝોલ 25% ઈસી',
          whySuitable: 'પ્રણાલીગત ફૂગનાશક જે પાંદડાની અંદર પ્રવેશીને ઊંડે સુધી પ્રસરેલી ફૂગને ઝડપથી કાબૂમાં લે છે.',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: [
          'ખેતરમાં ફરીને કેટલા ટકા છોડ પર ટપકાં દેખાય છે તે ગણી લો.',
          'સાંજના સમયે પાંદડાં ભીનાં રહે તેવું પિયત તુરંત બંધ કરો.',
          'વધુ પડતાં રોગગ્રસ્ત નીચેનાં પાંદડાં તોડીને બાળી નાખો.',
        ],
        preventiveSteps: [
          'ખાતરનું સંતુલન જાળવવું (યુરિયા ખાતર વધુ ન આપવું અને પોટાશ ખાતર પૂરતું આપવું).',
          'ઘઉં, ચણા કે જુવાર સાથે 2 વર્ષનું પાક ચક્ર અપનાવવું.',
          'પ્રમાણિત અને દવા પટ આપેલા બીજનું જ વાવેતર કરવું.',
        ],
        monitoringSchedule: 'વાવેતર પછીના વિકાસ અને ઝીંડવા બનવાના તબક્કે અઠવાડિયામાં બે વાર 20 છોડનું અવલોકન કરવું.',
        whenToConsultExpert: 'જો 20% થી વધુ પાંદડાં પર રોગ ફેલાઈ જાય અથવા દવા છાંટ્યા પછી પણ રોગ ન અટકે તો નજીકના કૃષિ વિજ્ઞાન કેન્દ્ર (KVK) નો સંપર્ક કરવો.',
      },
      overviewSummary: 'કપાસનો પાનનો સુકારો અલ્ટરનેરિયા નામની ફૂગથી થતો રોગ છે, જે ભેજવાળા અને ગરમ વાતાવરણમાં ઝડપથી ફેલાય છે. સમયસર યોગ્ય દવાનો છંટકાવ કરવાથી પાકનું નુકસાન અટકાવી શકાય છે.',
    },
  },

  // ---------------------------------------------------------------------------
  // COTTON BACTERIAL BLIGHT (Black Arm)
  // ---------------------------------------------------------------------------
  cotton_bacterial_blight: {
    en: {
      id: 'cotton_bacterial_blight',
      cropId: 'cotton',
      name: 'Cotton Bacterial Blight (Black Arm)',
      vernacularName: 'Angular Leaf Spot / Black Arm',
      scientificName: 'Xanthomonas citri pv. malvacearum',
      pathogenType: 'bacterium',
      pathogenLabel: 'Bacterial Pathogen (Xanthomonas)',
      observedSymptoms: [
        'Water-soaked angular spots sharply delimited by leaf veins.',
        'Spots darkening to dark brown or black with prominent yellow margins.',
        'Blackened, elongated lesions on leaf petioles and young stems (Black Arm).',
      ],
      typicalSymptoms: [
        'Angular water-soaked leaf spots bounded by veinlets.',
        'Vein necrosis extending along main veins causing dark streak appearance.',
        'Stem lesions causing cracking, girdling, and lodging.',
        'Water-soaked round sunken spots on young bolls leading to boll rot.',
      ],
      possibleCauses: [
        'Warm temperatures (28-35°C) coupled with high humidity (>80%).',
        'Infected seed or bacterial inoculum surviving in previous crop debris.',
        'Wounds caused by blowing sand, hail, or sucking insect pests.',
        'Excessive vegetative growth driven by high nitrogen doses.',
      ],
      spreadConditions: 'Wind-driven rain, sprinkler irrigation, and movement of equipment through wet crops spread the bacteria rapidly.',
      potentialDamage: 'Severe attacks cause black arm stem breakage, shedding of squares, boll rot, and 30-50% yield loss.',
      primaryTreatment: {
        title: 'Copper Fungicide + Agricultural Antibiotic Tank Mix',
        activeIngredient: 'Copper Oxychloride 50% WP + Streptomycin Sulphate 90% + Tetracycline Hydrochloride 10%',
        formulation: 'Wettable Powder (WP) + Soluble Powder (SP)',
        whyAppropriate: 'Standard ICAR-recommended bactericide tank-mix neutralizing surface Xanthomonas bacteria while preventing vascular spread.',
        howItWorks: 'Copper ions denature bacterial proteins while Streptocycline inhibits protein synthesis inside bacterial cells.',
        applicationMethod: 'Foliar spray directing spray mist to both sides of leaves and green stems.',
        dosageAndDilution: 'Copper Oxychloride @ 2.5 g/L (500 g/acre in 200 L water) mixed with Streptocycline @ 0.1 g/L (20 g/acre in 200 L water).',
        safetyPrecautions: 'Do not mix with strongly alkaline products. Use clean non-chlorinated water for mixing.',
        protectiveEquipment: 'Wear respirator mask, rubber gloves, and eye shield.',
        preHarvestInterval: 'PHI: 21 days for cotton.',
        applicationRestrictions: 'Do not exceed 2 applications of antibiotics per season to avoid resistance.',
        followUpMonitoring: 'Re-inspect fields after 5 days; check whether angular spots have dried without water-soaking.',
      },
      organicTreatment: {
        title: 'Organic Bacteriostatics & Bio-Suppression',
        biologicalControl: 'Seed and foliar treatment with Pseudomonas fluorescens (10 g/kg seed; 5 g/L foliar).',
        organicSpray: 'Copper Hydroxide 53.8% DF (certified organic grade) @ 2.0 g/L.',
        culturalPractices: 'Deep summer plowing to expose crop residues to solar heat and kill surviving bacteria.',
        sanitation: 'Rogue out and destroy early infected seedlings with black arm symptoms.',
        preventiveManagement: 'Use acid-delinted certified disease-free seeds.',
      },
      alternativeTreatments: [
        {
          name: 'Kasugamycin 3% SL',
          activeIngredient: 'Kasugamycin 3% SL',
          whySuitable: 'Systemic agricultural antibiotic with translaminar action against bacterial blights.',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['Stop overhead irrigation immediately.', 'Spray copper + antibiotic tank-mix on affected plots.'],
        preventiveSteps: ['Use certified acid-delinted seed.', 'Balanced fertilization; avoid excess urea.'],
        monitoringSchedule: 'Inspect crops after heavy rain or storms every 3 days.',
        whenToConsultExpert: 'Escalate if black arm stem lesions cause lodging in more than 10% of plants.',
      },
      overviewSummary: 'Bacterial Blight causes angular water-soaked leaf spots and black stem lesions. Prompt copper-antibiotic sprays prevent crop lodging.',
    },
    hi: {
      id: 'cotton_bacterial_blight',
      cropId: 'cotton',
      name: 'कपास का जीवाणु झुलसा (ब्लैक आर्म)',
      vernacularName: 'कोणीय पत्ती धब्बा / ब्लैक आर्म रोग',
      scientificName: 'Xanthomonas citri pv. malvacearum',
      pathogenType: 'bacterium',
      pathogenLabel: 'जीवाणु जनित रोग (जैंथोमोनास बैक्टीरिया)',
      observedSymptoms: [
        'पत्तियों की नसों के बीच पानी से भीगे हुए कोणीय धब्बे दिखाई दे रहे हैं।',
        'धब्बे गहरे भूरे से काले रंग में बदल रहे हैं और किनारों पर पीलापन है।',
        'डंठल और तनों पर काले, लंबे घाव (ब्लैक आर्म) बने हुए हैं।',
      ],
      typicalSymptoms: [
        'पत्ती की निचली सतह पर नसों से घिरे हुए कोणीय जलसिक्त धब्बे।',
        'नसों का काला पड़ना जिससे मुख्य नसें सूख जाती हैं।',
        'तनों पर काले घाव जिससे शाखाएं टूटकर गिर जाती हैं।',
        'गूलरों पर गोल धब्बे जिससे गूलर सड़ जाते हैं।',
      ],
      possibleCauses: [
        '28-35°C का गर्म तापमान और 80% से अधिक नमी।',
        'संक्रमित बीज या पुरानी फसल के अवशेषों में जीवित जीवाणु।',
        'तेज हवा, ओले या कीटों द्वारा पत्तियों पर लगे घाव।',
        'अधिक यूरिया डालने से पौधों का अत्यधिक कोमल होना।',
      ],
      spreadConditions: 'हवा के साथ बारिश की बौछारें और गीली फसल में काम करने से जीवाणु तेजी से फैलते हैं।',
      potentialDamage: 'गंभीर स्थिति में शाखाएं टूट जाती हैं, कलियां गिरती हैं और 30-50% तक उपज का नुकसान होता है।',
      primaryTreatment: {
        title: 'कॉपर कवकनाशी + कृषि एंटीबायोटिक का मिश्रण',
        activeIngredient: 'कॉपर ऑक्सीक्लोराइड 50% डब्ल्यूपी + स्ट्रेप्टोमाइसिन सल्फेट 90% + टेट्रासाइक्लिन 10%',
        formulation: 'वेटेबल पाउडर (WP) + घुलनशील पाउडर (SP)',
        whyAppropriate: 'आईसीएआर (ICAR) द्वारा अनुशंसित प्रमाणित जीवाणुनाशक जो जीवाणुओं को तुरंत समाप्त करता है।',
        howItWorks: 'कॉपर जीवाणु की कोशिकाओं को नष्ट करता है तथा स्ट्रेप्टोसाइक्लिन जीवाणु के प्रोटीन निर्माण को रोकता है।',
        applicationMethod: 'पत्तियों के दोनों तरफ और तनों पर अच्छी तरह भीगने तक छिड़काव करें।',
        dosageAndDilution: 'कॉपर ऑक्सीक्लोराइड 2.5 ग्राम/लीटर (500 ग्राम प्रति एकड़) + स्ट्रेप्टोसाइक्लिन 0.1 ग्राम/लीटर (20 ग्राम प्रति एकड़ 200 लीटर पानी में)।',
        safetyPrecautions: 'अत्यधिक क्षारीय रसायनों के साथ न मिलाएं। साफ पानी का उपयोग करें।',
        protectiveEquipment: 'मास्क, दस्ताने और सुरक्षा चश्मा पहनें।',
        preHarvestInterval: 'कटाई पूर्व प्रतीक्षा अवधि (PHI) 21 दिन।',
        applicationRestrictions: 'एक मौसम में 2 से अधिक बार एंटीबायोटिक का छिड़काव न करें।',
        followUpMonitoring: '5 दिन बाद देखें कि कोणीय धब्बे सूख गए हैं या नहीं।',
      },
      organicTreatment: {
        title: 'जैविक एवं प्राकृतिक उपचार',
        biologicalControl: 'स्यूडोमोनास फ्लोरेसेंस (10 ग्राम/किग्रा बीज उपचार; 5 ग्राम/लीटर छिड़काव)।',
        organicSpray: 'कॉपर हाइड्रोक्साइड (ઓર્ગેનિક ગ્રેડ) 2.0 ग्राम प्रति लीटर पानी।',
        culturalPractices: 'गर्मियों में गहरी जुताई करें ताकि धूप से जीवाणु नष्ट हो जाएं।',
        sanitation: 'ब्लैक आर्म से ग्रसित पौधों को उखाड़कर नष्ट करें।',
        preventiveManagement: 'प्रमाणित रोगमुक्त बीज ही बोएं।',
      },
      alternativeTreatments: [
        {
          name: 'कासुगामाइसिन 3% एसएल',
          activeIngredient: 'कासुगामाइसिन 3% एसएल',
          whySuitable: 'प्रणालीगत कृषि जीवाणुनाशक जो पत्तियों के अंदर प्रवेश कर जीवाणुओं को नष्ट करता है।',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['फव्वारा सिंचाई बंद करें।', 'कॉपर + स्ट्रेप्टोसाइक्लिन का छिड़काव करें।'],
        preventiveSteps: ['एसिड-डिलिंटेड प्रमाणित बीज का उपयोग करें।', 'यूरिया सीमित रखें, पोटाश दें।'],
        monitoringSchedule: 'बारिश के बाद हर 3 दिन में खेत की जांच करें।',
        whenToConsultExpert: 'यदि 10% से अधिक तनों पर घाव दिखे तो केवीके से संपर्क करें।',
      },
      overviewSummary: 'कपास का जीवाणु झुलसा पत्तियों पर कोणीय धब्बे और तने पर काले घाव बनाता है। कॉपर और स्ट्रेप्टोसाइक्लिन के घोल से इसका प्रभावी उपचार होता है।',
    },
    gu: {
      id: 'cotton_bacterial_blight',
      cropId: 'cotton',
      name: 'કપાસનો જીવાણુજન્ય સુકારો (બ્લેક આર્મ / કાળી ડાળી)',
      vernacularName: 'ખૂણીયા ટપકાંનો રોગ / બ્લેક આર્મ',
      scientificName: 'Xanthomonas citri pv. malvacearum',
      pathogenType: 'bacterium',
      pathogenLabel: 'જીવાણુજન્ય રોગ (ઝેન્થોમોનાસ બેક્ટેરિયા)',
      observedSymptoms: [
        'પાંદડાની નસો વચ્ચે પાણીપોચા ખૂણાવાળા (કોણીય) ટપકાં સ્પષ્ટ દેખાય છે.',
        'ટપકાં કાળાશ પડતા થઈ ગયા છે અને કિનારી પીળા રંગની છે.',
        'ડાળીઓ અને સાંઠા પર કાળા લંબાકાર ચાંઠા (બ્લેક આર્મ) પડી ગયા છે.',
      ],
      typicalSymptoms: [
        'પાંદડાની નીચે નસો વચ્ચે ચોરસ/ત્રિકોણ જેવા ખૂણાવાળા પાણી ભરાયેલા ટપકાં.',
        'મુખ્ય નસો કાળી પડી જવી જેથી પાંદડાં સુકાઈ જાય છે.',
        'ડાળીઓ પર કાળા ડાઘ પડવાથી ડાળીઓ બટકીને તૂટી જાય છે.',
        'ઝીંડવા પર ગોળ ડાઘ પડીને ઝીંડવા સડી જાય છે.',
      ],
      possibleCauses: [
        '28-35°C ઊંચું તાપમાન અને 80% થી વધુ હવામાં ભેજ.',
        'સંક્રમિત બિયારણ અથવા જમીનમાં રહેલા જૂના પાકના અવશેષો.',
        'પવન, કરા કે ચૂસિયા જીવાતોથી પાંદડા પર પડેલા જખમો.',
        'વધુ પડતો યુરિયા આપવાથી છોડનું વધુ પડતું કૂણું થવું.',
      ],
      spreadConditions: 'પવન સાથેના વરસાદી છાંટા અને ભીના પાકમાં મજૂરો કે સાધનોની અવરજવરથી જીવાણુ ઝડપથી પ્રસરે છે.',
      potentialDamage: 'તીવ્ર ઉપદ્રવમાં ડાળીઓ તૂટી પડે છે, ઝીંડવા સડી જાય છે અને 30-50% ઉત્પાદન ઘટે છે.',
      primaryTreatment: {
        title: 'કોપર ફૂગનાશક + એન્ટિબાયોટિકનું યોગ્ય મિશ્રણ',
        activeIngredient: 'કોપર ઓક્સીક્લોરાઇડ 50% ડબલ્યુપી + સ્ટ્રેપ્ટોમાઇસિન સલ્ફેટ 90% + ટેટ્રાસાયક્લિન 10%',
        formulation: 'વેટ્ટેબલ પાઉડર (WP) + સોલ્યુબલ પાઉડર (SP)',
        whyAppropriate: 'આઈસીએઆર (ICAR) ભલામણ કરેલ ઉત્તમ જીવાણુનાશક મિશ્રણ જે બેક્ટેરિયાનો તુરંત નાશ કરે છે.',
        howItWorks: 'કોપર જીવાણુના કોષોને તોડે છે અને સ્ટ્રેપ્ટોસાઇક્લિન તેના પ્રોટીન બનવાની પ્રક્રિયા અટકાવે છે.',
        applicationMethod: 'પાંદડાની બંને બાજુ અને ડાળીઓ બરાબર ભીંજાય તે રીતે સવારે છંટકાવ કરવો.',
        dosageAndDilution: 'કોપર ઓક્સીક્લોરાઇડ 2.5 ગ્રામ/લિટર (500 ગ્રામ પ્રતિ એકર) + સ્ટ્રેપ્ટોસાઇક્લિન 0.1 ગ્રામ/લિટર (20 ગ્રામ પ્રતિ એકર 200 લિટર પાણીમાં).',
        safetyPrecautions: 'વધુ ક્ષારીય દવાઓ સાથે મિશ્રણ ન કરવું. દવા બનાવવા ચોખ્ખા પાણીનો ઉપયોગ કરવો.',
        protectiveEquipment: 'માસ્ક, મોજાં અને ચશ્મા પહેરવાં.',
        preHarvestInterval: 'લણણી પહેલાંનો ગાળો (PHI): 21 દિવસ.',
        applicationRestrictions: 'એક સિઝનમાં 2 કરતાં વધુ વખત એન્ટિબાયોટિક ન છાંટવું.',
        followUpMonitoring: '5 દિવસ પછી તપાસો કે ખૂણીયા ટપકાં સૂકાઈ ગયા છે કે નહીં.',
      },
      organicTreatment: {
        title: 'જૈવિક અને કુદરતી ઉપચાર',
        biologicalControl: 'સ્યુડોમોનાસ ફ્લુઓરેસન્સ (10 ગ્રામ/કિલો બીજ પટ; 5 ગ્રામ/લિટર છંટકાવ).',
        organicSpray: 'કોપર હાઇડ્રોક્સાઇડ (ઓર્ગેનિક માન્ય) 2.0 ગ્રામ પ્રતિ લિટર.',
        culturalPractices: 'ઉનાળામાં ઊંડી ખેડ કરવી જેથી સૂર્યના તાપથી જીવાણુઓ નાશ પામે.',
        sanitation: 'કાળી ડાળી થયેલા સુકાયેલા છોડને ઉપાડીને બાળી નાખવા.',
        preventiveManagement: 'એસિડથી ટ્રીટ કરેલ પ્રમાણિત બીજ જ વાવવું.',
      },
      alternativeTreatments: [
        {
          name: 'કાસુગામયસીન 3% એસએલ',
          activeIngredient: 'કાસુગામયસીન 3% એસએલ',
          whySuitable: 'પ્રણાલીગત જીવાણુનાશક જે પાંદડાની અંદર જઈને રોગને કાબૂમાં લે છે.',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['ફુવારા પિયત બંધ કરો.', 'કોપર + સ્ટ્રેપ્ટોસાઇક્લિનનો છંટકાવ કરો.'],
        preventiveSteps: ['પ્રમાણિત બીજ વાપરવું.', 'યુરિયા ઓછો આપવો, પોટાશ ખાતર પૂરતું આપવું.'],
        monitoringSchedule: 'વરસાદ પછી દર 3 દિવસે ખેતરની તપાસ કરવી.',
        whenToConsultExpert: 'જો 10% થી વધુ ડાળીઓ કાળી પડીને તૂટવા લાગે તો તુરંત KVK નો સંપર્ક કરવો.',
      },
      overviewSummary: 'કપાસનો જીવાણુજન્ય સુકારો પાન પર ખૂણીયા ટપકાં અને ડાળી કાળી કરી નાખે છે. કોપર અને સ્ટ્રેપ્ટોસાઇક્લિનના મિશ્રણથી આ રોગને સફળતાપૂર્વક કાબૂમાં લઈ શકાય છે.',
    },
  },

  // ---------------------------------------------------------------------------
  // COTTON HEALTHY LEAF
  // ---------------------------------------------------------------------------
  cotton_healthy: {
    en: {
      id: 'cotton_healthy',
      cropId: 'cotton',
      name: 'Healthy Cotton Foliage',
      vernacularName: 'Healthy Cotton Crop',
      scientificName: 'Gossypium hirsutum',
      pathogenType: 'none',
      pathogenLabel: 'Non-pathogenic (Healthy)',
      observedSymptoms: ['Vigorous, uniform dark-green vegetative leaf tissue.', 'Zero visible necrotic lesions or chlorotic halos.'],
      typicalSymptoms: ['Smooth, intact palmate leaf margins with healthy green chlorophyll pigmentation.'],
      possibleCauses: ['Balanced soil fertility, appropriate irrigation schedule, and absence of active fungal or bacterial pathogens.'],
      spreadConditions: 'Optimal growing conditions: 25-32°C, well-drained loamy or black soil, adequate sunlight.',
      potentialDamage: 'No damage. Yield potential is optimal.',
      primaryTreatment: {
        title: 'Preventive Nutrition & Canopy Maintenance',
        activeIngredient: '19-19-19 Water Soluble Fertilizer or Micronutrient Foliar Spray',
        formulation: 'Soluble Powder / Foliar Grade',
        whyAppropriate: 'No fungicides or pesticides required. Maintain balanced nutrition to support square and boll development.',
        howItWorks: 'Provides balanced N-P-K and essential zinc/boron for vigorous flowering and boll retention.',
        applicationMethod: 'Foliar spray during early morning or late afternoon.',
        dosageAndDilution: '5.0 g per liter of water (1 kg per acre in 200 L water).',
        safetyPrecautions: 'Do not spray under hot afternoon sun.',
        protectiveEquipment: 'Basic eye protection and dust mask.',
        preHarvestInterval: '0 days.',
        applicationRestrictions: 'None.',
        followUpMonitoring: 'Regular weekly field scouting.',
      },
      organicTreatment: {
        title: 'Organic Growth Boosters',
        biologicalControl: 'Preventive Trichoderma soil drenching during intercultural operations.',
        organicSpray: 'Fermented cow urine or panchagavya @ 3% foliar spray.',
        culturalPractices: 'Regular weeding and inter-cultivation.',
        sanitation: 'Maintain clean field bunds.',
        preventiveManagement: 'Install yellow sticky traps (10/acre) to monitor whiteflies and sucking pests.',
      },
      alternativeTreatments: [],
      preventionAndMonitoring: {
        immediateActions: ['No chemical sprays needed.', 'Continue routine irrigation and nutrient program.'],
        preventiveSteps: ['Monitor soil moisture.', 'Scout for sucking pests on leaf undersides.'],
        monitoringSchedule: 'Weekly routine field scouting.',
        whenToConsultExpert: 'Only if unexplained yellowing or pest resurgence appears.',
      },
      overviewSummary: 'The cotton leaf is healthy and vigorous with high chlorophyll density. No fungicides or bactericides are required.',
    },
    hi: {
      id: 'cotton_healthy',
      cropId: 'cotton',
      name: 'स्वस्थ कपास का पत्ता',
      vernacularName: 'स्वस्थ कपास फसल',
      scientificName: 'Gossypium hirsutum',
      pathogenType: 'none',
      pathogenLabel: 'रोगमुक्त (स्वस्थ फसल)',
      observedSymptoms: ['गहरा हरा, चमकदार एवं स्वस्थ पत्ता।', 'कोई भी रोग धब्बा या पीलापन नहीं है।'],
      typicalSymptoms: ['पत्तियों की सतह एकसમાન, चिकनी और पूर्ण रूप से स्वस्थ है।'],
      possibleCauses: ['उचित पोषण, समय पर सिंचाई और रोगजनकों की अनुपस्थिति।'],
      spreadConditions: 'अनुकूल मौसम: 25-32°C तापमान, अच्छी जल निकासी वाली काली मिट्टी।',
      potentialDamage: 'कोई नुकसान नहीं। फसल पूर्ण पैदावार देने की स्थिति में है।',
      primaryTreatment: {
        title: 'संतुलित पोषण एवं फसल देखभाल',
        activeIngredient: '19-19-19 घुलनशील खाद या सूक्ष्म पोषक तत्व (माइक्रोन्यूट्रिएंट) स्प्रे',
        formulation: 'घुलनशील उर्वरक',
        whyAppropriate: 'किसी भी कवकनाशी या कीटनाशक की आवश्यकता नहीं है। केवल फसल की वृद्धि बनाए रखें।',
        howItWorks: 'संतुलित नाइट्रोजन, फास्फोरस व पोटाश पौधों को मजबूती प्रदान करते हैं।',
        applicationMethod: 'सुबह या शाम के समय पत्तियों पर हल्का छिड़काव करें।',
        dosageAndDilution: '5 ग्राम प्रति लीटर पानी (1 किग्रा प्रति एकड़ 200 लीटर पानी में)।',
        safetyPrecautions: 'कड़ी धूप में छिड़काव न करें।',
        protectiveEquipment: 'सामान्य सुरक्षा।',
        preHarvestInterval: '0 दिन।',
        applicationRestrictions: 'कोई नहीं।',
        followUpMonitoring: 'साप्ताहिक सामान्य निरीक्षण।',
      },
      organicTreatment: {
        title: 'जैविक वृद्धि वर्धक',
        biologicalControl: 'मिट्टी में ट्राइकोडर्मा की नियमित उपस्थिति बनाए रखें।',
        organicSpray: 'पंचगव्य या जीवामृत का 3% घोल बनाकर छिड़काव करें।',
        culturalPractices: 'खेत को खरपतवार मुक्त रखें।',
        sanitation: 'खेत की मेड़ साफ रखें।',
        preventiveManagement: 'सफेद मक्खी की निगरानी हेतु पीले चिपचिपे कार्ड लगाएं।',
      },
      alternativeTreatments: [],
      preventionAndMonitoring: {
        immediateActions: ['कोई रासायनिक दवा न डालें।', 'नियमित सिंचाई व पोषण जारी रखें।'],
        preventiveSteps: ['मिट्टी में नमी बनाए रखें।', 'रस चूसक कीटों पर नजर रखें।'],
        monitoringSchedule: 'सप्ताह में एक बार सामान्य खेत का मुआयना करें।',
        whenToConsultExpert: 'केवल तभी संपर्क करें जब कोई असामान्य लक्षण दिखे।',
      },
      overviewSummary: 'कपास का पत्ता पूर्णतः स्वस्थ है। किसी भी रासायनिक फफूंदनाशक या दवा की जरूरत नहीं है।',
    },
    gu: {
      id: 'cotton_healthy',
      cropId: 'cotton',
      name: 'તંદુરસ્ત કપાસનું પાન',
      vernacularName: 'તંદુરસ્ત કપાસનો પાક',
      scientificName: 'Gossypium hirsutum',
      pathogenType: 'none',
      pathogenLabel: 'રોગમુક્ત (તંદુરસ્ત પાક)',
      observedSymptoms: ['ઘેરા લીલા રંગનું ચમકદાર અને તંદુરસ્ત પાંદડું.', 'કોઈપણ પ્રકારના રોગના ટપકાં કે પીળાશ નથી.'],
      typicalSymptoms: ['પાંદડાની સપાટી એકસરખી લીલી અને અખંડ છે.'],
      possibleCauses: ['સમતોલ ખાતર, સમયસર પિયત અને કોઈપણ ફૂગ કે બેક્ટેરિયાનો અભાવ.'],
      spreadConditions: 'અનુકૂળ પરિસ્થિતિ: 25-32°C તાપમાન અને યોગ્ય નિતારવાળી કાળી જમીન.',
      potentialDamage: 'કોઈ નુકસાન નથી. ઉત્તમ ઉત્પાદનની ક્ષમતા.',
      primaryTreatment: {
        title: 'સંતુલિત પોષણ અને પાકની જાળવણી',
        activeIngredient: '19-19-19 વોટર સોલ્યુબલ ખાતર અથવા સૂક્ષ્મ પોષકતત્વોનો છંટકાવ',
        formulation: 'પાણીમાં દ્રાવ્ય ખાતર',
        whyAppropriate: 'કોઈપણ દવા કે ફૂગનાશકની જરૂર નથી. માત્ર પાકની સામાન્ય વૃદ્ધિ જાળવી રાખો.',
        howItWorks: 'નાઇટ્રોજન, ફોસ્ફરસ અને પોટાશથી છોડને સારો વિકાસ અને પુષ્કળ ફાલ મળે છે.',
        applicationMethod: 'સવારે અથવા સાંજે પાંદડા પર હળવો છંટકાવ કરવો.',
        dosageAndDilution: '5 ગ્રામ પ્રતિ લિટર પાણી (1 કિલો પ્રતિ એકર 200 લિટર પાણીમાં).',
        safetyPrecautions: 'બપોરના તડકામાં છંટકાવ ન કરવો.',
        protectiveEquipment: 'સામાન્ય કાળજી.',
        preHarvestInterval: '0 દિવસ.',
        applicationRestrictions: 'કોઈ નહીં.',
        followUpMonitoring: 'અઠવાડિક સામાન્ય નિરીક્ષણ.',
      },
      organicTreatment: {
        title: 'ઓર્ગેનિક વૃદ્ધિવર્ધક ઉપચાર',
        biologicalControl: 'જમીનમાં નિયમિત ટ્રાઇકોડર્માનું પ્રમાણ જાળવવું.',
        organicSpray: 'પંચગવ્ય અથવા જીવામૃતનો 3% છંટકાવ કરવો.',
        culturalPractices: 'ખેતરમાં આંતરખેડ કરીને નીંદણમુક્ત રાખવું.',
        sanitation: 'શેઢા-પાળા ચોખ્ખા રાખવા.',
        preventiveManagement: 'સફેદ માખી માટે પીળા ચીકણા ટ્રેપ (10 પ્રતિ એકર) લગાવવા.',
      },
      alternativeTreatments: [],
      preventionAndMonitoring: {
        immediateActions: ['કોઈપણ રાસાયણિક દવા છાંટવી નહીં.', 'નિયમિત પિયત અને ખાતર ચાલુ રાખવું.'],
        preventiveSteps: ['જમીનમાં ભેજ જાળવી રાખવો.', 'ચૂસિયા જીવાતો પર નજર રાખવી.'],
        monitoringSchedule: 'અઠવાડિયામાં એકવાર સામાન્ય ખેતરનું નિરીક્ષણ કરવું.',
        whenToConsultExpert: 'જો કોઈ અસામાન્ય લક્ષણ જણાય તો જ સલાહ લેવી.',
      },
      overviewSummary: 'કપાસનું પાંદડું તદ્દન તંદુરસ્ત છે. કોઈપણ ફૂગનાશક કે ઝેરી દવાની જરૂર નથી.',
    },
  },

  // ---------------------------------------------------------------------------
  // RICE BLAST
  // ---------------------------------------------------------------------------
  rice_blast: {
    en: {
      id: 'rice_blast',
      cropId: 'rice',
      name: 'Rice Leaf & Neck Blast',
      vernacularName: 'Rice Blast Disease',
      scientificName: 'Magnaporthe oryzae (Pyricularia oryzae)',
      pathogenType: 'fungus',
      pathogenLabel: 'Fungal Pathogen (Magnaporthe)',
      observedSymptoms: [
        'Spindle-shaped elliptical lesions with pointed ends and greyish-white centres.',
        'Dark reddish-brown margins surrounding elongated eye-shaped leaf lesions.',
      ],
      typicalSymptoms: [
        'Spindle-shaped or eye-shaped lesions on leaves.',
        'Lesions enlarge and coalesce, causing entire leaf blades to dry and wither.',
        'Neck rot where the panicle node turns blackish-brown and breaks.',
      ],
      possibleCauses: ['High relative humidity (>90%), cool nights (20-24°C), and excessive nitrogenous fertilizer application.'],
      spreadConditions: 'Airborne conidia released during night hours with heavy dew deposition.',
      potentialDamage: 'Up to 50-80% yield loss in susceptible varieties if neck blast develops.',
      primaryTreatment: {
        title: 'Melanin Biosynthesis Inhibitor (MBI) or Triazole Foliar Spray',
        activeIngredient: 'Tricyclazole 75% WP or Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
        formulation: 'Wettable Powder (WP) / Suspension Concentrate (SC)',
        whyAppropriate: 'Tricyclazole specifically prevents fungal appressorial penetration into rice foliage.',
        howItWorks: 'Inhibits fungal melanin synthesis required for leaf penetration.',
        applicationMethod: 'Foliar spray ensuring coverage of leaf canopy and panicle base.',
        dosageAndDilution: '0.6 g/L water (120 g/acre in 200 L water) for Tricyclazole 75% WP.',
        safetyPrecautions: 'Do not spray when rain is imminent within 2 hours.',
        protectiveEquipment: 'Wear gloves, mask, and goggles.',
        preHarvestInterval: 'PHI: 30 days for rice.',
        applicationRestrictions: 'Maximum 2 applications per season.',
        followUpMonitoring: 'Inspect upper leaves after 5 days.',
      },
      organicTreatment: {
        title: 'Bio-Control & Resistant Cultural Practices',
        biologicalControl: 'Pseudomonas fluorescens 0.5% WP @ 5 g/L foliar spray.',
        organicSpray: 'Cow urine extract 5% + fermented butter milk spray.',
        culturalPractices: 'Split nitrogen applications into 3-4 smaller doses; apply silica and potash.',
        sanitation: 'Burn infected paddy straw after harvest.',
        preventiveManagement: 'Treat seeds with Pseudomonas fluorescens @ 10 g/kg seed.',
      },
      alternativeTreatments: [
        {
          name: 'Kasugamycin 3% SL',
          activeIngredient: 'Kasugamycin 3% SL',
          whySuitable: 'Systemic antibiotic fungicide approved for rice blast.',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['Stop further urea top-dressing.', 'Apply Tricyclazole immediately.'],
        preventiveSteps: ['Use blast-resistant varieties.', 'Balanced N:P:K.'],
        monitoringSchedule: 'Inspect nurseries and tillering crop twice weekly.',
        whenToConsultExpert: 'Consult KVK if neck blast appears at panicle emergence.',
      },
      overviewSummary: 'Rice Blast produces spindle-shaped lesions and neck rot. Early treatment with Tricyclazole protects grain filling.',
    },
    hi: {
      id: 'rice_blast',
      cropId: 'rice',
      name: 'धान का झोंका रोग (ब्लास्ट)',
      vernacularName: 'धान का ब्लास्ट / करमोड रोग',
      scientificName: 'Magnaporthe oryzae',
      pathogenType: 'fungus',
      pathogenLabel: 'कवक जनित रोग (मैग्नापोर्थे)',
      observedSymptoms: ['पत्तियों पर आंख की आकृति के तर्कुरूपी (स्पिंडल) धब्बे।', 'धब्बों का केंद्र धूसर-सफेद और किनारे लाल-भूरे हैं।'],
      typicalSymptoms: ['पत्तियों पर तर्कुनुमा धब्बे जो आपस में मिलकर पत्ती को सुखा देते हैं।', 'बाली की गर्दन पर काला धब्बा (गर्दन तोड़) जिससे बाली टूट जाती है।'],
      possibleCauses: ['90% से अधिक नमी, रात का ठंडा तापमान (20-24°C) और अत्यधिक यूरिया खाद।'],
      spreadConditions: 'ओस की बूंदों और रात की हवा से कवक के बीजाणु तेजी से फैलते हैं।',
      potentialDamage: 'गर्दन तोड़ अवस्था में 50-80% तक उपज का भारी नुकसान हो सकता है।',
      primaryTreatment: {
        title: 'ट्राईसाइक्लाज़ोल या सिस्टेमिक फफूंदनाशक का छिड़काव',
        activeIngredient: 'ट्राईसाइक्लाज़ोल 75% डब्ल्यूपी अथवा एज़ोक्सीस्ट्रोबिन + डिफेनोकोनाज़ोल',
        formulation: 'वेटेबल पाउडर (WP)',
        whyAppropriate: 'ट्राईसाइक्लाज़ोल कवक को पत्ती के अंदर प्रवेश करने से रोकता है।',
        howItWorks: 'कवक में मेलेनिन निर्माण रोककर संक्रमण तुरंत थामता है।',
        applicationMethod: 'पत्तियों और बालियों के आधार पर समान छिड़काव करें।',
        dosageAndDilution: '0.6 ग्राम प्रति लीटर पानी (120 ग्राम प्रति एकड़ 200 लीटर पानी में)।',
        safetyPrecautions: 'छिड़काव के समय मुंह व आंख ढकें।',
        protectiveEquipment: 'मास्क, चश्मा और दस्ताने।',
        preHarvestInterval: 'कटाई पूर्व प्रतीक्षा अवधि (PHI): 30 दिन।',
        applicationRestrictions: 'सीजन में अधिकतम 2 बार।',
        followUpMonitoring: '5 दिन बाद बालियों का निरीक्षण करें।',
      },
      organicTreatment: {
        title: 'जैविक व पारंपरिक उपचार',
        biologicalControl: 'स्यूडोमोनास फ्लोरेसेंस 5 ग्राम प्रति लीटर पानी।',
        organicSpray: 'खट्टी छाछ और गोमूत्र का 5% घोल।',
        culturalPractices: 'यूरिया की मात्रा कम करें और पोटाश खाद दें।',
        sanitation: 'संक्रमित पुआल को नष्ट करें।',
        preventiveManagement: 'बीज शोधन अवश्य करें।',
      },
      alternativeTreatments: [
        {
          name: 'कासुगामाइसिन 3% एसएल',
          activeIngredient: 'कासुगामाइसिन 3% एसएल',
          whySuitable: 'धान के ब्लास्ट रोग में अत्यंत प्रभावी प्रणालीगत दवा।',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['यूरिया तुरंत बंद करें।', 'ट्राईसाइक्लाज़ोल का छिड़काव करें।'],
        preventiveSteps: ['रोगरोधी किस्में लगाएं।', 'संतुलित खाद दें।'],
        monitoringSchedule: 'सप्ताह में दो बार खेत देखें।',
        whenToConsultExpert: 'बाली निकलने के समय गर्दन में कालापन दिखे तो तुरंत विशेषज्ञ से मिलें।',
      },
      overviewSummary: 'धान का ब्लास्ट रोग आंख जैसे धब्बे बनाता है। ट्राईसाइक्लाज़ोल के समय पर छिड़काव से फसल सुरक्षित रहती है।',
    },
    gu: {
      id: 'rice_blast',
      cropId: 'rice',
      name: 'ડાંગરનો ગેરુ / કરમોડ (બ્લાસ્ટ રોગ)',
      vernacularName: 'ડાંગરનો બ્લાસ્ટ / કરમોડ',
      scientificName: 'Magnaporthe oryzae',
      pathogenType: 'fungus',
      pathogenLabel: 'ફૂગજન્ય રોગ (બ્લાસ્ટ ફૂગ)',
      observedSymptoms: ['પાંદડા પર ત્રાક આકારના (વચ્ચેથી પહોળા અને છેડેથી સાંકડા) આંખ જેવા ટપકાં.', 'ટપકાંની વચ્ચેનો ભાગ રાખોડી-સફેદ અને કિનારી ઘેરી કથ્થઈ.'],
      typicalSymptoms: ['પાંદડા પર આંખ જેવા ટપકાં પડીને પાન સુકાઈ જવું.', 'કણસલાની ડોક કાળી પડીને તૂટી જવી (ડોક-તોડ / નેક બ્લાસ્ટ).'],
      possibleCauses: ['હવામાં 90% થી વધુ ભેજ, રાત્રિનું ઠંડુ વાતાવરણ (20-24°C) અને વધુ પડતો યુરિયા.'],
      spreadConditions: 'ઝાકળ અને રાત્રિના પવનથી ફૂગના રજકણો ખૂબ ઝડપથી આખા ખેતરમાં પ્રસરે છે.',
      potentialDamage: 'જો ડોક-તોડ અવસ્થા આવે તો 50-80% સુધી ડાંગરના ઉત્પાદનમાં મોટો ઘટાડો થાય છે.',
      primaryTreatment: {
        title: 'ટ્રાયસાયક્લાઝોલ ફૂગનાશકનો છંટકાવ',
        activeIngredient: 'ટ્રાયસાયક્લાઝોલ 75% ડબલ્યુપી અથવા એઝોક્સીસ્ટ્રોબિન + ડીફેનોકોનાઝોલ',
        formulation: 'વેટ્ટેબલ પાઉડર (WP)',
        whyAppropriate: 'ટ્રાયસાયક્લાઝોલ ડાંગરના બ્લાસ્ટ રોગ સામે આઈસીએઆર માન્ય સૌથી અસરકારક ફૂગનાશક છે.',
        howItWorks: 'ફૂગને પાનની અંદર ઘૂસતી અટકાવે છે અને રોગને આગળ વધતો રોકે છે.',
        applicationMethod: 'પાંદડા અને કણસલા પર બરાબર ભીંજાય તેમ છંટકાવ કરવો.',
        dosageAndDilution: '0.6 ગ્રામ પ્રતિ લિટર પાણી (120 ગ્રામ પ્રતિ એકર 200 લિટર પાણીમાં).',
        safetyPrecautions: 'છંટકાવ વખતે પવનની દિશા ધ્યાનમાં રાખવી.',
        protectiveEquipment: 'માસ્ક અને રબરના મોજાં પહેરવાં.',
        preHarvestInterval: 'લણણી પહેલાંનો ગાળો (PHI): 30 દિવસ.',
        applicationRestrictions: 'મોસમમાં વધુમાં વધુ 2 વખત.',
        followUpMonitoring: '5 દિવસ પછી કણસલાનું નિરીક્ષણ કરવું.',
      },
      organicTreatment: {
        title: 'જૈવિક અને દેશી ઉપચાર',
        biologicalControl: 'સ્યુડોમોનાસ ફ્લુઓરેસન્સ 5 ગ્રામ પ્રતિ લિટર પાણી.',
        organicSpray: 'ખાટી છાશ અને ગૌમૂત્રનું 5% દ્રાવણ બનાવી છાંટવું.',
        culturalPractices: 'યુરિયા ખાતર મર્યાદિત કરવો અને પોટાશ ખાતર આપવું.',
        sanitation: 'અગાઉની ડાંગરની પરાળનો નાશ કરવો.',
        preventiveManagement: 'બીજ માવજત અવશ્ય કરવી.',
      },
      alternativeTreatments: [
        {
          name: 'કાસુગામયસીન 3% એસએલ',
          activeIngredient: 'કાસુગામયસીન 3% એસએલ',
          whySuitable: 'ડાંગરના કરમોડ રોગમાં પ્રણાલીગત રીતે રક્ષણ આપતી દવા.',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['યુરિયા બંધ કરો.', 'ટ્રાયસાયક્લાઝોલનો તુરંત છંટકાવ કરો.'],
        preventiveSteps: ['પ્રતિકારક જાતો વાવવી.', 'ખાતરનું સંતુલન રાખવું.'],
        monitoringSchedule: 'કૂટ ફૂટવાના અને કંઠી નીકળવાના સમયે અઠવાડિયામાં બે વાર તપાસ કરવી.',
        whenToConsultExpert: 'જો કંઠીની ડોક કાળી પડતી જણાય તો તુરંત KVK નો સંપર્ક કરવો.',
      },
      overviewSummary: 'ડાંગરનો બ્લાસ્ટ રોગ પાન પર ત્રાક આકારના ટપકાં અને કંઠીની ડોક કાળી કરી નાખે છે. ટ્રાયસાયક્લાઝોલ દવા સમયસર છાંટવાથી મોટો બગાડ અટકે છે.',
    },
  },

  // ---------------------------------------------------------------------------
  // WHEAT YELLOW RUST (Stripe Rust)
  // ---------------------------------------------------------------------------
  wheat_yellow_rust: {
    en: {
      id: 'wheat_yellow_rust',
      cropId: 'wheat',
      name: 'Wheat Yellow Rust (Stripe Rust)',
      vernacularName: 'Stripe Rust / Yellow Rust',
      scientificName: 'Puccinia striiformis f. sp. tritici',
      pathogenType: 'fungus',
      pathogenLabel: 'Fungal Pathogen (Puccinia)',
      observedSymptoms: [
        'Bright yellow to orange pustules arranged in linear stripes parallel to leaf veins.',
        'Yellow powder rubbing off easily on fingertips upon touching.',
      ],
      typicalSymptoms: [
        'Linear yellow stripes containing powdery urediniospores along the leaf blade.',
        'Premature chlorosis, drying of flag leaf, and shrivelled grain.',
      ],
      possibleCauses: ['Cool temperatures (10-18°C), high humidity, and overcast skies with persistent morning dew.'],
      spreadConditions: 'Urediniospores carried by high-altitude winds over hundreds of kilometres.',
      potentialDamage: 'Up to 40-70% reduction in grain yield and 1000-grain weight if flag leaf is infected.',
      primaryTreatment: {
        title: 'Systemic Triazole Foliar Fungicide',
        activeIngredient: 'Propiconazole 25% EC or Tebuconazole 25.9% EC',
        formulation: 'Emulsifiable Concentrate (EC)',
        whyAppropriate: 'CIMMYT and ICAR-IIWBR standard recommended triazole to arrest Puccinia stripe rust.',
        howItWorks: 'Inhibits fungal sterol demethylation, halting pustule eruption within 48 hours.',
        applicationMethod: 'Foliar spray with uniform canopy coverage.',
        dosageAndDilution: '1.0 ml per liter of water (200 ml per acre in 200 L water).',
        safetyPrecautions: 'Wear gloves and mask. Do not spray during frosty mornings.',
        protectiveEquipment: 'Gloves, mask, eye protection.',
        preHarvestInterval: 'PHI: 30 days.',
        applicationRestrictions: 'Do not exceed 2 sprays.',
        followUpMonitoring: 'Inspect after 4-5 days to confirm pustules turned dull blackish-brown.',
      },
      organicTreatment: {
        title: 'Bio-Protection & Crop Sanitation',
        biologicalControl: 'Trichoderma viride 1% WP (5 g/L).',
        organicSpray: 'Soluble sulfur 80% WDG (2 g/L) at initial stage.',
        culturalPractices: 'Grow resistant varieties recommended by IIWBR.',
        sanitation: 'Eradicate self-sown volunteer wheat plants.',
        preventiveManagement: 'Balanced nitrogen; do not delay sowing.',
      },
      alternativeTreatments: [
        {
          name: 'Indofil M-45 (Mancozeb 75% WP)',
          activeIngredient: 'Mancozeb 75% WP',
          whySuitable: 'Contact protectant spray before stripe expansion.',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['Spray Propiconazole at first sight of yellow stripe.', 'Inspect border rows.'],
        preventiveSteps: ['Sow rust-resistant varieties.', 'Ensure timely sowing.'],
        monitoringSchedule: 'Inspect crops every 3 days during cool cloudy weather.',
        whenToConsultExpert: 'Report to local wheat research station if rust appears early in vegetative stage.',
      },
      overviewSummary: 'Wheat Yellow Rust produces distinct yellow stripes of powdery spores. Propiconazole spray provides rapid curative control.',
    },
    hi: {
      id: 'wheat_yellow_rust',
      cropId: 'wheat',
      name: 'गेहूं का पीला रतुआ (हल्दी रोग)',
      vernacularName: 'पीला रतुआ / स्ट्राइप रस्ट',
      scientificName: 'Puccinia striiformis',
      pathogenType: 'fungus',
      pathogenLabel: 'कवक जनित रोग (पक्सीनिया)',
      observedSymptoms: ['पत्तियों पर नसों के समानांतर चमकीली पीली धारियों में पाउडर के दाने।', 'पत्ती छूने पर उंगलियों पर हल्दी जैसा पीला पाउडर लग जाता है।'],
      typicalSymptoms: ['पत्तियों पर सीधी पीली पट्टियां जिनमें पीला चूर्ण भरा होता है।', 'झंडा पत्ती (फ्लैग लीफ) सूख जाती है और दाने सिकुड़ जाते हैं।'],
      possibleCauses: ['ठंडा मौसम (10-18°C), अधिक नमी, कोहरा और सुबह की भारी ओस।'],
      spreadConditions: 'हवा द्वारा मीलों दूर से कवक के बीजाणु तेजी से फैलते हैं।',
      potentialDamage: 'झंडा पत्ती खराब होने पर 40-70% तक पैदावार घट सकती है।',
      primaryTreatment: {
        title: 'प्रणालीगत ट्रायज़ोल कवकनाशी का छिड़काव',
        activeIngredient: 'प्रोपिकोनाज़ोल 25% ईसी अथवा टेबुकोनाज़ोल 25.9% ईसी',
        formulation: 'इमल्सीफायबल कॉन्संट्रेट (EC)',
        whyAppropriate: 'आईसीएआर-आईआईडब्ल्यूबीआर (IIWBR) द्वारा अनुशंसित सबसे प्रभावी दवा।',
        howItWorks: 'कवक की कोशिकाओं को नष्ट कर 48 घंटे में रतुआ को सुखा देती है।',
        applicationMethod: 'पत्तियों पर एकसમાન छिड़काव करें।',
        dosageAndDilution: '1.0 मिली प्रति लीटर पानी (200 मिली प्रति एकड़ 200 लीटर पानी में)।',
        safetyPrecautions: 'दवा शरीर पर न लगने दें।',
        protectiveEquipment: 'दस्ताने, मास्क और चश्मा।',
        preHarvestInterval: 'कटाई पूर्व प्रतीक्षा अवधि: 30 दिन।',
        applicationRestrictions: 'मौसम में 2 से अधिक बार न करें।',
        followUpMonitoring: '4-5 दिन बाद देखें कि पीली धारियां काली पड़कर सूख गई हैं या नहीं।',
      },
      organicTreatment: {
        title: 'जैविक व पारंपरिक बचाव',
        biologicalControl: 'ट्राइकोडर्मा विरिडी 5 ग्राम प्रति लीटर।',
        organicSpray: 'घुलनशील सल्फर 80% (2 ग्राम/लीटर)।',
        culturalPractices: 'पीला रतुआ रोधी किस्मों की ही बुवाई करें।',
        sanitation: 'खेत के आसपास के खरपतवार नष्ट करें।',
        preventiveManagement: 'समय पर बुवाई करें।',
      },
      alternativeTreatments: [
        {
          name: 'मैंकोज़ेब 75% डब्ल्यूपी',
          activeIngredient: 'मैंकोज़ेब 75% डब्ल्यूपी',
          whySuitable: 'प्रारंभिक अवस्था में सुरक्षात्मक छिड़काव।',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['पीली धारी दिखते ही प्रोपिकोनाज़ोल छिड़कें।', 'खेत की निगरानी बढ़ाएं।'],
        preventiveSteps: ['रोगरोधी बीज बोएं।', 'संतुलित खाद दें।'],
        monitoringSchedule: 'दिसंबर-जनवरी में हर 3 दिन में खेत देखें।',
        whenToConsultExpert: 'पीला रतुआ दिखने पर तुरंत कृषि अधिकारी को सूचित करें।',
      },
      overviewSummary: 'गेहूं का पीला रतुआ पत्तियों पर हल्दी जैसी पीली धारियां बनाता है। प्रोपिकोनाज़ोल का तुरंत छिड़काव पैदावार को सुरक्षित रखता है।',
    },
    gu: {
      id: 'wheat_yellow_rust',
      cropId: 'wheat',
      name: 'ઘઉંનો પીળો ગેરુ (હળદરીયો રોગ)',
      vernacularName: 'પીળો ગેરુ / પટ્ટી ગેરુ',
      scientificName: 'Puccinia striiformis',
      pathogenType: 'fungus',
      pathogenLabel: 'ફૂગજન્ય રોગ (પક્ષિનિયા ફૂગ)',
      observedSymptoms: ['પાંદડા પર નસોની સમાંતર સીધી પીળી પટ્ટીઓમાં પાવડરના ફોલ્લા.', 'પાંદડું અડકવાથી આંગળીઓ પર હળદર જેવો પીળો પાવડર ચોંટી જાય છે.'],
      typicalSymptoms: ['પાંદડા પર લાંબી પીળી પટ્ટીઓ અને ફૂગનો પીળો પાવડર.', 'ધ્વજ પર્ણ (ફ્લેગ લીફ) સુકાઈ જવું અને દાણા ચીમળાઈ જવા.'],
      possibleCauses: ['ઠંડુ વાતાવરણ (10-18°C), હવામાં વધુ ભેજ, ધુમ્મસ અને સવારનું ઝાકળ.'],
      spreadConditions: 'પવન દ્વારા સેંકડો કિલોમીટર દૂરથી પણ આ ફૂગના રજકણો ફેલાઈ શકે છે.',
      potentialDamage: 'જો ટોચનું પાન સુકાઈ જાય તો 40-70% જેટલું ઉત્પાદન ઘટી શકે છે.',
      primaryTreatment: {
        title: 'પ્રણાલીગત ફૂગનાશકનો છંટકાવ',
        activeIngredient: 'પ્રોપિકોનાઝોલ 25% ઈસી અથવા ટેબુકોનાઝોલ 25.9% ઈસી',
        formulation: 'ઈમલ્સિફાયેબલ કોન્સન્ટ્રેટ (EC)',
        whyAppropriate: 'આઈસીએઆર ઘઉં સંશોધન સંસ્થા દ્વારા ભલામણ કરેલ શ્રેષ્ઠ ફૂગનાશક.',
        howItWorks: 'ફૂગના કોષોનો નાશ કરીને 48 કલાકમાં પીળા ગેરુને સૂકવી નાખે છે.',
        applicationMethod: 'પાંદડા પર સમાન રીતે છંટકાવ કરવો.',
        dosageAndDilution: '1.0 મિલી પ્રતિ લિટર પાણી (200 મિલી પ્રતિ એકર 200 લિટર પાણીમાં).',
        safetyPrecautions: 'તીવ્ર ઠંડી કે ઝાકળ હોય ત્યારે છંટકાવ ટાળવો.',
        protectiveEquipment: 'મોજાં, માસ્ક અને ચશ્મા.',
        preHarvestInterval: 'લણણી પહેલાંનો ગાળો: 30 દિવસ.',
        applicationRestrictions: 'મોસમમાં 2 થી વધુ વખત ન છાંટવું.',
        followUpMonitoring: '4-5 દિવસ પછી તપાસો કે પીળી પટ્ટીઓ કાળી પડીને સુકાઈ ગઈ છે કે નહીં.',
      },
      organicTreatment: {
        title: 'જૈવિક અને દેશી રક્ષણ',
        biologicalControl: 'ટ્રાઇકોડર્મા વિરીડી 5 ગ્રામ પ્રતિ લિટર.',
        organicSpray: 'દ્રાવ્ય ગંધક (સલ્ફર 80%) 2 ગ્રામ પ્રતિ લિટર.',
        culturalPractices: 'ગેરુ પ્રતિકારક જાતોનું જ વાવેતર કરવું.',
        sanitation: 'શેઢા-પાળા ચોખ્ખા રાખવા.',
        preventiveManagement: 'સમયસર વાવણી કરવી.',
      },
      alternativeTreatments: [
        {
          name: 'મેન્કોઝેબ 75% ડબલ્યુપી',
          activeIngredient: 'મેન્કોઝેબ 75% ડબલ્યુપી',
          whySuitable: 'રોગની શરૂઆતમાં રક્ષણાત્મક છંટકાવ.',
        },
      ],
      preventionAndMonitoring: {
        immediateActions: ['પીળી પટ્ટી દેખાય કે તુરંત પ્રોપિકોનાઝોલ છાંટો.', 'ખેતરની સતત દેખરેખ રાખો.'],
        preventiveSteps: ['પ્રમાણિત પ્રતિકારક બિયારણ વાપરવું.', 'સમતોલ ખાતર આપવું.'],
        monitoringSchedule: 'ઠંડી ઋતુમાં દર 3 દિવસે ખેતર તપાસવું.',
        whenToConsultExpert: 'પીળો ગેરુ દેખાય તો તુરંત ગ્રામસેવક કે KVK ને જાણ કરવી.',
      },
      overviewSummary: 'ઘઉંનો પીળો ગેરુ પાન પર હળદર જેવી પીળી પટ્ટીઓ બનાવે છે. પ્રોપિકોનાઝોલનો સમયસર છંટકાવ કરવાથી ઘઉંનું ઉત્પાદન સુરક્ષિત રહે છે.',
    },
  },
};

// -----------------------------------------------------------------------------
// HELPER TO DYNAMICALLY LOCALIZE ANY DIAGNOSIS RESULT IN REAL TIME
// -----------------------------------------------------------------------------

export function getLocalizedDiagnosis(
  diagnosis: any,
  locale: SupportedLocale = 'en'
): any {
  if (!diagnosis) return null;

  // Resolve canonical disease ID
  let canonicalId = diagnosis.predictedLabel || '';
  if (!LOCALIZED_DISEASE_CATALOG[canonicalId]) {
    // Normalization mapping
    const norm = String(canonicalId).toLowerCase();
    if (norm.includes('cotton') && norm.includes('blight') && !norm.includes('bacterial')) {
      canonicalId = 'cotton_leaf_blight';
    } else if (norm.includes('cotton') && norm.includes('bacterial')) {
      canonicalId = 'cotton_bacterial_blight';
    } else if (norm.includes('cotton') && (norm.includes('healthy') || diagnosis.isHealthy)) {
      canonicalId = 'cotton_healthy';
    } else if (norm.includes('rice') && norm.includes('blast')) {
      canonicalId = 'rice_blast';
    } else if (norm.includes('wheat') && (norm.includes('yellow') || norm.includes('stripe'))) {
      canonicalId = 'wheat_yellow_rust';
    }
  }

  // Fallback to cotton_leaf_blight if diseased cotton or cotton_healthy if healthy
  if (!LOCALIZED_DISEASE_CATALOG[canonicalId]) {
    if (diagnosis.isHealthy) {
      canonicalId = 'cotton_healthy';
    } else {
      canonicalId = 'cotton_leaf_blight';
    }
  }

  const catalogEntry = LOCALIZED_DISEASE_CATALOG[canonicalId]?.[locale] ||
    LOCALIZED_DISEASE_CATALOG[canonicalId]?.en ||
    LOCALIZED_DISEASE_CATALOG.cotton_leaf_blight[locale];

  // Resolve crop name
  const cropId = catalogEntry.cropId;
  const cropMeta = AGRICULTURAL_CROPS[locale]?.[cropId] || AGRICULTURAL_CROPS.en[cropId];

  // Severity label
  const severityKey = diagnosis.severity || (diagnosis.isHealthy ? 'none' : 'moderate');
  const localizedSeverity = SEVERITY_LABELS[locale]?.[severityKey] || SEVERITY_LABELS.en[severityKey];

  // Pathogen label
  const pathogenKey = catalogEntry.pathogenType;
  const localizedPathogen = PATHOGEN_TYPE_LABELS[locale]?.[pathogenKey] || PATHOGEN_TYPE_LABELS.en[pathogenKey];

  // Localized recommendations
  let localizedRecommendations = diagnosis.recommendations;
  if (diagnosis.recommendations?.medicines) {
    localizedRecommendations = {
      ...diagnosis.recommendations,
      medicines: diagnosis.recommendations.medicines.map((med: any) => {
        let localizedWhy = med.whyRecommended;
        if (locale === 'gu') {
          localizedWhy = `ભલામણ કરેલ કારણ કે આ દવામાં રહેલ સક્રિય ઘટક (${med.activeIngredient}) આ પાક પરના નિદાન થયેલ રોગ સામે સીઆઈબીઆરસી (CIBRC) દ્વારા પ્રમાણિત છે.`;
        } else if (locale === 'hi') {
          localizedWhy = `सुझाया गया क्योंकि इसमें उपस्थित सक्रिय घटक (${med.activeIngredient}) इस फसल के निदान किए गए रोग हेतु सीआईबीआरसी (CIBRC) द्वारा पंजीकृत है।`;
        }
        return {
          ...med,
          whyRecommended: localizedWhy,
        };
      }),
    };
  }

  return {
    ...diagnosis,
    crop: cropMeta?.name || diagnosis.crop,
    cropScientificName: cropMeta?.scientificName,
    cropCategory: cropMeta?.category,
    disease: catalogEntry.name,
    vernacularName: catalogEntry.vernacularName,
    scientificName: catalogEntry.scientificName,
    pathogenType: catalogEntry.pathogenType,
    pathogenLabel: localizedPathogen,
    severityLabel: localizedSeverity,
    overviewSummary: catalogEntry.overviewSummary,
    observedSymptoms: catalogEntry.observedSymptoms,
    typicalSymptoms: catalogEntry.typicalSymptoms,
    possibleCauses: catalogEntry.possibleCauses,
    spreadConditions: catalogEntry.spreadConditions,
    potentialDamage: catalogEntry.potentialDamage,
    primaryTreatment: catalogEntry.primaryTreatment,
    organicTreatment: catalogEntry.organicTreatment,
    alternativeTreatments: catalogEntry.alternativeTreatments,
    preventionAndMonitoring: catalogEntry.preventionAndMonitoring,
    recommendations: localizedRecommendations,
    // Dynamic explanation localized
    explanation: catalogEntry.overviewSummary,
  };
}

