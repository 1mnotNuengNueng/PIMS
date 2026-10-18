import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/fiscalPeriod.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { currentFiscalYear, fiscalPeriodLabel, quarters, matchesPeriod } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('fiscal year changes on October 1 in Bangkok, not January 1', () => {
  assert.equal(currentFiscalYear(new Date('2026-09-30T16:59:59Z')), 2569);
  assert.equal(currentFiscalYear(new Date('2026-09-30T17:00:00Z')), 2570);
  assert.equal(currentFiscalYear(new Date('2027-01-01T00:00:00Z')), 2570);
  assert.equal(currentFiscalYear(new Date('2027-09-30T17:00:00Z')), 2571);
});

test('quarter labels run from October through September and preserve unspecified projects', () => {
  assert.match(quarters[0].label, /ต.ค.–ธ.ค./);
  assert.match(quarters[3].label, /ก.ค.–ก.ย./);
  assert.match(fiscalPeriodLabel(2570, 1), /2570.*ไตรมาส 1/);
  assert.match(fiscalPeriodLabel(null, null), /ยังไม่ระบุ/);
});

test('year and quarter filters combine without losing legacy projects in the all view', () => {
  const project = { fiscal_year: 2570, quarter: 1 };
  assert.equal(matchesPeriod(project, '2570', '1'), true);
  assert.equal(matchesPeriod(project, '2569', '1'), false);
  assert.equal(matchesPeriod(project, '2570', '2'), false);
  assert.equal(matchesPeriod({ fiscal_year: null, quarter: null }, 'all', 'all'), true);
  assert.equal(matchesPeriod({ fiscal_year: null, quarter: null }, 'unset', 'all'), true);
});
