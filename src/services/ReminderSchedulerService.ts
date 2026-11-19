/**
 * SmartFarm AI — Reminder Processing & Activity Scanner Engine
 *
 * Scans active CropCycles and Tasks, automatically generating timely, actionable
 * reminders for:
 * 1. Irrigation reminders (watering due, moisture checks)
 * 2. Fertilizer application reminders (stage-specific top dressing, dosage)
 * 3. Crop inspection & scouting reminders (pest & disease monitoring)
 * 4. Spray reminders (preventive bio-sprays & micronutrients)
 * 5. Harvesting reminders (approaching harvest dates within 14 days)
 * 6. Overdue task alerts (critical field activities past due)
 *
 * Implements strict deduplication (dedupeKey) to prevent repeated duplicate alerts,
 * and generates full multilingual copy (en, hi, gu) for farmer accessibility.
 */

import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/EmailService';

export interface ReminderRunSummary {
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
}

export interface ScanResultSummary {
  checkedCycles: number;
  checkedTasks: number;
  createdNotifications: number;
}

export function translateNotificationText(text: string, locale: string): string {
  if (!text || locale === 'en') return text;

  const DICTIONARY: Record<string, Record<string, string>> = {
    hi: {
      'Lifecycle Plan Activated': 'जीवन चक्र योजना सक्रिय हुई',
      'is currently in': 'वर्तमान में इस चरण में है',
      'tasks & reminders were scheduled': 'कार्य और अनुस्मारक निर्धारित किए गए',
      'Check drip irrigation lines for blockages': 'ड्रिप सिंचाई लाइनों में रुकावट की जांच करें',
      'Sowing, Emergence & Gap Filling': 'बुवाई, अंकुरण और गैप फिलिंग',
      'Vegetative Growth & Inter-cultivation': 'वानस्पतिक वृद्धि और निराई-गुड़ाई',
      'Square Formation (Bud Initiation)': 'फूल की कलियां बनने की अवस्था (स्क्वायर)',
      'Flowering & Early Boll Set': 'फूल आना और शुरुआती गूलर बनना',
      'Boll Development & Maturation': 'गूलर का विकास और परिपक्वता',
      'Boll Opening & Clean Picking': 'गूलर खिलना और साफ चुनाई',
      'Sowing & Germination': 'बुवाई एवं अंकुरण अवस्था',
      'Crown Root Initiation': 'ताज जड़ निर्माण अवस्था',
      'Tillering': 'कल्ले फूटने की अवस्था',
      'Jointing & Stem Extension': 'गांठ बनना और तना वृद्धि',
      'Flowering & Anthesis': 'फूल आने की अवस्था',
      'Grain Filling & Milking': 'दाना भराव और दुग्धावस्था',
      'Ripening & Harvesting': 'परिपक्वता और कटाई',
      'Cotton': 'कपास',
      'Wheat': 'गेहूं',
      'Rice': 'चावल (धान)',
      'Tomato': 'टमाटर',
      'Potato': 'आलू',
      'Onion': 'प्याज',
      'Groundnut': 'मूंगफली',
      'Soybean': 'सोयाबीन',
      'Maize': 'मक्का',
      'Irrigation': 'सिंचाई',
      'Fertilizer': 'उर्वरक',
      'Harvesting': 'कटाई',
      'Scouting': 'निरीक्षण',
      'Spraying': 'छिड़काव',
    },
    gu: {
      'Lifecycle Plan Activated': 'જીવનચક્ર આયોજન સક્રિય થયું',
      'is currently in': 'હાલમાં આ તબક્કામાં છે',
      'tasks & reminders were scheduled': 'કાર્યો અને રીમાઇન્ડર્સ નિર્ધારિત કરવામાં આવ્યા છે',
      'Check drip irrigation lines for blockages': 'ટપક સિંચાઈ પાઇપલાઇનમાં અવરોધ તપાસો',
      'Sowing, Emergence & Gap Filling': 'વાવણી, અંકુરણ અને ગેપ ફિલિંગ',
      'Vegetative Growth & Inter-cultivation': 'વાનસ્પતિક વૃદ્ધિ અને આંતરખેડ',
      'Square Formation (Bud Initiation)': 'ચાપવા બેસવાનો તબક્કો (કળીઓ)',
      'Flowering & Early Boll Set': 'ફૂલ આવવા અને ઝીંડવા બેસવા',
      'Boll Development & Maturation': 'ઝીંડવાનો વિકાસ અને પરિપક્વતા',
      'Boll Opening & Clean Picking': 'ઝીંડવા ખીલવા અને સ્વચ્છ વીણી',
      'Sowing & Germination': 'વાવણી અને અંકુરણ તબક્કો',
      'Crown Root Initiation': 'મૂળ ફૂટવાનો તબક્કો',
      'Tillering': 'ફૂટ આવવાનો તબક્કો',
      'Jointing & Stem Extension': 'ગાંઠો બનવાનો અને સાંઠા વૃદ્ધિનો તબક્કો',
      'Flowering & Anthesis': 'ફૂલ ખીલવાનો તબક્કો',
      'Grain Filling & Milking': 'દાણા ભરાવવાનો દૂધિયા તબક્કો',
      'Ripening & Harvesting': 'પાકવાની અને કાપણીની અવસ્થા',
      'Cotton': 'કપાસ',
      'Wheat': 'ઘઉં',
      'Rice': 'ચોખા (ડાંગર)',
      'Tomato': 'ટામેટા',
      'Potato': 'બટાકા',
      'Onion': 'ડુંગળી',
      'Groundnut': 'મગફળી',
      'Soybean': 'સોયાબીન',
      'Maize': 'મકાઈ',
      'Irrigation': 'સિંચાઈ',
      'Fertilizer': 'ખાતર',
      'Harvesting': 'કાપણી',
      'Scouting': 'નિરીક્ષણ',
      'Spraying': 'છંટકાવ',
    },
  };

  let translated = text;
  const dict = DICTIONARY[locale] || {};
  for (const [enTerm, locTerm] of Object.entries(dict)) {
    translated = translated.replaceAll(enTerm, locTerm);
  }
  return translated;
}

