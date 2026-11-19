# -*- coding: utf-8 -*-
"""
SmartFarm AI - Complete Technical Audit, Completion Plan & Evaluation Readiness Generator
"""

import os
import sys
from pathlib import Path

BASE_DIR = Path(r"c:\Users\hetul\Downloads\Minor project\Farming")
DOCS_DIR = BASE_DIR / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)
MD_PATH = DOCS_DIR / "SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.md"
PDF_PATH = DOCS_DIR / "SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf"

print(f"Target Markdown: {MD_PATH}")
print(f"Target PDF: {PDF_PATH}")
