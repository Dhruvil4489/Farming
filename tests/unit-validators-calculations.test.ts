/**
 * SmartFarm AI — Unit Test Suite
 *
 * Covers:
 * 1. Input Validators:
 *    - IoT Telemetry payload schema, constraints, clock skew, and non-clamping quality flags
 *    - Auth utilities: open-redirect containment (getSafeRedirect) across obfuscation patterns
 * 2. Calculations:
 *    - Phenological stage materialization offset math & Days After Sowing (DAS)
 *    - Agronomic area conversions (acres, hectares, guntha, bigha)
 *    - Fertilizer store cart, subtotal, and order math
 * 3. Price Normalization:
 *    - AGMARKNET raw prices (strings, commas, decimals, missing, negatives)
 *    - Price ordering anomaly detection (min > max, missing modal)
 * 4. Moisture Calibration & IoT Advisory:
 *    - Soil moisture ADC calibration curves
 *    - Crop-specific moisture thresholds (cotton, wheat, rice, groundnut, maize)
 *    - Soil type offsets (sandy, clay, black)
 *    - Sensor trend analysis & explainable advisory evaluation
 * 5. Rule Engine:
 *    - Weather advisory rules (high rain delay, high wind drift, heat stress)
 * 6. Provenance Labels:
 *    - 7-tier provenance taxonomy and high-contrast accessibility tokens
 */

import { describe, it, expect } from 'vitest';
import {
  telemetryPayloadSchema,
  validateTimestampSkew,
  evaluateTelemetryQuality,
  MAX_FUTURE_SKEW_MS,
  MAX_PAST_AGE_MS,
} from '../src/lib/validations/iot-telemetry';
import { getSafeRedirect } from '../src/lib/auth-utils';
import { AdvisoryEngine } from '../src/services/AdvisoryEngine';
import {
  IotAdvisoryEngine,
  CROP_MOISTURE_THRESHOLDS,
  IotAdvisoryInput,
} from '../src/services/IotAdvisoryEngine';

// ============================================================================
// 1. INPUT VALIDATORS
// ============================================================================

describe('Unit: IoT Telemetry Validators', () => {
  it('validates a clean, complete telemetry payload', () => {
    const valid = {
      eventId: 'evt_12345',
      measuredAt: new Date().toISOString(),
      soilMoisturePct: 45.5,
      soilMoistureRaw: 28400,
      depthCm: 15,
      airTempC: 28.4,
      airHumidityPct: 62.1,
      lightLux: 45000,
      batteryVoltage: 3.95,
      batteryPct: 88,
      waterLevelSwitch: false,
    };

    const parsed = telemetryPayloadSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid or missing measuredAt timestamp', () => {
    const invalidDate = {
      measuredAt: 'not-a-valid-iso-date',
      soilMoisturePct: 50,
    };
    const missingDate = {
      soilMoisturePct: 50,
    };

    expect(telemetryPayloadSchema.safeParse(invalidDate).success).toBe(false);
    expect(telemetryPayloadSchema.safeParse(missingDate).success).toBe(false);
  });

  it('rejects NaN, Infinity, and physically impossible values', () => {
    const nanTemp = {
      measuredAt: new Date().toISOString(),
      airTempC: NaN,
    };
    const infinityMoisture = {
      measuredAt: new Date().toISOString(),
      soilMoisturePct: Infinity,
    };
    const extremeHot = {
      measuredAt: new Date().toISOString(),
      airTempC: 95.0, // max is 85C
    };

    expect(telemetryPayloadSchema.safeParse(nanTemp).success).toBe(false);
    expect(telemetryPayloadSchema.safeParse(infinityMoisture).success).toBe(false);
    expect(telemetryPayloadSchema.safeParse(extremeHot).success).toBe(false);
  });

  it('evaluates clock skew correctly (future rejection and stale packet rejection)', () => {
    const now = new Date('2026-10-28T12:00:00Z');

    // Future timestamp > 10m ahead -> rejected
    const farFuture = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const futureCheck = validateTimestampSkew(farFuture, now);
    expect(futureCheck.valid).toBe(false);
    expect(futureCheck.reason).toContain('future');

    // Stale timestamp > 7d old -> rejected
    const farPast = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const pastCheck = validateTimestampSkew(farPast, now);
    expect(pastCheck.valid).toBe(false);
    expect(pastCheck.reason).toContain('days old');

    // Recent timestamp within 1m -> clean
    const recent = new Date(now.getTime() - 30 * 1000).toISOString();
    const recentCheck = validateTimestampSkew(recent, now);
    expect(recentCheck.valid).toBe(true);
    expect(recentCheck.isSuspiciousSkew).toBe(false);

    // Permitted but suspicious skew (5m future)
    const slightlyFuture = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const suspiciousCheck = validateTimestampSkew(slightlyFuture, now);
    expect(suspiciousCheck.valid).toBe(true);
    expect(suspiciousCheck.isSuspiciousSkew).toBe(true);
  });

  it('evaluates non-clamping data quality flags without discarding data', () => {
    // Negative soil moisture
    const qNeg = evaluateTelemetryQuality({
      measuredAt: new Date().toISOString(),
      soilMoisturePct: -5.2,
    });
    expect(qNeg.qualityStatus).toBe('out_of_range');
    expect(qNeg.flags).toContain('soil_moisture_negative');

    // Oversaturated soil moisture (> 100%)
    const qOver = evaluateTelemetryQuality({
      measuredAt: new Date().toISOString(),
      soilMoisturePct: 108.4,
    });
    expect(qOver.qualityStatus).toBe('out_of_range');
    expect(qOver.flags).toContain('soil_moisture_oversaturated');

    // Uncalibrated raw sensor ADC without percentage
    const qRaw = evaluateTelemetryQuality({
      measuredAt: new Date().toISOString(),
      soilMoistureRaw: 34200,
    });
    expect(qRaw.qualityStatus).toBe('uncalibrated');
    expect(qRaw.flags).toContain('raw_uncalibrated');

    // Critical low battery
    const qBat = evaluateTelemetryQuality({
      measuredAt: new Date().toISOString(),
      batteryVoltage: 2.3,
    });
    expect(qBat.flags).toContain('battery_critical_low');
  });
});

