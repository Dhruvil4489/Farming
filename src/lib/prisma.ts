import { PrismaClient } from '@prisma/client';

/**
 * SmartFarm AI — Database Client Provider
 *
 * Implements a resilient, self-healing PrismaClient singleton.
 * Prevents "Cannot read properties of undefined (reading 'create')" by:
 * 1. Ensuring globalThis.prisma delegate existence.
 * 2. Detecting stale development instances (where models were generated after startup).
 * 3. Auto-recovering transparently if any delegate is missing.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/**
 * Retrieves or initializes the active PrismaClient with delegate integrity validation.
 */
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    return globalForPrisma.prisma;
  }

  // Health check: verify core delegates exist on cached client
  const client = globalForPrisma.prisma as any;
  if (!client.cropDiagnosisRecord || !client.user || !client.field) {
    console.warn(
      '[Prisma] Detected stale PrismaClient instance in memory (missing cropDiagnosisRecord delegate). Auto-healing with fresh client...'
    );
    try {
      client.$disconnect?.();
    } catch {
      // Ignore disconnect error during recovery
    }
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

/**
 * Proxied Prisma instance that always invokes getPrismaClient() on access.
 * Eliminates undefined delegate crashes across Next.js fast-refresh and HMR cycles.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = getPrismaClient();
}
