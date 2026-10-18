import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('approval dialog displays complete details before decision controls', async () => {
  const server = await createServer({ cacheDir: 'node_modules/.vite-tests/project-review', server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { AuditModal } = await server.ssrLoadModule('/src/components/AuditModal.tsx');
    const project = {
      id: 1, name: 'โครงการทดสอบ', fiscal_year: 2570, quarter: 1, status: 'draft',
      responsible_person: 'ผู้รับผิดชอบทดสอบ', principles_rationale: 'เหตุผลที่ต้องตรวจสอบ',
      objective: 'วัตถุประสงค์ทดสอบ', target_group: 'กลุ่มเป้าหมายทดสอบ',
      implementation_procedure: 'วิธีดำเนินการทดสอบ', duration_of_operations: 'ระยะเวลาทดสอบ',
      location: 'สถานที่ทดสอบ', evaluation: 'การประเมินทดสอบ', expected_outcomes: 'ผลลัพธ์ทดสอบ',
      strategic_goal: 'เป้าประสงค์ทดสอบ', strategic_kpi: 'ตัวชี้วัดยุทธศาสตร์ทดสอบ',
      project_kpi: 'ตัวชี้วัดโครงการทดสอบ', kpi_target: 'ค่าเป้าหมายทดสอบ', target_date: 'กำหนดเสร็จทดสอบ',
      budget_amount: 12345, operation_plan: 'แผนดำเนินงานทดสอบ', progress_risk: 'ความเสี่ยงทดสอบ',
      review_comment: 'ความเห็นเดิมทดสอบ', strategic_plan: { name: 'ยุทธศาสตร์ทดสอบ' },
      operating_budget: { name: 'งบประมาณทดสอบ' }, user: { major: { name: 'หน่วยงานทดสอบ' } },
    };
    const html = renderToStaticMarkup(createElement(AuditModal, {
      project, reviewAction: 'resubmit', reviewComment: '', loading: false,
      setReviewAction() {}, setReviewComment() {}, onClose() {}, onSubmitReview() {},
    }));
    for (const [key, value] of Object.entries(project)) {
      if (typeof value === 'string' && !['status'].includes(key)) assert.ok(html.includes(value), `Missing ${key}`);
    }
    assert.ok(html.includes('2570') && html.includes('ต.ค.–ธ.ค.'));
    assert.ok(html.indexOf('เหตุผลที่ต้องตรวจสอบ') < html.indexOf('review-action-options'));
    assert.match(html, /disabled=""/); // Sending back without a comment is disabled.
  } finally {
    await server.close();
  }
});
