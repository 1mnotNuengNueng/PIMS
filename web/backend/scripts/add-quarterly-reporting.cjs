require('dotenv').config({ quiet: true });
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // MySQL DDL commits independently. IF NOT EXISTS allows a safe retry after interruption.
  const sql = readFileSync(join(__dirname, '../prisma/manual-migrations/20261018_quarterly_reporting.sql'), 'utf8');
  for (const statement of sql.split(';').map((value) => value.trim()).filter(Boolean)) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log('Quarterly reporting tables, foreign keys and constraints are ready.');
}
main().catch((error) => {
  console.error('Quarterly migration failed:', error.code || error.name, error.meta?.message || '');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
