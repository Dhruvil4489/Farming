/**
 * SmartFarm AI — Comprehensive AI Agriculture Assistant Evaluation Suite
 *
 * Tests all 14 required questions and edge cases specified in the prompt:
 * 1. Cultivation of wheat
 * 2. Cotton fertilizer suitability
 * 3. Tomato yellow leaves diagnosis
 * 4. Whitefly control in chilli
 * 5. Difference between DAP and NPK
 * 6. Rice crop water requirements
 * 7. Suitable crops for Gujarat climate
 * 8. Improving soil fertility naturally
 * 9. Heavy rainfall crop recovery
 * 10. Integrated pest management (IPM)
 * 11. PM-KISAN eligibility
 * 12. Gujarati explanation of prior answer
 * 13. Fertilizer timing follow-up
 * 14. Fertilizer mixing compatibility
 * + Edge cases (unrelated queries, ambiguous queries, rain risk, banned chemical, native scripts)
 */

import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);
const jiti = require('jiti')(process.cwd(), { alias: { '@': path.resolve('./src') } });

const { AssistantRagService } = jiti('./src/services/AssistantRagService.ts');
const prisma = new PrismaClient();

async function runSuite() {
  console.log('\n========================================================================');
  console.log('  SmartFarm AI — Upgraded Agricultural Assistant Full Evaluation Suite');
  console.log('========================================================================\n');

  // Verify farmer user exists
  let farmer = await prisma.user.findFirst({ where: { email: 'farmer@smartfarm.ai' } });
  if (!farmer) {
    farmer = await prisma.user.findFirst();
  }
  assert.ok(farmer, 'Farmer user must exist in database');
  console.log(`Using Farmer Account: ${farmer.name} (${farmer.email}) | ID: ${farmer.id}\n`);

  let passed = 0;
  let failed = 0;
  const recordedResponses = [];

  async function testCase(num, title, fn) {
    process.stdout.write(`  [Test ${num.padEnd(2)}] ${title.padEnd(60)}... `);
    try {
      const res = await fn();
      assert.ok(res, 'Response must not be null');
      assert.ok(res.summary, 'Summary must exist');
      assert.ok(res.content || res.markdown, 'Rich content/markdown must exist');
      assert.ok(res.recommendations && res.recommendations.length > 0, 'Recommendations must exist');
      assert.ok(res.confidence, 'Confidence must exist');

      recordedResponses.push({
        num,
        title,
        question: res._question,
        summary: res.summary,
        preview: (res.markdown || res.content).slice(0, 160).replace(/\n/g, ' '),
      });

      console.log('✔ PASSED');
      passed++;
      return res;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
      throw err;
    }
  }

  let conversationId = null;

  // 1. Wheat Cultivation
  await testCase('1', 'Cultivate Wheat Guide', async () => {
    const q = 'What is the best way to cultivate wheat?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('wheat') || res.content.toLowerCase().includes('gw-496'));
    assert.ok(res.content.toLowerCase().includes('cri') || res.content.toLowerCase().includes('irrigation'));
    assert.ok(res.content.toLowerCase().includes('sowing') || res.content.toLowerCase().includes('variety'));
    return res;
  });

  // 2. Cotton Fertilizer
  const cottonRes = await testCase('2', 'Cotton Fertilizer Suitability', async () => {
    const q = 'Which fertilizer is suitable for cotton?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    conversationId = res.conversationId;
    assert.ok(res.content.toLowerCase().includes('cotton') || res.content.toLowerCase().includes('kapas'));
    assert.ok(res.content.toLowerCase().includes('npk') || res.content.toLowerCase().includes('dap'));
    assert.ok(res.content.toLowerCase().includes('urea') || res.content.toLowerCase().includes('split'));
    return res;
  });

  // 13. Fertilizer Timing Follow-Up (Uses conversationId from Test 2!)
  await testCase('13', 'Follow-Up: When to apply the fertilizer mentioned earlier?', async () => {
    const q = 'When should I apply the fertilizer you mentioned earlier?';
    const res = await AssistantRagService.ask({
      userId: farmer.id,
      question: q,
      conversationId,
    });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('cotton') || res.content.toLowerCase().includes('schedule') || res.content.toLowerCase().includes('timing'));
    assert.ok(res.content.toLowerCase().includes('basal') || res.content.toLowerCase().includes('flowering') || res.content.toLowerCase().includes('square'));
    return res;
  });

  // Follow-up rain risk
  await testCase('F1', 'Follow-Up: What if it rains tomorrow?', async () => {
    const q = 'What if it rains tomorrow?';
    const res = await AssistantRagService.ask({
      userId: farmer.id,
      question: q,
      conversationId,
    });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('rain') || res.content.toLowerCase().includes('leaching') || res.content.toLowerCase().includes('postpone'));
    return res;
  });

  // 3. Tomato Yellow Leaves
  await testCase('3', 'Tomato Leaves Turning Yellow Diagnosis', async () => {
    const q = 'Why are tomato leaves turning yellow?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('tomato'));
    assert.ok(res.content.toLowerCase().includes('nitrogen') || res.content.toLowerCase().includes('magnesium') || res.content.toLowerCase().includes('blight'));
    assert.ok(res.content.toLowerCase().includes('whitefly') || res.content.toLowerCase().includes('leaf curl') || res.content.toLowerCase().includes('yellow'));
    return res;
  });

  // 4. Whiteflies in Chilli
  await testCase('4', 'Whiteflies in Chilli Crops Control', async () => {
    const q = 'How can I control whiteflies in chilli crops?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('chilli') || res.content.toLowerCase().includes('mirch'));
    assert.ok(res.content.toLowerCase().includes('sticky trap') || res.content.toLowerCase().includes('yellow'));
    assert.ok(res.content.toLowerCase().includes('neem') || res.content.toLowerCase().includes('leaf curl'));
    return res;
  });

  // 5. DAP vs NPK Comparison
  await testCase('5', 'Difference Between DAP and NPK Comparison Table', async () => {
    const q = 'What is the difference between DAP and NPK?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.includes('DAP') && res.content.includes('NPK'));
    assert.ok(res.content.includes('|') || res.content.toLowerCase().includes('potassium') || res.content.toLowerCase().includes('potash'));
    assert.ok(res.content.includes('18%') || res.content.includes('46%') || res.content.toLowerCase().includes('basal'));
    return res;
  });

  // 6. Rice Water Requirements
  await testCase('6', 'Rice Crop Water Requirements & AWD Irrigation', async () => {
    const q = 'How much water does a rice crop require?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('rice') || res.content.toLowerCase().includes('paddy'));
    assert.ok(res.content.toLowerCase().includes('1000') || res.content.toLowerCase().includes('1500') || res.content.toLowerCase().includes('awd'));
    assert.ok(res.content.toLowerCase().includes('panicle') || res.content.toLowerCase().includes('flowering') || res.content.toLowerCase().includes('wetting'));
    return res;
  });

  // 7. Suitable Crops for Gujarat
  await testCase('7', 'Suitable Crops for Gujarat Climate Zones', async () => {
    const q = "Which crops are suitable for Gujarat's climate?";
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('gujarat'));
    assert.ok(res.content.toLowerCase().includes('cotton') || res.content.toLowerCase().includes('groundnut'));
    assert.ok(res.content.toLowerCase().includes('wheat') || res.content.toLowerCase().includes('cumin') || res.content.toLowerCase().includes('kharif'));
    return res;
  });

  // 8. Improve Soil Fertility Naturally
  await testCase('8', 'Improve Soil Fertility Naturally Practices', async () => {
    const q = 'How can I improve soil fertility naturally?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('fym') || res.content.toLowerCase().includes('manure') || res.content.toLowerCase().includes('vermicompost'));
    assert.ok(res.content.toLowerCase().includes('dhaincha') || res.content.toLowerCase().includes('green manure') || res.content.toLowerCase().includes('biofertilizer'));
    return res;
  });

  // 9. Heavy Rainfall Recovery
  await testCase('9', 'Crop Affected by Heavy Rainfall Emergency Action', async () => {
    const q = 'What should I do if my crop is affected by heavy rainfall?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('drainage') || res.content.toLowerCase().includes('standing water'));
    assert.ok(res.content.toLowerCase().includes('foliar') || res.content.toLowerCase().includes('urea') || res.content.toLowerCase().includes('rot'));
    return res;
  });

  // 10. Integrated Pest Management
  await testCase('10', 'What is Integrated Pest Management (IPM)?', async () => {
    const q = 'What is integrated pest management?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('cultural') || res.content.toLowerCase().includes('biological'));
    assert.ok(res.content.toLowerCase().includes('etl') || res.content.toLowerCase().includes('threshold'));
    assert.ok(res.content.toLowerCase().includes('chemical') || res.content.toLowerCase().includes('last resort'));
    return res;
  });

  // 11. PM-KISAN Eligibility
  await testCase('11', 'Explain PM-KISAN Eligibility Criteria & Exclusions', async () => {
    const q = 'Explain PM-KISAN eligibility.';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.includes('6,000') || res.content.includes('2,000'));
    assert.ok(res.content.toLowerCase().includes('landholder') || res.content.toLowerCase().includes('cultivable'));
    assert.ok(res.content.toLowerCase().includes('exclusion') || res.content.toLowerCase().includes('ekyc') || res.content.toLowerCase().includes('income tax'));
    return res;
  });

  // 12. Gujarati Explanation
  await testCase('12', 'Explain Previous Answer in Simple Gujarati', async () => {
    const q = 'Explain the previous answer in simple Gujarati.';
    const res = await AssistantRagService.ask({
      userId: farmer.id,
      question: q,
      conversationId,
      language: 'gu',
    });
    res._question = q;
    assert.strictEqual(res.language, 'gu');
    assert.ok(/[\u0A80-\u0AFF]/.test(res.content));
    assert.ok(res.content.includes('ખાતર') || res.content.includes('જમીન') || res.content.includes('પાક'));
    return res;
  });

  // 14. Fertilizer Mixing Compatibility
  await testCase('14', 'Can I Mix Two Fertilizers Together? Compatibility Rules', async () => {
    const q = 'Can I mix two fertilizers together?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('zinc') && res.content.toLowerCase().includes('dap'));
    assert.ok(res.content.toLowerCase().includes('calcium') || res.content.toLowerCase().includes('precipitate'));
    assert.ok(res.content.toLowerCase().includes('urea') && res.content.toLowerCase().includes('mop'));
    return res;
  });

  // Edge Case E1: Unrelated query
  await testCase('E1', 'Unrelated Query Defense (Cricket World Cup)', async () => {
    const q = 'Who won the cricket world cup?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('agriculture') || res.content.toLowerCase().includes('farming') || res.content.toLowerCase().includes('scope'));
    return res;
  });

  // Edge Case E2: Ambiguous query
  await testCase('E2', 'Ambiguous Query Handling', async () => {
    const q = 'My leaves are turning yellow';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('crop') || res.content.toLowerCase().includes('symptom') || res.content.toLowerCase().includes('which'));
    return res;
  });

  // Edge Case E3: Banned Chemical Warning
  await testCase('E3', 'Banned Pesticide Interception (Monocrotophos on tomato)', async () => {
    const q = 'Can I spray Monocrotophos on my tomato crop?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q });
    res._question = q;
    assert.ok(res.content.toLowerCase().includes('banned') || res.content.toLowerCase().includes('stop') || res.content.toLowerCase().includes('prohibited'));
    assert.ok(res.content.toLowerCase().includes('cib&rc') || res.content.toLowerCase().includes('toxicity'));
    return res;
  });

  // Edge Case E4: Native Gujarati Query
  await testCase('E4', 'Native Gujarati Query (કપાસના પાકમાં ખાતર)', async () => {
    const q = 'કપાસના પાક માટે કયું ખાતર યોગ્ય છે?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q, language: 'gu' });
    res._question = q;
    assert.strictEqual(res.language, 'gu');
    assert.ok(/[\u0A80-\u0AFF]/.test(res.content));
    assert.ok(res.content.includes('કપાસ') || res.content.includes('ખાતર') || res.content.includes('યુરિયા'));
    return res;
  });

  // Edge Case E5: Native Hindi Query
  await testCase('E5', 'Native Hindi Query (टमाटर के पत्ते पीले क्यों हैं)', async () => {
    const q = 'टमाटर के पत्ते पीले क्यों हो रहे हैं?';
    const res = await AssistantRagService.ask({ userId: farmer.id, question: q, language: 'hi' });
    res._question = q;
    assert.strictEqual(res.language, 'hi');
    assert.ok(/[\u0900-\u097F]/.test(res.content));
    assert.ok(res.content.includes('टमाटर') || res.content.includes('पीले') || res.content.includes('नाइट्रोजन'));
    return res;
  });

  // Edge Case E6: Crop Image Analysis
  await testCase('E6', 'Crop Image Analysis Attachment', async () => {
    const dummyBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const res = await AssistantRagService.ask({
      userId: farmer.id,
      question: 'What is wrong with my plant? Please analyze this image.',
      image: dummyBase64,
    });
    res._question = 'What is wrong with my plant? [Image]';
    assert.ok(res.content);
    assert.ok(res.summary);
    return res;
  });

  // Diversity Check: Assert that every response is unique and different!
  console.log('\n── Response Diversity & Uniqueness Verification ──────────');
  const summaries = recordedResponses.map((r) => r.summary);
  const uniqueSummaries = new Set(summaries);
  console.log(`Total Test Runs: ${summaries.length} | Unique Responses: ${uniqueSummaries.size}`);

  recordedResponses.forEach((r) => {
    console.log(`\n  [${r.num}] ${r.title}`);
    console.log(`      Q: "${r.question}"`);
    console.log(`      A Preview: ${r.preview}...`);
  });

  assert.strictEqual(
    uniqueSummaries.size,
    summaries.length,
    'Every single question must produce a unique, tailored response (NO repetitive or canned responses!)'
  );
  console.log('\n✔ ZERO REPETITIVE RESPONSES: All 20 evaluated questions produced distinct, tailored agronomy intelligence!\n');

  console.log('========================================================================');
  console.log(`  EVALUATION SUMMARY: ${passed} PASSED, ${failed} FAILED (100% SUCCESS)`);
  console.log('========================================================================\n');
}

runSuite()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
