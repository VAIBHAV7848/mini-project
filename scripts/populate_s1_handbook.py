#!/usr/bin/env python3
"""
Populate S1 Student Handbook for KLE Technological University
Team 07 (Theme 01) - Gate 1 Evaluation
"""

import os
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

HANDBOOK_PATH = "docs/S1_Student_Handbook (1).docx"
DIAGRAM_PATH = "assets/generated_diagrams/use_case_diagram.png"

def get_row_unique_cells(row):
    """Return distinct cells in a row, skipping merged duplicates."""
    seen = set()
    unique = []
    for c in row.cells:
        if c._tc not in seen:
            seen.add(c._tc)
            unique.append(c)
    return unique

def set_cell_content(cell, text, bold=False, font_size_pt=8.5, align=None, font_name="Calibri"):
    """Populate a cell cleanly while preserving cell formatting."""
    # Use first paragraph or add one if missing
    if len(cell.paragraphs) == 0:
        p = cell.add_paragraph()
    else:
        p = cell.paragraphs[0]
        p.text = ""

    # Remove extra paragraphs if any
    for extra_p in cell.paragraphs[1:]:
        p_elem = extra_p._p
        p_elem.getparent().remove(p_elem)

    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.05
    if align:
        p.alignment = align

    run = p.add_run(text)
    run.bold = bold
    if font_size_pt:
        run.font.size = Pt(font_size_pt)
    if font_name:
        run.font.name = font_name
    run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B) # slate-800

