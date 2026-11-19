/**
 * SmartFarm AI — Grounded RAG Assistant Service (v3.0)
 *
 * Orchestrates the full Retrieval-Augmented Generation pipeline:
 * 1. Authenticates & verifies tenant data ownership.
 * 2. Normalizes user question & detects crop/topic scope.
 * 3. Gathers verified farm context (crops, DAS, stage, IoT, weather, mandi rates).
 * 4. Retrieves top-k knowledge chunks from database-backed BM25 engine.
 * 5. Handles multimodal vision input (leaf / crop disease images).
 * 6. Assembles secure agricultural expert system prompt.
 * 7. Invokes active AI Provider (Gemini / OpenAI) with fallback to Grounded Agronomy Engine.
 * 8. Validates structured response contract & rich Markdown content.
 * 9. Persists conversation and full multi-turn responses to database.
 */

import { prisma } from '@/lib/prisma';
import { AIProviderFactory } from '@/lib/ai/AIProviderFactory';
import { AIMessage } from '@/lib/ai/IAIProvider';
import { AIContextBuilder } from './AIContextBuilder';
import { KnowledgeRetrievalService, RetrievedChunk, CROP_SYNONYMS } from './KnowledgeRetrievalService';
import {
  SmartFarmAgronomyEngine,
  detectQuestionLanguage,
} from './SmartFarmAgronomyEngine';

export interface AssistantObservation {
  text: string;
  provenance: 'measured' | 'weather_service' | 'market_data' | 'knowledge_base' | 'user_profile';
}

export interface AssistantRecommendation {
  action: string;
  reason: string;
  evidence_refs: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface AssistantReference {
  title: string;
  issuingOrg: string;
  sourceUrl?: string | null;
  topic?: string | null;
}

export interface GroundedAssistantResponse {
  summary: string;
  markdown?: string;
  content?: string;
  observations: AssistantObservation[];
  recommendations: AssistantRecommendation[];
  references: AssistantReference[];
  confidence: 'high' | 'medium' | 'low';
  limitations: string[];
  language: string;
  suggestedQuestions?: string[];
  provider: {
    id: string;
    name: string;
    model: string;
    isMock: boolean;
  };
  conversationId: string;
  messageId: string;
  timestamp: string;
}

export class AssistantRagService {
  /**
   * Main RAG entry point for farmer questions.
   */
  static async ask(params: {
    userId: string;
    question: string;
    fieldId?: string | null;
    conversationId?: string | null;
    language?: 'en' | 'hi' | 'gu';
    image?: string | null; // Base64 or Data URL
  }): Promise<GroundedAssistantResponse> {
    const { userId, question, fieldId, conversationId, language = 'en', image } = params;
    const cleanQuestion = question.trim();

    if (!cleanQuestion && !image) {
      throw new Error('Question text or image is required.');
    }

    const effectiveLang = detectQuestionLanguage(cleanQuestion || 'What is wrong with my plant?', language);

    // 1. Gather verified farm context (strictly tenant-isolated, query-aware for mandi/crop)
    const farmContext = await AIContextBuilder.buildContext(userId, fieldId, cleanQuestion);
    const formattedFarmContext = AIContextBuilder.formatContextForPrompt(farmContext);

    // 2. Retrieve authoritative knowledge chunks
    const targetCrop = farmContext.cropCycle?.cropSlug || farmContext.cropCycle?.cropName || undefined;
    const retrievedChunks = await KnowledgeRetrievalService.retrieve({
      query: cleanQuestion || targetCrop || 'crop disease symptoms',
      crop: targetCrop,
      language: effectiveLang,
      limit: 4,
    });

    // 3. Load recent conversation history for multi-turn context
    let priorMessages: AIMessage[] = [];
    if (conversationId) {
      const prevConv = await prisma.assistantConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });
      if (prevConv) {
        priorMessages = prevConv.messages
          .reverse()
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      }
    }

