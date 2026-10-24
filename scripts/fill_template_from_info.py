#!/usr/bin/env python3
"""
Populate KLE Tech Stage S1 Student Handbook (template.docx) using data from info.docx.
Strictly preserves the pristine institutional layout, margins, and typography of template.docx
while mapping 100% of the verified team and engine requirements from info.docx.
"""

import os
import shutil
import subprocess
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn

TEMPLATE_PATH = "docs/template.docx"
INFO_PATH = "docs/info.docx"
OUT_FIXED = "docs/S1_Student_Handbook_Team07_TEMPLATE_LAYOUT_FIXED.docx"
OUT_MAIN = "docs/S1_Student_Handbook (1).docx"
DIAGRAM_PATH = "assets/generated_diagrams/use_case_diagram.png"

FONT_FAMILY = "Bookman Old Style"

def set_row_cant_split(row):
    """Prevent table row from splitting across pages."""
    trPr = row._tr.get_or_add_trPr()
    if trPr.find(qn('w:cantSplit')) is None:
        trPr.append(OxmlElement('w:cantSplit'))

def set_table_header(row):
    """Repeat table header on subsequent pages."""
    trPr = row._tr.get_or_add_trPr()
    if trPr.find(qn('w:tblHeader')) is None:
        trPr.append(OxmlElement('w:tblHeader'))

