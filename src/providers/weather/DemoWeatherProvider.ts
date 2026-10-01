import { IWeatherProvider, WeatherDataNormalized, WeatherForecastItem } from './WeatherProvider';

export class DemoWeatherProvider implements IWeatherProvider {
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherDataNormalized> {
    return {
      temperatureC: 29.5,
      humidityPct: 62,
      windSpeedKmh: 14.2,
      rainProbabilityPct: 35,
      precipitationMm: 0.0,
      condition: 'Partly Cloudy',
      conditionIcon: 'cloud-sun',
      source: 'Demo Weather Provider',
      fetchedAt: new Date().toISOString(),
      isDemo: true,
    };
  }

  async getForecast(lat: number, lng: number, days = 7): Promise<WeatherForecastItem[]> {
    const today = new Date();
    const forecast: WeatherForecastItem[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      forecast.push({
        date: d.toISOString().split('T')[0],
        tempMaxC: 31 + (i % 3),
        tempMinC: 22 + (i % 2),
        rainProbabilityPct: (i * 15) % 80,
        condition: i % 2 === 0 ? 'Partly Cloudy' : 'Sunny',
      });
    }

    return forecast;
  }
}
