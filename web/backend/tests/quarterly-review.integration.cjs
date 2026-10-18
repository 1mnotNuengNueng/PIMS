require('dotenv').config({ quiet: true });
require('ts-node/register');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { reviewQuarterlyReport } = require('../src/services/quarterly-review.service');
const { signToken } = require('../src/utils/helpers');
const prisma = new PrismaClient();
const rollback = new Error('ROLLBACK_QUARTERLY_REVIEW_TEST');

async function main() {
  const reviewer = await prisma.user.findFirstOrThrow({ where: { Role: { in: ['admin', 'super_admin'] } } });
  try {
    await prisma.$transaction(async (tx) => {
      const source = await tx.projectForm.findFirstOrThrow();
      const periods = await tx.fiscalPeriod.findMany({ where: { fiscal_year: { year: 2570 } }, orderBy: { quarter: 'asc' } });
      assert.ok(periods.length >= 3);
      const project = await tx.projectForm.create({ data: {
        name: '__quarterly_review_rollback_test__', strategic_plan_id: source.strategic_plan_id,
        operating_budget_id: source.operating_budget_id, create_by: source.create_by,
        responsible_person: 'Test', principles_rationale: 'Test', objective: 'Test', target_group: 'Test',
        implementation_procedure: 'Test', duration_of_operations: 'Test', location: 'Test',
        evaluation: 'Test', expected_outcomes: 'Test', status: 'approve',
      } });
      const reports = [];
      for (let index = 0; index < 3; index++) reports.push(await tx.projectQuarterlyReport.create({ data: {
        project_id: project.id, fiscal_period_id: periods[index].id, reported_by: source.create_by,
        results: 'Test', kpi_results: 'Test', status: index === 2 ? 'draft' : 'submitted',
        submitted_at: index === 2 ? null : new Date(), progress_percent: 25,
      } }));
      await assert.rejects(reviewQuarterlyReport(tx, project.id, reports[0].id, reviewer.id, 'resubmit', ' '), { statusCode: 400 });
      await assert.rejects(reviewQuarterlyReport(tx, project.id, reports[0].id, reviewer.id, 'cancel', ''), { statusCode: 400 });
      await assert.rejects(reviewQuarterlyReport(tx, source.id, reports[0].id, reviewer.id, 'approve', ''), { statusCode: 404 });
      await assert.rejects(reviewQuarterlyReport(tx, project.id, reports[2].id, reviewer.id, 'approve', ''), { statusCode: 409 });
      const approved = await reviewQuarterlyReport(tx, project.id, reports[0].id, reviewer.id, 'approve', 'ผ่านการตรวจ');
      assert.equal(approved.status, 'approved');
      assert.equal(approved.reviewed_by, reviewer.id);
      assert.equal(approved.fiscal_period_id, periods[0].id);
      await assert.rejects(reviewQuarterlyReport(tx, project.id, reports[0].id, reviewer.id, 'resubmit', 'แก้ไข'), { statusCode: 409 });
      const revision = await reviewQuarterlyReport(tx, project.id, reports[1].id, reviewer.id, 'resubmit', 'เพิ่มหลักฐาน');
      assert.equal(revision.status, 'resubmit');
      assert.equal(revision.review_comment, 'เพิ่มหลักฐาน');
      assert.equal((await tx.projectQuarterlyReport.findUniqueOrThrow({ where: { id: reports[2].id } })).status, 'draft');
      assert.equal((await tx.projectForm.findUniqueOrThrow({ where: { id: project.id } })).status, 'approve');
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await prisma.projectForm.count({ where: { name: '__quarterly_review_rollback_test__' } }), 0);

  const source = await prisma.projectForm.findFirstOrThrow({ where: { name: { startsWith: '[DEMO-QUARTERLY-v1]' } } });
  const headersFor = (user) => ({ Authorization: `Bearer ${signToken({ id: user.id, email: user.Email, role: user.Role, majorId: user.Major_id })}`, 'Content-Type': 'application/json' });
  const base = process.env.TEST_API_BASE || 'http://localhost:3000';
  const response = await fetch(`${base}/api/projects/${source.id}/review-details`, { headers: headersFor(reviewer) });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.ok(payload.periods.length >= 4 && payload.reports.length > 0);
  assert.equal(typeof payload.reports[0].progress_percent, 'number');
  assert.equal(typeof payload.reports[0].budget_spent, 'number');
  assert.ok(!JSON.stringify(payload).includes('hash_password'));
  const invalid = await fetch(`${base}/api/projects/${source.id}/quarterly-reports/${payload.reports[0].id}/review`, { method: 'POST', headers: headersFor(reviewer), body: JSON.stringify({ action: 'cancel' }) });
  assert.equal(invalid.status, 400);
  const staff = await prisma.user.findFirst({ where: { Role: 'staff' } });
  if (staff) {
    const denied = await fetch(`${base}/api/projects/${source.id}/review-details`, { headers: headersFor(staff) });
    assert.equal(denied.status, 403);
    const deniedReview = await fetch(`${base}/api/projects/${source.id}/quarterly-reports/${payload.reports[0].id}/review`, { method: 'POST', headers: headersFor(staff), body: JSON.stringify({ action: 'approve' }) });
    assert.equal(deniedReview.status, 403);
  }
  console.log('Quarter-specific approval, revision, draft protection, duplicate review protection, project status separation, API and admin permissions passed. All test writes rolled back.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
