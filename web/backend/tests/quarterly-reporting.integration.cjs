require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const prefix = '[DEMO-QUARTERLY-v1]';
const iso = (value) => value.toISOString().slice(0, 10);

async function main() {
  const years = await prisma.fiscalYear.findMany({
    where: { year: { in: [2569, 2570] } },
    include: { periods: { orderBy: { quarter: 'asc' } } }, orderBy: { year: 'asc' },
  });
  assert.equal(years.length, 2);
  for (const year of years) {
    const ce = year.year - 543;
    assert.equal(iso(year.start_date), `${ce - 1}-10-01`);
    assert.equal(iso(year.end_date), `${ce}-09-30`);
    assert.equal(year.periods.length, 4);
    for (let index = 0; index < 4; index++) {
      const period = year.periods[index];
      assert.equal(period.quarter, index + 1);
      const start = new Date(Date.UTC(ce - 1, 9 + index * 3, 1));
      const end = new Date(Date.UTC(ce - 1, 12 + index * 3, 0));
      assert.equal(iso(period.start_date), iso(start));
      assert.equal(iso(period.end_date), iso(end));
      assert.ok(period.report_due_date >= period.end_date);
    }
  }
  const projects = await prisma.projectForm.findMany({
    where: { name: { startsWith: prefix } },
    include: { quarterly_reports: { include: { fiscal_period: { include: { fiscal_year: true } }, author: true, reviewer: true } } },
  });
  assert.equal(projects.length, 2);
  const reports = projects.flatMap((project) => project.quarterly_reports);
  assert.equal(reports.length, 5);
  assert.deepEqual([...new Set(reports.map((report) => report.status))].sort(), ['approved', 'draft', 'resubmit', 'submitted']);
  for (const project of projects) {
    for (const report of project.quarterly_reports) {
      assert.equal(report.is_demo, true);
      assert.equal(report.fiscal_period.fiscal_year.year, project.fiscal_year);
      assert.equal(report.author.id, report.reported_by);
      assert.ok(Number(report.budget_spent) >= 0);
      assert.ok(Number(report.progress_percent) >= 0 && Number(report.progress_percent) <= 100);
      if (report.status === 'draft') assert.equal(report.submitted_at, null);
      if (['approved', 'resubmit'].includes(report.status)) {
        assert.ok(report.reviewer && report.reviewed_at >= report.submitted_at);
      }
    }
  }
  const report = reports[0];
  const data = {
    project_id: report.project_id, fiscal_period_id: report.fiscal_period_id,
    results: 'constraint test', kpi_results: 'constraint test', reported_by: report.reported_by,
  };
  // Failed inserts exercise database constraints; no test records are committed.
  await assert.rejects(prisma.projectQuarterlyReport.create({ data }), (error) => error.code === 'P2002');
  await assert.rejects(prisma.projectQuarterlyReport.create({ data: { ...data, project_id: -1 } }), (error) => error.code === 'P2003');
  const rollback = new Error('ROLLBACK_CONSTRAINT_TEST');
  try {
    await prisma.$transaction(async (tx) => {
      await assert.rejects(tx.fiscalPeriod.create({ data: {
        fiscal_year_id: years[0].id, quarter: 5,
        start_date: years[0].start_date, end_date: years[0].end_date, report_due_date: years[0].end_date,
      } }));
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  console.log(JSON.stringify({ fiscalYears: years.map((year) => year.year), periods: 8, demoProjects: projects.length, demoReports: reports.length, statuses: [...new Set(reports.map((report) => report.status))].sort(), constraints: 'unique report, foreign key and quarter range verified' }));
}
main().catch((error) => {
  console.error('Quarterly verification failed:', error.code || error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
