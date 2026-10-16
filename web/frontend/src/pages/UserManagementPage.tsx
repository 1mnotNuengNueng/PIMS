import React, { useState } from 'react';
import type { FormEvent } from 'react';
import type { RefItem, User } from '../types';
import { PlusIcon, UserIcon } from '../components/Icons';

interface UserManagementPageProps {
  users: User[];
  departments: RefItem[];
  loading: boolean;
  onCreate: (input: { email: string; password: string; majorId: number }) => Promise<boolean>;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  users,
  departments,
  loading,
  onCreate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [majorId, setMajorId] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await onCreate({ email, password, majorId: Number(majorId) });
    if (created) {
      setEmail('');
      setPassword('');
      setMajorId('');
    }
  }

  return (
    <div className="view-container animate-fade user-management-page">
      <header className="user-management-heading">
        <div className="user-management-icon"><UserIcon size={22} /></div>
        <div>
          <h1>จัดการผู้ใช้งาน</h1>
          <p>สร้างบัญชีเจ้าหน้าที่และกำหนดหน่วยงานที่รับผิดชอบ</p>
        </div>
      </header>

      <section className="user-create-card">
        <div className="user-section-heading">
          <div>
            <h2>สร้างบัญชีผู้ใช้</h2>
            <p>บัญชีใหม่จะมีสิทธิ์เจ้าหน้าที่ของหน่วยงานที่เลือก</p>
          </div>
        </div>
        <form className="user-create-form" onSubmit={submit}>
          <label className="field-block">
            <span className="field-label required">อีเมล</span>
            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="เช่น staff@ku.ac.th"
            />
          </label>
          <label className="field-block">
            <span className="field-label required">รหัสผ่าน</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </label>
          <label className="field-block">
            <span className="field-label required">หน่วยงาน</span>
            <select required value={majorId} onChange={(event) => setMajorId(event.target.value)}>
              <option value="">เลือกหน่วยงาน</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary user-create-submit" disabled={loading || !departments.length}>
            <PlusIcon size={15} />
            <span>{loading ? 'กำลังสร้างบัญชี…' : 'สร้างผู้ใช้'}</span>
          </button>
        </form>
      </section>

      <section className="user-list-card">
        <div className="user-section-heading">
          <div>
            <h2>บัญชีผู้ใช้ทั้งหมด</h2>
            <p>{users.length} บัญชี</p>
          </div>
        </div>
        <div className="user-table-wrap">
          <table className="user-management-table">
            <thead>
              <tr><th>อีเมลผู้ใช้</th><th>หน่วยงาน</th><th>สิทธิ์</th></tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <tr key={account.id}>
                  <td><strong>{account.email}</strong></td>
                  <td>{account.major}</td>
                  <td><span className={`user-role-badge ${account.role === 'staff' ? 'staff' : 'admin'}`}>
                    {account.role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้ดูแลระบบ'}
                  </span></td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={3} className="user-empty-row">ยังไม่มีบัญชีผู้ใช้</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
