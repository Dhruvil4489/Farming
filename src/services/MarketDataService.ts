import { prisma } from '../lib/prisma';
import { MarketDataProvider, MarketSyncResult } from '../providers/market/MarketDataProvider';
import { AgmarknetProvider } from '../providers/market/AgmarknetProvider';
import { DemoMarketProvider } from '../providers/market/DemoMarketProvider';

export class MarketDataService {
  private static providerInstance: MarketDataProvider | null = null;

  static getProvider(): MarketDataProvider {
    if (!this.providerInstance) {
      const providerType = process.env.MARKET_PROVIDER || 'demo';
      const apiKey = process.env.MARKET_API_KEY;

      if (providerType === 'agmarknet' && apiKey) {
        this.providerInstance = new AgmarknetProvider();
      } else {
        this.providerInstance = new DemoMarketProvider();
      }
    }
    return this.providerInstance;
  }

  // -------------------------------------------------------------------
  // Distributed Database Lock Guard
  // -------------------------------------------------------------------

  /**
   * Acquire a database-backed lock to prevent overlapping sync executions.
   * Lock auto-expires after ttlMs to prevent deadlocks from crashed worker processes.
   */
  static async acquireSyncLock(
    runId: string,
    ttlMs = 10 * 60 * 1000
  ): Promise<{
    acquired: boolean;
    lockedBy?: string;
    expiresAt?: Date;
    existingLock?: any;
    error?: string;
  }> {
    const now = new Date();
    try {
      const existing = await prisma.marketSyncLock.findUnique({
        where: { id: 'market_sync' },
      });

      if (existing && existing.expiresAt > now) {
        return {
          acquired: false,
          lockedBy: existing.lockedBy,
          expiresAt: existing.expiresAt,
          existingLock: existing,
        };
      }

      const expiresAt = new Date(now.getTime() + ttlMs);
      await prisma.marketSyncLock.upsert({
        where: { id: 'market_sync' },
        create: {
          id: 'market_sync',
          lockedAt: now,
          lockedBy: runId,
          expiresAt,
        },
        update: {
          lockedAt: now,
          lockedBy: runId,
          expiresAt,
        },
      });

      return { acquired: true, lockedBy: runId, expiresAt };
    } catch (err: any) {
      console.error('[MarketDataService] Lock acquisition error:', err.message);
      return { acquired: false, error: err.message };
    }
  }

  /**
   * Release the database-backed sync lock.
   */
  static async releaseSyncLock(runId?: string): Promise<void> {
    try {
      if (runId) {
        await prisma.marketSyncLock.deleteMany({
          where: {
            id: 'market_sync',
            lockedBy: runId,
          },
        });
      } else {
        await prisma.marketSyncLock.deleteMany({
          where: { id: 'market_sync' },
        });
      }
    } catch (err: any) {
      console.warn('[MarketDataService] Lock release warning:', err.message);
    }
  }

  // -------------------------------------------------------------------
  // Sync: pull records from provider and upsert into database
  // -------------------------------------------------------------------