    // Process image attachment if provided
    let imagePayload: { mimeType: string; data: string } | undefined = undefined;
    if (image && typeof image === 'string') {
      const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        imagePayload = { mimeType: match[1], data: match[2] };
      } else if (image.length > 50) {
        imagePayload = { mimeType: 'image/jpeg', data: image };
      }
    }

    // 4. Select & execute active AI Provider (or Built-in Grounded Agronomy Engine when no external LLM key)
    const provider = AIProviderFactory.getProvider();
    const providerStatus = await provider.status().catch(() => ({ isConfigured: false, isMock: true }));
    const useBuiltInGroundedEngine = provider.id === 'mock' || !providerStatus.isConfigured;

    let parsedContract: Omit<GroundedAssistantResponse, 'provider' | 'conversationId' | 'messageId' | 'timestamp'>;
    let modelUsed = 'smartfarm-agronomy-rag-v3';
    let providerNameUsed = 'SmartFarm Grounded Agronomy Engine';
    let isMockUsed = true;

    if (useBuiltInGroundedEngine) {
      parsedContract = await SmartFarmAgronomyEngine.generate({
        question: cleanQuestion,
        language: effectiveLang,
        farmContext,
        chunks: retrievedChunks,
        priorMessages,
      });
    } else {
      const formattedKnowledgeSources = this.formatKnowledgeForPrompt(retrievedChunks);
      const systemPrompt = this.buildSystemPrompt({
        farmContextText: formattedFarmContext,
        knowledgeSourcesText: formattedKnowledgeSources,
        language: effectiveLang,
      });

      const userMessage: AIMessage = {
        role: 'user',
        content: cleanQuestion || 'Please examine this crop image and diagnose the problem, symptoms, and treatment.',
        image: imagePayload,
      };

      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...priorMessages,
        userMessage,
      ];

      try {
        const aiResult = await provider.chat(messages, {
          temperature: 0.25,
          maxTokens: 2048,
          timeoutMs: 25000,
          jsonMode: true,
        });

        parsedContract = this.parseAndValidateResponse(aiResult.content, retrievedChunks, effectiveLang);
        modelUsed = aiResult.model;
        providerNameUsed = provider.name;
        isMockUsed = aiResult.isMock;

        // Strict Response Relevance Validation Gate
        const relevanceCheck = this.validateResponseRelevance(
          cleanQuestion,
          parsedContract.markdown || parsedContract.summary,
          KnowledgeRetrievalService.detectIntent(cleanQuestion)
        );

        if (!relevanceCheck.isRelevant) {
          console.warn('[AssistantRagService] LLM output failed relevance check:', relevanceCheck.reason, '— Retrying with correction prompt...');
          const correctiveMessages: AIMessage[] = [
            ...messages,
            { role: 'assistant', content: aiResult.content },
            {
              role: 'user',
              content: `CRITICAL CORRECTION: Your previous answer addressed the wrong subject. The farmer asked: "${cleanQuestion}". You MUST directly answer this question. Do not substitute any unrelated crops, government schemes, or generic IPM articles. Provide a clear, well-formatted ChatGPT-style agricultural response matching the requested schema.`,
            },
          ];

          try {
            const retryResult = await provider.chat(correctiveMessages, {
              temperature: 0.1,
              maxTokens: 2048,
              timeoutMs: 25000,
              jsonMode: true,
            });
            const retryContract = this.parseAndValidateResponse(retryResult.content, retrievedChunks, effectiveLang);
            const secondCheck = this.validateResponseRelevance(
              cleanQuestion,
              retryContract.markdown || retryContract.summary,
              KnowledgeRetrievalService.detectIntent(cleanQuestion)
            );
            if (secondCheck.isRelevant) {
              parsedContract = retryContract;
            } else {
              console.warn('[AssistantRagService] Retry still failed relevance check. Falling back to SmartFarm Grounded Agronomy Engine.');
              parsedContract = await SmartFarmAgronomyEngine.generate({
                question: cleanQuestion,
                language: effectiveLang,
                farmContext,
                chunks: retrievedChunks,
                priorMessages,
              });
              modelUsed = 'smartfarm-agronomy-rag-v3';
              providerNameUsed = 'SmartFarm Grounded Agronomy Engine';
              isMockUsed = true;
            }
          } catch {
            parsedContract = await SmartFarmAgronomyEngine.generate({
              question: cleanQuestion,
              language: effectiveLang,
              farmContext,
              chunks: retrievedChunks,
              priorMessages,
            });
            modelUsed = 'smartfarm-agronomy-rag-v3';
            providerNameUsed = 'SmartFarm Grounded Agronomy Engine';
            isMockUsed = true;
          }
        }
      } catch (err: any) {
        console.warn('[AssistantRagService] External LLM failed, falling back to SmartFarm Grounded Engine:', err.message);
        parsedContract = await SmartFarmAgronomyEngine.generate({
          question: cleanQuestion,
          language: effectiveLang,
          farmContext,
          chunks: retrievedChunks,
          priorMessages,
        });
      }
    }

    // 5. Persist conversation and message to database (strictly tenant-isolated)
    let activeConvId: string | null = null;
    if (conversationId) {
      const existingConv = await prisma.assistantConversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (existingConv) {
        activeConvId = existingConv.id;
        await prisma.assistantConversation.update({
          where: { id: existingConv.id },
          data: { updatedAt: new Date() },
        });
      }
    }

    if (!activeConvId) {
      const conv = await prisma.assistantConversation.create({
        data: {
          userId,
          title: (cleanQuestion || 'Crop Image Consultation').slice(0, 64),
        },
      });
      activeConvId = conv.id;
    }

    // Save user message
    await prisma.assistantMessage.create({
      data: {
        conversationId: activeConvId,
        role: 'user',
        content: cleanQuestion || 'Uploaded image for disease analysis',
      },
    });

    // Save assistant response with full Markdown content
    const fullContent = parsedContract.markdown || parsedContract.content || parsedContract.summary;
    const assistantMsg = await prisma.assistantMessage.create({
      data: {
        conversationId: activeConvId,
        role: 'assistant',
        content: fullContent,
        structuredJson: JSON.stringify(parsedContract),
        providerId: useBuiltInGroundedEngine ? 'smartfarm_grounded' : provider.id,
        model: modelUsed,
        confidence: parsedContract.confidence,
      },
    });

    return {
      ...parsedContract,
      markdown: fullContent,
      content: fullContent,
      provider: {
        id: useBuiltInGroundedEngine ? 'smartfarm_grounded' : provider.id,
        name: providerNameUsed,
        model: modelUsed,
        isMock: isMockUsed,
      },
      conversationId: activeConvId,
      messageId: assistantMsg.id,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Formats knowledge chunks as delimited untrusted data blocks.
   */
  private static formatKnowledgeForPrompt(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return 'No specific extension publication chunks matched for this query.';
    }

    const blocks: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      blocks.push(
        `<source_document index="${i + 1}" title="${c.title}" issuing_org="${c.issuingOrg}" license="${c.license}">\n${c.content}\n</source_document>`
      );
    }
    return blocks.join('\n\n');
  }

  /**
   * Validates whether generated response actually addresses the question rather than an unrelated topic.
   */
  private static validateResponseRelevance(
    question: string,
    responseMarkdown: string,
    intent: string
  ): { isRelevant: boolean; reason?: string } {
    const qLower = question.toLowerCase();
    const respLower = responseMarkdown.toLowerCase();

    // 1. If question is about a specific crop (e.g. potato), response MUST mention that crop!
    const crop = KnowledgeRetrievalService.detectCrop(question);
    if (crop) {
      const synonyms: string[] = CROP_SYNONYMS[crop] || [crop];
      const mentionsCrop = synonyms.some((s: string) => respLower.includes(s.toLowerCase()));
      if (!mentionsCrop) {
        return { isRelevant: false, reason: `Response does not address requested crop: ${crop}` };
      }
    }

    // 2. If question is about seasonal crop selection (winter, rabi, sowing season)
    if (intent === 'crop_selection' || qLower.includes('winter') || qLower.includes('rabi') || qLower.includes('season')) {
      const mentionsCrops =
        respLower.includes('wheat') ||
        respLower.includes('mustard') ||
        respLower.includes('chickpea') ||
        respLower.includes('gram') ||
        respLower.includes('potato') ||
        respLower.includes('winter') ||
        respLower.includes('rabi');
      if (!mentionsCrops) {
        return { isRelevant: false, reason: 'Response does not provide seasonal crop recommendations' };
      }
    }

    // 3. Prevent unsolicited government schemes from being substituted for crop advice
    if (!qLower.includes('pm-kisan') && !qLower.includes('pmfby') && !qLower.includes('insurance') && !qLower.includes('kcc') && !qLower.includes('yojana')) {
      if (respLower.includes('pm-kisan') && respLower.includes('kisan credit card') && !crop) {
        return { isRelevant: false, reason: 'Unsolicited government scheme substituted for crop advice' };
      }
    }

    return { isRelevant: true };
  }

  /**
   * Builds the grounding system prompt with safety constraints and ChatGPT formatting rules.
   */
  private static buildSystemPrompt(params: {
    farmContextText: string;
    knowledgeSourcesText: string;
    language: string;
  }): string {
    return `You are SmartFarm AI, an intelligent, context-aware agricultural expert.

Your primary responsibility is to understand and directly answer the user's actual question.

### Core Principles:
1. Answer the exact question first.
2. Never substitute another agricultural topic.
3. Never insert unrelated government schemes, diseases, fertilizer advice, or pest management information unless asked.
4. Never use a fixed answer for different questions. Generate every answer dynamically according to the user's intent.
5. Use retrieved information from <knowledge_sources> ONLY when it directly relates to the question and crop being discussed. If no relevant sources are available or if they discuss unrelated topics, use your verified general agricultural knowledge and directly answer the user's question.
6. Never fabricate agricultural facts or dosages.
7. Explain technical terms in simple language.
8. Maintain the language of the user's question (${params.language === 'gu' ? 'Gujarati' : params.language === 'hi' ? 'Hindi' : 'English'}).
9. Understand conversation history and follow-up questions (pronouns like "it", "this fertilizer", "its irrigation").

### Dynamic Question-Adaptive Formatting:
- When the user asks for CROP DETAILS (e.g. "Can you give me details about potato?"):
  Use structure:
  # 🥔 [Crop Name] – Complete Crop Guide
  **1. About the Crop**
  **2. Suitable Climate and Soil**
  **3. Best Sowing Season** (consider user's location)
  **4. Popular Varieties**
  **5. Land Preparation**
  **6. Seed and Planting**
  **7. Fertilizer Management**
  **8. Irrigation**
  **9. Common Diseases and Pests**
  **10. Harvesting and Storage**
  **11. Expert Tip**
  End with a short summary.

- When the user asks about SEASONAL CROP SELECTION (e.g. "In winter season, what type of crop can I sow?"):
  Use structure:
  # 🌱 Best Crops to Grow in [Season]
  **1. Recommended Crops**
  Include a clean Markdown table:
  | Crop | Category | Key Considerations |
  | Wheat | Cereal | Sowing window, temperature |
  | Mustard | Oilseed | Drought-tolerant, 2 light irrigations |
  | Chickpea | Pulse | Nitrogen-fixing, residual moisture |
  | Peas | Vegetable | Cool-season, fast 65-75 days |
  | Potato | Tuber crop | Sandy loam, earthing up, high yield |
  | Onion | Vegetable | Regional variety, nursery timing |
  **2. Which Crop Is Suitable for Your Region?**
  **3. Important Farming Considerations** (Soil, irrigation, duration)
  **4. Expert Recommendation**

- When the user asks about PLANT DISEASE:
  Structure: Possible Disease, Visible Symptoms, Possible Causes, How to Confirm, Preventive Measures, Treatment Options (IPM & safe CIB&RC options), Safety Precautions. Advise uploading a leaf photo if visual confirmation helps.

- When the user asks about FERTILIZER:
  Structure: Crop and Growth Stage, Nutrients Required, Fertilizer Options (DAP, NPK, Urea, MOP), Timing and Application Method, Soil Testing Considerations, Precautions (never mix Zinc with DAP).

- When the user asks a SIMPLE DEFINITION / SHORT QUESTION:
  Give a short, clear, direct answer. Do NOT generate an unnecessary 10-section response.

### JSON Output Contract:
Return a valid JSON object matching this schema:
{
  "summary": "Direct, concise answer in 2-3 sentences",
  "markdown": "Complete, beautifully formatted ChatGPT-style Markdown answer matching the adaptive structure above.",
  "observations": [{ "text": "Specific agricultural fact", "provenance": "measured | weather_service | market_data | knowledge_base | user_profile" }],
  "recommendations": [{ "action": "Actionable step", "reason": "Why this step is needed", "evidence_refs": ["Authoritative source or rule"], "priority": "high | medium | low" }],
  "references": [{ "title": "Authoritative publication or university source", "issuingOrg": "Issuing organization", "topic": "topic" }],
  "confidence": "high | medium | low",
  "limitations": ["Verification or local condition caveat"],
  "language": "${params.language}",
  "suggestedQuestions": ["Specific relevant follow-up 1", "Specific relevant follow-up 2", "Specific relevant follow-up 3"]
}

<farm_context>
${params.farmContextText}
</farm_context>

<knowledge_sources>
${params.knowledgeSourcesText}
</knowledge_sources>
`;
  }

  /**
   * Parses JSON response from LLM and validates against schema.
   */
  private static parseAndValidateResponse(
    rawText: string,
    chunks: RetrievedChunk[],
    language: string
  ): Omit<GroundedAssistantResponse, 'provider' | 'conversationId' | 'messageId' | 'timestamp'> {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let json: any = null;
    try {
      json = JSON.parse(clean);
    } catch {
      // Try extracting JSON block if wrapped in comments or text
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          json = JSON.parse(match[0]);
        } catch {
          // If malformed, extract markdown or summary via regex
          const mdMatch = clean.match(/"markdown"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"[a-zA-Z]+"|"\s*\}|$)/);
          const sumMatch = clean.match(/"summary"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"[a-zA-Z]+"|"\s*\}|$)/);
          if (mdMatch || sumMatch) {
            const rawMd = mdMatch ? mdMatch[1] : (sumMatch ? sumMatch[1] : '');
            json = {
              markdown: rawMd.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
              summary: sumMatch ? sumMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : undefined,
            };
          }
        }
      }
    }

    if (json) {
      const references: AssistantReference[] = (json.references || []).length > 0
        ? json.references
        : chunks.map((c) => ({
            title: c.documentTitle || c.title,
            issuingOrg: c.issuingOrg,
            sourceUrl: c.sourceUrl || null,
            topic: c.topic || null,
          }));

      let markdown = json.markdown || json.content || json.summary || 'Agricultural decision-support guidance.';
      // Clean and normalize escaped markdown
      markdown = markdown
        .replace(/\\(\*\*|\*|#|-|_|`|\[|\]|\(|\)|\|)/g, '$1')
        .replace(/\\\\(\*\*|\*|#|-|_|`|\[|\]|\(|\)|\|)/g, '$1');

      let summary = (json.summary || markdown.split('\n\n')[0].replace(/[*#]/g, '').slice(0, 300))
        .replace(/\\(\*\*|\*|#|-|_|`|\[|\]|\(|\)|\|)/g, '$1');

      return {
        summary,
        markdown,
        content: markdown,
        observations: Array.isArray(json.observations) ? json.observations : [],
        recommendations: Array.isArray(json.recommendations) ? json.recommendations : [],
        references,
        confidence: ['high', 'medium', 'low'].includes(json.confidence) ? json.confidence : 'high',
        limitations: Array.isArray(json.limitations)
          ? json.limitations
          : [
              'Verify field symptoms with physical inspection before applying treatments.',
              'Follow chemical product labels for registered usage and dosage.',
            ],
        language: json.language || language,
        suggestedQuestions: Array.isArray(json.suggestedQuestions) ? json.suggestedQuestions : undefined,
      };
    } else {
      // If LLM returned direct rich Markdown text rather than valid JSON
      let cleanMd = clean
        .replace(/\\(\*\*|\*|#|-|_|`|\[|\]|\(|\)|\|)/g, '$1')
        .replace(/\\\\(\*\*|\*|#|-|_|`|\[|\]|\(|\)|\|)/g, '$1');

      // Strip any stray outer JSON delimiters if partial
      if (cleanMd.startsWith('{') && cleanMd.includes('"summary"')) {
        cleanMd = cleanMd
          .replace(/^[{\s]*"(summary|markdown|content)"\s*:\s*"/, '')
          .replace(/"\s*,\s*"[a-zA-Z]+":[\s\S]*$/, '')
          .replace(/["}\s]*$/, '')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
      }

      const summary = cleanMd.split('\n\n')[0].replace(/[*#]/g, '').trim().slice(0, 300) || cleanMd.slice(0, 300);
      return {
        summary,
        markdown: cleanMd,
        content: cleanMd,
        observations: [{ text: 'Grounded against current farm profile and extension guidelines.', provenance: 'knowledge_base' }],
        recommendations: [
          {
            action: 'Follow verified extension recommendations for your crop stage',
            reason: 'Ensures optimal crop growth and nutrient utilization.',
            evidence_refs: ['ICAR Package of Practices'],
            priority: 'high',
          },
        ],
        references: chunks.map((c) => ({
          title: c.documentTitle || c.title,
          issuingOrg: c.issuingOrg,
          sourceUrl: c.sourceUrl || null,
          topic: c.topic || null,
        })),
        confidence: 'high',
        limitations: [
          'Always verify in-person with a certified agricultural extension officer or local KVK.',
          'Never use unregistered or banned chemicals; follow printed CIB&RC labels.',
        ],
        language,
        suggestedQuestions: [
          'What is the best way to cultivate wheat?',
          'Which fertilizer is suitable for cotton?',
          'How can I improve soil fertility naturally?',
        ],
      };
    }
  }
}
