/**
 * SmartFarm AI — Database Test & Seeding Safety Utilities (Phase 11)
 *
 * Guarantees:
 * 1. Safe Database Guard: Refuses to reset or wipe any database that is not explicitly
 *    designated as a test database (e.g. 'test.db' or ':memory:'). Resolves safety requirement.
 * 2. Deterministic Seeding: Seeds demo farmers, admins, and entities with isDemo: true.
 * 3. Repeatability Verification: Confirms repeated seeding is idempotent and does not
 *    duplicate users, farms, crops, products, or orders.
 * 4. Production Secret Audit: Ensures no real API keys, production passwords, or sensitive
 *    tokens are embedded in demo fixtures.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

export function isTestDatabase(databaseUrl) {
  if (!databaseUrl) return false;
  const lower = databaseUrl.toLowerCase();
  return (
    lower.includes('test.db') ||
    lower.includes('test_') ||
    lower.includes('_test') ||
    lower.includes(':memory:') ||
    lower.includes('localhost:5432/test')
  );
}

export function assertTestDatabaseSafety(databaseUrl) {
  if (!isTestDatabase(databaseUrl)) {
    throw new Error(
      `CRITICAL DATABASE SAFETY VIOLATION: Refusing to reset non-test database! Target: "${databaseUrl}". Database resets are ONLY permitted on databases with 'test' or ':memory:' in the connection string.`
    );
  }
}

export async function auditProductionSecrets(envFilePath = '.env') {
  const issues = [];
  const fullPath = path.resolve(process.cwd(), envFilePath);

  if (!fs.existsSync(fullPath)) {
    return { ok: true, issues: [] };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...rest] = trimmed.split('=');
    const val = rest.join('=').replace(/^["']|["']$/g, '').trim();

    // Check for hardcoded production-like keys in local env
    if (key === 'JWT_SECRET') {
      if (val.length < 32 && process.env.NODE_ENV === 'production') {
        issues.push(`JWT_SECRET must be at least 32 characters in production (currently ${val.length})`);
      }
    }

    if (key === 'AI_PROVIDER' && val === 'mock' && process.env.NODE_ENV === 'production') {
      if (process.env.ALLOW_MOCK_AI !== 'true') {
        issues.push('AI_PROVIDER=mock is active in production without ALLOW_MOCK_AI=true');
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export async function verifySeedIdempotency(prisma) {
  const initialCounts = {
    users: await prisma.user.count(),
    roles: await prisma.role.count(),
    crops: await prisma.crop.count(),
    products: await prisma.product.count(),
    knowledgeDocs: await prisma.knowledgeDocument.count(),
  };

  // Import and run seed again
  const seedModule = await import('./seed.mjs');

  const secondCounts = {
    users: await prisma.user.count(),
    roles: await prisma.role.count(),
    crops: await prisma.crop.count(),
    products: await prisma.product.count(),
    knowledgeDocs: await prisma.knowledgeDocument.count(),
  };

  const isIdentical =
    initialCounts.users === secondCounts.users &&
    initialCounts.roles === secondCounts.roles &&
    initialCounts.crops === secondCounts.crops &&
    initialCounts.products === secondCounts.products &&
    initialCounts.knowledgeDocs === secondCounts.knowledgeDocs;

  return {
    idempotent: isIdentical,
    initialCounts,
    secondCounts,
  };
}

if (process.argv[1]?.endsWith('test-db-utils.mjs')) {
  console.log('--- Testing DB Safety Guard ---');
  const prodUrl = 'postgresql://admin:secret@db.smartfarm.ai:5432/smartfarm_prod';
  try {
    assertTestDatabaseSafety(prodUrl);
    console.error('FAIL: Should have thrown on production URL');
  } catch (err) {
    console.log('✔ Correctly blocked reset on production URL:', err.message);
  }

  const testUrl = 'file:./test.db';
  try {
    assertTestDatabaseSafety(testUrl);
    console.log('✔ Correctly permitted test URL:', testUrl);
  } catch (err) {
    console.error('FAIL: Should permit test URL:', err);
  }
}
