import React, { useState } from 'react';
import { PeriodFilter } from '../components/PeriodFilter';
import { fiscalPeriodLabel, matchesPeriod } from '../utils/fiscalPeriod';
import type { Project } from '../types';
import { statusLabels, statusColors } from '../types';
import { formatMoney } from '../utils/format';
import {
  ShieldIcon,
  CheckCircleIcon,
  BuildingIcon,
  FileTextIcon,
} from '../components/Icons';

interface ApprovalsPageProps {
  projects: Project[];
  setWordPreviewProject: (p: Project) => void;
  onOpenDetails: (project: Project) => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({
  projects,
  setWordPreviewProject,
  onOpenDetails,
}) => {
  const [year, setYear] = useState('all');
  const [quarter, setQuarter] = useState('all');
  const visibleProjects = projects.filter((project) => matchesPeriod(project, year, quarter));
  return (
    <div className="view-container animate-fade">
      <div className="desk-hero">
        <div>
          <span className="desk-badge">REVIEW & AUDIT DESK</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldIcon size={22} style={{ color: '#8F1730' }} />
            <span>โต๊ะตรวจเอกสารและพิจารณาอนุมัติโครงการ</span>
          </h1>
          <p>
            เครื่องมือสำหรับฝ่ายพัฒนาองค์กรและผู้บริหาร ในการตรวจสอบความถูกต้อง ความคุ้มค่า และการอนุมัติโครงการ
          </p>
        </div>

        <div className="desk-audit-standards">
          <span className="audit-title">เกณฑ์การตรวจสอบ 4 มิติ:</span>
          <span className="audit-item"><CheckCircleIcon size={14} /> ยุทธศาสตร์คณะ</span>
          <span className="audit-item"><CheckCircleIcon size={14} /> ความสมเหตุสมผลของงบ</span>
          <span className="audit-item"><CheckCircleIcon size={14} /> ตัวชี้วัด KPI วัดผลได้</span>
          <span className="audit-item"><CheckCircleIcon size={14} /> แผนดำเนินงานชัดเจน</span>
        </div>
      </div>

      {/* REVIEW ITEMS GRID */}
      <p className="review-filter-hint">กรองตามปีและไตรมาสในแผนโครงการ แล้วเลือกรอบรายงานที่ต้องการตรวจในหน้ารายละเอียด</p>
      <PeriodFilter projects={projects} year={year} quarter={quarter} onYearChange={setYear} onQuarterChange={setQuarter} />
      <div className="review-cards-list">
        {!visibleProjects.length && <p className="empty-cell">ไม่พบโครงการในปีงบประมาณ / ไตรมาสที่เลือก</p>}
        {visibleProjects.map((p) => (
          <article className={`review-item-card ${statusColors[p.status]}`} key={p.id}>
            <div className="review-card-head">
              <div className="review-badge-group">
                <span className={`status-badge ${statusColors[p.status]}`}>
                  {statusLabels[p.status]}
                </span>
                <span className="dept-tag">
                  <BuildingIcon size={13} /> {p.target_group}
                </span>
              </div>
              <strong className="review-budget-tag">
                {formatMoney(p.budget_amount)} บาท
              </strong>
            </div>

            <h3 className="review-project-title">{p.name}</h3>
            <p className="project-period">แผนดำเนินโครงการ: {fiscalPeriodLabel(p.fiscal_year, p.quarter)}</p>

            <div className="review-details-grid">
              <div>
                <span className="detail-label">ผู้รับผิดชอบโครงการ:</span>
                <strong className="detail-value">{p.responsible_person}</strong>
              </div>
              <div>
                <span className="detail-label">ยุทธศาสตร์คณะ:</span>
                <strong className="detail-value">{p.strategic_plan?.name || '-'}</strong>
              </div>
              <div>
                <span className="detail-label">แหล่งงบประมาณ:</span>
                <strong className="detail-value">{p.operating_budget?.name || '-'}</strong>
              </div>
              <div>
                <span className="detail-label">กำหนดแล้วเสร็จ:</span>
                <strong className="detail-value">{p.target_date || p.duration_of_operations}</strong>
              </div>
              <div className="col-span-2">
                <span className="detail-label">ตัวชี้วัดความสำเร็จ (KPI):</span>
                <strong className="detail-value">{p.project_kpi || p.evaluation || '-'}</strong>
              </div>
            </div>

            {/* If already has review feedback */}
            {p.review_comment && (
              <div className="review-feedback-history">
                <b>บันทึกความเห็นผู้ตรวจ:</b> {p.review_comment}
              </div>
            )}

            {/* ACTION CONTROLS */}
            <div className="review-card-footer">
              <button type="button" className="btn-trigger-review" onClick={() => onOpenDetails(p)}>
                ดูรายละเอียด / ตรวจรายไตรมาส
              </button>
              <button
                type="button"
                className="btn-preview-word"
                onClick={() => setWordPreviewProject(p)}
              >
                <FileTextIcon size={14} />
                <span>ตรวจแบบฟอร์มทางการ (Word Form)</span>
              </button>

            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
