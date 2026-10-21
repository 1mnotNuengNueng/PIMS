import type { FiscalPeriod, QuarterlyReport } from '../types';
import { fiscalPeriodLabel } from '../utils/fiscalPeriod';
import { formatMoney } from '../utils/format';
import { reportStatusLabels } from '../utils/quarterlyReview';

function displayDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }) : '-';
}

export function QuarterlyReportDetails({ period, report }: { period: FiscalPeriod; report: QuarterlyReport | undefined }) {
  return <section className="quarter-report-details" aria-label="รายงานของไตรมาสที่เลือก">
    <h2>รอบที่กำลังตรวจ: {fiscalPeriodLabel(period.fiscal_year.year, period.quarter)}</h2>
    <p>ช่วงรายงาน {displayDate(period.start_date)} – {displayDate(period.end_date)} • กำหนดส่ง {displayDate(period.report_due_date)}</p>
    {!report ? <div className="quarter-empty">ยังไม่มีรายงานในรอบนี้ จึงยังไม่มีข้อมูลความคืบหน้าหรือผลให้ตรวจ</div> : <>
      <span className={`report-status report-status-${report.status}`}>{reportStatusLabels[report.status]}</span>
      {report.is_demo && <span className="report-demo">ข้อมูลจำลอง</span>}
      <div className="quarter-progress-header"><h3>ความคืบหน้าสะสม ณ ไตรมาสนี้</h3><strong>{report.progress_percent}%</strong></div>
      <progress className="quarter-progress" max={100} value={report.progress_percent} aria-label="ความคืบหน้าสะสม" />
      {report.status === 'draft' && <p>ตัวเลขนี้เป็นข้อมูลฉบับร่าง ยังไม่ได้ส่งเพื่อรับการตรวจ</p>}
      <dl className="quarter-report-fields">
        {[
          ['ผลการดำเนินงาน', report.results], ['ผลตัวชี้วัด (KPI)', report.kpi_results],
          ['งบประมาณที่ใช้เฉพาะไตรมาสนี้', `${formatMoney(report.budget_spent)} บาท`],
          ['ปัญหา / อุปสรรค', report.problems], ['แผนดำเนินงานถัดไป', report.next_steps],
          ['ผู้รายงาน', report.author.Email], ['วันที่ส่งรายงาน', displayDate(report.submitted_at)],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '-'}</dd></div>)}
      </dl>
    </>}
  </section>;
}
