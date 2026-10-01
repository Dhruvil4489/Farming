import { WeatherDataNormalized } from '@/providers/weather/WeatherProvider';

export interface AdvisoryResult {
  fact: {
    rainProbabilityPct: number;
    temperatureC: number;
    windSpeedKmh: number;
    source: string;
    fetchedAt: string;
  };
  advice: {
    ruleId: string;
    title: string;
    text: string;
    type: 'warning' | 'recommendation' | 'info';
  };
  related?: {
    fieldId?: string;
    taskId?: string;
  };
}

export class AdvisoryEngine {
  static evaluate(weather: WeatherDataNormalized, taskType?: string): AdvisoryResult[] {
    const results: AdvisoryResult[] = [];

    // Rule 1: High rain probability + spraying/irrigation due
    if (weather.rainProbabilityPct >= 50) {
      results.push({
        fact: {
          rainProbabilityPct: weather.rainProbabilityPct,
          temperatureC: weather.temperatureC,
          windSpeedKmh: weather.windSpeedKmh,
          source: weather.source,
          fetchedAt: weather.fetchedAt,
        },
        advice: {
          ruleId: 'rule_rain_delay_spray',
          title: 'Review Spraying & Irrigation Plan',
          text: `Rain probability is high (${weather.rainProbabilityPct}%). Consider postponing chemical spraying or irrigation to prevent chemical wash-off and waterlogging.`,
          type: 'warning',
        },
      });
    }

    // Rule 2: High wind speed + spraying
    if (weather.windSpeedKmh >= 20) {
      results.push({
        fact: {
          rainProbabilityPct: weather.rainProbabilityPct,
          temperatureC: weather.temperatureC,
          windSpeedKmh: weather.windSpeedKmh,
          source: weather.source,
          fetchedAt: weather.fetchedAt,
        },
        advice: {
          ruleId: 'rule_high_wind_spray',
          title: 'High Wind Warning for Spraying',
          text: `Wind speed is elevated (${weather.windSpeedKmh} km/h). Avoid pesticide spraying to prevent chemical spray drift onto neighboring fields.`,
          type: 'warning',
        },
      });
    }

    // Rule 3: High temperature + irrigation
    if (weather.temperatureC >= 36) {
      results.push({
        fact: {
          rainProbabilityPct: weather.rainProbabilityPct,
          temperatureC: weather.temperatureC,
          windSpeedKmh: weather.windSpeedKmh,
          source: weather.source,
          fetchedAt: weather.fetchedAt,
        },
        advice: {
          ruleId: 'rule_heat_irrigation',
          title: 'High Heat Advisory',
          text: `Temperatures are expected to reach ${weather.temperatureC}°C. Irrigate early in the morning or late evening to minimize evaporative water loss.`,
          type: 'recommendation',
        },
      });
    }

    return results;
  }
}
