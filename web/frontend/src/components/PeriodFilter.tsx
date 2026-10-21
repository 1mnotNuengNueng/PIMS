import type { Project } from '../types';
import type { ReactNode } from 'react';
import { fiscalYearOptions, quarters } from '../utils/fiscalPeriod';

export function PeriodFilter({ projects, year, quarter, onYearChange, onQuarterChange, children }: {
  children?: ReactNode;
  projects: Project[];
  year: string;
  quarter: string;
  onYearChange: (value: string) => void;
  onQuarterChange: (value: string) => void;
}) {
  return <div className="period-filters">
    <label>ปีงบประมาณ (พ.ศ.)
      <select className="filter-drop" value={year} onChange={(e) => onYearChange(e.target.value)}>
        <option value="all">ทุกปีงบประมาณ</option>
        <option value="unset">ยังไม่ระบุปีงบประมาณ</option>
        {fiscalYearOptions(projects.flatMap((project) => project.fiscal_year ? [project.fiscal_year] : [])).map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>
    <label>ไตรมาส
      <select className="filter-drop" value={quarter} onChange={(e) => onQuarterChange(e.target.value)}>
        <option value="all">ทุกไตรมาส</option>
        {quarters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
    {children}
  </div>;
}
