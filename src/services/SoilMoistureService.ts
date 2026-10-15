import { prisma } from '@/lib/prisma';
import { SoilMoistureProvider } from '@/providers/soil-moisture/SoilMoistureProvider';
import { GovernmentSoilMoistureProvider } from '@/providers/soil-moisture/GovernmentSoilMoistureProvider';
import { DemoSoilMoistureProvider } from '@/providers/soil-moisture/DemoSoilMoistureProvider';

export interface SoilMoistureCategory {
  level: 'deficit' | 'optimum' | 'surplus';
  label: string;
  badgeClass: string;
  description: string;
}

export class SoilMoistureService {
  private static providerInstance: SoilMoistureProvider | null = null;

  static getProvider(): SoilMoistureProvider {
    if (!this.providerInstance) {
      const providerType = process.env.SOIL_MOISTURE_PROVIDER || 'government';
      if (providerType === 'demo') {
        this.providerInstance = new DemoSoilMoistureProvider();
      } else {
        this.providerInstance = new GovernmentSoilMoistureProvider();
      }
    }
    return this.providerInstance;
  }

  /**
   * Evaluates volumetric soil moisture percentage against scientific agronomic thresholds
   * Typical field capacity for Indian loamy/vertisol agricultural soils is 25-35% VWC.
   * Wilting point is typically ~12-16%.
   */
  static categorizeMoisture(pct: number): SoilMoistureCategory {
    if (pct < 20) {
      return {
        level: 'deficit',
        label: 'Low / Moisture Stress',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        description: 'Soil root zone moisture is below field capacity. Crops may experience transpiration stress without timely irrigation.',
      };
    } else if (pct <= 34) {
      return {
        level: 'optimum',
        label: 'Optimal Available Water',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        description: 'Soil volumetric moisture is within prime plant-available water range (PAW) for vegetative development.',
      };
    } else {
      return {
        level: 'surplus',
        label: 'High / Near Saturation',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        description: 'Upper root zone is near field saturation. Ensure proper drainage to avoid root hypoxia.',
      };
    }
  }

  /**
   * Fetches latest district observations for a state
   */
  static async getLatestDistrictObservations(params?: { state?: string; district?: string }) {
    const targetState = params?.state || 'Gujarat';
    const targetDistrict = params?.district;

    const where: any = { state: targetState };
    if (targetDistrict) {
      where.district = targetDistrict;
    }

    // Query most recent observations from DB
    const observations = await prisma.soilMoistureObservation.findMany({
      where,
      orderBy: [{ observationDate: 'desc' }, { district: 'asc' }],
      take: 50,
    });

    if (observations.length === 0) {
      // Provider fetch fallback
      const provider = this.getProvider();
      const fresh = await provider.fetchObservations({
        state: targetState,
        district: targetDistrict,
      });

      return fresh.map((obs) => ({
        ...obs,
        category: this.categorizeMoisture(obs.normalizedPercentage),
        isGovernmentModel: true,
      }));
    }

    // Deduplicate to get the latest per district
    const latestByDistrict = new Map<string, typeof observations[0]>();
    for (const obs of observations) {
      if (!latestByDistrict.has(obs.district)) {
        latestByDistrict.set(obs.district, obs);
      }
    }

    return Array.from(latestByDistrict.values()).map((obs) => ({
      id: obs.id,
      state: obs.state,
      district: obs.district,
      observationDate: obs.observationDate.toISOString().split('T')[0],
      moistureValue: obs.moistureValue,
      originalUnit: obs.originalUnit,
      normalizedPercentage: obs.normalizedPercentage,
      depthRangeCm: obs.depthRangeCm,
      spatialResolution: obs.spatialResolution,
      modelProvider: obs.modelProvider,
      datasetCatalog: obs.datasetCatalog,
      sourceUrl: obs.sourceUrl,
      qualityStatus: obs.qualityStatus,
      isDemo: obs.isDemo,
      notes: obs.notes,
      fetchedAt: obs.fetchedAt,
      category: this.categorizeMoisture(obs.normalizedPercentage),
      isGovernmentModel: true,
    }));
  }

  /**
   * Fetches historical moisture trend for a given district
   */
  static async getDistrictTrend(state: string, district: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await prisma.soilMoistureObservation.findMany({
      where: {
        state,
        district,
        observationDate: {
          gte: cutoffDate,
        },
      },
      orderBy: { observationDate: 'asc' },
    });

    return history.map((h) => ({
      date: h.observationDate.toISOString().split('T')[0],
      moistureValue: h.moistureValue,
      normalizedPercentage: h.normalizedPercentage,
      depthRangeCm: h.depthRangeCm,
      category: this.categorizeMoisture(h.normalizedPercentage),
    }));
  }

  /**
   * Available districts in the system
   */
  static async getAvailableDistricts(state: string = 'Gujarat') {
    const districts = await prisma.soilMoistureObservation.findMany({
      where: { state },
      select: { district: true },
      distinct: ['district'],
      orderBy: { district: 'asc' },
    });

    return districts.map((d) => d.district);
  }

  /**
   * In-situ physical farm sensor readings for an individual field plot
   * Strictly distinguishes real hardware telemetry from macroscale government models
   */
  static async getFieldSensorTelemetry(fieldId: string) {
    const sensorReadings = await prisma.farmSensorMoisture.findMany({
      where: { fieldId },
      orderBy: { readingAt: 'desc' },
      take: 20,
    });

    if (sensorReadings.length === 0) {
      return {
        hasSensor: false,
        fieldId,
        message: 'No physical IoT soil sensor probe currently paired with this field.',
        sensorTelemetryNotice:
          'In-situ sensors measure real-time capacitance at 15cm soil depth. If unavailable, reference government VIC district model estimates as an agro-climatic baseline.',
        readings: [],
      };
    }

    const latest = sensorReadings[0];
    return {
      hasSensor: true,
      fieldId,
      sensorId: latest.sensorId,
      hardwareType: latest.hardwareType || 'Capacitive FDR / TDR Soil Moisture Probe',
      depthCm: latest.depthCm,
      status: latest.status,
      latestReading: {
        id: latest.id,
        moisturePct: latest.moisturePct,
        temperatureC: latest.temperatureC,
        batteryPct: latest.batteryPct,
        readingAt: latest.readingAt,
        category: this.categorizeMoisture(latest.moisturePct),
      },
      historicalReadings: sensorReadings.map((r) => ({
        id: r.id,
        moisturePct: r.moisturePct,
        temperatureC: r.temperatureC,
        readingAt: r.readingAt,
      })),
    };
  }

  /**
   * Record real hardware sensor observation
   */
  static async recordSensorReading(data: {
    fieldId: string;
    sensorId?: string;
    hardwareType?: string;
    moisturePct: number;
    temperatureC?: number;
    batteryPct?: number;
    depthCm?: number;
  }) {
    return prisma.farmSensorMoisture.create({
      data: {
        fieldId: data.fieldId,
        sensorId: data.sensorId || 'SN-SOIL-PROBE-01',
        hardwareType: data.hardwareType || 'Capacitive FDR Probe',
        moisturePct: data.moisturePct,
        temperatureC: data.temperatureC,
        batteryPct: data.batteryPct ?? 98.0,
        depthCm: data.depthCm || 15,
        status: 'active',
      },
    });
  }
}
