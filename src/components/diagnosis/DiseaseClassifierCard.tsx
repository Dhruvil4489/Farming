'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductImage } from '@/components/ui/ProductImage';
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
  ShoppingBag,
  ShoppingCart,
  ArrowRight,
  PackageCheck,
  PackageX,
  CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { useI18n } from '@/providers/I18nProvider';
import { AgronomicDiseaseInfo } from '@/lib/crop-disease-knowledge';
import { UNIVERSAL_CROP_CATALOG, AI_MODEL_REGISTRY, CropCatalogEntry, CropModelRegistry } from '@/services/ai/CropModelRegistry';
import { RecommendedMedicineCard, MatchingResult } from '@/services/DiseaseProductMatchingService';
import { AGRICULTURAL_CROP_GROUPS } from '@/lib/agricultural-crops';

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
  status: 'accepted' | 'crop_mismatch' | 'uncertain' | 'not_crop' | 'unsupported_crop' | 'in_validation' | 'blurry_image' | 'model_not_ready';
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
  recommendations?: MatchingResult | null;
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
  recommendations?: MatchingResult | null;
}

const ANALYSIS_STAGES = [
  { step: 1, label: 'Uploading leaf photograph...' },
  { step: 2, label: 'Validating image quality & leaf presence...' },
  { step: 3, label: 'Identifying botanical crop species...' },
  { step: 4, label: 'Routing to specialist neural model...' },
  { step: 5, label: 'Verifying ICAR & CIBRC treatment guidelines...' },
  { step: 6, label: 'Matching verified medicines in Fertilizer Store...' },
  { step: 7, label: 'Preparing comprehensive diagnostic report...' },
];

