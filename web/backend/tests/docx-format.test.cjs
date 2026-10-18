require('ts-node/register');
const assert = require('node:assert/strict');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const JSZip = require('jszip');
const { generateProjectDocx } = require('../src/services/docx.service');

async function main() {
  const template = await JSZip.loadAsync(readFileSync(resolve(__dirname, '../templates/project-proposal.docx')));
  const project = {
    name: 'โครงการพัฒนาทักษะวิศวกรรม R&D <2570>', responsible_person: 'ผู้รับผิดชอบโครงการจำลอง',
    principles_rationale: 'พัฒนาทักษะนิสิตให้สอดคล้องกับการเรียนรู้และการทำงาน\nติดตามผลสัมฤทธิ์อย่างต่อเนื่อง',
    objective: '1. พัฒนาทักษะวิศวกรรม\n2. ส่งเสริมการประยุกต์ใช้ความรู้', target_group: 'นิสิต 80 คน',
    implementation_procedure: '1. สำรวจความต้องการ\n2. จัดกิจกรรมอบรม\n3. ประเมินและสรุปผล',
    duration_of_operations: '1 เมษายน 2570 - 30 กันยายน 2570', target_date: '30 กันยายน 2570',
    location: 'คณะวิศวกรรมศาสตร์ กำแพงแสน', project_kpi: 'จำนวนผู้ผ่านกิจกรรมอย่างน้อย 80 คน',
    kpi_target: '80 คน', expected_outcomes: 'นิสิตนำทักษะไปประยุกต์ใช้ได้\nเกิดความร่วมมือกับหน่วยงานภายนอก', budget_amount: 120000.25,
    fiscal_year: 2570, quarter: 3, strategic_plan: { name: 'การพัฒนาศักยภาพนิสิต' },
    operating_budget: { name: 'งบประมาณดำเนินงาน' }, user: { major: { name: 'ภาควิชาวิศวกรรมคอมพิวเตอร์' } },
  };
  const output = join(tmpdir(), 'pims-word-layout');
  mkdirSync(output, { recursive: true });
  for (const [name, data] of [
    ['project-style-sample', project],
    ['project-long-sample', { ...project, principles_rationale: Array(12).fill(project.principles_rationale).join('\n'), implementation_procedure: Array(12).fill('จัดกิจกรรมอบรมและติดตามผลการดำเนินงานร่วมกับผู้เข้าร่วมโครงการ').join('\n') }],
    ['project-empty-sample', { name: 'ทดสอบข้อมูลว่าง', budget_amount: 0 }],
  ]) {
    const bytes = await generateProjectDocx(data);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml').async('string');
    assert.ok(!xml.includes('{{'), 'All template slots must be filled');
    assert.ok(!/Smart Office|61,000|ศศรส|สมชาย|กำหนดการ|รายชื่อผู้/.test(xml), 'No source project details may leak');
    for (const entry of Object.values(template.files).filter(file => !file.dir && file.name !== 'word/document.xml')) {
      assert.deepEqual(await zip.file(entry.name).async('nodebuffer'), await entry.async('nodebuffer'), `${entry.name} must retain original formatting`);
    }
    const templateXml = await template.file('word/document.xml').async('string');
    assert.equal(xml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/)[0], templateXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/)[0]);
    if (name === 'project-style-sample') {
      assert.match(xml, /R&amp;D &lt;2570&gt;/);
      assert.match(xml, /120,000.25/);
      assert.match(xml, /หนึ่งแสนสองหมื่นบาทยี่สิบห้าสตางค์/);
      assert.ok(!xml.includes('1. พัฒนาทักษะ'), 'Do not duplicate automatic numbering');
      assert.match(xml, /<w:br\/>/);
      assert.match(xml, /เริ่มไตรมาส 3/);
      assert.match(xml, /1 เมษายน 2570/, 'Preserve dates at the beginning of bulleted content');
    }
    writeFileSync(join(output, `${name}.docx`), bytes);
  }
  await assert.rejects(generateProjectDocx({ budget_amount: -1 }), /Invalid project budget/);
  console.log('Template preservation, dynamic lists, escaping, source-data removal, empty/long content and budget tests passed.');
  console.log('QA samples:', output);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
