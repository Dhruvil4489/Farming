import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { getAuthenticatedUser } from '@/lib/auth';

export const CROP_CATEGORIES = [
  { id: 'all', label: 'All Crops' },
  { id: 'cereal', label: 'Cereals' },
  { id: 'pulse', label: 'Pulses' },
  { id: 'oilseed', label: 'Oilseeds' },
  { id: 'cash_crop', label: 'Cash Crops' },
  { id: 'vegetable', label: 'Vegetables' },
  { id: 'fruit', label: 'Fruits' },
  { id: 'spice', label: 'Spices' },
  { id: 'plantation', label: 'Plantation' },
  { id: 'fodder', label: 'Fodder & Green Manure' },
  { id: 'regional', label: 'Regional & Specialty' },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('lang') || user?.preferredLanguage || 'en';
    const category = searchParams.get('category') || '';
    const season = searchParams.get('season') || '';
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const includeStages = searchParams.get('stages') === 'true';

    const crops = await prisma.crop.findMany({
      where: {
        status: 'published',
        ...(category && category !== 'all' ? { category } : {}),
      },
      include: {
        translations: true,
        varieties: { where: { status: 'published' }, orderBy: { name: 'asc' } },
        ...(includeStages
          ? {
              stages: {
                where: { status: 'published' },
                orderBy: { orderIndex: 'asc' },
                include: { translations: true },
              },
            }
          : {}),
      },
      orderBy: [{ category: 'asc' }, { slug: 'asc' }],
    });

    const formatted = crops
      .map((c: any) => {
        const transMap: Record<string, { name: string; aliases: string[]; description?: string | null }> = {};
        for (const tr of c.translations || []) {
          let parsedAliases: string[] = [];
          try {
            parsedAliases = JSON.parse(tr.aliases || '[]');
          } catch {
            parsedAliases = [];
          }
          transMap[tr.locale] = {
            name: tr.name,
            aliases: Array.isArray(parsedAliases) ? parsedAliases : [],
            description: tr.description,
          };
        }

        const preferred = transMap[locale] || transMap.en;
        let seasonsArr: string[] = [];
        try {
          seasonsArr = JSON.parse(c.seasons || '[]');
        } catch {
          seasonsArr = [];
        }

        const searchTokens = [
          c.slug,
          c.scientificName || '',
          c.category,
          transMap.en?.name || '',
          transMap.hi?.name || '',
          transMap.gu?.name || '',
          ...(transMap.en?.aliases || []),
          ...(transMap.hi?.aliases || []),
          ...(transMap.gu?.aliases || []),
        ]
          .join(' ')
          .toLowerCase();

        return {
          id: c.id,
          slug: c.slug,
          category: c.category,
          name: preferred?.name || c.slug,
          names: {
            en: transMap.en?.name || c.slug,
            hi: transMap.hi?.name || transMap.en?.name || c.slug,
            gu: transMap.gu?.name || transMap.en?.name || c.slug,
          },
          scientificName: c.scientificName,
          seasons: seasonsArr,
          typicalDurationDays: c.typicalDurationDays,
          climate: c.climate,
          soilSuitability: c.soilSuitability,
          sowingPeriod: c.sowingPeriod,
          irrigationGuidance: c.irrigationGuidance,
          nutrientGuidance: c.nutrientGuidance,
          commonWeeds: c.commonWeeds,
          commonDiseases: c.commonDiseases,
          commonPests: c.commonPests,
          harvestGuidance: c.harvestGuidance,
          storageGuidance: c.storageGuidance,
          sourceAuthority: c.sourceAuthority,
          displayColor: c.displayColor,
          icon: c.icon,
          varieties: c.varieties,
          ...(includeStages && c.stages
            ? {
                stages: c.stages.map((st: any) => ({
                  id: st.id,
                  orderIndex: st.orderIndex,
                  code: st.code,
                  name: st.translations?.find((t: any) => t.locale === locale)?.name || st.translations?.[0]?.name || st.code,
                  startOffsetDays: st.startOffsetDays,
                  durationDays: st.durationDays,
                  whatToDo: st.whatToDo,
                  whyImportant: st.whyImportant,
                  howToDo: st.howToDo,
                  precautions: st.precautions,
                  materials: st.materials,
                  isEssential: st.isEssential,
                })),
              }
            : {}),
          _searchTokens: searchTokens,
        };
      })
      .filter((item) => {
        if (season && !item.seasons.includes(season.toLowerCase())) return false;
        if (q && !item._searchTokens.includes(q)) return false;
        return true;
      })
      .map(({ _searchTokens, ...rest }) => rest);

    return apiSuccess(formatted, {
      total: formatted.length,
      categories: CROP_CATEGORIES,
    });
  } catch (err) {
    console.error('[GET /api/v1/crops] Error:', err);
    return apiError('Unable to load crop catalog right now.', 'crops_load_failed', 500);
  }
}
