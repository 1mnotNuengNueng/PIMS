# Project proposal template contract

Design authority: `Data/1. 690511(เปิดโครงการ)_โครงการกิจกรรม 5 ส. Aj.Taill-update-sj.doc`.
The original is read-only. This template is derived from a LibreOffice 26.2 conversion of a copy.
Original SHA256: `15d36676cb4321e47451c4ca3c9ea2e0fd15285b392423f8ad9b3c9a590f6113`.

Preserve all package parts except `word/document.xml` and source core metadata when preparing the template. At runtime modify only `word/document.xml`; styles, numbering, font table, footer, relationships, page geometry and assets remain byte-for-byte intact. Source geometry is Letter 12240 × 15840 twips with top 709, bottom 426, left 1440 and right 1259 twips. Main body is TH SarabunPSK 16 pt, title/faculty 18 pt, signatures 15 pt. Existing title rules and other source formatting are retained.

Slots: TITLE, NAME, OWNER, STRATEGY, RATIONALE, OBJECTIVES, TARGET, PROCEDURE, DURATION, LOCATION, KPI, OUTCOMES, BUDGET_SOURCE, BUDGET_AMOUNT, BUDGET_WORDS, OWNER_SIGNATURE, OWNER_ROLE. Multiline values clone the appropriate original paragraph prototype. XML escape user text and remove XML-invalid controls. Never interpret project content as template syntax.

Intentional adaptations: keep headings with content and signature lines together; remove manual page-padding blank paragraphs; retain natural paragraph spacing; align budget totals/Thai words to the original right edge and center the variable department in the right-hand signature block so different text lengths wrap safely. Remove the source project's detailed expenses, agenda, department/building lists and trailing blank pages. These are project data, not reusable form content. The application stores only a total and budget source, not itemized expenses or agendas. Do not fabricate these. Blank the approver name and use the actual responsible person/department. Page count changes with project text.

Validation: automated package-preservation checks and sample projects with short, long and empty content. Render samples and inspect every page for Thai glyphs, numbering, wrapping, clipping and signature placement before accepting template changes.

2026-10-18 QA: rendered the original (10 pages) and generated short (2 pages), long (3 pages) and empty (2 pages) samples. Inspected all pages. Used the skill's `render_docx.py` with LibreOffice conversion and a PyMuPDF adapter for rasterization because Poppler is not installed. QA PDFs/PNGs remain in the OS temporary directory.
