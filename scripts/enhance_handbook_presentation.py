#!/usr/bin/env python3
"""
scripts/enhance_handbook_presentation.py
Upgrades the KLE Tech Stage S1 Student Handbook to publication quality:
1. Eliminates 100% of placeholder / prompt texts ("In 3–5 sentences...", "REMINDER:", "STUDENT CHECK", etc.).
2. Replaces loose student instructions with formal executive engineering text.
3. Enhances visual styling: dark navy headers (#17365D), white text, subtle zebra striping (#F8FAFC), cell padding, cantSplit, and tblHeader.
4. Cleans up Table 1 (exact 4 student rows) and Table 10 (8 clean UC rows, no reminder).
5. Adds w:keepNext on all headings to guarantee zero orphan titles.
6. Compiles to PDF and validates.
"""

import os
import shutil
import subprocess
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

TEMPLATE_PATH = "docs/template.docx"
INFO_PATH = "docs/info.docx"
OUT_FIXED = "docs/S1_Student_Handbook_Team07_TEMPLATE_LAYOUT_FIXED.docx"
OUT_MAIN = "docs/S1_Student_Handbook (1).docx"
DIAGRAM_PATH = "assets/generated_diagrams/use_case_diagram.png"

FONT_FAMILY = "Bookman Old Style"
NAVY_HEADER = "17365D"
ZEBRA_BG = "F8FAFC"
BORDER_COLOR = "D9E1E8"

def set_row_cant_split(row):
    """Ensure row does not split across pages."""
    trPr = row._tr.get_or_add_trPr()
    if trPr.find(qn('w:cantSplit')) is None:
        trPr.append(OxmlElement('w:cantSplit'))

def set_table_header(row):
    """Repeat header on every page."""
    trPr = row._tr.get_or_add_trPr()
    if trPr.find(qn('w:tblHeader')) is None:
        trPr.append(OxmlElement('w:tblHeader'))

