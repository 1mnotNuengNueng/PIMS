import React from 'react';
import type { Dashboard } from '../types';
import { formatMoney } from '../utils/format';
import { BuildingIcon } from '../components/Icons';

interface DeptMatrixPageProps {
  dashboard: Dashboard;
  setSearch: (s: string) => void;
  setActiveTab: (tab: string) => void;
}

export const DeptMatrixPage: React.FC<DeptMatrixPageProps> = ({
  dashboard,
  setSearch,
  setActiveTab,
}) => {
  return (
    <div className="view-container animate-fade">
      <div className="view-header-row">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BuildingIcon size={22} style={{ color: '#8F1730' }} />
            <span>ตารางติดตามผลการดำเนินงานรายภาควิชา / หน่วยงาน</span>
          </h1>
          <p>สรุปการส่งแบบเสนอโครงการ อัตราการอนุมัติ และการจัดสรรงบประมาณ</p>
        </div>
      </div>

      <div className="content-card full-card">
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>ภาควิชา / หน่วยงาน</th>
                <th>จำนวนโครงการ</th>
                <th>อนุมัติแล้ว</th>
                <th>ส่งกลับแก้ไข</th>
                <th>งบประมาณที่ขอรับ</th>
                <th>อัตราการอนุมัติ (%)</th>
                <th>การดำเนินงาน</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.byDepartment.map((dept) => {
                const rate = dept.count ? Math.round((dept.approved / dept.count) * 100) : 0;
                return (
                  <tr key={dept.majorId}>
                    <td>
                      <strong>{dept.name}</strong>
                    </td>
                    <td>
                      <span className="badge-number">{dept.count} โครงการ</span>
                    </td>
                    <td>
                      <span className="tag-approved">{dept.approved}</span>
                    </td>
                    <td>
                      <span className="tag-resubmit">{dept.resubmit}</span>
                    </td>
                    <td>
                      <strong>{formatMoney(dept.budget)} บาท</strong>
                    </td>
                    <td>
                      <div className="matrix-progress-box">
                        <div className="matrix-progress-track">
                          <div className="matrix-progress-fill" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="rate-text">{rate}%</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-tiny-action"
                        onClick={() => {
                          setSearch(dept.name);
                          setActiveTab('projects');
                        }}
                      >
                        ดูโครงการ ❯
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
