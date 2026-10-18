import { useEffect, useRef, useState } from 'react';
import type { Project } from '../types';
import { DownloadIcon, PrinterIcon } from './Icons';

interface WordPreviewModalProps {
  project: Project | null;
  onClose: () => void;
  onDownloadWord: (projectId: number) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export function WordPreviewModal({ project, onClose, onDownloadWord }: WordPreviewModalProps) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!project) return;
    const controller = new AbortController();
    const host = container.current;
    host?.replaceChildren();
    // Render the downloaded DOCX itself so the preview shares the export's template.
    void (async () => {
      try {
        await Promise.resolve();
        if (controller.signal.aborted) return;
        setState('loading');
        const response = await fetch(`${API_BASE}/api/projects/${project.id}/export-word`, { signal: controller.signal });
        if (!response.ok) throw new Error('Document download failed');
        const data = await response.arrayBuffer();
        const { renderAsync } = await import('docx-preview');
        const page = document.createElement('div');
        await renderAsync(data, page, undefined, { className: 'proposal-docx', breakPages: true, renderHeaders: true, renderFooters: true });
        if (controller.signal.aborted) return;
        host?.replaceChildren(page);
        setState('ready');
      } catch {
        if (!controller.signal.aborted) setState('error');
      }
    })();
    return () => controller.abort();
  }, [project]);

  if (!project) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="word-doc-modal-container" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`แบบเสนอโครงการ ${project.name}`}>
        <div className="doc-toolbar">
          <div className="doc-toolbar-info">
            <strong>แบบเสนอโครงการ • {project.name}</strong>
            <small>แม่แบบเปิดโครงการ 12 หัวข้อ • ดูการจัดหน้าสำหรับพิมพ์ใน Word</small>
          </div>
          <div className="doc-toolbar-actions">
            <button type="button" className="btn-doc-download" onClick={() => onDownloadWord(project.id)}>
              <DownloadIcon size={14} /><span>ดาวน์โหลด Word (.docx)</span>
            </button>
            <button type="button" className="btn-doc-print" disabled={state !== 'ready'} onClick={() => window.print()}>
              <PrinterIcon size={14} /><span>พิมพ์ / บันทึก PDF</span>
            </button>
            <button type="button" className="btn-doc-close" onClick={onClose}>✕ ปิด</button>
          </div>
        </div>
        {state === 'loading' && <p className="doc-preview-message" role="status">กำลังสร้างตัวอย่างเอกสาร…</p>}
        {state === 'error' && <p className="doc-preview-message" role="alert">แสดงตัวอย่างไม่สำเร็จ กรุณาลองเปิดใหม่ หรือดาวน์โหลดไฟล์ Word</p>}
        <div className="proposal-preview" ref={container} />
      </div>
    </div>
  );
}
