/**
 * SmartFarm AI — Crop Disease Diagnosis Client Service
 *
 * Front-facing facade connecting API routes and components to the
 * Multi-Model Crop Disease Router and Model Registry.
 */

import {
  AgronomicDiseaseInfo,
  getAgronomicPathology,
  isCropSupportedByModel,
  SUPPORTED_BENCHMARK_CROPS,
} from '@/lib/crop-disease-knowledge';
import {
  CropDiseaseRouter,
  CandidatePrediction,
  RouterDiagnosticResult,
} from './ai/CropDiseaseRouter';
import { CropModelRegistry } from './ai/CropModelRegistry';

export type { CandidatePrediction };

export interface ModelMetadata {
  name: string;
  architecture: string;
  version: string;
  license: string;
  preprocessingVersion?: string;
  datasetSource?: string;
  status?: string;
  accuracy?: number;
  f1Score?: number;
}

export interface UncertaintyMetadata {
  isUncertain: boolean;
  reason?: string | null;
  topTwoDifference?: number | null;
  caveat: string;
}

export interface PredictionResult {
  status:
    | 'accepted'
    | 'crop_mismatch'
    | 'uncertain'
    | 'not_crop'
    | 'unsupported_crop'
    | 'in_validation'
    | 'blurry_image'
    | 'model_not_ready';
  selectedCrop?: string | null;
  detectedCrop?: string | null;
  predictedLabel?: string | null;
  crop?: string | null;
  disease?: string | null;
  isHealthy?: boolean | null;
  confidence?: number | null;
  severity?: 'mild' | 'moderate' | 'severe' | 'none';
  topK: CandidatePrediction[];
  model: ModelMetadata;
  uncertainty: UncertaintyMetadata;
  pathology?: AgronomicDiseaseInfo | null;
  validationNotice?: string | null;
  explanation: string;
  timestamp: string;
}

export type CandidateScore = CandidatePrediction;

export class DiseaseDiagnosisService {
  private static getServiceUrl(): string {
    return process.env.DISEASE_SERVICE_URL || process.env.DIAGNOSIS_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  /**
   * Health check query to the Python microservice.
   */
  static async checkHealth(): Promise<{
    available: boolean;
    modelReady: boolean;
    modelName?: string;
    version?: string;
    license?: string;
    classesCount?: number;
    error?: string;
  }> {
    const baseUrl = this.getServiceUrl();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return { available: false, modelReady: false, error: `HTTP ${res.status}` };
      }

      const json = await res.json();
      return {
        available: true,
        modelReady: Boolean(json.modelReady),
        modelName: json.modelName,
        version: json.version,
        license: json.license,
        classesCount: json.supportedClassesCount,
      };
    } catch (err: any) {
      return {
        available: false,
        modelReady: false,
        error: err.name === 'AbortError' ? 'Health check timed out (3s)' : (err.message || 'Service unreachable'),
      };
    }
  }

  /**
   * Submits an image buffer for multi-model classification via CropDiseaseRouter.
   */
  static async predict(
    imageBuffer: Buffer,
    filename = 'leaf.jpg',
    mimeType = 'image/jpeg',
    options?: { requestedCrop?: string | null; fieldCropName?: string | null }
  ): Promise<PredictionResult> {
    const result: RouterDiagnosticResult = await CropDiseaseRouter.routeAndAnalyze(
      imageBuffer,
      filename,
      mimeType,
      {
        selectedCropId: options?.requestedCrop,
        fieldCropName: options?.fieldCropName,
      }
    );

    return {
      status: result.status,
      selectedCrop: result.selectedCrop,
      detectedCrop: result.detectedCrop,
      predictedLabel: result.predictedLabel,
      crop: result.crop,
      disease: result.disease,
      isHealthy: result.isHealthy,
      confidence: result.confidence,
      severity: result.severity,
      topK: result.topK,
      model: {
        name: result.model.name,
        architecture: result.model.architecture,
        version: result.model.version,
        license: result.model.license,
        datasetSource: result.model.datasetSource,
        status: result.model.status,
        accuracy: result.model.accuracy,
        f1Score: result.model.f1Score,
      },
      uncertainty: result.uncertainty,
      pathology: result.pathology,
      validationNotice: result.validationNotice,
      explanation: result.explanation,
      timestamp: result.timestamp,
    };
  }

  /**
   * Retrieves all registered crops and models in the system.
   */
  static getModelRegistry() {
    return {
      crops: CropModelRegistry.getAllCrops(),
      models: CropModelRegistry.getAllModels(),
    };
  }
}
