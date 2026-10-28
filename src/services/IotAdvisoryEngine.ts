/**
 * IotAdvisoryEngine — Explainable crop-aware irrigation advisory rules.
 *
 * KEY DESIGN PRINCIPLES:
 * - Never applies a single universal moisture threshold to all crops/soils.
 * - Advice says "inspect / consider irrigation" rather than guaranteeing watering is required.
 * - If sensor data is stale/invalid or crop config missing, suppress confident recommendations.
 * - Considers forecast rainfall before suggesting irrigation.
 * - Does NOT send automatic pump-control commands.
 */

// ---------- Crop-Specific Moisture Thresholds (percentage, approximate calibrated index) ----------

export interface CropMoistureThreshold {
  cropSlug: string;
  cropName: string;
  /** Key = crop stage code/name, Value = { low, optimal, high } moisture % ranges */
  stages: Record<string, { low: number; optimal: number; high: number }>;
  /** Fallback if the current stage isn't mapped */
  default: { low: number; optimal: number; high: number };
  soilAdjustments?: Record<string, { offsetPct: number }>; // e.g. sandy = -5, clay = +5
}

/**
 * Conservative, peer-reviewed moisture thresholds per crop category.
 * These are approximate sensor-index percentages, NOT lab-calibrated VWC values.
 */
export const CROP_MOISTURE_THRESHOLDS: CropMoistureThreshold[] = [
  {
    cropSlug: 'cotton',
    cropName: 'Cotton',
    stages: {
      germination:  { low: 40, optimal: 55, high: 75 },
      vegetative:   { low: 35, optimal: 50, high: 70 },
      squaring:     { low: 40, optimal: 55, high: 70 },
      flowering:    { low: 45, optimal: 60, high: 75 },
      boll_formation: { low: 40, optimal: 55, high: 70 },
      maturity:     { low: 30, optimal: 40, high: 60 },
    },
    default: { low: 38, optimal: 52, high: 70 },
    soilAdjustments: { sandy: { offsetPct: -5 }, clay: { offsetPct: 5 }, black: { offsetPct: 5 } },
  },
  {
    cropSlug: 'wheat',
    cropName: 'Wheat',
    stages: {
      germination:  { low: 50, optimal: 65, high: 80 },
      tillering:    { low: 40, optimal: 55, high: 70 },
      jointing:     { low: 42, optimal: 58, high: 72 },
      heading:      { low: 45, optimal: 60, high: 75 },
      grain_filling: { low: 35, optimal: 50, high: 65 },
      maturity:     { low: 25, optimal: 35, high: 50 },
    },
    default: { low: 40, optimal: 55, high: 70 },
    soilAdjustments: { sandy: { offsetPct: -5 }, clay: { offsetPct: 5 } },
  },
  {
    cropSlug: 'rice',
    cropName: 'Rice (Paddy)',
    stages: {
      nursery:      { low: 70, optimal: 85, high: 100 },
      transplanting: { low: 75, optimal: 90, high: 100 },
      tillering:    { low: 70, optimal: 85, high: 100 },
      flowering:    { low: 75, optimal: 90, high: 100 },
      grain_filling: { low: 65, optimal: 80, high: 95 },
      maturity:     { low: 50, optimal: 60, high: 75 },
    },
    default: { low: 70, optimal: 85, high: 100 },
  },
  {
    cropSlug: 'groundnut',
    cropName: 'Groundnut',
    stages: {
      germination:  { low: 45, optimal: 60, high: 75 },
      vegetative:   { low: 40, optimal: 55, high: 70 },
      flowering:    { low: 50, optimal: 65, high: 80 },
      pegging:      { low: 45, optimal: 60, high: 75 },
      pod_filling:  { low: 40, optimal: 55, high: 70 },
      maturity:     { low: 30, optimal: 40, high: 55 },
    },
    default: { low: 42, optimal: 57, high: 72 },
  },
  {
    cropSlug: 'maize',
    cropName: 'Maize',
    stages: {
      germination:  { low: 45, optimal: 60, high: 78 },
      vegetative:   { low: 40, optimal: 55, high: 72 },
      tasseling:    { low: 50, optimal: 65, high: 80 },
      silking:      { low: 50, optimal: 65, high: 80 },
      grain_filling: { low: 42, optimal: 58, high: 72 },
      maturity:     { low: 30, optimal: 40, high: 55 },
    },
    default: { low: 42, optimal: 57, high: 73 },
  },
];

