import type { FiscalPeriod, QuarterlyReport, Project } from '../types';

export function periodStage(project: Pick<Project, 'fiscal_year' | 'quarter'>, period: FiscalPeriod) {
  if (!project.fiscal_year || !project.quarter) return 'progress';
  const difference = period.fiscal_year.year * 4 + period.quarter - (project.fiscal_year * 4 + project.quarter);
  return difference < 0 ? 'before_start' : difference === 0 ? 'proposal' : 'progress';
}

export const reportStatusLabels: Record<QuarterlyReport['status'], string> = {
  draft: 'ฉบับร่าง / ยังไม่ส่ง', submitted: 'ส่งแล้ว / รอตรวจ', approved: 'รายงานผ่านการตรวจแล้ว', resubmit: 'ส่งกลับแก้ไข',
};

export function preferredPeriod(periods: FiscalPeriod[], reports: QuarterlyReport[], plannedQuarter: number | null) {
  const ordered = [...reports].sort((a, b) =>
    b.fiscal_period.fiscal_year.year - a.fiscal_period.fiscal_year.year || b.fiscal_period.quarter - a.fiscal_period.quarter);
  const report = ordered.find((item) => item.status === 'submitted') || ordered.find((item) => item.status !== 'draft') || ordered[0];
  return report?.fiscal_period_id || periods.find((period) => period.quarter === plannedQuarter)?.id || periods[0]?.id || null;
}

export function reviewProjectId(hash: string) {
  const match = /^#\/admin\/projects\/(\d+)$/.exec(hash);
  const id = match ? Number(match[1]) : 0;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
