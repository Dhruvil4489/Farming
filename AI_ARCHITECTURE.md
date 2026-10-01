# SMARTFARM AI — AI ARCHITECTURE & INTEGRATION SPECIFICATION

---

## 1. Provider Abstraction Layer

The application interacts with AI capabilities via the `IAIProvider` interface abstraction. No vendor-specific SDK calls exist directly inside application feature components.

```typescript
export interface IAIProvider {
  chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse>;
  vision(images: AIImage[], prompt: string): Promise<AIVisionResponse>;
  embed(texts: string[]): Promise<number[][]>;
  status(): Promise<AIProviderStatus>;
}
```

### Supported Providers
1. `MockAIProvider` (Default in dev/demo — clearly marked `is_mock: true`).
2. `OpenAIProvider` (GPT-4o / GPT-4o-mini).
3. `AnthropicProvider` (Claude 3.5 Sonnet).
4. `GoogleGeminiProvider` (Gemini 1.5 Pro/Flash).

---

## 2. Context Builder & Grounding Engine

The AI assistant never receives the raw database. It operates on a **Token-budgeted Context Bundle** assembled by the `AIContextBuilder`:

```
User Question 
    │
    ▼
Intent Detector ──► [ Intent: today_plan / crop_check / leaf_problem / etc. ]
    │
    ▼
Context Retrievers:
  - Farm & Field Details
  - Active Crop Cycle & Stage
  - 48h Weather Forecast
  - Pending & Overdue Tasks
  - Confirmed Soil Parameters
  - Relevant RAG Knowledge Chunks
    │
    ▼
Context Bundle Assembly ──► System Prompt + Guardrails ──► LLM Execution ──► Structured Output
```

---

## 3. Strict Safety & Grounding Rules

1. **No Invented Agrochemical Dosages**: The AI must never output invented pesticide/fertilizer dosages. It defers strictly to official local guidance.
2. **Missing Information Refusal**: If required context is absent, the AI explicitly states what data is missing (e.g. "Please add your soil test report to get tailored fertilizer advice").
3. **Structured Response Schema**: All responses return a structured JSON contract containing `summary`, `observations`, `recommendations`, `evidence_refs`, `confidence`, and `limitations`.
