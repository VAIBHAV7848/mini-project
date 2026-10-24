# Use Case Specifications & System Scenarios

> **Classification**: Stage S1 Requirements Engineering Deliverable (Gate 1 Evidence)
> **Source Documents**:
> - `docs/source-material/Team07_Escrow_Mini_Project_KLE_Theme.pptx` (Slides 3, 17, 21, 22)
> - `docs/source-material/Mini_Project_Gate_0_details_FILLED.docx` (Step 3 & 4)

---

## 1. Overview & Actor Catalog
- **Primary Actors**:
  - `Client`: Creates project specifications, deposits funds into escrow, reviews deliverable submissions, approves milestones.
  - `Freelancer`: Searches projects/gigs, submits proposals, uploads milestone deliverables, contests unfair rejections.
  - `Dispute Reviewer`: Inspects evidence trees, reviews SHA-256 checksum integrity, issues binding dispute rulings.
- **Secondary / System Actors**:
  - `Escrow State Scheduler (Engine 01)`: Enforces FSM transitions and review timeouts.
  - `Evidence QA Engine (Engine 02)`: Computes SHA-256 checksums and indexes evidence trees.
  - `Transaction Ledger (Engine 03)`: Executes ACID balance debits/credits and records immutable audit logs.
  - `Administrator / Auditor`: Maintains system health and monitors audit logs.

---

## 2. Detailed Use Cases

### UC-01: Contract Initiation & Escrow Fund Locking
- **Primary Actor**: Client
- **Owning Engine**: Engine 01 (OS) & Engine 03 (DBMS)
- **Traceability**: FR-01, FR-12 | NFR-05, NFR-08
- **Preconditions**:
  1. Client and Freelancer are authenticated.
  2. Client has accepted the Freelancer's proposal for an open project with agreed phased milestones.
  3. Client wallet/account possesses sufficient balance for milestone funding.
- **Main (Normal) Flow**:
  1. Client clicks "Initiate Contract & Lock Escrow".
  2. System prompts Client to confirm escrow deposit for Milestone 1.
  3. System initiates atomic database transaction (`prisma.$transaction`).
  4. Client available balance is debited by milestone amount; contract `escrow_balance` is credited.
  5. Engine 01 sets Milestone status to `FUNDED` and Contract status to `FUNDED`.
  6. Engine 03 appends an immutable transaction record to `ESCROW_TRANSACTION` and `AUDIT_LOG`.
  7. Client and Freelancer dashboards update in real-time displaying funded status.
- **Alternate Flow (Insufficient Balance)**:
  - At Step 3, if Client balance < milestone amount, system prompts Client to add simulated funds. Milestone remains `AWAITING_DEPOSIT`.
- **Exception Flow (Transaction Failure / Concurrency Race)**:
  - If a concurrent transfer attempt or database constraint error occurs, the entire transaction is rolled back. Zero funds are deducted. An error envelope with code `TRANSACTION_ROLLBACK` is returned.
- **Postconditions**: Milestone funds are securely locked in escrow; Freelancer is authorized to commence work.

---

### UC-02: Milestone Deliverable Submission & Cryptographic Hashing
- **Primary Actor**: Freelancer
- **Owning Engine**: Engine 02 (DSA & SE) & Engine 04 (Web)
- **Traceability**: FR-02, FR-03, FR-10 | NFR-03, NFR-04
- **Preconditions**:
  1. Contract and Milestone status are `FUNDED` or `IN_PROGRESS`.
- **Main (Normal) Flow**:
  1. Freelancer navigates to active Contract dashboard.
  2. Freelancer uploads deliverable archive (ZIP/PDF/code) and inputs completion notes.
  3. System validates file size and payload schema via Zod 4.
  4. Engine 02 processes file stream and generates SHA-256 cryptographic digest (`crypto.createHash('sha256')`).
  5. Deliverable record is stored in `DELIVERABLE` with the computed `sha256_checksum`.
  6. Engine 01 FSM transitions Milestone to `SUBMITTED` and Contract to `UNDER_REVIEW`.
  7. Notification sent to Client indicating deliverable is ready for inspection.
