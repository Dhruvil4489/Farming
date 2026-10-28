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
    return (process.env.AI_PROVIDER || 'mock').toLowerCase().trim();
  }

  static getProvider(): IAIProvider {
    const providerName = this.getProviderName();
    const isProduction = process.env.NODE_ENV === 'production';
    const allowMockInProd = process.env.ALLOW_MOCK_AI === 'true';

    // Guard: Prevent silent mock usage in production
    if (isProduction && providerName === 'mock' && !allowMockInProd) {
      throw new Error(
        'Assistant Unavailable: Mock AI provider is disabled in production. Please configure OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY.'
      );
    }

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
    const allowMock = process.env.ALLOW_MOCK_AI === 'true' || process.env.NODE_ENV !== 'production';

    try {
      const provider = this.getProvider();
      const status = await provider.status();

      // Ensure mock mode in production is reported accurately
      if (process.env.NODE_ENV === 'production' && status.isMock && !allowMock) {
        return {
          id: status.id,
          name: status.name,
          isConfigured: false,
          status: 'misconfigured',
          isMock: true,
          requiresKey: true,
          supportedLanguages: status.supportedLanguages,
          model: status.model,
          allowMock,
          activeProvider,
          message: 'Assistant configuration required. Production requires a live AI provider with valid credentials.',
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
