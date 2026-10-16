import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const FONT = 'TH SarabunPSK';
const BODY_SIZE = 28;
const DETAIL_SIZE = 26;

export async function generateProjectDocx(project: any): Promise<Buffer> {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value || 0);

  const text = (value: unknown) => (value == null || value === '' ? '-' : String(value));
  const heading = (label: string) =>
    new Paragraph({
      spacing: { before: 100, after: 30 },
      children: [new TextRun({ text: label, bold: true, size: BODY_SIZE, font: FONT })],
    });
  const detail = (label: string, value: unknown) =>
    new Paragraph({
      indent: { left: 720 },
      spacing: { after: 20 },
      children: [
        new TextRun({ text: label, bold: true, size: DETAIL_SIZE, font: FONT }),
        new TextRun({ text: text(value), size: DETAIL_SIZE, font: FONT }),
      ],
    });
  const contentLines = (value: unknown) => {
    const lines = String(value ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return lines.length ? lines : ['-'];
  };
  const body = (value: unknown) =>
    contentLines(value).map((line) => new Paragraph({
      indent: { left: 720 },
      spacing: { after: 40 },
      children: [new TextRun({ text: line, size: DETAIL_SIZE, font: FONT })],
    }));
  const listedBody = (value: unknown, mode: 'number' | 'bullet') =>
    contentLines(value).map((line, index) => {
      const alreadyNumbered = /^\s*\d+[.)]/.test(line);
      const alreadyBulleted = /^\s*[-•]/.test(line);
      const prefix = alreadyNumbered || alreadyBulleted
        ? ''
        : mode === 'number' ? `${index + 1}. ` : '• ';
      return new Paragraph({
        indent: { left: 720, hanging: 240 },
        spacing: { after: 35 },
        children: [new TextRun({ text: `${prefix}${line}`, size: DETAIL_SIZE, font: FONT })],
      });
    });

  const signatureCell = (name: string, role: string) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      margins: { top: 160, bottom: 160, left: 200, right: 200 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 30 }, children: [new TextRun({ text: '(ลงชื่อ)', size: 24, font: FONT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 60 }, children: [new TextRun({ text: '......................................', size: DETAIL_SIZE, font: FONT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: `(${name})`, size: DETAIL_SIZE, font: FONT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 30 }, children: [new TextRun({ text: role, size: 24, font: FONT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'วันที่ ...... / ...... / 2569', size: 24, font: FONT })] }),
      ],
    });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 30 },
          children: [new TextRun({ text: `โครงการ ${text(project.name)}`, bold: true, size: 32, font: FONT })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 220 },
          children: [new TextRun({ text: 'คณะวิศวกรรมศาสตร์ กำแพงแสน มหาวิทยาลัยเกษตรศาสตร์', bold: true, size: BODY_SIZE, font: FONT })],
        }),

        heading('1. แผนยุทธศาสตร์/แผนกลยุทธ์:'),
        detail('• แผนยุทธศาสตร์: ', project.strategic_plan?.name),
        ...(project.strategic_goal ? [detail('• เป้าประสงค์เชิงกลยุทธ์: ', project.strategic_goal)] : []),
        ...(project.strategic_kpi ? [detail('• ตัวชี้วัดระดับยุทธศาสตร์: ', project.strategic_kpi)] : []),

        heading('2. ชื่อโครงการ:'),
        ...body(project.name),

        heading('3. ผู้รับผิดชอบโครงการ:'),
        ...body(project.responsible_person),
        detail('• หน่วยงาน/ภาควิชา: ', project.user?.major?.name || project.target_group),

        heading('4. หลักการและเหตุผล:'),
        ...body(project.principles_rationale),

        heading('5. วัตถุประสงค์:'),
        ...listedBody(project.objective, 'number'),

        heading('6. กลุ่มเป้าหมาย:'),
        ...body(project.target_group),

        heading('7. วิธีการดำเนินการ:'),
        ...listedBody(project.implementation_procedure, 'number'),

        heading('8. ระยะเวลาของการดำเนินงาน:'),
        ...listedBody(project.duration_of_operations, 'bullet'),
        detail('กำหนดแล้วเสร็จ: ', project.target_date),

        heading('9. สถานที่การดำเนินการ:'),
        ...listedBody(project.location, 'bullet'),

        heading('10. การประเมินผล (ตัวชี้วัด):'),
        detail('• ตัวชี้วัดความสำเร็จ (KPI): ', project.project_kpi || project.evaluation),
        detail('• ค่าเป้าหมาย: ', project.kpi_target),

        heading('11. ผลที่คาดว่าจะได้รับ:'),
        ...listedBody(project.expected_outcomes, 'bullet'),

        heading('12. งบประมาณดำเนินการ:'),
        detail('• แหล่งงบประมาณ: ', project.operating_budget?.name),
        detail('• งบประมาณรวม: ', `${formatCurrency(project.budget_amount)} บาท`),

        ...(project.review_comment ? [
          heading('บันทึกความเห็นจากคณะกรรมการ/ผู้ตรวจสอบ:'),
          ...body(`[สถานะ: ${String(project.status).toUpperCase()}] ${project.review_comment}`),
        ] : []),

        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({ children: [
            signatureCell(project.responsible_person, 'ผู้รับผิดชอบโครงการ / ผู้เสนอโครงการ'),
            signatureCell('รองศาสตราจารย์ ดร.สมชาย ดอนเจดีย์', 'คณบดีคณะวิศวกรรมศาสตร์ กำแพงแสน (ผู้อนุมัติโครงการ)'),
          ] })],
        }),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}
