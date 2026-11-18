import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolveCropName } from '@/lib/units';

export async function GET(request: NextRequest) {
  try {
      const user = await getAuthenticatedUser();
      if (!user) {
        return apiError('User session required for nutrient guidance context', 'unauthorized', 401);
      }

      const { searchParams } = new URL(request.url);
      const requestedFieldId = searchParams.get('fieldId') || undefined;

      // 1. Fetch all active farms and fields belonging to this authenticated farmer
      const farms = await prisma.farm.findMany({
        where: { userId: user.id, deletedAt: null },
        include: {
          fields: {
            where: { deletedAt: null },
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
    const selectedField = requestedFieldId
        ? allFields.find((f) => f.id === requestedFieldId) || allFields[0] || null
        : allFields[0] || null;

      let fieldDetails: any = null;
      let cropCycle: any = null;
      let soilAudit: any = {
        hasLabTest: false,
        testDate: null,
        parameters: {
          nitrogen: { value: null, isKnown: false, label: 'Nitrogen (N)' },
          phosphorus: { value: null, isKnown: false, label: 'Phosphorus (P)' },
          potassium: { value: null, isKnown: false, label: 'Potassium (K)' },
          ph: { value: null, isKnown: false, label: 'Soil pH' },
          organicCarbon: { value: null, isKnown: false, label: 'Organic Matter' },
        },
        missingInputs: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Soil pH', 'Organic Matter'],
        advisoryType: 'university_baseline',
        authority: 'ICAR / Anand Agricultural University (AAU) / Junagadh Agricultural University (JAU)',
        advisoryNotes:
        'No lab soil test is needed to get started! Showing reliable university nutrient schedules tailored to your crop and region.',
      };

      if (selectedField) {
          fieldDetails = await prisma.field.findFirst({
            where: { id: selectedField.id, deletedAt: null, farm: { userId: user.id, deletedAt: null } },
            include: {
              farm: true,
              cropCycles: {
                where: { deletedAt: null, status: { notIn: ['completed'] } },
                include: {
                  crop: { include: { translations: true } },
                  stages: { orderBy: { orderIndex: 'asc' } },
                },
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

          if(fieldDetails?.cropCycles?.[0]) {
          const cc = fieldDetails.cropCycles[0];
          const currentStageObj =
            cc.stages?.find((s: any) => s.status === 'current') || cc.stages?.[0] || null;
          const resolvedCropName = resolveCropName(cc.crop, cc.customCropName, user.preferredLanguage);
          cropCycle = {
            id: cc.id,
            cropName: resolvedCropName,
            cropSlug: cc.crop?.slug || resolvedCropName.toLowerCase(),
            stage: currentStageObj?.nameSnapshot || cc.status || 'Growing',
            sowingDate: cc.sowingDate ? cc.sowingDate.toISOString() : null,
          };
        }

        if (fieldDetails?.soilTests?.[0]) {
          const st = fieldDetails.soilTests[0];
          const paramMap = new Map<string, any>(
            (st.parameters || []).map((p: any) => [p.code.toLowerCase(), p])
          );
          const nParam = paramMap.get('n');
          const pParam = paramMap.get('p');
          const kParam = paramMap.get('k');
          const phParam = paramMap.get('ph');
          const ocParam = paramMap.get('oc');

          const missing: string[] = [];
          if (!nParam) missing.push('Nitrogen (N)');
          if (!pParam) missing.push('Phosphorus (P)');
          if (!kParam) missing.push('Potassium (K)');
          if (!phParam) missing.push('Soil pH');
          if (!ocParam) missing.push('Organic Matter');

          soilAudit = {
            hasLabTest: true,
            testDate: st.testedOn ? st.testedOn.toISOString().split('T')[0] : null,
            parameters: {
              nitrogen: {
                value: nParam ? nParam.value : null,
                unit: nParam?.unit || 'kg/ha',
                isKnown: Boolean(nParam),
                label: 'Nitrogen (N)',
              },
              phosphorus: {
                value: pParam ? pParam.value : null,
                unit: pParam?.unit || 'kg/ha',
                isKnown: Boolean(pParam),
                label: 'Phosphorus (P)',
              },
              potassium: {
                value: kParam ? kParam.value : null,
                unit: kParam?.unit || 'kg/ha',
                isKnown: Boolean(kParam),
                label: 'Potassium (K)',
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
                label: 'Organic Matter',
              },
            },
            missingInputs: missing,
            advisoryType: missing.length === 0 ? 'soil_test_correlated' : 'partial_soil_test',
            authority: 'ICAR / Anand Agricultural University (AAU) / Junagadh Agricultural University (JAU)',
            advisoryNotes:
              missing.length === 0
              ?'Soil test values are recorded for this field and correlated with your schedule.'
              : `Soil readings on file. Optional values not yet recorded: ${missing.join(', ')}.`,
          };
        }
      }

      // 3. Fetch all verified guidance records so farmer can filter across all crops
      const guidances = await prisma.cropFertilizerGuidance.findMany({
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
      return apiError('Failed to load nutrient guidance context', 'context_error', 500);
    }
  }
