"""
SmartFarm AI — Crop Disease Inference Microservice
FastAPI microservice providing /health and /predict endpoints for crop disease screening.

Features:
- Decoupled from Next.js runtime.
- Never fabricates fake predictions as real when weights are absent; returns 'model_not_ready'.
- Heuristic non-plant foliage gate (rejects non-leaf images).
- Top-K softmax candidates with uncertainty & close-runner-up detection.
- Non-clinical disclaimer on all outputs.
"""

import os
import io
import json
import time
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageOps, UnidentifiedImageError
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("disease_service")

# Paths and Config
SERVICE_DIR = Path(__file__).parent.resolve()
WEIGHTS_DIR = SERVICE_DIR / "weights"
LABELS_PATH = SERVICE_DIR / "labels.json"
WEIGHTS_PATH = WEIGHTS_DIR / "agri_plant_disease_resnet50.pth"

MODEL_NAME = "agri-plant-disease-resnet50"
MODEL_VERSION = "1.0.0"
MODEL_LICENSE = "Apache-2.0"
PREPROCESSING_VERSION = "v1-224-imagenet-norm"

# Uncertainty thresholds
MIN_CONFIDENCE_THRESHOLD = 0.60
RUNNER_UP_MARGIN_THRESHOLD = 0.15
MIN_FOLIAGE_PIXEL_RATIO = 0.08

# Environment flags
ALLOW_MOCK_INFERENCE = os.environ.get("MOCK_INFERENCE", "false").lower() in ("true", "1")

# Global model state
_model = None
_labels: List[Dict[str, Any]] = []
_model_ready = False

# -----------------------------------------------------------------------------
# Labels Loader
# -----------------------------------------------------------------------------
def load_labels() -> List[Dict[str, Any]]:
    global _labels
    if LABELS_PATH.exists():
        with open(LABELS_PATH, "r", encoding="utf-8") as f:
            _labels = json.load(f)
            logger.info(f"Loaded {len(_labels)} class labels from {LABELS_PATH}")
    else:
        logger.warning(f"labels.json not found at {LABELS_PATH}")
        _labels = []
    return _labels

# -----------------------------------------------------------------------------
# Model Loader
# -----------------------------------------------------------------------------
def init_model():
    global _model, _model_ready
    load_labels()

    if WEIGHTS_PATH.exists():
        try:
            import torch
            import torchvision.models as models

            logger.info(f"Loading weights from {WEIGHTS_PATH}...")
            # Instantiate ResNet-50 architecture
            model = models.resnet50(weights=None)
            num_ftrs = model.fc.in_features
            model.fc = torch.nn.Linear(num_ftrs, len(_labels) if _labels else 38)

            state_dict = torch.load(WEIGHTS_PATH, map_location="cpu", weights_only=True)
            model.load_state_dict(state_dict)
            model.eval()
            _model = model
            _model_ready = True
            logger.info("ResNet-50 weights loaded successfully into memory.")
        except Exception as e:
            logger.error(f"Failed to load weights: {e}")
            _model = None
            _model_ready = False
    else:
        logger.info(f"Weights file not found at {WEIGHTS_PATH}. Running in model_not_ready mode.")
        _model = None
        _model_ready = False

# Initialize on startup
init_model()

