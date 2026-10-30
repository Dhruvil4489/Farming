'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Info,
  Shield,
  Trash2,
  ChevronRight,
  Sprout,
  Eye,
  FileQuestion,
  X,
  History,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';

interface FieldOption {
  id: string;
  name: string;
  farm?: { name: string; id: string };
}

interface TopKCandidate {
  label: string;
  crop: string;
  disease: string;
  isHealthy: boolean;
  score: number;
}

interface DiagnosisResult {
  id?: string;
  status: 'accepted' | 'uncertain' | 'not_crop' | 'model_not_ready';
  predictedLabel?: string | null;
  crop?: string | null;
  disease?: string | null;
  isHealthy?: boolean | null;
  confidence?: number | null;
  topK: TopKCandidate[];
  model?: {
    name: string;
    architecture: string;
    version: string;
    license: string;
  };
  uncertainty?: {
    isUncertain: boolean;
    reason?: string | null;
    topTwoDifference?: number | null;
    caveat: string;
  };
  explanation?: string;
  diagnosedAt?: string;
  imageFilename?: string;
}

interface HistoryItem {
  id: string;
  status: string;
  crop: string | null;
  disease: string | null;
  isHealthy: boolean | null;
  confidence: number | null;
  diagnosedAt: string;
  imageFilename: string;
  field: { name: string };
}

