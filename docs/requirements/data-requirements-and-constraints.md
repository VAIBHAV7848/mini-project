# Data Requirements & System Constraints Specification

> **Academic Milestone**: Stage S1 — Requirements Engineering Baseline (Gate 1 Deliverable 4)
> **Institution**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi) — Dept. of CSE
> **Curriculum Framework**: Engine-Based Mini-Project Framework with Hybrid SDLC
> **Team**: Team 07 (Theme 01)
> **Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
> **Authoritative References**: `docs/source-material/Mini_Project_Gate_0_details_FILLED.docx` (Steps 4 & 5), `docs/source-material/Team07_Escrow_Mini_Project_KLE_Theme.pptx` (Slides 14, 16, 17), `prisma/schema.prisma`, `docs/decisions/ADR-004-domain-model.md`, `docs/decisions/ADR-007-database-transactions.md`.

---

## 1. Executive Summary & Purpose

This document formally specifies the **Data Requirements**, **Field Constraints**, **Relational Invariants**, and **Operational / Technical Constraints** for the *Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow*. It serves as Deliverable 4 of the Stage S1 Requirements Engineering Baseline to guarantee data integrity, financial conservation, and tamper-resistant auditability across all four engineering engines before architectural implementation.

---

## 2. Core Domain Data Entities & Attribute Requirements

The system processes 10 primary relational entities, each bounded by strict type definitions and storage requirements.

### 2.1 User & Authentication Entities
- **Entity**: `User`
  - **Purpose**: Represents actors operating within the system under strict Role-Based Access Control (RBAC).
  - **Key Attributes**:
    - `id`: Universally Unique Identifier (`UUIDv4`, 36 chars), Primary Key.
    - `email`: Normalized lowercase string, max 255 chars, **Unique**, RFC 5322 format.
    - `passwordHash`: Bcrypt hash string (cost factor 10, 60 chars). Never stored in plaintext.
    - `name`: String, min 2 chars, max 100 chars, sanitized against XSS.
    - `role`: Enum constraint: `'CLIENT' | 'FREELANCER' | 'REVIEWER' | 'ADMIN'`. Default `'FREELANCER'`.
    - `availableBalance`: Decimal(12, 2), non-negative constraint (`balance >= 0.00`). Default `0.00`.
    - `escrowBalance`: Decimal(12, 2), non-negative constraint (`escrowBalance >= 0.00`). Default `0.00`.
    - `createdAt` / `updatedAt`: ISO 8601 UTC Datetime stamps.

### 2.2 Project & Marketplace Entities
- **Entity**: `Project`
  - **Purpose**: Stores client requirements, budgetary limits, and required skill tags.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `clientId`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id` (`ON DELETE RESTRICT`).
    - `title`: String, min 5 chars, max 200 chars.
    - `description`: Text, min 20 chars, max 10,000 chars.
    - `budget`: Decimal(12, 2), strictly positive (`budget > 0.00`).
    - `skillTags`: JSON Array of strings (e.g. `["React", "Node.js", "Solidity"]`), max 20 tags.
    - `status`: Enum constraint: `'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'`.
    - `createdAt` / `updatedAt`: ISO 8601 UTC Datetime stamps.

- **Entity**: `Proposal`
  - **Purpose**: Bidding proposals submitted by freelancers for open projects.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `projectId`: UUIDv4 (36 chars), Foreign Key $\to$ `Project.id` (`ON DELETE CASCADE`).
    - `freelancerId`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id` (`ON DELETE RESTRICT`).
    - `bidAmount`: Decimal(12, 2), strictly positive (`bidAmount > 0.00`).
    - `coverLetter`: Text, min 10 chars, max 5,000 chars.
    - `aiMatchScore`: Float / Decimal(5, 2), constrained to `0.00 <= score <= 100.00`.
    - `status`: Enum constraint: `'PENDING' | 'ACCEPTED' | 'REJECTED'`.
    - **Candidate Key Constraint**: `UNIQUE(projectId, freelancerId)` — prevents duplicate bids by the same freelancer.

