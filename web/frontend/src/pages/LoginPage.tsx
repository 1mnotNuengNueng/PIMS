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
  onRequestPasswordReset: (email: string) => Promise<boolean>;
  onResetPassword: (email: string, otp: string, password: string) => Promise<boolean>;
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
  onRequestPasswordReset,
  onResetPassword,
}) => {
  const adminUnits = units.filter((u) => u.role === 'admin' || u.role === 'super_admin');
  const staffUnits = units.filter((u) => u.role === 'staff');
  const [resetMode, setResetMode] = React.useState(false);
  const [otpRequested, setOtpRequested] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = otpRequested
      ? await onResetPassword(loginEmail, otp, newPassword)
      : await onRequestPasswordReset(loginEmail);
    if (succeeded && otpRequested) {
      setResetMode(false);
      setOtpRequested(false);
      setOtp('');
      setNewPassword('');
      setLoginPassword('');
    } else if (succeeded) {
      setOtpRequested(true);
    }
  }

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
                setLoginPassword('');
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
                setLoginPassword('');
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

          {resetMode ? (
            <form onSubmit={submitReset} className="login-form-fields">
              <div className="reset-password-heading">
                <strong>ตั้งรหัสผ่านใหม่</strong>
                <span>OTP สำหรับทดสอบจะแสดงใน Terminal ที่รัน Backend และมีอายุ 5 นาที</span>
              </div>
              <label className="field-block">
                <span className="field-label required">อีเมลผู้ใช้งาน</span>
                <input required type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="อีเมลที่ใช้เข้าสู่ระบบ" />
              </label>
              {otpRequested && (
                <>
                  <label className="field-block">
                    <span className="field-label required">รหัส OTP</span>
                    <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="กรอกรหัส 6 หลักจาก Terminal" />
                  </label>
                  <label className="field-block">
                    <span className="field-label required">รหัสผ่านใหม่</span>
                    <input required minLength={6} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" />
                  </label>
                </>
              )}
              <button type="submit" className="btn-login-submit" disabled={loading}>
                {loading ? 'กำลังดำเนินการ...' : otpRequested ? 'ยืนยัน OTP และตั้งรหัสผ่าน' : 'ขอรหัส OTP'}
              </button>
              <button type="button" className="login-forgot-link reset-back-link" onClick={() => { setResetMode(false); setOtpRequested(false); setError(''); setMessage(''); }}>
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={onLoginSubmit} className="login-form-fields">
                <label className="field-block">
                  <span className="field-label required">อีเมลผู้ใช้งาน</span>
                  <input required type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="กรอกอีเมลผู้ใช้งาน" />
                </label>
                <label className="field-block">
                  <span className="field-label required">รหัสผ่าน</span>
                  <input required type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="กรอกรหัสผ่าน" />
                </label>
                <button type="submit" className="btn-login-submit" disabled={loading}>
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
                </button>
              </form>
              <button type="button" className="login-forgot-link" onClick={() => { setResetMode(true); setError(''); setMessage(''); }}>
                ลืมรหัสผ่าน?
              </button>
            </>
          )}

          <p className="login-footer-hint">
            ระบบบริหารแผนปฏิบัติการและสารบรรณโครงการ (PIMS) เชื่อมต่อฐานข้อมูลออนไลน์
          </p>
        </div>
      </div>
    </div>
  );
};
