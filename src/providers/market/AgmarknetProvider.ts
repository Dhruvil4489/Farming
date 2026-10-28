import { MarketDataProvider, MarketQueryOptions, MarketRecordPayload, MarketProviderStatus } from './MarketDataProvider';

/**
 * AGMARKNET provider — fetches daily commodity prices from India's
 * Open Government Data Platform (data.gov.in).
 *
 * Resource: \"Current Daily Price of Various Commodities from Various Markets (Mandi)\"
 * Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
 *
 * Requires a data.gov.in API key (free registration).
 * Set MARKET_API_KEY or DATA_GOV_IN_API_KEY in .env.
 */
export class AgmarknetProvider implements MarketDataProvider {
  private apiKey: string;
  private resourceId: string;
  private baseEndpoint: string;

  /** Maximum records the API allows per page. */
  private static readonly PAGE_LIMIT = 500;
  /** Safety cap to prevent unbounded pagination. */
  private static readonly MAX_PAGES = 20;
  /** HTTP timeout per request (ms). */
  private static readonly TIMEOUT_MS = 15_000;

  constructor() {
    this.apiKey = process.env.MARKET_API_KEY || process.env.DATA_GOV_IN_API_KEY || '';
    this.resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
    this.baseEndpoint = `https://api.data.gov.in/resource/${this.resourceId}`;
  }

  getProviderName(): string {
    return 'AGMARKNET (data.gov.in Official API)';
  }

  getResourceId(): string {
    return this.resourceId;
  }

  async getStatus(): Promise<MarketProviderStatus> {
    if (!this.apiKey) {
      return {
        providerName: this.getProviderName(),
        isConfigured: false,
        requiresApiKey: true,
        status: 'unconfigured',
        message: 'Government API key not set. Add MARKET_API_KEY to your .env file to enable sync from data.gov.in.',
      };
    }

    return {
      providerName: this.getProviderName(),
      isConfigured: true,
      requiresApiKey: true,
      status: 'active',
      message: `Connected to India Open Government Data Platform. Resource ID: ${this.resourceId}`,
    };
  }

  /**
   * Fetch prices with pagination. Collects all pages up to MAX_PAGES.
   * When `options.limit` is set and small, fetches only that many records.
   */
  async fetchPrices(options?: MarketQueryOptions): Promise<MarketRecordPayload[]> {
    if (!this.apiKey) {
      throw new Error('AGMARKNET API key is not configured. Set MARKET_API_KEY in .env to enable sync.');
    }

    const wantedTotal = options?.limit ?? Infinity;
    const pageSize = Math.min(AgmarknetProvider.PAGE_LIMIT, wantedTotal);
    const allRecords: MarketRecordPayload[] = [];
    let currentOffset = options?.offset ?? 0;

    for (let page = 0; page < AgmarknetProvider.MAX_PAGES; page++) {
      if (allRecords.length >= wantedTotal) break;

      const params = new URLSearchParams({
        'api-key': this.apiKey,
        format: 'json',
        limit: String(pageSize),
        offset: String(currentOffset),
      });

      // Apply filters
      if (options?.state) params.append('filters[state]', options.state);
      if (options?.district) params.append('filters[district]', options.district);
      if (options?.market) params.append('filters[market]', options.market);
      if (options?.commodity) params.append('filters[commodity]', options.commodity);

      const pageRecords = await this.fetchPage(params);

      if (pageRecords.records.length === 0) break; // No more data

      allRecords.push(...pageRecords.records);
      currentOffset += pageRecords.records.length;

      // If we got fewer records than page size, we've reached the end
      if (pageRecords.records.length < pageSize) break;
      // If total is known and we've fetched all, stop
      if (pageRecords.apiTotal !== null && currentOffset >= pageRecords.apiTotal) break;
    }

    return wantedTotal !== Infinity ? allRecords.slice(0, wantedTotal) : allRecords;
  }

  /**
   * Fetches a single page from the API with timeout, retry on 429, and
   * structured error handling.
   */
  private async fetchPage(
    params: URLSearchParams
  ): Promise<{ records: MarketRecordPayload[]; apiTotal: number | null }> {
    // Build URL without exposing key in logs
    const url = `${this.baseEndpoint}?${params.toString()}`;
    const safeLogUrl = `${this.baseEndpoint}?format=json&limit=${params.get('limit')}&offset=${params.get('offset')}&[filters...]`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AgmarknetProvider.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SmartFarm-AI-AgriPlatform/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        throw new Error(
          'data.gov.in API rate limit exceeded (HTTP 429). Wait a few minutes before retrying.'
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `data.gov.in API authentication failed (HTTP ${response.status}). Verify your MARKET_API_KEY is valid.`
        );
      }