- **Alternate Flow (Deliverable URL Submission)**:
  - Freelancer submits public code repository URL. Engine 02 digests commit hash and submission metadata as verification proof.
- **Exception Flow (Payload Rejection / Invalid State)**:
  - If Milestone is not in `FUNDED`/`IN_PROGRESS` (e.g. already `RELEASED`), submission is rejected with HTTP 422 `INVALID_STATE_TRANSITION`.
- **Postconditions**: Deliverable is cryptographically fingerprinted; Client review window commences.

---

### UC-03: Milestone Verification & Escrow Fund Release
- **Primary Actor**: Client
- **Owning Engine**: Engine 01 (OS), Engine 02 (DSA/SE), Engine 03 (DBMS)
- **Traceability**: FR-02, FR-03, FR-05 | NFR-01, NFR-03, NFR-08
- **Preconditions**:
  1. Milestone is in `SUBMITTED` state with valid SHA-256 deliverable record.
- **Main (Normal) Flow**:
  1. Client inspects submitted deliverable files and verifies checksum fidelity.
  2. Client selects "Approve & Release Funds".
  3. Engine 01 FSM validates transition legality (`SUBMITTED` → `APPROVED` → `RELEASED`).
  4. Engine 03 initiates atomic transaction:
     - Debits contract `escrow_balance` by milestone amount.
     - Credits Freelancer account balance.
     - Updates Milestone status to `RELEASED`.
     - Checks if subsequent milestones exist: if yes, next milestone activates; if all milestones completed, Contract marked `RELEASED`.
  5. Engine 03 writes audit event to `AUDIT_LOG`.
  6. Dashboards update with release confirmation.
- **Alternate Flow (Revision Request)**:
  - Client rejects deliverable notes and requests revision. Milestone transitions back to `IN_PROGRESS` with feedback notes. Funds remain locked in escrow.
- **Exception Flow (Double Release Prevention)**:
  - If a duplicate `RELEASE_ESCROW` request is transmitted, Engine 01 FSM halts the transition with `ALREADY_RELEASED` error. Zero duplicate disbursements occur.
- **Postconditions**: Funds are transferred to Freelancer; milestone completed cleanly.

---

### UC-04: Dispute Escalation & Evidence-Based Arbitration
- **Primary Actor**: Client / Freelancer / Dispute Reviewer
- **Owning Engine**: Engine 02 (DSA/SE), Engine 04 (Web), Engine 03 (DBMS)
- **Traceability**: FR-04, FR-06, FR-07, FR-09 | NFR-02, NFR-09
- **Preconditions**:
  1. Milestone is in `SUBMITTED` or `IN_PROGRESS` state.
  2. Disagreement regarding quality or deliverable scope occurs.
- **Main (Normal) Flow**:
  1. Contesting party clicks "Raise Dispute", specifies grievance category, and uploads supporting evidence files.
  2. Engine 02 hashes uploaded evidence files with SHA-256 and appends them to the milestone's `DISPUTE_EVIDENCE` tree.
  3. Engine 01 transitions Milestone and Contract state to `DISPUTED`.
  4. Escrow funds remain strictly frozen; automated releases or refunds are disabled.
  5. Dispute is assigned to an authorized Dispute Reviewer.
  6. Dispute Reviewer opens Reviewer Console, inspects contract terms, original deliverable checksums, communication logs, and counter-evidence hierarchy.
  7. Dispute Reviewer issues binding ruling:
     - *Option A (Ruling for Freelancer)*: System releases escrow funds to Freelancer.
     - *Option B (Ruling for Client)*: System refunds escrow funds to Client.
     - *Option C (Split Settlement)*: System apportions funds proportionally.
  8. Ruling, rationale, and reviewer ID are immutably committed to `AUDIT_LOG` and `DISPUTE`.
  9. Milestone transitions to `RESOLVED`; contract status updates accordingly.
