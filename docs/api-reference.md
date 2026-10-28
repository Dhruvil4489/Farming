# SmartFarm AI — REST API Reference Specification

> **Base URL:** `http://localhost:3000/api/v1` (or deployed domain)  
> **Format:** JSON (`application/json`)  
> **Standard Envelope:** All API responses adhere to strict `{ data, meta }` or `{ error }` envelopes.

---

## 1. Global Standard Response Envelopes

### 1.1 Success Response Envelope
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 42,
    "total_pages": 3,
    "requestId": "req_8f9a2b1c"
  }
}
```

### 1.2 Error Response Envelope
```json
{
  "error": {
    "code": "validation_error",
    "message": "Telemetry payload validation failed",
    "details": {
      "soilMoisturePct": ["Expected number, received string"]
    },
    "statusCode": 422,
    "requestId": "req_3a7d9e1f"
  }
}
```

### 1.3 Standard HTTP Status Codes
| Code | Meaning | Typical Usage |
|---|---|---|
| **200 OK** | Request succeeded | Successful GET, PATCH, or idempotent POST |
| **201 Created** | Entity created | Resource created (Farm, Field, Order, Device, Diagnosis) |
| **400 Bad Request** | Malformed request | Corrupted JSON payload, missing multipart file |
| **401 Unauthorized** | Authentication required | Missing or invalid JWT session cookie or device token |
| **403 Forbidden** | Access denied | Non-admin calling administrative sync or revoked IoT probe |
| **404 Not Found** | Resource not found | Entity does not exist or belongs to another tenant (IDOR prevention) |
| **409 Conflict** | State conflict | Duplicate email on registration or conflicting device code |
| **413 Payload Too Large**| File limit exceeded | Image upload exceeds 10MB limit |
| **422 Unprocessable** | Semantic validation error | Zod validation failure, invalid magic bytes, or clock skew |
| **429 Rate Limited** | Velocity limit exceeded | Rapid registration burst |
| **500 Server Error** | Internal failure | Database connection failure or unhandled exception |

---

## 2. Authentication & Profile APIs

### 2.1 Register Farmer Account
- **Endpoint:** `POST /api/v1/auth/register`
- **Auth:** Public
- **Rate Limit:** 5 requests per minute per IP
- **Request Body:**
  ```json
  {
    "name": "Ramesh Patel",
    "email": "farmer@smartfarm.ai",
    "password": "farmer123456",
    "phone": "+919876543210",
    "state": "Gujarat",
    "district": "Vadodara",
    "village": "Padra"
  }
  ```
- **Response (201 Created):** Sets `auth_token` HttpOnly cookie.
  ```json
  {
    "data": {
      "id": "usr_9f8a7b6c-...",
      "name": "Ramesh Patel",
      "email": "farmer@smartfarm.ai",
      "state": "Gujarat",
      "district": "Vadodara"
    }
  }
  ```

### 2.2 Login with Credentials
- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "identifier": "farmer@smartfarm.ai",
    "password": "farmer123456"
  }
  ```
- **Response (200 OK):** Sets `auth_token` HttpOnly cookie.

### 2.3 Terminate Session (Logout)
- **Endpoint:** `POST /api/v1/auth/logout`
- **Auth:** Session Cookie
- **Response (200 OK):** Overwrites `auth_token` with `Max-Age=0`.

### 2.4 Get Current User Profile
- **Endpoint:** `GET /api/v1/me`
- **Auth:** Session Cookie
- **Response (200 OK):**
  ```json
  {
    "data": {
      "id": "usr_...",
      "name": "Ramesh Patel",
      "email": "farmer@smartfarm.ai",
      "preferredLanguage": "en",
      "roles": ["FARMER"]
    }
  }
  ```

---

## 3. Agronomic Management APIs

### 3.1 Create Farm Plot
- **Endpoint:** `POST /api/v1/farms`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "name": "Patel Organic Farm Plot A",
    "village": "Padra",
    "district": "Vadodara",
    "state": "Gujarat",
    "lat": 22.2405,
    "lng": 73.0848,
    "totalAreaHa": 2.8,
    "farmType": "irrigated"
  }
  ```
- **Response (201 Created):** Returns farm entity with generated ID.

### 3.2 Create Field Parcel
- **Endpoint:** `POST /api/v1/fields`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "farmId": "farm_uuid_...",
    "name": "North Cotton Sector",
    "areaHa": 1.5,
    "irrigationType": "drip",
    "soilType": "black"
  }
  ```
- **Response (201 Created):** Returns field entity.

