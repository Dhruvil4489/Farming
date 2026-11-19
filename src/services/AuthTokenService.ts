/**
 * SmartFarm AI — Cryptographic Auth Token Service
 * Handles Email Verification, Password Reset & Safe Legacy Email Migration tokens + 6-digit OTPs.
 * Stores only SHA-256 hashes in DB.
 * Uses native Prisma `authToken` delegate with automatic parameterized SQL fallback so an
 * un-restarted HMR dev server can never fail with `Cannot read properties of undefined`.
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export type AuthTokenType = 'email_verification' | 'password_reset' | 'email_migration';

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function isSqliteDb(): boolean {
  return !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
}

function parseDbTimestampMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    return Date.parse(trimmed);
  }
  return NaN;
}

function hasNativeAuthTokenDelegate(db: any): boolean {
  try {
    return Boolean(
      db &&
      db.authToken &&
      !db.authToken.isResilientFallback &&
      typeof db.authToken.create === 'function'
    );
  } catch {
    return false;
  }
}

export class AuthTokenService {
  /**
   * Generates a single-use cryptographic link token and a 6-digit numeric OTP.
   * Invalidates any previous unused tokens of the same type for this user.
   */
  static async createToken(
    userId: string,
    type: AuthTokenType,
    options: { pendingEmail?: string | null; db?: any } = {}
  ) {
    const db = options.db || prisma;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const otpCode = String(crypto.randomInt(100000, 999999));
    const ttlMs = type === 'password_reset' ? 30 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    const tokenHash = sha256(rawToken);
    const otpCodeHash = sha256(otpCode);
    const pendingEmail = options.pendingEmail ? options.pendingEmail.trim().toLowerCase() : null;

    if (hasNativeAuthTokenDelegate(db)) {
      try {
        await db.authToken.updateMany({
          where: { userId, type, usedAt: null },
          data: { usedAt: now },
        });

        await db.authToken.create({
          data: {
            userId,
            type,
            tokenHash,
            otpCodeHash,
            pendingEmail,
            expiresAt,
          },
        });
        return { rawToken, otpCode, expiresAt };
      } catch (err: any) {
        // If HMR PrismaClient doesn't recognize newly added `pendingEmail` column yet, fall through to parameterized SQL
        if (!String(err?.message || '').includes('Unknown argument') && !String(err?.message || '').includes('undefined')) {
          throw err;
        }
      }
    }

    // Parameterized SQL fallback (works uniformly on SQLite & PostgreSQL)
    const sqlite = isSqliteDb();
    const p = (idx: number) => (sqlite ? '?' : `$${idx}`);
    const id = crypto.randomUUID();

    await db.$executeRawUnsafe(
      `UPDATE "AuthToken" SET "usedAt" = ${p(1)} WHERE "userId" = ${p(2)} AND "type" = ${p(3)} AND "usedAt" IS NULL`,
      now.toISOString(),
      userId,
      type
    );

    await db.$executeRawUnsafe(
      `INSERT INTO "AuthToken" ("id","userId","type","tokenHash","otpCodeHash","pendingEmail","expiresAt","createdAt") VALUES (${p(1)},${p(2)},${p(3)},${p(4)},${p(5)},${p(6)},${p(7)},${p(8)})`,
      id,
      userId,
      type,
      tokenHash,
      otpCodeHash,
      pendingEmail,
      expiresAt.toISOString(),
      now.toISOString()
    );

    return { rawToken, otpCode, expiresAt };
  }

  /**
   * Validates and consumes a link token. Returns `{ user, pendingEmail, type }` or null.
   */
  static async consumeByToken(rawToken: string, types: AuthTokenType | AuthTokenType[]) {
    const tokenHash = sha256(rawToken.trim());
    const typeList = Array.isArray(types) ? types : [types];
    const now = new Date();

    if (hasNativeAuthTokenDelegate(prisma)) {
      try {
        const record = await prisma.authToken.findFirst({
          where: {
            tokenHash,
            type: { in: typeList },
            usedAt: null,
            expiresAt: { gt: now },
          },
          include: { user: true },
        });
        if (!record) return null;

        await prisma.authToken.update({
          where: { id: record.id },
          data: { usedAt: now },
        });

        return {
          user: record.user,
          pendingEmail: record.pendingEmail,
          type: record.type as AuthTokenType,
        };
      } catch (err: any) {
        if (!String(err?.message || '').includes('Unknown') && !String(err?.message || '').includes('undefined')) {
          throw err;
        }
      }
    }

    const sqlite = isSqliteDb();
    const p = (idx: number) => (sqlite ? '?' : `$${idx}`);
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "AuthToken" WHERE "tokenHash" = ${p(1)} AND "usedAt" IS NULL LIMIT 1`,
      tokenHash
    );
    const rec = rows?.[0];
    if (!rec || !typeList.includes(rec.type)) return null;
    const expiresMs = parseDbTimestampMs(rec.expiresAt);
    if (!Number.isFinite(expiresMs) || expiresMs <= now.getTime()) return null;

    const user = await prisma.user.findUnique({ where: { id: rec.userId } });
    if (!user || user.deletedAt) return null;

    await prisma.$executeRawUnsafe(
      `UPDATE "AuthToken" SET "usedAt" = ${p(1)} WHERE "id" = ${p(2)}`,
      now.toISOString(),
      rec.id
    );

    return {
      user,
      pendingEmail: rec.pendingEmail || null,
      type: rec.type as AuthTokenType,
    };
  }

  /**
   * Validates and consumes a 6-digit OTP for a given normalized email address.
   */
  static async consumeByEmailOtp(
    email: string,
    otpCode: string,
    types: AuthTokenType | AuthTokenType[]
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const typeList = Array.isArray(types) ? types : [types];
    const otpHash = sha256(otpCode.trim());
    const now = new Date();

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    if (hasNativeAuthTokenDelegate(prisma)) {
      try {
        if (user) {
          const record = await prisma.authToken.findFirst({
            where: {
              userId: user.id,
              type: { in: typeList },
              otpCodeHash: otpHash,
              usedAt: null,
              expiresAt: { gt: now },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (record) {
            await prisma.authToken.update({ where: { id: record.id }, data: { usedAt: now } });
            return { user, pendingEmail: record.pendingEmail, type: record.type as AuthTokenType };
          }
        }

        if (typeList.includes('email_migration')) {
          const migRecord = await prisma.authToken.findFirst({
            where: {
              pendingEmail: normalizedEmail,
              type: 'email_migration',
              otpCodeHash: otpHash,
              usedAt: null,
              expiresAt: { gt: now },
            },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
          });
          if (migRecord && migRecord.user && !migRecord.user.deletedAt) {
            await prisma.authToken.update({ where: { id: migRecord.id }, data: { usedAt: now } });
            return {
              user: migRecord.user,
              pendingEmail: migRecord.pendingEmail,
              type: 'email_migration' as AuthTokenType,
            };
          }
        }
        return null;
      } catch (err: any) {
        if (!String(err?.message || '').includes('Unknown') && !String(err?.message || '').includes('undefined')) {
          throw err;
        }
      }
    }

    const sqlite = isSqliteDb();
    const p = (idx: number) => (sqlite ? '?' : `$${idx}`);
    if (user) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "AuthToken" WHERE "userId" = ${p(1)} AND "otpCodeHash" = ${p(2)} AND "usedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`,
        user.id,
        otpHash
      );
      const rec = rows?.[0];
      const expiresMs = rec ? parseDbTimestampMs(rec.expiresAt) : NaN;
      if (rec && typeList.includes(rec.type) && Number.isFinite(expiresMs) && expiresMs > now.getTime()) {
        await prisma.$executeRawUnsafe(
          `UPDATE "AuthToken" SET "usedAt" = ${p(1)} WHERE "id" = ${p(2)}`,
          now.toISOString(),
          rec.id
        );
        return { user, pendingEmail: rec.pendingEmail || null, type: rec.type as AuthTokenType };
      }
    }

    if (typeList.includes('email_migration')) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "AuthToken" WHERE "pendingEmail" = ${p(1)} AND "type" = 'email_migration' AND "otpCodeHash" = ${p(2)} AND "usedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`,
        normalizedEmail,
        otpHash
      );
      const rec = rows?.[0];
      const expiresMs = rec ? parseDbTimestampMs(rec.expiresAt) : NaN;
      if (rec && Number.isFinite(expiresMs) && expiresMs > now.getTime()) {
        const migUser = await prisma.user.findUnique({ where: { id: rec.userId } });
        if (migUser && !migUser.deletedAt) {
          await prisma.$executeRawUnsafe(
            `UPDATE "AuthToken" SET "usedAt" = ${p(1)} WHERE "id" = ${p(2)}`,
            now.toISOString(),
            rec.id
          );
          return { user: migUser, pendingEmail: rec.pendingEmail, type: 'email_migration' as AuthTokenType };
        }
      }
    }

    return null;
  }
}