- **Exception Flow (Unauthorized Adjudication Attempt)**:
  - If non-reviewer user attempts ruling API call, RBAC middleware rejects request with HTTP 403 `FORBIDDEN`.
- **Postconditions**: Dispute resolved objectively based on cryptographic evidence record; funds disbursed per binding ruling.

---

### UC-05: AI Semantic Matching & Developer Scoring
- **Primary Actor**: Client & Freelancer
- **Owning Engine**: Engine 02 (SE) & Engine 04 (Web)
- **Traceability**: FR-11 | NFR-01
- **Preconditions**:
  1. Project specification contains defined skill tags and budget.
  2. Freelancer profile contains parsed skill tags, rate, and GitHub statistics.
- **Main (Normal) Flow**:
  1. Freelancer views project listing and clicks "Submit Proposal".
  2. Application routes proposal data to AI Matcher (`ai-matcher.ts`).
  3. Matcher computes multi-factor score:
     - Skill tag overlap percentage (exact and related framework taxonomy).
     - Developer GitHub credibility index (commit frequency, stars, repo velocity).
     - Hourly rate vs. project budget compatibility.
  4. Match percentage (`aiMatchScore`, 0–100%) is recorded with proposal.
  5. Client proposal review dashboard displays proposals sorted by objective match compatibility.
- **Postconditions**: Client receives transparent, objective compatibility rankings without subjective bias.


---

## 3. Agile User Stories Catalog (US-01 to US-08)

To satisfy **Gate 1 Deliverable 2** and Rubric Criterion 2 ("Use cases/user stories cover all key roles and scenarios"), this section provides formal Agile User Stories covering all four primary roles: **Client**, **Freelancer**, **Dispute Reviewer**, and **Administrator / Escrow Officer**.

### US-01: Milestone Escrow Fund Locking
- **Primary Role**: Client
- **Owning Engine**: Engine 01 (OS · Vaishnavi) & Engine 03 (DBMS · Purvi)
- **Traceability**: FR-01, FR-12 | NFR-05, NFR-08 | UC-01
- **User Story**:
  > **As a** Client,
  > **I want to** lock simulated funds into escrow for the active milestone before work starts,
  > **So that** the freelancer is assured payment is guaranteed upon verified completion without me risking upfront default.
- **Acceptance Criteria**:
  - **Scenario 1: Successful Fund Lock**
    - **Given** I am logged in as a Client and have an accepted proposal with a milestone in `AWAITING_DEPOSIT`,
    - **When** I click "Initiate Contract & Lock Escrow" and my balance $\ge$ milestone amount,
    - **Then** my available balance is debited, the contract escrow balance is credited atomically ($\sum \Delta B = 0$), the milestone status transitions to `FUNDED`, and an immutable transaction is written to `AuditLog`.
  - **Scenario 2: Insufficient Balance Prevention**
    - **Given** my available balance is less than the milestone amount,
    - **When** I attempt to lock escrow,
    - **Then** the transaction is blocked, the milestone remains `AWAITING_DEPOSIT`, and a descriptive error prompts me to deposit simulated funds.

---

### US-02: Deliverable Submission & Cryptographic Hashing
- **Primary Role**: Freelancer
- **Owning Engine**: Engine 02 (DSA & SE · Darshan) & Engine 04 (Web · Vaibhav)
- **Traceability**: FR-02, FR-03, FR-10 | NFR-03, NFR-04 | UC-02
- **User Story**:
  > **As a** Freelancer,
  > **I want to** upload my completed milestone deliverable and generate an immutable SHA-256 checksum,
  > **So that** I have irrefutable cryptographic proof of what was delivered and when, protecting me from false claims of non-delivery.
