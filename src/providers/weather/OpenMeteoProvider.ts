import { IWeatherProvider, WeatherDataNormalized, WeatherForecastItem } from './WeatherProvider';

export class OpenMeteoProvider implements IWeatherProvider {
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherDataNormalized> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability`;
      const res = await fetch(url, { next: { revalidate: 1800 } });
      if (!res.ok) throw new Error(`OpenMeteo HTTP ${res.status}`);

      const data = await res.json();
      const cw = data.current_weather || {};

      return {
        temperatureC: cw.temperature ?? 28,
        humidityPct: data.hourly?.relativehumidity_2m?.[0] ?? 60,
        windSpeedKmh: cw.windspeed ?? 12,
        rainProbabilityPct: data.hourly?.precipitation_probability?.[0] ?? 20,
        precipitationMm: 0,
        condition: cw.weathercode === 0 ? 'Clear Sky' : 'Partly Cloudy',
        conditionIcon: 'cloud',
        source: 'Open-Meteo API',
        fetchedAt: new Date().toISOString(),
        isDemo: false,
      };
    } catch (err) {
      console.warn('OpenMeteo fetch failed, returning fallback:', err);
      return {
        temperatureC: 28,
        humidityPct: 60,
        windSpeedKmh: 10,
        rainProbabilityPct: 15,
        precipitationMm: 0,
        condition: 'Clear (Fallback)',
        conditionIcon: 'sun',
        source: 'Open-Meteo (Cached Fallback)',
        fetchedAt: new Date().toISOString(),
        isDemo: false,
      };
    }
  }

  async getForecast(lat: number, lng: number, days = 7): Promise<WeatherForecastItem[]> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      const res = await fetch(url, { next: { revalidate: 1800 } });
      if (!res.ok) throw new Error(`OpenMeteo HTTP ${res.status}`);

      const data = await res.json();
      const daily = data.daily || {};
      const dates: string[] = daily.time || [];

      return dates.slice(0, days).map((date, idx) => ({
        date,
        tempMaxC: daily.temperature_2m_max?.[idx] ?? 30,
        tempMinC: daily.temperature_2m_min?.[idx] ?? 20,
        rainProbabilityPct: daily.precipitation_probability_max?.[idx] ?? 10,
        condition: 'Forecast',
      }));
    } catch (err) {
      return [];
    }
  }
}
