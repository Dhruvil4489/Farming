const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const tables = [
  'user','role','farm','field','crop','cropCycle','task','weatherRecord',
  'marketCommodity','marketLocation','marketPriceObservation','marketSyncLog',
  'soilProfile','soilTest','soilParameter','farmObservation','irrigationRecord',
  'cropDiagnosisRecord','iotDevice','iotTelemetryReading','iotDeviceEvent',
  'knowledgeDocument','knowledgeChunk','assistantConversation','assistantMessage',
  'fertilizerCategory','cropFertilizerGuidance','product','productCategory','productBrand',
  'cartItem','order','orderItem','auditLog','notification','file',
  'soilMoistureObservation','farmSensorMoisture','advisoryRule',
  'permission','userRole','rolePermission','notificationPreference',
  'cropTranslation','cropVariety','cropStage','cropStageTranslation',
  'cropStageAdvisory','cropStageAdvisoryTranslation','cycleStage','soilReport'
];

(async () => {
  for (const t of tables) {
    try {
      const c = await p[t].count();
      console.log(t + ': ' + c);
    } catch (e) {
      console.log(t + ': ERROR - ' + e.message.split('\n')[0]);
    }
  }
  await p.$disconnect();
})();
