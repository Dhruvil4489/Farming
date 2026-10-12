import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const prisma = new PrismaClient();

// Dependency-ordered models
const models = [
  { model: 'role', table: 'Role' },
  { model: 'permission', table: 'Permission' },
  { model: 'user', table: 'User' },
  { model: 'userRole', table: 'UserRole' },
  { model: 'rolePermission', table: 'RolePermission' },
  { model: 'farm', table: 'Farm' },
  { model: 'field', table: 'Field' },
  { model: 'crop', table: 'Crop' },
  { model: 'cropTranslation', table: 'CropTranslation' },
  { model: 'cropVariety', table: 'CropVariety' },
  { model: 'cropStage', table: 'CropStage' },
  { model: 'cropStageTranslation', table: 'CropStageTranslation' },
  { model: 'cropStageAdvisory', table: 'CropStageAdvisory' },
  { model: 'cropStageAdvisoryTranslation', table: 'CropStageAdvisoryTranslation' },
  { model: 'cropCycle', table: 'CropCycle' },
  { model: 'cycleStage', table: 'CycleStage' },
  { model: 'task', table: 'Task' },
  { model: 'weatherRecord', table: 'WeatherRecord' },
  { model: 'soilProfile', table: 'SoilProfile' },
  { model: 'soilReport', table: 'SoilReport' },
  { model: 'soilTest', table: 'SoilTest' },
  { model: 'soilParameter', table: 'SoilParameter' },
  { model: 'farmObservation', table: 'FarmObservation' },
  { model: 'irrigationRecord', table: 'IrrigationRecord' },
  { model: 'file', table: 'File' },
  { model: 'notification', table: 'Notification' },
  { model: 'notificationPreference', table: 'NotificationPreference' },
  { model: 'marketCommodity', table: 'MarketCommodity' },
  { model: 'marketLocation', table: 'MarketLocation' },
  { model: 'marketPriceObservation', table: 'MarketPriceObservation' },
  { model: 'marketSyncLog', table: 'MarketSyncLog' },
  { model: 'fertilizerCategory', table: 'FertilizerCategory' },
  { model: 'cropFertilizerGuidance', table: 'CropFertilizerGuidance' },
  { model: 'productCategory', table: 'ProductCategory' },
  { model: 'productBrand', table: 'ProductBrand' },
  { model: 'product', table: 'Product' },
  { model: 'cartItem', table: 'CartItem' },
  { model: 'order', table: 'Order' },
  { model: 'orderItem', table: 'OrderItem' },
  { model: 'auditLog', table: 'AuditLog' },
  { model: 'advisoryRule', table: 'AdvisoryRule' }
];

function formatSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'string') {
    const escaped = val.replace(/'/g, "''");
    return `'${escaped}'`;
  }
  // For JSON objects / arrays
  const jsonStr = JSON.stringify(val).replace(/'/g, "''");
  return `'${jsonStr}'`;
}

async function main() {
  console.log('Reading data from SQLite via PrismaClient...');
  let sql = `-- =====================================================================
-- SMARTFARM AI - POSTGRESQL PRODUCTION & DEVELOPMENT SEED DATA
-- Source: Live SQLite Database (prisma/dev.db)
-- Target Database: "Farmer" (PostgreSQL 18, public schema)
--
-- INSTRUCTIONS FOR PGADMIN 4:
-- 1. Open pgAdmin 4 and connect to PostgreSQL 18.
-- 2. Select the "Farmer" database.
-- 3. Open Query Tool (Tools -> Query Tool).
-- 4. First run "database/postgresql_complete_schema.sql".
-- 5. Then paste and run this file.
-- All INSERT statements include "ON CONFLICT DO NOTHING" for safe idempotency.
-- =====================================================================

BEGIN;

`;

  let totalRows = 0;
  const tableCounts = {};

  for (const { model, table } of models) {
    if (!prisma[model]) {
      console.warn(`Prisma model '${model}' not found on client`);
      continue;
    }

    try {
      const rows = await prisma[model].findMany();
      if (!rows || rows.length === 0) continue;

      totalRows += rows.length;
      tableCounts[table] = rows.length;

      sql += `-- ---------------------------------------------------------------------\n`;
      sql += `-- Table: "${table}" (${rows.length} rows)\n`;
      sql += `-- ---------------------------------------------------------------------\n`;

      const cols = Object.keys(rows[0]);
      const quotedCols = cols.map(c => `"${c}"`).join(', ');

      for (const row of rows) {
        const vals = cols.map(col => formatSqlValue(row[col])).join(', ');
        sql += `INSERT INTO "${table}" (${quotedCols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
      }
      sql += `\n`;
    } catch (err) {
      console.error(`Error querying model ${model}:`, err.message);
    }
  }

  sql += `COMMIT;

-- =====================================================================
-- SEED DATA SUMMARY:
-- Total tables populated: ${Object.keys(tableCounts).length}
-- Total records inserted: ${totalRows}
--
${Object.entries(tableCounts).map(([tbl, cnt]) => `--   * "${tbl}": ${cnt} rows`).join('\n')}
-- =====================================================================
`;

  const outputPath = path.join(projectRoot, 'database/postgresql_seed_data.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');

  console.log(`\n✅ Generated ${outputPath}`);
  console.log(`Total rows exported: ${totalRows}`);
  console.table(tableCounts);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
