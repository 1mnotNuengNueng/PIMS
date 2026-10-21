import React, { useState } from 'react';
import { PeriodFilter } from '../components/PeriodFilter';
import { ResubmissionNotice, isResubmitted } from '../components/ResubmissionNotice';
import { fiscalPeriodLabel, matchesPeriod } from '../utils/fiscalPeriod';
import type { Project, RefItem } from '../types';
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
  departments: RefItem[];
  setWordPreviewProject: (p: Project) => void;
  onOpenDetails: (project: Project) => void;
  onCancellationReview: (project: Project) => void;
  onCancelApprovedProject: (project: Project) => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({
  projects,
  departments,
  setWordPreviewProject,
  onOpenDetails,
  onCancellationReview,
  onCancelApprovedProject,
}) => {
  const [year, setYear] = useState('all');
  const [quarter, setQuarter] = useState('all');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const clearFilters = () => {
    setYear('all');
    setQuarter('all');
    setDepartment('all');
    setStatus('all');
  };
  const visibleProjects = projects.filter((project) => project.status !== 'draft' && matchesPeriod(project, year, quarter) &&
    (department === 'all' || String(project.department_id ?? project.user?.Major_id) === department) &&
    (status === 'all' || project.status === status))
    .sort((a, b) => {
      const priority = (project: Project) => project.status === 'submitted' ? 0 : project.cancellation_request_status === 'pending' ? 1 : 2;
      return priority(a) - priority(b) || new Date(b.update_at).getTime() - new Date(a.update_at).getTime();
    });
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
      <p className="review-filter-hint">กรองตามปี ไตรมาส และหน่วยงาน แล้วเลือกรอบรายงานที่ต้องการตรวจในหน้ารายละเอียด</p>
      <PeriodFilter projects={projects} year={year} quarter={quarter} onYearChange={setYear} onQuarterChange={setQuarter}>
        <label>หน่วยงาน / ภาควิชา
          <select className="filter-drop" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="all">ทุกหน่วยงาน</option>
            {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>สถานะ
          <select className="filter-drop" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            <option value="submitted">ส่งข้อเสนอแล้ว / รอพิจารณา</option>
            <option value="resubmit">ส่งกลับแก้ไข</option>
            <option value="approve">อนุมัติแล้ว</option>
            <option value="cancel">ยกเลิก</option>
          </select>
        </label>
        <button type="button" className="btn-clear-search" onClick={clearFilters}>ล้างตัวกรอง</button>
      </PeriodFilter>
      <div className="review-cards-list">
        {!visibleProjects.length && <p className="empty-cell">ไม่พบโครงการตามปีงบประมาณ ไตรมาส และหน่วยงานที่เลือก</p>}
        {visibleProjects.map((p) => (
          <article className={`review-item-card ${statusColors[p.status]}`} key={p.id}>
            <div className="review-card-head">
              <div className="review-badge-group">
                <span className={`status-badge ${statusColors[p.status]}`}>
                  {statusLabels[p.status]}
                </span>
                <span className="dept-tag">
                  <BuildingIcon size={13} /> {(p.department?.name || p.user?.major?.name) || '-'}
                </span>
              </div>
              <strong className="review-budget-tag">
                {formatMoney(p.budget_amount)} บาท
              </strong>
            </div>

            <h3 className="review-project-title">{p.name}</h3>
            {p.cancellation_request_status === 'pending' && <div className="returned-project-reason"><strong>มีคำขอยกเลิกโครงการรอพิจารณา</strong><p>{p.cancellation_request_reason}</p><button type="button" className="btn-outline" onClick={() => onCancellationReview(p)}>พิจารณาคำขอยกเลิก</button></div>}
            <ResubmissionNotice project={p} />
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
                <b>{isResubmitted(p) ? 'ข้อเสนอแนะจากรอบก่อน:' : 'บันทึกความเห็นผู้ตรวจ:'}</b> {p.review_comment}
              </div>
            )}

            {/* ACTION CONTROLS */}
            <div className="review-card-footer">
              <button type="button" className={`btn-trigger-review ${p.status === 'submitted' ? 'btn-review-status' : ''}`} onClick={() => onOpenDetails(p)}>
                {p.status === 'submitted' ? 'พิจารณาสถานะโครงการ' : 'ดูรายละเอียด / ตรวจรายไตรมาส'}
              </button>
              <button
                type="button"
                className="btn-preview-word"
                onClick={() => setWordPreviewProject(p)}
              >
                <FileTextIcon size={14} />
                <span>ตรวจแบบฟอร์มทางการ (Word Form)</span>
              </button>
              {p.status === 'approve' && p.cancellation_request_status !== 'pending' && (
                <button type="button" className="btn-danger" onClick={(event) => { event.stopPropagation(); onCancelApprovedProject(p); }}>
                  ยกเลิกการอนุมัติ
                </button>
              )}

            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
