import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-envelope';
import { OpenMeteoProvider } from '@/providers/weather/OpenMeteoProvider';
import { DemoWeatherProvider } from '@/providers/weather/DemoWeatherProvider';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get('farm_id');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    const parsedLat = latParam ? parseFloat(latParam) : NaN;
    const parsedLng = lngParam ? parseFloat(lngParam) : NaN;

        let lat = !isNaN(parsedLat) ? parsedLat : 22.2405;
        let lng = !isNaN(parsedLng) ? parsedLng : 73.0848;
        let locationLabel = 'Gujarat Region';

        if (farmId) {
          if (!user) {
            return apiError('Unauthorized farm lookup', 'unauthorized', 401);
          }
          const farm = await prisma.farm.findFirst({
            where: { id: farmId, userId: user.id, deletedAt: null },
          });
          if (farm) {
            if (farm.lat && farm.lng) {
              lat = farm.lat;
              lng = farm.lng;
            }
            locationLabel = [farm.village, farm.district, farm.state].filter(Boolean).join(', ') || farm.name;
          }
        } else if (user?.district || user?.state) {
          locationLabel = [user.village, user.district, user.state].filter(Boolean).join(', ');
        }

      const providerType = process.env.WEATHER_PROVIDER || 'demo';
      const provider =
        providerType === 'open-meteo' ? new OpenMeteoProvider() : new DemoWeatherProvider();

      const weather = await provider.getCurrentWeather(lat, lng);
      const forecast = await provider.getForecast(lat, lng, 7);

      return apiSuccess({
        locationLabel,
        current: weather,
        forecast,
      });
    } catch (err) {
      console.error('[GET /api/v1/weather] Error:', err);
      return apiError('Unable to load weather forecast right now.', 'weather_error', 500);
    }
  }
