/**
 * SMARTFARM AI - SWITCH PRISMA PROVIDER TO POSTGRESQL
 *
 * This script:
 * 1. Copies prisma/schema.postgres.prisma to prisma/schema.prisma
 * 2. Runs "prisma generate" so PrismaClient targets PostgreSQL 18
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const postgresSchemaPath = path.join(projectRoot, 'prisma/schema.postgres.prisma');
const activeSchemaPath = path.join(projectRoot, 'prisma/schema.prisma');

console.log('🔄 Activating PostgreSQL Prisma schema...');
fs.copyFileSync(postgresSchemaPath, activeSchemaPath);
console.log('✔ Copied schema.postgres.prisma -> schema.prisma');

console.log('⚡ Generating Prisma Client for PostgreSQL...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: projectRoot });
  console.log('\n✅ SmartFarm AI is now configured for PostgreSQL 18!');
  console.log('Make sure your .env has:');
  console.log('DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/Farmer?schema=public"\n');
} catch (err) {
  console.error('Error generating Prisma client:', err.message);
}
