import React from 'react';
import type { User, ProjectForm, Metadata } from '../types';
import { emptyForm } from '../types';
import {
  GearIcon,
  FolderIcon,
  ShieldIcon,
  BarChartIcon,
  FileTextIcon,
  UserIcon,
  ChevronDownIcon,
  LogOutIcon,
} from './Icons';

interface SidebarProps {
  user: User;
  isAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingReviewCount: number;
  projectsCount: number;
  branchProjectsCount: number;
  branchResubmitCount: number;
  onLogout: () => void;
  onOpenUnitSwitch: () => void;
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  metadata: Metadata;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  isAdmin,
  activeTab,
  setActiveTab,
  pendingReviewCount,
  projectsCount,
  branchProjectsCount,
  branchResubmitCount,
  onLogout,
  onOpenUnitSwitch,
  form,
  setForm,
  metadata,
}) => {
  return (
    <aside className="sidebar">
      {/* Brand identity */}
      <div className="brand-panel">
        <div className="brand-header-row">
          <div className="brand-emblem">
            <GearIcon size={22} style={{ color: '#14233B' }} />
          </div>
          <div>
            <strong>คณะวิศวกรรมศาสตร์</strong>
            <span>มหาวิทยาลัยเกษตรศาสตร์</span>
          </div>
        </div>
        <div className="system-chip">
          <span className="chip-dot" />
          <span>• PIMS • ระบบแผนปฏิบัติการ</span>
        </div>
      </div>

      {/* Dynamic Navigation according to Role */}
      <nav className="main-nav" aria-label="เมนูระบบ">
        {isAdmin ? (
          /* ADMIN / REVIEWER MENU */
          <>
            <div className="nav-group-title">การบริหารและตรวจเอกสาร (ฝ่ายพัฒนางาน)</div>
            <button
              type="button"
              className={activeTab === 'dashboard' ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon"><FolderIcon size={16} /></span>
              <span>ภาพรวมระดับคณะ</span>
            </button>

            <button
              type="button"
              className={activeTab === 'approvals' ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab('approvals')}
            >
              <span className="nav-icon"><ShieldIcon size={16} /></span>
              <span>โต๊ะตรวจและพิจารณาเอกสาร</span>
              {pendingReviewCount > 0 && (
                <span className="badge-alert">{pendingReviewCount}</span>
              )}
            </button>

            <button
              type="button"
              className={activeTab === 'dept_matrix' ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab('dept_matrix')}
            >
              <span className="nav-icon"><BarChartIcon size={16} /></span>
              <span>ติดตามผลงานรายสาขา</span>
            </button>

            <button
              type="button"
              className={activeTab === 'projects' ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab('projects')}
            >
              <span className="nav-icon"><FileTextIcon size={16} /></span>
              <span>ทะเบียนโครงการทั้งหมด</span>
              <span className="badge-count">{projectsCount}</span>
            </button>
          </>
        ) : (
          /* BRANCH / DEPARTMENT STAFF MENU */
          <>
            <div className="nav-group-title">เนื้องานของสาขาวิชา (เจ้าหน้าที่สาขา)</div>
            <button
              type="button"
              className={activeTab === 'dashboard' ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon"><FolderIcon size={16} /></span>
              <span>แดชบอร์ดงานสาขาฉัน</span>
            </button>

            <button
              type="button"
              className={activeTab === 'submit_form' ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setActiveTab('submit_form');
                if (!form.id) {
                  setForm({
                    ...emptyForm,
                    strategicPlanId: String(metadata.strategicPlans[0]?.id || ''),
                    operatingBudgetId: String(metadata.operatingBudgets[0]?.id || ''),
                    department: user?.major || '',
                  });
                }
              }}
            >
              <span className="nav-icon"><FileTextIcon size={16} /></span>
              <span>{form.id ? 'แก้ไขเอกสารโครงการ' : 'ยื่นแบบเสนอโครงการใหม่'}</span>
            </button>

            <button
              type="button"
              className={activeTab === 'my_projects' ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab('my_projects')}
            >
              <span className="nav-icon"><FolderIcon size={16} /></span>
              <span>โครงการของสาขาฉัน</span>
              <span className="badge-count">{branchProjectsCount}</span>
              {branchResubmitCount > 0 && (
                <span className="badge-resubmit-alert" title="มีโครงการที่ต้องแก้ไข">
                  {branchResubmitCount}
                </span>
              )}
            </button>
          </>
        )}
      </nav>

      {/* Authenticated User Account Card in Sidebar */}
      <div className="unit-account-card">
        <div className="unit-account-top">
          <span className="unit-badge-pill">1 CREDENTIAL 1 หน่วย</span>
          <button
            type="button"
            className="btn-text-switch"
            onClick={onOpenUnitSwitch}
          >
            เปลี่ยนหน่วยงาน ❯
          </button>
        </div>
        <strong className="unit-account-title">{user.major || 'สำนักงานเลขานุการคณะวิศวกรรมศาสตร์'}</strong>
        <span className="unit-account-email">{user.email || 'admin@ku.ac.th'}</span>
      </div>

      {/* Footer Profile Bar */}
      <div className="sidebar-footer-bar">
        <div className="footer-user-block">
          <div className="footer-avatar">
            <UserIcon size={16} />
          </div>
          <div className="footer-user-info">
            <span className="footer-username">{user.email.split('@')[0]}</span>
            <span className="footer-role-label">
              {isAdmin ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่สาขา'}
              <ChevronDownIcon size={11} />
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn-sidebar-logout-footer"
          onClick={onLogout}
          title="ออกจากระบบ"
        >
          <LogOutIcon size={15} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};
