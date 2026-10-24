# Gate 1 Master Evidence & Requirements Package

> **Academic Milestone**: Stage S1 — Requirements Engineering Baseline (Gate 1)
> **Institution**: KLE Technological University's Dr. M. S. Sheshgiri College of Engineering and Technology, Belagavi
> **Department**: Department of Computer Science and Engineering
> **Curriculum Framework**: Engine-Based Mini-Project Framework with Hybrid SDLC
> **Team**: Team 07 (Theme 01)
> **Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
> **Package Status**: `FROZEN S1 BASELINE — READY FOR GATE 1 EVALUATION`
> **Evaluation Guideline**: Gate 1 evaluates *what* the system must do, how quality is measured, and *who* owns each technical responsibility. It explicitly excludes code, UI prototypes, or database implementations.

---

## Official Gate 1 Deliverables & Evidence Checklist

> **Assessment Rubric Compliance Table** (Reference: KLE Tech Mini-Project Gate 1 Evaluation Guidelines)

| # | Deliverable / Evidence Item | Submitted (Y/N) | Date Verified | Verified By | Authoritative S1 Specification File |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **Functional Requirements Document (FRD)** | **Y** | `2026-10-02` | Team 07 & Guide | [functional-requirements.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/functional-requirements.md) (FR-01 to FR-12) |
| **2** | **Use Cases & User Stories** | **Y** | `2026-10-02` | Team 07 & Guide | [use-cases.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/use-cases.md) (UC-01..05 & US-01..08) |
| **3** | **KPIs & Success Metrics** | **Y** | `2026-10-02` | Team 07 & Guide | [kpis-and-success-metrics.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/kpis-and-success-metrics.md) (3-Tier Sheet) |
| **4** | **Data Requirements & Constraints** | **Y** | `2026-10-02` | Team 07 & Guide | [data-requirements-and-constraints.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/data-requirements-and-constraints.md) |
| **5** | **Engine Mapping — Four Engines** | **Y** | `2026-10-02` | Team 07 & Guide | [team-project-overview.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/team-project-overview.md) & [engine-defense/](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/engine-defense/) |
| **6** | **Prioritized Requirement List** | **Y** | `2026-10-02` | Team 07 & Guide | [prioritized-requirements.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/prioritized-requirements.md) (MoSCoW Matrix) |
| **7** | **Dated Evidence Before Gate 2** | **Y** | `2026-10-02` | Team 07 & Guide | Git Commit `926869b` / `9c141b2` (`2026-10-02 22:40:28 +0530`) |

---

## Gate 1 Assessment Rubric Alignment (Target: 15 / 15 Marks)

| Criterion | Max Marks | Full Marks Criteria | Team 07 Compliance & Defense Evidence |
| :--- | :---: | :--- | :--- |
| **Requirements Completeness** | **5** | All major functional requirements captured with clarity and rationale. | **FR-01 through FR-12** fully articulated using IEEE standard behavioral templates with inputs, outputs, error conditions, owning engines, and formal RBAC matrix. |
| **Use Cases & Users** | **3** | Use cases/user stories cover all key roles and scenarios. | **5 Detailed Use Cases (UC-01 to UC-05)** and **8 Agile User Stories (US-01 to US-08)** covering all 4 roles (Client, Freelancer, Dispute Reviewer, Admin). |
| **KPIs & Metrics** | **3** | Clear, measurable KPIs with targets defined. | **3-Tier KPI Sheet** defining Mandatory KPIs (Zero drift, 100% RBAC), System KPIs (p95 $\le 500\text{ms}$), Challenge KPIs ($O(V+E) < 10\text{ms}$), and business targets. |
| **Engine Mapping** | **2** | Requirements mapped correctly to four engines. | **Four foundational engines** individually owned by team members: Engine 01 (OS · Vaishnavi), Engine 02 (DSA/SE · Darshan), Engine 03 (DBMS · Purvi), Engine 04 (Web · Vaibhav). |
| **Timeliness of Evidence** | **2** | All S1 evidence completed before Gate 2. | **100% of S1 requirements baseline frozen** in Git commit `926869b` / `9c141b2` dated `2026-10-02`, strictly prior to Gate 2 architecture commits on `2026-10-03`. |
| **TOTAL** | **15** | **FULL MARKS BASELINE** | **15 / 15 Fully Documented and Empirically Verifiable.** |

