import { useEffect, useState } from 'react';
import type { Project, ProjectReviewData, QuarterlyReport } from '../types';
import { fiscalYearOptions, quarters, fiscalPeriodLabel } from '../utils/fiscalPeriod';
import { reportStatusLabels } from '../utils/quarterlyReview';

interface ProgressModalProps {
  project: Project | null;
  onClose: () => void;
  onSubmitProgressUpdate: () => Promise<void>;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  authHeaders: Record<string, string>;
}

function reportFields(report?: QuarterlyReport) {
  return { results: report?.results || '', kpi: report?.kpi_results || '',
    progress: String(report?.progress_percent ?? 0), spent: String(report?.budget_spent ?? 0),
    problems: report?.problems || '', nextSteps: report?.next_steps || '' };
}

export const ProgressModal = ({ project, onClose, onSubmitProgressUpdate, request, authHeaders }: ProgressModalProps) => {
  const nextQuarter = project?.quarter === 4 ? 1 : (project?.quarter || 1) + 1;
  const nextYear = (project?.fiscal_year || 2570) + (project?.quarter === 4 ? 1 : 0);
  const [year, setYear] = useState(String(nextYear));
  const [quarter, setQuarter] = useState(String(nextQuarter));
  const [fields, setFields] = useState(reportFields());
  const [data, setData] = useState<ProjectReviewData | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!project) return;
    const controller = new AbortController();
    request<ProjectReviewData>(`/api/projects/${project.id}/reporting`, { headers: authHeaders, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setFields(reportFields(result.reports.find((report) => report.fiscal_period.fiscal_year.year === nextYear && report.fiscal_period.quarter === nextQuarter)));
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'โหลดรอบรายงานไม่สำเร็จ'); });
    return () => controller.abort();
  }, [project, request, authHeaders, nextYear, nextQuarter]);
  if (!project) return null;
  const selected = data?.reports.find((report) => report.fiscal_period.fiscal_year.year === Number(year) && report.fiscal_period.quarter === Number(quarter));
  const isProgressPeriod = Boolean(project.fiscal_year && project.quarter && Number(year) * 4 + Number(quarter) > project.fiscal_year * 4 + project.quarter);
  const editable = isProgressPeriod && project.status === 'approve' && (!selected || selected.status === 'draft' || selected.status === 'resubmit');
  const label = fiscalPeriodLabel(Number(year), Number(quarter));
  function selectPeriod(nextYearValue: string, nextQuarterValue: string) {
    setYear(nextYearValue); setQuarter(nextQuarterValue); setError('');
    setFields(reportFields(data?.reports.find((report) => report.fiscal_period.fiscal_year.year === Number(nextYearValue) && report.fiscal_period.quarter === Number(nextQuarterValue))));
  }
  async function save(status: 'draft' | 'submitted') {
    if (!project || !editable || saving) return;
    setSaving(true); setError('');
    try {
      await request(`/api/projects/${project.id}/quarterly-reports`, { method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ fiscal_year: Number(year), quarter: Number(quarter), status,
          results: fields.results, kpi_results: fields.kpi, progress_percent: Number(fields.progress),
          budget_spent: Number(fields.spent), problems: fields.problems, next_steps: fields.nextSteps }),
      });
      await onSubmitProgressUpdate();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'บันทึกรายงานไม่สำเร็จ'); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onClick={() => { if (!saving) onClose(); }}>
    <div className="modal-card-box project-review-modal" role="dialog" aria-modal="true" aria-label="รายงานความคืบหน้ารายไตรมาส" onClick={(event) => event.stopPropagation()}>
      <div className="modal-card-header"><h2>รายงานความคืบหน้ารายไตรมาส</h2><button type="button" className="btn-modal-close" disabled={saving} onClick={onClose}>✕</button></div>
      <p><strong>{project.name}</strong></p>
      <p>รอบเริ่มต้นใช้ยื่นข้อเสนอ รายงานผลเริ่มได้ในไตรมาสถัดไปหลังโครงการอนุมัติ</p>
      {error && <p className="alert-banner alert-danger" role="alert">{error}</p>}
      {!data ? <p>กำลังโหลดรอบรายงาน…</p> : <form onSubmit={(event) => { event.preventDefault(); void save('submitted'); }}>
        <div className="input-grid two-cols">
          <label className="field-block"><span>ปีงบประมาณ</span><select disabled={saving} value={year} onChange={(event) => selectPeriod(event.target.value, quarter)}>
            {fiscalYearOptions([Number(year)]).map((value) => <option key={value} value={value}>{value}</option>)}
          </select></label>
          <label className="field-block"><span>ไตรมาสที่รายงาน</span><select disabled={saving} value={quarter} onChange={(event) => selectPeriod(year, event.target.value)}>
            {quarters.map((value) => <option key={value.value} value={value.value}>{value.label}</option>)}
          </select></label>
        </div>
        <p><strong>{label}</strong> • {selected ? reportStatusLabels[selected.status] : 'ยังไม่มีรายงาน'}</p>
        {!isProgressPeriod && <p className="quarter-review-notice">รอบนี้เป็นรอบเริ่มต้นหรือก่อนเริ่มโครงการ กรุณาเลือกรอบถัดไปเพื่อรายงานความคืบหน้า</p>}
        {selected?.review_comment && <p className="quarter-review-notice">ความเห็นผู้ตรวจ: {selected.review_comment}</p>}
        {!editable && <p className="quarter-review-notice">รายงานส่งแล้วหรือโครงการไม่ได้อยู่ระหว่างดำเนินการ จึงดูข้อมูลได้อย่างเดียว</p>}
        <fieldset disabled={saving || !editable} className="report-edit-fields">
          <label className="field-block"><span>ผลดำเนินงาน</span><textarea required rows={4} value={fields.results} onChange={(event) => setFields({ ...fields, results: event.target.value })} /></label>
          <label className="field-block"><span>ผลตัวชี้วัด KPI</span><textarea required rows={3} value={fields.kpi} onChange={(event) => setFields({ ...fields, kpi: event.target.value })} /></label>
          <div className="input-grid two-cols">
            <label className="field-block"><span>ความคืบหน้าสะสม (%)</span><input required type="number" min="0" max="100" step="0.01" value={fields.progress} onChange={(event) => setFields({ ...fields, progress: event.target.value })} /></label>
            <label className="field-block"><span>งบที่ใช้เฉพาะไตรมาสนี้ (บาท)</span><input required type="number" min="0" step="0.01" value={fields.spent} onChange={(event) => setFields({ ...fields, spent: event.target.value })} /></label>
          </div>
          <label className="field-block"><span>ปัญหา / อุปสรรค</span><textarea rows={2} value={fields.problems} onChange={(event) => setFields({ ...fields, problems: event.target.value })} /></label>
          <label className="field-block"><span>แผนดำเนินงานถัดไป</span><textarea rows={2} value={fields.nextSteps} onChange={(event) => setFields({ ...fields, nextSteps: event.target.value })} /></label>
        </fieldset>
        <div className="modal-footer-btns">
          <button type="button" className="btn-outline" disabled={saving} onClick={onClose}>ปิด</button>
          <button type="button" className="btn-outline" disabled={saving || !editable} onClick={() => { void save('draft'); }}>บันทึกร่างรายงาน</button>
          <button className="btn-primary" disabled={saving || !editable}>{saving ? 'กำลังบันทึก…' : 'ส่งรายงานรอพิจารณา'}</button>
        </div>
      </form>}
    </div>
  </div>;
};