### 2.3 Contract & Milestone Entities (Engine 01 & 03 Core)
- **Entity**: `Contract`
  - **Purpose**: Legally binding execution container tying Client, Freelancer, and agreed Milestones.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `projectId`: UUIDv4 (36 chars), Foreign Key $\to$ `Project.id`, **Unique** (1-to-1 contract per awarded project).
    - `clientId`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id`.
    - `freelancerId`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id`.
    - `totalAmount`: Decimal(12, 2), strictly positive (`totalAmount = SUM(milestone.amount)`).
    - `escrowBalance`: Decimal(12, 2), current unreleased funds locked in escrow (`0.00 <= balance <= totalAmount`).
    - `status`: Enum constraint: `'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'DISPUTED'`.

- **Entity**: `Milestone`
  - **Purpose**: Granular execution phase subject to individual escrow funding, deliverable review, and fund release.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `contractId`: UUIDv4 (36 chars), Foreign Key $\to$ `Contract.id` (`ON DELETE CASCADE`).
    - `title`: String, min 3 chars, max 150 chars.
    - `description`: Text, max 2,000 chars.
    - `amount`: Decimal(12, 2), strictly positive (`amount > 0.00`).
    - `sequenceOrder`: Integer, positive (`sequenceOrder >= 1`).
    - `status`: Enum constraint: `'AWAITING_DEPOSIT' | 'FUNDED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'REVIEW_TIMEOUT'`.
    - `reviewDeadline`: ISO 8601 UTC Datetime stamp, nullable. Populated upon deliverable submission (`submissionTimestamp + 7 calendar days`).
    - **Candidate Key Constraint**: `UNIQUE(contractId, sequenceOrder)` — enforces strict sequential ordering.

### 2.4 Evidence & Deliverable Entities (Engine 02 Core)
- **Entity**: `Deliverable`
  - **Purpose**: Cryptographic proof of work submitted by the freelancer for milestone verification.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `milestoneId`: UUIDv4 (36 chars), Foreign Key $\to$ `Milestone.id`, **Unique** (1 deliverable package per milestone submission).
    - `fileName`: String, max 255 chars, sanitized against path traversal (`../`).
    - `fileUrl`: URI string (max 500 chars) pointing to local secure storage.
    - `sha256Checksum`: String, exact length 64 hexadecimal characters (`^[a-f0-9]{64}$`).
    - `fileSizeBytes`: BigInt / Integer, max 52,428,800 bytes (50 MB limit).
    - `submissionNotes`: Text, max 2,000 chars.
    - `submittedAt`: ISO 8601 UTC Datetime stamp.

- **Entity**: `Dispute`
  - **Purpose**: Escalated conflict case managed under neutral arbitration.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `milestoneId`: UUIDv4 (36 chars), Foreign Key $\to$ `Milestone.id`, **Unique**.
    - `raisedById`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id`.
    - `reviewerId`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id` (must possess role `'REVIEWER'`), nullable until assigned.
    - `reason`: Text, min 10 chars, max 2,000 chars.
    - `status`: Enum constraint: `'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'`.
    - `ruling`: Enum constraint: `'RELEASE_TO_FREELANCER' | 'REFUND_TO_CLIENT' | 'SPLIT_SETTLEMENT'`, nullable until resolved.
    - `rulingNotes`: Text, written technical and legal justification from arbitrator.
    - `resolvedAt`: ISO 8601 UTC Datetime stamp, nullable.

