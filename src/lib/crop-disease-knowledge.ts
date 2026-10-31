/**
 * SmartFarm AI — Agronomic Pathology Knowledge Base
 * 
 * Comprehensive, verified agronomic reference for all 38 PlantVillage benchmark classes.
 * Covers symptoms, etiology, spread conditions, organic treatments, chemical controls,
 * safety precautions, and expert consultation triggers.
 */

export interface AgronomicDiseaseInfo {
  label: string;
  crop: string;
  disease: string;
  isHealthy: boolean;
  pathogenType: 'fungus' | 'bacterium' | 'virus' | 'pest' | 'none';
  pathogenName?: string;
  defaultSeverity: 'mild' | 'moderate' | 'severe' | 'none';
  symptoms: string[];
  possibleCauses: string[];
  spreadConditions: string;
  immediatePrevention: string[];
  recommendedTreatment: string;
  organicOptions: string[];
  chemicalOptions: string[];
  chemicalPrecautions: string;
  monitoringSchedule: string;
  whenToConsultExpert: string;
}

export const SUPPORTED_BENCHMARK_CROPS = [
  'Apple',
  'Blueberry',
  'Cherry',
  'Corn (Maize)',
  'Grape',
  'Orange',
  'Peach',
  'Bell Pepper',
  'Potato',
  'Raspberry',
  'Soybean',
  'Squash',
  'Strawberry',
  'Tomato',
] as const;

export const UNSUPPORTED_COMMON_CROPS = [
  'Cotton',
  'Wheat',
  'Rice (Paddy)',
  'Sugarcane',
  'Groundnut',
  'Mustard',
  'Gram (Chickpea)',
  'Pigeon Pea (Tur)',
  'Millet (Bajra)',
] as const;

