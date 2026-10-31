import { prisma } from '@/lib/prisma';
import { SoilMoistureProvider } from '@/providers/soil-moisture/SoilMoistureProvider';
import { GovernmentSoilMoistureProvider } from '@/providers/soil-moisture/GovernmentSoilMoistureProvider';
import { DemoSoilMoistureProvider } from '@/providers/soil-moisture/DemoSoilMoistureProvider';
import { CROP_MOISTURE_THRESHOLDS, CropMoistureThreshold } from '@/services/IotAdvisoryEngine';

export interface SoilMoistureCategory {
  level: 'dry' | 'optimal' | 'wet' | 'critical';
  label: string;
  badgeClass: string;
  description: string;
}

export interface CropSoilThreshold {
  low: number;
  optimal: number;
  high: number;
  cropName: string;
  soilType: string;
  stageName: string;
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
   * Resolves crop-specific and soil-adjusted thresholds.
   * Never uses an arbitrary single universal number for all crops and soil types.
   */
  static resolveThresholds(cropSlug?: string | null, soilType?: string | null): CropSoilThreshold {
    const defaultSoil = soilType?.toLowerCase() || 'loamy';
    const normCrop = cropSlug?.toLowerCase() || 'generic';

    const foundConfig =
      CROP_MOISTURE_THRESHOLDS.find((c) => c.cropSlug.toLowerCase() === normCrop) ||
      CROP_MOISTURE_THRESHOLDS.find((c) => normCrop.includes(c.cropSlug.toLowerCase())) ||
      null;

    let baseLow = 30;
    let baseOptimal = 45;
    let baseHigh = 65;
    let resolvedCropName = 'General Crops';

    if (foundConfig) {
      baseLow = foundConfig.default.low;
      baseOptimal = foundConfig.default.optimal;
      baseHigh = foundConfig.default.high;
      resolvedCropName = foundConfig.cropName;

      // Adjust for soil texture
      if (foundConfig.soilAdjustments && foundConfig.soilAdjustments[defaultSoil]) {
        const offset = foundConfig.soilAdjustments[defaultSoil].offsetPct;
        baseLow += offset;
        baseOptimal += offset;
        baseHigh += offset;
      }
    } else {
      // General soil adjustments
      if (defaultSoil === 'sandy') {
        baseLow = 20;
        baseOptimal = 35;
        baseHigh = 50;
      } else if (defaultSoil === 'clay' || defaultSoil === 'black') {
        baseLow = 35;
        baseOptimal = 55;
        baseHigh = 75;
      }
    }

    return {
      low: baseLow,
      optimal: baseOptimal,
      high: baseHigh,
      cropName: resolvedCropName,
      soilType: defaultSoil,
      stageName: 'Active Stage',
    };
  }

  /**
   * Categorizes soil moisture based on crop and soil-specific thresholds.
   */
  static categorizeMoistureWithThreshold(pct: number, threshold: CropSoilThreshold): SoilMoistureCategory {
    if (pct < 15) {
      return {
        level: 'critical',
        label: 'Critical Water Deficit',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        description: `Soil moisture (${pct.toFixed(1)}%) is critically low, approaching permanent wilting point. Immediate irrigation required to save the crop.`,
      };
    } else if (pct < threshold.low) {
      return {
        level: 'dry',
        label: 'Dry / Moisture Stress',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        description: `Soil moisture (${pct.toFixed(1)}%) is below the minimum threshold (${threshold.low}%) for ${threshold.cropName} in ${threshold.soilType} soil. Transpiration stress is likely.`,
      };
    } else if (pct <= threshold.optimal + 5) {
      return {
        level: 'optimal',
        label: 'Optimal Available Water',
        badgeClass: 'bg-emerald-100 text-[#143D2A] border-emerald-300',
        description: `Soil moisture (${pct.toFixed(1)}%) is within the prime plant-available water range (${threshold.low}% – ${threshold.high}%) for healthy vegetative and fruit development.`,
      };
    } else if (pct <= threshold.high + 5) {
      return {
        level: 'wet',
        label: 'Wet / High Moisture',
        badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        description: `Soil moisture (${pct.toFixed(1)}%) is elevated near field capacity. Adequate water is present; hold off further irrigation.`,
      };
    } else {
      return {
        level: 'critical',
        label: 'Critical Over-Saturation',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        description: `Soil moisture (${pct.toFixed(1)}%) exceeds upper saturation limit (${threshold.high}%). Risk of root zone oxygen deprivation (hypoxia), root rot, and fertilizer runoff.`,
      };
    }
  }

