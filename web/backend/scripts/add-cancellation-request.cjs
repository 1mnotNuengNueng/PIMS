require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const columns = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM `project_form`');
  const definitions = [['cancellation_request_status', 'VARCHAR(20) NULL'], ['cancellation_request_reason', 'TEXT NULL'], ['cancellation_requested_at', 'DATETIME(0) NULL'], ['cancellation_review_comment', 'TEXT NULL'], ['cancellation_reviewed_at', 'DATETIME(0) NULL']];
  const missing = definitions.filter(([name]) => !columns.some(column => column.Field === name));
  if (missing.length) await prisma.$executeRawUnsafe('ALTER TABLE `project_form` ' + missing.map(([name, type]) => `ADD COLUMN \`${name}\` ${type}`).join(', '));
  console.log('Cancellation requests ready.');
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
