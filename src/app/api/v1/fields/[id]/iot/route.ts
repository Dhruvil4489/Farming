/**
 * GET /api/v1/fields/[id]/iot
 *
 * Returns paired IoT devices, current sensor status, latest reading,
 * and recent telemetry for a specific agricultural field plot.
 * Enforces field ownership (or ADMIN role).
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

    // 1. Resolve Field and check ownership
    const field = await prisma.field.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, userId: true, name: true } },
        devices: {
          include: {
            readings: {
              take: 1,
              orderBy: { measuredAt: 'desc' },
            },
          },
        },
      },
    });

    if (!field) {
      return apiError('Field not found', 'field_not_found', 404);
    }

    if (!isAdmin && field.farm.userId !== user.id) {
      return apiError('You do not have access to this field', 'forbidden', 403);
    }

    // 2. Fetch recent telemetry readings for this field (across all paired probes)
    const recentReadings = await prisma.iotTelemetryReading.findMany({
      where: { fieldId: id },
      orderBy: { measuredAt: 'desc' },
      take: 25,
      include: {
        device: {
          select: { id: true, deviceCode: true, name: true, hardwareModel: true },
        },
      },
    });

    const activeDevices = field.devices.map((d) => ({
      id: d.id,
      deviceCode: d.deviceCode,
      name: d.name,
      hardwareModel: d.hardwareModel,
      status: d.status,
      isDemo: d.isDemo,
      lastSeenAt: d.lastSeenAt?.toISOString() || null,
      batteryVoltage: d.batteryVoltage,
      latestReading: d.readings[0]
        ? {
            id: d.readings[0].id,
            measuredAt: d.readings[0].measuredAt.toISOString(),
            receivedAt: d.readings[0].receivedAt.toISOString(),
            soilMoistureRaw: d.readings[0].soilMoistureRaw,
            soilMoisturePct: d.readings[0].soilMoisturePct,
            airTempC: d.readings[0].airTempC,
            airHumidityPct: d.readings[0].airHumidityPct,
            qualityStatus: d.readings[0].qualityStatus,
          }
        : null,
    }));

    return apiSuccess({
      fieldId: field.id,
      fieldName: field.name,
      farmId: field.farm.id,
      farmName: field.farm.name,
      hasDevices: activeDevices.length > 0,
      devices: activeDevices,
      recentTelemetry: recentReadings.map((r) => ({
        id: r.id,
        deviceId: r.deviceId,
        deviceCode: r.device.deviceCode,
        deviceName: r.device.name,
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
        qualityStatus: r.qualityStatus,
        isDemo: r.isDemo,
      })),
    });
  } catch (error: any) {
    console.error('[API /api/v1/fields/[id]/iot GET] Error:', error.message);
    return apiError('Failed to fetch field IoT telemetry', 'field_iot_error', 500);
  }
}