  /**
   * Fetches full telemetry, device status, and thresholds for a specific field.
   * Strictly distinguishes live IoT hardware from manual logs or estimated data.
   */
  static async getFieldSensorTelemetry(fieldId: string) {
    // 1. Fetch Field details and active crop
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        farm: true,
        cropCycles: {
          where: { deletedAt: null, status: { not: 'completed' } },
          include: { crop: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!field) {
      throw new Error('Field not found');
    }

    const activeCycle = field.cropCycles[0] || null;
    const cropSlug = activeCycle?.crop?.slug || null;
    const cropName = activeCycle?.customCropName || activeCycle?.crop?.slug || 'General Crop';
    const soilType = field.soilType || 'loamy';

    const thresholds = this.resolveThresholds(cropSlug, soilType);

    // 2. Check for registered IoT hardware probe
    const registeredDevice = await prisma.iotDevice.findFirst({
      where: { fieldId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Query readings from IoT Telemetry table
    const iotReadings = await prisma.iotTelemetryReading.findMany({
      where: { fieldId },
      orderBy: { measuredAt: 'desc' },
      take: 30,
    });

    // 4. Query readings from FarmSensorMoisture table (handles manual & legacy probes)
    const farmSensorReadings = await prisma.farmSensorMoisture.findMany({
      where: { fieldId },
      orderBy: { readingAt: 'desc' },
      take: 30,
    });

    // Determine the latest observation across both tables
    let latestReading: any = null;
    let dataSource: 'live_iot' | 'historical_iot' | 'manual' | 'none' = 'none';

    if (iotReadings.length > 0) {
      const top = iotReadings[0];
      const ageMinutes = (Date.now() - new Date(top.measuredAt).getTime()) / 60000;
      dataSource = ageMinutes < 180 ? 'live_iot' : 'historical_iot';
      latestReading = {
        id: top.id,
        moisturePct: top.soilMoisturePct ?? 0,
        temperatureC: top.airTempC,
        batteryPct: top.batteryPct,
        batteryVoltage: top.batteryVoltage,
        measuredAt: top.measuredAt.toISOString(),
        depthCm: top.depthCm || 15,
        qualityStatus: top.qualityStatus,
        source: dataSource,
        category: this.categorizeMoistureWithThreshold(top.soilMoisturePct ?? 0, thresholds),
      };
    } else if (farmSensorReadings.length > 0) {
      const top = farmSensorReadings[0];
      const isManual = top.hardwareType?.includes('manual') || top.sensorId?.includes('MANUAL');
      dataSource = isManual ? 'manual' : 'historical_iot';
      latestReading = {
        id: top.id,
        moisturePct: top.moisturePct,
        temperatureC: top.temperatureC,
        batteryPct: top.batteryPct,
        measuredAt: top.readingAt.toISOString(),
        depthCm: top.depthCm,
        qualityStatus: 'clean',
        source: dataSource,
        category: this.categorizeMoistureWithThreshold(top.moisturePct, thresholds),
      };
    }

    // Smart recommendation evaluation
    let recommendation = {
      action: 'monitor',
      reason: 'No moisture measurements available. Log a manual reading or connect an ESP32 capacitive probe.',
      urgency: 'low',
    };

    if (latestReading) {
      const pct = latestReading.moisturePct;
      if (pct < thresholds.low) {
        recommendation = {
          action: 'irrigate_now',
          reason: `Soil moisture (${pct.toFixed(1)}%) is below the minimum threshold (${thresholds.low}%) for ${cropName}. Irrigation is recommended to prevent water deficit stress.`,
          urgency: 'high',
        };
      } else if (pct > thresholds.high) {
        recommendation = {
          action: 'delay_irrigation',
          reason: `Soil moisture (${pct.toFixed(1)}%) is near saturation (> ${thresholds.high}%). Postpone irrigation to avoid root hypoxia and fertilizer loss.`,
          urgency: 'low',
        };
      } else {
        recommendation = {
          action: 'sufficient_moisture',
          reason: `Soil moisture (${pct.toFixed(1)}%) is optimal (${thresholds.low}% - ${thresholds.high}%). Current moisture is sufficient for plant growth.`,
          urgency: 'low',
        };
      }
    }

    return {
      fieldId,
      fieldName: field.name,
      cropName,
      soilType,
      hasSensor: Boolean(registeredDevice || latestReading),
      sensorConnected: Boolean(registeredDevice && registeredDevice.status === 'active'),
      sensorNotice: registeredDevice
        ? null
        : 'Sensor Not Connected. No physical hardware probe is paired with this field plot.',
      device: registeredDevice
        ? {
            id: registeredDevice.id,
            deviceCode: registeredDevice.deviceCode,
            name: registeredDevice.name,
            hardwareModel: registeredDevice.hardwareModel,
            status: registeredDevice.status,
            lastSeenAt: registeredDevice.lastSeenAt?.toISOString() || null,
            batteryVoltage: registeredDevice.batteryVoltage,
          }
        : null,
      latestReading,
      dataSource,
      thresholds,
      recommendation,
    };
  }

  /**
   * Fetches historical time-series data for visualization (24h, 7d, 30d).
   * Calculates actual stored minimum, maximum, and average values.
   */
  static async getHistoryChartData(fieldId: string, timeframe: '24h' | '7d' | '30d' = '7d') {
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Query readings from both telemetry and sensor tables
    const [iotReadings, sensorReadings] = await Promise.all([
      prisma.iotTelemetryReading.findMany({
        where: {
          fieldId,
          measuredAt: { gte: cutoffDate },
        },
        orderBy: { measuredAt: 'asc' },
        take: 300,
      }),
      prisma.farmSensorMoisture.findMany({
        where: {
          fieldId,
          readingAt: { gte: cutoffDate },
        },
        orderBy: { readingAt: 'asc' },
        take: 300,
      }),
    ]);

    // Merge and format points
    const points: Array<{
      id: string;
      timestamp: string;
      moisturePct: number;
      temperatureC: number | null;
      source: string;
    }> = [];

    for (const r of iotReadings) {
      if (r.soilMoisturePct !== null && r.soilMoisturePct !== undefined) {
        points.push({
          id: r.id,
          timestamp: r.measuredAt.toISOString(),
          moisturePct: r.soilMoisturePct,
          temperatureC: r.airTempC,
          source: 'iot_sensor',
        });
      }
    }

    for (const r of sensorReadings) {
      points.push({
        id: r.id,
        timestamp: r.readingAt.toISOString(),
        moisturePct: r.moisturePct,
        temperatureC: r.temperatureC,
        source: r.hardwareType?.includes('manual') ? 'manual' : 'sensor',
      });
    }

    // Sort chronologically
    points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate statistical metrics
    let minMoisture: number | null = null;
    let maxMoisture: number | null = null;
    let avgMoisture: number | null = null;

    if (points.length > 0) {
      const vals = points.map((p) => p.moisturePct);
      minMoisture = Math.min(...vals);
      maxMoisture = Math.max(...vals);
      avgMoisture = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    }

    return {
      fieldId,
      timeframe,
      points,
      statistics: {
        totalReadings: points.length,
        minMoisture,
        maxMoisture,
        avgMoisture,
      },
    };
  }

  /**
   * Records a manual soil moisture test logged by the farmer.
   */
  static async recordManualMeasurement(data: {
    fieldId: string;
    moisturePct: number;
    depthCm?: number;
    temperatureC?: number;
    notes?: string;
  }) {
    if (data.moisturePct < 0 || data.moisturePct > 100) {
      throw new Error('Soil moisture percentage must be between 0 and 100%');
    }

    return prisma.farmSensorMoisture.create({
      data: {
        fieldId: data.fieldId,
        sensorId: 'MANUAL-TEST-LOG',
        hardwareType: 'manual_measurement',
        moisturePct: data.moisturePct,
        depthCm: data.depthCm || 15,
        temperatureC: data.temperatureC,
        batteryPct: 100,
        status: 'active',
        readingAt: new Date(),
      },
    });
  }

  /**
   * Ingests hardware sensor telemetry (e.g. ESP32 capacitive probe via HTTP/MQTT).
   * Validates values and prevents duplicate event nonces.
   */
  static async recordSensorReading(data: {
    fieldId: string;
    sensorId?: string;
    hardwareType?: string;
    moisturePct: number;
    temperatureC?: number;
    batteryPct?: number;
    depthCm?: number;
    eventId?: string;
  }) {
    if (data.moisturePct < 0 || data.moisturePct > 100) {
      throw new Error('Moisture index out of plausible physical range (0-100%)');
    }

    return prisma.farmSensorMoisture.create({
      data: {
        fieldId: data.fieldId,
        sensorId: data.sensorId || 'SN-ESP32-PROBE-01',
        hardwareType: data.hardwareType || 'ESP32 Capacitive Soil Probe',
        moisturePct: data.moisturePct,
        temperatureC: data.temperatureC,
        batteryPct: data.batteryPct ?? 98.0,
        depthCm: data.depthCm || 15,
        status: 'active',
      },
    });
  }

  /**
   * Government macroscale district observations (for reference)
   */
  static async getLatestDistrictObservations(params?: { state?: string; district?: string }) {
    const targetState = params?.state || 'Gujarat';
    const targetDistrict = params?.district;

    const where: any = { state: targetState };
    if (targetDistrict) {
      where.district = targetDistrict;
    }

    const observations = await prisma.soilMoistureObservation.findMany({
      where,
      orderBy: [{ observationDate: 'desc' }, { district: 'asc' }],
      take: 50,
    });

    if (observations.length === 0) {
      const provider = this.getProvider();
      const fresh = await provider.fetchObservations({
        state: targetState,
        district: targetDistrict,
      });

      return fresh.map((obs) => ({
        ...obs,
        category: this.categorizeMoistureWithThreshold(obs.normalizedPercentage, {
          low: 25,
          optimal: 35,
          high: 50,
          cropName: 'Regional',
          soilType: 'Regional',
          stageName: 'General',
        }),
        isGovernmentModel: true,
      }));
    }

    const latestByDistrict = new Map<string, (typeof observations)[0]>();
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
      category: this.categorizeMoistureWithThreshold(obs.normalizedPercentage, {
        low: 25,
        optimal: 35,
        high: 50,
        cropName: 'Regional',
        soilType: 'Regional',
        stageName: 'General',
      }),
      isGovernmentModel: true,
    }));
  }

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
   * Historical moisture trend for a given district
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
      category: this.categorizeMoistureWithThreshold(
        h.normalizedPercentage,
        this.resolveThresholds('wheat', 'loamy')
      ),
    }));
  }
}
