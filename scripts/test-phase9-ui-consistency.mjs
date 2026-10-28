#!/usr/bin/env node
/**
 * test-phase9-ui-consistency.mjs
 * Comprehensive validation suite for Phase 9:
 * 1. Provenance Badges Taxonomy & Timestamps
 * 2. i18n Locales Synchronization (EN, HI, GU)
 * 3. Standardized Status & Error Feedback Components
 * 4. Resilient Map Tile Fallbacks
 * 5. Disease Classifier & Assistant RAG Attribution Contracts
 * 6. Accessibility & ARIA Announcements
 */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🌾 SmartFarm AI — Phase 9 Consistency & Error Handling Test');
  console.log('============================================================\n');

  // TEST SUITE 1: Provenance Taxonomy Verification
  console.log('--- Suite 1: Provenance Taxonomy & Component ---');
  const chipFilePath = path.join(ROOT_DIR, 'src', 'components', 'ui', 'ProvenanceChip.tsx');
  assert(fs.existsSync(chipFilePath), 'ProvenanceChip.tsx exists');
  const chipContent = fs.readFileSync(chipFilePath, 'utf8');

  const requiredTypes = [
    'measured',
    'forecast',
    'official_market',
    'model_prediction',
    'verified_source',
    'simulated',
    'stale_cached'
  ];

  for (const t of requiredTypes) {
    assert(chipContent.includes(`'${t}'`), `ProvenanceChip supports taxonomy type '${t}'`);
  }
  assert(chipContent.includes('formattedTime'), 'ProvenanceChip formats timestamp if provided');
  assert(chipContent.includes('title='), 'ProvenanceChip supports source hover tooltip');
  assert(chipContent.includes('highContrast'), 'ProvenanceChip supports highContrast option for dark cards');
  assert(chipContent.includes('text-stone-950'), 'stale_cached badge uses high-contrast text (>12:1 ratio)');
  assert(chipContent.includes('ring-1'), 'ProvenanceChip dot indicator includes accessible outline ring');

  // TEST SUITE 2: Status Feedback & Accessibility States
  console.log('\n--- Suite 2: Status Feedback & ARIA Attributes ---');
  const statusFilePath = path.join(ROOT_DIR, 'src', 'components', 'ui', 'StatusFeedback.tsx');
  assert(fs.existsSync(statusFilePath), 'StatusFeedback.tsx exists');
  const statusContent = fs.readFileSync(statusFilePath, 'utf8');

  assert(statusContent.includes('LoadingState'), 'StatusFeedback exports LoadingState');
  assert(statusContent.includes('aria-live="polite"'), 'LoadingState uses aria-live="polite" for screen readers');
  assert(statusContent.includes('EmptyState'), 'StatusFeedback exports EmptyState');
  assert(statusContent.includes('ErrorState'), 'StatusFeedback exports ErrorState');
  assert(statusContent.includes('OfflineNotice'), 'StatusFeedback exports OfflineNotice');
  assert(statusContent.includes('StaleDataBanner'), 'StatusFeedback exports StaleDataBanner');
  assert(statusContent.includes('PermissionDeniedState'), 'StatusFeedback exports PermissionDeniedState');
  assert(statusContent.includes('DemoModeBanner'), 'StatusFeedback exports DemoModeBanner');

  const dataStatePath = path.join(ROOT_DIR, 'src', 'components', 'ui', 'DataState.tsx');
  const dataStateContent = fs.readFileSync(dataStatePath, 'utf8');
  assert(dataStateContent.includes('role="status"'), 'DataState loading includes role="status"');
  assert(dataStateContent.includes('aria-live="polite"'), 'DataState loading includes aria-live="polite"');
  assert(dataStateContent.includes('role="alert"'), 'DataState error includes role="alert"');

  // TEST SUITE 3: Multilingual i18n Locales (EN, HI, GU)
  console.log('\n--- Suite 3: i18n Locales Synchronization ---');
  const enLocale = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src', 'locales', 'en.json'), 'utf8'));
  const hiLocale = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src', 'locales', 'hi.json'), 'utf8'));
  const guLocale = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src', 'locales', 'gu.json'), 'utf8'));

  const requiredLocaleKeys = [
    'provenance_measured',
    'provenance_forecast',
    'provenance_official_market',
    'provenance_model_prediction',
    'provenance_verified_source',
    'provenance_simulated',
    'provenance_stale_cached',
    'status_loading',
    'status_retry',
    'status_offline_title',
    'status_offline_desc',
    'status_demo_banner_title',
    'status_demo_banner_desc',
    'status_ai_unvalidated_lang',
    'status_empty',
    'status_error',
    'status_success'
  ];

  for (const k of requiredLocaleKeys) {
    assert(typeof enLocale[k] === 'string' && enLocale[k].length > 0, `en.json contains non-empty key '${k}'`);
    assert(typeof hiLocale[k] === 'string' && hiLocale[k].length > 0, `hi.json contains non-empty key '${k}'`);
    assert(typeof guLocale[k] === 'string' && guLocale[k].length > 0, `gu.json contains non-empty key '${k}'`);
  }

  // TEST SUITE 4: Map Fallback Resilience & Focus Trap Defense
  console.log('\n--- Suite 4: Map Fallback Resilience & Keyboard Trap Defense ---');
  const mapFilePath = path.join(ROOT_DIR, 'src', 'components', 'domain', 'MapView.tsx');
  assert(fs.existsSync(mapFilePath), 'MapView.tsx exists');
  const mapContent = fs.readFileSync(mapFilePath, 'utf8');
  assert(mapContent.includes('MapPin'), 'MapView includes MapPin fallback icon');
  assert(mapContent.includes('toFixed(5)'), 'MapView displays coordinate numbers with precision');
  assert(mapContent.includes('isOnline'), 'MapView tracks network online/offline state');
  assert(mapContent.includes('Map tiles fallback'), 'MapView displays fallback notice when tiles fail');
  assert(mapContent.includes('role="region"'), 'MapView declares semantic role="region"');
  assert(mapContent.includes('Skip interactive map'), 'MapView provides accessible keyboard Skip link');
  assert(mapContent.includes('trapElements'), 'MapView sanitizes Leaflet SVG elements to prevent focus traps');

  const globalsCssPath = path.join(ROOT_DIR, 'src', 'app', 'globals.css');
  const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8');
  assert(globalsCssContent.includes('.leaflet-pane svg path'), 'globals.css includes Leaflet SVG keyboard trap defenses');


  // TEST SUITE 5: API Endpoints Freshness & Metadata Contracts
  console.log('\n--- Suite 5: Live API Endpoints Metadata Contracts ---');
  const BASE_URL = 'http://localhost:3000';

  // 5.1 Market Prices API
  try {
    const marketRes = await fetch(`${BASE_URL}/api/v1/market/prices?limit=2`);
    assert(marketRes.ok, `Market Prices API returns 200 OK (HTTP ${marketRes.status})`);
    const marketJson = await marketRes.json();
    assert(Array.isArray(marketJson.data), 'Market Prices API returns array of records');
    if (marketJson.data.length > 0) {
      const rec = marketJson.data[0];
      assert(typeof (rec.priceDate || rec.arrival_date) === 'string', 'Market record has observation date');
      assert(typeof rec.modalPrice === 'number', 'Market record has numeric modal price');
      assert(typeof rec.isDemo === 'boolean', 'Market record explicitly declares isDemo flag');
    }
  } catch (err) {
    assert(false, `Market Prices API call failed: ${err.message}`);
  }

  // 5.2 Weather API
  try {
    const weatherRes = await fetch(`${BASE_URL}/api/v1/weather`);
    assert(weatherRes.ok, `Weather API returns 200 OK (HTTP ${weatherRes.status})`);
    const weatherJson = await weatherRes.json();
    assert(weatherJson.data?.current != null, 'Weather API returns current meteorological data');
    assert(typeof weatherJson.data.current.temperatureC === 'number', 'Weather has temperature in Celsius');
    assert(typeof weatherJson.data.current.isDemo === 'boolean', 'Weather explicitly declares isDemo flag');
  } catch (err) {
    assert(false, `Weather API call failed: ${err.message}`);
  }

  // 5.3 Assistant Status API
  try {
    const assistantRes = await fetch(`${BASE_URL}/api/v1/assistant/status`);
    assert(assistantRes.ok, `Assistant Status API returns 200 OK (HTTP ${assistantRes.status})`);
    const assistantJson = await assistantRes.json();
    assert(assistantJson.data?.provider != null, 'Assistant Status returns provider metadata');
    assert(typeof assistantJson.data.provider.isMock === 'boolean', 'Assistant Status explicitly reports mock vs live AI state');
  } catch (err) {
    assert(false, `Assistant Status API call failed: ${err.message}`);
  }

  // TEST SUITE 6: UI Page Integrity
  console.log('\n--- Suite 6: Page Implementations Audit ---');
  const weatherPageContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'app', '(app)', 'weather', 'page.tsx'), 'utf8');
  assert(weatherPageContent.includes('fetchWeather'), 'WeatherPage has explicit fetch function');
  assert(weatherPageContent.includes('onRetry={fetchWeather}'), 'WeatherPage provides onRetry handler');

  const tasksPageContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'app', '(app)', 'tasks', 'page.tsx'), 'utf8');
  assert(tasksPageContent.includes('onRetry={fetchTasks}'), 'TasksPage provides onRetry handler');
  assert(tasksPageContent.includes('aria-label='), 'TasksPage buttons include accessible aria-label');

  const cropsPageContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'app', '(app)', 'crops', 'page.tsx'), 'utf8');
  assert(cropsPageContent.includes('onRetry={fetchCropsData}'), 'CropsPage provides onRetry handler');

  const diagnosisCardContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'diagnosis', 'DiseaseClassifierCard.tsx'), 'utf8');
  assert(diagnosisCardContent.includes('model_prediction'), 'DiseaseClassifierCard uses model_prediction provenance');
  assert(diagnosisCardContent.includes('Provider:'), 'DiseaseClassifierCard attributes model provider');

  const assistantPageContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'app', '(app)', 'assistant', 'page.tsx'), 'utf8');
  assert(assistantPageContent.includes('status_ai_unvalidated_lang'), 'AssistantPage uses status_ai_unvalidated_lang');
  assert(assistantPageContent.includes('role="log"'), 'AssistantPage chat messages use role="log"');
  assert(assistantPageContent.includes('ProvenanceChip'), 'AssistantPage uses ProvenanceChip for observation and sources');
  assert(assistantPageContent.includes('aria-label='), 'AssistantPage input includes accessible aria-label');

  const priceCardContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'market', 'MarketPriceCard.tsx'), 'utf8');
  assert(priceCardContent.includes('Arrival:'), 'MarketPriceCard displays reported arrival date next to price');
  assert(priceCardContent.includes('Synced:'), 'MarketPriceCard displays last synchronized time next to price');
  assert(priceCardContent.includes('ProvenanceChip'), 'MarketPriceCard displays provenance badge');

  const dashboardContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'app', '(app)', 'dashboard', 'page.tsx'), 'utf8');
  assert(dashboardContent.includes('ProvenanceChip'), 'Dashboard renders ProvenanceChip for mandi and weather');
  assert(dashboardContent.includes('Arrival:'), 'Dashboard mandi widget displays reported arrival date');
  assert(dashboardContent.includes('Synced:'), 'Dashboard mandi widget displays last sync time');

  const iotMonitorContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'iot', 'IotFieldMonitor.tsx'), 'utf8');
  assert(iotMonitorContent.includes('Measured:'), 'IotFieldMonitor displays measured timestamp next to sensor values');
  assert(iotMonitorContent.includes('Received:'), 'IotFieldMonitor displays received timestamp next to sensor values');
  assert(iotMonitorContent.includes('ProvenanceChip'), 'IotFieldMonitor displays provenance badge');

  const adminPageContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'app', 'admin', 'page.tsx'), 'utf8');
  assert(adminPageContent.includes('PermissionDeniedState'), 'AdminPage handles 401/403 with PermissionDeniedState');
  assert(adminPageContent.includes('onRetry={fetchAdminData}'), 'AdminPage provides onRetry handler in DataState');

  const ordersPageContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'app', '(app)', 'orders', 'page.tsx'), 'utf8');
  assert(ordersPageContent.includes('DataState'), 'OrdersPage standardizes state via DataState');
  assert(ordersPageContent.includes('onRetry={fetchOrders}'), 'OrdersPage provides onRetry handler');

  const storeContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'domain', 'FertilizerStoreExplorer.tsx'), 'utf8');
  assert(storeContent.includes('catalogError'), 'FertilizerStoreExplorer tracks catalogError');
  assert(storeContent.includes('Retry Loading Catalog'), 'FertilizerStoreExplorer provides retry button on error');

  const onboardingContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'app', '(app)', 'onboarding', 'page.tsx'), 'utf8');
  assert(onboardingContent.includes('POST') && onboardingContent.includes('/api/v1/farms'), 'OnboardingPage persists farm on completion');

  console.log('\n============================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
