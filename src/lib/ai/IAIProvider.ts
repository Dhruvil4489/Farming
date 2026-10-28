/**
 * SmartFarm AI — AI Provider Abstraction Layer
 *
 * Vendor-agnostic interface supporting:
 * - OpenAI (GPT-4o, GPT-4o-mini)
 * - Google Gemini (Gemini 1.5 Pro / Flash)
 * - Anthropic Claude (Claude 3.5 Sonnet / Haiku)
 * - IlaAI (Fine-tuned agricultural LLM endpoint)
 * - MockAIProvider (Explicit development / test fixture provider)
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  isMock: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProviderStatus {
  id: string;
  name: string;
  isConfigured: boolean;
  status: 'ready' | 'misconfigured' | 'unavailable' | 'mock_active';
  isMock: boolean;
  requiresKey: boolean;
  supportedLanguages: string[];
  model: string;
  message?: string;
}

export interface IAIProvider {
  readonly id: string;
  readonly name: string;
  chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse>;
  status(): Promise<AIProviderStatus>;
}
