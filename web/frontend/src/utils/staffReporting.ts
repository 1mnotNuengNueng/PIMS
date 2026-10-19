import type { Project, QuarterlyReport } from '../types';
import { currentFiscalYear } from './fiscalPeriod';

export function staffReportPeriod(project: Pick<Project, 'fiscal_year' | 'quarter'>, reports: QuarterlyReport[]) {
  const start = (project.fiscal_year || currentFiscalYear()) * 4 + (project.quarter || 1);
  const ordered = [...reports].filter(report => report.fiscal_period.fiscal_year.year * 4 + report.fiscal_period.quarter > start)
    .sort((a, b) => b.fiscal_period.fiscal_year.year - a.fiscal_period.fiscal_year.year || b.fiscal_period.quarter - a.fiscal_period.quarter);
  const editable = ordered.find(report => report.status === 'resubmit' || report.status === 'draft');
  if (editable) return { year: editable.fiscal_period.fiscal_year.year, quarter: editable.fiscal_period.quarter };
  const last = ordered[0];
  const year = last?.fiscal_period.fiscal_year.year || project.fiscal_year || currentFiscalYear();
  const quarter = last?.fiscal_period.quarter || project.quarter || 1;
  return quarter === 4 ? { year: year + 1, quarter: 1 } : { year, quarter: quarter + 1 };
}
