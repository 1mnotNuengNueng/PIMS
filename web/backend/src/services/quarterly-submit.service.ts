import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../types';
import { ProjectWorkflowError, ensureProjectPeriods, periodNumber } from './project-workflow.service';
import { validateFiscalPeriod } from '../utils/fiscalPeriod';

export async function saveQuarterlyReport(tx: Prisma.TransactionClient, projectId: number, user: AuthUser, input: Record<string, unknown>) {
  validateFiscalPeriod(input.fiscal_year, input.quarter);
  const year = Number(input.fiscal_year), quarter = Number(input.quarter);
  if (input.status !== 'draft' && input.status !== 'submitted') throw new ProjectWorkflowError(400, 'กรุณาเลือกบันทึกฉบับร่างหรือส่งรายงาน');
  const status: 'draft' | 'submitted' = input.status;
  const progress = Number(input.progress_percent), spent = Number(input.budget_spent);
  if (!Number.isFinite(progress) || progress < 0 || progress > 100 || !Number.isFinite(spent) || spent < 0) throw new ProjectWorkflowError(400, 'ความคืบหน้าต้องอยู่ในช่วง 0–100 และงบที่ใช้ต้องไม่ติดลบ');
  const text = (key: string) => typeof input[key] === 'string' ? input[key].trim() : '';
  if (input.status === 'submitted' && (!text('results') || !text('kpi_results'))) throw new ProjectWorkflowError(400, 'กรุณาระบุผลการดำเนินงานและผล KPI ก่อนส่ง');
  await tx.$queryRaw`SELECT id FROM project_form WHERE id = ${projectId} FOR UPDATE`;
  const project = await tx.projectForm.findUnique({ where: { id: projectId }, include: { user: { select: { Major_id: true } } } });
  if (!project) throw new ProjectWorkflowError(404, 'ไม่พบโครงการ');
  if (user.role === 'staff' && (project.department_id ?? project.user.Major_id) !== user.majorId) throw new ProjectWorkflowError(403, 'ไม่มีสิทธิ์รายงานโครงการของหน่วยงานอื่น');
  if (project.status !== 'approve') throw new ProjectWorkflowError(409, 'ส่งความคืบหน้าได้เมื่อโครงการอนุมัติและยังไม่ยกเลิกเท่านั้น');
  if (!project.fiscal_year || !project.quarter) throw new ProjectWorkflowError(409, 'โครงการยังไม่มีรอบเริ่มต้น กรุณาระบุให้ครบก่อนรายงานผล');
  if (periodNumber(year, quarter) <= periodNumber(project.fiscal_year, project.quarter)) throw new ProjectWorkflowError(400, 'รอบเริ่มต้นเป็นการส่งข้อเสนอ กรุณารายงานความคืบหน้าในไตรมาสถัดไป');
  await ensureProjectPeriods(tx, year);
  const period = await tx.fiscalPeriod.findFirstOrThrow({ where: { quarter, fiscal_year: { year } } });
  const key = { project_id_fiscal_period_id: { project_id: projectId, fiscal_period_id: period.id } };
  const existing = await tx.projectQuarterlyReport.findUnique({ where: key });
  if (existing && existing.status !== 'draft' && input.status === 'draft') throw new ProjectWorkflowError(409, 'รายงานที่ส่งแล้วให้ส่งข้อมูลอัปเดตโดยตรง');
  const data = {
    results: text('results'), kpi_results: text('kpi_results'), budget_spent: spent, progress_percent: progress,
    problems: text('problems'), next_steps: text('next_steps'), status,
    reported_by: user.id, submitted_at: input.status === 'submitted' ? new Date() : null,
    reviewed_by: null, reviewed_at: null, review_comment: null,
  };
  return tx.projectQuarterlyReport.upsert({ where: key, create: { ...data, project_id: projectId, fiscal_period_id: period.id }, update: data });
}
