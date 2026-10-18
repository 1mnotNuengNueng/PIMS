import type { Project } from '../types';

export function matchesPeriod(project: Project, year: string, quarter: string) {
  return (year === 'all' || (year === 'unset' ? !project.fiscal_year : String(project.fiscal_year) === year)) &&
    (quarter === 'all' || String(project.quarter) === quarter);
}

export const quarters = [
  { value: 1, label: 'ไตรมาส 1 (ต.ค.–ธ.ค.)' },
  { value: 2, label: 'ไตรมาส 2 (ม.ค.–มี.ค.)' },
  { value: 3, label: 'ไตรมาส 3 (เม.ย.–มิ.ย.)' },
  { value: 4, label: 'ไตรมาส 4 (ก.ค.–ก.ย.)' },
];

export function currentFiscalYear(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'numeric' }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  return year + 543 + (month >= 10 ? 1 : 0);
}

export function fiscalPeriodLabel(year?: number | null, quarter?: number | null) {
  if (!year || !quarter) return 'ยังไม่ระบุปีงบประมาณ / ไตรมาส';
  return `ปีงบประมาณ ${year} • ${quarters.find((item) => item.value === quarter)?.label || '-'}`;
}

export function fiscalYearOptions(extraYears: number[] = []) {
  const current = currentFiscalYear();
  return [...new Set([...Array.from({ length: 11 }, (_, i) => current - 5 + i), ...extraYears])].sort((a, b) => b - a);
}
