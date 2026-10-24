#!/usr/bin/env python3
"""
Generate a high-contrast, large-font, pure white academic presentation deck
for Team 07's Gate 1 Evaluation at KLE Technological University.

Theme: Crisp Academic White
Background: #FFFFFF (Pure White)
Cards: #F8FAFC with crisp colored borders
Text: #0F172A (Deep Slate / Black) for maximum readability on projectors
Font sizes: Big & bold (Titles 26-30pt, Headers 16-18pt, Body 12-14pt, Tables 11-12pt)
Output: docs/Team07_Gate_1_Master_Presentation.pptx
"""

import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_PPTX = "/home/nethunter/Collage /BIG_PROJECT/docs/Team07_Gate_1_Master_Presentation.pptx"
DIAGRAM_DIR = "/home/nethunter/Collage /BIG_PROJECT/assets/generated_diagrams"
SCREENSHOT_DIR = "/home/nethunter/Collage /BIG_PROJECT/docs/ui-ux/screenshots"

class Gate1DeckBuilderLight:
    def __init__(self, output_path=OUTPUT_PPTX):
        self.output_path = output_path
        self.prs = pptx.Presentation()
        self.prs.slide_width = Inches(13.333)
        self.prs.slide_height = Inches(7.5)
        self.blank_layout = self.prs.slide_layouts[6]

        # Crisp High-Contrast Academic White Theme
        self.C_BG = RGBColor(255, 255, 255)         # Pure White (#FFFFFF)
        self.C_CARD = RGBColor(248, 250, 252)       # Slate 50 (#F8FAFC)
        self.C_CARD_WHITE = RGBColor(255, 255, 255) # Pure White Card
        self.C_BORDER = RGBColor(203, 213, 225)     # Slate 300 (#CBD5E1)
        self.C_BORDER_DARK = RGBColor(148, 163, 184)# Slate 400 (#94A3B8)

        # Deep Accent Colors (High Contrast on White)
        self.C_PRIMARY = RGBColor(29, 78, 216)      # Royal Blue (#1D4ED8)
        self.C_EMERALD = RGBColor(4, 120, 87)       # Deep Emerald (#047857)
        self.C_AMBER = RGBColor(180, 83, 9)         # Deep Amber / Bronze (#B45309)
        self.C_RED = RGBColor(185, 28, 28)          # Crimson (#B91C1C)
        self.C_PURPLE = RGBColor(109, 40, 217)      # Deep Violet (#6D28D9)

        # High-Contrast Typography Colors
        self.C_TEXT = RGBColor(15, 23, 42)          # Slate 950 Deep Black (#0F172A)
        self.C_MUTED = RGBColor(51, 65, 85)         # Slate 700 Dark Gray (#334155)

        # Light Tinted Card Backgrounds
        self.C_BLUE_BG = RGBColor(239, 246, 255)    # Light Blue (#EFF6FF)
        self.C_GREEN_BG = RGBColor(236, 253, 245)   # Light Green (#ECFDF5)
        self.C_AMBER_BG = RGBColor(254, 243, 199)   # Light Amber (#FEF3C7)
        self.C_RED_BG = RGBColor(254, 242, 242)     # Light Red (#FEF2F2)
        self.C_PURPLE_BG = RGBColor(245, 243, 255)  # Light Purple (#F5F3FF)

    def add_slide(self):
        """Adds a slide with pure white background."""
        slide = self.prs.slides.add_slide(self.blank_layout)
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = self.C_BG
        bg.line.fill.background()
        return slide

    def add_header(self, slide, title, category="STAGE S1 · REQUIREMENTS BASELINE (GATE 1)"):
        """Adds a prominent Royal Blue category tag and Deep Black main title with large font."""
        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.7), Inches(0.35))
        tf_cat = tb_cat.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(13)
        p_cat.font.bold = True
        p_cat.font.color.rgb = self.C_PRIMARY
        p_cat.font.name = "Arial"

        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(11.7), Inches(0.65))
        tf_title = tb_title.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = self.C_TEXT
        p_title.font.name = "Arial"

    def add_card(self, slide, left, top, width, height, bg_color=None, border_color=None, border_width=1.5):
        """Creates a rounded card container with crisp borders."""
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color or self.C_CARD
        card.line.color.rgb = border_color or self.C_BORDER
        card.line.width = Pt(border_width)
        return card

    def add_textbox(self, slide, left, top, width, height, text, font_size=13, bold=False, color=None, align=PP_ALIGN.LEFT, font_name="Arial"):
        tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = text
        p.alignment = align
        p.font.size = Pt(font_size)
        p.font.bold = bold
        p.font.color.rgb = color or self.C_TEXT
        p.font.name = font_name
        return tb

    def add_bullet_list(self, slide, left, top, width, height, items, font_size=12, color=None, space_after=6):
        tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
        tf = tb.text_frame
        tf.word_wrap = True
        for i, item in enumerate(items):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = f"•  {item}"
            p.font.size = Pt(font_size)
            p.font.color.rgb = color or self.C_TEXT
            p.font.name = "Arial"
            p.space_after = Pt(space_after)
        return tb

    def add_image_safe(self, slide, img_path, left, top, width=None, height=None):
        if os.path.exists(img_path):
            if width is not None and height is not None:
                slide.shapes.add_picture(img_path, Inches(left), Inches(top), Inches(width), Inches(height))
            elif width is not None:
                slide.shapes.add_picture(img_path, Inches(left), Inches(top), width=Inches(width))
            elif height is not None:
                slide.shapes.add_picture(img_path, Inches(left), Inches(top), height=Inches(height))
            else:
                slide.shapes.add_picture(img_path, Inches(left), Inches(top))
        else:
            w = width if width is not None else 6.0
            h = height if height is not None else 4.0
            self.add_card(slide, left, top, w, h, self.C_CARD, self.C_RED)
            self.add_textbox(slide, left, top + (h/2) - 0.3, w, 0.6, f"[Image placeholder: {os.path.basename(img_path)}]", 14, True, self.C_RED, PP_ALIGN.CENTER)

    # -----------------------------------------------------------------
    # BUILD ALL 15 SLIDES (WHITE THEME & BIG TEXT)
    # -----------------------------------------------------------------
    def build(self):
        self.slide_01_cover()
        self.slide_02_curriculum_progression()
        self.slide_03_problem_space()
        self.slide_04_solution_pillars()
        self.slide_05_four_engines_architecture()
        self.slide_06_checklist_and_rubric()
        self.slide_07_functional_requirements_frd()
        self.slide_08_engine_01_os_fsm()
        self.slide_09_engine_02_dsa_evidence_tree()
        self.slide_10_engine_03_dbms_bcnf_ledger()
        self.slide_11_engine_04_web_rbac_dashboard()
        self.slide_12_use_cases_and_user_stories()
        self.slide_13_kpis_and_success_metrics()
        self.slide_14_prioritized_requirements_and_faq()
        self.slide_15_conclusion()

        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        self.prs.save(self.output_path)
        print(f"Presentation saved successfully to: {self.output_path}")

    # --- Slide 1: Cover ---
    def slide_01_cover(self):
        s = self.add_slide()
        # Top Institutional Badge
        self.add_card(s, 0.8, 0.5, 7.5, 0.45, self.C_BLUE_BG, self.C_PRIMARY, 1.8)
        self.add_textbox(s, 1.0, 0.58, 7.1, 0.3, "KLE TECHNOLOGICAL UNIVERSITY · DEPT OF CSE · THEME 01", 12, True, self.C_PRIMARY)

        # Main Title & Subtitle (Large, Bold, High Contrast)
        self.add_textbox(s, 0.8, 1.15, 11.7, 1.4, "Milestone-Based Escrow & Evidence-Based\nDispute Resolution Workflow", 28, True, self.C_TEXT)
        self.add_textbox(s, 0.8, 2.65, 11.7, 0.4, "Stage S1: Requirements Engineering Baseline — Gate 1 Evaluation (15 Marks)", 16, True, self.C_EMERALD)
        self.add_textbox(s, 0.8, 3.1, 11.7, 0.35, "Official Defense Package & Deliverables Audit · KLE Tech Dr. M. S. Sheshgiri Campus, Belagavi", 13, False, self.C_MUTED)

        # Team Roster - 4 Member Cards with Large Fonts
        members = [
            {"name": "Vaibhav Chavanpatil", "roll": "Roll No: 04", "srn": "02FE24BCS013", "engine": "Engine 04 · Web Technologies", "subj": "Web Tech & Computer Networks", "col": self.C_PRIMARY, "bg": self.C_BLUE_BG},
            {"name": "Purvi Sammatshetti", "roll": "Roll No: 11", "srn": "02FE24BCS022", "engine": "Engine 03 · DBMS Engine", "subj": "Database Management Systems", "col": self.C_PURPLE, "bg": self.C_PURPLE_BG},
            {"name": "Darshan Kittur", "roll": "Roll No: 18", "srn": "02FE24BCS053", "engine": "Engine 02 · DSA & SE Engine", "subj": "Data Structures, Algorithms & SE", "col": self.C_AMBER, "bg": self.C_AMBER_BG},
            {"name": "Vaishnavi Modekar", "roll": "Roll No: 21", "srn": "02FE24BCS060", "engine": "Engine 01 · OS Engine", "subj": "Operating Systems & Concurrency", "col": self.C_EMERALD, "bg": self.C_GREEN_BG},
        ]
        w, h, gap = 2.75, 2.9, 0.23
        for i, m in enumerate(members):
            x = 0.8 + i * (w + gap)
            self.add_card(s, x, 3.65, w, h, self.C_CARD, m["col"], 2.0)
            self.add_textbox(s, x + 0.15, 3.8, w - 0.3, 0.3, m["roll"], 12, True, m["col"])
            self.add_textbox(s, x + 0.15, 4.15, w - 0.3, 0.55, m["name"], 14, True, self.C_TEXT)
            self.add_textbox(s, x + 0.15, 4.75, w - 0.3, 0.25, f"SRN: {m['srn']}", 11, False, self.C_MUTED)
            # Divider
            self.add_card(s, x + 0.15, 5.15, w - 0.3, 0.02, m["col"], m["col"])
            self.add_textbox(s, x + 0.15, 5.3, w - 0.3, 0.5, m["engine"], 11, True, m["col"])
            self.add_textbox(s, x + 0.15, 5.85, w - 0.3, 0.55, f"Domain: {m['subj']}", 11, False, self.C_TEXT)

        # Footer Status Pill (Green, High Contrast)
        self.add_card(s, 0.8, 6.75, 11.73, 0.45, self.C_GREEN_BG, self.C_EMERALD, 1.8)
        self.add_textbox(s, 1.0, 6.83, 11.3, 0.3, "STATUS: FROZEN S1 BASELINE (OCT 2, 2026) · 100% COVERAGE ACROSS ALL 7 GATE 1 DELIVERABLES", 11, True, self.C_EMERALD, PP_ALIGN.CENTER)

    # --- Slide 2: Curriculum Progression ---
    def slide_02_curriculum_progression(self):
        s = self.add_slide()
        self.add_header(s, "Curriculum Progression & Gate 1 Weightage (15 Marks)")

        # Left Column: Table of Gates with Large Fonts
        self.add_card(s, 0.8, 1.5, 7.0, 5.5, self.C_CARD, self.C_BORDER, 1.5)
        self.add_textbox(s, 1.1, 1.7, 6.4, 0.4, "PROPOSED 100-MARK SEMESTER STRUCTURE", 15, True, self.C_PRIMARY)

        gates = [
            {"gate": "Gate 0 (10 Marks)", "stage": "Stage S0 — Problem Definition & Need ID", "status": "APPROVED", "col": self.C_EMERALD, "bg": self.C_GREEN_BG},
            {"gate": "Gate 1 (15 Marks)", "stage": "Stage S1 — Requirements Engineering Baseline", "status": "TODAY'S DEFENSE", "col": self.C_PRIMARY, "bg": self.C_BLUE_BG},
            {"gate": "Gate 2 (15 Marks)", "stage": "Stage S2 — Shared Architecture (Sprint 1)", "status": "NEXT CHECKPOINT", "col": self.C_MUTED, "bg": self.C_CARD},
            {"gate": "Gate 3 (25 Marks)", "stage": "Stage S3 (Data/API) + S4 (Algorithm Design)", "status": "UPCOMING", "col": self.C_MUTED, "bg": self.C_CARD},
            {"gate": "Gate 4 (35 Marks)", "stage": "Stage S5 (Impl) + S6 (Test/V&V) + S7 (Deploy)", "status": "FINAL DEFENSE", "col": self.C_MUTED, "bg": self.C_CARD},
        ]
        for idx, g in enumerate(gates):
            y = 2.25 + idx * 0.9
            is_active = (idx == 1)
            b_width = 2.2 if is_active else 1.2
            self.add_card(s, 1.1, y, 6.4, 0.76, g["bg"], g["col"], b_width)
            self.add_textbox(s, 1.25, y + 0.1, 2.5, 0.3, g["gate"], 13, True, g["col"])
            self.add_textbox(s, 1.25, y + 0.38, 4.0, 0.3, g["stage"], 11, False, self.C_TEXT)
            self.add_textbox(s, 4.8, y + 0.22, 2.5, 0.3, f"[{g['status']}]", 11, True, g["col"], PP_ALIGN.RIGHT)

        # Right Column: The Gate 1 Golden Rule (Big Text)
        self.add_card(s, 8.1, 1.5, 4.43, 5.5, self.C_BLUE_BG, self.C_PRIMARY, 2.0)
        self.add_textbox(s, 8.35, 1.75, 3.9, 0.4, "GATE 1 EVALUATION BOUNDARY", 15, True, self.C_PRIMARY)

        rules = [
            "Evaluates WHAT the system must do (Requirements Baseline), not code implementation.",
            "Evaluates WHO owns each technical responsibility (4-Engine Curricular Mapping).",
            "Evaluates HOW quality is measured (Measurable 3-Tier KPIs and Targets).",
            "Strictly forbids evaluating UI prototypes, React code, or database scripts as primary evidence.",
            "Requires dated evidence of freezing S1 requirements BEFORE starting S2 Architecture."
        ]
        self.add_bullet_list(s, 8.35, 2.3, 3.9, 3.2, rules, 12, self.C_TEXT, space_after=8)

        # Bottom Callout Box
        self.add_card(s, 8.35, 5.5, 3.9, 1.25, self.C_GREEN_BG, self.C_EMERALD, 1.8)
        self.add_textbox(s, 8.5, 5.62, 3.6, 1.0, "TEAM 07 COMPLIANCE:\n100% of Stage S1 requirements baseline frozen in Git VCS (commit 926869b) on Oct 2, 2026.", 11, True, self.C_EMERALD)

    # --- Slide 3: Problem Space ---
    def slide_03_problem_space(self):
        s = self.add_slide()
        self.add_header(s, "The Freelance Problem Space (Stage S0 Grounding)", "STAGE S0 NEED IDENTIFICATION")

        problems = [
            {"num": "01", "title": "Payment Uncertainty & Default", "sub": "Traditional platforms lack granular milestone-based fund locking. Clients default post-delivery, or freelancers face unearned fund withholding.", "impact": "High financial vulnerability & trust deficit", "col": self.C_RED, "bg": self.C_RED_BG},
            {"num": "02", "title": "Lack of Centralized Evidence", "sub": "Deliverables, revision notes, and chat agreements are scattered across emails or third-party drives without tamper-proof integrity checks.", "impact": "Deliverables easily repudiated or altered", "col": self.C_AMBER, "bg": self.C_AMBER_BG},
            {"num": "03", "title": "Unstructured, Subjective Disputes", "sub": "Conflicts are handled manually by general customer support without technical context or chronological evidence trees, taking 14–30 days.", "impact": "Prolonged resolution & unfair rulings", "col": self.C_PRIMARY, "bg": self.C_BLUE_BG},
            {"num": "04", "title": "Review Inaction & Starvation", "sub": "When clients abandon deliverables without approval or rejection, freelancer funds are trapped indefinitely in review limbo.", "impact": "Freelancer starvation & process deadlocks", "col": self.C_EMERALD, "bg": self.C_GREEN_BG},
        ]
        w, h, gap = 5.7, 2.55, 0.35
        for i, p in enumerate(problems):
            col_idx = i % 2
            row_idx = i // 2
            x = 0.8 + col_idx * (w + gap)
            y = 1.5 + row_idx * (h + 0.3)
            self.add_card(s, x, y, w, h, p["bg"], p["col"], 2.0)
            self.add_textbox(s, x + 0.3, y + 0.18, 0.8, 0.45, p["num"], 22, True, p["col"])
            self.add_textbox(s, x + 1.2, y + 0.22, w - 1.5, 0.4, p["title"], 15, True, self.C_TEXT)
            self.add_textbox(s, x + 0.3, y + 0.75, w - 0.6, 1.0, p["sub"], 12, False, self.C_MUTED)
            self.add_card(s, x + 0.3, y + 1.85, w - 0.6, 0.48, self.C_CARD_WHITE, p["col"], 1.5)
            self.add_textbox(s, x + 0.45, y + 1.95, w - 0.9, 0.3, f"Real-World Impact: {p['impact']}", 11, True, p["col"])

    # --- Slide 4: Solution Pillars ---
    def slide_04_solution_pillars(self):
        s = self.add_slide()
        self.add_header(s, "System Solution Overview: 4 Foundational Pillars", "THE COMPUTING SOLUTION")

        pillars = [
            {"title": "Pillar 1: FSM Escrow", "engine": "Engine 01 (OS Engine)", "desc": "Treats escrow balance as a shared critical resource requiring mutual exclusion. Enforces sequential FSM states with 7-day watchdog timer interrupts preventing starvation.", "tech": "Operating Systems Concurrency", "col": self.C_EMERALD, "bg": self.C_GREEN_BG},
            {"title": "Pillar 2: Evidence Trees", "engine": "Engine 02 (DSA & SE Engine)", "desc": "Streams SHA-256 deliverable checksums (avalanche effect). Constructs in-memory hierarchical N-ary EvidenceTree with O(V+E) topological traversal for arbiters.", "tech": "Data Structures & Software Eng.", "col": self.C_PRIMARY, "bg": self.C_BLUE_BG},
            {"title": "Pillar 3: BCNF & ACID Ledger", "engine": "Engine 03 (DBMS Engine)", "desc": "BCNF relational modeling eliminates anomalies. ACID serialized transactions guarantee balance conservation (Sum dB = 0). Append-only tamper-resistant AuditLog.", "tech": "Database Management Systems", "col": self.C_PURPLE, "bg": self.C_PURPLE_BG},
            {"title": "Pillar 4: Role Dashboards", "engine": "Engine 04 (Web Technologies)", "desc": "Server-side RBAC on 100% of routes. Zod 4 runtime schema validation at the edge. Responsive multi-role UI (Client, Dev, Arbiter, Admin) with 5-second polling sync.", "tech": "Web Tech & Computer Networks", "col": self.C_AMBER, "bg": self.C_AMBER_BG},
        ]
        w, h, gap = 2.75, 5.5, 0.23
        for i, p in enumerate(pillars):
            x = 0.8 + i * (w + gap)
            self.add_card(s, x, 1.5, w, h, p["bg"], p["col"], 2.0)
            self.add_textbox(s, x + 0.2, 1.7, w - 0.4, 0.6, p["title"], 15, True, p["col"])
            self.add_textbox(s, x + 0.2, 2.3, w - 0.4, 0.35, p["engine"], 12, True, self.C_TEXT)
            self.add_card(s, x + 0.2, 2.7, w - 0.4, 0.02, p["col"], p["col"])
            self.add_textbox(s, x + 0.2, 2.85, w - 0.4, 2.7, p["desc"], 12, False, self.C_MUTED)
            self.add_card(s, x + 0.2, 5.85, w - 0.4, 0.95, self.C_CARD_WHITE, p["col"], 1.5)
            self.add_textbox(s, x + 0.25, 6.0, w - 0.5, 0.65, f"Course Domain:\n{p['tech']}", 11, True, p["col"], PP_ALIGN.CENTER)

    # --- Slide 5: Four Engines Architecture Diagram ---
    def slide_05_four_engines_architecture(self):
        s = self.add_slide()
        self.add_header(s, "Four-Engine Integrated Platform Architecture", "CURRICULAR DECOMPOSITION")

        # Diagram on Left (Light Mode High Resolution)
        img_path = f"{DIAGRAM_DIR}/four_engines_light.png"
        self.add_image_safe(s, img_path, 0.8, 1.45, 7.8, 5.6)

        # Right Column: Engine Responsibilities Card (Big Text)
        self.add_card(s, 8.8, 1.45, 3.73, 5.6, self.C_CARD, self.C_PRIMARY, 2.0)
        self.add_textbox(s, 9.05, 1.65, 3.3, 0.4, "ACADEMIC OWNERSHIP ROSTER", 14, True, self.C_PRIMARY)

        roster = [
            ("Engine 01 (OS)", "Vaishnavi Modekar (Roll 21)", "FSM scheduler, mutual exclusion, review watchdog timer.", self.C_EMERALD, self.C_GREEN_BG),
            ("Engine 02 (DSA/SE)", "Darshan Kittur (Roll 18)", "SHA-256 hasher, EvidenceTree O(V+E), RTM engine.", self.C_AMBER, self.C_AMBER_BG),
            ("Engine 03 (DBMS)", "Purvi Sammatshetti (Roll 11)", "BCNF relational schema, ACID ledger, append-only audit.", self.C_PURPLE, self.C_PURPLE_BG),
            ("Engine 04 (Web)", "Vaibhav Chavanpatil (Roll 04)", "Next.js App Router, RBAC middleware, 5s live poller.", self.C_PRIMARY, self.C_BLUE_BG),
        ]
        for idx, (eng, owner, scope, col, bg) in enumerate(roster):
            y = 2.15 + idx * 1.15
            self.add_card(s, 9.0, y, 3.33, 1.05, bg, col, 1.5)
            self.add_textbox(s, 9.15, y + 0.08, 3.1, 0.28, eng, 12, True, col)
            self.add_textbox(s, 9.15, y + 0.35, 3.1, 0.28, owner, 11, True, self.C_TEXT)
            self.add_textbox(s, 9.15, y + 0.62, 3.1, 0.45, scope, 10, False, self.C_MUTED)

    # --- Slide 6: Gate 1 Checklist & Rubric ---
    def slide_06_checklist_and_rubric(self):
        s = self.add_slide()
        self.add_header(s, "Official Deliverables & Assessment Rubric (15 Marks)", "EVALUATION READINESS")

        # Checklist Table on Left (Big Text)
        self.add_card(s, 0.8, 1.45, 7.8, 5.6, self.C_CARD, self.C_BORDER, 1.5)
        self.add_textbox(s, 1.1, 1.65, 7.2, 0.4, "GATE 1 DELIVERABLES / EVIDENCE CHECKLIST", 14, True, self.C_PRIMARY)

        items = [
            ("1", "Functional Requirements Document (FRD)", "Y", "2026-10-02", "Team 07 & Guide"),
            ("2", "Use Cases & User Stories", "Y", "2026-10-02", "Team 07 & Guide"),
            ("3", "KPIs & Success Metrics", "Y", "2026-10-02", "Team 07 & Guide"),
            ("4", "Data Requirements & Constraints", "Y", "2026-10-02", "Team 07 & Guide"),
            ("5", "Engine Mapping — Four Engines", "Y", "2026-10-02", "Team 07 & Guide"),
            ("6", "Prioritized Requirement List", "Y", "2026-10-02", "Team 07 & Guide"),
            ("7", "Dated Evidence Before Gate 2", "Y", "2026-10-02", "Git 926869b / 9c141b2"),
        ]
        for idx, (num, name, sub, dt, ver) in enumerate(items):
            y = 2.15 + idx * 0.66
            self.add_card(s, 1.1, y, 7.2, 0.56, self.C_CARD_WHITE, self.C_BORDER, 1.2)
            self.add_textbox(s, 1.25, y + 0.12, 0.4, 0.32, num, 12, True, self.C_PRIMARY)
            self.add_textbox(s, 1.65, y + 0.12, 3.6, 0.32, name, 11, True, self.C_TEXT)
            self.add_textbox(s, 5.3, y + 0.12, 0.5, 0.32, sub, 12, True, self.C_EMERALD, PP_ALIGN.CENTER)
            self.add_textbox(s, 5.85, y + 0.12, 1.1, 0.32, dt, 10, False, self.C_MUTED)
            self.add_textbox(s, 7.0, y + 0.12, 1.2, 0.32, ver, 10, True, self.C_EMERALD)

        # Rubric Alignment on Right (Big Text)
        self.add_card(s, 8.8, 1.45, 3.73, 5.6, self.C_GREEN_BG, self.C_EMERALD, 2.0)
        self.add_textbox(s, 9.05, 1.65, 3.3, 0.4, "RUBRIC ALIGNMENT (15 MARKS)", 14, True, self.C_EMERALD)

        criteria = [
            ("Requirements Completeness", "5 Marks", "FR-01 to FR-12 with IEEE templates, inputs/outputs & RBAC matrix.", self.C_EMERALD),
            ("Use Cases & Users", "3 Marks", "5 Use Cases + 8 Agile User Stories covering all 4 key roles.", self.C_PRIMARY),
            ("KPIs & Metrics", "3 Marks", "3-Tier KPI Sheet: Mandatory, System, & Challenge Envelopes.", self.C_AMBER),
            ("Engine Mapping", "2 Marks", "Four engines mapped to 4 foundational curriculum courses.", self.C_TEXT),
            ("Timeliness of Evidence", "2 Marks", "100% frozen in Git VCS before Gate 2 architecture started.", self.C_EMERALD),
        ]
        for idx, (crit, marks, proof, col) in enumerate(criteria):
            y = 2.15 + idx * 0.98
            self.add_card(s, 9.0, y, 3.33, 0.88, self.C_CARD_WHITE, col, 1.5)
            self.add_textbox(s, 9.15, y + 0.08, 2.1, 0.28, crit, 11, True, self.C_TEXT)
            self.add_textbox(s, 11.2, y + 0.08, 1.0, 0.28, marks, 11, True, col, PP_ALIGN.RIGHT)
            self.add_textbox(s, 9.15, y + 0.36, 3.0, 0.48, proof, 10, False, self.C_MUTED)

    # --- Slide 7: Functional Requirements (FRD) ---
    def slide_07_functional_requirements_frd(self):
        s = self.add_slide()
        self.add_header(s, "Functional Requirements Document (FR-01 to FR-12)", "DELIVERABLE 1 · IEEE STANDARD BASELINE")

        # Top Banner: IEEE Definition Template
        self.add_card(s, 0.8, 1.45, 11.73, 0.65, self.C_BLUE_BG, self.C_PRIMARY, 1.8)
        self.add_textbox(s, 1.0, 1.58, 11.33, 0.45, "IEEE STANDARD DEFINITION TEMPLATE: The system shall [perform behaviour] for [actor] when [condition/trigger], producing [expected outcome].", 12, True, self.C_PRIMARY, PP_ALIGN.CENTER)

        # 6 Card Grid (Clean Single-Line Titles & No Crossing Dividers)
        fr_groups = [
            ("Engine 01 · OS (Vaishnavi)", [
                "FR-01: Escrow Fund Locking — Atomic deposit lock into vault.",
                "FR-02: Milestone State Tracking — Deterministic FSM transitions.",
                "FR-12: Contract Lifecycle Orchestration — 7-day watchdog timer."
            ], self.C_EMERALD, self.C_GREEN_BG),
            ("Engine 02 · DSA & SE (Darshan)", [
                "FR-03: Cryptographic Checksums — Streaming SHA-256 hash.",
                "FR-04: Evidence Trees — In-memory N-ary tree with O(V+E) traversal.",
                "FR-11: AI Semantic Matching — Jaccard proposal scoring heuristic."
            ], self.C_AMBER, self.C_AMBER_BG),
            ("Engine 03 · DBMS (Purvi)", [
                "FR-05: ACID Payment Processing — Atomic balance transfers (Sum dB=0).",
                "FR-06: Tamper-Resistant Audit Log — SHA-256 chained audit entries.",
                "FR-11: Data Persistence — Composite B-Tree index optimization."
            ], self.C_PURPLE, self.C_PURPLE_BG),
            ("Engine 04 · Web (Vaibhav)", [
                "FR-07: Role-Based Dashboards — Client, Dev, Arbiter, Admin views.",
                "FR-08: Authentication & RBAC — 100% server-side route guards.",
                "FR-09: Dispute Workflow — Multi-step dispute filing & evidence upload."
            ], self.C_PRIMARY, self.C_BLUE_BG),
            ("Real-Time UX & Polling", [
                "FR-10: FSM Progress UI — 5-second polling synchronization.",
                "Zero full-page reloads; reactive state badges across viewports.",
                "Graceful network partition handling with retry banners."
            ], self.C_PRIMARY, self.C_CARD),
            ("Server-Side RBAC Matrix", [
                "100% protected API endpoints enforce role tokens.",
                "Client cannot adjudicate own dispute (HTTP 403 Forbidden).",
                "Input payloads validated using Zod 4 runtime allowlists."
            ], self.C_RED, self.C_RED_BG),
        ]
        w, h, gap_x, gap_y = 3.65, 2.3, 0.39, 0.28
        for i, (grp_title, bullets, col, bg) in enumerate(fr_groups):
            col_idx = i % 3
            row_idx = i // 3
            x = 0.8 + col_idx * (w + gap_x)
            y = 2.25 + row_idx * (h + gap_y)
            self.add_card(s, x, y, w, h, bg, col, 1.8)
            self.add_textbox(s, x + 0.2, y + 0.12, w - 0.4, 0.32, grp_title, 13, True, col)
            self.add_bullet_list(s, x + 0.2, y + 0.52, w - 0.4, 1.65, bullets, 11, self.C_TEXT, space_after=4)

    # --- Slide 8: Engine 01 Deep-Dive (OS FSM) ---
    def slide_08_engine_01_os_fsm(self):
        s = self.add_slide()
        self.add_header(s, "Engine 01 (OS Engine) — Finite State Machine & Watchdog", "STUDENT DEFENSE: VAISHNAVI MODEKAR (ROLL 21)")

        # Left: Light-themed Diagram
        img_path = f"{DIAGRAM_DIR}/escrow_fsm_light.png"
        self.add_image_safe(s, img_path, 0.8, 1.45, 7.8, 5.6)

        # Right: Technical Defense Card (Big Text)
        self.add_card(s, 8.8, 1.45, 3.73, 5.6, self.C_GREEN_BG, self.C_EMERALD, 2.0)
        self.add_textbox(s, 9.05, 1.65, 3.3, 0.4, "OPERATING SYSTEMS DEFENSE", 14, True, self.C_EMERALD)

        bullets = [
            "Process State Analog: Milestone states (AWAITING_DEPOSIT, FUNDED, IN_PROGRESS, UNDER_REVIEW, RELEASED) mirror OS process lifecycles.",
            "Critical Section Protection: Escrow balances represent shared critical resources. KeyedMutex guarantees mutual exclusion during state transitions.",
            "Single Release Terminality: State RELEASED is terminal. Any secondary release attempt is rejected with HTTP 422.",
            "Timer Interrupt Watchdog: Prevents starvation if client abandons review. 7-day watchdog timer auto-preempts idle state to REVIEW_TIMEOUT."
        ]
        self.add_bullet_list(s, 9.05, 2.15, 3.3, 3.65, bullets, 11.5, self.C_TEXT, space_after=4)

        # Invariant Badge
        self.add_card(s, 9.0, 5.92, 3.33, 0.95, self.C_CARD_WHITE, self.C_EMERALD, 1.8)
        self.add_textbox(s, 9.15, 6.00, 3.0, 0.78, "INVARIANT INV-01 & INV-02:\nZero double-spending; illegal out-of-order state transitions rejected deterministically.", 11, True, self.C_EMERALD)

    # --- Slide 9: Engine 02 Deep-Dive (DSA & SE) ---
    def slide_09_engine_02_dsa_evidence_tree(self):
        s = self.add_slide()
        self.add_header(s, "Engine 02 (DSA & SE) — Cryptographic Proofs & EvidenceTree", "STUDENT DEFENSE: DARSHAN KITTUR (ROLL 18)")

        # Left: Light-themed Diagram
        img_path = f"{DIAGRAM_DIR}/evidence_tree_light.png"
        self.add_image_safe(s, img_path, 0.8, 1.45, 7.8, 5.6)

        # Right: Technical Defense Card (Big Text)
        self.add_card(s, 8.8, 1.45, 3.73, 5.6, self.C_AMBER_BG, self.C_AMBER, 2.0)
        self.add_textbox(s, 9.05, 1.65, 3.3, 0.4, "DSA & SE DEFENSE", 14, True, self.C_AMBER)

        bullets = [
            "Streaming SHA-256 Hashing: Streaming crypto.createHash computes 64-hex digest upon upload. Avalanche effect ensures 100% tamper detection.",
            "Hierarchical EvidenceTree: In-memory N-ary tree models the exact causal sequence of deliverables, rejections, revisions, and claims.",
            "O(V+E) Graph Traversal: Arbiters traverse the dispute DAG in topological order to review non-repudiable timeline proofs.",
            "Requirements Traceability Matrix (RTM): SE V&V engine guarantees 100% bidirectional traceability from S0 needs to test suites."
        ]
        self.add_bullet_list(s, 9.05, 2.15, 3.3, 3.65, bullets, 11.5, self.C_TEXT, space_after=4)

        # Invariant Badge
        self.add_card(s, 9.0, 5.92, 3.33, 0.95, self.C_CARD_WHITE, self.C_AMBER, 1.8)
        self.add_textbox(s, 9.15, 6.00, 3.0, 0.78, "INVARIANT INV-05 & INV-06:\nRecomputedHash != StoredChecksum flags immediate file tampering alert.", 11, True, self.C_AMBER)

    # --- Slide 10: Engine 03 Deep-Dive (DBMS BCNF Ledger) ---
    def slide_10_engine_03_dbms_bcnf_ledger(self):
        s = self.add_slide()
        self.add_header(s, "Engine 03 (DBMS) — BCNF Normalization & ACID Ledger", "STUDENT DEFENSE: PURVI SAMMATSHETTI (ROLL 11)")

        # Left: Light-themed Diagram
        img_path = f"{DIAGRAM_DIR}/double_entry_ledger_light.png"
        self.add_image_safe(s, img_path, 0.8, 1.45, 7.8, 4.3)

        # Bottom Callout on Left
        self.add_card(s, 0.8, 5.9, 7.8, 1.15, self.C_PURPLE_BG, self.C_PURPLE, 1.8)
        self.add_textbox(s, 1.0, 6.02, 7.4, 0.9, "BCNF PROOF: Every non-trivial functional dependency X -> Y has a candidate key as determinant.\nCandidate keys: proposals(project_id, freelancer_id), milestones(contract_id, sequence_order). Eliminates anomalies.", 11, True, self.C_PURPLE)

        # Right: Technical Defense Card (Big Text)
        self.add_card(s, 8.8, 1.45, 3.73, 5.6, self.C_PURPLE_BG, self.C_PURPLE, 2.0)
        self.add_textbox(s, 9.05, 1.65, 3.3, 0.4, "DBMS DEFENSE", 14, True, self.C_PURPLE)

        bullets = [
            "ACID Financial Transfers: prisma.$transaction executes atomic transfers across client, escrow vault, and freelancer accounts.",
            "Double-Entry Conservation: Strict zero-sum balance equation: Delta ClientAvailable + Delta EscrowLocked + Delta FreelancerEarned = 0.00.",
            "Append-Only AuditLog: Chained SHA-256 hashes record actorId, entityId, action, newState, and timestamp. Zero update/delete anomalies.",
            "Trigger-Based Immutability: SQLite triggers abort any attempt to execute SQL UPDATE or DELETE on AuditLog or EscrowTransaction."
        ]
        self.add_bullet_list(s, 9.05, 2.15, 3.3, 3.65, bullets, 11.5, self.C_TEXT, space_after=4)

        # Invariant Badge
        self.add_card(s, 9.0, 5.92, 3.33, 0.95, self.C_CARD_WHITE, self.C_PURPLE, 1.8)
        self.add_textbox(s, 9.15, 6.00, 3.0, 0.78, "INVARIANT INV-03 & INV-07:\nConservation of value; non-negative balance checks (CHECK availableBalance >= 0).", 11, True, self.C_PURPLE)

    # --- Slide 11: Engine 04 Deep-Dive (Web Technologies) ---
    def slide_11_engine_04_web_rbac_dashboard(self):
        s = self.add_slide()
        self.add_header(s, "Engine 04 (Web) — Role Dashboards & RBAC Enforcement", "STUDENT DEFENSE: VAIBHAV CHAVANPATIL (ROLL 04)")

        # Left: Publication-Grade Light Architecture Diagram
        img_path = f"{DIAGRAM_DIR}/engine_04_web_architecture_light.png"
        self.add_image_safe(s, img_path, 0.8, 1.45, 7.8, 5.6)

        # Right: Technical Defense Card (Big Text)
        self.add_card(s, 8.8, 1.45, 3.73, 5.6, self.C_BLUE_BG, self.C_PRIMARY, 2.0)
        self.add_textbox(s, 9.05, 1.65, 3.3, 0.4, "WEB TECH & NETWORKS DEFENSE", 14, True, self.C_PRIMARY)

        bullets = [
            "Next.js 16 & React 19 Architecture: Server/Client component boundary isolation ensures zero hydration leaks across 4 role workspaces (Client, Dev, Reviewer, Admin).",
            "Server-Side RBAC Middleware: Client-side UI hiding is UX-only. Next.js middleware cryptographically validates HMAC session cookies on 100% of routes (HTTP 401/403).",
            "Zod 4 Runtime Schema Validation: 100% of incoming payloads strictly validated against runtime allowlists at the network boundary, blocking SQLi and XSS.",
            "Lightweight 5s HTTP State Poller: Autonomous HTTP GET polling synchronizes milestone states across viewports without WebSocket connection exhaustion or memory leaks."
        ]
        self.add_bullet_list(s, 9.05, 2.15, 3.3, 3.65, bullets, 11.5, self.C_TEXT, space_after=4)

        # Invariant Badge
        self.add_card(s, 9.0, 5.92, 3.33, 0.95, self.C_CARD_WHITE, self.C_PRIMARY, 1.8)
        self.add_textbox(s, 9.15, 6.00, 3.0, 0.78, "INVARIANT INV-08 (RBAC Enforcement):\n100% route protection; zero unauthenticated data access; P95 latency = 9.84 ms.", 11, True, self.C_PRIMARY)

    # --- Slide 12: Use Cases & User Stories ---
    def slide_12_use_cases_and_user_stories(self):
        s = self.add_slide()
        self.add_header(s, "Use Cases & Agile User Stories (4 Primary Roles)", "DELIVERABLE 2 · USER SCENARIOS")

        # Top 4 Role Cards (Big Text)
        roles = [
            ("Client Persona", "Deposits escrow funds, reviews deliverables, releases milestones, contests poor quality.", self.C_PRIMARY, self.C_BLUE_BG),
            ("Freelancer Persona", "Bids on projects, submits deliverables with SHA-256 proofs, raises disputes.", self.C_EMERALD, self.C_GREEN_BG),
            ("Dispute Reviewer", "Inspects EvidenceTree, verifies checksums, issues binding legal/technical rulings.", self.C_AMBER, self.C_AMBER_BG),
            ("Admin / Auditor", "Monitors system health, inspects immutable audit logs, verifies hash chains.", self.C_RED, self.C_RED_BG),
        ]
        w, gap = 2.75, 0.23
        for i, (r_name, r_desc, r_col, r_bg) in enumerate(roles):
            x = 0.8 + i * (w + gap)
            self.add_card(s, x, 1.45, w, 1.5, r_bg, r_col, 2.0)
            self.add_textbox(s, x + 0.15, 1.55, w - 0.3, 0.35, r_name, 13, True, r_col)
            self.add_textbox(s, x + 0.15, 1.95, w - 0.3, 0.95, r_desc, 11, False, self.C_TEXT)

        # Bottom Table: 5 Core Use Cases & Agile User Stories
        self.add_card(s, 0.8, 3.15, 11.73, 3.9, self.C_CARD, self.C_BORDER, 1.5)
        self.add_textbox(s, 1.1, 3.3, 11.0, 0.35, "CORE ARCHITECTURAL USE CASES & GHERKIN ACCEPTANCE CRITERIA", 13, True, self.C_PRIMARY)

        ucs = [
            ("UC-01 (FR-01, FR-12)", "Contract Initiation & Escrow Lock", "Client", "Given Client has accepted bid, When clicking 'Lock Escrow', Then available balance debited, contract escrow credited atomically, milestone marked FUNDED."),
            ("UC-02 (FR-02, FR-03)", "Deliverable Upload & SHA-256 Hashing", "Freelancer", "Given milestone is FUNDED, When Freelancer uploads archive, Then streaming SHA-256 digest stored, milestone marked SUBMITTED, 7-day watchdog started."),
            ("UC-03 (FR-02, FR-05)", "Milestone Verification & Fund Release", "Client", "Given milestone is SUBMITTED, When Client approves work, Then FSM marks RELEASED, ACID transaction credits Freelancer, double-release rejected with 422."),
            ("UC-04 (FR-04, FR-09)", "Dispute Escalation & EvidenceTree", "Reviewer", "Given milestone contested, When dispute raised, Then funds frozen, EvidenceTree populated, Arbiter inspects O(V+E) timeline & issues binding ruling."),
            ("UC-05 (FR-11)", "Objective Proposal Matching", "Client", "Given project skill tags, When proposals submitted, Then Jaccard similarity + reputation metrics rank proposals objectively with aiMatchScore."),
        ]
        for idx, (ucid, name, actor, gherkin) in enumerate(ucs):
            y = 3.75 + idx * 0.64
            self.add_card(s, 1.1, y, 11.13, 0.58, self.C_CARD_WHITE, self.C_BORDER, 1.2)
            self.add_textbox(s, 1.25, y + 0.1, 2.2, 0.32, ucid, 11, True, self.C_PRIMARY)
            self.add_textbox(s, 3.5, y + 0.1, 2.8, 0.32, name, 11, True, self.C_TEXT)
            self.add_textbox(s, 6.35, y + 0.1, 1.0, 0.32, actor, 10, True, self.C_AMBER)
            self.add_textbox(s, 7.4, y + 0.05, 4.7, 0.5, gherkin, 10, False, self.C_MUTED)

    # --- Slide 13: 3-Tier KPIs & Success Metrics ---
    def slide_13_kpis_and_success_metrics(self):
        s = self.add_slide()
        self.add_header(s, "KPIs & Success Metrics (3-Tier Curricular Sheet)", "DELIVERABLE 3 · MEASUREMENT STANDARDS")

        tiers = [
            ("Tier 1: Mandatory KPIs", "Non-Negotiable Verification Gates", [
                "KPI-M01: Double-Allocation Drift = 0.00% (Concurrent transfers assert Sum dB = 0)",
                "KPI-M02: RBAC Protection = 100.0% (All protected routes assert HTTP 401/403)",
                "KPI-M03: SHA-256 Tampering Detection = 100.0% (1-bit flip yields digest mismatch)",
                "KPI-M04: FSM Determinism = 0 Invalid State Transitions permitted (Assert HTTP 422)",
                "KPI-M05: Input Security = 100.0% payloads validated via Zod 4 schemas"
            ], self.C_EMERALD, self.C_GREEN_BG),
            ("Tier 2: System KPIs", "Operational Performance Envelopes", [
                "KPI-S01: Core API Latency = p95 <= 500 ms (50 concurrent reqs on benchmark load)",
                "KPI-S02: Checksum Generation <= 100 ms for deliverable archives up to 50 MB",
                "KPI-S03: Client Dashboard Refresh Interval <= 5.0 seconds via lightweight poller",
                "KPI-S04: Auditability = 100.0% of state transitions captured in append-only log",
                "KPI-S05: Lighthouse Accessibility Score >= 90 / 100 across 360px-1920px viewports"
            ], self.C_PRIMARY, self.C_BLUE_BG),
            ("Tier 3: Challenge KPIs", "Engineering Excellence Benchmarks", [
                "KPI-C01: In-Memory EvidenceTree Traversal <= 10 ms for 50-node dispute DAG",
                "KPI-C02: Milestone Lock Contention Resolution <= 250 ms (KeyedMutex benchmark)",
                "KPI-C03: Heuristic Proposal Match Speed <= 50 ms for batch of 100 proposals",
                "KPI-C04: Indexed Audit Log Retrieval <= 15 ms on 10,000 historical records",
                "KPI-C05: Zero unhandled 500 crashes (100% standardized JSON error envelopes)"
            ], self.C_AMBER, self.C_AMBER_BG),
        ]
        w, h, gap = 3.65, 5.5, 0.39
        for i, (t_title, t_sub, metrics, col, bg) in enumerate(tiers):
            x = 0.8 + i * (w + gap)
            self.add_card(s, x, 1.5, w, h, bg, col, 2.0)
            self.add_textbox(s, x + 0.2, 1.7, w - 0.4, 0.35, t_title, 15, True, col)
            self.add_textbox(s, x + 0.2, 2.1, w - 0.4, 0.28, t_sub, 11, False, self.C_MUTED)
            self.add_card(s, x + 0.2, 2.45, w - 0.4, 0.02, col, col)
            self.add_bullet_list(s, x + 0.2, 2.65, w - 0.4, 4.1, metrics, 11, self.C_TEXT, space_after=8)

    # --- Slide 14: Prioritized Requirements & Pre-Emptive FAQ ---
    def slide_14_prioritized_requirements_and_faq(self):
        s = self.add_slide()
        self.add_header(s, "Prioritized Requirements (MoSCoW) & Evaluator FAQ", "DELIVERABLE 6 · RISK DEFENSE")

        # Left Column: MoSCoW Breakdown (Big Text)
        self.add_card(s, 0.8, 1.45, 5.7, 5.6, self.C_CARD, self.C_BORDER, 1.5)
        self.add_textbox(s, 1.1, 1.65, 5.1, 0.35, "MoSCoW PRIORITIZATION MATRIX", 14, True, self.C_PRIMARY)

        moscow = [
            ("Must Have (P0 — Crucial)", "FR-01 (Lock), FR-02 (FSM), FR-03 (SHA-256), FR-05 (ACID), FR-06 (Audit), FR-07 (Dashboard), FR-08 (RBAC). Non-negotiable core escrow loop.", self.C_EMERALD, self.C_GREEN_BG),
            ("Should Have (P1 — High)", "FR-04 (EvidenceTree), FR-09 (Dispute Escalation), FR-12 (Watchdog Orchestration). Essential for dispute resolution & timeout automation.", self.C_PRIMARY, self.C_BLUE_BG),
            ("Could Have (P2 — Desirable)", "FR-10 (5s Poller), FR-11 (AI Semantic Proposal Matcher). UX enhancements that optimize matchmaking without risking escrow core.", self.C_AMBER, self.C_AMBER_BG),
            ("Won't Have (P3 — Out of Scope)", "Direct commercial banking custody, autonomous legal AI judge, native iOS/Android apps. Excluded to prevent academic scope creep.", self.C_RED, self.C_RED_BG),
        ]
        for idx, (tier, desc, col, bg) in enumerate(moscow):
            y = 2.15 + idx * 1.15
            self.add_card(s, 1.1, y, 5.1, 1.05, bg, col, 1.5)
            self.add_textbox(s, 1.25, y + 0.08, 4.8, 0.28, tier, 12, True, col)
            self.add_textbox(s, 1.25, y + 0.38, 4.8, 0.65, desc, 10, False, self.C_TEXT)

        # Right Column: Pre-Emptive Evaluator Defense (Big Text)
        self.add_card(s, 6.8, 1.45, 5.73, 5.6, self.C_AMBER_BG, self.C_AMBER, 2.0)
        self.add_textbox(s, 7.1, 1.65, 5.1, 0.35, "PRE-EMPTIVE EVALUATOR VIVA DEFENSE", 14, True, self.C_AMBER)

        faqs = [
            ("Q: 'Why do code/database files exist in your repo for Gate 1?'", "A: Our requirements baseline was frozen Oct 2 (commit 926869b). Today's Gate 1 strictly evaluates the Requirements Baseline (15 Marks). Implementation is evaluated in Gate 4."),
            ("Q: 'What happens if client abandons deliverable review?'", "A: Engine 01 implements a 7-calendar-day timer interrupt watchdog that preempts the idle state and transitions the milestone to REVIEW_TIMEOUT, preventing freelancer starvation."),
            ("Q: 'Why use an EvidenceTree rather than a flat DB table?'", "A: A flat table loses causality. An N-ary tree models the exact timeline: Rejection 1 -> Revision 2 -> Counter-claim, enabling O(V+E) hash verification for arbiters."),
            ("Q: 'How do you guarantee zero financial double-spending?'", "A: State machine single-release terminality + atomic SQLite transactions (Sum dB = 0). Secondary release requests find state RELEASED and are rejected with 422."),
        ]
        for idx, (q, a) in enumerate(faqs):
            y = 2.15 + idx * 1.15
            self.add_card(s, 7.1, y, 5.13, 1.05, self.C_CARD_WHITE, self.C_BORDER, 1.2)
            self.add_textbox(s, 7.25, y + 0.08, 4.8, 0.28, q, 10, True, self.C_PRIMARY)
            self.add_textbox(s, 7.25, y + 0.38, 4.8, 0.65, a, 10, False, self.C_MUTED)

    # --- Slide 15: Conclusion & Q&A ---
    def slide_15_conclusion(self):
        s = self.add_slide()
        # Top Category
        self.add_textbox(s, 0.8, 0.85, 11.7, 0.4, "GATE 1 EVALUATION CLOSURE", 14, True, self.C_PRIMARY, PP_ALIGN.CENTER)
        self.add_textbox(s, 0.8, 1.35, 11.7, 1.0, "Requirements Baseline Ready for Gate 1 Approval", 30, True, self.C_TEXT, PP_ALIGN.CENTER)
        self.add_textbox(s, 0.8, 2.35, 11.7, 0.45, "All 7 Deliverables Submitted · 15/15 Marks Rubric Satisfied · 4 Engines Accountable", 16, True, self.C_EMERALD, PP_ALIGN.CENTER)

        # 3 Key Takeaway Cards (Big Text)
        takeaways = [
            ("Rigorous Computer Science Core", "Not a generic web app. Integrates OS concurrency (FSM & watchdog), DSA (EvidenceTree & SHA-256), and DBMS (BCNF & ACID ledger).", self.C_PRIMARY, self.C_BLUE_BG),
            ("Verifiable Engineering Baseline", "100% bidirectional RTM traceability from Gate 0 stakeholder needs to testable acceptance criteria with dated VCS freeze.", self.C_EMERALD, self.C_GREEN_BG),
            ("Balanced Team Ownership", "Individually ownable and defensible engines mapped to core CSE courses across all four student engineers.", self.C_AMBER, self.C_AMBER_BG),
        ]
        w, gap = 3.65, 0.39
        for i, (t_title, t_desc, t_col, t_bg) in enumerate(takeaways):
            x = 0.8 + i * (w + gap)
            self.add_card(s, x, 3.1, w, 2.6, t_bg, t_col, 2.0)
            self.add_textbox(s, x + 0.2, 3.35, w - 0.4, 0.55, t_title, 15, True, t_col, PP_ALIGN.CENTER)
            self.add_card(s, x + 0.4, 3.95, w - 0.8, 0.02, t_col, t_col)
            self.add_textbox(s, x + 0.2, 4.15, w - 0.4, 1.35, t_desc, 12, False, self.C_TEXT, PP_ALIGN.CENTER)

        # Bottom Thank You & Q&A Banner
        self.add_card(s, 0.8, 5.95, 11.73, 0.95, self.C_BLUE_BG, self.C_PRIMARY, 2.0)
        self.add_textbox(s, 1.0, 6.08, 11.3, 0.4, "Thank You! Team 07 is Ready for Review Board Evaluation & Viva Voce", 16, True, self.C_TEXT, PP_ALIGN.CENTER)
        self.add_textbox(s, 1.0, 6.45, 11.3, 0.35, "Vaibhav Chavanpatil · Purvi Sammatshetti · Darshan Kittur · Vaishnavi Modekar", 12, True, self.C_PRIMARY, PP_ALIGN.CENTER)

if __name__ == "__main__":
    builder = Gate1DeckBuilderLight()
    builder.build()