---

## Master Document Navigation Index

| Section | Content Area | Authoritative Source Document | Derived Project Package File |
| :---: | :--- | :--- | :--- |
| **1** | **Project Overview** | PPTX Slides 1, 8, 10, 16 | [team-project-overview.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/team-project-overview.md) |
| **2** | **Problem Statement** | DOCX Step 1 & 4; PPTX Slide 2 | [team-project-overview.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/team-project-overview.md), [requirements.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/requirements.md) |
| **3** | **Scope (In/Out of Scope)** | DOCX Step 5; PPTX Slide 16 | [project-scope.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/project-scope.md) |
| **4** | **Stakeholders & Actors** | DOCX Step 2; PPTX Slide 16 | [use-cases.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/use-cases.md), [team-project-overview.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/team-project-overview.md) |
| **5** | **Functional Requirements (FRD)**| PPTX Slide 18 (FR-01 to FR-12) | [functional-requirements.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/functional-requirements.md) |
| **6** | **Non-Functional Requirements** | PPTX Slide 19 (NFR-01 to NFR-10) | [non-functional-requirements.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/non-functional-requirements.md) |
| **7** | **Use Cases & Agile Stories** | PPTX Slides 3, 17, 21, 22; DOCX Step 3 | [use-cases.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/use-cases.md) (UC-01..05, US-01..08) |
| **8** | **KPIs & Success Metrics** | PPTX Slide 19 & 22 | [kpis-and-success-metrics.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/kpis-and-success-metrics.md) (3-Tier Sheet) |
| **9** | **Data Requirements & Constraints**| DOCX Step 4 & 5; PPTX Slide 14, 16 | [data-requirements-and-constraints.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/data-requirements-and-constraints.md) |
| **10** | **Prioritized Requirements** | DOCX Step 4, Item 2; Slide 18 | [prioritized-requirements.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/prioritized-requirements.md) (MoSCoW Matrix) |
| **11** | **Requirements Traceability (RTM)**| PPTX Slide 23; DOCX Step 4 | [requirements.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/requirements.md) Section 3 |
| **12** | **Four-Engine Decomposition** | PPTX Slides 9–15 | [team-project-overview.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/team-project-overview.md) Section 3 |
| **13** | **Assumptions & Constraints** | DOCX Step 5 | [project-scope.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/project-scope.md) Section 2 |
| **14** | **Project Risk Register** | DOCX Step 7 (R1 to R8) | [project-scope.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/project-scope.md) Section 3 |
| **15** | **Pending Team Decisions** | Audit Findings 1, 2, 5 | [gate-1-team-decisions.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-team-decisions.md) (D-01, D-02, D-03) |
| **16** | **Gate 1 Defense Questions** | Review Board Evaluation | [gate-1-defense-cheat-sheet.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-defense-cheat-sheet.md), [gate-1-hard-questions.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-hard-questions.md), [gate-1-adversarial-review.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-adversarial-review.md) |
| **17** | **Gate 1 Presentation Script** | S1 Delivery & Q&A Script | [gate-1-presentation-script.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-presentation-script.md) (15 Spoken Sections) |
| **18** | **Engine Defense Packages** | 4-Engine Subject Defenses | [engine-01-os.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/engine-defense/engine-01-os.md), [engine-02-dsa-se.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/engine-defense/engine-02-dsa-se.md), [engine-03-dbms.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/engine-defense/engine-03-dbms.md), [engine-04-web.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/engine-defense/engine-04-web.md) |

---

## 1. Project Overview & Identity
- **Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
- **Academic Framework**: KLE Technological University Mini-Project Engine Framework with Hybrid SDLC
- **Student Team**:
  - **Vaibhav Chavanpatil** (`02FE24BCS013`): Engine 04 (Web Technologies) Owner
  - **Purvi Sammatshetti** (`02FE24BCS022`): Engine 03 (DBMS) Owner
  - **Darshan Kittur** (`02FE24BCS053`): Engine 02 (DSA & SE) Owner
  - **Vaishnavi Modekar** (`02FE24BCS060`): Engine 01 (OS) Owner
