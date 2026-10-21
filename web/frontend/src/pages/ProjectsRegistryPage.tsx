import React, { useState } from 'react';
import { PeriodFilter } from '../components/PeriodFilter';
import { ResubmissionNotice } from '../components/ResubmissionNotice';
import { fiscalPeriodLabel, matchesPeriod } from '../utils/fiscalPeriod';
import type { User, Project, ProjectForm, Metadata } from '../types';
import { statusLabels, statusColors, emptyForm } from '../types';
import { formatMoney } from '../utils/format';
import { StaffProgressSummary } from '../components/StaffProgressSummary';
import {
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  EditIcon,
  ShieldIcon,
  TrashIcon,
} from '../components/Icons';

interface ProjectsRegistryPageProps {
  personaMode: 'admin' | 'staff';
  user: User | null;
  filteredProjects: Project[];
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  strategyFilter: string;
  setStrategyFilter: (s: string) => void;
  metadata: Metadata;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  setActiveTab: (tab: string) => void;
  setActiveStep: (step: number) => void;
  setWordPreviewProject: (p: Project) => void;
  setProgressModalProject: (p: Project) => void;
  editProject: (p: Project) => void;
  isApprover: boolean;
  setReviewModalProject: (p: Project) => void;
  setReviewAction: (action: 'approve' | 'resubmit' | 'cancel') => void;
  setReviewComment: (comment: string) => void;
  deleteProject: (projectId: number) => void;
  onCreateReplacement: (project: Project) => void;
}