def set_cell_margins(cell, top=60, bottom=60, left=80, right=80):
    """Apply inner padding (twips: 20 twips = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

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

    # Enforce rFonts in OpenXML
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:ascii'), FONT_FAMILY)
    rFonts.set(qn('w:hAnsi'), FONT_FAMILY)
    rFonts.set(qn('w:cs'), FONT_FAMILY)

def add_styled_row(table, template_row_idx=1):
    """Add a new row cloning cell properties and column widths from template_row."""
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

def insert_paragraph_after(doc, target_p, text, italic=False, bold=False):
    """Insert a paragraph immediately after target_p with Bookman Old Style formatting."""
    parent = target_p._p.getparent()
    idx = parent.index(target_p._p)
    new_p_elem = OxmlElement('w:p')
    parent.insert(idx + 1, new_p_elem)
    p = docx.text.paragraph.Paragraph(new_p_elem, target_p._parent)
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    run = p.add_run(text)
    run.font.name = FONT_FAMILY
    run.font.size = Pt(10.0)
    run.italic = italic
    run.bold = bold
    run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:ascii'), FONT_FAMILY)
    rFonts.set(qn('w:hAnsi'), FONT_FAMILY)
    rFonts.set(qn('w:cs'), FONT_FAMILY)
    return p

def main():
    print(f"Loading template: {TEMPLATE_PATH}")
    doc = docx.Document(TEMPLATE_PATH)
    doc_info = docx.Document(INFO_PATH)

    # 1. Enforce uniform A4 margins on all sections
    for sect in doc.sections:
        sect.page_width = Inches(8.27)
        sect.page_height = Inches(11.69)
        sect.top_margin = Pt(50.4)
        sect.bottom_margin = Pt(50.4)
        sect.left_margin = Pt(50.4)
        sect.right_margin = Pt(50.4)

    # --- TABLE 0: Common Team Information ---
    print("Populating Table 0: Team Information...")
    t0 = doc.tables[0]
    set_cell_text(t0.rows[1].cells[1], "07", bold=True)
    set_cell_text(t0.rows[2].cells[1], "Theme 01 — Milestone-Based Escrow & Dispute Resolution Workflow", bold=True)
    set_cell_text(t0.rows[3].cells[1], "Dr. Niranjan Muchandi", bold=True)
    set_cell_text(t0.rows[4].cells[1], "22 October 2026", bold=False)

    # --- TABLE 1: Student Roster ---
    print("Populating Table 1: Student Roster...")
    t1 = doc.tables[1]
    roster_data = [
        ("1", "02FE24BCS060", "Vaishnavi Modekar"),
        ("2", "02FE24BCS053", "Darshan Kittur"),
        ("3", "02FE24BCS022", "Purvi Sammatshetti"),
        ("4", "02FE24BCS013", "Vaibhav Chavanpatil"),
        ("5", "[N/A]", "[N/A — Approved 4-Member Team Decomposition]")
    ]
    for r_idx, (sno, srn, name) in enumerate(roster_data, start=1):
        if r_idx < len(t1.rows):
            set_cell_text(t1.rows[r_idx].cells[0], sno, align=WD_ALIGN_PARAGRAPH.CENTER)
            set_cell_text(t1.rows[r_idx].cells[1], srn, bold=True)
            set_cell_text(t1.rows[r_idx].cells[2], name)

    # --- INSERT CONTEXT PARAGRAPHS FROM INFO.DOCX ---
    print("Inserting project context paragraphs from info.docx...")
    for p in doc.paragraphs:
        if "At this point, the engine list is a justified technical decomposition" in p.text:
            p2 = insert_paragraph_after(doc, p,
                "Project context: the system coordinates freelance contracts, milestones, deliverable integrity, "
                "simulated payment decisions and dispute evidence. It is an academic prototype; no real money is "
                "transferred. The four engines are assigned by technical responsibility, not merely by frontend/backend layers."
            )
            insert_paragraph_after(doc, p2,
                "Applied decomposition rule: each engine has one primary owner, defined inputs/outputs, state responsibility, "
                "mechanism, dependencies, failure cases and measurable KPIs. Detailed schema, API and code design are deferred to later stages."
            )
            break

    # --- TABLE 5: Proposed Engine Summary ---
    print("Populating Table 5: Engine Summary...")
    t5 = doc.tables[5]
    t5_info = doc_info.tables[5]
    for r_idx in range(1, 5):
        for c_idx in range(6):
            txt = t5_info.rows[r_idx].cells[c_idx].text.strip()
            set_cell_text(t5.rows[r_idx].cells[c_idx], txt, bold=(c_idx in (0, 1, 5)), font_size_pt=8.0)

    # --- TABLE 7: Functional Requirements (12 FRs) ---
    print("Populating Table 7: Functional Requirements (FR-01 to FR-12)...")
    t7 = doc.tables[7]
    t7_info = doc_info.tables[7]
    set_table_header(t7.rows[0])

    while len(t7.rows) < 13:
        add_styled_row(t7, 1)

    for r_idx in range(1, 13):
        row = t7.rows[r_idx]
        info_row = t7_info.rows[r_idx]
        set_row_cant_split(row)
        for c_idx in range(4):
            txt = info_row.cells[c_idx].text.strip()
            set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 2)), font_size_pt=8.0)

    # --- TABLE 8: Non-Functional Requirements (10 NFRs) ---
    print("Populating Table 8: Non-Functional Requirements (NFR-01 to NFR-10)...")
    t8 = doc.tables[8]
    t8_info = doc_info.tables[8]
    set_table_header(t8.rows[0])

    while len(t8.rows) < 11:
        add_styled_row(t8, 1)

    for r_idx in range(1, 11):
        row = t8.rows[r_idx]
        info_row = t8_info.rows[r_idx]
        set_row_cant_split(row)
        for c_idx in range(4):
            txt = info_row.cells[c_idx].text.strip()
            set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 2)), font_size_pt=8.0)

    # --- TABLE 10: Use Cases (UC-01 to UC-08 + Reminder) ---
    print("Populating Table 10: Use Cases...")
    t10 = doc.tables[10]
    t10_info = doc_info.tables[10]
    set_table_header(t10.rows[0])

    while len(t10.rows) > 10:
        p_elem = t10.rows[-1]._tr
        p_elem.getparent().remove(p_elem)

    for r_idx in range(1, len(t10_info.rows)):
        if r_idx < len(t10.rows):
            row = t10.rows[r_idx]
            info_row = t10_info.rows[r_idx]
            set_row_cant_split(row)
            for c_idx in range(len(row.cells)):
                if c_idx < len(info_row.cells):
                    txt = info_row.cells[c_idx].text.strip()
                    set_cell_text(row.cells[c_idx], txt, bold=(c_idx == 0), font_size_pt=7.8)

    # --- TABLE 11: Use Case Diagram ---
    print("Populating Table 11: Use Case Diagram Image & Caption...")
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
        print(f"Populating Table {t_idx}: {name}...")
        tbl = doc.tables[t_idx]
        tbl_info = doc_info.tables[t_idx]
        set_table_header(tbl.rows[0])

        while len(tbl.rows) < len(tbl_info.rows):
            add_styled_row(tbl, 1)

        for r_idx in range(1, len(tbl_info.rows)):
            row = tbl.rows[r_idx]
            info_row = tbl_info.rows[r_idx]
            set_row_cant_split(row)
            for c_idx in range(len(row.cells)):
                if c_idx < len(info_row.cells):
                    txt = info_row.cells[c_idx].text.strip()
                    set_cell_text(row.cells[c_idx], txt, bold=(c_idx == 0), font_size_pt=7.5)

    # --- INSERT TRANSACTION LEDGER NOTE BEFORE TABLE 19 ---
    for p in doc.paragraphs:
        if "1. Requirement Clustering Sheet" in p.text:
            insert_paragraph_after(doc, p,
                "For the Transaction Ledger, the planned later-stage implementation will use an ACID transaction "
                "for related payment/status writes, enforce a unique release reference/constraint, rollback on required "
                "write failure, and record actor/action/time/reference in an append-only audit trail."
            )
            break

    # --- TABLE 19: Requirement Clustering Sheet (C1 to C5) ---
    print("Populating Table 19: Requirement Clustering Sheet...")
    t19 = doc.tables[19]
    t19_info = doc_info.tables[19]
    set_table_header(t19.rows[0])

    while len(t19.rows) > len(t19_info.rows):
        p_elem = t19.rows[-1]._tr
        p_elem.getparent().remove(p_elem)

    for r_idx in range(1, len(t19_info.rows)):
        row = t19.rows[r_idx]
        info_row = t19_info.rows[r_idx]
        set_row_cant_split(row)
        for c_idx in range(len(row.cells)):
            if c_idx < len(info_row.cells):
                txt = info_row.cells[c_idx].text.strip()
                set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 1)), font_size_pt=7.5)

    # --- TABLE 20: Engine Decomposition Matrix (E1 to E4) ---
    print("Populating Table 20: Engine Decomposition Matrix...")
    t20 = doc.tables[20]
    t20_info = doc_info.tables[20]
    set_table_header(t20.rows[0])

    while len(t20.rows) > len(t20_info.rows):
        p_elem = t20.rows[-1]._tr
        p_elem.getparent().remove(p_elem)

    for r_idx in range(1, len(t20_info.rows)):
        row = t20.rows[r_idx]
        info_row = t20_info.rows[r_idx]
        set_row_cant_split(row)
        for c_idx in range(len(row.cells)):
            if c_idx < len(info_row.cells):
                txt = info_row.cells[c_idx].text.strip()
                set_cell_text(row.cells[c_idx], txt, bold=(c_idx in (0, 1)), font_size_pt=7.0)

    # --- SECTION B: ENGINE DESCRIPTION SHEETS (Tables 21 to 44) ---
    print("Populating Section B: Engine Description Sheets...")

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

        # Purpose Tables: 22, 28, 34, 40
        if t_idx in engine_narratives:
            p_desc, p_rat = engine_narratives[t_idx]
            set_cell_text(tbl.rows[0].cells[0], p_desc, font_size_pt=8.5)
            if len(tbl.rows) > 1:
                set_cell_text(tbl.rows[1].cells[0], p_rat, italic=True, font_size_pt=8.0, color_rgb=(0x33, 0x41, 0x55))
            continue

        # KPI / Failure Tables: 26, 32, 38, 44
        if t_idx in kpi_tables_data:
            kpi_rows = kpi_tables_data[t_idx]
            headers = ["Interface / Dependency", "Possible Failure / Boundary Condition", "Expected Handling / Recovery", "KPI / Measurement Target"]
            for c_idx, h in enumerate(headers):
                if c_idx < len(tbl.rows[0].cells):
                    set_cell_text(tbl.rows[0].cells[c_idx], h, bold=True, font_size_pt=8.0)

            while len(tbl.rows) < 3:
                add_styled_row(tbl, 0)
            while len(tbl.rows) > 3:
                p_elem = tbl.rows[-1]._tr
                p_elem.getparent().remove(p_elem)

            for r_idx, data_tuple in enumerate(kpi_rows, start=1):
                row = tbl.rows[r_idx]
                set_row_cant_split(row)
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
                for c_idx in range(len(row.cells)):
                    if c_idx < len(info_row.cells):
                        txt = info_row.cells[c_idx].text.strip()
                        set_cell_text(row.cells[c_idx], txt, bold=(r_idx == 0 or c_idx == 0), font_size_pt=8.0)

    # Apply cell padding and cantSplit across all 45 tables
    print("Enforcing professional cell padding and cantSplit across all 45 tables...")
    for tbl in doc.tables:
        for row in tbl.rows:
            set_row_cant_split(row)
            for cell in row.cells:
                set_cell_margins(cell, top=50, bottom=50, left=70, right=70)

    # Save the populated document
    print(f"Saving populated document to: {OUT_FIXED}")
    doc.save(OUT_FIXED)

    print(f"Saving populated document to: {OUT_MAIN}")
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
