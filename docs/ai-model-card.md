# AI Model Card — Crop Disease Visual Screening Model (`agri-plant-disease-resnet50`)

> **Model Card Standard:** Adheres to the Mitchell et al. (2019) Model Cards for Model Reporting framework.  
> **Model Name:** `agri-plant-disease-resnet50`  
> **Version:** `1.0.0`  
> **Date:** October 2026  
> **License:** Apache License 2.0  
> **Service Implementation:** Decoupled FastAPI Microservice (`services/disease-service/main.py`)

---

## 1. Model Overview & Intended Use

- **Architecture:** Convolutional Neural Network based on ResNet-50 (Deep Residual Learning for Image Recognition), pre-trained on ImageNet and fine-tuned for crop disease visual classification.
- **Task:** Multi-class single-leaf visual disease classification.
- **Intended Users:** Smallholder farmers, agricultural extension workers (Gram Sevaks), and Krishi Vigyan Kendra (KVK) staff.
- **Primary Use Case:** Preliminary in-field screening tool to assist farmers in identifying common visual symptoms (blights, rusts, leaf spots, scabs) and seeking timely advice.
- **Out-of-Scope & Prohibited Use:**
  - Automated toxic chemical pesticide prescriptions without certified human review.
  - Final legal or commercial crop disease certification.
  - Diagnosis of root-rot, systemic soil nematodes, or viral vascular wilts from foliage images alone.

---

## 2. Supported Crops & Class Taxonomy (38 Classes)

The model supports 38 distinct phytopathological condition classes across 14 crops:

| Crop | Supported Conditions & Benchmark Classes |
|---|---|
| **Apple** | Apple scab (`Apple___Apple_scab`), Black rot (`Apple___Black_rot`), Cedar apple rust (`Apple___Cedar_apple_rust`), Healthy (`Apple___healthy`) |
| **Blueberry** | Healthy (`Blueberry___healthy`) |
| **Cherry** | Powdery mildew (`Cherry___Powdery_mildew`), Healthy (`Cherry___healthy`) |
| **Corn (Maize)** | Cercospora leaf spot / Gray leaf spot (`Corn___Cercospora_leaf_spot`), Common rust (`Corn___Common_rust_`), Northern Leaf Blight (`Corn___Northern_Leaf_Blight`), Healthy (`Corn___healthy`) |
| **Grape** | Black rot (`Grape___Black_rot`), Esca / Black Measles (`Grape___Esca_(Black_Measles)`), Leaf blight / Isariopsis (`Grape___Leaf_blight`), Healthy (`Grape___healthy`) |
| **Orange** | Huanglongbing / Citrus greening (`Orange___Haunglongbing_(Citrus_greening)`) |
| **Peach** | Bacterial spot (`Peach___Bacterial_spot`), Healthy (`Peach___healthy`) |
| **Bell Pepper** | Bacterial spot (`Pepper,_bell___Bacterial_spot`), Healthy (`Pepper,_bell___healthy`) |
| **Potato** | Early blight (`Potato___Early_blight`), Late blight (`Potato___Late_blight`), Healthy (`Potato___healthy`) |
| **Raspberry** | Healthy (`Raspberry___healthy`) |
| **Soybean** | Healthy (`Soybean___healthy`) |
| **Squash** | Powdery mildew (`Squash___Powdery_mildew`) |
| **Strawberry** | Leaf scorch (`Strawberry___Leaf_scorch`), Healthy (`Strawberry___healthy`) |
| **Tomato** | Bacterial spot (`Tomato___Bacterial_spot`), Early blight (`Tomato___Early_blight`), Late blight (`Tomato___Late_blight`), Leaf Mold (`Tomato___Leaf_Mold`), Septoria leaf spot (`Tomato___Septoria_leaf_spot`), Two-spotted spider mite (`Tomato___Spider_mites`), Target Spot (`Tomato___Target_Spot`), Yellow Leaf Curl Virus (`Tomato___Tomato_Yellow_Leaf_Curl_Virus`), Mosaic virus (`Tomato___Tomato_mosaic_virus`), Healthy (`Tomato___healthy`) |

---

## 3. Dataset & Provenance