- **Entity**: `DisputeEvidence`
  - **Purpose**: Supporting artifacts submitted during arbitration, indexed in an in-memory `EvidenceTree`.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `disputeId`: UUIDv4 (36 chars), Foreign Key $\to$ `Dispute.id` (`ON DELETE CASCADE`).
    - `submittedById`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id`.
    - `fileName`: String, max 255 chars.
    - `fileUrl`: URI string, max 500 chars.
    - `sha256Checksum`: String, exact length 64 hex characters.
    - `description`: String, max 500 chars.
    - `submittedAt`: ISO 8601 UTC Datetime stamp.

### 2.5 Financial Ledger & Tamper-Resistant Audit Entities (Engine 03 Core)
- **Entity**: `EscrowTransaction` (Double-Entry Financial Ledger)
  - **Purpose**: Immutable journal of every balance mutation, maintaining double-entry balance equality.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `contractId`: UUIDv4 (36 chars), Foreign Key $\to$ `Contract.id`.
    - `milestoneId`: UUIDv4 (36 chars), Foreign Key $\to$ `Milestone.id`, nullable.
    - `fromUserId`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id`, nullable (`NULL` represents the Escrow Pool).
    - `toUserId`: UUIDv4 (36 chars), Foreign Key $\to$ `User.id`, nullable (`NULL` represents the Escrow Pool).
    - `amount`: Decimal(12, 2), strictly positive (`amount > 0.00`).
    - `type`: Enum constraint: `'DEPOSIT' | 'LOCK' | 'RELEASE' | 'REFUND' | 'DISPUTE_RESOLUTION'`.
    - `timestamp`: ISO 8601 UTC Datetime stamp.
  - **Immutability Rule**: Strict append-only. Zero SQL `UPDATE` or `DELETE` operations permitted.

- **Entity**: `AuditLog` (Cryptographic Audit Trail)
  - **Purpose**: Tamper-resistant historical record capturing 100% of state transitions and critical actions.
  - **Key Attributes**:
    - `id`: UUIDv4 (36 chars), Primary Key.
    - `actorId`: String (UUIDv4 or `'SYSTEM'`).
    - `entityName`: String (e.g. `'Contract'`, `'Milestone'`, `'Dispute'`, `'EscrowTransaction'`).
    - `entityId`: String (UUIDv4 of affected record).
    - `action`: String (e.g. `'DEPOSIT_LOCKED'`, `'DELIVERABLE_SUBMITTED'`, `'FUNDS_RELEASED'`, `'DISPUTE_RAISED'`).
    - `previousState`: JSON string, nullable.
    - `newState`: JSON string.
    - `verificationHash`: String (64 hex characters) = $\text{SHA-256}(\text{actorId} + \text{entityId} + \text{action} + \text{newState} + \text{timestamp} + \text{prevHash})$.
    - `timestamp`: ISO 8601 UTC Datetime stamp.
  - **Immutability Rule**: Append-only. Enforced at SQLite engine level via trigger denying modifications.

---

## 3. Data Integrity Constraints & Domain Invariants