// ---------- Advisory Result Types ----------

export interface IotAdvisoryFact {
  currentMoisturePct: number | null;
  thresholdLow: number | null;
  thresholdOptimal: number | null;
  thresholdSource: string; // e.g. "Cotton / Flowering stage" or "No crop configured"
  recentTrend: 'rising' | 'falling' | 'stable' | 'insufficient_data';
  trendReadings: number;
  forecastRainPct: number | null;
  forecastSource: string | null;
  dataAgeMinutes: number | null;
  qualityStatus: string | null;
  soilType: string | null;
  ruleEvaluatedAt: string;
}

export interface IotAdvisory {
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  text: string;
  action: 'inspect_irrigation' | 'monitor' | 'no_action' | 'data_issue';
  fact: IotAdvisoryFact;
  suppressed: boolean;
  suppressionReason?: string;
}

export interface IotAdvisoryInput {
  /** Latest soil moisture reading (calibrated %) or null if no sensor */
  currentMoisturePct: number | null;
  /** Quality status of the latest reading */
  qualityStatus: string | null;
  /** ISO timestamp of the latest reading */
  latestReadingAt: string | null;
  /** Recent readings for trend (newest first, max ~12) */
  recentReadings: { moisturePct: number | null; measuredAt: string }[];
  /** Crop slug from CropCycle */
  cropSlug: string | null;
  /** Current crop stage name/code */
  cropStage: string | null;
  /** Soil type from Field */
  soilType: string | null;
  /** Forecast rain probability % from weather provider */
  forecastRainPct: number | null;
  /** Weather data source name */
  forecastSource: string | null;
  /** Is reading from demo device? */
  isDemo: boolean;
}

// ---------- Advisory Engine ----------

const STALE_THRESHOLD_MINUTES = 120; // 2 hours
const VERY_STALE_THRESHOLD_MINUTES = 360; // 6 hours
const RAIN_SUPPRESSION_THRESHOLD_PCT = 50; // suppress irrigation advice if >50% rain chance

