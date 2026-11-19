#!/usr/bin/env node
/**
 * Test: Completely Unrestricted Email + Password Sign-In
 * Verifies that email verification status does NOT block login.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log('\n======================================================');
  console.log('🧪 VERIFYING UNRESTRICTED EMAIL + PASSWORD SIGN-IN');
  console.log('======================================================\n');

  try {
    // 1. Test Existing Unverified Account: dhruv99h@gmail.com (Karan Patel)
    console.log('--- TEST 1: Existing Unverified Account Login ---');
    const unverifiedUser = await prisma.user.findFirst({
      where: { email: 'dhruv99h@gmail.com' },
    });

    assert(Boolean(unverifiedUser), 'Found existing user dhruv99h@gmail.com in DB');
    assert(unverifiedUser?.emailVerifiedAt === null, 'User dhruv99h@gmail.com has emailVerifiedAt === null (Unverified)');

    // Ensure we know the password or set a known password hash for testing
    const testPassword = 'TestPassword123!';
    const testHash = await bcrypt.hash(testPassword, 10);
    await prisma.user.update({
      where: { id: unverifiedUser.id },
      data: { passwordHash: testHash },
    });

    // Attempt login for unverified user
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dhruv99h@gmail.com',
        password: testPassword,
      }),
    });

    const loginData = await loginRes.json();
    assert(loginRes.status === 200, `Unverified user logs in successfully with HTTP 200 (Got ${loginRes.status})`);
    assert(loginData.code !== 'EMAIL_NOT_VERIFIED', 'Does not return EMAIL_NOT_VERIFIED error');
    assert(loginData.data?.defaultRedirect === '/dashboard', 'Redirects to /dashboard');

    const cookieHeader = loginRes.headers.get('set-cookie') || '';
    assert(cookieHeader.includes('smartfarm_token'), 'Sets authenticated smartfarm_token cookie');

    // Extract token
    const tokenMatch = cookieHeader.match(/smartfarm_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';

    // Verify unverified user can access dashboard API with their token
    const dashRes = await fetch(`${BASE_URL}/api/v1/dashboard/summary`, {
      headers: { Cookie: `smartfarm_token=${token}` },
    });
    assert(dashRes.status === 200, `Unverified user accesses /api/v1/dashboard/summary with HTTP 200 (Got ${dashRes.status})`);

    // 2. Test Newly Created Unverified Account
    console.log('\n--- TEST 2: Brand New Unverified Account Login ---');
    const newEmail = `brand_new_farmer_${Date.now()}@smartfarm.ai`;
    const newUser = await prisma.user.create({
      data: {
        email: newEmail,
        name: 'New Unverified Farmer',
        passwordHash: testHash,
        emailVerifiedAt: null, // explicitly unverified
      },
    });

    const newLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail,
        password: testPassword,
      }),
    });

    assert(newLoginRes.status === 200, `Brand new unverified account logs in with HTTP 200 (Got ${newLoginRes.status})`);
    await prisma.user.delete({ where: { id: newUser.id } });
    console.log('  Cleaned up brand new test user.');

    // 3. Test Existing Verified Account
    console.log('\n--- TEST 3: Existing Verified Account Login ---');
    const verifiedUser = await prisma.user.findFirst({
      where: { email: 'admin@smartfarm.ai' },
    });
    assert(verifiedUser?.emailVerifiedAt !== null, 'admin@smartfarm.ai is verified');

    await prisma.user.update({
      where: { id: verifiedUser.id },
      data: { passwordHash: testHash },
    });

    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smartfarm.ai',
        password: testPassword,
      }),
    });
    assert(adminLoginRes.status === 200, 'Verified account logs in with HTTP 200');

    // 4. Test Bad Password
    console.log('\n--- TEST 4: Invalid Password Rejection ---');
    const badPwRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dhruv99h@gmail.com',
        password: 'WrongPassword!',
      }),
    });
    assert(badPwRes.status === 401, 'Bad password rejected with 401');

    // 5. Test Unknown Email
    console.log('\n--- TEST 5: Unknown Email Rejection ---');
    const unknownRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody_here_99999@smartfarm.ai',
        password: testPassword,
      }),
    });
    assert(unknownRes.status === 401, 'Unknown email rejected with 401');

    console.log('\n======================================================');
    console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
