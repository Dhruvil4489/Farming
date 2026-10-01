export interface WeatherDataNormalized {
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  rainProbabilityPct: number;
  precipitationMm: number;
  condition: string;
  conditionIcon: string;
  source: string;
  fetchedAt: string;
  isDemo: boolean;
}

export interface WeatherForecastItem {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  rainProbabilityPct: number;
  condition: string;
}

export interface IWeatherProvider {
  getCurrentWeather(lat: number, lng: number): Promise<WeatherDataNormalized>;
  getForecast(lat: number, lng: number, days?: number): Promise<WeatherForecastItem[]>;
}
