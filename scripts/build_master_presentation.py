import sys
import os
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_gate1_deck():
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Palette definition
    NAVY = RGBColor(15, 41, 74)          # #0F294A - KLE Tech Primary Deep Navy
    DARK_BLUE = RGBColor(26, 54, 93)     # #1A365D - Title Dark Blue
    SLATE = RGBColor(100, 116, 139)      # #64748B - Subtitle Slate
    TEXT_DARK = RGBColor(30, 41, 59)     # #1E293B - Charcoal Body Text
    BG_LIGHT = RGBColor(248, 250, 252)   # #F8FAFC - Off-white canvas
    CARD_BG = RGBColor(255, 255, 255)    # Pure White Card
    BORDER_CLR = RGBColor(226, 232, 240) # #E2E8F0 - Soft border
    ACCENT_TEAL = RGBColor(13, 148, 136) # #0D9488 - Teal
    ACCENT_BLUE = RGBColor(37, 99, 235)  # #2563EB - Royal Blue
    ACCENT_PURPLE = RGBColor(109, 40, 217)# #6D28D9 - Purple
    ACCENT_AMBER = RGBColor(217, 119, 6) # #D97706 - Amber
    ACCENT_RED = RGBColor(225, 29, 72)   # #E11D48 - Crimson

    LOGO_PATH = "assets/kle_college_logo.jpeg"
    LOGO_LEFT = Inches(9.50)
    LOGO_TOP = Inches(0.35)
    LOGO_WIDTH = Inches(3.24)
    LOGO_HEIGHT = Inches(0.55)

    def add_blank_slide():
        slide = prs.slides.add_slide(blank_layout)
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_LIGHT
        bg.line.color.rgb = BG_LIGHT
        return slide

    def add_header(slide, title, subtitle=None, badge=None):
        # 1. Top Accent Stripe
        accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.16))
        accent.fill.solid()
        accent.fill.fore_color.rgb = NAVY
        accent.line.fill.background()

        # 2. KLE College Logo (Top-Right Persistent Anchor)
        if os.path.exists(LOGO_PATH):
            slide.shapes.add_picture(LOGO_PATH, left=LOGO_LEFT, top=LOGO_TOP, width=LOGO_WIDTH, height=LOGO_HEIGHT)

        # 3. Deliverable Badge (if present)
        top_y = 0.35
        if badge:
            badge_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(top_y), Inches(0.4), Inches(0.4))
            badge_box.fill.solid()
            badge_box.fill.fore_color.rgb = NAVY
            badge_box.line.color.rgb = NAVY
            tf = badge_box.text_frame
            tf.word_wrap = False
            p = tf.paragraphs[0]
            p.text = str(badge)
            p.alignment = PP_ALIGN.CENTER
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = RGBColor(255, 255, 255)
            title_left = 1.15
            title_width = 8.1
        else:
            title_left = 0.6
            title_width = 8.65

        # 4. Title and Subtitle Text Box (Bounded to prevent logo collision)
        tb = slide.shapes.add_textbox(Inches(title_left), Inches(top_y - 0.05), Inches(title_width), Inches(0.75))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0)
        tf.margin_bottom = Inches(0)
        tf.margin_left = Inches(0)
        tf.margin_right = Inches(0)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = NAVY

        if subtitle:
            p2 = tf.add_paragraph()
            p2.text = subtitle
            p2.font.size = Pt(10.5)
            p2.font.color.rgb = SLATE
            p2.space_before = Pt(3)

    def add_footer(slide, text="Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow | Gate 1"):
        tb = slide.shapes.add_textbox(Inches(0.6), Inches(7.05), Inches(12.133), Inches(0.3))
        tf = tb.text_frame
        tf.margin_top = Inches(0)
        p = tf.paragraphs[0]
        p.text = text
        p.alignment = PP_ALIGN.CENTER
        p.font.size = Pt(8.5)
        p.font.color.rgb = SLATE

    def add_card(slide, left, top, width, height, bg_clr=CARD_BG, border_clr=BORDER_CLR):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_clr
        card.line.color.rgb = border_clr
        card.line.width = Pt(1)
        return card

    def add_table(slide, left, top, width, height, headers, rows, col_widths=None):
        table_shape = slide.shapes.add_table(len(rows) + 1, len(headers), Inches(left), Inches(top), Inches(width), Inches(height))
        tbl = table_shape.table

        if col_widths:
            for i, w in enumerate(col_widths):
                tbl.columns[i].width = Inches(w)

        # Header Row
        for i, h in enumerate(headers):
            cell = tbl.cell(0, i)
            cell.fill.solid()
            cell.fill.fore_color.rgb = NAVY
            tf = cell.text_frame
            tf.word_wrap = True
            tf.margin_top = Inches(0.06)
            tf.margin_bottom = Inches(0.06)
            tf.margin_left = Inches(0.08)
            tf.margin_right = Inches(0.08)
            p = tf.paragraphs[0]
            p.text = h
            p.font.bold = True
            p.font.size = Pt(10)
            p.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, row in enumerate(rows):
            is_alt = (r_idx % 2 == 1)
            row_bg = RGBColor(241, 245, 249) if is_alt else RGBColor(255, 255, 255)
            for c_idx, val in enumerate(row):
                cell = tbl.cell(r_idx + 1, c_idx)
                cell.fill.solid()
                cell.fill.fore_color.rgb = row_bg
                tf = cell.text_frame
                tf.word_wrap = True
                tf.margin_top = Inches(0.05)
                tf.margin_bottom = Inches(0.05)
                tf.margin_left = Inches(0.08)
                tf.margin_right = Inches(0.08)
                p = tf.paragraphs[0]
                p.text = str(val)
                p.font.size = Pt(9.5)
                p.font.color.rgb = TEXT_DARK
        return table_shape

    def add_kpi_cards(slide, left, top, total_width, height, metrics):
        card_w = (total_width - 0.25 * (len(metrics) - 1)) / len(metrics)
        for i, (title, target, measured, color) in enumerate(metrics):
            cx = left + i * (card_w + 0.25)
            card = add_card(slide, cx, top, card_w, height)

            tb = slide.shapes.add_textbox(Inches(cx + 0.1), Inches(top + 0.15), Inches(card_w - 0.2), Inches(height - 0.3))
            tf = tb.text_frame
            tf.word_wrap = True

            p0 = tf.paragraphs[0]
            p0.text = title
            p0.font.bold = True
            p0.font.size = Pt(12)
            p0.font.color.rgb = NAVY

            p1 = tf.add_paragraph()
            p1.text = "TARGET"
            p1.font.bold = True
            p1.font.size = Pt(8.5)
            p1.font.color.rgb = SLATE
            p1.space_before = Pt(12)

            p2 = tf.add_paragraph()
            p2.text = target
            p2.font.bold = True
            p2.font.size = Pt(18)
            p2.font.color.rgb = color
            p2.space_before = Pt(2)

            p3 = tf.add_paragraph()
            p3.text = "MEASURED BY"
            p3.font.bold = True
            p3.font.size = Pt(8.5)
            p3.font.color.rgb = SLATE
            p3.space_before = Pt(16)

            p4 = tf.add_paragraph()
            p4.text = measured
            p4.font.size = Pt(9.5)
            p4.font.color.rgb = TEXT_DARK
            p4.space_before = Pt(2)

    print("Building 43 slides with official KLE Tech logo...")

    # ==========================================
    # SLIDE 1: Cover Slide
    # ==========================================
    s1 = add_blank_slide()
    # Top Accent Line
    acc1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.16))
    acc1.fill.solid()
    acc1.fill.fore_color.rgb = NAVY
    acc1.line.fill.background()

    # College Logo Top Right
    if os.path.exists(LOGO_PATH):
        s1.shapes.add_picture(LOGO_PATH, left=LOGO_LEFT, top=LOGO_TOP, width=LOGO_WIDTH, height=LOGO_HEIGHT)

    # Header Banner
    top_bar = s1.shapes.add_textbox(Inches(0.6), Inches(0.4), Inches(8.6), Inches(0.4))
    top_bar.text_frame.word_wrap = True
    top_bar.text_frame.paragraphs[0].text = "MINI PROJECT REPORT  |  FOUNDATION INTEGRATION COURSE"
    top_bar.text_frame.paragraphs[0].font.size = Pt(12.5)
    top_bar.text_frame.paragraphs[0].font.bold = True
    top_bar.text_frame.paragraphs[0].font.color.rgb = NAVY

    # Project Title Box
    title_box = s1.shapes.add_textbox(Inches(0.6), Inches(1.3), Inches(12.133), Inches(1.4))
    p = title_box.text_frame.paragraphs[0]
    p.text = "Milestone-Based Escrow & Dispute Resolution Workflow"
    p.alignment = PP_ALIGN.CENTER
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = NAVY
    p_sub = title_box.text_frame.add_paragraph()
    p_sub.text = "with Cryptographic Deliverable Verification & Guarded FSM Transitions"
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.font.size = Pt(16)
    p_sub.font.color.rgb = ACCENT_TEAL

    # Stage Banner
    stage_box = s1.shapes.add_textbox(Inches(0.6), Inches(2.85), Inches(12.133), Inches(0.4))
    p_st = stage_box.text_frame.paragraphs[0]
    p_st.text = "STAGE S0 | GATE 0 — Problem Definition & Need Identification"
    p_st.alignment = PP_ALIGN.CENTER
    p_st.font.size = Pt(12.5)
    p_st.font.bold = True
    p_st.font.color.rgb = SLATE

    # Submitter Card
    card_sub = add_card(s1, 1.2, 3.6, 5.2, 2.6)
    tb_sub = s1.shapes.add_textbox(Inches(1.4), Inches(3.75), Inches(4.8), Inches(2.3))
    tf_sub = tb_sub.text_frame
    p = tf_sub.paragraphs[0]
    p.text = "SUBMITTED BY  |  Team No. 07  |  Theme No. 01"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = NAVY
    team_members = [
        "Vaibhav Chavanpatil (02FE24BCS013, Roll No: 4)",
        "Purvi Sammatshetti (02FE24BCS022, Roll No: 11)",
        "Darshan Kittur (02FE24BCS053, Roll No: 18)",
        "Vaishnavi Modekar (02FE24BCS060, Roll No: 21)"
    ]
    for tm in team_members:
        p_tm = tf_sub.add_paragraph()
        p_tm.text = "• " + tm
        p_tm.font.size = Pt(10)
        p_tm.font.color.rgb = TEXT_DARK
        p_tm.space_before = Pt(4)

    # Guide Card
    card_guide = add_card(s1, 6.9, 3.6, 5.2, 2.6)
    tb_guide = s1.shapes.add_textbox(Inches(7.1), Inches(3.75), Inches(4.8), Inches(2.3))
    tf_guide = tb_guide.text_frame
    p = tf_guide.paragraphs[0]
    p.text = "PROJECT GUIDE"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = NAVY

    p_gname = tf_guide.add_paragraph()
    p_gname.text = "Dr. Niranjan Muchandi"
    p_gname.font.bold = True
    p_gname.font.size = Pt(14)
    p_gname.font.color.rgb = NAVY
    p_gname.space_before = Pt(8)

    p_ginst = tf_guide.add_paragraph()
    p_ginst.text = "School of Computer Science & Engineering\nKLE Technological University\nDr. M. S. Sheshgiri Campus, Belagavi"
    p_ginst.font.size = Pt(10.5)
    p_ginst.font.color.rgb = SLATE
    p_ginst.space_before = Pt(4)

    add_footer(s1, "Department of Computer Science and Engineering  |  Academic Year 2026-27")

    # ==========================================
    # SLIDE 2: Problem Identification & Solution
    # ==========================================
    s2 = add_blank_slide()
    add_header(s2, "PROBLEM IDENTIFICATION & PROPOSED SOLUTION", "THE PROBLEM & ENGINEERING INTERVENTION")

    # Left Card: AS-IS
    card_as_is = add_card(s2, 0.6, 1.2, 5.8, 3.4)
    tb_as = s2.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(5.4), Inches(3.1))
    tf_as = tb_as.text_frame
    p = tf_as.paragraphs[0]
    p.text = "Current Situation (AS-IS)"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_RED
    as_is_points = [
        "Freelance payments delayed or defaulted without automated escrow locks",
        "Deliverables submitted across unorganized channels without integrity proofs",
        "Disputes adjudicated subjectively without cryptographic evidence audit trails",
        "Payment records prone to double-spending races and concurrent state corruption",
        "Freelancers face client abandonment and review ghosting without recourse",
        "Unclear milestone criteria cause project abandonment and mutual distrust"
    ]
    for pt in as_is_points:
        p_pt = tf_as.add_paragraph()
        p_pt.text = "• " + pt
        p_pt.font.size = Pt(9.5)
        p_pt.font.color.rgb = TEXT_DARK
        p_pt.space_before = Pt(3)

    # Right Card: TO-BE
    card_to_be = add_card(s2, 6.9, 1.2, 5.8, 3.4)
    tb_to = s2.shapes.add_textbox(Inches(7.1), Inches(1.3), Inches(5.4), Inches(3.1))
    tf_to = tb_to.text_frame
    p = tf_to.paragraphs[0]
    p.text = "Proposed Solution (TO-BE)"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_TEAL
    to_be_points = [
        "Centralized web platform coordinating milestone escrow & dispute resolution",
        "Simulated escrow budget locked upon contract confirmation under strict ACID",
        "Streaming SHA-256 deliverable hashing & hierarchical in-memory Evidence Tree",
        "Deterministic OS Finite State Machine with automated 7-day review watchdog",
        "Multi-role responsive dashboards with server-side RBAC for 4 distinct roles",
        "Four independently ownable and testable curricular engineering engines"
    ]
    for pt in to_be_points:
        p_pt = tf_to.add_paragraph()
        p_pt.text = "• " + pt
        p_pt.font.size = Pt(9.5)
        p_pt.font.color.rgb = TEXT_DARK
        p_pt.space_before = Pt(3)

    # Bottom Cards: IMPACT & OBJECTIVES
    add_card(s2, 0.6, 4.85, 3.8, 1.9)
    tb_imp1 = s2.shapes.add_textbox(Inches(0.8), Inches(4.95), Inches(3.4), Inches(1.6))
    tf_imp1 = tb_imp1.text_frame
    p = tf_imp1.paragraphs[0]
    p.text = "Speed & Certainty"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = NAVY
    p2 = tf_imp1.add_paragraph()
    p2.text = "Reduces milestone review from weeks to minutes. Eliminates payment default via simulated escrow lock."
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = TEXT_DARK
    p2.space_before = Pt(4)

    add_card(s2, 4.75, 4.85, 3.8, 1.9)
    tb_imp2 = s2.shapes.add_textbox(Inches(4.95), Inches(4.95), Inches(3.4), Inches(1.6))
    tf_imp2 = tb_imp2.text_frame
    p = tf_imp2.paragraphs[0]
    p.text = "Cryptographic Accuracy"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = NAVY
    p2 = tf_imp2.add_paragraph()
    p2.text = "Eliminates deliverable repudiation with 100% SHA-256 tamper detection and causal Evidence Tree indexing."
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = TEXT_DARK
    p2.space_before = Pt(4)

    add_card(s2, 8.9, 4.85, 3.8, 1.9)
    tb_imp3 = s2.shapes.add_textbox(Inches(9.1), Inches(4.95), Inches(3.4), Inches(1.6))
    tf_imp3 = tb_imp3.text_frame
    p = tf_imp3.paragraphs[0]
    p.text = "Deterministic Control"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = NAVY
    p2 = tf_imp3.add_paragraph()
    p2.text = "ACID ledger invariant (ΔB = 0) with zero duplicate releases and 7-day watchdog preventing review starvation."
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = TEXT_DARK
    p2.space_before = Pt(4)

    add_footer(s2, "Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow | Gate 0")

    # ==========================================
    # SLIDE 3: Project Architecture
    # ==========================================
    s3 = add_blank_slide()
    add_header(s3, "PROJECT ARCHITECTURE", "Four Engines, One Integrated System  |  Hybrid SDLC Framework")

    tb_arch = s3.shapes.add_textbox(Inches(0.6), Inches(1.05), Inches(12.133), Inches(0.4))
    p = tb_arch.text_frame.paragraphs[0]
    p.text = "STAKEHOLDERS:  Clients  •  Freelancers  •  Dispute Reviewers  •  System Administrators"
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = NAVY

    engines_meta = [
        ("OS", "Engine 01", "Escrow & State Scheduler", "Owner: Vaishnavi Modekar",
         "Coordinates contract lifecycle, sequential milestone transitions, and 7-day review watchdog preemption using OS scheduling and mutex concurrency control.", ACCENT_BLUE),
        ("DSA", "Engine 02", "Verification & Evidence Engine", "Owner: Darshan Kittur",
         "Computes streaming SHA-256 deliverable checksums, builds hierarchical N-ary Evidence Trees [O(V+E) <= 10ms], and evaluates Jaccard tag similarity.", ACCENT_PURPLE),
        ("DBMS", "Engine 03", "Transaction Ledger", "Owner: Purvi Sammatshetti",
         "Maintains normalized BCNF relational schema, ACID escrow balance transfers [ΔB = 0], and tamper-resistant append-only audit journals with SQLite triggers.", ACCENT_TEAL),
        ("WEB/CN", "Engine 04", "Workflow Dashboard", "Owner: Vaibhav Chavanpatil",
         "Delivers responsive React 19 dashboards, server-side RBAC guards, dispute submission forms, and 5-second polling state synchronization.", ACCENT_AMBER)
    ]
    card_w = 2.85
    gap = 0.24
    for i, (badge, eid, ename, owner, desc, clr) in enumerate(engines_meta):
        cx = 0.6 + i * (card_w + gap)
        add_card(s3, cx, 1.5, card_w, 5.2)

        b_box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx + 0.2), Inches(1.7), Inches(0.8), Inches(0.35))
        b_box.fill.solid()
        b_box.fill.fore_color.rgb = clr
        b_box.line.color.rgb = clr
        b_box.text_frame.paragraphs[0].text = badge
        b_box.text_frame.paragraphs[0].font.bold = True
        b_box.text_frame.paragraphs[0].font.size = Pt(11)
        b_box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        b_box.text_frame.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)

        tb = s3.shapes.add_textbox(Inches(cx + 0.15), Inches(2.2), Inches(card_w - 0.3), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = eid
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = SLATE

        p1 = tf.add_paragraph()
        p1.text = ename
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = NAVY
        p1.space_before = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = owner
        p2.font.size = Pt(9.5)
        p2.font.bold = True
        p2.font.color.rgb = clr
        p2.space_before = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = TEXT_DARK
        p3.space_before = Pt(8)

    add_footer(s3, "Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow | Gate 0")

    # ==========================================
    # SLIDES 4-7: What It Does vs What Students Should Do
    # ==========================================
    def add_engine_overview_slide(eid, ename, subcourse, owner, does_list, should_list, badge_clr):
        s = add_blank_slide()
        add_header(s, f"{eid}  |  {subcourse.upper()} ENGINE", f"Owner – {owner}  |  {ename}")

        # Left: What it does
        add_card(s, 0.6, 1.2, 5.8, 5.5)
        tb_left = s.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(5.4), Inches(5.1))
        tf_left = tb_left.text_frame
        p = tf_left.paragraphs[0]
        p.text = "WHAT IT DOES  (" + ename + ")"
        p.font.bold = True
        p.font.size = Pt(12.5)
        p.font.color.rgb = NAVY
        for idx, item in enumerate(does_list):
            p_item = tf_left.add_paragraph()
            p_item.text = f"{idx+1}.  {item}"
            p_item.font.size = Pt(9.5)
            p_item.font.color.rgb = TEXT_DARK
            p_item.space_before = Pt(12)

        # Right: What students should do
        add_card(s, 6.9, 1.2, 5.8, 5.5)
        tb_right = s.shapes.add_textbox(Inches(7.1), Inches(1.35), Inches(5.4), Inches(5.1))
        tf_right = tb_right.text_frame
        p = tf_right.paragraphs[0]
        p.text = "WHAT STUDENTS SHOULD DO"
        p.font.bold = True
        p.font.size = Pt(12.5)
        p.font.color.rgb = badge_clr
        for idx, item in enumerate(should_list):
            p_item = tf_right.add_paragraph()
            p_item.text = f"{idx+1}.  {item}"
            p_item.font.size = Pt(9.5)
            p_item.font.color.rgb = TEXT_DARK
            p_item.space_before = Pt(12)

        add_footer(s, f"{eid} ({ename}) Overview  |  Gate 0 / Gate 1 Baseline")
        return s

    add_engine_overview_slide(
        "ENGINE 01", "Escrow & State Scheduler", "Operating Systems",
        "Vaishnavi Modekar (02FE24BCS060, Roll 21)",
        [
            "Coordinates deterministic milestone lifecycle using guarded Finite State Machine transitions.",
            "Enforces mutual exclusion on escrow allocations to prevent concurrent double-allocation races.",
            "Implements automated 7-day review watchdog scheduler to preempt client abandonment.",
            "Tracks milestone states: Awaiting Deposit, Funded, In Progress, Under Review, Disputed, Released, Refunded."
        ],
        [
            "Implement guarded FSM state transition matrix rejecting 100% of out-of-order mutations.",
            "Develop in-memory KeyedMutex pattern keyed by milestone ID to serialize concurrent requests.",
            "Construct mock-clock test harness verifying watchdog transition after 7 elapsed days.",
            "Simulate and model milestone process transitions and race conditions under concurrent load."
        ],
        ACCENT_BLUE
    )

    add_engine_overview_slide(
        "ENGINE 02", "Verification & Evidence Engine", "Data Structures & Software Engineering",
        "Darshan Kittur (02FE24BCS053, Roll 18)",
        [
            "Computes streaming SHA-256 cryptographic digests on deliverable files to detect tampering.",
            "Constructs in-memory hierarchical N-ary Evidence Tree representing causal dispute timelines.",
            "Implements heuristic Jaccard similarity matcher to rank proposals against project skill tags.",
            "Enforces bidirectional Requirements Traceability Matrix (RTM) and V&V testing pipelines."
        ],
        [
            "Implement streaming SHA-256 hashing supporting deliverables up to 50 MB with 100% 1-bit flip detection.",
            "Build in-memory N-ary tree data structure with O(V+E) DFS/BFS traversal under <= 10 ms.",
            "Write deterministic heuristic proposal matching algorithm combining tags, DevScore, and budget.",
            "Maintain comprehensive RTM linking S0 needs, IEEE requirements, test cases, and engine owners."
        ],
        ACCENT_PURPLE
    )

    add_engine_overview_slide(
        "ENGINE 03", "Transaction Ledger", "Database Management Systems",
        "Purvi Sammatshetti (02FE24BCS022, Roll 11)",
        [
            "Maintains normalized BCNF relational schema for Users, Contracts, Milestones, Escrow, and Disputes.",
            "Executes escrow deposit locks, releases, and refunds within atomic ACID transactional boundaries.",
            "Prevents duplicate releases and balance drift through double-entry zero-sum invariants (ΔB = 0).",
            "Enforces append-only audit logging with Merkle-Damgård SHA-256 hash chaining and SQLite triggers."
        ],
        [
            "Design normalized relational tables with candidate keys and ON DELETE RESTRICT integrity guards.",
            "Implement prisma.$transaction() wrapping 7 operations with rollback on constraint failure.",
            "Enforce integer paise / cents currency arithmetic to prevent IEEE 754 floating-point drift.",
            "Install SQLite BEFORE UPDATE/DELETE RAISE(ABORT) triggers to make audit records immutable."
        ],
        ACCENT_TEAL
    )

    add_engine_overview_slide(
        "ENGINE 04", "Role-Based Workflow Dashboard", "Web Technology Frontend",
        "Vaibhav Chavanpatil (02FE24BCS013, Roll 04)",
        [
            "Provides responsive multi-role dashboards for Client, Freelancer, Dispute Reviewer, and Admin.",
            "Enforces least-privilege server-side RBAC on 100% of protected Next.js App Router endpoints.",
            "Implements dispute intake forms, evidence association controls, and reviewer arbitration console.",
            "Synchronizes displayed UI progress with backend state using a 5-second polling loop."
        ],
        [
            "Design accessible, responsive layouts with 0 horizontal overflow across mobile (375px) and desktop.",
            "Build server-side token authorization middleware asserting HTTP 401/403 on permission violations.",
            "Enforce Zod 4 runtime schema validation rejecting malformed payloads, XSS, and injection attempts.",
            "Implement lightweight state polling fetching indexed snapshots in <= 15 ms with zero memory leaks."
        ],
        ACCENT_AMBER
    )

    # ==========================================
    # SLIDE 8: Academic Focus & Foundational Link
    # ==========================================
    s8 = add_blank_slide()
    add_header(s8, "ACADEMIC FOCUS & FOUNDATIONAL LINK", "Mapping Four Core Engineering Disciplines to Project Engines")

    academic_links = [
        ("WEB", "Web Technologies", "30% Weight", "Engine 04 · Vaibhav Chavanpatil (Roll 04)",
         "Client-Server architecture, Next.js 16 App Router, React 19 UI composition, REST API protocol contracts, HTTP status code discipline, token-based session auth, responsive CSS3 viewports.",
         "Multi-role responsive dashboard (Client, Freelancer, Reviewer, Admin), server-side RBAC route protection on 100% of endpoints, dispute intake forms, and 5-second polling state synchronization.",
         ACCENT_AMBER),
        ("OS", "Operating Systems", "25% Weight", "Engine 01 · Vaishnavi Modekar (Roll 21)",
         "Finite State Machine (FSM) process models, mutual exclusion, critical section protection, race condition prevention, timer interrupts, and watchdog scheduler preemption.",
         "Deterministic 7-state escrow lifecycle transitions, in-memory KeyedMutex concurrency control serializing concurrent locks, and automated 7-day review watchdog preventing client abandonment.",
         ACCENT_BLUE),
        ("DBMS", "Database Management Systems", "25% Weight", "Engine 03 · Purvi Sammatshetti (Roll 11)",
         "Relational data modeling, Boyce-Codd Normal Form (BCNF), ACID transaction atomicity, double-entry ledger bookkeeping (ΔB = 0), and immutable audit journals with database triggers.",
         "Normalized relational schema, atomic prisma.$transaction wrapping 7 operations with auto-rollback, integer paise currency conservation, and SQLite BEFORE UPDATE/DELETE RAISE(ABORT) triggers.",
         ACCENT_TEAL),
        ("DSA/SE", "Data Structures & Algorithms / SE", "20% Weight", "Engine 02 · Darshan Kittur (Roll 18)",
         "Cryptographic SHA-256 hashing, hierarchical N-ary tree structures and O(V+E) traversal, heuristic Jaccard similarity algorithms, IEEE requirements engineering, and V&V testing pipelines.",
         "Streaming SHA-256 deliverable checksums up to 50 MB (100% tamper detection), in-memory EvidenceTree dispute timeline indexing (<= 10ms), heuristic proposal matching, and bidirectional RTM.",
         ACCENT_PURPLE)
    ]

    for idx, (badge, title, weight, owner, theory, impl, clr) in enumerate(academic_links):
        cy = 1.28 + idx * (1.22 + 0.16)
        add_card(s8, 0.6, cy, 12.133, 1.22)

        # 1. Left Pill & Title Block (width 2.8 in)
        b_box = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.75), Inches(cy + 0.14), Inches(0.85), Inches(0.28))
        b_box.fill.solid()
        b_box.fill.fore_color.rgb = clr
        b_box.line.color.rgb = clr
        b_box.text_frame.paragraphs[0].text = badge
        b_box.text_frame.paragraphs[0].font.bold = True
        b_box.text_frame.paragraphs[0].font.size = Pt(9.5)
        b_box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        b_box.text_frame.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)

        # Weight Tag
        w_box = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.68), Inches(cy + 0.14), Inches(1.10), Inches(0.28))
        w_box.fill.solid()
        w_box.fill.fore_color.rgb = RGBColor(241, 245, 249)
        w_box.line.color.rgb = BORDER_CLR
        w_box.text_frame.paragraphs[0].text = weight
        w_box.text_frame.paragraphs[0].font.bold = True
        w_box.text_frame.paragraphs[0].font.size = Pt(9)
        w_box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        w_box.text_frame.paragraphs[0].font.color.rgb = clr

        tb_id = s8.shapes.add_textbox(Inches(0.75), Inches(cy + 0.46), Inches(2.7), Inches(0.68))
        tf_id = tb_id.text_frame
        tf_id.word_wrap = True
        tf_id.margin_top = tf_id.margin_bottom = tf_id.margin_left = tf_id.margin_right = 0
        p_t = tf_id.paragraphs[0]
        p_t.text = title
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = NAVY
        p_o = tf_id.add_paragraph()
        p_o.text = owner
        p_o.font.size = Pt(8.5)
        p_o.font.color.rgb = SLATE
        p_o.space_before = Pt(2)

        # 2. Middle Column: Curricular Concepts (width 4.1 in)
        tb_th = s8.shapes.add_textbox(Inches(3.75), Inches(cy + 0.12), Inches(4.2), Inches(1.0))
        tf_th = tb_th.text_frame
        tf_th.word_wrap = True
        tf_th.margin_top = tf_th.margin_bottom = tf_th.margin_left = tf_th.margin_right = 0
        p_h1 = tf_th.paragraphs[0]
        p_h1.text = "ACADEMIC CONCEPTS & THEORY"
        p_h1.font.bold = True
        p_h1.font.size = Pt(8)
        p_h1.font.color.rgb = SLATE
        p_b1 = tf_th.add_paragraph()
        p_b1.text = theory
        p_b1.font.size = Pt(8.5)
        p_b1.font.color.rgb = TEXT_DARK
        p_b1.space_before = Pt(2)

        # 3. Right Column: System Implementation (width 4.1 in)
        tb_im = s8.shapes.add_textbox(Inches(8.2), Inches(cy + 0.12), Inches(4.35), Inches(1.0))
        tf_im = tb_im.text_frame
        tf_im.word_wrap = True
        tf_im.margin_top = tf_im.margin_bottom = tf_im.margin_left = tf_im.margin_right = 0
        p_h2 = tf_im.paragraphs[0]
        p_h2.text = "SYSTEM IMPLEMENTATION & ARTIFACTS"
        p_h2.font.bold = True
        p_h2.font.size = Pt(8)
        p_h2.font.color.rgb = clr
        p_b2 = tf_im.add_paragraph()
        p_b2.text = impl
        p_b2.font.size = Pt(8.5)
        p_b2.font.color.rgb = TEXT_DARK
        p_b2.space_before = Pt(2)

    add_footer(s8)

    # ==========================================
    # SLIDE 9: KPI & Subject Contribution Matrix
    # ==========================================
    s9 = add_blank_slide()
    add_header(s9, "KEY PERFORMANCE INDICATORS  |  SUBJECT CONTRIBUTION MATRIX", "Percentage of each foundational course reflected in the project engines (Total = 100%)")

    contribs = [
        ("ENGINE 04", "Web Technologies", "30%", 0.30, "Vaibhav Chavanpatil (Roll 04)",
         "• Next.js 16 App Router & React 19 UI\n• REST API contracts & HTTP status codes\n• Server-side RBAC session guards\n• 5s polling state synchronization loop",
         "Responsive multi-role workspace & dispute console",
         "• REST API latency: p95 <= 500 ms\n• RBAC route checks: 100% coverage\n• Viewport compliance: 0 overflow",
         ACCENT_AMBER),
        ("ENGINE 01", "Operating Systems", "25%", 0.25, "Vaishnavi Modekar (Roll 21)",
         "• Finite State Machine lifecycle scheduling\n• KeyedMutex critical section locking\n• Automated 7-day watchdog timer\n• Concurrency race condition prevention",
         "Guarded escrow workflow & timeout preemption",
         "• Invalid transitions: 0 tolerated\n• Duplicate escrow locks: 0\n• Watchdog timeout: < 1.0s trigger",
         ACCENT_BLUE),
        ("ENGINE 03", "DBMS Engine", "25%", 0.25, "Purvi Sammatshetti (Roll 11)",
         "• Normalized BCNF relational schema\n• ACID rollback atomicity ($transaction)\n• Double-entry ledger invariant (ΔB = 0)\n• Tamper-resistant append-only audit",
         "ACID financial ledger & SQLite audit triggers",
         "• Duplicate releases: 0\n• Balance conservation: 100% (ΔB = 0)\n• Critical events audited: 100%",
         ACCENT_TEAL),
        ("ENGINE 02", "DSA & Algorithms / SE", "20%", 0.20, "Darshan Kittur (Roll 18)",
         "• Streaming SHA-256 deliverable digests\n• Hierarchical N-ary EvidenceTree\n• Heuristic Jaccard proposal tag matching\n• Bidirectional RTM & V&V testing pipelines",
         "Tamper-evident verification & causal dispute trees",
         "• Tamper detection: 100% (1-bit flip)\n• Tree traversal latency: <= 10 ms\n• Proposal match speed: <= 50 ms",
         ACCENT_PURPLE)
    ]

    col_w = 2.85
    col_gap = 0.244
    ch = 4.35  # Perfectly proportioned height eliminating bottom whitespace
    cy = 1.28
    for idx, (ebadge, sub, pct, pct_val, owner, concepts, contrib, kpis, clr) in enumerate(contribs):
        cx = 0.6 + idx * (col_w + col_gap)
        add_card(s9, cx, cy, col_w, ch)

        # Engine Pill
        b_box = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx + 0.16), Inches(cy + 0.16), Inches(1.10), Inches(0.28))
        b_box.fill.solid()
        b_box.fill.fore_color.rgb = clr
        b_box.line.color.rgb = clr
        b_box.text_frame.paragraphs[0].text = ebadge
        b_box.text_frame.paragraphs[0].font.bold = True
        b_box.text_frame.paragraphs[0].font.size = Pt(9.5)
        b_box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        b_box.text_frame.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)

        # Hero Percentage
        tb_pct = s9.shapes.add_textbox(Inches(cx + 0.15), Inches(cy + 0.46), Inches(col_w - 0.3), Inches(0.65))
        tf_pct = tb_pct.text_frame
        tf_pct.margin_top = tf_pct.margin_bottom = tf_pct.margin_left = tf_pct.margin_right = 0
        p_p = tf_pct.paragraphs[0]
        p_p.text = pct
        p_p.font.bold = True
        p_p.font.size = Pt(32)
        p_p.font.color.rgb = clr

        # Contribution Label
        p_pl = tf_pct.add_paragraph()
        p_pl.text = "CURRICULAR WEIGHT"
        p_pl.font.bold = True
        p_pl.font.size = Pt(7.5)
        p_pl.font.color.rgb = SLATE
        p_pl.space_before = Pt(1)

        # Visual Progress Bar (Track & Fill)
        bar_x = cx + 0.16
        bar_y = cy + 1.20
        bar_total_w = 2.53
        bar_h = 0.08
        track = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(bar_x), Inches(bar_y), Inches(bar_total_w), Inches(bar_h))
        track.fill.solid()
        track.fill.fore_color.rgb = RGBColor(226, 232, 240)
        track.line.fill.background()

        fill_w = bar_total_w * pct_val
        bar_fill = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(bar_x), Inches(bar_y), Inches(fill_w), Inches(bar_h))
        bar_fill.fill.solid()
        bar_fill.fill.fore_color.rgb = clr
        bar_fill.line.fill.background()

        # Content Textbox
        tb_c = s9.shapes.add_textbox(Inches(cx + 0.16), Inches(cy + 1.36), Inches(col_w - 0.32), Inches(2.90))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        tf_c.margin_top = tf_c.margin_bottom = tf_c.margin_left = tf_c.margin_right = 0

        # Title & Owner
        p_t = tf_c.paragraphs[0]
        p_t.text = sub
        p_t.font.bold = True
        p_t.font.size = Pt(11.5)
        p_t.font.color.rgb = NAVY

        p_o = tf_c.add_paragraph()
        p_o.text = owner
        p_o.font.bold = True
        p_o.font.size = Pt(8.5)
        p_o.font.color.rgb = clr
        p_o.space_before = Pt(1)

        # Curricular Scope
        p_ch = tf_c.add_paragraph()
        p_ch.text = "CURRICULAR CONCEPTS"
        p_ch.font.bold = True
        p_ch.font.size = Pt(7.5)
        p_ch.font.color.rgb = SLATE
        p_ch.space_before = Pt(5)

        p_cb = tf_c.add_paragraph()
        p_cb.text = concepts
        p_cb.font.size = Pt(8)
        p_cb.font.color.rgb = TEXT_DARK
        p_cb.space_before = Pt(1)

        # Key Contribution
        p_rh = tf_c.add_paragraph()
        p_rh.text = "ARCHITECTURAL ROLE"
        p_rh.font.bold = True
        p_rh.font.size = Pt(7.5)
        p_rh.font.color.rgb = SLATE
        p_rh.space_before = Pt(5)

        p_rb = tf_c.add_paragraph()
        p_rb.text = contrib
        p_rb.font.size = Pt(8)
        p_rb.font.color.rgb = NAVY
        p_rb.space_before = Pt(1)

        # KPI Benchmarks
        p_kh = tf_c.add_paragraph()
        p_kh.text = "KPI BENCHMARKS"
        p_kh.font.bold = True
        p_kh.font.size = Pt(7.5)
        p_kh.font.color.rgb = clr
        p_kh.space_before = Pt(5)

        p_kb = tf_c.add_paragraph()
        p_kb.text = kpis
        p_kb.font.size = Pt(8)
        p_kb.font.color.rgb = TEXT_DARK
        p_kb.space_before = Pt(1)

    # -------------------------------------------------------------
    # Bottom Horizontal Stacked Contribution Bar (Total: 100%)
    # -------------------------------------------------------------
    bar_y = 5.78
    bar_h = 0.44
    bar_total_w = 12.133
    bar_segments = [
        ("Web Technologies (30%)", 0.30, ACCENT_AMBER),
        ("Operating Systems (25%)", 0.25, ACCENT_BLUE),
        ("Database Systems (25%)", 0.25, ACCENT_TEAL),
        ("DSA & SE (20%)", 0.20, ACCENT_PURPLE),
    ]

    bx = 0.60
    for label, fraction, color in bar_segments:
        seg_w = bar_total_w * fraction
        seg = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(bx), Inches(bar_y), Inches(seg_w), Inches(bar_h))
        seg.fill.solid()
        seg.fill.fore_color.rgb = color
        seg.line.fill.background()

        p_seg = seg.text_frame.paragraphs[0]
        p_seg.text = label
        p_seg.alignment = PP_ALIGN.CENTER
        p_seg.font.bold = True
        p_seg.font.size = Pt(10)
        p_seg.font.color.rgb = RGBColor(255, 255, 255)

        bx += seg_w

    # Caption beneath bar
    tb_cap = s9.shapes.add_textbox(Inches(0.60), Inches(6.30), Inches(12.133), Inches(0.35))
    p_cap = tb_cap.text_frame.paragraphs[0]
    p_cap.text = "100% Curricular Scope Balanced Across Four Dedicated Engineering Owners"
    p_cap.alignment = PP_ALIGN.CENTER
    p_cap.font.size = Pt(8.5)
    p_cap.font.bold = True
    p_cap.font.color.rgb = SLATE

    add_footer(s9)

    # ==========================================
    # SLIDE 10: Gate 1 Divider
    # ==========================================
    s10 = add_blank_slide()
    # Top Accent Line
    acc10 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.16))
    acc10.fill.solid()
    acc10.fill.fore_color.rgb = NAVY
    acc10.line.fill.background()

    # College Logo Top Right
    if os.path.exists(LOGO_PATH):
        s10.shapes.add_picture(LOGO_PATH, left=LOGO_LEFT, top=LOGO_TOP, width=LOGO_WIDTH, height=LOGO_HEIGHT)

    top_bar = s10.shapes.add_textbox(Inches(0.6), Inches(0.4), Inches(8.6), Inches(0.4))
    top_bar.text_frame.paragraphs[0].text = "MINI PROJECT REPORT  |  FOUNDATION INTEGRATION COURSE"
    top_bar.text_frame.paragraphs[0].font.size = Pt(12.5)
    top_bar.text_frame.paragraphs[0].font.bold = True
    top_bar.text_frame.paragraphs[0].font.color.rgb = NAVY

    title_box = s10.shapes.add_textbox(Inches(0.6), Inches(1.5), Inches(12.133), Inches(1.4))
    p = title_box.text_frame.paragraphs[0]
    p.text = "Milestone-Based Escrow & Dispute Resolution Workflow"
    p.alignment = PP_ALIGN.CENTER
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = NAVY
    p_sub = title_box.text_frame.add_paragraph()
    p_sub.text = "STAGE S1 | GATE 1 — Requirements Analysis & Specification"
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.font.size = Pt(17)
    p_sub.font.bold = True
    p_sub.font.color.rgb = ACCENT_TEAL

    card_gate1 = add_card(s10, 1.2, 3.4, 10.933, 2.9)
    tb_g1 = s10.shapes.add_textbox(Inches(1.5), Inches(3.6), Inches(10.333), Inches(2.5))
    tf_g1 = tb_g1.text_frame
    p = tf_g1.paragraphs[0]
    p.text = "SUBMITTED BY  |  Team No. 07  |  Theme No. 01"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = NAVY

    p_tm = tf_g1.add_paragraph()
    p_tm.text = "Vaibhav Chavanpatil (02FE24BCS013, Roll 04)  •  Purvi Sammatshetti (02FE24BCS022, Roll 11)\nDarshan Kittur (02FE24BCS053, Roll 18)  •  Vaishnavi Modekar (02FE24BCS060, Roll 21)"
    p_tm.font.size = Pt(11)
    p_tm.font.color.rgb = TEXT_DARK
    p_tm.space_before = Pt(8)

    p_gd = tf_g1.add_paragraph()
    p_gd.text = "PROJECT GUIDE:  Dr. Niranjan Muchandi  |  School of CSE, KLE Technological University"
    p_gd.font.bold = True
    p_gd.font.size = Pt(11.5)
    p_gd.font.color.rgb = NAVY
    p_gd.space_before = Pt(10)

    p_f = tf_g1.add_paragraph()
    p_f.text = "Stage S1 Requirements Baseline Frozen in Git: 2026-10-02 22:40:28 +0530 (Commit 926869b)"
    p_f.font.size = Pt(10)
    p_f.font.color.rgb = ACCENT_PURPLE
    p_f.space_before = Pt(8)

    add_footer(s10, "Department of Computer Science and Engineering  |  Academic Year 2026-27")

    # ==========================================
    # SLIDE 11: Gate 1 Deliverables Checklist
    # ==========================================
    s11 = add_blank_slide()
    add_header(s11, "GATE 1  |  DELIVERABLES / EVIDENCE CHECKLIST", "Stage S1: Requirements Analysis & Specification  |  KLE Tech Evaluation Baseline")
    headers_s11 = ["#", "Deliverable / Evidence Item", "Covered On", "Submitted (Y/N)", "Date Verified", "Verified By"]
    rows_s11 = [
        ["1", "Functional Requirements Document (FRD)", "Slides 13, 20, 27, 34", "Y", "2026-10-02", "Team 07 & Guide"],
        ["2", "Use Cases & User Stories", "Slides 14, 21, 28, 35", "Y", "2026-10-02", "Team 07 & Guide"],
        ["3", "KPIs & Success Metrics", "Slides 15, 22, 29, 36", "Y", "2026-10-02", "Team 07 & Guide"],
        ["4", "Data Requirements & Constraints", "Slides 16, 23, 30, 37", "Y", "2026-10-02", "Team 07 & Guide"],
        ["5", "Engine Mapping: Four Engines", "Slides 12, 17, 24, 31, 38", "Y", "2026-10-02", "Team 07 & Guide"],
        ["6", "Prioritized Requirement List", "Slides 18, 25, 32, 39, 41", "Y", "2026-10-02", "Team 07 & Guide"],
        ["7", "Dated Evidence Before Gate 2", "Slides 19, 26, 33, 40", "Y", "2026-10-02 (Commit 926869b)", "Team 07 & Guide"]
    ]
    add_table(s11, 0.6, 1.2, 12.133, 4.8, headers_s11, rows_s11, col_widths=[0.6, 4.2, 2.5, 1.4, 1.9, 1.533])

    tb_note = s11.shapes.add_textbox(Inches(0.6), Inches(6.25), Inches(12.133), Inches(0.4))
    p = tb_note.text_frame.paragraphs[0]
    p.text = "Each engine below follows these 7 items in order. All S1 evidence was cryptographically frozen on 2026-10-02 ahead of Gate 2."
    p.font.size = Pt(10)
    p.font.color.rgb = SLATE

    add_footer(s11)

    # ==========================================
    # SLIDE 12: Engine Mapping (Four Engines)
    # ==========================================
    s12 = add_blank_slide()
    add_header(s12, "ENGINE MAPPING  |  FOUR ENGINES", "Every Gate 1 requirement belongs to one owning engine")

    mapping_cards = [
        ("OS", "Escrow & State Scheduler", "Owner: Vaishnavi Modekar",
         "3 Requirements: FR-01, FR-02, FR-12",
         "• FSM state transitions & guards\n• KeyedMutex concurrency locks\n• 7-day review watchdog scheduler\n• Milestone process lifecycle",
         "Details: Slides 13 to 19", ACCENT_BLUE),
        ("DSA", "Verification & Evidence Engine", "Owner: Darshan Kittur",
         "3 Requirements: FR-03, FR-04, FR-11",
         "• Streaming SHA-256 deliverable digests\n• Hierarchical N-ary EvidenceTree\n• O(V+E) traversal <= 10 ms\n• Jaccard proposal tag matching",
         "Details: Slides 20 to 26", ACCENT_PURPLE),
        ("DBMS", "Transaction Ledger", "Owner: Purvi Sammatshetti",
         "2 Requirements: FR-05, FR-06",
         "• Normalized BCNF relational schema\n• ACID transactions (ΔB = 0)\n• Unique release reference locks\n• Append-only Merkle-Damgård audit",
         "Details: Slides 27 to 33", ACCENT_TEAL),
        ("WEB/CN", "Workflow Dashboard", "Owner: Vaibhav Chavanpatil",
         "4 Requirements: FR-07, FR-08, FR-09, FR-10",
         "• Server-side RBAC on 100% routes\n• Multi-role React 19 dashboards\n• Dispute submission & reviewer UI\n• 5s polling state synchronization",
         "Details: Slides 34 to 40", ACCENT_AMBER)
    ]
    for i, (badge, ename, owner, reqs, mapping, d_slide, clr) in enumerate(mapping_cards):
        cx = 0.6 + i * (card_w + gap)
        add_card(s12, cx, 1.2, card_w, 5.5)

        b_box = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx + 0.15), Inches(1.35), Inches(0.9), Inches(0.35))
        b_box.fill.solid()
        b_box.fill.fore_color.rgb = clr
        b_box.line.color.rgb = clr
        b_box.text_frame.paragraphs[0].text = badge
        b_box.text_frame.paragraphs[0].font.bold = True
        b_box.text_frame.paragraphs[0].font.size = Pt(11)
        b_box.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        b_box.text_frame.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)

        tb = s12.shapes.add_textbox(Inches(cx + 0.15), Inches(1.8), Inches(card_w - 0.3), Inches(4.7))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = ename
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = NAVY

        p_o = tf.add_paragraph()
        p_o.text = owner
        p_o.font.size = Pt(9)
        p_o.font.bold = True
        p_o.font.color.rgb = clr
        p_o.space_before = Pt(2)

        p_r = tf.add_paragraph()
        p_r.text = "REQUIREMENTS DEFINED"
        p_r.font.size = Pt(8.5)
        p_r.font.bold = True
        p_r.font.color.rgb = SLATE
        p_r.space_before = Pt(8)

        p_rc = tf.add_paragraph()
        p_rc.text = reqs
        p_rc.font.size = Pt(9.5)
        p_rc.font.bold = True
        p_rc.font.color.rgb = TEXT_DARK
        p_rc.space_before = Pt(2)

        p_km = tf.add_paragraph()
        p_km.text = "KEY MAPPINGS"
        p_km.font.size = Pt(8.5)
        p_km.font.bold = True
        p_km.font.color.rgb = SLATE
        p_km.space_before = Pt(8)

        p_map = tf.add_paragraph()
        p_map.text = mapping
        p_map.font.size = Pt(9)
        p_map.font.color.rgb = TEXT_DARK
        p_map.space_before = Pt(2)

        p_det = tf.add_paragraph()
        p_det.text = d_slide
        p_det.font.size = Pt(9)
        p_det.font.bold = True
        p_det.font.color.rgb = NAVY
        p_det.space_before = Pt(12)

    add_footer(s12)

    # ==========================================
    # REUSABLE ENGINE 7-DELIVERABLE BUILDER
    # ==========================================
    def build_engine_7_deliverables(eid, ename, owner, d1_rows, d2_stories, d2_flow, d3_kpis, d4_data, d4_constraints, d5_rows, d6_rows, d7_rows, badge_clr):
        # 1. FRD
        s_d1 = add_blank_slide()
        add_header(s_d1, f"{eid}  |  {ename.upper()}", f"Owner: {owner}  |  Deliverable 1: Functional Requirements Document (FRD)", badge=1)
        headers_d1 = ["ID", "Functional Requirement", "Rationale"]
        add_table(s_d1, 0.6, 1.2, 12.133, 5.2, headers_d1, d1_rows, col_widths=[1.4, 7.233, 3.5])
        add_footer(s_d1)

        # 2. Use Cases & User Stories
        s_d2 = add_blank_slide()
        add_header(s_d2, f"{eid}  |  {ename.upper()}", f"Owner: {owner}  |  Deliverable 2: Use Cases & User Stories", badge=2)
        for idx, story in enumerate(d2_stories):
            cy = 1.2 + idx * 1.35
            add_card(s_d2, 0.6, cy, 12.133, 1.15)
            nb = s_d2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(cy + 0.35), Inches(0.4), Inches(0.4))
            nb.fill.solid()
            nb.fill.fore_color.rgb = badge_clr
            nb.line.color.rgb = badge_clr
            nb.text_frame.paragraphs[0].text = str(idx + 1)
            nb.text_frame.paragraphs[0].font.bold = True
            nb.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
            nb.text_frame.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)

            tb_st = s_d2.shapes.add_textbox(Inches(1.35), Inches(cy + 0.2), Inches(11.1), Inches(0.8))
            p = tb_st.text_frame.paragraphs[0]
            p.text = story
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_DARK

        add_card(s_d2, 0.6, 5.4, 12.133, 1.35, bg_clr=RGBColor(241, 245, 249))
        tb_flow = s_d2.shapes.add_textbox(Inches(0.8), Inches(5.45), Inches(11.7), Inches(1.2))
        tf_flow = tb_flow.text_frame
        p = tf_flow.paragraphs[0]
        p.text = "MAIN USE CASE FLOW"
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = SLATE
        p_fl = tf_flow.add_paragraph()
        p_fl.text = d2_flow
        p_fl.font.bold = True
        p_fl.font.size = Pt(12)
        p_fl.font.color.rgb = NAVY
        p_fl.space_before = Pt(6)
        add_footer(s_d2)

        # 3. KPIs & Success Metrics
        s_d3 = add_blank_slide()
        add_header(s_d3, f"{eid}  |  {ename.upper()}", f"Owner: {owner}  |  Deliverable 3: KPIs & Success Metrics", badge=3)
        add_kpi_cards(s_d3, 0.6, 1.4, 12.133, 5.0, d3_kpis)
        add_footer(s_d3)

        # 4. Data Requirements & Constraints
        s_d4 = add_blank_slide()
        add_header(s_d4, f"{eid}  |  {ename.upper()}", f"Owner: {owner}  |  Deliverable 4: Data Requirements & Constraints", badge=4)
        add_card(s_d4, 0.6, 1.2, 5.8, 5.4)
        tb_d4_l = s_d4.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(5.4), Inches(5.0))
        tf_d4_l = tb_d4_l.text_frame
        p = tf_d4_l.paragraphs[0]
        p.text = "DATA REQUIREMENTS"
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = NAVY
        for idx, item in enumerate(d4_data):
            p_item = tf_d4_l.add_paragraph()
            p_item.text = f"{idx+1}.  {item}"
            p_item.font.size = Pt(9.5)
            p_item.font.color.rgb = TEXT_DARK
            p_item.space_before = Pt(8)

        add_card(s_d4, 6.9, 1.2, 5.8, 5.4)
        tb_d4_r = s_d4.shapes.add_textbox(Inches(7.1), Inches(1.35), Inches(5.4), Inches(5.0))
        tf_d4_r = tb_d4_r.text_frame
        p = tf_d4_r.paragraphs[0]
        p.text = "CONSTRAINTS"
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = ACCENT_RED
        for idx, item in enumerate(d4_constraints):
            p_item = tf_d4_r.add_paragraph()
            p_item.text = f"{idx+1}.  {item}"
            p_item.font.size = Pt(9.5)
            p_item.font.color.rgb = TEXT_DARK
            p_item.space_before = Pt(8)
        add_footer(s_d4)

        # 5. Engine Mapping
        s_d5 = add_blank_slide()
        add_header(s_d5, f"{eid}  |  {ename.upper()}", f"Owner: {owner}  |  Deliverable 5: Engine Mapping", badge=5)
        headers_d5 = ["Req ID", "Engine Topic", "Subject", "Integrates With"]
        add_table(s_d5, 0.6, 1.2, 12.133, 5.2, headers_d5, d5_rows, col_widths=[1.5, 3.2, 2.5, 4.933])
        add_footer(s_d5)

        # 6. Prioritized Requirement List
        s_d6 = add_blank_slide()
        add_header(s_d6, f"{eid}  |  {ename.upper()}", f"Owner: {owner}  |  Deliverable 6: Prioritized Requirement List", badge=6)
        headers_d6 = ["Rank", "ID", "Requirement", "Priority"]
        add_table(s_d6, 0.6, 1.2, 12.133, 4.8, headers_d6, d6_rows, col_widths=[0.9, 1.5, 7.5, 2.233])
        tb_note = s_d6.shapes.add_textbox(Inches(0.6), Inches(6.25), Inches(12.133), Inches(0.4))
        p = tb_note.text_frame.paragraphs[0]
        p.text = "Ranked by priority: all Must-have requirements first, followed by Should-have and Could-have."
        p.font.size = Pt(10)
        p.font.color.rgb = SLATE
        add_footer(s_d6)

        # 7. Dated Evidence Before Gate 2
        s_d7 = add_blank_slide()
        add_header(s_d7, f"{eid}  |  {ename.upper()}", f"Owner: {owner}  |  Deliverable 7: Dated Evidence Before Gate 2", badge=7)
        headers_d7 = ["Evidence Item", "Slide", "Date Prepared", "Status"]
        add_table(s_d7, 0.6, 1.2, 12.133, 4.8, headers_d7, d7_rows, col_widths=[3.8, 1.8, 2.8, 3.733])
        tb_note = s_d7.shapes.add_textbox(Inches(0.6), Inches(6.25), Inches(12.133), Inches(0.4))
        p = tb_note.text_frame.paragraphs[0]
        p.text = "Dates demonstrate that all requirements baseline evidence was cryptographically frozen before Gate 2 architecture commenced."
        p.font.size = Pt(10)
        p.font.color.rgb = SLATE
        add_footer(s_d7)

    # ==========================================
    # SLIDES 13-19: Engine 01 (OS)
    # ==========================================
    e1_d1 = [
        ["FR-01", "Lock the agreed simulated escrow budget once the contract is confirmed by the client.", "Ensures controlled escrow allocation and eliminates duplicate fund locking."],
        ["FR-02", "Enforce permitted milestone-state transitions and deterministically reject invalid transitions.", "Guarantees reliable, sequential workflow progression without illegal state skips."],
        ["FR-12", "Coordinate valid contract lifecycle states and enforce 7-day client review watchdog timer.", "Prevents client abandonment and freelancer starvation by auto-escalating idle milestones."]
    ]
    e1_d2_stories = [
        "As a Client, I want my simulated deposit locked atomically upon contract confirmation so that project funds are guaranteed before work starts.",
        "As a Freelancer, I want the system to enforce sequential milestone transitions so that work cannot be rejected after being formally approved.",
        "As a Freelancer, I want an automated 7-day review watchdog timer so that my funds are not frozen indefinitely if a client abandons the review."
    ]
    e1_d2_flow = "Contract Confirmed  →  Escrow Locked (FUNDED)  →  Work Started (IN_PROGRESS)  →  Submitted (UNDER_REVIEW)  →  Approved (RELEASED) / Timeout"
    e1_d3_kpis = [
        ("Invalid Transitions", "0", "FSM model checker fuzzer", ACCENT_BLUE),
        ("Duplicate Escrow Locks", "0", "Concurrent lock simulation", ACCENT_BLUE),
        ("Watchdog Timeout", "< 1.0s", "Mock-clock timer harness", ACCENT_TEAL),
        ("State Events Logged", "100%", "Transition audit trace", ACCENT_PURPLE)
    ]
    e1_d4_data = [
        "Contract Lifecycle State: contract ID, client ID, freelancer ID, total budget, state (DRAFT, CONFIRMED, COMPLETED, CANCELLED)",
        "Milestone Process State: milestone ID, contract ID, amount, sequence order, deadline, status (AWAITING_DEPOSIT, FUNDED, IN_PROGRESS, UNDER_REVIEW, DISPUTED, RELEASED, REFUNDED)",
        "Watchdog Timer Record: milestone ID, submitted at timestamp, review deadline (timestamp + 7 calendar days)",
        "State Transition Audit Context: transition ID, entity ID, previous state, target state, actor UUID, timestamp"
    ]
    e1_d4_constraints = [
        "Exactly one active escrow lock permitted per confirmed contract (no double allocation)",
        "Milestone terminal states (RELEASED, REFUNDED) have zero outgoing transitions (immutable)",
        "State transitions require valid caller authorization and positive precondition assertions",
        "The 7-day review watchdog must execute automatically even if the client remains offline"
    ]
    e1_d5_rows = [
        ["FR-01", "Mutual exclusion & lock allocation", "Operating Systems", "DBMS: funds debited in ledger; Web: shows lock status"],
        ["FR-02", "Deterministic state scheduling (FSM)", "Operating Systems", "Web: drives progress bar; DBMS: stores transition record"],
        ["FR-12", "Timer interrupts & watchdog preemption", "Operating Systems", "Web: displays countdown; DBMS: triggers auto-escalation"]
    ]
    e1_d6_rows = [
        ["1", "FR-01", "Lock agreed simulated escrow budget upon contract confirmation", "Must Have (P0)"],
        ["2", "FR-02", "Guarded milestone state transitions rejecting invalid mutations", "Must Have (P0)"],
        ["3", "FR-12", "Contract lifecycle governance & 7-day review watchdog timer", "Must Have (P0)"],
        ["4", "NFR-05", "Zero invalid state transitions accepted across FSM test matrix", "Must Have (P0)"]
    ]
    e1_d7_rows = [
        ["Functional Requirements Document (FRD)", "Slide 13", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Use Cases & User Stories", "Slide 14", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["KPIs & Success Metrics", "Slide 15", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Data Requirements & Constraints", "Slide 16", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Engine Mapping & Curricular Interfaces", "Slide 17", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Prioritized Requirement List", "Slide 18", "2026-10-02", "Frozen in Git (Commit 926869b)"]
    ]
    build_engine_7_deliverables(
        "ENGINE 01", "Escrow & State Scheduler", "Vaishnavi Modekar (02FE24BCS060)",
        e1_d1, e1_d2_stories, e1_d2_flow, e1_d3_kpis, e1_d4_data, e1_d4_constraints, e1_d5_rows, e1_d6_rows, e1_d7_rows, ACCENT_BLUE
    )

    # ==========================================
    # SLIDES 20-26: Engine 02 (DSA & SE)
    # ==========================================
    e2_d1 = [
        ["FR-03", "Generate and verify a streaming SHA-256 checksum for each submitted deliverable file.", "Detects changed, corrupted, or tampered deliverables at bit-level resolution."],
        ["FR-04", "Associate dispute evidence with milestones and index references in an in-memory Evidence Tree.", "Provides traceable, causal evidence hierarchies for human dispute arbitration."],
        ["FR-11", "Compute heuristic semantic match scores between project skill tags and developer profile tags.", "Enables objective compatibility scoring during proposal bidding (Decision D-01)."]
    ]
    e2_d2_stories = [
        "As a Freelancer, I want a SHA-256 cryptographic checksum computed on upload so I have tamper-proof evidence of what I submitted.",
        "As a Dispute Reviewer, I want evidence organized into an in-memory hierarchical tree so I can trace causal revisions and rejections.",
        "As a Client, I want proposals scored against project skill tags using Jaccard similarity so I can identify the most qualified freelancers."
    ]
    e2_d2_flow = "Deliverable Uploaded  →  SHA-256 Hash Streamed  →  Digest Stored  →  Verified on Review  →  Indexed into EvidenceTree on Dispute"
    e2_d3_kpis = [
        ("Tamper Detection", "100%", "1-bit flip automated file suite", ACCENT_PURPLE),
        ("EvidenceTree Latency", "<= 10 ms", "DFS/BFS traversal (50 nodes)", ACCENT_PURPLE),
        ("Proposal Match Speed", "<= 50 ms", "Jaccard benchmark (100 bids)", ACCENT_TEAL),
        ("Evidence Integrity", "100%", "Tree reference reconciliation", ACCENT_BLUE)
    ]
    e2_d4_data = [
        "Deliverable Digest Record: deliverable ID, milestone ID, SHA-256 hex string (64 characters), byte size, mime type, uploaded at",
        "Hierarchical Evidence Node: node ID, dispute ID, parent node ID, evidence type, artifact URL, hash digest, submitter UUID",
        "Proposal Match Vector: proposal ID, project skill tags, developer profile tags, Jaccard tag score, DevScore, composite rank",
        "RTM Mapping Tuples: requirement ID, source need, owning engine, design artifact reference, test suite identifier"
    ]
    e2_d4_constraints = [
        "Maximum file upload boundary capped at 50 MB to prevent memory-exhaustion denial of service",
        "Evidence tree must form an acyclic directed graph (DAG); circular evidence references strictly rejected",
        "Cryptographic comparison must be bit-for-bit exact; any mismatch halts milestone review immediately",
        "Proposal match scoring is deterministic and heuristic; no unvetted generative AI deliverable arbitration"
    ]
    e2_d5_rows = [
        ["FR-03", "Streaming SHA-256 cryptographic hashing", "Data Structures & Crypto", "Web: upload stream; DBMS: stores 64-char hex digest"],
        ["FR-04", "Hierarchical N-ary Evidence Tree", "Data Structures & Algorithms", "Web: arbiter console; OS: freezes funds on dispute"],
        ["FR-11", "Jaccard similarity & developer scoring", "Algorithms & Math", "Web: proposal ranking; DBMS: queries developer tags"]
    ]
    e2_d6_rows = [
        ["1", "FR-03", "Deliverable SHA-256 cryptographic verification", "Must Have (P0)"],
        ["2", "FR-04", "Hierarchical dispute evidence tree indexing", "Must Have (P0)"],
        ["3", "FR-11", "Heuristic proposal tag & DevScore matching", "Could Have (P2)"],
        ["4", "NFR-03", "100% detection of altered deliverables via tampering set", "Must Have (P0)"]
    ]
    e2_d7_rows = [
        ["Functional Requirements Document (FRD)", "Slide 20", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Use Cases & User Stories", "Slide 21", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["KPIs & Success Metrics", "Slide 22", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Data Requirements & Constraints", "Slide 23", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Engine Mapping & Curricular Interfaces", "Slide 24", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Prioritized Requirement List", "Slide 25", "2026-10-02", "Frozen in Git (Commit 926869b)"]
    ]
    build_engine_7_deliverables(
        "ENGINE 02", "Verification & Evidence Engine", "Darshan Kittur (02FE24BCS053)",
        e2_d1, e2_d2_stories, e2_d2_flow, e2_d3_kpis, e2_d4_data, e2_d4_constraints, e2_d5_rows, e2_d6_rows, e2_d7_rows, ACCENT_PURPLE
    )

    # ==========================================
    # SLIDES 27-33: Engine 03 (DBMS)
    # ==========================================
    e3_d1 = [
        ["FR-05", "Process simulated milestone releases atomically under ACID principles; reject duplicate releases.", "Guarantees financial balance conservation (ΔB = 0) and eliminates double-spending."],
        ["FR-06", "Maintain an append-only, tamper-resistant audit history for all critical actions and state mutations.", "Ensures institutional accountability, non-repudiation, and verifiable event journals."]
    ]
    e3_d2_stories = [
        "As a Client, I want milestone payment release executed atomically so funds are never debited without crediting the developer.",
        "As a System Admin, I want duplicate payment releases rejected even under rapid clicking or concurrent requests.",
        "As an Auditor, I want an immutable audit trail showing who approved, disputed, or refunded every milestone."
    ]
    e3_d2_flow = "Approval Verified  →  ACID Tx Started  →  Escrow Debited  →  Freelancer Credited  →  Unique Lock Written  →  Audit Appended  →  Commit"
    e3_d3_kpis = [
        ("Duplicate Releases", "0", "50 concurrent release tests", ACCENT_TEAL),
        ("Balance Conservation", "100%", "Pre/post ledger invariant (ΔB = 0)", ACCENT_TEAL),
        ("Critical Events Audited", "100%", "System trace vs audit table", ACCENT_BLUE),
        ("Tx p95 Latency", "<= 200 ms", "Prisma transaction load benchmark", ACCENT_PURPLE)
    ]
    e3_d4_data = [
        "Escrow Ledger Entry: transaction ID, contract ID, milestone ID, payer UUID, payee UUID, amount (paise), tx type, status",
        "Append-Only Audit Record: log ID, sequence ID, actor UUID, entity name, entity ID, action verb, payload, timestamp, prev hash",
        "User Balance State: user ID, available balance (paise), locked escrow balance (paise), version tag",
        "Relational Foreign Keys: user -> contract -> milestone -> transaction -> audit log with ON DELETE RESTRICT"
    ]
    e3_d4_constraints = [
        "Normalized BCNF relations; all currency tracked as integer paise/cents to prevent IEEE 754 floating-point drift",
        "Milestone releases enforce a UNIQUE composite constraint on (milestoneId, transactionType = 'RELEASE')",
        "Database triggers reject all UPDATE and DELETE queries on audit_logs (BEFORE UPDATE/DELETE RAISE(ABORT))",
        "Prisma transactions wrap 7 operations atomically: read -> guard -> debit -> credit -> update -> insert ledger -> insert audit"
    ]
    e3_d5_rows = [
        ["FR-05", "ACID transactions & double-entry ledger", "DBMS", "OS: validates release state; Web: returns payment confirmation"],
        ["FR-06", "Append-only audit & Merkle-Damgård chaining", "DBMS", "Web: displays audit logs to Admin; OS: records timeout events"]
    ]
    e3_d6_rows = [
        ["1", "FR-05", "ACID milestone payment release & duplicate prevention", "Must Have (P0)"],
        ["2", "FR-06", "Append-only tamper-resistant audit journal", "Must Have (P0)"],
        ["3", "NFR-07", "ACID consistency & zero double-allocation anomalies", "Must Have (P0)"],
        ["4", "NFR-08", "100% critical state transitions recorded in audit", "Must Have (P0)"]
    ]
    e3_d7_rows = [
        ["Functional Requirements Document (FRD)", "Slide 27", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Use Cases & User Stories", "Slide 28", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["KPIs & Success Metrics", "Slide 29", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Data Requirements & Constraints", "Slide 30", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Engine Mapping & Curricular Interfaces", "Slide 31", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Prioritized Requirement List", "Slide 32", "2026-10-02", "Frozen in Git (Commit 926869b)"]
    ]
    build_engine_7_deliverables(
        "ENGINE 03", "Transaction Ledger", "Purvi Sammatshetti (02FE24BCS022)",
        e3_d1, e3_d2_stories, e3_d2_flow, e3_d3_kpis, e3_d4_data, e3_d4_constraints, e3_d5_rows, e3_d6_rows, e3_d7_rows, ACCENT_TEAL
    )

    # ==========================================
    # SLIDES 34-40: Engine 04 (Web Technology Frontend)
    # ==========================================
    e4_d1 = [
        ["FR-07", "Provide role-based responsive dashboards for Client, Freelancer, Reviewer, and Admin.", "Delivers role-appropriate workflow views, action controls, and visibility boundaries."],
        ["FR-08", "Authenticate users and enforce server-side least-privilege RBAC on protected endpoints.", "Prevents unauthorized access, IDOR vulnerabilities, and privilege escalation."],
        ["FR-09", "Support dispute intake, evidence attachment, and dispute status tracking.", "Provides a fair, structured, evidence-backed conflict resolution process."],
        ["FR-10", "Render current milestone and contract progress synchronized with backend state.", "Ensures real-time visibility across roles without local state invention."]
    ]
    e4_d2_stories = [
        "As a Client/Freelancer, I want a responsive dashboard that works on mobile and desktop without horizontal scroll.",
        "As a User, I want the system to block unauthorized API actions with HTTP 403 so malicious users cannot bypass UI controls.",
        "As a Dispute Reviewer, I want an adjudication console displaying evidence references side-by-side to make fair decisions."
    ]
    e4_d2_flow = "User Signs In  →  Token Validated  →  Role Dashboard Rendered  →  Action Executed  →  Poller Syncs State (<= 5s)"
    e4_d3_kpis = [
        ("RBAC Route Checks", "100%", "Negative automated route suite (401/403)", ACCENT_AMBER),
        ("REST API Latency", "<= 500 ms", "k6 load test (50 concurrent VUs)", ACCENT_AMBER),
        ("Viewport Compliance", "100%", "375px, 768px, 1280px+ audit (0 overflow)", ACCENT_TEAL),
        ("UI State Sync SLA", "<= 5.0 s", "Background polling verification", ACCENT_BLUE)
    ]
    e4_d4_data = [
        "User Session Payload: session ID, user ID, role claim (CLIENT, FREELANCER, REVIEWER, ADMIN), issued at, expires at",
        "Dispute Submission Form: dispute ID, contract ID, milestone ID, reason category, detailed statement, attached evidence URLs",
        "UI State Cache: active project list, milestone cards, review countdown timer, notification queue",
        "Client Error Envelope: error code, human-readable message, timestamp, request path, validation field errors"
    ]
    e4_d4_constraints = [
        "100% of incoming payloads validated via Zod 4 schemas before reaching business logic (NFR-04)",
        "Zero client-side trust: all role permissions and entity ownership validated server-side (NFR-02)",
        "Responsive viewports must support 375px (mobile), 768px (tablet), and 1280px+ (desktop) with 0 horizontal overflow",
        "UI state must strictly reflect confirmed database state; stale state triggers a warning after 15 seconds"
    ]
    e4_d5_rows = [
        ["FR-07", "Role-based component rendering", "Web Technologies", "Web/UI: displays permitted views; DBMS: queries profile"],
        ["FR-08", "Server-side RBAC & session verification", "Web / Networks", "Security: HTTP 401/403 guards; DBMS: checks role claims"],
        ["FR-09", "Dispute forms & reviewer console", "Web Technologies", "DSA: receives Evidence Tree; OS: freezes escrow state"],
        ["FR-10", "State-driven UI rendering & polling", "Web / Networks", "OS: reads FSM status; DBMS: fetches updated milestone row"]
    ]
    e4_d6_rows = [
        ["1", "FR-07", "Role-based responsive dashboard interfaces", "Must Have (P0)"],
        ["2", "FR-08", "Server-side authentication & least-privilege RBAC", "Must Have (P0)"],
        ["3", "FR-09", "Dispute intake & reviewer adjudication console", "Must Have (P0)"],
        ["4", "FR-10", "Real-time milestone progress display with 5s sync", "Must Have (P0)"]
    ]
    e4_d7_rows = [
        ["Functional Requirements Document (FRD)", "Slide 34", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Use Cases & User Stories", "Slide 35", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["KPIs & Success Metrics", "Slide 36", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Data Requirements & Constraints", "Slide 37", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Engine Mapping & Curricular Interfaces", "Slide 38", "2026-10-02", "Frozen in Git (Commit 926869b)"],
        ["Prioritized Requirement List", "Slide 39", "2026-10-02", "Frozen in Git (Commit 926869b)"]
    ]
    build_engine_7_deliverables(
        "ENGINE 04", "Workflow Dashboard", "Vaibhav Chavanpatil (02FE24BCS013)",
        e4_d1, e4_d2_stories, e4_d2_flow, e4_d3_kpis, e4_d4_data, e4_d4_constraints, e4_d5_rows, e4_d6_rows, e4_d7_rows, ACCENT_AMBER
    )

    # ==========================================
    # SLIDE 41: Prioritized Requirement List (All Engines)
    # ==========================================
    s41 = add_blank_slide()
    add_header(s41, "PRIORITIZED REQUIREMENT LIST  |  ALL ENGINES", "MoSCoW Prioritization Across the Four Engineering Engines")
    headers_s41 = ["Priority", "OS (Engine 01)", "DSA (Engine 02)", "DBMS (Engine 03)", "Web (Engine 04)"]
    rows_s41 = [
        [
            "MUST HAVE\n(P0)",
            "• Escrow lock (FR-01)\n• Sequential FSM (FR-02)\n• 7d watchdog timer (FR-12)\n• Zero invalid states",
            "• SHA-256 digests (FR-03)\n• Evidence Tree (FR-04)\n• 100% tamper detection\n• Acyclic dispute graph",
            "• ACID releases (FR-05)\n• Append-only audit (FR-06)\n• Zero duplicate releases\n• Balance conservation",
            "• Multi-role UI (FR-07)\n• Server RBAC (FR-08)\n• Dispute console (FR-09)\n• State sync (FR-10)"
        ],
        [
            "SHOULD HAVE\n(P1)",
            "• Mutex latency metrics\n• FSM state visualizer",
            "• Tree traversal <= 10ms\n• Stream hashing <= 50MB",
            "• SQLite busy retry loop\n• verifyAuditChain() script",
            "• Viewport mobile audit\n• SWR optimistic caching"
        ],
        [
            "COULD HAVE\n(P2)",
            "• Dynamic timeout adjustment",
            "• Heuristic tag matching (FR-11)",
            "• Indexed audit querying",
            "• PDF summary export"
        ]
    ]
    add_table(s41, 0.6, 1.2, 12.133, 4.8, headers_s41, rows_s41, col_widths=[1.5, 2.65, 2.65, 2.65, 2.683])

    tb_wont = s41.shapes.add_textbox(Inches(0.6), Inches(6.15), Inches(12.133), Inches(0.5))
    p = tb_wont.text_frame.paragraphs[0]
    p.text = "WON'T HAVE NOW (OUT OF SCOPE): Real-money banking gateways (Stripe/PayPal), legal court enforcement, native mobile applications, and autonomous AI dispute arbitration without human review."
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = ACCENT_RED

    add_footer(s41)

    # ==========================================
    # SLIDE 42: Assessment Rubric Self-Check
    # ==========================================
    s42 = add_blank_slide()
    add_header(s42, "ASSESSMENT RUBRIC  |  GATE 1 SELF-CHECK", "How our requirements baseline maps to the KLE Tech marking criteria (Target: 15 / 15 Marks)")
    headers_s42 = ["Criterion", "Marks", "Full-Marks Target", "Team 07 Compliance & Defense Evidence"]
    rows_s42 = [
        ["Requirements Completeness", "5", "All major requirements captured with clarity and rationale", "FR-01 through FR-12 defined with IEEE templates, inputs/outputs, error modes, and RBAC matrix"],
        ["Use Cases & Users", "3", "Use cases cover all key roles and scenarios", "8 Agile User Stories (US-01..08) & 5 Use Cases (UC-01..05) across Client, Freelancer, Reviewer, Admin"],
        ["KPIs & Metrics", "3", "Clear, measurable KPIs with targets defined", "16 quantifiable KPIs across 4 engines with explicit benchmarks (p95 <= 500ms, 0 duplicates, 100% tamper detection)"],
        ["Engine Mapping", "2", "Requirements mapped correctly to four engines", "4 foundational engines individually owned: OS (Vaishnavi), DSA/SE (Darshan), DBMS (Purvi), Web (Vaibhav)"],
        ["Timeliness of Evidence", "2", "All S1 evidence completed before Gate 2", "100% of S1 requirements frozen in Git commit 926869b dated 2026-10-02, strictly prior to Gate 2 architecture"],
        ["TOTAL", "15", "FULL MARKS BASELINE", "15 / 15 Fully Documented, Mathematically Bounded, and Empirically Verifiable."]
    ]
    add_table(s42, 0.6, 1.2, 12.133, 5.2, headers_s42, rows_s42, col_widths=[2.4, 0.9, 3.8, 5.033])
    add_footer(s42)

    # ==========================================
    # SLIDE 43: Thank You Slide
    # ==========================================
    s43 = add_blank_slide()
    # Top Accent Line
    acc43 = s43.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.16))
    acc43.fill.solid()
    acc43.fill.fore_color.rgb = NAVY
    acc43.line.fill.background()

    # College Logo Top Right
    if os.path.exists(LOGO_PATH):
        s43.shapes.add_picture(LOGO_PATH, left=LOGO_LEFT, top=LOGO_TOP, width=LOGO_WIDTH, height=LOGO_HEIGHT)

    tb_ty = s43.shapes.add_textbox(Inches(0.6), Inches(1.5), Inches(12.133), Inches(1.2))
    p = tb_ty.text_frame.paragraphs[0]
    p.text = "THANK YOU"
    p.alignment = PP_ALIGN.CENTER
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = NAVY

    tb_proj = s43.shapes.add_textbox(Inches(0.6), Inches(2.7), Inches(12.133), Inches(0.8))
    p = tb_proj.text_frame.paragraphs[0]
    p.text = "Milestone-Based Escrow & Dispute Resolution Workflow"
    p.alignment = PP_ALIGN.CENTER
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = NAVY
    p2 = tb_proj.text_frame.add_paragraph()
    p2.text = "Team 07  •  Theme 01  •  Stage S1 Requirements Engineering Baseline"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.size = Pt(13)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(4)

    card_ty = add_card(s43, 2.0, 3.8, 9.333, 2.4)
    tb_names = s43.shapes.add_textbox(Inches(2.2), Inches(4.0), Inches(8.933), Inches(2.0))
    tf_n = tb_names.text_frame

    p = tf_n.paragraphs[0]
    p.text = "STUDENT CONTRIBUTORS"
    p.alignment = PP_ALIGN.CENTER
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = NAVY

    p_mem = tf_n.add_paragraph()
    p_mem.text = "Vaibhav Chavanpatil (02FE24BCS013, Roll 04)  •  Purvi Sammatshetti (02FE24BCS022, Roll 11)\nDarshan Kittur (02FE24BCS053, Roll 18)  •  Vaishnavi Modekar (02FE24BCS060, Roll 21)"
    p_mem.alignment = PP_ALIGN.CENTER
    p_mem.font.size = Pt(11)
    p_mem.font.color.rgb = TEXT_DARK
    p_mem.space_before = Pt(8)

    p_g = tf_n.add_paragraph()
    p_g.text = "GUIDE:  Dr. Niranjan Muchandi  |  School of CSE, KLE Technological University, Belagavi"
    p_g.alignment = PP_ALIGN.CENTER
    p_g.font.bold = True
    p_g.font.size = Pt(11)
    p_g.font.color.rgb = ACCENT_TEAL
    p_g.space_before = Pt(10)

    p_qa = tf_n.add_paragraph()
    p_qa.text = "Ready for Review Committee Questions & Evaluation"
    p_qa.alignment = PP_ALIGN.CENTER
    p_qa.font.bold = True
    p_qa.font.size = Pt(12)
    p_qa.font.color.rgb = NAVY
    p_qa.space_before = Pt(10)

    add_footer(s43, "Department of Computer Science and Engineering  |  Academic Year 2026-27")

    output_path = "docs/Team07_Gate1_Complete_Presentation.pptx"
    prs.save(output_path)
    print(f"Successfully generated {len(prs.slides)} slides to {output_path}")

    prs.save("docs/Team07_Gate1_ppt.pptx")
    print(f"Successfully updated docs/Team07_Gate1_ppt.pptx with all {len(prs.slides)} slides.")

if __name__ == "__main__":
    build_gate1_deck()
