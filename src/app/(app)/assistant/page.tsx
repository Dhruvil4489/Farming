'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Plus,
  MessageSquare,
  Camera,
  Sparkles,
} from 'lucide-react';
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

interface SavedConversation {
  id: string;
  title: string | null;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    structuredJson?: string | null;
    providerId?: string | null;
    model?: string | null;
    confidence?: string | null;
  }>;
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

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  summary:
    'Namaste! I am your SmartFarm AI Agronomy Assistant — grounded in your active crop cycles, field conditions, live weather forecast, APMC mandi rates, and verified ICAR / SAU / PPQS guidelines.',
  observations: [
    {
      text: 'Connected to 60+ Indian crops, live weather thresholds, APMC records, and CIB&RC safety rules.',
      provenance: 'knowledge_base',
    },
  ],
  recommendations: [
    {
      action: 'Ask about your crop stage, yellow leaves, spraying weather, mandi rates, or Hindi/Gujarati advice',
      reason: 'Every recommendation is personalized to your registered field and active crop age (DAS).',
      evidence_refs: ['SmartFarm Grounded Agronomy Engine'],
      priority: 'low',
    },
  ],
  confidence: 'high',
  limitations: [
    'Assistive agricultural decision support — always inspect your field physically and follow printed CIB&RC product labels.',
  ],
};

const QUICK_PROMPTS = [
  'What should I do next for my current crop?',
  'Is it going to rain tomorrow? Should I spray?',
  'Explain wheat stages from sowing to harvest.',
  'Why are my tomato leaves turning yellow with spots?',
  "What is today's mandi price for wheat in my district?",
  'મારા પાક માટે આગળ શું કરવું?',
  'मेरी गेहूँ की फसल को पानी कब देना चाहिए?',
];