- **Acceptance Criteria**:
  - **Scenario 1: Valid Upload and Checksum Generation**
    - **Given** I am assigned as the Freelancer on a contract with an active milestone in `FUNDED` or `IN_PROGRESS`,
    - **When** I upload a deliverable file ($\le 50\text{ MB}$) with completion notes,
    - **Then** the system computes a 64-character SHA-256 hash using streaming `node:crypto`, stores the record in `Deliverable`, transitions the milestone to `SUBMITTED`, and updates the client dashboard via the 5-second poller.
  - **Scenario 2: Invalid File Type or Oversized Payload**
    - **Given** I attempt to upload an unapproved file extension or a file $> 50\text{ MB}$,
    - **When** the request reaches the server,
    - **Then** Zod schema validation halts the request with HTTP 422, no database record is created, and the milestone state does not change.

---

### US-03: Milestone Verification & Fund Release
- **Primary Role**: Client
- **Owning Engine**: Engine 01 (OS · Vaishnavi), Engine 02 (DSA · Darshan), Engine 03 (DBMS · Purvi)
- **Traceability**: FR-02, FR-03, FR-05 | NFR-01, NFR-03, NFR-08 | UC-03
- **User Story**:
  > **As a** Client,
  > **I want to** inspect submitted deliverables, verify their cryptographic hash, and release escrow funds,
  > **So that** satisfactory work is compensated promptly and the next milestone can activate automatically.
- **Acceptance Criteria**:
  - **Scenario 1: Approval and Atomic Disbursement**
    - **Given** a milestone is in `SUBMITTED` state with a valid SHA-256 deliverable,
    - **When** I click "Approve & Release Funds",
    - **Then** Engine 01 validates the transition (`SUBMITTED` $\to$ `RELEASED`), Engine 03 executes an ACID transaction debiting escrow and crediting the Freelancer's account, and the milestone reaches terminal state `RELEASED`.
  - **Scenario 2: Double Release Prevention**
    - **Given** a milestone is already in `RELEASED` state,
    - **When** duplicate approval requests are transmitted concurrently,
    - **Then** Engine 01 FSM rejects the second request with `INVALID_STATE_TRANSITION`, ensuring zero duplicate financial disbursements occur.

---

### US-04: Automated Milestone Review Timeout Watchdog
- **Primary Role**: Freelancer (Beneficiary) / System Scheduler
- **Owning Engine**: Engine 01 (OS · Vaishnavi)
- **Traceability**: FR-02, FR-12 | NFR-05 | Decision D-02
- **User Story**:
  > **As a** Freelancer,
  > **I want the system to** automatically trigger a review timeout watchdog if the client remains inactive for 7 calendar days,
  > **So that** my funds are not trapped indefinitely in review limbo and I am protected against client abandonment.
- **Acceptance Criteria**:
  - **Scenario 1: Watchdog Timeout Trigger**
    - **Given** a deliverable was submitted and has remained in `UNDER_REVIEW` for $> 7$ calendar days without client approval or rejection,
    - **When** the Engine 01 watchdog scheduler evaluates milestone deadlines,
    - **Then** the milestone transitions automatically from `UNDER_REVIEW` to `REVIEW_TIMEOUT`, auto-escalating the funds for administrative release or arbitration to prevent payment starvation.

---

### US-05: Dispute Escalation & Counter-Evidence Submission
- **Primary Role**: Client or Freelancer
- **Owning Engine**: Engine 02 (DSA & SE · Darshan) & Engine 04 (Web · Vaibhav)
- **Traceability**: FR-04, FR-09 | NFR-02, NFR-03 | UC-04
- **User Story**:
  > **As a** Client or Freelancer in conflict over a milestone deliverable,
  > **I want to** formally raise a dispute and attach SHA-256 hashed counter-evidence,
  > **So that** escrow funds are frozen immediately and the case is submitted to an impartial arbiter.
- **Acceptance Criteria**:
  - **Scenario 1: Dispute Initiation & Fund Freeze**
    - **Given** a milestone is in `SUBMITTED` or `UNDER_REVIEW` state,
    - **When** either party clicks "Raise Dispute", inputs grievance rationale, and uploads evidence files,
    - **Then** Engine 02 hashes the evidence with SHA-256, Engine 01 transitions the milestone and contract to `DISPUTED`, automated fund releases are frozen, and a case is created in `Dispute`.

---

