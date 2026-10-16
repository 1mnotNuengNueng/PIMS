import React from 'react';
import type { Project } from '../types';
import { statusLabels } from '../types';
import { TrendingUpIcon } from './Icons';

interface ProgressModalProps {
  project: Project | null;
  progressRiskText: string;
  setProgressRiskText: (text: string) => void;
  operationPlanText: string;
  setOperationPlanText: (text: string) => void;
  loading: boolean;
  onClose: () => void;
  onSubmitProgressUpdate: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  project,
  progressRiskText,
  setProgressRiskText,
  operationPlanText,
  setOperationPlanText,
  loading,
  onClose,
  onSubmitProgressUpdate,
}) => {
  if (!project) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card-box" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#0284c7', color: '#fff', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <TrendingUpIcon size={20} />
            </div>
            <div>
              <h2>อัปเดตรายงานความก้าวหน้าโครงการ</h2>
              <p>สำหรับสาขาวิชาบันทึกความคืบหน้าส่งให้ฝ่ายพัฒนาองค์กร</p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-project-brief">
          <strong>{project.name}</strong>
          <p>สถานะ: {statusLabels[project.status]} • ผู้รับผิดชอบ: {project.responsible_person}</p>
        </div>

        <label className="field-block">
          <span className="field-label required">ความก้าวหน้าในการดำเนินงาน / ปัญหาอุปสรรคและความเสี่ยง:</span>
          <textarea
            rows={4}
            value={progressRiskText}
            onChange={(e) => setProgressRiskText(e.target.value)}
            placeholder="ระบุความคืบหน้า เช่น อยู่ระหว่างดำเนินกิจกรรมรอบที่ 1 ความสำเร็จคิดเป็น 75%, พบปัญหาความล่าช้าในการจัดส่งอุปกรณ์..."
          />
        </label>

        <label className="field-block">
          <span className="field-label">แผนการดำเนินงานในเดือนถัดไป / ช่วงเวลา:</span>
          <input
            type="text"
            value={operationPlanText}
            onChange={(e) => setOperationPlanText(e.target.value)}
            placeholder="เช่น ต.ค. 2568 - ส.ค. 2569"
          />
        </label>

        <div className="modal-footer-btns">
          <button type="button" className="btn-outline" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={loading}
            onClick={onSubmitProgressUpdate}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกรายงานความก้าวหน้า'}
          </button>
        </div>
      </div>
    </div>
  );
};
