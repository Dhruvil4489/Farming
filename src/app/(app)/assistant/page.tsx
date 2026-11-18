'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Send, AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { getTranslation } from '@/lib/i18n';
import { useI18n } from '@/providers/I18nProvider';

interface Observation {
  text: string;
  provenance: 'measured' | 'weather_service' | 'market_data' | 'knowledge_base' | 'user_profile';
}

interface Recommendation {
  action: string;
  reason: string;
  evidence_refs: string[];
  priority: 'low' | 'medium' | 'high';
}

interface Reference {
  title: string;
  issuingOrg: string;
  sourceUrl?: string | null;
  topic?: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content?: string;
  summary?: string;
  observations?: Observation[];
  recommendations?: Recommendation[];
  references?: Reference[];
  confidence?: 'high' | 'medium' | 'low';
  limitations?: string[];
  provider?: { id: string; name: string; model: string; isMock: boolean };
}

interface ProviderStatus {
  id: string;
  name: string;
  model: string;
  isConfigured: boolean;
  status: string;
  isMock: boolean;
  requiresKey: boolean;
  message?: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      summary: 'Hello! I am your SmartFarm AI digital assistant, grounded in your verified farm plots, active crop phenology, and official ICAR/AAU agricultural extension guidance.',
      observations: [
        { text: 'Connected to verified Indian Council of Agricultural Research (ICAR) practices.', provenance: 'knowledge_base' },
      ],
      recommendations: [
        {
          action: 'Ask questions about your crops, pests, soil, weather, or mandi prices',
          reason: 'Recommendations are customized to your active crop stage and district.',
          evidence_refs: ['SmartFarm Grounding Pipeline'],
          priority: 'low',
        },
      ],
      confidence: 'high',
      limitations: [
        'Advisory is designed as assistive decision support and does not replace in-person agronomist inspection.',
        'Never fabricate chemical dosages; always follow registered product labels.',
      ],
    },
  ]);

  const { locale } = useI18n();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [fields, setFields] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'gu'>(locale);

  useEffect(() => {
    setLanguage(locale);
  }, [locale]);

  // Pre-fill question if navigated via /assistant?q=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) setInput(q);
    }
  }, []);

  // Load provider status and user fields on mount
  useEffect(() => {
    fetch('/api/v1/assistant/status')
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.provider) {
          setStatus(json.data.provider);
        }
      })
      .catch(() => { });

    fetch('/api/v1/fields')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setFields(json.data);
          setSelectedFieldId(json.data[0].id);
        }
      })
      .catch(() => { });
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          fieldId: selectedFieldId || undefined,
          language,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const assistantData = json.data;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          summary: assistantData.summary,
          observations: assistantData.observations,
          recommendations: assistantData.recommendations,
          references: assistantData.references,
          confidence: assistantData.confidence,
          limitations: assistantData.limitations,
          provider: assistantData.provider,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          summary: `Unable to process request: ${err.message}`,
          confidence: 'low',
          limitations: [
            'Assistant request failed.',
            'Please verify server connectivity or AI provider credentials.',
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">AI Farming Assistant</h1>
          <p className="text-xs text-stone-600 mt-1">
            Grounded decision support based on your farm, crop phenology, and verified ICAR/AAU guidance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <span
              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${status.status === 'ready'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : status.status === 'mock_active'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${status.status === 'ready'
                    ? 'bg-emerald-500'
                    : status.status === 'mock_active'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
              />
              {status.status === 'ready'
                ? `Live AI: ${status.name}`
                : status.status === 'mock_active'
                  ? 'Mock Grounding Engine (Dev)'
                  : 'Config Required'}
            </span>
          )}
          <ProvenanceChip type="ai_analysis" />
        </div>
      </div>

      {/* Provider Misconfiguration Banner if needed */}
      {status && status.status === 'misconfigured' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">Assistant Configuration Required</p>
            <p className="text-amber-800 leading-relaxed">
              Production requires a live AI provider. Please configure <code>GEMINI_API_KEY</code>, <code>OPENAI_API_KEY</code>, or <code>ANTHROPIC_API_KEY</code> on your server environment to enable live LLM generation.
            </p>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-600">Field Context:</span>
          {fields.length > 0 ? (
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2F7D4F]"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-stone-400">All registered plots</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-600">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2F7D4F]"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
          </select>
        </div>
      </div>

      {/* Multilingual Agronomic Translation Disclaimer */}
      {language !== 'en' && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-start gap-2.5"
        >
          <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">
              {language === 'hi' ? 'भाषा अनुवाद सूचना' : 'ભાષા અનુવાદ સૂચના'}
            </span>
            <p className="text-amber-900 leading-relaxed">
              {getTranslation('status_ai_unvalidated_lang', language)}
            </p>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="space-y-4 min-h-[420px]" role="log" aria-live="polite">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div className="bg-[#2F7D4F] text-white p-4 rounded-2xl max-w-lg text-sm shadow-sm font-medium">
                {msg.content}
              </div>
            ) : (
              <Card className="max-w-2xl p-6 space-y-4 bg-white border border-stone-200 shadow-md">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#2F7D4F] text-white rounded-lg flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#143D2A] block">SmartFarm Grounded Response</span>
                      {msg.provider && (
                        <span className="text-[10px] text-stone-400">
                          via {msg.provider.name} ({msg.provider.model})
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${msg.confidence === 'high'
                        ? 'bg-emerald-100 text-emerald-800'
                        : msg.confidence === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                  >
                    Confidence: {msg.confidence || 'Medium'}
                  </span>
                </div>

                {/* Direct Answer Summary */}
                <p className="text-sm font-semibold text-stone-900 leading-relaxed">{msg.summary}</p>

                {/* Grounded Observations */}
                {msg.observations && msg.observations.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      Context Observations:
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {msg.observations.map((obs, oIdx) => {
                        const provType =
                          obs.provenance === 'measured'
                            ? 'measured'
                            : obs.provenance === 'weather_service'
                              ? 'forecast'
                              : obs.provenance === 'market_data'
                                ? 'official_market'
                                : obs.provenance === 'knowledge_base'
                                  ? 'verified_source'
                                  : 'user_entered';

                        return (
                          <li key={oIdx} className="flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-[#2F7D4F] shrink-0 mt-0.5" />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>{obs.text}</span>
                              <ProvenanceChip
                                type={provType}
                                size="xs"
                                locale={language}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Grounded Recommendations */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-stone-700 block uppercase tracking-wider">
                      Grounded Recommendations:
                    </span>
                    {msg.recommendations.map((rec, rIdx) => (
                      <div key={rIdx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-[#143D2A]">{rec.action}</p>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${rec.priority === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : rec.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                          >
                            {rec.priority} priority
                          </span>
                        </div>
                        <p className="text-stone-600">{rec.reason}</p>
                        {rec.evidence_refs && rec.evidence_refs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-stone-400 font-semibold">Evidence:</span>
                            {rec.evidence_refs.map((ev, eIdx) => (
                              <span
                                key={eIdx}
                                className="text-[10px] px-2 py-0.5 bg-stone-200 text-stone-700 rounded font-medium"
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Authoritative References */}
                {msg.references && msg.references.length > 0 && (
                  <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block flex items-center gap-1">
                        <BookOpen size={12} /> Curated Extension Sources:
                      </span>
                      <ProvenanceChip
                        type="verified_source"
                        size="xs"
                        label="ICAR / AAU Publications"
                        locale={language}
                      />
                    </div>
                    <ul className="space-y-1">
                      {msg.references.map((ref, rfIdx) => (
                        <li key={rfIdx} className="text-[11px] text-stone-700 flex items-start gap-1.5">
                          <span className="text-stone-400">•</span>
                          <div>
                            <span className="font-semibold text-stone-900">{ref.title}</span>
                            <span className="text-stone-500"> — {ref.issuingOrg}</span>
                            {ref.sourceUrl && (
                              <a
                                href={ref.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-[#2F7D4F] hover:underline"
                              >
                                [Source Link]
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Safety Disclaimers */}
                {msg.limitations && msg.limitations.length > 0 && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                    <span className="font-bold block flex items-center gap-1 text-amber-950">
                      <AlertCircle size={13} /> Safety Disclaimers & Scope Limits:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                      {msg.limitations.map((lim, lIdx) => (
                        <li key={lIdx}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <Card className="p-4 bg-white border border-stone-200 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#2F7D4F] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-stone-600">
                Grounding against farm profile, weather cache, and ICAR knowledge base...
              </span>
            </Card>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2" role="search" aria-label="Ask assistant form">
        <label htmlFor="assistant-input" className="sr-only">Ask a question about your farm</label>
        <input
          id="assistant-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your crops, tasks, pests, weather, or mandi prices..."
          aria-label="Ask a question about your crops, tasks, pests, weather, or mandi prices"
          className="flex-1 px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7D4F] shadow-sm"
        />
        <Button
          type="submit"
          isLoading={loading}
          aria-label="Send question to assistant"
          className="px-6 bg-[#2F7D4F] hover:bg-[#256841] text-white"
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
