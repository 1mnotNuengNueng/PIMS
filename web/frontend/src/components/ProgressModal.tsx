import { useEffect, useState } from 'react';
import type { Project, ProjectReviewData, QuarterlyReport } from '../types';
import { quarters, fiscalPeriodLabel } from '../utils/fiscalPeriod';
import { reportStatusLabels } from '../utils/quarterlyReview';
import { staffReportPeriod } from '../utils/staffReporting';

interface ProgressModalProps {
  project: Project | null;
  onClose: () => void;
  onSubmitProgressUpdate: (status: 'draft' | 'submitted') => Promise<void>;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  authHeaders: Record<string, string>;
}

function reportFields(report?: QuarterlyReport) {
  return { results: report?.results || '', kpi: report?.kpi_results || '',
    progress: String(report?.progress_percent ?? 0), spent: String(report?.budget_spent ?? 0),
    problems: report?.problems || '', nextSteps: report?.next_steps || '' };
}

export const ProgressModal = ({ project, onClose, onSubmitProgressUpdate, request, authHeaders }: ProgressModalProps) => {
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('');
  const [fields, setFields] = useState(reportFields());
  const [data, setData] = useState<ProjectReviewData | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!project) return;
    const controller = new AbortController();
    request<ProjectReviewData>(`/api/projects/${project.id}/reporting`, { headers: authHeaders, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        const initial = staffReportPeriod(result.project, result.reports);
        setYear(String(initial.year)); setQuarter(String(initial.quarter));
        const initialReport = result.reports.find((report) => report.fiscal_period.fiscal_year.year === initial.year && report.fiscal_period.quarter === initial.quarter);
        setFields(reportFields(initialReport));
        setEditing(!initialReport);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'โหลดรอบรายงานไม่สำเร็จ'); });
    return () => controller.abort();
  }, [project, request, authHeaders]);
  if (!project) return null;
  const selected = data?.reports.find((report) => report.fiscal_period.fiscal_year.year === Number(year) && report.fiscal_period.quarter === Number(quarter));
  const activeProject = data?.project || project;
  const isProgressPeriod = Boolean(activeProject.fiscal_year && activeProject.quarter && Number(year) * 4 + Number(quarter) > activeProject.fiscal_year * 4 + activeProject.quarter);
  const editable = isProgressPeriod && activeProject.status === 'approve';
  const label = fiscalPeriodLabel(Number(year), Number(quarter));
  const selectedPeriod = data?.periods.find(period => period.fiscal_year.year === Number(year) && period.quarter === Number(quarter));
  function selectPeriod(nextYearValue: string, nextQuarterValue: string) {
    setYear(nextYearValue); setQuarter(nextQuarterValue); setError(''); setMessage('');
    const nextReport = data?.reports.find((report) => report.fiscal_period.fiscal_year.year === Number(nextYearValue) && report.fiscal_period.quarter === Number(nextQuarterValue));
    setFields(reportFields(nextReport));
    setEditing(!nextReport);
  }
  async function save(status: 'draft' | 'submitted') {
    if (!project || !editable || !editing || saving) return;
    if (fields.progress.trim() === '' || fields.spent.trim() === '') { setError('กรุณาระบุความคืบหน้าและงบที่ใช้ โดยกรอก 0 ได้'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      await request(`/api/projects/${project.id}/quarterly-reports`, { method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ fiscal_year: Number(year), quarter: Number(quarter), status,
          results: fields.results, kpi_results: fields.kpi, progress_percent: Number(fields.progress),
          budget_spent: Number(fields.spent), problems: fields.problems, next_steps: fields.nextSteps }),
      });
      const refreshed = await request<ProjectReviewData>(`/api/projects/${project.id}/reporting`, { headers: authHeaders });
      setData(refreshed);
      setEditing(false);
      setMessage(status === 'draft' ? 'บันทึกร่างแล้ว สามารถแก้ไขต่อหรือส่งรายงานได้' : 'อัปเดตรายงานความคืบหน้าแล้ว');
      await onSubmitProgressUpdate(status);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'บันทึกรายงานไม่สำเร็จ'); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onClick={() => { if (!saving) onClose(); }}>
    <div className="modal-card-box project-review-modal progress-report-modal" role="dialog" aria-modal="true" aria-label="รายงานความคืบหน้ารายไตรมาส" onClick={(event) => event.stopPropagation()}>
      <div className="modal-card-header"><h2>รายงานความคืบหน้ารายไตรมาส</h2><button type="button" className="btn-modal-close" disabled={saving} onClick={onClose}>✕</button></div>
      <div className="progress-report-intro">
        <span>โครงการที่รายงาน</span>
        <h3>{project.name}</h3>
        <p>รายงานผลได้ตั้งแต่ไตรมาสถัดจากรอบยื่นข้อเสนอ เมื่อโครงการได้รับอนุมัติแล้ว</p>
      </div>
      {error && <p className="alert-banner alert-danger" role="alert">{error}</p>}
      {message && <p className="quarter-review-notice" role="status">{message}</p>}
      {!data ? <p>กำลังโหลดรอบรายงาน…</p> : <form onSubmit={(event) => { event.preventDefault(); void save('submitted'); }}>
        <section className="progress-period-panel">
        <h3>1. เลือกรอบรายงาน</h3>
        <div className="input-grid two-cols">
          <label className="field-block"><span>ปีงบประมาณ (พ.ศ.)</span><input value={year} readOnly aria-readonly="true" /><small>กำหนดตามรอบรายงานอัตโนมัติ</small></label>
          <label className="field-block"><span>ไตรมาสที่รายงาน</span><select disabled={saving} value={quarter} onChange={(event) => selectPeriod(year, event.target.value)}>
            {quarters.map((value) => <option key={value.value} value={value.value}>{value.label}</option>)}
          </select></label>
        </div>
        <div className="progress-period-summary">
          <div><span>รอบที่เลือก</span><strong>{label}</strong></div>
          <div><span>สถานะรายงาน</span><strong>{selected ? reportStatusLabels[selected.status] : 'ยังไม่มีรายงาน'}</strong></div>
          {selectedPeriod?.report_due_date && <div><span>กำหนดส่ง</span><strong>{new Date(selectedPeriod.report_due_date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>}
        </div>
        </section>
        {!isProgressPeriod && <p className="quarter-review-notice">รอบนี้เป็นรอบเริ่มต้นหรือก่อนเริ่มโครงการ กรุณาเลือกรอบถัดไปเพื่อรายงานความคืบหน้า</p>}
        {selected?.review_comment && <p className="quarter-review-notice">ความเห็นผู้ตรวจ: {selected.review_comment}</p>}
        {!editable && <p className="quarter-review-notice">รอบนี้ยังรายงานผลไม่ได้ หรือโครงการไม่ได้อยู่ระหว่างดำเนินการ</p>}
        {editable && !editing && <div className="progress-edit-toolbar"><span>กดแก้ไขรายงานเพื่อปรับปรุงข้อมูลรอบนี้</span><button type="button" className="btn-outline" disabled={saving} onClick={() => { setEditing(true); setMessage(''); }}>แก้ไขรายงาน</button></div>}
        <fieldset disabled={saving || !editable || !editing} className="report-edit-fields">
          <legend>2. ผลการดำเนินงานในไตรมาสนี้</legend>
          <label className="field-block"><span className="field-label required">ผลดำเนินงาน</span><textarea required rows={4} placeholder="สรุปกิจกรรมที่ทำแล้ว ผลที่เกิดขึ้น และจำนวนผู้เข้าร่วม" value={fields.results} onChange={(event) => setFields({ ...fields, results: event.target.value })} /></label>
          <label className="field-block"><span className="field-label required">ผลตัวชี้วัด KPI</span><textarea required rows={3} placeholder="ระบุตัวชี้วัด เป้าหมาย และผลที่ทำได้จริงในรอบนี้" value={fields.kpi} onChange={(event) => setFields({ ...fields, kpi: event.target.value })} /></label>
          <div className="input-grid two-cols">
            <label className="field-block"><span>ความคืบหน้าสะสม (%)</span><input required type="number" min="0" max="100" step="0.01" value={fields.progress} onChange={(event) => setFields({ ...fields, progress: event.target.value })} /></label>
            <label className="field-block"><span>งบที่ใช้เฉพาะไตรมาสนี้ (บาท)</span><input required type="number" min="0" step="0.01" value={fields.spent} onChange={(event) => setFields({ ...fields, spent: event.target.value })} /></label>
          </div>
          <p className="progress-field-hint">ความคืบหน้าเป็นยอดสะสมถึงรอบนี้ ส่วนงบประมาณให้ระบุเฉพาะที่ใช้ในไตรมาสนี้</p>
          <label className="field-block"><span>ปัญหา / อุปสรรค</span><textarea rows={2} placeholder="ระบุปัญหาที่พบ หากไม่มีให้ระบุว่า ไม่มี" value={fields.problems} onChange={(event) => setFields({ ...fields, problems: event.target.value })} /></label>
          <label className="field-block"><span>แผนดำเนินงานถัดไป</span><textarea rows={2} value={fields.nextSteps} onChange={(event) => setFields({ ...fields, nextSteps: event.target.value })} /></label>
        </fieldset>
        <div className="modal-footer-btns">
          <button type="button" className="btn-outline" disabled={saving} onClick={onClose}>ปิด</button>
          {editable && editing && <>
            {selected && <button type="button" className="btn-outline" disabled={saving} onClick={() => { setFields(reportFields(selected)); setEditing(false); setError(''); }}>ยกเลิกการแก้ไข</button>}
            {(!selected || selected.status === 'draft') && <button type="button" className="btn-outline" disabled={saving} onClick={() => { void save('draft'); }}>บันทึกร่างรายงาน</button>}
            <button className="btn-primary" disabled={saving}>{saving ? 'กำลังบันทึก…' : 'ส่งรายงาน'}</button>
          </>}
        </div>
        <section className="staff-report-history" aria-label="ประวัติรายงานรายไตรมาส">
          <h3>ประวัติรายงานรายไตรมาส</h3>
          {!data.reports.length && <p>ยังไม่มีรายงานที่บันทึกไว้</p>}
          {[...data.reports].sort((a, b) => b.fiscal_period.fiscal_year.year - a.fiscal_period.fiscal_year.year || b.fiscal_period.quarter - a.fiscal_period.quarter).map(report => <button
            type="button" key={report.id} className="staff-report-history-item" disabled={saving}
            aria-pressed={selected?.id === report.id}
            onClick={() => selectPeriod(String(report.fiscal_period.fiscal_year.year), String(report.fiscal_period.quarter))}>
            <span>{fiscalPeriodLabel(report.fiscal_period.fiscal_year.year, report.fiscal_period.quarter)}</span>
            <strong>{report.progress_percent}% • {reportStatusLabels[report.status]}</strong>
          </button>)}
        </section>
      </form>}
    </div>
  </div>;
};
