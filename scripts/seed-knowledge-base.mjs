/**
 * SmartFarm AI — Authoritative Agricultural Knowledge Base Seeder (ICAR / SAU / IMD / PPQS / ISRO)
 * Populates KnowledgeDocument & KnowledgeChunk tables for grounded RAG retrieval.
 * Idempotent upsert by document slug — safe to re-run to update knowledge without rebuilding app.
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const DOCUMENTS = [
  {
    slug: 'icar-iiwbr-wheat-cri-irrigation-rust',
    title: 'Wheat Critical Stage Irrigation (CRI), Balanced Fertilization & Rust Management',
    issuingOrg: 'ICAR-IIWBR & Anand Agricultural University (AAU)',
    sourceUrl: 'https://iiwbr.icar.gov.in',
    publicationDate: new Date('2025-10-15'),
    crop: 'wheat',
    topic: 'irrigation',
    region: 'Gujarat, Punjab, Haryana, MP, UP (Indo-Gangetic & Western Plains)',
    language: 'en',
    license: 'Government Open Data / Public Agricultural Extension',
    chunks: [
      {
        title: 'Wheat Crown Root Initiation (CRI) & Irrigation Schedule',
        keywords: 'wheat gehu ઘઉં गेहूं cri irrigation water 20 25 days sowing tillering flowering milk dough',
        content:
          'Crown Root Initiation (CRI) at 20–25 Days After Sowing (DAS) is the single most critical irrigation stage in wheat. Missing or delaying CRI irrigation causes irreversible 25–30% yield loss because crown roots fail to elongate properly. Subsequent critical stages are Active Tillering (40–45 DAS), Jointing (60–65 DAS), Flowering/Anthesis (80–85 DAS), and Milk/Dough Grain Filling (95–105 DAS). Top-dress 25–50% split Nitrogen (Urea) right after CRI irrigation when soil is workable. Avoid standing water >12 hours in heavy black soils and stop irrigation 12–15 days before harvest.',
      },
      {
        title: 'Wheat Yellow & Brown Rust IPM Monitoring',
        keywords: 'wheat rust yellow stripe brown leaf pustules fungicide propiconazole tebuconazole scouting',
        content:
          'Scout wheat fields weekly from jointing onwards for yellow rust (parallel yellow stripes on upper leaves) and brown rust (scattered orange-brown pustules). Prefer rust-resistant varieties (e.g. GW-496, HD-3086, HI-1544). Avoid preventive spraying without confirmed infection. When early foci appear, follow ICAR/KVK advisories for CIB&RC-approved triazole fungicides (such as Propiconazole 25% EC or Tebuconazole) strictly following label dose and Pre-Harvest Interval (PHI).',
      },
    ],
  },
  {
    slug: 'icar-cicr-cotton-ipm-pink-bollworm',
    title: 'Cotton Integrated Pest Management (IPM) — Pink Bollworm & Sucking Pests',
    issuingOrg: 'ICAR-CICR (Central Institute for Cotton Research) & AAU',
    sourceUrl: 'https://cicr.icar.gov.in',
    publicationDate: new Date('2025-07-01'),
    crop: 'cotton',
    topic: 'pest_management',
    region: 'Gujarat, Maharashtra, Telangana, Punjab',
    language: 'en',
    license: 'Government Open Data / Public Agricultural Extension',
    chunks: [
      {
        title: 'Pink Bollworm Monitoring, Rosette Flowers & ETL Protocol',
        keywords: 'cotton kapas કપાસ कपास pink bollworm pbw pheromone trap rosette flower square boll',
        content:
          'Install Pink Bollworm pheromone traps @ 5 traps/hectare starting at 45 DAS (square formation) and replace lures every 30 days. Inspect 20 random plants weekly for rosette flowers and split-open 20 green bolls during boll development. Economic Threshold Level (ETL) is 8 moths/trap/night for 3 consecutive nights or >10% damaged flowers/bolls. Destroy rosette flowers manually, spray neem-based botanical formulations early, avoid repeated synthetic pyrethroids which trigger whitefly outbreaks, and terminate cotton timely at 165–180 days without extending/ratooning to break the PBW lifecycle.',
      },
      {
        title: 'Cotton Sucking Pests (Whitefly, Jassids, Thrips) & Alternaria Leaf Blight',
        keywords: 'cotton whitefly jassids thrips aphids yellow sticky trap leaf spot alternaria blight grey mildew',
        content:
          'Place 10–15 yellow/blue sticky traps per acre from 25 DAS to monitor and trap whitefly, jassids, and thrips. Conserve natural enemies (ladybird beetles, chrysoperla) by avoiding harsh early-season chemical sprays. For Alternaria leaf blight or grey mildew during humid spells, ensure good drainage, avoid excess nitrogen, and use bio-fungicides (Trichoderma/Pseudomonas) or CIB&RC-approved fungicides only when disease crosses threshold.',
      },
    ],
  },
  {
    slug: 'ppqs-cibrc-pesticide-safety-banned-list',
    title: 'PPQS / CIB&RC Pesticide Safety, Banned Pesticides (Monocrotophos Warning), PHI & PPE',
    issuingOrg: 'Directorate of Plant Protection, Quarantine & Storage (PPQS / CIB&RC), Govt. of India',
    sourceUrl: 'https://ppqs.gov.in',
    publicationDate: new Date('2026-01-10'),
    crop: 'general',
    topic: 'pesticide_safety',
    region: 'Pan-India',
    language: 'en',
    license: 'Government Open Data License - India',
    chunks: [
      {
        title: 'Monocrotophos & Banned/Restricted Pesticides Warning for Indian Farmers',
        keywords: 'monocrotophos banned pesticide toxic vegetable tomato safety cibrc ppqs restricted spray',
        content:
          'CRITICAL SAFETY WARNING: Monocrotophos (an extremely hazardous Class Ib organophosphate) is STRICTLY BANNED for use on vegetables in India by CIB&RC/Ministry of Agriculture and is being phased out due to severe acute human toxicity, residue hazards, and pollinator death. NEVER spray Monocrotophos on tomato, brinjal, okra, chilli, or any edible vegetable crop! Similarly, Endosulfan, Phorate, Methyl Parathion, Dichlorvos (DDVP), Phosphamidon, and Benomyl are banned in India. Always use IPM first (cultural control, traps, neem/bio-pesticides) and check CIB&RC crop-specific registration before any chemical purchase.',
      },
      {
        title: 'Mandatory Spray Safety: PPE, Weather Window & Pre-Harvest Interval (PHI)',
        keywords: 'spray safety ppe mask gloves wind rain phi pre-harvest interval bees pollination timing',
        content:
          'Follow strict pesticide safety rules: (1) Never spray solely by crop age/calendar — confirm pest or disease crosses Economic Threshold Level (ETL) first. (2) Do NOT spray if rain probability >40–50% within 6–12 hours, wind speed >12–15 km/h (drift hazard), or temperature >35°C. (3) Never spray insecticides during morning bee foraging hours (8 AM – 12 PM) on flowering crops. (4) Wear full PPE: waterproof gloves, N95/respirator mask, goggles, full-sleeve shirt, trousers, and boots. (5) Strictly respect the label Pre-Harvest Interval (PHI) before harvesting produce.',
      },
    ],
  },
  {
    slug: 'icar-iihr-tomato-yellow-leaves-blight-ipm',
    title: 'Tomato Leaf Yellowing, Early/Late Blight, Leaf Curl & Fruit Borer IPM',
    issuingOrg: 'ICAR-IIHR (Indian Institute of Horticultural Research, Bengaluru)',
    sourceUrl: 'https://iihr.res.in',
    publicationDate: new Date('2025-09-20'),
    crop: 'tomato',
    topic: 'disease_management',
    region: 'Pan-India',
    language: 'en',
    license: 'Public Agricultural Extension',
    chunks: [
      {
        title: 'Diagnosing Yellow Leaves & Spots in Tomato (Nutrient vs Blight vs Virus)',
        keywords: 'tomato tamatar ટામેટા टमाटर yellow leaves spots curling early blight late blight magnesium nitrogen virus whitefly',
        content:
          'Yellowing leaves in tomato can arise from four distinct causes — inspect closely before treating: (1) Lower older leaves turning uniformly yellow often indicate Nitrogen deficiency or waterlogging/poor root drainage. (2) Interveinal yellowing on older leaves suggests Magnesium deficiency. (3) Concentric dark-brown "bullseye" target rings surrounded by yellow halos indicate Early Blight (Alternaria solani), whereas dark water-soaked rapidly spreading patches in cool humid weather indicate Late Blight (Phytophthora infestans). (4) Upward curling with yellow leaf margins and stunted growth indicates Tomato Leaf Curl Virus (ToLCV) spread by whitefly. Remove infected lower leaves, switch to drip irrigation (keep foliage dry), place yellow sticky traps for whitefly, and upload a clear leaf photo in SmartFarm Crop Disease AI before choosing a CIB&RC-approved bio/fungicide.',
      },
    ],
  },
  {
    slug: 'icar-dgr-groundnut-pegging-tikka-aflatoxin',
    title: 'Groundnut Pegging Gypsum, Tikka Leaf Spot & Aflatoxin Prevention',
    issuingOrg: 'ICAR-DGR (Directorate of Groundnut Research, Junagadh) & JAU',
    sourceUrl: 'https://dgr.icar.gov.in',
    publicationDate: new Date('2025-06-15'),
    crop: 'groundnut',
    topic: 'crop_management',
    region: 'Gujarat (Saurashtra), Rajasthan, Andhra Pradesh, Tamil Nadu',
    language: 'en',
    license: 'Public Agricultural Extension',
    chunks: [
      {
        title: 'Groundnut Gypsum at Pegging & Tikka Disease IPM',
        keywords: 'groundnut peanut magfali મગફળી मूंगफली gypsum pegging flowering tikka leaf spot aflatoxin pod',
        content:
          'Stop all inter-cultivation in groundnut once flowering and pegging begin (35–40 DAS) so developing pegs are not disturbed. Apply agricultural Gypsum (Calcium + Sulphur) near the root zone at flowering/pegging to prevent unfilled empty pods ("pops"). Maintain soft, moist topsoil during pegging and pod filling. Scout for Early/Late Tikka leaf spot during humid spells and use Rhizobium + Trichoderma seed treatment to protect against collar rot. Harvest at 75–80% pod marbling and dry pods promptly to ≤8% moisture to prevent Aspergillus aflatoxin.',
      },
    ],
  },
  {
    slug: 'icar-nrri-rice-awd-blast-sheath-blight',
    title: 'Rice (Paddy) Water-Saving AWD Irrigation, Blast & Sheath Blight Management',
    issuingOrg: 'ICAR-NRRI (National Rice Research Institute, Cuttack)',
    sourceUrl: 'https://icar-nrri.in',
    publicationDate: new Date('2025-08-05'),
    crop: 'rice',
    topic: 'irrigation',
    region: 'Pan-India Rice Tracts',
    language: 'en',
    license: 'Public Agricultural Extension',
    chunks: [
      {
        title: 'Rice AWD Irrigation, Nitrogen Splits & Blast/BPH Prevention',
        keywords: 'rice paddy dhan ડાંગર धान awd irrigation blast sheath blight bph stem borer urea nitrogen',
        content:
          'Adopt Alternate Wetting and Drying (AWD) during rice active tillering to save 20–30% water, strengthen root aeration, and reduce Brown Planthopper (BPH) buildup. Maintain shallow 3–5 cm standing water during Panicle Initiation and Flowering, then drain fields 10–12 days before harvest. Apply Nitrogen in 3 splits guided by a Leaf Colour Chart (LCC) — excess nitrogen directly triggers Rice Blast and BPH hopper burn. Inspect stem base near water line for Sheath Blight lesions.',
      },
    ],
  },
  {
    slug: 'imd-agromet-weather-spray-irrigation-rules',
    title: 'IMD Agromet Weather Advisory — Rain, Wind & Heatwave Decision Rules',
    issuingOrg: 'India Meteorological Department (IMD) — Gramin Krishi Mausam Sewa (GKMS)',
    sourceUrl: 'https://imdagrimet.gov.in',
    publicationDate: new Date('2026-02-01'),
    crop: 'general',
    topic: 'weather_advisory',
    region: 'Pan-India',
    language: 'en',
    license: 'Government Open Data License - India',
    chunks: [
      {
        title: 'Weather Thresholds for Spraying, Fertilizer Application & Irrigation',
        keywords: 'weather rain forecast spray wind heatwave temperature humidity irrigation fertilizer postpone tomorrow',
        content:
          'IMD Agromet Field Decision Rules: (1) Spraying: Postpone pesticide/foliar spraying if rainfall probability exceeds 40–50% within next 12 hours (wash-off waste) or wind speed exceeds 12–15 km/h (spray drift). (2) Irrigation: Skip or delay irrigation if ≥10–15 mm rainfall is forecast within 48 hours; during heatwaves (>38–40°C), apply light cooling evening irrigation to reduce flower/boll drop. (3) Fertilizer Top-Dressing: Never broadcast urea on standing flood water before heavy rain (severe leaching and runoff loss). (4) Harvesting: Shift harvested grain/kapas/groundnut under waterproof tarpaulin if rain is forecast.',
      },
    ],
  },
  {
    slug: 'soil-health-card-nutrient-management-gujarat',
    title: 'Soil Health Card Balanced Nutrition & Black/Saline Soil Reclamation',
    issuingOrg: 'Department of Agriculture & Farmers Welfare (Soil Health Card) & ICAR-CSSRI',
    sourceUrl: 'https://soilhealth.dac.gov.in',
    publicationDate: new Date('2025-11-12'),
    crop: 'soil_health',
    topic: 'soil_health',
    region: 'Gujarat & Pan-India',
    language: 'en',
    license: 'Government Open Data License - India',
    chunks: [
      {
        title: 'Soil Health Card Testing, Organic Carbon & Gypsum Reclamation',
        keywords: 'soil health card fertilizer dap urea potash zinc ph salinity gypsum green manure dhaincha organic carbon',
        content:
          'Always base exact fertilizer quantities on a valid Soil Health Card (SHC) lab report rather than guesswork. Combine organic manures (FYM, vermicompost, or Dhaincha green manuring) with split chemical fertilizers to improve Soil Organic Carbon (SOC) and microbial activity. For sodic/alkaline soils (pH >8.5, high ESP), apply soil-test-recommended Gypsum followed by leaching and Dhaincha incorporation. For Zinc deficiency (common in rice/wheat/maize), apply Zinc Sulphate separately from phosphatic fertilizers (DAP/SSP) to avoid insoluble zinc phosphate precipitation.',
      },
    ],
  },
  {
    slug: 'agmarknet-mandi-postharvest-pricing-guide',
    title: 'AGMARKNET / e-NAM Mandi Grading, Moisture & Wholesale Price Optimization',
    issuingOrg: 'Directorate of Marketing & Inspection (DMI) — AGMARKNET / data.gov.in',
    sourceUrl: 'https://agmarknet.gov.in',
    publicationDate: new Date('2025-12-01'),
    crop: 'general',
    topic: 'market_prices',
    region: 'Pan-India APMC Mandis',
    language: 'en',
    license: 'Government Open Data License - India',
    chunks: [
      {
        title: 'Understanding APMC Modal Price, Grading & Reducing Post-Harvest Deductions',
        keywords: 'mandi price bhav भाव ભાવ apmc agmarknet modal min max quintal selling grade moisture storage',
        content:
          'APMC mandi prices are quoted per quintal (100 kg) with Minimum, Maximum, and Modal (most common traded) rates. Actual counter price depends heavily on grain moisture (dry wheat/pulses to ≤10–12%, groundnut to ≤8%), foreign-matter cleaning, and uniform variety grading. Compare latest reported modal prices across nearby district APMCs (e.g., Rajkot, Gondal, Unjha, Vadodara) and check arrival date timestamps before booking transport. Never treat stale/cached mandi rates as live spot guarantees.',
      },
    ],
  },
  {
    slug: 'icar-cicr-cotton-agronomy-yield-production',
    title: 'Cotton Production Technology, High Yield Varieties & Nutrient Management',
    issuingOrg: 'ICAR-CICR (Central Institute for Cotton Research) & AAU Anand',
    sourceUrl: 'https://cicr.icar.gov.in',
    publicationDate: new Date('2025-05-10'),
    crop: 'cotton',
    topic: 'crop_management',
    region: 'Gujarat, Maharashtra, Telangana, Rajasthan',
    language: 'en',
    license: 'Government Open Data / Public Agricultural Extension',
    chunks: [
      {
        title: 'How to Increase Cotton Production — Varieties, Soil & Spacing',
        keywords: 'cotton kapas કપાસ कपास production yield increase variety soil spacing gcot bt hybrid square boll',
        content:
          'To increase cotton production: (1) Variety Selection: Choose certified Bt hybrids or regional university varieties like G.Cot.Hy-8, G.Cot.Hy-12, or BG-II suited to your soil and irrigation (drip vs rainfed). (2) Soil Preparation: Deep summer ploughing followed by 2 harrowing passes. Incorporate 8–10 tonnes/ha well-decomposed FYM or compost. (3) Spacing & Sowing: Maintain 120 x 45 cm for irrigated hybrid cotton or 90 x 30 cm under rainfed conditions; optimal sowing window is June 15 to July 10 with onset of monsoon. (4) Square/Boll Drop Prevention: Foliar spray 2% DAP (20g/L) or 19:19:19 @ 5g/L along with Planofix (NAA) @ 4 ml per 15 litres water at peak flowering and boll formation to drastically reduce shedding. (5) Integrated Moisture Conservation: Broad bed furrow (BBF) or drip irrigation increases water-use efficiency by 40% and yields by 20–25%.',
      },
      {
        title: 'Fertilizer Planning & Application Timing for Cotton',
        keywords: 'cotton fertilizer urea dap mop npk split application timing basal square flowering zinc potash',
        content:
          'Balanced fertilizer schedule for hybrid irrigated cotton (NPK 120:60:60 kg/ha in Gujarat): (1) Basal at Sowing: Apply full Phosphorus (130 kg DAP or 375 kg SSP) + full Potash (100 kg MOP) + 25% Nitrogen (50 kg Urea) placed 5–7 cm beside the seed furrow. (2) First Top-Dressing (Square Formation ~30–35 DAS): Top-dress 25% Nitrogen (50 kg Urea) when soil has optimum moisture. (3) Second Top-Dressing (Peak Flowering ~60–65 DAS): Apply 25% Nitrogen (50 kg Urea). (4) Third Top-Dressing (Boll Development ~80–90 DAS): Apply remaining 25% Nitrogen (50 kg Urea). In black soils deficient in micronutrients, apply 25 kg/ha Zinc Sulphate (21%) at land preparation once every 2–3 years separately from phosphatic fertilizers. For foliar nutrition during boll filling, spray 1% Potassium Nitrate (13:0:45) twice at 15-day intervals.',
      },
    ],
  },
  {
    slug: 'icar-iihr-chilli-whitefly-thrips-leaf-curl',
    title: 'Chilli Sucking Pest Management (Whiteflies, Thrips) & Leaf Curl Virus',
    issuingOrg: 'ICAR-IIHR (Bengaluru) & Anand Agricultural University (AAU)',
    sourceUrl: 'https://iihr.res.in',
    publicationDate: new Date('2025-08-15'),
    crop: 'chilli',
    topic: 'pest_management',
    region: 'Gujarat, Andhra Pradesh, Karnataka, Maharashtra',
    language: 'en',
    license: 'Public Agricultural Extension',
    chunks: [
      {
        title: 'Controlling Whiteflies & Thrips in Chilli (Preventing Churda-Murda Leaf Curl)',
        keywords: 'chilli mirch મરચી मिर्च whitefly thrips leaf curl virus churda murda yellow sticky trap neem azadirachtin',
        content:
          'Chilli Leaf Curl (popularly called "Churda-Murda" or "Kukada") is caused by Chilli Leaf Curl Virus transmitted primarily by Whitefly (Bemisia tabaci) and upward/downward cup curling caused by Thrips and Mites. Control Strategy: (1) Monitoring: Install 15–20 Yellow Sticky Traps per acre for whiteflies and 15–20 Blue Sticky Traps for thrips at canopy height. (2) Cultural & Border Protection: Plant 2–3 dense border rows of Maize or Sorghum as physical barriers against flying sucking vectors. (3) Botanical / Bio-pesticides: Spray Neem formulation (Azadirachtin 10,000 ppm @ 1.5–2 ml/L) or Neem Seed Kernel Extract (NSKE 5%) at first notice of sucking pests to deter oviposition and feed disruption. (4) Beneficial Conservation: Avoid early indiscriminate spraying of synthetic pyrethroids (e.g. Cypermethrin) which destroy natural predators (coccinellid beetles, chrysoperla) and trigger secondary whitefly resurgences. (5) Approved Chemical Options: When ETL is crossed (>5–10 whiteflies/leaf or 5 thrips/leaf), consult CIB&RC crop labels for approved selective translaminar molecules such as Diafenthiuron 50% WP or Spiromesifen 22.9% SC for mites/whiteflies, alternating modes of action with strict adherence to PPE and Pre-Harvest Interval (PHI).',
      },
    ],
  },
  {
    slug: 'icar-iari-fertilizer-dap-vs-npk-comparison',
    title: 'Fertilizer Science: DAP (18:46:0) vs Complex NPK (10:26:26 / 12:32:16 / 19:19:19) & SSP',
    issuingOrg: 'ICAR-IARI (New Delhi) & Ministry of Chemicals and Fertilizers',
    sourceUrl: 'https://iari.res.in',
    publicationDate: new Date('2025-07-20'),
    crop: 'all',
    topic: 'fertilizer',
    region: 'Pan-India',
    language: 'en',
    license: 'Government Open Data / Public Agricultural Extension',
    chunks: [
      {
        title: 'Difference Between DAP and NPK Fertilizers — Scientific Comparison',
        keywords: 'dap npk difference comparison 18:46:0 10:26:26 12:32:16 19:19:19 urea potash ssp fertilizer ખાતર खाद',
        content:
          'Key Differences between DAP (Di-Ammonium Phosphate) and Complex NPK: (1) Nutrient Composition: DAP contains 18% Nitrogen (N) and 46% Phosphorus (P2O5) with 0% Potassium (K2O). Complex NPK fertilizers (such as 10:26:26, 12:32:16, or 19:19:19) supply all three primary macro-nutrients (N, P, and K) in balanced ratios. (2) Potassium Role: DAP has ZERO Potash (K). Potassium is indispensable for crop drought resistance, enzyme activation, stalk strength, grain weight, and fruit sweetness. If you apply only DAP, you MUST apply Muriate of Potash (MOP 60% K2O) separately to prevent potassium starvation. (3) Stage of Application: DAP is purely a basal/starter fertilizer applied at or before sowing to promote early root elongation. Complex NPK (like 10:26:26) is ideal as a balanced basal fertilizer for long-duration or heavy-bearing crops (cotton, sugarcane, vegetables, potato). Water-soluble NPK (19:19:19) is meant strictly for foliar spray or drip fertigation during vegetative and reproductive stages, not broadcast. (4) Single Super Phosphate (SSP 16% P): In oilseeds (groundnut, mustard, soybean) and pulses, SSP is often superior to DAP because SSP contains 16% P2O5 PLUS 11% Sulphur and 19% Calcium, which directly boosts oil synthesis and root nodulation.',
      },
    ],
  },
  {
    slug: 'icar-fao-fertilizer-mixing-compatibility',
    title: 'Fertilizer Mixing Compatibility, Precautions & Storage Rules',
    issuingOrg: 'ICAR-IARI & FAO (Food and Agriculture Organization)',
    sourceUrl: 'https://iari.res.in',
    publicationDate: new Date('2025-09-10'),
    crop: 'all',
    topic: 'fertilizer',
    region: 'Pan-India',
    language: 'en',
    license: 'Public Agricultural Extension',
    chunks: [
      {
        title: 'Can I Mix Two Fertilizers Together? Complete Compatibility Matrix',
        keywords: 'mix fertilizer mixing compatibility urea dap mop ssp zinc sulphate calcium nitrate precipitation ખાતર મિશ્રણ खाद मिलाना',
        content:
          'Rules for Mixing Fertilizers: (1) NEVER MIX Zinc Sulphate with DAP or SSP: Mixing soluble zinc with phosphatic fertilizers forms insoluble Zinc Phosphate, which turns both zinc and phosphorus completely unavailable to plant roots. Always apply Zinc Sulphate at least 15–20 days apart or broadcast it at land preparation and apply DAP at sowing. (2) NEVER MIX Calcium Nitrate with Phosphates or Sulphates: Mixing Calcium Nitrate with DAP, SSP, or Potassium Sulphate precipitates insoluble Calcium Phosphate or Gypsum sludge, clogging drip nozzles and locking nutrients. (3) MIX ONLY JUST BEFORE APPLICATION: Urea can be mixed with MOP (Potash) or Ammonium Sulphate, but the mixture must be applied immediately. If stored even for a few hours, Urea and MOP absorb atmospheric moisture (deliquescence) and turn into wet, sticky, unspreadable mud. (4) SAFE TO MIX: Urea + MOP (apply same day), DAP + MOP (apply same day), Ammonium Sulphate + SSP. (5) Biofertilizers & Micronutrient Chelates: Never mix biofertilizers (Rhizobium, PSB, Azotobacter) directly with chemical fertilizers or fungicides; keep them 48 hours apart.',
      },
    ],
  },
  {
    slug: 'icar-nrri-rice-water-requirement-awd',
    title: 'Rice (Paddy) Water Requirements, Critical Growth Stages & AWD Irrigation',
    issuingOrg: 'ICAR-NRRI (National Rice Research Institute, Cuttack)',
    sourceUrl: 'https://icar-nrri.in',
    publicationDate: new Date('2025-10-05'),
    crop: 'rice',
    topic: 'irrigation',
    region: 'Gujarat, Punjab, Haryana, West Bengal, Odisha, Andhra Pradesh',
    language: 'en',
    license: 'Government Open Data / Public Agricultural Extension',
    chunks: [
      {
        title: 'How Much Water Does a Rice Crop Require? AWD Water-Saving Method',
        keywords: 'rice water requirement paddy dhan ડાંગર धान awd alternate wetting drying panicle flowering mm litres irrigation',
        content:
          'Rice Water Requirements & Irrigation Management: (1) Total Water Requirement: Rice requires approximately 1000 to 1500 mm (10 to 15 lakh litres per hectare, or ~2500–3000 litres of water to produce 1 kg of unhusked paddy). (2) Continuous Flooding is NOT necessary: Contrary to traditional belief, keeping paddy submerged continuously in 10 cm water wastes water and creates anaerobic root rot and methane emissions. (3) Alternate Wetting and Drying (AWD): Adopt AWD from 15 days after transplanting until panicle initiation. Install a perforated field water tube (15 cm diameter, 30 cm length) into the soil. Re-irrigate only when the water level inside the tube drops 10–15 cm below the soil surface. This saves 20–30% irrigation water without reducing grain yield. (4) Critical Stages Requiring Standing Water: Maintain shallow 3–5 cm standing water during Panicle Initiation (45–55 DAT) and Flowering/Anthesis (70–80 DAT). Moisture stress during these 2 stages causes high spikelet sterility (empty grains). (5) Pre-Harvest Drainage: Completely drain water out of the field 10–15 days before harvest to facilitate uniform ripening and combine harvesting.',
      },
    ],
  },
  {
    slug: 'aau-jau-gujarat-agroclimatic-crop-selection',
    title: 'Gujarat Agro-Climatic Zones, Weather Adaptation & Seasonal Crop Planning',
    issuingOrg: 'Anand Agricultural University (AAU) & Junagadh Agricultural University (JAU)',
    sourceUrl: 'https://aau.in',
    publicationDate: new Date('2025-11-01'),
    crop: 'all',
    topic: 'crop_selection',
    region: 'Gujarat (All 8 Agro-Climatic Zones)',
    language: 'en',
    license: 'Government Open Data / Public Agricultural Extension',
    chunks: [
      {
        title: 'Which Crops are Suitable for Gujarat Climate? Seasonal Selection Guide',
        keywords: 'gujarat climate suitable crops saurashtra bhal north gujarat middle south kharif rabi summer kapas cotton groundnut wheat',
        content:
          'Gujarat Crop Selection by Season & Agro-Climatic Zones: Gujarat is divided into 8 distinct Agro-Climatic Zones ranging from South Gujarat heavy rainfall to North-West arid Kachchh. (1) Kharif Season (June to October): Best suited crops are Cotton (Bt hybrids in Saurashtra, Middle & North Gujarat), Groundnut (GG-20, GJG-22 in Saurashtra red/medium black soils), Castor (GCH-7, GCH-9 in North & Middle Gujarat), Pearl Millet / Bajra (GHB-538, GHB-744 in semi-arid tracts), Soybean (in eastern tribal belts), and Pigeon Pea / Tur. (2) Rabi Season (October to March): Wheat (GW-496, GW-322, GW-366 in irrigated tracts; Bhal Bhalia wheat A-206 under conserved moisture in Bhal tract), Cumin / Jeera (GC-4 in North Gujarat & Saurashtra dry winter tracts), Mustard / Rai (GM-3 in North Gujarat), Gram / Chana (GG-2, GG-5 in Bhal, Saurashtra & Central Gujarat), and Fennel / Variali. (3) Summer / Zaid Season (February to May): Summer Groundnut (GG-2, TG-37A under assured irrigation), Summer Moong / Green Gram (GM-4), Summer Bajra, and Sesame / Tal. (4) Commercial Fruits & Vegetables: Mango (Kesar in Gir-Somnath/Junagadh, Alphonso in Valsad/Navsari), Banana (Grand Naine in Anand/Bharuch/Vadodara), Papaya (Taiwan Red Lady in Central Gujarat), Pomegranate (Bhagwa in Banaskantha/Kachchh dry zones), Tomato, Chilli, and Onion (Mahuva/Bhavnagar belt).',
      },
    ],
  },
  {
    slug: 'icar-iiss-natural-soil-fertility-improvement',
    title: 'Natural Soil Fertility Improvement: Organic Manure, Green Manuring & Biofertilizers',
    issuingOrg: 'ICAR-Indian Institute of Soil Science (IISS, Bhopal) & Dept of Agriculture',
    sourceUrl: 'https://iiss.icar.gov.in',
    publicationDate: new Date('2025-06-25'),
    crop: 'soil_health',
    topic: 'soil_health',
    region: 'Pan-India',
    language: 'en',
    license: 'Government Open Data / Public Agricultural Extension',
    chunks: [
      {
        title: 'How to Improve Soil Fertility Naturally — Practical Organic Practices',
        keywords: 'soil fertility natural organic improve vermicompost fym green manure dhaincha biofertilizer crop rotation humus carbon જમીન ફળદ્રુપતા',
        content:
          'Natural Methods to Rejuvenate and Improve Soil Fertility: (1) Well-Decomposed Farm Yard Manure (FYM): Incorporate 8–10 tonnes/ha of well-rotted FYM or compost 3–4 weeks prior to sowing. It improves soil aggregate structure, water-holding capacity, and cation exchange capacity (CEC). (2) Vermicompost: Apply 2–3 tonnes/ha in the root zone. Vermicompost is rich in humus, plant growth hormones (auxins, gibberellins), and beneficial microbes. (3) Green Manuring with Dhaincha (Sesbania) or Sunhemp: Sow Dhaincha @ 20–25 kg/ha with early pre-monsoon showers. At 45–50 days (before flowering when succulent), plough and bury it back into the soil with a disc plough. This adds 20–25 tonnes of green biomass and fixes 60–80 kg of atmospheric nitrogen per hectare while reclaiming alkaline/sodic soils. (4) Beneficial Biofertilizers: Treat seeds or drench soil with Azotobacter / Azospirillum (nitrogen fixers for cereals/cotton), Rhizobium (for pulses and groundnut), Phosphate Solubilizing Bacteria (PSB) to mobilize fixed insoluble phosphorus, and Potassium Mobilizing Bacteria (KMB). (5) Legume Crop Rotation: Rotate exhaustive crops (cotton, wheat, maize) with short-duration legumes (moong, cowpea, chickpea) to break pest cycles and replenish root-zone nitrogen nodules. (6) Crop Residue Mulching: Never burn crop stubble or straw; mulch residues on the surface to preserve soil moisture, lower soil temperature by 3–5°C in summer, and feed earthworms.',
      },
    ],
  },
  {
    slug: 'icar-heavy-rainfall-drainage-recovery',
    title: 'Heavy Rainfall, Waterlogging & Post-Flood Crop Recovery Protocol',
    issuingOrg: 'ICAR Extension Division & Anand Agricultural University (AAU)',
    sourceUrl: 'https://icar.gov.in',
    publicationDate: new Date('2025-07-25'),
    crop: 'all',
    topic: 'weather_advisory',
    region: 'Gujarat, Maharashtra, Pan-India',
    language: 'en',
    license: 'Government Open Data / Public Agricultural Extension',
    chunks: [
      {
        title: 'What to Do if Crop is Affected by Heavy Rainfall or Waterlogging',
        keywords: 'heavy rainfall rain waterlogging flood drainage standing water recovery foliar spray urea drenching wilt root rot વરસાદ ભરાવો',
        content:
          'Emergency Action Plan for Crops Affected by Heavy Rainfall & Waterlogging: (1) Urgent Surface Drainage: Standing water for >12–24 hours asphyxiates plant roots, depriving them of oxygen and causing root decay and plant collapse. Cut drainage trenches at the lowest corner of the plot immediately to drain all excess water into drainage ditches. (2) Soil Aeration: As soon as the topsoil is workable, break the surface soil crust by shallow hand-hoeing or inter-culturing to re-admit air to suffocated root zones. (3) Foliar Revitalization Spray: Saturated, suffocated roots cannot absorb soil fertilizers. As soon as the rain ceases, apply a foliar spray of 1–2% Urea (10–20g per litre) or water-soluble 19:19:19 @ 5g/L to supply immediate nitrogen and prevent leaf yellowing. (4) Prevent Fungal Wilt and Collar Rot: Waterlogged warm soil creates an explosion of soil-borne fungi (Pythium, Phytophthora, Rhizoctonia, Fusarium). Drench the base of affected plants with Trichoderma viride / harzianum @ 10g/L or CIB&RC-approved Copper Oxychloride (COC 50% WP @ 2.5–3g/L). (5) Postpone Heavy Soil Fertilizers: Do not broadcast granular urea or DAP into soaked, slushy soil; nutrients will leach out into groundwater or wash away.',
      },
    ],
  },
  {
    slug: 'icar-ncipm-integrated-pest-management',
    title: 'Integrated Pest Management (IPM) 5-Pillar Framework & Threshold Monitoring',
    issuingOrg: 'ICAR-NCIPM (National Research Centre for Integrated Pest Management) & PPQS',
    sourceUrl: 'https://ncipm.icar.gov.in',
    publicationDate: new Date('2025-08-20'),
    crop: 'all',
    topic: 'pest_management',
    region: 'Pan-India',
    language: 'en',
    license: 'Government Open Data License - India',
    chunks: [
      {
        title: 'What is Integrated Pest Management (IPM)? The 5 Essential Pillars',
        keywords: 'integrated pest management ipm definition pillars cultural mechanical biological chemical etl economic threshold pest control',
        content:
          'Integrated Pest Management (IPM) is an environmentally sound, comprehensive approach that combines multiple pest-control tactics to keep pest populations below the Economic Injury Level (EIL), minimizing synthetic chemical hazards to humans, pollinators, and beneficial insects. The 5 Pillars of IPM: (1) Cultural Control: Deep summer ploughing to expose pupae to birds and sun, using certified pest-resistant/tolerant seed varieties, optimal crop spacing, clean weeding of field bunds, and strategic crop rotation. (2) Mechanical & Physical Control: Hand-picking and destruction of egg masses, gregarious caterpillars, and rosette flowers; installation of Pheromone Traps (5–10/acre) to monitor and mass-trap moths; and Yellow/Blue Sticky Traps (15–20/acre) to catch aphids, whiteflies, and thrips. (3) Biological Control: Conserving and releasing natural enemies such as Coccinellid predatory beetles, Chrysoperla, Trichogramma egg parasitoids, and applying bio-pathogens like Beauveria bassiana, Metarhizium anisopliae, and Bacillus thuringiensis (Bt). (4) Economic Threshold Level (ETL) Monitoring: Inspect 15–20 random plants weekly across the field. Never spray based on calendar dates; take curative action ONLY when pest density crosses the verified ETL (e.g., 5–10 whiteflies/leaf, 1 borer larva/plant). (5) Chemical Control as a Last Resort: If other methods fail and pest crosses ETL, choose selective, CIB&RC-approved molecules with minimal pollinator toxicity. Always rotate chemical classes to prevent insect resistance, wear full PPE, and adhere strictly to label Pre-Harvest Intervals (PHI).',
      },
    ],
  },
  {
    slug: 'gov-schemes-pm-kisan-pmfby-kcc-soil-card',
    title: 'Government Agricultural Support Schemes: PM-KISAN, PMFBY, KCC & Soil Health Card',
    issuingOrg: 'Ministry of Agriculture & Farmers Welfare, GoI & Gujarat Agriculture Dept',
    sourceUrl: 'https://agricoop.gov.in',
    publicationDate: new Date('2026-01-05'),
    crop: 'all',
    topic: 'government_schemes',
    region: 'Pan-India & Gujarat',
    language: 'en',
    license: 'Government Open Data License - India',
    chunks: [
      {
        title: 'PM-KISAN Scheme: Eligibility Criteria, Benefits & Registration Process',
        keywords: 'pm-kisan pm kisan samman nidhi 6000 2000 eligibility documents ekyc aadhaar registration yojana યોજના योजना',
        content:
          'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) Details: (1) Financial Benefit: ₹6,000 per year directly transferred into the Aadhaar-seeded bank account of eligible landholding farmer families in 3 equal four-monthly installments of ₹2,000 each. (2) Eligibility: All landholding farmer families with cultivable landholding in their name (recorded in state land records like 7/12 or 8A in Gujarat). (3) Exclusion Criteria: Institutional landholders, farmer families holding constitutional posts, former/present ministers, MPs/MLAs, serving or retired government employees (excluding multi-tasking staff / Class IV), pensioners with monthly pension ≥₹10,000, and persons who paid Income Tax in the previous assessment year. (4) Mandatory Requirements: Mandatory e-KYC (via OTP on pmkisan.gov.in, face authentication app, or CSC center), Aadhaar-seeded Direct Benefit Transfer (DBT) enabled bank account, and land record seeding (Bhulekh / Land verification by revenue patwari/talati). (5) Official Registration: Register online at pmkisan.gov.in portal (Farmers Corner) or through local Gram Suvidha / CSC centres with 7/12, Aadhaar, and bank passbook.',
      },
      {
        title: 'PMFBY Crop Insurance, Kisan Credit Card (KCC) & Gujarat i-Khedut Portal',
        keywords: 'pmfby crop insurance kcc kisan credit card loan subsidy ikhedut i-khedut gujarat interest 4% premium 72 hours',
        content:
          'Key Government Farmer Schemes: (1) PMFBY (Pradhan Mantri Fasal Bima Yojana): Comprehensive crop insurance covering prevented sowing, mid-season localized adversity (hailstorm, landslide, inundation), and post-harvest losses. Farmer premium is capped at only 2.0% of sum insured for Kharif food/oilseed crops, 1.5% for Rabi crops, and 5.0% for annual commercial/horticultural crops (government pays the remaining subsidy). In case of localized flood or crop damage, intimation MUST be submitted within 72 hours via Crop Insurance App or toll-free number 14447. (2) Kisan Credit Card (KCC): Concessional institutional agricultural credit up to ₹3,00,000 at a subsidized base rate of 7% p.a., with an additional 3% Prompt Repayment Incentive (PRI), bringing the effective interest rate to just 4.0% p.a. Collateral-free agricultural loans are available up to ₹1.60 lakh. (3) Gujarat i-Khedut Portal (ikhedut.gujarat.gov.in): Centralized Gujarat state portal for online applications for agricultural machinery subsidies (tractors, rotavators, spray pumps), water storage ponds, farm fencing, and micro-irrigation drip/sprinkler subsidies via GGRC (up to 70% subsidy for small and marginal farmers). (4) Soil Health Card Scheme: Provides 12-parameter soil fertility analysis (pH, EC, Organic Carbon, N, P, K, S, Zn, Fe, Cu, Mn, B) every 3 years free of charge through local agricultural departments.',
      },
    ],
  },
  {
    slug: 'icar-vegetables-onion-potato-brinjal-ipm',
    title: 'Package of Practices & IPM for Potato, Onion, and Brinjal Crops',
    issuingOrg: 'ICAR-CPRI (Shimla), ICAR-DOGR (Pune) & ICAR-IIHR (Bengaluru)',
    sourceUrl: 'https://cpri.icar.gov.in',
    publicationDate: new Date('2025-09-15'),
    crop: 'vegetables',
    topic: 'pest_management',
    region: 'Gujarat, UP, West Bengal, Maharashtra, Bihar',
    language: 'en',
    license: 'Public Agricultural Extension',
    chunks: [
      {
        title: 'Potato Late Blight, Onion Thrips & Brinjal Shoot Borer IPM',
        keywords: 'potato onion brinjal aloo dungri ringna thrips late blight shoot borer batata બટાકા ડુંગળી રીંગણ आलू प्याज बैंगन',
        content:
          'Key Vegetable Production & Protection Guidelines: (1) Potato Late Blight (Phytophthora infestans): Appears during cool, overcast, high-humidity weather as water-soaked irregular lesions with white downy growth on the underside of leaves. Use certified disease-free tubers (Kufri Pukhraj, Kufri Jyoti, Kufri Badshah in Gujarat). Apply protective sprays of Mancozeb 75% WP @ 2g/L before rain spells. (2) Onion Thrips & Purple Blotch (Thrips tabaci / Alternaria porri): Thrips cause silvery patches and leaf distortion; purple blotch causes sunken oval purple spots. Install blue sticky traps @ 15/acre. Spray neem oil 1500 ppm @ 3 ml/L or CIB&RC-approved contact/translaminar insecticides only if thrips exceed 30 per plant. Maintain uniform soil moisture; water stress exacerbates thrips flare-ups. (3) Brinjal Fruit & Shoot Borer (Leucinodes orbonalis): Larvae bore into shoots causing wilting ("dead hearts") and fruits. Clip off and bury wilted shoots with larvae weekly. Install pheromone traps with Lucinlure @ 10–12 traps/acre. Spray Bacillus thuringiensis (Bt) or Neem formulations early; never spray banned organophosphates like Monocrotophos.',
      },
    ],
  },
  {
    slug: 'icar-fruits-mango-banana-papaya-pomegranate',
    title: 'Horticultural Orchard Management: Mango, Banana, Papaya & Pomegranate',
    issuingOrg: 'ICAR-CISH (Lucknow), ICAR-NRCB (Trichy) & ICAR-NRCP (Solapur)',
    sourceUrl: 'https://cish.icar.gov.in',
    publicationDate: new Date('2025-10-20'),
    crop: 'fruits',
    topic: 'crop_management',
    region: 'Gujarat (Saurashtra, South Gujarat), Maharashtra, Karnataka',
    language: 'en',
    license: 'Public Agricultural Extension',
    chunks: [
      {
        title: 'Fruit Orchard Care: Mango Powdery Mildew, Banana Sigatoka & Pomegranate Blight',
        keywords: 'mango banana papaya pomegranate keri kela dadam કેરી કેળા દાડમ આમ केला अनार powdery mildew sigatoka bacterial blight',
        content:
          'Horticultural Protection Guidelines for Major Fruit Crops: (1) Mango (Kesar, Alphonso): Monitor for Mango Hopper and Powdery Mildew during panicle emergence (January–February). Spray Wettable Sulphur 80% WP @ 2g/L or bio-fungicide at early flower bud stage before full blossom. Do not spray chemical insecticides during full blossom to protect honeybee pollinators. (2) Banana (Grand Naine): For Sigatoka Leaf Spot (dark brown streaks turning grey with black borders), prune and destroy severely infected dry leaves, ensure trench drainage, and apply mineral oil or systemic triazole sprays at early streak onset. (3) Papaya (Taiwan 786 / Red Lady): Protect against Papaya Ring Spot Virus (PRSV) spread by aphids by removing weed hosts around the orchard and installing silver reflective plastic mulching. (4) Pomegranate (Bhagwa): Prevent Bacterial Blight ("Telya" caused by Xanthomonas axonopodis pv. punicae) marked by oily dark water-soaked spots on leaves and fruit nodal cracking. Practice strict orchard sanitation, prune during dry winter, apply Bordeaux mixture (1%) or Copper Hydroxide, and destroy fallen infected fruit mummies.',
      },
    ],
  },
];

async function seedKB() {
  const docCols = await prisma.$queryRawUnsafe(`PRAGMA table_info("KnowledgeDocument")`);
  const chunkCols = await prisma.$queryRawUnsafe(`PRAGMA table_info("KnowledgeChunk")`);
  const hasLegacyPublisher = docCols.some((c) => c.name === 'publisher' && Number(c.notnull) === 1 && !c.dflt_value);
  if (hasLegacyPublisher) {
    console.log('Detected legacy NOT NULL column KnowledgeDocument.publisher — migrating KnowledgeDocument cleanly while preserving all existing rows...');
    const existingDocs = await prisma.$queryRawUnsafe(`SELECT * FROM "KnowledgeDocument"`);
    const existingChunks = await prisma.$queryRawUnsafe(`SELECT * FROM "KnowledgeChunk"`);
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "KnowledgeDocument_new"`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "KnowledgeDocument_new" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "slug" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "issuingOrg" TEXT NOT NULL,
        "sourceUrl" TEXT,
        "publicationDate" DATETIME,
        "crop" TEXT,
        "topic" TEXT NOT NULL,
        "region" TEXT,
        "language" TEXT NOT NULL DEFAULT 'en',
        "license" TEXT NOT NULL,
        "checksum" TEXT NOT NULL,
        "lastVerifiedAt" DATETIME,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    for (const r of existingDocs) {
      await prisma.$executeRawUnsafe(
        `INSERT OR IGNORE INTO "KnowledgeDocument_new" ("id","slug","title","issuingOrg","sourceUrl","publicationDate","crop","topic","region","language","license","checksum","lastVerifiedAt","isActive","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        r.id,
        r.slug,
        r.title,
        r.issuingOrg || r.publisher || 'ICAR',
        r.sourceUrl || null,
        r.publicationDate || null,
        r.crop || null,
        r.topic || 'general',
        r.region || null,
        r.language || 'en',
        r.license || 'GODL',
        r.checksum || hash(r.title || r.id),
        r.lastVerifiedAt || null,
        r.isActive ?? 1,
        r.createdAt || new Date().toISOString(),
        r.updatedAt || new Date().toISOString()
      );
    }
    await prisma.$executeRawUnsafe(`DROP TABLE "KnowledgeDocument"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "KnowledgeDocument_new" RENAME TO "KnowledgeDocument"`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeDocument_slug_key" ON "KnowledgeDocument"("slug")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "KnowledgeDocument_crop_topic_idx" ON "KnowledgeDocument"("crop", "topic")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "KnowledgeDocument_language_idx" ON "KnowledgeDocument"("language")`);

    const hasChunkLegacy = chunkCols.some((c) => Number(c.notnull) === 1 && !['id','documentId','chunkIndex','title','content','keywords','tokenCount','language','checksum','createdAt'].includes(c.name) && !c.dflt_value);
    if (hasChunkLegacy) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "KnowledgeChunk_new"`);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "KnowledgeChunk_new" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "documentId" TEXT NOT NULL,
          "chunkIndex" INTEGER NOT NULL,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "keywords" TEXT NOT NULL,
          "tokenCount" INTEGER NOT NULL,
          "crop" TEXT,
          "topic" TEXT,
          "language" TEXT NOT NULL DEFAULT 'en',
          "checksum" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      for (const ch of existingChunks) {
        await prisma.$executeRawUnsafe(
          `INSERT OR IGNORE INTO "KnowledgeChunk_new" ("id","documentId","chunkIndex","title","content","keywords","tokenCount","crop","topic","language","checksum","createdAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          ch.id,
          ch.documentId,
          ch.chunkIndex ?? 0,
          ch.title || 'Chunk',
          ch.content || '',
          ch.keywords || '',
          ch.tokenCount ?? 100,
          ch.crop || null,
          ch.topic || null,
          ch.language || 'en',
          ch.checksum || hash(ch.content || ch.id),
          ch.createdAt || new Date().toISOString()
        );
      }
      await prisma.$executeRawUnsafe(`DROP TABLE "KnowledgeChunk"`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "KnowledgeChunk_new" RENAME TO "KnowledgeChunk"`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "KnowledgeChunk_crop_topic_idx" ON "KnowledgeChunk"("crop", "topic")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "KnowledgeChunk_language_idx" ON "KnowledgeChunk"("language")`);
    }
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`);
    console.log(`Preserved ${existingDocs.length} existing KnowledgeDocument rows cleanly.`);
  }

  console.log(`Seeding ${DOCUMENTS.length} authoritative agricultural knowledge documents...`);
  const now = new Date();
  let totalChunks = 0;

  for (const doc of DOCUMENTS) {
    const fullText = doc.chunks.map((c) => `${c.title}\n${c.content}`).join('\n\n');
    const checksum = hash(fullText);

    const dbDoc = await prisma.knowledgeDocument.upsert({
      where: { slug: doc.slug },
      update: {
        title: doc.title,
        issuingOrg: doc.issuingOrg,
        sourceUrl: doc.sourceUrl,
        publicationDate: doc.publicationDate,
        crop: doc.crop,
        topic: doc.topic,
        region: doc.region,
        language: doc.language,
        license: doc.license,
        checksum,
        lastVerifiedAt: now,
        isActive: true,
      },
      create: {
        slug: doc.slug,
        title: doc.title,
        issuingOrg: doc.issuingOrg,
        sourceUrl: doc.sourceUrl,
        publicationDate: doc.publicationDate,
        crop: doc.crop,
        topic: doc.topic,
        region: doc.region,
        language: doc.language,
        license: doc.license,
        checksum,
        lastVerifiedAt: now,
        isActive: true,
      },
    });

    // Replace chunks for this document cleanly to keep updates idempotent
    await prisma.knowledgeChunk.deleteMany({ where: { documentId: dbDoc.id } });

    for (let i = 0; i < doc.chunks.length; i++) {
      const ch = doc.chunks[i];
      await prisma.knowledgeChunk.create({
        data: {
          documentId: dbDoc.id,
          chunkIndex: i,
          title: ch.title,
          content: ch.content,
          keywords: ch.keywords,
          tokenCount: Math.ceil(ch.content.split(/\s+/).length * 1.3),
          crop: doc.crop,
          topic: doc.topic,
          language: doc.language,
          checksum: hash(ch.content),
        },
      });
      totalChunks++;
    }
  }

  const docCount = await prisma.knowledgeDocument.count({ where: { isActive: true } });
  const chunkCount = await prisma.knowledgeChunk.count();
  console.log(`Done! Active Documents: ${docCount}, Total Knowledge Chunks: ${chunkCount} (upserted ${totalChunks} chunks).`);
}

seedKB()
  .catch((err) => {
    console.error('KB Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
