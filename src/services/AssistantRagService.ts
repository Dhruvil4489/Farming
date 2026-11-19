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
import { KnowledgeRetrievalService, RetrievedChunk } from './KnowledgeRetrievalService';
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
   * Builds the grounding system prompt with safety constraints and ChatGPT formatting rules.
   */
  private static buildSystemPrompt(params: {
    farmContextText: string;
    knowledgeSourcesText: string;
    language: string;
  }): string {
    return `You are SmartFarm AI, an expert Senior Agricultural Decision-Support Assistant for Indian farmers.
Your mission is to provide evidence-grounded, practical, transparent, and easy-to-understand farming recommendations.

### RESPONSE FORMATTING RULES (CHATGPT-STYLE FOR FARMERS):
1. **Dynamic Structure:** Adapt your structure to the question:
   - For Cultivation & Yield: Use step-by-step numbered sections (Variety, Soil, Sowing, Fertilizers, Irrigation, Pest IPM, Expert Tip, Summary).
   - For Disease & Pests: Explain Symptoms, Possible Causes, Why it occurs, Preventive measures, Safe treatment options, and suggest uploading a leaf photo.
   - For Comparisons (e.g. DAP vs NPK): Use clean Markdown comparison tables.
   - For Fertilizers: Detail nutrient roles, split timing by crop growth stage, and warnings against improper mixing.
   - For Definitions / Short Queries: Give clear, concise answers without fluff.
2. **Easy for Ordinary Farmers:** Use simple language. Explain technical terms simply (e.g., CRI stage = Crown Root Initiation / जड़ फूटने की अवस्था / મૂળ ફૂટવાની અવસ્થા).
3. **Multilingual Fluency:** Respond naturally in ${params.language === 'gu' ? 'Gujarati' : params.language === 'hi' ? 'Hindi' : 'English'}.

### CRITICAL SAFETY & GROUNDING RULES:
1. **ZERO FABRICATED DOSAGES:** Never invent chemical pesticide/herbicide dosages. Cite registered CIB&RC label recommendations or advise consulting the local KVK / Agriculture Officer.
2. **NO BANNED CHEMICALS:** Never recommend banned or restricted chemicals in India (e.g., Monocrotophos on vegetables, Endosulfan, Benomyl, etc.).
3. **FERTILIZER COMPATIBILITY:** Never recommend mixing Zinc Sulphate with DAP/SSP or Calcium Nitrate with Phosphates/Sulphates (causes chemical precipitation).
4. **FACTUAL GROUNDING:** Ground advice in the provided <farm_context> and <knowledge_sources>.
5. **OUTPUT CONTRACT:** Return a valid JSON object matching this schema:
{
  "summary": "Clear, concise direct answer to the farmer in 2-3 sentences",
  "markdown": "Complete, comprehensive, beautifully formatted ChatGPT-style Markdown answer with emoji headers, bullet points, comparison tables, numbered steps, expert tips, and precautions.",
  "observations": [
    { "text": "Specific fact about the field, crop, weather, or market", "provenance": "measured | weather_service | market_data | knowledge_base | user_profile" }
  ],
  "recommendations": [
    { "action": "Clear actionable step", "reason": "Why this step is needed", "evidence_refs": ["Specific fact or rule cited"], "priority": "low | medium | high" }
  ],
  "references": [
    { "title": "Publication title from source_document", "issuingOrg": "Issuing organization", "topic": "topic" }
  ],
  "confidence": "high | medium | low",
  "limitations": [
    "Safety caveat: follow registered CIB&RC product labels",
    "Limitation regarding local soil test verification"
  ],
  "language": "${params.language}",
  "suggestedQuestions": [
    "Follow-up question 1",
    "Follow-up question 2",
    "Follow-up question 3"
  ]
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

    try {
      const json = JSON.parse(clean);

      const references: AssistantReference[] = (json.references || []).length > 0
        ? json.references
        : chunks.map((c) => ({
            title: c.documentTitle || c.title,
            issuingOrg: c.issuingOrg,
            sourceUrl: c.sourceUrl || null,
            topic: c.topic || null,
          }));

      const markdown = json.markdown || json.content || json.summary || 'Agricultural decision-support guidance.';
      const summary = json.summary || markdown.split('\n\n')[0].replace(/[*#]/g, '').slice(0, 300);

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
    } catch {
      // If LLM returned direct rich Markdown text rather than JSON
      const summary = clean.split('\n\n')[0].replace(/[*#]/g, '').trim().slice(0, 300) || clean.slice(0, 300);
      return {
        summary,
        markdown: clean,
        content: clean,
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