  /**
   * Fetches records from the configured provider and upserts them into
   * the database with idempotent deduplication. Protected by database lock guard.
   */
  static async syncFromProvider(options?: {
    state?: string;
    commodity?: string;
    limit?: number;
    triggerSource?: 'scheduled' | 'manual' | 'cli';
  }): Promise<MarketSyncResult> {
    const provider = this.getProvider();
    const startTime = Date.now();
    const triggerSource = options?.triggerSource || 'scheduled';
    const runId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Overlapping execution guard: try acquiring database lock
    const lockResult = await this.acquireSyncLock(runId);
    if (!lockResult.acquired) {
      const lockedUntil = lockResult.existingLock?.expiresAt;
      console.warn(`[MarketDataService] Overlapping sync prevented. Lock held until ${lockedUntil}`);

      const avoidedLog = await prisma.marketSyncLog.create({
        data: {
          provider: provider.getProviderName(),
          triggerSource,
          status: 'failed',
          recordsFetched: 0,
          recordsStored: 0,
          recordsSkipped: 0,
          errorMessage: 'Overlapping sync invocation prevented by database lock guard. A prior sync is still running.',
          durationMs: Date.now() - startTime,
          completedAt: new Date(),
        },
      });

      return {
        syncRunId: avoidedLog.id,
        provider: provider.getProviderName(),
        status: 'skipped_locked',
        recordsFetched: 0,
        recordsStored: 0,
        recordsSkipped: 0,
        anomalies: 0,
        errorMessage: 'A market sync job is already in progress. Overlapping run avoided.',
        durationMs: Date.now() - startTime,
        triggerSource,
        lockedUntil,
      };
    }

    // Lock acquired: create in-progress sync log
    const syncLog = await prisma.marketSyncLog.create({
      data: {
        provider: provider.getProviderName(),
        triggerSource,
        status: 'running',
        recordsFetched: 0,
        recordsStored: 0,
        recordsSkipped: 0,
      },
    });

    let recordsFetched = 0;
    let recordsStored = 0;
    let recordsSkipped = 0;
    let anomalies = 0;
    let latestReportedDate: Date | null = null;
    let errorMessage: string | undefined;
    let syncStatus: 'success' | 'partial' | 'failed' = 'failed';

    try {
      const records = await provider.fetchPrices({
        state: options?.state,
        commodity: options?.commodity,
        limit: options?.limit ?? 500,
      });

      recordsFetched = records.length;

      for (const rec of records) {
        try {
          if (!latestReportedDate || rec.priceDate > latestReportedDate) {
            latestReportedDate = rec.priceDate;
          }

          // findOrCreate MarketLocation
          const location = await prisma.marketLocation.upsert({
            where: {
              name_state_district: {
                name: rec.market,
                state: rec.state,
                district: rec.district,
              },
            },
            create: {
              name: rec.market,
              state: rec.state,
              district: rec.district,
            },
            update: {},
          });

          // findOrCreate MarketCommodity
          const commodity = await prisma.marketCommodity.upsert({
            where: {
              name_variety: {
                name: rec.commodity,
                variety: rec.variety || 'Other',
              },
            },
            create: {
              name: rec.commodity,
              variety: rec.variety || 'Other',
              category: null,
            },
            update: {},
          });

          if (rec.qualityStatus === 'anomaly_price_order' || rec.qualityStatus === 'missing_price') {
            anomalies++;
          }

          // Upsert MarketPriceObservation with dedup key
          await prisma.marketPriceObservation.upsert({
            where: {
              locationId_commodityId_priceDate_source_grade: {
                locationId: location.id,
                commodityId: commodity.id,
                priceDate: rec.priceDate,
                source: rec.source,
                grade: rec.grade || '',
              },
            },
            create: {
              locationId: location.id,
              commodityId: commodity.id,
              grade: rec.grade || '',
              minPrice: rec.minPrice,
              maxPrice: rec.maxPrice,
              modalPrice: rec.modalPrice,
              unit: rec.unit,
              priceDate: rec.priceDate,
              source: rec.source,
              sourceResourceId: rec.sourceResourceId || null,
              isDemo: rec.isDemo,
              qualityStatus: rec.qualityStatus,
              syncRunId: syncLog.id,
              fetchedAt: new Date(),
            },
            update: {
              minPrice: rec.minPrice,
              maxPrice: rec.maxPrice,
              modalPrice: rec.modalPrice,
              fetchedAt: new Date(),
              syncRunId: syncLog.id,
              qualityStatus: rec.qualityStatus,
            },
          });

          recordsStored++;
        } catch (recErr: any) {
          recordsSkipped++;
          console.warn('[MarketDataService] Skipped record:', rec.commodity, rec.market, recErr.message);
        }
      }

      syncStatus = recordsSkipped > 0 && recordsStored > 0 ? 'partial' : recordsFetched === 0 ? 'success' : recordsStored > 0 ? 'success' : 'failed';
    } catch (err: any) {
      // Sanitize error message to avoid logging raw keys or secrets
      errorMessage = (err.message || 'Unknown market sync error')
        .replace(/api[-_]?key=[^&\s]+/gi, 'api-key=[REDACTED]')
        .slice(0, 500);
      syncStatus = 'failed';
    } finally {
      // Always release lock so subsequent runs are not permanently blocked
      await this.releaseSyncLock(runId);
    }

    // Update sync log
    const durationMs = Date.now() - startTime;
    await prisma.marketSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: syncStatus,
        recordsFetched,
        recordsStored,
        recordsSkipped,
        sourcePublicationDate: latestReportedDate,
        errorMessage: errorMessage || null,
        durationMs,
        completedAt: new Date(),
      },
    });

    return {
      syncRunId: syncLog.id,
      provider: provider.getProviderName(),
      status: syncStatus,
      recordsFetched,
      recordsStored,
      recordsSkipped,
      anomalies,
      errorMessage,
      durationMs,
      triggerSource,
    };
  }

  // -------------------------------------------------------------------
  // Query: read stored market data from the database
  // -------------------------------------------------------------------

  /**
   * Fetches latest market price observations with previous trading-day comparison
   */
  static async getPricesWithComparison(params: {
    state?: string;
    district?: string;
    market?: string;
    commodity?: string;
    date?: string;
    limit?: number;
  }) {
    // 1. Build where clause
    const where: any = {};

    if (params.state) {
      where.location = { ...where.location, state: params.state };
    }
    if (params.district) {
      where.location = { ...where.location, district: params.district };
    }
    if (params.market) {
      where.location = { ...where.location, name: params.market };
    }
    if (params.commodity) {
      where.commodity = { ...where.commodity, name: { contains: params.commodity } };
    }

    // Determine target date or latest available date
    let targetDate: Date;
    if (params.date) {
      targetDate = new Date(params.date);
    } else {
      // Find the most recent date in DB
      const latestObs = await prisma.marketPriceObservation.findFirst({
        where,
        orderBy: { priceDate: 'desc' },
        select: { priceDate: true },
      });
      targetDate = latestObs ? latestObs.priceDate : new Date('2026-10-11T05:30:00Z');
    }

    // Start and end of that calendar day
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const observations = await prisma.marketPriceObservation.findMany({
      where: {
        ...where,
        priceDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        commodity: true,
        location: true,
      },
      orderBy: [{ location: { state: 'asc' } }, { commodity: { name: 'asc' } }],
      take: params.limit && params.limit > 0 ? params.limit : undefined,
    });

    // Determine overall provenance for the result set
    const hasAnyDemo = observations.some((obs) => obs.isDemo);
    const allDemo = observations.length > 0 && observations.every((obs) => obs.isDemo);

    // For each observation, find the previous available trading-day record for the SAME location and commodity
    const results = await Promise.all(
      observations.map(async (obs) => {
        const prevObs = await prisma.marketPriceObservation.findFirst({
          where: {
            locationId: obs.locationId,
            commodityId: obs.commodityId,
            priceDate: {
              lt: startOfDay,
            },
          },
          orderBy: { priceDate: 'desc' },
        });

        let priceChange: number | null = null;
        let percentageChange: number | null = null;

        // Use nullable-safe comparison
        const currentModal = obs.modalPrice;
        const prevModal = prevObs?.modalPrice;
        if (currentModal !== null && prevModal !== null && prevModal !== undefined && prevModal > 0) {
          priceChange = currentModal - prevModal;
          percentageChange = parseFloat(((priceChange / prevModal) * 100).toFixed(2));
        }

        return {
          id: obs.id,
          commodityId: obs.commodityId,
          commodityName: obs.commodity.name,
          variety: obs.commodity.variety,
          category: obs.commodity.category,
          grade: obs.grade || undefined,
          locationId: obs.locationId,
          marketName: obs.location.name,
          state: obs.location.state,
          district: obs.location.district,
          minPrice: obs.minPrice,
          maxPrice: obs.maxPrice,
          modalPrice: obs.modalPrice,
          unit: obs.unit,
          arrival_date: obs.priceDate.toISOString().split('T')[0],
          arrivalDate: obs.priceDate.toISOString().split('T')[0],
          priceDate: obs.priceDate.toISOString().split('T')[0],
          lastSyncedAt: obs.fetchedAt.toISOString(),
          fetchedAt: obs.fetchedAt.toISOString(),
          source: obs.source,
          sourceResourceId: obs.sourceResourceId,
          isDemo: obs.isDemo,
          qualityStatus: obs.qualityStatus,
          comparison: {
            previousModalPrice: prevModal ?? null,
            previousPriceDate: prevObs ? prevObs.priceDate.toISOString().split('T')[0] : null,
            priceChange,
            percentageChange,
            status: prevObs
              ? priceChange !== null
                ? priceChange > 0
                  ? 'up'
                  : priceChange < 0
                  ? 'down'
                  : 'stable'
                : 'unavailable'
              : 'unavailable',
          },
        };
      })
    );

    // Compute latest arrival date and most recent synchronization timestamp
    let latestArrivalDate: string | null = null;
    let latestLastSyncedAt: string | null = null;
    for (const r of results) {
      if (!latestArrivalDate || r.arrival_date > latestArrivalDate) {
        latestArrivalDate = r.arrival_date;
      }
      if (!latestLastSyncedAt || r.lastSyncedAt > latestLastSyncedAt) {
        latestLastSyncedAt = r.lastSyncedAt;
      }
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      arrival_date: latestArrivalDate || targetDate.toISOString().split('T')[0],
      latestArrivalDate: latestArrivalDate || targetDate.toISOString().split('T')[0],
      lastSyncedAt: latestLastSyncedAt || new Date().toISOString(),
      feedCadence: 'daily_wholesale',
      cadenceNotice: 'AGMARKNET reports daily wholesale auction arrivals, not continuous intraday ticks. Not all crop-mandi pairs trade or report every day.',
      total: results.length,
      provenance: allDemo ? 'demo' : hasAnyDemo ? 'mixed' : 'official',
      records: results,
    };
  }

  /**
   * Historical price observations for trend chart (7-day or 30-day)
   */
  static async getPriceHistory(commodityId: string, locationId: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await prisma.marketPriceObservation.findMany({
      where: {
        commodityId,
        locationId,
        priceDate: {
          gte: cutoffDate,
        },
      },
      include: {
        commodity: true,
        location: true,
      },
      orderBy: { priceDate: 'asc' },
    });

    return history.map((h) => ({
      date: h.priceDate.toISOString().split('T')[0],
      arrival_date: h.priceDate.toISOString().split('T')[0],
      arrivalDate: h.priceDate.toISOString().split('T')[0],
      lastSyncedAt: h.fetchedAt.toISOString(),
      minPrice: h.minPrice,
      maxPrice: h.maxPrice,
      modalPrice: h.modalPrice,
      unit: h.unit,
      source: h.source,
      isDemo: h.isDemo,
    }));
  }

  /**
   * Metadata filter helpers
   */
  static async getFilterOptions() {
    const states = await prisma.marketLocation.findMany({
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    });

    const districts = await prisma.marketLocation.findMany({
      select: { district: true, state: true },
      distinct: ['district'],
      orderBy: { district: 'asc' },
    });

    const markets = await prisma.marketLocation.findMany({
      select: { id: true, name: true, state: true, district: true },
      orderBy: { name: 'asc' },
    });

    const commodities = await prisma.marketCommodity.findMany({
      select: { id: true, name: true, variety: true, category: true },
      orderBy: { name: 'asc' },
    });

    return {
      states: states.map((s) => s.state),
      districts: districts.map((d) => ({ district: d.district, state: d.state })),
      markets,
      commodities,
    };
  }

  /**
   * Returns recent sync log entries for admin auditing
   */
  static async getRecentSyncLogs(limit = 20) {
    return prisma.marketSyncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Calculates the next scheduled run based on conservative twice-daily cadence:
   * 06:30 IST and 18:30 IST (01:00 UTC and 13:00 UTC).
   */
  static getNextScheduledRun(): {
    nextRunIso: string;
    nextRunFormattedIST: string;
    cadence: string;
    cronExpressionUtc: string;
    cronExpressionIst: string;
    timezone: string;
  } {
    const now = new Date();
    // Schedule times in UTC: 01:00 UTC (06:30 IST) and 13:00 UTC (18:30 IST)
    const run1UtcHours = 1;
    const run1UtcMinutes = 0;
    const run2UtcHours = 13;
    const run2UtcMinutes = 0;

    const candidate1 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), run1UtcHours, run1UtcMinutes, 0));
    const candidate2 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), run2UtcHours, run2UtcMinutes, 0));
    const candidateTomorrow1 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, run1UtcHours, run1UtcMinutes, 0));

    let nextDate: Date;
    if (now.getTime() < candidate1.getTime()) {
      nextDate = candidate1;
    } else if (now.getTime() < candidate2.getTime()) {
      nextDate = candidate2;
    } else {
      nextDate = candidateTomorrow1;
    }

    const istString = nextDate.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return {
      nextRunIso: nextDate.toISOString(),
      nextRunFormattedIST: `${istString} IST`,
      cadence: 'Twice daily (06:30 IST & 18:30 IST post-market auction closing)',
      cronExpressionUtc: '0 1,13 * * *',
      cronExpressionIst: '30 6,18 * * *',
      timezone: 'Asia/Kolkata',
    };
  }

  /**
   * Comprehensive sync health monitoring for admin console:
   * Last success, last attempt, next run, lock state, rows changed, and data freshness.
   */
  static async getSyncHealth() {
    const [lastSuccess, lastAttempt, activeLock, latestObs, totalCount, recentLogs] = await Promise.all([
      prisma.marketSyncLog.findFirst({
        where: { status: 'success' },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.marketSyncLog.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
      prisma.marketSyncLock.findUnique({
        where: { id: 'market_sync' },
      }),
      prisma.marketPriceObservation.findFirst({
        orderBy: { priceDate: 'desc' },
        select: { priceDate: true, fetchedAt: true, source: true, isDemo: true },
      }),
      prisma.marketPriceObservation.count(),
      prisma.marketSyncLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
    ]);

    const isLocked = activeLock !== null && activeLock.expiresAt > new Date();
    const nextScheduled = this.getNextScheduledRun();

    return {
      provider: this.getProvider().getProviderName(),
      isLocked,
      lockExpiresAt: isLocked ? activeLock.expiresAt.toISOString() : null,
      lastSuccess: lastSuccess
        ? {
            id: lastSuccess.id,
            timestamp: lastSuccess.completedAt?.toISOString() || lastSuccess.startedAt.toISOString(),
            recordsFetched: lastSuccess.recordsFetched,
            recordsStored: lastSuccess.recordsStored,
            durationMs: lastSuccess.durationMs,
            triggerSource: lastSuccess.triggerSource,
          }
        : null,
      lastAttempt: lastAttempt
        ? {
            id: lastAttempt.id,
            status: lastAttempt.status,
            timestamp: lastAttempt.startedAt.toISOString(),
            durationMs: lastAttempt.durationMs,
            recordsStored: lastAttempt.recordsStored,
            recordsSkipped: lastAttempt.recordsSkipped,
            errorMessage: lastAttempt.errorMessage,
            triggerSource: lastAttempt.triggerSource,
          }
        : null,
      nextScheduledRun: nextScheduled,
      dataFreshness: {
        latestReportedArrivalDate: latestObs ? latestObs.priceDate.toISOString().split('T')[0] : null,
        latestLocalSyncTimestamp: latestObs ? latestObs.fetchedAt.toISOString() : null,
        totalStoredRecords: totalCount,
        isDemoData: latestObs?.isDemo ?? true,
      },
      recentLogs: recentLogs.map((l) => ({
        id: l.id,
        provider: l.provider,
        status: l.status,
        triggerSource: l.triggerSource,
        recordsFetched: l.recordsFetched,
        recordsStored: l.recordsStored,
        recordsSkipped: l.recordsSkipped,
        durationMs: l.durationMs,
        startedAt: l.startedAt.toISOString(),
        completedAt: l.completedAt?.toISOString() || null,
        errorMessage: l.errorMessage,
      })),
    };
  }
}

