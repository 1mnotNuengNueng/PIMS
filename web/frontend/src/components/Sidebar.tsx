import React from 'react';
import type { User } from '../types';
import {
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
}) => {
  return (
    <aside className="sidebar">
      {/* Brand identity */}
      <div className="brand-panel">
        <div className="brand-header-row">
          <div className="brand-emblem">
            <img src="/egnkps.png" alt="ตราคณะวิศวกรรมศาสตร์ กำแพงแสน" />
          </div>
          <div>
            <strong>คณะวิศวกรรมศาสตร์ กำแพงแสน</strong>
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

            <button
              type="button"
              className={activeTab === 'users' ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab('users')}
            >
              <span className="nav-icon"><UserIcon size={16} /></span>
              <span>จัดการผู้ใช้งาน</span>
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
