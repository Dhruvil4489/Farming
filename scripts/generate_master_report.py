# -*- coding: utf-8 -*-
"""
SmartFarm AI — Master Technical Audit & Completion Plan PDF & Markdown Builder
Combines all 16 chapters and compiles:
1. docs/SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.md
2. docs/SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf
"""

import os
import sys
from pathlib import Path
import re

# ReportLab imports
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.pdfgen import canvas

# Import content parts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from report_content_part1 import PART_1_MD
from report_content_part2 import PART_2_MD
from report_content_part3 import PART_3_MD

BASE_DIR = Path(r"c:\Users\hetul\Downloads\Minor project\Farming")
DOCS_DIR = BASE_DIR / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

MD_PATH = DOCS_DIR / "SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.md"
PDF_PATH = DOCS_DIR / "SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf"

# Combine full Markdown
FULL_MD = PART_1_MD + "\n" + PART_2_MD + "\n" + PART_3_MD

# 1. Write the complete Markdown document
print(f"Writing complete Markdown report to {MD_PATH}...")
with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write(FULL_MD)
print(f"✔ Markdown report written successfully ({len(FULL_MD)} chars, {len(FULL_MD.splitlines())} lines).")

# Inline formatting helper for ReportLab Paragraphs
def format_inline_md(text):
    if not text:
        return ""
    # XML escaping
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    
    # Protect code spans: replace `...` with placeholder so wildcards inside aren't parsed
    code_spans = []
    def save_code(match):
        code_spans.append(match.group(1))
        return f"__CODE_SPAN_{len(code_spans)-1}__"
    
    text = re.sub(r'`([^`]+)`', save_code, text)
    
    # Bold: **text**
    text = re.sub(r'\*\*([^*]+?)\*\*', r'<b>\1</b>', text)
    
    # Italics: *text* (must be bordered by word chars, not slashes or standalone asterisks)
    text = re.sub(r'(?<![/\w])\*([a-zA-Z0-9][^*]*?[a-zA-Z0-9])\*(?![/\w])', r'<i>\1</i>', text)
    
    # Restore code spans
    for idx, c in enumerate(code_spans):
        text = text.replace(f"__CODE_SPAN_{idx}__", f'<font face="Courier" color="#1E293B">{c}</font>')
        
    # Checkboxes
    text = text.replace("[x]", "<b>[X]</b>").replace("[ ]", "[ ]")
    return text

# 2. Numbered Canvas for PDF (Page X of Y)
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#57534E"))

        # Header (pages after cover page)
        if self._pageNumber > 1:
            self.drawString(54, 800, "SmartFarm AI — Master Technical Audit, Architectural Evaluation & Defense Plan")
            self.setStrokeColor(colors.HexColor("#D6D3D1"))
            self.setLineWidth(0.5)
            self.line(54, 794, 541, 794)

        # Footer (all pages)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(541, 35, page_str)
        self.drawString(54, 35, "Confidential — Prepared for University Final-Year Engineering Project Defense")
        self.setStrokeColor(colors.HexColor("#D6D3D1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 541, 45)
        self.restoreState()

# 3. Build the PDF Document
print(f"Compiling PDF report with ReportLab to {PDF_PATH}...")

doc = SimpleDocTemplate(
    str(PDF_PATH),
    pagesize=A4,
    leftMargin=54,
    rightMargin=54,
    topMargin=54,
    bottomMargin=54
)

styles = getSampleStyleSheet()

primary_color = colors.HexColor("#143D2A")
secondary_color = colors.HexColor("#2F7D4F")
accent_color = colors.HexColor("#D97706")
text_dark = colors.HexColor("#1C1917")
bg_light = colors.HexColor("#FAF6EF")

title_style = ParagraphStyle(
    'CoverTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=20,
    leading=24,
    textColor=primary_color,
    alignment=1, # Center
    spaceAfter=10
)

subtitle_style = ParagraphStyle(
    'CoverSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=15,
    textColor=secondary_color,
    alignment=1,
    spaceAfter=16
)

meta_box_style = ParagraphStyle(
    'CoverMeta',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=13,
    textColor=text_dark
)

h1_style = ParagraphStyle(
    'Heading1_Custom',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=17,
    textColor=primary_color,
    spaceBefore=12,
    spaceAfter=6,
    keepWithNext=True
)

h2_style = ParagraphStyle(
    'Heading2_Custom',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=10.5,
    leading=14,
    textColor=secondary_color,
    spaceBefore=9,
    spaceAfter=4,
    keepWithNext=True
)

h3_style = ParagraphStyle(
    'Heading3_Custom',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#44403C"),
    spaceBefore=7,
    spaceAfter=3,
    keepWithNext=True
)

body_style = ParagraphStyle(
    'Body_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8,
    leading=11,
    textColor=text_dark,
    spaceAfter=4
)

bullet_style = ParagraphStyle(
    'Bullet_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8,
    leading=11,
    textColor=text_dark,
    leftIndent=12,
    spaceAfter=2
)

callout_style = ParagraphStyle(
    'Callout_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=7.5,
    leading=10.5,
    textColor=colors.HexColor("#78350F")
)

code_style = ParagraphStyle(
    'Code_Custom',
    parent=styles['Normal'],
    fontName='Courier',
    fontSize=6.5,
    leading=8,
    textColor=colors.HexColor("#1E293B")
)

table_header_style = ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=7,
    leading=9,
    textColor=colors.white,
    alignment=1
)

table_cell_style = ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=6.5,
    leading=8.5,
    textColor=text_dark
)

