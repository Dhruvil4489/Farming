/**
 * SmartFarm AI — Anthropic Claude Provider Adapter
 *
 * Connects to Anthropic Messages API via native fetch.
 * Server-only; credentials are never exposed to client bundles.
 */

import { IAIProvider, AIMessage, AIChatOptions, AIResponse, AIProviderStatus } from './IAIProvider';

export class AnthropicProvider implements IAIProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';

  private getApiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  }

  private getModel(): string {
    return process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
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
      message: isConfigured ? 'Anthropic Claude provider configured and ready.' : 'ANTHROPIC_API_KEY environment variable is missing.',
    };
  }

  async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('Anthropic API key not configured on server.');
    }

    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs || 15000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const userAndAssistant = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.getModel(),
          system: systemMessage,
          messages: userAndAssistant,
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.2,
        }),
        signal: options?.signal || controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(`Anthropic API error HTTP ${res.status}: ${errJson.error?.message || 'Unknown error'}`);
      }

      const json = await res.json();
      const content = json.content?.[0]?.text || '{}';

      return {
        content,
        provider: this.id,
        model: json.model || this.getModel(),
        isMock: false,
        usage: {
          promptTokens: json.usage?.input_tokens,
          completionTokens: json.usage?.output_tokens,
          totalTokens: (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0),
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Anthropic Claude chat timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }
}