function buildMultilingualReminderPayload(params: {
  category: 'irrigation' | 'fertilizer' | 'scouting' | 'spray' | 'harvest' | 'task_overdue' | 'crop_stage';
  cropName: string;
  fieldName: string;
  dueDateStr?: string;
  taskTitle?: string;
  stageName?: string;
  actionUrl: string;
  dedupeKey: string;
  cropCycleId?: string;
  taskId?: string;
}) {
  const { category, cropName, fieldName, dueDateStr, taskTitle, stageName, actionUrl, dedupeKey, cropCycleId, taskId } = params;

  let enTitle = '';
  let enBody = '';
  let hiTitle = '';
  let hiBody = '';
  let guTitle = '';
  let guBody = '';

  switch (category) {
    case 'irrigation':
      enTitle = `Irrigation Reminder: Water ${cropName} in ${fieldName}`;
      enBody = `Ensure adequate soil moisture in the root zone. Inspect drip lines or furrows and avoid water stagnation.`;
      hiTitle = `सिंचाई सूचना: ${fieldName} में ${cropName} को पानी दें`;
      hiBody = `जड़ क्षेत्र में उचित नमी बनाए रखें। ड्रिप नोजल या नालियां जांचें और खेत में जलभराव न होने दें।`;
      guTitle = `સિંચાઈ રીમાઇન્ડર: ${fieldName} માં ${cropName} માટે પિયત આપો`;
      guBody = `મૂળ વિસ્તારમાં પૂરતો ભેજ જાળવી રાખો. ટપક પદ્ધતિ તપાસો અને ખેતરમાં પાણી ભરાવા ન દો.`;
      break;

    case 'fertilizer':
      enTitle = `Fertilizer Application: Dose due for ${cropName} (${fieldName})`;
      enBody = `Apply the recommended balanced fertilizer dose when soil has adequate moisture for maximum nutrient uptake.`;
      hiTitle = `उर्वरक अनुप्रयोग: ${fieldName} में ${cropName} के लिए खाद देय है`;
      hiBody = `मिट्टी में पर्याप्त नमी होने पर अनुशंसित उर्वरक की खुराक डालें ताकि पौधों को पूरा पोषण मिल सके।`;
      guTitle = `ખાતર વ્યવસ્થાપન: ${fieldName} માં ${cropName} માટે ખાતર આપવાનો સમય`;
      guBody = `જમીનમાં યોગ્ય ભેજ હોય ત્યારે ભલામણ કરેલ ખાતરનો હપ્તો આપો જેથી પાક ઝડપી વૃદ્ધિ કરી શકે.`;
      break;

    case 'scouting':
      enTitle = `Crop Care Alert: Inspect ${cropName} in ${fieldName}`;
      enBody = `Examine 20 random plants across the field. Check the underside of leaves for sucking pests or foliar spots.`;
      hiTitle = `फसल निरीक्षण सूचना: ${fieldName} में ${cropName} की जांच करें`;
      hiBody = `खेत में 20 पौधों की जांच करें और पत्तियों के नीचे रस चूसक कीटों या फफूंद के धब्बों की निगरानी करें।`;
      guTitle = `પાક સંભાળ સૂચના: ${fieldName} માં ${cropName} નું નિરીક્ષણ કરો`;
      guBody = `ખેતરમાં 20 છોડનું નિરીક્ષણ કરો અને પાનની નીચે ચૂસિયા જીવાતો કે ફૂગના ટપકાં તપાસો.`;
      break;

    case 'spray':
      enTitle = `Preventive Spray Reminder: ${cropName} (${fieldName})`;
      enBody = `Perform scheduled preventive bio-pesticide or micronutrient foliar spray during calm morning hours.`;
      hiTitle = `निवारक छिड़काव सूचना: ${fieldName} में ${cropName} पर स्प्रे करें`;
      hiBody = `सुबह शांत मौसम में अनुशंसित जैव कीटनाशक या सूक्ष्म पोषक तत्वों का छिड़काव पूरा करें।`;
      guTitle = `સાવચેતી છંટકાવ સૂચના: ${fieldName} માં ${cropName} પર દવા સ્પ્રે કરો`;
      guBody = `સવારના શાંત વાતાવરણમાં ભલામણ કરેલ જૈવિક દવા અથવા પોષક તત્ત્વોનો છંટકાવ પૂર્ણ કરો.`;
      break;

    case 'harvest':
      enTitle = `Harvest Approaching: ${cropName} in ${fieldName} ready soon`;
      enBody = `Crop maturity is nearing. Prepare clean harvesting sacks, check grain/produce moisture, and halt pre-harvest chemicals.`;
      hiTitle = `कटाई की तैयारी: ${fieldName} में ${cropName} पकने के करीब है`;
      hiBody = `फसल परिपक्वता के करीब है। साफ बोरियों की व्यवस्था करें और कटाई पूर्व रसायनों का उपयोग रोकें।`;
      guTitle = `કાપણીની તૈયારી: ${fieldName} માં ${cropName} તૈયાર થવાના આરે છે`;
      guBody = `પાક પાકવાની તૈયારીમાં છે. સ્વચ્છ સંગ્રહ કોથળાઓ તૈયાર રાખો અને કાપણી પૂર્વે કોઈપણ દવાનો છંટકાવ બંધ કરો.`;
      break;

    case 'task_overdue':
      enTitle = `Overdue Field Activity: ${taskTitle || 'Pending Task'}`;
      enBody = `This critical field activity was scheduled for ${dueDateStr || 'recently'}. Complete it promptly to safeguard crop yield.`;
      hiTitle = `लंबित कार्य सूचना: ${taskTitle || 'बकाया कृषि कार्य'}`;
      hiBody = `यह महत्वपूर्ण कार्य ${dueDateStr || 'हाल ही में'} तक पूरा होना था। फसल सुरक्षा के लिए इसे तुरंत पूरा करें।`;
      guTitle = `વિલંબિત કાર્ય ચેતવણી: ${taskTitle || 'બાકી કાર્ય'}`;
      guBody = `આ મહત્વનું કૃષિ કાર્ય ${dueDateStr || 'તાજેતરમાં'} પૂર્ણ કરવાનું હતું. સારો પાક મેળવવા માટે તેને વહેલી તકે પૂર્ણ કરો.`;
      break;

    case 'crop_stage':
    default:
      enTitle = `${cropName} Stage Update: ${stageName || 'Growth Phase'} (${fieldName})`;
      enBody = `Your ${cropName} crop is entering ${stageName || 'a new phase'}. Follow recommended stage practices and scouting.`;
      hiTitle = `${cropName} विकास चरण: ${stageName || 'नई वृद्धि अवस्था'} (${fieldName})`;
      hiBody = `आपकी ${cropName} फसल ${stageName || 'नए चरण'} में प्रवेश कर रही है। अनुशंसित पद्धतियों का पालन करें।`;
      guTitle = `${cropName} વિકાસ તબક્કો: ${stageName || 'નવો તબક્કો'} (${fieldName})`;
      guBody = `તમારો ${cropName} પાક ${stageName || 'નવા તબક્કા'} માં પ્રવેશી રહ્યો છે. ભલામણ કરેલ પગલાં અનુસરો.`;
      break;
  }

  return {
    type: category === 'task_overdue' ? 'task_overdue' : category,
    titleKey: enTitle,
    bodyKey: enBody,
    paramsJson: JSON.stringify({
      dedupeKey,
      category,
      cropName,
      fieldName,
      cropCycleId,
      taskId,
      actionUrl,
      translations: {
        en: { title: enTitle, body: enBody },
        hi: { title: hiTitle, body: hiBody },
        gu: { title: guTitle, body: guBody },
      },
    }),
  };
}