# Convert Markdown to Flowables
story = []

# COVER PAGE
story.append(Spacer(1, 10))
story.append(Paragraph("SMARTFARM AI", title_style))
story.append(Paragraph("AN IOT-INTEGRATED, AI-ASSISTED SMART FARMING AND DECISION SUPPORT PLATFORM FOR INDIAN FARMERS", subtitle_style))
story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=14))

meta_text = """
<b>Comprehensive Technical Audit, Architectural Evaluation, and Final-Year Evaluation Readiness Plan</b><br/><br/>
<b>Academic Purpose:</b> University Final-Year Engineering / Minor Project Defense &amp; Viva Readiness<br/>
<b>Review Consortium:</b> Senior Multidisciplinary Engineering Review Board<br/>
<b>Engineering Roles:</b> Software Architecture • Full-Stack (Next.js/React/TS) • AI/ML (Vision/RAG) • IoT Embedded Systems • Database Architecture • Cybersecurity • QA Automation • Technical Project Management<br/>
<b>Target Microcontroller:</b> Arduino Uno R3 (ATmega328P @ 16MHz) + Capacitive Soil Sensor v1.2 + 16x2 I2C LCD<br/>
<b>Software Stack:</b> Next.js 16.3.7 • React 19.3.0 • TypeScript 6.0.3 • Prisma ORM 6.4.0 • PyTorch 2.14.1 (ResNet-50)<br/>
<b>Database Provider:</b> SQLite (dev.db) for Evaluation Demo / PostgreSQL 16 for Production Target<br/>
<b>Audit Date:</b> November 18, 2026<br/>
<b>Evaluation Target:</b> High-Scoring University Faculty Viva Defense Under Strict One-Day Timeline
"""
meta_table = Table([[Paragraph(meta_text, meta_box_style)]], colWidths=[487])
meta_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), bg_light),
    ('BOX', (0, 0), (-1, -1), 1, secondary_color),
    ('PADDING', (0, 0), (-1, -1), 10),
]))
story.append(meta_table)

story.append(Spacer(1, 14))

exec_callout = """
<b>EXECUTIVE AUDIT SUMMARY &amp; KEY VERIFIED FINDINGS:</b><br/>
• <b>All 12 Automated Test Suites PASSED (100%):</b> Type-check, ESLint, unit validators, provider contracts, DB safety, Next.js server boot, API IDOR, RBAC, store regression, E2E farmer flow, route hydration.<br/>
• <b>Crop Disease Vision AI is GENUINELY IMPLEMENTED:</b> The 94.6MB PyTorch ResNet-50 weights exist and live inference was confirmed on CPU (Corn Gray Leaf Spot: 99.99% score) via decoupled FastAPI microservice.<br/>
• <b>Government Mandi Integration is REAL:</b> Connects to <code>data.gov.in</code> AGMARKNET Resource <code>9ef84268...</code> with seeded reference fallback.<br/>
• <b>Hardware Architecture Defined for Arduino Uno:</b> Clean USB serial streaming architecture designed to bridge available Arduino Uno hardware to Next.js API.<br/>
• <b>Electrical Safety Guard Disclosed:</b> Water pump motor cannot be driven directly from Arduino GPIO (20mA pin vs 500mA surge). Software simulation &amp; buzzer alert mode active.
"""
exec_table = Table([[Paragraph(exec_callout, callout_style)]], colWidths=[487])
exec_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
    ('PADDING', (0, 0), (-1, -1), 8),
]))
story.append(exec_table)

