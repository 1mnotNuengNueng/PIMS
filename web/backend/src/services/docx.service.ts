import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';

export async function generateProjectDocx(project: any): Promise<Buffer> {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(val);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'แบบเสนอโครงการ ประจำปีงบประมาณ พ.ศ. 2569',
                bold: true,
                size: 32, // 16pt
                font: 'TH SarabunPSK',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'คณะวิศวกรรมศาสตร์ กำแพงแสน มหาวิทยาลัยเกษตรศาสตร์',
                bold: true,
                size: 28, // 14pt
                font: 'TH SarabunPSK',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '--------------------------------------------------------------------------------------------------',
                size: 20,
                font: 'TH SarabunPSK',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // 1. Project Name
          new Paragraph({
            children: [
              new TextRun({ text: '1. ชื่อโครงการ: ', bold: true, size: 28, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.name, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),

          // 2. Strategic Alignment
          new Paragraph({
            children: [
              new TextRun({ text: '2. ความสอดคล้องกับแผนยุทธศาสตร์คณะ:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• แผนยุทธศาสตร์: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.strategic_plan?.name || '-', size: 26, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• เป้าประสงค์เชิงกลยุทธ์: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.strategic_goal || '-', size: 26, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• ตัวชี้วัดระดับยุทธศาสตร์: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.strategic_kpi || '-', size: 26, font: 'TH SarabunPSK' }),
            ],
          }),

          // 3. Responsible
          new Paragraph({
            children: [
              new TextRun({ text: '3. ผู้รับผิดชอบโครงการและหน่วยงาน:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• ผู้รับผิดชอบ: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.responsible_person, size: 26, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• หน่วยงาน / ภาควิชา: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.user?.major?.name || project.target_group, size: 26, font: 'TH SarabunPSK' }),
            ],
          }),

          // 4. Principles & Rationale
          new Paragraph({
            children: [
              new TextRun({ text: '4. หลักการและเหตุผล:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [new TextRun({ text: project.principles_rationale, size: 26, font: 'TH SarabunPSK' })],
          }),

          // 5. Objective
          new Paragraph({
            children: [
              new TextRun({ text: '5. วัตถุประสงค์ของโครงการ:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [new TextRun({ text: project.objective, size: 26, font: 'TH SarabunPSK' })],
          }),

          // 6. Target Group
          new Paragraph({
            children: [
              new TextRun({ text: '6. กลุ่มเป้าหมาย / ผู้เข้าร่วม:', bold: true, size: 28, font: 'TH SarabunPSK' }),
              new TextRun({ text: ` ${project.target_group}`, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),

          // 7. Implementation Procedure
          new Paragraph({
            children: [
              new TextRun({ text: '7. วิธีดำเนินการ / แผนขั้นตอนการดำเนินงาน:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [new TextRun({ text: project.implementation_procedure, size: 26, font: 'TH SarabunPSK' })],
          }),

          // 8. Duration & Location
          new Paragraph({
            children: [
              new TextRun({ text: '8. ระยะเวลาและสถานที่ดำเนินงาน:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• ระยะเวลาดำเนินการ: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.duration_of_operations, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: ` (กำหนดแล้วเสร็จ: ${project.target_date || '-'})`, size: 26, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• สถานที่ดำเนินงาน: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.location, size: 26, font: 'TH SarabunPSK' }),
            ],
          }),

          // 9. KPI & Target
          new Paragraph({
            children: [
              new TextRun({ text: '9. ตัวชี้วัดความสำเร็จของโครงการ (KPI) และค่าเป้าหมาย:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• ตัวชี้วัดโครงการ: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.project_kpi || project.evaluation || '-', size: 26, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• ค่าเป้าหมาย: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.kpi_target || '-', size: 26, font: 'TH SarabunPSK' }),
            ],
          }),

          // 10. Budget
          new Paragraph({
            children: [
              new TextRun({ text: '10. งบประมาณและแหล่งเงินทุน:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• แหล่งงบประมาณ: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: project.operating_budget?.name || '-', size: 26, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `• วงเงินงบประมาณรวม: `, bold: true, size: 26, font: 'TH SarabunPSK' }),
              new TextRun({ text: `${formatCurrency(project.budget_amount)} บาท`, bold: true, size: 26, font: 'TH SarabunPSK' }),
            ],
          }),

          // 11. Expected Outcomes
          new Paragraph({
            children: [
              new TextRun({ text: '11. ประโยชน์และผลลัพธ์ที่คาดว่าจะได้รับ:', bold: true, size: 28, font: 'TH SarabunPSK' }),
            ],
          }),
          new Paragraph({
            indent: { left: 720 },
            children: [new TextRun({ text: project.expected_outcomes, size: 26, font: 'TH SarabunPSK' })],
          }),

          // 12. Review Notes if any
          ...(project.review_comment ? [
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({ text: 'หมายเหตุความเห็นจากคณะกรรมการ / ผู้ตรวจสอบ:', bold: true, size: 26, font: 'TH SarabunPSK' }),
              ],
            }),
            new Paragraph({
              indent: { left: 720 },
              children: [
                new TextRun({ text: `[สถานะ: ${project.status.toUpperCase()}] ${project.review_comment}`, italics: true, size: 26, font: 'TH SarabunPSK' }),
              ],
            }),
          ] : []),

          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),

          // 13. Signature Block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(ลงชื่อ).......................................................', size: 26, font: 'TH SarabunPSK' })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${project.responsible_person})`, size: 26, font: 'TH SarabunPSK' })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ผู้รับผิดชอบโครงการ / ผู้เสนอโครงการ', size: 24, font: 'TH SarabunPSK' })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `วันที่ ...... / ...... / 2569`, size: 24, font: 'TH SarabunPSK' })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(ลงชื่อ).......................................................', size: 26, font: 'TH SarabunPSK' })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(รองศาสตราจารย์ ดร.สมชาย ดอนเจดีย์)', size: 26, font: 'TH SarabunPSK' })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'คณบดีคณะวิศวกรรมศาสตร์ กำแพงแสน (ผู้อนุมัติโครงการ)', size: 24, font: 'TH SarabunPSK' })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `วันที่ ...... / ...... / 2569`, size: 24, font: 'TH SarabunPSK' })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
