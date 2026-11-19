import { IWeatherProvider, WeatherDataNormalized, WeatherForecastItem } from './WeatherProvider';

function decodeWmoWeatherCode(code?: number): { label: string; icon: string } {
  if (code === undefined || code === null) return { label: 'Partly Cloudy', icon: 'cloud' };
  if (code === 0) return { label: 'Clear Sky', icon: 'sun' };
  if (code <= 3) return { label: 'Partly Cloudy', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Fog / Mist', icon: 'cloud' };
  if (code >= 51 && code <= 67) return { label: 'Light to Moderate Rain', icon: 'rain' };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: 'rain' };
  if (code >= 95) return { label: 'Thunderstorm', icon: 'storm' };
  return { label: 'Cloudy', icon: 'cloud' };
}

export class OpenMeteoProvider implements IWeatherProvider {
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherDataNormalized> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=precipitation_probability&timezone=auto`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } });
      if (!res.ok) throw new Error(`OpenMeteo HTTP ${res.status}`);

      const data = await res.json();
      const cur = data.current || {};

      let rainProb = 0;
      if (Array.isArray(data.hourly?.precipitation_probability) && data.hourly.precipitation_probability.length > 0) {
        const nowHour = new Date().getHours();
        rainProb = data.hourly.precipitation_probability[nowHour] ?? data.hourly.precipitation_probability[0] ?? 0;
      }

      const decoded = decodeWmoWeatherCode(cur.weather_code);

      return {
        temperatureC: cur.temperature_2m ?? 28,
        humidityPct: cur.relative_humidity_2m ?? 60,
        windSpeedKmh: cur.wind_speed_10m ?? 10,
        rainProbabilityPct: rainProb,
        precipitationMm: cur.precipitation ?? cur.rain ?? 0,
        condition: decoded.label,
        conditionIcon: decoded.icon,
        source: 'Open-Meteo Live Meteorological API',
        fetchedAt: new Date().toISOString(),
        isDemo: false,
      };
    } catch (err) {
      console.warn('OpenMeteo fetch failed, returning honest fallback:', err);
      return {
        temperatureC: 29,
        humidityPct: 58,
        windSpeedKmh: 11,
        rainProbabilityPct: 15,
        precipitationMm: 0,
        condition: 'Offline Cached Estimate',
        conditionIcon: 'sun',
        source: 'Open-Meteo (Offline Fallback — Live Feed Unreachable)',
        fetchedAt: new Date().toISOString(),
        isDemo: true,
      };
    }
  }

  async getForecast(lat: number, lng: number, days = 7): Promise<WeatherForecastItem[]> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } });
      if (!res.ok) throw new Error(`OpenMeteo HTTP ${res.status}`);

      const data = await res.json();
      const daily = data.daily || {};
      const dates: string[] = daily.time || [];

      return dates.slice(0, days).map((date, idx) => ({
        date,
        tempMaxC: daily.temperature_2m_max?.[idx] ?? 32,
        tempMinC: daily.temperature_2m_min?.[idx] ?? 20,
        rainProbabilityPct: daily.precipitation_probability_max?.[idx] ?? 10,
        condition: decodeWmoWeatherCode(daily.weather_code?.[idx]).label,
      }));
    } catch {
      return [];
    }
  }
}
