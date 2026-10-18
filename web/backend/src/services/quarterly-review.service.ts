import type { Prisma } from '@prisma/client';
import { periodNumber } from './project-workflow.service';

export class QuarterlyReviewError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

export async function reviewQuarterlyReport(
  tx: Prisma.TransactionClient,
  projectId: number,
  reportId: number,
  reviewerId: number,
  action: unknown,
  comment: unknown,
) {
  if (action !== 'approve' && action !== 'resubmit') {
    throw new QuarterlyReviewError(400, 'กรุณาเลือกอนุมัติรายงานหรือส่งกลับแก้ไข');
  }
  const reviewComment = typeof comment === 'string' ? comment.trim() : '';
  if (action === 'resubmit' && !reviewComment) {
    throw new QuarterlyReviewError(400, 'กรุณาระบุสิ่งที่ต้องแก้ไขในรายงาน');
  }
  await tx.$queryRaw`SELECT id FROM project_form WHERE id = ${projectId} FOR UPDATE`;
  const report = await tx.projectQuarterlyReport.findFirst({ where: { id: reportId, project_id: projectId }, include: { project: true, fiscal_period: { include: { fiscal_year: true } } } });
  if (!report) throw new QuarterlyReviewError(404, 'ไม่พบรายงานของโครงการนี้');
  if (report.project.status !== 'approve') throw new QuarterlyReviewError(409, 'ตรวจรายงานความคืบหน้าได้เฉพาะโครงการที่อนุมัติและยังไม่ยกเลิก');
  if (report.project.fiscal_year && report.project.quarter && periodNumber(report.fiscal_period.fiscal_year.year, report.fiscal_period.quarter) <= periodNumber(report.project.fiscal_year, report.project.quarter)) {
    throw new QuarterlyReviewError(409, 'รอบเริ่มต้นใช้ตรวจข้อเสนอโครงการ ไม่ใช่รายงานความคืบหน้า');
  }
  if (report.status !== 'submitted') throw new QuarterlyReviewError(409, 'ตรวจได้เฉพาะรายงานที่ส่งรอพิจารณา กรุณาโหลดข้อมูลล่าสุด');
  const result = await tx.projectQuarterlyReport.updateMany({
    where: { id: reportId, project_id: projectId, status: 'submitted' },
    data: { status: action === 'approve' ? 'approved' : 'resubmit', reviewed_by: reviewerId, reviewed_at: new Date(), review_comment: reviewComment || null },
  });
  if (result.count !== 1) throw new QuarterlyReviewError(409, 'รายงานนี้ถูกตรวจไปแล้ว กรุณาโหลดข้อมูลล่าสุด');
  return tx.projectQuarterlyReport.findUniqueOrThrow({ where: { id: reportId } });
}
