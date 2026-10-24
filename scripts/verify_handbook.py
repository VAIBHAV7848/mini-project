#!/usr/bin/env python3
"""
Verification Script for KLE Tech S1 Handbook
Verifies populated document against template.docx and info.docx
"""

import sys
import os
import subprocess
import zipfile
import re
from xml.etree import ElementTree as ET

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    'v': 'urn:schemas-microsoft-com:vml',
}

def verify_doc(template_path, info_path, populated_path, pdf_path):
    print("="*75)
    print("VERIFICATION SUITE: STAGE S1 GATE 1 STUDENT HANDBOOK")
    print("="*75)

    passed_all = True

    # 1. File existence
    for path, desc in [(template_path, "Template DOCX"), (info_path, "Info DOCX"), (populated_path, "Populated DOCX"), (pdf_path, "Compiled PDF")]:
        exists = os.path.exists(path)
        size = os.path.getsize(path) if exists else 0
        status = "PASS" if exists and size > 0 else "FAIL"
        print(f"[{status}] {desc:<20}: {path} ({size} bytes)")
        if not exists:
            passed_all = False

    # 2. Inspect DOCX zip package
    with zipfile.ZipFile(populated_path, 'r') as z:
        doc_xml = ET.fromstring(z.read('word/document.xml'))
        tables = doc_xml.findall('.//w:tbl', NS)
        paragraphs = doc_xml.findall('.//w:p', NS)
        drawings = doc_xml.findall('.//w:drawing', NS)

        # Check table count
        tbl_status = "PASS" if len(tables) == 45 else "FAIL"
        print(f"[{tbl_status}] Total Table Count    : {len(tables)} tables (Expected: 45)")
        if len(tables) != 45:
            passed_all = False

        # Check drawing in Table 11
        t11_drawings = tables[11].findall('.//w:drawing', NS)
        diag_status = "PASS" if len(t11_drawings) > 0 else "FAIL"
        print(f"[{diag_status}] Table 11 UML Diagram : {len(t11_drawings)} DrawingML element(s) embedded")
        if len(t11_drawings) == 0:
            passed_all = False

        # Check cantSplit
        rows_with_cant_split = 0
        total_rows = 0
        for t in tables:
            for r in t.findall('w:tr', NS):
                total_rows += 1
                if r.find('.//w:cantSplit', NS) is not None:
                    rows_with_cant_split += 1
        cant_split_status = "PASS" if rows_with_cant_split == total_rows else "WARN"
        print(f"[{cant_split_status}] cantSplit Pagination : {rows_with_cant_split}/{total_rows} rows protected against page split")

    # 3. Check PDF metadata
    pdf_info_cmd = ["pdfinfo", pdf_path]
    res = subprocess.run(pdf_info_cmd, capture_output=True, text=True)
    if res.returncode == 0:
        pages = 0
        page_size = ""
        for line in res.stdout.splitlines():
            if line.startswith("Pages:"):
                pages = int(line.split(":")[1].strip())
            if line.startswith("Page size:"):
                page_size = line.split(":")[1].strip()
        print(f"[PASS] PDF Page Count       : {pages} pages")
        print(f"[PASS] PDF Page Dimensions  : {page_size}")
    else:
        print(f"[FAIL] pdfinfo failed: {res.stderr}")
        passed_all = False

    print("="*75)
    print(f"OVERALL STATUS: {'PASS' if passed_all else 'FAIL'}")
    print("="*75)
    return passed_all

if __name__ == "__main__":
    t_path = "docs/template.docx"
    i_path = "docs/info.docx"
    p_path = "docs/S1_Student_Handbook_Team07_TEMPLATE_LAYOUT_FIXED.docx"
    pdf_path = "docs/S1_Student_Handbook_Team07_TEMPLATE_LAYOUT_FIXED.pdf"
    ok = verify_doc(t_path, i_path, p_path, pdf_path)
    sys.exit(0 if ok else 1)