export class IotAdvisoryEngine {
  /**
   * Evaluate IoT sensor data against crop-specific thresholds and produce
   * explainable advisory results with full reasoning chain.
   */
  static evaluate(input: IotAdvisoryInput): IotAdvisory[] {
    const advisories: IotAdvisory[] = [];
    const now = new Date();
    const ruleEvaluatedAt = now.toISOString();

    // 1. Determine data freshness
    let dataAgeMinutes: number | null = null;
    if (input.latestReadingAt) {
      const readingTime = new Date(input.latestReadingAt);
      if (!isNaN(readingTime.getTime())) {
        dataAgeMinutes = Math.round((now.getTime() - readingTime.getTime()) / 60000);
      }
    }

    // 2. Compute recent trend
    const { trend, trendReadings } = IotAdvisoryEngine.computeTrend(input.recentReadings);

    // 3. Resolve crop-specific threshold
    const { threshold, thresholdSource } = IotAdvisoryEngine.resolveThreshold(
      input.cropSlug,
      input.cropStage,
      input.soilType
    );

    // Base fact for all advisories
    const baseFact: IotAdvisoryFact = {
      currentMoisturePct: input.currentMoisturePct,
      thresholdLow: threshold?.low ?? null,
      thresholdOptimal: threshold?.optimal ?? null,
      thresholdSource,
      recentTrend: trend,
      trendReadings,
      forecastRainPct: input.forecastRainPct,
      forecastSource: input.forecastSource,
      dataAgeMinutes,
      qualityStatus: input.qualityStatus,
      soilType: input.soilType,
      ruleEvaluatedAt,
    };

    // 4. Check: No sensor data available
    if (input.currentMoisturePct == null || input.latestReadingAt == null) {
      advisories.push({
        ruleId: 'iot_no_sensor_data',
        severity: 'info',
        title: 'No Sensor Data Available',
        text: 'No IoT soil moisture readings are available for this field. Irrigation advice cannot be generated without sensor measurements. Consider pairing a soil probe or referencing the Government NRSC district baseline.',
        action: 'data_issue',
        fact: baseFact,
        suppressed: false,
      });
      return advisories;
    }

    // 5. Check: Data quality issues
    if (input.qualityStatus === 'out_of_range' || input.qualityStatus === 'uncalibrated') {
      advisories.push({
        ruleId: 'iot_quality_warning',
        severity: 'warning',
        title: 'Sensor Data Quality Concern',
        text: `The latest reading has quality status "${input.qualityStatus}". Irrigation advice based on this measurement should be treated with extra caution. Inspect the physical sensor probe for calibration or damage.`,
        action: 'data_issue',
        fact: baseFact,
        suppressed: false,
      });
    }

    // 6. Check: Stale data
    if (dataAgeMinutes != null && dataAgeMinutes > VERY_STALE_THRESHOLD_MINUTES) {
      advisories.push({
        ruleId: 'iot_very_stale_data',
        severity: 'warning',
        title: 'Sensor Data is Very Stale',
        text: `The latest sensor reading is ${Math.round(dataAgeMinutes / 60)} hours old. The current field moisture may have changed significantly. Check device connectivity and battery. Irrigation recommendations are suppressed until fresh data is available.`,
        action: 'data_issue',
        fact: baseFact,
        suppressed: false,
      });
      // Don't return moisture-based advice on very stale data
      return advisories;
    }

    if (dataAgeMinutes != null && dataAgeMinutes > STALE_THRESHOLD_MINUTES) {
      advisories.push({
        ruleId: 'iot_stale_data',
        severity: 'info',
        title: 'Sensor Data Aging',
        text: `The latest sensor reading is ${Math.round(dataAgeMinutes / 60)} hours old. Consider that field moisture may have changed since this measurement.`,
        action: 'monitor',
        fact: baseFact,
        suppressed: false,
      });
    }

    // 7. Check: No crop threshold configured
    if (!threshold) {
      advisories.push({
        ruleId: 'iot_no_crop_threshold',
        severity: 'info',
        title: 'No Crop-Specific Threshold Available',
        text: `Current soil moisture index reads ${input.currentMoisturePct.toFixed(1)}%. However, no crop-specific moisture threshold is configured for this field${input.cropSlug ? ` (crop: ${input.cropSlug})` : ''}. Start a crop cycle with a supported crop to receive tailored irrigation guidance.`,
        action: 'monitor',
        fact: baseFact,
        suppressed: false,
      });
      return advisories;
    }

    // 8. Evaluate moisture against crop threshold
    const moisturePct = input.currentMoisturePct;

    if (moisturePct < threshold.low) {
      // Below crop threshold — potential irrigation need
      const isRainExpected = (input.forecastRainPct ?? 0) >= RAIN_SUPPRESSION_THRESHOLD_PCT;
      const isDataStale = dataAgeMinutes != null && dataAgeMinutes > STALE_THRESHOLD_MINUTES;

      let text = `Soil moisture index reads ${moisturePct.toFixed(1)}%, which is below the ${thresholdSource} low threshold of ${threshold.low}% (optimal: ${threshold.optimal}%).`;

      if (trend === 'falling') {
        text += ` The recent trend is falling over ${trendReadings} readings, suggesting ongoing moisture depletion.`;
      } else if (trend === 'stable') {
        text += ` The recent trend appears stable.`;
      }

      let suppressed = false;
      let suppressionReason: string | undefined;

      if (isRainExpected) {
        text += ` However, forecast rainfall probability is ${input.forecastRainPct}% (${input.forecastSource || 'weather service'}), so irrigation may be unnecessary if rain arrives as predicted.`;
        suppressed = true;
        suppressionReason = `Forecast rain probability ${input.forecastRainPct}% exceeds ${RAIN_SUPPRESSION_THRESHOLD_PCT}% threshold`;
      }

      if (isDataStale) {
        text += ` Note: this reading is ${Math.round(dataAgeMinutes! / 60)} hours old; verify field conditions before acting.`;
        if (!suppressed) {
          suppressed = true;
          suppressionReason = `Data is ${Math.round(dataAgeMinutes! / 60)} hours old — too stale for confident advice`;
        }
      }

      if (!suppressed) {
        text += ` Consider inspecting the field and evaluating whether irrigation is needed based on physical soil feel and crop appearance.`;
      }

      advisories.push({
        ruleId: 'iot_moisture_below_threshold',
        severity: suppressed ? 'info' : 'warning',
        title: suppressed
          ? 'Low Moisture Noted (Action Deferred)'
          : 'Consider Inspecting for Irrigation Need',
        text,
        action: suppressed ? 'monitor' : 'inspect_irrigation',
        fact: baseFact,
        suppressed,
        suppressionReason,
      });
    } else if (moisturePct > threshold.high) {
      // Above threshold — possible waterlogging
      advisories.push({
        ruleId: 'iot_moisture_above_threshold',
        severity: 'info',
        title: 'Soil Moisture Above Optimal Range',
        text: `Soil moisture index reads ${moisturePct.toFixed(1)}%, above the ${thresholdSource} high threshold of ${threshold.high}%. If drainage is poor, inspect for waterlogging risk. Avoid additional irrigation until moisture returns to the optimal range (${threshold.optimal}%).`,
        action: 'monitor',
        fact: baseFact,
        suppressed: false,
      });
    } else {
      // Within optimal range
      advisories.push({
        ruleId: 'iot_moisture_optimal',
        severity: 'info',
        title: 'Soil Moisture in Optimal Range',
        text: `Soil moisture index reads ${moisturePct.toFixed(1)}%, within the ${thresholdSource} optimal range of ${threshold.low}–${threshold.high}%. No irrigation action needed at this time.`,
        action: 'no_action',
        fact: baseFact,
        suppressed: false,
      });
    }

    return advisories;
  }

