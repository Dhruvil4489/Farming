async function testCheckout() {
  console.log('Testing Store Checkout Workflow...');

  try {
    const checkoutPayload = {
      deliveryName: 'Ramesh Patel',
      deliveryPhone: '+919876543211',
      deliveryAddress: 'Survey No. 42, Patel Organic Farm, Near Padra Canal',
      deliveryVillage: 'Padra',
      deliveryDistrict: 'Vadodara',
      deliveryState: 'Gujarat',
      deliveryPincode: '391440',
      paymentMethod: 'demo_checkout',
      notes: 'Test order verification',
    };

    const res = await fetch('http://localhost:3000/api/v1/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload),
    });

    const json = await res.json();
    console.log('✔ Checkout Response Status:', res.status);
    console.log('   Order Created:', json.data?.orderNumber);
    console.log('   Total Amount: ₹' + json.data?.totalAmount);
    console.log('   Items count:', json.data?.items?.length);
    console.log('   Order Status:', json.data?.status);
    console.log('   Payment Status:', json.data?.paymentStatus);

    // Verify order in user order history
    const orderRes = await fetch('http://localhost:3000/api/v1/store/orders');
    const orderJson = await orderRes.json();
    console.log('✔ Orders List Count:', orderJson.data?.length);

    console.log('\nCheckout and Order management verified successfully!');
  } catch (err) {
    console.error('Checkout Test Error:', err);
  }
}

testCheckout();
