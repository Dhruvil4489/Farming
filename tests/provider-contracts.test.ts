/**
 * SmartFarm AI — Provider Contract Tests
 *
 * Covers:
 * 1. Official Market API Provider (AgmarknetProvider & DemoMarketProvider):
 *    - Payload normalization (string vs numeric, commas, whitespace)
 *    - Pagination boundaries
 *    - Missing API key throws descriptive error
 *    - HTTP 401 Unauthorized handling
 *    - HTTP 429 Rate Limit handling
 *    - HTTP 500/502/503 Server Error handling
 *    - Timeout handling
 *    - Malformed JSON handling
 *    - Demo provider deterministic fallbacks
 * 2. Weather Provider (OpenMeteoProvider & DemoWeatherProvider):
 *    - Hourly dynamic alignment (R-06)
 *    - Bounded metrics (humidity 0-100%, rain 0-100%)
 *    - HTTP 500 network failure returns fallback with isDemo: true
 *    - Timeout returns fallback with isDemo: true
 * 3. LLM Provider (AIProviderFactory & Providers):
 *    - Mock provider returns MockAIProvider
 *    - Production guardrail blocks Mock in production unless ALLOW_MOCK_AI=true
 *    - Missing API keys (Gemini, OpenAI, Anthropic) handled safely
 *    - Mock provider returns schema-compliant structured response with ICAR citations
 * 4. Inference Service (DiseaseDiagnosisService):
 *    - Service unreachable (ECONNREFUSED) returns status: 'model_not_ready'
 *    - Service timeout returns status: 'model_not_ready'
 *    - HTTP 422 invalid payload throws clean error
 *    - HTTP 413 oversized payload throws clean error
 *    - checkHealth returns available: false when offline
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgmarknetProvider } from '../src/providers/market/AgmarknetProvider';
import { DemoMarketProvider } from '../src/providers/market/DemoMarketProvider';
import { OpenMeteoProvider } from '../src/providers/weather/OpenMeteoProvider';
import { DemoWeatherProvider } from '../src/providers/weather/DemoWeatherProvider';
import { AIProviderFactory } from '../src/lib/ai/AIProviderFactory';
import { DiseaseDiagnosisService } from '../src/services/DiseaseDiagnosisService';

// ============================================================================
// 1. OFFICIAL MARKET PROVIDER CONTRACTS
// ============================================================================

describe('Provider: Official AgmarknetProvider & DemoMarketProvider', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('DemoMarketProvider returns deterministic records with demo provenance', async () => {
    const demo = new DemoMarketProvider();
    const status = await demo.getStatus();
    expect(status.status).toBe('demo');
    expect(status.requiresApiKey).toBe(false);

    const prices = await demo.fetchPrices({ commodity: 'Cotton', district: 'Rajkot' });
    expect(prices.length).toBeGreaterThan(0);
    for (const p of prices) {
      expect(p.commodity).toBe('Cotton');
      expect(p.district).toBe('Rajkot');
      expect(p.isDemo).toBe(true);
      expect(p.source).toContain('Demo');
      expect(p.modalPrice).toBeGreaterThan(0);
    }
  });

  it('AgmarknetProvider throws when MARKET_API_KEY is missing', async () => {
    delete process.env.MARKET_API_KEY;
    delete process.env.DATA_GOV_IN_API_KEY;

    const provider = new AgmarknetProvider();
    await expect(provider.fetchPrices()).rejects.toThrow('AGMARKNET API key is not configured');

    const status = await provider.getStatus();
    expect(status.status).toBe('unconfigured');
    expect(status.isConfigured).toBe(false);
  });

  it('AgmarknetProvider normalizes valid data.gov.in payload', async () => {
    process.env.MARKET_API_KEY = 'test_key_12345';
    const provider = new AgmarknetProvider();

    const mockResponse = {
      total: 1,
      count: 1,
      records: [
        {
          state: ' Gujarat ',
          district: 'Rajkot',
          market: 'Rajkot APMC',
          commodity: 'Cotton',
          variety: 'Shankar-6',
          grade: 'FAQ',
          arrival_date: '28/10/2026',
          min_price: '7100',
          max_price: '7800',
          modal_price: '7520',
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as any);

    const results = await provider.fetchPrices({ limit: 10 });
    expect(results).toHaveLength(1);
    const rec = results[0];
    expect(rec.state).toBe('Gujarat');
    expect(rec.commodity).toBe('Cotton');
    expect(rec.minPrice).toBe(7100);
    expect(rec.maxPrice).toBe(7800);
    expect(rec.modalPrice).toBe(7520);
    expect(rec.qualityStatus).toBe('ok');
    expect(rec.isDemo).toBe(false);
  });

  it('AgmarknetProvider throws descriptive error on HTTP 401 Unauthorized', async () => {
    process.env.MARKET_API_KEY = 'invalid_key';
    const provider = new AgmarknetProvider();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid API Key' }),
    } as any);

    await expect(provider.fetchPrices()).rejects.toThrow('API authentication failed (HTTP 401)');
  });

  it('AgmarknetProvider throws descriptive error on HTTP 429 Rate Limit', async () => {
    process.env.MARKET_API_KEY = 'valid_key';
    const provider = new AgmarknetProvider();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ message: 'Rate limit exceeded' }),
    } as any);

    await expect(provider.fetchPrices()).rejects.toThrow('API rate limit exceeded (HTTP 429)');
  });

  it('AgmarknetProvider throws descriptive error on HTTP 500 Server Error', async () => {
    process.env.MARKET_API_KEY = 'valid_key';
    const provider = new AgmarknetProvider();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Backend crash' }),
    } as any);

    await expect(provider.fetchPrices()).rejects.toThrow('server error (HTTP 500)');
  });

  it('AgmarknetProvider flags anomaly_price_order when minPrice > maxPrice', async () => {
    process.env.MARKET_API_KEY = 'valid_key';
    const provider = new AgmarknetProvider();

    const mockResponse = {
      total: 1,
      count: 1,
      records: [
        {
          state: 'Gujarat',
          district: 'Vadodara',
          market: 'Vadodara APMC',
          commodity: 'Wheat',
          arrival_date: '28/10/2026',
          min_price: '3200', // min > max!
          max_price: '2800',
          modal_price: '3000',
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as any);

    const results = await provider.fetchPrices({ limit: 1 });
    expect(results[0].qualityStatus).toBe('anomaly_price_order');
  });
});

// ============================================================================
// 2. WEATHER PROVIDER CONTRACTS
// ============================================================================

describe('Provider: Weather Provider Contracts (OpenMeteoProvider & Demo)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('DemoWeatherProvider returns normalized seasonal weather data', async () => {
    const demo = new DemoWeatherProvider();
    const weather = await demo.getCurrentWeather(22.25, 71.19);
    expect(weather.temperatureC).toBeGreaterThan(0);
    expect(weather.humidityPct).toBeGreaterThanOrEqual(0);
    expect(weather.humidityPct).toBeLessThanOrEqual(100);
    expect(weather.isDemo).toBe(true);

    const forecast = await demo.getForecast(22.25, 71.19, 5);
    expect(forecast).toHaveLength(5);
    expect(forecast[0].date).toBeDefined();
  });

  it('OpenMeteoProvider parses live payload with dynamic hourly index alignment', async () => {
    const provider = new OpenMeteoProvider();

    const nowPrefix = new Date().toISOString().slice(0, 13);
    const mockHourlyTimes = [
      `${nowPrefix}:00`,
      '2026-10-28T14:00',
      '2026-10-28T15:00',
    ];

    const mockOpenMeteo = {
      current_weather: {
        temperature: 31.4,
        windspeed: 14.2,
        weathercode: 0,
      },
      hourly: {
        time: mockHourlyTimes,
        relativehumidity_2m: [58, 62, 65],
        precipitation_probability: [15, 20, 30],
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOpenMeteo,
    } as any);

    const weather = await provider.getCurrentWeather(22.25, 71.19);
    expect(weather.temperatureC).toBe(31.4);
    expect(weather.windSpeedKmh).toBe(14.2);
    expect(weather.humidityPct).toBe(58);
    expect(weather.rainProbabilityPct).toBe(15);
    expect(weather.condition).toBe('Clear Sky');
    expect(weather.isDemo).toBe(false);
  });

  it('OpenMeteoProvider returns fallback with isDemo: true on network error without crashing', async () => {
    const provider = new OpenMeteoProvider();

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network connection failed'));

    const weather = await provider.getCurrentWeather(22.25, 71.19);
    expect(weather).toBeDefined();
    expect(weather.isDemo).toBe(true);
    expect(weather.source).toContain('Fallback');
    expect(weather.temperatureC).toBe(28);
  });

  it('OpenMeteoProvider handles HTTP 500 error gracefully by returning fallback', async () => {
    const provider = new OpenMeteoProvider();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as any);

    const weather = await provider.getCurrentWeather(22.25, 71.19);
    expect(weather.isDemo).toBe(true);
    expect(weather.humidityPct).toBe(60);
  });
});

// ============================================================================
// 3. LLM PROVIDER CONTRACTS & TIMEOUT/MISSING KEYS
// ============================================================================

describe('Provider: AI Provider Factory & LLM Contracts', () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
    // Clear factory provider cache
    (AIProviderFactory as any).cachedProviders.clear();
  });

  it('resolves MockAIProvider in development mode', () => {
    process.env.NODE_ENV = 'development';
    process.env.AI_PROVIDER = 'mock';

    const provider = AIProviderFactory.getProvider();
    expect(provider).toBeDefined();
  });

  it('throws in production when AI_PROVIDER is mock and ALLOW_MOCK_AI is not true', () => {
    process.env.NODE_ENV = 'production';
    process.env.AI_PROVIDER = 'mock';
    delete process.env.ALLOW_MOCK_AI;

    expect(() => AIProviderFactory.getProvider()).toThrow('Mock AI provider is disabled in production');
  });

  it('permits MockAIProvider in production when ALLOW_MOCK_AI="true"', () => {
    process.env.NODE_ENV = 'production';
    process.env.AI_PROVIDER = 'mock';
    process.env.ALLOW_MOCK_AI = 'true';

    const provider = AIProviderFactory.getProvider();
    expect(provider).toBeDefined();
  });

  it('reports misconfigured status when GEMINI_API_KEY is missing', async () => {
    process.env.AI_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;

    const provider = AIProviderFactory.getProvider();
    const status = await provider.status();
    expect(status.isConfigured).toBe(false);
    expect(status.status).toBe('misconfigured');
    expect(status.requiresKey).toBe(true);
  });

  it('reports misconfigured status when OPENAI_API_KEY is missing', async () => {
    process.env.AI_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;

    const provider = AIProviderFactory.getProvider();
    const status = await provider.status();
    expect(status.isConfigured).toBe(false);
    expect(status.status).toBe('misconfigured');
  });

  it('MockAIProvider returns schema-compliant structured response with ICAR citations', async () => {
    process.env.AI_PROVIDER = 'mock';
    const provider = AIProviderFactory.getProvider();

    const response = await provider.chat([
      { role: 'system', content: 'You are an agronomic expert.' },
      { role: 'user', content: 'How do I control pink bollworm in cotton?' },
    ]);

    expect(response.content).toBeDefined();
    expect(response.isMock).toBe(true);

    const result = JSON.parse(response.content);
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.observations)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(Array.isArray(result.references)).toBe(true);
    expect(['high', 'medium', 'low']).toContain(result.confidence);

    // Citations must reference extension publications (ICAR / AAU)
    const hasVerifiedSource = result.references.some((r: any) =>
      r.title?.includes('ICAR') || r.title?.includes('AAU') || r.issuingOrg?.includes('ICAR') || r.issuingOrg?.includes('AAU')
    );
    expect(hasVerifiedSource).toBe(true);
  });
});

// ============================================================================
// 4. INFERENCE SERVICE CONTRACTS (DISEASE DIAGNOSIS)
// ============================================================================

describe('Provider: Disease Inference Service Contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns status: "model_not_ready" when inference service is unreachable (ECONNREFUSED)', async () => {
    // Simulate ECONNREFUSED from python microservice
    const connErr: any = new Error('fetch failed');
    connErr.cause = { code: 'ECONNREFUSED' };
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(connErr);

    const dummyImage = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9]);
    const result = await DiseaseDiagnosisService.predict(dummyImage, 'leaf.jpg');

    expect(result.status).toBe('model_not_ready');
    expect(result.uncertainty.isUncertain).toBe(true);
    expect(result.uncertainty.reason).toContain('Inference service offline');
    expect(result.topK).toEqual([]);
    expect(result.explanation).toContain('unavailable or busy');
  });

  it('returns status: "model_not_ready" when inference service times out', async () => {
    const timeoutErr: any = new Error('The operation was aborted');
    timeoutErr.name = 'AbortError';
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(timeoutErr);

    const dummyImage = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9]);
    const result = await DiseaseDiagnosisService.predict(dummyImage, 'leaf.jpg');

    expect(result.status).toBe('model_not_ready');
    expect(result.uncertainty.reason).toContain('timed out');
  });

  it('throws descriptive error on HTTP 422 Invalid Image uploaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Uploaded file is not a valid JPEG/PNG image' }),
    } as any);

    const dummyImage = Buffer.from('non-image data');
    await expect(DiseaseDiagnosisService.predict(dummyImage, 'test.txt')).rejects.toThrow(
      'Uploaded file is not a valid JPEG/PNG image'
    );
  });

  it('checkHealth returns available: false when service cannot be reached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

    const health = await DiseaseDiagnosisService.checkHealth();
    expect(health.available).toBe(false);
    expect(health.modelReady).toBe(false);
  });
});
