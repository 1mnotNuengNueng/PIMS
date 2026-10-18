require('dotenv').config({ quiet: true });
require('ts-node/register');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { reviewProject, validateReplacement } = require('../src/services/project-workflow.service');
const { saveQuarterlyReport } = require('../src/services/quarterly-submit.service');
const { reviewQuarterlyReport } = require('../src/services/quarterly-review.service');
const { signToken } = require('../src/utils/helpers');
const prisma = new PrismaClient();
const rollback = new Error('ROLLBACK_LIFECYCLE_TEST');

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { Role: { in: ['admin', 'super_admin'] } } });
  const owner = await prisma.user.findFirst({ where: { Role: 'staff' } }) || admin;
  const auth = (user) => ({ id: user.id, email: user.Email, role: user.Role, majorId: user.Major_id });
  try {
    await prisma.$transaction(async (tx) => {
      const reference = await tx.projectForm.findFirstOrThrow();
      const base = {
        name: '__lifecycle_rollback_test__', fiscal_year: 2570, quarter: 3, create_by: owner.id,
        strategic_plan_id: reference.strategic_plan_id, operating_budget_id: reference.operating_budget_id,
        responsible_person: 'Test', principles_rationale: 'Test', objective: 'Test', target_group: 'Test',
        implementation_procedure: 'Test', duration_of_operations: 'Test', location: 'Test', evaluation: 'Test', expected_outcomes: 'Test',
      };
      const project = await tx.projectForm.create({ data: { ...base, status: 'draft' } });
      await assert.rejects(reviewProject(tx, project.id, auth(admin), 'approve', ''), { statusCode: 409 });
      await validateReplacement(tx, project.id, 2570, 4, auth(owner)).then(() => assert.fail('Active source must be rejected'), (error) => assert.equal(error.statusCode, 409));
      await tx.projectForm.update({ where: { id: project.id }, data: { status: 'submitted', submitted_at: new Date() } });
      await assert.rejects(reviewProject(tx, project.id, auth(admin), 'resubmit', ''), { statusCode: 400 });
      const returned = await reviewProject(tx, project.id, auth(admin), 'resubmit', 'Clarify objectives');
      assert.equal(returned.status, 'resubmit');
      await tx.projectForm.update({ where: { id: project.id }, data: { status: 'submitted', submitted_at: new Date() } });
      const approved = await reviewProject(tx, project.id, auth(admin), 'approve', 'Approved');
      assert.equal(approved.status, 'approve');
      const input = { fiscal_year: 2570, quarter: 4, results: 'Activity complete', kpi_results: '80 participants', progress_percent: 75, budget_spent: 1000, status: 'draft' };
      await assert.rejects(saveQuarterlyReport(tx, project.id, auth(owner), { ...input, quarter: 3 }), { statusCode: 400 });
      await assert.rejects(saveQuarterlyReport(tx, project.id, auth(owner), { ...input, quarter: 2 }), { statusCode: 400 });
      await assert.rejects(saveQuarterlyReport(tx, project.id, auth(owner), { ...input, progress_percent: 101 }), { statusCode: 400 });
      const draft = await saveQuarterlyReport(tx, project.id, auth(owner), input);
      assert.equal(draft.status, 'draft');
      await assert.rejects(reviewQuarterlyReport(tx, project.id, draft.id, admin.id, 'approve', ''), { statusCode: 409 });
      const sent = await saveQuarterlyReport(tx, project.id, auth(owner), { ...input, status: 'submitted' });
      assert.equal(sent.id, draft.id);
      assert.ok(sent.submitted_at);
      await assert.rejects(saveQuarterlyReport(tx, project.id, auth(owner), input), { statusCode: 409 });
      await reviewQuarterlyReport(tx, project.id, sent.id, admin.id, 'approve', 'Report checked');
      await assert.rejects(reviewProject(tx, project.id, auth(owner), 'cancel', ''), { statusCode: 400 });
      const cancelled = await reviewProject(tx, project.id, auth(owner), 'cancel', 'Start a replacement project');
      assert.equal(cancelled.status, 'cancel');
      assert.ok(cancelled.cancelled_at);
      assert.equal(cancelled.cancellation_reason, 'Start a replacement project');
      assert.equal(cancelled.review_comment, 'Approved');
      await assert.rejects(saveQuarterlyReport(tx, project.id, auth(owner), { ...input, fiscal_year: 2571 }), { statusCode: 409 });
      await assert.rejects(reviewProject(tx, project.id, auth(admin), 'approve', ''), { statusCode: 409 });
      await assert.rejects(validateReplacement(tx, project.id, 2570, 3, auth(owner)), { statusCode: 400 });
      await validateReplacement(tx, project.id, 2570, 4, auth(owner));
      const replacement = await tx.projectForm.create({ data: { ...base, quarter: 4, replacement_for_id: project.id, status: 'draft' } });
      assert.notEqual(replacement.id, project.id);
      const history = await tx.projectForm.findUniqueOrThrow({ where: { id: project.id }, include: { quarterly_reports: true, replacement_projects: true } });
      assert.equal(history.quarterly_reports[0].status, 'approved');
      assert.equal(history.replacement_projects[0].id, replacement.id);
      throw rollback;
    }, { timeout: 60000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await prisma.projectForm.count({ where: { name: '__lifecycle_rollback_test__' } }), 0);

  const headers = { Authorization: `Bearer ${signToken(auth(admin))}`, 'Content-Type': 'application/json' };
  const baseUrl = 'http://localhost:3000';
  const invalid = await fetch(`${baseUrl}/api/projects`, { method: 'POST', headers, body: JSON.stringify({ fiscal_year: 2570, quarter: 3, status: 'approve' }) });
  assert.equal(invalid.status, 400);
  const demo = await prisma.projectForm.findFirstOrThrow({ where: { name: { startsWith: '[DEMO-QUARTERLY-v1]' }, status: 'approve', fiscal_year: { not: null }, quarter: { not: null } } });
  const initial = await fetch(`${baseUrl}/api/projects/${demo.id}/quarterly-reports`, { method: 'PUT', headers, body: JSON.stringify({ fiscal_year: demo.fiscal_year, quarter: demo.quarter, status: 'submitted', results: 'Test', kpi_results: 'Test', progress_percent: 0, budget_spent: 0 }) });
  assert.equal(initial.status, 400);
  console.log('Lifecycle passed: Q3 proposal submission/revision/approval, Q4 progress draft/submission/review, cancellation history, linked later-quarter replacement, terminal cancellation, API guards. All test writes rolled back.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