### US-06: Hierarchical Evidence Tree Adjudication
- **Primary Role**: Dispute Reviewer / Arbiter
- **Owning Engine**: Engine 02 (DSA & SE · Darshan) & Engine 04 (Web · Vaibhav)
- **Traceability**: FR-04, FR-06, FR-09 | NFR-02, NFR-09 | UC-04
- **User Story**:
  > **As a** designated Dispute Reviewer,
  > **I want to** inspect the structured Evidence Tree and deliverable checksums in the Reviewer Console,
  > **So that** I can objectively evaluate the timeline of deliverables and counter-arguments to issue a fair, binding ruling.
- **Acceptance Criteria**:
  - **Scenario 1: Complete Timeline Inspection**
    - **Given** I am authenticated with role `'REVIEWER'`,
    - **When** I open an active dispute case,
    - **Then** Engine 02 renders the hierarchical N-ary `EvidenceTree` via $O(V+E)$ traversal, displaying the contract specs, milestone deliverables, SHA-256 hash verifications, and chronological counter-evidence.
  - **Scenario 2: Binding Ruling Execution**
    - **Given** I have reviewed all evidence nodes,
    - **When** I submit a ruling (`RELEASE_TO_FREELANCER`, `REFUND_TO_CLIENT`, or `SPLIT_SETTLEMENT`) with justification notes,
    - **Then** Engine 03 commits the ruling, executes the corresponding ledger disbursement, transitions the milestone to `RESOLVED`, and logs the action immutably in `AuditLog`.

---

### US-07: Objective Semantic Proposal Matching
- **Primary Role**: Client
- **Owning Engine**: Engine 02 (DSA & SE Primary · Darshan) & Engine 03 (DBMS Supporting · Purvi)
- **Traceability**: FR-11 | NFR-01 | UC-05
- **User Story**:
  > **As a** Client reviewing bids for my posted project,
  > **I want to** see incoming proposals scored and ranked by an objective AI semantic matcher,
  > **So that** I can rapidly identify the best qualified freelancer based on skill taxonomy overlap, profile credibility, and budget compatibility.
- **Acceptance Criteria**:
  - **Scenario 1: Deterministic Match Score Calculation**
    - **Given** a project with required skill tags and a submitted proposal from a registered freelancer,
    - **When** the proposal is indexed,
    - **Then** Engine 02 computes a deterministic score ($0.00–100.00\%$) combining Jaccard tag similarity, developer reputation metrics, and rate alignment, storing `aiMatchScore` in `Proposal`.
  - **Scenario 2: Sorted Client Review**
    - **Given** multiple freelancers submit proposals for the same project,
    - **When** the Client opens the proposal review tab,
    - **Then** proposals are rendered sorted in descending order of `aiMatchScore` within $\le 500\text{ ms}$ (NFR-01).

---

### US-08: Tamper-Resistant Audit Log Inspection
- **Primary Role**: Administrator / Auditor
- **Owning Engine**: Engine 03 (DBMS · Purvi) & Engine 04 (Web · Vaibhav)
- **Traceability**: FR-06, FR-08 | NFR-02, NFR-09
- **User Story**:
  > **As an** Administrator or Compliance Auditor,
  > **I want to** inspect the append-only audit trail and verify SHA-256 verification hash chains,
  > **So that** I can prove zero unauthorized state alterations, financial tampering, or deletion anomalies have occurred on the platform.
- **Acceptance Criteria**:
  - **Scenario 1: Audit Verification Success**
    - **Given** I am logged in with role `'ADMIN'`,
    - **When** I navigate to `/audit` and inspect milestone and transaction history,
    - **Then** the system displays 100% of recorded state transitions with UTC timestamps, actor IDs, before/after JSON states, and recalculates the verification hash chain with 0 integrity mismatches.
  - **Scenario 2: Unauthorized Access Rejection**
    - **Given** a non-admin user (Client or Freelancer) attempts to access `/audit` or `/api/audit`,
    - **When** the HTTP request is processed,
    - **Then** server-side RBAC middleware rejects the request with HTTP 403 Forbidden.
