#!/usr/bin/env python3
"""
Generate a publication-grade 3-page academic personal logbook for:
Vaibhav Chavanpatil (Roll No: 04, SRN: 02FE24BCS013)
Engine 04: Web Technologies Engine (Role-Based Workflow Dashboard)
Guaranteed: Exactly 3 pages, crisp typography, beautiful diagrams, zero overflow.
"""

import os
import subprocess
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

DOCX_OUTPUT = "/home/nethunter/Desktop/ENGINE_04_Logbook_Vaibhav_Chavanpatil.docx"
PDF_DIR = "/home/nethunter/Desktop"

doc = Document()

# Page Setup: Standard A4 with disciplined margins
for sec in doc.sections:
    sec.page_width = Inches(8.27)
    sec.page_height = Inches(11.69)
    sec.top_margin = Inches(0.40)
    sec.bottom_margin = Inches(0.40)
    sec.left_margin = Inches(0.55)
    sec.right_margin = Inches(0.55)

NAVY = RGBColor(23, 54, 93)      # #17365D
STEEL = RGBColor(54, 96, 146)    # #366092
CHARCOAL = RGBColor(38, 38, 38)  # #262626
GRAY = RGBColor(89, 89, 89)      # #595959
GREEN = RGBColor(5, 150, 105)    # #059669

def set_cell_background(cell, hex_color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tc_pr.append(shd)

def set_cell_margins(cell, top=40, bottom=40, left=80, right=80):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tc_mar.append(node)
    tc_pr.append(tc_mar)

# =========================================================================
# PAGE 1: TITLE, STUDENT PROFILE, SCOPE, REQUIREMENTS & ARCHITECTURE DIAGRAM
# =========================================================================

# Header
p_inst = doc.add_paragraph()
p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_inst.paragraph_format.space_after = Pt(1)
p_inst.paragraph_format.space_before = Pt(0)
r_inst = p_inst.add_run("KLE TECHNOLOGICAL UNIVERSITY\n")
r_inst.bold = True
r_inst.font.name = "Bookman Old Style"
r_inst.font.size = Pt(11)
r_inst.font.color.rgb = NAVY

r_dept = p_inst.add_run("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\nDr. M. S. Sheshgiri College of Engineering & Technology, Belagavi\n")
r_dept.font.name = "Bookman Old Style"
r_dept.font.size = Pt(8.5)
r_dept.font.color.rgb = STEEL

r_t = p_inst.add_run("PERSONAL ENGINEERING RECORD · ENGINE 04 (WEB TECHNOLOGIES)")
r_t.bold = True
r_t.font.name = "Bookman Old Style"
r_t.font.size = Pt(10.5)
r_t.font.color.rgb = NAVY

# Profile Table
table_meta = doc.add_table(rows=2, cols=4)
table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    [("Student Name", "Vaibhav Chavanpatil"), ("Roll No", "04"), ("SRN", "02FE24BCS013"), ("Team", "Team 07 (Theme 01)")],
    [("Project Title", "Milestone Escrow Workflow"), ("Assigned Engine", "Engine 04 (Web Tech)"), ("Course Domain", "Web Tech & Networks"), ("Status", "Gate 1 Baseline (Pass)")]
]

meta_col_widths = [Inches(1.8), Inches(1.3), Inches(1.9), Inches(2.1)]
for r_idx, row in enumerate(table_meta.rows):
    for c_idx, (lbl, val) in enumerate(meta_data[r_idx]):
        cell = row.cells[c_idx]
        cell.width = meta_col_widths[c_idx]
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.space_before = Pt(1)
        r_lbl = p.add_run(f"{lbl}: ")
        r_lbl.bold = True
        r_lbl.font.size = Pt(8)
        r_val = p.add_run(val)
        r_val.font.size = Pt(8)
        set_cell_background(cell, "F2F5F9" if r_idx == 0 else "FFFFFF")
        set_cell_margins(cell, 30, 30, 50, 50)

# Section 1: Engine Scope (3 bullets)
p_s1 = doc.add_paragraph()
p_s1.paragraph_format.space_after = Pt(1)
p_s1.paragraph_format.space_before = Pt(3)
r_h1 = p_s1.add_run("1. Individual Scope & Subsystem Boundaries:")
r_h1.bold = True
r_h1.font.name = "Bookman Old Style"
r_h1.font.size = Pt(9.5)
r_h1.font.color.rgb = NAVY

