require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM `project_form`');
  const status = columns.find((column) => column.Field === 'status');
  if (!status.Type.startsWith('enum(')) throw new Error('Unexpected project status column type');
  if (!status.Type.includes("'submitted'")) {
    // Append the new value; preserve the order and values of the existing enum.
    await prisma.$executeRawUnsafe(`ALTER TABLE \`project_form\` MODIFY COLUMN \`status\` ${status.Type.slice(0, -1)},'submitted') NOT NULL DEFAULT 'draft'`);
  }
  const definitions = [
    ['submitted_at', 'DATETIME(0) NULL'], ['cancelled_at', 'DATETIME(0) NULL'],
    ['cancellation_reason', 'TEXT NULL'], ['replacement_for_id', 'INT NULL'],
  ];
  const missing = definitions.filter(([name]) => !columns.some((column) => column.Field === name));
  if (missing.length) await prisma.$executeRawUnsafe(`ALTER TABLE \`project_form\` ${missing.map(([name, type]) => `ADD COLUMN \`${name}\` ${type}`).join(', ')}`);
  const constraints = await prisma.$queryRaw`SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_form' AND CONSTRAINT_NAME = 'project_form_replacement_for_id_fkey'`;
  if (!constraints.length) await prisma.$executeRawUnsafe('ALTER TABLE `project_form` ADD INDEX `project_form_replacement_for_id_idx` (`replacement_for_id`), ADD CONSTRAINT `project_form_replacement_for_id_fkey` FOREIGN KEY (`replacement_for_id`) REFERENCES `project_form` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT');
  console.log('Project lifecycle columns, submitted status and replacement relation are ready. Existing project statuses are unchanged.');
}
main().catch((error) => { console.error(error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
