import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { CROP_MOISTURE_THRESHOLDS } from '@/services/IotAdvisoryEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError('Unauthorized', 'unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const fieldId = searchParams.get('fieldId');

  if (!fieldId) {
    return apiError('fieldId query parameter is required', 'missing_field_id', 400);
  }

  try {
    // 1. Fetch field with active crop cycle and farm
    const field = await prisma.field.findFirst({
      where: { id: fieldId, farm: { userId: user.id }, deletedAt: null },
      include: {
        farm: true,
        cropCycles: {
          where: { deletedAt: null, status: { not: 'completed' } },
          include: {
            crop: true,
            stages: { orderBy: { orderIndex: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!field) {
      return apiError('Field not found or access denied', 'not_found', 404);
    }

    const activeCycle = field.cropCycles[0] || null;
    const cropSlug = activeCycle?.crop?.slug || 'generic';
    const cropName = activeCycle?.customCropName || activeCycle?.crop?.slug || 'General Field';

    // 2. Fetch latest soil moisture readings (check both hardware sensor and farm sensor table)
    const [latestSensor, latestIotTelemetry, lastIrrigation] = await Promise.all([
      prisma.farmSensorMoisture.findFirst({
        where: { fieldId },
        orderBy: { readingAt: 'desc' },
      }),
      prisma.iotTelemetryReading.findFirst({
        where: { fieldId },
        orderBy: { measuredAt: 'desc' },
      }),
      prisma.irrigationRecord.findFirst({
        where: { fieldId },
        orderBy: { irrigatedAt: 'desc' },
      }),
    ]);

    const currentMoisturePct =
      latestIotTelemetry?.soilMoisturePct ?? latestSensor?.moisturePct ?? null;
    const sensorTimestamp =
      latestIotTelemetry?.measuredAt ?? latestSensor?.readingAt ?? null;

    // 3. Look up crop-specific moisture threshold
    const cropConfig =
      CROP_MOISTURE_THRESHOLDS.find((c) => c.cropSlug.toLowerCase() === cropSlug.toLowerCase()) ||
      CROP_MOISTURE_THRESHOLDS.find((c) => c.cropSlug === 'tomato') ||
      null;

    const thresholdLow = cropConfig ? cropConfig.default.low : 25;
    const thresholdOptimal = cropConfig ? cropConfig.default.optimal : 35;
    const thresholdHigh = cropConfig ? cropConfig.default.high : 50;

    // 4. Check weather rain forecast for farm location
    let rainForecastMm = 0;
    try {
      const recentWeather = await prisma.weatherRecord.findFirst({
        where: { farmId: field.farmId },
        orderBy: { fetchedAt: 'desc' },
      });
      if (recentWeather?.payloadNormalized) {
        const payload = JSON.parse(recentWeather.payloadNormalized);
        rainForecastMm = Number(payload.precipitationMm || payload.rainfallMm || payload.rainMm || 0);
      }
    } catch {
      rainForecastMm = 0;
    }

    const isRainForecasted = rainForecastMm > 5.0;

    // 5. Evaluate Days since last irrigation
    let daysSinceLastIrrigation: number | null = null;
    if (lastIrrigation) {
      const diffMs = Date.now() - new Date(lastIrrigation.irrigatedAt).getTime();
      daysSinceLastIrrigation = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    // 6. Generate intelligent recommendation
    let action: 'irrigate_now' | 'delay_irrigation' | 'sufficient_moisture' | 'monitor' = 'monitor';
    let urgency: 'high' | 'medium' | 'low' = 'low';
    let overIrrigationRisk: 'low' | 'moderate' | 'high' = 'low';
    let reason = '';
    let recommendedTiming = 'Early morning (6:00 AM – 8:30 AM) or late evening to minimize evaporative losses.';
    let estimatedWaterLitres: number | null = null;

    if (currentMoisturePct !== null) {
      if (currentMoisturePct < thresholdLow) {
        if (isRainForecasted) {
          action = 'delay_irrigation';
          urgency = 'medium';
          overIrrigationRisk = 'moderate';
          reason = `Soil moisture is low (${currentMoisturePct.toFixed(1)}%), but rainfall is forecasted (${rainForecastMm}mm). Delay irrigation by 24 to 48 hours to conserve water and prevent waterlogging.`;
        } else {
          action = 'irrigate_now';
          urgency = 'high';
          overIrrigationRisk = 'low';
          reason = `Soil moisture (${currentMoisturePct.toFixed(1)}%) has fallen below the optimal minimum (${thresholdLow}%) for ${cropName}. Transpiration stress is likely without water application.`;
          // Estimate water requirement if field area is known
          if (field.areaHa) {
            // Approx 1 hectare = 2.471 acres; lightweight drip supplement = ~18,000 L / acre
            const areaAcres = field.areaHa * 2.471;
            estimatedWaterLitres = Math.round(areaAcres * 18000);
          }
        }
      } else if (currentMoisturePct > thresholdHigh) {
        action = 'delay_irrigation';
        urgency = 'low';
        overIrrigationRisk = 'high';
        reason = `Soil moisture (${currentMoisturePct.toFixed(1)}%) is near saturation (> ${thresholdHigh}%). Applying more water risks root hypoxia, damping-off, and nutrient leaching. Hold off irrigation.`;
      } else {
        action = 'sufficient_moisture';
        urgency = 'low';
        overIrrigationRisk = isRainForecasted ? 'moderate' : 'low';
        reason = `Soil moisture (${currentMoisturePct.toFixed(1)}%) is within the optimal plant-available range (${thresholdLow}% – ${thresholdHigh}%). No irrigation required at this time.`;
      }
    } else {
      // No sensor data — baseline by days since last irrigation & weather
      if (daysSinceLastIrrigation !== null && daysSinceLastIrrigation >= 6) {
        if (isRainForecasted) {
          action = 'delay_irrigation';
          reason = `Last irrigation was ${daysSinceLastIrrigation} days ago, but rainfall (${rainForecastMm}mm) is forecasted in the next 24-48 hours. Wait for rain before irrigating.`;
        } else {
          action = 'irrigate_now';
          urgency = 'medium';
          reason = `It has been ${daysSinceLastIrrigation} days since last irrigation. Inspect soil root zone texture manually; water application recommended if top 10cm is dry.`;
        }
      } else {
        action = 'monitor';
        reason = `Last irrigation was ${daysSinceLastIrrigation ?? 'several'} days ago. Soil condition is estimated to be adequate. Continue monitoring.`;
      }
    }

    return apiSuccess({
      fieldId,
      fieldName: field.name,
      cropName,
      hasSensor: currentMoisturePct !== null,
      currentMoisturePct,
      sensorTimestamp: sensorTimestamp ? new Date(sensorTimestamp).toISOString() : null,
      thresholds: {
        low: thresholdLow,
        optimal: thresholdOptimal,
        high: thresholdHigh,
      },
      lastIrrigation: lastIrrigation
        ? {
            id: lastIrrigation.id,
            irrigatedAt: lastIrrigation.irrigatedAt.toISOString(),
            method: lastIrrigation.method,
            durationMinutes: lastIrrigation.durationMinutes,
            volumeL: lastIrrigation.volumeL,
            daysAgo: daysSinceLastIrrigation,
          }
        : null,
      weather: {
        rainForecastMm,
        isRainForecasted,
      },
      advisory: {
        action,
        urgency,
        overIrrigationRisk,
        recommendedTiming,
        estimatedWaterLitres,
        reason,
      },
    });
  } catch (err: any) {
    console.error('[irrigation:advisory] Error:', err);
    return apiError(err.message || 'Failed to generate irrigation advisory', 'advisory_error', 500);
  }
}

