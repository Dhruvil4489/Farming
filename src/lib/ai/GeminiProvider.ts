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
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_API_KEY;
  }

  private getModel(): string {
    return process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
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
      message: isConfigured
        ? `Google Gemini provider configured with model ${this.getModel()} and ready.`
        : 'GEMINI_API_KEY or GOOGLE_API_KEY environment variable is missing.',
    };
  }

  async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('Google Gemini API key not configured on server.');
    }

    // Format Gemini payload: separate system instructions from chat history
    const systemMessage = messages.find((m) => m.role === 'system');
    const userAndAssistant = messages.filter((m) => m.role !== 'system');

    const contents = userAndAssistant.map((m) => {
      const parts: any[] = [{ text: m.content }];
      if (m.image?.data) {
        parts.push({
          inlineData: {
            mimeType: m.image.mimeType || 'image/jpeg',
            data: m.image.data,
          },
        });
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const generationConfig: Record<string, any> = {
      temperature: options?.temperature ?? 0.3,
      maxOutputTokens: options?.maxTokens ?? 2048,
    };

    if (options?.jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    const candidateModels = Array.from(
      new Set([this.getModel(), 'gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-flash-latest'])
    );

    let lastError: Error | null = null;
    const timeoutMs = options?.timeoutMs || 25000;

    for (const modelName of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
            generationConfig,
          }),
          signal: options?.signal || controller.signal,
        });

        clearTimeout(timeout);

        if (res.status === 404 || res.status === 503) {
          const errJson = await res.json().catch(() => ({}));
          lastError = new Error(`Gemini API error HTTP ${res.status} on ${modelName}: ${errJson.error?.message || 'Unavailable'}`);
          // Try next candidate model
          continue;
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(`Gemini API error HTTP ${res.status}: ${errJson.error?.message || 'Unknown error'}`);
        }

        const json = await res.json();
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        return {
          content,
          provider: this.id,
          model: modelName,
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
          lastError = new Error(`Google Gemini completion timed out after ${timeoutMs}ms on ${modelName}.`);
          continue;
        }
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini candidate models failed to respond.');
  }
}
