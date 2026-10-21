import { useState } from 'react';
import type { Project } from '../types';
import { statusLabels, statusColors } from '../types';
import { BuildingIcon } from '../components/Icons';
import { StaffProgressSummary } from '../components/StaffProgressSummary';
import { PeriodFilter } from '../components/PeriodFilter';
import { fiscalPeriodLabel, matchesPeriod } from '../utils/fiscalPeriod';

type Props = {
  projects: Project[];
  onOpenDetails: (project: Project) => void;
};

export function DeptMatrixPage({ projects, onOpenDetails }: Props) {
  const [year, setYear] = useState('all');
  const [quarter, setQuarter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressSort, setProgressSort] = useState('default');
  const departmentOptions = new Map<number, string>();
  for (const project of projects) {
    departmentOptions.set(project.department_id ?? project.user?.Major_id ?? 0,
      project.department?.name || project.user?.major?.name || 'ไม่ระบุหน่วยงาน');
  }
  const visibleProjects = projects.filter(project => matchesPeriod(project, year, quarter) &&
    (departmentFilter === 'all' || String(project.department_id ?? project.user?.Major_id ?? 0) === departmentFilter) &&
    (statusFilter === 'all' || project.status === statusFilter));
  if (progressSort !== 'default') visibleProjects.sort((a, b) => {
    const aProgress = a.latest_report?.progress_percent;
    const bProgress = b.latest_report?.progress_percent;
    // Reports that have not been created stay below reported progress, including 0%.
    if (aProgress == null) return bProgress == null ? 0 : 1;
    if (bProgress == null) return -1;
    return progressSort === 'asc' ? aProgress - bProgress : bProgress - aProgress;
  });
  const departments = new Map<number, { name: string; projects: Project[] }>();
  for (const project of visibleProjects) {
    const id = project.department_id ?? project.user?.Major_id ?? 0;
    const group = departments.get(id) || { name: project.department?.name || project.user?.major?.name || 'ไม่ระบุหน่วยงาน', projects: [] };
    group.projects.push(project);
    departments.set(id, group);
  }
  return <div className="view-container animate-fade">
    <div className="view-header-row">
      <div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BuildingIcon size={22} /><span>ความคืบหน้าโครงการ แยกตามภาควิชา / หน่วยงาน</span></h1>
        <p>แสดงความคืบหน้าสะสมจากรายงานล่าสุดของแต่ละโครงการ พร้อมสถานะการตรวจรายงาน</p>
      </div>
    </div>
    <PeriodFilter projects={projects} year={year} quarter={quarter} onYearChange={setYear} onQuarterChange={setQuarter}>
      <label>หน่วยงาน / ภาควิชา
        <select className="filter-drop" value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}>
          <option value="all">ทุกหน่วยงาน</option>
          {[...departmentOptions.entries()].sort((a, b) => a[1].localeCompare(b[1], 'th')).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <label>สถานะโครงการ
        <select className="filter-drop" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="all">ทุกสถานะ</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>เรียงความคืบหน้าในแต่ละหน่วยงาน
        <select className="filter-drop" value={progressSort} onChange={event => setProgressSort(event.target.value)}>
          <option value="default">ลำดับเดิม</option>
          <option value="asc">น้อยไปมาก</option>
          <option value="desc">มากไปน้อย</option>
        </select>
      </label>
    </PeriodFilter>
    {!visibleProjects.length && <div className="content-card empty-cell">ไม่พบโครงการตามรอบที่เลือก</div>}
    {[...departments.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name, 'th')).map(([id, department]) => (
      <details key={`${id}-${departmentFilter}`} open={departmentFilter !== 'all' || departments.size === 1} className="content-card full-card department-progress-group">
        <summary className="department-progress-heading">
          <span className="department-progress-title"><BuildingIcon size={18} />{department.name}</span>
          <span className="department-progress-meta">{department.projects.length} โครงการ <span className="department-progress-chevron" aria-hidden="true">⌄</span></span>
        </summary>
        <div className="table-responsive">
          <table className="modern-table department-progress-table">
            <thead><tr><th>โครงการ</th><th>สถานะโครงการ</th><th>ความคืบหน้าล่าสุด (%)</th><th>รายละเอียด</th></tr></thead>
            <tbody>{department.projects.map(project => <tr key={project.id}>
              <td><strong>{project.name}</strong><span className="cell-subtext">{fiscalPeriodLabel(project.fiscal_year, project.quarter)}</span></td>
              <td><span className={`status-badge ${statusColors[project.status]}`}>{statusLabels[project.status]}</span></td>
              <td><StaffProgressSummary project={project} /></td>
              <td><button type="button" className="btn-outline" onClick={() => onOpenDetails(project)}>ดูรายงานรายไตรมาส</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </details>
    ))}
  </div>;
}