### 3.3 Initiate Crop Cycle (With Phenological Stage Materialization)
- **Endpoint:** `POST /api/v1/crop-cycles`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "fieldId": "field_uuid_...",
    "cropId": "crop_cotton_uuid_...",
    "sowingDate": "2026-06-15T00:00:00Z",
    "areaHa": 1.5
  }
  ```
- **Response (201 Created):** Returns cycle with materialized `stages` array.

### 3.4 Create & Complete Tasks
- **Create Task:** `POST /api/v1/tasks` (Body: `farmId`, `fieldId`, `type`, `title`, `priority`, `dueAt`)
- **Complete Task:** `POST /api/v1/tasks/:id/complete` (Updates status to `completed` and records `completedAt`)

### 3.5 Field Scouting Observations
- **Endpoint:** `POST /api/v1/observations`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "fieldId": "field_uuid_...",
    "category": "pest",
    "severity": 2,
    "notes": "Early aphid presence noted on lower leaves.",
    "source": "manual",
    "status": "open"
  }
  ```
- **Validation:** `category` must be one of `pest`, `disease`, `weed`, `nutrient_issue`, `irrigation_issue`, `growth_issue`, `general`. `severity` must be integer `1`, `2`, or `3`.

### 3.6 Log Irrigation Event
- **Endpoint:** `POST /api/v1/irrigation`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "fieldId": "field_uuid_...",
    "waterSource": "drip",
    "durationMinutes": 90,
    "notes": "Morning scheduled pulse"
  }
  ```

---

## 4. Mandi Market Intelligence APIs

### 4.1 Query Mandi Prices
- **Endpoint:** `GET /api/v1/market/prices`
- **Auth:** Public
- **Query Parameters:**
  - `state` (optional string, e.g. `Gujarat`)
  - `district` (optional string, e.g. `Vadodara`)
  - `market` (optional string, e.g. `Padra`)
  - `commodity` (optional string, e.g. `Cotton`)
  - `limit` (optional integer, default 20, max 100)
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "mkt_...",
        "commodity": "Cotton",
        "state": "Gujarat",
        "district": "Vadodara",
        "market": "Padra",
        "arrivalDate": "2026-10-27T00:00:00Z",
        "minPrice": 6200,
        "maxPrice": 7100,
        "modalPrice": 6850,
        "isDemo": false,
        "source": "data.gov.in AGMARKNET"
      }
    ],
    "meta": { "total": 1, "provider": "agmarknet" }
  }
  ```

### 4.2 Trigger Scheduled Mandi Sync
- **Endpoint:** `GET /api/v1/scheduled/market-sync`
- **Auth:** `Authorization: Bearer <CRON_SECRET>`
- **Response (200 OK):**
  ```json
  {
    "data": {
      "status": "success",
      "recordsFetched": 45,
      "recordsUpserted": 45,
      "durationMs": 412
    }
  }
  ```

### 4.3 Admin Manual Market Sync
- **Endpoint:** `POST /api/v1/admin/market/sync`
- **Auth:** Session Cookie with `ADMIN` role
- **Response (200 OK):** Returns sync telemetry. Non-admin calls receive `403 Forbidden`.

---

## 5. IoT Telemetry Pipeline APIs

