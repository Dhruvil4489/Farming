/**
 * SmartFarm AI — Database-Backed BM25 Keyword & Semantic Intent Retrieval Engine
 *
 * Provides source grounding across official ICAR/AAU agricultural documents
 * without requiring external vector database daemons.
 * Works uniformly across SQLite (dev) and PostgreSQL (prod).
 */

import { prisma } from '@/lib/prisma';

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  issuingOrg: string;
  sourceUrl?: string | null;
  license: string;
  chunkIndex: number;
  title: string;
  content: string;
  crop?: string | null;
  topic?: string | null;
  language: string;
  score: number;
}

export const CROP_SYNONYMS: Record<string, string[]> = {
  cotton: ['cotton', 'kapas', 'કપાસ', 'कपास', 'bollworm', 'gossypium', 'whitefly', 'square', 'gcot'],
  wheat: ['wheat', 'gehu', 'ઘઉં', 'गेहूं', 'triticum', 'cri', 'rust', 'tillering'],
  groundnut: ['groundnut', 'peanut', 'magfali', 'મગફળી', 'मूंगफली', 'pegging', 'tikka', 'arachis'],
  tomato: ['tomato', 'tameta', 'tamatar', 'ટામેટા', 'टमाटर', 'blight', 'yellow leaves', 'leaf curl'],
  rice: ['rice', 'paddy', 'dhan', 'ડાંગર', 'धान', 'awd', 'blast', 'sheath blight', 'oryza'],
  chilli: ['chilli', 'chili', 'mirch', 'મરચી', 'मिर्च', 'thrips', 'leaf curl', 'churda', 'capsicum'],
  maize: ['maize', 'corn', 'makka', 'makai', 'મકાઈ', 'मक्का', 'fall armyworm'],
  soybean: ['soybean', 'soyabean', 'સોયાબીન', 'सोयाबीन', 'glycine'],
  sugarcane: ['sugarcane', 'sherdi', 'શેરડી', 'गन्ना', 'red rot'],
  potato: ['potato', 'potatoes', 'batata', 'bataka', 'બટાકા', 'બટાટા', 'आलू', 'kufri', 'tuber', 'tubers', 'earthing up', 'dehaulming'],
  onion: ['onion', 'dungri', 'ડુંગળી', 'प्याज', 'thrips', 'purple blotch'],
  brinjal: ['brinjal', 'ringna', 'રીંગણ', 'बैंगन', 'eggplant', 'shoot borer'],
  mango: ['mango', 'keri', 'કેરી', 'आम', 'powdery mildew', 'hopper', 'kesar', 'alphonso'],
  banana: ['banana', 'kela', 'કેળા', 'केला', 'sigatoka', 'panama'],
  papaya: ['papaya', 'papaiya', 'પપૈયા', 'पपीता', 'ring spot'],
  pomegranate: ['pomegranate', 'dadam', 'દાડમ', 'अनार', 'bacterial blight', 'telya'],
  pulses: ['pulses', 'gram', 'chana', 'ચણા', 'चना', 'arhar', 'tur', 'તુવેર', 'अरहर', 'moong', 'મગ', 'मूंग'],
  soil_health: ['soil', 'saline', 'salinity', 'alkaline', 'vertisol', 'જમીન', 'मिट्टी', 'black soil', 'gypsum', 'organic carbon', 'fertility'],
  fertilizer: ['fertilizer', 'dap', 'npk', 'urea', 'mop', 'ssp', 'potash', 'zinc', 'sulphur', 'ખાતર', 'खाद', 'mix', 'mixing', 'compatibility'],
  irrigation: ['irrigation', 'water', 'drip', 'sprinkler', 'awd', 'pani', 'પાણી', 'पानी', 'सिंचाई', 'પિયત', 'waterlogging'],
  government_schemes: ['pm-kisan', 'pm kisan', 'pmfby', 'kcc', 'kisan credit card', 'soil health card', 'subsidy', 'scheme', 'yojana', 'યોજના', 'योजना', 'ikhedut'],
  pest_management: ['ipm', 'pest', 'insect', 'disease', 'biological', 'trichoderma', 'pseudomonas', 'neem', 'sticky trap', 'pheromone', 'જીવાત', 'કીટ', 'रोग'],
  general: ['monocrotophos', 'banned', 'pesticide', 'spray', 'weather', 'rain', 'mandi', 'price', 'bhav', 'भाव', 'ભાવ', 'climate'],
};

