# KPIs & Success Metrics Specification (3-Tier Measurement Sheet)

> **Academic Milestone**: Stage S1 — Requirements Engineering Baseline (Gate 1 Deliverable 3)
> **Institution**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi) — Dept. of CSE
> **Curriculum Framework**: Engine-Based Mini-Project Framework with Hybrid SDLC
> **Team**: Team 07 (Theme 01)
> **Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
> **Authoritative References**: `docs/source-material/Team07_Escrow_Mini_Project_KLE_Theme.pptx` (Slides 19 & 22), `docs/source-material/Mini_Project_Gate_0_details_FILLED.docx` (Step 4, Item 4), `docs/requirements/non-functional-requirements.md`.

---

## 1. Executive Summary & Measurement Framework

In compliance with KLE Technological University's Stage S1 evaluation rubric, system quality targets are organized into a rigorous **3-Tier Curricular KPI Framework**:
1. **Tier 1: Mandatory KPIs**: Non-negotiable architectural pass/fail gates. A failure in any Tier 1 metric constitutes an immediate build/release block.
2. **Tier 2: System KPIs**: Core operational envelopes defining system throughput, latency, responsiveness, and resilience under production-like load.
3. **Tier 3: Challenge KPIs**: Advanced computer science benchmarks demonstrating engine excellence (concurrency stress, algorithmic efficiency, cryptographic proof speed).

---

## 2. 3-Tier Technical KPI Matrix

### 2.1 Tier 1: Mandatory KPIs (Non-Negotiable Verification Gates)

| Metric ID | Quality Dimension | Metric Name & Formal Definition | Target Value | Workload & Test Condition | Verification Method | Owning Engine |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **KPI-M01** | **Financial Integrity** | Double-Allocation & Balance Drift Anomaly Rate | **$0.00\%$ (Zero Drift)** | 50 concurrent release requests on identical milestone | Concurrent transfer stress test asserting $\sum \Delta B = 0$ | **Engine 03 (DBMS)** |
| **KPI-M02** | **Security** | Role-Based Access Control (RBAC) Protection Coverage | **$100.0\%$ Protected** | 100% of internal API endpoints and server actions | Negative security suite asserting HTTP 401/403 on role spoofing | **Engine 04 (Web)** |
| **KPI-M03** | **Data Integrity** | Cryptographic Checksum Tampering Detection Rate | **$100.0\%$ Detection** | 1-bit injection flip across 100 test deliverable archives | Automated digest verification comparing SHA-256 against DB | **Engine 02 (DSA/SE)** |
| **KPI-M04** | **FSM Determinism** | Invalid State Transition Tolerance Rate | **$0.00\%$ Permitted** | Fuzzing 100 random out-of-order state transition calls | FSM boundary checker asserting HTTP 422 `INVALID_STATE` | **Engine 01 (OS)** |
| **KPI-M05** | **Input Security** | External Request Payload Validation Ratio | **$100.0\%$ Validated** | All incoming JSON bodies tested with malformed/SQLi inputs | Zod 4 runtime schema parser asserting 0 unparsed payloads | **All Engines** |

---

### 2.2 Tier 2: System KPIs (Operational Performance Envelopes)

| Metric ID | Quality Dimension | Metric Name & Formal Definition | Target Value | Workload & Test Condition | Verification Method | Owning Engine |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **KPI-S01** | **Performance** | Core API Response Latency (p95 percentile) | **p95 $\le 500\text{ ms}$** | 50 concurrent HTTP requests over 100 projects and 500 milestones | Automated k6/autocannon load test suite | **All Engines** |
| **KPI-S02** | **Data Processing** | Streaming SHA-256 Checksum Computation Time | **$\le 100\text{ ms}$** | Single deliverable file up to 50 MB in size | Node.js `performance.now()` streaming execution probe | **Engine 02 (DSA/SE)** |
| **KPI-S03** | **State Sync** | Client Dashboard Polling Refresh Interval | **$\le 5.0\text{ seconds}$** | Active client/freelancer session monitoring milestone progress | Automated Playwright browser timer verification | **Engine 04 (Web)** |
| **KPI-S04** | **Auditability** | State Transition & Financial Audit Capture Ratio | **$100.0\%$ Logged** | 1,000 synthetic state mutations and balance ledger events | End-of-run reconciliation between entity tables and `AuditLog` | **Engine 03 (DBMS)** |
| **KPI-S05** | **Fault Tolerance** | Unhandled Server Crash Rate (HTTP 500) | **$0.00\%$ Crashes** | Chaos testing with null payloads, network partitions, aborts | Standardized JSON error envelope assertion (`code`, `message`) | **All Engines** |
| **KPI-S06** | **Accessibility** | Google Lighthouse Accessibility Score | **$\ge 90 / 100$** | Core dashboard views (Client, Freelancer, Reviewer, Admin) | Automated Lighthouse CI runner across 360px–1920px viewports | **Engine 04 (Web)** |

