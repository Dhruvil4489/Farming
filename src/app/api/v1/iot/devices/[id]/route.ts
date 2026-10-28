/**
 * GET & PATCH /api/v1/iot/devices/[id]
 *
 * Device detail and configuration endpoint.
 * Enforces strict farm/field ownership (or ADMIN role).
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const { id } = await params;
    const isAdmin = user.roles?.some((ur: any) => ur.role?.name === 'ADMIN');

    const device = await prisma.iotDevice.findUnique({
      where: { id },
      include: {
        farm: { select: { id: true, name: true, userId: true } },
        field: { select: { id: true, name: true } },
        readings: {
          take: 5,
          orderBy: { measuredAt: 'desc' },
        },
        events: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!device) {
      return apiError('Device not found', 'device_not_found', 404);
    }

    // Enforce farm ownership
    if (!isAdmin && device.farm.userId !== user.id) {
      return apiError('You do not have access to this device', 'forbidden', 403);
    }

    const calibration = device.calibrationJson ? JSON.parse(device.calibrationJson) : {};

    return apiSuccess({
      id: device.id,
      deviceCode: device.deviceCode,
      name: device.name,
      hardwareModel: device.hardwareModel,
      status: device.status,
      isDemo: device.isDemo,
      lastSeenAt: device.lastSeenAt?.toISOString() || null,
      lastIp: device.lastIp,
      firmwareVersion: device.firmwareVersion,
      batteryVoltage: device.batteryVoltage,
      calibration,
      farm: { id: device.farm.id, name: device.farm.name },
      field: { id: device.field.id, name: device.field.name },
      recentReadings: device.readings.map((r) => ({
        id: r.id,
        measuredAt: r.measuredAt.toISOString(),
        receivedAt: r.receivedAt.toISOString(),
        soilMoistureRaw: r.soilMoistureRaw,
        soilMoisturePct: r.soilMoisturePct,
        airTempC: r.airTempC,
        airHumidityPct: r.airHumidityPct,
        qualityStatus: r.qualityStatus,
      })),
      recentEvents: device.events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        severity: e.severity,
        details: e.detailsJson ? JSON.parse(e.detailsJson) : {},
        createdAt: e.createdAt.toISOString(),
      })),
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/v1/iot/devices/[id] GET] Error:', error.message);
    return apiError('Failed to fetch device details', 'device_query_error', 500);
  }
}

export async function PATCH(
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

    const device = await prisma.iotDevice.findUnique({
      where: { id },
      include: { farm: true },
    });

    if (!device) {
      return apiError('Device not found', 'device_not_found', 404);
    }

    if (!isAdmin && device.farm.userId !== user.id) {
      return apiError('You do not have access to this device', 'forbidden', 403);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'invalid_json', 400);
    }

    const { name, status, calibration, firmwareVersion } = body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = String(name).trim();
    if (status !== undefined) {
      const validStatuses = ['active', 'revoked', 'provisioning'];
      if (!validStatuses.includes(status)) {
        return apiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 'invalid_status', 422);
      }
      updateData.status = status;
    }
    if (calibration !== undefined) {
      updateData.calibrationJson = JSON.stringify(calibration);
    }
    if (firmwareVersion !== undefined) {
      updateData.firmwareVersion = String(firmwareVersion).trim();
    }

    const updated = await prisma.iotDevice.update({
      where: { id },
      data: updateData,
    });

    // Record lifecycle event if status or calibration changed
    if (status && status !== device.status) {
      await prisma.iotDeviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: 'status_change',
          severity: status === 'revoked' ? 'warning' : 'info',
          detailsJson: JSON.stringify({ previous: device.status, updated: status, changedBy: user.id }),
        },
      });
    }

    return apiSuccess({
      id: updated.id,
      deviceCode: updated.deviceCode,
      name: updated.name,
      status: updated.status,
      calibration: updated.calibrationJson ? JSON.parse(updated.calibrationJson) : {},
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/v1/iot/devices/[id] PATCH] Error:', error.message);
    return apiError('Failed to update device', 'device_update_error', 500);
  }
}
