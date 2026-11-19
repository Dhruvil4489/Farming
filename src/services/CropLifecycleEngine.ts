/**
 * SmartFarm AI — Intelligent Crop Lifecycle Management Engine
 *
 * Responsibilities:
 * 1. Calculates exact crop age (Days After Sowing — DAS), completion %, active stage, and next stage.
 * 2. Generates crop-specific stage guidance (What to do, Why, When, How, Precautions, Required Materials).
 * 3. Transparently notes when timelines are approximate (missing variety or local climate variance).
 * 4. Automatically generates scheduled Tasks and idempotent ScheduledReminders (dedupeKey) when a cycle starts.
 */

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/EmailService';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface StageGuidanceView {
  id: string;
  orderIndex: number;
  code: string;
  name: string;
  startOffsetDays: number;
  durationDays: number;
  startDate: string | null;
  endDate: string | null;
  status: 'done' | 'current' | 'pending' | 'skipped';
  whatToDo: string;
  whyImportant: string;
  howToDo: string;
  precautions: string;
  materials: string;
  isEssential: boolean;
}

export interface LifecyclePlan {
  daysAfterSowing: number;
  totalDurationDays: number;
  progressPct: number;
  isFutureSowing: boolean;
  isApproximateTimeline: boolean;
  timelineNotice: string;
  currentStage: StageGuidanceView | null;
  nextStage: StageGuidanceView | null;
  daysUntilNextStage: number | null;
  stages: StageGuidanceView[];
}

function inferTaskType(code: string, name: string, whatToDo: string): string {
  const txt = `${code} ${name} ${whatToDo}`.toLowerCase();
  if (txt.includes('harvest') || txt.includes('picking') || txt.includes('digging')) return 'harvesting';
  if (txt.includes('cri') || txt.includes('irrigat')) return 'irrigation';
  if (txt.includes('fertil') || txt.includes('gypsum') || txt.includes('top-dress') || txt.includes('urea')) return 'fertilizer';
  if (txt.includes('scout') || txt.includes('pheromone') || txt.includes('pest') || txt.includes('blight')) return 'scouting';
  if (txt.includes('sowing') || txt.includes('nursery') || txt.includes('transplant')) return 'sowing';
  return 'custom';
}

