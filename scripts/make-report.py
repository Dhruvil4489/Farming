"""
SmartFarm AI — Master Technical Audit, Completion Plan & Evaluation Readiness Report Generator
Generates both:
1. docs/SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.md
2. docs/SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf
"""

import os
import sys
from pathlib import Path

# Paths
BASE_DIR = Path(r"c:\Users\hetul\Downloads\Minor project\Farming")
DOCS_DIR = BASE_DIR / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)
MD_PATH = DOCS_DIR / "SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.md"
PDF_PATH = DOCS_DIR / "SmartFarm_AI_COMPLETE_TECHNICAL_AUDIT_AND_COMPLETION_PLAN.pdf"

print("Compiling Master Technical Audit and Completion Plan...")
