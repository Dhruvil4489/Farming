import { apiSuccess } from '@/lib/api-envelope';
import { MarketDataService } from '@/services/MarketDataService';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const provider = MarketDataService.getProvider();
  const status = await provider.getStatus();

  const lastSync = await prisma.marketSyncLog.findFirst({
    orderBy: { startedAt: 'desc' },
  });

  const totalObservations = await prisma.marketPriceObservation.count();

  return apiSuccess({
    provider: status.providerName,
    isConfigured: status.isConfigured,
    requiresApiKey: status.requiresApiKey,
    status: status.status,
    message: status.message,
    totalStoredRecords: totalObservations,
    lastSyncLog: lastSync,
  });
}
