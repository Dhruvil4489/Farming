import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/api-envelope';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const locale = searchParams.get('locale') || 'en';

  const crops = await prisma.crop.findMany({
    where: {
      status: 'published',
      ...(query
        ? {
            translations: {
              some: {
                name: { contains: query },
              },
            },
          }
        : {}),
    },
    include: {
      translations: true,
      varieties: true,
      stages: {
        include: {
          translations: true,
          advisories: {
            include: { translations: true },
          },
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  const localizedCrops = crops.map((crop) => {
    const translation = crop.translations.find((t) => t.locale === locale) || crop.translations[0];
    return {
      id: crop.id,
      slug: crop.slug,
      category: crop.category,
      typicalDurationDays: crop.typicalDurationDays,
      displayColor: crop.displayColor,
      icon: crop.icon,
      name: translation ? translation.name : crop.slug,
      description: translation ? translation.description : null,
      varieties: crop.varieties,
      stages: crop.stages.map((stage) => {
        const stageTrans = stage.translations.find((t) => t.locale === locale) || stage.translations[0];
        return {
          id: stage.id,
          orderIndex: stage.orderIndex,
          code: stage.code,
          name: stageTrans ? stageTrans.name : stage.code,
          description: stageTrans ? stageTrans.description : null,
          startOffsetDays: stage.startOffsetDays,
          durationDays: stage.durationDays,
          advisories: stage.advisories.map((adv) => {
            const advTrans = adv.translations.find((t) => t.locale === locale) || adv.translations[0];
            return {
              id: adv.id,
              activityType: adv.activityType,
              text: advTrans ? advTrans.text : '',
            };
          }),
        };
      }),
    };
  });

  return apiSuccess(localizedCrops);
}
