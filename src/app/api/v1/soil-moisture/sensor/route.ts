import { NextRequest, NextResponse } from 'next/server';
import { SoilMoistureService } from '@/services/SoilMoistureService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');

    if (!fieldId) {
      return NextResponse.json(
        {
          success: false,
          error: 'fieldId parameter is required to query in-situ sensor telemetry',
        },
        { status: 400 }
      );
    }

    const telemetry = await SoilMoistureService.getFieldSensorTelemetry(fieldId);

    return NextResponse.json({
      success: true,
      telemetry,
    });
  } catch (error: any) {
    console.error('[API /api/v1/soil-moisture/sensor] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error fetching farm sensor telemetry',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldId, sensorId, hardwareType, moisturePct, temperatureC, batteryPct, depthCm } = body;

    if (!fieldId || moisturePct === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'fieldId and moisturePct are required fields',
        },
        { status: 400 }
      );
    }

    const reading = await SoilMoistureService.recordSensorReading({
      fieldId,
      sensorId,
      hardwareType,
      moisturePct: parseFloat(moisturePct),
      temperatureC: temperatureC !== undefined ? parseFloat(temperatureC) : undefined,
      batteryPct: batteryPct !== undefined ? parseFloat(batteryPct) : undefined,
      depthCm: depthCm !== undefined ? parseInt(depthCm, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Physical sensor observation registered successfully',
      reading,
    });
  } catch (error: any) {
    console.error('[API /api/v1/soil-moisture/sensor POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error recording farm sensor telemetry',
      },
      { status: 500 }
    );
  }
}