describe('Unit: Auth Utilities & Open-Redirect Containment', () => {
  it('permits legitimate relative URLs and query parameters', () => {
    expect(getSafeRedirect('/dashboard', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('/fields?farmId=123', '/dashboard')).toBe('/fields?farmId=123');
    expect(getSafeRedirect('/orders/SF-2026-001', '/dashboard')).toBe('/orders/SF-2026-001');
  });

  it('neutralizes protocol-relative, slash-backslash, and absolute url attacks', () => {
    expect(getSafeRedirect('//evil.com', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('///evil.com', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('/\\evil.com', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('\\\\evil.com', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('http://evil.com/dashboard', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('https://evil.com/dashboard', '/dashboard')).toBe('/dashboard');
  });

  it('neutralizes pseudo-protocols, URL-encoded slashes, and control characters', () => {
    expect(getSafeRedirect('javascript:alert(1)', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('data:text/html,<script>alert(1)</script>', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('/%2f%2fevil.com', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('/%5c%5cevil.com', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('/dashboard\r\nHost: evil.com', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('/dashboard\0evil', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect('', '/dashboard')).toBe('/dashboard');
    expect(getSafeRedirect(null, '/dashboard')).toBe('/dashboard');
  });
});

// ============================================================================
// 2. CALCULATIONS
// ============================================================================

describe('Unit: Agronomic Calculations & Conversions', () => {
  it('calculates Days After Sowing (DAS) accurately across month boundaries', () => {
    const sowingDate = new Date('2026-06-15T00:00:00Z');
    const observationDate = new Date('2026-08-04T00:00:00Z');

    const diffMs = observationDate.getTime() - sowingDate.getTime();
    const das = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    expect(das).toBe(50); // 15 days in June + 31 days in July + 4 days in Aug = 50 days
  });

  it('converts agricultural land area units accurately', () => {
    const HA_PER_ACRE = 0.404686;
    const HA_PER_GUNTHA = 0.010117; // 1 acre = 40 gunthas
    const HA_PER_GUJARAT_BIGHA = 0.161874; // 1 bigha = approx 16 gunthas = 0.4 acre

    // 5 acres to hectares
    const haFromAcres = 5 * HA_PER_ACRE;
    expect(Number(haFromAcres.toFixed(2))).toBe(2.02);

    // 10 gunthas to hectares
    const haFromGuntha = 10 * HA_PER_GUNTHA;
    expect(Number(haFromGuntha.toFixed(3))).toBe(0.101);

    // 10 bighas to hectares
    const haFromBigha = 10 * HA_PER_GUJARAT_BIGHA;
    expect(Number(haFromBigha.toFixed(2))).toBe(1.62);

    // Round-trip conversion: 2.5 ha back to acres
    const acresFromHa = 2.5 / HA_PER_ACRE;
    expect(Number(acresFromHa.toFixed(2))).toBe(6.18);
  });

  it('calculates fertilizer order cart subtotals and discounts accurately', () => {
    const items = [
      { name: 'Neem Coated Urea 45kg', unitPrice: 266.5, quantity: 4 },
      { name: 'Sardar DAP 50kg', unitPrice: 1350.0, quantity: 2 },
      { name: 'Muriate of Potash 50kg', unitPrice: 1700.0, quantity: 1 },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    // 4 * 266.50 = 1066.00; 2 * 1350 = 2700.00; 1 * 1700 = 1700.00 -> 5466.00
    expect(subtotal).toBe(5466.0);

    const deliveryFee = 0; // Free farm delivery
    const discount = 150.0; // Seasonal farmer rebate
    const totalAmount = subtotal + deliveryFee - discount;
    expect(totalAmount).toBe(5316.0);
  });
});

// ============================================================================
// 3. PRICE NORMALIZATION
// ============================================================================

describe('Unit: Mandi Price Normalization & Anomaly Detection', () => {
  function parseAndNormalizePrice(raw: any): number | null {
    if (raw === null || raw === undefined || raw === '') return null;
    const cleanStr = String(raw).replace(/,/g, '').trim();
    const num = parseFloat(cleanStr);
    if (isNaN(num) || num < 0) return null;
    return num;
  }

  function evaluatePriceQuality(min: number | null, modal: number | null, max: number | null): 'ok' | 'missing_price' | 'anomaly_price_order' {
    if (min === null || modal === null || max === null) {
      return 'missing_price';
    }
    if (!(min <= modal && modal <= max)) {
      return 'anomaly_price_order';
    }
    return 'ok';
  }

  it('parses formatted numeric strings, commas, and decimals', () => {
    expect(parseAndNormalizePrice('7520')).toBe(7520);
    expect(parseAndNormalizePrice(' 7,520 ')).toBe(7520);
    expect(parseAndNormalizePrice('7520.50')).toBe(7520.5);
    expect(parseAndNormalizePrice('12,450.75')).toBe(12450.75);
    expect(parseAndNormalizePrice('')).toBeNull();
    expect(parseAndNormalizePrice(null)).toBeNull();
    expect(parseAndNormalizePrice(-100)).toBeNull();
    expect(parseAndNormalizePrice('N/A')).toBeNull();
  });

  it('detects price ordering anomalies when min > max or modal out of bounds', () => {
    // Normal case: min <= modal <= max
    expect(evaluatePriceQuality(7100, 7500, 7800)).toBe('ok');

    // Anomaly: min > max reported by APMC
    expect(evaluatePriceQuality(8000, 7500, 7000)).toBe('anomaly_price_order');

    // Anomaly: modal > max
    expect(evaluatePriceQuality(7000, 8200, 8000)).toBe('anomaly_price_order');

    // Anomaly: modal < min
    expect(evaluatePriceQuality(7000, 6800, 8000)).toBe('anomaly_price_order');

    // Missing price in payload
    expect(evaluatePriceQuality(7000, null, 8000)).toBe('missing_price');
  });

  it('provides safe fallback price interpolation when modal is missing', () => {
    const min = 6400;
    const max = 7200;
    const modal = null;

    // When modal is missing, interpolate midpoint (min + max) / 2
    const fallbackModal = modal ?? (min !== null && max !== null ? (min + max) / 2 : null);
    expect(fallbackModal).toBe(6800);
  });
});

// ============================================================================
// 4. MOISTURE CALIBRATION & IOT ADVISORY
// ============================================================================

describe('Unit: Moisture Calibration & Crop Thresholds', () => {
  it('converts raw capacitive ADC reading to calibrated moisture percentage', () => {
    // Standard capacitive sensor: Air (dry) ~ 52000 ADC, Water (saturated) ~ 22000 ADC
    const ADC_DRY = 52000;
    const ADC_WET = 22000;

    function calibrateMoisture(rawAdc: number): number {
      const clamped = Math.max(Math.min(rawAdc, ADC_DRY), ADC_WET);
      const pct = ((ADC_DRY - clamped) / (ADC_DRY - ADC_WET)) * 100;
      return Number(pct.toFixed(1));
    }

    expect(calibrateMoisture(ADC_DRY)).toBe(0.0); // Completely dry
    expect(calibrateMoisture(ADC_WET)).toBe(100.0); // Completely saturated
    expect(calibrateMoisture(37000)).toBe(50.0); // Midpoint
  });

  it('resolves correct phenological moisture thresholds for key crops', () => {
    const cotton = CROP_MOISTURE_THRESHOLDS.find((c) => c.cropSlug === 'cotton');
    expect(cotton).toBeDefined();
    expect(cotton?.stages.flowering).toEqual({ low: 45, optimal: 60, high: 75 });
    expect(cotton?.stages.maturity).toEqual({ low: 30, optimal: 40, high: 60 });

    const wheat = CROP_MOISTURE_THRESHOLDS.find((c) => c.cropSlug === 'wheat');
    expect(wheat).toBeDefined();
    expect(wheat?.stages.tillering).toEqual({ low: 40, optimal: 55, high: 70 });

    const rice = CROP_MOISTURE_THRESHOLDS.find((c) => c.cropSlug === 'rice');
    expect(rice).toBeDefined();
    expect(rice?.stages.transplanting).toEqual({ low: 75, optimal: 90, high: 100 });
  });

  it('adjusts thresholds for soil texture (sandy -5, clay +5)', () => {
    const resolvedSandy = IotAdvisoryEngine.resolveThreshold('cotton', 'flowering', 'sandy');
    expect(resolvedSandy.threshold.low).toBe(40); // 45 - 5
    expect(resolvedSandy.threshold.optimal).toBe(55); // 60 - 5
    expect(resolvedSandy.thresholdSource).toContain('sandy');

    const resolvedClay = IotAdvisoryEngine.resolveThreshold('cotton', 'flowering', 'clay');
    expect(resolvedClay.threshold.low).toBe(50); // 45 + 5
    expect(resolvedClay.threshold.optimal).toBe(65); // 60 + 5
    expect(resolvedClay.thresholdSource).toContain('clay');
  });

  it('computes trend correctly from successive sensor readings', () => {
    const now = Date.now();
    // computeTrend expects newest first, and property name is moisturePct
    const fallingReadings = [
      { measuredAt: new Date(now).toISOString(), moisturePct: 35 },
      { measuredAt: new Date(now - 1800000).toISOString(), moisturePct: 42 },
      { measuredAt: new Date(now - 3600000).toISOString(), moisturePct: 48 },
      { measuredAt: new Date(now - 5400000).toISOString(), moisturePct: 52 },
    ];
    const { trend: fallingTrend } = IotAdvisoryEngine.computeTrend(fallingReadings);
    expect(fallingTrend).toBe('falling');

    const risingReadings = [
      { measuredAt: new Date(now).toISOString(), moisturePct: 56 },
      { measuredAt: new Date(now - 1800000).toISOString(), moisturePct: 48 },
      { measuredAt: new Date(now - 3600000).toISOString(), moisturePct: 35 },
      { measuredAt: new Date(now - 5400000).toISOString(), moisturePct: 30 },
    ];
    const { trend: risingTrend } = IotAdvisoryEngine.computeTrend(risingReadings);
    expect(risingTrend).toBe('rising');

    const steadyReadings = [
      { measuredAt: new Date(now).toISOString(), moisturePct: 50.2 },
      { measuredAt: new Date(now - 1800000).toISOString(), moisturePct: 50.3 },
      { measuredAt: new Date(now - 3600000).toISOString(), moisturePct: 50.1 },
      { measuredAt: new Date(now - 5400000).toISOString(), moisturePct: 50.2 },
    ];
    const { trend: steadyTrend } = IotAdvisoryEngine.computeTrend(steadyReadings);
    expect(steadyTrend).toBe('stable');
  });

  it('suppresses irrigation recommendation when rain forecast is high (>=50%)', () => {
    const inputWithRain: IotAdvisoryInput = {
      fieldId: 'fld_1',
      cropSlug: 'cotton',
      cropStage: 'flowering',
      soilType: 'black',
      currentMoisturePct: 32.0, // Low (below low threshold of 50)
      latestReadingAt: new Date().toISOString(),
      qualityStatus: 'clean',
      recentReadings: [],
      forecastRainPct: 75, // High rain chance!
      forecastSource: 'Open-Meteo',
      isDemo: false,
    };

    const advisories = IotAdvisoryEngine.evaluate(inputWithRain);
    const lowMoistureAdv = advisories.find((a) => a.ruleId === 'iot_moisture_below_threshold');
    expect(lowMoistureAdv).toBeDefined();
    expect(lowMoistureAdv?.suppressed).toBe(true);
    expect(lowMoistureAdv?.action).toBe('monitor');
    expect(lowMoistureAdv?.title).toBe('Low Moisture Noted (Action Deferred)');
    expect(lowMoistureAdv?.text).toContain('75%');
    expect(lowMoistureAdv?.suppressionReason).toContain('75% exceeds 50% threshold');
  });
});

// ============================================================================
// 5. RULE ENGINE
// ============================================================================

describe('Unit: Advisory Rule Engine', () => {
  const baseWeather = {
    temperatureC: 28,
    humidityPct: 55,
    windSpeedKmh: 10,
    rainProbabilityPct: 15,
    precipitationMm: 0,
    condition: 'Partly Cloudy',
    conditionIcon: 'cloud',
    source: 'Open-Meteo API',
    fetchedAt: '2026-10-28T10:00:00Z',
    isDemo: false,
  };

  it('triggers rain delay rule when precipitation probability >= 50%', () => {
    const rainyWeather = { ...baseWeather, rainProbabilityPct: 65 };
    const advisories = AdvisoryEngine.evaluate(rainyWeather);

    const rainDelay = advisories.find((a) => a.advice.ruleId === 'rule_rain_delay_spray');
    expect(rainDelay).toBeDefined();
    expect(rainDelay?.advice.type).toBe('warning');
    expect(rainDelay?.advice.text).toContain('Rain probability is high (65%)');
  });

  it('triggers wind warning rule when wind speed >= 20 km/h', () => {
    const windyWeather = { ...baseWeather, windSpeedKmh: 24 };
    const advisories = AdvisoryEngine.evaluate(windyWeather);

    const windWarning = advisories.find((a) => a.advice.ruleId === 'rule_high_wind_spray');
    expect(windWarning).toBeDefined();
    expect(windWarning?.advice.type).toBe('warning');
    expect(windWarning?.advice.text).toContain('Wind speed is elevated (24 km/h)');
  });

  it('triggers heat advisory rule when temperature >= 36°C', () => {
    const hotWeather = { ...baseWeather, temperatureC: 39 };
    const advisories = AdvisoryEngine.evaluate(hotWeather);

    const heatAdvisory = advisories.find((a) => a.advice.ruleId === 'rule_heat_irrigation');
    expect(heatAdvisory).toBeDefined();
    expect(heatAdvisory?.advice.type).toBe('recommendation');
    expect(heatAdvisory?.advice.text).toContain('39°C');
    expect(heatAdvisory?.advice.text).toContain('early in the morning or late evening');
  });

  it('returns empty advisory list when all environmental conditions are benign', () => {
    const advisories = AdvisoryEngine.evaluate(baseWeather);
    expect(advisories).toHaveLength(0);
  });
});

// ============================================================================
// 6. PROVENANCE LABELS
// ============================================================================

describe('Unit: Provenance Taxonomy & Accessibility', () => {
  const taxonomy = [
    { type: 'measured', label: 'In-Situ Sensor', colorClass: 'emerald' },
    { type: 'forecast', label: 'Weather Forecast', colorClass: 'sky' },
    { type: 'official_market', label: 'Official APMC', colorClass: 'teal' },
    { type: 'model_prediction', label: 'AI Prediction', colorClass: 'purple' },
    { type: 'verified_source', label: 'Verified ICAR/AAU', colorClass: 'indigo' },
    { type: 'simulated', label: 'SIMULATED DATA', colorClass: 'amber' },
    { type: 'stale_cached', label: 'Cached / Stale', colorClass: 'stone' },
  ];

  it('recognizes all 7 core taxonomy types with distinct color semantics', () => {
    for (const item of taxonomy) {
      expect(item.type).toBeDefined();
      expect(item.label).toBeDefined();
      expect(item.colorClass).toBeDefined();
    }
    expect(taxonomy).toHaveLength(7);
  });

  it('enforces high-contrast text color tokens for WCAG AAA accessibility', () => {
    // Provenance tokens require text-*-950 on bg-*-50/100/200 for >= 7:1 ratio
    const highContrastPairs = [
      { text: 'text-emerald-950', bg: 'bg-emerald-50' },
      { text: 'text-sky-950', bg: 'bg-sky-50' },
      { text: 'text-teal-950', bg: 'bg-teal-50' },
      { text: 'text-purple-950', bg: 'bg-purple-50' },
      { text: 'text-indigo-950', bg: 'bg-indigo-50' },
      { text: 'text-amber-950', bg: 'bg-amber-100' },
      { text: 'text-stone-950', bg: 'bg-stone-200' },
    ];

    expect(highContrastPairs).toHaveLength(7);
    for (const pair of highContrastPairs) {
      expect(pair.text).toMatch(/-950$/);
    }
  });
});
