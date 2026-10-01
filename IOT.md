# SMARTFARM AI — IOT INTEGRATION SPECIFICATION

---

## 1. IoT Sensor Framework

SmartFarm AI provides a clean integration surface for on-farm telemetry devices (e.g. ESP32, Arduino, LoRaWAN gateways) measuring soil moisture, ambient temperature, humidity, and leaf wetness.

---

## 2. Telemetry Ingestion Contract

- **Protocol**: HTTP POST to `/api/v1/iot/readings`
- **Security**: Device API Key + HMAC-SHA256 signature header (`X-Device-Signature`).
- **Payload Schema**:
```json
{
  "device_id": "dev_esp32_field_01",
  "timestamp": "2026-09-29T21:45:00Z",
  "readings": [
    { "metric": "soil_moisture_pct", "value": 42.5, "unit": "%" },
    { "metric": "ambient_temp_c", "value": 28.4, "unit": "C" }
  ]
}
```

---

## 3. UI Display & Fallbacks

- When no sensor is registered for a field, the UI displays: `"No sensor connected — Manual observations active"`.
- Simulated or placeholder sensor values are strictly prohibited.