- *Authoritative Reference*: `Team07_Escrow_Mini_Project_KLE_Theme.pptx` Slide 1.

---

## 2. Problem Statement
Existing freelance platforms lack a structured milestone-based escrow mechanism, centralized evidence management, and a transparent dispute resolution workflow, resulting in unclear requirements, missed deadlines, payment uncertainty, and unresolvable client-freelancer conflicts. This project develops a web-based system that integrates milestone-based simulated escrow, verifiable evidence submission, role-based multi-tier arbitration, and complete audit history tracking to ensure safe and transparent collaboration.
- *Authoritative Reference*: `Mini_Project_Gate_0_details_FILLED.docx` Step 4, Paragraph 3.

---

## 3. Scope Boundaries
- **In-Scope**: User RBAC, project posting, proposals/bidding, phased milestone tracking, deliverable SHA-256 evidence submissions, simulated escrow lock/release/refund, human dispute arbitration.
- **Out-of-Scope**: Real banking / payment gateways (Stripe/PayPal), legal court enforcement, native mobile applications, autonomous AI arbitration without human review, unlimited video file storage, corporate taxation/accounting integrations.
- *Authoritative Reference*: `Mini_Project_Gate_0_details_FILLED.docx` Step 5.

---

## 4. Stakeholders & System Actors
- **Primary Stakeholders**: Client (deposits funds & reviews work), Freelancer (executes milestones & uploads deliverables), Dispute Reviewer (adjudicates conflicts using evidence), Escrow Officer (supervises state locks).
- **Secondary Stakeholders**: Project Manager, Administrator / Auditor, End Beneficiaries.
- *Authoritative Reference*: `Mini_Project_Gate_0_details_FILLED.docx` Step 2.

---

## 5. Functional Requirements (FR-01 to FR-12)
1. **FR-01**: Escrow Fund Locking (Engine 01 · Vaishnavi)
2. **FR-02**: Milestone State Tracking (Engine 01 · Vaishnavi)
3. **FR-03**: Cryptographic Checksums (Engine 02 · Darshan)
4. **FR-04**: Evidence Trees (Engine 02 · Darshan)
5. **FR-05**: ACID Payment Processing (Engine 03 · Purvi)
6. **FR-06**: Tamper-Resistant Audit Log (Engine 03 · Purvi)
7. **FR-07**: Role-Based Dashboards (Engine 04 · Vaibhav)
8. **FR-08**: Authentication & RBAC (Engine 04 · Vaibhav)
9. **FR-09**: Dispute Workflow (Engine 04 · Vaibhav)
10. **FR-10**: FSM Progress UI (Engine 04 · Vaibhav)
11. **FR-11**: AI Semantic Matching (Engine 02 · Darshan Primary, E3 Purvi Supporting)
12. **FR-12**: Contract Lifecycle Orchestration (Engine 01 · Vaishnavi)
- *Authoritative Reference*: `Team07_Escrow_Mini_Project_KLE_Theme.pptx` Slide 18.

---

## 6. Non-Functional Requirements (NFR-01 to NFR-10)
1. **NFR-01 (Performance)**: p95 latency ≤ 500 ms across all API endpoints (50 concurrent requests, 100 projects, 500 milestones benchmark).
2. **NFR-02 (Security)**: 100% of protected routes enforce role-based authorization.
3. **NFR-03 (Data Integrity)**: 100% detection rate for file tampering or hash mismatch.
4. **NFR-04 (Input Validation)**: 100% of incoming payloads validated via Zod 4 schemas.
5. **NFR-05 (FSM Reliability)**: 0 invalid or out-of-order state transitions permitted.
6. **NFR-06 (Responsiveness)**: Responsive rendering across viewports (360px–1920px).
7. **NFR-07 (Maintainability)**: 4 independently testable and ownable engine modules.
8. **NFR-08 (Consistency)**: 0 double-allocation or balance discrepancy anomalies.
9. **NFR-09 (Auditability)**: 100% of state transitions captured in append-only audit log.
10. **NFR-10 (Fault Tolerance)**: Zero unhandled crashes; standardized JSON error envelopes.
- *Authoritative Reference*: `Team07_Escrow_Mini_Project_KLE_Theme.pptx` Slide 19.

---

