import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';

const templatePath = join(__dirname, '../../templates/project-proposal.docx');
const text = (value: unknown): string => value == null || value === '' ? '-' : String(value);
const lines = (value: unknown): string[] => {
  const result = text(value).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return result.length ? result : ['-'];
};
const escapeXml = (value: string): string => value
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function bahtWords(value: number): string {
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
  const integerWords = (number: number): string => {
    if (number >= 1_000_000) return integerWords(Math.floor(number / 1_000_000)) + 'ล้าน' + (number % 1_000_000 ? integerWords(number % 1_000_000) : '');
    const str = String(number);
    return [...str].map((char, index) => {
      const digit = Number(char), place = str.length - index - 1;
      if (!digit) return '';
      const word = place === 1 && digit === 1 ? '' : place === 1 && digit === 2 ? 'ยี่' : place === 0 && digit === 1 && number > 10 ? 'เอ็ด' : digits[digit];
      return (word ?? '') + (units[place] ?? '');
    }).join('') || digits[0]!;
  };
  const cents = Math.round(value * 100);
  return integerWords(Math.floor(cents / 100)) + 'บาท' + (cents % 100 ? integerWords(cents % 100) + 'สตางค์' : 'ถ้วน');
}

export async function generateProjectDocx(project: any): Promise<Buffer> {
  const amount = Number(project.budget_amount || 0);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) throw new Error('Invalid project budget');
  const duration = lines(project.duration_of_operations);
  if (project.target_date) duration.push(`กำหนดแล้วเสร็จ: ${project.target_date}`);
  if (project.fiscal_year) duration.push(`ปีงบประมาณ ${project.fiscal_year}${project.quarter ? ` เริ่มไตรมาส ${project.quarter}` : ''}`);
  const values: Record<string, string[]> = {
    TITLE: [`โครงการ ${text(project.name).replace(/^โครงการ\s*/, '')}`],
    NAME: [text(project.name)], OWNER: [text(project.responsible_person)],
    STRATEGY: [text(project.strategic_plan?.name), ...[project.strategic_goal, project.strategic_kpi].filter(Boolean).map(String)],
    RATIONALE: lines(project.principles_rationale), OBJECTIVES: lines(project.objective),
    TARGET: [text(project.target_group)], PROCEDURE: lines(project.implementation_procedure),
    DURATION: duration, LOCATION: lines(project.location),
    KPI: [...lines(project.project_kpi || project.evaluation), ...(project.kpi_target ? [`ค่าเป้าหมาย: ${project.kpi_target}`] : [])],
    OUTCOMES: lines(project.expected_outcomes),
    BUDGET_SOURCE: [`แหล่งงบประมาณ: ${text(project.operating_budget?.name)}`],
    BUDGET_AMOUNT: [new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)],
    BUDGET_WORDS: [`(-${bahtWords(amount)}-)`],
    OWNER_SIGNATURE: [`(ลงชื่อ).......................................................\n(${text(project.responsible_person)})`],
    OWNER_ROLE: [project.user?.major?.name || ''],
  };
  // Clone only slot paragraphs, preserving original run/paragraph styles and lists.
  const zip = await JSZip.loadAsync(await readFile(templatePath));
  const part = zip.file('word/document.xml');
  if (!part) throw new Error('Proposal template is missing document.xml');
  let xml = await part.async('string');
  xml = xml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, paragraph => {
    const key = paragraph.match(/\{\{([A-Z_]+)\}\}/)?.[1];
    if (!key) return paragraph;
    if (!values[key]) throw new Error(`Unknown proposal template slot: ${key}`);
    return values[key].map(value => {
      const content = value === '-' ? value : ['OBJECTIVES', 'PROCEDURE'].includes(key)
        ? value.replace(/^\s*(?:\d+(?:\.\d+)*[.)]\s+|\d+\.\d+\s+|[-•]\s*)/, '')
        : paragraph.includes('<w:numPr>') ? value.replace(/^\s*[-•]\s+/, '') : value;
      return paragraph.replace(`{{${key}}}`, () => escapeXml(content).replace(/\r?\n/g, '</w:t><w:br/><w:t xml:space="preserve">'));
    }).join('');
  });
  zip.file('word/document.xml', xml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
