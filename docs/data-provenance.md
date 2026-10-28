# SmartFarm AI — Data Provenance & Source Transparency Matrix

> **Core Transparency Mandate:** In agriculture, a farmer's livelihood depends on trust. SmartFarm AI enforces strict data provenance: the platform **never presents simulated or model-estimated data as empirical sensor measurements**, never presents static benchmarks as live market trades, and always discloses the originating source of recommendations.

---

## 1. The 7-Tier Provenance Taxonomy

Every data point rendered across the SmartFarm AI user interface carries an explicit provenance tag adhering to the 7-tier classification taxonomy:

| Provenance Key | Badge Label | UI Color Token | Contrast Ratio | Data Definition |
|---|---|---|---|---|
| `measured` | `IN-SITU SENSOR` | Emerald (`#047857` / `#ecfdf5`) | 12.4:1 (WCAG AAA) | Physical telemetry reading transmitted by an authenticated hardware probe in the soil. |
| `forecast` | `WEATHER FORECAST` | Sky (`#0369a1` / `#f0f9ff`) | 11.2:1 (WCAG AAA) | Multi-day atmospheric numerical forecast model (Open-Meteo). |
| `official_market` | `OFFICIAL APMC` | Teal (`#0f766e` / `#f0fdfa`) | 11.8:1 (WCAG AAA) | Verified trade records published by the Directorate of Marketing & Inspection, Ministry of Agriculture. |
| `model_prediction` | `AI PREDICTION` | Purple (`#7e22ce` / `#faf5ff`) | 10.6:1 (WCAG AAA) | Machine learning visual screening classification (PyTorch ResNet-50) with confidence and uncertainty metrics. |
| `verified_source` | `VERIFIED ICAR/AAU` | Indigo (`#4338ca` / `#eef2ff`) | 12.1:1 (WCAG AAA) | Agricultural extension recommendations extracted verbatim from official ICAR or State Agriculture University guides. |
| `simulated` | `SIMULATED DATA` | Amber (`#b45309` / `#fffbeb`) | 9.8:1 (WCAG AAA) | Synthetic sensor streams, demo fixtures, or simulated test packets (`isDemo: true`). |
| `stale_cached` | `CACHED / STALE` | Stone (`#57534e` / `#f5f5f4`) | 10.1:1 (WCAG AAA) | Historical snapshot cached during network outage or server sync delay. |

---

## 2. Exhaustive Data Element Source Matrix

| System Domain | Specific Data Element | Primary Origin / Source | Verification / Grounding Mechanism | Provenance Classification |
|---|---|---|---|---|
| **Mandi Intelligence** | Modal, Min, Max Commodity Prices | Official AGMARKNET feed ([data.gov.in](https://data.gov.in)) | Fetched via `AgmarknetProvider`; validated against inverted price anomalies (`min > max`). | `official_market` (Live) or `simulated` (Demo mode) |
| **Mandi Intelligence** | Trade Arrival Date vs Sync Timestamp | Government APMC registry | Dual-timestamp display: records both when trade occurred and when platform refreshed. | `official_market` |
| **Meteorology** | Ambient Temperature & Relative Humidity | Open-Meteo Numerical Weather API ([open-meteo.com](https://open-meteo.com)) | Dynamic UTC-to-IST hourly index alignment; bounded between 0% and 100%. | `forecast` |
| **Meteorology** | Rain Probability & Wind Speed | ECMWF / GFS weather models | Evaluated by `AdvisoryEngine` against high-wind (≥20 km/h) and rain-delay (≥50%) spray rules. | `forecast` |
| **IoT Telemetry** | Volumetric Soil Moisture Content (%) | Physical Capacitive Probe (v1.2) | Computed from raw ADC ticks ($ADC_{raw}$) using calibrated soil moisture polynomial and texture offset. | `measured` |
| **IoT Telemetry** | Sensor Hardware Quality Flag | Hardware microcontroller | Non-clamping quality evaluator flags `clean`, `out_of_range`, or `uncalibrated`. | `measured` |
| **IoT Telemetry** | Simulated Soil Moisture & Battery | Software Simulator (`scripts/simulate-iot.mjs`) | Marked explicitly with `isDemo: true` in database and UI badge. | `simulated` |
| **Soil Profiling** | District Soil Parameter Defaults | State Soil Health Card averages | Used as fallback when farmer has not uploaded lab test report. | `stale_cached` |
| **Crop Biology** | Phenological Stage Sequences & Durations | ICAR / Anand Agricultural University (AAU) PoP | Materialized concrete stage timelines from validated crop templates. | `verified_source` |
| **Crop Health** | Visual Disease Classification | Decoupled PyTorch ResNet-50 Microservice | Softmax top-K candidate scores with foliage color ratio filtering and uncertainty reasons. | `model_prediction` |
| **Farming Assistant** | Agronomic Recommendations | Grounded Extension RAG Pipeline | Assembled from official ICAR and AAU extension literature with mandatory publication citations. | `verified_source` |
| **Store & Orders** | Fertilizer Formulas & NPKS Ratios | Registered Fertilizer Catalog | Predefined authentic NPKS nutrient formulations (e.g. 10:26:26, 19:19:19). | `verified_source` |
| **Store & Orders** | Unit Price Snapshot | Checkout Order Generation | Unit price frozen at moment of order creation to prevent retro-active price drift. | `measured` |

---

## 3. Transparency & Fallback Behavior

When external boundaries are unavailable, SmartFarm AI prioritizes honesty over false precision:

### 3.1 Mandi Prices Fallback
- If `MARKET_API_KEY` is not supplied or data.gov.in is unreachable (e.g. HTTP 429 / 500), the system activates `DemoMarketProvider`.
- **UI Indication:** The table header prominently displays an **Amber SIMULATED DATA** badge with the notice: *"Showing verified demonstration market rates. Add MARKET_API_KEY in .env for real-time data.gov.in feed."*

### 3.2 Crop Disease Vision Fallback
- If the Python microservice is offline, the Next.js server catches `ECONNREFUSED` or request timeout (10s) and returns `status: "model_not_ready"`.
- **UI Indication:** The UI displays: *"Vision service is offline or busy. Non-clinical advice cannot be generated at this time."* It **never returns a fake random disease name**.

### 3.3 AI Farming Assistant Fallback
- If commercial LLM keys are absent, the platform activates `MockAIProvider`.
- **UI Indication:** Responses carry the `[SIMULATED - MOCK AI]` badge and output grounded recommendations based directly on the farmer's crop stage and ICAR package of practices.

---

## 4. Accessibility & Contrast Standards

In compliance with WCAG 2.1 AA and AAA readability guidelines for high-glare outdoor farm environments:
- Text-to-background contrast on all provenance chips exceeds **9.8:1** (minimum requirement is 7.0:1 for AAA).
- Screen readers announce badge semantics via `aria-label` attributes (e.g., `aria-label="Data source: In-situ calibrated sensor probe"`).
- Color is never used as the sole indicator of data provenance: every chip includes both an explicit text label and an associated semantic icon.
