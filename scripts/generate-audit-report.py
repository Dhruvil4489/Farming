"""
SmartFarm AI — Master Technical Audit, Completion Plan & Evaluation Readiness Generator
Generates both:
1. docs/SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.md
2. docs/SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf
"""

import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Set output paths
DOCS_DIR = Path(r"c:\Users\hetul\Downloads\Minor project\Farming\docs")
DOCS_DIR.mkdir(parents=True, exist_ok=True)
MD_OUTPUT_PATH = DOCS_DIR / "SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.md"
PDF_OUTPUT_PATH = DOCS_DIR / "SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf"

print("Starting generation of SmartFarm AI Technical Audit & Completion Plan...")
