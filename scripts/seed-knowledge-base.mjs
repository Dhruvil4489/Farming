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
