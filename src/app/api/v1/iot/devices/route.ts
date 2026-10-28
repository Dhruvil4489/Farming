/**
 * GET & POST /api/v1/iot/devices
 *
 * Device registry management.
 * - GET: Lists devices paired with the authenticated farmer's fields (or all devices if ADMIN).
 * - POST: Provisions a new hardware device, binding it to a field and issuing a one-time bearer token.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateDeviceToken, hashDeviceToken } from '@/lib/iot-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const isAdmin = user.roles?.some((ur: any) => ur.role?.name === 'ADMIN');
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');
    const farmId = searchParams.get('farmId');

    const where: any = {};

    if (isAdmin) {
      if (fieldId) where.fieldId = fieldId;
      if (farmId) where.farmId = farmId;
    } else {
      // Restrict strictly to farms owned by this farmer
      where.farm = { userId: user.id };
      if (fieldId) where.fieldId = fieldId;
      if (farmId) where.farmId = farmId;
    }

    const devices = await prisma.iotDevice.findMany({
      where,
      include: {
        field: {
          select: {
            id: true,
            name: true,
            farmId: true,
            farm: { select: { id: true, name: true, userId: true } },
          },
        },
        readings: {
          take: 1,
          orderBy: { measuredAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = devices.map((dev) => ({
      id: dev.id,
      deviceCode: dev.deviceCode,
      name: dev.name,
      hardwareModel: dev.hardwareModel,
      status: dev.status,
      isDemo: dev.isDemo,
      lastSeenAt: dev.lastSeenAt?.toISOString() || null,
      lastIp: dev.lastIp,
      firmwareVersion: dev.firmwareVersion,
      batteryVoltage: dev.batteryVoltage,
      calibration: dev.calibrationJson ? JSON.parse(dev.calibrationJson) : {},
      field: {
        id: dev.field.id,
        name: dev.field.name,
        farmName: dev.field.farm.name,
      },
      latestReading: dev.readings[0]
        ? {
            id: dev.readings[0].id,
            measuredAt: dev.readings[0].measuredAt.toISOString(),
            receivedAt: dev.readings[0].receivedAt.toISOString(),
            soilMoistureRaw: dev.readings[0].soilMoistureRaw,
            soilMoisturePct: dev.readings[0].soilMoisturePct,
            airTempC: dev.readings[0].airTempC,
            airHumidityPct: dev.readings[0].airHumidityPct,
            qualityStatus: dev.readings[0].qualityStatus,
          }
        : null,
      createdAt: dev.createdAt.toISOString(),
    }));

    return apiSuccess(result, { total: result.length });
  } catch (error: any) {
    console.error('[API /api/v1/iot/devices GET] Error:', error.message);
    return apiError('Failed to fetch devices', 'device_query_error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiError('Authentication required', 'auth_required', 401);
    }

    const isAdmin = user.roles?.some((ur: any) => ur.role?.name === 'ADMIN');

    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON body', 'invalid_json', 400);
    }

    const { name, deviceCode, fieldId, hardwareModel, calibration, isDemo } = body;

    if (!name || !deviceCode || !fieldId) {
      return apiError(
        'name, deviceCode, and fieldId are required fields',
        'missing_fields',
        422
      );
    }

    // Verify field existence and farmer ownership
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: { farm: true },
    });

    if (!field) {
      return apiError('Field not found', 'field_not_found', 404);
    }

    if (!isAdmin && field.farm.userId !== user.id) {
      return apiError(
        'You do not have permission to pair a device with this field',
        'forbidden',
        403
      );
    }

    // Check unique deviceCode
    const existing = await prisma.iotDevice.findUnique({
      where: { deviceCode: deviceCode.trim() },
    });

    if (existing) {
      return apiError(
        `Device code '${deviceCode}' is already registered`,
        'device_code_conflict',
        409
      );
    }

    // Generate Bearer Token and store SHA-256 hash
    const rawToken = generateDeviceToken();
    const tokenHash = hashDeviceToken(rawToken);

    const device = await prisma.iotDevice.create({
      data: {
        name: name.trim(),
        deviceCode: deviceCode.trim(),
        hardwareModel: hardwareModel || 'ESP32-SoilV1',
        farmId: field.farmId,
        fieldId: field.id,
        tokenHash,
        status: 'active',
        isDemo: Boolean(isDemo),
        calibrationJson: calibration ? JSON.stringify(calibration) : JSON.stringify({ rawDry: 3200, rawWet: 1400, version: 1 }),
      },
    });

    // Record provisioning event
    await prisma.iotDeviceEvent.create({
      data: {
        deviceId: device.id,
        eventType: 'provisioned',
        severity: 'info',
        detailsJson: JSON.stringify({
          provisionedBy: user.id,
          fieldId: field.id,
          farmId: field.farmId,
        }),
      },
    });

    return apiSuccess(
      {
        id: device.id,
        deviceCode: device.deviceCode,
        name: device.name,
        hardwareModel: device.hardwareModel,
        status: device.status,
        farmId: device.farmId,
        fieldId: device.fieldId,
        isDemo: device.isDemo,
        rawBearerToken: rawToken, // Returned ONLY upon provisioning
        warning: 'Store this rawBearerToken securely. It will never be displayed again.',
      },
      { provisioned: true },
      201
    );
  } catch (error: any) {
    console.error('[API /api/v1/iot/devices POST] Provisioning error:', error.message);
    return apiError('Failed to provision device', 'provisioning_error', 500);
  }
}