def set_cell_margins(cell, top=60, bottom=60, left=80, right=80):
    """Set inner padding for table cell in twips."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    """Set cell background fill color."""
    tcPr = cell._tc.get_or_add_tcPr()
    # Remove existing shd if any
    for ch in list(tcPr):
        if ch.tag.endswith('shd'):
            tcPr.remove(ch)
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_cell_text(cell, text, bold=False, font_size_pt=8.5, align=None, italic=False, color_rgb=(0x00, 0x00, 0x00)):
    """Format cell text cleanly preserving Bookman Old Style."""
    if len(cell.paragraphs) == 0:
        p = cell.add_paragraph()
    else:
        p = cell.paragraphs[0]
        p.text = ""

    for extra in cell.paragraphs[1:]:
        p_elem = extra._p
        p_elem.getparent().remove(p_elem)

    p.paragraph_format.space_before = Pt(1.5)
    p.paragraph_format.space_after = Pt(1.5)
    p.paragraph_format.line_spacing = 1.05
    if align is not None:
        p.alignment = align

    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    run.font.name = FONT_FAMILY
    run.font.size = Pt(font_size_pt)
    run.font.color.rgb = RGBColor(*color_rgb)

    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:ascii'), FONT_FAMILY)
    rFonts.set(qn('w:hAnsi'), FONT_FAMILY)
    rFonts.set(qn('w:cs'), FONT_FAMILY)

def style_header_row(row, bg_color=NAVY_HEADER):
    """Style row 0 as a clean dark header with white text."""
    set_table_header(row)
    set_row_cant_split(row)
    for cell in row.cells:
        set_cell_shading(cell, bg_color)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for run in p.runs:
                run.bold = True
                run.font.name = FONT_FAMILY
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

def add_styled_row(table, template_row_idx=1):
    """Add row copying cell widths and styling."""
    new_row = table.add_row()
    template_row = table.rows[template_row_idx]
    set_row_cant_split(new_row)

    for c_idx, cell in enumerate(new_row.cells):
        if c_idx < len(template_row.cells):
            t_cell = template_row.cells[c_idx]
            tcPr = cell._tc.get_or_add_tcPr()
            t_tcPr = t_cell._tc.tcPr
            if t_tcPr is not None:
                tcW = t_tcPr.find(qn('w:tcW'))
                if tcW is not None:
                    tcPr.append(parse_xml(tcW.xml))
    return new_row

def set_keep_next(p):
    """Ensure paragraph stays with the next paragraph / table on the same page."""
    pPr = p._p.get_or_add_pPr()
    if pPr.find(qn('w:keepNext')) is None:
        pPr.append(OxmlElement('w:keepNext'))

def remove_paragraph(p):
    """Cleanly remove a paragraph from document XML."""
    p_elem = p._p
    parent = p_elem.getparent()
    if parent is not None:
        parent.remove(p_elem)

def main():
    print(f"Loading fresh template: {TEMPLATE_PATH}")
    doc = docx.Document(TEMPLATE_PATH)
    doc_info = docx.Document(INFO_PATH)

    # 1. Enforce uniform A4 margins
    for sect in doc.sections:
        sect.page_width = Inches(8.27)
        sect.page_height = Inches(11.69)
        sect.top_margin = Pt(50.4)
        sect.bottom_margin = Pt(50.4)
        sect.left_margin = Pt(50.4)
        sect.right_margin = Pt(50.4)

    # 2. Add keepNext to all Headings
    for p in doc.paragraphs:
        if p.style and (p.style.name.startswith("Heading") or p.text.startswith("SECTION") or p.text.startswith("ENGINE")):
            set_keep_next(p)

    # --- TABLE 0: Common Team Information ---
    print("Formatting Table 0: Team Information...")
    t0 = doc.tables[0]
    style_header_row(t0.rows[0])
    set_cell_text(t0.rows[1].cells[1], "07", bold=True)
    set_cell_text(t0.rows[2].cells[1], "Theme 01 — Milestone-Based Escrow & Dispute Resolution Workflow", bold=True)
    set_cell_text(t0.rows[3].cells[1], "Dr. Niranjan Muchandi", bold=True)
    set_cell_text(t0.rows[4].cells[1], "22 October 2026", bold=False)

    # --- TABLE 1: Student Team Roster ---
    print("Formatting Table 1: Student Roster (4 Members)...")
    t1 = doc.tables[1]
    style_header_row(t1.rows[0])
    # Remove row 5 if present
    if len(t1.rows) > 5:
        p_elem = t1.rows[-1]._tr
        p_elem.getparent().remove(p_elem)

    roster_data = [
        ("1", "02FE24BCS060", "Vaishnavi Modekar"),
        ("2", "02FE24BCS053", "Darshan Kittur"),
        ("3", "02FE24BCS022", "Purvi Sammatshetti"),
        ("4", "02FE24BCS013", "Vaibhav Chavanpatil")
    ]
    for r_idx, (sno, srn, name) in enumerate(roster_data, start=1):
        if r_idx < len(t1.rows):
            set_row_cant_split(t1.rows[r_idx])
            set_cell_text(t1.rows[r_idx].cells[0], sno, align=WD_ALIGN_PARAGRAPH.CENTER)
            set_cell_text(t1.rows[r_idx].cells[1], srn, bold=True)
            set_cell_text(t1.rows[r_idx].cells[2], name)

    # --- SECTION 1 TEXT: UPGRADE EDUCATIONAL PROMPT TO FORMAL EXECUTIVE TEXT ---
    print("Upgrading Section 1 text to formal engineering narrative...")
    for p in doc.paragraphs:
        if "Start from the approved S0 problem" in p.text:
            p.text = (
                "The Milestone-Based Escrow & Dispute Resolution platform establishes an automated trust and verification "
                "workflow for milestone-based freelance contracts. The system coordinates contract lifecycles, deliverable "
                "integrity verification, simulated financial escrow locking, and multi-party dispute arbitration. It is "
                "architected as an academic prototype where financial operations execute under strict ACID consistency."
            )
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(6)
            for r in p.runs:
                r.font.name = FONT_FAMILY
                r.font.size = Pt(10.0)

        if "At this point, the engine list is a justified technical decomposition" in p.text:
            p.text = (
                "In accordance with the 7-step engineering decomposition rule, the system is partitioned into four independent, "
                "testable technical engines. Each engine is mapped to a core Computer Science discipline (Operating Systems, "
                "DSA & Software Engineering, DBMS, and Web Technology) with explicit ownership, well-defined public interface contracts, "
                "deterministic failure handling, and measurable performance benchmarks."
            )
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(6)
            for r in p.runs:
                r.font.name = FONT_FAMILY
                r.font.size = Pt(10.0)

    # --- TABLE 4: STUDENT CHECK CALLOUT -> ENGINEERING GOVERNANCE CALLOUT ---
    print("Upgrading Table 4 Callout Box...")
    t4 = doc.tables[4]
    cell4 = t4.rows[0].cells[0]
    set_cell_margins(cell4, top=80, bottom=80, left=100, right=100)
    set_cell_shading(cell4, "F1F5F9")
    set_cell_text(cell4,
        "System Architectural Governance: In strict compliance with the 4-engine decomposition directive, "
        "system modules are partitioned strictly by technical responsibility rather than generic physical tiers: "
        "Engine 01 (OS: Escrow State FSM & Concurrency), Engine 02 (DSA/SE: Cryptographic Evidence Tree & SHA-256 Checksums), "
        "Engine 03 (DBMS: ACID Ledger & Hash-Chained Audit Trail), and Engine 04 (Web: Multi-Role Dashboard & Server-Side RBAC).",
        italic=True, font_size_pt=8.5, color_rgb=(0x1E, 0x29, 0x3B)
    )

    # --- TABLE 5: Proposed Engine Summary ---
    print("Formatting Table 5: Engine Summary...")
    t5 = doc.tables[5]
    style_header_row(t5.rows[0])
    t5_info = doc_info.tables[5]
    for r_idx in range(1, 5):
        row = t5.rows[r_idx]
        set_row_cant_split(row)
        if r_idx % 2 == 0:
            for cell in row.cells:
                set_cell_shading(cell, ZEBRA_BG)
        for c_idx in range(6):
            txt = t5_info.rows[r_idx].cells[c_idx].text.strip()
            set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 1, 5)), font_size_pt=8.0)

    # --- TABLE 7: Functional Requirements (12 FRs) ---
    print("Formatting Table 7: Functional Requirements (FR-01 to FR-12)...")
    t7 = doc.tables[7]
    style_header_row(t7.rows[0])
    t7_info = doc_info.tables[7]

    while len(t7.rows) < 13:
        add_styled_row(t7, 1)

    for r_idx in range(1, 13):
        row = t7.rows[r_idx]
        info_row = t7_info.rows[r_idx]
        set_row_cant_split(row)
        if r_idx % 2 == 0:
            for cell in row.cells:
                set_cell_shading(cell, ZEBRA_BG)
        for c_idx in range(4):
            txt = info_row.cells[c_idx].text.strip()
            set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 2)), font_size_pt=8.0)

    # --- TABLE 8: Non-Functional Requirements (10 NFRs) ---
    print("Formatting Table 8: Non-Functional Requirements (NFR-01 to NFR-10)...")
    t8 = doc.tables[8]
    style_header_row(t8.rows[0])
    t8_info = doc_info.tables[8]

    while len(t8.rows) < 11:
        add_styled_row(t8, 1)

    for r_idx in range(1, 11):
        row = t8.rows[r_idx]
        info_row = t8_info.rows[r_idx]
        set_row_cant_split(row)
        if r_idx % 2 == 0:
            for cell in row.cells:
                set_cell_shading(cell, ZEBRA_BG)
        for c_idx in range(4):
            txt = info_row.cells[c_idx].text.strip()
            set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 2)), font_size_pt=8.0)

    # --- TABLE 10: Use Cases (8 Clean Rows, Zero Reminders) ---
    print("Formatting Table 10: Use Cases (UC-01 to UC-08)...")
    t10 = doc.tables[10]
    style_header_row(t10.rows[0])
    t10_info = doc_info.tables[10]

    # We want exactly 9 rows: 1 header + 8 Use Cases (drop the reminder row)
    while len(t10.rows) > 9:
        p_elem = t10.rows[-1]._tr
        p_elem.getparent().remove(p_elem)

    for r_idx in range(1, 9):
        row = t10.rows[r_idx]
        info_row = t10_info.rows[r_idx]
        set_row_cant_split(row)
        if r_idx % 2 == 0:
            for cell in row.cells:
                set_cell_shading(cell, ZEBRA_BG)
        for c_idx in range(len(row.cells)):
            if c_idx < len(info_row.cells):
                txt = info_row.cells[c_idx].text.strip()
                set_cell_text(row.cells[c_idx], txt, bold=(c_idx == 0), font_size_pt=7.8)

    # --- TABLE 11: Use Case Diagram ---
    print("Formatting Table 11: Diagram...")
    t11 = doc.tables[11]
    cell11 = t11.rows[0].cells[0]
    cell11.text = ""
    p_img = cell11.paragraphs[0]
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists(DIAGRAM_PATH):
        run_img = p_img.add_run()
        run_img.add_picture(DIAGRAM_PATH, width=Inches(6.2))
    p_cap = cell11.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(4)
    r_cap = p_cap.add_run("Figure 1: Comprehensive System Use Case Diagram — Actors, System Boundary, Core Use Cases & Relationships")
    r_cap.font.name = FONT_FAMILY
    r_cap.font.size = Pt(8.5)
    r_cap.font.italic = True
    r_cap.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # --- TABLES 13, 15, 17: Acceptance Criteria, Priority, RTM (22 Reqs each) ---
    for t_idx, name in [(13, "Acceptance Criteria"), (15, "Priority Classification"), (17, "RTM")]:
        print(f"Formatting Table {t_idx}: {name} (Zebra Striping + Headers)...")
        tbl = doc.tables[t_idx]
        style_header_row(tbl.rows[0])
        tbl_info = doc_info.tables[t_idx]

        while len(tbl.rows) < len(tbl_info.rows):
            add_styled_row(tbl, 1)

        for r_idx in range(1, len(tbl_info.rows)):
            row = tbl.rows[r_idx]
            info_row = tbl_info.rows[r_idx]
            set_row_cant_split(row)
            if r_idx % 2 == 0:
                for cell in row.cells:
                    set_cell_shading(cell, ZEBRA_BG)
            for c_idx in range(len(row.cells)):
                if c_idx < len(info_row.cells):
                    txt = info_row.cells[c_idx].text.strip()
                    set_cell_text(row.cells[c_idx], txt, bold=(c_idx == 0), font_size_pt=7.5)

    # --- TABLE 19: Requirement Clustering Sheet (C1 to C5) ---
    print("Formatting Table 19: Requirement Clustering Sheet...")
    t19 = doc.tables[19]
    style_header_row(t19.rows[0])
    t19_info = doc_info.tables[19]

    while len(t19.rows) > len(t19_info.rows):
        p_elem = t19.rows[-1]._tr
        p_elem.getparent().remove(p_elem)

    for r_idx in range(1, len(t19_info.rows)):
        row = t19.rows[r_idx]
        info_row = t19_info.rows[r_idx]
        set_row_cant_split(row)
        if r_idx % 2 == 0:
            for cell in row.cells:
                set_cell_shading(cell, ZEBRA_BG)
        for c_idx in range(len(row.cells)):
            if c_idx < len(info_row.cells):
                txt = info_row.cells[c_idx].text.strip()
                set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 1)), font_size_pt=7.5)

    # --- TABLE 20: Engine Decomposition Matrix (E1 to E4) ---
    print("Formatting Table 20: Engine Decomposition Matrix...")
    t20 = doc.tables[20]
    style_header_row(t20.rows[0])
    t20_info = doc_info.tables[20]

    while len(t20.rows) > len(t20_info.rows):
        p_elem = t20.rows[-1]._tr
        p_elem.getparent().remove(p_elem)

    for r_idx in range(1, len(t20_info.rows)):
        row = t20.rows[r_idx]
        info_row = t20_info.rows[r_idx]
        set_row_cant_split(row)
        if r_idx % 2 == 0:
            for cell in row.cells:
                set_cell_shading(cell, ZEBRA_BG)
        for c_idx in range(len(row.cells)):
            if c_idx < len(info_row.cells):
                txt = info_row.cells[c_idx].text.strip()
                set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 1)), font_size_pt=7.0)

    # --- SECTION B: ENGINE DESCRIPTION SHEETS (Tables 21 to 44) ---
    print("Formatting Section B: Engine Description Sheets...")

    engine_narratives = {
        22: (
            "The Escrow & State Scheduler controls the contract, escrow-lock and milestone lifecycle. "
            "It accepts requested transitions and checks them against permitted state rules. It rejects "
            "invalid or repeated state changes and returns the latest valid status. It supports reliable "
            "workflow progression without making payment-ledger decisions.",
            "Technical Rationale: Enforces deterministic Finite State Machine (FSM) rules, KeyedMutex mutual "
            "exclusion, and 7-day review watchdog timers to eliminate race conditions and payment starvation."
        ),
        28: (
            "The Verification & Evidence Engine checks the integrity of submitted deliverables and organizes "
            "dispute evidence references. It calculates SHA-256 checksums and compares them when a file is "
            "rechecked. It ensures evidence is associated with the correct dispute. A checksum mismatch is "
            "reported as an integrity failure; a checksum alone does not prove authorship.",
            "Technical Rationale: Implements cryptographic SHA-256 hashing and an in-memory N-ary Merkle tree "
            "structure to preserve causality and guarantee tamper detection with complete mathematical sensitivity."
        ),
        34: (
            "The Transaction Ledger maintains consistent simulated payment records and a traceable audit history. "
            "It supports milestone payment decisions by checking the eligibility/status supplied by the workflow "
            "and applying related ledger updates transactionally. Duplicate or concurrent release attempts must "
            "not create a second simulated payment. Critical actions are recorded for accountability; no real-money "
            "transfer is performed.",
            "Technical Rationale: Preserves relational BCNF schema integrity, serialized ACID transaction boundaries "
            "via prisma.$transaction, and cryptographic hash chaining for regulatory non-repudiation."
        ),
        40: (
            "The Role-Based Workflow Dashboard provides authenticated, role-appropriate access to the workflow. "
            "It allows authorized users to view progress, submit or track disputes, and receive clear results from "
            "workflow actions. It validates inputs and presents the recorded system state rather than inventing state "
            "locally. Protected actions are denied when the user is unauthenticated or lacks permission.",
            "Technical Rationale: Implements server-side RBAC middleware, HMAC-SHA256 session integrity, strict Zod "
            "runtime schema validation, and 5-second lightweight polling synchronization."
        )
    }

    kpi_tables_data = {
        26: [
            ("E3 persists state; E4 presents permitted actions.", "Repeated lock or invalid state transition attempt.", "Reject request; keep last valid state; return clear failure reason.", "Zero duplicate locks and zero invalid state transitions in defined test set."),
            ("Timer Service / Watchdog trigger interface.", "Watchdog timeout fire failure or timer drift.", "Execute recovery sweep; log transition as REVIEW_TIMEOUT.", "Watchdog trigger latency < 1.0s after expiry; 100% test transition matrix verified.")
        ],
        32: [
            ("E4 accepts file/evidence submissions; E1 supplies workflow context.", "Missing or unreadable file stream, or checksum mismatch.", "Flag verification failure; do not report false integrity success.", "100% detection of altered files in defined test set (original vs modified file checksum tests)."),
            ("Tag Matching Subsystem (FR-11 dependency).", "Mismatched tag schema or missing developer profile tags.", "Apply zero-score baseline fallback; log missing attribute.", "100% test evidence linked to correct dispute; proposal matching latency < 50ms.")
        ],
        38: [
            ("E1 provides validated eligibility/state; E4 provides authorized request context.", "Unapproved milestone or unauthorized action attempting payout.", "Reject before creating payment record; retain current ledger balance.", "Zero duplicate releases/double allocations; 100% balance conservation."),
            ("Audit Logging Service Interface.", "Database constraint failure or concurrent write collision.", "Rollback atomic transaction; log alert to system console.", "100% defined critical test events audited; zero ledger discrepancy (p95 latency <= 200ms).")
        ],
        44: [
            ("E1 supplies valid state; E2 verifies files/evidence; E3 persists/retrieves records.", "Invalid user credentials or insufficient role permissions.", "Deny protected action; clear stale cookies; return structured HTTP 401/403 with safe error message.", "Role-permission negative tests: zero unauthorized protected actions succeed."),
            ("REST API / Gateway Routing Boundary.", "Malformed payload or injection attempt (XSS/SQLi).", "Zod schema boundary rejection with field-specific 400 Bad Request.", "≤500 ms p95 API target under defined workload; viewport checklist passes; zero unhandled exceptions.")
        ]
    }

    for t_idx in range(21, 45):
        tbl = doc.tables[t_idx]
        tbl_info = doc_info.tables[t_idx]
        set_row_cant_split(tbl.rows[0])

        # Style header row for metadata/boundary/mechanism tables
        if t_idx in (21, 23, 24, 25, 27, 29, 30, 31, 33, 35, 36, 37, 39, 41, 42, 43):
            style_header_row(tbl.rows[0])

        # Purpose Tables: 22, 28, 34, 40
        if t_idx in engine_narratives:
            p_desc, p_rat = engine_narratives[t_idx]
            set_cell_text(tbl.rows[0].cells[0], p_desc, font_size_pt=8.5)
            set_cell_margins(tbl.rows[0].cells[0], top=70, bottom=70, left=90, right=90)
            if len(tbl.rows) > 1:
                set_cell_text(tbl.rows[1].cells[0], p_rat, italic=True, font_size_pt=8.0, color_rgb=(0x33, 0x41, 0x55))
                set_cell_shading(tbl.rows[1].cells[0], "F1F5F9")
                set_cell_margins(tbl.rows[1].cells[0], top=60, bottom=60, left=90, right=90)
            continue

        # KPI / Failure Tables: 26, 32, 38, 44
        if t_idx in kpi_tables_data:
            style_header_row(tbl.rows[0])
            kpi_rows = kpi_tables_data[t_idx]
            headers = ["Interface / Dependency", "Possible Failure / Boundary Condition", "Expected Handling / Recovery", "KPI / Measurement Target"]
            for c_idx, h in enumerate(headers):
                if c_idx < len(tbl.rows[0].cells):
                    set_cell_text(tbl.rows[0].cells[c_idx], h, bold=True, font_size_pt=8.0, color_rgb=(0xFF, 0xFF, 0xFF))

            while len(tbl.rows) < 3:
                add_styled_row(tbl, 0)
            while len(tbl.rows) > 3:
                p_elem = tbl.rows[-1]._tr
                p_elem.getparent().remove(p_elem)

            for r_idx, data_tuple in enumerate(kpi_rows, start=1):
                row = tbl.rows[r_idx]
                set_row_cant_split(row)
                if r_idx % 2 == 0:
                    for cell in row.cells:
                        set_cell_shading(cell, ZEBRA_BG)
                for c_idx in range(4):
                    if c_idx < len(row.cells):
                        set_cell_text(row.cells[c_idx], data_tuple[c_idx], font_size_pt=7.8)
            continue

        # Regular metadata / mechanism / boundary tables
        for r_idx in range(len(tbl_info.rows)):
            if r_idx < len(tbl.rows):
                row = tbl.rows[r_idx]
                info_row = tbl_info.rows[r_idx]
                set_row_cant_split(row)
                if r_idx > 0 and r_idx % 2 == 0:
                    for cell in row.cells:
                        set_cell_shading(cell, ZEBRA_BG)
                for c_idx in range(len(row.cells)):
                    if c_idx < len(info_row.cells):
                        txt = info_row.cells[c_idx].text.strip()
                        set_cell_text(row.cells[c_idx], txt, bold=(r_idx == 0 or c_idx == 0), font_size_pt=8.0)

    # 3. ELIMINATE ALL UNWANTED INSTRUCTIONAL PROMPT PARAGRAPHS FROM BODY
    print("Purging remaining instructional prompt paragraphs...")
    prompt_needles = [
        "In 3–5 sentences, state what this engine is responsible for",
        "List every functional requirement. Add rows as needed.",
        "List performance, security, usability, reliability, and other quality requirements.",
        "One row per use case or user story. Cover normal, boundary, and exception flows.",
        "Draw the complete use case diagram for the proposed system.",
        "CHECK: Every actor and major use case shown in the diagram must correspond",
        "For every requirement, state the specific, testable condition(s)",
        "Classify every requirement as Mandatory or Challenge/Stretch",
        "Trace every requirement from its source need through to design",
        "Group related requirements by common technical responsibility",
        "Define each engine as a technical unit with a clear responsibility"
    ]

    paragraphs_to_remove = []
    for p in doc.paragraphs:
        txt = p.text.strip()
        for needle in prompt_needles:
            if needle in txt:
                paragraphs_to_remove.append(p)
                break

    for p in paragraphs_to_remove:
        remove_paragraph(p)
    print(f"Purged {len(paragraphs_to_remove)} template instruction paragraphs.")

    # 4. Enforce cell margins across all tables
    print("Applying uniform cell padding and cantSplit...")
    for tbl in doc.tables:
        for row in tbl.rows:
            set_row_cant_split(row)
            for cell in row.cells:
                set_cell_margins(cell, top=50, bottom=50, left=70, right=70)

    # 5. Save the upgraded document
    print(f"Saving publication-grade document to: {OUT_FIXED}")
    doc.save(OUT_FIXED)

    print(f"Saving publication-grade document to: {OUT_MAIN}")
    doc.save(OUT_MAIN)

    # Sync to Downloads
    downloads_dir = "/home/nethunter/Downloads"
    if os.path.exists(downloads_dir):
        dst1 = os.path.join(downloads_dir, "S1_Student_Handbook_Team07_TEMPLATE_LAYOUT_FIXED.docx")
        dst2 = os.path.join(downloads_dir, "S1_Student_Handbook (1).docx")
        shutil.copyfile(OUT_FIXED, dst1)
        shutil.copyfile(OUT_MAIN, dst2)
        print(f"Synced to Downloads: {dst1} and {dst2}")

    # Compile to PDF using LibreOffice
    print("Compiling to PDF with LibreOffice...")
    cmd1 = ["libreoffice", "--headless", "--convert-to", "pdf", OUT_FIXED, "--outdir", "docs"]
    res1 = subprocess.run(cmd1, capture_output=True, text=True)
    print(f"LibreOffice OUT_FIXED: exit code {res1.returncode}")

    cmd2 = ["libreoffice", "--headless", "--convert-to", "pdf", OUT_MAIN, "--outdir", "docs"]
    res2 = subprocess.run(cmd2, capture_output=True, text=True)
    print(f"LibreOffice OUT_MAIN: exit code {res2.returncode}")

    if os.path.exists(downloads_dir):
        pdf_src1 = "docs/S1_Student_Handbook_Team07_TEMPLATE_LAYOUT_FIXED.pdf"
        pdf_src2 = "docs/S1_Student_Handbook (1).pdf"
        if os.path.exists(pdf_src1):
            shutil.copyfile(pdf_src1, os.path.join(downloads_dir, "S1_Student_Handbook_Team07_TEMPLATE_LAYOUT_FIXED.pdf"))
        if os.path.exists(pdf_src2):
            shutil.copyfile(pdf_src2, os.path.join(downloads_dir, "S1_Student_Handbook (1).pdf"))
        print("PDFs synced to Downloads.")

if __name__ == "__main__":
    main()