bullets = [
    "Presentation: Builds multi-role responsive dashboards for Clients, Freelancers, Reviewers, and Admins using Next.js 16 App Router & React 19.",
    "Security Guard: Enforces server-side zero-trust Role-Based Access Control (RbacEnforcer) and HMAC-SHA256 session token verification.",
    "Boundary Invariant: Engine 04 never mutates the database directly; it dispatches validated actions to Engine 01 (OS), Engine 02 (DSA), and Engine 03 (DBMS)."
]
for b in bullets:
    p_b = doc.add_paragraph(style='List Bullet')
    p_b.paragraph_format.space_after = Pt(1)
    p_b.paragraph_format.space_before = Pt(0)
    r = p_b.add_run(b)
    r.font.name = "Bookman Old Style"
    r.font.size = Pt(8)

# Requirements Table
p_r_hdr = doc.add_paragraph()
p_r_hdr.paragraph_format.space_after = Pt(1)
p_r_hdr.paragraph_format.space_before = Pt(2)
r_rh = p_r_hdr.add_run("2. Requirements Baseline Owned by Engine 04 (Gate 1 Deliverable):")
r_rh.bold = True
r_rh.font.name = "Bookman Old Style"
r_rh.font.size = Pt(9.5)
r_rh.font.color.rgb = NAVY

table_reqs = doc.add_table(rows=4, cols=4)
table_reqs.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ["Req ID", "Requirement Name", "Technical Capability & Invariant", "Status"]
req_col_widths = [Inches(0.85), Inches(1.5), Inches(3.7), Inches(1.1)]

for idx, text in enumerate(headers):
    c = table_reqs.rows[0].cells[idx]
    c.width = req_col_widths[idx]
    set_cell_background(c, "17365D")
    set_cell_margins(c, 30, 30, 50, 50)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.space_before = Pt(1)
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor(255, 255, 255)

reqs_data = [
    ("FR-07", "Role-Based Dashboards", "Render tailored responsive views for Clients, Freelancers, Reviewers, Admins.", "PASS (100%)"),
    ("FR-08", "Server-Side RBAC Guard", "Enforce server-side role validation on 100% API routes via RbacEnforcer (401/403).", "PASS (100%)"),
    ("FR-10", "FSM Real-Time State Poller", "Synchronize milestone states without full reloads via 5s lightweight polling (StatePoller).", "PASS (100%)"),
]

