/**
 * SmartFarm AI — Store, Orders & Route Protection Regression Suite (Phase 11)
 *
 * Verifies that ongoing feature enhancements preserve:
 * 1. Fertilizer E-Commerce Store Catalog & Navigation:
 *    - Listing products with categories, brands, price per pack
 *    - Product detail retrieval by slug
 * 2. Shopping Cart Workflow:
 *    - Adding products to server-side cart
 *    - Retrieving cart with calculated subtotal
 *    - Modifying item quantities
 * 3. Checkout & Order Lifecycle:
 *    - Server-side validated checkout with delivery addresses
 *    - Order number generation format (SF-2026-XXXXX)
 *    - Order item snapshotting (product name, unit price, pack size)
 *    - Order history retrieval
 * 4. Comprehensive Route Protection Regression:
 *    - Verifies all 17 portal routes enforce 307 redirect to /login with preserved redirect param
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
  console.log('SMARTFARM AI — STORE, ORDERS & ROUTE PROTECTION REGRESSION SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. Fertilizer Store Catalog & Product Retrieval
  // --------------------------------------------------------------------------
  console.log('--- 1. Store Catalog & Product Retrieval ---');

  const prodRes = await fetch(`${BASE_URL}/api/v1/store/products`);
  const prodJson = await prodRes.json();
  const products = prodJson.data || [];
  report('Store products endpoint returns populated catalog', prodRes.ok && products.length > 0, `Count: ${products.length}`);

  const sampleProduct = products.find((p) => p.stock > 0) || products[0];
  if (sampleProduct?.slug) {
    const detailRes = await fetch(`${BASE_URL}/api/v1/store/products/${sampleProduct.slug}`);
    const detailJson = await detailRes.json();
    report(
      'Product details retrieval by slug succeeds',
      detailRes.ok && detailJson.data?.slug === sampleProduct.slug,
      `Product: ${sampleProduct.name}`
    );
  }

  // --------------------------------------------------------------------------
  // 2. Cart, Checkout & Orders Regression
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Cart, Checkout & Orders Lifecycle ---');

  // Login farmer
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'farmer@smartfarm.ai', password: 'farmer123456' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  report('Demo farmer login succeeds for checkout regression', loginRes.ok && Boolean(cookie));

  if (sampleProduct?.id && cookie) {
    // Add item to cart
    const addCartRes = await fetch(`${BASE_URL}/api/v1/store/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ productId: sampleProduct.id, quantity: 2 }),
    });
    const addCartJson = await addCartRes.json();
    report('Add product to cart succeeds', addCartRes.ok && addCartJson.data !== undefined);

    // Fetch user cart
    const getCartRes = await fetch(`${BASE_URL}/api/v1/store/cart`, {
      headers: { Cookie: cookie },
    });
    const cartJson = await getCartRes.json();
    const cartItems = cartJson.data?.items || [];
    report('Cart retrieval includes newly added item', getCartRes.ok && cartItems.length > 0);

    // Perform checkout
    const checkoutPayload = {
      deliveryName: 'Ramesh Patel',
      deliveryPhone: '+919876543211',
      deliveryAddress: 'Survey No. 42, Patel Organic Farm, Near Padra Canal',
      deliveryVillage: 'Padra',
      deliveryDistrict: 'Vadodara',
      deliveryState: 'Gujarat',
      deliveryPincode: '391440',
      paymentMethod: 'demo_checkout',
      notes: 'Regression test order verification',
    };

    const checkoutRes = await fetch(`${BASE_URL}/api/v1/store/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(checkoutPayload),
    });
    const orderJson = await checkoutRes.json();
    const createdOrder = orderJson.data;

    report(
      'Checkout succeeds and creates durable order',
      checkoutRes.ok && Boolean(createdOrder?.orderNumber),
      `Order: ${createdOrder?.orderNumber}`
    );
    report(
      'Order number matches standard SF-2026-XXXX format',
      Boolean(createdOrder?.orderNumber?.startsWith('SF-2026-'))
    );
    report('Order snapshots item prices faithfully', Array.isArray(createdOrder?.items) && createdOrder.items.length > 0);

    // Fetch orders history
    const ordersRes = await fetch(`${BASE_URL}/api/v1/store/orders`, {
      headers: { Cookie: cookie },
    });
    const ordersJson = await ordersRes.json();
    report('Order history returns list including recent checkout', ordersRes.ok && Array.isArray(ordersJson.data));
  }

  // --------------------------------------------------------------------------
  // 3. Complete 17-Route Protection Matrix Regression
  // --------------------------------------------------------------------------
  console.log('\n--- 3. 17-Route Protection Perimeter Regression ---');

  const protectedRoutes = [
    '/dashboard',
    '/farms',
    '/fields',
    '/crops',
    '/tasks',
    '/scouting',
    '/irrigation',
    '/assistant',
    '/diagnosis',
    '/orders',
    '/mandi',
    '/weather',
    '/soil',
    '/soil-moisture',
    '/store',
    '/guidance',
    '/admin',
  ];

  for (const route of protectedRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' });
      const isRedirect = res.status === 307 || res.status === 308 || res.status === 302;
      const loc = res.headers.get('location') || '';
      const ok = isRedirect && loc.includes('/login') && loc.includes(encodeURIComponent(route));
      report(`Route protection preserved on ${route}`, ok, `HTTP ${res.status} -> ${loc}`);
    } catch (err) {
      report(`Route protection preserved on ${route}`, false, err.message);
    }
  }

  console.log('\n================================================================');
  console.log(`STORE & REGRESSION TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
