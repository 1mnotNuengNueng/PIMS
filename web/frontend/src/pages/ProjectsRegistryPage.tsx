import React from 'react';
import type { User, Project, ProjectForm, Metadata } from '../types';
import { statusLabels, statusColors, emptyForm } from '../types';
import { formatMoney } from '../utils/format';
import {
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  AlertCircleIcon,
  DownloadIcon,
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
  downloadWord: (projectId: number) => void;
  setProgressModalProject: (p: Project) => void;
  setProgressRiskText: (text: string) => void;
  setOperationPlanText: (text: string) => void;
  editProject: (p: Project) => void;
  isApprover: boolean;
  setReviewModalProject: (p: Project) => void;
  setReviewAction: (action: 'approve' | 'resubmit' | 'cancel') => void;
  setReviewComment: (comment: string) => void;
  deleteProject: (projectId: number) => void;
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
  downloadWord,
  setProgressModalProject,
  setProgressRiskText,
  setOperationPlanText,
  editProject,
  isApprover,
  setReviewModalProject,
  setReviewAction,
  setReviewComment,
  deleteProject,
}) => {
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
              operatingBudgetId: String(metadata.operatingBudgets[0]?.id || ''),
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
      <div className="filter-toolbar-box">
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

        <div className="filter-dropdowns">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-drop"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="approve">อนุมัติแล้ว</option>
            <option value="resubmit">ส่งกลับแก้ไข</option>
            <option value="draft">ฉบับร่าง</option>
            <option value="cancel">ยกเลิก</option>
          </select>

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
        </div>
      </div>

      {/* Main Projects Table */}
      <div className="content-card full-card">
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>ชื่อโครงการ</th>
                <th>ภาควิชา / หน่วยงาน</th>
                <th>งบประมาณ</th>
                <th>กำหนดเสร็จ</th>
                <th>สถานะ</th>
                <th>อัปเดตล่าสุด</th>
                <th className="text-center">การจัดการ & เอกสาร</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <span className="cell-subtext" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserIcon size={12} /> {p.responsible_person}
                    </span>
                    {p.status === 'resubmit' && p.review_comment && (
                      <span className="urgent-badge-inline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircleIcon size={12} /> ข้อเสนอแนะ: {p.review_comment}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="dept-pill">{p.target_group}</span>
                  </td>
                  <td>
                    <strong>{formatMoney(p.budget_amount)} บาท</strong>
                    <span className="cell-subtext">{p.operating_budget?.name || '-'}</span>
                  </td>
                  <td>{p.target_date || p.duration_of_operations}</td>
                  <td>
                    <span className={`status-badge ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                  </td>
                  <td className="cell-subtext">
                    {new Date(p.update_at).toLocaleDateString('th-TH')}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-action-view"
                        title="ดูแบบเสนอโครงการทางการ (Word Form)"
                        onClick={() => setWordPreviewProject(p)}
                      >
                        <FileTextIcon size={13} />
                        <span>Word Form</span>
                      </button>

                      <button
                        type="button"
                        className="btn-action-download"
                        title="ดาวน์โหลดไฟล์ .docx"
                        onClick={() => downloadWord(p.id)}
                      >
                        <DownloadIcon size={13} />
                        <span>docx</span>
                      </button>

                      {/* Staff progress update button */}
                      {personaMode === 'staff' && (
                        <button
                          type="button"
                          className="btn-action-progress"
                          title="อัปเดตรายงานความก้าวหน้ารายไตรมาส"
                          onClick={() => {
                            setProgressModalProject(p);
                            setProgressRiskText(p.progress_risk || '');
                            setOperationPlanText(p.operation_plan || '');
                          }}
                        >
                          <TrendingUpIcon size={13} />
                          <span>อัปเดตงาน</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => editProject(p)}
                      >
                        <EditIcon size={13} />
                        <span>แก้ไข</span>
                      </button>

                      {/* Admin review button */}
                      {isApprover && (
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
                        onClick={() => deleteProject(p.id)}
                        title="ลบโครงการ"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredProjects.length && (
                <tr>
                  <td colSpan={7} className="text-center empty-cell">
                    ไม่พบโครงการที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
