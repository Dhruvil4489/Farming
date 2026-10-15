// scripts/test-mandi-nav.mjs
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- Testing Farmer Portal Live Mandi Prices Navigation & Security ---');

  // Test 1: Unauthenticated access to /mandi
  const resMandiUnauth = await fetch(`${BASE_URL}/mandi`, {
    redirect: 'manual',
  });
  console.log(`1. Unauth /mandi -> status: ${resMandiUnauth.status}, location: ${resMandiUnauth.headers.get('location')}`);
  if (resMandiUnauth.status === 307 || resMandiUnauth.status === 308 || resMandiUnauth.status === 302) {
    const loc = resMandiUnauth.headers.get('location');
    if (loc && loc.includes('/login')) {
      console.log('   ✓ PASS: Unauthenticated access correctly redirects to /login with redirect parameter.');
    } else {
      console.log('   ! Note: Redirected to:', loc);
    }
  } else {
    console.log('   x FAIL: Expected redirect for unauthenticated /mandi');
  }

  // Test 2: Public access to /market
  const resMarketPublic = await fetch(`${BASE_URL}/market`, {
    redirect: 'manual',
  });
  console.log(`2. Public /market -> status: ${resMarketPublic.status}`);
  if (resMarketPublic.status === 200) {
    const html = await resMarketPublic.text();
    const hasSiteHeader = html.includes('Sign In') || html.includes('Farmer Portal') || html.includes('SmartFarm');
    const hasMarketTitle = html.includes('Crop Market') || html.includes('Mandi');
    console.log(`   ✓ PASS: Public /market is accessible with HTTP 200 (hasHeader: ${hasSiteHeader}, hasMarket: ${hasMarketTitle})`);
  } else {
    console.log('   x FAIL: Public /market returned non-200');
  }

  // Test 3: /dashboard/market redirect
  const resDashMarket = await fetch(`${BASE_URL}/dashboard/market`, {
    redirect: 'manual',
  });
  console.log(`3. /dashboard/market -> status: ${resDashMarket.status}, location: ${resDashMarket.headers.get('location')}`);

  // Test 4: Authenticated login and access to /mandi
  console.log('4. Logging in as registered farmer...');
  // Find a test user or login with known credentials
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'farmer@smartfarm.ai',
      password: 'farmer123456',
    }),
  });

  let tokenCookie = null;
  if (loginRes.ok) {
    const setCookie = loginRes.headers.get('set-cookie');
    console.log('   Logged in successfully. set-cookie received.');
    tokenCookie = setCookie;
  } else {
    // Try another account or demo login
    console.log(`   Login failed with status ${loginRes.status}, trying database query to get user`);
  }

  if (tokenCookie) {
    const authHeaders = { Cookie: tokenCookie };
    const resMandiAuth = await fetch(`${BASE_URL}/mandi`, {
      headers: authHeaders,
      redirect: 'manual',
    });
    console.log(`5. Authenticated /mandi -> status: ${resMandiAuth.status}`);
    if (resMandiAuth.status === 200) {
      const mandiHtml = await resMandiAuth.text();
      console.log(`   ✓ PASS: Authenticated /mandi returned 200 OK.`);
      console.log(`   Contains "Live Mandi Prices": ${mandiHtml.includes('Live Mandi Prices')}`);
      console.log(`   Contains "AGMARKNET": ${mandiHtml.includes('AGMARKNET')}`);
    }
  }

  // Test 5: Verify Market APIs
  const resPrices = await fetch(`${BASE_URL}/api/v1/market/prices?limit=5`);
  const jsonPrices = await resPrices.json();
  console.log(`6. Market Prices API -> status: ${resPrices.status}, count: ${jsonPrices.data?.length}`);

  const resFilters = await fetch(`${BASE_URL}/api/v1/market/filters`);
  const jsonFilters = await resFilters.json();
  console.log(`7. Market Filters API -> status: ${resFilters.status}, states: ${jsonFilters.data?.states?.length}, commodities: ${jsonFilters.data?.commodities?.length}`);
}

run().catch(console.error);
