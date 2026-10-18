import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Project, ProjectReviewData } from '../types';
import { statusLabels } from '../types';
import { ProjectSummary } from '../components/ProjectSummary';
import { QuarterlyReportDetails } from '../components/QuarterlyReportDetails';
import { fiscalPeriodLabel, quarters } from '../utils/fiscalPeriod';
import { preferredPeriod, reportStatusLabels, periodStage } from '../utils/quarterlyReview';

type Props = {
  projectId: number;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
  authHeaders: Record<string, string>;
  onBack: () => void;
  onWordPreview: (project: Project) => void;
  onProjectReview: (project: Project) => void;
  onReportsChanged: () => Promise<void>;
  refreshKey: number;
  onCreateReplacement: (project: Project) => void;
};

export function ProjectReviewPage({ projectId, request, authHeaders, onBack, onWordPreview, onProjectReview, onReportsChanged, refreshKey, onCreateReplacement }: Props) {
  const [data, setData] = useState<ProjectReviewData | null>(null);
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loadedVersion, setLoadedVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'approve' | 'resubmit'>('approve');
  const [reload, setReload] = useState(0);
  const requestVersion = `${projectId}:${refreshKey}:${reload}`;
  const loading = loadedVersion !== requestVersion;

  useEffect(() => {
    const controller = new AbortController();
    request<ProjectReviewData>(`/api/projects/${projectId}/review-details`, { headers: authHeaders, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setError('');
        setData(result);
        const first = result.periods.find((period) => periodStage(result.project, period) === 'proposal');
        const progressReports = result.reports.filter((item) => periodStage(result.project, item.fiscal_period) === 'progress');
        setPeriodId((current) => result.periods.some((period) => period.id === current) ? current : result.project.status !== 'approve' && first ? first.id : preferredPeriod(result.periods, progressReports, result.project.quarter));
      })
      .catch((cause) => { if (!controller.signal.aborted) { setData(null); setError(cause instanceof Error ? cause.message : 'โหลดรายละเอียดไม่สำเร็จ'); } })
      .finally(() => { if (!controller.signal.aborted) setLoadedVersion(requestVersion); });
    return () => controller.abort();
  }, [projectId, authHeaders, requestVersion, request]);

  const period = data?.periods.find((item) => item.id === periodId);
  const report = data?.reports.find((item) => item.fiscal_period_id === periodId);
  const stage = data && period ? periodStage(data.project, period) : null;
  const years = [...new Set(data?.periods.map((item) => item.fiscal_year.year) || [])].sort((a, b) => b - a);
  const selectPeriod = (id: number) => { setPeriodId(id); setComment(''); setAction('approve'); setMessage(''); };

  async function submitReportReview(event: FormEvent) {
    event.preventDefault();
    if (!report || !period || report.status !== 'submitted' || saving || data?.project.status !== 'approve' || stage !== 'progress') return;
    const label = fiscalPeriodLabel(period.fiscal_year.year, period.quarter);
    if (!window.confirm(`${action === 'approve' ? 'ยืนยันอนุมัติรายงาน' : 'ยืนยันส่งรายงานกลับแก้ไข'} ${label}?`)) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await request(`/api/projects/${projectId}/quarterly-reports/${report.id}/review`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ action, comment }),
      });
      setMessage(`${action === 'approve' ? 'อนุมัติรายงานแล้ว' : 'ส่งรายงานกลับแก้ไขแล้ว'}: ${label}`);
      setComment('');
      setReload((current) => current + 1);
      await onReportsChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกผลตรวจไม่สำเร็จ');
      setReload((current) => current + 1);
    } finally { setSaving(false); }
  }

  return <div className="view-container project-review-page animate-fade">
    <button className="btn-outline" type="button" onClick={onBack}>← กลับหน้าตรวจโครงการ</button>
    {error && <div className="alert-banner alert-danger" role="alert">{error}<button type="button" className="btn-outline" onClick={() => setReload((value) => value + 1)}>ลองใหม่</button></div>}
    {message && <div className="alert-banner alert-success" role="status">{message}</div>}
    {loading ? <p role="status">กำลังโหลดรายละเอียดโครงการและรายงานรายไตรมาส…</p> : !data ? null : <>
      <header className="review-page-heading">
        <h1>ตรวจโครงการและรายงานความคืบหน้า</h1>
        <p>อ่านรายละเอียดโครงการ และพิจารณารายงานของไตรมาสที่เลือก</p>
      </header>
      <div className="project-review-columns">
      <ProjectSummary project={data.project} onWordPreview={onWordPreview} />
      <section className="content-card quarter-review-section">
        <h2>ข้อเสนอและความคืบหน้ารายไตรมาส</h2>
        <p>เลือกไตรมาสเพื่อดูผลดำเนินงาน ตัวชี้วัด งบที่ใช้ และผลการตรวจของรอบนั้น</p>
        {!period ? <div className="quarter-empty">ยังไม่มีรอบรายงานสำหรับโครงการนี้</div> : <>
          <label className="quarter-year-picker">ปีงบประมาณที่ตรวจ
            <select disabled={saving} value={period.fiscal_year.year} onChange={(e) => {
              const next = data.periods.find((item) => item.fiscal_year.year === Number(e.target.value) && item.quarter === period.quarter)
                || data.periods.find((item) => item.fiscal_year.year === Number(e.target.value));
              if (next) selectPeriod(next.id);
            }}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
          </label>
          <div className="quarter-timeline" aria-label="เลือกรอบไตรมาส">
            {data.periods.filter((item) => item.fiscal_year.year === period.fiscal_year.year).map((item) => {
              const quarterReport = data.reports.find((value) => value.fiscal_period_id === item.id);
              const itemStage = periodStage(data.project, item);
              return <button type="button" disabled={saving} key={item.id} className={`quarter-tile ${item.id === periodId ? 'selected' : ''}`} aria-pressed={item.id === periodId} onClick={() => selectPeriod(item.id)}>
                <strong>{quarters.find((value) => value.value === item.quarter)?.label}</strong>
                <span>{itemStage === 'before_start' ? 'ยังไม่เริ่มโครงการ' : itemStage === 'proposal' ? statusLabels[data.project.status] : quarterReport ? reportStatusLabels[quarterReport.status] : data.project.status === 'cancel' ? 'โครงการยกเลิกแล้ว' : 'ยังไม่มีรายงาน'}</span>
                <b>{itemStage === 'proposal' ? 'ข้อเสนอโครงการ' : itemStage === 'before_start' ? '—' : quarterReport ? `${quarterReport.progress_percent}%` : 'ยังไม่มีข้อมูล'}</b>
              </button>;
            })}
          </div>
          {stage === 'before_start' ? <p className="quarter-empty">รอบนี้อยู่ก่อนเริ่มโครงการ จึงไม่ต้องส่งรายงาน</p> : stage === 'proposal' ? <section className="quarter-review-notice">
            <h2>รอบเริ่มต้น: ข้อเสนอโครงการ</h2>
            <p>{fiscalPeriodLabel(period.fiscal_year.year, period.quarter)}</p>
            <p>สถานะข้อเสนอ: <strong>{statusLabels[data.project.status]}</strong></p>
            <p>รอบนี้ใช้ส่งและตรวจข้อเสนอ ยังไม่มีเปอร์เซ็นต์ผลดำเนินงาน</p>
            {data.project.status === 'submitted' && <button type="button" className="btn-trigger-review" onClick={() => onProjectReview(data.project)}>พิจารณาข้อเสนอของรอบเริ่มต้น</button>}
            {data.project.status === 'draft' && <p>รอภาควิชาส่งข้อเสนอ แอดมินยังพิจารณาฉบับร่างที่ไม่ส่งไม่ได้</p>}
            {data.project.status === 'resubmit' && <p>รอแก้ไขและส่งใหม่: {data.project.review_comment}</p>}
            {report && <details><summary>ดูรายงานเดิมของรอบเริ่มต้นก่อนปรับขั้นตอน</summary><QuarterlyReportDetails period={period} report={report} /></details>}
          </section> : <QuarterlyReportDetails period={period} report={report} />}
          {stage === 'progress' && report?.status === 'submitted' && data.project.status === 'approve' ? <form className="quarter-review-form" onSubmit={submitReportReview}>
            <h3>ผลตรวจรายงาน: {fiscalPeriodLabel(period.fiscal_year.year, period.quarter)}</h3>
            <fieldset className="quarter-decision-options" disabled={saving}>
              <legend>เลือกผลการพิจารณารายงาน</legend>
              <label className={`quarter-decision-option ${action === 'approve' ? 'selected' : ''}`}>
                <input type="radio" name="quarter-review-action" checked={action === 'approve'} onChange={() => setAction('approve')} />
                <span>อนุมัติรายงาน</span>
              </label>
              <label className={`quarter-decision-option ${action === 'resubmit' ? 'selected' : ''}`}>
                <input type="radio" name="quarter-review-action" checked={action === 'resubmit'} onChange={() => setAction('resubmit')} />
                <span>ส่งกลับแก้ไข</span>
              </label>
            </fieldset>
            <label className="field-block"><span className="field-label">ความเห็นผู้ตรวจ{action === 'resubmit' ? ' (จำเป็น)' : ''}</span>
              <textarea disabled={saving} rows={3} required={action === 'resubmit'} value={comment} onChange={(e) => setComment(e.target.value)} />
            </label>
            <button className="btn-trigger-review" disabled={saving || (action === 'resubmit' && !comment.trim())}>{saving ? 'กำลังบันทึก…' : `ยืนยัน${action === 'approve' ? 'อนุมัติรายงาน' : 'ส่งรายงานกลับแก้ไข'} ไตรมาส ${period.quarter} / ${period.fiscal_year.year}`}</button>
          </form> : stage === 'progress' && report && <p className="quarter-review-notice">{data.project.status === 'cancel' ? 'โครงการยกเลิกแล้ว แสดงรายงานเดิมเพื่อดูประวัติเท่านั้น' : data.project.status !== 'approve' ? 'รอโครงการอนุมัติก่อนพิจารณาความคืบหน้า' : report.status === 'draft' ? 'รายงานยังเป็นฉบับร่าง จึงยังไม่เปิดให้ตรวจ' : report.status === 'resubmit' ? 'รอผู้รับผิดชอบแก้ไขและส่งรายงานอีกครั้ง' : 'รายงานของรอบนี้ผ่านการตรวจแล้ว'}</p>}
        </>}
        <div className="project-status-review-action">
          <div><strong>การพิจารณาตัวโครงการ</strong><p>อนุมัติ ส่งกลับแก้ไข หรือยกเลิกโครงการ</p></div>
          {data.project.status === 'cancel' ? <button type="button" className="btn-outline" onClick={() => onCreateReplacement(data.project)}>สร้างโครงการใหม่ทดแทน</button> : <button type="button" disabled={saving} className={data.project.status === 'submitted' ? 'btn-outline' : 'btn-danger'} onClick={() => onProjectReview(data.project)}>{data.project.status === 'submitted' ? 'พิจารณาสถานะโครงการ' : 'ยกเลิกโครงการพร้อมระบุเหตุผล'}</button>}
        </div>
      </section>
      </div>
    </>}
  </div>;
}