export function DiseaseClassifierCard() {
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [notes, setNotes] = useState('');

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load fields
  useEffect(() => {
    fetch('/api/v1/fields')
      .then((r) => r.json())
      .then((json) => {
        const list = json.data || [];
        setFields(list);
        // Defaults to General Purpose Scan
      })
      .catch(() => {});
  }, [selectedFieldId]);

  // Load history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/v1/diagnosis/history?limit=10');
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data?.history || []);
      }
    } catch {
      // Silently catch
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle file selection
  const handleFile = (file: File) => {
    setError(null);
    setResult(null);

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 10 MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run Diagnosis
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (selectedFieldId) formData.append('fieldId', selectedFieldId);
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await fetch('/api/v1/diagnosis/predict', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || `Diagnosis failed (HTTP ${res.status})`);
      }

      setResult(json.data?.diagnosis || null);
      loadHistory();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during image analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Delete history item
  const handleDeleteHistory = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/diagnosis/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // Silently catch
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Plot Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <Sprout size={18} className="text-emerald-700" />
          <span className="text-xs font-bold text-stone-700">Diagnosis Mode:</span>
          {fields.length === 0 ? (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              General Purpose Scan (Any Crop / No Farm Setup Required)
            </span>
          ) : (
            <select
              id="diagnosis-field-select"
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            >
              <option value="">General Purpose Scan (Any Crop)</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  Assign to: {f.name} ({f.farm?.name || 'Farm'})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs h-8"
          >
            <History size={14} className="mr-1.5" />
            {showHistory ? 'Hide History' : 'Diagnosis History'} ({history.length})
          </Button>
        </div>
      </div>

      {/* Main Upload / Analyze Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Dropzone & Preview */}
        <Card className="p-6 rounded-3xl space-y-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Camera size={18} className="text-[#2F7D4F]" />
              Upload Crop Leaf Photo
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">JPEG, PNG, WebP ≤ 10MB</span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            id="leaf-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {!previewUrl ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-400'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-stone-200 flex items-center justify-center mx-auto text-emerald-700 mb-3">
                <Upload size={24} />
              </div>
              <p className="text-sm font-bold text-stone-800">
                Click to browse or drag & drop leaf photo
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Take a close-up photo of the affected leaf in good natural light. Avoid blurred or distant whole-canopy shots.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-black aspect-video max-h-72 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Leaf photo preview"
                  className="max-h-72 w-auto object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={clearSelection}
                  className="absolute top-2 right-2 bg-stone-900/80 text-white rounded-full p-1.5 hover:bg-stone-900 transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600 px-1">
                <span className="font-medium truncate max-w-[200px]">{selectedFile?.name}</span>
                <span>{(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          )}

          {/* Optional Observation Notes */}
          <div className="space-y-1">
            <label htmlFor="diagnosis-notes" className="text-xs font-semibold text-stone-700 block">
              Field Notes / Symptoms Observed (Optional)
            </label>
            <input
              id="diagnosis-notes"
              type="text"
              placeholder="e.g. Yellow lesions appearing on lower leaves after rain"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            />
          </div>

          {/* Analyze Action Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || analyzing}
            className="w-full h-11 text-sm font-bold bg-[#143D2A] hover:bg-[#0F2D1F] text-white rounded-xl shadow-xs"
          >
            {analyzing ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Analyzing Leaf Visual Patterns...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2 text-emerald-300" />
                Analyze Crop Leaf
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong className="block font-bold">Analysis Error</strong>
                {error}
              </div>
            </div>
          )}
        </Card>

        {/* Right Column: Prediction Results & Agronomic Guidance */}
        <div className="space-y-4">
          {!result && !analyzing && (
            <Card className="p-8 rounded-3xl text-center space-y-4 border-2 border-dashed border-stone-200 bg-stone-50/50 h-full flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-3xl bg-stone-200/70 text-stone-500 flex items-center justify-center">
                <FileQuestion size={32} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-stone-800">Awaiting Leaf Photo</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Select a photo of a crop leaf and click <strong>Analyze Crop Leaf</strong>. The classifier will screen for 38 common crop diseases and healthy leaf conditions.
                </p>
              </div>
              <div className="text-[11px] text-stone-400 bg-white p-3 rounded-xl border border-stone-200/80 text-left space-y-1 w-full max-w-sm">
                <strong className="block text-stone-700 font-semibold">Supported Benchmark Crops:</strong>
                <p>Apple, Corn, Grape, Potato, Tomato, Bell Pepper, Peach, Strawberry, Cherry, Blueberry, Orange, Soybean, Squash.</p>
              </div>
            </Card>
          )}

          {analyzing && (
            <Card className="p-10 rounded-3xl text-center space-y-4 border border-stone-200 bg-stone-50/30 h-full flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-[#2F7D4F] animate-spin mx-auto" />
                <Sparkles size={18} className="text-[#2F7D4F] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-stone-900">Screening Leaf Pathology</h4>
                <p className="text-xs text-stone-500">
                  Pre-processing resolution, evaluating foliage color ratio, and running inference...
                </p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-4">
              {/* Primary Result Banner */}
              {result.status === 'model_not_ready' ? (
                <Card className="p-6 rounded-3xl space-y-3 border-amber-300 bg-amber-50">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertTriangle size={18} className="text-amber-600" />
                    Model Checkpoint Unavailable
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {result.explanation || 'The model checkpoint is not loaded on the inference service.'}
                  </p>
                </Card>
              ) : result.status === 'not_crop' ? (
                <Card className="p-6 rounded-3xl space-y-3 border-rose-300 bg-rose-50">
                  <div className="flex items-center gap-2 text-rose-950 font-bold text-sm">
                    <AlertTriangle size={18} className="text-rose-600" />
                    Non-Crop Foliage Detected
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {result.explanation}
                  </p>
                </Card>
              ) : (
                <Card className="p-6 rounded-3xl space-y-4 border border-stone-200/90 shadow-sm">
                  {/* Status & Provenance Header */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        {result.crop || 'Crop'} Finding
                      </span>
                      {result.status === 'uncertain' && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          UNCERTAIN
                        </span>
                      )}
                      {result.status === 'accepted' && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          CONFIDENT MATCH
                        </span>
                      )}
                    </div>
                    <ProvenanceChip
                      type="model_prediction"
                      label={result.model ? `${result.model.architecture || 'ResNet-50'} v${result.model.version || '1.0.0'}` : 'AI Diagnosis'}
                      source={result.model?.name || 'Local ResNet-50 Classifier'}
                      timestamp={result.diagnosedAt}
                    />
                  </div>

                  {/* Primary Disease Diagnosis Name */}
                  <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-100 space-y-1">
                    <span className="text-xs font-bold text-stone-500 block">Diagnosed Condition</span>
                    <h2 className="text-xl font-black text-[#0F2D1F]">
                      {result.disease || result.predictedLabel}
                    </h2>
                    <p className="text-xs text-stone-600">
                      Crop Host: <strong>{result.crop}</strong> · Status:{' '}
                      <strong className={result.isHealthy ? 'text-emerald-700' : 'text-amber-800'}>
                        {result.isHealthy ? 'Healthy Plant Foliage' : 'Pathogen / Disease Symptom'}
                      </strong>
                    </p>
                  </div>

                  {/* Softmax Certainty Meter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-stone-700">Visual Pattern Alignment (Softmax Score):</span>
                      <span className="text-[#0F2D1F] font-mono">
                        {result.confidence != null ? `${(result.confidence * 100).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          result.status === 'uncertain'
                            ? 'bg-amber-500'
                            : (result.confidence || 0) > 0.8
                            ? 'bg-emerald-600'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(Math.max((result.confidence || 0) * 100, 5), 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-stone-500 italic pt-0.5">
                      * Softmax certainty indicates statistical similarity to the training benchmark categories; it is not a guaranteed clinical certainty.
                    </p>
                  </div>

                  {/* Top-3 Candidate Differential Breakdown */}
                  {result.topK && result.topK.length > 1 && (
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      <span className="text-xs font-bold text-stone-700 block">
                        Top Candidate Possibilities:
                      </span>
                      <div className="space-y-1.5">
                        {result.topK.map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-stone-50 border border-stone-200/60"
                          >
                            <span className="font-semibold text-stone-800">
                              {idx + 1}. {c.crop} - {c.disease}
                            </span>
                            <span className="font-mono font-bold text-stone-600">
                              {(c.score * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uncertainty Warning Banner */}
                  {result.uncertainty?.isUncertain && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Uncertain Diagnosis</strong>
                        {result.uncertainty.reason || 'Visual evidence is ambiguous.'} Take another photo from a different angle or consult a local agricultural expert.
                      </div>
                    </div>
                  )}

                  {/* Provider & Model Architecture Attribution Footer */}
                  {result.model && (
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-500">
                      <span>Provider: <strong className="text-stone-700">{result.model.name}</strong></span>
                      <span>Model: <strong className="text-stone-700">{result.model.architecture} v{result.model.version}</strong></span>
                      <span>License: <strong className="text-stone-700">{result.model.license}</strong></span>
                    </div>
                  )}

                  {/* Action Link: Log as Field Scouting Observation */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <Link
                      href={`/scouting`}
                      className="text-xs font-bold text-[#2F7D4F] hover:underline flex items-center gap-1"
                    >
                      <Eye size={14} /> Record in Field Scouting Log <ChevronRight size={12} />
                    </Link>
                    <Button variant="outline" size="sm" onClick={clearSelection} className="text-xs h-8">
                      Scan Another Leaf
                    </Button>
                  </div>
                </Card>
              )}

              {/* Critical Safety & Non-Clinical Disclaimer */}
              <div className="p-4 bg-stone-100/80 border border-stone-200 rounded-2xl flex items-start gap-3">
                <Shield size={18} className="text-stone-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-stone-600 leading-relaxed">
                  <strong className="text-stone-900 block text-xs font-bold mb-0.5">Agronomic Screening Disclaimer</strong>
                  This feature provides AI-based visual screening. It does not replace field physical inspection, soil/water testing, or professional agronomist advice.
                  <strong> Never apply chemical fungicides or pesticides solely based on an AI image prediction.</strong> Always confirm symptoms with your local Krishi Vigyan Kendra (KVK) or extension officer.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diagnosis History Drawer / Section */}
      {showHistory && (
        <Card className="p-6 rounded-3xl space-y-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <History size={18} className="text-[#2F7D4F]" />
              Recent Field Diagnosis History
            </h3>
            {historyLoading && <RefreshCw size={14} className="animate-spin text-stone-400" />}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-stone-500 italic text-center py-6">
              No previous diagnosis records saved yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-stone-500 font-bold uppercase tracking-wider">
                    <th className="pb-2 pr-3">Date</th>
                    <th className="pb-2 pr-3">Field</th>
                    <th className="pb-2 pr-3">Finding</th>
                    <th className="pb-2 pr-3">Confidence</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-2.5 pr-3 font-mono text-stone-600">
                        {new Date(item.diagnosedAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour12: false,
                        })}
                      </td>
                      <td className="py-2.5 pr-3 font-bold text-stone-900">{item.field?.name}</td>
                      <td className="py-2.5 pr-3 text-stone-800">
                        {item.crop ? `${item.crop} - ` : ''}
                        <strong>{item.disease || 'Unidentified'}</strong>
                      </td>
                      <td className="py-2.5 pr-3 font-mono">
                        {item.confidence != null ? `${(item.confidence * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : item.status === 'uncertain'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-stone-100 text-stone-700 border-stone-300'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          disabled={deletingId === item.id}
                          className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
