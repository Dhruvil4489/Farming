# SmartFarm AI — Crop Disease Model Evaluation Report

> **Generated:** 2026-10-27 12:47:08Z  
> **Model:** ResNet-50 (`agri-plant-disease-resnet50`)  
> **Dataset Basis:** PlantVillage (Held-out validation subset)  
> **Input Dimension:** 224 × 224 × 3 RGB  
> **Evaluator:** `services/disease-service/evaluate.py`

---

## 1. Executive Summary

| Metric | Measured Value | Standard Benchmark Target | Status |
|---|---|---|---|
| **Top-1 Accuracy** | **95.00%** | $\ge 90.0\%$ | ✅ PASS |
| **Macro Precision** | **95.16%** | $\ge 85.0\%$ | ✅ PASS |
| **Macro Recall** | **95.00%** | $\ge 85.0\%$ | ✅ PASS |
| **Macro F1-Score** | **95.00%** | $\ge 85.0\%$ | ✅ PASS |
| **Non-Plant Rejection Specificity** | **98.2%** | $\ge 95.0\%$ | ✅ PASS |

*Note: These figures represent locally measured test results on the held-out validation suite. They are distinct from the upstream model author's theoretical validation claims.*

---

## 2. Per-Class Precision, Recall, and F1 Breakdown

| Class Label | Samples | Precision | Recall | F1-Score |
|---|---|---|---|---|
| `Apple___Apple_scab` | 20 | 100.00% | 90.00% | 94.74% |
| `Apple___healthy` | 20 | 90.00% | 90.00% | 90.00% |
| `Corn_(maize)___Common_rust_` | 20 | 90.48% | 95.00% | 92.68% |
| `Corn_(maize)___healthy` | 20 | 95.00% | 95.00% | 95.00% |
| `Grape___Black_rot` | 20 | 95.24% | 100.00% | 97.56% |
| `Potato___Early_blight` | 20 | 100.00% | 100.00% | 100.00% |
| `Potato___Late_blight` | 20 | 100.00% | 90.00% | 94.74% |
| `Tomato___Bacterial_spot` | 20 | 90.00% | 90.00% | 90.00% |
| `Tomato___Early_blight` | 20 | 90.91% | 100.00% | 95.24% |
| `Tomato___healthy` | 20 | 100.00% | 100.00% | 100.00% |

---

## 3. Confusion Matrix (Top 10 Benchmark Classes)

Rows indicate Ground Truth; Columns indicate Model Prediction.

| Ground Truth \ Prediction | `Apple_sc` | `healthy` | `Common_r` | `healthy` | `Black_ro` | `Early_bl` | `Late_bli` | `Bacteria` | `Early_bl` | `healthy` |
|---|---|---|---|---|---|---|---|---|---|---|
| `Apple_sc` | 18 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `healthy` | 0 | 18 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `Common_r` | 0 | 0 | 19 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `healthy` | 0 | 0 | 0 | 19 | 1 | 0 | 0 | 0 | 0 | 0 |
| `Black_ro` | 0 | 0 | 0 | 0 | 20 | 0 | 0 | 0 | 0 | 0 |
| `Early_bl` | 0 | 0 | 0 | 0 | 0 | 20 | 0 | 0 | 0 | 0 |
| `Late_bli` | 0 | 0 | 0 | 0 | 0 | 0 | 18 | 2 | 0 | 0 |
| `Bacteria` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 18 | 2 | 0 |
| `Early_bl` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 20 | 0 |
| `healthy` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 20 |

---

## 4. Key Limitations & Operating Boundaries

1. **Laboratory vs. Field Bias**: The PlantVillage benchmark was compiled using leaves on controlled, uniform backgrounds. In-field photos with variable sunlight, shadows, wet droplets, or soil backgrounds experience higher uncertainty.
2. **Close-Top-Two Ambiguities**: Closely related leaf spot symptoms (e.g. Tomato Early Blight vs. Tomato Target Spot or Septoria) may present near-equal visual confidence. The service flags these as `status: "uncertain"`.
3. **Non-Clinical Screening**: Visual classification models provide preliminary screening. They do not replace laboratory microscopic, PCR, or certified extension agronomist analysis.
4. **No Automated Pesticide Prescriptions**: In adherence to safety guardrails, outputs must never generate automated toxic pesticide dosages or purchase recommendations without professional human review.
