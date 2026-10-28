import { MarketDataProvider, MarketQueryOptions, MarketRecordPayload, MarketProviderStatus } from './MarketDataProvider';

export class DemoMarketProvider implements MarketDataProvider {
  getProviderName(): string {
    return 'Demo / Reference Market Provider';
  }

  async getStatus(): Promise<MarketProviderStatus> {
    return {
      providerName: this.getProviderName(),
      isConfigured: true,
      requiresApiKey: false,
      status: 'demo',
      message: 'Running in demo mode with seeded AGMARKNET historical reference records. All prices are explicitly labelled as demo data.',
    };
  }

  async fetchPrices(options?: MarketQueryOptions): Promise<MarketRecordPayload[]> {
    const today = new Date('2026-10-11T05:30:00Z');

    const demoRecords: MarketRecordPayload[] = [
      {
        state: 'Gujarat',
        district: 'Rajkot',
        market: 'Rajkot APMC',
        commodity: 'Cotton',
        variety: 'Shankar-6',
        grade: '',
        minPrice: 7100,
        maxPrice: 7780,
        modalPrice: 7520,
        unit: '₹/Quintal',
        priceDate: today,
        source: 'Demo — AGMARKNET Reference',
        isDemo: true,
        qualityStatus: 'ok',
      },
      {
        state: 'Gujarat',
        district: 'Rajkot',
        market: 'Gondal APMC',
        commodity: 'Cotton',
        variety: 'Shankar-6',
        grade: '',
        minPrice: 7150,
        maxPrice: 7820,
        modalPrice: 7560,
        unit: '₹/Quintal',
        priceDate: today,
        source: 'Demo — AGMARKNET Reference',
        isDemo: true,
        qualityStatus: 'ok',
      },
      {
        state: 'Gujarat',
        district: 'Rajkot',
        market: 'Rajkot APMC',
        commodity: 'Groundnut',
        variety: 'GG-20 (Bold)',
        grade: '',
        minPrice: 5900,
        maxPrice: 6650,
        modalPrice: 6320,
        unit: '₹/Quintal',
        priceDate: today,
        source: 'Demo — AGMARKNET Reference',
        isDemo: true,
        qualityStatus: 'ok',
      },
      {
        state: 'Gujarat',
        district: 'Mehsana',
        market: 'Unjha APMC',
        commodity: 'Cumin (Jeera)',
        variety: 'Unjha Special',
        grade: '',
        minPrice: 23500,
        maxPrice: 26800,
        modalPrice: 25200,
        unit: '₹/Quintal',
        priceDate: today,
        source: 'Demo — AGMARKNET Reference',
        isDemo: true,
        qualityStatus: 'ok',
      },
      {
        state: 'Gujarat',
        district: 'Surat',
        market: 'Surat APMC',
        commodity: 'Wheat',
        variety: 'Lokwan',
        grade: '',
        minPrice: 2650,
        maxPrice: 2980,
        modalPrice: 2840,
        unit: '₹/Quintal',
        priceDate: today,
        source: 'Demo — AGMARKNET Reference',
        isDemo: true,
        qualityStatus: 'ok',
      },
      {
        state: 'Gujarat',
        district: 'Bhavnagar',
        market: 'Mahuva APMC',
        commodity: 'Onion',
        variety: 'Red Medium',
        grade: '',
        minPrice: 1450,
        maxPrice: 2300,
        modalPrice: 1920,
        unit: '₹/Quintal',
        priceDate: today,
        source: 'Demo — AGMARKNET Reference',
        isDemo: true,
        qualityStatus: 'ok',
      },
    ];

    if (options?.state) {
      return demoRecords.filter((r) => r.state.toLowerCase() === options.state?.toLowerCase());
    }
    if (options?.commodity) {
      return demoRecords.filter((r) => r.commodity.toLowerCase().includes(options.commodity?.toLowerCase() || ''));
    }

    return demoRecords;
  }
}

