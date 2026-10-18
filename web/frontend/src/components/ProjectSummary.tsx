import type { Project } from '../types';
import { statusLabels } from '../types';
import { fiscalPeriodLabel } from '../utils/fiscalPeriod';
import { formatMoney } from '../utils/format';
import { ProjectDetails } from './ProjectDetails';

export function ProjectSummary({ project, onWordPreview }: { project: Project; onWordPreview: (project: Project) => void }) {
  return <aside className="content-card project-summary-panel" aria-label="ข้อมูลสรุปโครงการ">
    <span className="desk-badge">ข้อมูลโครงการ</span>
    <h2>{project.name}</h2>
    <span className="project-summary-status">{statusLabels[project.status]}</span>
    {project.cancellation_reason && <p className="quarter-review-notice">เหตุผลการยกเลิก: {project.cancellation_reason}{project.cancelled_at && ` (${new Date(project.cancelled_at).toLocaleDateString('th-TH')})`}</p>}
    {project.replacement_for && <p>ทดแทนโครงการ <a href={`#/admin/projects/${project.replacement_for.id}`}>{project.replacement_for.name}</a></p>}
    {project.replacement_projects?.map((replacement) => <p key={replacement.id}>โครงการใหม่ทดแทน: <a href={`#/admin/projects/${replacement.id}`}>{replacement.name}</a></p>)}
    <dl className="project-summary-fields">
      {[
        ['แผนดำเนินโครงการ', fiscalPeriodLabel(project.fiscal_year, project.quarter)],
        ['หน่วยงาน', project.user?.major?.name || project.target_group],
        ['ผู้รับผิดชอบ', project.responsible_person],
        ['ระยะเวลาดำเนินงาน', project.duration_of_operations],
        ['งบประมาณโครงการ', `${formatMoney(project.budget_amount)} บาท`],
        ['ยุทธศาสตร์', project.strategic_plan?.name],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '-'}</dd></div>)}
    </dl>
    <div className="project-summary-excerpt"><h3>วัตถุประสงค์โดยย่อ</h3><p>{project.objective || '-'}</p></div>
    <details className="project-summary-expand">
      <summary>
        <span className="summary-expand-label">ดูรายละเอียดโครงการทั้งหมด</span>
        <span className="summary-collapse-label">ย่อรายละเอียดโครงการ</span>
      </summary>
      <ProjectDetails project={project} />
    </details>
    <button type="button" className="btn-preview-word" onClick={() => onWordPreview(project)}>ดูแบบฟอร์ม Word</button>
  </aside>;
}