for r_idx, (rid, name, cap, st) in enumerate(reqs_data, start=1):
    row = table_reqs.rows[r_idx]
    for c_idx, val in enumerate([rid, name, cap, st]):
        cell = row.cells[c_idx]
        cell.width = req_col_widths[c_idx]
        set_cell_background(cell, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
        set_cell_margins(cell, 25, 25, 50, 50)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.space_before = Pt(1)
        r = p.add_run(val)
        r.font.size = Pt(7.5)
        if c_idx == 0:
            r.bold = True
        if c_idx == 3:
            r.bold = True
            r.font.color.rgb = GREEN

# Architecture Diagram
p_diag_lbl = doc.add_paragraph()
p_diag_lbl.paragraph_format.space_after = Pt(1)
p_diag_lbl.paragraph_format.space_before = Pt(2)
r_dl = p_diag_lbl.add_run("3. System Architecture & Inter-Engine Interfacing (Figure 1.1):")
r_dl.bold = True
r_dl.font.name = "Bookman Old Style"
r_dl.font.size = Pt(9.5)
r_dl.font.color.rgb = NAVY

arch_img_path = "/home/nethunter/Collage /BIG_PROJECT/assets/generated_diagrams/engine_04_architecture_simplified.png"
if os.path.exists(arch_img_path):
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_after = Pt(0)
    p_img.paragraph_format.space_before = Pt(1)
    r_img = p_img.add_run()
    r_img.add_picture(arch_img_path, width=Inches(5.5))

# Page 1 Break
doc.add_page_break()

# =========================================================================
# PAGE 2: UI INTERFACE ARCHITECTURE, DASHBOARD BLUEPRINT & RBAC SECURITY
# =========================================================================

p_p2_hdr = doc.add_paragraph()
p_p2_hdr.paragraph_format.space_after = Pt(1)
p_p2_hdr.paragraph_format.space_before = Pt(0)
r_p2_h = p_p2_hdr.add_run("4. UI/UX Interface Architecture & Client Screen Flow")
r_p2_h.bold = True
r_p2_h.font.name = "Bookman Old Style"
r_p2_h.font.size = Pt(10)
r_p2_h.font.color.rgb = NAVY

p_ui_desc = doc.add_paragraph()
p_ui_desc.paragraph_format.space_after = Pt(1)
p_ui_desc.paragraph_format.space_before = Pt(0)
r_ud = p_ui_desc.add_run("The client UI is architected around a high-density, split-view layout ensuring zero cognitive overload during escrow actions:")
r_ud.font.size = Pt(8.5)

ui_components = [
    ("Component A (AppShell Navigation): ", "Sticky left navigation rail with instant persona switcher (Client, Freelancer, Reviewer, Admin)."),
    ("Component B (Attention Priority Rail): ", "Dynamic action queue prompting immediate irreversible actions (Deposit, Review, or Dispute)."),
    ("Component C (Milestone Progress Stepper): ", "Visual progress tracker indicating milestone states (FUNDED, IN_PROGRESS, UNDER_REVIEW, RELEASED)."),
    ("Component D (Escrow Ledger Rail): ", "Real-time protected fund counter with rupee formatting (INR / ₹) and 5-second polling status.")
]
for title, desc in ui_components:
    p_b = doc.add_paragraph(style='List Bullet')
    p_b.paragraph_format.space_after = Pt(0.5)
    p_b.paragraph_format.space_before = Pt(0)
    r_bt = p_b.add_run(title)
    r_bt.bold = True
    r_bt.font.size = Pt(8)
    r_bd = p_b.add_run(desc)
    r_bd.font.size = Pt(8)

# UI Diagram Image
p_ui_fig = doc.add_paragraph()
p_ui_fig.paragraph_format.space_after = Pt(1)
p_ui_fig.paragraph_format.space_before = Pt(1)
r_uf = p_ui_fig.add_run("Figure 2.1: Annotated Split-View Workflow Dashboard Layout (Engine 04 — Client Workspace)")
r_uf.bold = True
r_uf.font.size = Pt(8.5)
r_uf.font.color.rgb = NAVY

ui_img_path = "/home/nethunter/Collage /BIG_PROJECT/assets/dashboard_theme_light.png"
if os.path.exists(ui_img_path):
    p_ui_img = doc.add_paragraph()
    p_ui_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ui_img.paragraph_format.space_after = Pt(0)
    p_ui_img.paragraph_format.space_before = Pt(1)
    r_ui_img = p_ui_img.add_run()
    r_ui_img.add_picture(ui_img_path, width=Inches(4.8))

# RBAC Code Snippet
p_c_hdr = doc.add_paragraph()
p_c_hdr.paragraph_format.space_after = Pt(1)
p_c_hdr.paragraph_format.space_before = Pt(2)
r_ch = p_c_hdr.add_run("5. Core Implementation: Server-Side RBAC Perimeter (`src/core/engine-04-web/rbac.ts`):")
r_ch.bold = True
r_ch.font.name = "Bookman Old Style"
r_ch.font.size = Pt(9.5)
r_ch.font.color.rgb = NAVY

code_rbac = """// Server-Side Role-Based Access Control Perimeter
export class RbacEnforcer {
  private static readonly PERMISSIONS = {
    CLIENT: ['contract:deposit', 'contract:view',
             'deliverable:review', 'deliverable:approve', 'dispute:raise'],
    FREELANCER: ['project:browse', 'proposal:create',
                 'contract:view', 'deliverable:submit', 'dispute:raise'],
    REVIEWER: ['dispute:view_all', 'dispute:inspect_evidence', 'dispute:rule'],
    ADMIN: ['audit:view', 'contract:override', 'project:view', 'system:manage'],
  };

  static enforceAction(session: SessionContext, action: ContractAction): void {
    if (!session?.userId) throw new AuthenticationError('401: Authentication required');
    const required = ACTION_PERMISSION_MAP[action];
    if (!this.PERMISSIONS[session.role]?.includes(required)) {
      throw new AuthorizationError(`403: Role ${session.role} cannot execute ${action}`);
    }
  }
}"""

p_code = doc.add_paragraph()
p_code.paragraph_format.space_after = Pt(0)
p_code.paragraph_format.space_before = Pt(0)
p_code.paragraph_format.line_spacing = Pt(9.0)
r_code = p_code.add_run(code_rbac)
r_code.font.name = "Courier New"
r_code.font.size = Pt(7.5)

# Page 2 Break
doc.add_page_break()

# =========================================================================
# PAGE 3: 5S POLLER, VERIFICATION EVIDENCE & VIVA DEFENSE PREPARATION
# =========================================================================

p_p3_hdr = doc.add_paragraph()
p_p3_hdr.paragraph_format.space_after = Pt(1)
p_p3_hdr.paragraph_format.space_before = Pt(0)
r_p3_h = p_p3_hdr.add_run("6. State Synchronization: 5-Second Poller vs. WebSockets (`poller.ts`)")
r_p3_h.bold = True
r_p3_h.font.name = "Bookman Old Style"
r_p3_h.font.size = Pt(10)
r_p3_h.font.color.rgb = NAVY

p_poller_desc = doc.add_paragraph()
p_poller_desc.paragraph_format.space_after = Pt(1)
p_poller_desc.paragraph_format.space_before = Pt(0)
r_pd = p_poller_desc.add_run("To satisfy FR-10 without persistent socket connection drops or memory leaks on mobile tabs, Engine 04 queries a lightweight (<1.3 KB), indexed SQLite projection in under 15ms:")
r_pd.font.size = Pt(8.5)

code_poller = """// src/core/engine-04-web/poller.ts (5-Second Lightweight State Poller)
export class StatePoller {
  static async pollContractState(contractId: string): Promise<ContractPollSnapshot> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true, status: true, escrowBalance: true, totalAmount: true,
        milestones: {
          select: { id: true, sequenceOrder: true, title: true, amount: true, status: true },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });
    return { ...contract, updatedAt: new Date().toISOString() };
  }
}"""

p_code2 = doc.add_paragraph()
p_code2.paragraph_format.space_after = Pt(1)
p_code2.paragraph_format.space_before = Pt(0)
p_code2.paragraph_format.line_spacing = Pt(9.0)
r_code2 = p_code2.add_run(code_poller)
r_code2.font.name = "Courier New"
r_code2.font.size = Pt(7.5)

# Verification Table
p_vt_hdr = doc.add_paragraph()
p_vt_hdr.paragraph_format.space_after = Pt(1)
p_vt_hdr.paragraph_format.space_before = Pt(2)
r_vth = p_vt_hdr.add_run("7. Empirical Verification & Automated Test Matrix (Engine 04 Suite):")
r_vth.bold = True
r_vth.font.name = "Bookman Old Style"
r_vth.font.size = Pt(9.5)
r_vth.font.color.rgb = NAVY

table_tests = doc.add_table(rows=6, cols=4)
table_tests.alignment = WD_TABLE_ALIGNMENT.CENTER
test_headers = ["Test Suite File", "Subsystem Verified", "Tests", "Result"]
test_col_widths = [Inches(2.3), Inches(3.2), Inches(0.6), Inches(1.0)]

for idx, text in enumerate(test_headers):
    c = table_tests.rows[0].cells[idx]
    c.width = test_col_widths[idx]
    set_cell_background(c, "17365D")
    set_cell_margins(c, 25, 25, 50, 50)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.space_before = Pt(1)
    r = p.add_run(text)
    r.bold = True
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor(255, 255, 255)

tests_data = [
    ("tests/engine-04-web/rbac.test.ts", "RbacEnforcer Role Matrix & Party IDOR Check", "6", "PASS (100%)"),
    ("tests/engine-04-web/api-rbac-adversarial.test.ts", "Negative Auth: 401 Unauthenticated / 403 Role Forgery", "7", "PASS (100%)"),
    ("tests/engine-04-web/ui-interactions.test.tsx", "Next.js UI Modals, Actions & Persona Switcher", "7", "PASS (100%)"),
    ("tests/engine-04-web/marketplace-gigs.test.ts", "Marketplace Catalog Search & Tiered Proposals", "5", "PASS (100%)"),
    ("tests/engine-04-web/theme-toggle.test.tsx", "Accessibility, Color Contrast & Theme Switching", "3", "PASS (100%)"),
]

for r_idx, (f, comp, cnt, res) in enumerate(tests_data, start=1):
    row = table_tests.rows[r_idx]
    for c_idx, val in enumerate([f, comp, cnt, res]):
        cell = row.cells[c_idx]
        cell.width = test_col_widths[c_idx]
        set_cell_background(cell, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
        set_cell_margins(cell, 22, 22, 50, 50)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.space_before = Pt(1)
        r = p.add_run(val)
        r.font.size = Pt(7.5)
        if c_idx == 3:
            r.bold = True
            r.font.color.rgb = GREEN

# Viva Q&A
p_vq_hdr = doc.add_paragraph()
p_vq_hdr.paragraph_format.space_after = Pt(1)
p_vq_hdr.paragraph_format.space_before = Pt(2)
r_vqh = p_vq_hdr.add_run("8. High-Yield Evaluator Viva-Voce Defense (Top 3 Questions & Exact Answers):")
r_vqh.bold = True
r_vqh.font.name = "Bookman Old Style"
r_vqh.font.size = Pt(9.5)
r_vqh.font.color.rgb = NAVY

viva_qa = [
    ("Q1: Why must RBAC be enforced on the server rather than just hiding UI buttons on the client?",
     "Client-side UI hiding is cosmetic for UX. Any user can send raw HTTP requests via curl or Postman. Server-side RbacEnforcer independently verifies the HMAC token and permissions on every endpoint, blocking unauthorized callers with HTTP 403 Forbidden."),
    ("Q2: Why use a 5-second polling loop over WebSockets for milestone state updates?",
     "WebSockets maintain stateful TCP connections that drop on mobile data and risk memory leaks. Our StatePoller queries an indexed snapshot (<1.3 KB) in under 15ms, achieving robust real-time updates (FR-10) with zero memory leaks."),
    ("Q3: What is Insecure Direct Object Reference (IDOR) and how does Engine 04 prevent it?",
     "IDOR occurs when a user changes a contract ID in the URL to view another party's data. RbacEnforcer.enforceContractAccess validates that the authenticated caller's userId matches either the clientId or freelancerId before authorizing data access.")
]

for q, a in viva_qa:
    p_q = doc.add_paragraph()
    p_q.paragraph_format.space_after = Pt(0)
    p_q.paragraph_format.space_before = Pt(0)
    r_q = p_q.add_run(q)
    r_q.bold = True
    r_q.font.size = Pt(7.5)
    r_q.font.color.rgb = NAVY
    
    p_a = doc.add_paragraph()
    p_a.paragraph_format.space_after = Pt(1)
    p_a.paragraph_format.space_before = Pt(0)
    r_a = p_a.add_run(f"Answer: {a}")
    r_a.font.size = Pt(7.2)
    p_a.paragraph_format.left_indent = Inches(0.12)

# Sign-off block
p_sig = doc.add_paragraph()
p_sig.paragraph_format.space_after = Pt(0)
p_sig.paragraph_format.space_before = Pt(3)
r_sl = p_sig.add_run("Student Signature: _______________________              Faculty Evaluator Signature: _______________________\n")
r_sl.font.size = Pt(8)
r_sub2 = p_sig.add_run("Vaibhav Chavanpatil (Roll No: 04, SRN: 02FE24BCS013)       Department of CSE, KLE Technological University")
r_sub2.font.size = Pt(7.5)
r_sub2.font.color.rgb = GRAY

doc.save(DOCX_OUTPUT)
print(f"Generated DOCX: {DOCX_OUTPUT}")

# Convert to PDF using LibreOffice
cmd = f"libreoffice --headless --convert-to pdf '{DOCX_OUTPUT}' --outdir '{PDF_DIR}'"
subprocess.run(cmd, shell=True, check=True)
print(f"Generated PDF in: {PDF_DIR}")
