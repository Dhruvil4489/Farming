/**
 * GET /api/v1/assistant/status
 *
 * Public/farmer-accessible health & configuration status route.
 * Returns safe metadata regarding AI provider readiness.
 * Never returns secret keys, prefixes, or internal stack traces.
 */

import { apiSuccess } from '@/lib/api-envelope';
import { AIProviderFactory } from '@/lib/ai/AIProviderFactory';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await AIProviderFactory.getSafeStatus();

  // Get corpus statistics
  const documentCount = await prisma.knowledgeDocument.count({ where: { isActive: true } });
  const chunkCount = await prisma.knowledgeChunk.count();

  return apiSuccess({
    provider: {
      id: status.id,
      name: status.name,
      model: status.model,
      isConfigured: status.isConfigured,
      status: status.status,
      isMock: status.isMock,
      requiresKey: status.requiresKey,
      allowMock: status.allowMock,
      supportedLanguages: status.supportedLanguages,
      message: status.message,
    },
    knowledgeBase: {
      isReady: chunkCount > 0,
      documentsCount: documentCount,
      chunksCount: chunkCount,
      sources: ['ICAR (CICR, CSSRI)', 'AAU Anand', 'JAU Junagadh', 'NAU Navsari'],
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}
