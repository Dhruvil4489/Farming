import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { OpenMeteoProvider } from '@/providers/weather/OpenMeteoProvider';
import { DemoWeatherProvider } from '@/providers/weather/DemoWeatherProvider';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  const { searchParams } = new URL(req.url);
  const farmId = searchParams.get('farm_id');
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');

  let lat = latParam ? parseFloat(latParam) : 22.2405;
  let lng = lngParam ? parseFloat(lngParam) : 73.0848;

  if (farmId) {
    if (!user) {
      return apiError('Unauthorized farm lookup', 'unauthorized', 401);
    }
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, userId: user.id },
    });
    if (farm && farm.lat && farm.lng) {
      lat = farm.lat;
      lng = farm.lng;
    }
  }

  const providerType = process.env.WEATHER_PROVIDER || 'demo';
  const provider = providerType === 'open-meteo' ? new OpenMeteoProvider() : new DemoWeatherProvider();

  const weather = await provider.getCurrentWeather(lat, lng);
  const forecast = await provider.getForecast(lat, lng, 7);

  return apiSuccess({
    current: weather,
    forecast,
  });
}
