import React from 'react';
import type { Project } from '../types';
import { statusLabels } from '../types';
import { formatMoney } from '../utils/format';
import { GearIcon, DownloadIcon, PrinterIcon } from './Icons';

interface WordPreviewModalProps {
  project: Project | null;
  onClose: () => void;
  onDownloadWord: (projectId: number) => void;
}

export const WordPreviewModal: React.FC<WordPreviewModalProps> = ({
  project,
  onClose,
  onDownloadWord,
}) => {
  if (!project) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="word-doc-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Toolbar */}
        <div className="doc-toolbar">
          <div className="doc-toolbar-info">
            <span className="doc-badge">OFFICIAL DOCUMENT</span>
            <strong>แบบเสนอโครงการ • {project.name}</strong>
          </div>

          <div className="doc-toolbar-actions">
            <button
              type="button"
              className="btn-doc-download"
              onClick={() => onDownloadWord(project.id)}
            >
              <DownloadIcon size={14} />
              <span>ดาวน์โหลด Word (.docx)</span>
            </button>
            <button
              type="button"
              className="btn-doc-print"
              onClick={() => window.print()}
            >
              <PrinterIcon size={14} />
              <span>พิมพ์เอกสาร / บันทึก PDF</span>
            </button>
            <button
              type="button"
              className="btn-doc-close"
              onClick={onClose}
            >
              ✕ ปิด
            </button>
          </div>
        </div>

        {/* A4 Sheet Body */}
        <div className="a4-document-sheet">
          <header className="a4-doc-header">
            <div className="doc-emblem">
              <GearIcon size={26} />
            </div>
            <h1 className="doc-main-title">แบบเสนอโครงการ ประจำปีงบประมาณ พ.ศ. 2569</h1>
            <h2 className="doc-sub-title">คณะวิศวกรรมศาสตร์ กำแพงแสน มหาวิทยาลัยเกษตรศาสตร์</h2>
            <div className="doc-line-separator" />
          </header>

          <section className="a4-doc-content">
            <div className="doc-item-row">
              <span className="doc-sec-num">1. ชื่อโครงการ:</span>
              <span className="doc-sec-bold">{project.name}</span>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">2. ความสอดคล้องกับแผนยุทธศาสตร์คณะ:</span>
              <div className="doc-sub-block">
                <p><b>2.1 ประเด็นยุทธศาสตร์:</b> {project.strategic_plan?.name || '-'}</p>
                <p><b>2.2 เป้าประสงค์เชิงกลยุทธ์:</b> {project.strategic_goal || '-'}</p>
                <p><b>2.3 ตัวชี้วัดระดับยุทธศาสตร์:</b> {project.strategic_kpi || '-'}</p>
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">3. ผู้รับผิดชอบโครงการและหน่วยงาน:</span>
              <div className="doc-sub-block">
                <p><b>3.1 ผู้รับผิดชอบโครงการ:</b> {project.responsible_person}</p>
                <p><b>3.2 ภาควิชา / หน่วยงาน:</b> {project.user?.major?.name || project.target_group}</p>
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">4. หลักการและเหตุผล:</span>
              <div className="doc-indent-text">
                {project.principles_rationale || '-'}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">5. วัตถุประสงค์ของโครงการ:</span>
              <div className="doc-indent-text">
                {project.objective
                  .split('\n')
                  .filter(Boolean)
                  .map((o, idx) => (
                    <p key={idx}>{o.startsWith(String(idx + 1)) ? o : `${idx + 1}. ${o}`}</p>
                  ))}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">6. กลุ่มเป้าหมาย / ผู้เข้าร่วมโครงการ:</span>
              <span className="doc-sec-val">{project.target_group}</span>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">7. วิธีดำเนินการ / แผนขั้นตอนการดำเนินงาน:</span>
              <div className="doc-indent-text">
                {project.implementation_procedure
                  .split('\n')
                  .filter(Boolean)
                  .map((m, idx) => (
                    <p key={idx}>{m.startsWith(String(idx + 1)) ? m : `${idx + 1}. ${m}`}</p>
                  ))}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">8. ระยะเวลาและสถานที่ดำเนินงาน:</span>
              <div className="doc-sub-block">
                <p>
                  <b>8.1 ระยะเวลาดำเนินการ:</b> {project.duration_of_operations}{' '}
                  (เป้าหมายแล้วเสร็จ: {project.target_date || '-'})
                </p>
                <p><b>8.2 สถานที่ดำเนินงาน:</b> {project.location || '-'}</p>
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">9. ตัวชี้วัดความสำเร็จของโครงการ (KPI) และค่าเป้าหมาย:</span>
              <div className="doc-sub-block">
                <p>
                  <b>9.1 ตัวชี้วัดความสำเร็จ (KPI):</b>{' '}
                  {project.project_kpi || project.evaluation}
                </p>
                <p><b>9.2 ค่าเป้าหมาย:</b> {project.kpi_target || '-'}</p>
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">10. งบประมาณและแหล่งเงินทุน:</span>
              <div className="doc-sub-block">
                <p><b>10.1 แหล่งงบประมาณ:</b> {project.operating_budget?.name || '-'}</p>
                <p>
                  <b>10.2 วงเงินงบประมาณรวม:</b>{' '}
                  <strong className="budget-highlight">
                    {formatMoney(project.budget_amount)} บาท
                  </strong>
                </p>
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">11. ประโยชน์และผลลัพธ์ที่คาดว่าจะได้รับ:</span>
              <div className="doc-indent-text">
                {project.expected_outcomes || '-'}
              </div>
            </div>

            {/* Review Feedback history if present */}
            {project.review_comment && (
              <div className="doc-item-row doc-audit-note">
                <span className="doc-sec-num">12. บันทึกความเห็นจากฝ่ายพัฒนาองค์กร / ผู้อนุมัติ:</span>
                <div className="doc-audit-highlight">
                  [สถานะ: {statusLabels[project.status]}]{' '}
                  {project.review_comment}
                </div>
              </div>
            )}

            {/* SIGNATURE BLOCK */}
            <div className="doc-signatures-grid">
              <div className="signature-box">
                <p>(ลงชื่อ).................................................................</p>
                <strong>({project.responsible_person})</strong>
                <span>ผู้รับผิดชอบโครงการ / ผู้เสนอโครงการ</span>
                <span>วันที่ ...... / ...... / 2569</span>
              </div>

              <div className="signature-box">
                <p>(ลงชื่อ).................................................................</p>
                <strong>(รองศาสตราจารย์ ดร.สมชาย ดอนเจดีย์)</strong>
                <span>คณบดีคณะวิศวกรรมศาสตร์ กำแพงแสน (ผู้อนุมัติโครงการ)</span>
                <span>วันที่ ...... / ...... / 2569</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
