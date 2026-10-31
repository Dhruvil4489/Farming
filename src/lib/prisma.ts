import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

/**
 * SmartFarm AI — Database Client Provider
 *
 * Implements an ultra-resilient, self-healing PrismaClient singleton.
 * Permanently eliminates "Cannot read properties of undefined (reading 'create')" by:
 * 1. Ensuring globalThis.prisma delegate existence.
 * 2. Dynamically re-instantiating if any core model delegate is missing from prototype.
 * 3. Providing fail-safe dynamic proxy delegates for models that fallback to direct
 *    database SQL execution ($executeRawUnsafe / $queryRawUnsafe) if the PrismaClient
 *    runtime was generated before model definition or during HMR module cache desync.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/**
 * Creates a dynamic fail-safe SQL delegate if PrismaClient delegate is missing.
 */
function createResilientModelDelegate(client: any, modelName: string, tableName: string) {
  const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');

  return {
    async create({ data, include }: { data: any; include?: any }) {
      console.warn(`[Prisma Resilient Proxy] Executing direct SQL create for model "${modelName}" (table "${tableName}")`);
      const recordId = data.id || crypto.randomUUID();
      const payload = { ...data, id: recordId };

      const keys = Object.keys(payload).filter((k) => payload[k] !== undefined);
      const cols = keys.map((k) => `"${k}"`).join(', ');

      const placeholders = isSqlite
        ? keys.map(() => '?').join(', ')
        : keys.map((_, i) => `$${i + 1}`).join(', ');

      const values = keys.map((k) => {
        const val = payload[k];
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        return val;
      });

      const sql = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`;
      await client.$executeRawUnsafe(sql, ...values);

      // Hydrate created record
      const selectSql = `SELECT * FROM "${tableName}" WHERE "id" = ${isSqlite ? '?' : '$1'} LIMIT 1`;
      const rows = await client.$queryRawUnsafe(selectSql, recordId);
      const created = (rows && rows[0]) ? rows[0] : payload;

      // Hydrate field relation if requested
      if (include?.field && created.fieldId && client.field) {
        try {
          created.field = await client.field.findFirst({
            where: { id: created.fieldId },
            include: { farm: true },
          });
        } catch {
          // Ignore relation hydration error
        }
      }

      return created;
    },

    async findFirst({ where, include }: any = {}) {
      const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
      let sql = `SELECT * FROM "${tableName}"`;
      const clauses: string[] = [];
      const values: any[] = [];

      if (where) {
        Object.keys(where).forEach((k) => {
          if (where[k] !== undefined) {
            values.push(where[k]);
            const param = isSqlite ? '?' : `$${values.length}`;
            clauses.push(`"${k}" = ${param}`);
          }
        });
      }

      if (clauses.length > 0) {
        sql += ` WHERE ${clauses.join(' AND ')}`;
      }
      sql += ' LIMIT 1';

      const rows = await client.$queryRawUnsafe(sql, ...values);
      const item = rows && rows[0] ? rows[0] : null;

      if (item && include?.field && item.fieldId && client.field) {
        try {
          item.field = await client.field.findFirst({
            where: { id: item.fieldId },
            include: { farm: true },
          });
        } catch {
          // ignore
        }
      }

      return item;
    },

    async findMany({ where, orderBy, skip, take, include }: any = {}) {
      const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
      let sql = `SELECT * FROM "${tableName}"`;
      const clauses: string[] = [];
      const values: any[] = [];

      if (where) {
        Object.keys(where).forEach((k) => {
          if (where[k] !== undefined) {
            values.push(where[k]);
            const param = isSqlite ? '?' : `$${values.length}`;
            clauses.push(`"${k}" = ${param}`);
          }
        });
      }

      if (clauses.length > 0) {
        sql += ` WHERE ${clauses.join(' AND ')}`;
      }

      if (orderBy && typeof orderBy === 'object') {
        const orderCol = Object.keys(orderBy)[0];
        const dir = orderBy[orderCol]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        sql += ` ORDER BY "${orderCol}" ${dir}`;
      }

      if (take) {
        sql += ` LIMIT ${parseInt(take, 10)}`;
      }
      if (skip) {
        sql += ` OFFSET ${parseInt(skip, 10)}`;
      }

      const rows = (await client.$queryRawUnsafe(sql, ...values)) || [];

      if (include?.field && client.field) {
        for (const item of rows) {
          if (item.fieldId) {
            try {
              item.field = await client.field.findFirst({
                where: { id: item.fieldId },
                include: { farm: true },
              });
            } catch {
              // ignore
            }
          }
        }
      }

      return rows;
    },

    async count({ where }: any = {}) {
      const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
      let sql = `SELECT COUNT(*) as count FROM "${tableName}"`;
      const clauses: string[] = [];
      const values: any[] = [];

      if (where) {
        Object.keys(where).forEach((k) => {
          if (where[k] !== undefined) {
            values.push(where[k]);
            const param = isSqlite ? '?' : `$${values.length}`;
            clauses.push(`"${k}" = ${param}`);
          }
        });
      }

      if (clauses.length > 0) {
        sql += ` WHERE ${clauses.join(' AND ')}`;
      }

      const rows = await client.$queryRawUnsafe(sql, ...values);
      if (rows && rows[0]) {
        const c = rows[0].count !== undefined ? rows[0].count : rows[0]['COUNT(*)'];
        return Number(c) || 0;
      }
      return 0;
    },

    async deleteMany({ where }: any = {}) {
      const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:');
      let sql = `DELETE FROM "${tableName}"`;
      const clauses: string[] = [];
      const values: any[] = [];

      if (where) {
        Object.keys(where).forEach((k) => {
          if (where[k] !== undefined) {
            values.push(where[k]);
            const param = isSqlite ? '?' : `$${values.length}`;
            clauses.push(`"${k}" = ${param}`);
          }
        });
      }

      if (clauses.length > 0) {
        sql += ` WHERE ${clauses.join(' AND ')}`;
      }

      const count = await client.$executeRawUnsafe(sql, ...values);
      return { count };
    },
  };
}

/**
 * Retrieves or initializes the active PrismaClient with delegate integrity validation.
 */
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    return globalForPrisma.prisma;
  }

  // Health check: verify core delegates exist on cached client
  const client = globalForPrisma.prisma as any;
  if (!client.cropDiagnosisRecord || !client.user || !client.field) {
    try {
      client.$disconnect?.();
    } catch {
      // Ignore disconnect error during recovery
    }
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

/**
 * Model name to SQL table name mapping for resilient delegates.
 */
const MODEL_TABLE_MAP: Record<string, string> = {
  cropDiagnosisRecord: 'CropDiagnosisRecord',
  diagnosisFeedback: 'DiagnosisFeedback',
  aiModelRegistry: 'AiModelRegistry',
  cartItem: 'CartItem',
  product: 'Product',
  productCategory: 'ProductCategory',
  productBrand: 'ProductBrand',
  order: 'Order',
  orderItem: 'OrderItem',
};

/**
 * Proxied Prisma instance that always invokes getPrismaClient() on access
 * and guarantees that model delegates (especially cropDiagnosisRecord) are NEVER undefined.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];

    if (typeof value === 'function') {
      return value.bind(client);
    }

    // If delegate exists, return it
    if (value !== undefined) {
      return value;
    }

    // Fail-safe auto-healing: if prop is a known model delegate that is undefined in this instance,
    // construct a resilient fallback delegate so `.create()` NEVER crashes with undefined!
    const propStr = String(prop);
    if (MODEL_TABLE_MAP[propStr]) {
      console.warn(`[Prisma Proxy] Delegate "${propStr}" was undefined on PrismaClient. Returning resilient SQL delegate.`);
      return createResilientModelDelegate(client, propStr, MODEL_TABLE_MAP[propStr]);
    }

    return undefined;
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = getPrismaClient();
}