| Invariant ID | Domain Invariant | Mathematical / Logical Formulation | Enforcement Layer | Owning Engine |
| :--- | :--- | :--- | :--- | :--- |
| **INV-01** | **No Double-Allocation** | $\forall m \in \text{Milestones}, \text{LockCount}(m) \le 1$ | Atomic State Check in `prisma.$transaction` | **Engine 01 (OS)** |
| **INV-02** | **Single Release Terminality** | $\text{CurrentState} = \text{RELEASED} \implies \text{NextState} = \emptyset$ | Deterministic FSM Transition Table | **Engine 01 (OS)** |
| **INV-03** | **Conservation of Funds** | $\Delta \text{ClientBalance} + \Delta \text{EscrowLocked} + \Delta \text{FreelancerBalance} = 0$ | Double-Entry Balancing & Database Check Constraints | **Engine 03 (DBMS)** |
| **INV-04** | **Sequential Milestone Progression** | $\text{Fund}(m_{k}) \implies \text{Status}(m_{k-1}) = \text{RELEASED} \lor k = 1$ | Contract Sequence Validator | **Engine 01 (OS)** |
| **INV-05** | **Cryptographic Tamper Detection** | $\text{RecomputedHash}(\text{file}) \ne \text{StoredChecksum} \implies \text{REJECT}$ | Node.js Streaming `crypto.createHash('sha256')` | **Engine 02 (DSA/SE)** |
| **INV-06** | **Non-Negative Account Balances** | $\forall u \in \text{Users}, \text{availableBalance} \ge 0.00 \land \text{escrowBalance} \ge 0.00$ | SQL Check Constraint: `CHECK (available_balance >= 0.00)` | **Engine 03 (DBMS)** |
| **INV-07** | **Immutable Audit Trail** | $\text{Modifications}(\text{AuditLog}) = \emptyset \land \text{Deletions}(\text{AuditLog}) = \emptyset$ | SQLite Trigger: `BEFORE UPDATE/DELETE RAISE(ABORT)` | **Engine 03 (DBMS)** |
| **INV-08** | **RBAC Route Protection** | $\text{Request}(\text{Route}, \text{Role}) \implies \text{Role} \in \text{AuthorizedRoles}(\text{Route})$ | Next.js Server-Side Middleware Token Decryption | **Engine 04 (Web)** |
| **INV-09** | **Review Window Bounding** | $\text{ReviewTime} \le 7 \times 24 \times 3600 \text{ seconds} \implies \text{Preempt via Watchdog}$ | Timer Interrupt Watchdog Scheduler | **Engine 01 (OS)** |

---

## 4. System & Operational Constraints

### 4.1 Academic & Resource Constraints
- **Timeframe**: 15 academic calendar weeks (curriculum delivery schedule).
- **Engineering Squad**: 4 undergraduate student engineers, each individually responsible for one curricular engine.
- **Financial Budget**: Zero commercial capital (\$0.00 / ₹0.00); 100% open-source software stack.
- **Hardware Deployment Target**: Standard department laboratory workstations (Ubuntu 24.04 LTS, x86_64 architecture, 16 GB RAM, local storage).

### 4.2 Storage & Concurrency Constraints
- **Database Engine**: SQLite 3 with Write-Ahead Logging (WAL) mode enabled (`PRAGMA journal_mode = WAL;`).
- **Single-Writer Concurrency Constraint**: SQLite enforces a single active writer lock. Write transactions must be concise ($\le 50\text{ ms}$) and isolated using in-memory mutexes (`KeyedMutex`) to prevent `SQLITE_BUSY` database lock contention under concurrent load.
- **Deliverable File Storage**: Maximum upload size of 50 MB per deliverable artifact. Files stored in local sandboxed directory (`/uploads/`) with randomized UUID filenames to eliminate path traversal vulnerabilities.
- **Deliverable MIME Type Whitelist**: Strict allowlist: `application/zip`, `application/pdf`, `text/plain`, `application/gzip`, `image/png`, `image/jpeg`.

### 4.3 Input Validation & Defensive Boundary Constraints
- **Runtime Validation**: 100% of external HTTP inputs validated using Zod 4 schemas prior to business logic execution.
- **Payload Limits**: JSON request bodies capped at 2 MB to prevent Denial-of-Service (DoS) buffer exhaustion attacks.
- **Sanitization**: All user-supplied text strings sanitized against Cross-Site Scripting (XSS) and SQL Injection (SQLi) using parameterized queries via Prisma ORM.

---

## 5. Summary & Verification Gate

This Data Requirements & Constraints Specification provides complete structural guarantees that:
1. All domain data models are normalized to **BCNF** (preventing update, insert, and delete anomalies).
2. Financial data preserves the **Conservation of Value** through atomic double-entry ledgering.
3. Cryptographic and audit integrity guarantees conform to **NFR-03** and **NFR-09**.
4. All storage and operational constraints are documented and bounded for tomorrow's Gate 1 evaluation.
