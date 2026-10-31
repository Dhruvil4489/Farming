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
  ChevronDown,
  Sprout,
  Eye,
  FileQuestion,
  X,
  History,
  Printer,
  Download,
  AlertCircle,
  Check,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  Activity,
  Award,
  Cpu,
  FileText,
  Star,
  Send,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { useI18n } from '@/providers/I18nProvider';
import { AgronomicDiseaseInfo } from '@/lib/crop-disease-knowledge';
import { UNIVERSAL_CROP_CATALOG, AI_MODEL_REGISTRY, CropCatalogEntry, RegisteredModel } from '@/services/ai/CropModelRegistry';

interface FieldOption {
  id: string;
  name: string;
  farm?: { name: string; id: string };
  cropCycles?: Array<{ crop?: { slug: string }; customCropName?: string }>;
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
  status: 'accepted' | 'uncertain' | 'not_crop' | 'unsupported_crop' | 'in_validation' | 'blurry_image' | 'model_not_ready';
  selectedCrop?: string | null;
  detectedCrop?: string | null;
  predictedLabel?: string | null;
  crop?: string | null;
  disease?: string | null;
  isHealthy?: boolean | null;
  confidence?: number | null;
  severity?: 'mild' | 'moderate' | 'severe' | 'none';
  topK: TopKCandidate[];
  model?: {
    modelId?: string;
    name: string;
    architecture: string;
    version: string;
    license: string;
    datasetSource?: string;
    status?: string;
    accuracy?: number;
    f1Score?: number;
  };
  uncertainty?: {
    isUncertain: boolean;
    reason?: string | null;
    topTwoDifference?: number | null;
    caveat: string;
  };
  pathology?: AgronomicDiseaseInfo | null;
  validationNotice?: string | null;
  explanation?: string;
  diagnosedAt?: string;
  imageFilename?: string;
  field?: {
    id: string;
    name: string;
    farm?: { id: string; name: string };
  };
}

interface HistoryItem {
  id: string;
  status: string;
  selectedCrop?: string | null;
  detectedCrop?: string | null;
  crop: string | null;
  disease: string | null;
  isHealthy: boolean | null;
  confidence: number | null;
  severity?: 'mild' | 'moderate' | 'severe' | 'none';
  diagnosedAt: string;
  imageFilename: string;
  modelId?: string;
  modelName?: string;
  field: { name: string };
  pathology?: AgronomicDiseaseInfo | null;
}

