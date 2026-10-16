import React from 'react';
import type { Dashboard } from '../types';
import { formatMoney } from '../utils/format';
import {
  CalendarIcon,
  ChevronDownIcon,
  FileTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  TargetIcon,
} from '../components/Icons';

interface AdminDashboardProps {
  dashboard: Dashboard;
  setActiveTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  dashboard,
  setActiveTab,
}) => {
  // Real dynamic calculations for Donut Chart
  const circumference = 301.59;
  const total = dashboard.total || 0;
  const approvedPct = total > 0 ? dashboard.approved / total : 0;
  const resubmitPct = total > 0 ? dashboard.resubmit / total : 0;
  const draftsPct = total > 0 ? dashboard.drafts / total : 0;
  const canceledPct = total > 0 ? dashboard.canceled / total : 0;

  const approvedLen = approvedPct * circumference;
  const resubmitLen = resubmitPct * circumference;
  const draftsLen = draftsPct * circumference;
  const canceledLen = canceledPct * circumference;

  const approvedOffset = 0;
  const resubmitOffset = -approvedLen;
  const draftsOffset = -(approvedLen + resubmitLen);
  const canceledOffset = -(approvedLen + resubmitLen + draftsLen);

  const approvedBudgetPct =
    dashboard.budgetTotal > 0
      ? ((dashboard.approvedBudgetTotal / dashboard.budgetTotal) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="view-container animate-fade">
      {/* Hero Banner */}
      <div className="executive-hero">
        <div className="hero-text">
          <span className="hero-badge-tag">EXECUTIVE DASHBOARD</span>
          <h1 className="hero-title-main">ภาพรวมแผนปฏิบัติการ</h1>
          <h2 className="hero-title-sub">คณะวิศวกรรมศาสตร์ กำแพงแสน</h2>
          <p className="hero-text-desc">
            ศูนย์ควบคุมและติดตามความคืบหน้าโครงการ งบประมาณ และตัวชี้วัด (KPI) ประจำปีงบประมาณ 2569 ข้อมูลตรงจากฐานข้อมูล
          </p>
        </div>
        <div className="hero-cta-actions">
          <button
            type="button"
            className="btn-hero-year"
            onClick={() => {}}
          >
            <CalendarIcon size={15} />
            <span>ปีงบประมาณ 2569</span>
            <ChevronDownIcon size={14} />
          </button>
          <button
            type="button"
            className="btn-hero-report"
            onClick={() => setActiveTab('dept_matrix')}
          >
            <FileTextIcon size={15} />
            <span>สรุปรายงานรายหน่วยงาน</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>
      </div>

      {/* ROW 1: 4 KPI STAT CARDS */}
      <section className="stat-cards-grid">
        {/* Card 1: อนุมัติเรียบร้อยแล้ว */}
        <div className="kpi-card-box" onClick={() => setActiveTab('projects')}>
          <div className="kpi-top-row">
            <div className="kpi-icon-container green">
              <CheckCircleIcon size={18} />
            </div>
            <span className="kpi-card-title">อนุมัติเรียบร้อยแล้ว</span>
          </div>
          <div className="kpi-value-row">
            <strong className="kpi-big-number">{dashboard.approved}</strong>
            <span className="kpi-subtitle-note">
              {total > 0 ? Math.round((dashboard.approved / total) * 100) : 0}% ของโครงการทั้งหมด
            </span>
          </div>
          <div className="kpi-trend-footer positive">
            <CheckCircleIcon size={14} />
            <span>พร้อมดำเนินงานและเบิกจ่าย</span>
          </div>
        </div>

        {/* Card 2: ส่งกลับให้สาขาแก้ไข */}
        <div className="kpi-card-box" onClick={() => setActiveTab('approvals')}>
          <div className="kpi-top-row">
            <div className="kpi-icon-container amber">
              <ClockIcon size={18} />
            </div>
            <span className="kpi-card-title">ส่งกลับให้สาขาแก้ไข</span>
          </div>
          <div className="kpi-value-row">
            <strong className="kpi-big-number">{dashboard.resubmit}</strong>
            <span className="kpi-subtitle-note">โครงการที่รอสาขาปรับปรุง</span>
          </div>
          <div className={`kpi-trend-footer ${dashboard.resubmit > 0 ? 'negative' : 'neutral'}`}>
            {dashboard.resubmit > 0 ? (
              <>
                <AlertCircleIcon size={14} />
                <span>มีรายการรอการแก้ไข</span>
              </>
            ) : (
              <span>✓ ไม่มีรายการค้างปรับปรุง</span>
            )}
          </div>
        </div>

        {/* Card 3: ฉบับร่าง / รอดำเนินการ */}
        <div className="kpi-card-box" onClick={() => setActiveTab('approvals')}>
          <div className="kpi-top-row">
            <div className="kpi-icon-container purple">
              <FileTextIcon size={18} />
            </div>
            <span className="kpi-card-title">ฉบับร่าง / รอพิจารณา</span>
          </div>
          <div className="kpi-value-row">
            <strong className="kpi-big-number">{dashboard.drafts}</strong>
            <span className="kpi-subtitle-note">โครงการในคิวพิจารณา</span>
          </div>
          <div className="kpi-trend-footer neutral">
            <span>✦ รอการตรวจสอบเอกสาร</span>
          </div>
        </div>

        {/* Card 4: งบประมาณรวมทั้งสิ้น */}
        <div className="kpi-card-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-container purple-budget">
              <DollarIcon size={18} />
            </div>
            <span className="kpi-card-title">งบประมาณรวมทั้งสิ้น</span>
          </div>
          <div className="kpi-value-row">
            <strong className="kpi-big-number">{formatMoney(dashboard.budgetTotal)}</strong>
            <span className="kpi-subtitle-note">
              บาท (อนุมัติแล้ว: {formatMoney(dashboard.approvedBudgetTotal)} บ.)
            </span>
          </div>
          <div className="budget-progress-line">
            <div className="budget-track">
              <div
                className="budget-fill"
                style={{
                  width: `${approvedBudgetPct}%`,
                }}
              />
            </div>
            <span className="budget-percent-label">
              {approvedBudgetPct}%
            </span>
          </div>
        </div>
      </section>

      {/* ROW 2: ANALYTICAL CARDS (KPI TREND BARS & STATUS DONUT) */}
      <section className="analytics-row-grid">
        {/* Card Left: KPI Analytics with Mini Bar Chart */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="analytics-title-group">
              <div className="analytics-title-icon-box">
                <TargetIcon size={18} />
              </div>
              <h2>ตัวชี้วัดความสำเร็จ (KPI)</h2>
            </div>
            <button
              type="button"
              className="link-analytics-detail"
              onClick={() => setActiveTab('dept_matrix')}
            >
              <span>ดูรายละเอียด</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>

          <div className="analytics-content-kpi-split">
            <div className="kpi-analytic-info">
              <strong>{dashboard.kpiTotal}</strong>
              <span>ตัวชี้วัดตามเป้าประสงค์คณะ</span>
              <div className="kpi-analytic-trend">
                <TrendingUpIcon size={14} />
                <span>จากโครงการทั้งหมด {dashboard.total} โครงการ</span>
              </div>
            </div>

            {/* Stylized Mini Bar Chart Graphic representing real strategy budgets */}
            <div className="mini-bar-chart-graphic" title="แนวโน้มการจัดสรรงบประมาณตามยุทธศาสตร์">
              {dashboard.byStrategy.map((s) => {
                const maxBudget = Math.max(...dashboard.byStrategy.map((item) => item.budget), 1);
                const heightPct = Math.max(15, Math.round((s.budget / maxBudget) * 100));
                return (
                  <div
                    key={s.strategic_plan_id}
                    className="mini-bar-col"
                    style={{ height: `${heightPct}%` }}
                    title={`${s.name}: ${formatMoney(s.budget)} บ.`}
                  />
                );
              })}
              {dashboard.byStrategy.length === 0 && (
                [40, 65, 80, 50].map((val, i) => (
                  <div key={i} className="mini-bar-col" style={{ height: `${val}%` }} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card Right: All Projects Status Donut */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h2>สถานะโครงการทั้งหมด</h2>
            <button
              type="button"
              className="link-analytics-detail"
              onClick={() => setActiveTab('projects')}
            >
              <span>ดูทะเบียน ({dashboard.total})</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>

          <div className="donut-analytic-wrapper">
            {/* SVG Donut */}
            <div className="donut-chart-box">
              <svg width="120" height="120" viewBox="0 0 120 120" className="donut-svg">
                {/* Background Ring */}
                <circle cx="60" cy="60" r="48" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />

                {/* Approved Arc */}
                {approvedLen > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="18"
                    strokeDasharray={`${approvedLen} ${circumference - approvedLen}`}
                    strokeDashoffset={approvedOffset}
                  />
                )}

                {/* Resubmit Arc */}
                {resubmitLen > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="18"
                    strokeDasharray={`${resubmitLen} ${circumference - resubmitLen}`}
                    strokeDashoffset={resubmitOffset}
                  />
                )}

                {/* Drafts Arc */}
                {draftsLen > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="transparent"
                    stroke="#6366f1"
                    strokeWidth="18"
                    strokeDasharray={`${draftsLen} ${circumference - draftsLen}`}
                    strokeDashoffset={draftsOffset}
                  />
                )}

                {/* Canceled Arc */}
                {canceledLen > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="18"
                    strokeDasharray={`${canceledLen} ${circumference - canceledLen}`}
                    strokeDashoffset={canceledOffset}
                  />
                )}
              </svg>
              <div className="donut-center-text">
                <strong>{dashboard.total}</strong>
                <span>โครงการ</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="donut-legend-list">
              <div className="legend-row">
                <span className="legend-dot green" />
                <span className="legend-name">อนุมัติแล้ว</span>
                <strong className="legend-val">{dashboard.approved}</strong>
              </div>
              <div className="legend-row">
                <span className="legend-dot amber" />
                <span className="legend-name">รอแก้ไข</span>
                <strong className="legend-val">{dashboard.resubmit}</strong>
              </div>
              <div className="legend-row">
                <span className="legend-dot indigo" />
                <span className="legend-name">ฉบับร่าง</span>
                <strong className="legend-val">{dashboard.drafts}</strong>
              </div>
              {dashboard.canceled > 0 && (
                <div className="legend-row">
                  <span className="legend-dot red" style={{ backgroundColor: '#ef4444' }} />
                  <span className="legend-name">ยกเลิก</span>
                  <strong className="legend-val">{dashboard.canceled}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ROW 3: STRATEGIC & BUDGET DISTRIBUTION BREAKDOWN */}
      <section className="analytics-row-grid">
        {/* Strategy Breakdown Card */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h2>การกระจายตามประเด็นยุทธศาสตร์</h2>
          </div>
          <div className="strategy-distribution-list">
            {dashboard.byStrategy.map((s) => {
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.strategic_plan_id} className="strategy-row-item">
                  <div className="strategy-title-line">
                    <span className="strategy-name">{s.name}</span>
                    <strong className="strategy-stat">
                      {s.count} โครงการ ({formatMoney(s.budget)} บ.)
                    </strong>
                  </div>
                  <div className="strategy-track">
                    <div className="strategy-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {dashboard.byStrategy.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                ยังไม่มีข้อมูลยุทธศาสตร์
              </div>
            )}
          </div>
        </div>

        {/* Operating Budget Source Card - Real Data from DB */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h2>แหล่งงบประมาณดำเนินงาน</h2>
          </div>
          <div className="budget-source-breakdown">
            {dashboard.byBudget.map((b, idx) => {
              const pct =
                dashboard.budgetTotal > 0
                  ? ((b.amount / dashboard.budgetTotal) * 100).toFixed(1)
                  : '0.0';
              const colorClasses = ['green', 'blue', 'purple', 'amber'];
              const colorClass = colorClasses[idx % colorClasses.length];

              return (
                <div key={b.id} className="budget-source-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="source-label">{b.name}</span>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{b.count} โครงการ</span>
                  </div>
                  <strong className="source-amount">
                    {formatMoney(b.amount)} บาท ({pct}%)
                  </strong>
                  <div className="budget-source-track">
                    <div
                      className={`budget-source-fill ${colorClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {dashboard.byBudget.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                ยังไม่มีข้อมูลแหล่งงบประมาณ
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
