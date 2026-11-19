/**
 * Safe Additive Auth Schema & Existing Account Compatibility Migration
 * 1. Adds AuthToken.pendingEmail column if missing (for verified legacy email migration).
 * 2. Syncs prisma/schema.sqlite.prisma and prisma/schema.postgres.prisma.
 * 3. Grandfathers pre-existing accounts that ALREADY had a valid email address (setting
 *    emailVerifiedAt = createdAt) so existing users are not locked out when strict email
 *    verification enforcement activates for new registrations.
 * 4. NEVER invents emails for legacy mobile-only accounts (email IS NULL) and NEVER deletes any user data.
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info("AuthToken")`);
  if (!cols.some((c) => c.name === 'pendingEmail')) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "AuthToken" ADD COLUMN "pendingEmail" TEXT`);
    console.log('[+] Added AuthToken.pendingEmail');
  }

  // Sync sqlite & postgres schemas
  const baseSchema = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  fs.writeFileSync(path.join(process.cwd(), 'prisma/schema.sqlite.prisma'), baseSchema, 'utf8');
  fs.writeFileSync(
    path.join(process.cwd(), 'prisma/schema.postgres.prisma'),
    baseSchema.replace('provider = "sqlite"', 'provider = "postgresql"'),
    'utf8'
  );

  // Normalize any uppercase existing emails to lowercase & grandfather pre-existing email accounts
  const existingEmailUsers = await prisma.user.findMany({
    where: { email: { not: null }, deletedAt: null },
    select: { id: true, email: true, emailVerifiedAt: true, createdAt: true },
  });

  let grandfathered = 0;
  for (const u of existingEmailUsers) {
    const cleanEmail = u.email.trim().toLowerCase();
    const updates = {};
    if (cleanEmail !== u.email) updates.email = cleanEmail;
    if (!u.emailVerifiedAt) {
      updates.emailVerifiedAt = u.createdAt || new Date();
      grandfathered++;
    }
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { id: u.id }, data: updates });
    }
  }

  const legacyMobileOnly = await prisma.user.count({
    where: { email: null, deletedAt: null },
  });

  console.log(
    `Migration complete: Grandfathered ${grandfathered} pre-existing email accounts. Preserved ${legacyMobileOnly} legacy mobile-only accounts untouched (zero fabricated emails).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
