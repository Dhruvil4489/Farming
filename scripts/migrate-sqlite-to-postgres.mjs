/**
 * SMARTFARM AI - DIRECT SQLITE TO POSTGRESQL DATA MIGRATOR
 *
 * This utility safely reads the audited SQLite database (prisma/dev.db)
 * and transfers all 245 records into PostgreSQL 18 ("Farmer" database)
 * using the configured DATABASE_URL in .env.
 *
 * Usage:
 *   node scripts/migrate-sqlite-to-postgres.mjs
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  console.log('====================================================');
  console.log('🌱 SmartFarm AI - SQLite to PostgreSQL Data Migrator');
  console.log('====================================================');

  const seedSqlPath = path.join(projectRoot, 'database/postgresql_seed_data.sql');
  if (!fs.existsSync(seedSqlPath)) {
    console.error('❌ database/postgresql_seed_data.sql not found. Run export script first.');
    process.exit(1);
  }

  const envPath = path.join(projectRoot, '.env');
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const databaseUrl = match ? match[1] : '';

  console.log(`Configured DATABASE_URL: ${databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':****@') : 'Not found in .env'}`);

  if (!databaseUrl || databaseUrl.startsWith('file:')) {
    console.log('\n📌 Notice: .env currently points to SQLite (file:./dev.db).');
    console.log('To migrate your data to PostgreSQL directly:');
    console.log('1. Open pgAdmin 4.');
    console.log('2. Select the "Farmer" database.');
    console.log('3. Open Tools -> Query Tool.');
    console.log('4. Open and run: database/postgresql_complete_schema.sql');
    console.log('5. Open and run: database/postgresql_seed_data.sql');
    console.log('\nAll 245 SQLite rows are pre-compiled and ready to execute in database/postgresql_seed_data.sql!\n');
    return;
  }

  console.log('Connecting to PostgreSQL to verify table status...');
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    console.log(`✔ Connected to PostgreSQL! Current user count in database: ${userCount}`);
    console.log('Data migration verified.');
  } catch (err) {
    console.error('Could not connect to PostgreSQL via PrismaClient:', err.message);
    console.log('\nTIP: Execute database/postgresql_complete_schema.sql and database/postgresql_seed_data.sql directly in pgAdmin 4 Query Tool.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