export function DiseaseClassifierCard() {
  const router = useRouter();
  const { t, formatDate } = useI18n();

  const [fields, setFields] = useState<FieldOption[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [customCropName, setCustomCropName] = useState('');
  const [notes, setNotes] = useState('');

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTreatmentTab, setActiveTreatmentTab] = useState<'organic' | 'chemical'>('chemical');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Cart action state
  const [cartAddingId, setCartAddingId] = useState<string | null>(null);
  const [cartToast, setCartToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);

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
      .catch(() => { });
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
  const effectiveCrop = selectedCropId === 'other' ? customCropName.trim() : selectedCropId.trim();
  const activeCropMeta = effectiveCrop ? CropModelRegistry.findCrop(effectiveCrop) : null;

  // Handle file selection
  const handleFile = (file: File) => {
    setError(null);
    setResult(null);
    setFeedbackSubmitted(false);
    setSelectedCropId('');
    setCustomCropName('');

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
    setSelectedCropId('');
    setCustomCropName('');
    setResult(null);
    setError(null);
    setFeedbackSubmitted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run Diagnosis with Progress Simulation
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setAnalysisStep(1);
    setError(null);
    setResult(null);
    setFeedbackSubmitted(false);

    // Progress stepper interval
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 450);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (selectedFieldId) formData.append('fieldId', selectedFieldId);
      if (effectiveCrop && effectiveCrop !== 'auto') {
        formData.append('crop', effectiveCrop);
      }
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await fetch('/api/v1/diagnosis/predict', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);
      setAnalysisStep(7);

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || `Diagnosis failed (HTTP ${res.status})`);
      }

      setResult(json.data?.diagnosis || null);
      loadHistory();
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || 'An unexpected error occurred during image analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Add to Cart / Buy Now handler
  const handleAddToCart = async (product: RecommendedMedicineCard, buyNow = false) => {
    if (!product.inStock) {
      setCartToast({
        message: `${product.name} is currently out of stock in the store.`,
        type: 'error',
      });
      setTimeout(() => setCartToast(null), 3500);
      return;
    }

    setCartAddingId(product.id);
    try {
      const res = await fetch('/api/v1/store/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to add product to cart');
      }

      // Notify navbar and cart icon
      window.dispatchEvent(new Event('cart-updated'));

      if (buyNow) {
        router.push('/cart');
      } else {
        setCartToast({
          message: `Added 1 × ${product.name} to your Fertilizer Cart!`,
          type: 'success',
        });
        setTimeout(() => setCartToast(null), 4000);
      }
    } catch (err: any) {
      setCartToast({
        message: err.message || 'Could not add to cart. Please log in or check availability.',
        type: 'error',
      });
      setTimeout(() => setCartToast(null), 4000);
    } finally {
      setCartAddingId(null);
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
      // ignore
    } finally {
      setFeedbackLoading(false);
    }
  };

  // View full history record
  const handleSelectHistoryItem = async (itemId: string) => {
    setLoadingHistoryId(itemId);
    try {
      const res = await fetch(`/api/v1/diagnosis/history/${itemId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.diagnosis) {
          setResult(json.data.diagnosis);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistoryId(null);
    }
  };

  // Delete history record
  const handleDeleteHistory = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/diagnosis/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
        if (result?.id === id) {
          setResult(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {cartToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all border animate-in slide-in-from-bottom-3 ${cartToast.type === 'success'
              ? 'bg-[#143D2A] text-white border-emerald-600'
              : 'bg-red-900 text-white border-red-700'
            }`}
        >
          {cartToast.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-400 shrink-0" />
          )}
          <span>{cartToast.message}</span>
          <button
            onClick={() => setCartToast(null)}
            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Two-Column Analysis Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Image Upload & Crop Selector */}
        <Card className="p-6 rounded-3xl border border-stone-200 bg-white space-y-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Camera size={18} className="text-[#2F7D4F]" />
                {t('diagnosis_upload_title', 'Upload Diseased Crop Leaf')}
              </h3>
              <ProvenanceChip type="model_prediction" label="Universal Vision Model" />
            </div>
            <p className="text-xs text-stone-500">
              {t(
                'diagnosis_upload_desc',
                'Upload a sharp close-up photograph of an affected crop leaf showing visible lesions, discoloration, or wilt symptoms.'
              )}
            </p>
          </div>

          {/* Drag & Drop Upload Zone */}
          {!previewUrl ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 min-h-[220px] ${dragActive
                  ? 'border-[#2F7D4F] bg-emerald-50/50'
                  : 'border-stone-300 hover:border-stone-400 bg-stone-50/60'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-[#2F7D4F] flex items-center justify-center">
                <Upload size={22} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-stone-800">
                  {t('diagnosis_drag_prompt', 'Click to browse or drag & drop leaf photograph')}
                </p>
                <p className="text-[11px] text-stone-500">Supports JPEG, PNG, WebP up to 10 MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-3xl overflow-hidden border border-stone-200 bg-stone-900 flex items-center justify-center max-h-[300px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Crop leaf preview"
                  className="max-h-[300px] w-auto object-contain mx-auto"
                />
                <button
                  type="button"
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

          {/* Identify Your Crop (Optional) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label htmlFor="optional-crop-select" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sprout size={15} className="text-[#2F7D4F]" />
                {t('identify_crop_optional', 'Identify Your Crop (Optional)')}
              </label>
              <span className="text-[10px] text-stone-500 font-medium">
                {selectedCropId ? (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {t('specialist_context_mode', 'Specialist Mode')}
                  </span>
                ) : (
                  <span className="text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    {t('auto_detect_mode', 'Auto-Detects from Leaf')}
                  </span>
                )}
              </span>
            </div>

            <select
              id="optional-crop-select"
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-2.5 text-xs text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            >
              <option value="">✨ {t('auto_detect_leaf', 'Auto-Detect from Leaf Image (Recommended)')}</option>
              {AGRICULTURAL_CROP_GROUPS.map((cat) => (
                <optgroup key={cat.group} label={cat.group}>
                  {cat.options.map((crop) => (
                    <option key={crop.name} value={crop.name}>
                      {crop.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="other">{t('other_crop', 'Other Crop (Specify below)')}</option>
            </select>

            {selectedCropId === 'other' && (
              <input
                type="text"
                value={customCropName}
                onChange={(e) => setCustomCropName(e.target.value)}
                placeholder={t('enter_custom_crop', 'Enter custom crop name (e.g. Cardamom, Betel Leaf, Dragon Fruit)...')}
                className="w-full bg-white border border-stone-300 rounded-2xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F] animate-in fade-in"
              />
            )}

            {activeCropMeta && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px] text-emerald-950">
                <div className="flex items-center gap-1.5">
                  <Shield size={13} className="text-[#2F7D4F]" />
                  <span>
                    Diagnostic Protocol: <strong>{activeCropMeta.cropName} Pathology & Protection</strong>
                  </span>
                </div>
                <span className="font-semibold text-emerald-800 text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md">
                  ICAR / CIBRC Verified
                </span>
              </div>
            )}
          </div>

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
              placeholder="e.g. Yellowing and brown necrotic spots observed on lower foliage after 3 days of rain; top leaves unaffected..."
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

        {/* Right Column: Dynamic Diagnosis Results & Medicine Cards */}
        <Card className="p-6 rounded-3xl border border-stone-200 bg-white space-y-5 flex flex-col justify-between shadow-xs">
          {/* Empty State Before Analysis */}
          {!result && !analyzing && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#2F7D4F] flex items-center justify-center">
                <Eye size={28} />
              </div>
              <h4 className="text-base font-bold text-stone-800">
                {t('diagnosis_awaiting_title', 'Awaiting Leaf Photograph')}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
                {t(
                  'diagnosis_awaiting_desc',
                  'Upload a clear close-up leaf photograph, optionally identify your crop or let AI auto-detect, and click Analyze Crop Leaf to initiate diagnostic screening and retrieve ICAR treatment.'
                )}
              </p>
            </div>
          )}

          {/* Multi-Stage Animated Analysis Progress */}
          {analyzing && (
            <div className="h-full flex flex-col items-center justify-center p-8 space-y-6 my-auto">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100/70 flex items-center justify-center animate-pulse">
                  <Sparkles size={28} className="text-[#2F7D4F]" />
                </div>
                <div className="absolute inset-0 rounded-3xl border-2 border-[#2F7D4F] border-t-transparent animate-spin" />
              </div>

              <div className="space-y-1 text-center">
                <h4 className="text-base font-black text-stone-900 tracking-tight">
                  Analyzing Crop Disease & Finding Medicines
                </h4>
                <p className="text-xs text-stone-500">
                  Executing multi-model computer vision and store matching pipeline
                </p>
              </div>

              {/* Step Progress Checklist */}
              <div className="w-full max-w-sm space-y-2 text-left pt-2">
                {ANALYSIS_STAGES.map((s) => {
                  const isDone = analysisStep > s.step;
                  const isCurrent = analysisStep === s.step;
                  return (
                    <div
                      key={s.step}
                      className={`flex items-center gap-2.5 text-xs p-2 rounded-xl transition-all ${isCurrent
                          ? 'bg-emerald-50 text-[#143D2A] font-bold border border-emerald-200'
                          : isDone
                            ? 'text-stone-700 font-medium'
                            : 'text-stone-400'
                        }`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={15} className="text-[#2F7D4F] shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw size={15} className="text-[#2F7D4F] animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" />
                      )}
                      <span>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Diagnostic Result Display */}
          {result && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header: Diagnosis Badge & Status */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${result.status === 'accepted'
                          ? result.isHealthy
                            ? 'bg-emerald-100 text-[#143D2A] border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                          : result.status === 'crop_mismatch'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : result.status === 'in_validation'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : result.status === 'blurry_image'
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : result.status === 'not_crop'
                                  ? 'bg-stone-100 text-stone-800 border-stone-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                    >
                      {result.status === 'accepted'
                        ? result.isHealthy
                          ? 'Optimal Foliage Health'
                          : 'Pathology Detected (Action Required)'
                        : result.status === 'crop_mismatch'
                          ? 'Crop Mismatch Detected'
                          : result.status === 'in_validation'
                            ? 'Crop Identified • In Field Validation'
                            : result.status === 'blurry_image'
                              ? 'Image Quality Issue'
                              : result.status === 'not_crop'
                                ? 'No Foliage Detected'
                                : 'Uncertain Diagnosis'}
                    </span>
                    {result.detectedCrop && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                        Visual Crop: {result.detectedCrop}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ICAR Aligned Protocol
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-stone-900 tracking-tight">
                    {result.disease || result.predictedLabel}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Target Plot: <strong className="text-stone-800">{result.crop}</strong>
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

              {/* Status Notice: Crop Mismatch Detected (Case 2) */}
              {result.status === 'crop_mismatch' && (
                <div className="p-5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3 text-xs text-amber-950">
                  <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <span>Crop Mismatch Detected — Verification Required</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/80 p-3 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 block uppercase">Selected Plot Crop</span>
                      <strong className="text-xs text-stone-900">{result.selectedCrop || result.crop || 'Selected Plot'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 block uppercase">Detected Leaf Foliage</span>
                      <strong className="text-xs text-amber-900">{result.detectedCrop || 'Different Crop Family'}</strong>
                    </div>
                  </div>
                  <p className="leading-relaxed text-xs text-amber-900">
                    {result.validationNotice || result.explanation}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById('field-select');
                        el?.focus();
                      }}
                      className="text-xs h-8 rounded-xl border-amber-300 text-amber-950 hover:bg-amber-100"
                    >
                      Verify Farm Plot
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="text-xs h-8 rounded-xl border-amber-300 text-amber-950 hover:bg-amber-100"
                    >
                      Upload New Photo
                    </Button>
                  </div>
                </div>
              )}

              {/* Status Notice if in validation */}
              {result.status === 'in_validation' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-950">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <Info size={16} className="text-blue-700" />
                    <span>Scientific Diagnostic Safety Boundary</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-blue-900">
                    {result.validationNotice || result.explanation}
                  </p>
                </div>
              )}

              {/* Confidence & Severity KPI Cards */}
              {result.status === 'accepted' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                    <span className="text-[11px] font-semibold text-stone-500 block">Diagnostic Confidence</span>
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
                      className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mt-1 capitalize ${result.severity === 'severe'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : result.severity === 'moderate'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : result.severity === 'mild'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                    >
                      {result.severity || 'None'}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-1">Leaf coverage index</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-semibold text-stone-500 block">Pathogen Type</span>
                    <span className="text-sm font-bold text-stone-800 block mt-1 capitalize">
                      {result.pathology?.pathogenType || (result.isHealthy ? 'Non-pathogenic' : 'Specialist')}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      {result.isHealthy ? 'Optimal health' : 'Target organism'}
                    </span>
                  </div>
                </div>
              )}

              {/* Candidate Diagnostic Alignment (differential ranking) */}
              {result.status === 'accepted' && result.topK && result.topK.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-700 block">
                    Diagnostic Candidate Alignment:
                  </span>
                  <div className="space-y-1.5">
                    {result.topK.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${idx === 0
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
                            onClick={() => setActiveTreatmentTab('chemical')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${activeTreatmentTab === 'chemical'
                                ? 'bg-white text-stone-900 shadow-xs'
                                : 'text-stone-500 hover:text-stone-900'
                              }`}
                          >
                            CIBRC Chemical Controls
                          </button>
                          <button
                            onClick={() => setActiveTreatmentTab('organic')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${activeTreatmentTab === 'organic'
                                ? 'bg-white text-[#143D2A] shadow-xs'
                                : 'text-stone-500 hover:text-stone-900'
                              }`}
                          >
                            Organic Solutions
                          </button>
                        </div>
                      </div>

                      {activeTreatmentTab === 'chemical' && (
                        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2">
                          <strong className="text-amber-950 block font-bold">
                            CIBRC Registered Chemical Controls:
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
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* RECOMMENDED MEDICINES FROM FERTILIZER STORE                   */}
              {/* ------------------------------------------------------------- */}
              <div className="border-t border-stone-200/80 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
                      <ShoppingBag size={18} className="text-[#2F7D4F]" />
                      Verified Medicines from Fertilizer Store
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Direct e-commerce procurement of CIBRC-registered active ingredients
                    </p>
                  </div>
                  <Link
                    href="/store"
                    className="text-xs font-bold text-[#2F7D4F] hover:text-[#143D2A] flex items-center gap-1 transition-colors print:hidden"
                  >
                    Open Store <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Healthy Foliage Notice */}
                {result.isHealthy && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-950">
                      <strong className="block font-bold">Optimal Foliage Health Detected</strong>
                      The uploaded leaf shows vigorous, non-pathogenic foliage. No synthetic fungicides, bactericides, or disease treatments are required.
                    </div>
                  </div>
                )}

                {/* If Not Healthy: Display Matching Store Products */}
                {!result.isHealthy && (
                  <>
                    {result.recommendations?.medicines && result.recommendations.medicines.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {result.recommendations.medicines.map((med) => {
                          const isAdding = cartAddingId === med.id;

                          return (
                            <div
                              key={med.id}
                              className={`p-4 rounded-2xl border transition-all space-y-3 bg-white hover:border-emerald-300 shadow-xs ${med.treatmentType === 'primary'
                                  ? 'border-emerald-200 bg-emerald-50/20'
                                  : 'border-stone-200'
                                }`}
                            >
                              {/* Header Badges: Treatment Type & Stock */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span
                                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${med.treatmentType === 'primary'
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : med.treatmentType === 'alternative'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-teal-100 text-teal-900 border-teal-300'
                                    }`}
                                >
                                  {med.treatmentTypeLabel}
                                </span>

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${med.inStock
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                >
                                  {med.inStock ? (
                                    <>
                                      <PackageCheck size={12} />
                                      In Stock ({med.stock} units)
                                    </>
                                  ) : (
                                    <>
                                      <PackageX size={12} />
                                      Out of Stock
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Product Info & Active Ingredient */}
                                  <div className="flex items-start gap-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F5F7F4] border border-stone-200/80 shrink-0">
                                      <ProductImage
                                        src={med.imageUrl}
                                        alt={med.name}
                                        className="w-full h-full object-contain p-1"
                                      />
                                    </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-black text-stone-900 tracking-tight leading-snug">
                                          {med.name}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 flex-wrap">
                                          <span>Brand: <strong className="text-stone-800">{med.brandName}</strong></span>
                                          <span>•</span>
                                          <span>Pack: <strong className="text-stone-800">{med.packSize}</strong></span>
                                        </div>
                                        <div className="mt-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200/80 font-mono text-[11px] text-stone-700">
                                          Active: <strong className="text-stone-900">{med.activeIngredient}</strong>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Why Recommended Explanation */}
                                    <p className="text-xs text-stone-600 leading-relaxed bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
                                      <strong>Target Mechanism:</strong> {med.whyRecommended}
                                    </p>

                                    {/* Price & Action Buttons */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-stone-100">
                                      <div>
                                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Store Price</span>
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-lg font-black text-[#143D2A]">
                                            ₹{med.price.toLocaleString('en-IN')}
                                          </span>
                                          {med.mrp && med.mrp > med.price && (
                                            <span className="text-xs text-stone-400 line-through">
                                              ₹{med.mrp.toLocaleString('en-IN')}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 print:hidden flex-wrap">
                                        {/* View Product in Store */}
                                        <Link
                                          href={med.detailUrl}
                                          className="px-3 py-2 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-stone-700 hover:text-stone-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                        >
                                          View Product
                                          <ExternalLink size={12} />
                                        </Link>

                                        {/* Add to Cart */}
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddToCart(med, false)}
                                          disabled={!med.inStock || isAdding}
                                          className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-xs font-bold h-9 px-3.5 rounded-xl"
                                        >
                                          {isAdding ? (
                                            <RefreshCw size={13} className="animate-spin mr-1.5" />
                                          ) : (
                                            <ShoppingCart size={13} className="mr-1.5 text-[#2F7D4F]" />
                                          )}
                                          Add to Cart
                                        </Button>

                                        {/* Buy Now */}
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddToCart(med, true)}
                                          disabled={!med.inStock || isAdding}
                                          className="bg-[#143D2A] hover:bg-[#0F2D1F] text-white text-xs font-bold h-9 px-3.5 rounded-xl shadow-xs"
                                        >
                                          Buy Now
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  );
                        })}
                                </div>
                                ) : (
                                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-3">
                                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                  <div className="text-xs text-stone-600 space-y-1">
                                    <strong className="text-stone-900 block font-bold">
                                      No verified matching medicine is currently available in the store.
                                    </strong>
                                    <p className="leading-relaxed">
                                      {result.recommendations?.message ||
                                        'Our agricultural safety guidelines ensure we only recommend verified, label-approved CIBRC products matching the identified active ingredient. We never recommend unrelated fertilizers.'}
                                    </p>
                                  </div>
                                </div>
                    )}
                              </>
                )}
                            </div>

              {/* Field Management & Preventive Recommendations */ }
                          {
                            result.pathology?.immediatePrevention && result.pathology.immediatePrevention.length > 0 && (
                              <div className="border-t border-stone-100 pt-4 space-y-2">
                                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                  <Sprout size={14} className="text-[#2F7D4F]" />
                                  Preventive Agronomic Field Management:
                                </span>
                                <ul className="list-disc list-inside text-xs text-stone-600 space-y-1 pl-1">
                                  {result.pathology.immediatePrevention.map((prev, idx) => (
                                    <li key={idx} className="leading-relaxed">{prev}</li>
                                  ))}
                                </ul>
                              </div>
                            )
                          }

                          {/* KVK Escalation Trigger */ }
                          {
                            result.pathology?.whenToConsultExpert && (
                              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-[11px] text-stone-600 flex items-start gap-2">
                                <HelpCircle size={15} className="text-[#2F7D4F] shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-stone-800">When to Escalate to Local KVK:</strong>{' '}
                                  {result.pathology.whenToConsultExpert}
                                </div>
                              </div>
                            )
                          }

                          {/* Technical Model Details Accordion */ }
                          {
                            result.model && (
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
                            )
                          }

                          {/* Farmer Diagnostic Accuracy Feedback */ }
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
                                        className={`p-1 rounded-md transition-colors ${feedbackRating >= star ? 'text-amber-500' : 'text-stone-300'
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
                                      className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${feedbackIsAccurate
                                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                          : 'bg-white text-stone-600 border-stone-200'
                                        }`}
                                    >
                                      ✔ Correct Disease
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFeedbackIsAccurate(false)}
                                      className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${!feedbackIsAccurate
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

              {/* History Drawer Toggle */}
              <div className="flex items-center justify-between border-t border-stone-200/80 pt-4 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs h-9 px-4 rounded-xl flex items-center gap-2 font-bold"
                >
                  <History size={15} className="text-[#2F7D4F]" />
                  {showHistory ? 'Hide Diagnosis History' : `View Diagnosis History (${history.length})`}
                </Button>
              </div>

              {/* Diagnosis History Table (Collapsible) */}
              {showHistory && (
                <Card className="p-6 rounded-3xl border border-stone-200 bg-white space-y-4 print:hidden shadow-xs">
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
                                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.severity === 'severe'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : item.severity === 'moderate'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}
                                >
                                  {item.severity || '—'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                {item.modelId || item.modelName || 'ResNet-50'}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectHistoryItem(item.id)}
                                    disabled={loadingHistoryId === item.id}
                                    className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] transition-colors"
                                    title="Load diagnostic report & medicines"
                                  >
                                    {loadingHistoryId === item.id ? (
                                      <RefreshCw size={12} className="animate-spin inline" />
                                    ) : (
                                      'View Report'
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHistory(item.id)}
                                    disabled={deletingId === item.id}
                                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete diagnostic record"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
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
