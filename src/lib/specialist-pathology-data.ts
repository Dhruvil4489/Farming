import { AgronomicDiseaseInfo } from './crop-disease-knowledge';

/**
 * Specialist Indian Agronomic Pathology Reference
 *
 * Grounded in research by:
 * - ICAR-Central Institute for Cotton Research (CICR, Nagpur)
 * - ICAR-Indian Institute of Wheat & Barley Research (IIWBR, Karnal)
 * - ICAR-National Rice Research Institute (NRRI, Cuttack)
 * - ICAR-Indian Institute of Horticultural Research (IIHR, Bengaluru)
 * - CIBRC (Central Insecticides Board & Registration Committee)
 */

export const SPECIALIST_PATHOLOGY_DATA: Record<string, AgronomicDiseaseInfo> = {
  // ---------------------------------------------------------------------------
  // COTTON SPECIALIST CLASSES
  // ---------------------------------------------------------------------------
  'cotton_leaf_blight': {
    label: 'cotton_leaf_blight',
    crop: 'Cotton',
    disease: 'Cotton Leaf Blight (Alternaria macrospora)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Alternaria macrospora Zimm. / A. alternata',
    defaultSeverity: 'moderate',
    symptoms: [
      'Small, circular brown to reddish-purple necrotic spots on cotyledons and leaves',
      'Spots enlarge and coalesce into irregular blighted patches with distinct concentric rings (target board pattern)',
      'Shot-hole formation where necrotic centres drop out under dry conditions',
      'Premature defoliation, square and boll shedding in severe infections'
    ],
    possibleCauses: [
      'Frequent rains or high humidity (>85%) combined with warm canopy temperatures (25-30°C)',
      'Potassium deficiency or nutrient stress predisposing leaves to Alternaria infection',
      'Dense crop canopy and poor air drainage',
      'Infected seed or infected crop residue surviving from previous seasons'
    ],
    spreadConditions: 'Air-borne conidia dispersed by wind and rain splashes during intermittent cloudy, rainy periods with prolonged leaf wetness (>6 hours).',
    immediatePrevention: [
      'Ensure balanced fertilization; apply recommended muriate of potash (MOP) to improve plant cell wall turgor',
      'Avoid excessive canopy shade; practice clean weed management in border zones',
      'Collect and destroy severely blighted lower leaves to curb secondary conidial spread',
      'Switch from sprinkler/overhead watering to drip irrigation to keep foliage dry'
    ],
    recommendedTreatment: 'Apply targeted bio-fungicide or CIBRC-approved protective foliar spray at initial appearance of concentric spots.',
    organicOptions: [
      'Foliar spray of Trichoderma viride 1% WP (5g/L) with 2% cow urine extract or fermented buttermilk spray',
      'Neem oil 1500 ppm @ 3-5 ml/L mixed with soap water at early symptom onset',
      'Pseudomonas fluorescens 0.5% WP (10g/L) applied in the early morning'
    ],
    chemicalOptions: [
      'Mancozeb 75% WP @ 2.5 g/L (1000g/acre in 400L water) as protective cover spray',
      'Propiconazole 25% EC @ 1 ml/L or Difenoconazole 25% EC @ 0.5 ml/L during active blight spread',
      'Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L for comprehensive curative and translaminar protection'
    ],
    chemicalPrecautions: 'Rotate fungicide FRAC groups to prevent strobilurin resistance. Mandatory Pre-Harvest Interval (PHI) of 21 days for cotton. Wear nitrile gloves, protective eyewear, and respirator mask when preparing tank mix.',
    monitoringSchedule: 'Inspect 20 random plants across four quadrants twice weekly during boll development and post-rain periods.',
    whenToConsultExpert: 'Escalate to local KVK or District Cotton Development Officer if defoliation exceeds 20% on young squares or top leaves.'
  },

  'cotton_bacterial_blight': {
    label: 'cotton_bacterial_blight',
    crop: 'Cotton',
    disease: 'Bacterial Blight / Angular Leaf Spot (Black Arm)',
    isHealthy: false,
    pathogenType: 'bacterium',
    pathogenName: 'Xanthomonas citri pv. malvacearum (Smith)',
    defaultSeverity: 'severe',
    symptoms: [
      'Water-soaked angular leaf spots bound by veins on the underside of foliage',
      'Spots turn dark brown to purplish-black with chlorotic yellow halos',
      'Vein necrosis extending along principal veins resulting in the classic "Black Arm" phase',
      'Water-soaked dark lesions on stems causing lodging and dark sunken lesions on developing bolls ("Boll Rot")'
    ],
    possibleCauses: [
      'High relative humidity (>80%) accompanied by warm temperatures (28-35°C)',
      'Seed-borne bacterial inoculum or surviving crop debris in soil',
      'Hail, wind damage, or sucking pest wounds facilitating bacterial ingress',
      'Excessive nitrogen fertilization leading to succulent vegetative tissue'
    ],
    spreadConditions: 'Bacteria spread rapidly via wind-driven rain, sprinkler irrigation, and mechanical field implements across injured wet foliage.',
    immediatePrevention: [
      'Use certified acid-delinted seeds treated with Streptocycline or seed protectant',
      'Avoid field operations when the canopy is wet to prevent bacterial ooze dispersal',
      'Deep plow field stubble immediately after harvest to expose bacterial residue to solar heat',
      'Balanced NPK fertilization; avoid excess urea during humid overcast conditions'
    ],
    recommendedTreatment: 'Immediate combination spray of copper hydroxide/oxychloride with an agricultural bactericide.',
    organicOptions: [
      'Seed treatment with Pseudomonas fluorescens (10 g/kg seed)',
      'Copper Hydroxide 53.8% DF (certified organic compliant formulation) @ 2 g/L',
      'Neem leaf extract 5% combined with bio-formulations to deter vector insects'
    ],
    chemicalOptions: [
      'Copper Oxychloride 50% WP (2.5 g/L) + Streptomycin sulphate 90% + Tetracycline hydrochloride 10% (Streptocycline) @ 0.1 g/L (1g in 10L water)',
      'Kasugamycin 3% SL @ 2 ml/L as systemic bactericide',
      'Copper Hydroxide 77% WP @ 2 g/L applied early in infection cycle'
    ],
    chemicalPrecautions: 'Never exceed recommended antibiotic concentrations. Follow 21-day PHI. Do not mix Streptocycline with highly alkaline sprays. Use protective gear.',
    monitoringSchedule: 'Inspect lower leaf surfaces and main stems every 48-72 hours after heavy rainfall or gusty winds.',
    whenToConsultExpert: 'Contact KVK or CICR emergency helpline if Black Arm phase appears on main stem before boll setting.'
  },

  'cotton_grey_mildew': {
    label: 'cotton_grey_mildew',
    crop: 'Cotton',
    disease: 'Grey Mildew / Dahiya Disease (Areolate Mildew)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Ramularia areola Atk. (Mycosphaerella areola)',
    defaultSeverity: 'moderate',
    symptoms: [
      'Pale, angular translucent spots (3-4 mm) delimited by leaf veins',
      'Frosted white to grayish powdery growth on the underside of foliage giving the appearance of dahiya (curd)',
      'Leaves turn yellowish-brown, curl upward, become brittle, and drop prematurely',
      'Severe defoliation leaving only young apical leaves ("broomstick appearance")'
    ],
    possibleCauses: [
      'Prolonged cool, humid weather (18-25°C with RH > 80%) following late monsoon rains',
      'Dense crop canopy and inadequate sunlight penetration',
      'Susceptible desi (G. arboreum) and American cotton cultivars',
      'Low potassium availability and heavy vegetative density'
    ],
    spreadConditions: 'Conidia are wind-borne; rapid multiplication occurs under intermittent showers and cloudy skies during October-December.',
    immediatePrevention: [
      'Adopt wider row spacing (e.g. 90 x 60 cm) to facilitate sunlight and aeration',
      'Clean field sanitation and destruction of volunteer cotton plants',
      'Avoid waterlogging by establishing adequate furrow drainage channels'
    ],
    recommendedTreatment: 'Foliar application of wettable sulphur or systemic triazole fungicide at initial dusting of white powder.',
    organicOptions: [
      'Wettable Sulphur 80% WDG (certified organic formulation) @ 3 g/L',
      'Cow dung urine slurry filtrate (10%) with neem kernel extract (5%)',
      'Trichoderma harzianum foliar spray @ 5 g/L'
    ],
    chemicalOptions: [
      'Carbendazim 50% WP @ 1 g/L (200g in 200L water/acre)',
      'Kresoxim-methyl 44.3% SC @ 1 ml/L or Azoxystrobin 23% SC @ 1 ml/L',
      'Tebuconazole 25.9% EC @ 1 ml/L for comprehensive eradication'
    ],
    chemicalPrecautions: 'Do not spray wettable sulphur in bright sunny midday (>32°C) to prevent phytotoxic leaf scorch. Adhere to safety PPE.',
    monitoringSchedule: 'Inspect lower and middle foliage weekly beginning 60 days after sowing.',
    whenToConsultExpert: 'Consult local agronomist if powdery growth covers >30% of canopy during boll development.'
  },

  'cotton_leaf_curl_virus': {
    label: 'cotton_leaf_curl_virus',
    crop: 'Cotton',
    disease: 'Cotton Leaf Curl Virus (CLCuV)',
    isHealthy: false,
    pathogenType: 'virus',
    pathogenName: 'Cotton leaf curl Multan / Rajasthan Virus (Begomovirus)',
    defaultSeverity: 'severe',
    symptoms: [
      'Upward (or downward) cupping and curling of leaf margins',
      'Thickening and dark green discoloration of leaf veins (enation formation)',
      'Cup-shaped enations or leaf-like outgrowths developing on the undersides of primary veins',
      'Severe stunting, shortened internodes, and dramatically reduced boll formation'
    ],
    possibleCauses: [
      'High population of whitefly vector (Bemisia tabaci Gennadius)',
      'Cultivation of susceptible Bt cotton hybrids in northern cotton belt (Punjab, Haryana, Rajasthan)',
      'Weed reservoirs (Abutilon indicum, Parthenium, Xanthium) harboring virus and whitefly',
      'Dry, warm weather favoring rapid whitefly generations'
    ],
    spreadConditions: 'Transmitted exclusively by the whitefly vector Bemisia tabaci. Not seed-borne or sap-transmissible; vector feeds on phloem and infects within 15-30 minutes.',
    immediatePrevention: [
      'Eradicate alternative weed hosts from field borders, bunds, and irrigation channels',
      'Install yellow sticky traps (10-15 per acre) to monitor and mass-trap whitefly',
      'Grow barrier crops (e.g. 2-3 rows of pearl millet, maize, or sorghum) around cotton plots',
      'Choose CLCuV-resistant or tolerant certified hybrids recommended by State Agricultural Universities'
    ],
    recommendedTreatment: 'Immediate vector control (whitefly management) and systemic micronutrient support. Viral infection cannot be cured chemically once established.',
    organicOptions: [
      'Neem oil 1500 ppm @ 3-5 ml/L combined with 5% Neem Seed Kernel Extract (NSKE)',
      'Verticillium lecanii (Lecanicillium lecanii) bio-insecticide @ 5 g/L',
      'Foliar spray of 1% cow milk solution to inhibit viral particle dissemination'
    ],
    chemicalOptions: [
      'Diafenthiuron 50% WP @ 1.25 g/L or Pyriproxyfen 10% EC @ 2 ml/L to disrupt whitefly nymphs',
      'Afidopyropen 50 g/L DC @ 2 ml/L or Flonicamid 50% WG @ 0.4 g/L for adult whitefly knockdown',
      'Spiromesifen 22.9% SC @ 1.5 ml/L targeting whitefly nymph colonies'
    ],
    chemicalPrecautions: 'Never use synthetic pyrethroids (Cypermethrin, Deltamethrin) as they induce severe whitefly resurgence. Rotate insecticide modes of action (IRAC). Wear PPE.',
    monitoringSchedule: 'Check 20 plants/acre twice weekly, recording whitefly count per leaf (threshold: 6-8 adults/leaf).',
    whenToConsultExpert: 'Report viral outbreaks immediately to State Agriculture Department / CICR for regional surveillance.'
  },

  'cotton_healthy': {
    label: 'cotton_healthy',
    crop: 'Cotton',
    disease: 'Cotton Healthy Leaf',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Symmetric 3 to 5-lobed leaves with uniform green coloration, clear venation, and absence of necrotic spotting or marginal curling'],
    possibleCauses: ['Optimal soil moisture, balanced nutrition (NPK + micronutrients like boron and magnesium), and effective pest management'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain regular scouting, clean cultivation, and balanced drip irrigation.'],
    recommendedTreatment: 'No curative intervention required. Continue routine agricultural management.',
    organicOptions: ['Periodic prophylactic spraying of neem formulation (1500 ppm) or bio-stimulant.'],
    chemicalOptions: ['None required.'],
    chemicalPrecautions: 'Avoid unnecessary prophylactic chemical sprays to conserve beneficial predator insects.',
    monitoringSchedule: 'Scout field plots once every 5-7 days.',
    whenToConsultExpert: 'Routine check.'
  },

  // ---------------------------------------------------------------------------
  // WHEAT SPECIALIST CLASSES
  // ---------------------------------------------------------------------------
  'wheat_stripe_rust': {
    label: 'wheat_stripe_rust',
    crop: 'Wheat',
    disease: 'Wheat Stripe Rust / Yellow Rust (Puccinia striiformis)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Puccinia striiformis Westend. f. sp. tritici',
    defaultSeverity: 'severe',
    symptoms: [
      'Bright yellow to orange-yellow pustules (uredinia) arranged in distinct linear stripes along leaf veins',
      'Powdery yellow spores rubbing off easily on fingertips',
      'Pustules coalescing into broad chlorotic yellow necrotic streaks covering entire leaf blade',
      'Severe grain shriveling, premature senescence, and yield reduction up to 80% if flag leaf is infected'
    ],
    possibleCauses: [
      'Cool temperatures (10-18°C) accompanied by high relative humidity (>85%) or frequent morning dew',
      'Cultivation of rust-susceptible varieties in northern plains and sub-mountainous zones',
      'Spore showers blown southwards from Himalayan foothill reservoirs',
      'Dense planting and excessive nitrogenous fertilizer application'
    ],
    spreadConditions: 'Air-borne urediniospores travel hundreds of kilometers on wind currents. Germination requires 3-4 hours of continuous dew or moisture.',
    immediatePrevention: [
      'Cultivate rust-resistant certified varieties (e.g. DBW-187, DBW-303, HD-3226, PBW-725)',
      'Avoid late sowing; plant within the optimal mid-November window',
      'Maintain balanced fertilizer application (avoid excess urea; ensure adequate potash)'
    ],
    recommendedTreatment: 'Immediate foliar spray of triazole fungicide at initial sighting of yellow linear pustules.',
    organicOptions: [
      'Foliar spray of 10% garlic clove extract + 2% neem oil formulation',
      'Trichoderma viride @ 5 g/L with cow urine slurry spray (preventive only; chemical curative required under active rust spread)'
    ],
    chemicalOptions: [
      'Propiconazole 25% EC (Tilt) @ 1 ml/L (200 ml in 200 L water/acre)',
      'Tebuconazole 25.9% EC @ 1 ml/L or Tebuconazole 50% + Trifloxystrobin 25% WG (Nativo) @ 0.6 g/L',
      'Mancozeb 75% WP @ 2.5 g/L as preventive barrier in adjacent unaffected fields'
    ],
    chemicalPrecautions: 'Spray thoroughly on both leaf surfaces. Observe 30-day PHI. Wear protective chemical mask and goggles.',
    monitoringSchedule: 'Inspect wheat fields every 3-4 days from December through February, especially during foggy periods.',
    whenToConsultExpert: 'Yellow Rust is an ICAR quarantine-priority disease. Notify your local KVK or agricultural officer immediately upon first confirmed sighting.'
  },

  'wheat_leaf_rust': {
    label: 'wheat_leaf_rust',
    crop: 'Wheat',
    disease: 'Wheat Leaf Rust / Brown Rust (Puccinia triticina)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Puccinia triticina Eriks.',
    defaultSeverity: 'moderate',
    symptoms: [
      'Small, round to oval reddish-brown to orange-brown pustules scattered randomly across the upper leaf surface',
      'Pustules are not arranged in linear stripes (distinguishing it from yellow rust)',
      'Powdery brown spore dust rubbing off on contact',
      'Leaves turn yellow and dry up prematurely from tips backward'
    ],
    possibleCauses: [
      'Moderate to warm temperatures (18-25°C) and high humidity or overnight dew',
      'Common in late-sown wheat during February-March across central and peninsular India',
      'Susceptible cultivars and high crop density'
    ],
    spreadConditions: 'Wind-borne urediniospores dispersed widely; rapid cycling occurs every 7-10 days under warm humid conditions.',
    immediatePrevention: [
      'Sow recommended resistant varieties (e.g. GW-322, HD-2967, HI-8759)',
      'Complete sowing by November 20 to avoid late-season heat and rust intersection'
    ],
    recommendedTreatment: 'Foliar application of triazole fungicide upon detecting brown pustules on flag leaf or top foliage.',
    organicOptions: [
      'Foliar spray of Bacillus subtilis bio-formulation (5 g/L)',
      'Neem seed kernel extract 5% as preventive barrier'
    ],
    chemicalOptions: [
      'Propiconazole 25% EC @ 1 ml/L',
      'Tebuconazole 25.9% EC @ 1 ml/L',
      'Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L'
    ],
    chemicalPrecautions: 'Maintain safety equipment and check water volume (at least 200 L/acre) for complete canopy coverage.',
    monitoringSchedule: 'Weekly scouting from late vegetative stage to milk stage.',
    whenToConsultExpert: 'Consult KVK if pustules cover >10% of flag leaf area before grain filling.'
  },

  'wheat_stem_rust': {
    label: 'wheat_stem_rust',
    crop: 'Wheat',
    disease: 'Wheat Stem Rust / Black Rust (Puccinia graminis)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Puccinia graminis f. sp. tritici',
    defaultSeverity: 'severe',
    symptoms: [
      'Elongated, reddish-brown to dark black pustules on stems, leaf sheaths, and glumes',
      'Pustules rupture the epidermis leaving ragged torn margins around the spore mass',
      'Stems become brittle, lodged, and structurally weakened',
      'Grains become severely pinched and shriveled'
    ],
    possibleCauses: [
      'Warm temperatures (20-30°C) combined with high relative humidity late in the wheat season',
      'Predominant in central and southern India (Madhya Pradesh, Gujarat, Maharashtra, Karnataka)',
      'Susceptible cultivars and late crop maturity'
    ],
    spreadConditions: 'Air-borne urediniospores travel on southerly winds; free moisture on stems is required for spore germination.',
    immediatePrevention: [
      'Plant black rust-resistant certified cultivars',
      'Early sowing in October-November to escape late-season temperature spikes'
    ],
    recommendedTreatment: 'Immediate spray of Propiconazole 25% EC at first detection on culms.',
    organicOptions: ['Preventive application of Trichoderma viride and bio-extracts.'],
    chemicalOptions: ['Propiconazole 25% EC @ 1 ml/L', 'Tebuconazole 25.9% EC @ 1 ml/L'],
    chemicalPrecautions: 'Comply with 30-day PHI. Wear protective safety equipment.',
    monitoringSchedule: 'Bi-weekly checks on stems and leaf sheaths during flowering and milk stages.',
    whenToConsultExpert: 'Immediately alert IIWBR or local agricultural officer if black pustules are verified on stems.'
  },

  'wheat_septoria_blotch': {
    label: 'wheat_septoria_blotch',
    crop: 'Wheat',
    disease: 'Septoria Leaf Blotch (Zymoseptoria tritici)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Zymoseptoria tritici (Septoria tritici)',
    defaultSeverity: 'moderate',
    symptoms: [
      'Irregular greenish-yellow water-soaked spots developing into necrotic tan blotches',
      'Tiny, black specks (pycnidia) embedded inside the mature tan lesions (key diagnostic sign)',
      'Blotches coalesce causing extensive necrosis of flag leaf and lower canopy'
    ],
    possibleCauses: ['Frequent rainfall, cool temperatures (15-20°C), and wet canopy conditions for >24 hours.'],
    spreadConditions: 'Pycnidiospores spread upward through the canopy via rain splashes.',
    immediatePrevention: ['Crop rotation with non-cereal crops and deep burial of infected wheat stubble.'],
    recommendedTreatment: 'Foliar fungicide application before the disease reaches the flag leaf.',
    organicOptions: ['Seed treatment with Trichoderma viride and foliar bio-protective sprays.'],
    chemicalOptions: ['Carbendazim 12% + Mancozeb 63% WP @ 2 g/L', 'Propiconazole 25% EC @ 1 ml/L'],
    chemicalPrecautions: 'Ensure full spray coverage of top two leaves. Follow label safety instructions.',
    monitoringSchedule: 'Inspect lower leaves for black pycnidial fruiting bodies after rainy spells.',
    whenToConsultExpert: 'Consult expert if lesions advance to flag leaf during boot stage.'
  },

  'wheat_powdery_mildew': {
    label: 'wheat_powdery_mildew',
    crop: 'Wheat',
    disease: 'Wheat Powdery Mildew (Blumeria graminis)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Blumeria graminis f. sp. tritici',
    defaultSeverity: 'moderate',
    symptoms: [
      'White to grey-white fluffy or powdery patches on the upper surface of lower leaves and leaf sheaths',
      'Patches enlarge, turn greyish-brown with tiny black cleistothecia fruiting bodies',
      'Chlorosis and early leaf death under heavy mildew cover'
    ],
    possibleCauses: ['Cool, cloudy, and humid weather (15-22°C, RH > 85%) with dense vegetative canopy.'],
    spreadConditions: 'Wind-borne conidia germinate readily under high humidity even without free water droplets.',
    immediatePrevention: ['Avoid excessive nitrogen fertilization and avoid overly dense seed rates.'],
    recommendedTreatment: 'Foliar application of wettable sulphur or triazole fungicide.',
    organicOptions: ['Wettable Sulphur 80% WDG @ 3 g/L', 'Milk spray (10%) or potassium bicarbonate (3 g/L)'],
    chemicalOptions: ['Propiconazole 25% EC @ 1 ml/L', 'Hexaconazole 5% EC @ 1.5 ml/L'],
    chemicalPrecautions: 'Avoid sulphur spraying in direct midday sun. Comply with PHI.',
    monitoringSchedule: 'Check lower shaded canopy weekly during tillering and jointing.',
    whenToConsultExpert: 'Consult agronomist if powdery growth reaches penultimate leaf.'
  },

  'wheat_healthy': {
    label: 'wheat_healthy',
    crop: 'Wheat',
    disease: 'Wheat Healthy Leaf',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Clean, elongated lanceolate green foliage with sharp parallel venation, crisp texture, and zero pustules or blotches'],
    possibleCauses: ['Certified rust-resistant seed, timely sowing, balanced NPK + zinc nutrition, and optimal irrigation timing'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain regular field surveillance and avoid over-irrigation during tillering.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Preventive bio-fertilizer and foliar seaweed/neem maintenance.'],
    chemicalOptions: ['None required.'],
    chemicalPrecautions: 'Avoid unnecessary sprays.',
    monitoringSchedule: 'Scout once a week through harvest.',
    whenToConsultExpert: 'Routine check.'
  },

  // ---------------------------------------------------------------------------
  // RICE SPECIALIST CLASSES
  // ---------------------------------------------------------------------------
  'rice_blast': {
    label: 'rice_blast',
    crop: 'Rice (Paddy)',
    disease: 'Rice Blast (Magnaporthe oryzae)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Magnaporthe oryzae (Pyricularia oryzae Cavara)',
    defaultSeverity: 'severe',
    symptoms: [
      'Spindle-shaped / diamond-shaped (elliptical) lesions with pointed ends on leaves',
      'Lesion centers are greyish-white with dark brown or reddish-brown margins',
      'Lesions coalesce rapidly causing whole leaves to wither and blast ("burnt field appearance")',
      'Blackish-brown discoloration and rotting at leaf collar (collar blast), node (node blast), and panicle neck (neck blast)'
    ],
    possibleCauses: [
      'Cool night temperatures (18-24°C) with high daytime temperatures and high relative humidity (>90%)',
      'Prolonged leaf wetness (>10-12 hours) from rain, heavy dew, or fog',
      'Excessive application of chemical nitrogen (urea) without sufficient potassium',
      'Susceptible cultivars and dense planting density'
    ],
    spreadConditions: 'Conidia are produced abundantly in humid nights and transported by wind gusts during early morning hours.',
    immediatePrevention: [
      'Grow blast-resistant varieties (e.g. Swarna Sub1, MTU-1010, CR Dhan 800, Pusa 1460)',
      'Split nitrogen fertilizer into 3-4 doses; never apply heavy urea during overcast periods',
      'Treat seed with Carbendazim 2g/kg or Trichoderma viride 10g/kg seed',
      'Maintain continuous shallow water submergence (2-5 cm) to suppress blast sporulation'
    ],
    recommendedTreatment: 'Immediate spray of specific blasticide (Tricyclazole or Isoprothiolane) upon first appearance of eye-shaped lesions.',
    organicOptions: [
      'Foliar spray of Pseudomonas fluorescens 0.5% (10g/L)',
      'Cow dung urine extract (10%) with fermented neem cake filtrate',
      'Silicon soil supplementation (calcium silicate) to reinforce leaf silica epidermal cells'
    ],
    chemicalOptions: [
      'Tricyclazole 75% WP @ 0.6 g/L (120 g in 200 L water/acre) — benchmark systemic blasticide',
      'Isoprothiolane 40% EC (Fuji-One) @ 1.5 ml/L',
      'Kasugamycin 3% SL @ 2.5 ml/L or Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L'
    ],
    chemicalPrecautions: 'Apply at early tillering and repeat at 5% panicle emergence to prevent neck blast. PHI: 30 days. Full PPE required.',
    monitoringSchedule: 'Scout nursery beds and tillering fields twice a week during overcast rainy spells.',
    whenToConsultExpert: 'Alert local KVK or Rice Research Station immediately if neck blast affects panicle emergence.'
  },

  'rice_bacterial_blight': {
    label: 'rice_bacterial_blight',
    crop: 'Rice (Paddy)',
    disease: 'Bacterial Leaf Blight (BLB)',
    isHealthy: false,
    pathogenType: 'bacterium',
    pathogenName: 'Xanthomonas oryzae pv. oryzae',
    defaultSeverity: 'severe',
    symptoms: [
      'Water-soaked to yellowish-green stripes initiating along leaf margins and wavy borders',
      'Lesions enlarge, turn straw-yellow to dirty white with wavy scalloped margins',
      'Milky bacterial ooze beads drying into amber encrustations on leaves in early morning',
      'Kresek / seedling wilt phase in young plants causing rapid drying and death'
    ],
    possibleCauses: [
      'Warm temperatures (25-34°C) with high humidity, heavy rainstorms, and strong winds',
      'Flooding or deep standing water carrying bacterial ooze across bunds',
      'Excessive nitrogenous fertilization and close planting'
    ],
    spreadConditions: 'Bacteria enter through hydathodes or mechanical clipping wounds and spread through irrigation water currents and wind-driven rain.',
    immediatePrevention: [
      'Use certified seeds of BLB-resistant varieties (e.g. Improved Samba Mahsuri, CR Dhan 310)',
      'Drain excess stagnant water from affected plots for 2-3 days',
      'Avoid clipping seedling tips during transplanting (major bacterial entry route)',
      'Withhold nitrogen top-dressing; apply extra potassium (MOP) to stiffen leaf tissue'
    ],
    recommendedTreatment: 'Combined application of copper bactericide with Streptocycline and strict water management.',
    organicOptions: [
      'Seed treatment with Pseudomonas fluorescens (10 g/kg) and seedling root dip',
      'Foliar spray of 5% fresh neem leaf extract combined with cow dung supernatant'
    ],
    chemicalOptions: [
      'Copper Oxychloride 50% WP (2.5 g/L) + Streptomycin sulphate 90% + Tetracycline 10% (Streptocycline) @ 0.1 g/L',
      'Kasugamycin 3% SL @ 2 ml/L'
    ],
    chemicalPrecautions: 'Do not use antibiotics repeatedly; observe 25-day PHI. Wear protective chemical gear.',
    monitoringSchedule: 'Inspect leaf tips and margins twice weekly during maximum tillering and heading.',
    whenToConsultExpert: 'Contact KVK agronomist if Kresek phase wilting appears in the nursery or newly transplanted field.'
  },

  'rice_brown_spot': {
    label: 'rice_brown_spot',
    crop: 'Rice (Paddy)',
    disease: 'Rice Brown Spot (Bipolaris oryzae)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Bipolaris oryzae (Cochliobolus miyabeanus)',
    defaultSeverity: 'moderate',
    symptoms: [
      'Numerous small, oval to circular dark brown to purple-brown spots evenly distributed across leaf surface',
      'Larger spots develop a lighter greyish-white center with a distinct dark brown halo ("sesame seed" appearance)',
      'Severely spotted leaves turn yellow, dry up, and wither',
      'Dark brown discolored patches on glumes leading to black grain discoloration and poor milling quality'
    ],
    possibleCauses: [
      'Nutrient-deficient, unfertile, or sandy soils lacking nitrogen, potassium, and silicon',
      'Water stress or fluctuating moisture conditions (drought followed by flooding)',
      'Infected seed or infected stubble residue from prior seasons'
    ],
    spreadConditions: 'Air-borne conidia dispersed by wind currents under temperatures of 25-30°C and RH > 80%.',
    immediatePrevention: [
      'Seed treatment with Carbendazim 2g/kg or hot water treatment (52-54°C for 10 minutes)',
      'Soil nutrient correction based on soil test; apply zinc sulphate and potassium',
      'Avoid moisture stress; maintain uniform soil moisture in the root zone'
    ],
    recommendedTreatment: 'Foliar application of Mancozeb or combination triazole fungicide alongside nutrient spray.',
    organicOptions: [
      'Seed treatment with Trichoderma viride (10 g/kg)',
      'Foliar spray of 5% fermented panchagavya or neem seed kernel extract'
    ],
    chemicalOptions: [
      'Mancozeb 75% WP @ 2 g/L (400g in 200L water/acre)',
      'Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2 g/L',
      'Propiconazole 25% EC @ 1 ml/L'
    ],
    chemicalPrecautions: 'Ensure uniform leaf coverage. Observe 21-day PHI. Wear PPE.',
    monitoringSchedule: 'Weekly leaf inspections from tillering through panicle development.',
    whenToConsultExpert: 'Consult local extension officer if brown spots appear accompanied by stunted root development.'
  },

  'rice_sheath_blight': {
    label: 'rice_sheath_blight',
    crop: 'Rice (Paddy)',
    disease: 'Rice Sheath Blight (Rhizoctonia solani)',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Rhizoctonia solani Kühn',
    defaultSeverity: 'severe',
    symptoms: [
      'Oval or elliptical greenish-grey water-soaked spots on leaf sheaths near the waterline',
      'Lesions enlarge with dark brown or purplish margins and bleached whitish-grey centers ("snake skin" pattern)',
      'Infection advances upward onto upper leaf sheaths and blades',
      'Small, dark brown irregular sclerotia resting bodies developing on affected tissue'
    ],
    possibleCauses: [
      'High temperature (28-32°C) combined with very high relative humidity (85-100%) in dense canopy',
      'High planting density, excess urea application, and prolonged standing water',
      'Soil-borne sclerotia floating on irrigation water to initiate primary infection'
    ],
    spreadConditions: 'Sclerotia float on irrigation water to touch sheaths; runner hyphae spread rapidly between adjacent tillers.',
    immediatePrevention: [
      'Avoid excessive seeding rate and dense hill planting; allow 20 x 15 cm spacing',
      'Drain irrigation water for 2-3 days during tillering to reduce canopy relative humidity',
      'Avoid excess nitrogenous top-dressing; apply split doses of potash (MOP)'
    ],
    recommendedTreatment: 'Foliar spray directed specifically at the lower base and sheaths of the plant canopy.',
    organicOptions: [
      'Foliar application of Trichoderma harzianum @ 5 g/L directed at plant bases',
      'Pseudomonas fluorescens 0.5% WP (10 g/L)'
    ],
    chemicalOptions: [
      'Validamycin 3% L @ 2 ml/L (400 ml in 200 L water/acre) — benchmark sheath blight specific antibiotic',
      'Hexaconazole 5% SC @ 2 ml/L or Tebuconazole 25.9% EC @ 1.5 ml/L',
      'Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L'
    ],
    chemicalPrecautions: 'Ensure spray nozzle reaches the lower stem bases, not just the upper canopy. 25-day PHI.',
    monitoringSchedule: 'Check stem bases near waterline every 4-5 days during active tillering and boot stage.',
    whenToConsultExpert: 'Alert KVK if sheath lesions ascend to the flag leaf sheath before heading.'
  },

  'rice_tungro': {
    label: 'rice_tungro',
    crop: 'Rice (Paddy)',
    disease: 'Rice Tungro Virus Disease',
    isHealthy: false,
    pathogenType: 'virus',
    pathogenName: 'Rice tungro bacilliform virus (RTBV) + spherical virus (RTSV)',
    defaultSeverity: 'severe',
    symptoms: [
      'Yellow or orange-yellow discoloration starting from leaf tips extending downward',
      'Young leaves exhibit mottling and interveinal chlorosis; mature leaves become rusty orange',
      'Severe plant stunting, reduced tillering, delayed flowering, and partially exerted panicles with empty grains'
    ],
    possibleCauses: [
      'High population of green leafhopper (GLH - Nephotettix virescens) vector',
      'Presence of infected ratoon crops, stubble, or weed hosts (Echinochloa, Leersia)',
      'Cultivation of susceptible rice varieties during peak GLH flight periods'
    ],
    spreadConditions: 'Semi-persistently transmitted by Nephotettix virescens leafhoppers. Transmission occurs within 10-30 minutes of vector feeding.',
    immediatePrevention: [
      'Plant tungro-resistant cultivars (e.g. Vikramarya, Bharani, IR-36, MTU-9992)',
      'Synchronize community transplanting to avoid staggered vector breeding',
      'Plow down stubble and ratoon growth immediately after harvest'
    ],
    recommendedTreatment: 'Immediate green leafhopper vector management. Viral infection cannot be cured chemically once established.',
    organicOptions: [
      'Install light traps to monitor and attract nocturnal green leafhoppers',
      'Foliar spray of 5% neem seed kernel extract (NSKE) or Neem oil 1500 ppm @ 3 ml/L'
    ],
    chemicalOptions: [
      'Thiamethoxam 25% WG @ 0.2 g/L (40 g in 200 L water/acre)',
      'Dinotefuran 20% SG @ 0.4 g/L or Buprofezin 25% SC @ 1.5 ml/L to control GLH nymphs',
      'Pymetrozine 50% WG @ 0.6 g/L for selective phloem-feeding vector control'
    ],
    chemicalPrecautions: 'Apply at vector economic threshold (ETL: 2 GLH/hill). Full PPE required.',
    monitoringSchedule: 'Sweep net monitoring twice weekly for green leafhoppers during early vegetative stages.',
    whenToConsultExpert: 'Tungro is an epidemic-grade viral threat. Inform District Agriculture Office immediately upon leaf yellowing with GLH presence.'
  },

  'rice_healthy': {
    label: 'rice_healthy',
    crop: 'Rice (Paddy)',
    disease: 'Rice Healthy Leaf',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Vibrant emerald-green linear leaves with smooth erect posture, clear veins, and zero blast lesions, blight margins, or brown speckling'],
    possibleCauses: ['Resistant certified seed, optimal nursery management, balanced NPK + zinc nutrition, and steady shallow water depth'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Maintain optimal water management and regular field scouting.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Periodic bio-fertilizer and seaweed extract supplementation.'],
    chemicalOptions: ['None required.'],
    chemicalPrecautions: 'Avoid unnecessary sprays.',
    monitoringSchedule: 'Scout once every 5-7 days.',
    whenToConsultExpert: 'Routine check.'
  },

  // ---------------------------------------------------------------------------
  // CHILLI SPECIALIST CLASSES
  // ---------------------------------------------------------------------------
  'chilli_anthracnose': {
    label: 'chilli_anthracnose',
    crop: 'Chilli',
    disease: 'Chilli Anthracnose / Dieback / Fruit Rot',
    isHealthy: false,
    pathogenType: 'fungus',
    pathogenName: 'Colletotrichum capsici (Syd.) Butler & Bisby',
    defaultSeverity: 'severe',
    symptoms: [
      'Small, circular brownish sunken spots on leaves, tender twigs, and fruits',
      'Concentric rings of tiny black dots (acervuli) in mature lesions',
      'Dieback of twigs starting from tip downward, turning straw-colored and dry',
      'Sunken necrotic lesions on green and red chillies with concentric spore rings'
    ],
    possibleCauses: ['High relative humidity (>80%) and warm temperature (25-30°C) with continuous rainy or cloudy weather.'],
    spreadConditions: 'Air-borne conidia and rain splashes disperse spores rapidly across canopy and fruits.',
    immediatePrevention: ['Use certified disease-free seed, seed treatment, and avoid overhead sprinkler watering.'],
    recommendedTreatment: 'Apply protective and systemic fungicide spray at first sign of twig dieback or fruit spotting.',
    organicOptions: ['Trichoderma viride foliar spray @ 5 g/L', 'Neem oil 1500 ppm @ 3 ml/L'],
    chemicalOptions: ['Azoxystrobin 23% SC @ 1 ml/L', 'Difenoconazole 25% EC @ 0.5 ml/L', 'Mancozeb 75% WP @ 2.5 g/L'],
    chemicalPrecautions: 'Observe 14-day PHI before fruit picking. Wear protective safety equipment.',
    monitoringSchedule: 'Scout twigs and developing fruits twice weekly during humid spells.',
    whenToConsultExpert: 'Consult KVK if fruit rot appears in >10% of harvested produce.'
  },

  'chilli_bacterial_spot': {
    label: 'chilli_bacterial_spot',
    crop: 'Chilli',
    disease: 'Chilli Bacterial Leaf Spot',
    isHealthy: false,
    pathogenType: 'bacterium',
    pathogenName: 'Xanthomonas campestris pv. vesicatoria',
    defaultSeverity: 'moderate',
    symptoms: [
      'Small, circular to irregular water-soaked dark brown spots with yellow chlorotic halos',
      'Spots become raised and scab-like, causing severe defoliation and blistered fruit spots'
    ],
    possibleCauses: ['Warm humid weather, overhead splashing water, and infected seed stock.'],
    spreadConditions: 'Splashing rain and mechanical handling of wet plants.',
    immediatePrevention: ['Certified clean seed, seed treatment with hot water, and furrow or drip watering.'],
    recommendedTreatment: 'Copper bactericide spray combined with Streptocycline.',
    organicOptions: ['Pseudomonas fluorescens 0.5% WP (10 g/L)', 'Copper Hydroxide 53.8% DF (2 g/L)'],
    chemicalOptions: ['Copper Oxychloride 50% WP (2.5 g/L) + Streptocycline (0.1 g/L)'],
    chemicalPrecautions: '14-day PHI. Full protective clothing.',
    monitoringSchedule: 'Inspect lower leaf surfaces weekly.',
    whenToConsultExpert: 'Consult expert if defoliation exceeds 15%.'
  },

  'chilli_leaf_curl': {
    label: 'chilli_leaf_curl',
    crop: 'Chilli',
    disease: 'Chilli Leaf Curl Virus (ChiLCV)',
    isHealthy: false,
    pathogenType: 'virus',
    pathogenName: 'Chilli leaf curl virus (Begomovirus)',
    defaultSeverity: 'severe',
    symptoms: [
      'Upward curling and puckering of leaf margins, reduced leaf size',
      'Vein clearing, crowding of foliage, and severe plant stunting with bushy appearance'
    ],
    possibleCauses: ['High whitefly (Bemisia tabaci) and thrips vectors in warm dry spells.'],
    spreadConditions: 'Transmitted by whitefly vectors; non-seed borne.',
    immediatePrevention: ['Yellow and blue sticky traps, barrier crops, and weed host eradication.'],
    recommendedTreatment: 'Vector suppression; cannot be cured chemically once infected.',
    organicOptions: ['Neem oil 1500 ppm @ 3 ml/L', 'Lecanicillium lecanii bio-insecticide @ 5 g/L'],
    chemicalOptions: ['Diafenthiuron 50% WP @ 1.25 g/L', 'Flonicamid 50% WG @ 0.3 g/L'],
    chemicalPrecautions: 'Rotate insecticide classes. Wear PPE.',
    monitoringSchedule: 'Inspect upper shoots for whitefly twice weekly.',
    whenToConsultExpert: 'Notify KVK if curling affects >20% of young plants.'
  },

  'chilli_healthy': {
    label: 'chilli_healthy',
    crop: 'Chilli',
    disease: 'Chilli Healthy Leaf',
    isHealthy: true,
    pathogenType: 'none',
    defaultSeverity: 'none',
    symptoms: ['Smooth, deep green ovate leaves with clean margins and no curling or spotting'],
    possibleCauses: ['Good soil drainage, certified seed, and proactive vector monitoring'],
    spreadConditions: 'Non-applicable.',
    immediatePrevention: ['Routine scouting and drip irrigation.'],
    recommendedTreatment: 'Routine management.',
    organicOptions: ['Preventive neem and bio-stimulant foliar maintenance.'],
    chemicalOptions: ['None required.'],
    chemicalPrecautions: 'None.',
    monitoringSchedule: 'Scout once every 5-7 days.',
    whenToConsultExpert: 'Routine check.'
  }
};

