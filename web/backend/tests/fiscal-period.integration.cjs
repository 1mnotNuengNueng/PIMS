// Verify persistence in a transaction that is always rolled back.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const rollback = new Error('ROLLBACK_TEST_PROJECT');

async function main() {
  try {
    await prisma.$transaction(async (tx) => {
      const [user, strategy, budget] = await Promise.all([
        tx.user.findFirst(), tx.strategicPlan.findFirst(), tx.operatingBudget.findFirst(),
      ]);
      assert.ok(user && strategy && budget, 'Reference data must exist');
      const project = await tx.projectForm.create({ data: {
        name: '__fiscal_period_rollback_test__', fiscal_year: 2570, quarter: 1,
        strategic_plan_id: strategy.id, operating_budget_id: budget.id, create_by: user.id,
        responsible_person: 'Test', principles_rationale: 'Test', objective: 'Test',
        target_group: 'Test', implementation_procedure: 'Test', duration_of_operations: 'Test',
        location: 'Test', evaluation: 'Test', expected_outcomes: 'Test',
      } });
      const saved = await tx.projectForm.findUniqueOrThrow({ where: { id: project.id } });
      assert.equal(saved.fiscal_year, 2570);
      assert.equal(saved.quarter, 1);
      const updated = await tx.projectForm.update({ where: { id: project.id }, data: { fiscal_year: 2571, quarter: 4 } });
      assert.equal(updated.fiscal_year, 2571);
      assert.equal(updated.quarter, 4);
      throw rollback;
    }, { timeout: 15000 });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.equal(await prisma.projectForm.count({ where: { name: '__fiscal_period_rollback_test__' } }), 0);
  console.log('Fiscal period create/read/update passed; test project rolled back.');
}
main().catch((error) => { console.error(error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
