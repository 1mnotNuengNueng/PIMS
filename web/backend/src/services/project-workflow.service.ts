import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../types';

export class ProjectWorkflowError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

export const periodNumber = (year: number, quarter: number) => year * 4 + quarter;

export async function ensureProjectPeriods(tx: Prisma.TransactionClient, year: number) {
  const ce = year - 543;
  const fiscalYear = await tx.fiscalYear.upsert({ where: { year }, update: {}, create: {
    year, start_date: new Date(Date.UTC(ce - 1, 9, 1)), end_date: new Date(Date.UTC(ce, 8, 30)),
  } });
  for (let quarter = 1; quarter <= 4; quarter++) {
    const start = new Date(Date.UTC(ce - 1, 9 + (quarter - 1) * 3, 1));
    const end = new Date(Date.UTC(ce - 1, 12 + (quarter - 1) * 3, 0));
    await tx.fiscalPeriod.upsert({ where: { fiscal_year_id_quarter: { fiscal_year_id: fiscalYear.id, quarter } }, update: {},
      create: { fiscal_year_id: fiscalYear.id, quarter, start_date: start, end_date: end, report_due_date: new Date(end.getTime() + 30 * 86400000) },
    });
  }
}

export async function validateReplacement(tx: Prisma.TransactionClient, sourceId: number, year: number, quarter: number, user: AuthUser) {
  const source = await tx.projectForm.findUnique({ where: { id: sourceId }, include: { user: { select: { Major_id: true } } } });
  if (!source) throw new ProjectWorkflowError(404, 'ไม่พบโครงการเดิม');
  if (source.status !== 'cancel') throw new ProjectWorkflowError(409, 'สร้างโครงการทดแทนได้เมื่อโครงการเดิมยกเลิกแล้ว');
  if (user.role === 'staff' && (source.department_id ?? source.user.Major_id) !== user.majorId) throw new ProjectWorkflowError(403, 'ไม่มีสิทธิ์สร้างโครงการทดแทนของหน่วยงานอื่น');
  if (source.fiscal_year && source.quarter && periodNumber(year, quarter) <= periodNumber(source.fiscal_year, source.quarter)) {
    throw new ProjectWorkflowError(400, 'โครงการทดแทนต้องเริ่มในไตรมาสถัดจากรอบเริ่มต้นของโครงการเดิม');
  }
}

export async function reviewProject(tx: Prisma.TransactionClient, id: number, user: AuthUser, action: unknown, comment: unknown) {
  await tx.$queryRaw`SELECT id FROM project_form WHERE id = ${id} FOR UPDATE`;
  if (!['approve', 'resubmit', 'cancel'].includes(String(action))) throw new ProjectWorkflowError(400, 'ผลการพิจารณาไม่ถูกต้อง');
  const project = await tx.projectForm.findUnique({ where: { id }, include: { department: true, user: { include: { major: true } } } });
  if (!project) throw new ProjectWorkflowError(404, 'ไม่พบโครงการ');
  if (action === 'cancel' && user.role !== 'admin' && user.role !== 'super_admin') throw new ProjectWorkflowError(403, 'เฉพาะแอดมินที่ไม่อนุมัติโครงการได้');
  if (user.role === 'staff' && (project.department_id ?? project.user.Major_id) !== user.majorId) throw new ProjectWorkflowError(403, 'ไม่มีสิทธิ์พิจารณาโครงการนี้');
  if (project.status === 'cancel') throw new ProjectWorkflowError(409, 'โครงการยกเลิกแล้ว กรุณาสร้างโครงการใหม่แทนการเปิดโครงการเดิม');
  const text = typeof comment === 'string' ? comment.trim() : '';
  if (action === 'cancel' && project.status !== 'submitted' && project.status !== 'approve') throw new ProjectWorkflowError(409, 'ไม่อนุมัติหรือยกเลิกได้เฉพาะข้อเสนอที่ส่งรอพิจารณาหรืออนุมัติแล้ว');
  if ((action === 'cancel' || action === 'resubmit') && !text) throw new ProjectWorkflowError(400, action === 'cancel' ? 'กรุณาระบุเหตุผลการยกเลิก' : 'กรุณาระบุสิ่งที่ต้องแก้ไข');
  if (action !== 'cancel' && project.status !== 'submitted') throw new ProjectWorkflowError(409, 'พิจารณาได้เฉพาะข้อเสนอที่ส่งรอพิจารณาแล้ว');
  const data: Prisma.ProjectFormUncheckedUpdateManyInput = action === 'cancel'
    ? { status: 'cancel', cancelled_at: new Date(), cancellation_reason: text }
    : { status: action === 'approve' ? 'approve' : 'resubmit', review_comment: text };
  const updated = await tx.projectForm.updateMany({ where: { id, status: project.status }, data });
  if (updated.count !== 1) throw new ProjectWorkflowError(409, 'สถานะเปลี่ยนไปแล้ว กรุณาโหลดข้อมูลล่าสุด');
  return tx.projectForm.findUniqueOrThrow({ where: { id }, include: { department: true, user: { include: { major: true } } } });
}
