export interface MarketRecordPayload {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  priceDate: Date;
  source: string;
  isDemo: boolean;
}

export interface MarketQueryOptions {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  date?: Date;
  limit?: number;
}

export interface MarketProviderStatus {
  providerName: string;
  isConfigured: boolean;
  requiresApiKey: boolean;
  lastSuccessfulSync?: Date | null;
  status: 'active' | 'demo' | 'error' | 'unconfigured';
  message: string;
}

export interface MarketDataProvider {
  getProviderName(): string;
  fetchPrices(options?: MarketQueryOptions): Promise<MarketRecordPayload[]>;
  getStatus(): Promise<MarketProviderStatus>;
}
