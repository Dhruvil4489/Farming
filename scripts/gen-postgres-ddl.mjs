import fs from 'fs';
import { execSync } from 'child_process';

const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
const postgresSchema = schemaContent.replace('provider = "sqlite"', 'provider = "postgresql"');
fs.writeFileSync('prisma/schema.postgres.prisma', postgresSchema);

console.log('Created prisma/schema.postgres.prisma');

try {
  const ddl = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.postgres.prisma --script', { encoding: 'utf8' });
  fs.writeFileSync('database/prisma_generated_ddl.sql', ddl);
  console.log('Generated database/prisma_generated_ddl.sql successfully! Length:', ddl.length);
} catch (e) {
  console.error('Error generating DDL:', e.message);
}
