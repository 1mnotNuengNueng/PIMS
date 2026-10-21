import React from 'react';
import type { User, Project } from '../types';
import { statusLabels, statusColors } from '../types';
import { formatMoney } from '../utils/format';
import { StaffProgressSummary } from '../components/StaffProgressSummary';
import {
  FileTextIcon,
  FolderIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  DollarIcon,
  TrendingUpIcon,
  EditIcon,
} from '../components/Icons';

interface StaffDashboardProps {
  user: User;
  currentDepartmentProjects: Project[];
  branchResubmitCount: number;
  setActiveTab: (tab: string) => void;
  loadDepartmentSample: () => void;
  editProject: (p: Project) => void;
  setWordPreviewProject: (p: Project) => void;
  setProgressModalProject: (p: Project) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  user,
  currentDepartmentProjects,
  branchResubmitCount,
  setActiveTab,
  loadDepartmentSample,
  editProject,
  setWordPreviewProject,
  setProgressModalProject,
}) => {
  const totalBranchBudget = currentDepartmentProjects.reduce((sum, p) => sum + (p.budget_amount || 0), 0);
  const approvedBranchBudget = currentDepartmentProjects
    .filter((p) => p.status === 'approve')
    .reduce((sum, p) => sum + (p.budget_amount || 0), 0);

  return (
    <div className="view-container animate-fade">
      {/* Department Hero */}
      <div className="executive-hero">
        <div className="hero-text">
          <span className="hero-badge-tag">DEPARTMENT WORKSPACE • สาขาวิชา / ฝ่ายงาน</span>
          <h1 className="hero-title-main">พื้นที่ปฏิบัติงาน: {user?.major || 'สาขาวิชา'}</h1>
          <h2 className="hero-title-sub">คณะวิศวกรรมศาสตร์ กำแพงแสน</h2>
          <p className="hero-text-desc">
            ระบบจัดการ ยื่นเอกสารแบบเสนอโครงการ และรายงานความก้าวหน้าตามแผนปฏิบัติการทุกปีงบประมาณ
          </p>
        </div>

        <div className="hero-cta-actions">
          <button
            type="button"
            className="btn-hero-year"
            onClick={() => {
              setActiveTab('submit_form');
              loadDepartmentSample();
            }}
            style={{ background: '#8F1730', color: '#ffffff' }}
          >
            <FileTextIcon size={15} />
            <span>ยื่นแบบเสนอโครงการใหม่</span>
            <ArrowRightIcon size={14} />
          </button>
          <button
            type="button"
            className="btn-hero-report"
            onClick={() => setActiveTab('my_projects')}
          >
            <FolderIcon size={15} />
            <span>โครงการของสาขา ({currentDepartmentProjects.length})</span>
          </button>
        </div>
      </div>

      {/* URGENT RESUBMIT ALERT BANNER (If any project was sent back by OD) */}
      {branchResubmitCount > 0 && (
        <div className="urgent-resubmit-banner animate-fade">
          <div className="urgent-icon">
            <ClockIcon size={22} />
          </div>
          <div className="urgent-content">
            <strong>มีโครงการจำนวน {branchResubmitCount} รายการที่ฝ่ายพัฒนาองค์กรส่งกลับให้แก้ไข</strong>
            <p>
              กรุณาตรวจสอบข้อเสนอแนะและทำการปรับปรุงแก้ไขเอกสารเพื่อยื่นส่งตรวจอีกครั้ง
            </p>
            <div className="urgent-action-links">
              {currentDepartmentProjects
                .filter((p) => p.status === 'resubmit')
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="btn-urgent-fix"
                    onClick={() => editProject(p)}
                  >
                    <EditIcon size={14} />
                    <span>แก้ไขโครงการ: {p.name.slice(0, 45)}...</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* BRANCH STAT CARDS */}
      <section className="stat-cards-grid">
        {/* Card 1: โครงการของสาขาฉัน */}
        <div className="kpi-card-box" onClick={() => setActiveTab('my_projects')}>
          <div className="kpi-top-row">
            <div className="kpi-icon-container purple">
              <FolderIcon size={18} />
            </div>
            <span className="kpi-card-title">โครงการของสาขาฉัน</span>
          </div>
          <div className="kpi-value-row">
            <strong className="kpi-big-number">{currentDepartmentProjects.length}</strong>
            <span className="kpi-subtitle-note">โครงการทั้งหมดของสาขา</span>
          </div>
          <div className="kpi-trend-footer neutral">
            <span>✦ ภาพรวมทุกปีงบประมาณ</span>
          </div>
        </div>

        {/* Card 2: ผ่านการอนุมัติแล้ว */}
        <div className="kpi-card-box" onClick={() => setActiveTab('my_projects')}>
          <div className="kpi-top-row">
            <div className="kpi-icon-container green">
              <CheckCircleIcon size={18} />
            </div>
            <span className="kpi-card-title">ผ่านการอนุมัติแล้ว</span>
          </div>
          <div className="kpi-value-row">
            <strong className="kpi-big-number">
              {currentDepartmentProjects.filter((p) => p.status === 'approve').length}
            </strong>
            <span className="kpi-subtitle-note">พร้อมดำเนินงานและเบิกจ่าย</span>
          </div>
          <div className="kpi-trend-footer positive">
            <TrendingUpIcon size={14} />
            <span>อนุมัติโดยคณะเรียบร้อย</span>
          </div>
        </div>

        {/* Card 3: ต้องปรับปรุงแก้ไข */}
        <div className="kpi-card-box" onClick={() => setActiveTab('my_projects')}>
          <div className="kpi-top-row">
            <div className="kpi-icon-container amber">
              <ClockIcon size={18} />
            </div>
            <span className="kpi-card-title">ต้องปรับปรุงแก้ไข</span>
          </div>
          <div className="kpi-value-row">
            <strong className="kpi-big-number">{branchResubmitCount}</strong>
            <span className="kpi-subtitle-note">โครงการที่รอส่งตรวจใหม่</span>
          </div>
          <div className={`kpi-trend-footer ${branchResubmitCount > 0 ? 'negative' : 'neutral'}`}>
            {branchResubmitCount > 0 ? (
              <>
                <AlertCircleIcon size={14} />
                <span>มีเอกสารที่ต้องแก้ไข</span>
              </>
            ) : (
              <span>✓ เอกสารครบถ้วน</span>
            )}
          </div>
        </div>

        {/* Card 4: งบประมาณที่สาขาขอรับ */}
        <div className="kpi-card-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-container purple-budget">
              <DollarIcon size={18} />
            </div>
            <span className="kpi-card-title">งบประมาณที่สาขาขอรับ</span>
          </div>
          <div className="kpi-value-row">
            <strong className="kpi-big-number">
              {formatMoney(totalBranchBudget)}
            </strong>
            <span className="kpi-subtitle-note">
              บาท (อนุมัติแล้ว: {formatMoney(approvedBranchBudget)} บ.)
            </span>
          </div>
          <div className="budget-progress-line">
            <div className="budget-track">
              <div
                className="budget-fill"
                style={{
                  width: `${totalBranchBudget > 0 ? Math.round((approvedBranchBudget / totalBranchBudget) * 100) : 0}%`,
                }}
              />
            </div>
            <span className="budget-percent-label">
              {totalBranchBudget > 0 ? ((approvedBranchBudget / totalBranchBudget) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>
      </section>

      {/* ACTION REQUIRED & MY PROJECTS QUICK LIST */}
      <div className="analytics-card" style={{ padding: '24px 28px', marginTop: '16px' }}>
        <div className="analytics-card-header" style={{ marginBottom: '18px' }}>
          <div className="analytics-title-group">
            <div className="analytics-title-icon-box">
              <FileTextIcon size={18} />
            </div>
            <div>
              <h2>รายการโครงการที่กำลังดำเนินการของสาขา</h2>
              <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                ติดตามสถานะ อัปเดตรายงานความก้าวหน้า หรือตรวจสอบแบบเสนอโครงการทางการ
              </span>
            </div>
          </div>
          <button
            type="button"
            className="link-analytics-detail"
            onClick={() => setActiveTab('my_projects')}
          >
            <span>ดูทั้งหมด ({currentDepartmentProjects.length})</span>
            <ArrowRightIcon size={13} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>ชื่อโครงการ</th>
                <th>ผู้รับผิดชอบ</th>
                <th>งบประมาณ</th>
                <th>สถานะปัจจุบัน</th>
                <th>ความคืบหน้าล่าสุด</th>
                <th>ข้อเสนอแนะฝ่ายตรวจ</th>
                <th className="text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {currentDepartmentProjects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <span className="cell-subtext">ยุทธศาสตร์: {p.strategic_plan?.name.slice(0, 30)}...</span>
                  </td>
                  <td>{p.responsible_person}</td>
                  <td><strong>{formatMoney(p.budget_amount)} บาท</strong></td>
                  <td>
                    <span className={`status-badge ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                  </td>
                  <td>
                    <StaffProgressSummary project={p} />
                  </td>
                  <td>
                    {p.review_comment ? (
                      <span className="comment-preview">{p.review_comment}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-action-view"
                        onClick={() => setWordPreviewProject(p)}
                      >
                        <FileTextIcon size={13} />
                        <span>Word Form</span>
                      </button>
                      {p.status === 'approve' && <button
                        type="button"
                        className="btn-action-progress"
                        onClick={() => {
                          setProgressModalProject(p);
                        }}
                      >
                        <TrendingUpIcon size={13} />
                        <span>รายงานความคืบหน้า</span>
                      </button>}
                      {(p.status === 'draft' || p.status === 'resubmit' || p.status === 'approve') && <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => editProject(p)}
                      >
                        <EditIcon size={13} />
                        <span>แก้ไข</span>
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
              {!currentDepartmentProjects.length && (
                <tr>
                  <td colSpan={7} className="text-center empty-cell" style={{ padding: '36px', color: '#64748B' }}>
                    สาขาวิชายังไม่ได้ยื่นแบบเสนอโครงการ
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
