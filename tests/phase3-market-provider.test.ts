/**
 * Phase 3 — Market Provider Tests
 *
 * Tests the AgmarknetProvider and DemoMarketProvider with mocked HTTP responses.
 * Covers: valid payloads, pagination, missing prices, price ordering anomalies,
 *         HTTP 429, timeout, 5xx, malformed JSON, missing API key.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AgmarknetProvider } from '../src/providers/market/AgmarknetProvider';
import { DemoMarketProvider } from '../src/providers/market/DemoMarketProvider';

// ---------- Helpers ----------

function makeApiResponse(records: any[], total?: number) {
  return {
    records,
    total: total ?? records.length,
    count: records.length,
  };
}

function makeAgmarknetRecord(overrides: Partial<Record<string, any>> = {}) {
  return {
    state: 'Gujarat',
    district: 'Rajkot',
    market: 'Rajkot APMC',
    commodity: 'Cotton',
    variety: 'Shankar-6',
    grade: 'FAQ',
    arrival_date: '15/10/2026',
    min_price: '7100',
    max_price: '7780',
    modal_price: '7520',
    ...overrides,
  };
}

function mockFetchSuccess(body: any, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number, statusText = 'Error') {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({ message: statusText }),
  });
}

// ---------- DemoMarketProvider ----------

describe('DemoMarketProvider', () => {
  let provider: DemoMarketProvider;

  beforeEach(() => {
    provider = new DemoMarketProvider();
  });

  it('returns demo records with isDemo = true', async () => {
    const records = await provider.fetchPrices();
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      expect(r.isDemo).toBe(true);
      expect(r.source).toContain('Demo');
    }
  });

  it('every record has non-null prices and ok quality', async () => {
    const records = await provider.fetchPrices();
    for (const r of records) {
      expect(r.minPrice).not.toBeNull();
      expect(r.maxPrice).not.toBeNull();
      expect(r.modalPrice).not.toBeNull();
      expect(r.qualityStatus).toBe('ok');
    }
  });

  it('reports demo status', async () => {
    const status = await provider.getStatus();
    expect(status.status).toBe('demo');
    expect(status.isConfigured).toBe(true);
    expect(status.requiresApiKey).toBe(false);
  });

  it('filters by commodity', async () => {
    const records = await provider.fetchPrices({ commodity: 'Cotton' });
    for (const r of records) {
      expect(r.commodity.toLowerCase()).toContain('cotton');
    }
  });

  it('includes grade field (empty string for demo)', async () => {
    const records = await provider.fetchPrices();
    for (const r of records) {
      expect(typeof r.grade).toBe('string');
    }
  });
});

// ---------- AgmarknetProvider ----------

describe('AgmarknetProvider', () => {
  let provider: AgmarknetProvider;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MARKET_API_KEY = 'test-api-key-12345';
    process.env.DATA_GOV_IN_API_KEY = '';
    provider = new AgmarknetProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  // --- Status ---

  it('reports unconfigured when no API key', async () => {
    process.env.MARKET_API_KEY = '';
    process.env.DATA_GOV_IN_API_KEY = '';
    const p = new AgmarknetProvider();
    const status = await p.getStatus();
    expect(status.status).toBe('unconfigured');
    expect(status.isConfigured).toBe(false);
  });

  it('reports active when API key is set', async () => {
    const status = await provider.getStatus();
    expect(status.status).toBe('active');
    expect(status.isConfigured).toBe(true);
  });

  it('exposes resource ID', () => {
    expect(provider.getResourceId()).toBe('9ef84268-d588-465a-a308-a864a43d0070');
  });

  // --- Fetch: throws without key ---

  it('throws when fetching without API key', async () => {
    process.env.MARKET_API_KEY = '';
    process.env.DATA_GOV_IN_API_KEY = '';
    const p = new AgmarknetProvider();
    await expect(p.fetchPrices()).rejects.toThrow(/not configured/i);
  });

  // --- Fetch: valid response ---

  it('parses a valid AGMARKNET record correctly', async () => {
    const apiBody = makeApiResponse([makeAgmarknetRecord()]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records).toHaveLength(1);

    const r = records[0];
    expect(r.commodity).toBe('Cotton');
    expect(r.variety).toBe('Shankar-6');
    expect(r.grade).toBe('FAQ');
    expect(r.state).toBe('Gujarat');
    expect(r.market).toBe('Rajkot APMC');
    expect(r.minPrice).toBe(7100);
    expect(r.maxPrice).toBe(7780);
    expect(r.modalPrice).toBe(7520);
    expect(r.priceDate).toBeInstanceOf(Date);
    expect(r.isDemo).toBe(false);
    expect(r.qualityStatus).toBe('ok');
    expect(r.source).toContain('AGMARKNET');
    expect(r.sourceResourceId).toBe('9ef84268-d588-465a-a308-a864a43d0070');
  });

  it('parses DD-MM-YYYY date format', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ arrival_date: '15-10-2026' }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records).toHaveLength(1);
    expect(records[0].priceDate.getUTCDate()).toBe(15);
    expect(records[0].priceDate.getUTCMonth()).toBe(9); // October = 9
  });

  // --- Missing prices: never convert to zero ---

  it('returns null for missing min_price (never zero)', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ min_price: '' }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records).toHaveLength(1);
    expect(records[0].minPrice).toBeNull();
    expect(records[0].qualityStatus).toBe('missing_price');
  });

  it('returns null for undefined modal_price', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ modal_price: undefined }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records).toHaveLength(1);
    expect(records[0].modalPrice).toBeNull();
    expect(records[0].qualityStatus).toBe('missing_price');
  });

  it('returns null for NaN price string', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ max_price: 'N/A' }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records[0].maxPrice).toBeNull();
    expect(records[0].qualityStatus).toBe('missing_price');
  });

  // --- Price ordering anomaly ---

  it('flags anomaly when min > modal', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ min_price: '8000', modal_price: '7500', max_price: '9000' }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records).toHaveLength(1);
    expect(records[0].qualityStatus).toBe('anomaly_price_order');
    expect(records[0].minPrice).toBe(8000);
    expect(records[0].modalPrice).toBe(7500);
  });

  it('flags anomaly when modal > max', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ min_price: '5000', modal_price: '9000', max_price: '8000' }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records[0].qualityStatus).toBe('anomaly_price_order');
  });

  // --- Skips unusable records ---

  it('skips record with no commodity name', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ commodity: '' }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records).toHaveLength(0);
  });

  it('skips record with no market name', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ market: '' }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records).toHaveLength(0);
  });

  it('skips record with invalid date', async () => {
    const apiBody = makeApiResponse([
      makeAgmarknetRecord({ arrival_date: 'bad-date' }),
    ]);
    globalThis.fetch = mockFetchSuccess(apiBody);

    const records = await provider.fetchPrices({ limit: 10 });
    expect(records).toHaveLength(0);
  });

  // --- HTTP error handling ---

  it('throws descriptive error on HTTP 429', async () => {
    globalThis.fetch = mockFetchError(429, 'Too Many Requests');
    await expect(provider.fetchPrices({ limit: 10 })).rejects.toThrow(/rate limit/i);
  });

  it('throws descriptive error on HTTP 401', async () => {
    globalThis.fetch = mockFetchError(401, 'Unauthorized');
    await expect(provider.fetchPrices({ limit: 10 })).rejects.toThrow(/authentication/i);
  });

  it('throws descriptive error on HTTP 500', async () => {
    globalThis.fetch = mockFetchError(500, 'Internal Server Error');
    await expect(provider.fetchPrices({ limit: 10 })).rejects.toThrow(/server error/i);
  });

  it('throws descriptive error on malformed JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });
    await expect(provider.fetchPrices({ limit: 10 })).rejects.toThrow(/malformed JSON/i);
  });

  it('throws descriptive error on timeout', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });
    await expect(provider.fetchPrices({ limit: 10 })).rejects.toThrow(/timed out/i);
  });

  // --- Does NOT log API key ---

  it('does not include API key in error log output', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = mockFetchError(500, 'Server Error');

    try {
      await provider.fetchPrices({ limit: 10 });
    } catch {
      // expected
    }

    for (const call of consoleSpy.mock.calls) {
      const logStr = call.join(' ');
      expect(logStr).not.toContain('test-api-key-12345');
    }

    consoleSpy.mockRestore();
  });

  // --- Pagination ---

  it('paginates when total exceeds page size', async () => {
    const page1Records = Array.from({ length: 500 }, (_, i) =>
      makeAgmarknetRecord({ commodity: `Commodity-${i}` })
    );
    const page2Records = [
      makeAgmarknetRecord({ commodity: 'Commodity-500' }),
    ];

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          json: () => Promise.resolve(makeApiResponse(page1Records, 501)),
        });
      } else {
        return Promise.resolve({
          ok: true, status: 200, statusText: 'OK',
          json: () => Promise.resolve(makeApiResponse(page2Records, 501)),
        });
      }
    });

    const records = await provider.fetchPrices();
    expect(callCount).toBe(2);
    expect(records.length).toBe(501);
  });

  // --- Limit respected ---

  it('respects explicit limit', async () => {
    const manyRecords = Array.from({ length: 100 }, (_, i) =>
      makeAgmarknetRecord({ commodity: `Item-${i}` })
    );
    globalThis.fetch = mockFetchSuccess(makeApiResponse(manyRecords, 100));

    const records = await provider.fetchPrices({ limit: 5 });
    expect(records.length).toBe(5);
  });

  // --- Filters passed to API ---

  it('passes state filter to API query', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200, statusText: 'OK',
      json: () => Promise.resolve(makeApiResponse([])),
    });

    await provider.fetchPrices({ state: 'Maharashtra', limit: 10 });

    const fetchCall = (globalThis.fetch as any).mock.calls[0];
    const url = fetchCall[0] as string;
    expect(url).toContain('filters%5Bstate%5D=Maharashtra');
  });
});
