# Functional Requirements Document (FRD)

> **Academic Milestone**: Stage S1 — Requirements Engineering Baseline (Gate 1 Deliverable 1)
> **Institution**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi) — Dept. of CSE
> **Curriculum Framework**: Engine-Based Mini-Project Framework with Hybrid SDLC
> **Team**: Team 07 (Theme 01)
> **Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
> **Authoritative References**: `docs/source-material/Team07_Escrow_Mini_Project_KLE_Theme.pptx` (Slide 18 & 21), `docs/source-material/Mini_Project_Gate_0_details_FILLED.docx` (Steps 4 & 5).

---

## 1. Executive Summary & Purpose

This Functional Requirements Document (FRD) formally specifies the complete behavioral requirements, actor permissions, inputs, outputs, error conditions, and acceptance criteria for the *Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow*.

Every requirement follows the university standard definition template:
$$\text{FR: The system shall } [\text{perform behaviour}] \text{ for } [\text{actor}] \text{ when } [\text{condition/trigger}], \text{ producing } [\text{expected outcome}].$$

---

## 2. Granular Functional Requirements (FR-01 to FR-12)

### FR-01: Escrow Fund Locking
- **Formal Specification**:
  The system shall atomically lock the specified milestone funds from the client's available account into an escrow holding balance for the **Client** when the client initiates a contract or funds an active milestone, producing a milestone state of `FUNDED` and a guaranteed escrow lock without exposing funds to pre-delivery withdrawal.
- **Owning Engine & Owner**: **Engine 01 (OS Engine)** — Vaishnavi Modekar (`02FE24BCS060`)
- **Engineering Rationale**: Solves S0 Problem 1 (Payment Uncertainty). Freelancers refuse to commence work without guaranteed payment commitments; clients refuse upfront unearned disbursement. Locking funds in simulated escrow eliminates mutual counterparty risk.
- **Inputs**: `contractId` (UUIDv4), `milestoneId` (UUIDv4), `clientId` (UUIDv4), `amount` (Decimal > 0.00).
- **Outputs**: HTTP 200 with updated `Milestone` (`status: "FUNDED"`), `Contract` (`escrowBalance`), and `EscrowTransaction` record (`type: "LOCK"`).
- **Preconditions**: Client is authenticated; milestone status is `AWAITING_DEPOSIT`; client `availableBalance >= amount`.
- **Postconditions**: Milestone status is `FUNDED`; client available balance debited; contract escrow balance credited; invariant $\sum \Delta B = 0$ preserved.
- **Error Modes**:
  - Insufficient client balance $\implies$ HTTP 400 `INSUFFICIENT_FUNDS`.
  - Duplicate funding attempt $\implies$ HTTP 422 `ALREADY_FUNDED`.
  - Database lock contention $\implies$ HTTP 503 `LOCK_CONTENTION_RETRY`.

---

### FR-02: Milestone State Tracking & FSM Validation
- **Formal Specification**:
  The system shall enforce deterministic finite-state machine (FSM) transitions and reject out-of-order state mutations for **All Authenticated Actors** when any milestone lifecycle operation is requested, producing deterministic progression through the lifecycle:
  $$\text{AWAITING\_DEPOSIT} \to \text{FUNDED} \to \text{IN\_PROGRESS} \to \text{SUBMITTED} \to \text{UNDER\_REVIEW} \to \text{APPROVED} \to \text{RELEASED}$$
  *(Exception paths: $\to \text{DISPUTED}$, $\to \text{REFUNDED}$, $\to \text{REVIEW\_TIMEOUT}$)*.
