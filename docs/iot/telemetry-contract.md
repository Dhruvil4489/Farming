# SmartFarm AI — ESP32 & IoT Telemetry Ingestion Contract

## 1. Overview

SmartFarm AI provides an authenticated, high-throughput telemetry ingestion pipeline for on-farm physical sensor probes (e.g. ESP32, ESP8266, Arduino WiFi, LoRaWAN HTTP gateways, and custom field hardware).

This document establishes the hardware-to-cloud protocol, security boundaries, JSON schemas, clock synchronization rules, retry algorithms, and response codes.

---

## 2. Ingestion Endpoint & Transport Security

- **Protocol**: HTTPS (TLS 1.2 or TLS 1.3 mandatory; unencrypted HTTP strictly rejected in production)
- **Endpoint**: `POST /api/v1/iot/telemetry`
- **Port**: 443 (default HTTPS) or 3000 (local testing)
- **Content-Type**: `application/json`
- **Payload Size Limit**: 32 KB maximum per packet

---

## 3. Device Authentication & Secret Storage

Each physical hardware device receives a unique, server-assigned bearer token during provisioning (e.g., `sf_dev_6a2b8e...`).

### Security Rules:
1. **Header**: Pass the token via standard HTTP Authorization:
   ```http
   Authorization: Bearer sf_dev_6a2b8e1f4c7d9a0e...
   ```
   Or via the fallback header:
   ```http
   x-device-token: sf_dev_6a2b8e1f4c7d9a0e...
   ```
2. **One-Way Hashing**: The server stores only a SHA-256 hash (`tokenHash`). Plaintext credentials are never retained in database storage or echoed in logs.
3. **Hardware Storage**:
   - On ESP32, store the bearer token in Non-Volatile Storage (NVS) using NVS encryption or eFuse-protected flash.
   - Do not hardcode production credentials in public firmware repositories.
4. **Server-Assigned Ownership**:
   - The device's farm and field associations are strictly bound on the server registry. Devices **cannot** supply or forge `farmId` or `fieldId` in telemetry payloads.
5. **Revocation**:
   - Compromised or retired probes can be instantly revoked in the admin console or farmer app (`status: 'revoked'`). Ingestion calls from revoked devices receive `HTTP 403 Forbidden`.

---

## 4. Payload Specification

The telemetry schema is intentionally flexible: **no single sensor field is mandatory** except `measuredAt`. Probes send only the measurements their attached sensors provide.

### Complete JSON Schema Example:
```json
{
  "eventId": "a7b3c2d1-e4f5-4a6b-8c9d-0e1f2a3b4c5d",
  "measuredAt": "2026-10-27T14:45:00Z",
  "soilMoistureRaw": 2150,
  "soilMoisturePct": 46.8,
  "depthCm": 15,
  "airTempC": 29.4,
  "airHumidityPct": 62.1,
  "lightLux": 45000,
  "batteryVoltage": 3.92,
  "batteryPct": 88.0,
  "waterLevelSwitch": false
}
```

### Field Definitions & Plausible Numeric Bounds:

| Field | Type | Unit | Range / Constraints | Description |
|---|---|---|---|---|
| `measuredAt` | string | ISO-8601 | Recent (within 7d, <10m future) | **Required**. Timestamp recorded by the device clock. |
| `eventId` | string | UUID/Nonce | Max 64 chars | **Recommended**. Idempotency key for deduplication. |
| `soilMoistureRaw` | integer | ADC count | `0` to `65535` | Raw analog-to-digital converter reading (e.g. 12-bit ESP32 ADC: 0–4095). |
| `soilMoisturePct` | float | `%` index | `0.0` to `100.0%` | Relative calibrated moisture index (FDR/capacitive, not laboratory VWC). |
| `depthCm` | integer | `cm` | `1` to `200` (default `15`) | Sensor probe burial depth below ground level. |
| `airTempC` | float | `°C` | `-40.0` to `85.0°C` | Ambient air temperature (e.g. DHT22, SHT31, BME280). |
| `airHumidityPct` | float | `% RH` | `0.0` to `100.0%` | Ambient relative humidity. |
| `lightLux` | float | `lux` | `0.0` to `200,000.0` | Ambient photosynthetically active radiation / illumination (e.g. BH1750). |
| `batteryVoltage` | float | `V` | `0.0` to `24.0V` | Supply or battery voltage (e.g. 3.2V–4.2V for 18650 Li-ion cells). |
| `batteryPct` | float | `%` | `0.0` to `100.0%` | Remaining battery state-of-charge percentage. |
| `waterLevelSwitch` | boolean | bool | `true` or `false` | Digital flood / furrow water-level contact switch. |

