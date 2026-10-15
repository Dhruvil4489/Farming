// scripts/audit-portal-routes.mjs
const BASE_URL = 'http://localhost:3000';

const PORTAL_ROUTES = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'My Farms', path: '/farms' },
  { name: 'Fields', path: '/fields' },
  { name: 'Crops & Cycles', path: '/crops' },
  { name: 'Tasks & Activities', path: '/tasks' },
  { name: 'Weather', path: '/weather' },
  { name: 'Live Mandi Prices', path: '/mandi' },
  { name: 'Fertilizer Store', path: '/store' },
  { name: 'Nutrient Guidance', path: '/guidance' },
  { name: 'My Orders', path: '/orders' },
  { name: 'Soil Health', path: '/soil' },
  { name: 'Soil Moisture', path: '/soil-moisture' },
  { name: 'Scouting', path: '/scouting' },
  { name: 'Irrigation', path: '/irrigation' },
  { name: 'AI Assistant', path: '/assistant' },
  { name: 'Admin Panel', path: '/admin' },
];

const PUBLIC_ROUTES = [
  { name: 'Public Mandi Prices', path: '/market' },
  { name: 'Public Fertilizer Store', path: '/fertilizers' },
  { name: 'Public Nutrient Guide', path: '/fertilizers/guide' },
];

async function runAudit() {
  console.log('====================================================');
  console.log('SMARTFARM AI — COMPREHENSIVE PORTAL AUDIT SUITE');
  console.log('====================================================\n');

  // STEP 1: Unauthenticated Security & Route Protection Audit
  console.log('--- 1. UNAUTHENTICATED SECURITY CHECKS ---');
  let unauthPass = true;
  for (const r of PORTAL_ROUTES) {
    const res = await fetch(`${BASE_URL}${r.path}`, { redirect: 'manual' });
    const isRedirect = res.status === 307 || res.status === 308 || res.status === 302;
    const loc = res.headers.get('location') || '';
    const redirectsToLogin = isRedirect && loc.includes('/login');

    if (redirectsToLogin) {
      console.log(`✓ [PROTECTED] ${r.name.padEnd(22)} (${r.path}) -> Status: ${res.status}, Location: ${loc}`);
    } else {
      console.log(`x [VULNERABLE] ${r.name.padEnd(22)} (${r.path}) -> Status: ${res.status}`);
      unauthPass = false;
    }
  }

  // STEP 2: Public Routes Integrity
  console.log('\n--- 2. PUBLIC ROUTES INTEGRITY CHECKS ---');
  for (const r of PUBLIC_ROUTES) {
    const res = await fetch(`${BASE_URL}${r.path}`, { redirect: 'manual' });
    if (res.status === 200) {
      console.log(`✓ [PUBLIC OK] ${r.name.padEnd(25)} (${r.path}) -> Status: 200`);
    } else {
      console.log(`x [PUBLIC FAIL] ${r.name.padEnd(25)} (${r.path}) -> Status: ${res.status}`);
    }
  }

  // STEP 3: Authenticated Session & Portal Module Audit
  console.log('\n--- 3. AUTHENTICATED FARMER SESSION AUDIT ---');
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
  });

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    console.error('Failed to authenticate test farmer.');
    return;
  }
  console.log('Farmer authenticated successfully. Token cookie received.');

  const authHeaders = { Cookie: setCookie.split(';')[0] };

  console.log('\n--- 4. AUTHENTICATED PORTAL ROUTE RENDERING AUDIT ---');
  for (const r of PORTAL_ROUTES) {
    const res = await fetch(`${BASE_URL}${r.path}`, {
      headers: authHeaders,
      redirect: 'manual',
    });
    if (res.status === 200) {
      const html = await res.text();
      const hasNavbar = html.includes('SmartFarm AI') || html.includes('Farmer');
      const hasSidebar = html.includes('Platform Spine') || html.includes('Dashboard') || html.includes('nav');
      console.log(`✓ [200 OK] ${r.name.padEnd(22)} (${r.path}) -> Navbar: ${hasNavbar}, Sidebar/Portal: ${hasSidebar}`);
    } else {
      console.log(`x [FAIL ${res.status}] ${r.name.padEnd(22)} (${r.path})`);
    }
  }

  // STEP 5: Backend APIs Audit
  console.log('\n--- 5. BACKEND APIS & SERVICES AUDIT ---');
  const apiChecks = [
    { name: 'Store Products', path: '/api/v1/store/products' },
    { name: 'Store Cart', path: '/api/v1/store/cart', auth: true },
    { name: 'Store Orders', path: '/api/v1/store/orders', auth: true },
    { name: 'Fertilizer Categories', path: '/api/v1/fertilizers/categories' },
    { name: 'Fertilizer Guidance', path: '/api/v1/fertilizers/guidance' },
    { name: 'Nutrient Field Context', path: '/api/v1/fertilizers/field-context', auth: true },
    { name: 'Farms List', path: '/api/v1/farms', auth: true },
    { name: 'Fields List', path: '/api/v1/fields', auth: true },
    { name: 'Crop Cycles', path: '/api/v1/crop-cycles', auth: true },
    { name: 'Tasks', path: '/api/v1/tasks', auth: true },
    { name: 'Weather', path: '/api/v1/weather' },
    { name: 'Mandi Prices', path: '/api/v1/market/prices' },
    { name: 'Mandi Filters', path: '/api/v1/market/filters' },
  ];

  for (const api of apiChecks) {
    const res = await fetch(`${BASE_URL}${api.path}`, {
      headers: api.auth ? authHeaders : undefined,
    });
    if (res.ok) {
      const json = await res.json();
      const count = Array.isArray(json.data)
        ? json.data.length
        : json.data?.products
        ? json.data.products.length
        : json.data?.items
        ? json.data.items.length
        : json.data?.guidances
        ? json.data.guidances.length
        : json.data
        ? 'Object'
        : 'OK';
      console.log(`✓ [API 200] ${api.name.padEnd(25)} (${api.path}) -> Count/Data: ${count}`);
    } else {
      console.log(`x [API FAIL] ${api.name.padEnd(25)} (${api.path}) -> Status: ${res.status}`);
    }
  }

  console.log('\n====================================================');
  console.log('AUDIT COMPLETE: All core security & routes evaluated.');
  console.log('====================================================\n');
}

runAudit().catch(console.error);
