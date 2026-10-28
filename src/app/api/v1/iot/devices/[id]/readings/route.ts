/**
 * GET /api/v1/iot/devices/[id]/readings
 *
 * Bounded historical telemetry readings for an IoT probe.
 * Query Parameters:
 *   - from: ISO date string (optional)
 *   - to: ISO date string (optional)
 *   - limit: integer, 1-500 (default 50)
 *
 * Enforces farm/field ownership (or ADMIN role).
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const { id } = await params;
    const isAdmin = user.roles?.some((ur: any) => ur.role?.name === 'ADMIN');

    // 1. Resolve Device and check ownership
    const device = await prisma.iotDevice.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, userId: true, name: true } },
        field: { select: { id: true, name: true } },
      },
    });

    if (!device) {
      return apiError('Device not found', 'device_not_found', 404);
    }

    if (!isAdmin && device.farm.userId !== user.id) {
      return apiError('You do not have access to this device', 'forbidden', 403);
    }

    // 2. Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const limitStr = searchParams.get('limit');

    let limit = 50;
    if (limitStr) {
      const parsed = parseInt(limitStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 500); // Bounded at 500 max
      }
    }

    const where: any = { deviceId: id };

    if (fromStr || toStr) {
      where.measuredAt = {};
      if (fromStr) {
        const fromDate = new Date(fromStr);
        if (!isNaN(fromDate.getTime())) {
          where.measuredAt.gte = fromDate;
        }
      }
      if (toStr) {
        const toDate = new Date(toStr);
        if (!isNaN(toDate.getTime())) {
          where.measuredAt.lte = toDate;
        }
      }
    }

    // 3. Query readings
    const readings = await prisma.iotTelemetryReading.findMany({
      where,
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });

    const result = readings.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      measuredAt: r.measuredAt.toISOString(),
      receivedAt: r.receivedAt.toISOString(),
      soilMoistureRaw: r.soilMoistureRaw,
      soilMoisturePct: r.soilMoisturePct,
      depthCm: r.depthCm,
      airTempC: r.airTempC,
      airHumidityPct: r.airHumidityPct,
      lightLux: r.lightLux,
      batteryVoltage: r.batteryVoltage,
      batteryPct: r.batteryPct,
      waterLevelSwitch: r.waterLevelSwitch,
      qualityStatus: r.qualityStatus,
      isDemo: r.isDemo,
    }));

    return apiSuccess(result, {
      deviceId: device.id,
      deviceCode: device.deviceCode,
      fieldId: device.fieldId,
      fieldName: device.field.name,
      total: result.length,
      limit,
    });
  } catch (error: any) {
    console.error('[API /api/v1/iot/devices/[id]/readings GET] Error:', error.message);
    return apiError('Failed to fetch device readings', 'readings_query_error', 500);
  }
}