export const ProjectsRegistryPage: React.FC<ProjectsRegistryPageProps> = ({
  personaMode,
  user,
  filteredProjects,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  strategyFilter,
  setStrategyFilter,
  metadata,
  setForm,
  setActiveTab,
  setActiveStep,
  setWordPreviewProject,
  setProgressModalProject,
  editProject,
  isApprover,
  setReviewModalProject,
  setReviewAction,
  setReviewComment,
  deleteProject,
  onCreateReplacement,
}) => {
  const [year, setYear] = useState('all');
  const [quarter, setQuarter] = useState('all');
  const visibleProjects = filteredProjects.filter((project) => matchesPeriod(project, year, quarter));
  const statusOrder: Project['status'][] = personaMode === 'staff'
    ? ['resubmit', 'submitted', 'approve', 'cancel']
    : ['resubmit', 'submitted', 'draft', 'approve', 'cancel'];
  const groups = statusOrder.map((status) => ({ status, projects: visibleProjects.filter((project) => project.status === status) })).filter((group) => group.projects.length > 0);
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setStrategyFilter('all');
    setYear('all');
    setQuarter('all');
  };
  return (
    <div className="view-container animate-fade">
      <div className="projects-header-row">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileTextIcon size={22} style={{ color: '#8F1730' }} />
            <span>
              {personaMode === 'admin'
                ? 'ทะเบียนโครงการทั้งหมดของคณะวิศวกรรมศาสตร์'
                : `ทะเบียนโครงการของ: ${user?.major || 'สาขาวิชา'}`}
            </span>
          </h1>
          <p>ตรวจสอบ ติดตามสถานะงาน และดาวน์โหลดแบบฟอร์มเอกสารทางการ</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setForm({
              ...emptyForm,
              strategicPlanId: String(metadata.strategicPlans[0]?.id || ''),
              department: user?.major || '',
            });
            setActiveTab('submit_form');
            setActiveStep(0);
          }}
        >
          <PlusIcon size={15} />
          <span>ยื่นโครงการใหม่</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar-box registry-search-toolbar">
        <div className="search-input-wrap">
          <span className="search-icon">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อโครงการ, ผู้รับผิดชอบ, ภาควิชา..."
          />
          {search && (
            <button type="button" className="btn-clear-search" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>
        <button type="button" className="btn-clear-search" onClick={clearFilters}>ล้างตัวกรอง</button>
      </div>

      <PeriodFilter projects={filteredProjects} year={year} quarter={quarter} onYearChange={setYear} onQuarterChange={setQuarter}>
        <label>สถานะ
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-drop"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="approve">อนุมัติแล้ว</option>
            <option value="resubmit">ส่งกลับแก้ไข</option>
            {personaMode !== 'staff' && <option value="draft">ฉบับร่าง</option>}
            <option value="submitted">ส่งข้อเสนอแล้ว / รอพิจารณา</option>
            <option value="cancel">ยกเลิก</option>
          </select>
        </label>
        <label>ยุทธศาสตร์
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="filter-drop"
          >
            <option value="all">ทุกยุทธศาสตร์ (ย.1 - ย.4)</option>
            {metadata.strategicPlans.map((s, idx) => (
              <option key={s.id} value={String(s.id)}>
                ย.{idx + 1}
              </option>
            ))}
          </select>
        </label>
      </PeriodFilter>
      {!visibleProjects.length && <div className="content-card empty-cell">ไม่พบโครงการที่ค้นหา</div>}
      {groups.map((group) => (
      <details key={group.status} open={group.status === 'resubmit' || statusFilter !== 'all' || groups.length === 1} className={`content-card full-card project-status-group project-status-group-${group.status}`}>
        <summary className="project-status-group-heading">
          <span className="project-status-group-title">
            <span className={`status-badge ${statusColors[group.status]}`}>{statusLabels[group.status]}</span>
            <span className="project-status-group-count">{group.projects.length} โครงการ</span>
          </span>
          <span className="registry-group-toggle" aria-hidden="true">⌄</span>
        </summary>
        <div className="registry-project-list">
              {group.projects.map((p) => (
                <article className="registry-project-card registry-project-compact" key={p.id}>
                  <div className="registry-project-identity">
                    <h3>{p.name}</h3>
                    {p.cancellation_request_status === 'pending' && <span className="status-badge orange">รอพิจารณาคำขอยกเลิก</span>}
                    {p.cancellation_request_status === 'rejected' && <span className="registry-needs-edit">คำขอยกเลิกไม่อนุมัติ: {p.cancellation_review_comment}</span>}
                    <ResubmissionNotice project={p} />
                    <p className="registry-project-period">{fiscalPeriodLabel(p.fiscal_year, p.quarter)}</p>
                    {p.status === 'resubmit' && <span className="registry-needs-edit">ต้องแก้ไขก่อนส่งพิจารณาอีกครั้ง</span>}
                  </div>
                  <strong className="registry-compact-budget">{formatMoney(p.budget_amount)} บาท</strong>
                  <details className="registry-project-expand">
                    <summary>รายละเอียดโครงการ{p.status === 'resubmit' ? ' / สิ่งที่ต้องแก้ไข' : ''}</summary>
                    <dl className="registry-project-facts">
                      <div><dt>หน่วยงาน</dt><dd>{(p.department?.name || p.user?.major?.name) || '-'}</dd></div>
                      <div><dt>ผู้รับผิดชอบ</dt><dd>{p.responsible_person || '-'}</dd></div>
                      <div><dt>งบประมาณ</dt><dd className="registry-project-budget">{formatMoney(p.budget_amount)} บาท</dd></div>
                      <div><dt>แหล่งงบประมาณ</dt><dd>{p.operating_budget?.name || '-'}</dd></div>
                      <div><dt>วันสิ้นสุดดำเนินงาน</dt><dd>{p.target_date || p.duration_of_operations || '-'}</dd></div>
                      <div><dt>อัปเดตล่าสุด</dt><dd>{new Date(p.update_at).toLocaleDateString('th-TH')}</dd></div>
                    </dl>
                    {p.status === 'resubmit' && p.review_comment && (
                      <div className="returned-project-reason">
                        <strong><AlertCircleIcon size={12} /> สิ่งที่ต้องแก้ไข</strong>
                        <p>{p.review_comment}</p>
                      </div>
                    )}
                  {personaMode === 'staff' && p.status === 'approve' && <div className="registry-project-progress"><StaffProgressSummary project={p} /></div>}
                  </details>
                    <div className="registry-project-actions">
                      <button
                        type="button"
                        className="btn-action-view"
                        title="ดูแบบเสนอโครงการทางการ (Word Form)"
                        onClick={() => setWordPreviewProject(p)}
                      >
                        <FileTextIcon size={13} />
                        <span>Word Form</span>
                      </button>

                      {/* Staff progress update button */}
                      {personaMode === 'staff' && p.status === 'approve' && (
                        <button
                          type="button"
                          className="btn-action-progress"
                          title="อัปเดตรายงานความก้าวหน้ารายไตรมาส"
                          onClick={() => {
                            setProgressModalProject(p);
                          }}
                        >
                          <TrendingUpIcon size={13} />
                          <span>รายงานความคืบหน้า</span>
                        </button>
                      )}

                      {(p.status === 'resubmit' || p.status === 'approve' || (personaMode !== 'staff' && p.status === 'draft')) && <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => editProject(p)}
                      >
                        <EditIcon size={13} />
                        <span>แก้ไข</span>
                      </button>}

                      {/* Admin review button */}
                      {isApprover && p.status === 'submitted' && (
                        <button
                          type="button"
                          className="btn-action-review"
                          onClick={() => {
                            setReviewModalProject(p);
                            setReviewAction('approve');
                            setReviewComment(p.review_comment || '');
                          }}
                        >
                          <ShieldIcon size={13} />
                          <span>ตรวจงาน</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-action-del"
                        disabled={p.status === 'cancel'}
                        onClick={() => deleteProject(p.id)}
                        title={p.cancellation_request_status === 'pending' ? 'คำขอยกเลิกรอพิจารณา' : 'ขอยกเลิกโครงการ'}
                      >
                        <TrashIcon size={13} />
                        <span>{p.cancellation_request_status === 'pending' ? (isApprover ? 'พิจารณาคำขอยกเลิก' : 'คำขอยกเลิก') : 'ขอยกเลิก'}</span>
                      </button>
                      {p.status === 'cancel' && <button type="button" className="btn-outline" onClick={() => onCreateReplacement(p)}><PlusIcon size={14} /> สร้างโครงการทดแทน</button>}
                    </div>
                </article>
              ))}
        </div>
      </details>
      ))}
    </div>
  );
};
