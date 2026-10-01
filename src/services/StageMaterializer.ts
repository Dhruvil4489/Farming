import { prisma } from '@/lib/prisma';

export class StageMaterializer {
  static async materialize(cropCycleId: string, cropId: string, sowingDate?: Date) {
    const cropStages = await prisma.cropStage.findMany({
      where: { cropId },
      orderBy: { orderIndex: 'asc' },
      include: {
        translations: true,
      },
    });

    if (cropStages.length === 0) return [];

    const baseDate = sowingDate ? new Date(sowingDate) : new Date();

    const cycleStages = [];
    for (let i = 0; i < cropStages.length; i++) {
      const template = cropStages[i];
      const nameTranslation = template.translations.find((t) => t.locale === 'en') || template.translations[0];
      const nameSnapshot = nameTranslation ? nameTranslation.name : template.code;

      const startDate = new Date(baseDate);
      startDate.setDate(startDate.getDate() + template.startOffsetDays);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + template.durationDays);

      const status = i === 0 ? 'current' : 'pending';

      const cycleStage = await prisma.cycleStage.create({
        data: {
          cropCycleId,
          templateStageId: template.id,
          nameSnapshot,
          startDate,
          endDate,
          orderIndex: template.orderIndex,
          status,
        },
      });

      cycleStages.push(cycleStage);
    }

    return cycleStages;
  }
}
