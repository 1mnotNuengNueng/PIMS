import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../types';
import { ProjectWorkflowError } from './project-workflow.service';

export async function handleCancellation(tx: Prisma.TransactionClient, id: number, user: AuthUser, action: unknown, reason: unknown) {
  await tx.$queryRaw`SELECT id FROM project_form WHERE id = ${id} FOR UPDATE`;
  const project = await tx.projectForm.findUnique({ where: { id }, include: { user: { select: { Major_id: true } } } });
  if (!project) throw new ProjectWorkflowError(404, 'ไม่พบโครงการ');
  if (user.role === 'staff' && (project.department_id ?? project.user.Major_id) !== user.majorId) throw new ProjectWorkflowError(403, 'ไม่มีสิทธิ์ขอยกเลิกโครงการของหน่วยงานอื่น');
  if (project.status === 'cancel') throw new ProjectWorkflowError(409, 'โครงการยกเลิกแล้ว');
  const comment = typeof reason === 'string' ? reason.trim() : '';
  if (action === 'request') {
    if (!comment) throw new ProjectWorkflowError(400, 'กรุณาระบุเหตุผลที่ขอยกเลิก');
    if (project.cancellation_request_status === 'pending') throw new ProjectWorkflowError(409, 'มีคำขอยกเลิกรอพิจารณาแล้ว');
    return tx.projectForm.update({ where: { id }, data: {
      cancellation_request_status: 'pending', cancellation_request_reason: comment,
      cancellation_requested_at: new Date(), cancellation_review_comment: null, cancellation_reviewed_at: null,
    } });
  }
  if (user.role !== 'admin' && user.role !== 'super_admin') throw new ProjectWorkflowError(403, 'เฉพาะแอดมินที่พิจารณาคำขอยกเลิกได้');
  if (action !== 'approve' && action !== 'reject') throw new ProjectWorkflowError(400, 'ผลพิจารณาไม่ถูกต้อง');
  if (project.cancellation_request_status !== 'pending') throw new ProjectWorkflowError(409, 'ไม่มีคำขอยกเลิกที่รอพิจารณา');
  if (action === 'reject' && !comment) throw new ProjectWorkflowError(400, 'กรุณาระบุเหตุผลที่ไม่อนุมัติการยกเลิก');
  return tx.projectForm.update({ where: { id }, data: {
    cancellation_request_status: action === 'approve' ? 'approved' : 'rejected',
    cancellation_review_comment: comment, cancellation_reviewed_at: new Date(),
    ...(action === 'approve' ? { status: 'cancel', cancelled_at: new Date(), cancellation_reason: project.cancellation_request_reason } : {}),
  } });
}