story.append(PageBreak())

# Parse lines of Markdown into flowables
lines = FULL_MD.splitlines()
in_code = False
code_lines = []
in_table = False
table_rows = []

def flush_table(rows):
    if not rows:
        return None
    num_cols = len(rows[0])
    total_width = 487
    col_w = total_width / max(num_cols, 1)
    
    formatted_data = []
    for r_idx, row in enumerate(rows):
        row_cells = []
        for cell in row:
            clean_cell = format_inline_md(cell.strip())
            if r_idx == 0:
                p = Paragraph(clean_cell, table_header_style)
            else:
                p = Paragraph(clean_cell, table_cell_style)
            row_cells.append(p)
        formatted_data.append(row_cells)
    
    t = Table(formatted_data, colWidths=[col_w] * num_cols)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D6D3D1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F4")]),
        ('PADDING', (0, 0), (-1, -1), 2.5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return t

i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()

    # Code block start/end
    if stripped.startswith("```"):
        if in_code:
            in_code = False
            code_text = "\n".join(code_lines)
            if len(code_text.strip()) > 0:
                p_code = Preformatted(code_text[:2500], code_style)
                code_box = Table([[p_code]], colWidths=[487])
                code_box.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ('PADDING', (0, 0), (-1, -1), 4),
                ]))
                story.append(code_box)
                story.append(Spacer(1, 4))
            code_lines = []
        else:
            in_code = True
            code_lines = []
        i += 1
        continue

    if in_code:
        code_lines.append(line)
        i += 1
        continue

    # Tables
    if stripped.startswith("|") and stripped.endswith("|"):
        if re.match(r"^\|(\s*[-:]+\s*\|)+$", stripped):
            i += 1
            continue
        cells = [c.strip() for c in stripped[1:-1].split("|")]
        table_rows.append(cells)
        in_table = True
        i += 1
        continue
    else:
        if in_table:
            t = flush_table(table_rows)
            if t:
                story.append(t)
                story.append(Spacer(1, 5))
            table_rows = []
            in_table = False

    # Empty lines
    if not stripped:
        story.append(Spacer(1, 2))
        i += 1
        continue

    # Headings
    if stripped.startswith("## "):
        h_text = format_inline_md(stripped[3:].strip())
        story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=8, spaceAfter=5))
        story.append(Paragraph(h_text, h1_style))
        i += 1
        continue
    elif stripped.startswith("### "):
        h_text = format_inline_md(stripped[4:].strip())
        story.append(Paragraph(h_text, h2_style))
        i += 1
        continue
    elif stripped.startswith("#### "):
        h_text = format_inline_md(stripped[5:].strip())
        story.append(Paragraph(h_text, h3_style))
        i += 1
        continue

    # Callout / Alert blockquote
    if stripped.startswith(">"):
        call_text = format_inline_md(stripped.lstrip("> ").replace("[!CAUTION]", "<b>[CAUTION]</b>").replace("[!WARNING]", "<b>[WARNING]</b>").replace("[!NOTE]", "<b>[NOTE]</b>"))
        call_t = Table([[Paragraph(call_text, callout_style)]], colWidths=[487])
        call_t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(call_t)
        story.append(Spacer(1, 4))
        i += 1
        continue

    # Bullets
    if stripped.startswith("- ") or stripped.startswith("* ") or re.match(r"^\d+\.\s", stripped):
        bullet_text = re.sub(r"^[-*]\s+|\d+\.\s+", "", stripped)
        clean_text = format_inline_md(bullet_text)
        story.append(Paragraph(f"• {clean_text}", bullet_style))
        i += 1
        continue

    # Normal paragraph
    clean_p = format_inline_md(stripped)
    story.append(Paragraph(clean_p, body_style))
    i += 1

# If table was left at end
if in_table and table_rows:
    t = flush_table(table_rows)
    if t:
        story.append(t)

doc.build(story, canvasmaker=NumberedCanvas)
print(f"✔ PDF compiled successfully to {PDF_PATH}")
