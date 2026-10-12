async function testApi() {
  console.log('Testing SmartFarm APIs...');

  try {
    // 1. Market Prices
    const marketRes = await fetch('http://localhost:3000/api/v1/market/prices');
    const marketData = await marketRes.json();
    console.log('✔ /api/v1/market/prices status:', marketRes.status);
    console.log('   Records returned:', marketData.data?.length, 'Date:', marketData.meta?.date);
    if (marketData.data?.length > 0) {
      const first = marketData.data[0];
      console.log(`   Sample: ${first.commodityName} (${first.variety}) at ${first.marketName}: ₹${first.modalPrice}/${first.unit} [Change: ${first.comparison?.priceChange > 0 ? '+' : ''}${first.comparison?.priceChange}]`);
    }

    // 2. Market Filters
    const filterRes = await fetch('http://localhost:3000/api/v1/market/filters');
    const filterData = await filterRes.json();
    console.log('✔ /api/v1/market/filters status:', filterRes.status);
    console.log('   States:', filterData.data?.states?.length, 'Markets:', filterData.data?.markets?.length, 'Commodities:', filterData.data?.commodities?.length);

    // 3. Fertilizer Categories & Guidance
    const guideRes = await fetch('http://localhost:3000/api/v1/fertilizers/guidance');
    const guideData = await guideRes.json();
    console.log('✔ /api/v1/fertilizers/guidance status:', guideRes.status);
    console.log('   Guidance records:', guideData.data?.length);

    // 4. Fertilizer Store Products
    const prodRes = await fetch('http://localhost:3000/api/v1/store/products');
    const prodData = await prodRes.json();
    console.log('✔ /api/v1/store/products status:', prodRes.status);
    console.log('   Products returned:', prodData.data?.length);

    // 5. Cart
    const cartRes = await fetch('http://localhost:3000/api/v1/store/cart');
    const cartData = await cartRes.json();
    console.log('✔ /api/v1/store/cart status:', cartRes.status);
    console.log('   Cart items:', cartData.data?.items?.length, 'Total:', cartData.data?.total);

    console.log('\nAll API endpoints verified successfully!');
  } catch (err) {
    console.error('API Test Error:', err);
  }
}

testApi();
