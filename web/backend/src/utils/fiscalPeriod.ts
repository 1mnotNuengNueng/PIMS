export function validateFiscalPeriod(year: unknown, quarter: unknown, required = true) {
  if (!required && year == null && quarter == null) return;
  if (
    (typeof year !== 'number' && typeof year !== 'string') ||
    (typeof quarter !== 'number' && typeof quarter !== 'string') ||
    !Number.isInteger(Number(year)) || Number(year) < 2400 || Number(year) > 3000 ||
    !Number.isInteger(Number(quarter)) || Number(quarter) < 1 || Number(quarter) > 4
  ) {
    const error = new Error('กรุณาเลือกปีงบประมาณ พ.ศ. (2400–3000) และไตรมาส 1–4');
    error.name = 'ValidationError';
    throw error;
  }
}