const STAGE_NAME_TRANSLATIONS: Record<string, { hi: string; gu: string }> = {
  'land preparation': { hi: 'भूमि की तैयारी', gu: 'જમીનની તૈયારી' },
  'sowing & emergence': { hi: 'बुवाई एवं अंकुरण', gu: 'વાવણી અને અંકુરણ' },
  'sowing': { hi: 'बुवाई', gu: 'વાવણી' },
  'transplanting': { hi: 'रोपाई', gu: 'ફેરરોપણી' },
  'nursery / transplanting & root establishment': { hi: 'नर्सरी / रोपाई एवं जड़ जमाव', gu: 'ધરૂવાડિયું / ફેરરોપણી અને મૂળ વિકાસ' },
  'vegetative': { hi: 'वानस्पतिक वृद्धि', gu: 'વાનસ્પતિક વૃદ્ધિ' },
  'vegetative growth': { hi: 'वानस्पतिक वृद्धि (शाखा विकास)', gu: 'વાનસ્પતિક વૃદ્ધિ (શાખાઓનો વિકાસ)' },
  'vegetative flush & moisture regulation': { hi: 'नई बढ़वार एवं नमी प्रबंधन', gu: 'નવા ફૂટાવ અને ભેજ વ્યવસ્થાપન' },
  'flowering': { hi: 'फूल आने की अवस्था', gu: 'ફૂલ બેસવાની અવસ્થા' },
  'flowering & reproductive': { hi: 'फूल एवं प्रजनन अवस्था', gu: 'ફૂલ અને પ્રજનન તબક્કો' },
  'umbel flowering & blight watch': { hi: 'फूल खिलना एवं झुलसा निगरानी', gu: 'ફૂલ ખીલવા અને સુકારાની દેખરેખ' },
  'panicle emergence & flowering': { hi: 'बाली निकलना एवं पुष्पन', gu: 'કણસલાં નીકળવા અને ફૂલ બેસવા' },
  'fruit / bulb / head development': { hi: 'फल / कंद विकास अवस्था', gu: 'ફળ / કંદ વિકાસ તબક્કો' },
  'fruiting / pod stage': { hi: 'फल / फली विकास अवस्था', gu: 'ફળ / શિંગ વિકાસ તબક્કો' },
  'fruiting': { hi: 'फल विकास', gu: 'ફળ વિકાસ' },
  'grain filling / bulking': { hi: 'दाना भराव / वजन वृद्धि', gu: 'દાણા ભરાવા / કદ વધવાનો તબક્કો' },
  'ready to harvest': { hi: 'कटाई हेतु तैयार', gu: 'લણણી માટે તૈયાર' },
  'harvest_ready': { hi: 'कटाई हेतु तैयार', gu: 'લણણી માટે તૈયાર' },
  'harvesting & curing': { hi: 'कटाई एवं भंडारण पूर्व तैयारी', gu: 'લણણી અને સૂકવણી' },
  'harvesting': { hi: 'फसल कटाई', gu: 'પાક લણણી' },
  'post harvest': { hi: 'कटाई उपरांत प्रबंधन', gu: 'લણણી પછીનું સંચાલન' },
  'canopy management, pruning & basin care': { hi: 'छंटाई एवं थाला प्रबंधन', gu: 'ડાળીઓની છાંટણી અને થાળાંની સંભાળ' },
  'planned': { hi: 'नियोजित', gu: 'આયોજિત' },
  'sown': { hi: 'बोया गया', gu: 'વાવેતર કરેલ' },
  'growing': { hi: 'बढ़वार पर', gu: 'વિકાસશીલ' },
  'harvested': { hi: 'कटाई पूर्ण', gu: 'લણણી થયેલ' },
  'completed': { hi: 'पूर्ण', gu: 'પૂર્ણ' },
};

function localizeStageName(rawName: string, locale: string = 'en'): string {
  if (!rawName || locale === 'en') return rawName;
  const key = rawName.trim().toLowerCase();
  if (STAGE_NAME_TRANSLATIONS[key]) {
    return locale === 'hi'
      ? STAGE_NAME_TRANSLATIONS[key].hi
      : locale === 'gu'
      ? STAGE_NAME_TRANSLATIONS[key].gu
      : rawName;
  }
  for (const [k, v] of Object.entries(STAGE_NAME_TRANSLATIONS)) {
    if (key.includes(k) || k.includes(key)) {
      return locale === 'hi' ? v.hi : locale === 'gu' ? v.gu : rawName;
    }
  }
  return rawName;
}

