import path from 'path';
import { createJiti } from 'jiti';

const jiti = createJiti(process.cwd(), { alias: { '@': path.resolve('./src') } });
const { AssistantRagService } = jiti(path.resolve('./src/services/AssistantRagService.ts'));
const { prisma } = jiti(path.resolve('./src/lib/prisma.ts'));

async function runTests() {
  console.log('\n========================================================================');
  console.log('  SmartFarm AI — Regression Verification Suite for Critical Bug Fixes');
  console.log('========================================================================\n');

  const farmer = await prisma.user.findFirst({
    where: { email: 'farmer@smartfarm.ai' },
    select: { id: true, name: true, email: true },
  });

  if (!farmer) {
    console.error('Error: Farmer account not found.');
    process.exit(1);
  }

  console.log(`Using Farmer Account: ${farmer.name} (${farmer.email}) | ID: ${farmer.id}\n`);

  let convId = null;
  let passedCount = 0;
  let failedCount = 0;

  const testCases = [
    {
      id: 'TEST 1',
      name: 'Details about Potato',
      query: 'Can you give me the details about potato?',
      expectIncludes: ['Potato', 'Kufri', 'Earthing', 'Sowing', 'Climate'],
      rejectIncludes: ['PMFBY', 'KCC', 'Crop Insurance', 'Integrated Pest Management (IPM): The 5 Essential Pillars'],
    },
    {
      id: 'TEST 2',
      name: 'Winter Season Crop Selection',
      query: 'In winter season, what type of crop can I sow?',
      expectIncludes: ['Wheat', 'Mustard', 'Chickpea', 'Winter', 'Rabi'],
      rejectIncludes: ['PMFBY', 'KCC', 'Crop Insurance', 'PM-KISAN'],
    },
    {
      id: 'TEST 3',
      name: 'Common Diseases in Potato',
      query: 'What are the common diseases in potato?',
      expectIncludes: ['Late Blight', 'Early Blight', 'Phytophthora', 'Mancozeb'],
      rejectIncludes: ['PMFBY', 'KCC', 'Insurance'],
    },
    {
      id: 'TEST 4',
      name: 'Fertilizer for Potato',
      query: 'Which fertilizer is suitable for potato?',
      expectIncludes: ['Potato', 'Fertilizer', 'Potash'],
      rejectIncludes: ['PMFBY', 'Crop Insurance'],
    },
    {
      id: 'TEST 5',
      name: 'Improve Wheat Production',
      query: 'How can I improve wheat production?',
      expectIncludes: ['Wheat', 'Irrigation'],
      rejectIncludes: ['PMFBY'],
    },
    {
      id: 'TEST 6',
      name: 'What is PM-KISAN',
      query: 'What is PM-KISAN?',
      expectIncludes: ['PM-KISAN', '6,000', 'Installment'],
      rejectIncludes: ['CRI stage', 'Potato Late Blight'],
    },
    {
      id: 'TEST 7',
      name: 'Explain Previous in Gujarati (Follow-up to PM-KISAN)',
      query: 'Explain the same in Gujarati.',
      expectIncludes: ['કિસાન', 'યોજના'],
      rejectIncludes: ['Cotton', 'CRI stage'],
    },
    {
      id: 'TEST 8',
      name: 'What about its irrigation? (Contextual Follow-up)',
      query: 'What about its irrigation?',
      contextSetup: 'Can you give me the details about potato?',
      expectIncludes: ['Irrigation', 'Potato', 'Water'],
      rejectIncludes: ['PMFBY', 'KCC'],
    },
    {
      id: 'TEST 9',
      name: 'Can I grow potato in Gujarat?',
      query: 'Can I grow potato in Gujarat?',
      expectIncludes: ['Gujarat', 'Potato'],
      rejectIncludes: ['PMFBY', 'KCC'],
    },
    {
      id: 'TEST 10',
      name: 'Tell me about tomato',
      query: 'Tell me about tomato.',
      expectIncludes: ['Tomato', 'Crop', 'Soil'],
      rejectIncludes: ['Potato', 'Cotton in Main Plot is 45 days'],
    },
  ];

  for (const tc of testCases) {
    process.stdout.write(`  [${tc.id}] ${tc.name.padEnd(46)} ... `);

    let activeConversation = convId;
    if (tc.contextSetup) {
      // Create separate conversation with prior context for follow-up testing
      const priorResp = await AssistantRagService.ask({
        userId: farmer.id,
        question: tc.contextSetup,
        language: 'en',
      });
      activeConversation = priorResp.conversationId;
    } else if (tc.id === 'TEST 1') {
      activeConversation = null;
    } else if (tc.id === 'TEST 6') {
      // Start fresh for PM-KISAN sequence
      activeConversation = null;
    }

    try {
      const resp = await AssistantRagService.ask({
        userId: farmer.id,
        question: tc.query,
        language: 'en',
        conversationId: activeConversation || undefined,
      });

      if (!tc.contextSetup) {
        convId = resp.conversationId;
      }

      const answer = (resp.markdown || resp.content || resp.summary || '').toLowerCase();
      const rawAnswer = resp.markdown || resp.content || resp.summary || '';

      // Check escaped backslashes (must NOT contain \*\* or \---)
      const hasEscapedAsterisks = rawAnswer.includes('\\*\\*');
      const hasEscapedDashes = rawAnswer.includes('\\---');

      const missingExpects = tc.expectIncludes.filter((e) => !answer.includes(e.toLowerCase()));
      const foundRejects = tc.rejectIncludes.filter((r) => answer.includes(r.toLowerCase()));

      if (missingExpects.length > 0 || foundRejects.length > 0 || hasEscapedAsterisks || hasEscapedDashes) {
        console.log('❌ FAILED');
        if (missingExpects.length > 0) {
          console.log(`    Missing expected terms: [${missingExpects.join(', ')}]`);
        }
        if (foundRejects.length > 0) {
          console.log(`    Found rejected terms: [${foundRejects.join(', ')}]`);
        }
        if (hasEscapedAsterisks) {
          console.log('    Found escaped asterisks: \\*\\* in output');
        }
        if (hasEscapedDashes) {
          console.log('    Found escaped horizontal rule: \\--- in output');
        }
        console.log(`    Model used: ${resp.provider.model} (${resp.provider.name})`);
        console.log(`    Answer snippet: ${rawAnswer.slice(0, 220)}...\n`);
        failedCount++;
      } else {
        console.log(`✔ PASSED (${resp.provider.model})`);
        passedCount++;
      }
    } catch (err) {
      console.log('❌ ERROR:', err.message);
      failedCount++;
    }
  }

  console.log('\n========================================================================');
  console.log(`  RESULT: ${passedCount} PASSED, ${failedCount} FAILED (${Math.round((passedCount / (passedCount + failedCount)) * 100)}% Success)`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
