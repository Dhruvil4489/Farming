/**
 * POST /api/v1/iot/telemetry
 *
 * Authenticated high-throughput IoT telemetry ingestion endpoint for physical
 * ESP32 hardware probes, LoRaWAN gateways, and the deterministic sensor simulator.
 *
 * Security & Integrity:
 * 1. Authenticates device via per-device bearer token (SHA-256 hashed lookup).
 * 2. Rejects unauthenticated devices (401) and revoked devices (403).
 * 3. Never trusts client-supplied farmId or fieldId; resolves field directly from registry.
 * 4. Idempotency key (eventId) deduplication prevents duplicate packet storage upon retry.
 * 5. Strict clock skew validation (rejects >10m future, >7d stale).
 * 6. Non-clamping data quality assessment.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { authenticateDevice } from '@/lib/iot-auth';
import {
  telemetryPayloadSchema,
  validateTimestampSkew,
  evaluateTelemetryQuality,
} from '@/lib/validations/iot-telemetry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Device via Bearer Token
    const authResult = await authenticateDevice(request);
    if (!authResult.authenticated || !authResult.device) {
      return apiError(
        authResult.message || 'Device authentication failed',
        authResult.reason || 'device_unauthorized',
        authResult.status || 401
      );
    }

    const device = authResult.device;

    // 2. Parse JSON Payload
    let rawJson: any;
    try {
      rawJson = await request.json();
    } catch {
      return apiError('Malformed JSON payload', 'invalid_json', 400);
    }

    // 3. Validate Payload Schema (Zod)
    const validationResult = telemetryPayloadSchema.safeParse(rawJson);
    if (!validationResult.success) {
      const errorDetails: Record<string, string[]> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path.join('.') || 'payload';
        if (!errorDetails[fieldName]) errorDetails[fieldName] = [];
        errorDetails[fieldName].push(issue.message);
      }
      return apiError(
        'Telemetry payload validation failed',
        'validation_error',
        422,
        errorDetails
      );
    }

    const payload = validationResult.data;

    // 4. Validate Clock Skew
    const skewCheck = validateTimestampSkew(payload.measuredAt);
    if (!skewCheck.valid) {
      return apiError(
        skewCheck.reason || 'Invalid measuredAt timestamp',
        'clock_skew_violation',
        422
      );
    }

    // 5. Handle Idempotency / Deduplication
    if (payload.eventId) {
      const existing = await prisma.iotTelemetryReading.findUnique({
        where: {
          deviceId_eventId: {
            deviceId: device.id,
            eventId: payload.eventId,
          },
        },
      });

      if (existing) {
        return apiSuccess(
          {
            id: existing.id,
            deviceId: existing.deviceId,
            fieldId: existing.fieldId,
            eventId: existing.eventId,
            measuredAt: existing.measuredAt.toISOString(),
            receivedAt: existing.receivedAt.toISOString(),
            status: 'duplicate_acknowledged',
            qualityStatus: existing.qualityStatus,
          },
          {
            idempotent: true,
            stored: false,
            message: 'Duplicate packet already recorded for this eventId.',
          },
          200
        );
      }
    }

    // 6. Evaluate Quality (Non-clamping)
    const quality = evaluateTelemetryQuality(payload, skewCheck.isSuspiciousSkew);

    // 7. Store Telemetry Reading (server-assigned fieldId and deviceId)
    const measuredDate = new Date(payload.measuredAt);
    const reading = await prisma.iotTelemetryReading.create({
      data: {
        deviceId: device.id,
        fieldId: device.fieldId, // Server resolved
        eventId: payload.eventId || null,
        measuredAt: measuredDate,
        receivedAt: new Date(), // Server timestamp
        soilMoistureRaw: payload.soilMoistureRaw ?? null,
        soilMoisturePct: payload.soilMoisturePct ?? null,
        depthCm: payload.depthCm ?? 15,
        airTempC: payload.airTempC ?? null,
        airHumidityPct: payload.airHumidityPct ?? null,
        lightLux: payload.lightLux ?? null,
        batteryVoltage: payload.batteryVoltage ?? null,
        batteryPct: payload.batteryPct ?? null,
        waterLevelSwitch: payload.waterLevelSwitch ?? null,
        qualityStatus: quality.qualityStatus,
        qualityFlags: JSON.stringify(quality.flags),
        isDemo: device.isDemo,
      },
    });

    // 8. Update device battery voltage if provided in telemetry
    if (payload.batteryVoltage !== undefined) {
      await prisma.iotDevice.update({
        where: { id: device.id },
        data: { batteryVoltage: payload.batteryVoltage },
      }).catch(() => {});
    }

    return apiSuccess(
      {
        id: reading.id,
        deviceId: reading.deviceId,
        fieldId: reading.fieldId,
        eventId: reading.eventId,
        measuredAt: reading.measuredAt.toISOString(),
        receivedAt: reading.receivedAt.toISOString(),
        soilMoisturePct: reading.soilMoisturePct,
        airTempC: reading.airTempC,
        airHumidityPct: reading.airHumidityPct,
        qualityStatus: reading.qualityStatus,
        isDemo: reading.isDemo,
      },
      {
        stored: true,
        qualityFlags: quality.flags,
      },
      200
    );
  } catch (error: any) {
    console.error('[API /api/v1/iot/telemetry] Ingestion error:', error.message);
    return apiError(
      'An internal error occurred during telemetry processing',
      'internal_telemetry_error',
      500
    );
  }
}
