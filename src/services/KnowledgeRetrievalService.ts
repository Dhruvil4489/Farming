/**
 * SmartFarm AI — Database-Backed BM25 Keyword Retrieval Engine
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
  cotton: ['cotton', 'kapas', 'કપાસ', 'कपास', 'bollworm', 'gossypium', 'whitefly'],
  wheat: ['wheat', 'gehu', 'ઘઉં', 'गेहूं', 'triticum', 'cri', 'rust'],
  groundnut: ['groundnut', 'peanut', 'magfali', 'મગફળી', 'मूंगफली', 'pegging', 'tikka'],
  tomato: ['tomato', 'tameta', 'tamatar', 'ટામેટા', 'टमाटर', 'blight', 'yellow leaves'],
  rice: ['rice', 'paddy', 'dhan', 'ડાંગર', 'धान', 'awd', 'blast', 'sheath blight'],
  soil_health: ['soil', 'saline', 'salinity', 'alkaline', 'vertisol', 'જમીન', 'मिट्टी', 'black soil', 'gypsum', 'fertilizer', 'dap', 'urea'],
  general: ['monocrotophos', 'banned', 'pesticide', 'spray', 'weather', 'rain', 'mandi', 'price', 'bhav', 'भाव', 'ભાવ'],
};

export class KnowledgeRetrievalService {
  /**
   * Detects probable crop mentions from a free-text question.
   */
  static detectCrop(query: string): string | null {
    const lower = query.toLowerCase();
    for (const [cropKey, synonyms] of Object.entries(CROP_SYNONYMS)) {
      if (synonyms.some((s) => lower.includes(s.toLowerCase()))) {
        return cropKey;
      }
    }
    return null;
  }

  /**
   * Tokenizes and normalizes question text into clean keyword tokens.
   */
  static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((term) => term.length >= 2);
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
    const detectedCrop = params.crop || this.detectCrop(query);

    if (queryTokens.length === 0) {
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
      let score = 0;
      const lowerContent = chunk.content.toLowerCase();
      const lowerTitle = chunk.title.toLowerCase();
      const lowerKeywords = chunk.keywords.toLowerCase();

      // Crop relevance boost
      if (detectedCrop && chunk.crop === detectedCrop) {
        score += 4.0;
      }

      // Language alignment boost
      if (chunk.language === language) {
        score += 1.5;
      }

      // Keyword match scoring
      for (const token of queryTokens) {
        // High weight if in curated keywords list
        if (lowerKeywords.includes(token)) {
          score += 3.0;
        }
        // Medium weight if in chunk title
        if (lowerTitle.includes(token)) {
          score += 2.0;
        }
        // Base weight if in content
        if (lowerContent.includes(token)) {
          score += 1.0;
        }
      }

      if (score > 1.5) {
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
