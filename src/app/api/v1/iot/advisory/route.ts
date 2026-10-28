/**
 * GET /api/v1/iot/advisory
 *
 * Evaluates IoT sensor data against crop-specific thresholds and weather forecast,
 * producing explainable irrigation advisories for a farmer's fields.
 *
 * Query Parameters:
 *   - fieldId: specific field (optional; if omitted, evaluates all fields with IoT devices)
 *
 * Returns advisories with full reasoning chain — never automatic pump control.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { IotAdvisoryEngine, IotAdvisoryInput } from '@/services/IotAdvisoryEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const { searchParams } = new URL(request.url);
    const fieldIdParam = searchParams.get('fieldId');
    const isAdmin = user.roles?.some((ur: any) => ur.role?.name === 'ADMIN');

    // 1. Resolve fields with IoT devices
    const fieldWhere: any = {};
    if (fieldIdParam) {
      fieldWhere.id = fieldIdParam;
    }
    // Ownership scope
    if (!isAdmin) {
      fieldWhere.farm = { userId: user.id };
    }
    fieldWhere.devices = { some: {} };

    const fields = await prisma.field.findMany({
      where: fieldWhere,
      include: {
        farm: { select: { id: true, name: true, userId: true, lat: true, lng: true } },
        devices: {
          where: { status: 'active' },
          include: {
            readings: {
              take: 12,
              orderBy: { measuredAt: 'desc' as const },
              select: {
                soilMoisturePct: true,
                airTempC: true,
                airHumidityPct: true,
                qualityStatus: true,
                measuredAt: true,
                isDemo: true,
              },
            },
          },
        },
        cropCycles: {
          where: {
            status: { in: ['sown', 'growing', 'flowering', 'fruiting', 'harvest_ready'] },
            deletedAt: null,
          },
          take: 1,
          orderBy: { createdAt: 'desc' as const },
          include: {
            crop: { select: { slug: true } },
            stages: {
              where: { status: 'current' },
              take: 1,
              select: { nameSnapshot: true },
            },
          },
        },
      },
    });

    if (fieldIdParam && fields.length === 0) {
      return apiError('Field not found or no IoT devices paired', 'field_not_found', 404);
    }

    // 2. Fetch weather forecast for rain probability (use first farm's coordinates)
    let forecastRainPct: number | null = null;
    let forecastSource: string | null = null;
    if (fields.length > 0) {
      const farm = fields[0].farm;
      if (farm.lat && farm.lng) {
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${farm.lat}&longitude=${farm.lng}&daily=precipitation_probability_max&timezone=auto&forecast_days=1`;
          const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(5000) });
          if (weatherRes.ok) {
            const weatherData = await weatherRes.json();
            forecastRainPct = weatherData.daily?.precipitation_probability_max?.[0] ?? null;
            forecastSource = 'Open-Meteo Forecast';
          }
        } catch {
          // Weather fetch failed — continue without forecast
        }
      }
    }

    // 3. Evaluate each field
    const fieldAdvisories = fields.map((field) => {
      // Find latest active device with readings
      const activeDevice = field.devices.find((d) => d.readings.length > 0) || field.devices[0];
      const latestReading = activeDevice?.readings[0] || null;

      // Resolve crop/stage
      const activeCycle = field.cropCycles[0] || null;
      const cropSlug = activeCycle?.crop?.slug || null;
      const cropStage = activeCycle?.stages?.[0]?.nameSnapshot || null;

      const input: IotAdvisoryInput = {
        currentMoisturePct: latestReading?.soilMoisturePct ?? null,
        qualityStatus: latestReading?.qualityStatus ?? null,
        latestReadingAt: latestReading?.measuredAt?.toISOString() ?? null,
        recentReadings: (activeDevice?.readings || []).map((r) => ({
          moisturePct: r.soilMoisturePct,
          measuredAt: r.measuredAt.toISOString(),
        })),
        cropSlug,
        cropStage,
        soilType: field.soilType,
        forecastRainPct,
        forecastSource,
        isDemo: latestReading?.isDemo ?? false,
      };

      const advisories = IotAdvisoryEngine.evaluate(input);

      return {
        fieldId: field.id,
        fieldName: field.name,
        farmName: field.farm.name,
        deviceCode: activeDevice?.deviceCode || null,
        isDemo: latestReading?.isDemo ?? activeDevice?.isDemo ?? false,
        cropSlug,
        cropStage,
        soilType: field.soilType,
        latestReading: latestReading
          ? {
              moisturePct: latestReading.soilMoisturePct,
              airTempC: latestReading.airTempC,
              airHumidityPct: latestReading.airHumidityPct,
              qualityStatus: latestReading.qualityStatus,
              measuredAt: latestReading.measuredAt.toISOString(),
            }
          : null,
        advisories,
      };
    });

    return apiSuccess({
      evaluatedAt: new Date().toISOString(),
      forecastRainPct,
      forecastSource,
      fields: fieldAdvisories,
    });
  } catch (error: any) {
    console.error('[API /api/v1/iot/advisory GET] Error:', error.message);
    return apiError('Failed to evaluate IoT advisory', 'advisory_error', 500);
  }
}