- **Owning Engine & Owner**: **Engine 01 (OS Engine)** — Vaishnavi Modekar (`02FE24BCS060`)
- **Engineering Rationale**: Solves S0 Problem 1 & 4 (Process Ambiguity & Race Conditions). Deterministic states prevent illegal shortcuts (e.g. releasing funds before deposit or deliverable submission).
- **Inputs**: `milestoneId` (UUIDv4), `targetState` (Enum), `actorId` (UUIDv4).
- **Outputs**: HTTP 200 with new state; or HTTP 422 with `INVALID_STATE_TRANSITION` and allowable next states.
- **Preconditions**: Milestone exists in database.
- **Postconditions**: State updated if transition is permitted by transition table; transition rejected and rolled back if illegal.
- **Error Modes**:
  - Transition from `RELEASED` to any other state $\implies$ HTTP 422 `TERMINAL_STATE_IMMUTABLE`.
  - Transition from `AWAITING_DEPOSIT` to `RELEASED` $\implies$ HTTP 422 `INVALID_TRANSITION`.

---

### FR-03: Cryptographic Deliverable Checksumming
- **Formal Specification**:
  The system shall compute a 64-character hexadecimal SHA-256 cryptographic digest of submitted files or code artifacts for the **Freelancer** when a deliverable is uploaded, producing an immutable checksum record stored in the database for future tamper verification.
- **Owning Engine & Owner**: **Engine 02 (DSA & SE Engine)** — Darshan Kittur (`02FE24BCS053`)
- **Engineering Rationale**: Solves S0 Problem 2 (Lack of Centralized Evidence & Deliverable Repudiation). Guarantees non-repudiation and provides mathematical proof that deliverable files inspected by clients or arbiters are bit-for-bit identical to what was uploaded.
- **Inputs**: Multipart file stream or text URL, `milestoneId` (UUIDv4), `freelancerId` (UUIDv4).
- **Outputs**: `sha256Checksum` (64-char hex string), `Deliverable` record created.
- **Preconditions**: Milestone is in `FUNDED` or `IN_PROGRESS` state; file size $\le 50\text{ MB}$.
- **Postconditions**: Deliverable record persisted; SHA-256 checksum immutably recorded; milestone transitioned to `SUBMITTED`.
- **Error Modes**:
  - File exceeds 50 MB limit $\implies$ HTTP 413 `PAYLOAD_TOO_LARGE`.
  - Disallowed file MIME type $\implies$ HTTP 415 `UNSUPPORTED_MEDIA_TYPE`.

---

### FR-04: Tamper-Evident Evidence Tree Construction
- **Formal Specification**:
  The system shall index all contract agreements, milestone deliverables, rejection notices, and dispute arguments into an in-memory hierarchical N-ary tree (`EvidenceTree`) for the **Dispute Reviewer** when an arbitration case is opened, producing an ordered, verifiable causal timeline with $O(V+E)$ traversal complexity.
- **Owning Engine & Owner**: **Engine 02 (DSA & SE Engine)** — Darshan Kittur (`02FE24BCS053`)
- **Engineering Rationale**: Solves S0 Problem 3 (Unstructured Dispute Resolution). Flat file listings obscure the causal chain of events (e.g., Deliverable Revision 2 submitted in response to Client Rejection 1). A tree structure preserves causality and enables automated SHA-256 integrity verification across all evidence nodes.
- **Inputs**: `disputeId` (UUIDv4).
- **Outputs**: JSON serialization of `EvidenceTree` with node hashes, author roles, timestamps, and causal edge relationships.
- **Preconditions**: Milestone status is `DISPUTED`; actor possesses role `'REVIEWER'` or `'ADMIN'`.
- **Postconditions**: Arbiters receive complete, chronologically and topologically ordered evidence DAG.
- **Error Modes**:
  - Checksum mismatch on any node $\implies$ Flag node with `HASH_TAMPERING_DETECTED` warning.

---

### FR-05: ACID Payment Ledger Processing
- **Formal Specification**:
  The system shall execute balance debits, escrow releases, and dispute refunds inside serialized ACID database transactions for the **Escrow Engine** when milestone completion is approved or an arbitration ruling is issued, producing balanced ledger updates satisfying $\sum \Delta B = 0$ with complete rollback on any failure.
