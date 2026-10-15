import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getEffectiveUserId } from '@/lib/get-effective-user';

export async function GET(request: NextRequest) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return apiError('User session required for nutrient guidance context', 'unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const requestedFieldId = searchParams.get('fieldId') || undefined;

    // 1. Fetch all farms and fields belonging to this authenticated farmer
    const farms = await prisma.farm.findMany({
      where: { userId },
      include: {
        fields: {
          select: {
            id: true,
            name: true,
            areaHa: true,
            soilType: true,
            irrigationType: true,
            status: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const allFields = farms.flatMap((f) =>
      f.fields.map((fld) => ({
        ...fld,
        farmId: f.id,
        farmName: f.name,
        village: f.village,
        district: f.district,
        state: f.state,
      }))
    );

    // 2. Determine target field
    let selectedField = requestedFieldId
      ? allFields.find((f) => f.id === requestedFieldId)
      : allFields[0] || null;

    let fieldDetails: any = null;
    let cropCycle: any = null;
    let soilAudit: any = {
      hasLabTest: false,
      testDate: null,
      parameters: {
        nitrogen: { value: null, isKnown: false, label: 'Available Nitrogen (N)' },
        phosphorus: { value: null, isKnown: false, label: 'Available Phosphorus (P2O5)' },
        potassium: { value: null, isKnown: false, label: 'Available Potassium (K2O)' },
        ph: { value: null, isKnown: false, label: 'Soil pH' },
        organicCarbon: { value: null, isKnown: false, label: 'Organic Carbon (OC)' },
      },
      missingInputs: [
        'Available Nitrogen (N)',
        'Available Phosphorus (P2O5)',
        'Available Potassium (K2O)',
        'Soil pH',
        'Organic Carbon (OC)',
      ],
      advisoryType: 'university_baseline',
      authority: 'ICAR / Anand Agricultural University (AAU) / Junagadh Agricultural University (JAU)',
      advisoryNotes:
        'No laboratory Soil Health Card or test report on record for this field. Showing standard university agronomic baseline recommendations. To receive calibrated chemical dosages, please submit a soil test report.',
    };

    if (selectedField) {
      fieldDetails = await prisma.field.findUnique({
        where: { id: selectedField.id },
        include: {
          farm: true,
          cropCycles: {
            where: { status: 'active' },
            include: { crop: true },
            orderBy: { sowingDate: 'desc' },
            take: 1,
          },
          soilTests: {
            include: { parameters: true },
            orderBy: { testedOn: 'desc' },
            take: 1,
          },
          soilProfile: true,
        },
      });

      if (fieldDetails?.cropCycles?.[0]) {
        const cc = fieldDetails.cropCycles[0];
        cropCycle = {
          id: cc.id,
          cropName: cc.crop?.name || cc.cropName || 'Field Crop',
          cropSlug: cc.crop?.slug || (cc.cropName ? cc.cropName.toLowerCase() : 'wheat'),
          stage: cc.currentStage || 'Basal / Sowing',
          sowingDate: cc.sowingDate ? cc.sowingDate.toISOString() : null,
        };
      }

      if (fieldDetails?.soilTests?.[0]) {
        const st = fieldDetails.soilTests[0];
        const paramMap = new Map<string, any>((st.parameters || []).map((p: any) => [p.code.toLowerCase(), p]));
        const nParam = paramMap.get('n');
        const pParam = paramMap.get('p');
        const kParam = paramMap.get('k');
        const phParam = paramMap.get('ph');
        const ocParam = paramMap.get('oc');

        const missing: string[] = [];
        if (!nParam) missing.push('Available Nitrogen (N)');
        if (!pParam) missing.push('Available Phosphorus (P2O5)');
        if (!kParam) missing.push('Available Potassium (K2O)');
        if (!phParam) missing.push('Soil pH');
        if (!ocParam) missing.push('Organic Carbon (OC)');

        soilAudit = {
          hasLabTest: true,
          testDate: st.testedOn ? st.testedOn.toISOString().split('T')[0] : null,
          parameters: {
            nitrogen: {
              value: nParam ? nParam.value : null,
              unit: nParam?.unit || 'kg/ha',
              isKnown: Boolean(nParam),
              label: 'Available Nitrogen (N)',
            },
            phosphorus: {
              value: pParam ? pParam.value : null,
              unit: pParam?.unit || 'kg/ha',
              isKnown: Boolean(pParam),
              label: 'Available Phosphorus (P2O5)',
            },
            potassium: {
              value: kParam ? kParam.value : null,
              unit: kParam?.unit || 'kg/ha',
              isKnown: Boolean(kParam),
              label: 'Available Potassium (K2O)',
            },
            ph: {
              value: phParam ? phParam.value : null,
              unit: phParam?.unit || 'pH',
              isKnown: Boolean(phParam),
              label: 'Soil pH',
            },
            organicCarbon: {
              value: ocParam ? ocParam.value : null,
              unit: ocParam?.unit || '%',
              isKnown: Boolean(ocParam),
              label: 'Organic Carbon (OC)',
            },
          },
          missingInputs: missing,
          advisoryType: missing.length === 0 ? 'soil_test_correlated' : 'partial_soil_test',
          authority: 'ICAR / Anand Agricultural University (AAU) / Junagadh Agricultural University (JAU)',
          advisoryNotes:
            missing.length === 0
              ? 'Laboratory soil test observations are recorded for this plot.'
              : `Partial soil test recorded. ${missing.join(', ')} remain unverified.`,
        };
      }
    }

    // 3. Fetch verified guidance records
    let whereGuidance: any = {};
    if (cropCycle?.cropSlug) {
      whereGuidance.cropSlug = cropCycle.cropSlug;
    }

    const guidances = await prisma.cropFertilizerGuidance.findMany({
      where: whereGuidance,
      include: {
        fertilizerCategory: true,
      },
      orderBy: [{ cropName: 'asc' }, { recommendedTiming: 'asc' }],
    });

    return apiSuccess({
      farms: farms.map((f) => ({
        id: f.id,
        name: f.name,
        district: f.district,
        fields: f.fields,
      })),
      allFields,
      selectedField: selectedField || null,
      cropCycle: cropCycle || null,
      soilAudit,
      guidanceCount: guidances.length,
      guidances,
    });
  } catch (err: any) {
    console.error('Error in /api/v1/fertilizers/field-context:', err);
    return apiError(err.message || 'Failed to load field context for nutrient guidance', 'context_error', 500);
  }
}