# -----------------------------------------------------------------------------
# FastAPI App
# -----------------------------------------------------------------------------
app = FastAPI(
    title="SmartFarm AI Crop Disease Service",
    description="Inference service for crop disease screening with uncertainty detection and safe boundaries.",
    version=MODEL_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------------
class CandidateScore(BaseModel):
    label: str
    crop: str
    disease: str
    isHealthy: bool
    score: float

class ModelMeta(BaseModel):
    name: str
    architecture: str
    version: str
    license: str
    preprocessingVersion: str

class UncertaintyMeta(BaseModel):
    isUncertain: bool
    reason: Optional[str] = None
    topTwoDifference: Optional[float] = None
    caveat: str

class PredictResponse(BaseModel):
    status: str  # accepted | uncertain | not_crop | model_not_ready
    predictedLabel: Optional[str] = None
    crop: Optional[str] = None
    disease: Optional[str] = None
    isHealthy: Optional[bool] = None
    confidence: Optional[float] = None
    topK: List[CandidateScore] = []
    model: ModelMeta
    uncertainty: UncertaintyMeta
    explanation: str
    timestamp: str

# -----------------------------------------------------------------------------
# Preprocessing & Non-Plant Heuristic Gate
# -----------------------------------------------------------------------------
def check_is_crop_foliage(img_rgb: Image.Image) -> tuple[bool, float]:
    """
    Evaluates whether the image contains plant foliage.
    Computes green-dominant vegetative pixel ratio.
    """
    arr = np.array(img_rgb.resize((100, 100)))
    r = arr[:, :, 0].astype(np.float32)
    g = arr[:, :, 1].astype(np.float32)
    b = arr[:, :, 2].astype(np.float32)

    # Green vegetation condition: green is significantly higher than blue and red
    # or yellow-chlorotic leaf tissue (high R and G, low B)
    green_dominant = (g > b * 1.05) & ((g >= r * 0.85) | ((r > 100) & (g > 100) & (b < 80)))
    # Ensure pixels have meaningful saturation, not pure gray or white
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    saturation = np.where(max_c > 0, (max_c - min_c) / max_c, 0)
    has_saturation = saturation > 0.15

    foliage_mask = green_dominant & has_saturation
    foliage_ratio = float(np.sum(foliage_mask) / foliage_mask.size)

    return (foliage_ratio >= MIN_FOLIAGE_PIXEL_RATIO, foliage_ratio)

def preprocess_tensor(img_rgb: Image.Image):
    """
    Standard PyTorch ResNet-50 preprocessing: resize to 224x224, normalize with ImageNet mean/std.
    """
    import torch

    img_resized = img_rgb.resize((224, 224), Image.Resampling.BILINEAR)
    arr = np.array(img_resized, dtype=np.float32) / 255.0

    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    norm = (arr - mean) / std

    # HWC to CHW -> 1x3x224x224
    tensor = torch.from_numpy(norm.transpose(2, 0, 1)).unsqueeze(0)
    return tensor

# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "modelReady": _model_ready,
        "modelName": MODEL_NAME,
        "version": MODEL_VERSION,
        "license": MODEL_LICENSE,
        "supportedClassesCount": len(_labels),
        "device": "cpu",
        "mockInferenceAllowed": ALLOW_MOCK_INFERENCE,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    model_meta = ModelMeta(
        name=MODEL_NAME,
        architecture="ResNet-50",
        version=MODEL_VERSION,
        license=MODEL_LICENSE,
        preprocessingVersion=PREPROCESSING_VERSION,
    )
    standard_caveat = (
        "Softmax scores indicate visual pattern alignment across the 38 supported benchmark categories; "
        "they are not calibrated clinical probabilities. Combine visual screening with physical field inspection "
        "and consult a certified agronomic officer or KVK before taking intervention measures."
    )

    # 1. Check if model is ready or mock is explicitly enabled
    if not _model_ready and not ALLOW_MOCK_INFERENCE:
        return PredictResponse(
            status="model_not_ready",
            model=model_meta,
            uncertainty=UncertaintyMeta(
                isUncertain=True,
                reason="Model checkpoint not found on server",
                caveat=standard_caveat,
            ),
            explanation="The disease classification model weights are not loaded. Run download_model.py on the server to install the checkpoint.",
            timestamp=ts,
        )

    # 2. Read and validate uploaded bytes
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read upload stream: {e}")

    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")

    # 3. Decode image
    try:
        image = Image.open(io.BytesIO(contents))
        image = ImageOps.exif_transpose(image)
        img_rgb = image.convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=422, detail="File is not a valid or supported image format (JPEG, PNG, WebP)")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Corrupt or unreadable image: {e}")

    # Prevent decompression bombs
    if img_rgb.width > 8000 or img_rgb.height > 8000:
        raise HTTPException(status_code=422, detail="Image dimensions exceed maximum allowed limit of 8000x8000")

    # 4. Non-Plant Rejection Gate
    is_foliage, foliage_ratio = check_is_crop_foliage(img_rgb)
    if not is_foliage:
        return PredictResponse(
            status="not_crop",
            model=model_meta,
            uncertainty=UncertaintyMeta(
                isUncertain=True,
                reason=f"Insufficient vegetative foliage detected (estimated leaf ratio {foliage_ratio:.1%})",
                caveat=standard_caveat,
            ),
            explanation="The uploaded image does not appear to exhibit characteristic crop leaf coloration or texture. Please submit a well-lit close-up photo of the affected crop leaf.",
            timestamp=ts,
        )

    # 5. Run Inference
    if _model_ready and _model is not None:
        import torch

        tensor = preprocess_tensor(img_rgb)
        with torch.no_grad():
            logits = _model(tensor)
            probs = torch.nn.functional.softmax(logits, dim=1)[0].numpy()
    else:
        # Deterministic mock inference for local unit test scenarios when explicitly enabled
        # Deterministic pseudo-probabilities based on image hash
        import hashlib
        h = int(hashlib.md5(contents[:512]).hexdigest(), 16)
        probs = np.zeros(len(_labels) or 38, dtype=np.float32)
        top_idx = h % len(probs)
        second_idx = (h + 1) % len(probs)
        probs[top_idx] = 0.82
        probs[second_idx] = 0.12
        remaining = 0.06 / (len(probs) - 2)
        for i in range(len(probs)):
            if i != top_idx and i != second_idx:
                probs[i] = remaining

    # 6. Extract Top-K (Top-3)
    top_indices = np.argsort(probs)[::-1][:3]
    top_k_candidates: List[CandidateScore] = []

    for idx in top_indices:
        label_info = _labels[idx] if idx < len(_labels) else {"label": f"Class_{idx}", "crop": "Unknown", "disease": "Unknown", "isHealthy": False}
        top_k_candidates.append(
            CandidateScore(
                label=label_info["label"],
                crop=label_info["crop"],
                disease=label_info["disease"],
                isHealthy=label_info["isHealthy"],
                score=round(float(probs[idx]), 4),
            )
        )

    top_1 = top_k_candidates[0]
    top_2 = top_k_candidates[1] if len(top_k_candidates) > 1 else None
    top_two_diff = round(top_1.score - (top_2.score if top_2 else 0.0), 4)

    # 7. Uncertainty Evaluation
    is_uncertain = False
    uncertain_reason = None

    if top_1.score < MIN_CONFIDENCE_THRESHOLD:
        is_uncertain = True
        uncertain_reason = f"Low confidence: visual pattern alignment is only {top_1.score:.1%} (threshold {MIN_CONFIDENCE_THRESHOLD:.0%})"
    elif top_2 and (top_1.score - top_2.score) < RUNNER_UP_MARGIN_THRESHOLD:
        is_uncertain = True
        uncertain_reason = f"Ambiguous presentation: close visual runner-up between '{top_1.disease}' ({top_1.score:.1%}) and '{top_2.disease}' ({top_2.score:.1%})"

    pred_status = "uncertain" if is_uncertain else "accepted"

    explanation = (
        f"Visual pattern matches {top_1.crop} - {top_1.disease} with {top_1.score:.1%} confidence."
        if not is_uncertain
        else f"Uncertain diagnosis: {uncertain_reason}. Consider capturing a clearer photo under natural lighting."
    )

    return PredictResponse(
        status=pred_status,
        predictedLabel=top_1.label,
        crop=top_1.crop,
        disease=top_1.disease,
        isHealthy=top_1.isHealthy,
        confidence=top_1.score,
        topK=top_k_candidates,
        model=model_meta,
        uncertainty=UncertaintyMeta(
            isUncertain=is_uncertain,
            reason=uncertain_reason,
            topTwoDifference=top_two_diff,
            caveat=standard_caveat,
        ),
        explanation=explanation,
        timestamp=ts,
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("DISEASE_SERVICE_PORT", "8000"))
    uvicorn.run("main:app", host="127.0.0.1", port=port, log_level="info")
