import { NextRequest, NextResponse } from 'next/server';
import { SoilMoistureService } from '@/services/SoilMoistureService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'Gujarat';
    const district = searchParams.get('district') || undefined;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const provider = SoilMoistureService.getProvider();
    const status = await provider.getStatus();

    const [observations, availableDistricts] = await Promise.all([
      SoilMoistureService.getLatestDistrictObservations({ state, district }),
      SoilMoistureService.getAvailableDistricts(state),
    ]);

    let trend: any[] = [];
    if (district) {
      trend = await SoilMoistureService.getDistrictTrend(state, district, days);
    } else if (observations.length > 0) {
      trend = await SoilMoistureService.getDistrictTrend(state, observations[0].district, days);
    }

    return NextResponse.json({
      success: true,
      provider: status,
      state,
      selectedDistrict: district || (observations.length > 0 ? observations[0].district : null),
      count: observations.length,
      observations,
      trend,
      availableDistricts,
      metadata: {
        spatialResolution: 'district_level_vic_model',
        sourceAuthority: 'National Remote Sensing Centre (NRSC / ISRO)',
        hydrologicalModel: 'Variable Infiltration Capacity (VIC) Macroscale Model',
        rootZoneDepth: '0-50 cm',
        datasetCatalog: 'https://data.gov.in/catalog/daily-data-soil-moisture',
        disclaimer:
          'Government soil moisture represents macro-scale district averages derived from hydrologic modeling. It is not an in-situ plot sensor reading. Irrigation decisions should combine this baseline with field soil tests and crop stage requirements.',
      },
    });
  } catch (error: any) {
    console.error('[API /api/v1/soil-moisture] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while retrieving soil moisture data',
      },
      { status: 500 }
    );
  }
}
