import React from 'react';
import type { FormEvent } from 'react';
import type { UnitAccount } from '../types';
import { GearIcon, ShieldIcon, BuildingIcon } from '../components/Icons';

interface LoginPageProps {
  loginRole: 'admin' | 'staff';
  setLoginRole: (role: 'admin' | 'staff') => void;
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  loginPassword: string;
  setLoginPassword: (password: string) => void;
  error: string;
  setError: (err: string) => void;
  message: string;
  setMessage: (msg: string) => void;
  loading: boolean;
  units?: UnitAccount[];
  onLoginSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onFastLogin: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  loginRole,
  setLoginRole,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  error,
  setError,
  message,
  setMessage,
  loading,
  units = [],
  onLoginSubmit,
  onFastLogin,
}) => {
  const adminUnits = units.filter((u) => u.role === 'admin' || u.role === 'super_admin');
  const staffUnits = units.filter((u) => u.role === 'staff');

  return (
    <div className="login-page-container">
      <div className="login-card-wrapper animate-fade">
        <div className="login-card-header">
          <div className="login-brand-emblem">
            <GearIcon size={28} style={{ color: '#ffffff' }} />
          </div>
          <h1>ระบบบริหารแผนปฏิบัติการ (PIMS)</h1>
          <p>Planning & Performance Management System</p>
        </div>

        <div className="login-card-body">
          {/* Role Tabs */}
          <div className="login-role-selector-tabs">
            <button
              type="button"
              className={`login-role-tab-btn ${loginRole === 'admin' ? 'active admin' : ''}`}
              onClick={() => {
                setLoginRole('admin');
                const defaultAdm = adminUnits[0]?.email || 'admin@pims.ac.th';
                setLoginEmail(defaultAdm);
                setLoginPassword('password');
                setError('');
              }}
            >
              <ShieldIcon size={16} /> ผู้ดูแลระบบ / ฝ่ายพัฒนางาน (Admin)
            </button>
            <button
              type="button"
              className={`login-role-tab-btn ${loginRole === 'staff' ? 'active staff' : ''}`}
              onClick={() => {
                setLoginRole('staff');
                const defaultStaff = staffUnits[0]?.email || 'staff@pims.ac.th';
                setLoginEmail(defaultStaff);
                setLoginPassword('password');
                setError('');
              }}
            >
              <BuildingIcon size={16} /> พนักงานสาขาวิชา / หน่วยงาน (Staff)
            </button>
          </div>

          {/* Role Instructions */}
          <div className="role-instruction-banner">
            <span>
              {loginRole === 'admin'
                ? 'เข้าสู่ระบบสำหรับฝ่ายพัฒนาองค์กรและผู้บริหาร เพื่อตรวจสอบ กลั่นกรอง และอนุมัติโครงการ'
                : 'เข้าสู่ระบบสำหรับเจ้าหน้าที่สาขาวิชา เพื่อยื่นแบบเสนอโครงการและรายงานผลการดำเนินงาน'}
            </span>
          </div>

          {error && (
            <div className="alert-banner alert-danger" style={{ margin: '0 0 16px' }}>
              <span>{error}</span>
              <button type="button" onClick={() => setError('')}>✕</button>
            </div>
          )}
          {message && (
            <div className="alert-banner alert-success" style={{ margin: '0 0 16px' }}>
              <span>{message}</span>
              <button type="button" onClick={() => setMessage('')}>✕</button>
            </div>
          )}

          <form onSubmit={onLoginSubmit} className="login-form-fields">
            <label className="field-block">
              <span className="field-label required">อีเมลผู้ใช้งาน</span>
              <input
                required
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="เช่น admin@pims.ac.th หรือ staff@pims.ac.th"
              />
            </label>

            <label className="field-block">
              <span className="field-label required">รหัสผ่าน</span>
              <input
                required
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="รหัสผ่านเข้าสู่ระบบ (เช่น password หรือ pims2026)"
              />
            </label>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
            </button>
          </form>

          <div className="fast-login-divider">
            <span>หรือเลือกเข้าสู่ระบบด่วน 1-Click</span>
          </div>

          <div className="fast-login-presets">
            {loginRole === 'admin' ? (
              adminUnits.length > 0 ? (
                adminUnits.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="btn-preset-login"
                    onClick={() => onFastLogin(u.email)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShieldIcon size={16} />
                      <strong>{u.majorName || 'ผู้ดูแลระบบ'} (Admin)</strong>
                    </div>
                    <span>{u.email} ❯</span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  className="btn-preset-login"
                  onClick={() => onFastLogin('admin@pims.ac.th')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldIcon size={16} />
                    <strong>ผู้ดูแลระบบ (Admin)</strong>
                  </div>
                  <span>admin@pims.ac.th ❯</span>
                </button>
              )
            ) : (
              staffUnits.length > 0 ? (
                staffUnits.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="btn-preset-login"
                    onClick={() => onFastLogin(u.email)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BuildingIcon size={16} />
                      <strong>{u.majorName || 'เจ้าหน้าที่สาขาวิชา'}</strong>
                    </div>
                    <span>{u.email} ❯</span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  className="btn-preset-login"
                  onClick={() => onFastLogin('staff@pims.ac.th')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BuildingIcon size={16} />
                    <strong>เจ้าหน้าที่สาขาวิชา (Staff)</strong>
                  </div>
                  <span>staff@pims.ac.th ❯</span>
                </button>
              )
            )}
          </div>

          <p className="login-footer-hint">
            ระบบบริหารแผนปฏิบัติการและสารบรรณโครงการ (PIMS) เชื่อมต่อฐานข้อมูลออนไลน์
          </p>
        </div>
      </div>
    </div>
  );
};