---

### 2.3 Tier 3: Challenge KPIs (Advanced Engineering Benchmarks)

| Metric ID | Quality Dimension | Metric Name & Formal Definition | Target Value | Workload & Test Condition | Verification Method | Owning Engine |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **KPI-C01** | **DSA Efficiency** | In-Memory `EvidenceTree` Adjudication Traversal | **$\le 10\text{ ms}$** | Hierarchical dispute tree containing 50 evidence nodes | $O(V+E)$ BFS/DFS traversal benchmark script | **Engine 02 (DSA/SE)** |
| **KPI-C02** | **Concurrency** | Parallel Milestone Lock Contention Resolution | **$\le 250\text{ ms}$ MTTR** | 10 rapid concurrent deposit attempts on same contract | In-memory `KeyedMutex` benchmark asserting zero deadlocks | **Engine 01 (OS)** |
| **KPI-C03** | **Heuristic Match** | Semantic Proposal Scoring Computation Speed | **$\le 50\text{ ms}$** | Batch scoring of 100 incoming freelancer proposals | Jaccard tag similarity + dev score computation timer | **Engine 02 (DSA/SE)** |
| **KPI-C04** | **Database Scale** | Indexed Audit Trail Retrieval Latency | **$\le 15\text{ ms}$** | Querying audit records filtered by actor and date on 10k rows | SQLite `EXPLAIN QUERY PLAN` verifying B-Tree index scan | **Engine 03 (DBMS)** |

---

## 3. Business & Workflow Success Metrics

Derived from the Problem Definition in Stage S0 (`Mini_Project_Gate_0_details_FILLED.docx` Step 4):

| Business Success Metric | Baseline (Traditional Platforms) | Target with Proposed System | Computing Mechanism Enabling Target |
| :--- | :---: | :---: | :--- |
| **Payment Default Risk** | Significant (clients renege post-delivery) | **$0.0\%$ (Zero Default Risk)** | Mandatory simulated escrow lock (`FUNDED`) before work commences (FR-01). |
| **Dispute Turnaround Time** | 14–30 business days (unstructured email) | **$\le 3$ business days (60% faster)** | In-memory hierarchical `EvidenceTree` and Reviewer Console with SHA-256 proofs (FR-04, FR-09). |
| **Approval Limbo / Starvation** | Indefinite delays (freelancers unpaid) | **Max 7 calendar days** | Engine 01 Timer Interrupt Watchdog automatically preempting idle state to `REVIEW_TIMEOUT` (FR-02, D-02). |
| **Deliverable Repudiation** | Common ("file sent was broken/different") | **$0.0\%$ Unverifiable Claims** | Client and arbiter verification of 64-character SHA-256 cryptographic checksums (FR-03). |
| **Historical Traceability** | Fragmented across chat/emails | **$100.0\%$ Centralized Audit Trail** | Append-only SQLite `AuditLog` table with cryptographic hash chaining (FR-06). |

---

## 4. Verification & Defense Plan for Gate 1

During the Gate 1 review, Team 07 will defend these metrics using:
1. **NFR Alignment**: Demonstrating that every KPI traces directly to an S0 Need and an S1 NFR in the master RTM (`requirements.md`).
2. **Measurement Feasibility**: Proving that every metric is quantifiable using automated CLI scripts (`scripts/verify`, `vitest`, `k6`) rather than subjective appraisal.
3. **Engine Accountability**: Confirming that each student engineer directly owns their respective Mandatory, System, and Challenge metrics.