- **Owning Engine & Owner**: **Engine 03 (DBMS Engine)** — Purvi Sammatshetti (`02FE24BCS022`)
- **Engineering Rationale**: Solves S0 Problem 1 (Double-Spending & Balance Discrepancy). Ensures financial conservation across client, escrow vault, and freelancer accounts under high concurrency.
- **Inputs**: `contractId`, `milestoneId`, `sourceAccountId`, `destinationAccountId`, `amount`, `transactionType`.
- **Outputs**: Immutable `EscrowTransaction` record, updated account balances, HTTP 200.
- **Preconditions**: Source account or escrow vault has balance $\ge \text{amount}$.
- **Postconditions**: All balance mutations committed simultaneously; transaction record appended.
- **Error Modes**:
  - Database serialization conflict $\implies$ Complete rollback, retry up to 3 times, then HTTP 500 `TRANSACTION_ABORTED`.
  - Balance discrepancy ($\sum \Delta B \ne 0$) $\implies$ Abort transaction immediately.

---

### FR-06: Tamper-Resistant Cryptographic Audit Logging
- **Formal Specification**:
  The system shall append an immutable audit record containing actor ID, entity UUID, action verb, timestamp, and SHA-256 verification hash for **All System Operations** when any contract, milestone, or dispute state is mutated, producing an unalterable chronological audit trail.
- **Owning Engine & Owner**: **Engine 03 (DBMS Engine)** — Purvi Sammatshetti (`02FE24BCS022`)
- **Engineering Rationale**: Solves S0 Problem 4 (Lack of Audit Trails & Governance). Provides non-repudiable compliance evidence for academic evaluators, auditors, and platform administrators.
- **Inputs**: `actorId`, `entityName`, `entityId`, `action`, `previousState` (JSON), `newState` (JSON).
- **Outputs**: `AuditLog` row with calculated `verificationHash` = $\text{SHA-256}(\text{actor} + \text{entity} + \text{action} + \text{newState} + \text{timestamp} + \text{prevHash})$.
- **Preconditions**: State-changing operation is triggered.
- **Postconditions**: Audit record inserted; SQLite triggers disallow SQL `UPDATE` and `DELETE` on `AuditLog`.
- **Error Modes**:
  - Attempt to update or delete audit row $\implies$ SQL engine aborts statement with `AUDIT_LOG_IMMUTABLE`.

---

### FR-07: Role-Based Workflow Dashboards
- **Formal Specification**:
  The system shall render customized responsive dashboards and workflows for **Clients, Freelancers, Dispute Reviewers, and Administrators** when authenticated users navigate to protected views, producing role-tailored tooling, action buttons, and metric summaries.
- **Owning Engine & Owner**: **Engine 04 (Web Technologies Engine)** — Vaibhav Chavanpatil (`02FE24BCS013`)
- **Engineering Rationale**: Solves S0 Problem 4 (Role Confusion & Unauthorized Access). Ensures clean separation of duties so clients cannot perform freelancer actions, and neither party can adjudicate their own dispute.
- **Inputs**: Authenticated user session cookie / JWT token.
- **Outputs**: Tailored React 19 UI component tree (Client Dashboard, Freelancer Workspace, Reviewer Console, Admin Inspector).
- **Preconditions**: Valid authenticated session.
- **Postconditions**: User is presented only with controls authorized for their active role.
- **Error Modes**:
  - Role mismatch $\implies$ HTTP 403 Forbidden redirected to unauthorized role notice.

---

### FR-08: Authentication & Server-Side RBAC Enforcement
- **Formal Specification**:
  The system shall validate credentials and enforce server-side Role-Based Access Control on 100% of API endpoints and server actions for **All HTTP Requests**, producing authorized data access or returning HTTP 401/403 error envelopes for unauthorized attempts.
