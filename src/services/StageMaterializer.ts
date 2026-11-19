import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

export class StageMaterializer {
  /**
   * Materializes CycleStage records from a Crop's verified CropStage templates,
   * accurately computing done / current / pending statuses from the real sowing date.
   */
  static async materialize(cropCycleId: string, cropId: string, sowingDate: Date | null) {
    const templateStages = await prisma.cropStage.findMany({
      where: { cropId, status: 'published' },
      orderBy: { orderIndex: 'asc' },
      include: { translations: true },
    });

    if (templateStages.length === 0) return [];

    const baseDate = sowingDate ? new Date(sowingDate) : new Date();
    const nowMs = Date.now();
    const das = Math.floor((nowMs - baseDate.getTime()) / DAY_MS);

    // Determine which stage index is currently active based on DAS
    let activeIdx = 0;
    if (das < 0) {
      activeIdx = -1; // Planned future sowing
    } else {
      activeIdx = templateStages.findIndex(
        (st) => das >= st.startOffsetDays && das < st.startOffsetDays + st.durationDays
      );
      if (activeIdx === -1) {
        const last = templateStages[templateStages.length - 1];
        activeIdx = das >= last.startOffsetDays + last.durationDays ? templateStages.length : 0;
      }
    }

    const createdStages = [];

    for (let i = 0; i < templateStages.length; i++) {
      const tpl = templateStages[i];
      const enTrans = tpl.translations.find((t) => t.locale === 'en') || tpl.translations[0];
      const nameSnapshot = enTrans?.name || tpl.code;

      const startDate = new Date(baseDate.getTime() + tpl.startOffsetDays * DAY_MS);
      const endDate = new Date(startDate.getTime() + tpl.durationDays * DAY_MS);

      let status: 'done' | 'current' | 'pending' = 'pending';
      if (activeIdx >= templateStages.length) {
        status = 'done';
      } else if (i < activeIdx) {
        status = 'done';
      } else if (i === activeIdx) {
        status = 'current';
      } else {
        status = 'pending';
      }

      const cycleStage = await prisma.cycleStage.create({
        data: {
          cropCycleId,
          templateStageId: tpl.id,
          nameSnapshot,
          startDate,
          endDate,
          orderIndex: tpl.orderIndex,
          status,
        },
        include: {
          templateStage: true,
        },
      });
      createdStages.push(cycleStage);
    }

    return createdStages;
  }
}