export const PLANT_VILLAGE_PATHOLOGY: Record<string, AgronomicDiseaseInfo> = {
  // Apple
  'Apple___Apple_scab': {
    label: 'Apple___Apple_scab',
    crop: 'Apple',
    disease: 'Apple scab',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Venturia inaequalis',
    defaultSeverity: 'moderate',
    symptoms: [
      'Olive-green to velvety dark brown lesions on upper leaf surfaces',
      'Leaves develop puckering and distortion',
      'Premature defoliation in severe infections',
      'Corky, dark lesions on fruit surfaces'
    ],
    possibleCauses: [
      'Overwintering fungal ascospores in fallen orchard leaf litter',
      'Prolonged leaf wetness (>9 hours) during spring bud break',
      'Poor canopy air circulation and dense branch canopy'
    ],
    spreadConditions: 'Cool, wet spring conditions with temperatures between 15°C and 22°C and continuous rainfall or overhead sprinkler irrigation.',
    immediatePrevention: [
      'Rake, collect, and compost or destroy all fallen orchard leaves in autumn',
      'Prune branches to open up canopy and promote rapid leaf drying',
      'Switch from overhead sprinkler irrigation to ground drip irrigation'
    ],
    recommendedTreatment: 'Apply protective bio-fungicide during early green-tip to pink bud stages. Remove heavily affected leaves from small trees.',
    organicOptions: [
      'Liquid Copper Soap (copper octanoate) applied before rain events',
      'Sulfur dust or wettable sulfur (avoid application when temperature > 28°C)',
      'Bacillus subtilis strain QST 713 foliar bio-spray'
    ],
    chemicalOptions: [
      'Captan 50 WP (2 g/L water) as protective cover spray',
      'Mancozeb 75 WP (2.5 g/L water) during early leaf emergence',
      'Difenoconazole 25 EC (0.5 mL/L water) for systemic curative action'
    ],
    chemicalPrecautions: 'Wear gloves, mask, and goggles. Adhere to 14-day Pre-Harvest Interval (PHI). Do not spray during honeybee activity hours.',
    monitoringSchedule: 'Inspect terminal shoots and underside of new spur leaves every 3 to 4 days during rainy spells.',
    whenToConsultExpert: 'Consult local KVK if more than 20% of spur leaves display olive lesions or if resistance to DMI/strobilurin fungicides is suspected.'
  },
  'Apple___Black_rot': {
    label: 'Apple___Black_rot',
    crop: 'Apple',
    disease: 'Black rot',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Diplodia seriata (Botryosphaeria obtusa)',
    defaultSeverity: 'severe',
    symptoms: [
      'Frogeye leaf spots: small purple specks expanding to circular spots with tan centers and purple margins',
      'Black sunken bark cankers on limbs',
      'Firm brown fruit rot with concentric rings turning completely mummified and black'
    ],
    possibleCauses: [
      'Fungal spores overwintering in dead wood, pruning stubs, and mummified fruit',
      'Entry through bark wounds, freeze damage, or insect feeding punctures'
    ],
    spreadConditions: 'Warm, humid weather (20°C to 27°C) with persistent moisture and splashing rain.',
    immediatePrevention: [
      'Prune out dead wood, cankered limbs, and mummified apples at least 15cm below the margin',
      'Sterilize pruning shears between cuts with 70% isopropyl alcohol',
      'Burn or safely bury pruned infected wood'
    ],
    recommendedTreatment: 'Aggressive sanitary pruning followed by protective fungicide spray covering foliage and main scaffolds.',
    organicOptions: [
      'Bordeaux mixture (4:4:50) dormant spray before bud swell',
      'Copper hydroxide or copper oxychloride 50 WP'
    ],
    chemicalOptions: [
      'Thiophanate-methyl 70 WP (1 g/L water)',
      'Captan 50 WP (2 g/L water)'
    ],
    chemicalPrecautions: 'Avoid inhalation. Keep off skin. Ensure minimum 21 days PHI before harvest.',
    monitoringSchedule: 'Weekly scaffold and branch inspection for fresh weeping cankers.',
    whenToConsultExpert: 'If cankers encircle main trunks or structural scaffold limbs.'
  },
  'Apple___Cedar_apple_rust': {
    label: 'Apple___Cedar_apple_rust',
    crop: 'Apple',
    disease: 'Cedar apple rust',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Gymnosporangium juniperi-virginianae',
    defaultSeverity: 'moderate',
    symptoms: [
      'Bright yellow-orange spots on upper leaf surfaces in late spring',
      'Small black raised specks (pycnia) within the center of orange spots',
      'Tube-like aecia structures forming on the leaf underside'
    ],
    possibleCauses: [
      'Obligate alternate host cycle requiring Eastern Red Cedar or Juniper trees nearby',
      'Windblown aeciospores from cedar galls after warm spring rains'
    ],
    spreadConditions: 'Warm rains (13°C to 24°C) causing gelatinous spore horns to expand on nearby cedar trees.',
    immediatePrevention: [
      'Remove wild cedar and juniper bushes within 300 to 500 meters of the orchard',
      'Plant rust-resistant apple cultivars (e.g., Liberty, Freedom, Enterprise)'
    ],
    recommendedTreatment: 'Apply protective sprays from pink bud until 2 to 3 weeks after petal fall.',
    organicOptions: [
      'Wettable sulfur sprays applied early spring',
      'Serenade Garden (Bacillus subtilis)'
    ],
    chemicalOptions: [
      'Myclobutanil 10 WP (0.4 g/L water)',
      'Mancozeb 75 WP (2 g/L water) pre-bloom'
    ],
    chemicalPrecautions: 'Do not use Mancozeb within 77 days of apple harvest in commercial production.',
    monitoringSchedule: 'Check young leaves weekly for bright orange lesions during early fruit sizing.',
    whenToConsultExpert: 'When defoliation exceeds 25% or fruit calyx lobes show rust cups.'
  },
  'Apple___healthy': {
    label: 'Apple___healthy',
    crop: 'Apple',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Uniform green leaf coloration', 'Intact margins with healthy venation', 'No necrotic lesions or fungal sporulation'],
    possibleCauses: ['Adequate nutrition', 'Balanced watering', 'Clean orchard management'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain regular scouting', 'Maintain balanced N-P-K fertilization and calcium foliar sprays'],
    recommendedTreatment: 'No curative action needed. Continue routine cultural maintenance.',
    organicOptions: ['Preventive neem cake application in soil', 'Compost tea foliar drench'],
    chemicalOptions: ['No chemical sprays required.'],
    chemicalPrecautions: 'None required.',
    monitoringSchedule: 'Fortnightly routine scouting.',
    whenToConsultExpert: 'Routine seasonal extension advisory only.'
  },

  // Corn (Maize)
  'Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot': {
    label: 'Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot',
    crop: 'Corn (Maize)',
    disease: 'Cercospora leaf spot (Gray leaf spot)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Cercospora zeae-maydis',
    defaultSeverity: 'moderate',
    symptoms: [
      'Narrow rectangular lesions bounded by leaf veins',
      'Lesions turn grayish-tan to brown with age',
      'Blighting of extensive leaf area starting from lower canopy'
    ],
    possibleCauses: [
      'Infected maize residue left on soil surface from continuous no-till corn cropping',
      'Spore dispersal by wind and rain splash'
    ],
    spreadConditions: 'High relative humidity (>90%) with warm temperatures (25°C to 32°C) and cloudy days.',
    immediatePrevention: [
      'Rotate crops with non-grasses (soybean, groundnut, pulses) for at least 2 seasons',
      'Tillage to bury infected corn stover where soil conservation permits',
      'Plant hybrids with certified gray leaf spot resistance ratings'
    ],
    recommendedTreatment: 'Foliar fungicide application if disease advances to ear leaf before tasseling (VT/R1).',
    organicOptions: [
      'Trichoderma harzianum soil and foliar bio-application',
      'Pseudomonas fluorescens 10g/L spray'
    ],
    chemicalOptions: [
      'Azoxystrobin + Difenoconazole (Amistar Top) @ 1 mL/L water',
      'Pyraclostrobin 20% WG @ 1 g/L water'
    ],
    chemicalPrecautions: 'Observe 30-day PHI for grain harvest. Avoid spraying in high wind.',
    monitoringSchedule: 'Check the 3rd leaf below the ear shoot twice weekly during silking.',
    whenToConsultExpert: 'If lesions reach the ear leaf or higher before the dough stage (R4).'
  },
  'Corn_(maize)___Common_rust_': {
    label: 'Corn_(maize)___Common_rust_',
    crop: 'Corn (Maize)',
    disease: 'Common rust',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Puccinia sorghi',
    defaultSeverity: 'mild',
    symptoms: [
      'Circular to elongate golden-brown to cinnamon-brown powdery pustules',
      'Pustules occur on both upper and lower leaf surfaces',
      'Chlorotic halos surrounding older erupting pustules'
    ],
    possibleCauses: ['Airborne urediniospores blown from southern warmer agricultural zones'],
    spreadConditions: 'Moderate temperatures (16°C to 24°C) and high humidity (>95%) with frequent dew.',
    immediatePrevention: ['Plant resistant corn hybrids', 'Early planting to avoid peak spore flights'],
    recommendedTreatment: 'Typically economic threshold is not reached unless rust appears before tasseling.',
    organicOptions: ['Wettable sulfur spray @ 2 g/L water'],
    chemicalOptions: ['Mancozeb 75 WP @ 2.5 g/L water', 'Propiconazole 25 EC @ 1 mL/L water'],
    chemicalPrecautions: 'Ensure full coverage of both leaf surfaces. Observe 14-day PHI.',
    monitoringSchedule: 'Weekly visual inspection of mid-canopy leaves.',
    whenToConsultExpert: 'If pustules cover more than 10% of total leaf area prior to silking.'
  },
  'Corn_(maize)___Northern_Leaf_Blight': {
    label: 'Corn_(maize)___Northern_Leaf_Blight',
    crop: 'Corn (Maize)',
    disease: 'Northern Leaf Blight',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Exserohilum turcicum',
    defaultSeverity: 'severe',
    symptoms: [
      'Long, elliptical cigar-shaped grayish-green to tan lesions (2.5 to 15 cm)',
      'Dark fungal sporulation inside lesions in humid conditions',
      'Extensive blighting causing plants to look frosted or burnt'
    ],
    possibleCauses: ['Infected corn residue remaining on soil surface', 'Susceptible monoculture hybrid'],
    spreadConditions: 'Moderate temperatures (18°C to 27°C) accompanied by extended periods of dew or rain.',
    immediatePrevention: ['Deep burial of crop debris post-harvest', 'Two-year crop rotation out of corn'],
    recommendedTreatment: 'Foliar fungicide application if lesions appear on third leaf below ear at tasseling.',
    organicOptions: ['Foliar bio-fungicide Bacillus amyloliquefaciens', 'Trichoderma viride spray'],
    chemicalOptions: ['Mancozeb 75 WP @ 2.5 g/L', 'Tebuconazole 25.9 EC @ 1 mL/L'],
    chemicalPrecautions: 'Wear mask. Do not apply near water bodies.',
    monitoringSchedule: 'Inspect lower to middle leaves every 5 days around V8 to VT stages.',
    whenToConsultExpert: 'If cigar lesions appear on the ear leaf before or during pollination.'
  },
  'Corn_(maize)___healthy': {
    label: 'Corn_(maize)___healthy',
    crop: 'Corn (Maize)',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Broad, vigorous deep green leaves', 'Clean midribs without pustules or necrosis'],
    possibleCauses: ['Proper soil nitrogen levels', 'Adequate root moisture'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain side-dress nitrogen schedule and scouting.'],
    recommendedTreatment: 'No curative action needed.',
    organicOptions: ['Soil health maintenance via green manuring.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Routine weekly scouting.',
    whenToConsultExpert: 'Seasonal agronomic check.'
  },

  // Potato
  'Potato___Early_blight': {
    label: 'Potato___Early_blight',
    crop: 'Potato',
    disease: 'Early blight',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Alternaria solani',
    defaultSeverity: 'moderate',
    symptoms: [
      'Dark brown to black spots with characteristic concentric rings (target-board appearance)',
      'Yellow chlorotic halos surrounding lesions',
      'Starts on older, lower foliage and progresses upwards'
    ],
    possibleCauses: ['Fungus survives in soil and solanaceous crop debris', 'Plant stress from nitrogen deficiency or drought'],
    spreadConditions: 'Alternating wet and dry periods with warm temperatures (24°C to 29°C).',
    immediatePrevention: [
      'Maintain adequate balanced nitrogen fertilization to avoid premature leaf senescence',
      'Avoid overhead sprinkler irrigation; use drip irrigation',
      'Practice 3-year crop rotation without potatoes, tomatoes, or eggplants'
    ],
    recommendedTreatment: 'Begin protective fungicide sprays when lower canopy shows target spots.',
    organicOptions: ['Copper oxychloride 50 WP @ 3 g/L', 'Neem seed kernel extract (NSKE 5%)'],
    chemicalOptions: ['Mancozeb 75 WP @ 2.5 g/L', 'Chlorothalonil 75 WP @ 2 g/L', 'Difenoconazole 25 EC @ 0.5 mL/L'],
    chemicalPrecautions: 'Adhere to 7-day PHI. Wash hands thoroughly with soap after handling.',
    monitoringSchedule: 'Examine lower leaves every 3 days after canopy closure.',
    whenToConsultExpert: 'When target lesions climb into upper canopy during tuber bulking.'
  },
  'Potato___Late_blight': {
    label: 'Potato___Late_blight',
    crop: 'Potato',
    disease: 'Late blight',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Phytophthora infestans (Oomycete)',
    defaultSeverity: 'severe',
    symptoms: [
      'Water-soaked pale green to dark brown irregular lesions with pale green borders',
      'White cottony fungal growth on underside of leaves in humid conditions',
      'Rapid rotting of leaves, petioles, and stems with foul odor',
      'Dry, granular reddish-brown rot on tuber skin'
    ],
    possibleCauses: ['Infected seed tubers (primary inoculum source)', 'Cull piles and volunteer potato plants nearby'],
    spreadConditions: 'Cool, wet, cloudy weather with temperatures between 10°C and 20°C and relative humidity >90%.',
    immediatePrevention: [
      'Plant only certified disease-free seed tubers',
      'Destroy all cull piles and volunteer potatoes before planting season',
      'Hill up tubers well to prevent rain-washed zoospores from reaching tubers'
    ],
    recommendedTreatment: 'IMMEDIATE application of systemic oomycete fungicide upon earliest symptom sighting. Delay of 24h can cause complete crop loss.',
    organicOptions: ['Bordeaux mixture (1%) preventive spray before disease onset', 'Copper hydroxide @ 2 g/L'],
    chemicalOptions: [
      'Metalaxyl + Mancozeb (Ridomil MZ 68 WG) @ 2.5 g/L',
      'Cymoxanil + Mancozeb (Curzate) @ 2.5 g/L',
      'Dimethomorph 50 WP @ 1 g/L'
    ],
    chemicalPrecautions: 'Alternate chemical classes to prevent resistance. Strictly observe 14-day PHI.',
    monitoringSchedule: 'Daily field scouting under foggy, overcast, or rainy conditions.',
    whenToConsultExpert: 'IMMEDIATELY contact local KVK / District Agricultural Officer upon seeing white downy growth.'
  },
  'Potato___healthy': {
    label: 'Potato___healthy',
    crop: 'Potato',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Lush dark green compound leaves', 'Sturdy upright stems with no dark lesions'],
    possibleCauses: ['Optimal moisture and fertility', 'Certified seed stock'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain regular preventive scouting and hill up rows.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Bio-fertilizer root dip.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Twice-weekly scouting.',
    whenToConsultExpert: 'Routine advisory.'
  },

  // Tomato
  'Tomato___Bacterial_spot': {
    label: 'Tomato___Bacterial_spot',
    crop: 'Tomato',
    disease: 'Bacterial spot',
    isHealthy: false,
    pathogenType: 'bacterium',
    pathogenName: 'Xanthomonas perforans / euvesicatoria',
    defaultSeverity: 'moderate',
    symptoms: [
      'Small, circular dark brown to black water-soaked spots (1-3 mm)',
      'Spots develop a greasy texture and may have a faint yellow halo',
      'Severely spotted leaves turn brown and drop, exposing fruit to sunscald',
      'Small raised scabby spots on fruit'
    ],
    possibleCauses: ['Contaminated seed or transplants', 'Bacteria splashed by rain or overhead irrigation', 'Entry via stomata or wounds'],
    spreadConditions: 'Warm temperatures (24°C to 30°C) with frequent rainfall, overhead irrigation, and high humidity.',
    immediatePrevention: [
      'Use certified disease-free seeds treated with hot water (50°C for 25 min)',
      'Avoid working in wet fields to prevent mechanical spread',
      'Drip irrigation only; eliminate overhead sprinkling'
    ],
    recommendedTreatment: 'Apply copper-mancozeb combination tank mix; synthetic bactericides have limited curative power.',
    organicOptions: ['Copper sulfate soap', 'Bacillus subtilis strain QST 713 foliar bio-spray'],
    chemicalOptions: [
      'Copper oxychloride 50 WP (2.5 g/L) + Streptocycline (100 ppm / 0.1 g/L water)',
      'Kasugamycin 3% SL (1.5 mL/L water)'
    ],
    chemicalPrecautions: 'Streptocycline must only be used in strict adherence to local agricultural regulations.',
    monitoringSchedule: 'Inspect underside of foliage every 3 to 4 days during rainy warm periods.',
    whenToConsultExpert: 'If lesions spread rapidly despite copper applications.'
  },
  'Tomato___Early_blight': {
    label: 'Tomato___Early_blight',
    crop: 'Tomato',
    disease: 'Early blight',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Alternaria linariae (A. solani)',
    defaultSeverity: 'moderate',
    symptoms: [
      'Dark brown concentric ring spots (target-pattern) on older lower leaves',
      'Yellowing of surrounding tissue and leaf collapse',
      'Dark, leathery sunken lesions at the stem end of green or ripe fruit'
    ],
    possibleCauses: ['Spore survival in tomato plant residue', 'Nutritional stress and high humidity'],
    spreadConditions: 'Warm, humid weather (24°C to 29°C) with dew or rain.',
    immediatePrevention: [
      'Prune lower leaves up to 30 cm from soil after first fruit cluster sets',
      'Apply straw or plastic mulch to prevent soil splashing onto leaves',
      'Stake or trellis plants to maintain vertical airflow'
    ],
    recommendedTreatment: 'Prune infected lower foliage immediately and apply protective contact fungicide.',
    organicOptions: ['Neem oil 0.5%', 'Trichoderma viride foliar spray @ 5 g/L'],
    chemicalOptions: ['Mancozeb 75 WP @ 2.5 g/L', 'Azoxystrobin 23 SC @ 1 mL/L', 'Chlorothalonil 75 WP @ 2 g/L'],
    chemicalPrecautions: 'Observe 5-day PHI for tomato harvest. Wear full PPE.',
    monitoringSchedule: 'Inspect lower foliage every 3 days.',
    whenToConsultExpert: 'If defoliation reaches middle canopy prior to fruit ripening.'
  },
  'Tomato___Late_blight': {
    label: 'Tomato___Late_blight',
    crop: 'Tomato',
    disease: 'Late blight',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Phytophthora infestans',
    defaultSeverity: 'severe',
    symptoms: [
      'Large, irregular water-soaked greasy gray-green to brown lesions',
      'White downy fungal growth on lower leaf surfaces under high humidity',
      'Rapid stem and petiole collapse turning brown to black',
      'Large firm golden-brown to dark lesions on fruit'
    ],
    possibleCauses: ['Windborne sporangia from infected potato fields or volunteer tomato plants nearby'],
    spreadConditions: 'Cool (10°C to 20°C), moist, foggy, or persistently rainy weather.',
    immediatePrevention: [
      'Destroy volunteer tomato and potato plants in the vicinity',
      'Ensure wide plant spacing for rapid canopy drying'
    ],
    recommendedTreatment: 'Immediate emergency spray with translaminar/systemic oomycete fungicide.',
    organicOptions: ['Bordeaux mixture (1%) preventive application', 'Copper hydroxide 53.8% DF'],
    chemicalOptions: [
      'Cymoxanil 8% + Mancozeb 64% WP @ 2.5 g/L',
      'Dimethomorph 50% WP @ 1 g/L',
      'Famoxadone + Cymoxanil @ 1 g/L'
    ],
    chemicalPrecautions: 'Strict 7-day PHI. Do not let spray drift into water bodies.',
    monitoringSchedule: 'Daily scouting during cool, overcast, damp periods.',
    whenToConsultExpert: 'IMMEDIATELY upon visual confirmation of white downy sporulation.'
  },
  'Tomato___Leaf_Mold': {
    label: 'Tomato___Leaf_Mold',
    crop: 'Tomato',
    disease: 'Leaf Mold',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Passalora fulva (Cladosporium fulvum)',
    defaultSeverity: 'moderate',
    symptoms: [
      'Pale green or yellowish spots with indefinite margins on upper leaf surfaces',
      'Olive-green to velvety brown mold growth on corresponding lower leaf surface',
      'Leaves curl, wither, and drop prematurely'
    ],
    possibleCauses: ['Common in polyhouses, greenhouses, or dense high-tunnel crops with poor ventilation'],
    spreadConditions: 'High relative humidity (>85%) with moderate temperatures (21°C to 24°C).',
    immediatePrevention: [
      'Maximize greenhouse/polyhouse ventilation using circulating fans',
      'Increase plant spacing and prune lower suckers'
    ],
    recommendedTreatment: 'Improve ventilation to reduce relative humidity below 80%. Apply protective fungicide.',
    organicOptions: ['Bio-fungicide Bacillus subtilis', 'Copper soap spray'],
    chemicalOptions: ['Difenoconazole 25 EC @ 0.5 mL/L', 'Mancozeb 75 WP @ 2 g/L'],
    chemicalPrecautions: 'Ensure full coverage of undersides of leaves where mold grows.',
    monitoringSchedule: 'Check greenhouse canopy weekly.',
    whenToConsultExpert: 'If mold covers more than 30% of foliage in commercial greenhouse.'
  },
  'Tomato___Septoria_leaf_spot': {
    label: 'Tomato___Septoria_leaf_spot',
    crop: 'Tomato',
    disease: 'Septoria leaf spot',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Septoria lycopersici',
    defaultSeverity: 'moderate',
    symptoms: [
      'Numerous small circular spots (1.5 to 3 mm) with dark brown margins and white/gray centers',
      'Tiny black specks (pycnidia) clearly visible in center of spots',
      'Severe lower leaf yellowing and complete defoliation'
    ],
    possibleCauses: ['Fungus overwinters in solanaceous weeds and previous year tomato debris'],
    spreadConditions: 'Wet, warm weather (20°C to 25°C) with splashing rain or sprinkler irrigation.',
    immediatePrevention: [
      'Mulch heavily around base of plants',
      'Eradicate horsenettle and nightshade weeds near tomato plots',
      'Avoid overhead watering'
    ],
    recommendedTreatment: 'Prune heavily infected lower leaves and spray protective fungicide.',
    organicOptions: ['Copper oxychloride 50 WP @ 2.5 g/L', 'Neem oil spray'],
    chemicalOptions: ['Chlorothalonil 75 WP @ 2 g/L', 'Mancozeb 75 WP @ 2.5 g/L'],
    chemicalPrecautions: 'Ensure minimum 7 days PHI before picking.',
    monitoringSchedule: 'Examine lower canopy weekly.',
    whenToConsultExpert: 'When defoliation threatens fruit with sunscald.'
  },
  'Tomato___Spider_mites_Two-spotted_spider_mite': {
    label: 'Tomato___Spider_mites_Two-spotted_spider_mite',
    crop: 'Tomato',
    disease: 'Two-spotted spider mite',
    isHealthy: false,
    pathogenType: 'pest',
    pathogenName: 'Tetranychus urticae',
    defaultSeverity: 'moderate',
    symptoms: [
      'Fine white, yellow, or bronze stippling / speckling on upper leaf surfaces',
      'Delicate silken webbing on leaf undersides and shoot tips',
      'Leaves turn dry, papery, and drop under heavy infestation'
    ],
    possibleCauses: ['Hot, dry, dusty field conditions', 'Broad-spectrum pesticide overuse killing natural predatory mites'],
    spreadConditions: 'Hot (>30°C) and dry weather with dusty winds.',
    immediatePrevention: [
      'Avoid unnecessary broad-spectrum pyrethroid sprays that eliminate beneficial predators',
      'Maintain adequate irrigation; water-stressed plants are preferred mite hosts',
      'Wash dust off perimeter crop foliage with water spray'
    ],
    recommendedTreatment: 'Apply targeted miticide / acaricide with thorough under-leaf coverage.',
    organicOptions: [
      'Neem oil (Azadirachtin 10,000 ppm) @ 2 mL/L water',
      'Potassium salts of fatty acids (insecticidal soap) @ 5 mL/L',
      'Release predatory mites (Phytoseiulus persimilis)'
    ],
    chemicalOptions: [
      'Spiromesifen 22.9 SC @ 1 mL/L water',
      'Fenazaquin 10 EC @ 2 mL/L water',
      'Abamectin 1.9 EC @ 0.5 mL/L water'
    ],
    chemicalPrecautions: 'Do not spray during full bloom. Use fine droplets to coat leaf undersides.',
    monitoringSchedule: 'Check underside of leaves with 10x hand lens twice weekly in hot weather.',
    whenToConsultExpert: 'If webbing covers terminal shoots or mite counts exceed 10 mites per leaflet.'
  },
  'Tomato___Target_Spot': {
    label: 'Tomato___Target_Spot',
    crop: 'Tomato',
    disease: 'Target Spot',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Corynespora cassiicola',
    defaultSeverity: 'moderate',
    symptoms: [
      'Small pinpoint necrotic spots expanding into circular brown lesions with light brown centers',
      'Zonate markings that resemble a target',
      'Dark sunken pitted lesions on green and ripe fruit'
    ],
    possibleCauses: ['Airborne spores and survival in soil/crop residues across multiple weed species'],
    spreadConditions: 'Warm (20°C to 28°C) temperatures with high relative humidity and free moisture.',
    immediatePrevention: ['Improve airflow through trellising and pruning', 'Avoid excess nitrogen fertilizer'],
    recommendedTreatment: 'Foliar fungicide spray application targeting foliage and fruit clusters.',
    organicOptions: ['Copper octanoate', 'Bacillus amyloliquefaciens'],
    chemicalOptions: ['Azoxystrobin + Difenoconazole @ 1 mL/L', 'Pyraclostrobin 20 WG @ 1 g/L'],
    chemicalPrecautions: 'Comply with 7-day PHI. Wear protective clothing.',
    monitoringSchedule: 'Weekly leaf and fruit cluster check.',
    whenToConsultExpert: 'If target lesions appear directly on developing green fruit.'
  },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    label: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    crop: 'Tomato',
    disease: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    isHealthy: false,
    pathogenType: 'virus',
    pathogenName: 'Begomovirus (transmitted by Whitefly Bemisia tabaci)',
    defaultSeverity: 'severe',
    symptoms: [
      'Severe upward curling and cupping of leaflets',
      'Interveinal and marginal chlorosis (yellowing)',
      'Severe plant stunting with shortened internodes',
      'Blossom drop with negligible fruit set'
    ],
    possibleCauses: ['Transmitted persistently by the silverleaf whitefly (Bemisia tabaci)'],
    spreadConditions: 'Warm, dry weather facilitating large whitefly populations.',
    immediatePrevention: [
      'Plant TYLCV-resistant tomato hybrids (e.g., Abhinav, US-440, Saaho)',
      'Install yellow sticky traps (15-20 traps/acre) to monitor and mass-trap whiteflies',
      'Cover nursery seedlings with 40-50 mesh insect-proof netting',
      'Rogue out and destroy infected viral plants immediately'
    ],
    recommendedTreatment: 'NO chemical cure exists for viruses. Focus 100% on vector (whitefly) management and roguing.',
    organicOptions: [
      'Neem oil 10,000 ppm @ 2 mL/L water',
      'Verticillium lecanii (bio-insecticide) @ 5 g/L targeting whitefly nymphs'
    ],
    chemicalOptions: [
      'Diafenthiuron 50 WP @ 1.2 g/L for whitefly control',
      'Spirotetramat 15.31% w/w OD @ 1 mL/L',
      'Acetamiprid 20 SP @ 0.3 g/L'
    ],
    chemicalPrecautions: 'Do not spray when honeybees are foraging. Alternate chemical modes of action.',
    monitoringSchedule: 'Check yellow sticky traps and leaf undersides for whiteflies every 2 days.',
    whenToConsultExpert: 'When viral stunting appears before flowering in more than 5% of plants.'
  },
  'Tomato___Tomato_mosaic_virus': {
    label: 'Tomato___Tomato_mosaic_virus',
    crop: 'Tomato',
    disease: 'Tomato mosaic virus (ToMV)',
    isHealthy: false,
    pathogenType: 'virus',
    pathogenName: 'Tobamovirus',
    defaultSeverity: 'severe',
    symptoms: [
      'Mottled light and dark green mosaic pattern on leaves',
      'Leaf distortion, blistering, and fern-leaf (shoestring) appearance',
      'Internal browning of fruit wall and uneven ripening'
    ],
    possibleCauses: [
      'Extremely stable virus transmitted mechanically via hands, tools, and clothing',
      'Seed-borne transmission and contaminated smoker tobacco'
    ],
    spreadConditions: 'Mechanical handling during transplanting, pruning, staking, and tying.',
    immediatePrevention: [
      'Wash hands thoroughly with soap/water before touching plants (never use tobacco in tomato fields)',
      'Dip pruning shears in 10% non-fat dry milk solution or 10% TSP between plants',
      'Plant resistant tomato varieties'
    ],
    recommendedTreatment: 'Immediately rogue out and bag infected plants. Do not compost them.',
    organicOptions: ['Skim milk spray (20%) during handling to neutralize mechanical transmission'],
    chemicalOptions: ['No chemical cure exists for plant viruses.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Scout plants during every pruning / tying session.',
    whenToConsultExpert: 'Contact KVK for virus serological testing if widespread.'
  },
  'Tomato___healthy': {
    label: 'Tomato___healthy',
    crop: 'Tomato',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Deep green, vigorous foliage', 'No chlorosis, leaf curl, or necrotic spotting'],
    possibleCauses: ['Adequate micronutrient balance', 'Proactive integrated pest management (IPM)'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Continue routine pruning, mulching, and yellow sticky trap monitoring.'],
    recommendedTreatment: 'Routine maintenance.',
    organicOptions: ['Foliar bio-stimulant or panchagavya spray.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Weekly routine scouting.',
    whenToConsultExpert: 'Routine seasonal check.'
  },

  // Bell Pepper
  'Pepper,_bell___Bacterial_spot': {
    label: 'Pepper,_bell___Bacterial_spot',
    crop: 'Bell Pepper',
    disease: 'Bacterial spot',
    isHealthy: false,
    pathogenType: 'bacterium',
    pathogenName: 'Xanthomonas campestris pv. vesicatoria',
    defaultSeverity: 'moderate',
    symptoms: [
      'Small, water-soaked, circular to irregular lesions turning dark brown with pale centers',
      'Leaves turn yellow and drop prematurely, leading to severe sunscald on bell peppers',
      'Warty, rough scabs on developing fruit'
    ],
    possibleCauses: ['Infected seed, splashing rainfall, handling wet plants'],
    spreadConditions: 'Warm (24°C to 30°C) and humid weather with heavy dew or rains.',
    immediatePrevention: ['Use certified disease-free seed', 'Drip irrigation instead of sprinklers', 'Crop rotation for 2+ years'],
    recommendedTreatment: 'Copper hydroxide combined with mancozeb to overcome copper tolerance.',
    organicOptions: ['Copper octanoate', 'Bacillus subtilis'],
    chemicalOptions: ['Copper oxychloride 50 WP (2.5 g/L) + Streptocycline (100 ppm)'],
    chemicalPrecautions: 'Wear gloves. Adhere to regional regulations regarding antibiotic use.',
    monitoringSchedule: 'Examine leaf undersides every 4 days in rainy weather.',
    whenToConsultExpert: 'If defoliation occurs on more than 15% of plants.'
  },
  'Pepper,_bell___healthy': {
    label: 'Pepper,_bell___healthy',
    crop: 'Bell Pepper',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Glossy dark green leaves', 'Clean stem joints and blossoms'],
    possibleCauses: ['Good soil drainage and balanced N-P-K nutrition'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain regular watering and scouting.'],
    recommendedTreatment: 'Routine cultural care.',
    organicOptions: ['Neem cake soil application.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Weekly scouting.',
    whenToConsultExpert: 'Routine advisory.'
  },

  // Grape
  'Grape___Black_rot': {
    label: 'Grape___Black_rot',
    crop: 'Grape',
    disease: 'Black rot',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Guignardia bidwellii',
    defaultSeverity: 'severe',
    symptoms: [
      'Reddish-brown circular leaf spots with dark margins and tiny black dots (pycnidia)',
      'Berries turn soft, brown, and shrivel into hard, black, wrinkled mummies'
    ],
    possibleCauses: ['Mummified berries hanging on vines or overwintering on ground'],
    spreadConditions: 'Warm (21°C to 27°C) and humid conditions with rain periods.',
    immediatePrevention: ['Prune and destroy all mummified grape clusters and infected canes during winter dormant pruning'],
    recommendedTreatment: 'Spray protective fungicides from early bloom until 4 weeks after bloom.',
    organicOptions: ['Bordeaux mixture (1%)', 'Liquid copper soap'],
    chemicalOptions: ['Myclobutanil 10 WP @ 0.5 g/L', 'Mancozeb 75 WP @ 2.5 g/L'],
    chemicalPrecautions: '66-day PHI for Mancozeb on grapes.',
    monitoringSchedule: 'Twice-weekly cluster check during berry development.',
    whenToConsultExpert: 'If black rot symptoms appear on fruit clusters during pea-size stage.'
  },
  'Grape___Esca_(Black_Measles)': {
    label: 'Grape___Esca_(Black_Measles)',
    crop: 'Grape',
    disease: 'Esca (Black Measles)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Phaeomoniella chlamydospora & Fomitiporia mediterranea',
    defaultSeverity: 'severe',
    symptoms: [
      'Tiger-stripe leaf pattern: interveinal chlorosis and necrosis with green veins',
      'Dark purple to black spots (measles) on berry skin',
      'Sudden vine apoplexy (complete vine wilting and collapse in mid-summer)'
    ],
    possibleCauses: ['Trunk wound infections, old infected rootstocks'],
    spreadConditions: 'Hot summer conditions following rainy spring.',
    immediatePrevention: ['Disinfect pruning wounds immediately with wound sealant or biocontrol paste', 'Avoid pruning during wet periods'],
    recommendedTreatment: 'Prune trunk back to healthy white wood or retrain suckers; no curative chemical spray cures trunk rot.',
    organicOptions: ['Trichoderma-based pruning wound paste'],
    chemicalOptions: ['Trunk wound protectant sealants with thiophanate-methyl'],
    chemicalPrecautions: 'Pruning tool sterilization with 70% alcohol between vines.',
    monitoringSchedule: 'Monthly vine trunk and canopy inspection.',
    whenToConsultExpert: 'When mature commercial vines show sudden apoplexy wilting.'
  },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
    label: 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    crop: 'Grape',
    disease: 'Leaf blight (Isariopsis Leaf Spot)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Pseudocercospora vitis (Phaeoisariopsis vitis)',
    defaultSeverity: 'moderate',
    symptoms: [
      'Irregular large reddish-brown to dark necrotic spots with distinct yellow halo',
      'Premature leaf fall causing exposed fruit clusters'
    ],
    possibleCauses: ['Overwintered mycelium in fallen leaves and dormant cane bark'],
    spreadConditions: 'Warm, humid weather with frequent rain showers in late season.',
    immediatePrevention: ['Rake fallen leaves post-harvest', 'Canopy thinning for sunlight penetration'],
    recommendedTreatment: 'Foliar fungicide spray application after fruit harvest or late post-bloom.',
    organicOptions: ['Copper oxychloride @ 2.5 g/L'],
    chemicalOptions: ['Carbendazim 50 WP @ 1 g/L', 'Mancozeb 75 WP @ 2.5 g/L'],
    chemicalPrecautions: 'Observe 14-day PHI.',
    monitoringSchedule: 'Fortnightly canopy checks.',
    whenToConsultExpert: 'If late-season defoliation exceeds 30% before cane maturity.'
  },
  'Grape___healthy': {
    label: 'Grape___healthy',
    crop: 'Grape',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Vibrant green palmate leaves with healthy tendril growth'],
    possibleCauses: ['Proper trellising and balanced nutrition'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain regular shoot positioning and bunch thinning.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Bio-fertilizer soil drench.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Weekly routine checks.',
    whenToConsultExpert: 'Seasonal advisory.'
  },

  // Strawberry
  'Strawberry___Leaf_scorch': {
    label: 'Strawberry___Leaf_scorch',
    crop: 'Strawberry',
    disease: 'Leaf scorch',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Diplocarpon earlianum',
    defaultSeverity: 'moderate',
    symptoms: [
      'Small, irregular, purplish spots without pale centers on upper leaf surface',
      'Spots coalesce making entire leaves look scorched and curled brown',
      'Lesions also attack petioles and fruit pedicels'
    ],
    possibleCauses: ['Overwintering fungus in dead strawberry crowns and runners'],
    spreadConditions: 'Prolonged leaf wetness with moderate to warm temperatures (18°C to 25°C).',
    immediatePrevention: ['Drip irrigation underneath straw/plastic mulch', 'Renovate beds by mowing and destroying old leaves post-harvest'],
    recommendedTreatment: 'Apply protective sprays during spring emergence and post-renovation.',
    organicOptions: ['Copper soap bio-fungicide', 'Neem oil formulation'],
    chemicalOptions: ['Captan 50 WP @ 2 g/L', 'Myclobutanil 10 WP @ 0.5 g/L'],
    chemicalPrecautions: 'Observe 2-day PHI for strawberry harvest.',
    monitoringSchedule: 'Check runner leaves weekly.',
    whenToConsultExpert: 'If scorched petioles result in wilting fruit clusters.'
  },
  'Strawberry___healthy': {
    label: 'Strawberry___healthy',
    crop: 'Strawberry',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Deep green trifoliate leaves with clean margins and vigorous runners'],
    possibleCauses: ['Well-drained raised beds and clean drip management'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain clean bed mulching.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Vermicompost tea.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Weekly inspection.',
    whenToConsultExpert: 'Routine advisory.'
  },

  // Orange
  'Orange___Haunglongbing_(Citrus_greening)': {
    label: 'Orange___Haunglongbing_(Citrus_greening)',
    crop: 'Orange',
    disease: 'Huanglongbing (Citrus greening)',
    isHealthy: false,
    pathogenType: 'bacterium',
    pathogenName: 'Candidatus Liberibacter asiaticus (vectored by Asian Citrus Psyllid Diaphorina citri)',
    defaultSeverity: 'severe',
    symptoms: [
      'Asymmetric yellow blotchy mottle on leaves across leaf veins (not mirrored on opposite leaf side)',
      'Yellowing of veins followed by leaf thickening and leathery texture',
      'Small, lopsided, bitter fruit that stays green at the blossom end',
      'Severe twig dieback and tree decline'
    ],
    possibleCauses: ['Vectored by Asian Citrus Psyllid (Diaphorina citri) or infected budwood grafting'],
    spreadConditions: 'Warm weather encouraging active psyllid flush feeding on young shoots.',
    immediatePrevention: [
      'Plant only certified disease-free nursery stock from insect-proof screenhouses',
      'Rogue out and destroy infected trees to eliminate reservoir inoculum',
      'Area-wide psyllid vector management during seasonal vegetative flushes'
    ],
    recommendedTreatment: 'NO cure exists for Citrus Greening. Infected trees must be removed and vector psyllids controlled.',
    organicOptions: [
      'Horticultural mineral oil (1-2%) sprays to deter psyllid egg-laying',
      'Release Tamarixia radiata parasitoid wasps'
    ],
    chemicalOptions: [
      'Imidacloprid 17.8 SL @ 0.5 mL/L soil drench / foliar spray',
      'Thiamethoxam 25 WG @ 0.3 g/L'
    ],
    chemicalPrecautions: 'NEVER spray neonicotinoids during citrus bloom due to high toxicity to pollinators.',
    monitoringSchedule: 'Scout new flush shoots weekly with 10x lens for psyllid nymphs.',
    whenToConsultExpert: 'IMMEDIATELY report suspected citrus greening to the State Department of Horticulture / KVK.'
  },

  // Peach
  'Peach___Bacterial_spot': {
    label: 'Peach___Bacterial_spot',
    crop: 'Peach',
    disease: 'Bacterial spot',
    isHealthy: false,
    pathogenType: 'bacterium',
    pathogenName: 'Xanthomonas arboricola pv. pruni',
    defaultSeverity: 'moderate',
    symptoms: [
      'Water-soaked angular purple-brown spots on leaves',
      'Centers fall out leaving a "shot-hole" appearance',
      'Deep pitted cracked spots on fruit with gum exudation'
    ],
    possibleCauses: ['Overwintering bacteria in twig cankers and bud scales'],
    spreadConditions: 'Warm, windy, wet spring conditions with blowing rain and sandy soils causing leaf abrasion.',
    immediatePrevention: ['Plant windbreaks in sandy soil regions', 'Select tolerant peach cultivars'],
    recommendedTreatment: 'Copper sprays applied during dormant bud break and oxytetracycline during bloom.',
    organicOptions: ['Copper hydroxide applied dormant.'],
    chemicalOptions: ['Oxytetracycline @ 150-200 ppm (where approved)', 'Copper oxychloride dormant spray'],
    chemicalPrecautions: 'Do not use high-dose copper after leaf emergence to avoid phytotoxicity.',
    monitoringSchedule: 'Inspect new leaves weekly after shuck split.',
    whenToConsultExpert: 'If shot-hole causes premature defoliation of scaffold branches.'
  },
  'Peach___healthy': {
    label: 'Peach___healthy',
    crop: 'Peach',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Clean lanceolate green leaves without shot-holes or gumming'],
    possibleCauses: ['Proper dormant sanitation and pruning.'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain regular orchard monitoring.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Dormant bio-oil.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Fortnightly checks.',
    whenToConsultExpert: 'Seasonal check.'
  },

  // Cherry
  'Cherry_(including_sour)___Powdery_mildew': {
    label: 'Cherry_(including_sour)___Powdery_mildew',
    crop: 'Cherry',
    disease: 'Powdery mildew',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Podosphaera clandestina',
    defaultSeverity: 'moderate',
    symptoms: [
      'White powdery fungal patches on young leaves and succulent shoots',
      'Leaves curl upward and become blistered or distorted',
      'Infected fruit surfaces show white powdery patches or russeting'
    ],
    possibleCauses: ['Overwintering chasmothecia in bark crevices and fallen leaves'],
    spreadConditions: 'Warm (18°C to 28°C), dry days with high relative humidity at night and shaded canopies.',
    immediatePrevention: ['Prune water sprouts and center of tree for maximum sunlight penetration', 'Avoid excessive nitrogen fertilization'],
    recommendedTreatment: 'Apply sulfur or systemic sterol-inhibitor fungicide starting at petal fall.',
    organicOptions: ['Potassium bicarbonate (3 g/L)', 'Wettable sulfur (2 g/L)', 'Neem oil (0.5%)'],
    chemicalOptions: ['Myclobutanil 10 WP @ 0.4 g/L', 'Trifloxystrobin @ 0.5 g/L'],
    chemicalPrecautions: 'Do not apply sulfur when temperatures exceed 28°C to prevent fruit burn.',
    monitoringSchedule: 'Check young water sprouts weekly in early summer.',
    whenToConsultExpert: 'If powdery patches appear on green developing cherry fruit.'
  },
  'Cherry_(including_sour)___healthy': {
    label: 'Cherry_(including_sour)___healthy',
    crop: 'Cherry',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Lustrous dark green leaves with uniform serrated margins'],
    possibleCauses: ['Adequate winter chilling and balanced nutrition'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain balanced irrigation and post-harvest care.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Compost application.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Fortnightly scouting.',
    whenToConsultExpert: 'Routine check.'
  },

  // Squash
  'Squash___Powdery_mildew': {
    label: 'Squash___Powdery_mildew',
    crop: 'Squash',
    disease: 'Powdery mildew',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Podosphaera xanthii (Erysiphe cichoracearum)',
    defaultSeverity: 'moderate',
    symptoms: [
      'White talcum-powder-like fungal patches on upper and lower leaf surfaces and petioles',
      'Leaves turn yellow, become dry and brittle, and die prematurely',
      'Exposed fruit suffer sunscald and fail to accumulate sugars'
    ],
    possibleCauses: ['Airborne conidia traveling long distances from older cucurbit fields'],
    spreadConditions: 'Warm temperatures (20°C to 27°C) with dense shaded canopy and high humidity without free rainfall.',
    immediatePrevention: ['Plant resistant squash varieties', 'Wide plant spacing for airflow', 'Drip irrigation at soil level'],
    recommendedTreatment: 'Spray bio-fungicide or systemic triazole at first sign of powdery talc spots.',
    organicOptions: ['Baking soda / Potassium bicarbonate (3 g/L) + horticultural oil', 'Neem oil 0.5%', 'Dilute milk spray (10-20%)'],
    chemicalOptions: ['Azoxystrobin 23 SC @ 1 mL/L', 'Difenoconazole 25 EC @ 0.5 mL/L', 'Wettable sulfur @ 2 g/L'],
    chemicalPrecautions: 'Observe 3-day PHI. Ensure under-leaf coverage.',
    monitoringSchedule: 'Inspect crown leaves and leaf undersides twice weekly.',
    whenToConsultExpert: 'If mildew covers >25% leaf area during early fruit swell.'
  },

  // Blueberry
  'Blueberry___healthy': {
    label: 'Blueberry___healthy',
    crop: 'Blueberry',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Glossy ovate deep green leaves with intact margins'],
    possibleCauses: ['Acidic soil (pH 4.5 - 5.5) and good drainage'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain pine bark mulch and soil acidity.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Organic pine mulch.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Monthly check.',
    whenToConsultExpert: 'Routine check.'
  },

  // Raspberry
  'Raspberry___healthy': {
    label: 'Raspberry___healthy',
    crop: 'Raspberry',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Compound serrate vibrant green leaves with upright primocanes'],
    possibleCauses: ['Proper cane thinning and trellising.'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Annual floricane pruning.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Compost mulching.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Fortnightly check.',
    whenToConsultExpert: 'Routine check.'
  },

  // Soybean
  'Soybean___healthy': {
    label: 'Soybean___healthy',
    crop: 'Soybean',
    disease: 'Healthy',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Broad trifoliate deep green leaves with healthy nodulation on root system'],
    possibleCauses: ['Effective Rhizobium inoculation and balanced phosphorus fertilization'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Crop rotation and regular field scouting.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Rhizobium bio-fertilizer seed inoculation.'],
    chemicalOptions: ['None.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Weekly scouting during vegetative (V) and reproductive (R) stages.',
    whenToConsultExpert: 'Routine check.'
  }
};

import { SPECIALIST_PATHOLOGY_DATA } from './specialist-pathology-data';

export const UNIVERSAL_PATHOLOGY_KNOWLEDGE: Record<string, AgronomicDiseaseInfo> = {
  ...PLANT_VILLAGE_PATHOLOGY,
  ...SPECIALIST_PATHOLOGY_DATA,
  // Normalized label aliases for seamless routing across microservice and frontend formats
  'Cotton___Leaf_blight': SPECIALIST_PATHOLOGY_DATA['cotton_leaf_blight'],
  'Cotton___Bacterial_blight': SPECIALIST_PATHOLOGY_DATA['cotton_bacterial_blight'],
  'Cotton___Grey_mildew': SPECIALIST_PATHOLOGY_DATA['cotton_grey_mildew'],
  'Cotton___Leaf_curl_virus': SPECIALIST_PATHOLOGY_DATA['cotton_leaf_curl_virus'],
  'Cotton___healthy': SPECIALIST_PATHOLOGY_DATA['cotton_healthy'],
  'Wheat___Stripe_rust': SPECIALIST_PATHOLOGY_DATA['wheat_stripe_rust'],
  'Wheat___Leaf_rust': SPECIALIST_PATHOLOGY_DATA['wheat_leaf_rust'],
  'Wheat___Stem_rust': SPECIALIST_PATHOLOGY_DATA['wheat_stem_rust'],
  'Wheat___Septoria_leaf_blotch': SPECIALIST_PATHOLOGY_DATA['wheat_septoria_blotch'],
  'Wheat___Powdery_mildew': SPECIALIST_PATHOLOGY_DATA['wheat_powdery_mildew'],
  'Wheat___healthy': SPECIALIST_PATHOLOGY_DATA['wheat_healthy'],
  'Rice___Blast': SPECIALIST_PATHOLOGY_DATA['rice_blast'],
  'Rice___Bacterial_leaf_blight': SPECIALIST_PATHOLOGY_DATA['rice_bacterial_blight'],
  'Rice___Brown_spot': SPECIALIST_PATHOLOGY_DATA['rice_brown_spot'],
  'Rice___Sheath_blight': SPECIALIST_PATHOLOGY_DATA['rice_sheath_blight'],
  'Rice___Tungro': SPECIALIST_PATHOLOGY_DATA['rice_tungro'],
  'Rice___healthy': SPECIALIST_PATHOLOGY_DATA['rice_healthy'],
  'Chilli___Anthracnose': SPECIALIST_PATHOLOGY_DATA['chilli_anthracnose'],
  'Chilli___Bacterial_spot': SPECIALIST_PATHOLOGY_DATA['chilli_bacterial_spot'],
  'Chilli___Leaf_curl': SPECIALIST_PATHOLOGY_DATA['chilli_leaf_curl'],
  'Chilli___healthy': SPECIALIST_PATHOLOGY_DATA['chilli_healthy'],
};

/**
 * Returns complete agronomic pathology information for a given model label.
 * Looks up across PlantVillage benchmark and all specialist models (Cotton, Wheat, Rice, Chilli).
 */
export function getAgronomicPathology(label?: string | null): AgronomicDiseaseInfo | null {
  if (!label) return null;
  if (UNIVERSAL_PATHOLOGY_KNOWLEDGE[label]) {
    return UNIVERSAL_PATHOLOGY_KNOWLEDGE[label];
  }

  // Case-insensitive & normalized alias lookup
  const norm = label.toLowerCase().replace(/[\s\-_]/g, '');
  for (const [key, val] of Object.entries(UNIVERSAL_PATHOLOGY_KNOWLEDGE)) {
    if (key.toLowerCase().replace(/[\s\-_]/g, '') === norm) {
      return val;
    }
  }

  return null;
}

/**
 * Checks if a crop is part of the legacy 14-crop PlantVillage benchmark dataset.
 */
export function isCropSupportedByBenchmark(cropName?: string | null): boolean {
  if (!cropName) return false;
  const normalized = cropName.toLowerCase().trim();
  return SUPPORTED_BENCHMARK_CROPS.some(
    (c) => c.toLowerCase() === normalized || normalized.includes(c.toLowerCase().split(' ')[0])
  );
}

/**
 * Checks if a crop has an active trained AI model in the system.
 * Returns true for all supported benchmark and specialist crops.
 */
export function isCropSupportedByModel(cropName?: string | null): boolean {
  if (!cropName) return false;
  const normalized = cropName.toLowerCase().trim();

  // Specialist crops with dedicated models
  const specialistCrops = ['cotton', 'wheat', 'rice', 'paddy', 'chilli', 'pepper'];
  if (specialistCrops.some((sc) => normalized.includes(sc))) {
    return true;
  }

  return SUPPORTED_BENCHMARK_CROPS.some(
    (c) => c.toLowerCase() === normalized || normalized.includes(c.toLowerCase().split(' ')[0])
  );
}

