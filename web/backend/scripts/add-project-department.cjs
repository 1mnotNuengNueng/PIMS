require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const columns = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM `project_form`');
  if (!columns.some((column) => column.Field === 'department_id')) {
    await prisma.$executeRawUnsafe('ALTER TABLE `project_form` ADD COLUMN `department_id` INT NULL, ADD INDEX `project_department_idx` (`department_id`), ADD CONSTRAINT `project_department_fk` FOREIGN KEY (`department_id`) REFERENCES `major` (`id`) ON DELETE RESTRICT');
  }
  await prisma.$executeRawUnsafe('UPDATE `project_form` p JOIN `user` u ON u.id = p.create_by SET p.department_id = u.Major_id WHERE p.department_id IS NULL');
  console.log('Project departments ready.');
}
main().catch((error) => { console.error(error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