- **Owning Engine & Owner**: **Engine 04 (Web Technologies Engine)** — Vaibhav Chavanpatil (`02FE24BCS013`)
- **Engineering Rationale**: Solves S0 Security Problem. Client-side UI hiding is insufficient; every endpoint must independently authenticate and authorize callers to prevent API spoofing and unauthorized fund releases.
- **Inputs**: HTTP Authorization header / session cookie.
- **Outputs**: Authorized execution or HTTP 401 Unauthorized / HTTP 403 Forbidden.
- **Preconditions**: Incoming HTTP request.
- **Postconditions**: Request passed to controller if authorized; aborted immediately if unauthenticated or unauthorized.
- **Error Modes**:
  - Expired or malformed token $\implies$ HTTP 401 `INVALID_SESSION`.
  - Insufficient role permission $\implies$ HTTP 403 `INSUFFICIENT_PERMISSIONS`.

---

### FR-09: Multi-Role Evidence-Based Dispute Workflow
- **Formal Specification**:
  The system shall provide a multi-step dispute submission and evidence attachment workflow for **Clients and Freelancers** when a milestone deliverable is contested, producing frozen escrow funds and alerting designated Dispute Reviewers for arbitration.
- **Owning Engine & Owner**: **Engine 04 (Web Technologies Engine)** — Vaibhav Chavanpatil (`02FE24BCS013`)
- **Engineering Rationale**: Solves S0 Problem 3 (Unstructured, Subjective Disputes). Replaces chaotic email/chat arguing with structured grievance categorization, counter-evidence submission, and binding human arbitration.
- **Inputs**: `milestoneId`, `reason` (Text), `evidenceFiles` (Multipart), `claimantId`.
- **Outputs**: `Dispute` record (`status: "OPEN"`), milestone transitioned to `DISPUTED`, escrow funds frozen.
- **Preconditions**: Milestone status is `UNDER_REVIEW` or `SUBMITTED`.
- **Postconditions**: Automated releases disabled; Reviewer Console populated with dispute case.
- **Error Modes**:
  - Milestone already `RELEASED` $\implies$ HTTP 422 `CANNOT_DISPUTE_RELEASED_MILESTONE`.

---

### FR-10: Real-Time FSM State Visualizer (5-Second Poller)
- **Formal Specification**:
  The system shall visually update milestone progress steppers, escrow lock badges, and action buttons across client and freelancer dashboards for **Active Users** using a 5-second polling synchronization cycle, producing reactive UI state synchronization without requiring full manual page refreshes.
- **Owning Engine & Owner**: **Engine 04 (Web Technologies Engine)** — Vaibhav Chavanpatil (`02FE24BCS013`)
- **Engineering Rationale**: Solves S0 Problem 4 (State Asynchrony). Keeps both parties aligned in real-time when deliverables are submitted or escrow funds are released.
- **Inputs**: `contractId`, active browser viewport.
- **Outputs**: Updated React component tree with current FSM state, step indicators, and newly activated action buttons.
- **Preconditions**: User has active contract dashboard open.
- **Postconditions**: Dashboard state matches database state within $\le 5.0\text{ seconds}$ + network latency.
- **Error Modes**:
  - Network disconnect $\implies$ Graceful offline retry banner; no application crash.

---

### FR-11: Heuristic Semantic Proposal Matcher
- **Formal Specification**:
  The system shall compute an objective compatibility match score ($0.00–100.00\%$) between project skill tags, budgets, and freelancer profiles for the **Client** when proposals are indexed, producing sorted proposal rankings to streamline freelancer selection.
- **Owning Engine & Owner**: **Engine 02 (DSA/SE Primary)** — Darshan Kittur (`02FE24BCS053`) | **Engine 03 (DBMS Supporting)** — Purvi Sammatshetti (`02FE24BCS022`)
- **Engineering Rationale**: Solves S0 Problem (Skills & Rate Mismatch). Eliminates client cognitive overload by highlighting the most relevant candidates using objective Jaccard set similarity and verified reputation metrics.
- **Formula**:
  $$\text{MatchScore} = 0.50 \times \text{Jaccard}(T_{\text{project}}, T_{\text{freelancer}}) + 0.30 \times \text{DevScore} + 0.20 \times \text{BudgetCompatibility}$$