def populate_handbook():
    if not os.path.exists(HANDBOOK_PATH):
        raise FileNotFoundError(f"Handbook not found at {HANDBOOK_PATH}")

    doc = docx.Document(HANDBOOK_PATH)
    print(f"Loaded {HANDBOOK_PATH} with {len(doc.tables)} tables.")

    # ---------------------------------------------------------
    # TABLE 0: Common Team Information (5 rows x 2 cols)
    # ---------------------------------------------------------
    t0 = doc.tables[0]
    t0_data = [
        "Team 07 (Theme 01)",
        "Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow (GigaFlow)",
        "Faculty Guide, Department of Computer Science & Engineering, KLE Technological University",
        "October 23, 2026"
    ]
    for r_idx, val in enumerate(t0_data, start=1):
        set_cell_content(t0.rows[r_idx].cells[1], val, font_size_pt=9.5)
    print("Populated Table 0: Common Team Information")

    # ---------------------------------------------------------
    # TABLE 1: Student Roster (6 rows x 3 cols)
    # ---------------------------------------------------------
    t1 = doc.tables[1]
    students = [
        ("1", "02FE24BCS013", "Vaibhav Chavanpatil (Roll No: 04) — Lead & Web Engine Owner"),
        ("2", "02FE24BCS022", "Purvi Sammatshetti (Roll No: 11) — DBMS Ledger Engine Owner"),
        ("3", "02FE24BCS053", "Darshan Kittur (Roll No: 18) — DSA Evidence Engine Owner"),
        ("4", "02FE24BCS060", "Vaishnavi Modekar (Roll No: 21) — OS Escrow Scheduler Owner"),
        ("5", "[N/A — Approved 4-Member Team]", "[N/A — Approved KLE Tech 4-Member Team Decomposition]")
    ]
    for r_idx, (sl, srn, name) in enumerate(students, start=1):
        set_cell_content(t1.rows[r_idx].cells[0], sl, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(t1.rows[r_idx].cells[1], srn)
        set_cell_content(t1.rows[r_idx].cells[2], name)
    print("Populated Table 1: Student Roster")

    # ---------------------------------------------------------
    # TABLE 5: Proposed Engine Summary - Before Requirements (5 rows x 6 cols)
    # ---------------------------------------------------------
    t5 = doc.tables[5]
    engines_summary = [
        ("E1", "Escrow & State Scheduler", "Operating Systems",
         "Milestone lifecycle state transitions, race conditions during simultaneous deposit/cancellation, and unmonitored review timeout stagnation.",
         "This engine is responsible for deterministic Finite State Machine (FSM) transitions, KeyedMutex concurrency locking, and automated 7-day review watchdog scheduling.",
         "Vaishnavi Modekar (02FE24BCS060)"),
        ("E2", "Evidence & Quality Assurance Engine", "Data Structures & Algorithms, Software Engineering",
         "Unverifiable milestone deliverables, silent file tampering, lack of objective proof during disputes, and unweighted proposal-job mismatches.",
         "This engine is responsible for streaming SHA-256 deliverable checksum calculation, tamper-evident Merkle evidence tree indexing, bipartite heuristic proposal ranking, and RTM V&V.",
         "Darshan Kittur (02FE24BCS053)"),
        ("E3", "Transaction Ledger & Contract Manager", "Database Management Systems",
         "Double-spending anomalies, non-atomic financial mutations, inconsistent wallet balances, and unauditable dispute fund distributions.",
         "This engine is responsible for BCNF relational schema integrity, ACID transactional double-entry ledger bookkeeping, Cashfree payout reconciliation, and chained audit logging.",
         "Purvi Sammatshetti (02FE24BCS022)"),
        ("E4", "Role Dashboards & RBAC Enforcement", "Web Technologies, Computer Networks",
         "Cross-tenant data exposure, unauthorized privilege escalation between clients and freelancers, opaque dispute submission UX, and poor accessibility.",
         "This engine is responsible for multi-tenant role-based workspace interfaces (Client, Freelancer, Reviewer, Admin), ironclad server-side RBAC guards, and dispute filing workflows.",
         "Vaibhav Chavanpatil (02FE24BCS013)")
    ]
    for r_idx, (eid, ename, course, prob, resp, owner) in enumerate(engines_summary, start=1):
        row_cells = t5.rows[r_idx].cells
        set_cell_content(row_cells[0], eid, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[1], ename, bold=True)
        set_cell_content(row_cells[2], course)
        set_cell_content(row_cells[3], prob)
        set_cell_content(row_cells[4], resp)
        set_cell_content(row_cells[5], owner)
    print("Populated Table 5: Proposed Engine Summary")

    # ---------------------------------------------------------
    # TABLE 7: Evidence 1 - Functional Requirements (10 rows x 4 cols)
    # ---------------------------------------------------------
    t7 = doc.tables[7]
    fr_data = [
        ("FR-01", "User Authentication & RBAC Session Management: System shall authenticate users via cryptographically signed tokens and enforce role-based access across Client, Freelancer, Dispute Reviewer, and Admin personas.", "Mandatory", "S0-Need-01 (Identity & Role Isolation)"),
        ("FR-02", "Project Creation & Milestone Decomposition: System shall allow Clients to create project contracts and decompose deliverables into sequential milestones with defined scopes and budgets.", "Mandatory", "S0-Need-02 (Structured Work Contracts)"),
        ("FR-03", "Heuristic Proposal Submission & Compatibility Ranking: System shall allow Freelancers to submit proposals and compute a normalized compatibility score [0-100] based on skill vector overlap, budget proximity, and rating.", "Challenge", "S0-Need-03 (Bipartite Talent Matching)"),
        ("FR-04", "Simulated Escrow Funding & Atomic Allocation: System shall lock project milestone funds in an isolated simulated escrow wallet before milestone work execution commences.", "Mandatory", "S0-Need-04 (Counterparty Escrow Trust)"),
        ("FR-05", "Milestone Lifecycle Finite State Machine: System shall strictly govern milestone progression across valid lifecycle states: AWAITING_DEPOSIT -> FUNDED -> IN_PROGRESS -> UNDER_REVIEW -> RELEASED (or DISPUTED).", "Mandatory", "S0-Need-05 (Deterministic Milestone FSM)"),
        ("FR-06", "Cryptographic Deliverable Evidence Submission: System shall accept freelancer deliverable artifacts and compute streaming 256-bit SHA-256 checksums bound to an immutable evidence index.", "Mandatory", "S0-Need-06 (Tamper-Proof Evidence Submission)"),
        ("FR-07", "Client Review, Approval & Ledger Payout: System shall enable Clients to inspect deliverable evidence and execute milestone payout, triggering an atomic double-entry balance transfer to the Freelancer.", "Mandatory", "S0-Need-07 (Authorized Fund Release)"),
        ("FR-08", "Dispute Escalation & Escrow Asset Freezing: System shall allow either party to raise a dispute during the review window, immediately freezing escrowed funds and transferring jurisdiction to an Arbitrator.", "Mandatory", "S0-Need-08 (Dispute Escalation & Freeze)"),
        ("FR-09", "Human Dispute Arbitration & Multi-Party Settlement: System shall allow authorized Dispute Reviewers to inspect cryptographic evidence and render binding rulings (Release, Refund, or Split) committed atomically to the ledger.", "Mandatory", "S0-Need-09 (Impartial Arbitration Settlement)")
    ]
    for r_idx, (fid, desc, prio, src) in enumerate(fr_data, start=1):
        row_cells = t7.rows[r_idx].cells
        set_cell_content(row_cells[0], fid, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[1], desc)
        set_cell_content(row_cells[2], prio, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[3], src)
    print("Populated Table 7: Functional Requirements")

    # ---------------------------------------------------------
    # TABLE 8: Evidence 1 - Non-Functional Requirements (9 rows x 4 cols)
    # Row 8 is Reminder. Rows 1 to 7 are NFRs.
    # ---------------------------------------------------------
    t8 = doc.tables[8]
    nfr_data = [
        ("NFR-01", "Transaction Processing Latency: Milestone state transitions and double-entry ledger commits shall complete with p95 latency <= 200ms under concurrent simulated load.", "Performance", "<= 200ms at p95 across 100 concurrent ledger transactions"),
        ("NFR-02", "Cryptographic Deliverable Integrity: Deliverable file integrity verification shall utilize streaming SHA-256 hashing; single-bit deliverable modifications must be detected with 100% certainty.", "Security / Integrity", "100% detection of unauthorized deliverable tampering via SHA-256 digests"),
        ("NFR-03", "Role-Based Route Protection: All sensitive API route handlers and server actions shall enforce RBAC session tokens; zero unauthorized cross-role data access shall be permitted.", "Security", "100% unauthorized route access attempts rejected with HTTP 401/403"),
        ("NFR-04", "Concurrency & Race-Condition Prevention: Concurrent deposit, submission, approval, or dispute actions on the same milestone shall be serialized via KeyedMutex to prevent race conditions.", "Reliability", "Zero race conditions or double-spend allocations under 10 concurrent threads per milestone"),
        ("NFR-05", "Dashboard Responsiveness & Web Performance: Role dashboards shall render with First Contentful Paint (FCP) <= 1.5s and maintain WCAG 2.1 AA accessibility contrast compliance.", "Usability", "FCP <= 1.5s; 100% WCAG 2.1 AA contrast and keyboard accessibility compliance"),
        ("NFR-06", "Dispute Resolution Throughput & System Capacity: System shall sustain >= 50 concurrent active dispute arbitrations and >= 200 milestone state validations without ledger deadlock.", "Scalability", ">= 50 concurrent dispute reviews with 0 database deadlocks or timeouts"),
        ("NFR-07", "Audit Trail Immutability: Every state transition and financial journal mutation shall be written to an append-only audit log with SHA-256 previous-record cryptographic hash chaining.", "Auditability", "100% state transitions cryptographically chained; zero unlogged mutations")
    ]
    for r_idx, (nid, desc, cat, target) in enumerate(nfr_data, start=1):
        row_cells = t8.rows[r_idx].cells
        set_cell_content(row_cells[0], nid, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[1], desc)
        set_cell_content(row_cells[2], cat)
        set_cell_content(row_cells[3], target)
    print("Populated Table 8: Non-Functional Requirements")

    # ---------------------------------------------------------
    # TABLE 10: Evidence 2 - Use Cases / User Stories (12 rows x 5 cols)
    # Row 11 is Reminder. Rows 1 to 10 are UCs.
    # ---------------------------------------------------------
    t10 = doc.tables[10]
    uc_data = [
        ("UC-01", "Client / Freelancer", "User Authentication & Workspace Access: As a platform participant, I want to authenticate securely so that I access my authorized workspace dashboard.",
         "1. User submits credentials.\n2. Server verifies credentials & generates HMAC token.\n3. RBAC router directs user to persona workspace.",
         "Invalid credentials prompt HTTP 401 error; expired session forces re-authentication."),
        ("UC-02", "Client", "Project Posting & Milestone Decomposition: As a Client, I want to create a project contract partitioned into sequential funded milestones with defined deliverables.",
         "1. Client inputs project scope & budget.\n2. Client defines sequential milestones.\n3. System validates milestone budget sum equals project total.",
         "Mismatched milestone budgets reject submission with validation alert; empty milestone deliverables blocked."),
        ("UC-03", "Freelancer", "Heuristic Proposal Submission & Matching: As a Freelancer, I want to submit a bid on an open project and receive a compatibility score based on my skill tags.",
         "1. Freelancer reviews project requirements.\n2. Freelancer enters bid amount and proposal text.\n3. System computes normalized match score [0-100].",
         "Incomplete skill tags trigger fallback neutral score; duplicate proposals on the same project are rejected."),
        ("UC-04", "Client", "Escrow Milestone Funding: As a Client, I want to fund Milestone 1 into escrow so that the Freelancer has financial certainty before starting work.",
         "1. Client initiates funding.\n2. Engine 01 locks milestone mutex.\n3. Engine 03 verifies wallet balance & debits funds.\n4. Milestone state transitions to FUNDED.",
         "Insufficient wallet balance aborts deposit; concurrent funding attempts are rejected via mutex lock."),
        ("UC-05", "Freelancer", "Deliverable Submission & Evidence Checksum: As a Freelancer, I want to upload completed work artifacts so that a cryptographic SHA-256 digest is generated.",
         "1. Freelancer uploads artifact.\n2. Engine 02 computes streaming SHA-256 digest.\n3. Artifact digest is linked to evidence tree.\n4. Milestone state transitions to UNDER_REVIEW.",
         "Interrupted upload prompts resume; checksum calculation failure aborts submission with diagnostic message."),
        ("UC-06", "Client", "Deliverable Review & Milestone Approval: As a Client, I want to review deliverable evidence and approve release of escrowed milestone funds.",
         "1. Client inspects deliverable & checksum.\n2. Client clicks 'Approve Milestone'.\n3. Engine 01 validates FSM transition.\n4. Engine 03 executes atomic ledger transfer to Freelancer.",
         "Review deadline (> 7 days) expiration triggers automated watchdog auto-approval to prevent freelancer starvation."),
        ("UC-07", "Client / Freelancer", "Dispute Initiation & Escrow Freeze: As a participant, I want to dispute a milestone if work is non-conformant or unreviewed, freezing funds for arbitration.",
         "1. Disputant files dispute with rationale.\n2. Engine 01 transitions milestone to DISPUTED.\n3. Engine 03 freezes escrow funds.\n4. Dispute case registered for Reviewer.",
         "Dispute filed outside valid review window is rejected with HTTP 400 illegal transition error."),
        ("UC-08", "Dispute Reviewer", "Tamper-Proof Evidence Inspection: As a Reviewer, I want to inspect original deliverables, SHA-256 hashes, and communication logs to evaluate the dispute.",
         "1. Reviewer opens dispute case dossier.\n2. System renders deliverable checksums and contract spec.\n3. Reviewer verifies Merkle evidence integrity.",
         "Tampered deliverable flags cryptographic mismatch warning; missing documentation highlighted in dossier."),
        ("UC-09", "Dispute Reviewer", "Arbitration Ruling Execution: As a Reviewer, I want to render a binding settlement (Release, Refund, or Split) committed atomically to the financial ledger.",
         "1. Reviewer inputs binding decision and split ratio.\n2. Engine 03 executes two-phase commit ledger payout.\n3. Milestone transitions to RESOLVED.\n4. Audit log records ruling.",
         "Invalid settlement percentage (<0% or >100%) rejected; ledger transaction failure initiates atomic rollback."),
        ("UC-10", "System Admin", "Audit Trail Verification & Reconciliation: As an Admin, I want to verify the cryptographic chain of ledger records to detect any database tampering.",
         "1. Admin queries audit verification endpoint.\n2. System validates SHA-256 hash pointers across journal.\n3. System reports zero integrity anomalies.",
         "Broken hash pointer identifies exact mutated row ID; system generates high-priority cryptographic security alarm.")
    ]
    for r_idx, (uid, actor, story, main_f, exc_f) in enumerate(uc_data, start=1):
        row_cells = t10.rows[r_idx].cells
        set_cell_content(row_cells[0], uid, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[1], actor, bold=True)
        set_cell_content(row_cells[2], story)
        set_cell_content(row_cells[3], main_f)
        set_cell_content(row_cells[4], exc_f)
    print("Populated Table 10: Use Cases / User Stories")

    # ---------------------------------------------------------
    # TABLE 11: Use Case Diagram Placement (1 row x 1 col)
    # ---------------------------------------------------------
    t11 = doc.tables[11]
    cell11 = t11.rows[0].cells[0]
    p11 = cell11.paragraphs[0]
    p11.text = ""
    p11.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists(DIAGRAM_PATH):
        run11 = p11.add_run()
        run11.add_picture(DIAGRAM_PATH, width=Inches(6.2))
        cap_p = cell11.add_paragraph()
        cap_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap_run = cap_p.add_run("Figure 1: Comprehensive System Use Case Diagram — Actors, System Boundary, Core Use Cases & Relationships")
        cap_run.font.size = Pt(8.5)
        cap_run.font.italic = True
        cap_run.font.name = "Calibri"
        print("Populated Table 11: Inserted High-Resolution Use Case Diagram")
    else:
        set_cell_content(cell11, "Figure 1: Use Case Diagram — Client, Freelancer, Dispute Reviewer, Admin roles mapped across UC-01 to UC-10.")
        print("Populated Table 11: Text fallback (Diagram image missing)")

    # ---------------------------------------------------------
    # TABLE 13: Evidence 3 - Acceptance Criteria Sheet (14 rows x 3 cols)
    # Row 13 is Reminder. Rows 1 to 12 are Req criteria.
    # ---------------------------------------------------------
    t13 = doc.tables[13]
    ac_data = [
        ("FR-01", "Given valid credentials, system authenticates user, sets HMAC session token, and renders persona workspace in < 500ms; unauthorized roles receive HTTP 403.", "Automated integration test suite (tests/integration/auth-rbac.test.ts) verifying session issuance and route guards."),
        ("FR-02", "Project creation atomically persists project record and sequential milestones; sum of milestone budgets must strictly equal project total budget.", "Unit validation tests with Zod schemas and Prisma transactional database constraints."),
        ("FR-03", "Proposal submission calculates normalized compatibility score [0-100] based on skill vector overlap; ranking updates within 50ms of bid submission.", "Deterministic unit tests with mock proposals and benchmarked cosine/TF-IDF skill matching algorithms."),
        ("FR-04", "Escrow deposit locks exact milestone amount from client wallet balance; milestone state updates to FUNDED; zero double-spend under parallel requests.", "Concurrency stress test with 10 simultaneous deposit attempts verifying KeyedMutex serial isolation."),
        ("FR-05", "Milestone state machine allows only valid forward transitions; any out-of-order transition throws InvalidStateTransitionException with violation code.", "Exhaustive state transition matrix unit test (test-escrow-engine.ts) covering all valid and invalid permutations."),
        ("FR-06", "Uploaded deliverable file byte stream produces 256-bit SHA-256 digest; digest matches bitwise client file; hash recorded in tamper-evident evidence index.", "Cryptographic digest test comparing computed hash against known SHA-256 test vectors; single-bit perturbation detection."),
        ("FR-07", "Client approval transitions milestone to RELEASED; funds transferred from escrow pool to Freelancer wallet via balanced double-entry ledger journal.", "End-to-end integration test verifying zero-sum balance conservation before and after payout execution."),
        ("FR-08", "Dispute raised during review window transitions milestone to DISPUTED; funds are frozen; dispute ticket generated with OPEN status within 100ms.", "Dispute lifecycle integration test verifying mutex lock, asset freeze, and reviewer notification dispatch."),
        ("FR-09", "Reviewer ruling executes multi-party financial split atomically; escrow balance clears to 0.00; ledger records payout and audit journal commits.", "Two-phase commit transaction test simulating 50/50 and custom splits with atomic rollback on database failure."),
        ("NFR-01", "Milestone state transitions and ledger journal commits execute with p95 response time <= 200ms under 100 concurrent requests.", "Load test script (benchmark-load.ts) generating concurrent ledger operations with latency telemetry."),
        ("NFR-02", "Single-byte deliverable modification produces immediate checksum mismatch; Merkle evidence tree root invalidation flags tampering in < 10ms.", "Automated adversarial file corruption test modifying 1 byte and asserting cryptographic integrity failure."),
        ("NFR-03", "All protected API route handlers reject unauthenticated or improper-role requests with HTTP 401/403; zero cross-tenant IDOR vulnerability.", "Security regression suite testing matrix of 4 roles across all 18 backend endpoints.")
    ]
    for r_idx, (rid, crit, method) in enumerate(ac_data, start=1):
        row_cells = t13.rows[r_idx].cells
        set_cell_content(row_cells[0], rid, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[1], crit)
        set_cell_content(row_cells[2], method)
    print("Populated Table 13: Acceptance Criteria Sheet")

    # ---------------------------------------------------------
    # TABLE 15: Evidence 4 - Requirement Priority Table (14 rows x 4 cols)
    # Row 13 is Reminder. Rows 1 to 12 are Priorities.
    # ---------------------------------------------------------
    t15 = doc.tables[15]
    prio_data = [
        ("FR-01", "User Authentication & RBAC Session Management", "Mandatory", "Foundational security prerequisite; platform cannot enforce contract boundaries or financial permissions without verified user identity."),
        ("FR-02", "Project Creation & Milestone Decomposition", "Mandatory", "Core contract mechanism; milestones represent the atomic units of work, evidence verification, and financial escrow settlement."),
        ("FR-03", "Heuristic Proposal Submission & Compatibility Ranking", "Challenge", "Decision support enhancement; increases marketplace matching efficiency but core contract workflow can operate with manual bidding."),
        ("FR-04", "Simulated Escrow Funding & Atomic Allocation", "Mandatory", "Essential trust engine requirement; protects freelancers by guaranteeing that funds are deposited and locked prior to starting development."),
        ("FR-05", "Milestone Lifecycle Finite State Machine", "Mandatory", "Core OS-level state guarantee; prevents invalid lifecycle jumps, unauthorized payouts, and race conditions during simultaneous user actions."),
        ("FR-06", "Cryptographic Deliverable Evidence Submission", "Mandatory", "Non-repudiation foundation; ensures deliverable files cannot be altered, substituted, or repudiated retroactively during a dispute."),
        ("FR-07", "Client Review, Approval & Ledger Payout", "Mandatory", "Primary happy-path completion workflow; enables clients to release escrow funds to freelancers upon satisfactory deliverable verification."),
        ("FR-08", "Dispute Escalation & Escrow Asset Freezing", "Mandatory", "Critical safety mechanism; protects counterparties against contractual non-performance or bad faith by freezing assets until formal review."),
        ("FR-09", "Human Dispute Arbitration & Multi-Party Settlement", "Mandatory", "Impartial conflict resolution; human arbiters inspect cryptographic evidence and enforce binding financial settlements."),
        ("NFR-01", "Transaction Processing Latency <= 200ms", "Mandatory", "Ensures high responsiveness during financial ledger operations and prevents UI freezing during critical milestone updates."),
        ("NFR-02", "Cryptographic Deliverable Integrity (SHA-256)", "Mandatory", "Objective evidence verification is mandatory for defensible dispute arbitration and eliminates subjective he-said-she-said arguments."),
        ("NFR-03", "Strict Role-Based Access Control (RBAC)", "Mandatory", "Prevents privilege escalation and confidential proposal, financial, or dispute leakages across competing marketplace actors.")
    ]
    for r_idx, (rid, desc, prio, just) in enumerate(prio_data, start=1):
        row_cells = t15.rows[r_idx].cells
        set_cell_content(row_cells[0], rid, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[1], desc)
        set_cell_content(row_cells[2], prio, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[3], just)
    print("Populated Table 15: Requirement Priority Table")

    # ---------------------------------------------------------
    # TABLE 17: Evidence 5 - Requirements Traceability Matrix (14 rows x 6 cols)
    # Row 13 is Reminder. Rows 1 to 12 are RTM.
    # ---------------------------------------------------------
    t17 = doc.tables[17]
    rtm_data = [
        ("FR-01", "S0-Need-01 (Identity & Role Isolation)", "Engine 04 (Web / RBAC)", "S2-DES-01 (Session Token & RBAC Middleware)", "S6-TEST-01 (RBAC Integration Suite)", "Baseline Approved"),
        ("FR-02", "S0-Need-02 (Structured Work Contracts)", "Engine 03 (DBMS / Contracts)", "S2-DES-02 (Project & Milestone Schema)", "S6-TEST-02 (Contract Validation Tests)", "Baseline Approved"),
        ("FR-03", "S0-Need-03 (Bipartite Talent Matching)", "Engine 02 (DSA / Matching)", "S2-DES-03 (Heuristic Scoring Vector)", "S6-TEST-03 (Proposal Matcher Unit Tests)", "Stretch Baseline"),
        ("FR-04", "S0-Need-04 (Counterparty Escrow Trust)", "Engine 01 (OS / Escrow)", "S2-DES-04 (Escrow Mutex & Deposit FSM)", "S6-TEST-04 (Escrow Funding Concurrency)", "Baseline Approved"),
        ("FR-05", "S0-Need-05 (Deterministic Milestone FSM)", "Engine 01 (OS / Escrow)", "S2-DES-05 (Finite State Machine Validator)", "S6-TEST-05 (FSM Permutation Tests)", "Baseline Approved"),
        ("FR-06", "S0-Need-06 (Tamper-Proof Evidence Submission)", "Engine 02 (DSA / Evidence)", "S2-DES-06 (SHA-256 Streaming Hasher)", "S6-TEST-06 (Checksum Integrity Tests)", "Baseline Approved"),
        ("FR-07", "S0-Need-07 (Authorized Fund Release)", "Engine 03 (DBMS / Ledger)", "S2-DES-07 (ACID Payout Journal Routine)", "S6-TEST-07 (Ledger Payout Verification)", "Baseline Approved"),
        ("FR-08", "S0-Need-08 (Dispute Escalation & Freeze)", "Engine 01 (OS / Escrow)", "S2-DES-08 (Escrow Freeze & Case Trigger)", "S6-TEST-08 (Dispute Freeze Tests)", "Baseline Approved"),
        ("FR-09", "S0-Need-09 (Impartial Arbitration Settlement)", "Engine 03 (DBMS / Ledger)", "S2-DES-09 (Arbitration Payout Split Routine)", "S6-TEST-09 (Settlement Ledger Tests)", "Baseline Approved"),
        ("NFR-01", "S0-Need-10 (Sub-200ms Transaction Speed)", "Engine 03 (DBMS / Ledger)", "S2-DES-10 (Prisma ACID Transaction Indexes)", "S6-TEST-10 (Transaction Load Benchmark)", "Baseline Approved"),
        ("NFR-02", "S0-Need-11 (Bitwise Evidence Verification)", "Engine 02 (DSA / Evidence)", "S2-DES-11 (Merkle Evidence Tree & SHA-256)", "S6-TEST-11 (Cryptographic Corruption Test)", "Baseline Approved"),
        ("NFR-03", "S0-Need-12 (Zero Unauthorized Access)", "Engine 04 (Web / RBAC)", "S2-DES-12 (Next.js Route Middleware Guards)", "S6-TEST-12 (RBAC Security Matrix Tests)", "Baseline Approved")
    ]
    for r_idx, (rid, src, eng, des, tst, stat) in enumerate(rtm_data, start=1):
        row_cells = t17.rows[r_idx].cells
        set_cell_content(row_cells[0], rid, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[1], src)
        set_cell_content(row_cells[2], eng)
        set_cell_content(row_cells[3], des)
        set_cell_content(row_cells[4], tst)
        set_cell_content(row_cells[5], stat, align=WD_ALIGN_PARAGRAPH.CENTER)
    print("Populated Table 17: Requirements Traceability Matrix")

    # ---------------------------------------------------------
    # TABLE 19: Requirement Clustering Sheet (7 rows x 6 cols)
    # Row 6 is Reminder. Rows 1 to 5 are Clusters.
    # Notice columns: [0] Cluster ID, [1] Cluster Area, [2] Req IDs, [3] Technical Responsibility, [4] Engine, [5] Student Owner
    # ---------------------------------------------------------
    t19 = doc.tables[19]
    clusters = [
        ("C1", "State Synchronization & Concurrency Control", "FR-04, FR-05, FR-08, NFR-04",
         "Deterministic milestone lifecycle FSM enforcement, KeyedMutex concurrency locking per milestone, and review timeout watchdog scheduling.",
         "Engine 01 (OS Engine)", "Vaishnavi Modekar (02FE24BCS060)"),
        ("C2", "Cryptographic Verification & Evidence Indexing", "FR-03, FR-06, NFR-02",
         "Streaming SHA-256 deliverable checksum calculation, tamper-evident Merkle evidence tree construction, and bipartite heuristic proposal ranking.",
         "Engine 02 (DSA & SE Engine)", "Darshan Kittur (02FE24BCS053)"),
        ("C3", "Relational Ledger & ACID Financial Accounting", "FR-02, FR-07, FR-09, NFR-01, NFR-07",
         "BCNF relational schema management, double-entry transactional escrow ledger bookkeeping, Cashfree payout reconciliation, and chained audit logging.",
         "Engine 03 (DBMS Engine)", "Purvi Sammatshetti (02FE24BCS022)"),
        ("C4", "Multi-Tenant Workspace & Role-Based Security", "FR-01, NFR-03, NFR-05, NFR-06",
         "Role-based responsive dashboard rendering (Client, Freelancer, Reviewer, Admin), server-side RBAC session guarding, and dispute filing UX.",
         "Engine 04 (Web Technologies Engine)", "Vaibhav Chavanpatil (02FE24BCS013)"),
        ("C5", "Cross-Engine Orchestration & Dispute Protocol", "FR-07, FR-08, FR-09, NFR-04",
         "Inter-engine coordination for escrow asset freezing upon dispute trigger, review timeout auto-release, and arbitration ledger commits.",
         "Cross-Engine Integration", "Team 07 Collaborative")
    ]
    for r_idx, (cid, area, reqs, resp, eng, owner) in enumerate(clusters, start=1):
        row_cells = t19.rows[r_idx].cells
        set_cell_content(row_cells[0], cid, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_content(row_cells[1], area, bold=True)
        set_cell_content(row_cells[2], reqs)
        set_cell_content(row_cells[3], resp)
        set_cell_content(row_cells[4], eng)
        set_cell_content(row_cells[5], owner)
    print("Populated Table 19: Requirement Clustering Sheet")

    # ---------------------------------------------------------
    # TABLE 20: Engine Decomposition Matrix (6 rows x 11 cols)
    # Row 5 is Reminder. Rows 1 to 4 are Engines E1-E4.
    # ---------------------------------------------------------
    t20 = doc.tables[20]
    decomposition_data = [
        ("E1", "Escrow & State Scheduler", "C1 (State Synchronization)",
         "Deterministic lifecycle FSM enforcement, KeyedMutex concurrency locking, and 7-day review watchdog scheduler.",
         "State transition directives (DEPOSIT, SUBMIT, APPROVE, DISPUTE), timer tick events.",
         "Validated state mutations, transition rejection error codes, timeout release triggers.",
         "Milestone lifecycle state, KeyedMutex lock registry, active review countdown timers.",
         "Mealy Finite State Machine validator, per-milestone KeyedMutex critical section, background interval watchdog.",
         "Engine 03 (Ledger Payout API), Engine 04 (UI State Dispatch).",
         "Simultaneous deposit/cancel race: blocked by KeyedMutex, secondary thread receives HTTP 409 Conflict. Timer drift: checked against wall-clock UTC timestamps.",
         "0% invalid state transitions; 100% race condition prevention under concurrent load."),

        ("E2", "Evidence & Quality Assurance Engine", "C2 (Cryptographic Verification)",
         "Streaming SHA-256 deliverable checksum calculation, tamper-evident Merkle evidence tree construction, and heuristic proposal ranking.",
         "Raw deliverable file byte streams, candidate proposal skill vectors, project requirement tags.",
         "256-bit hexadecimal SHA-256 digest, Merkle evidence tree nodes, proposal compatibility score [0-100].",
         "Deliverable checksum registry, Merkle tree root and leaf hashes, proposal ranking cache.",
         "Chunked streaming SHA-256 hashing, Merkle tree hierarchical hashing, bipartite cosine/TF-IDF skill matching.",
         "Engine 04 (Upload Interface), Engine 01 (Evidence Linking).",
         "Interrupted upload stream: abort digest and clean transient buffer, return HTTP 422. Missing skill tags: fallback to uniform unweighted scoring.",
         "100% single-bit deliverable modification detection; proposal matching latency < 50ms."),

        ("E3", "Transaction Ledger & Contract Manager", "C3 (Relational Ledger)",
         "BCNF relational schema integrity, ACID double-entry escrow ledger bookkeeping, Cashfree payout reconciliation, and chained audit logging.",
         "Financial mutation commands (LOCK_FUNDS, RELEASE_PAYOUT, ARBITRATION_SPLIT), Cashfree webhook payloads.",
         "Balanced debit/credit ledger records, updated user wallet balances, verified webhook ACK, chained audit entries.",
         "Account balances, double-entry ledger journal, contract/milestone entities, tamper-evident audit hash chain.",
         "Two-phase commit ACID transactions, Prisma transactional isolation, previous-hash SHA-256 cryptographic chaining.",
         "Engine 01 (State Change Signals), Cashfree Payment Gateway API.",
         "Database deadlock or transient network drop: automatic retry with exponential backoff; unresolvable error rolls back cleanly. Duplicate webhook: idempotent idempotency-key lookup.",
         "0.00 ledger discrepancy; 100% balance conservation; audit hash chain verification pass rate 100%."),

        ("E4", "Role Dashboards & RBAC Enforcement", "C4 (Multi-Tenant Workspace)",
         "Multi-tenant role-based workspace interfaces, server-side RBAC session guarding, dispute submission UX, and accessible UI state.",
         "User HTTP requests, session cookies, dispute submission forms, role switch commands.",
         "Role-tailored workspace views (Client, Freelancer, Reviewer, Admin), sanitized JSON responses, HTTP 401/403 rejections.",
         "Active user session context, active workspace role, client-side dispute draft state, UI theme preference.",
         "Next.js Server Component role guards, HMAC session token validation, accessible React 19 UI component composition.",
         "Engine 01, Engine 02, Engine 03 via Next.js Route Handlers.",
         "Expired session token: clear cookies and redirect to login with explanatory flash banner. Network failure during dispute submission: persist draft in localStorage with retry prompt.",
         "100% RBAC unauthorized access block rate; First Contentful Paint < 1.5s; WCAG 2.1 AA accessibility compliance.")
    ]
    for r_idx, row_vals in enumerate(decomposition_data, start=1):
        row_cells = t20.rows[r_idx].cells
        for c_idx, val in enumerate(row_vals):
            is_bold = (c_idx in [0, 1])
            align = WD_ALIGN_PARAGRAPH.CENTER if c_idx == 0 else None
            set_cell_content(row_cells[c_idx], val, bold=is_bold, align=align)
    print("Populated Table 20: Engine Decomposition Matrix")

    # =========================================================
    # ENGINE 01 DESCRIPTION SHEET (Tables 21 - 26) - Vaishnavi Modekar
    # =========================================================
    # Table 21: Header Info
    t21 = doc.tables[21]
    t21_cells = [get_row_unique_cells(r) for r in t21.rows]
    set_cell_content(t21_cells[2][1], "Escrow & State Scheduler", bold=True)
    set_cell_content(t21_cells[3][1], "02FE24BCS060")
    set_cell_content(t21_cells[4][1], "Vaishnavi Modekar (Roll No: 21)")
    set_cell_content(t21_cells[5][1], "Cluster C1 (FR-04, FR-05, FR-08, NFR-04)")

    # Table 22: Purpose (Rows 0 and 1)
    t22 = doc.tables[22]
    t22_p0 = (
        "Engine 01 is responsible for the deterministic lifecycle state machine and concurrency management of milestone escrow funds. "
        "It guarantees that funds cannot be prematurely released, refunded, or double-spent, maintaining strict formal invariants across all milestone stages "
        "(AWAITING_DEPOSIT -> FUNDED -> IN_PROGRESS -> UNDER_REVIEW -> RELEASED or DISPUTED). "
        "Furthermore, it operates an automated 7-day review timeout watchdog scheduler to prevent deliberate milestone review abandonment by clients, "
        "protecting freelancers from indefinite payment starvation."
    )
    t22_p1 = (
        "Technical Rationale & Course Synthesis: Implements classical Operating Systems principles including mutual exclusion via per-milestone KeyedMutex "
        "critical sections, race-free state transitions via Mealy Finite State Machines, and asynchronous timer event scheduling. This guarantees zero race-conditions "
        "and prevents milestone stagnation during high concurrent activity."
    )
    set_cell_content(t22.rows[0].cells[0], t22_p0, font_size_pt=9.0)
    if len(t22.rows) > 1:
        set_cell_content(t22.rows[1].cells[0], t22_p1, font_size_pt=8.5)

    # Table 23: Responsibility & Boundary
    t23 = doc.tables[23]
    t23_cells = get_row_unique_cells(t23.rows[1])
    set_cell_content(t23_cells[0], "Deterministic FSM state transitions, concurrent lock serialization, and review timeout monitoring.", bold=True)
    set_cell_content(t23_cells[1], "Milestone lifecycle state machine, KeyedMutex lock registry, review countdown timers, state transition validation rules. (Does NOT own financial balances or deliverable files).")

    # Table 24: I/O/State (3 rows x 3 cols)
    t24 = doc.tables[24]
    t24_data = [
        ("State transition directives (DEPOSIT_FUNDS, START_WORK, SUBMIT_DELIVERABLE, APPROVE_RELEASE, RAISE_DISPUTE)",
         "Validated state transition events, transition rejection errors with formal violation codes",
         "Active milestone FSM state, transition history log with timestamps"),
        ("Watchdog timer tick events, manual timeout override directives",
         "Automated timeout release triggers dispatched to Engine 03 ledger",
         "Active review timers, watchdog countdown states, lock ownership tables")
    ]
    for r_idx, (inp, out, st) in enumerate(t24_data, start=1):
        cells = get_row_unique_cells(t24.rows[r_idx])
        set_cell_content(cells[0], inp)
        set_cell_content(cells[1], out)
        set_cell_content(cells[2], st)

    # Table 25: Algorithms & Mechanisms (3 rows x 3 cols)
    t25 = doc.tables[25]
    t25_data = [
        ("Mealy Finite State Machine Validator",
         "Ensures that state transitions strictly follow valid directed graph edges; forbids illegal jumps (e.g., AWAITING_DEPOSIT -> RELEASED).",
         "FR-05, NFR-04"),
        ("Per-Milestone KeyedMutex Critical Section",
         "Prevents race conditions during simultaneous deposit/cancellation or dispute triggers by acquiring an exclusive lock per milestone ID.",
         "FR-04, NFR-04")
    ]
    for r_idx, (alg, why, req) in enumerate(t25_data, start=1):
        cells = get_row_unique_cells(t25.rows[r_idx])
        set_cell_content(cells[0], alg, bold=True)
        set_cell_content(cells[1], why)
        set_cell_content(cells[2], req, align=WD_ALIGN_PARAGRAPH.CENTER)

    # Table 26: Dependencies, Failures, KPI (4 rows x 5 cols)
    t26 = doc.tables[26]
    t26_data = [
        ("Engine 03 (DBMS Ledger API)",
         "Concurrent double-deposit or simultaneous deposit/cancellation attempt",
         "Secondary thread blocked by KeyedMutex; returns HTTP 409 Conflict after lock acquisition timeout without corrupting state",
         "0% invalid state transitions; 100% race condition prevention under concurrent load"),
        ("Engine 04 (Web Dashboard API)",
         "Client abandons milestone review (> 7 days elapsed in UNDER_REVIEW state)",
         "Watchdog scheduler detects expired timeout, dispatches auto-approval event to Engine 03 ledger to release funds",
         "Watchdog trigger latency < 1.0s after expiry; 0 stalled milestones")
    ]
    for r_idx, (dep, fail, rec, kpi) in enumerate(t26_data, start=1):
        cells = get_row_unique_cells(t26.rows[r_idx])
        set_cell_content(cells[0], dep, bold=True)
        set_cell_content(cells[1], fail)
        set_cell_content(cells[2], rec)
        set_cell_content(cells[3], kpi)
    print("Populated Engine 01 Description Sheet (Tables 21-26)")

    # =========================================================
    # ENGINE 02 DESCRIPTION SHEET (Tables 27 - 32) - Darshan Kittur
    # =========================================================
    # Table 27: Header Info
    t27 = doc.tables[27]
    t27_cells = [get_row_unique_cells(r) for r in t27.rows]
    set_cell_content(t27_cells[2][1], "Evidence & Quality Assurance Engine", bold=True)
    set_cell_content(t27_cells[3][1], "02FE24BCS053")
    set_cell_content(t27_cells[4][1], "Darshan Kittur (Roll No: 18)")
    set_cell_content(t27_cells[5][1], "Cluster C2 (FR-03, FR-06, NFR-02)")

    # Table 28: Purpose (Row 0)
    t28 = doc.tables[28]
    t28_p = (
        "Engine 02 is responsible for cryptographic integrity verification of all milestone deliverables, tamper-evident evidence tree construction, "
        "and intelligent heuristic proposal matching. It ensures that every code or document artifact submitted by a freelancer is hashed using a "
        "streaming SHA-256 algorithm and permanently bound to the milestone evidence index, preventing post-submission alteration. "
        "In addition, it evaluates proposal-to-project technical alignment through heuristic skill vector scoring to support efficient marketplace matching."
    )
    set_cell_content(t28.rows[0].cells[0], t28_p, font_size_pt=9.0)

    # Table 29: Responsibility & Boundary
    t29 = doc.tables[29]
    t29_cells = get_row_unique_cells(t29.rows[1])
    set_cell_content(t29_cells[0], "Cryptographic deliverable hashing, tamper-evident Merkle evidence tree indexing, and heuristic proposal compatibility matching.", bold=True)
    set_cell_content(t29_cells[1], "SHA-256 checksum calculator, Merkle evidence tree index, proposal-project compatibility scoring algorithm, RTM verification pipelines. (Does NOT store raw deliverable files beyond transient stream hashing; does NOT decide dispute outcomes).")

    # Table 30: I/O/State (3 rows x 3 cols)
    t30 = doc.tables[30]
    t30_data = [
        ("Deliverable file byte streams uploaded by freelancers during review submission",
         "256-bit hexadecimal SHA-256 cryptographic digest, tamper-evident evidence node",
         "Deliverable checksum registry, evidence tree leaf nodes and Merkle root"),
        ("Freelancer proposal text, skill tags, bid parameters, project requirements",
         "Normalized compatibility match score [0 - 100], ranked proposal ordering",
         "Proposal vector cache, keyword frequency weights, matching metrics")
    ]
    for r_idx, (inp, out, st) in enumerate(t30_data, start=1):
        cells = get_row_unique_cells(t30.rows[r_idx])
        set_cell_content(cells[0], inp)
        set_cell_content(cells[1], out)
        set_cell_content(cells[2], st)

    # Table 31: Algorithms & Mechanisms (3 rows x 3 cols)
    t31 = doc.tables[31]
    t31_data = [
        ("Streaming Chunked SHA-256 Cryptographic Hasher",
         "Computes cryptographic digest across memory-efficient byte chunks; guarantees non-repudiation and detects single-bit tampering.",
         "FR-06, NFR-02"),
        ("Bipartite Heuristic Proposal Matching Algorithm",
         "Calculates normalized compatibility score based on keyword vector intersection, experience rating, and budget proximity.",
         "FR-03, NFR-05")
    ]
    for r_idx, (alg, why, req) in enumerate(t31_data, start=1):
        cells = get_row_unique_cells(t31.rows[r_idx])
        set_cell_content(cells[0], alg, bold=True)
        set_cell_content(cells[1], why)
        set_cell_content(cells[2], req, align=WD_ALIGN_PARAGRAPH.CENTER)

    # Table 32: Dependencies, Failures, KPI (4 rows x 5 cols)
    t32 = doc.tables[32]
    t32_data = [
        ("Engine 04 (Deliverable Upload API)",
         "Corrupted file stream or client disconnection during deliverable upload",
         "Abort hash calculation, clean transient buffer, return HTTP 422 with checksum mismatch diagnostic warning",
         "Bitwise checksum verification accuracy: 100%; zero undetected deliverable mutations"),
        ("Engine 01 (Evidence Linking Interface)",
         "Mismatched project tags or empty proposal skill set",
         "Fallback to unweighted keyword search and uniform neutral baseline score without system crash",
         "Proposal matching compute latency < 50ms per candidate proposal")
    ]
    for r_idx, (dep, fail, rec, kpi) in enumerate(t32_data, start=1):
        cells = get_row_unique_cells(t32.rows[r_idx])
        set_cell_content(cells[0], dep, bold=True)
        set_cell_content(cells[1], fail)
        set_cell_content(cells[2], rec)
        set_cell_content(cells[3], kpi)
    print("Populated Engine 02 Description Sheet (Tables 27-32)")

    # =========================================================
    # ENGINE 03 DESCRIPTION SHEET (Tables 33 - 38) - Purvi Sammatshetti
    # =========================================================
    # Table 33: Header Info
    t33 = doc.tables[33]
    t33_cells = [get_row_unique_cells(r) for r in t33.rows]
    set_cell_content(t33_cells[2][1], "Transaction Ledger & Contract Manager", bold=True)
    set_cell_content(t33_cells[3][1], "02FE24BCS022")
    set_cell_content(t33_cells[4][1], "Purvi Sammatshetti (Roll No: 11)")
    set_cell_content(t33_cells[5][1], "Cluster C3 (FR-02, FR-07, FR-09, NFR-01, NFR-07)")

    # Table 34: Purpose (Rows 0 and 1)
    t34 = doc.tables[34]
    t34_p0 = (
        "Engine 03 is responsible for maintaining the absolute financial integrity of the escrow system through a Boyce-Codd Normal Form (BCNF) "
        "relational schema and strict ACID double-entry transaction ledgers. It ensures that every deposit, fund lock, milestone payout, dispute refund, "
        "and fee deduction is recorded as an immutable, balanced journal entry. It also reconciles external payment gateway webhooks (Cashfree) "
        "idempotently and constructs an append-only tamper-resistant cryptographic audit trail with SHA-256 hash chaining."
    )
    t34_p1 = (
        "Technical Rationale & Course Synthesis: Demonstrates core Database Management Systems principles including relational normalization to BCNF "
        "(eliminating update and deletion anomalies), serialized multi-table transactions preserving ACID invariants (Atomicity, Consistency, "
        "Isolation, Durability), and cryptographic audit chaining for regulatory non-repudiation."
    )
    set_cell_content(t34.rows[0].cells[0], t34_p0, font_size_pt=9.0)
    if len(t34.rows) > 1:
        set_cell_content(t34.rows[1].cells[0], t34_p1, font_size_pt=8.5)

    # Table 35: Responsibility & Boundary (3 cols)
    t35 = doc.tables[35]
    t35_cells = get_row_unique_cells(t35.rows[1])
    set_cell_content(t35_cells[0], "BCNF relational schema integrity, ACID transactional escrow ledger, idempotent payment webhook settlement, and chained audit logging.", bold=True)
    set_cell_content(t35_cells[1], "Financial accounts, wallet balances, double-entry ledger journal, contract terms, milestone financial state, chained audit records.")
    set_cell_content(t35_cells[2], "Does NOT govern UI presentation, does NOT manage real-time WebSockets, does NOT validate deliverable file contents or cryptographic hashes.")

    # Table 36: I/O/State (3 rows x 3 cols)
    t36 = doc.tables[36]
    t36_data = [
        ("Financial mutation directives (LOCK_FUNDS, RELEASE_PAYOUT, ARBITRATION_SPLIT, REFUND)",
         "Balanced debit/credit ledger records, updated user wallet balances, receipt UUIDs",
         "User account balances, escrow pool balance, ledger journal records"),
        ("Cashfree gateway webhook payloads (payment success/failure, signature, order ID)",
         "Verified HTTP 200/400 webhook ACK, reconciled deposit status, audit events",
         "Webhook idempotency keys, payment gateway transaction status log, chained audit log")
    ]
    for r_idx, (inp, out, st) in enumerate(t36_data, start=1):
        cells = get_row_unique_cells(t36.rows[r_idx])
        set_cell_content(cells[0], inp)
        set_cell_content(cells[1], out)
        set_cell_content(cells[2], st)

    # Table 37: Algorithms & Mechanisms (3 rows x 3 cols)
    t37 = doc.tables[37]
    t37_data = [
        ("Two-Phase Commit ACID Ledger Transaction Routine",
         "Executes debit and credit operations in an isolated, atomic database transaction; guarantees that sum of debits strictly equals credits.",
         "FR-04, FR-07, NFR-01"),
        ("Cryptographic Chained Audit Logging",
         "Links each audit record to the preceding record's SHA-256 hash, creating a tamper-evident audit journal resistant to backend tampering.",
         "NFR-07")
    ]
    for r_idx, (alg, why, req) in enumerate(t37_data, start=1):
        cells = get_row_unique_cells(t37.rows[r_idx])
        set_cell_content(cells[0], alg, bold=True)
        set_cell_content(cells[1], why)
        set_cell_content(cells[2], req, align=WD_ALIGN_PARAGRAPH.CENTER)

    # Table 38: Dependencies, Failures, KPI (4 rows x 5 cols)
    t38 = doc.tables[38]
    t38_data = [
        ("Engine 01 (State Transition Signals)",
         "Database lock contention or transient connection drop during ledger write",
         "Automatic exponential backoff retry (up to 3 attempts); aborts transaction cleanly on fatal failure without corrupting balances",
         "Transaction execution latency <= 200ms at p95; 0.00 balance discrepancy"),
        ("External Payment Gateway (Cashfree API)",
         "Duplicate or replayed webhook events due to network retries",
         "Replay protection via idempotent transaction lookup by gateway reference ID; duplicate returns HTTP 200 without re-crediting",
         "Webhook reconciliation accuracy: 100%; zero double-crediting incidents")
    ]
    for r_idx, (dep, fail, rec, kpi) in enumerate(t38_data, start=1):
        cells = get_row_unique_cells(t38.rows[r_idx])
        set_cell_content(cells[0], dep, bold=True)
        set_cell_content(cells[1], fail)
        set_cell_content(cells[2], rec)
        set_cell_content(cells[3], kpi)
    print("Populated Engine 03 Description Sheet (Tables 33-38)")

    # =========================================================
    # ENGINE 04 DESCRIPTION SHEET (Tables 39 - 44) - Vaibhav Chavanpatil
    # =========================================================
    # Table 39: Header Info
    t39 = doc.tables[39]
    t39_cells = [get_row_unique_cells(r) for r in t39.rows]
    set_cell_content(t39_cells[2][1], "Role Dashboards & RBAC Enforcement", bold=True)
    set_cell_content(t39_cells[3][1], "02FE24BCS013")
    set_cell_content(t39_cells[4][1], "Vaibhav Chavanpatil (Roll No: 04)")
    set_cell_content(t39_cells[5][1], "Cluster C4 (FR-01, NFR-03, NFR-05, NFR-06)")

    # Table 40: Purpose (Row 0)
    t40 = doc.tables[40]
    t40_p = (
        "Engine 04 is responsible for delivering secure, accessible, multi-role workspace interfaces (Client, Freelancer, Dispute Reviewer, Admin) "
        "and enforcing ironclad Role-Based Access Control (RBAC) across all server endpoints and client routes. It ensures that confidential "
        "project budgets, proposals, and dispute arbitration dossiers are strictly isolated by authenticated role. "
        "Furthermore, it provides intuitive dispute filing forms, real-time milestone visualization, and dynamic theme switching with full WCAG 2.1 AA accessibility."
    )
    set_cell_content(t40.rows[0].cells[0], t40_p, font_size_pt=9.0)

    # Table 41: Responsibility & Boundary (3 cols)
    t41 = doc.tables[41]
    t41_cells = get_row_unique_cells(t41.rows[1])
    set_cell_content(t41_cells[0], "Multi-tenant role-based dashboard rendering, server-side RBAC session guarding, dispute submission interface, and accessible UI state management.", bold=True)
    set_cell_content(t41_cells[1], "Role route middleware, session authentication tokens, client dashboard components, dispute submission forms, theme preference state.")
    set_cell_content(t41_cells[2], "Does NOT execute ledger fund transfers (Engine 03), does NOT enforce FSM lifecycle transitions (Engine 01), does NOT compute cryptographic file hashes (Engine 02).")

    # Table 42: I/O/State (3 rows x 3 cols)
    t42 = doc.tables[42]
    t42_data = [
        ("User login credentials, session auth tokens, workspace navigation requests",
         "Role-tailored dashboard views (Client, Freelancer, Reviewer, Admin), HTTP 401/403 responses",
         "Authenticated session context, active workspace role, user permission matrix"),
        ("Milestone action inputs (approve, dispute, submit deliverable), dispute argument forms",
         "Sanitized JSON request payloads dispatched to backend engine API endpoints",
         "Client-side form draft state, UI theme mode (light/dark), active modal view state")
    ]
    for r_idx, (inp, out, st) in enumerate(t42_data, start=1):
        cells = get_row_unique_cells(t42.rows[r_idx])
        set_cell_content(cells[0], inp)
        set_cell_content(cells[1], out)
        set_cell_content(cells[2], st)

    # Table 43: Algorithms & Mechanisms (3 rows x 3 cols)
    t43 = doc.tables[43]
    t43_data = [
        ("Server-Side RBAC Middleware Route Guard",
         "Intercepts all incoming requests, validates session token against user role, and blocks unauthorized cross-role endpoints before handler execution.",
         "FR-01, NFR-03"),
        ("Responsive Accessible Design & Dynamic Theming",
         "Implements semantic HTML, ARIA attributes, keyboard navigation, and zero-flash CSS custom property theming compliant with WCAG 2.1 AA.",
         "NFR-05")
    ]
    for r_idx, (alg, why, req) in enumerate(t43_data, start=1):
        cells = get_row_unique_cells(t43.rows[r_idx])
        set_cell_content(cells[0], alg, bold=True)
        set_cell_content(cells[1], why)
        set_cell_content(cells[2], req, align=WD_ALIGN_PARAGRAPH.CENTER)

    # Table 44: Dependencies, Failures, KPI (4 rows x 5 cols)
    t44 = doc.tables[44]
    t44_data = [
        ("Engine 01 & Engine 03 (Backend Route Handlers)",
         "Stale session token or expired authentication cookie during user interaction",
         "Clear session cookies, terminate active workspace, and redirect to login with explanatory flash message",
         "RBAC unauthorized access block rate: 100%; zero unauthorized role escalations"),
        ("Client Web Browser / Network Environment",
         "Slow network connection or transient API error during dispute submission",
         "Display non-blocking toast notifications with retry button; preserve form input state in local storage",
         "First Contentful Paint (FCP) < 1.5s; 100% WCAG 2.1 AA accessibility compliance")
    ]
    for r_idx, (dep, fail, rec, kpi) in enumerate(t44_data, start=1):
        cells = get_row_unique_cells(t44.rows[r_idx])
        set_cell_content(cells[0], dep, bold=True)
        set_cell_content(cells[1], fail)
        set_cell_content(cells[2], rec)
        set_cell_content(cells[3], kpi)
    print("Populated Engine 04 Description Sheet (Tables 39-44)")

    # Save output
    doc.save(HANDBOOK_PATH)
    print(f"\nSUCCESS: Document successfully saved to {HANDBOOK_PATH}")

if __name__ == "__main__":
    populate_handbook()
