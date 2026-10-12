import { prisma } from '@/lib/prisma';
import { MarketDataProvider } from '@/providers/market/MarketDataProvider';
import { AgmarknetProvider } from '@/providers/market/AgmarknetProvider';
import { DemoMarketProvider } from '@/providers/market/DemoMarketProvider';

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

  /**
   * Fetches latest market price observations with previous trading-day comparison
   */
  static async getPricesWithComparison(params: {
    state?: string;
    district?: string;
    market?: string;
    commodity?: string;
    date?: string;
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
    });

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

        if (prevObs && prevObs.modalPrice > 0) {
          priceChange = obs.modalPrice - prevObs.modalPrice;
          percentageChange = parseFloat(((priceChange / prevObs.modalPrice) * 100).toFixed(2));
        }

        return {
          id: obs.id,
          commodityId: obs.commodityId,
          commodityName: obs.commodity.name,
          variety: obs.commodity.variety,
          category: obs.commodity.category,
          locationId: obs.locationId,
          marketName: obs.location.name,
          state: obs.location.state,
          district: obs.location.district,
          minPrice: obs.minPrice,
          maxPrice: obs.maxPrice,
          modalPrice: obs.modalPrice,
          unit: obs.unit,
          priceDate: obs.priceDate.toISOString().split('T')[0],
          fetchedAt: obs.fetchedAt,
          source: obs.source,
          isDemo: obs.isDemo,
          comparison: {
            previousModalPrice: prevObs ? prevObs.modalPrice : null,
            previousPriceDate: prevObs ? prevObs.priceDate.toISOString().split('T')[0] : null,
            priceChange,
            percentageChange,
            status: prevObs ? (priceChange! > 0 ? 'up' : priceChange! < 0 ? 'down' : 'stable') : 'unavailable',
          },
        };
      })
    );

    return {
      date: targetDate.toISOString().split('T')[0],
      total: results.length,
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
}
