// Trace Registration and Login Flow Step by Step
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('--- 1. Testing Registration Endpoint ---');
  const testPhone = '9123456780';
  const testEmail = 'newfarmer_test@smartfarm.ai';
  const testPassword = 'Password123!';

  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: 'Test Farmer',
      phone: testPhone,
      email: testEmail,
      password: testPassword,
      state: 'Gujarat',
      district: 'Vadodara',
    }),
  });

  const regStatus = regRes.status;
  const regHeaders = Object.fromEntries(regRes.headers.entries());
  const regBody = await regRes.json();
  console.log('Registration Status:', regStatus);
  console.log('Registration Set-Cookie:', regRes.headers.get('set-cookie'));
  console.log('Registration Response Body:', JSON.stringify(regBody, null, 2));

  console.log('\n--- 2. Testing Login With Registered Email ---');
  const loginResEmail = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: testPassword,
    }),
  });

  console.log('Login (Email) Status:', loginResEmail.status);
  const loginEmailCookie = loginResEmail.headers.get('set-cookie');
  console.log('Login (Email) Set-Cookie:', loginEmailCookie);
  const loginEmailBody = await loginResEmail.json();
  console.log('Login (Email) Body:', JSON.stringify(loginEmailBody, null, 2));

  console.log('\n--- 3. Testing Login With Registered Phone ---');
  const loginResPhone = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      identifier: testPhone,
      password: testPassword,
    }),
  });

  console.log('Login (Phone) Status:', loginResPhone.status);
  const loginPhoneCookie = loginResPhone.headers.get('set-cookie');
  console.log('Login (Phone) Set-Cookie:', loginPhoneCookie);
  const loginPhoneBody = await loginResPhone.json();
  console.log('Login (Phone) Body:', JSON.stringify(loginPhoneBody, null, 2));

  console.log('\n--- 4. Testing Dashboard Route & Data With Cookie ---');
  // Extract token from Set-Cookie header
  const rawCookie = loginEmailCookie || loginPhoneCookie;
  let token = '';
  if (rawCookie) {
    const match = rawCookie.match(/smartfarm_token=([^;]+)/);
    if (match) token = match[1];
  }
  console.log('Extracted Token exists?', !!token);

  if (token) {
    const dashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        Cookie: `smartfarm_token=${token}`,
      },
      redirect: 'manual', // do not follow redirect automatically
    });
    console.log('Dashboard GET Status:', dashRes.status);
    console.log('Dashboard Location Header:', dashRes.headers.get('location'));

    const summaryRes = await fetch(`${BASE_URL}/api/v1/dashboard/summary`, {
      headers: {
        Cookie: `smartfarm_token=${token}`,
        Accept: 'application/json',
      },
    });
    console.log('Summary API GET Status:', summaryRes.status);
    const summaryBody = await summaryRes.json();
    console.log('Summary API Body:', JSON.stringify(summaryBody, null, 2));
  }
}

main().catch(console.error);
