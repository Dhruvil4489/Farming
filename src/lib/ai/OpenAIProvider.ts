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
    return process.env.OPENAI_API_KEY || (process.env.AI_API_KEY?.startsWith('sk-') ? process.env.AI_API_KEY : undefined);
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
    const timeoutMs = options?.timeoutMs || 25000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const formattedMessages = messages.map((m) => {
      if (m.image?.data) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            {
              type: 'image_url',
              image_url: { url: `data:${m.image.mimeType || 'image/jpeg'};base64,${m.image.data}` },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const bodyPayload: Record<string, any> = {
      model: this.getModel(),
      messages: formattedMessages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2048,
    };

    if (options?.jsonMode) {
      bodyPayload.response_format = { type: 'json_object' };
    }

    try {
      const res = await fetch(`${this.getBaseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(bodyPayload),
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
