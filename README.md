# Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow

> **Academic Context**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering and Technology, Belagavi)
> **Department**: Department of Computer Science and Engineering
> **Team**: Team 07 (Theme 01)
> **Repository**: [VAIBHAV7848/mini-project](https://github.com/VAIBHAV7848/mini-project)
> **Live Production Platform**: [https://giga-flow.vercel.app](https://giga-flow.vercel.app)
>
> **Source of Truth Statement**: Official team project documents are the authoritative source of project requirements and scope. `README.md` is public project documentation derived from the authoritative project materials.

---

## 1. Project Overview

Freelance software development and gig marketplaces frequently suffer from two symmetrical trust failure modes:
1. **Client Default**: Freelancers invest time and technical effort with no guarantee of timely payment or fair review.
2. **Deliverable Non-Performance**: Clients deposit funds upfront with no verifiable proof of code quality, adherence to requirements, or deliverable authenticity.

Traditional gig platforms rely on centralized, opaque dispute mechanisms that judge work subjectively without cryptographic verification.

This platform resolves this dilemma through a **Milestone-Based Escrow and Evidence-Based Dispute Resolution Workflow**:
- **Milestone-Based Escrow**: Contracts are partitioned into sequential, funded milestones. Client deposits are locked in a simulated double-entry ledger before work begins. Funds are released atomically per milestone only upon explicit client approval or upon expiration of an automated 7-calendar-day review window (`REVIEW_TIMEOUT`), preventing developer payment starvation.
- **Evidence-Based Dispute Resolution**: When deliverables are contested, both parties submit cryptographic evidence (SHA-256 deliverable checksums, technical specifications, and communication logs). An in-memory Merkle Evidence Tree links all artifacts, enabling independent human dispute reviewers to inspect tamper-evident proof and issue binding rulings (full release, refund, or split settlement).
- **Deterministic Heuristic Proposal Matching (FR-11)**: Freelancer proposals are ranked against client project requirements using a multi-attribute heuristic algorithm evaluating skill tag overlap (Jaccard similarity, 50% weight), budget alignment (30% weight), and developer reputation scores (20% weight) per ADR-010.

---

## 2. Platform Interface & Visual Demonstration

### 🔐 Interactive Mascot Authentication Sentinel (Engine 04)
The login gateway features a real-time reactive SVG mascot sentinel with caret coordinate tracking, 12-node 3D cranial parallax, and cryptographic privacy shielding:

<p align="center">
  <img src="assets/login_screen_demo.gif" alt="Interactive Mascot Login Demo" width="800" style="border-radius: 12px; border: 1px solid #fc6c00;" />
</p>

> **Demonstration Highlights**:
> 1. **Caret Tracking Trigonometry**: Left and right eye pupils track cursor coordinates across the email input using sub-pixel ghost mirroring (`Math.atan2`).
> 2. **Delimiter Jaw Reaction**: Mouth scales up dynamically (`scale: 1.15`) with tooth and tongue drop upon entering the `@` symbol.
> 3. **Biomechanical Eye Covering**: Focusing the password field prompts arms to rise and occlude the eyes (`y: 0`), while shoulders contract into privacy mode.
> 4. **Two-Finger Peek Aperture**: Toggling "Show Password" rotates two fingers outwards by $30^\circ$ (`transformOrigin: 'bottom left'`), revealing the eye aperture while keeping privacy protection engaged.
> 5. **Direct Video Asset**: [Download or View HD Recording (assets/login_screen_demo.mp4)](assets/login_screen_demo.mp4)

---

### 📊 Role-Based Enterprise Dashboards

The presentation layer enforces responsive role-based access control across **Client**, **Freelancer**, **Dispute Reviewer**, and **Admin** workspaces:

| Institutional Dark Theme (GigaFlow Palette) | High-Contrast Light Theme |
| :---: | :---: |
| <img src="assets/dashboard_theme_dark.png" alt="Dashboard Dark Theme" width="480" /> | <img src="assets/dashboard_theme_light.png" alt="Dashboard Light Theme" width="480" /> |
| **Dark Theme (1920×1080 Viewport)** | **Light Theme (1920×1080 Viewport)** |

#### Multi-Role Workspace Views & Responsive Breakpoints

| Responsive Desktop Workspace (1920×1080) | Adaptive High-DPI Grid (1440×900) |
| :---: | :---: |
| <img src="docs/ui-ux/screenshots/dashboard-1920x1080.png" alt="Enterprise Dashboard 1920x1080" width="480" /> | <img src="docs/ui-ux/screenshots/dashboard-1440x900.png" alt="Adaptive Dashboard 1440x900" width="480" /> |
| **Real-Time Escrow & Milestone Allocation** | **Persona Switching & Audit Feed** |

| Milestone Contracts & Escrow Locking | Evidence-Based Dispute Arbitration |
| :---: | :---: |
| <img src="docs/ui-ux/screenshots/projects-1920x1080.png" alt="Contracts and Milestones" width="480" /> | <img src="docs/ui-ux/screenshots/disputes-1920x1080.png" alt="Disputes and Merkle Evidence" width="480" /> |
| **FSM Milestone Sequencing (`FUNDED` → `RELEASED`)** | **Merkle Evidence Tree & Tamper Inspection** |

---

## 3. Key Features

- **Role-Based Access Control (RBAC)**: Dedicated server-enforced interfaces for Clients, Freelancers, Dispute Reviewers, and Administrators (FR-07, FR-08, NFR-02).
- **Project & Service Marketplace**: Clients post custom projects with skill tags; freelancers publish tiered service gigs (`Basic`, `Standard`, `Premium`).
- **Proposal Bidding & Heuristic Matching (FR-11)**: Objective proposal ranking powered by deterministic multi-attribute scoring (Jaccard skill overlap, budget ratio fit, developer reputation score).
- **Milestone Sequencing & Contract Lifecycle (FR-02, FR-12)**: Phased milestone execution enforcing strict sequential dependencies (milestone $K+1$ cannot start until prior milestones resolve).
- **Simulated ACID Escrow Ledger (FR-01, FR-05, NFR-08)**: Double-entry accounting enforcing mathematical balance conservation: $\Delta\text{Escrow} + \Delta\text{User} = 0$.
- **Automated Watchdog Review Timeout (FR-02, D-02)**: Automated 7-calendar-day review window scheduler transitioning overdue reviews to `REVIEW_TIMEOUT` and triggering escrow release.
- **Cryptographic SHA-256 Deliverable Checksumming (FR-03, NFR-03)**: Streaming digest computation for all submitted deliverable artifacts.
- **Hierarchical Merkle Evidence Trees (FR-04)**: In-memory N-ary tree data structure enabling $O(V+E)$ traversal and immediate single-bit tampering detection.
- **Human Reviewer Arbitration (FR-09)**: Independent dispute resolution workflow supporting binding split rulings with duplicate ruling prevention.
- **Tamper-Resistant Chained Audit Logging (FR-06, NFR-09)**: Append-only audit trail where every state change and financial transfer is cryptographically linked: $\text{Hash}_n = \text{SHA256}(\text{Payload}_n + \text{Hash}_{n-1})$.
- **Client State Synchronization (FR-10)**: 5-second lightweight polling snapshot returning active contract and milestone states without full-page reloads.

---

## 4. Four Academic Engineering Engines

The architecture partitions system responsibilities across four independently ownable and testable engineering engines:

| Engine | Subject Area | Academic Responsibility | Student Lead |
| :--- | :--- | :--- | :--- |
| **Engine 01 (OS Engine)** | Operating Systems | Escrow FSM transitions, state scheduling, `KeyedMutex` critical sections, and review timeout watchdog mechanics | Vaishnavi Modekar |
| **Engine 02 (DSA & SE Engine)** | Data Structures & Software Engineering | Streaming SHA-256 checksums, Merkle EvidenceTree verification, and deterministic proposal matching | Darshan Kittur |
| **Engine 03 (DBMS Engine)** | Database Management Systems | Relational BCNF schema models, ACID ledger transfers, contract lifecycle orchestration, and chained audit logging | Purvi Sammatshetti |
| **Engine 04 (Web Technologies Engine)** | Web Technologies | Responsive multi-role dashboards, RESTful API route handlers, HMAC session integrity, and server-side RBAC | Vaibhav Chavanpatil |

---

## 5. System Architecture

The platform follows a modular monolithic architecture, enforcing loose coupling between presentation, domain engines, and persistence:

```text
User Interface (Next.js 16 App Router, React 19, Tailwind CSS 4)
      ↓
Web & API Layer (Server Route Handlers, Zod 4 Schemas, Session RBAC)
      ↓
Application & Domain Layer (Contract Action Dispatcher, Lifecycle Coordinators)
      ↓
Four Academic Engineering Engines
├── Engine 01 (OS Engine): Escrow FSM, Watchdog Scheduler, KeyedMutex
├── Engine 02 (DSA & SE Engine): SHA-256 Hasher, EvidenceTree, Semantic Matcher
├── Engine 03 (DBMS Engine): Ledger Coordinator, Contract Manager, Audit Logger
└── Engine 04 (Web Engine): RBAC Enforcer, Session Service, State Poller
      ↓
Persistence Layer (SQLite Database in WAL Journal Mode)
      ↓
Prisma 5.22 ORM (Serialized ACID Transactions, Foreign Key Constraints)
```

### Architectural Diagrams

| Four-Engine Decomposition | Escrow Finite State Machine (OS Engine) |
| :---: | :---: |
| <img src="assets/diagram_four_engines.png" alt="Four-Engine Architecture" width="480" /> | <img src="assets/diagram_escrow_fsm.png" alt="Escrow State Machine" width="480" /> |
| **Inter-Engine Boundaries & Responsibilities** | **Deterministic Sequential FSM Transitions** |

| Double-Entry ACID Ledger (DBMS Engine) | Merkle Evidence Tree (DSA & SE Engine) |
| :---: | :---: |
| <img src="assets/diagram_acid_ledger.png" alt="ACID Ledger" width="480" /> | <img src="assets/diagram_evidence_tree.png" alt="Merkle Evidence Tree" width="480" /> |
| **Mathematical Conservation ($\Delta\text{Escrow} + \Delta\text{User} = 0$)** | **Hierarchical N-Ary Tamper Detection** |

Detailed architectural specifications and diagrams:
- [System Architecture Specification](docs/architecture/architecture.md)
- [C4 Context Diagram](docs/architecture/c4-context.md)
- [C4 Container Diagram](docs/architecture/c4-container.md)
- [C4 Component Diagram](docs/architecture/c4-component.md)
- [Engine Boundaries & Module Contracts](docs/architecture/engine-boundaries.md)

---

## 6. Core Operational Workflow

```text
Client posts project / Freelancer lists service gig
        ↓
Freelancer submits proposal with bid amount
        ↓
Deterministic semantic proposal matching (Jaccard + Budget + DevScore)
        ↓
Client accepts proposal & establishes phased contract
        ↓
Client deposits funds into escrow (Contract Status: FUNDED)
        ↓
Freelancer begins milestone work (Sequential dependency enforced)
        ↓
Deliverable submitted with SHA-256 digest & 7-day review timer starts
        ↓
Client Review Window
        ├── Approve → Escrow atomically released → Next milestone auto-activates
        ├── 7-day Timeout → Watchdog transitions to REVIEW_TIMEOUT → Auto-release
        └── Dispute Raised → Milestone marked DISPUTED → Escrow frozen
                ↓
        Dispute Arbitration:
        ├── Counter-evidence uploaded with SHA-256 checksums
        ├── Independent reviewer inspects in-memory Merkle EvidenceTree
        └── Reviewer issues binding ruling (Release / Refund / Split Settlement)
        ↓
Append-only cryptographic SHA-256 chained audit log records every event
```

---

## 7. Technology Stack

| Layer / Component | Technology | Version | Engineering Justification |
| :--- | :--- | :---: | :--- |
| **Framework** | Next.js App Router | 16.3.8 | Modern React server components and Turbopack bundling |
| **UI Library** | React | 19.0.0 | Concurrent rendering, modern hooks, and component modularity |
| **Language** | TypeScript | 5.7.0 | Strict static type checking across API contracts and engines |
| **Styling** | Tailwind CSS | 4.0.0 | High-performance CSS compiler with zero-runtime utility styling |
| **Validation** | Zod | 4.6.5 | Defensive schema parsing on all incoming API request payloads |
| **Persistence** | Prisma ORM | 5.22.0 | Type-safe query building and automated relational migrations |
| **Database** | SQLite | 3 | Embedded relational storage configured in WAL mode |
| **Security & Hashes** | Node.js Crypto | Built-in | SHA-256 deliverable hashing and HMAC session signatures |
| **Test Runner** | Vitest | 3.2.7 | Fast TypeScript-native test runner with serialized DB support |
| **Icons** | Lucide React | 1.50.0 | Accessible vector iconography |

---

## 8. Security Architecture

- **Server-Side RBAC Enforcement (NFR-02)**: Role permissions (`CLIENT`, `FREELANCER`, `REVIEWER`, `ADMIN`) are strictly enforced within server-side API route handlers via `RbacEnforcer`. Frontend tabs are visual routing conveniences; direct unauthorized requests return HTTP 401/403.
- **Session Token Integrity**: Session tokens utilize HMAC-SHA256 signatures verified with timing-safe comparisons (`SessionService`), preventing signature tampering and replay attacks.
- **Defensive Input Validation (NFR-04)**: All API route inputs are validated against strict Zod 4 schemas prior to database operations. Malformed payloads return standardized HTTP 400 envelopes.
- **Cross-Tenant IDOR Mitigation**: Contract, milestone, and deliverable operations enforce tenant ownership checks against database foreign keys before executing mutations.
- **Cryptographic Evidence Checksums (NFR-03)**: Deliverable code files and dispute evidence items are hashed using streaming SHA-256. Any modification to an uploaded artifact invalidates the Merkle root hash.
- **Append-Only Chained Audit Trail (NFR-09)**: Every financial movement and FSM state transition creates an audit log entry cryptographically linked to the previous entry, providing verifiable historical immutability.

Detailed security documentation:
- [Security Policy](SECURITY.md)
- [Security Architecture Model](docs/security/security-model.md)

---

## 9. Testing & Verification

The platform enforces a test-driven verification pipeline where every requirement is validated with automated tests:

```text
================================================================================
VERIFICATION SUMMARY
================================================================================
  - Total Automated Tests:      75 / 75 PASSING (100% Pass Rate)
  - Total Test Suites:          14 Test Files
  - TypeScript Compiler:        0 Errors (npx tsc --noEmit: Clean)
  - Next.js Production Build:   Compiled Successfully via Turbopack
  - Verification Pipeline:      100% Passing (./scripts/verify)
================================================================================
```

### Test Suite Execution
```bash
# Execute the full automated test suite (75 tests across 14 suites)
npm test

# Verify static TypeScript type safety
npx tsc --noEmit

# Compile production build
npm run build

# Run repository verification pipeline (linting, whitespace, security scan)
./scripts/verify
```

---

## 10. Performance & Benchmarking

Empirical benchmarks executed against the SQLite WAL database engine and Next.js route handlers are recorded in [Performance Results](docs/development/performance-results.md):

### NFR-01: Performance — API Latency under Concurrency (50 Concurrent Workers, 500 Requests)

- **Quality Attribute**: Performance (`docs/requirements/non-functional-requirements.md`)
- **Approved Target KPI**: $P_{95}\text{ latency} \le 500.0\text{ ms}$ across all API endpoints (Workload condition: 50 concurrent requests on local benchmark dataset)
- **Verification Methodology**: Automated load runner (`scripts/benchmark-load.ts`) executing 50 simultaneous parallel workers across 1,500 total requests

| Route | Concurrency | Total Requests | Throughput | $P_{50}$ (ms) | $P_{95}$ (ms) | Target KPI | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `GET /api/projects` | 50 | 500 | 674.7 req/s | 48.96 | **74.07** | $\le 500.0\text{ ms}$ | **PASS** |
| `GET /api/gigs` | 50 | 500 | 7,455.3 req/s | 5.03 | **7.17** | $\le 500.0\text{ ms}$ | **PASS** |
| `GET /api/contracts` *(Auth)* | 50 | 500 | 5,247.0 req/s | 6.70 | **9.84** | $\le 500.0\text{ ms}$ | **PASS** |

### NFR-09: Auditability — 100,000 Record Audit Retrieval Benchmark

- **Quality Attribute**: Auditability (`docs/requirements/non-functional-requirements.md`)
- **Approved Target KPI**: 100% of state transitions captured in append-only audit log
- **Empirical Scale Benchmark**: Query retrieval latency over 100,000 cryptographically chained records in SQLite WAL mode (`scripts/benchmark-audit-latency.ts`):

| Query Pattern | Index Used | $P_{50}$ (ms) | $P_{95}$ (ms) | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Indexed Entity Lookup** | `@@index([entityName, entityId])` | 2.29 | **3.42** | **PASS** |
| **Timestamp Range Query** | `@@index([timestamp(sort: Desc)])` | 1.07 | **2.40** | **PASS** |
| **Paginated System Scan** | `@@index([timestamp(sort: Desc)])` | 0.59 | **0.78** | **PASS** |

### Client Polling State Synchronization (FR-10 / Performance Architecture §2.5)

- **Quality Attribute**: Client State Consistency (FR-10 FSM Progress UI)
- **Benchmark Specification**: 5-second polling interval against active contracts (`scripts/benchmark-nfr10-sync.ts`):

| Metric | Measured Value | Target Threshold | Status |
| :--- | :--- | :--- | :---: |
| **Snapshot Payload Size** | 1,343 bytes (1.31 KB) | $\le 5,120\text{ bytes}$ (5.0 KB) | **PASS** |
| **DB Snapshot Query ($P_{95}$)** | 1.70 ms | $\le 15.0\text{ ms}$ | **PASS** |
| **API Polling Route Latency ($P_{95}$)** | 1.82 ms | $\le 100.0\text{ ms}$ | **PASS** |
| **Total 5s Polling Sync ($P_{95}$)** | 5,001.82 ms (5.002 s) | $\le 5,500.0\text{ ms}$ (5.5 s) | **PASS** |

> *Note on NFR-10 (Fault Tolerance)*: Per `docs/requirements/non-functional-requirements.md`, NFR-10 specifies Fault Tolerance (zero unhandled server crashes, standardized JSON error envelopes), verified via defensive Zod boundary validation and error envelope middleware.

---

## 11. Requirements Traceability

The repository maintains strict end-to-end traceability connecting specifications directly to source code and tests:

$$\text{Requirement} \to \text{Use Case} \to \text{Acceptance Criteria} \to \text{Engine} \to \text{Source Code} \to \text{Tests} \to \text{Status}$$

### Functional Requirements Baseline (FR-01 to FR-12)

| FR-ID | Title | Owning Engine & Lead | Acceptance Criteria Summary |
| :--- | :--- | :--- | :--- |
| **FR-01** | Escrow Fund Locking | Engine 01 (OS · Vaishnavi) | Atomic locking of client funds into escrow vault before work commences; zero double-allocation. |
| **FR-02** | Milestone State Tracking | Engine 01 (OS · Vaishnavi) | Deterministic sequential milestone FSM transitions (`AWAITING_DEPOSIT` → `FUNDED` → `IN_PROGRESS` → `UNDER_REVIEW` → `RELEASED`). |
| **FR-03** | Cryptographic Checksums | Engine 02 (DSA/SE · Darshan) | Streaming SHA-256 hash digest computation on all submitted deliverable artifacts. |
| **FR-04** | Evidence Trees | Engine 02 (DSA/SE · Darshan) | In-memory hierarchical N-ary Merkle evidence tree (`EvidenceTree`) with $O(V+E)$ traversal and tampering detection. |
| **FR-05** | ACID Payment Processing | Engine 03 (DBMS · Purvi) | Atomic milestone fund releases and refunds with complete rollback protection. |
| **FR-06** | Tamper-Resistant Audit Log | Engine 03 (DBMS · Purvi) | Append-only audit logging with cryptographic SHA-256 verification hash chaining. |
| **FR-07** | Role-Based Dashboards | Engine 04 (Web · Vaibhav) | Tailored, role-authorized views for Clients, Freelancers, Dispute Reviewers, and Administrators. |
| **FR-08** | Authentication & RBAC | Engine 04 (Web · Vaibhav) | HMAC session authentication and server-side RBAC enforcement (HTTP 401/403). |
| **FR-09** | Dispute Workflow | Engine 04 (Web · Vaibhav) | Structured dispute escalation, counter-evidence submission, and reviewer arbitration. |
| **FR-10** | FSM Progress UI | Engine 04 (Web · Vaibhav) | Reactive milestone progress visualization with 5-second lightweight polling state updates. |
| **FR-11** | AI Semantic Matching | Engine 02 (DSA/SE · Darshan primary) / Engine 03 (DBMS · Purvi supporting) | Deterministic multi-attribute heuristic proposal scoring (Jaccard skill similarity 50%, budget fit 30%, reputation 20% per ADR-010). |
| **FR-12** | Contract Lifecycle Orchestration | Engine 01 (OS · Vaishnavi) | End-to-end contract coordination from proposal acceptance to milestone completion and closure. |

### Non-Functional Requirements Baseline (NFR-01 to NFR-10)

| NFR-ID | Category | Target Quality Attribute | Measurable KPI Target | Status |
| :--- | :--- | :--- | :--- | :---: |
| **NFR-01** | Performance | Low-latency response times across REST API routes | $P_{95} \le 500\text{ ms}$ under 50 concurrent requests | **PASS** |
| **NFR-02** | Security | Least-privilege Role-Based Access Control | 100% of protected routes enforce role authorization | **PASS** |
| **NFR-03** | Data Integrity | Cryptographic deliverable integrity verification | 100% detection rate for file tampering or hash mismatch | **PASS** |
| **NFR-04** | Input Validation | Defensive schema validation against malformed payloads | 100% of incoming payloads validated via Zod schemas | **PASS** |
| **NFR-05** | FSM Reliability | Deterministic, race-condition-free state transitions | 0 invalid or out-of-order state transitions permitted | **PASS** |
| **NFR-06** | Responsiveness | Cross-device responsive UI layout | Renders without overflow across viewports (360px–1920px) | **PASS** |
| **NFR-07** | Maintainability | Decoupled modularity across the four course engines | 4 independently testable and ownable engine modules | **PASS** |
| **NFR-08** | Consistency | ACID transaction compliance across escrow transfers | 0 double-allocation or balance discrepancy anomalies | **PASS** |
| **NFR-09** | Auditability | Historical traceability for contract changes and rulings | 100% of state transitions captured in append-only audit log | **PASS** |
| **NFR-10** | Fault Tolerance | Graceful error handling and structured JSON responses | Zero unhandled server crashes; standardized JSON envelopes | **PASS** |

### Use Cases (UC-01 to UC-05)

| Use Case | Title | Primary Actor | Owning Engines | Mapped Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **UC-01** | Contract Initiation & Escrow Fund Locking | Client | Engine 01 (OS) & Engine 03 (DBMS) | FR-01, FR-12 \| NFR-05, NFR-08 |
| **UC-02** | Deliverable Submission & Cryptographic Hashing | Freelancer | Engine 02 (DSA/SE) & Engine 01 (OS) | FR-02, FR-03, FR-04 \| NFR-03 |
| **UC-03** | Milestone Review & Atomic Escrow Release | Client | Engine 01 (OS) & Engine 03 (DBMS) | FR-02, FR-05 \| NFR-01, NFR-08 |
| **UC-04** | Dispute Escalation & Evidence Tree Arbitration | Reviewer | Engine 04 (Web) & Engine 02 (DSA/SE) | FR-04, FR-06, FR-09 \| NFR-02, NFR-09 |
| **UC-05** | AI Semantic Matching & Proposal Bidding | Freelancer / Client | Engine 02 (DSA/SE) & Engine 03 (DBMS) | FR-11 \| NFR-01 |

Detailed traceability specifications:
- [Requirements Specification](docs/requirements/requirements.md)
- [Requirements Traceability Matrix (RTM)](docs/development/implementation-traceability.md)
- [Implementation Audit Report](docs/development/implementation-audit.md)

---

## 12. Project Scope & Boundaries

### In-Scope Capabilities
- Role-based user authentication and session authorization (FR-08, NFR-02)
- Project posting, proposal bidding, and heuristic semantic proposal matching (FR-11)
- Phased milestone management with sequential dependency ordering (FR-02, FR-12)
- Simulated double-entry escrow ledger transfers (FR-01, FR-05, NFR-08)
- SHA-256 cryptographic deliverable verification (FR-03, NFR-03)
- In-memory Merkle EvidenceTree dispute representation (FR-04)
- Independent human reviewer dispute arbitration (FR-09)
- Append-only hash-chained audit logging (FR-06, NFR-09)

### Explicit Scope Boundaries
- **Real Payment Gateways**: Excluded. Currency is purely simulated within the SQLite ledger to eliminate external financial risk.
- **Autonomous AI Arbitration**: Excluded. Algorithmic matching is restricted to proposal ranking; dispute arbitration requires independent human reviewer evaluation.
- **Native Mobile Applications**: Excluded. Responsive web interface optimized across mobile and desktop viewports.
- **Legal Court Contracts**: Excluded. The system enforces programmatic protocol invariants, not formal court contracts.
- **Unlimited Video Hosting**: Excluded. Large media files are represented by cryptographic hash digests.
- **Corporate Taxation / Accounting Systems**: Excluded from academic scope.

### Planned Phase 2 Feature Roadmap (Future Scope — Yet to be Implemented)

The core Gate 2 system (Functional Requirements FR-01 through FR-12) represents our frozen, verified production baseline. To extend the platform's collaborative reach without altering core transactional invariants, the following features are designed and scheduled for Phase 2 implementation:

1. **Browser-Native WebRTC Peer-to-Peer Consultation (Engine 04 · Web Technologies)**:
   - **On-Demand Scoping & Dispute Hearings**: Peer-to-peer real-time audio/video sessions directly between Client and Freelancer for pre-contract scoping, as well as live arbitration sessions with the assigned Dispute Reviewer.
   - **Zero-Budget Open-Source Architecture**: Built strictly with browser-native WebRTC (`RTCPeerConnection` and `getUserMedia`) backed by lightweight WebSocket signaling. Commercial CPaaS SDKs (such as Agora or Zoom) are rejected to eliminate subscription costs, vendor lock-in, and privacy leakage through third-party media relays ([ADR-001](docs/decisions/ADR-001-technology-stack-baseline.md)).

2. **Retrieval-Augmented Generation (RAG) Contract Scribe (Engine 02 · DSA & Software Engineering)**:
   - **Ground Truth Anti-Hallucination**: Standard LLMs hallucinate unrealistic project timelines and ambiguous milestones (the #1 root cause of escrow disputes). Our RAG pipeline executes **Cosine Similarity Vector Search** over a local corpus of 100% dispute-free software contracts, standard Work Breakdown Structures (WBS), and ISO/IEC 29119 acceptance test templates.
   - **Context Augmentation**: Real-time speech-to-text tokens from the WebRTC session are augmented with retrieved benchmark templates to synthesize a structured milestone draft adhering to the platform's `CreateContractInput` schema.

3. **Deterministic Safety Containment & Dual-Signature Gate (Engines 01 & 03)**:
   - **Integer Paise Mathematical Invariant (Engine 03 · DBMS)**: AI-drafted milestones must pass a strict database constraint ensuring $\sum \text{milestone.amount} = \text{proposal.bidAmount}$ down to the exact integer paise, eliminating IEEE-754 floating-point rounding errors.
   - **Mutual Non-Repudiation (Engine 04 · Web Tech)**: The AI output is strictly an advisory draft. Both Client and Freelancer must review and cryptographically countersign (SHA-256 hash of contract terms + session token) on their dashboards before contract registration.
   - **FSM Escrow Isolation (Engine 01 · OS)**: The AI has zero authority to touch funds or activate milestones. Once signed, the Finite State Machine initializes the contract strictly to `AWAITING_DEPOSIT`. Work cannot begin and funds cannot be released until mutual-exclusion escrow deposits are verified.

---

## 13. Current Project Status

As recorded in [Project Status & Durable Memory](docs/development/project-status.md):

```text
Gate 0: COMPLETED
Gate 1: APPROVED
Stage S1 (Requirements Baseline): COMPLETE / FROZEN
Stage S2 (Shared Architecture): COMPLETE / APPROVED
Stage S3 (Implementation & Verification): COMPLETE
Gate 2: READY FOR EVALUATION
Phase 2 (WebRTC Scoping, RAG Drafting, Integer Guards): ROADMAP (YET TO BE IMPLEMENTED)
```

---

## 14. Local Setup & Execution

### Prerequisites
- Node.js (v20.x or v22.x LTS)
- npm (v10.x+)
- Git (v2.40+)

### Quickstart Instructions
```bash
# 1. Clone the repository
git clone https://github.com/VAIBHAV7848/mini-project.git
cd mini-project

# 2. Install dependencies
npm install

# 3. Initialize and seed SQLite database
npx prisma db push
npm run prisma:seed

# 4. Start local development server
npm run dev

# 5. Run the automated test suite
npm test
```

Open `http://localhost:3000` in your browser to access the dashboard.

---

## 15. Repository Structure

```text
mini-project/
├── src/
│   ├── app/                      # Next.js App Router pages and REST API handlers
│   │   ├── api/                  # API endpoints (projects, contracts, disputes, gigs, orders)
│   │   └── page.tsx              # Multi-role responsive workflow dashboard
│   ├── core/                     # Four academic engineering engines
│   │   ├── engine-01-os/         # Escrow FSM, Watchdog scheduler, KeyedMutex
│   │   ├── engine-02-dsa-se/     # SHA-256 Hasher, Merkle EvidenceTree, AI Matcher
│   │   ├── engine-03-dbms/       # Ledger coordinator, Contract manager, Audit logger
│   │   └── engine-04-web/        # RBAC enforcer, Session service, State poller
│   ├── lib/                      # Database client (Prisma), validation schemas (Zod), errors, logger
│   └── types/                    # Domain TypeScript interfaces and state types
├── tests/                        # Vitest automated test suites (75 tests, 14 files)
│   ├── engine-01-os/             # FSM, watchdog, and contract lifecycle tests
│   ├── engine-02-dsa-se/         # Hasher, Merkle tree, and adversarial DSA tests
│   ├── engine-03-dbms/           # Ledger, transaction concurrency, and dispute workflow tests
│   ├── engine-04-web/            # RBAC, adversarial API, and marketplace gigs tests
│   └── integration/              # Vertical slice, smoke, and end-to-end user journey tests
├── docs/                         # Authoritative project documentation
│   ├── architecture/             # Architecture specifications, C4 diagrams, ADRs
│   ├── requirements/             # Functional/non-functional requirements and viva materials
│   ├── api/                      # REST API contracts and OpenAPI specification
│   ├── database/                 # Schema designs, ER models, and indexing strategies
│   ├── security/                 # Security model and threat analysis
│   └── development/              # Traceability, audit reports, benchmarks, readiness
├── prisma/                       # Database schema and seed data
└── scripts/                      # Verification, linting, and benchmark tools
```

---

## 16. Documentation Index

- **Architecture**:
  - [System Architecture](docs/architecture/architecture.md)
  - [C4 Component Diagram](docs/architecture/c4-component.md)
  - [Engine Boundaries](docs/architecture/engine-boundaries.md)
  - [Technology Stack Baseline (ADR-001)](docs/decisions/ADR-001-technology-stack-baseline.md)
- **Requirements**:
  - [System Requirements Specification](docs/requirements/requirements.md)
  - [Functional Requirements](docs/requirements/functional-requirements.md)
  - [Non-Functional Requirements](docs/requirements/non-functional-requirements.md)
  - [Use Cases](docs/requirements/use-cases.md)
- **API & Database**:
  - [REST API Specification](docs/api/api-design.md)
  - [Database Schema Specification](docs/database/schema.md)
  - [Transaction Design](docs/database/transaction-design.md)
- **Security & Quality**:
  - [Security Model](docs/security/security-model.md)
  - [Security Policy](SECURITY.md)
  - [Testing Strategy](docs/development/testing-strategy.md)
- **Status & Readiness**:
  - [Project Status & Durable Memory](docs/development/project-status.md)
  - [Gate 2 Academic Readiness Assessment](docs/development/gate-2-readiness.md)
  - [Empirical Performance Results](docs/development/performance-results.md)
  - [Requirements Traceability Matrix](docs/development/implementation-traceability.md)
  - [Implementation Audit Report](docs/development/implementation-audit.md)
- **Guidelines & Source Materials**:
  - [Contribution Guidelines](CONTRIBUTING.md)
  - [Source Materials Directory](docs/source-material/)

---

## 17. Academic Context

This project demonstrates practical software engineering synthesis across five core academic subjects in Computer Science:
- **Operating Systems**: Finite State Machine synchronization, mutual exclusion via keyed critical sections, and asynchronous review timeout scheduling.
- **Data Structures & Algorithms**: Hierarchical N-ary Merkle trees for tamper-evident evidence indexing and multi-attribute heuristic similarity matching.
- **Software Engineering**: Modular monolithic decomposition, test-driven development, continuous verification gates, and bidirectional requirements traceability.
- **Database Management Systems**: Relational BCNF schema design, serialized ACID escrow transfers, balance conservation invariants, and append-only cryptographic audit logging.
- **Web Technologies**: Server-side role-based access control, cryptographic HMAC session token validation, Next.js 16 App Router architecture, and responsive multi-role dashboards.

---

## 18. Contributors

**Team 07 (Theme 01) — KLE Technological University**:
- **Vaibhav Chavanpatil** (Roll No: 04, SRN: 02FE24BCS013) — Lead Engineer & Owner, Engine 04 (Web Technologies)
- **Purvi Sammatshetti** (Roll No: 11, SRN: 02FE24BCS022) — Owner, Engine 03 (DBMS)
- **Darshan Kittur** (Roll No: 18, SRN: 02FE24BCS053) — Owner, Engine 02 (DSA & SE)
- **Vaishnavi Modekar** (Roll No: 21, SRN: 02FE24BCS060) — Owner, Engine 01 (Operating Systems)

---

## 19. License

This project is licensed under the [MIT License](LICENSE).