### 5.1 Register IoT Hardware Device
- **Endpoint:** `POST /api/v1/iot/devices`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "fieldId": "field_uuid_...",
    "name": "North Soil Probe Alpha",
    "deviceCode": "ESP32_SOIL_001",
    "hardwareModel": "ESP32-SoilV1",
    "calibration": { "rawDry": 3200, "rawWet": 1400, "version": 1 }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "data": {
      "id": "dev_...",
      "deviceCode": "ESP32_SOIL_001",
      "rawBearerToken": "sf_dev_6a2b8e1f4c7d9a0e...",
      "warning": "Store this rawBearerToken securely. It will never be displayed again."
    }
  }
  ```

### 5.2 Ingest Telemetry Reading
- **Endpoint:** `POST /api/v1/iot/telemetry`
- **Auth:** `Authorization: Bearer <RAW_BEARER_TOKEN>`
- **Request Body:**
  ```json
  {
    "eventId": "a7b3c2d1-e4f5-4a6b-8c9d-0e1f2a3b4c5d",
    "measuredAt": "2026-10-28T05:30:00Z",
    "soilMoisturePct": 44.5,
    "soilMoistureRaw": 2150,
    "airTempC": 29.1,
    "airHumidityPct": 58.0,
    "batteryVoltage": 3.92
  }
  ```
- **Validation Rules:**
  - Clock skew: `measuredAt` rejected if >10m in the future or >7d in the past (`422`).
  - Values outside physical bounds generate quality flags without clamping (`qualityStatus: "out_of_range"`).
  - Duplicate `eventId` returns `200 OK` with `status: "duplicate_acknowledged"`.
- **Response (200 OK):**
  ```json
  {
    "data": {
      "id": "reading_...",
      "qualityStatus": "clean",
      "stored": true
    }
  }
  ```

### 5.3 Query Device Readings History
- **Endpoint:** `GET /api/v1/iot/devices/:id/readings`
- **Auth:** Session Cookie (Tenant-isolated)
- **Query Parameters:** `from` (ISO date), `to` (ISO date), `limit` (max 500).

---

## 6. Crop Disease Vision AI APIs

### 6.1 Predict Crop Disease from Leaf Image
- **Endpoint:** `POST /api/v1/diagnosis/predict`
- **Auth:** Session Cookie
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `image` (File, required): Binary JPEG, PNG, or WebP image (max 10MB).
  - `fieldId` (string, optional): Associated field plot.
  - `notes` (string, optional): Field context notes.
- **Security Check:** Validates file magic bytes (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG).
- **Response (201 Created):**
  ```json
  {
    "data": {
      "diagnosis": {
        "id": "diag_...",
        "status": "accepted",
        "predictedLabel": "Tomato___Early_blight",
        "crop": "Tomato",
        "disease": "Early blight",
        "isHealthy": false,
        "confidence": 0.94,
        "topK": [
          { "label": "Tomato___Early_blight", "score": 0.94 },
          { "label": "Tomato___Target_Spot", "score": 0.04 }
        ],
        "uncertainty": {
          "isUncertain": false,
          "caveat": "Softmax scores represent benchmark category alignment, not clinical certainty. Physical inspection required."
        },
        "model": {
          "name": "agri-plant-disease-resnet50",
          "version": "1.0.0",
          "license": "Apache-2.0"
        }
      }
    }
  }
  ```
- **Offline Fallback:** If inference microservice is offline, returns `status: "model_not_ready"` without crashing.

---

## 7. Grounded RAG Assistant APIs

### 7.1 Ask Farming Assistant
- **Endpoint:** `POST /api/v1/assistant/chat`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "question": "What is the recommended IPM strategy for pink bollworm in cotton?",
    "fieldId": "field_uuid_...",
    "language": "en"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "data": {
      "summary": "Implement pheromone traps at 5/ha for monitoring and apply neem-based azadirachtin 1500 ppm at early infestation.",
      "observations": [
        { "text": "Field currently at flowering stage (65 DAS).", "provenance": "measured" }
      ],
      "recommendations": [
        {
          "action": "Install 5 pheromone traps per hectare",
          "reason": "Monitors adult moth emergence and establishes economic threshold",
          "evidence_refs": ["ICAR Cotton IPM Guidelines"],
          "priority": "high"
        }
      ],
      "references": [
        {
          "title": "Integrated Pest Management in Cotton",
          "issuingOrg": "Indian Council of Agricultural Research (ICAR)",
          "topic": "Pest Management"
        }
      ],
      "confidence": "high",
      "limitations": [
        "Follow product label for exact chemical dosages.",
        "Physical inspection recommended."
      ],
      "provider": { "id": "gemini", "isMock": false },
      "conversationId": "conv_..."
    }
  }
  ```

---

## 8. Store, Cart & Orders APIs

### 8.1 Query Fertilizer Products
- **Endpoint:** `GET /api/v1/store/products`
- **Auth:** Public
- **Query Parameters:** `category`, `search`, `limit`, `page`.

### 8.2 Add Item to Cart
- **Endpoint:** `POST /api/v1/store/cart`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "productId": "prod_10_26_26",
    "quantity": 2
  }
  ```

### 8.3 Checkout Cart & Create Order
- **Endpoint:** `POST /api/v1/store/checkout`
- **Auth:** Session Cookie
- **Request Body:**
  ```json
  {
    "shippingAddress": {
      "fullName": "Ramesh Patel",
      "phone": "+919876543210",
      "addressLine1": "Near Primary School, Padra",
      "city": "Vadodara",
      "state": "Gujarat",
      "pincode": "391440"
    },
    "paymentMethod": "cash_on_delivery"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "data": {
      "order": {
        "id": "ord_...",
        "orderNumber": "SF-2026-98124",
        "subtotal": 2940,
        "shippingCost": 0,
        "totalAmount": 2940,
        "status": "confirmed",
        "itemCount": 2
      }
    }
  }
  ```
  *(Captures frozen unit price snapshot at time of checkout to prevent historical price mutation).*
