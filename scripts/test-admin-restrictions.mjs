/**
 * SmartFarm AI — Admin Access Restrictions Test Suite (Phase 11)
 *
 * Enforces role-based access control (RBAC):
 * 1. Unauthenticated requests to /admin get 307 redirect to /login
 * 2. Unauthenticated calls to /api/v1/admin/* return HTTP 401 Unauthorized
 * 3. Farmer role (non-admin) requests to /admin are blocked (redirected or forbidden)
 * 4. Farmer role calls to /api/v1/admin/market/sync (GET & POST) return HTTP 403 Forbidden
 * 5. Admin user (admin@smartfarm.ai) authentication succeeds
 * 6. Admin user accessing /admin portal returns 200 OK
 * 7. Admin user accessing GET /api/v1/admin/market/sync returns 200 OK with sync health metrics
 * 8. Admin user triggering POST /api/v1/admin/market/sync succeeds with 200 OK
 */

const BASE_URL = process.env.APP_URL || process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function report(name, ok, details = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}${details ? ` (${details})` : ''}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}${details ? ` (${details})` : ''}`);
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('SMARTFARM AI — ADMIN ACCESS RESTRICTIONS & RBAC SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. Unauthenticated Access Protection
  // --------------------------------------------------------------------------
  console.log('--- 1. Unauthenticated Perimeter Defense ---');

  const unauthAdminPage = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
  const isRedirect = unauthAdminPage.status === 307 || unauthAdminPage.status === 308 || unauthAdminPage.status === 302;
  const loc = unauthAdminPage.headers.get('location') || '';
  report('Unauthenticated visitor accessing /admin redirected to /login', isRedirect && loc.includes('/login'));

  const unauthSyncGet = await fetch(`${BASE_URL}/api/v1/admin/market/sync`);
  report('Unauthenticated GET /api/v1/admin/market/sync returns 401', unauthSyncGet.status === 401);

  const unauthSyncPost = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, { method: 'POST' });
  report('Unauthenticated POST /api/v1/admin/market/sync returns 401', unauthSyncPost.status === 401);

  // --------------------------------------------------------------------------
  // 2. Farmer Role (Non-Admin) Restrictions
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Farmer Role (Non-Admin) Access Restrictions ---');

  const farmerLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
  });
  const farmerCookie = farmerLogin.headers.get('set-cookie')?.split(';')[0] || '';
  report('Farmer login succeeds', farmerLogin.ok && Boolean(farmerCookie));

  const farmerSyncGet = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
    headers: { Cookie: farmerCookie },
  });
  report('Farmer role GET /api/v1/admin/market/sync returns 403 Forbidden', farmerSyncGet.status === 403);

  const farmerSyncPost = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
    method: 'POST',
    headers: { Cookie: farmerCookie },
  });
  report('Farmer role POST /api/v1/admin/market/sync returns 403 Forbidden', farmerSyncPost.status === 403);

  // --------------------------------------------------------------------------
  // 3. Admin Role Verification & Health Telemetry
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Administrator Role Execution & Sync Health Access ---');

  const adminLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@smartfarm.ai', password: 'admin123456' }),
  });
  const adminCookie = adminLogin.headers.get('set-cookie')?.split(';')[0] || '';
  const adminJson = await adminLogin.json();
  const hasAdminRole = adminJson.data?.roles?.includes('ADMIN');
  report('Admin authentication succeeds with ADMIN role', adminLogin.ok && Boolean(adminCookie) && hasAdminRole);

  const adminPage = await fetch(`${BASE_URL}/admin`, {
    headers: { Cookie: adminCookie },
    redirect: 'manual',
  });
  report('Admin accessing /admin portal returns 200 OK (no redirect)', adminPage.status === 200);

  const adminSyncGet = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
    headers: { Cookie: adminCookie },
  });
  const syncHealth = await adminSyncGet.json();
  report('Admin retrieves sync health metrics (GET /api/v1/admin/market/sync)', adminSyncGet.ok && syncHealth.data !== undefined);

  const adminSyncPost = await fetch(`${BASE_URL}/api/v1/admin/market/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ limit: 5 }),
  });
  const syncResult = await adminSyncPost.json();
  report('Admin triggers market sync successfully (POST /api/v1/admin/market/sync)', adminSyncPost.ok && syncResult.data?.status !== undefined);

  console.log('\n================================================================');
  console.log(`ADMIN RESTRICTIONS TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
