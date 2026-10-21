import React, { useState } from 'react';
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
  notifications: Array<{ id: string; message: string; createdAt: string }>;
}

export const Topbar: React.FC<TopbarProps> = ({
  search,
  setSearch,
  user,
  isAdmin,
  onOpenUnitSwitch,
  notifications,
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => new Set());
  const unreadCount = notifications.filter((notification) => !readNotificationIds.has(notification.id)).length;

  const openNotifications = () => {
    setIsNotificationOpen((open) => !open);
    setReadNotificationIds(new Set(notifications.map((notification) => notification.id)));
  };

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
          onClick={openNotifications}
          title="การแจ้งเตือนงาน"
        >
          <BellIcon size={17} />
          {unreadCount > 0 && (
            <span className="bell-badge-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
        {isNotificationOpen && (
          <div className="notification-popover" role="status" aria-label="การแจ้งเตือนล่าสุด">
            <strong>การแจ้งเตือนล่าสุด</strong>
            {notifications.length ? (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <span>{notification.message}</span>
                    <time>{new Date(notification.createdAt).toLocaleDateString('th-TH')}</time>
                  </li>
                ))}
              </ul>
            ) : <p>ไม่มีการแจ้งเตือนใหม่</p>}
          </div>
        )}

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
