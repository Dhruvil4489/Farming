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
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  X,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { MarkdownMessage } from '@/components/ui/MarkdownMessage';
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
  markdown?: string;
  image?: string;
  observations?: Observation[];
  recommendations?: Recommendation[];
  references?: Reference[];
  confidence?: 'high' | 'medium' | 'low';
  limitations?: string[];
  suggestedQuestions?: string[];
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
    'Namaste! I am your SmartFarm AI Senior Agricultural Decision-Support Assistant — specialized in crop cultivation, plant disease diagnosis, balanced fertilizer planning, soil health, weather decisions, and government farmer schemes.',
  markdown: `🌱 **Namaste & Welcome to SmartFarm AI Agriculture Expert!**

I am your 24/7 agricultural advisor, grounded in verified research from the **Indian Council of Agricultural Research (ICAR)**, **State Agricultural Universities (AAU Anand, JAU Junagadh)**, and official **Ministry of Agriculture** extension databases.

### How I Can Help You Today:
- 🌾 **Crop Cultivation & Yield:** Best sowing practices, seed rates, and variety selection for wheat, cotton, rice, groundnut, vegetables, and fruits.
- 🔬 **Disease & Pest Diagnosis:** Identify symptoms, why they occur, organic & biological IPM control, and safe CIB&RC treatment options.
- 🧪 **Fertilizer Planning:** Balanced NPK nutrition, DAP vs NPK comparisons, split schedules, and fertilizer mixing compatibility.
- 💧 **Irrigation & Weather:** Critical growth stages (CRI in wheat, AWD in rice, drip irrigation) and rain spray advisories.
- 📜 **Government Schemes:** PM-KISAN, PMFBY crop insurance, Kisan Credit Card (KCC), and Soil Health Card rules.
- 📷 **Visual Leaf Diagnosis:** Click the camera icon below to upload a crop or leaf photo!

*Feel free to ask in **English**, **हिंदी (Hindi)**, or **ગુજરાતી (Gujarati)**!*`,
  confidence: 'high',
  suggestedQuestions: [
    'How can I increase cotton production?',
    'What is the difference between DAP and NPK?',
    'Why are tomato leaves turning yellow?',
    'How can I control whiteflies in chilli crops?',
    'Explain PM-KISAN eligibility criteria.',
  ],
};

