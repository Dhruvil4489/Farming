export interface MarketRecordPayload {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number | null;
  unit: string;
  priceDate: Date;
  source: string;
  sourceResourceId?: string;
  isDemo: boolean;
  qualityStatus: 'ok' | 'anomaly_price_order' | 'missing_price';
}

export interface MarketQueryOptions {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  date?: Date;
  limit?: number;
  offset?: number;
}

export interface MarketProviderStatus {
  providerName: string;
  isConfigured: boolean;
  requiresApiKey: boolean;
  lastSuccessfulSync?: Date | null;
  status: 'active' | 'demo' | 'error' | 'unconfigured';
  message: string;
}

export interface MarketSyncResult {
  syncRunId: string;
  provider: string;
  status: 'success' | 'partial' | 'failed' | 'skipped_locked';
  recordsFetched: number;
  recordsStored: number;
  recordsSkipped: number;
  anomalies: number;
  errorMessage?: string;
  durationMs: number;
  triggerSource?: string;
  lockedUntil?: Date;
}

export interface MarketDataProvider {
  getProviderName(): string;
  fetchPrices(options?: MarketQueryOptions): Promise<MarketRecordPayload[]>;
  getStatus(): Promise<MarketProviderStatus>;
}

