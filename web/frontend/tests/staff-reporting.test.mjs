import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('staff resumes editable reports and advances past submitted periods, including Q4 rollover', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.vite-tests/staff-reporting', server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { staffReportPeriod } = await server.ssrLoadModule('/src/utils/staffReporting.ts');
    const { StaffProgressSummary } = await server.ssrLoadModule('/src/components/StaffProgressSummary.tsx');
    const project = { fiscal_year: 2570, quarter: 3, status: 'approve' };
    const report = (year, quarter, status) => ({ status, fiscal_period: { quarter, fiscal_year: { year } } });
    assert.deepEqual(staffReportPeriod(project, []), { year: 2570, quarter: 4 });
    assert.deepEqual(staffReportPeriod({ ...project, quarter: 4 }, []), { year: 2571, quarter: 1 });
    assert.deepEqual(staffReportPeriod(project, [report(2570, 4, 'draft')]), { year: 2570, quarter: 4 });
    assert.deepEqual(staffReportPeriod(project, [report(2571, 1, 'approved'), report(2570, 4, 'resubmit')]), { year: 2570, quarter: 4 });
    assert.deepEqual(staffReportPeriod(project, [report(2570, 4, 'submitted')]), { year: 2571, quarter: 1 });
    assert.deepEqual(staffReportPeriod(project, [report(2570, 3, 'draft')]), { year: 2570, quarter: 4 });
    const html = renderToStaticMarkup(createElement(StaffProgressSummary, { project: { ...project, latest_report: {
      id: 1, fiscal_year: 2570, quarter: 4, status: 'resubmit', progress_percent: 0, budget_spent: 0,
    } } }));
    assert.ok(html.includes('0%') && html.includes('2570') && html.includes('ส่งกลับแก้ไข'));
    assert.match(html, /<progress[^>]+value="0"/);
  } finally { await server.close(); }
});
