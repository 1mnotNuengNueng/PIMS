import { useState } from 'react';
import type { Project } from '../types';
import { ProjectDetails } from './ProjectDetails';

type Props = { project: Project; isAdmin: boolean; onClose: () => void; onSave: (action: 'request' | 'approve' | 'reject', reason: string) => Promise<void> };
export function CancellationModal({ project, isAdmin, onClose, onSave }: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = project.cancellation_request_status === 'pending';
  const reviewing = isAdmin && pending;
  async function save(action: 'request' | 'approve' | 'reject') {
    if (saving) return;
    if (action !== 'approve' && !reason.trim()) { setError(action === 'reject' ? 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' : 'กรุณาระบุเหตุผลที่ขอยกเลิก'); return; }
    setSaving(true); setError('');
    try { await onSave(action, reason.trim()); } catch (cause) { setError(cause instanceof Error ? cause.message : 'ดำเนินการไม่สำเร็จ'); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onClick={() => { if (!saving) onClose(); }}>
    <div className="modal-card-box project-review-modal cancellation-modal" role="dialog" aria-modal="true" aria-label="คำขอยกเลิกโครงการ" onClick={event => event.stopPropagation()}>
      <div className="modal-card-header"><h2>{reviewing ? 'พิจารณาคำขอยกเลิกโครงการ' : 'ขอยกเลิกโครงการ'}</h2><button type="button" className="btn-modal-close" disabled={saving} onClick={onClose}>✕</button></div>
      <h3>{project.name}</h3>
      <ProjectDetails project={project} />
      {pending && <div className="returned-project-reason"><strong>เหตุผลที่ขอยกเลิก</strong><p>{project.cancellation_request_reason}</p></div>}
      {!pending && project.cancellation_request_status === 'rejected' && <p className="quarter-review-notice">คำขอก่อนหน้าไม่อนุมัติ: {project.cancellation_review_comment}</p>}
      {(!pending || reviewing) && <label className="field-block"><span className="field-label">{reviewing ? 'ความเห็นแอดมิน (จำเป็นเมื่อไม่อนุมัติ)' : 'เหตุผลที่ขอยกเลิกโครงการ *'}</span><textarea rows={4} disabled={saving} value={reason} onChange={event => setReason(event.target.value)} placeholder={reviewing ? 'ระบุเหตุผลประกอบการพิจารณา' : 'ระบุเหตุผลและความจำเป็นที่ต้องยกเลิกโครงการ'} /></label>}
      {!pending && <p className="progress-field-hint">การส่งคำขอจะยังไม่ยกเลิกโครงการ ต้องรอแอดมินอนุมัติก่อน</p>}
      {pending && !isAdmin && <p role="status">ส่งคำขอแล้ว กำลังรอแอดมินพิจารณา โครงการยังคงสถานะเดิม</p>}
      {error && <p className="alert-banner alert-danger" role="alert">{error}</p>}
      <div className="modal-footer-btns"><button type="button" className="btn-outline" disabled={saving} onClick={onClose}>ปิด</button>
        {!pending && <button type="button" className="btn-danger" disabled={saving} onClick={() => void save('request')}>{saving ? 'กำลังส่ง…' : 'ส่งคำขอยกเลิก'}</button>}
        {reviewing && <><button type="button" className="btn-outline" disabled={saving} onClick={() => void save('reject')}>ไม่อนุมัติการยกเลิก</button><button type="button" className="btn-danger" disabled={saving} onClick={() => void save('approve')}>อนุมัติการยกเลิก</button></>}
      </div>
    </div>
  </div>;
}