export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she',
  'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until',
  'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'give', 'tell', 'details', 'know', 'type', 'types', 'help', 'please', 'sir',
  // Hindi & transliterated stopwords
  'kya', 'kaise', 'kab', 'kyu', 'kyun', 'hai', 'hain', 'ho', 'me', 'mein', 'par', 'se', 'ko', 'ki', 'ka', 'ke',
  'क्या', 'कैसे', 'कब', 'क्यों', 'है', 'हैं', 'में', 'पर', 'से', 'को', 'की', 'का', 'के', 'मुझे', 'बताओ',
  // Gujarati & transliterated stopwords
  'su', 'shu', 'kem', 'kare', 'ma', 'thi', 'ne', 'chhe', 'chho', 'mara', 'mari', 'maro',
  'શું', 'કેમ', 'કેવી', 'રીતે', 'છે', 'માં', 'થી', 'ને', 'માટે', 'મને', 'જણાવો'
]);

export class KnowledgeRetrievalService {
  /**
   * Detects probable crop mentions from a free-text question.
   */
  static detectCrop(query: string): string | null {
    const lower = query.toLowerCase();
    for (const [cropKey, synonyms] of Object.entries(CROP_SYNONYMS)) {
      if (['soil_health', 'fertilizer', 'irrigation', 'government_schemes', 'pest_management', 'general'].includes(cropKey)) {
        continue;
      }
      if (synonyms.some((s) => lower.includes(s.toLowerCase()))) {
        return cropKey;
      }
    }
    return null;
  }

  /**
   * Detects the specific user intent domain to guide retrieval.
   */
  static detectIntent(query: string): string {
    const q = query.toLowerCase();
    if (
      q.includes('pm-kisan') ||
      q.includes('pm kisan') ||
      q.includes('pmfby') ||
      q.includes('kcc') ||
      q.includes('kisan credit') ||
      q.includes('yojana') ||
      q.includes('subsidy') ||
      q.includes('યોજના') ||
      q.includes('योजना') ||
      q.includes('ikhedut')
    ) {
      return 'government_schemes';
    }
    if (
      q.includes('winter') ||
      q.includes('rabi') ||
      q.includes('summer') ||
      q.includes('monsoon') ||
      q.includes('kharif') ||
      q.includes('season') ||
      q.includes('sow') ||
      q.includes('sowing') ||
      q.includes('વાવણી') ||
      q.includes('વાવવો') ||
      q.includes('શિયાળુ') ||
      q.includes('રવિ') ||
      q.includes('रबी')
    ) {
      return 'crop_selection';
    }
    if (
      q.includes('fertilizer') ||
      q.includes('dap') ||
      q.includes('npk') ||
      q.includes('urea') ||
      q.includes('mop') ||
      q.includes('ssp') ||
      q.includes('potash') ||
      q.includes('zinc') ||
      q.includes('mixing') ||
      q.includes('ખાતર') ||
      q.includes('खाद')
    ) {
      return 'fertilizer';
    }
    if (
      q.includes('disease') ||
      q.includes('pest') ||
      q.includes('insect') ||
      q.includes('yellow') ||
      q.includes('whitefly') ||
      q.includes('curl') ||
      q.includes('blight') ||
      q.includes('fungus') ||
      q.includes('spray') ||
      q.includes('જીવાત') ||
      q.includes('રોગ') ||
      q.includes('કીટ')
    ) {
      return 'pest_management';
    }
    if (
      q.includes('water') ||
      q.includes('irrigation') ||
      q.includes('drip') ||
      q.includes('sprinkler') ||
      q.includes('awd') ||
      q.includes('pani') ||
      q.includes('પાણી') ||
      q.includes('पानी') ||
      q.includes('સિંચાઈ') ||
      q.includes('પિયત')
    ) {
      return 'irrigation';
    }
    if (
      q.includes('soil') ||
      q.includes('fertility') ||
      q.includes('saline') ||
      q.includes('gypsum') ||
      q.includes('organic') ||
      q.includes('compost') ||
      q.includes('carbon') ||
      q.includes('dhaincha') ||
      q.includes('જમીન') ||
      q.includes('मिट्टी')
    ) {
      return 'soil_health';
    }
    return 'crop_cultivation';
  }