      if (response.status >= 500) {
        throw new Error(
          `data.gov.in server error (HTTP ${response.status}). The government API may be temporarily unavailable.`
        );
      }

      if (!response.ok) {
        throw new Error(`data.gov.in API returned HTTP ${response.status}: ${response.statusText}`);
      }

      let json: any;
      try {
        json = await response.json();
      } catch {
        throw new Error('data.gov.in returned malformed JSON. The API response could not be parsed.');
      }

      const rawRecords: any[] = json.records || [];
      const apiTotal: number | null = typeof json.total === 'number' ? json.total : null;

      const records = rawRecords
        .map((rec: any) => this.parseRecord(rec))
        .filter((r): r is MarketRecordPayload => r !== null);

      return { records, apiTotal };
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new Error(
          `data.gov.in API request timed out after ${AgmarknetProvider.TIMEOUT_MS / 1000}s. ` +
            'The government server may be slow or unreachable.'
        );
      }

      // Log without exposing the API key
      console.error(`[AgmarknetProvider] Fetch error for ${safeLogUrl}:`, err.message);
      throw err;
    }
  }

  /**
   * Parses a single AGMARKNET record into our domain model.
   * Returns null if the record is completely unusable (no commodity name).
   */
  private parseRecord(rec: any): MarketRecordPayload | null {
    const commodity = this.trimOrNull(rec.commodity);
    if (!commodity) return null; // Skip records without a commodity name

    const state = this.trimOrNull(rec.state);
    const district = this.trimOrNull(rec.district);
    const market = this.trimOrNull(rec.market);

    if (!state || !market) return null; // Need at minimum state + market for location

    const variety = this.trimOrNull(rec.variety) || 'Other';
    const grade = this.trimOrNull(rec.grade) || '';

    // Parse prices: keep null when absent or unparseable, never convert to zero
    const minPrice = this.parsePrice(rec.min_price);
    const maxPrice = this.parsePrice(rec.max_price);
    const modalPrice = this.parsePrice(rec.modal_price);

    // Parse arrival date (DD/MM/YYYY format)
    const priceDate = this.parseArrivalDate(rec.arrival_date);
    if (!priceDate) return null; // Skip records with unparseable dates

    // Determine quality status
    let qualityStatus: 'ok' | 'anomaly_price_order' | 'missing_price' = 'ok';

    if (minPrice === null || maxPrice === null || modalPrice === null) {
      qualityStatus = 'missing_price';
    } else if (!(minPrice <= modalPrice && modalPrice <= maxPrice)) {
      // Price ordering anomaly — retain the record but flag it
      qualityStatus = 'anomaly_price_order';
    }

    return {
      state,
      district: district || '',
      market,
      commodity,
      variety,
      grade,
      minPrice,
      maxPrice,
      modalPrice,
      unit: '₹/Quintal',
      priceDate,
      source: 'AGMARKNET / data.gov.in',
      sourceResourceId: this.resourceId,
      isDemo: false,
      qualityStatus,
    };
  }

  /**
   * Parses a price string to number. Returns null for missing/unparseable
   * values. Never returns zero for absent data.
   */
  private parsePrice(raw: any): number | null {
    if (raw === null || raw === undefined || raw === '') return null;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (isNaN(num)) return null;
    if (num < 0) return null; // Negative prices are data errors
    return num;
  }

  /**
   * Parses AGMARKNET arrival_date. Handles DD/MM/YYYY and other common formats.
   * Returns null for unparseable dates rather than falling back to today.
   */
  private parseArrivalDate(raw: any): Date | null {
    if (!raw || typeof raw !== 'string') return null;

    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Try DD/MM/YYYY
    const slashParts = trimmed.split('/');
    if (slashParts.length === 3) {
      const day = parseInt(slashParts[0], 10);
      const month = parseInt(slashParts[1], 10);
      const year = parseInt(slashParts[2], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        return new Date(Date.UTC(year, month - 1, day));
      }
    }

    // Try DD-MM-YYYY
    const dashParts = trimmed.split('-');
    if (dashParts.length === 3) {
      const day = parseInt(dashParts[0], 10);
      const month = parseInt(dashParts[1], 10);
      const year = parseInt(dashParts[2], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        return new Date(Date.UTC(year, month - 1, day));
      }
    }

    // Try ISO format YYYY-MM-DD as fallback
    const isoDate = new Date(trimmed);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    return null;
  }

  private trimOrNull(val: any): string | null {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    return s.length > 0 ? s : null;
  }
}

