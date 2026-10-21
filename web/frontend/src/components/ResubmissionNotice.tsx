import type { Project } from '../types';

export function isResubmitted(project: Project) {
  return project.status === 'submitted' && Boolean(project.review_comment?.trim());
}

export function ResubmissionNotice({ project }: { project: Project }) {
  if (!isResubmitted(project)) return null;
  const submittedAt = project.submitted_at ? new Date(project.submitted_at) : null;
  const timestamp = submittedAt && !Number.isNaN(submittedAt.getTime())
    ? submittedAt.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  return <div className="resubmission-notice">
    <strong>แก้ไขและส่งใหม่แล้ว • รอพิจารณาอีกครั้ง</strong>
    {timestamp && <span>ส่งใหม่เมื่อ {timestamp} น.</span>}
  </div>;
}
