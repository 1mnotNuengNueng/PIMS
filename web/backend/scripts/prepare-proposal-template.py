"""Prepare a reusable template from a converted copy; never modify the source .doc."""
import re
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / 'templates' / 'project-proposal.docx'
target.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(source) as package:
    xml = package.read('word/document.xml').decode('utf-8')
    paragraphs = re.findall(r'<w:p(?:\s[^>]*)?>[\s\S]*?</w:p>', xml)

    def paragraph(index, value, *, tab=False, keep=False):
        original = paragraphs[index]
        props = re.search(r'<w:pPr>[\s\S]*?</w:pPr>', original).group()
        if keep:
            props = props.replace('</w:pPr>', '<w:keepNext/><w:keepLines/></w:pPr>')
        runs = re.findall(r'<w:r(?:\s[^>]*)?>[\s\S]*?</w:r>', original)
        run = next(r for r in runs if re.search(r'<w:t(?:\s[^>]*)?>', r))
        style = re.search(r'<w:rPr>[\s\S]*?</w:rPr>', run)
        return '<w:p>' + props + '<w:r>' + (style.group() if style else '') + ('<w:tab/>' if tab else '') + '<w:t xml:space="preserve">' + escape(value) + '</w:t></w:r></w:p>'

    def inline(index, label, token):
        original = paragraphs[index]
        props = re.search(r'<w:pPr>[\s\S]*?</w:pPr>', original).group()
        runs = re.findall(r'<w:r(?:\s[^>]*)?>[\s\S]*?</w:r>', original)
        content = next(r for r in reversed(runs) if re.search(r'<w:t(?:\s[^>]*)?>', r))
        style = re.search(r'<w:rPr>[\s\S]*?</w:rPr>', content).group()
        bold = re.search(r'<w:rPr>[\s\S]*?</w:rPr>', runs[0]).group()
        return '<w:p>' + props + '<w:r>' + bold + '<w:t xml:space="preserve">' + escape(label) + '</w:t></w:r><w:r>' + style + '<w:t xml:space="preserve">' + token + '</w:t></w:r></w:p>'

    out = []
    def retain(*indices):
        out.extend(paragraphs[i] for i in indices)
    def slot(index, key, **options):
        out.append(paragraph(index, '{{' + key + '}}', **options))
    def heading(index):
        out.append(paragraphs[index].replace('</w:pPr>', '<w:keepNext/></w:pPr>'))
    def align(value, alignment, indent=0):
        props = re.search(r'<w:pPr>[\s\S]*?</w:pPr>', value).group()
        adjusted = re.sub(r'<w:ind\b[^>]*/>|<w:jc\b[^>]*/>', '', props)
        adjusted = adjusted.replace('</w:pPr>', f'<w:ind w:start="{indent}"/><w:jc w:val="{alignment}"/></w:pPr>')
        return value.replace(props, adjusted)

    slot(0, 'TITLE', keep=True)
    retain(1)
    heading(2)
    slot(3, 'STRATEGY')
    retain(4, 5)
    out.append(inline(6, '2. ชื่อโครงการ : ', '{{NAME}}'))
    retain(7, 8)
    out.append(inline(9, '3. ผู้รับผิดชอบโครงการ : ', '{{OWNER}}'))
    retain(10, 11)
    heading(12)
    slot(13, 'RATIONALE', tab=True)
    retain(15)
    heading(16)
    # Reuse the first objective's 5.1 list so cloned paragraphs continue numbering.
    slot(17, 'OBJECTIVES')
    retain(20)
    out.append(inline(21, '6. กลุ่มเป้าหมาย : ', '{{TARGET}}'))
    retain(24, 25)
    heading(28)
    slot(29, 'PROCEDURE')
    retain(48)
    heading(54)
    slot(55, 'DURATION')
    heading(62)
    slot(63, 'LOCATION')
    heading(64)
    slot(65, 'KPI')
    heading(66)
    slot(67, 'OUTCOMES')
    heading(72)
    slot(73, 'BUDGET_SOURCE', tab=True)
    total = paragraph(106, 'รวม           ', keep=True)
    total = total.replace('</w:p>', '<w:r><w:rPr><w:rFonts w:ascii="TH SarabunPSK" w:hAnsi="TH SarabunPSK" w:cs="TH SarabunPSK"/><w:b/><w:bCs/><w:sz w:val="32"/><w:szCs w:val="32"/><w:u w:val="single"/></w:rPr><w:t>{{BUDGET_AMOUNT}}</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="TH SarabunPSK" w:hAnsi="TH SarabunPSK" w:cs="TH SarabunPSK"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">  บาท</w:t></w:r></w:p>')
    out.append(align(total, 'right'))
    out.append(align(paragraph(107, '{{BUDGET_WORDS}}'), 'right'))
    retain(108, 109)
    slot(112, 'OWNER_SIGNATURE', keep=True)
    out.append(align(paragraph(113, '{{OWNER_ROLE}}', keep=True), 'center', 5400))
    retain(114, 115, 116, 117, 118)
    out.append(paragraph(119, '        (ลงชื่อ)................................................................', keep=True))
    out.append(paragraph(120, '                       (................................................)', keep=True))
    heading(121)
    retain(122)
    section = re.search(r'<w:sectPr[\s\S]*?</w:sectPr>', xml).group()
    xml = re.sub(r'(<w:body>)[\s\S]*?(</w:body>)', lambda m: m[1] + ''.join(out) + section + m[2], xml)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as result:
        for item in package.infolist():
            data = package.read(item.filename)
            if item.filename == 'word/document.xml':
                data = xml.encode('utf-8')
            elif item.filename == 'docProps/core.xml':
                data = b'<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"/>'
            result.writestr(item, data)
print(target)