export class CropLifecycleEngine {
  /**
   * Computes a live, up-to-date lifecycle plan for any CropCycle (with stages & templateStage included).
   */
  static buildLifecyclePlan(cycle: any, locale: string = 'en'): LifecyclePlan {
    const sowingDate = cycle.sowingDate ? new Date(cycle.sowingDate) : new Date(cycle.createdAt || Date.now());
    const nowMs = Date.now();
    const rawDas = Math.floor((nowMs - sowingDate.getTime()) / DAY_MS);
    const isFutureSowing = rawDas < 0;
    const daysAfterSowing = Math.max(0, rawDas);

    const totalDurationDays =
      cycle.variety?.durationDays ||
      cycle.crop?.typicalDurationDays ||
      120;

    const sortedStages = [...(cycle.stages || [])].sort((a, b) => a.orderIndex - b.orderIndex);

    const mapped: StageGuidanceView[] = sortedStages.map((st: any) => {
      const tpl = st.templateStage;
      const startOffset = tpl?.startOffsetDays ?? 0;
      const duration = tpl?.durationDays ?? 20;
      const startDate = st.startDate
        ? new Date(st.startDate)
        : new Date(sowingDate.getTime() + startOffset * DAY_MS);
      const endDate = st.endDate
        ? new Date(st.endDate)
        : new Date(startDate.getTime() + duration * DAY_MS);

      let computedStatus: 'done' | 'current' | 'pending' | 'skipped' = st.status || 'pending';
      if (st.status !== 'skipped') {
        if (isFutureSowing) {
          computedStatus = 'pending';
        } else if (rawDas >= startOffset + duration) {
          computedStatus = 'done';
        } else if (rawDas >= startOffset && rawDas < startOffset + duration) {
          computedStatus = 'current';
        } else {
          computedStatus = 'pending';
        }
      }

      // Check DB template translations first if available
      const dbTrans = tpl?.translations?.find((tr: any) => tr.locale === locale);
      const stageName = dbTrans?.name || localizeStageName(st.nameSnapshot || tpl?.code || '', locale);
      const cropDisplayName = cycle.crop?.name || 'crop';

      let whatToDo = tpl?.whatToDo;
      let whyImportant = tpl?.whyImportant;
      let howToDo = tpl?.howToDo;
      let precautions = tpl?.precautions;
      let materials = tpl?.materials;

      if (locale === 'hi') {
        whatToDo = dbTrans?.description || `${cropDisplayName} की ${stageName} के दौरान नियमित निगरानी करें और खेत में उचित नमी बनाए रखें।`;
        whyImportant = 'इस अवस्था में समय पर कृषि कार्य और प्रबंधन करने से फसल की पैदावार व गुणवत्ता सुरक्षित रहती है।';
        howToDo = 'खेत के विभिन्न कोनों से 15-20 पौधों का निरीक्षण करें और फिर संतुलित खाद या पौध संरक्षण उपाय करें।';
        precautions = 'स्थानीय मौसम पूर्वानुमान एवं मिट्टी स्वास्थ्य कार्ड की सिफारिशों के अनुसार ही सिंचाई व खाद दें।';
        materials = 'खेत निरीक्षण चेकलिस्ट, मिट्टी में नमी मापक यंत्र';
      } else if (locale === 'gu') {
        whatToDo = dbTrans?.description || `${cropDisplayName} ની ${stageName} દરમિયાન યોગ્ય દેખરેખ રાખો અને જમીનમાં પૂરતો ભેજ જાળવો.`;
        whyImportant = 'આ તબક્કે સમયસર યોગ્ય માવજત કરવાથી પાકનું ઉત્પાદન અને ગુણવત્તા સુરક્ષિત રહે છે.';
        howToDo = 'ખેતરના અલગ-અલગ ભાગોમાંથી 15-20 છોડનું નિરીક્ષણ કરો અને તે મુજબ જરૂરી ખાતર કે દવાનો ઉપયોગ કરો.';
        precautions = 'સ્થાનિક હવામાન આગાહી અને જમીન ચકાસણી મુજબ જ પિયત અને ખાતરનું નિયોજન કરો.';
        materials = 'ખેત નિરીક્ષણ યાદી, જમીનમાં ભેજ ચકાસણી';
      } else {
        whatToDo =
          tpl?.whatToDo ||
          `Monitor ${cropDisplayName} closely during ${stageName} and maintain balanced field moisture.`;
        whyImportant =
          tpl?.whyImportant ||
          'Timely agronomic care during this phenological window protects yield potential.';
        howToDo =
          tpl?.howToDo ||
          'Inspect 15–20 random plants across field diagonals before applying any input.';
        precautions =
          tpl?.precautions ||
          'Adjust timing based on local rainfall forecast and Soil Health Card recommendations.';
        materials = tpl?.materials || 'Field scouting checklist, soil moisture check';
      }

      return {
        id: st.id,
        orderIndex: st.orderIndex,
        code: tpl?.code || `stage_${st.orderIndex}`,
        name: stageName,
        startOffsetDays: startOffset,
        durationDays: duration,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: computedStatus,
        whatToDo,
        whyImportant,
        howToDo,
        precautions,
        materials,
        isEssential: tpl?.isEssential ?? true,
      };
    });

    const currentStage =
      mapped.find((s) => s.status === 'current') ||
      (isFutureSowing ? mapped[0] || null : mapped[mapped.length - 1] || null);

    const nextStage = currentStage
      ? mapped.find((s) => s.orderIndex > currentStage.orderIndex) || null
      : mapped[0] || null;

    const daysUntilNextStage =
      nextStage && nextStage.startDate
        ? Math.max(0, Math.ceil((new Date(nextStage.startDate).getTime() - nowMs) / DAY_MS))
        : null;

    const progressPct = isFutureSowing
      ? 0
      : Math.min(100, Math.round((daysAfterSowing / Math.max(totalDurationDays, 1)) * 100));

    const isApproximateTimeline = !cycle.varietyId;
    let timelineNotice = '';
    if (locale === 'hi') {
      timelineNotice = isApproximateTimeline
        ? `अवस्था की तारीखें अनुमानित ICAR/SAU अनुमान (${totalDurationDays} दिन) हैं। स्थानीय मौसम, मिट्टी और किस्म के अनुसार ±5–10 दिनों का अंतर हो सकता है।`
        : `समयरेखा ${cycle.variety?.name || 'चुनी गई किस्म'} (~${totalDurationDays} दिन) के लिए निर्धारित है। हमेशा खेत में फसल अवस्था की पुष्टि करें।`;
    } else if (locale === 'gu') {
      timelineNotice = isApproximateTimeline
        ? `અવસ્થાની તારીખો અંદાજિત ICAR/SAU અંદાજ (${totalDurationDays} દિવસ) છે. સ્થાનિક હવામાન, જમીન અને જાત પ્રમાણે ±5–10 દિવસનો તફાવત હોઈ શકે છે.`
        : `સમયરેખા ${cycle.variety?.name || 'પસંદ કરેલ જાત'} (~${totalDurationDays} દિવસ) માટે ગોઠવેલ છે. હંમેશા ખેતરમાં પાકની સ્થિતિ રૂબરૂ ચકાસો.`;
    } else {
      timelineNotice = isApproximateTimeline
        ? `Stage dates are approximate ICAR/SAU estimates (${totalDurationDays} days) because no specific variety was selected. Local weather, soil type, and variety duration can shift stage windows by ±5–10 days.`
        : `Timeline calibrated for ${cycle.variety?.name || 'selected variety'} (~${totalDurationDays} days). Always confirm crop stage visually in the field.`;
    }

    return {
      daysAfterSowing,
      totalDurationDays,
      progressPct,
      isFutureSowing,
      isApproximateTimeline,
      timelineNotice,
      currentStage,
      nextStage,
      daysUntilNextStage,
      stages: mapped,
    };
  }

