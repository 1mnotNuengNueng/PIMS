import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFiscalPeriod } from '../src/utils/fiscalPeriod';

test('accepts all four fiscal quarters and numeric form input', () => {
  for (let quarter = 1; quarter <= 4; quarter++) {
    assert.doesNotThrow(() => validateFiscalPeriod(2570, quarter));
    assert.doesNotThrow(() => validateFiscalPeriod('2570', String(quarter)));
  }
});

test('rejects invalid years, fractional quarters, missing or partial periods', () => {
  const invalid: [unknown, unknown][] = [[2027, 1], [2570, 0], [2570, 5], [2570, 1.5], ['', 1], [2570, ''], [null, null], [true, 1], [2570, false], [undefined, 1]];
  for (const [year, quarter] of invalid) {
    assert.throws(() => validateFiscalPeriod(year, quarter), { name: 'ValidationError' });
  }
});

test('existing projects may remain unspecified until their period is edited', () => {
  assert.doesNotThrow(() => validateFiscalPeriod(null, null, false));
  assert.throws(() => validateFiscalPeriod(2570, null, false), { name: 'ValidationError' });
});
