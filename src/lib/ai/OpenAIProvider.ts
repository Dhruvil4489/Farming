/**
 * SmartFarm AI — OpenAI Provider Adapter
 *
 * Connects to OpenAI-compatible Chat Completions API via native fetch.
 * Server-only; API keys are never leaked to client bundles.
 */

import { IAIProvider, AIMessage, AIChatOptions, AIResponse, AIProviderStatus } from './IAIProvider';

export class OpenAIProvider implements IAIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';

  private getApiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  private getModel(): string {
    return process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  private getBaseUrl(): string {
    return (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  async status(): Promise<AIProviderStatus> {
    const key = this.getApiKey();
    const isConfigured = Boolean(key && key.trim().length > 10);
    return {
      id: this.id,
      name: this.name,
      isConfigured,
      status: isConfigured ? 'ready' : 'misconfigured',
      isMock: false,
      requiresKey: true,
      supportedLanguages: ['en', 'hi', 'gu'],
      model: this.getModel(),
      message: isConfigured ? 'OpenAI provider configured and ready.' : 'OPENAI_API_KEY environment variable is missing.',
    };
  }

  async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('OpenAI API key not configured on server.');
    }

    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs || 15000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.getBaseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 1024,
          response_format: { type: 'json_object' },
        }),
        signal: options?.signal || controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(`OpenAI API error HTTP ${res.status}: ${errJson.error?.message || 'Unknown error'}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || '{}';

      return {
        content,
        provider: this.id,
        model: json.model || this.getModel(),
        isMock: false,
        usage: {
          promptTokens: json.usage?.prompt_tokens,
          completionTokens: json.usage?.completion_tokens,
          totalTokens: json.usage?.total_tokens,
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`OpenAI chat completion timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }
}
