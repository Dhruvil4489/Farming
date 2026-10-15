import { NextRequest, NextResponse } from 'next/server';
import { SoilMoistureService } from '@/services/SoilMoistureService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'Gujarat';

    const districts = await SoilMoistureService.getAvailableDistricts(state);

    return NextResponse.json({
      success: true,
      state,
      districts,
    });
  } catch (error: any) {
    console.error('[API /api/v1/soil-moisture/districts] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error fetching available districts',
      },
      { status: 500 }
    );
  }
}
