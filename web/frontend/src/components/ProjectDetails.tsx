import type { Project } from '../types';
import { statusLabels } from '../types';
import { formatMoney } from '../utils/format';
import { fiscalPeriodLabel } from '../utils/fiscalPeriod';

export function ProjectDetails({ project }: { project: Project }) {
  const fields = [
    ['สถานะ', statusLabels[project.status]],
    ['เหตุผลการยกเลิก', project.cancellation_reason],
    ['ปีงบประมาณ / ไตรมาส', fiscalPeriodLabel(project.fiscal_year, project.quarter)],
    ['หน่วยงาน', project.user?.major?.name || project.target_group],
    ['ผู้รับผิดชอบ', project.responsible_person],
    ['แผนยุทธศาสตร์', project.strategic_plan?.name],
    ['เป้าประสงค์เชิงกลยุทธ์', project.strategic_goal],
    ['ตัวชี้วัดระดับยุทธศาสตร์', project.strategic_kpi],
    ['หลักการและเหตุผล', project.principles_rationale],
    ['วัตถุประสงค์', project.objective],
    ['กลุ่มเป้าหมาย', project.target_group],
    ['วิธีดำเนินการ', project.implementation_procedure],
    ['ระยะเวลาดำเนินงาน', project.duration_of_operations],
    ['กำหนดแล้วเสร็จ', project.target_date],
    ['สถานที่', project.location],
    ['ตัวชี้วัดโครงการ (KPI)', project.project_kpi],
    ['ค่าเป้าหมาย', project.kpi_target],
    ['การประเมินผล', project.evaluation],
    ['ผลที่คาดว่าจะได้รับ', project.expected_outcomes],
    ['แหล่งงบประมาณ', project.operating_budget?.name],
    ['งบประมาณ', `${formatMoney(project.budget_amount)} บาท`],
    ['แผนการดำเนินงาน', project.operation_plan],
    ['ความก้าวหน้า / ความเสี่ยง', project.progress_risk],
    ['ความเห็นผู้ตรวจเดิม', project.review_comment],
  ];
  return (
    <section className="project-details" aria-label="รายละเอียดโครงการ">
      <h3>รายละเอียดโครงการ</h3>
      <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '-'}</dd></div>)}</dl>
    </section>
  );
}