const STARTER_PROMPTS = [
  { label: '🌾 Wheat Cultivation', prompt: 'What is the best way to cultivate wheat?' },
  { label: '🌱 Increase Cotton Yield', prompt: 'How can I increase cotton production?' },
  { label: '🧪 DAP vs NPK Difference', prompt: 'What is the difference between DAP and NPK?' },
  { label: '🍅 Tomato Yellow Leaves', prompt: 'Why are tomato leaves turning yellow?' },
  { label: '🌶️ Whiteflies in Chilli', prompt: 'How can I control whiteflies in chilli crops?' },
  { label: '💧 Rice Water Requirement', prompt: 'How much water does a rice crop require?' },
  { label: '🗺️ Suitable Gujarat Crops', prompt: 'Which crops are suitable for Gujarat climate?' },
  { label: '🌿 Natural Soil Fertility', prompt: 'How can I improve soil fertility naturally?' },
  { label: '📜 PM-KISAN Eligibility', prompt: 'Explain PM-KISAN eligibility criteria.' },
  { label: 'ગુજરાતી: કપાસ ખાતર', prompt: 'કપાસના પાક માટે કયું ખાતર યોગ્ય છે?' },
  { label: 'हिंदी: गेहूँ की सिंचाई', prompt: 'गेहूँ की फसल को पानी कब देना चाहिए?' },
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
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<{ question: string; image?: string | null } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setAttachedImage(null);
    setLastFailedQuery(null);
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
            content: m.content,
            summary: parsed.summary || m.content,
            markdown: parsed.markdown || m.content,
            observations: parsed.observations,
            recommendations: parsed.recommendations,
            references: parsed.references,
            confidence: parsed.confidence || (m.confidence as any),
            limitations: parsed.limitations,
            suggestedQuestions: parsed.suggestedQuestions,
            provider: m.providerId
              ? { id: m.providerId, name: m.providerId, model: m.model || '', isMock: false }
              : undefined,
          };
        }
      } catch {}
      return { role: 'assistant', content: m.content, summary: m.content, markdown: m.content, confidence: 'medium' };
    });
    setMessages(hydrated.length > 0 ? hydrated : [WELCOME_MESSAGE]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setAttachedImage(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, index: number) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const sendQuestion = async (questionText: string, imageOverride?: string | null) => {
    const userMsg = questionText.trim();
    const currentImg = imageOverride !== undefined ? imageOverride : attachedImage;

    if ((!userMsg && !currentImg) || loading) return;

    setInput('');
    setAttachedImage(null);
    setLastFailedQuery(null);

    const newUserMsg: ChatMessage = {
      role: 'user',
      content: userMsg || (currentImg ? 'Analyze uploaded plant image' : ''),
      image: currentImg || undefined,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg || 'What is wrong with my plant? Please analyze this image.',
          fieldId: selectedFieldId || undefined,
          conversationId: activeConversationId || undefined,
          language,
          image: currentImg || undefined,
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
          content: assistantData.content || assistantData.markdown || assistantData.summary,
          summary: assistantData.summary,
          markdown: assistantData.markdown || assistantData.content || assistantData.summary,
          observations: assistantData.observations,
          recommendations: assistantData.recommendations,
          references: assistantData.references,
          confidence: assistantData.confidence,
          limitations: assistantData.limitations,
          suggestedQuestions: assistantData.suggestedQuestions,
          provider: assistantData.provider,
        },
      ]);

      loadHistory();
    } catch (err: any) {
      setLastFailedQuery({ question: userMsg, image: currentImg });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          summary: `Unable to process request: ${err.message}`,
          markdown: `⚠️ **Service Notice:** Unable to reach agricultural decision support: ${err.message}.\n\nPlease check your internet connection or click **Retry** below.`,
          confidence: 'low',
          limitations: ['Network failure or server timeout during processing.'],
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

  const handleRegenerate = () => {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const lastUser = messages[i];
        // Remove trailing assistant message
        setMessages((prev) => prev.slice(0, i));
        sendQuestion(lastUser.content || '', lastUser.image || null);
        break;
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-black text-[#143D2A] tracking-tight flex items-center gap-2.5">
            <Sparkles size={24} className="text-[#2F7D4F]" /> AI Agriculture Expert
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Senior agronomy intelligence grounded in ICAR/SAU research, active crop stages, weather, and market rates
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {status && (
            <span className="text-[11px] px-3 py-1 rounded-full font-bold border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {status.name} ({status.model})
            </span>
          )}
          <ProvenanceChip type="ai_analysis" />
        </div>
      </div>

      {/* Main Split Layout: History Sidebar + Active Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar: Conversation History & Tools */}
        <Card className="lg:col-span-3 p-4 rounded-2xl space-y-3.5 bg-white border border-stone-200 shadow-2xs">
          <Button
            type="button"
            size="sm"
            onClick={handleNewChat}
            className="w-full bg-[#143D2A] hover:bg-[#0F2D1F] text-white rounded-xl font-bold py-2.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} className="mr-1.5" /> New Conversation
          </Button>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                Recent Consultations ({conversations.length})
              </span>
              {conversations.length > 0 && (
                <button
                  type="button"
                  onClick={handleNewChat}
                  title="Clear view"
                  className="text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {conversations.length === 0 ? (
              <p className="text-[11px] text-stone-400 px-1 py-3 leading-relaxed">
                Your past farming consultations will be automatically organized here.
              </p>
            ) : (
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-0.5">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-start gap-2 cursor-pointer ${
                      activeConversationId === conv.id
                        ? 'bg-emerald-50 text-[#143D2A] font-bold border border-emerald-300 shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-100/80 border border-transparent'
                    }`}
                  >
                    <MessageSquare size={13} className="shrink-0 mt-0.5 text-[#2F7D4F]" />
                    <span className="truncate">{conv.title || 'Farming Consultation'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-2">
            <Link
              href="/diagnosis"
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#143D2A] text-xs font-bold border border-emerald-200 transition-colors"
            >
              <Camera size={14} /> Full Plant Pathology Lab
            </Link>
            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <div className="flex items-center gap-1 font-bold text-[#143D2A]">
                <ShieldCheck size={13} className="text-[#2F7D4F]" /> CIB&RC Safety Policy
              </div>
              <p className="leading-snug">
                SmartFarm AI enforces registered chemical safety with zero fabricated dosages and strict banned pesticide warnings.
              </p>
            </div>
          </div>
        </Card>

        {/* Right Panel: Chat Stream + Controls + Input Composer */}
        <div className="lg:col-span-9 space-y-3.5">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-2xs text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-600">Field Plot:</span>
              {fields.length > 0 ? (
                <select
                  value={selectedFieldId}
                  onChange={(e) => setSelectedFieldId(e.target.value)}
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2F7D4F]"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-stone-400 font-medium">All registered plots</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-600">Response Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2F7D4F]"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>
          </div>

          {/* Quick Starter Topics */}
          {messages.length <= 1 && (
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={13} className="text-[#2F7D4F]" /> Suggested Agricultural Queries
                </span>
                <span className="text-[10px] text-stone-400">Click to ask instantly</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendQuestion(item.prompt)}
                    className="px-3 py-1.5 rounded-full bg-[#F7F8F5] hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-xs font-medium text-stone-700 hover:text-[#143D2A] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={11} className="text-stone-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Stream */}
          <div className="space-y-4 min-h-[420px]" role="log" aria-live="polite">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'user' ? (
                  <div className="bg-[#143D2A] text-white px-4 py-3 rounded-2xl max-w-xl text-sm shadow-xs font-medium space-y-2">
                    {msg.image && (
                      <div className="rounded-lg overflow-hidden border border-emerald-700/50 max-h-48">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.image} alt="Uploaded leaf" className="w-full h-auto object-cover" />
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <Card className="w-full max-w-3xl p-5 space-y-4 bg-white border border-stone-200 shadow-xs rounded-2xl">
                    {/* Assistant Header & Actions */}
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#2F7D4F] text-white rounded-xl flex items-center justify-center shadow-xs">
                          <Bot size={18} />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-[#143D2A] block">SmartFarm AI Expert</span>
                          {msg.provider && (
                            <span className="text-[10px] text-stone-400">
                              {msg.provider.name} ({msg.provider.model})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            msg.confidence === 'high'
                              ? 'bg-emerald-100 text-emerald-800'
                              : msg.confidence === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          Confidence: {msg.confidence || 'High'}
                        </span>

                        {/* Copy Answer Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.markdown || msg.content || msg.summary || '', idx)}
                          title="Copy answer"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Rich Markdown Response Body */}
                    <div className="text-stone-800">
                      <MarkdownMessage content={msg.markdown || msg.content || msg.summary || ''} />
                    </div>

                    {/* Verified Sources */}
                    {msg.references && msg.references.length > 0 && (
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen size={12} className="text-[#2F7D4F]" /> Verified Extension Sources:
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
                                  className="ml-1 text-[#2F7D4F] hover:underline font-semibold"
                                >
                                  [Source Portal]
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Safety Caveats / Limitations */}
                    {msg.limitations && msg.limitations.length > 0 && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                        <ul className="list-disc list-inside space-y-0.5">
                          {msg.limitations.map((lim, lIdx) => (
                            <li key={lIdx}>{lim}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggested Follow-Up Chips */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="pt-2 border-t border-stone-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Suggested Follow-Up Questions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedQuestions.map((qText, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => sendQuestion(qText)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#143D2A] text-xs font-semibold border border-emerald-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <span>{qText}</span>
                              <ChevronRight size={12} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <Card className="p-4 bg-white border border-stone-200 flex items-center gap-3 rounded-2xl shadow-xs">
                  <div className="w-5 h-5 border-2 border-[#2F7D4F] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium text-stone-600">
                    Retrieving ICAR/AAU agronomic knowledge, weather, and farm context...
                  </span>
                </Card>
              </div>
            )}

            {/* Error Retry Card */}
            {lastFailedQuery && !loading && (
              <div className="flex justify-start">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>The previous query encountered an error.</span>
                  <button
                    type="button"
                    onClick={() => sendQuestion(lastFailedQuery.question, lastFailedQuery.image)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick Regenerate & New Chat Action Toolbar */}
          {messages.length > 1 && !loading && (
            <div className="flex items-center justify-end gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={handleRegenerate}
                className="flex items-center gap-1 px-2.5 py-1 text-stone-600 hover:text-[#143D2A] hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <RotateCcw size={13} /> Regenerate Response
              </button>
              <button
                type="button"
                onClick={handleNewChat}
                className="flex items-center gap-1 px-2.5 py-1 text-stone-600 hover:text-[#143D2A] hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <Plus size={13} /> New Chat
              </button>
            </div>
          )}

          {/* Input Composer */}
          <div className="sticky bottom-2 bg-[#F7F8F5] pt-2">
            {/* Image Preview Thumbnail */}
            {attachedImage && (
              <div className="mb-2 p-2 bg-white rounded-xl border border-stone-200 inline-flex items-center gap-2.5 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachedImage} alt="Attachment preview" className="w-12 h-12 rounded-lg object-cover border" />
                <div className="text-xs">
                  <span className="font-bold text-[#143D2A] block">Leaf Photo Attached</span>
                  <span className="text-[10px] text-stone-400">Ready for visual diagnosis</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex gap-2" role="search">
              {/* Hidden File Picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />

              {/* Photo Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload crop or leaf photo for visual disease diagnosis"
                className={`px-3.5 py-3 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                  attachedImage
                    ? 'bg-emerald-50 border-emerald-300 text-[#2F7D4F]'
                    : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50 hover:text-[#143D2A]'
                }`}
              >
                <Camera size={18} />
              </button>

              <input
                id="assistant-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in English, Hindi, or Gujarati about crop cultivation, yellow leaves, fertilizers, weather..."
                className="flex-1 px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7D4F] shadow-sm font-medium"
              />

              <Button
                type="submit"
                isLoading={loading}
                aria-label="Send message"
                className="px-6 bg-[#2F7D4F] hover:bg-[#143D2A] text-white rounded-xl shadow-xs font-bold"
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