---

## 5. Clock Synchronization & Skew Policy

1. **NTP Time Synchronization**:
   - ESP32 firmware must synchronize with NTP servers at boot (e.g. `time.google.com`, `pool.ntp.org`, or Indian standard `time.nplindia.org`).
2. **Clock Skew Tolerances**:
   - **Future Skew Limit**: Packets stamped more than **10 minutes** ahead of server time are rejected (`HTTP 422: clock_skew_violation`).
   - **Stale Packet Limit**: Packets older than **7 days** are rejected (`HTTP 422: clock_skew_violation`).
3. **Offline Store-and-Forward**:
   - If cellular or WiFi connectivity drops in the field, the probe should buffer readings in local flash/EEPROM with their original RTC `measuredAt` timestamp.
   - When connection recovers, the buffered readings are uploaded. As long as buffered packets are within 7 days, they are ingested smoothly.

---

## 6. Idempotency & Network Retries

### Deduplication:
When deploying in rural locations with weak GSM/GPRS connectivity, packet transmission may succeed upstream while the HTTP response is lost over the air.
- The device should generate a unique `eventId` (UUIDv4 or monotonic session counter) for each observation.
- If network drops and the device retries sending the same packet, the server matches `(deviceId, eventId)`.
- The server returns `HTTP 200 OK` with `{ "idempotent": true, "stored": false }` without creating duplicate records or skewing averages.

### Exponential Backoff Algorithm:
```
wait_time = min(base_delay * (2 ^ retry_count) + random_jitter_ms, max_backoff)
```
- `base_delay`: 2 seconds
- `max_backoff`: 300 seconds (5 minutes)
- `random_jitter`: 0 to 1000 milliseconds (prevents thundering herd when cell towers reconnect)

---

## 7. HTTP Response Codes

| Status Code | Code Identifier | Meaning & Recommended Action |
|---|---|---|
| `200 OK` | `stored: true` | Reading stored successfully. |
| `200 OK` | `idempotent: true` | Duplicate `eventId` recognized. Reading already recorded; do not retry. |
| `400 Bad Request` | `invalid_json` | Malformed JSON syntax. Inspect serializer. |
| `401 Unauthorized` | `device_unauthorized` | Missing or invalid bearer token. Check device configuration. |
| `403 Forbidden` | `device_revoked` | Device has been revoked or deactivated by the farmer/admin. Cease transmissions. |
| `422 Unprocessable` | `validation_error` | Value out of allowable range or non-finite number (`NaN`). |
| `422 Unprocessable` | `clock_skew_violation` | `measuredAt` clock is >10m in the future or >7d old. Re-sync NTP. |
| `429 Too Many Req` | `rate_limited` | Ingestion rate limit exceeded (e.g., > 1 packet / 10s). Increase sleep interval. |
| `500 Server Error` | `internal_error` | Server error. Apply exponential backoff and retry. |

---

## 8. ESP32 Arduino C++ Code Example

```cpp
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>

const char* ssid = "YOUR_FIELD_WIFI";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://api.smartfarm.ai/api/v1/iot/telemetry";
const char* deviceBearerToken = "sf_dev_YOUR_PROVISIONED_DEVICE_BEARER_TOKEN";

void syncClock() {
  configTime(19800, 0, "pool.ntp.org", "time.google.com"); // UTC+05:30 for India
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(500);
    now = time(nullptr);
  }
}

String getIsoTimestamp() {
  time_t now;
  time(&now);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

void sendTelemetry(float moisturePct, float tempC, float humidityPct) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // In production, supply client.setCACert(root_ca_pem);

  HTTPClient http;
  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + deviceBearerToken);

  String payload = "{";
  payload += "\"measuredAt\":\"" + getIsoTimestamp() + "\",";
  payload += "\"soilMoisturePct\":" + String(moisturePct, 1) + ",";
  payload += "\"airTempC\":" + String(tempC, 1) + ",";
  payload += "\"airHumidityPct\":" + String(humidityPct, 1) + ",";
  payload += "\"depthCm\":15";
  payload += "}";

  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    Serial.println("✔ Telemetry acknowledged by SmartFarm AI");
  } else {
    Serial.printf("❌ Telemetry failed: HTTP %d\n", httpCode);
  }
  http.end();
}
```
