/**
 * SmartFarm AI — Authorized Farm Context Builder
 *
 * Enforces strict multi-tenant boundary:
 * Gathers ONLY verified data owned by the authenticated user:
 * - Farmer profile & location (village, district, state, pincode)
 * - Selected / active Field plot
 * - Active CropCycle with live DAS, current stage guidance, next stage & variety
 * - Pending Tasks & recent Disease Diagnoses
 * - In-situ IoT sensor telemetry (with REAL DEVICE vs SIMULATED provenance)
 * - Live Open-Meteo current + tomorrow weather forecast
 * - Official AGMARKNET / APMC market price observations (crop-aware & query-aware)
 */

import { prisma } from '@/lib/prisma';
import { OpenMeteoProvider } from '@/providers/weather/OpenMeteoProvider';
import { resolveCropName } from '@/lib/units';
import { CropLifecycleEngine } from '@/services/CropLifecycleEngine';
import { matchLocalDirectory } from '@/lib/india-locations';

export interface FarmContextData {
  farmer: {
    name: string;
    village?: string | null;
    district?: string | null;
    state?: string | null;
    pincode?: string | null;
    language: string;
  };
  field?: {
    id: string;
    name: string;
    farmName?: string | null;
    areaHectares?: number | null;
    soilType?: string | null;
    irrigationType?: string | null;
  } | null;
  cropCycle?: {
    id: string;
    cropId: string;
    cropSlug: string;
    cropName: string;
    variety?: string | null;
    sowingDate: string;
    daysAfterSowing: number;
    totalDurationDays: number;
    progressPct: number;
    currentStage: string;
    currentStageWhatToDo?: string;
    currentStageHowToDo?: string;
    currentStagePrecautions?: string;
    nextStage?: string | null;
    daysUntilNextStage?: number | null;
    isApproximateTimeline: boolean;
  } | null;
  pendingTasks: Array<{
    title: string;
    type: string;
    dueDate: string | null;
    priority: string;
  }>;
  recentDiagnoses: Array<{
    cropName: string;
    diseaseName: string;
    severity?: string | null;
    diagnosedAt: string;
  }>;
  sensorTelemetry?: {
    soilMoistureIndex: number;
    temperatureC?: number | null;
    humidityPct?: number | null;
    measuredAt: string;
    provenance: 'REAL DEVICE' | 'SIMULATED';
    qualityStatus: string;
  } | null;
  weatherForecast?: {
    locationLabel: string;
    temperatureC: number;
    humidityPct: number;
    windSpeedKmh: number;
    precipitationProbabilityPct: number;
    summary: string;
    tomorrowDate?: string;
    tomorrowRainProbabilityPct?: number;
    tomorrowTempMaxC?: number;
    tomorrowTempMinC?: number;
    tomorrowCondition?: string;
    isFallback: boolean;
    timestamp: string;
  } | null;
  marketPrices: Array<{
    commodity: string;
    variety?: string | null;
    marketName: string;
    district: string;
    state: string;
    modalPrice: number;
    minPrice: number;
    maxPrice: number;
    arrivalDate: string;
    isDemo: boolean;
  }>;
}

