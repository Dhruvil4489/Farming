/**
 * SmartFarm AI — Indian Agricultural Locations Directory & Open-Meteo Geocoding Helper
 * Used for Weather Location Exploration (without mutating farmer's registered farm location).
 */

export interface ResolvedLocation {
  name: string;
  district?: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  pincode?: string;
  source: 'open_meteo_geocoding' | 'india_directory';
}

export const INDIA_AGRI_LOCATIONS: ResolvedLocation[] = [
  // Gujarat
  { name: 'Vadodara', district: 'Vadodara', state: 'Gujarat', country: 'India', lat: 22.3072, lng: 73.1812, pincode: '390001', source: 'india_directory' },
  { name: 'Padra', district: 'Vadodara', state: 'Gujarat', country: 'India', lat: 22.2405, lng: 73.0848, pincode: '391440', source: 'india_directory' },
  { name: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lng: 72.5714, pincode: '380001', source: 'india_directory' },
  { name: 'Rajkot', district: 'Rajkot', state: 'Gujarat', country: 'India', lat: 22.3039, lng: 70.8022, pincode: '360001', source: 'india_directory' },
  { name: 'Gondal', district: 'Rajkot', state: 'Gujarat', country: 'India', lat: 21.9619, lng: 70.7923, pincode: '360311', source: 'india_directory' },
  { name: 'Surat', district: 'Surat', state: 'Gujarat', country: 'India', lat: 21.1702, lng: 72.8311, pincode: '395003', source: 'india_directory' },
  { name: 'Anand', district: 'Anand', state: 'Gujarat', country: 'India', lat: 22.5645, lng: 72.9289, pincode: '388001', source: 'india_directory' },
  { name: 'Unjha', district: 'Mehsana', state: 'Gujarat', country: 'India', lat: 23.8037, lng: 72.3911, pincode: '384170', source: 'india_directory' },
  { name: 'Mehsana', district: 'Mehsana', state: 'Gujarat', country: 'India', lat: 23.5880, lng: 72.3693, pincode: '384001', source: 'india_directory' },
  { name: 'Junagadh', district: 'Junagadh', state: 'Gujarat', country: 'India', lat: 21.5222, lng: 70.4579, pincode: '362001', source: 'india_directory' },
  { name: 'Bhavnagar', district: 'Bhavnagar', state: 'Gujarat', country: 'India', lat: 21.7645, lng: 72.1519, pincode: '364001', source: 'india_directory' },
  { name: 'Mahuva', district: 'Bhavnagar', state: 'Gujarat', country: 'India', lat: 21.0922, lng: 71.7705, pincode: '364290', source: 'india_directory' },
  { name: 'Amreli', district: 'Amreli', state: 'Gujarat', country: 'India', lat: 21.6032, lng: 71.2221, pincode: '365601', source: 'india_directory' },
  { name: 'Jamnagar', district: 'Jamnagar', state: 'Gujarat', country: 'India', lat: 22.4707, lng: 70.0577, pincode: '361001', source: 'india_directory' },
  { name: 'Bharuch', district: 'Bharuch', state: 'Gujarat', country: 'India', lat: 21.7051, lng: 72.9959, pincode: '392001', source: 'india_directory' },
  { name: 'Deesa', district: 'Banaskantha', state: 'Gujarat', country: 'India', lat: 24.2585, lng: 72.1907, pincode: '385535', source: 'india_directory' },
  { name: 'Bhuj', district: 'Kutch', state: 'Gujarat', country: 'India', lat: 23.2420, lng: 69.6669, pincode: '370001', source: 'india_directory' },
  { name: 'Navsari', district: 'Navsari', state: 'Gujarat', country: 'India', lat: 20.9467, lng: 72.9520, pincode: '396445', source: 'india_directory' },
  { name: 'Dahod', district: 'Dahod', state: 'Gujarat', country: 'India', lat: 22.8371, lng: 74.2531, pincode: '389151', source: 'india_directory' },
  // Maharashtra
  { name: 'Nashik', district: 'Nashik', state: 'Maharashtra', country: 'India', lat: 19.9975, lng: 73.7898, pincode: '422001', source: 'india_directory' },
  { name: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lng: 73.8567, pincode: '411001', source: 'india_directory' },
  { name: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India', lat: 21.1458, lng: 79.0882, pincode: '440001', source: 'india_directory' },
  { name: 'Solapur', district: 'Solapur', state: 'Maharashtra', country: 'India', lat: 17.6599, lng: 75.9064, pincode: '413001', source: 'india_directory' },
  { name: 'Jalgaon', district: 'Jalgaon', state: 'Maharashtra', country: 'India', lat: 21.0077, lng: 75.5626, pincode: '425001', source: 'india_directory' },
  // Madhya Pradesh & Rajasthan
  { name: 'Indore', district: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7196, lng: 75.8577, pincode: '452001', source: 'india_directory' },
  { name: 'Bhopal', district: 'Bhopal', state: 'Madhya Pradesh', country: 'India', lat: 23.2599, lng: 77.4126, pincode: '462001', source: 'india_directory' },
  { name: 'Ujjain', district: 'Ujjain', state: 'Madhya Pradesh', country: 'India', lat: 23.1765, lng: 75.7885, pincode: '456001', source: 'india_directory' },
  { name: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lng: 75.7873, pincode: '302001', source: 'india_directory' },
  { name: 'Jodhpur', district: 'Jodhpur', state: 'Rajasthan', country: 'India', lat: 26.2389, lng: 73.0243, pincode: '342001', source: 'india_directory' },
  { name: 'Kota', district: 'Kota', state: 'Rajasthan', country: 'India', lat: 25.2138, lng: 75.8648, pincode: '324001', source: 'india_directory' },
  // Punjab, Haryana, UP, Bihar
  { name: 'Ludhiana', district: 'Ludhiana', state: 'Punjab', country: 'India', lat: 30.9010, lng: 75.8573, pincode: '141001', source: 'india_directory' },
  { name: 'Amritsar', district: 'Amritsar', state: 'Punjab', country: 'India', lat: 31.6340, lng: 74.8723, pincode: '143001', source: 'india_directory' },
  { name: 'Karnal', district: 'Karnal', state: 'Haryana', country: 'India', lat: 29.6857, lng: 76.9905, pincode: '132001', source: 'india_directory' },
  { name: 'Hisar', district: 'Hisar', state: 'Haryana', country: 'India', lat: 29.1492, lng: 75.7217, pincode: '125001', source: 'india_directory' },
  { name: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lng: 80.9462, pincode: '226001', source: 'india_directory' },
  { name: 'Varanasi', district: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.3176, lng: 82.9739, pincode: '221001', source: 'india_directory' },
  { name: 'Patna', district: 'Patna', state: 'Bihar', country: 'India', lat: 25.5941, lng: 85.1376, pincode: '800001', source: 'india_directory' },
  // South & East India
  { name: 'Bengaluru', district: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946, pincode: '560001', source: 'india_directory' },
  { name: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lng: 78.4867, pincode: '500001', source: 'india_directory' },
  { name: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', country: 'India', lat: 16.3067, lng: 80.4365, pincode: '522001', source: 'india_directory' },
  { name: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu', country: 'India', lat: 11.0168, lng: 76.9558, pincode: '641001', source: 'india_directory' },
  { name: 'Cuttack', district: 'Cuttack', state: 'Odisha', country: 'India', lat: 20.4625, lng: 85.8830, pincode: '753001', source: 'india_directory' },
  { name: 'Kolkata', district: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lng: 88.3639, pincode: '700001', source: 'india_directory' },
];

export function matchLocalDirectory(query: string): ResolvedLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDIA_AGRI_LOCATIONS.slice(0, 8);
  return INDIA_AGRI_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      (loc.district || '').toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q) ||
      (loc.pincode && loc.pincode.startsWith(q))
  ).slice(0, 10);
}

/**
 * Searches Open-Meteo live geocoding (India-prioritized) with automatic fallback to curated Indian agricultural directory.
 */
export async function searchIndianLocations(query: string): Promise<ResolvedLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return INDIA_AGRI_LOCATIONS.slice(0, 8);

  const localMatches = matchLocalDirectory(trimmed);

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=8&language=en&format=json&countryCode=IN`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.results) && json.results.length > 0) {
        const liveResults: ResolvedLocation[] = json.results.map((r: any) => ({
          name: r.name,
          district: r.admin2 || r.name,
          state: r.admin1 || 'India',
          country: r.country || 'India',
          lat: r.latitude,
          lng: r.longitude,
          source: 'open_meteo_geocoding' as const,
        }));
        return liveResults;
      }
    }
  } catch {
    // Graceful fallback when offline or rate-limited
  }

  return localMatches;
}
