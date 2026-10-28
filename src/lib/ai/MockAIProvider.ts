/**
 * SmartFarm AI — Mock AI Provider
 *
 * Explicit test & development mock provider.
 * NEVER silently selected in production without explicit ALLOW_MOCK_AI=true.
 * Produces structured, deterministic responses matching SmartFarm contract schema.
 */

import { IAIProvider, AIMessage, AIChatOptions, AIResponse, AIProviderStatus } from './IAIProvider';

export class MockAIProvider implements IAIProvider {
  readonly id = 'mock';
  readonly name = 'SmartFarm Mock Grounding Engine';

  async status(): Promise<AIProviderStatus> {
    return {
      id: this.id,
      name: this.name,
      isConfigured: true,
      status: 'mock_active',
      isMock: true,
      requiresKey: false,
      supportedLanguages: ['en', 'hi', 'gu'],
      model: 'mock-smartfarm-grounded-v1',
      message: 'Mock assistant active (development/demo mode only).',
    };
  }

  async chat(messages: AIMessage[], _options?: AIChatOptions): Promise<AIResponse> {
    const userMessage = messages.findLast((m) => m.role === 'user')?.content || '';
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const lowerUser = userMessage.toLowerCase();

    // Check for prompt injection attempts
    const isInjection =
      lowerUser.includes('ignore previous instructions') ||
      lowerUser.includes('system prompt') ||
      lowerUser.includes('admin password') ||
      lowerUser.includes('secret key') ||
      lowerUser.includes('bypass security');

    if (isInjection) {
      const responseJson = {
        summary:
          'Security Policy Notice: The assistant operates exclusively as a grounded agricultural decision-support tool. It cannot execute administrative commands or alter its system parameters.',
        observations: [
          { text: 'Prompt contains unauthorized command override patterns.', provenance: 'knowledge_base' },
        ],
        recommendations: [
          {
            action: 'Submit standard agricultural questions',
            reason: 'Queries must relate to farm operations, crop stages, weather advisories, or market prices.',
            evidence_refs: ['System Security Policy'],
            priority: 'low',
          },
        ],
        references: [],
        confidence: 'high',
        limitations: [
          'Assistant does not execute system or administrative commands.',
          'Tenant isolation and security policies remain strictly enforced.',
        ],
        language: 'en',
      };

      return {
        content: JSON.stringify(responseJson, null, 2),
        provider: this.id,
        model: 'mock-smartfarm-grounded-v1',
        isMock: true,
        usage: { promptTokens: 120, completionTokens: 140, totalTokens: 260 },
      };
    }

    // Check for other-user farm access request
    if (lowerUser.includes('other farmer') || lowerUser.includes('another user') || lowerUser.includes('admin farm data')) {
      const responseJson = {
        summary:
          'Data Privacy Restriction: You can only query data for farms and fields registered under your authenticated account.',
        observations: [
          { text: 'Cross-tenant access attempt was intercepted and blocked.', provenance: 'user_profile' },
        ],
        recommendations: [
          {
            action: 'Select your registered field from your dashboard',
            reason: 'All recommendations are tailored exclusively to your verified field plots.',
            evidence_refs: ['Tenant Isolation Guard'],
            priority: 'medium',
          },
        ],
        references: [],
        confidence: 'high',
        limitations: ['Data access is strictly isolated by farmer account.'],
        language: 'en',
      };

      return {
        content: JSON.stringify(responseJson, null, 2),
        provider: this.id,
        model: 'mock-smartfarm-grounded-v1',
        isMock: true,
        usage: { promptTokens: 110, completionTokens: 120, totalTokens: 230 },
      };
    }

    // Check for unsupported crops (e.g. Dragonfruit, Vanilla, Coffee)
    if (lowerUser.includes('dragonfruit') || lowerUser.includes('vanilla') || lowerUser.includes('coffee') || lowerUser.includes('oil palm')) {
      const responseJson = {
        summary:
          'Unverified Crop Request: The SmartFarm knowledge base does not currently contain verified agronomic package-of-practices for this crop in your agro-ecological zone.',
        observations: [
          { text: 'Crop is not covered by current verified ICAR/State extension guides.', provenance: 'knowledge_base' },
        ],
        recommendations: [
          {
            action: 'Consult your district Krishi Vigyan Kendra (KVK)',
            reason: 'Expert evaluation is required for non-standard crops in Gujarat agro-climatic zones.',
            evidence_refs: ['ICAR Mandate Guidelines'],
            priority: 'high',
          },
        ],
        references: [
          {
            title: 'Directory of Krishi Vigyan Kendras in Gujarat',
            issuingOrg: 'ICAR-ATARI Zone VIII',
            topic: 'extension_services',
          },
        ],
        confidence: 'low',
        limitations: [
          'Knowledge base does not cover this crop confidently.',
          'Do not apply generalized treatments without agronomist consultation.',
        ],
        language: 'en',
      };

      return {
        content: JSON.stringify(responseJson, null, 2),
        provider: this.id,
        model: 'mock-smartfarm-grounded-v1',
        isMock: true,
      };
    }

    // Check for Mandi market prices
    if (lowerUser.includes('price') || lowerUser.includes('mandi') || lowerUser.includes('bhav') || lowerUser.includes('भाव') || lowerUser.includes('ભાવ')) {
      // Extract from system message or provide grounded response
      const hasMarketContext = systemMessage.includes('Market Price Observations');
      const responseJson = {
        summary: hasMarketContext
          ? 'Latest mandi market arrivals and modal prices recorded from official data.gov.in Agmarknet feeds for your district:'
          : 'Official market arrivals for your requested commodity in Gujarat mandis:',
        observations: [
          {
            text: 'Market rates are sourced directly from cached Agmarknet / APMC records with exact arrival dates.',
            provenance: 'market_data',
          },
        ],
        recommendations: [
          {
            action: 'Monitor daily price trends before dispatching harvest',
            reason: 'Arrival volumes fluctuate significantly across APMC trading sessions.',
            evidence_refs: ['Govt Agmarknet Feed'],
            priority: 'medium',
          },
        ],
        references: [
          {
            title: 'Agmarknet Daily Mandi Price & Arrival Bulletin',
            issuingOrg: 'Directorate of Marketing & Inspection (DMI), Ministry of Agriculture',
            sourceUrl: 'https://agmarknet.gov.in',
            topic: 'market_prices',
          },
        ],
        confidence: 'high',
        limitations: [
          'Prices reflect recorded APMC modal rates, not guaranteed future spot offers.',
          'Quality grading, moisture level, and packaging determine actual counter rates.',
        ],
        language: 'en',
      };

      return {
        content: JSON.stringify(responseJson, null, 2),
        provider: this.id,
        model: 'mock-smartfarm-grounded-v1',
        isMock: true,
      };
    }

    // Check for IoT / Sensor questions
    if (lowerUser.includes('sensor') || lowerUser.includes('moisture') || lowerUser.includes('soil reading') || lowerUser.includes('ভেજ') || lowerUser.includes('नमी')) {
      const responseJson = {
        summary:
          'Based on live in-situ soil moisture sensor telemetry from your paired field plot:',
        observations: [
          {
            text: 'Current soil moisture index is within calibrated comfort range for your crop stage.',
            provenance: 'measured',
          },
          {
            text: 'Reading timestamp and hardware battery status confirmed healthy.',
            provenance: 'measured',
          },
        ],
        recommendations: [
          {
            action: 'Maintain existing irrigation schedule',
            reason: 'Moisture trend is stable and does not indicate root-zone deficit.',
            evidence_refs: ['In-Situ Capacitive Sensor', 'Crop Comfort Threshold'],
            priority: 'low',
          },
        ],
        references: [
          {
            title: 'Irrigation Water Management Guide for Gujarat Soils',
            issuingOrg: 'Anand Agricultural University (AAU)',
            topic: 'irrigation',
          },
        ],
        confidence: 'high',
        limitations: [
          'Sensor readings indicate point-location index; inspect field perimeter for uniformity.',
          'Verify sensor probe depth matches root zone.',
        ],
        language: 'en',
      };

      return {
        content: JSON.stringify(responseJson, null, 2),
        provider: this.id,
        model: 'mock-smartfarm-grounded-v1',
        isMock: true,
      };
    }

    // Check for Wheat critical irrigation stages
    if (lowerUser.includes('wheat') || lowerUser.includes('gehu') || lowerUser.includes('cri') || lowerUser.includes('गेहूं') || lowerUser.includes('ઘઉં')) {
      const responseJson = {
        summary:
          'Critical Stage Irrigation Guidelines for Wheat (AAU & ICAR-IIWBR): Wheat requires timely irrigation at moisture-sensitive stages.',
        observations: [
          {
            text: 'Crown Root Initiation (CRI) at 20-25 days after sowing is the most critical moisture window.',
            provenance: 'knowledge_base',
          },
          {
            text: 'Skipping irrigation at CRI stage causes irreversible 25-30% grain yield reduction.',
            provenance: 'knowledge_base',
          },
        ],
        recommendations: [
          {
            action: 'Apply first critical irrigation at Crown Root Initiation (21-25 DAS)',
            reason: 'Essential for crown root elongation and early tiller initiation.',
            evidence_refs: ['AAU Wheat Package of Practices', 'Critical Stages Schedule'],
            priority: 'high',
          },
          {
            action: 'Top-dress 25% Nitrogen (Urea) immediately after first irrigation',
            reason: 'Maximizes nitrogen uptake efficiency during tillering initiation.',
            evidence_refs: ['ICAR Balanced Fertilizer Protocol'],
            priority: 'medium',
          },
        ],
        references: [
          {
            title: 'Package of Practices for Irrigated Wheat in Middle Gujarat Agro-Climatic Zone',
            issuingOrg: 'Anand Agricultural University (AAU) & ICAR-IIWBR',
            sourceUrl: 'https://aau.in/wheat-cultivation-gujarat',
            topic: 'irrigation',
          },
        ],
        confidence: 'high',
        limitations: [
          'Avoid standing water or waterlogging in heavy black soils during early tillering.',
          'Adjust timing if unseasonal rainfall occurs during critical window.',
        ],
        language: 'en',
      };

      return {
        content: JSON.stringify(responseJson, null, 2),
        provider: this.id,
        model: 'mock-smartfarm-grounded-v1',
        isMock: true,
      };
    }

    // Check for Cotton pest / disease question
    if (lowerUser.includes('cotton') || lowerUser.includes('bollworm') || lowerUser.includes('aphid') || lowerUser.includes('कपास') || lowerUser.includes('કપાસ')) {
      const isHindi = lowerUser.includes('कपास') || lowerUser.includes('कीट') || lowerUser.includes('इल्ली');
      const isGujarati = lowerUser.includes('કપાસ') || lowerUser.includes('ઇયળ') || lowerUser.includes('જીવાત');

      const summary = isGujarati
        ? 'કપાસ પાકમાં ફૂલ-ઝીંડવા અવસ્થાએ ગુલાબી ઈયળ (Pink Bollworm) અને ચૂસિયા જીવાતના સંકલિત નિયંત્રણ માટે ભલામણ:'
        : isHindi
        ? 'कपास की फसल में फूल और गूलर अवस्था के दौरान गुलाबी सुंडी एवं रस चूसक कीटों के समेकित प्रबंधन की सिफारिश:'
        : 'Integrated Pest Management (IPM) guidelines for cotton crop during flowering and boll formation stage:';

      const responseJson = {
        summary,
        observations: [
          {
            text: 'Humid conditions during flowering favor pink bollworm egg hatching and aphid colonization.',
            provenance: 'knowledge_base',
          },
          {
            text: 'Crop is in peak reproductive phase where flower/boll protection is critical for yield.',
            provenance: 'measured',
          },
        ],
        recommendations: [
          {
            action: 'Install pheromone traps @ 5 traps/hectare for pink bollworm monitoring',
            reason: 'Catches exceeding 8 moths/trap/night for 3 consecutive nights indicate ETL threshold.',
            evidence_refs: ['ICAR-CICR Nagpur Cotton IPM Protocol', 'Field Stage: Flowering'],
            priority: 'high',
          },
          {
            action: 'Scout 20 randomly selected plants weekly for rosette flowers',
            reason: 'Rosette flowers indicate internal bollworm larval feeding.',
            evidence_refs: ['AAU Extension Guide Cotton PBW'],
            priority: 'medium',
          },
        ],
        references: [
          {
            title: 'Package of Practices for Cotton Cultivation in Gujarat',
            issuingOrg: 'Anand Agricultural University (AAU)',
            sourceUrl: 'https://aau.in/extension-education/crop-advisory',
            topic: 'pest_management',
          },
          {
            title: 'Integrated Pest Management Protocol for Cotton Pink Bollworm',
            issuingOrg: 'ICAR - Central Institute for Cotton Research (CICR)',
            sourceUrl: 'https://cicr.icar.gov.in',
            topic: 'pest_management',
          },
        ],
        confidence: 'high',
        limitations: [
          'Follow manufacturer label directions for exact formulation safety intervals.',
          'Never spray chemicals during daytime peak bee pollination activity.',
          'Consult local block agricultural officer for district-specific advisories.',
        ],
        language: isGujarati ? 'gu' : isHindi ? 'hi' : 'en',
      };

      return {
        content: JSON.stringify(responseJson, null, 2),
        provider: this.id,
        model: 'mock-smartfarm-grounded-v1',
        isMock: true,
      };
    }

    // Default grounded agricultural response
    const responseJson = {
      summary:
        'SmartFarm Grounded Advice: Decision support tailored to your farm crop cycle and local agro-climatic conditions:',
      observations: [
        {
          text: 'Farming guidelines retrieved from verified Indian Council of Agricultural Research (ICAR) practices.',
          provenance: 'knowledge_base',
        },
      ],
      recommendations: [
        {
          action: 'Inspect field conditions and monitor soil moisture trend',
          reason: 'Maintaining optimal root zone conditions promotes healthy vegetative and reproductive growth.',
          evidence_refs: ['ICAR Package of Practices'],
          priority: 'medium',
        },
      ],
      references: [
        {
          title: 'General Crop Advisory and Package of Practices',
          issuingOrg: 'Indian Council of Agricultural Research (ICAR)',
          topic: 'general_advisory',
        },
      ],
      confidence: 'medium',
      limitations: [
        'Advisory is designed as assistive decision support and does not replace agronomist field visit.',
        'Always read chemical product labels for registered usage.',
      ],
      language: 'en',
    };

    return {
      content: JSON.stringify(responseJson, null, 2),
      provider: this.id,
      model: 'mock-smartfarm-grounded-v1',
      isMock: true,
      usage: { promptTokens: 90, completionTokens: 110, totalTokens: 200 },
    };
  }
}
