/**
 * SmartFarm AI — IoT Telemetry Validation & Quality Classification
 *
 * Enforces:
 * 1. Finite numbers (rejects NaN, Infinity).
 * 2. Plausible physical bounds and units.
 * 3. Clock skew policy: rejects future timestamps > 10m ahead, rejects stale packets > 7d old.
 * 4. Non-clamping quality flags: out-of-range readings are stored faithfully and tagged with qualityStatus.
 * 5. Safe error responses that never disclose device or farm topology.
 */

import { z } from 'zod';

export const MAX_FUTURE_SKEW_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_PAST_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface QualityEvaluation {
  qualityStatus: 'clean' | 'suspicious_skew' | 'out_of_range' | 'uncalibrated';
  flags: string[];
}

export const telemetryPayloadSchema = z.object({
  eventId: z
    .string()
    .trim()
    .min(1, 'eventId cannot be empty')
    .max(64, 'eventId must not exceed 64 characters')
    .optional(),
  measuredAt: z
    .string()
    .min(1, 'measuredAt timestamp is required')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'measuredAt must be a valid ISO-8601 date string',
    }),
  soilMoistureRaw: z
    .number()
    .int('soilMoistureRaw must be an integer ADC reading')
    .finite('soilMoistureRaw must be a finite number')
    .min(0, 'soilMoistureRaw must be >= 0')
    .max(65535, 'soilMoistureRaw must be <= 65535')
    .optional(),
  soilMoisturePct: z
    .number()
    .finite('soilMoisturePct must be a finite number')
    .min(-50, 'soilMoisturePct physically impossible')
    .max(150, 'soilMoisturePct physically impossible')
    .optional(),
  depthCm: z
    .number()
    .int('depthCm must be an integer')
    .finite()
    .min(1, 'depthCm must be >= 1')
    .max(200, 'depthCm must be <= 200')
    .optional()
    .default(15),
  airTempC: z
    .number()
    .finite('airTempC must be a finite number')
    .min(-50, 'airTempC physically impossible below -50C')
    .max(85, 'airTempC physically impossible above 85C')
    .optional(),
  airHumidityPct: z
    .number()
    .finite('airHumidityPct must be a finite number')
    .min(-10, 'airHumidityPct physically impossible below -10%')
    .max(110, 'airHumidityPct physically impossible above 110%')
    .optional(),
  lightLux: z
    .number()
    .finite('lightLux must be a finite number')
    .min(0, 'lightLux cannot be negative')
    .max(200000, 'lightLux cannot exceed 200,000 lux')
    .optional(),
  batteryVoltage: z
    .number()
    .finite('batteryVoltage must be a finite number')
    .min(0.0, 'batteryVoltage cannot be negative')
    .max(24.0, 'batteryVoltage exceeds maximum allowable range')
    .optional(),
  batteryPct: z
    .number()
    .finite('batteryPct must be a finite number')
    .min(0, 'batteryPct must be >= 0')
    .max(100, 'batteryPct must be <= 100')
    .optional(),
  waterLevelSwitch: z.boolean().optional(),
});

export type TelemetryPayload = z.infer<typeof telemetryPayloadSchema>;

/**
 * Validates timestamp sanity and evaluates clock skew against server clock.
 */
export function validateTimestampSkew(measuredAtIso: string, serverTime = new Date()): {
  valid: boolean;
  skewMs: number;
  reason?: string;
  isSuspiciousSkew?: boolean;
} {
  const measuredTime = new Date(measuredAtIso).getTime();
  const now = serverTime.getTime();
  const skewMs = measuredTime - now;

  // 1. Future timestamp check
  if (skewMs > MAX_FUTURE_SKEW_MS) {
    return {
      valid: false,
      skewMs,
      reason: `measuredAt is ${Math.round(skewMs / 1000)}s in the future. Maximum permitted clock skew is 10 minutes. Synchronize hardware clock via NTP.`,
    };
  }

  // 2. Stale timestamp check
  if (now - measuredTime > MAX_PAST_AGE_MS) {
    const daysOld = Math.round((now - measuredTime) / (24 * 3600 * 1000));
    return {
      valid: false,
      skewMs,
      reason: `measuredAt is ${daysOld} days old. Telemetry ingestion allows up to 7 days for offline store-and-forward.`,
    };
  }

  // 3. Permitted but suspicious skew (between 3m and 10m future, or between 3d and 7d past)
  const isSuspiciousSkew = skewMs > 3 * 60 * 1000 || now - measuredTime > 3 * 24 * 60 * 60 * 1000;

  return {
    valid: true,
    skewMs,
    isSuspiciousSkew,
  };
}

/**
 * Assesses data quality without clamping raw values.
 */
export function evaluateTelemetryQuality(payload: TelemetryPayload, isSuspiciousSkew = false): QualityEvaluation {
  const flags: string[] = [];
  let status: QualityEvaluation['qualityStatus'] = 'clean';

  if (isSuspiciousSkew) {
    flags.push('timestamp_clock_skew');
    status = 'suspicious_skew';
  }

  // Check moisture percentage range (nominal agronomic range: 0.0 - 100.0%)
  if (payload.soilMoisturePct !== undefined) {
    if (payload.soilMoisturePct < 0.0) {
      flags.push('soil_moisture_negative');
      status = 'out_of_range';
    } else if (payload.soilMoisturePct > 100.0) {
      flags.push('soil_moisture_oversaturated');
      status = 'out_of_range';
    }
  } else if (payload.soilMoistureRaw !== undefined) {
    flags.push('raw_uncalibrated');
    if (status === 'clean') status = 'uncalibrated';
  }

  // Check humidity range
  if (payload.airHumidityPct !== undefined) {
    if (payload.airHumidityPct < 0.0 || payload.airHumidityPct > 100.0) {
      flags.push('humidity_out_of_range');
      status = 'out_of_range';
    }
  }

  // Check temperature bounds for Indian agro-climates (-5C to 55C)
  if (payload.airTempC !== undefined) {
    if (payload.airTempC < -5 || payload.airTempC > 55) {
      flags.push('temperature_extreme');
      if (status === 'clean') status = 'suspicious_skew';
    }
  }

  // Check battery voltage bounds (Li-ion nominal 3.0V - 4.25V)
  if (payload.batteryVoltage !== undefined) {
    if (payload.batteryVoltage < 2.5) {
      flags.push('battery_critical_low');
    }
  }

  return {
    qualityStatus: status,
    flags,
  };
}