  /**
   * Auto-generates realistic Tasks, ScheduledReminders (idempotent via dedupeKey),
   * and an in-app Notification when a farmer creates a new CropCycle.
   */
  static async initializeTasksAndReminders(params: {
    userId: string;
    userEmail?: string | null;
    userName: string;
    userLocale?: string;
    farmId: string;
    fieldId: string;
    fieldName: string;
    cropCycleId: string;
    cropName: string;
    sowingDate: Date;
    stages: any[];
  }) {
    const {
      userId,
      userEmail,
      userName,
      userLocale = 'en',
      farmId,
      fieldId,
      fieldName,
      cropCycleId,
      cropName,
      sowingDate,
      stages,
    } = params;

    const nowMs = Date.now();
    const createdTasks: any[] = [];
    const createdReminders: any[] = [];

    for (const st of stages) {
      const tpl = st.templateStage;
      const startDate = st.startDate ? new Date(st.startDate) : sowingDate;
      // Skip creating tasks for stages that already finished more than 7 days ago
      const endDate = st.endDate
        ? new Date(st.endDate)
        : new Date(startDate.getTime() + (tpl?.durationDays || 15) * DAY_MS);

      const isAlreadyPast = endDate.getTime() < nowMs - 7 * DAY_MS;
      if (isAlreadyPast) continue;

      const taskType = inferTaskType(
        tpl?.code || '',
        st.nameSnapshot || '',
        tpl?.whatToDo || ''
      );

      const dueAt = startDate.getTime() < nowMs ? new Date(nowMs + DAY_MS) : startDate;
      const localizedStage = localizeStageName(st.nameSnapshot || '', userLocale);
      const taskTitle = `${cropName} — ${localizedStage} (${fieldName})`;
      let actionPrefix = 'Action: ';
      let howPrefix = 'How: ';
      let precautionPrefix = 'Precaution: ';
      if (userLocale === 'hi') {
        actionPrefix = 'कार्य: ';
        howPrefix = 'तरीका: ';
        precautionPrefix = 'सावधानी: ';
      } else if (userLocale === 'gu') {
        actionPrefix = 'કાર્ય: ';
        howPrefix = 'રીત: ';
        precautionPrefix = 'સાવચેતી: ';
      }
      const taskDesc = [
        tpl?.whatToDo ? `${actionPrefix}${tpl.whatToDo}` : null,
        tpl?.howToDo ? `${howPrefix}${tpl.howToDo}` : null,
        tpl?.precautions ? `${precautionPrefix}${tpl.precautions}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const task = await prisma.task.create({
        data: {
          userId,
          farmId,
          fieldId,
          cropCycleId,
          type: taskType,
          title: taskTitle,
          description: taskDesc || `Stage activity for ${cropName} in ${fieldName}.`,
          dueAt,
          priority: st.status === 'current' || taskType === 'irrigation' ? 'high' : 'medium',
          status: 'pending',
          source: 'system',
        },
      });
      createdTasks.push(task);

      // Schedule reminder 1 day prior to stage start (or immediately if current stage)
      const reminderTime =
        startDate.getTime() <= nowMs
          ? new Date(nowMs)
          : new Date(startDate.getTime() - DAY_MS);
      const dedupeKey = `cycle:${cropCycleId}:stage:${st.orderIndex}`;

      const reminder = await prisma.scheduledReminder.upsert({
        where: { dedupeKey },
        update: {},
        create: {
          userId,
          cropCycleId,
          taskId: task.id,
          fieldId,
          category: taskType === 'irrigation' ? 'irrigation' : 'crop_stage',
          dedupeKey,
          scheduledFor: reminderTime,
          title: taskTitle,
          body: tpl?.whatToDo || `Your ${cropName} in ${fieldName} is entering ${st.nameSnapshot}.`,
          payloadJson: JSON.stringify({
            cropName,
            fieldName,
            stageName: st.nameSnapshot,
            whatToDo: tpl?.whatToDo,
            whyImportant: tpl?.whyImportant,
            howToDo: tpl?.howToDo,
            precautions: tpl?.precautions,
            materials: tpl?.materials,
            actionUrl: EmailService.getAppUrl(`/crop-cycles/${cropCycleId}`),
          }),
          status: 'pending',
        },
      });
      createdReminders.push(reminder);
    }

    // Create immediate in-app notification for lifecycle plan activation
    const activeStage = stages.find((s) => s.status === 'current') || stages[0];
    await prisma.notification.create({
      data: {
        userId,
        type: 'crop_stage',
        titleKey: `${cropName} Lifecycle Plan Activated`,
        bodyKey: activeStage
          ? `Field "${fieldName}" is currently in "${activeStage.nameSnapshot}". ${createdTasks.length} stage tasks & reminders were scheduled.`
          : `Lifecycle tracking started for ${cropName} on "${fieldName}".`,
        paramsJson: JSON.stringify({
          cropCycleId,
          fieldId,
          actionUrl: `/crop-cycles/${cropCycleId}`,
        }),
      },
    });

    // Send lifecycle creation & welcome email if user has an email address
    if (userEmail) {
      await EmailService.sendTemplate({
        userId,
        toEmail: userEmail,
        templateKey: 'crop_cycle_created',
        locale: (userLocale as any) || 'en',
        preferenceType: 'crop_stage',
        dedupeKey: `cycle_created:${cropCycleId}`,
        data: {
          name: userName,
          cropName,
          fieldName,
          sowingDate: sowingDate.toLocaleDateString('en-IN'),
          initialGuidance: activeStage?.templateStage?.whatToDo || 'Follow the growth stages and monitor field moisture.',
          actionUrl: EmailService.getAppUrl(`/crop-cycles/${cropCycleId}`),
        },
      }).catch(() => {});
    }

    return {
      tasksCreated: createdTasks.length,
      remindersScheduled: createdReminders.length,
    };
  }

  /**
   * Recalculates and reschedules future reminders and tasks when a sowing date is changed.
   * Preserves all historical sent reminders.
   */
  static async rescheduleFutureReminders(params: {
    cropCycleId: string;
    newSowingDate: Date;
    cropName?: string;
    fieldName?: string;
  }) {
    const { cropCycleId, newSowingDate, cropName, fieldName } = params;
    const nowMs = Date.now();

    const stages = await prisma.cycleStage.findMany({
      where: { cropCycleId },
      orderBy: { orderIndex: 'asc' },
      include: { templateStage: true },
    });

    for (const st of stages) {
      const tpl = st.templateStage;
      const startOffset = tpl?.startOffsetDays ?? 0;
      const duration = tpl?.durationDays ?? 20;

      const newStart = new Date(newSowingDate.getTime() + startOffset * DAY_MS);
      const newEnd = new Date(newStart.getTime() + duration * DAY_MS);

      // Update stage start and end dates
      await prisma.cycleStage.update({
        where: { id: st.id },
        data: {
          startDate: newStart,
          endDate: newEnd,
          status: newEnd.getTime() < nowMs ? 'done' : newStart.getTime() <= nowMs ? 'current' : 'pending',
        },
      });

      // Update only future pending or failed reminders (preserve already sent reminders)
      const dedupeKey = `cycle:${cropCycleId}:stage:${st.orderIndex}`;
      const newReminderTime =
        newStart.getTime() <= nowMs ? new Date(nowMs) : new Date(newStart.getTime() - DAY_MS);

      await prisma.scheduledReminder.updateMany({
        where: {
          dedupeKey,
          status: { in: ['pending', 'failed'] },
        },
        data: {
          scheduledFor: newReminderTime,
          updatedAt: new Date(),
        },
      });
    }

    // Update pending tasks due dates
    const tasks = await prisma.task.findMany({
      where: { cropCycleId, status: 'pending', deletedAt: null },
    });
    for (const t of tasks) {
      // Find matching stage if any
      const matchingStage = stages.find((s) => t.title.includes(s.nameSnapshot));
      if (matchingStage) {
        const startOffset = matchingStage.templateStage?.startOffsetDays ?? 0;
        const newDue = new Date(newSowingDate.getTime() + startOffset * DAY_MS);
        await prisma.task.update({
          where: { id: t.id },
          data: { dueAt: newDue < new Date() ? new Date() : newDue },
        });
      }
    }
  }

  /**
   * Cancels future pending reminders when a crop cycle is deleted or completed.
   */
  static async cancelFutureReminders(cropCycleId: string, reason: string) {
    await prisma.scheduledReminder.updateMany({
      where: {
        cropCycleId,
        status: { in: ['pending', 'failed'] },
      },
      data: {
        status: 'cancelled',
        lastError: reason,
        updatedAt: new Date(),
      },
    });
  }
}
