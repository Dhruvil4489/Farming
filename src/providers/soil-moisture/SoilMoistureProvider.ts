export interface SoilMoistureRecordPayload {
  state: string;
  district: string;
  observationDate: Date;
  moistureValue: number;
  originalUnit: string;
  normalizedPercentage: number;
  depthRangeCm: string;
  spatialResolution: string;
  modelProvider: string;
  datasetCatalog: string;
  resourceId?: string | null;
  sourceUrl: string;
  qualityStatus: string;
  isDemo: boolean;
  notes?: string | null;
}

export interface SoilMoistureQueryOptions {
  state?: string;
  district?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface SoilMoistureProviderStatus {
  providerName: string;
  isConfigured: boolean;
  requiresApiKey: boolean;
  datasetCatalog: string;
  spatialResolution: string;
  status: 'active' | 'archive' | 'demo' | 'error' | 'unconfigured';
  message: string;
}

export interface SoilMoistureProvider {
  getProviderName(): string;
  fetchObservations(options?: SoilMoistureQueryOptions): Promise<SoilMoistureRecordPayload[]>;
  getStatus(): Promise<SoilMoistureProviderStatus>;
}