export class AIContextBuilder {
  static async buildContext(
    userId: string,
    fieldId?: string | null,
    questionHint?: string
  ): Promise<FarmContextData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        village: true,
        district: true,
        state: true,
        pincode: true,
        lat: true,
        lng: true,
        preferredLanguage: true,
      },
    });

    if (!user) throw new Error('User not found');

    const fieldInclude = {
      farm: true,
      cropCycles: {
        where: { deletedAt: null, status: { notIn: ['completed'] } },
        include: {
          crop: { include: { translations: true } },
          variety: true,
          stages: {
            orderBy: { orderIndex: 'asc' as const },
            include: { templateStage: true },
          },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 1,
      },
      devices: {
        where: { status: 'active' },
        include: { readings: { orderBy: { measuredAt: 'desc' as const }, take: 1 } },
        take: 1,
      },
    };

    let targetField: any = null;
    if (fieldId) {
      targetField = await prisma.field.findFirst({
        where: { id: fieldId, deletedAt: null, farm: { userId, deletedAt: null } },
        include: fieldInclude,
      });
    } else {
      // Prefer a field that actually has an active crop cycle
      const allFields = await prisma.field.findMany({
        where: { deletedAt: null, farm: { userId, deletedAt: null } },
        include: fieldInclude,
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });
      targetField = allFields.find((f) => f.cropCycles.length > 0) || allFields[0] || null;
    }

    // Active crop cycle & full lifecycle plan
    let cropCycleData: FarmContextData['cropCycle'] = null;
    const activeCycle = targetField?.cropCycles?.[0];
    if (activeCycle) {
      const cropName = resolveCropName(
        activeCycle.crop,
        activeCycle.customCropName,
        user.preferredLanguage || 'en'
      );
      const lc = CropLifecycleEngine.buildLifecyclePlan({
        ...activeCycle,
        crop: activeCycle.crop ? { ...activeCycle.crop, name: cropName } : null,
      });

      cropCycleData = {
        id: activeCycle.id,
        cropId: activeCycle.cropId,
        cropSlug: activeCycle.crop?.slug || '',
        cropName,
        variety: activeCycle.variety?.name || null,
        sowingDate: activeCycle.sowingDate
          ? new Date(activeCycle.sowingDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        daysAfterSowing: lc.daysAfterSowing,
        totalDurationDays: lc.totalDurationDays,
        progressPct: lc.progressPct,
        currentStage: lc.currentStage?.name || activeCycle.status || 'Growing',
        currentStageWhatToDo: lc.currentStage?.whatToDo,
        currentStageHowToDo: lc.currentStage?.howToDo,
        currentStagePrecautions: lc.currentStage?.precautions,
        nextStage: lc.nextStage?.name || null,
        daysUntilNextStage: lc.daysUntilNextStage,
        isApproximateTimeline: lc.isApproximateTimeline,
      };
    }

    // Pending tasks & recent diagnoses
    const [tasks, diagnoses] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          deletedAt: null,
          status: { in: ['pending', 'in_progress'] },
          ...(targetField ? { OR: [{ fieldId: targetField.id }, { fieldId: null }] } : {}),
        },
        orderBy: { dueAt: 'asc' },
        take: 5,
      }),
      prisma.cropDiagnosisRecord.findMany({
        where: { userId, deletedAt: null },
        orderBy: { diagnosedAt: 'desc' },
        take: 3,
      }),
    ]);

    // IoT Telemetry
    let sensorData: FarmContextData['sensorTelemetry'] = null;
    const latestReading = targetField?.devices?.[0]?.readings?.[0];
    if (latestReading) {
      sensorData = {
        soilMoistureIndex: Math.round(latestReading.soilMoisturePct || 0),
        temperatureC:
          latestReading.airTempC != null ? Math.round(latestReading.airTempC * 10) / 10 : null,
        humidityPct:
          latestReading.airHumidityPct != null ? Math.round(latestReading.airHumidityPct) : null,
        measuredAt: latestReading.measuredAt.toISOString(),
        provenance: latestReading.isDemo ? 'SIMULATED' : 'REAL DEVICE',
        qualityStatus: latestReading.qualityStatus || 'clean',
      };
    }

    // Weather forecast (current + tomorrow)
    const locName =
      [
        targetField?.farm?.village || user.village,
        targetField?.farm?.district || user.district,
        targetField?.farm?.state || user.state,
      ]
        .filter(Boolean)
        .join(', ') || 'Vadodara, Gujarat';
    const dirHit = matchLocalDirectory(
      targetField?.farm?.district || user.district || user.village || 'Vadodara'
    )[0];
    const farmLat = targetField?.farm?.lat || user.lat || dirHit?.lat || 22.3072;
    const farmLng = targetField?.farm?.lng || user.lng || dirHit?.lng || 73.1812;

    let weatherData: FarmContextData['weatherForecast'] = null;
    try {
      const weatherProvider = new OpenMeteoProvider();
      const [currentWeather, dailyForecast] = await Promise.all([
        weatherProvider.getCurrentWeather(farmLat, farmLng),
        weatherProvider.getForecast(farmLat, farmLng, 3),
      ]);
      const tomorrow = dailyForecast[1] || dailyForecast[0];
      weatherData = {
        locationLabel: locName,
        temperatureC: currentWeather.temperatureC,
        humidityPct: currentWeather.humidityPct,
        windSpeedKmh: currentWeather.windSpeedKmh,
        precipitationProbabilityPct: currentWeather.rainProbabilityPct || 0,
        summary: currentWeather.condition || 'Clear',
        tomorrowDate: tomorrow?.date,
        tomorrowRainProbabilityPct: tomorrow?.rainProbabilityPct,
        tomorrowTempMaxC: tomorrow?.tempMaxC,
        tomorrowTempMinC: tomorrow?.tempMinC,
        tomorrowCondition: tomorrow?.condition,
        isFallback: Boolean(currentWeather.isDemo),
        timestamp: currentWeather.fetchedAt || new Date().toISOString(),
      };
    } catch {
      weatherData = null;
    }

    // Market prices (query-aware commodity match first, then active crop)
    let marketPriceRecords: FarmContextData['marketPrices'] = [];
    try {
      const lowerHint = (questionHint || '').toLowerCase();
      const knownCommodities = [
        'wheat', 'cotton', 'groundnut', 'cumin', 'mustard', 'soybean', 'onion', 'potato', 'tomato', 'gram', 'rice', 'maize', 'chilli', 'garlic', 'castor',
      ];
      const askedCommodity = knownCommodities.find((c) => lowerHint.includes(c));
      const commodityQuery = askedCommodity || cropCycleData?.cropSlug || cropCycleData?.cropName || undefined;
      const districtQuery = user.district || targetField?.farm?.district || undefined;

      // Try district + commodity first
      let observations = await prisma.marketPriceObservation.findMany({
        where: {
          qualityStatus: 'ok',
          ...(commodityQuery ? { commodity: { name: { contains: commodityQuery } } } : {}),
          ...(districtQuery ? { location: { district: { contains: districtQuery } } } : {}),
        },
        include: { commodity: true, location: true },
        orderBy: { priceDate: 'desc' },
        take: 5,
      });

      // If none for exact district, broaden to state / all mandis for that commodity
      if (observations.length === 0 && commodityQuery) {
        observations = await prisma.marketPriceObservation.findMany({
          where: {
            qualityStatus: 'ok',
            commodity: { name: { contains: commodityQuery } },
          },
          include: { commodity: true, location: true },
          orderBy: { priceDate: 'desc' },
          take: 5,
        });
      }

      marketPriceRecords = observations.map((o) => ({
        commodity: o.commodity.name,
        variety: o.commodity.variety,
        marketName: o.location.name,
        district: o.location.district,
        state: o.location.state,
        modalPrice: o.modalPrice || 0,
        minPrice: o.minPrice || 0,
        maxPrice: o.maxPrice || 0,
        arrivalDate: o.priceDate.toISOString().split('T')[0],
        isDemo: o.isDemo,
      }));
    } catch {
      marketPriceRecords = [];
    }

    return {
      farmer: {
        name: user.name,
        village: user.village,
        district: user.district,
        state: user.state,
        pincode: user.pincode,
        language: user.preferredLanguage || 'en',
      },
      field: targetField
        ? {
            id: targetField.id,
            name: targetField.name,
            farmName: targetField.farm?.name || null,
            areaHectares: targetField.areaHa,
            soilType: targetField.soilType,
            irrigationType: targetField.irrigationType,
          }
        : null,
      cropCycle: cropCycleData,
      pendingTasks: tasks.map((t) => ({
        title: t.title,
        type: t.type,
        dueDate: t.dueAt ? t.dueAt.toISOString().split('T')[0] : null,
        priority: t.priority,
      })),
      recentDiagnoses: diagnoses.map((d) => ({
        cropName: d.cropName || d.selectedCrop || 'Crop',
        diseaseName: d.diseaseName || d.predictedLabel || 'Unconfirmed',
        severity: d.severity,
        diagnosedAt: d.diagnosedAt.toISOString().split('T')[0],
      })),
      sensorTelemetry: sensorData,
      weatherForecast: weatherData,
      marketPrices: marketPriceRecords,
    };
  }

  static formatContextForPrompt(ctx: FarmContextData): string {
    const lines: string[] = [];
    lines.push('### FARM & CROP PROFILE (VERIFIED TENANT DATA)');
    lines.push(
      `• Farmer: ${ctx.farmer.name} (Location: ${[ctx.farmer.village, ctx.farmer.district, ctx.farmer.state, ctx.farmer.pincode].filter(Boolean).join(', ') || 'India'})`
    );

    if (ctx.field) {
      lines.push(
        `• Field Plot: "${ctx.field.name}" (Area: ${ctx.field.areaHectares ? `${ctx.field.areaHectares.toFixed(2)} ha` : 'Unspecified'}, Soil: ${ctx.field.soilType || 'Unspecified'}, Irrigation: ${ctx.field.irrigationType || 'Unspecified'})`
      );
    }

    if (ctx.cropCycle) {
      lines.push(
        `• Active Crop: ${ctx.cropCycle.cropName} (Variety: ${ctx.cropCycle.variety || 'Not specified — approximate dates'}, Sown: ${ctx.cropCycle.sowingDate}, Crop Age: ${ctx.cropCycle.daysAfterSowing} DAS / ~${ctx.cropCycle.totalDurationDays}d, Current Stage: ${ctx.cropCycle.currentStage}${ctx.cropCycle.nextStage ? `, Next Stage: ${ctx.cropCycle.nextStage} in ${ctx.cropCycle.daysUntilNextStage}d` : ''})`
      );
      if (ctx.cropCycle.currentStageWhatToDo) {
        lines.push(`• Active Stage Recommended Action: ${ctx.cropCycle.currentStageWhatToDo}`);
      }
    } else {
      lines.push('• Active Crop: No active crop cycle recorded yet.');
    }

    if (ctx.pendingTasks.length > 0) {
      lines.push(
        `• Pending Farm Tasks: ${ctx.pendingTasks.map((t) => `${t.title} (due ${t.dueDate || 'soon'})`).join('; ')}`
      );
    }

    if (ctx.sensorTelemetry) {
      lines.push(
        `• In-Situ Soil Sensor: Moisture Index ${ctx.sensorTelemetry.soilMoistureIndex}% ([${ctx.sensorTelemetry.provenance}], Measured: ${ctx.sensorTelemetry.measuredAt})`
      );
    }

    if (ctx.weatherForecast) {
      lines.push(
        `• Weather (${ctx.weatherForecast.locationLabel}): Now ${ctx.weatherForecast.temperatureC}°C, Humidity ${ctx.weatherForecast.humidityPct}%, Wind ${ctx.weatherForecast.windSpeedKmh} km/h, Rain ${ctx.weatherForecast.precipitationProbabilityPct}%. Tomorrow (${ctx.weatherForecast.tomorrowDate || 'Next Day'}): Rain chance ${ctx.weatherForecast.tomorrowRainProbabilityPct ?? 'N/A'}%, Max ${ctx.weatherForecast.tomorrowTempMaxC ?? 'N/A'}°C.`
      );
    }

    if (ctx.marketPrices.length > 0) {
      lines.push('• Reported APMC Mandi Rates (AGMARKNET / Govt Cache):');
      for (const m of ctx.marketPrices) {
        lines.push(
          `  - ${m.commodity}${m.variety ? ` (${m.variety})` : ''} at ${m.marketName} (${m.district}, ${m.state}): Modal ₹${m.modalPrice}/quintal (Range ₹${m.minPrice}–₹${m.maxPrice}, Reported Date: ${m.arrivalDate})`
        );
      }
    }

    return lines.join('\n');
  }
}
