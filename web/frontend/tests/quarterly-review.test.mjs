import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = readFileSync(new URL('../src/utils/quarterlyReview.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { preferredPeriod, reviewProjectId, periodStage } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const period = { id: 3, quarter: 3, fiscal_year: { id: 1, year: 2569 }, start_date: '2026-04-01', end_date: '2026-06-30', report_due_date: '2026-07-30' };
const report = { id: 1, fiscal_period_id: 3, fiscal_period: period, status: 'submitted', progress_percent: 80, results: 'ผลดำเนินงาน Q3', kpi_results: '65 คน', budget_spent: 40000, problems: 'ปัญหาทดสอบ', next_steps: 'แผนถัดไป', author: { Email: 'demo@example.test' }, reviewer: null, submitted_at: '2026-07-05', reviewed_at: null, review_comment: null };

test('detail links can be opened directly and refresh safely', () => {
  assert.equal(reviewProjectId('#/admin/projects/12'), 12);
  assert.equal(reviewProjectId('#/admin/projects/0'), null);
  assert.equal(reviewProjectId('#/admin/projects/nope'), null);
  assert.equal(reviewProjectId('#/approvals'), null);
});

test('the first project period is a proposal even when it starts in Q3', () => {
  const project = { fiscal_year: 2569, quarter: 3 };
  assert.equal(periodStage(project, period), 'proposal');
  assert.equal(periodStage(project, { ...period, quarter: 1 }), 'before_start');
  assert.equal(periodStage(project, { ...period, quarter: 4 }), 'progress');
  assert.equal(periodStage(project, { ...period, quarter: 1, fiscal_year: { id: 2, year: 2570 } }), 'progress');
});

test('initial quarter prefers a submitted report over a later draft', () => {
  assert.equal(preferredPeriod([period], [report, { ...report, fiscal_period_id: 4, status: 'draft', fiscal_period: { ...period, id: 4, quarter: 4 } }], 1), 3);
  assert.equal(preferredPeriod([period], [], 3), 3);
  assert.equal(preferredPeriod([], [], null), null);
});

test('quarter details identify the reviewed period and preserve missing versus zero progress', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.vite-tests/quarterly-review', server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { QuarterlyReportDetails } = await server.ssrLoadModule('/src/components/QuarterlyReportDetails.tsx');
    const html = renderToStaticMarkup(createElement(QuarterlyReportDetails, { period, report }));
    assert.match(html, /รอบที่กำลังตรวจ/);
    assert.match(html, /2569.*ไตรมาส 3/);
    assert.match(html, /80%/);
    assert.match(html, /40,000/);
    assert.match(html, /ผลดำเนินงาน Q3/);
    const empty = renderToStaticMarkup(createElement(QuarterlyReportDetails, { period }));
    assert.match(empty, /ยังไม่มีรายงาน/);
    assert.ok(!empty.includes('<progress'));
    const draft = renderToStaticMarkup(createElement(QuarterlyReportDetails, { period, report: { ...report, status: 'draft', progress_percent: 0 } }));
    assert.match(draft, /0%/);
    assert.match(draft, /ยังไม่ได้ส่ง/);
  } finally { await server.close(); }
});
