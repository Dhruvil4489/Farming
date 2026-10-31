import { NextRequest } from 'next/server';
import { SoilMoistureService } from '@/services/SoilMoistureService';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getAuthenticatedUser } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ingestSchema = z.object({
  fieldId: z.string().min(1, 'fieldId is required'),
  sensorId: z.string().optional(),
  hardwareType: z.string().optional(),
  moisturePct: z.number().min(0).max(100, 'moisturePct must be between 0 and 100'),
  temperatureC: z.number().min(-40).max(85).optional(),
  batteryPct: z.number().min(0).max(100).optional(),
  depthCm: z.number().int().min(1).max(200).optional(),
  eventId: z.string().optional(),
});

// GET /api/v1/soil-moisture/sensor?fieldId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');

    if (!fieldId) {
      return apiError('fieldId query parameter is required', 'missing_field_id', 400);
    }

    const telemetry = await SoilMoistureService.getFieldSensorTelemetry(fieldId);

    // Return in both envelope and telemetry property for backwards compatibility
    return apiSuccess({
      ...telemetry,
      telemetry,
    });
  } catch (error: any) {
    console.error('[API /api/v1/soil-moisture/sensor] Error:', error);
    return apiError(error.message || 'Error fetching field sensor telemetry', 'sensor_error', 500);
  }
}

// POST /api/v1/soil-moisture/sensor — IoT Device ingestion (ESP32 / Capacitive probe)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ingestSchema.parse(body);

    const reading = await SoilMoistureService.recordSensorReading({
      fieldId: parsed.fieldId,
      sensorId: parsed.sensorId,
      hardwareType: parsed.hardwareType,
      moisturePct: parsed.moisturePct,
      temperatureC: parsed.temperatureC,
      batteryPct: parsed.batteryPct,
      depthCm: parsed.depthCm,
      eventId: parsed.eventId,
    });

    return apiSuccess(
      {
        message: 'Sensor reading ingested successfully',
        reading,
      },
      undefined,
      201
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiError('Validation error', 'validation_error', 422, error.flatten().fieldErrors as any);
    }
    console.error('[API /api/v1/soil-moisture/sensor POST] Error:', error);
    return apiError(error.message || 'Failed to ingest sensor telemetry', 'ingest_error', 500);
  }
}