export function DiseaseClassifierCard() {
  const { t, formatDate, formatNumber } = useI18n();

  const [fields, setFields] = useState<FieldOption[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('auto');
  const [notes, setNotes] = useState('');

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTreatmentTab, setActiveTreatmentTab] = useState<'organic' | 'chemical'>('organic');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackIsAccurate, setFeedbackIsAccurate] = useState<boolean>(true);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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
        if (list.length > 0 && !selectedFieldId) {
          setSelectedFieldId(list[0].id);
        }
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

  // Selected crop info
  const activeCropMeta = selectedCropId !== 'auto' ? UNIVERSAL_CROP_CATALOG.find((c) => c.cropId === selectedCropId) : null;
  const activeModelMeta = activeCropMeta ? AI_MODEL_REGISTRY[activeCropMeta.primaryModelId] : null;

  // Handle file selection
  const handleFile = (file: File) => {
    setError(null);
    setResult(null);
    setFeedbackSubmitted(false);

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum allowable limit of 10 MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a clear JPEG, PNG, or WebP photograph.');
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
    setFeedbackSubmitted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run Diagnosis
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);
    setFeedbackSubmitted(false);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (selectedFieldId) formData.append('fieldId', selectedFieldId);
      if (selectedCropId && selectedCropId !== 'auto') formData.append('crop', selectedCropId);
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

  // Submit Feedback
  const handleSubmitFeedback = async () => {
    if (!result?.id) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/v1/diagnosis/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId: result.id,
          isAccurate: feedbackIsAccurate,
          rating: feedbackRating,
          comments: feedbackComments.trim() || undefined,
        }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
      }
    } catch {
      // Catch error
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Delete history item
  const handleDeleteHistory = async (id: string) => {
    if (!confirm(t('diagnosis_delete_confirm', 'Delete this diagnosis record permanently?'))) return;
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Field Plot Selection & Crop Router Mode */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-stone-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sprout size={18} className="text-[#2F7D4F]" />
            <span className="text-xs font-bold text-stone-700">{t('target_field', 'Target Field Plot')}:</span>
            {fields.length === 0 ? (
              <span className="text-xs text-stone-500 italic">No registered fields</span>
            ) : (
              <select
                id="diagnosis-field-select"
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.farm?.name || 'Farm'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Crop Selector with Multi-Model Taxonomy */}
          <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
            <Cpu size={18} className="text-[#2F7D4F]" />
            <span className="text-xs font-bold text-stone-700">Crop Route:</span>
            <select
              id="diagnosis-crop-select"
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            >
              <option value="auto">✨ AI Auto-Detect Crop (Dynamic Router)</option>
              <optgroup label="Commercial & Fiber Crops">
                <option value="cotton">Cotton (कपास) — Specialist Model (5 classes)</option>
                <option value="sugarcane">Sugarcane (गन्ना) — In Validation</option>
              </optgroup>
              <optgroup label="Cereal Crops">
                <option value="wheat">Wheat (गेहूं) — Specialist Model (6 classes)</option>
                <option value="rice">Rice / Paddy (धान) — Specialist Model (6 classes)</option>
                <option value="maize">Maize / Corn (मक्का) — Benchmark Model (4 classes)</option>
              </optgroup>
              <optgroup label="Oilseeds & Pulses">
                <option value="soybean">Soybean (सोयाबीन) — Benchmark Model</option>
                <option value="groundnut">Groundnut (मूंगफली) — In Validation</option>
                <option value="mustard">Mustard (सरसों) — In Validation</option>
                <option value="chickpea">Chickpea (चना) — In Validation</option>
                <option value="pigeonpea">Pigeon Pea (अरहर / तूर) — In Validation</option>
              </optgroup>
              <optgroup label="Horticultural Vegetables">
                <option value="tomato">Tomato (टमाटर) — Benchmark Model (10 classes)</option>
                <option value="potato">Potato (आलू) — Benchmark Model (3 classes)</option>
                <option value="chilli">Chilli (मिर्च) — Specialist Model (4 classes)</option>
                <option value="pepper">Bell Pepper (शिमला मिर्च) — Benchmark Model</option>
                <option value="onion">Onion (प्याज) — In Validation</option>
                <option value="garlic">Garlic (लहसुन) — In Validation</option>
                <option value="brinjal">Brinjal (बैंगन) — In Validation</option>
                <option value="okra">Okra / Bhindi (भिंडी) — In Validation</option>
                <option value="cabbage">Cabbage (पत्तागोभी) — In Validation</option>
                <option value="cauliflower">Cauliflower (फूलगोभी) — In Validation</option>
              </optgroup>
              <optgroup label="Fruits & Plantation">
                <option value="grape">Grapes (अंगूर) — Benchmark Model (4 classes)</option>
                <option value="apple">Apple (सेब) — Benchmark Model (4 classes)</option>
                <option value="citrus">Citrus (संतरा / नींबू) — Benchmark Model</option>
                <option value="banana">Banana (केला) — In Validation</option>
                <option value="mango">Mango (आम) — In Validation</option>
                <option value="papaya">Papaya (पपीता) — In Validation</option>
                <option value="pomegranate">Pomegranate (अनार) — In Validation</option>
                <option value="guava">Guava (अमरूद) — In Validation</option>
                <option value="watermelon">Watermelon (तरबूज) — In Validation</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs h-8 rounded-xl"
          >
            <History size={14} className="mr-1.5 text-[#2F7D4F]" />
            {showHistory ? t('diagnosis_btn_hide_history', 'Hide History') : t('diagnosis_btn_history', 'Diagnosis History')} ({history.length})
          </Button>
        </div>
      </div>

      {/* Model Router Status Pill */}
      <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#2F7D4F] shrink-0" />
          <span>
            {selectedCropId === 'auto' ? (
              <strong>Universal Model Router Active:</strong>
            ) : (
              <strong>Selected Target: {activeCropMeta?.cropName} ({activeCropMeta?.scientificName}) —</strong>
            )}
            {' '}
            {selectedCropId === 'auto'
              ? 'Multi-Model Pipeline automatically classifies crop species and routes to Specialist (Cotton, Wheat, Rice, Chilli) or Horticultural Benchmark networks.'
              : activeCropMeta?.status === 'specialist_active'
              ? `${activeModelMeta?.name} (${activeModelMeta?.architecture}) with ${activeCropMeta.supportedDiseasesCount} verified classes. Accuracy: ${(activeModelMeta?.validationMetrics.accuracy! * 100).toFixed(1)}%.`
              : activeCropMeta?.status === 'benchmark_active'
              ? `PlantVillage Horticultural Network with ${activeCropMeta.supportedDiseasesCount} benchmark classes.`
              : 'Specialist weights undergoing multi-season field trials with Agricultural Universities. Real-time botanical identification and ICAR IPM prevention.'}
          </span>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#143D2A] border border-emerald-300">
          {selectedCropId === 'auto' ? 'Dynamic Orchestration' : activeCropMeta?.statusBadge}
        </span>
      </div>

      {/* Main Upload / Analyze Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
        {/* Left Column: Image Dropzone & Preview */}
        <Card className="p-6 rounded-3xl space-y-4 border border-stone-200 print:border-none print:shadow-none bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Camera size={18} className="text-[#2F7D4F]" />
              {t('diagnosis_upload_title', 'Upload Crop Leaf Photo')}
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
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-400'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-stone-200 flex items-center justify-center mx-auto text-[#2F7D4F] mb-3">
                <Upload size={24} />
              </div>
              <p className="text-sm font-bold text-stone-800">
                {t('diagnosis_dropzone_prompt', 'Click to browse or drag & drop leaf photo')}
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {t('diagnosis_dropzone_hint', 'Take a clear close-up photo of the affected leaf in good natural light. Avoid blurred or distant canopy shots.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-black aspect-video max-h-72 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Crop Leaf Preview"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  onClick={clearSelection}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors print:hidden"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                <span>File: <strong className="text-stone-800">{selectedFile?.name}</strong></span>
                <span>Size: {(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          )}

          {/* Farmer Notes */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="diagnosis-notes" className="text-xs font-semibold text-stone-700 block">
              {t('diagnosis_notes_label', 'Field Notes & Visual Symptoms (Optional)')}
            </label>
            <textarea
              id="diagnosis-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Yellowing observed on lower foliage after 3 days of rain; top leaves unaffected..."
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 print:hidden">
            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile || analyzing}
              className="flex-1 bg-[#143D2A] hover:bg-[#0F2D1F] text-white font-bold text-xs h-11 rounded-2xl transition-all shadow-sm"
            >
              {analyzing ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  {t('diagnosis_btn_analyzing', 'Routing & Analyzing Leaf...')}
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2 text-emerald-400" />
                  {t('diagnosis_btn_analyze', 'Analyze Crop Leaf')}
                </>
              )}
            </Button>
            {selectedFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="text-xs h-11 px-4 rounded-2xl"
              >
                Clear
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-red-900 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Analysis Notice</p>
                <p className="text-[11px] font-normal text-red-800 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Right Column: Dynamic Diagnosis Results */}
        <Card className="p-6 rounded-3xl border border-stone-200 bg-white space-y-5 flex flex-col justify-between">
          {!result && !analyzing && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#2F7D4F] flex items-center justify-center">
                <Eye size={28} />
              </div>
              <h4 className="text-base font-bold text-stone-800">
                {t('diagnosis_awaiting_title', 'Awaiting Leaf Photograph')}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
                {t('diagnosis_awaiting_desc', 'Select a crop route or use Auto-Detect, upload a clear close-up leaf photograph, and click Analyze Crop Leaf to initiate multi-model computer vision screening.')}
              </p>
            </div>
          )}

          {analyzing && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100/60 flex items-center justify-center animate-pulse">
                  <Sparkles size={28} className="text-[#2F7D4F]" />
                </div>
                <div className="absolute inset-0 rounded-3xl border-2 border-[#2F7D4F] border-t-transparent animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-stone-900">
                  {t('diagnosis_scanning_title', 'Scanning Vegetative Structure...')}
                </h4>
                <p className="text-xs text-stone-500 max-w-xs">
                  {t('diagnosis_scanning_desc', 'Validating foliage presence, extracting venation patterns, and routing to specialist neural model.')}
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Result Header */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        result.status === 'accepted'
                          ? 'bg-emerald-100 text-[#143D2A] border-emerald-300'
                          : result.status === 'in_validation'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : result.status === 'blurry_image'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {result.status === 'accepted'
                        ? 'Diagnostic Match Confirmed'
                        : result.status === 'in_validation'
                        ? 'Crop Identified • In Validation'
                        : result.status === 'blurry_image'
                        ? 'Image Quality Issue'
                        : 'Uncertain Diagnosis'}
                    </span>
                    {result.detectedCrop && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                        Crop: {result.detectedCrop}
                      </span>
                    )}
                    {result.model && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                        {result.model.architecture || result.model.name}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-stone-900 tracking-tight">
                    {result.disease || result.predictedLabel}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Crop: <strong className="text-stone-800">{result.crop}</strong>
                    {result.pathology?.pathogenName && (
                      <span className="italic ml-1">({result.pathology.pathogenName})</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="text-xs h-8 rounded-xl"
                    title="Print or Export Diagnostic Certificate"
                  >
                    <Printer size={14} className="mr-1 text-[#2F7D4F]" />
                    Print
                  </Button>
                </div>
              </div>

              {/* Status Notice if in validation */}
              {result.status === 'in_validation' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950">
                  <div className="flex items-center gap-2 font-bold">
                    <Info size={16} className="text-amber-700" />
                    <span>Scientific Diagnostic Safety Boundary</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-900">
                    {result.validationNotice || result.explanation}
                  </p>
                </div>
              )}

              {/* Confidence & Severity KPI Cards */}
              {result.status !== 'in_validation' && result.status !== 'blurry_image' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                    <span className="text-[11px] font-semibold text-stone-500 block">Model Confidence</span>
                    <span className="text-lg font-black text-stone-900 tracking-tight">
                      {result.confidence != null ? `${(result.confidence * 100).toFixed(1)}%` : '—'}
                    </span>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-[#2F7D4F] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (result.confidence || 0) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                    <span className="text-[11px] font-semibold text-stone-500 block">Severity Rating</span>
                    <span
                      className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mt-1 capitalize ${
                        result.severity === 'severe'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : result.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : result.severity === 'mild'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-stone-100 text-stone-700 border-stone-300'
                      }`}
                    >
                      {result.severity || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-1">Based on leaf coverage</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-semibold text-stone-500 block">Pathogen Type</span>
                    <span className="text-sm font-bold text-stone-800 block mt-1 capitalize">
                      {result.pathology?.pathogenType || (result.isHealthy ? 'Non-pathogenic' : 'Specialist')}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      {result.isHealthy ? 'Optimal health' : 'Infectious agent'}
                    </span>
                  </div>
                </div>
              )}

              {/* Top-3 Differential Diagnostic Candidates */}
              {result.topK && result.topK.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-700 block">
                    Top Differential Predictions (Candidate Ranking):
                  </span>
                  <div className="space-y-1.5">
                    {result.topK.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          idx === 0
                            ? 'bg-emerald-50/70 border-emerald-200 font-bold text-stone-900'
                            : 'bg-stone-50 border-stone-200/70 text-stone-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-700">
                            #{idx + 1}
                          </span>
                          <span>{item.disease}</span>
                          {item.isHealthy && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                              Healthy
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-stone-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${idx === 0 ? 'bg-[#2F7D4F]' : 'bg-stone-400'}`}
                              style={{ width: `${Math.min(100, item.score * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px]">{(item.score * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agronomic Symptoms & Causes */}
              {result.pathology && (
                <div className="space-y-4 pt-1">
                  {result.pathology.symptoms && result.pathology.symptoms.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Activity size={14} className="text-[#2F7D4F]" />
                        Key Visual Symptoms Detected:
                      </span>
                      <ul className="list-disc list-inside text-xs text-stone-600 space-y-1 pl-1">
                        {result.pathology.symptoms.map((s, i) => (
                          <li key={i} className="leading-relaxed">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Treatment Recommendations with Dual Tabs */}
                  {!result.isHealthy && (
                    <div className="space-y-2 border-t border-stone-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <Shield size={14} className="text-[#2F7D4F]" />
                          ICAR-Aligned Management Guidance:
                        </span>
                        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl text-[11px] font-bold">
                          <button
                            onClick={() => setActiveTreatmentTab('organic')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                              activeTreatmentTab === 'organic'
                                ? 'bg-white text-[#143D2A] shadow-xs'
                                : 'text-stone-500 hover:text-stone-900'
                            }`}
                          >
                            Organic Solutions
                          </button>
                          <button
                            onClick={() => setActiveTreatmentTab('chemical')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                              activeTreatmentTab === 'chemical'
                                ? 'bg-white text-stone-900 shadow-xs'
                                : 'text-stone-500 hover:text-stone-900'
                            }`}
                          >
                            Chemical Controls
                          </button>
                        </div>
                      </div>

                      {activeTreatmentTab === 'organic' && (
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs space-y-2">
                          <strong className="text-emerald-950 block font-bold">
                            Organic & Bio-Pesticide Treatments:
                          </strong>
                          <ul className="list-disc list-inside space-y-1 text-emerald-900">
                            {result.pathology.organicOptions?.map((o, idx) => (
                              <li key={idx} className="leading-relaxed">{o}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeTreatmentTab === 'chemical' && (
                        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2">
                          <strong className="text-amber-950 block font-bold">
                            CIBRC Chemical Recommendations:
                          </strong>
                          <ul className="list-disc list-inside space-y-1 text-amber-900">
                            {result.pathology.chemicalOptions?.map((c, idx) => (
                              <li key={idx} className="leading-relaxed">{c}</li>
                            ))}
                          </ul>
                          {result.pathology.chemicalPrecautions && (
                            <p className="text-[11px] text-amber-800/90 border-t border-amber-200/60 pt-2 italic">
                              <strong>Safety & Pre-Harvest Interval (PHI):</strong> {result.pathology.chemicalPrecautions}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* KVK Escalation Trigger */}
                  {result.pathology.whenToConsultExpert && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-[11px] text-stone-600 flex items-start gap-2">
                      <HelpCircle size={15} className="text-[#2F7D4F] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-stone-800">When to Escalate to Local KVK:</strong>{' '}
                        {result.pathology.whenToConsultExpert}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Technical Model Details Accordion */}
              {result.model && (
                <div className="border-t border-stone-100 pt-3">
                  <button
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="w-full flex items-center justify-between text-xs font-bold text-stone-600 hover:text-stone-900 py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Cpu size={14} className="text-[#2F7D4F]" />
                      Technical Model & Preprocessing Specs
                    </span>
                    {showTechnicalDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {showTechnicalDetails && (
                    <div className="mt-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-[11px] text-stone-600 space-y-1.5 font-mono">
                      <div>Model: <strong className="text-stone-800">{result.model.name}</strong></div>
                      <div>Architecture: <strong className="text-stone-800">{result.model.architecture}</strong></div>
                      <div>Version: {result.model.version} | License: {result.model.license}</div>
                      <div>Dataset: {result.model.datasetSource || 'Curated Indian Agriculture Archive'}</div>
                      {result.model.accuracy && (
                        <div>Validation Accuracy: {(result.model.accuracy * 100).toFixed(1)}% | F1: {(result.model.f1Score! * 100).toFixed(1)}%</div>
                      )}
                      <div>Resolution: 224x224 RGB | Normalization: ImageNet Mean/Std</div>
                    </div>
                  )}
                </div>
              )}

              {/* Farmer Diagnostic Accuracy Feedback */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 print:hidden">
                <span className="text-xs font-bold text-stone-800 block flex items-center gap-1.5">
                  <Award size={14} className="text-[#2F7D4F]" />
                  Was this diagnosis accurate for your field plot?
                </span>

                {!feedbackSubmitted ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className={`p-1 rounded-md transition-colors ${
                              feedbackRating >= star ? 'text-amber-500' : 'text-stone-300'
                            }`}
                          >
                            <Star size={16} fill={feedbackRating >= star ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setFeedbackIsAccurate(true)}
                          className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${
                            feedbackIsAccurate
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-white text-stone-600 border-stone-200'
                          }`}
                        >
                          ✔ Correct Disease
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackIsAccurate(false)}
                          className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${
                            !feedbackIsAccurate
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-white text-stone-600 border-stone-200'
                          }`}
                        >
                          ✖ Incorrect
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        placeholder="Add optional notes for agronomic researchers..."
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#2F7D4F]"
                      />
                      <Button
                        size="sm"
                        onClick={handleSubmitFeedback}
                        disabled={feedbackLoading}
                        className="bg-[#143D2A] hover:bg-[#0F2D1F] text-white text-xs h-8 px-3 rounded-xl"
                      >
                        {feedbackLoading ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} className="mr-1" />}
                        Submit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-900 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Thank you! Your feedback has been recorded to improve model precision.
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Diagnosis History Table (Collapsible) */}
      {showHistory && (
        <Card className="p-6 rounded-3xl border border-stone-200 bg-white space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <History size={18} className="text-[#2F7D4F]" />
              {t('diagnosis_history_title', 'Recent Crop Diagnosis History')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={historyLoading}
              className="text-xs h-8 rounded-xl"
            >
              <RefreshCw size={13} className={`mr-1 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              No diagnosis records found for your farm plots yet. Upload a leaf photo above to log your first screening.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Field</th>
                    <th className="p-3">Detected Crop</th>
                    <th className="p-3">Disease Diagnosis</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Model</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3 font-medium whitespace-nowrap">
                        {formatDate(item.diagnosedAt, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 font-bold text-stone-900 whitespace-nowrap">
                        {item.field?.name || 'Plot'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-stone-800">{item.crop || item.detectedCrop || 'Unknown'}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900 block">{item.disease || 'General Foliage'}</span>
                        {item.isHealthy && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {item.confidence != null ? `${(item.confidence * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="p-3 capitalize">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.severity === 'severe'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : item.severity === 'moderate'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {item.severity || 'mild'}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-stone-500 font-mono">
                        {item.modelName || item.modelId || 'ResNet-50'}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 size={14} className={deletingId === item.id ? 'animate-spin' : ''} />
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