  /**
   * Tokenizes and normalizes question text into clean keyword tokens, removing common stopwords.
   */
  static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((term) => term.length >= 2 && !STOPWORDS.has(term));
  }

  /**
   * Retrieves top-k most relevant knowledge chunks using weighted BM25/keyword scoring.
   */
  static async retrieve(params: {
    query: string;
    crop?: string | null;
    language?: string;
    limit?: number;
  }): Promise<RetrievedChunk[]> {
    const { query, language = 'en', limit = 3 } = params;
    const queryTokens = this.tokenize(query);
    const queryCrop = this.detectCrop(query);
    // Explicit crop in the question takes absolute precedence over user background profile crop
    const detectedCrop = queryCrop || params.crop || null;
    const intent = this.detectIntent(query);

    if (queryTokens.length === 0 && !detectedCrop) {
      return [];
    }

    // Fetch candidate chunks from database
    const candidates = await prisma.knowledgeChunk.findMany({
      include: {
        document: {
          select: {
            title: true,
            issuingOrg: true,
            sourceUrl: true,
            license: true,
            isActive: true,
          },
        },
      },
      where: {
        document: { isActive: true },
      },
    });

    // Score candidates using term frequency & metadata weights
    const scored: RetrievedChunk[] = [];

    for (const chunk of candidates) {
      // 1. Strict Intent & Scope Safety Gates:
      // If user is asking about crops, NEVER return government scheme chunks
      if (intent !== 'government_schemes' && (chunk.topic === 'government_schemes' || chunk.crop === 'government_schemes')) {
        continue;
      }
      // If user is asking about a specific crop (e.g. potato), NEVER return chunks of a different specific crop (e.g. cotton, rice, mango)
      if (queryCrop && chunk.crop && chunk.crop !== 'all' && chunk.crop !== 'general' && chunk.crop !== 'vegetables' && chunk.crop !== queryCrop) {
        continue;
      }
      // If user is specifically asking about seasonal crop selection, disallow specific single-crop disease chunks
      if (intent === 'crop_selection' && chunk.topic === 'pest_management') {
        continue;
      }

      let score = 0;
      let matchedTokens = 0;
      const lowerContent = chunk.content.toLowerCase();
      const lowerTitle = chunk.title.toLowerCase();
      const lowerKeywords = chunk.keywords.toLowerCase();

      // Crop relevance boost
      if (detectedCrop && (chunk.crop === detectedCrop || (detectedCrop === 'potato' && chunk.crop === 'vegetables'))) {
        score += 6.0;
      }

      // Intent / Topic alignment boost
      if (chunk.topic === intent) {
        score += 4.0;
      }

      // Language alignment boost
      if (chunk.language === language) {
        score += 1.5;
      }

      // Substantive keyword match scoring
      for (const token of queryTokens) {
        let tokenMatched = false;
        if (lowerKeywords.includes(token)) {
          score += 4.0;
          tokenMatched = true;
        }
        if (lowerTitle.includes(token)) {
          score += 3.0;
          tokenMatched = true;
        }
        if (lowerContent.includes(token)) {
          score += 1.0;
          tokenMatched = true;
        }
        if (tokenMatched) {
          matchedTokens++;
        }
      }

      // Strict minimum threshold:
      // Must have matched at least one substantive token OR have explicit crop match with intent
      const isViable =
        (queryCrop && (chunk.crop === queryCrop || (queryCrop === 'potato' && chunk.crop === 'vegetables'))) ||
        (matchedTokens >= 1 && score >= 4.0);

      if (isViable) {
        scored.push({
          id: chunk.id,
          documentId: chunk.documentId,
          documentTitle: chunk.document.title,
          issuingOrg: chunk.document.issuingOrg,
          sourceUrl: chunk.document.sourceUrl,
          license: chunk.document.license,
          chunkIndex: chunk.chunkIndex,
          title: chunk.title,
          content: chunk.content,
          crop: chunk.crop,
          topic: chunk.topic,
          language: chunk.language,
          score,
        });
      }
    }

    // Sort descending by score and return top-k
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }
}
