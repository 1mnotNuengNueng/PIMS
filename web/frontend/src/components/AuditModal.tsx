import React from 'react';
import type { Project } from '../types';
import { formatMoney } from '../utils/format';
import { CheckCircleIcon, ClockIcon, AlertCircleIcon, ShieldIcon } from './Icons';

interface AuditModalProps {
  project: Project | null;
  reviewAction: 'approve' | 'resubmit' | 'cancel';
  setReviewAction: (action: 'approve' | 'resubmit' | 'cancel') => void;
  reviewComment: string;
  setReviewComment: (comment: string) => void;
  loading: boolean;
  onClose: () => void;
  onSubmitReview: () => void;
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
  if (!project) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card-box" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#8F1730', color: '#fff', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <ShieldIcon size={20} />
            </div>
            <div>
              <h2>พิจารณาอนุมัติโครงการ (Audit & Approval)</h2>
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
            หน่วยงาน: {project.target_group} • ผู้เสนอ: {project.responsible_person} • งบประมาณ:{' '}
            {formatMoney(project.budget_amount)} บาท
          </p>
        </div>

        <div className="review-action-options">
          <label className={`action-card ${reviewAction === 'approve' ? 'selected approve' : ''}`}>
            <input
              type="radio"
              name="reviewAction"
              checked={reviewAction === 'approve'}
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

          <label className={`action-card ${reviewAction === 'cancel' ? 'selected cancel' : ''}`}>
            <input
              type="radio"
              name="reviewAction"
              checked={reviewAction === 'cancel'}
              onChange={() => setReviewAction('cancel')}
            />
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircleIcon size={16} />
                <span>ยกเลิกโครงการ (Cancel)</span>
              </strong>
              <span>ไม่อนุมัติหรือไม่บรรจุโครงการลงในแผนปฏิบัติการ</span>
            </div>
          </label>
        </div>

        <label className="field-block">
          <span className="field-label required">
            {reviewAction === 'resubmit'
              ? 'ข้อความแจ้งสิ่งที่สาขาต้องแก้ไข (จำเป็นต้องระบุ):'
              : 'บันทึกความเห็น / ข้อเสนอแนะเพิ่มเติม:'}
          </span>
          <textarea
            rows={4}
            required={reviewAction === 'resubmit'}
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
            disabled={loading || (reviewAction === 'resubmit' && !reviewComment.trim())}
            onClick={onSubmitReview}
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
      </div>
    </div>
  );
};