export default function AssistantPage() {
  const { locale } = useI18n();
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [fields, setFields] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'gu'>(locale);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLanguage(locale);
  }, [locale]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) setInput(q);
    }
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/v1/assistant/history?limit=15');
      if (res.ok) {
        const json = await res.json();
        setConversations(json.data?.conversations || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetch('/api/v1/assistant/status')
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.provider) setStatus(json.data.provider);
      })
      .catch(() => {});

    fetch('/api/v1/fields')
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.data) && json.data.length > 0) {
          setFields(json.data);
          setSelectedFieldId(json.data[0].id);
        }
      })
      .catch(() => {});

    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([WELCOME_MESSAGE]);
  };

  const handleSelectConversation = (conv: SavedConversation) => {
    setActiveConversationId(conv.id);
    const hydrated: ChatMessage[] = conv.messages.map((m) => {
      if (m.role === 'user') {
        return { role: 'user', content: m.content };
      }
      try {
        const parsed = m.structuredJson ? JSON.parse(m.structuredJson) : null;
        if (parsed) {
          return {
            role: 'assistant',
            summary: parsed.summary || m.content,
            observations: parsed.observations,
            recommendations: parsed.recommendations,
            references: parsed.references,
            confidence: parsed.confidence || (m.confidence as any),
            limitations: parsed.limitations,
            provider: m.providerId
              ? { id: m.providerId, name: m.providerId, model: m.model || '', isMock: false }
              : undefined,
          };
        }
      } catch {}
      return { role: 'assistant', summary: m.content, confidence: 'medium' };
    });
    setMessages(hydrated.length > 0 ? hydrated : [WELCOME_MESSAGE]);
  };

  const sendQuestion = async (questionText: string) => {
    const userMsg = questionText.trim();
    if (!userMsg || loading) return;

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
          conversationId: activeConversationId || undefined,
          language,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const assistantData = json.data;

      if (assistantData.conversationId) {
        setActiveConversationId(assistantData.conversationId);
      }

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

      loadHistory();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          summary: `Unable to process request: ${err.message}`,
          confidence: 'low',
          limitations: ['Please check your connection and try again.'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight flex items-center gap-2">
            <Sparkles size={22} className="text-[#2F7D4F]" /> AI Farming Assistant
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Conversational agronomy grounded in your farm, active crop lifecycle, live weather, mandi prices &amp; ICAR/PPQS guidance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {status && (
            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {status.name}
            </span>
          )}
          <ProvenanceChip type="ai_analysis" />
        </div>
      </div>

      {/* Main Split Workspace: History Sidebar + Active Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar: Conversation History */}
        <Card className="lg:col-span-3 p-4 rounded-2xl space-y-3 bg-white border border-stone-200">
          <Button
            type="button"
            size="sm"
            onClick={handleNewChat}
            className="w-full bg-[#143D2A] hover:bg-[#0F2D1F] text-white rounded-xl font-bold"
          >
            <Plus size={15} className="mr-1.5" /> New Chat
          </Button>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-1">
              Recent Conversations ({conversations.length})
            </span>
            {conversations.length === 0 ? (
              <p className="text-[11px] text-stone-400 px-1 py-3">
                Your saved farming chats will appear here.
              </p>
            ) : (
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-0.5">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-start gap-2 cursor-pointer ${
                      activeConversationId === conv.id
                        ? 'bg-emerald-50 text-[#143D2A] font-bold border border-emerald-200'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <MessageSquare size={13} className="shrink-0 mt-0.5 text-[#2F7D4F]" />
                    <span className="truncate">{conv.title || 'Farming Consultation'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100">
            <Link
              href="/diagnosis"
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#143D2A] text-xs font-bold border border-emerald-200 transition-colors"
            >
              <Camera size={14} /> Upload Leaf Photo (Disease AI)
            </Link>
          </div>
        </Card>

        {/* Right Panel: Chat Stream + Controls + Composer */}
        <div className="lg:col-span-9 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-xs text-xs">
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

          {language !== 'en' && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-start gap-2.5"
            >
              <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="text-amber-900 leading-relaxed">
                {getTranslation('status_ai_unvalidated_lang', language)}
              </p>
            </div>
          )}

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendQuestion(prompt)}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-xs font-medium text-stone-700 hover:text-[#143D2A] transition-colors cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Chat Messages */}
          <div className="space-y-4 min-h-[380px]" role="log" aria-live="polite">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'user' ? (
                  <div className="bg-[#143D2A] text-white px-4 py-3 rounded-2xl max-w-xl text-sm shadow-sm font-medium">
                    {msg.content}
                  </div>
                ) : (
                  <Card className="w-full max-w-3xl p-5 space-y-4 bg-white border border-stone-200 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#2F7D4F] text-white rounded-lg flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-[#143D2A] block">SmartFarm AI</span>
                          {msg.provider && (
                            <span className="text-[10px] text-stone-400">
                              {msg.provider.name} ({msg.provider.model})
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          msg.confidence === 'high'
                            ? 'bg-emerald-100 text-emerald-800'
                            : msg.confidence === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        Confidence: {msg.confidence || 'Medium'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-stone-900 leading-relaxed whitespace-pre-line">
                      {msg.summary}
                    </p>

                    {msg.observations && msg.observations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                          Key Observations:
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
                                  <ProvenanceChip type={provType} size="xs" locale={language} />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-stone-700 block uppercase tracking-wider">
                          Actionable Next Steps:
                        </span>
                        {msg.recommendations.map((rec, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-3 bg-[#F7F8F5] rounded-xl border border-stone-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-[#143D2A]">{rec.action}</p>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                                  rec.priority === 'high'
                                    ? 'bg-rose-100 text-rose-800'
                                    : rec.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-stone-200 text-stone-700'
                                }`}
                              >
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-stone-600 leading-relaxed">{rec.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.references && msg.references.length > 0 && (
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen size={12} /> Verified Sources:
                        </span>
                        <ul className="space-y-1">
                          {msg.references.map((ref, rfIdx) => (
                            <li key={rfIdx} className="text-[11px] text-stone-700">
                              • <strong className="text-stone-900">{ref.title}</strong> — {ref.issuingOrg}
                              {ref.sourceUrl && (
                                <a
                                  href={ref.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 text-[#2F7D4F] hover:underline"
                                >
                                  [Link]
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.limitations && msg.limitations.length > 0 && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                        <ul className="list-disc list-inside space-y-0.5">
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
                <Card className="p-4 bg-white border border-stone-200 flex items-center gap-3 rounded-2xl">
                  <div className="w-5 h-5 border-2 border-[#2F7D4F] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium text-stone-600">
                    Analyzing your crop lifecycle, weather, mandi data &amp; ICAR knowledge base...
                  </span>
                </Card>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Composer */}
          <form onSubmit={handleSend} className="flex gap-2 sticky bottom-2 bg-[#F7F8F5] pt-2" role="search">
            <input
              id="assistant-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in English, Hindi, or Gujarati about your crop, pests, weather, or mandi prices..."
              className="flex-1 px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7D4F] shadow-sm"
            />
            <Button
              type="submit"
              isLoading={loading}
              aria-label="Send message"
              className="px-6 bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