- **Training & Fine-Tuning Corpus:** PlantVillage Benchmark Dataset (Hughes & Salathé, 2015; Penn State University & EPFL, licensed under CC BY-SA 4.0).
- **Validation Dataset:** 200 held-out images across 10 benchmark classes (20 unseen test images per class), completely sequestered during fine-tuning.
- **Negative Control Split:** 55 non-plant foliage images (machinery, skin, footwear, soil, documents) utilized to tune non-plant rejection heuristics.

---

## 4. Preprocessing & Technical Specifications

- **Preprocessing Version:** `v1-224-imagenet-norm`
- **Input Dimension:** 224 × 224 pixels, 3 color channels (RGB).
- **Color Normalization:** Standard PyTorch ImageNet transform:
  $$\text{Mean} = [0.485, 0.456, 0.406], \quad \text{Std} = [0.229, 0.224, 0.225]$$
- **Input File Formats:** JPEG, PNG, WebP (Validated by binary magic bytes; max file size 10MB).

---

## 5. End-to-End Inference & Safety Pipeline

```
[ Uploaded Image File ]
         │
         ▼
[ Step 1: Magic Byte Check ] ──(Invalid)──► Return HTTP 422 ("Unsupported image format")
         │
         ▼
[ Step 2: Foliage Ratio Gate ] ──(Foliage < 8%)──► Return "not_crop" ("Image does not contain plant foliage")
         │
         ▼
[ Step 3: ResNet-50 Feed-Forward ]
         │
         ▼
[ Step 4: Softmax & Top-K Candidates ]
         │
         ▼
[ Step 5: Uncertainty Evaluation ]
  - Is Top-1 Confidence < 60%?
  - Is Margin (Top-1 - Top-2) < 15%?
         │
    ┌────┴────┐
    │ YES     │ NO
    ▼         ▼
"uncertain"  "accepted"
    │         │
    └────┬────┘
         ▼
[ Step 6: Non-Clinical Disclaimer Attachment ]
         │
         ▼
[ Step 7: Database Persistence (CropDiagnosisRecord) ]
```

### Safety Threshold Constants (from `services/disease-service/main.py`)
- `MIN_CONFIDENCE_THRESHOLD = 0.60`: Predictions with under 60% Softmax probability are automatically classified as `status: "uncertain"`.
- `RUNNER_UP_MARGIN_THRESHOLD = 0.15`: If the top candidate and runner-up candidate differ by less than 15%, the model detects visual ambiguity and flags `status: "uncertain"`.
- `MIN_FOLIAGE_PIXEL_RATIO = 0.08`: Images with fewer than 8% plant pigment pixels (green/yellow/brown HSV color range) are rejected with `status: "not_crop"`.

---

## 6. Evaluation Metrics & Performance

Evaluated via `services/disease-service/evaluate.py` on the held-out validation dataset:

| Metric | Measured Value | Standard Target |
|---|---|---|
| **Top-1 Accuracy** | **95.00%** | $\ge 90.0\%$ |
| **Macro Precision** | **95.16%** | $\ge 85.0\%$ |
| **Macro Recall** | **95.00%** | $\ge 85.0\%$ |
| **Macro F1-Score** | **95.00%** | $\ge 85.0\%$ |
| **Non-Plant Rejection Specificity** | **98.2%** | $\ge 95.0\%$ |
| **Average Latency (Intel CPU)** | **84 ms** | $\le 250\text{ ms}$ |

---

## 7. Known Limitations & User Warnings

1. **Laboratory Condition Bias**: PlantVillage images were captured in controlled laboratory settings with uniform lighting. Field images with shadows, high glare, or wet droplets experience higher uncertainty.
2. **Visual Mimicry**: Early-stage bacterial spot and early blight on tomato leaves share similar necrosis patterns. In such cases, the model flags uncertainty and prompts the farmer to seek physical verification.
3. **Language Scope**: Class labels are normalized into standard agricultural pathology terms in English (`label`), with localized Gujarati (`gu`) and Hindi (`hi`) display translations rendered in the UI.
4. **Mandatory Non-Clinical Notice**:
   > *"Softmax scores represent benchmark category alignment, not clinical certainty. Physical inspection by a certified agricultural extension officer or KVK agronomist is required before applying chemical treatments."*
