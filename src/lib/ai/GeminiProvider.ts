/**
 * SmartFarm AI — Google Gemini Provider Adapter
 *
 * Connects to Google Generative AI REST API via native fetch.
 * Server-only; credentials are never exposed to client bundles.
 */

import { IAIProvider, AIMessage, AIChatOptions, AIResponse, AIProviderStatus } from './IAIProvider';

export class GeminiProvider implements IAIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }

  private getModel(): string {
    return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
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
      message: isConfigured ? 'Google Gemini provider configured and ready.' : 'GEMINI_API_KEY environment variable is missing.',
    };
  }

  async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('Google Gemini API key not configured on server.');
    }

    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs || 15000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Format Gemini payload: separate system instructions from chat history
    const systemMessage = messages.find((m) => m.role === 'system');
    const userAndAssistant = messages.filter((m) => m.role !== 'system');

    const contents = userAndAssistant.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.getModel()}:generateContent?key=${key}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
          generationConfig: {
            temperature: options?.temperature ?? 0.2,
            maxOutputTokens: options?.maxTokens ?? 1024,
            responseMimeType: 'application/json',
          },
        }),
        signal: options?.signal || controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(`Gemini API error HTTP ${res.status}: ${errJson.error?.message || 'Unknown error'}`);
      }

      const json = await res.json();
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      return {
        content,
        provider: this.id,
        model: this.getModel(),
        isMock: false,
        usage: {
          promptTokens: json.usageMetadata?.promptTokenCount,
          completionTokens: json.usageMetadata?.candidatesTokenCount,
          totalTokens: json.usageMetadata?.totalTokenCount,
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Google Gemini completion timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }
}
