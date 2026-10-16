import React from 'react';
import type { Project } from '../types';
import { statusLabels } from '../types';
import { formatMoney } from '../utils/format';
import { GearIcon, DownloadIcon, PrinterIcon } from './Icons';

const documentLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const numberedDocumentLines = (value: string) => documentLines(value || '-').map((line, index) =>
  /^\d+[.)]/.test(line) ? line : `${index + 1}. ${line}`,
);
const bulletedDocumentLines = (value: string) => documentLines(value || '-').map((line) =>
  /^[-•]/.test(line) ? line : `• ${line}`,
);

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
            <h1 className="doc-main-title">โครงการ {project.name}</h1>
            <h2 className="doc-sub-title">คณะวิศวกรรมศาสตร์ กำแพงแสน มหาวิทยาลัยเกษตรศาสตร์</h2>
            <div className="doc-line-separator" />
          </header>

          <section className="a4-doc-content">
            <div className="doc-item-row">
              <span className="doc-sec-num">1. แผนยุทธศาสตร์/แผนกลยุทธ์:</span>
              <div className="doc-sub-block">
                <p><b>แผนยุทธศาสตร์:</b> {project.strategic_plan?.name || '-'}</p>
                {project.strategic_goal && <p><b>เป้าประสงค์เชิงกลยุทธ์:</b> {project.strategic_goal}</p>}
                {project.strategic_kpi && <p><b>ตัวชี้วัดระดับยุทธศาสตร์:</b> {project.strategic_kpi}</p>}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">2. ชื่อโครงการ:</span>
              <span className="doc-sec-bold">{project.name}</span>
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
                {documentLines(project.principles_rationale || '-').map((line, idx) => <p key={idx}>{line}</p>)}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">5. วัตถุประสงค์ของโครงการ:</span>
              <div className="doc-indent-text">
                {numberedDocumentLines(project.objective).map((line, idx) => <p key={idx}>{line}</p>)}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">6. กลุ่มเป้าหมาย:</span>
              <span className="doc-sec-val">{project.target_group}</span>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">7. วิธีการดำเนินการ:</span>
              <div className="doc-indent-text">
                {numberedDocumentLines(project.implementation_procedure).map((line, idx) => <p key={idx}>{line}</p>)}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">8. ระยะเวลาของการดำเนินงาน:</span>
              <div className="doc-sub-block">
                {bulletedDocumentLines(project.duration_of_operations).map((line, idx) => <p key={idx}>{line}</p>)}
                <p><b>กำหนดแล้วเสร็จ:</b> {project.target_date || '-'}</p>
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">9. สถานที่การดำเนินการ:</span>
              <div className="doc-indent-text">
                {bulletedDocumentLines(project.location).map((line, idx) => <p key={idx}>{line}</p>)}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">10. การประเมินผล (ตัวชี้วัด):</span>
              <div className="doc-sub-block">
                <p>
                  <b>ตัวชี้วัดความสำเร็จ (KPI):</b>{' '}
                  {project.project_kpi || project.evaluation || '-'}
                </p>
                <p><b>ค่าเป้าหมาย:</b> {project.kpi_target || '-'}</p>
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">11. ผลที่คาดว่าจะได้รับ:</span>
              <div className="doc-indent-text">
                {bulletedDocumentLines(project.expected_outcomes).map((line, idx) => <p key={idx}>{line}</p>)}
              </div>
            </div>

            <div className="doc-item-row">
              <span className="doc-sec-num">12. งบประมาณดำเนินการ:</span>
              <div className="doc-sub-block">
                <p><b>แหล่งงบประมาณ:</b> {project.operating_budget?.name || '-'}</p>
                <p>
                  <b>งบประมาณรวม:</b>{' '}
                  <strong className="budget-highlight">{formatMoney(project.budget_amount)} บาท</strong>
                </p>
              </div>
            </div>

            {/* Review Feedback history if present */}
            {project.review_comment && (
              <div className="doc-item-row doc-audit-note">
                <span className="doc-sec-num">บันทึกความเห็นจากฝ่ายพัฒนาองค์กร / ผู้อนุมัติ:</span>
                <div className="doc-audit-highlight">
                  [สถานะ: {statusLabels[project.status]}]{' '}
                  {project.review_comment}
                </div>
              </div>
            )}

            {/* SIGNATURE BLOCK */}
            <div className="doc-signatures-grid">
              <div className="signature-box">
                <span className="signature-label">ผู้รับผิดชอบโครงการ</span>
                <div className="sign-line" />
                <strong className="sign-name">({project.responsible_person})</strong>
                <span className="sign-title">ผู้รับผิดชอบโครงการ / ผู้เสนอโครงการ</span>
                <span className="sign-date">วันที่ ...... / ...... / 2569</span>
              </div>

              <div className="signature-box">
                <span className="signature-label">ผู้อนุมัติโครงการ</span>
                <div className="sign-line" />
                <strong className="sign-name">(รองศาสตราจารย์ ดร.สมชาย ดอนเจดีย์)</strong>
                <span className="sign-title">คณบดีคณะวิศวกรรมศาสตร์ กำแพงแสน</span>
                <span className="sign-date">วันที่ ...... / ...... / 2569</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
