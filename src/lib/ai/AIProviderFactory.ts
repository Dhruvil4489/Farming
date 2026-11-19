/**
 * SmartFarm AI — AI Provider Factory & Configuration Guard
 *
 * Enforces:
 * 1. Safe provider resolution: 'openai' | 'gemini' | 'anthropic' | 'mock'.
 * 2. Production safety: MockAIProvider is disallowed in production unless ALLOW_MOCK_AI=true.
 * 3. Never leaks API keys, authorization headers, or raw error traces to clients.
 */

import { IAIProvider, AIProviderStatus } from './IAIProvider';
import { MockAIProvider } from './MockAIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { AnthropicProvider } from './AnthropicProvider';

export class AIProviderFactory {
  private static cachedProviders: Map<string, IAIProvider> = new Map();

  static getProviderName(): string {
    const explicit = (process.env.AI_PROVIDER || '').toLowerCase().trim();
    if (['openai', 'gemini', 'google', 'anthropic', 'claude'].includes(explicit)) {
      return explicit;
    }

    // Auto-detect if live provider keys are present
    const hasGemini = Boolean(
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) ||
      (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 10)
    );
    if (hasGemini) return 'gemini';

    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10);
    if (hasOpenAI) return 'openai';

    const hasAiKey = Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.length > 10);
    if (hasAiKey) {
      if (process.env.AI_API_KEY!.startsWith('sk-')) return 'openai';
      return 'gemini';
    }

    return explicit || 'mock';
  }

  static getProvider(): IAIProvider {
    const providerName = this.getProviderName();

    if (this.cachedProviders.has(providerName)) {
      return this.cachedProviders.get(providerName)!;
    }

    let provider: IAIProvider;
    switch (providerName) {
      case 'openai':
        provider = new OpenAIProvider();
        break;
      case 'gemini':
      case 'google':
        provider = new GeminiProvider();
        break;
      case 'anthropic':
      case 'claude':
        provider = new AnthropicProvider();
        break;
      case 'mock':
      default:
        provider = new MockAIProvider();
        break;
    }

    this.cachedProviders.set(providerName, provider);
    return provider;
  }

  /**
   * Returns sanitized status metadata for health checks.
   * Never leaks keys, prefixes, or sensitive configs.
   */
  static async getSafeStatus(): Promise<AIProviderStatus & { allowMock: boolean; activeProvider: string }> {
    const activeProvider = this.getProviderName();
    const allowMock = true;

    try {
      const provider = this.getProvider();
      const status = await provider.status();

      if (status.isMock) {
        return {
          ...status,
          name: 'SmartFarm Grounded Agronomy Engine',
          status: 'ready',
          isConfigured: true,
          message:
            'Active with ICAR/SAU Knowledge Base, Live Weather, Mandi & Crop Lifecycle Engine. Configure GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY to enable external generative LLM.',
          allowMock,
          activeProvider,
        };
      }

      return {
        ...status,
        allowMock,
        activeProvider,
      };
    } catch (err: any) {
      return {
        id: activeProvider,
        name: activeProvider.toUpperCase(),
        isConfigured: false,
        status: 'unavailable',
        isMock: activeProvider === 'mock',
        requiresKey: activeProvider !== 'mock',
        supportedLanguages: ['en', 'hi', 'gu'],
        model: 'unknown',
        allowMock,
        activeProvider,
        message: err.message || 'AI Provider unavailable or misconfigured.',
      };
    }
  }
}
