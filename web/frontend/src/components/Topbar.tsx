import React from 'react';
import type { User } from '../types';
import {
  SearchIcon,
  BellIcon,
  UserIcon,
} from './Icons';

interface TopbarProps {
  search: string;
  setSearch: (s: string) => void;
  user: User;
  isAdmin: boolean;
  onOpenUnitSwitch: () => void;
  pendingReviewCount: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  search,
  setSearch,
  user,
  isAdmin,
  onOpenUnitSwitch,
  pendingReviewCount,
}) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-search-box">
          <SearchIcon size={16} />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="ค้นหาโครงการ / กิจกรรม / หน่วยงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="kbd-shortcut">Ctrl + K</kbd>
        </div>
      </div>

      <div className="topbar-right">
        {/* Notification Bell with Badge */}
        <button
          type="button"
          className="btn-bell-notification"
          onClick={onOpenUnitSwitch}
          title="การแจ้งเตือนงาน"
        >
          <BellIcon size={17} />
          {isAdmin && pendingReviewCount > 0 && (
            <span className="bell-badge-count">{pendingReviewCount}</span>
          )}
        </button>

        {/* User Pill */}
        <div className="topbar-user-pill" onClick={onOpenUnitSwitch}>
          <div className="topbar-user-avatar">
            <UserIcon size={17} />
          </div>
          <div className="topbar-user-text">
            <span className="topbar-user-name">{user.email.split('@')[0]}</span>
            <span className="topbar-user-role">{isAdmin ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