## 7. Use Cases (UC-01 to UC-05)
- **UC-01**: Contract Initiation & Escrow Fund Locking
- **UC-02**: Milestone Deliverable Submission & Cryptographic Hashing
- **UC-03**: Milestone Verification & Escrow Fund Release
- **UC-04**: Dispute Escalation & Evidence-Based Arbitration
- **UC-05**: AI Semantic Matching & Developer Scoring
- *Authoritative Reference*: `Team07_Escrow_Mini_Project_KLE_Theme.pptx` Slide 17 & 21; derived in `docs/requirements/use-cases.md`.

---

## 8. Requirements Traceability Matrix (RTM)
Complete bidirectional mapping linking S0 needs → FRs → Use Cases → Owning Engine → Student Owner → Target NFRs:
- *Detailed Table*: [requirements.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/requirements.md) Section 3.

---

## 9. Four-Engine Curricular Breakdown
1. **Engine 01 (OS Engine · Vaishnavi Modekar)**: Concurrency, FSM lifecycle, mutexes, deadlock prevention, review watchdog timers.
2. **Engine 02 (DSA & SE Engine · Darshan Kittur)**: Cryptographic SHA-256 digests, in-memory N-ary `EvidenceTree`, RTM, V&V pipelines.
3. **Engine 03 (DBMS Engine · Purvi Sammatshetti)**: BCNF normalization, Prisma/SQLite ACID transactions, append-only audit logging.
4. **Engine 04 (Web Technologies Engine · Vaibhav Chavanpatil)**: Next.js 16 App Router, React 19 UI, Tailwind CSS, RBAC session guards.
- *Authoritative Reference*: `Team07_Escrow_Mini_Project_KLE_Theme.pptx` Slides 9–15.

---

## 10. Constraints & Assumptions
- Constraints: 15-week academic semester, 4-student team, zero budget / 100% open-source, local departmental demonstration hardware.
- Assumptions: Modern browser connectivity, good-faith deliverable submissions, simulated credits suffice for demonstration, impartial human reviewers.
- *Authoritative Reference*: `Mini_Project_Gate_0_details_FILLED.docx` Step 5.

---

## 11. Initial Risk Register (R1 to R8)
Managed by designated student owners covering milestone ambiguity (R1 · Vaibhav), FSM deadlocks (R2 · Darshan), evidence tampering (R3 · Purvi), unauthorized access (R4 · Vaishnavi), team coordination (R5 · Vaibhav), database migrations (R6 · Darshan), scope creep (R7 · Purvi), and UI responsiveness (R8 · Vaishnavi).
- *Authoritative Reference*: `Mini_Project_Gate_0_details_FILLED.docx` Step 7.

---

## 12. Pending Team Decisions Register
- **Decision D-01 — FR-11 Primary Engine Ownership**: Engine 02 / Darshan Kittur = Primary, Engine 03 / Purvi Sammatshetti = Supporting Dependency (`STATUS: PENDING TEAM RATIFICATION`).
- **Decision D-02 — Client Review Timeout Duration**: Proposed default: 7 calendar days (`STATUS: PENDING TEAM RATIFICATION`).
- **Decision D-03 — Production Cloud Hosting**: Postponed until post-academic phase (`STATUS: DEFERRED`).
- *Reference Document*: [gate-1-team-decisions.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-team-decisions.md).

---

## 13. Evaluator Defense Cheat Sheet & Review Checklist
- [gate-1-mock-viva.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-mock-viva.md): Comprehensive 22-question mock viva voce guide with evidence and follow-ups.
- [gate-1-team-rehearsal.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-team-rehearsal.md): Individual defense rehearsals organized by team member and engine.
- [gate-1-timed-presentation.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-timed-presentation.md): Delivery sequence with adaptable timing models and speaker handovers.
- [gate-1-team-checklist.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-team-checklist.md): Master readiness checklist across all foundational concepts.
- [gate-1-defense-cheat-sheet.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-defense-cheat-sheet.md): Concise answers to the 22 most critical evaluator questions.
- [gate-1-final-checklist.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-final-checklist.md): 13-point Gate 1 readiness verification checklist.
- [gate-1-adversarial-review.md](file:///home/nethunter/Collage/BIG_PROJECT/docs/requirements/gate-1-adversarial-review.md): Complete adversarial audit report.
