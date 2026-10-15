import {
  SoilMoistureProvider,
  SoilMoistureQueryOptions,
  SoilMoistureRecordPayload,
  SoilMoistureProviderStatus,
} from './SoilMoistureProvider';
import { prisma } from '@/lib/prisma';

export class DemoSoilMoistureProvider implements SoilMoistureProvider {
  getProviderName(): string {
    return 'SmartFarm Demo Soil Moisture Provider';
  }

  async getStatus(): Promise<SoilMoistureProviderStatus> {
    return {
      providerName: this.getProviderName(),
      isConfigured: true,
      requiresApiKey: false,
      datasetCatalog: 'Demo / Sandbox Reference Dataset',
      spatialResolution: 'district_level_vic_model (simulated baseline)',
      status: 'demo',
      message: 'Running in demonstration mode. Records are marked as demo simulations.',
    };
  }

  async fetchObservations(options?: SoilMoistureQueryOptions): Promise<SoilMoistureRecordPayload[]> {
    const state = options?.state || 'Gujarat';
    const district = options?.district;
    const limit = options?.limit || 20;

    const where: any = {};
    if (state) where.state = state;
    if (district) where.district = district;

    const dbRecords = await prisma.soilMoistureObservation.findMany({
      where,
      orderBy: { observationDate: 'desc' },
      take: limit,
    });

    if (dbRecords.length > 0) {
      return dbRecords.map((r) => ({
        state: r.state,
        district: r.district,
        observationDate: r.observationDate,
        moistureValue: r.moistureValue,
        originalUnit: r.originalUnit,
        normalizedPercentage: r.normalizedPercentage,
        depthRangeCm: r.depthRangeCm,
        spatialResolution: r.spatialResolution,
        modelProvider: r.modelProvider,
        datasetCatalog: r.datasetCatalog,
        resourceId: r.resourceId,
        sourceUrl: r.sourceUrl,
        qualityStatus: r.qualityStatus,
        isDemo: true,
        notes: r.notes ? `[Demo Mode] ${r.notes}` : '[Demo Mode] Simulated soil moisture reference',
      }));
    }

    // Default fallback demo record
    return [
      {
        state: 'Gujarat',
        district: district || 'Vadodara',
        observationDate: new Date(),
        moistureValue: 0.28,
        originalUnit: 'm3/m3',
        normalizedPercentage: 28.0,
        depthRangeCm: '0-50 cm',
        spatialResolution: 'district_level_vic_model',
        modelProvider: 'NRSC / ISRO Hydrological VIC Model (Demo Simulation)',
        datasetCatalog: 'Demo Simulation Reference',
        resourceId: 'demo-soil-moisture-01',
        sourceUrl: 'https://data.gov.in/catalog/daily-data-soil-moisture',
        qualityStatus: 'demo_simulation',
        isDemo: true,
        notes: 'Simulated demonstration record. Do not use for field irrigation decisions.',
      },
    ];
  }
}
