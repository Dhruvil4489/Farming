'use client';

import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

export default function AssistantPage() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      summary: 'Hello! I am your SmartFarm AI digital assistant. How can I support your farm decisions today?',
      recommendations: [
        { action: 'View Today\'s Weather Advisory', reason: 'High humidity is forecast for Vadodara district.' },
      ],
      provenance: 'ai_analysis',
      confidence: 'high',
      limitations: ['Requires local field verification'],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Simulated grounded AI context response matching schema §15.5
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          summary: `Based on your North Field Cotton plot (Flowering stage, 65 days after sowing) and current 62% humidity forecast:`,
          observations: [
            { text: 'Cotton crop is currently in peak flowering stage.', provenance: 'measured' },
            { text: 'Weather forecast shows 35% chance of light rain.', provenance: 'weather_service' },
          ],
          recommendations: [
            {
              action: 'Inspect leaf undersides for aphid/whitefly pests',
              reason: 'Humid conditions favor early aphid infestation during flowering.',
              evidence_refs: ['Weather Humidity 62%', 'Crop Stage: Flowering'],
              priority: 'medium',
            },
            {
              action: 'Maintain regular drip irrigation schedule',
              reason: 'Avoid moisture stress during peak boll formation.',
              evidence_refs: ['Field Soil Type: Black'],
              priority: 'high',
            },
          ],
          confidence: 'high',
          limitations: [
            'Follow chemical product labels for dosage.',
            'Consult your local agriculture officer for specific agrochemical prescriptions.',
          ],
          provenance: 'ai_analysis',
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#143D2A] tracking-tight">AI Farming Assistant</h1>
          <p className="text-xs text-stone-600 mt-1">
            Grounded decision support based on your farm, crop stage, and weather context
          </p>
        </div>
        <ProvenanceChip type="ai_analysis" />
      </div>

      <div className="space-y-4 min-h-[400px]">
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
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#2F7D4F] text-white rounded-lg flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <span className="font-bold text-xs text-[#143D2A]">SmartFarm AI Response</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase">
                    Confidence: {msg.confidence || 'High'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-stone-900 leading-relaxed">{msg.summary}</p>

                {msg.recommendations && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-stone-700 block uppercase tracking-wider">
                      Grounded Recommendations:
                    </span>
                    {msg.recommendations.map((rec: any, rIdx: number) => (
                      <div key={rIdx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <p className="font-bold text-[#143D2A]">{rec.action}</p>
                        <p className="text-stone-600">{rec.reason}</p>
                        {rec.evidence_refs && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-stone-400 font-semibold">Evidence:</span>
                            {rec.evidence_refs.map((ev: string, eIdx: number) => (
                              <span key={eIdx} className="text-[10px] px-2 py-0.5 bg-stone-200 text-stone-700 rounded font-medium">
                                {ev}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {msg.limitations && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                    <span className="font-bold block flex items-center gap-1 text-amber-950">
                      <AlertCircle size={14} /> Safety Disclaimer:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {msg.limitations.map((lim: string, lIdx: number) => (
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
              <div className="w-5 h-5 border-2 border-[#2F7D4F] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium text-stone-600">Retrieving farm context & grounding rules...</span>
            </Card>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your crops, tasks, or weather..."
          className="flex-1 px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7D4F] shadow-sm"
        />
        <Button type="submit" isLoading={loading} className="px-6">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
