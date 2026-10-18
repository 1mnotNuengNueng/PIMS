// Add nullable fields without changing or deleting existing project data.
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');

async function main() {
  const connection = new PrismaClient();
  try {
    const columns = await connection.$queryRawUnsafe('SHOW COLUMNS FROM `project_form`');
    const missing = ['fiscal_year', 'quarter'].filter((name) => !columns.some((column) => column.Field === name));
    if (missing.length) {
      await connection.$executeRawUnsafe(`ALTER TABLE \`project_form\` ${missing.map((name) => `ADD COLUMN \`${name}\` INT NULL`).join(', ')}`);
    }
    console.log('Fiscal year and quarter columns are ready.');
  } finally {
    await connection.$disconnect();
  }
}

main().catch((error) => {
  console.error('Could not add fiscal period columns:', error.code || error.name);
  process.exitCode = 1;
});
