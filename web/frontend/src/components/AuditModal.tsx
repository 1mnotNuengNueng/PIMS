import React, { useState } from 'react';
import type { Project } from '../types';
import { formatMoney } from '../utils/format';
import { ProjectDetails } from './ProjectDetails';
import { CheckCircleIcon, ClockIcon, ShieldIcon } from './Icons';

interface AuditModalProps {
  project: Project | null;
  reviewAction: 'approve' | 'resubmit' | 'cancel';
  setReviewAction: (action: 'approve' | 'resubmit' | 'cancel') => void;
  reviewComment: string;
  setReviewComment: (comment: string) => void;
  loading: boolean;
  onClose: () => void;
  onSubmitReview: (action?: 'approve' | 'resubmit' | 'cancel') => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  project,
  reviewAction,
  setReviewAction,
  reviewComment,
  setReviewComment,
  loading,
  onClose,
  onSubmitReview,
}) => {
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(reviewAction === 'cancel');
  if (!project) return null;

  const isCancellation = () => reviewAction === 'cancel';
  if (isCancellation()) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="revision-feedback-dialog cancellation-reason-dialog" role="dialog" aria-modal="true" aria-label="เหตุผลการยกเลิกการอนุมัติ" onClick={(event) => event.stopPropagation()}>
          <h3>เหตุผลการยกเลิกการอนุมัติ *</h3>
          <textarea
            rows={5}
            required
            autoFocus
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="ระบุเหตุผลการยกเลิกการอนุมัติ"
          />
          <div className="modal-footer-btns">
            <button type="button" className="btn-outline" onClick={onClose}>ยกเลิก</button>
            <button
              type="button"
              className="btn-confirm-action cancel"
              disabled={loading || !reviewComment.trim()}
              onClick={() => onSubmitReview('cancel')}
            >
              ยืนยันการยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card-box project-review-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="รายละเอียดและพิจารณาโครงการ">
        <div className="modal-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#8F1730', color: '#fff', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <ShieldIcon size={20} />
            </div>
            <div>
              <h2>พิจารณาสถานะโครงการ</h2>
              <p>ฝ่ายพัฒนาองค์กร / ผู้มีอำนาจอนุมัติ คณะวิศวกรรมศาสตร์</p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-project-brief">
          <strong>{project.name}</strong>
          <p>
            หน่วยงาน: {project.department?.name || project.user?.major?.name || '-'} • ผู้เสนอ: {project.responsible_person} • งบประมาณ:{' '}
            {formatMoney(project.budget_amount)} บาท
          </p>
        </div>

        <div className="modal-review-shortcuts">
          <button
            type="button"
            className="btn-confirm-action approve"
            disabled={loading || project.status !== 'submitted'}
            onClick={() => onSubmitReview('approve')}
          >
            ยืนยันอนุมัติโครงการ
          </button>
          <button
            type="button"
            className="btn-confirm-action resubmit"
            disabled={loading || project.status !== 'submitted'}
            onClick={() => setShowRevisionDialog(true)}
          >
            ยืนยันส่งกลับให้สาขาแก้ไข
          </button>
          <button
            type="button"
            className="btn-confirm-action cancel"
            disabled={loading || (project.status !== 'submitted' && project.status !== 'approve')}
            onClick={() => setShowRejectionDialog(true)}
          >
            ไม่อนุมัติ
          </button>
        </div>

        <ProjectDetails project={project} />
        <h3>ผลการพิจารณา</h3>
        <div className="review-action-options">
          <label className={`action-card ${reviewAction === 'approve' ? 'selected approve' : ''}`}>
            <input
              type="radio"
              name="reviewAction"
              checked={reviewAction === 'approve'}
              disabled={loading || project.status !== 'submitted'}
              onChange={() => setReviewAction('approve')}
            />
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircleIcon size={16} />
                <span>อนุมัติโครงการ (Approve)</span>
              </strong>
              <span>โครงการมีความสมบูรณ์ สอดคล้องกับยุทธศาสตร์คณะและงบประมาณ</span>
            </div>
          </label>

          <label className={`action-card ${reviewAction === 'resubmit' ? 'selected resubmit' : ''}`}>
            <input
              type="radio"
              name="reviewAction"
              checked={reviewAction === 'resubmit'}
              disabled={loading || project.status !== 'submitted'}
              onChange={() => setReviewAction('resubmit')}
            />
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClockIcon size={16} />
                <span>ส่งกลับเพื่อให้สาขาแก้ไข (Resubmit)</span>
              </strong>
              <span>ให้ผู้รับผิดชอบหรือสาขาวิชาปรับแก้ข้อมูลตามข้อเสนอแนะที่ระบุ</span>
            </div>
          </label>

          </div>

        <label className="field-block">
          <span className={`field-label ${reviewAction !== 'approve' ? 'required' : ''}`}>
            {reviewAction === 'cancel' ? 'เหตุผลการยกเลิก (จำเป็นต้องระบุ):' : reviewAction === 'resubmit'
              ? 'ข้อความแจ้งสิ่งที่สาขาต้องแก้ไข (จำเป็นต้องระบุ):'
              : 'บันทึกความเห็น / ข้อเสนอแนะเพิ่มเติม:'}
          </span>
          <textarea
            rows={4}
            required={reviewAction !== 'approve'}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder={
              reviewAction === 'resubmit'
                ? 'ระบุหัวข้อที่ต้องแก้ไขอย่างชัดเจน เช่น กรุณาแนบใบเสนอราคา และปรับลดค่าตอบแทนวิทยากร...'
                : 'ระบุข้อคิดเห็นเพิ่มเติมในการดำเนินงาน...'
            }
          />
        </label>

        <div className="modal-footer-btns">
          <button
            type="button"
            className="btn-outline"
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className={`btn-confirm-action ${reviewAction}`}
            disabled={loading || project.status === 'cancel' || (reviewAction !== 'cancel' && project.status !== 'submitted') || (reviewAction !== 'approve' && !reviewComment.trim())}
            onClick={() => onSubmitReview()}
          >
            {loading
              ? 'กำลังบันทึก...'
              : reviewAction === 'approve'
                ? 'ยืนยันการอนุมัติโครงการ'
                : reviewAction === 'resubmit'
                  ? 'ยืนยันส่งกลับให้สาขาแก้ไข'
                  : 'ยืนยันยกเลิกโครงการ'}
          </button>
        </div>
        {showRevisionDialog && (
          <div className="revision-feedback-backdrop" onClick={() => setShowRevisionDialog(false)}>
            <div className="revision-feedback-dialog" role="dialog" aria-modal="true" aria-label="บันทึกความเห็นเพื่อส่งกลับแก้ไข" onClick={(event) => event.stopPropagation()}>
              <h3>บันทึกความเห็น / ข้อเสนอแนะเพิ่มเติม</h3>
              <textarea
                rows={5}
                required
                autoFocus
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="ระบุสิ่งที่สาขาต้องแก้ไขอย่างชัดเจน"
              />
              <div className="modal-footer-btns">
                <button type="button" className="btn-outline" onClick={() => setShowRevisionDialog(false)}>ยกเลิก</button>
                <button
                  type="button"
                  className="btn-confirm-action resubmit"
                  disabled={loading || !reviewComment.trim()}
                  onClick={() => onSubmitReview('resubmit')}
                >
                  ยืนยันส่งกลับให้สาขาแก้ไข
                </button>
              </div>
            </div>
          </div>
        )}
        {showRejectionDialog && (
          <div className="revision-feedback-backdrop" onClick={() => { setReviewComment(''); setShowRejectionDialog(false); }}>
            <div className="revision-feedback-dialog" role="dialog" aria-modal="true" aria-label="ยืนยันไม่อนุมัติโครงการ" onClick={(event) => event.stopPropagation()}>
              <h3>{project.status === 'approve' ? 'เหตุผลการยกเลิกการอนุมัติ *' : 'เหตุผลที่ขอยกเลิกโครงการ *'}</h3>
              <textarea
                rows={5}
                required
                autoFocus
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder={project.status === 'approve' ? 'ระบุเหตุผลการยกเลิกการอนุมัติ' : 'ระบุเหตุผลที่ไม่อนุมัติโครงการ'}
              />
              <div className="modal-footer-btns">
                <button type="button" className="btn-outline" onClick={() => { setReviewComment(''); setShowRejectionDialog(false); }}>ยกเลิก</button>
                <button
                  type="button"
                  className="btn-confirm-action cancel"
                  disabled={loading || !reviewComment.trim()}
                  onClick={() => onSubmitReview('cancel')}
                >
                  ยืนยันไม่อนุมัติ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
