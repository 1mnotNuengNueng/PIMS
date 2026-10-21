import React from 'react';
import type { FormEvent } from 'react';
import type { User, UnitAccount, RefItem } from '../types';
import { BuildingIcon } from './Icons';

interface UnitSwitchModalProps {
  show: boolean;
  onClose: () => void;
  units: UnitAccount[];
  departments: RefItem[];
  user: User | null;
  onFastLogin: (email: string) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  authForm: { email: string; password: string; majorName: string };
  setAuthForm: React.Dispatch<React.SetStateAction<{ email: string; password: string; majorName: string }>>;
  onAuthSubmit: (e: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
}

export const UnitSwitchModal: React.FC<UnitSwitchModalProps> = ({
  show,
  onClose,
  units,
  departments,
  user,
  onFastLogin,
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  onAuthSubmit,
  loading,
}) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="auth-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#14233B', color: '#fff', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <BuildingIcon size={20} />
            </div>
            <div>
              <h2>สลับบัญชีหน่วยงาน</h2>
              <p>เลือกสาขาวิชาเพื่อทำงานในส่วนของสาขา หรือสลับเป็นฝ่ายพัฒนาองค์กร</p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Quick 1-Click Switch Grid */}
        <div className="quick-switch-section">
          <span className="quick-section-title">สลับใช้งานทันที (1-Click Switch):</span>
          <div className="units-list-grid">
            {units.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`unit-select-card ${user?.email === u.email ? 'active' : ''}`}
                onClick={() => {
                  onFastLogin(u.email);
                  onClose();
                }}
              >
                <span className="unit-card-name">{u.role === 'admin' || u.role === 'super_admin' ? 'ฝ่ายพัฒนาองค์กร' : u.majorName}</span>
                <span className="unit-card-sub">
                  {u.email} • {u.role === 'super_admin' ? 'ผู้ดูแลระบบสูงสุด' : u.role === 'admin' ? 'ผู้ตรวจฝ่ายพัฒนาองค์กร' : 'ภาควิชา / สาขาวิชา'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-divider">
          <span>หรือเข้าสู่ระบบด้วยรหัสผ่าน</span>
        </div>

        <form onSubmit={onAuthSubmit} className="manual-auth-box">
          <div className="auth-tabs-row">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              เพิ่มบัญชีหน่วยงานใหม่
            </button>
          </div>

          <label className="field-block">
            <span>อีเมลหน่วยงาน</span>
            <input
              required
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm((curr) => ({ ...curr, email: e.target.value }))}
              placeholder="เช่น cpe@ku.ac.th"
            />
          </label>

          <label className="field-block">
            <span>รหัสผ่าน</span>
            <input
              required
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm((curr) => ({ ...curr, password: e.target.value }))}
              placeholder="รหัสผ่าน (ค่าเริ่มต้น: pims2026)"
            />
          </label>

          {authMode === 'register' && (
            <label className="field-block">
              <span>ชื่อหน่วยงาน / ภาควิชา</span>
              <select
                required
                value={authForm.majorName}
                onChange={(e) => setAuthForm((curr) => ({ ...curr, majorName: e.target.value }))}
              >
                <option value="">เลือกหน่วยงาน / ภาควิชา</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.name}>{department.name}</option>
                ))}
              </select>
            </label>
          )}

          <button type="submit" className="btn-primary full-btn" disabled={loading}>
            {loading ? 'กำลังดำเนินการ...' : authMode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
          </button>
        </form>
      </div>
    </div>
  );
};
