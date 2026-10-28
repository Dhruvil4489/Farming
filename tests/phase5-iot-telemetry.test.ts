/**
 * Phase 5 — IoT Telemetry Validation, Token Security & Quality Unit Tests
 *
 * Covers:
 *   - Token generation and SHA-256 one-way hashing
 *   - Constant-time hash comparison
 *   - Zod schema validation (ranges, finite numbers, required/optional fields)
 *   - Timestamp sanity and clock skew detection
 *   - Non-clamping data quality evaluation
 */

import { describe, it, expect } from 'vitest';
import {
  generateDeviceToken,
  hashDeviceToken,
  constantTimeHashCompare,
} from '../src/lib/iot-auth';
import {
  telemetryPayloadSchema,
  validateTimestampSkew,
  evaluateTelemetryQuality,
  MAX_FUTURE_SKEW_MS,
  MAX_PAST_AGE_MS,
} from '../src/lib/validations/iot-telemetry';

describe('Phase 5: IoT Device Credentials & Token Security', () => {
  it('generates a 64-char hex device token prefixed with sf_dev_', () => {
    const token = generateDeviceToken();
    expect(token.startsWith('sf_dev_')).toBe(true);
    expect(token.length).toBe(7 + 64);
  });

  it('computes consistent SHA-256 hash of device token', () => {
    const token = 'sf_dev_test_token_12345';
    const hash1 = hashDeviceToken(token);
    const hash2 = hashDeviceToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('throws error when hashing empty or non-string token', () => {
    expect(() => hashDeviceToken('')).toThrow();
    expect(() => hashDeviceToken('   ')).toThrow();
  });

  it('constantTimeHashCompare returns true for identical hashes and false for different', () => {
    const hashA = hashDeviceToken('tokenA');
    const hashB = hashDeviceToken('tokenB');
    expect(constantTimeHashCompare(hashA, hashA)).toBe(true);
    expect(constantTimeHashCompare(hashA, hashB)).toBe(false);
    expect(constantTimeHashCompare('short', 'longer_hash')).toBe(false);
  });
});

describe('Phase 5: Telemetry Payload Schema Validation (Zod)', () => {
  it('accepts valid complete telemetry packet', () => {
    const payload = {
      eventId: 'evt_test_123',
      measuredAt: '2026-10-27T14:00:00Z',
      soilMoistureRaw: 2100,
      soilMoisturePct: 45.5,
      depthCm: 15,
      airTempC: 31.2,
      airHumidityPct: 62.0,
      lightLux: 45000,
      batteryVoltage: 3.95,
      batteryPct: 88,
      waterLevelSwitch: false,
    };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts minimal telemetry packet with only measuredAt', () => {
    const payload = {
      measuredAt: '2026-10-27T14:00:00Z',
    };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depthCm).toBe(15); // Default applied
    }
  });

  it('accepts partial packet with only soil moisture (missing ambient sensors)', () => {
    const payload = {
      measuredAt: '2026-10-27T14:00:00Z',
      soilMoistureRaw: 2400,
      soilMoisturePct: 35.0,
    };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects invalid or missing measuredAt timestamp', () => {
    const invalidPayload1 = { measuredAt: 'not-a-date' };
    const invalidPayload2 = { soilMoisturePct: 45.0 };
    expect(telemetryPayloadSchema.safeParse(invalidPayload1).success).toBe(false);
    expect(telemetryPayloadSchema.safeParse(invalidPayload2).success).toBe(false);
  });

  it('rejects non-finite numbers (NaN, Infinity)', () => {
    const nanPayload = {
      measuredAt: '2026-10-27T14:00:00Z',
      soilMoisturePct: NaN,
    };
    const infPayload = {
      measuredAt: '2026-10-27T14:00:00Z',
      airTempC: Infinity,
    };
    expect(telemetryPayloadSchema.safeParse(nanPayload).success).toBe(false);
    expect(telemetryPayloadSchema.safeParse(infPayload).success).toBe(false);
  });

  it('rejects physically impossible values beyond schema limits', () => {
    const extremePayload = {
      measuredAt: '2026-10-27T14:00:00Z',
      airTempC: 150, // Max 85C
      soilMoisturePct: 999, // Max 150%
    };
    expect(telemetryPayloadSchema.safeParse(extremePayload).success).toBe(false);
  });
});

describe('Phase 5: Timestamp Clock Skew Validation Policy', () => {
  const serverNow = new Date('2026-10-27T12:00:00Z');

  it('passes on timestamps with minimal drift (< 1 minute)', () => {
    const recent = new Date(serverNow.getTime() - 30 * 1000).toISOString();
    const result = validateTimestampSkew(recent, serverNow);
    expect(result.valid).toBe(true);
    expect(result.isSuspiciousSkew).toBe(false);
  });

  it('rejects future timestamps beyond 10 minutes', () => {
    const futureDate = new Date(serverNow.getTime() + MAX_FUTURE_SKEW_MS + 5000).toISOString();
    const result = validateTimestampSkew(futureDate, serverNow);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('future');
  });

  it('rejects stale timestamps older than 7 days', () => {
    const oldDate = new Date(serverNow.getTime() - MAX_PAST_AGE_MS - 60000).toISOString();
    const result = validateTimestampSkew(oldDate, serverNow);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('days old');
  });

  it('flags timestamps with moderate drift (e.g. 5m future) as suspicious but valid', () => {
    const moderateFuture = new Date(serverNow.getTime() + 5 * 60 * 1000).toISOString();
    const result = validateTimestampSkew(moderateFuture, serverNow);
    expect(result.valid).toBe(true);
    expect(result.isSuspiciousSkew).toBe(true);
  });
});

describe('Phase 5: Non-Clamping Data Quality Assessment', () => {
  it('evaluates normal agronomic readings as clean', () => {
    const quality = evaluateTelemetryQuality({
      measuredAt: '2026-10-27T12:00:00Z',
      soilMoisturePct: 42.0,
      airTempC: 28.5,
      airHumidityPct: 65.0,
      batteryVoltage: 3.95,
    });
    expect(quality.qualityStatus).toBe('clean');
    expect(quality.flags.length).toBe(0);
  });

  it('flags negative soil moisture without clamping raw value', () => {
    const quality = evaluateTelemetryQuality({
      measuredAt: '2026-10-27T12:00:00Z',
      soilMoisturePct: -5.0,
    });
    expect(quality.qualityStatus).toBe('out_of_range');
    expect(quality.flags).toContain('soil_moisture_negative');
  });

  it('flags oversaturated soil moisture (> 100%) as out_of_range', () => {
    const quality = evaluateTelemetryQuality({
      measuredAt: '2026-10-27T12:00:00Z',
      soilMoisturePct: 112.5,
    });
    expect(quality.qualityStatus).toBe('out_of_range');
    expect(quality.flags).toContain('soil_moisture_oversaturated');
  });

  it('flags uncalibrated reading with raw ADC only', () => {
    const quality = evaluateTelemetryQuality({
      measuredAt: '2026-10-27T12:00:00Z',
      soilMoistureRaw: 2350,
    });
    expect(quality.qualityStatus).toBe('uncalibrated');
    expect(quality.flags).toContain('raw_uncalibrated');
  });

  it('flags critical low battery voltage', () => {
    const quality = evaluateTelemetryQuality({
      measuredAt: '2026-10-27T12:00:00Z',
      soilMoisturePct: 40.0,
      batteryVoltage: 2.3, // Li-ion cutoff is ~2.5V-3.0V
    });
    expect(quality.flags).toContain('battery_critical_low');
  });
});