export class ReminderSchedulerService {
  /**
   * Scans active CropCycles and pending Tasks for a user (or all users) and generates
   * smart, actionable agricultural reminders:
   * 1. Irrigation reminders (watering due, moisture checks)
   * 2. Fertilizer application reminders (stage-specific top dressing, dosage)
   * 3. Crop inspection & scouting reminders (pest & disease monitoring)
   * 4. Spray reminders (preventive bio-sprays & micronutrients)
   * 5. Harvesting reminders (approaching harvest dates within 14 days)
   * 6. Overdue task alerts (critical field activities past due)
   *
   * Idempotent & deduplicated using deterministic dedupeKeys.
   */
  static async scanAndGenerateCropNotifications(targetUserId?: string): Promise<ScanResultSummary> {
    const now = new Date();
    const nowMs = now.getTime();
    const todayStr = now.toISOString().slice(0, 10);

    // 1. Identify users to scan
    const userWhere: any = {};
    if (targetUserId) {
      userWhere.id = targetUserId;
    }
    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, preferredLanguage: true },
    });

    const summary: ScanResultSummary = {
      checkedCycles: 0,
      checkedTasks: 0,
      createdNotifications: 0,
    };

    for (const u of users) {
      // Fetch user's existing notifications to build deduplication index
      const existingNotifs = await prisma.notification.findMany({
        where: { userId: u.id },
        select: { id: true, paramsJson: true, titleKey: true },
      });

      const existingDedupeKeys = new Set<string>();
      for (const en of existingNotifs) {
        try {
          const p = JSON.parse(en.paramsJson || '{}');
          if (p.dedupeKey) existingDedupeKeys.add(p.dedupeKey);
        } catch {}
      }

      // Fetch active crop cycles for this user
      const cycles = await prisma.cropCycle.findMany({
        where: {
          field: { farm: { userId: u.id } },
          deletedAt: null,
          status: { notIn: ['completed', 'cancelled'] },
        },
        include: {
          field: true,
          crop: {
            include: {
              translations: true,
            },
          },
          stages: {
            include: { templateStage: true },
            orderBy: { orderIndex: 'asc' },
          },
          tasks: {
            where: { deletedAt: null },
          },
        },
      });

      summary.checkedCycles += cycles.length;

      for (const cycle of cycles) {
        const cropName =
          cycle.customCropName ||
          cycle.crop?.translations?.find((t: any) => t.locale === 'en')?.name ||
          cycle.crop?.translations?.[0]?.name ||
          cycle.crop?.slug ||
          'Crop';
        const fieldName = cycle.field?.name || 'Main Field';
        const actionUrl = `/crop-cycles/${cycle.id}`;

        // A. Evaluate Tasks for this cycle
        for (const task of cycle.tasks) {
          summary.checkedTasks++;
          if (task.status === 'completed' || task.status === 'skipped') continue;

          const taskDueMs = task.dueAt ? new Date(task.dueAt).getTime() : 0;
          const isOverdue = taskDueMs > 0 && taskDueMs < nowMs;
          const isUpcomingSoon = taskDueMs > 0 && taskDueMs >= nowMs && taskDueMs <= nowMs + 3 * 86400000;

          // 1. Overdue task alert
          if (isOverdue) {
            const overdueKey = `notif:overdue:${task.id}:${todayStr}`;
            if (!existingDedupeKeys.has(overdueKey)) {
              const payload = buildMultilingualReminderPayload({
                category: 'task_overdue',
                cropName,
                fieldName,
                taskTitle: task.title,
                dueDateStr: task.dueAt ? new Date(task.dueAt).toLocaleDateString('en-IN') : undefined,
                actionUrl: '/tasks',
                dedupeKey: overdueKey,
                cropCycleId: cycle.id,
                taskId: task.id,
              });

              await prisma.notification.create({
                data: {
                  userId: u.id,
                  type: payload.type,
                  titleKey: payload.titleKey,
                  bodyKey: payload.bodyKey,
                  paramsJson: payload.paramsJson,
                },
              });
              existingDedupeKeys.add(overdueKey);
              summary.createdNotifications++;
            }
          }

          // 2. Scheduled activity alert based on type
          if (isUpcomingSoon || isOverdue) {
            let cat: 'irrigation' | 'fertilizer' | 'scouting' | 'spray' | 'harvest' | null = null;
            if (task.type === 'irrigation') cat = 'irrigation';
            else if (task.type === 'fertilizer') cat = 'fertilizer';
            else if (task.type === 'scouting' || task.type === 'pest' || task.type === 'disease') cat = 'scouting';
            else if (task.type === 'spraying' || task.type === 'spray') cat = 'spray';
            else if (task.type === 'harvesting') cat = 'harvest';

            if (cat) {
              const taskReminderKey = `notif:${cat}:${task.id}`;
              if (!existingDedupeKeys.has(taskReminderKey)) {
                const payload = buildMultilingualReminderPayload({
                  category: cat,
                  cropName,
                  fieldName,
                  dueDateStr: task.dueAt ? new Date(task.dueAt).toLocaleDateString('en-IN') : undefined,
                  taskTitle: task.title,
                  actionUrl: '/tasks',
                  dedupeKey: taskReminderKey,
                  cropCycleId: cycle.id,
                  taskId: task.id,
                });

                await prisma.notification.create({
                  data: {
                    userId: u.id,
                    type: payload.type,
                    titleKey: payload.titleKey,
                    bodyKey: payload.bodyKey,
                    paramsJson: payload.paramsJson,
                  },
                });
                existingDedupeKeys.add(taskReminderKey);
                summary.createdNotifications++;
              }
            }
          }
        }

        // B. Check Approaching Harvest
        if (cycle.expectedHarvestDate) {
          const harvestMs = new Date(cycle.expectedHarvestDate).getTime();
          const daysUntilHarvest = Math.ceil((harvestMs - nowMs) / 86400000);

          if (daysUntilHarvest >= 0 && daysUntilHarvest <= 14) {
            const harvestApproachingKey = `notif:harvest_approaching:${cycle.id}:${Math.floor(daysUntilHarvest / 7)}`;
            if (!existingDedupeKeys.has(harvestApproachingKey)) {
              const payload = buildMultilingualReminderPayload({
                category: 'harvest',
                cropName,
                fieldName,
                actionUrl,
                dedupeKey: harvestApproachingKey,
                cropCycleId: cycle.id,
              });

              await prisma.notification.create({
                data: {
                  userId: u.id,
                  type: payload.type,
                  titleKey: payload.titleKey,
                  bodyKey: payload.bodyKey,
                  paramsJson: payload.paramsJson,
                },
              });
              existingDedupeKeys.add(harvestApproachingKey);
              summary.createdNotifications++;
            }
          }
        }

        // C. Agronomic Stage Reminders (Ensure active cycles have periodic timely guidance)
        const currentStage = cycle.stages.find((s: any) => s.status === 'current') || cycle.stages[0];
        if (currentStage) {
          const stageKey = `notif:stage_care:${cycle.id}:${currentStage.orderIndex}`;
          if (!existingDedupeKeys.has(stageKey)) {
            const payload = buildMultilingualReminderPayload({
              category: 'crop_stage',
              cropName,
              fieldName,
              stageName: currentStage.nameSnapshot,
              actionUrl,
              dedupeKey: stageKey,
              cropCycleId: cycle.id,
            });

            await prisma.notification.create({
              data: {
                userId: u.id,
                type: payload.type,
                titleKey: payload.titleKey,
                bodyKey: payload.bodyKey,
                paramsJson: payload.paramsJson,
              },
            });
            existingDedupeKeys.add(stageKey);
            summary.createdNotifications++;
          }
        }

        // D. Recurring Weekly Crop Care / Scouting Reminder for growing crops
        if (cycle.status === 'growing' || cycle.status === 'flowering' || cycle.status === 'fruiting') {
          const careKey = `notif:weekly_scouting:${cycle.id}:${todayStr.slice(0, 7)}`;
          if (!existingDedupeKeys.has(careKey)) {
            const payload = buildMultilingualReminderPayload({
              category: 'scouting',
              cropName,
              fieldName,
              actionUrl,
              dedupeKey: careKey,
              cropCycleId: cycle.id,
            });

            await prisma.notification.create({
              data: {
                userId: u.id,
                type: payload.type,
                titleKey: payload.titleKey,
                bodyKey: payload.bodyKey,
                paramsJson: payload.paramsJson,
              },
            });
            existingDedupeKeys.add(careKey);
            summary.createdNotifications++;
          }

          // Irrigation schedule check
          const irrigationKey = `notif:weekly_irrigation:${cycle.id}:${todayStr.slice(0, 7)}`;
          if (!existingDedupeKeys.has(irrigationKey)) {
            const payload = buildMultilingualReminderPayload({
              category: 'irrigation',
              cropName,
              fieldName,
              actionUrl,
              dedupeKey: irrigationKey,
              cropCycleId: cycle.id,
            });

            await prisma.notification.create({
              data: {
                userId: u.id,
                type: payload.type,
                titleKey: payload.titleKey,
                bodyKey: payload.bodyKey,
                paramsJson: payload.paramsJson,
              },
            });
            existingDedupeKeys.add(irrigationKey);
            summary.createdNotifications++;
          }
        }
      }
    }

    return summary;
  }

  static async processDueReminders(options: { userId?: string; limit?: number } = {}): Promise<ReminderRunSummary> {
    const now = new Date();
    const dueReminders = await prisma.scheduledReminder.findMany({
      where: {
        ...(options.userId ? { userId: options.userId } : {}),
        scheduledFor: { lte: now },
        status: { in: ['pending', 'failed'] },
        attempts: { lt: 3 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            preferredLanguage: true,
            timezone: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: options.limit || 50,
    });

    const summary: ReminderRunSummary = {
      checked: dueReminders.length,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    for (const rem of dueReminders) {
      let payload: Record<string, any> = {};
      try {
        payload = JSON.parse(rem.payloadJson || '{}');
      } catch {
        payload = {};
      }

      // 1. Create in-app notification once if not yet created
      if (rem.attempts === 0) {
        const notifDedupeKey = `rem:${rem.dedupeKey}`;
        const existing = await prisma.notification.findFirst({
          where: {
            userId: rem.userId,
            paramsJson: { contains: notifDedupeKey },
          },
        });

        if (!existing) {
          const userLocale = rem.user?.preferredLanguage || 'en';
          const title = translateNotificationText(rem.title, userLocale);
          const body = translateNotificationText(rem.body, userLocale);

          await prisma.notification.create({
            data: {
              userId: rem.userId,
              type: rem.category,
              titleKey: rem.title,
              bodyKey: rem.body,
              paramsJson: JSON.stringify({
                ...payload,
                dedupeKey: notifDedupeKey,
                translations: {
                  en: { title: rem.title, body: rem.body },
                  hi: { title: translateNotificationText(rem.title, 'hi'), body: translateNotificationText(rem.body, 'hi') },
                  gu: { title: translateNotificationText(rem.title, 'gu'), body: translateNotificationText(rem.body, 'gu') },
                },
              }),
            },
          });
        }
      }

      // 2. Dispatch email if user has an email address
      if (!rem.user?.email) {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: {
            status: 'skipped',
            attempts: rem.attempts + 1,
            lastError: 'No email address registered on account',
          },
        });
        summary.skipped++;
        continue;
      }

      const templateKey: any =
        rem.category === 'crop_stage'
          ? 'crop_stage'
          : rem.category === 'irrigation'
            ? 'irrigation_alert'
            : rem.category === 'weather'
              ? 'weather_alert'
              : rem.category === 'disease' || rem.category === 'pest'
                ? 'disease_alert'
                : rem.category === 'task_overdue'
                  ? 'task_overdue'
                  : 'task_reminder';

      const userTz = rem.user?.timezone || 'Asia/Kolkata';
      const dueDate = rem.scheduledFor.toLocaleDateString('en-IN', { timeZone: userTz });

      const result = await EmailService.sendTemplate({
        userId: rem.userId,
        toEmail: rem.user.email,
        templateKey,
        locale: (rem.user.preferredLanguage as any) || 'en',
        preferenceType: rem.category,
        dedupeKey: `rem:${rem.dedupeKey}`,
        data: {
          name: rem.user.name,
          title: rem.title,
          body: rem.body,
          dueDate,
          ...payload,
          actionUrl: payload.actionUrl || EmailService.getAppUrl('/tasks'),
        },
      });

      if (result.status === 'sent' || result.delivered) {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: {
            status: 'sent',
            attempts: rem.attempts + 1,
            sentAt: new Date(),
            lastError: null,
          },
        });
        summary.sent++;
      } else if (result.status === 'skipped_duplicate' || result.status === 'skipped_preference') {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: {
            status: 'skipped',
            attempts: rem.attempts + 1,
            lastError: result.status,
          },
        });
        summary.skipped++;
      } else {
        await prisma.scheduledReminder.update({
          where: { id: rem.id },
          data: {
            status: 'failed',
            attempts: rem.attempts + 1,
            lastError: result.error || 'Delivery failed',
          },
        });
        summary.failed++;
      }
    }

    return summary;
  }
}
