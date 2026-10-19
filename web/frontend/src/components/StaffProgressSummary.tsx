import type { Project } from '../types';
import { fiscalPeriodLabel } from '../utils/fiscalPeriod';
import { reportStatusLabels } from '../utils/quarterlyReview';

export function StaffProgressSummary({ project }: { project: Project }) {
  const report = project.latest_report;
  if (!report) return <span className="cell-subtext">{project.status === 'approve' ? 'ยังไม่มีรายงานความคืบหน้า' : 'เริ่มรายงานหลังโครงการอนุมัติ'}</span>;
  return <div className="staff-progress-summary">
    <strong>{report.progress_percent}%</strong>
    <progress aria-label="ความคืบหน้าสะสมล่าสุด" max={100} value={report.progress_percent} />
    <span className="cell-subtext">{fiscalPeriodLabel(report.fiscal_year, report.quarter)}</span>
    <span className="cell-subtext">{reportStatusLabels[report.status]}</span>
  </div>;
}