- **Inputs**: `projectId`, `freelancerId`, `bidAmount`.
- **Outputs**: `aiMatchScore` (Decimal, 0.00–100.00), stored in `Proposal`.
- **Preconditions**: Project has defined skill tags; freelancer has profile tags.
- **Postconditions**: Client views proposals ordered by descending match score.
- **Error Modes**:
  - Zero overlapping tags $\implies$ Jaccard score = 0.00; total score computed from remaining components.

---

### FR-12: Contract Lifecycle Orchestration & Watchdog Scheduling
- **Formal Specification**:
  The system shall coordinate contract activation, sequential milestone progression ($m_{k} \to m_{k+1}$), and a 7-day client review watchdog timer for the **System Scheduler & Contract Parties**, producing automatic contract closure upon final milestone release or triggering timeout escalation upon client review abandonment.
- **Owning Engine & Owner**: **Engine 01 (OS Engine)** — Vaishnavi Modekar (`02FE24BCS060`)
- **Engineering Rationale**: Solves S0 Problem 1 (Indefinite Client Inaction). Protects freelancers from payment starvation when clients abandon submissions.
- **Inputs**: `contractId`, system wall-clock time (`reviewDeadline = submittedAt + 7 days`).
- **Outputs**: Sequential milestone activation or transition to `REVIEW_TIMEOUT`.
- **Preconditions**: Milestone submitted and under review.
- **Postconditions**: Watchdog timer preempts idle state if 7 days elapse without client review.
- **Error Modes**:
  - Premature watchdog trigger $\implies$ Scheduler asserts `currentTime >= reviewDeadline` before firing.

---

## 3. Role-Based Access Control (RBAC) Permission Matrix

The following matrix formally specifies which roles are permitted to trigger each Functional Requirement:

| Action / Operation | Client | Freelancer | Dispute Reviewer | Admin / Auditor |
| :--- | :---: | :---: | :---: | :---: |
| **FR-01: Lock Escrow Deposit** | **ALLOW** | DENY (403) | DENY (403) | DENY (403) |
| **FR-02: Trigger FSM State Action** | ALLOW (Approve/Reject) | ALLOW (Submit) | ALLOW (Resolve) | ALLOW (Override) |
| **FR-03: Upload Deliverable & Hash** | DENY (403) | **ALLOW** | DENY (403) | DENY (403) |
| **FR-04: Inspect Evidence Tree** | ALLOW (Own Case) | ALLOW (Own Case) | **ALLOW (All Cases)** | **ALLOW (All Cases)** |
| **FR-05: Release Escrow Funds** | **ALLOW** | DENY (403) | ALLOW (Via Ruling) | DENY (403) |
| **FR-06: Query Audit Trail** | DENY (403) | DENY (403) | ALLOW (Case Scope) | **ALLOW (Full Audit)** |
| **FR-07: Access Reviewer Console** | DENY (403) | DENY (403) | **ALLOW** | ALLOW |
| **FR-08: Authentication & Session** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| **FR-09: Raise Dispute** | **ALLOW** | **ALLOW** | DENY (403) | DENY (403) |
| **FR-09: Issue Dispute Ruling** | DENY (403) | DENY (403) | **ALLOW** | DENY (403) |
| **FR-10: Poll Milestone State** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| **FR-11: View Proposal Match Scores**| **ALLOW** | ALLOW (Own Bid) | DENY (403) | ALLOW |
| **FR-12: Trigger Watchdog Timeout** | SYSTEM | SYSTEM | SYSTEM | **ALLOW** |

---

## 4. Contract Action Protocol Specification
The primary contract transitions execute via `POST /api/contracts` with strict payload validations:
1. `SUBMIT_MILESTONE`: Developer uploads deliverable file or URL $\to$ SHA-256 hash computed $\to$ Milestone marked `SUBMITTED` $\to$ Contract marked `UNDER_REVIEW`.
2. `APPROVE_MILESTONE`: Client inspects deliverable and hash proof $\to$ marks Milestone `APPROVED` $\to$ triggers escrow release validation.
3. `RELEASE_ESCROW`: FSM verifies compliance $\to$ atomically releases funds to developer ledger $\to$ contract status set to `RELEASED`.
