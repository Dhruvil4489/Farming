import { z } from 'zod';
import { toHectares, hectaresToAcres, type AreaUnit } from './units';

export const AREA_UNITS = ['acre', 'hectare', 'bigha', 'guntha'] as const;
export type ValidAreaUnit = (typeof AREA_UNITS)[number];

export const AREA_MIN = 0.01;
export const AREA_MAX = 100000;
const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export interface AreaValidationResult {
  valid: boolean;
  value: number | null;
  error?: string;
}

/**
 * Validates a farmer-entered area value (string or number) without floating-point step traps.
 * Accepts whole numbers (e.g. 1, 5, 10, 25, 100) and decimals (e.g. 0.5, 1.25, 9.95, 10.05).
 * Never silently rounds the user-entered number.
 */
export function validateAreaInput(
  raw: string | number | null | undefined,
  options: { required?: boolean } = {}
): AreaValidationResult {
  if (raw === null || raw === undefined) {
    return options.required
      ? { valid: false, value: null, error: 'Please enter a land area greater than 0.' }
      : { valid: true, value: null };
  }

  const str = typeof raw === 'number' ? String(raw) : raw.trim();
  if (str === '') {
    return options.required
      ? { valid: false, value: null, error: 'Please enter a land area greater than 0.' }
      : { valid: true, value: null };
  }

  if (!DECIMAL_PATTERN.test(str)) {
    return {
      valid: false,
      value: null,
      error: 'Please enter a valid positive number (up to 4 decimal places), e.g. 10 or 2.5.',
    };
  }

  const num = Number(str);
  if (!Number.isFinite(num) || num < AREA_MIN) {
    return {
      valid: false,
      value: null,
      error: `Area must be at least ${AREA_MIN}.`,
    };
  }

  if (num > AREA_MAX) {
    return {
      valid: false,
      value: null,
      error: `Area cannot exceed ${AREA_MAX.toLocaleString('en-IN')}.`,
    };
  }

  return { valid: true, value: num };
}

/**
 * Shared Zod schema for backend areaInputValue validation (matches frontend exactly).
 */
export const areaInputValueSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((val, ctx): number | null | undefined => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (typeof val === 'string' && val.trim() === '') return null;
    const check = validateAreaInput(val);
    if (!check.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: check.error || 'Please enter a valid area value.',
      });
      return z.NEVER;
    }
    return check.value;
  });

export const areaInputUnitSchema = z.enum(AREA_UNITS).optional();

export function normalizeAreaUnit(unit?: string | null): ValidAreaUnit {
  if (unit && (AREA_UNITS as readonly string[]).includes(unit)) {
    return unit as ValidAreaUnit;
  }
  return 'acre';
}

export function areaUnitLabel(unit?: string | null): string {
  switch (unit) {
    case 'hectare':
      return 'Hectare';
    case 'bigha':
      return 'Bigha';
    case 'guntha':
      return 'Guntha';
    case 'acre':
    default:
      return 'Acre';
  }
}

/**
 * Formats a clean numeric string without unnecessary trailing zeros (e.g. 10 -> "10", 9.95 -> "9.95").
 */
export function formatCleanNumber(val: number): string {
  if (!Number.isFinite(val)) return '';
  return Number(val.toFixed(4)).toString();
}

/**
 * Displays the exact user-entered area & unit when available; falls back to areaHa conversion.
 */
export function formatExactArea(
  areaInputValue?: number | null,
  areaInputUnit?: string | null,
  areaHaFallback?: number | null
): string {
  if (areaInputValue != null && Number.isFinite(areaInputValue) && areaInputValue > 0) {
    return `${formatCleanNumber(areaInputValue)} ${areaUnitLabel(areaInputUnit)}`;
  }
  if (areaHaFallback != null && Number.isFinite(areaHaFallback) && areaHaFallback > 0) {
    return `${hectaresToAcres(areaHaFallback)} Acre`;
  }
  return 'Not set';
}

export function computeAreaHectares(
  areaInputValue: number | null | undefined,
  areaInputUnit: string | null | undefined
): number | null {
  if (areaInputValue == null || !Number.isFinite(areaInputValue) || areaInputValue <= 0) {
    return null;
  }
  const unit = normalizeAreaUnit(areaInputUnit) as AreaUnit;
  return toHectares(areaInputValue, unit);
}
