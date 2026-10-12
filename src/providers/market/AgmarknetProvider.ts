import { MarketDataProvider, MarketQueryOptions, MarketRecordPayload, MarketProviderStatus } from './MarketDataProvider';

export class AgmarknetProvider implements MarketDataProvider {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.MARKET_API_KEY || process.env.DATA_GOV_IN_API_KEY || '';
    // AGMARKNET Current Daily Price resource ID on data.gov.in
    this.endpoint = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
  }

  getProviderName(): string {
    return 'AGMARKNET (data.gov.in Official API)';
  }

  async getStatus(): Promise<MarketProviderStatus> {
    if (!this.apiKey) {
      return {
        providerName: this.getProviderName(),
        isConfigured: false,
        requiresApiKey: true,
        status: 'unconfigured',
        message: 'Government API key not set. Add MARKET_API_KEY to your .env file to enable live sync from data.gov.in.',
      };
    }

    return {
      providerName: this.getProviderName(),
      isConfigured: true,
      requiresApiKey: true,
      status: 'active',
      message: 'Connected to India Open Government Data Platform (data.gov.in AGMARKNET feed).',
    };
  }

  async fetchPrices(options?: MarketQueryOptions): Promise<MarketRecordPayload[]> {
    if (!this.apiKey) {
      throw new Error('AGMARKNET API Key is unconfigured. Please configure MARKET_API_KEY in .env');
    }

    const params = new URLSearchParams({
      'api-key': this.apiKey,
      format: 'json',
      limit: String(options?.limit || 100),
    });

    if (options?.state) {
      params.append('filters[state]', options.state);
    }
    if (options?.district) {
      params.append('filters[district]', options.district);
    }
    if (options?.market) {
      params.append('filters[market]', options.market);
    }
    if (options?.commodity) {
      params.append('filters[commodity]', options.commodity);
    }

    try {
      const response = await fetch(`${this.endpoint}?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartFarm-AI-AgriPlatform/1.0',
        },
        next: { revalidate: 3600 }, // Cache 1 hour
      });

      if (!response.ok) {
        throw new Error(`data.gov.in API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const records = json.records || [];

      return records.map((rec: any): MarketRecordPayload => {
        // AGMARKNET dates are typically DD/MM/YYYY
        let recordDate = new Date();
        if (rec.arrival_date) {
          const parts = rec.arrival_date.split('/');
          if (parts.length === 3) {
            recordDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          }
        }

        return {
          state: rec.state || 'Gujarat',
          district: rec.district || '',
          market: rec.market || '',
          commodity: rec.commodity || '',
          variety: rec.variety || 'Common',
          minPrice: parseFloat(rec.min_price) || 0,
          maxPrice: parseFloat(rec.max_price) || 0,
          modalPrice: parseFloat(rec.modal_price) || 0,
          unit: '₹/Quintal',
          priceDate: recordDate,
          source: 'AGMARKNET / data.gov.in',
          isDemo: false,
        };
      });
    } catch (err: any) {
      console.error('[AgmarknetProvider] Fetch error:', err.message);
      throw err;
    }
  }
}
