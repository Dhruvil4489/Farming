import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { OpenMeteoProvider } from '@/providers/weather/OpenMeteoProvider';
import { DemoWeatherProvider } from '@/providers/weather/DemoWeatherProvider';
import { matchLocalDirectory, searchIndianLocations } from '@/lib/india-locations';

function buildFarmingWeatherAlerts(current: any, forecast: any[]) {
  const alerts: Array<{ severity: 'high' | 'medium' | 'info'; title: string; message: string }> = [];

  if (current.rainProbabilityPct >= 50 || (current.precipitationMm || 0) >= 5) {
    alerts.push({
      severity: 'high',
      title: 'Rain Alert — Delay Spraying & Fertilizer Broadcasting',
      message: `Rain probability is ${current.rainProbabilityPct}%. Postpone pesticide/foliar spraying and urea broadcasting to prevent wash-off and nutrient leaching.`,
    });
  }

  if (current.windSpeedKmh >= 15) {
    alerts.push({
      severity: 'high',
      title: 'High Wind Speed — Unsafe for Chemical Spraying',
      message: `Current wind speed is ${current.windSpeedKmh} km/h (>15 km/h IMD threshold). Avoid spraying to prevent chemical drift and operator exposure.`,
    });
  }

  if (current.temperatureC >= 38) {
    alerts.push({
      severity: 'high',
      title: 'Heat Stress Warning (>38°C)',
      message: `High daytime temperature (${current.temperatureC}°C) increases flower/boll drop. Schedule light cooling irrigation in early morning or late evening.`,
    });
  }

  if (current.humidityPct >= 82) {
    alerts.push({
      severity: 'medium',
      title: 'High Humidity Fungal Disease Watch',
      message: `Relative humidity is ${current.humidityPct}%. Scout sensitive crops (tomato, potato, cumin, cotton) for early/late blight or mildew symptoms.`,
    });
  }

  const upcomingRainDay = forecast.slice(0, 2).find((d) => (d.rainProbabilityPct || 0) >= 60);
  if (upcomingRainDay) {
    alerts.push({
      severity: 'medium',
      title: `Rain Forecast on ${upcomingRainDay.date} (${upcomingRainDay.rainProbabilityPct}%)`,
      message: 'Plan irrigation and harvesting accordingly; keep harvested grain/produce covered with waterproof tarpaulin.',
    });
  }

  return alerts;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get('farm_id');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const labelParam = searchParams.get('location_label');
    const searchQ = searchParams.get('q');

    const parsedLat = latParam ? parseFloat(latParam) : NaN;
    const parsedLng = lngParam ? parseFloat(lngParam) : NaN;

    let lat = 22.3072;
    let lng = 73.1812;
    let locationLabel = 'Vadodara, Gujarat (Default Region)';
    let locationMode: 'registered_farm' | 'explore_temporary' = 'registered_farm';

    // Mode 1: Temporary Exploration by explicit lat/lng or query (NEVER mutates user/farm location)
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      lat = parsedLat;
      lng = parsedLng;
      locationLabel = labelParam?.trim() || `${parsedLat.toFixed(3)}, ${parsedLng.toFixed(3)}`;
      locationMode = 'explore_temporary';
    } else if (searchQ && searchQ.trim()) {
      const matches = await searchIndianLocations(searchQ.trim());
      if (matches.length === 0) {
        return apiError(`Could not find coordinates for "${searchQ}". Try a nearby district or city name.`, 'location_not_found', 404);
      }
      lat = matches[0].lat;
      lng = matches[0].lng;
      locationLabel = [matches[0].name, matches[0].state].filter(Boolean).join(', ');
      locationMode = 'explore_temporary';
    } else if (farmId) {
      if (!user) return apiError('Unauthorized farm lookup', 'unauthorized', 401);
      const farm = await prisma.farm.findFirst({
        where: { id: farmId, userId: user.id, deletedAt: null },
      });
      if (farm) {
        if (farm.lat && farm.lng) {
          lat = farm.lat;
          lng = farm.lng;
        } else if (farm.district || farm.village) {
          const hit = matchLocalDirectory(farm.district || farm.village || '')[0];
          if (hit) {
            lat = hit.lat;
            lng = hit.lng;
          }
        }
        locationLabel =
          [farm.village, farm.district, farm.state].filter(Boolean).join(', ') || farm.name;
      }
    } else if (user?.district || user?.village || user?.state) {
      const hit = matchLocalDirectory(user.district || user.village || user.state || '')[0];
      if (user.lat && user.lng) {
        lat = user.lat;
        lng = user.lng;
      } else if (hit) {
        lat = hit.lat;
        lng = hit.lng;
      }
      locationLabel = [user.village, user.district, user.state].filter(Boolean).join(', ');
    }

    // Prefer Open-Meteo real live weather unless explicitly locked to demo
    const providerType = (process.env.WEATHER_PROVIDER || 'open-meteo').toLowerCase();
    const provider =
      providerType === 'demo' ? new DemoWeatherProvider() : new OpenMeteoProvider();

    const [weather, forecast] = await Promise.all([
      provider.getCurrentWeather(lat, lng),
      provider.getForecast(lat, lng, 7),
    ]);

    const alerts = buildFarmingWeatherAlerts(weather, forecast);

    return apiSuccess({
      locationLabel,
      locationMode,
      coordinates: { lat, lng },
      current: weather,
      forecast,
      alerts,
      stationNote: weather.isDemo
        ? 'Offline/fallback weather estimate — live meteorological API unreachable.'
        : 'Coordinate-based Open-Meteo meteorological forecast aligned with IMD agromet advisory thresholds.',
    });
  } catch (err) {
    console.error('[GET /api/v1/weather] Error:', err);
    return apiError('Unable to load weather forecast right now.', 'weather_error', 500);
  }
}
