/**
 * SmartFarm AI — Crop Disease Diagnosis Client Service
 *
 * Connects the Next.js application to the decoupled Python disease inference microservice.
 * Enforces:
 * 1. Safe request timeouts (default 10s).
 * 2. Circuit-breaker / fallback handling: returns 'model_not_ready' when the service
 *    is unreachable, without crashing or faking predictions.
 * 3. Type-safe response schemas.
 */

export interface CandidatePrediction {
  label: string;
  crop: string;
  disease: string;
  isHealthy: boolean;
  score: number;
}

export interface ModelMetadata {
  name: string;
  architecture: string;
  version: string;
  license: string;
  preprocessingVersion: string;
}

export interface UncertaintyMetadata {
  isUncertain: boolean;
  reason?: string | null;
  topTwoDifference?: number | null;
  caveat: string;
}

export interface PredictionResult {
  status: 'accepted' | 'uncertain' | 'not_crop' | 'model_not_ready';
  predictedLabel?: string | null;
  crop?: string | null;
  disease?: string | null;
  isHealthy?: boolean | null;
  confidence?: number | null;
  topK: CandidateScore[];
  model: ModelMetadata;
  uncertainty: UncertaintyMetadata;
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
   * Submits an image buffer to the Python service for classification.
   */
  static async predict(
    imageBuffer: Buffer,
    filename = 'leaf.jpg',
    mimeType = 'image/jpeg'
  ): Promise<PredictionResult> {
    const baseUrl = this.getServiceUrl();
    const timestamp = new Date().toISOString();

    const fallbackMeta: ModelMetadata = {
      name: 'agri-plant-disease-resnet50',
      architecture: 'ResNet-50',
      version: '1.0.0',
      license: 'Apache-2.0',
      preprocessingVersion: 'v1-224-imagenet-norm',
    };

    const fallbackUncertainty: UncertaintyMetadata = {
      isUncertain: true,
      reason: 'Inference microservice unavailable',
      caveat:
        'Softmax scores represent benchmark category alignment, not clinical certainty. Physical inspection required.',
    };

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
      formData.append('file', blob, filename);

      const controller = new AbortController();
      const timeoutMs = parseInt(process.env.DISEASE_SERVICE_TIMEOUT_MS || '10000', 10);
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        if (res.status === 422) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.detail || 'Invalid or unreadable image uploaded');
        }
        if (res.status === 413) {
          throw new Error('Image exceeds maximum allowed size limit');
        }
        throw new Error(`Inference service error: HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        status: data.status,
        predictedLabel: data.predictedLabel || null,
        crop: data.crop || null,
        disease: data.disease || null,
        isHealthy: data.isHealthy ?? null,
        confidence: data.confidence ?? null,
        topK: data.topK || [],
        model: data.model || fallbackMeta,
        uncertainty: data.uncertainty || fallbackUncertainty,
        explanation: data.explanation || '',
        timestamp: data.timestamp || timestamp,
      };
    } catch (err: any) {
      // Deterministic fail-safe: never fake disease diagnosis if service is down
      const isTimeout = err.name === 'AbortError';
      const isConnectionRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed');

      if (isTimeout || isConnectionRefused) {
        return {
          status: 'model_not_ready',
          model: fallbackMeta,
          uncertainty: {
            isUncertain: true,
            reason: isTimeout ? 'Prediction timed out (10s)' : 'Inference service offline',
            caveat: fallbackUncertainty.caveat,
          },
          explanation:
            'The plant disease classifier service is currently unavailable or busy. Please ensure the Python service is running on port 8000 and try again.',
          timestamp,
          topK: [],
        };
      }

      // Re-throw validation or payload errors (e.g. 422 non-image)
      throw err;
    }
  }
}