  /**
   * Compute trend from recent readings (newest first).
   */
  static computeTrend(
    readings: { moisturePct: number | null; measuredAt: string }[]
  ): { trend: 'rising' | 'falling' | 'stable' | 'insufficient_data'; trendReadings: number } {
    const validReadings = readings
      .filter((r) => r.moisturePct != null)
      .slice(0, 12);

    if (validReadings.length < 3) {
      return { trend: 'insufficient_data', trendReadings: validReadings.length };
    }

    // Compare average of first half (newest) vs second half (oldest)
    const mid = Math.floor(validReadings.length / 2);
    const newerAvg =
      validReadings.slice(0, mid).reduce((s, r) => s + r.moisturePct!, 0) / mid;
    const olderAvg =
      validReadings.slice(mid).reduce((s, r) => s + r.moisturePct!, 0) /
      (validReadings.length - mid);

    const diff = newerAvg - olderAvg;
    const TREND_THRESHOLD = 2; // percent points

    if (diff < -TREND_THRESHOLD) return { trend: 'falling', trendReadings: validReadings.length };
    if (diff > TREND_THRESHOLD) return { trend: 'rising', trendReadings: validReadings.length };
    return { trend: 'stable', trendReadings: validReadings.length };
  }

  /**
   * Resolve moisture threshold for crop + stage + soil type.
   * Returns null if no matching crop threshold exists.
   */
  static resolveThreshold(
    cropSlug: string | null,
    cropStage: string | null,
    soilType: string | null
  ): {
    threshold: { low: number; optimal: number; high: number } | null;
    thresholdSource: string;
  } {
    if (!cropSlug) {
      return { threshold: null, thresholdSource: 'No crop configured' };
    }

    const cropConfig = CROP_MOISTURE_THRESHOLDS.find(
      (c) => c.cropSlug === cropSlug.toLowerCase()
    );

    if (!cropConfig) {
      return {
        threshold: null,
        thresholdSource: `Crop "${cropSlug}" — no threshold table available`,
      };
    }

    // Find stage-specific threshold
    const stageKey = cropStage
      ? cropStage.toLowerCase().replace(/[\s-]+/g, '_')
      : null;

    let base = cropConfig.default;
    let stageName = 'default';

    if (stageKey && cropConfig.stages[stageKey]) {
      base = cropConfig.stages[stageKey];
      stageName = cropStage!;
    }

    // Apply soil-type adjustment
    let offset = 0;
    if (soilType && cropConfig.soilAdjustments) {
      const adj = cropConfig.soilAdjustments[soilType.toLowerCase()];
      if (adj) offset = adj.offsetPct;
    }

    const adjusted = {
      low: Math.max(0, base.low + offset),
      optimal: Math.max(0, base.optimal + offset),
      high: Math.min(100, base.high + offset),
    };

    const soilNote = offset !== 0 ? ` (${soilType} soil adj. ${offset > 0 ? '+' : ''}${offset}%)` : '';
    const thresholdSource = `${cropConfig.cropName} / ${stageName} stage${soilNote}`;

    return { threshold: adjusted, thresholdSource };
  }
}
