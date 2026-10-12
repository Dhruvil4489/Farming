/**
 * SMARTFARM AI - SWITCH PRISMA PROVIDER TO SQLITE (DEV FALLBACK)
 *
 * This script:
 * 1. Copies prisma/schema.sqlite.prisma to prisma/schema.prisma
 * 2. Runs "prisma generate" so PrismaClient targets local SQLite dev.db
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sqliteSchemaPath = path.join(projectRoot, 'prisma/schema.sqlite.prisma');
const activeSchemaPath = path.join(projectRoot, 'prisma/schema.prisma');

console.log('🔄 Activating SQLite Prisma schema...');
fs.copyFileSync(sqliteSchemaPath, activeSchemaPath);
console.log('✔ Copied schema.sqlite.prisma -> schema.prisma');

console.log('⚡ Generating Prisma Client for SQLite...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: projectRoot });
  console.log('\n✅ SmartFarm AI is now configured for SQLite (file:./dev.db)!\n');
} catch (err) {
  console.error('Error generating Prisma client:', err.message);
}
