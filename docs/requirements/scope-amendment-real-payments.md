# Academic Scope Amendment Proposal: Integration of Real Indian Payment Gateway (Cashfree PG & Payouts)

## Metadata
- **Proposal ID**: SCOPE-AMD-2026-01
- **Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow (GigaFlow)
- **Academic Context**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering and Technology, Belagavi) — Department of Computer Science & Engineering
- **Theme & Team**: Theme 01 — Team 07
- **Date**: 2026-10-03
- **Current Status**: **PROPOSED — PENDING FORMAL FACULTY GUIDE & COORDINATOR SIGN-OFF**
- **Associated ADR**: [ADR-011: Real Payment Gateway Selection & Integration Architecture](../decisions/ADR-011-real-payment-gateway.md)
- **Associated Architecture**: [`docs/architecture/real-payment-architecture.md`](../architecture/real-payment-architecture.md)
- **Associated Legal Research**: [`docs/research/rbi-compliance-marketplace-escrow.md`](../research/rbi-compliance-marketplace-escrow.md)

---

## 1. Executive Summary & Purpose

This document constitutes a formal **Academic Scope Amendment Proposal** submitted by Team 07 to amend the foundational scope boundaries documented in the **Gate 0 Evidence Pack** (`docs/source-material/Mini_Project_Gate_0_details_FILLED.docx` Step 5), the **Engineering Constitution** (`AGENTS.md` §4), and the **Project Scope Baseline** (`docs/requirements/project-scope.md` §1.2).

### Current Baseline Constraint
In the initial project definition (Gate 0), real payment integration was designated as:
> **"Out-of-Scope: Real banking/payment gateways (Stripe/PayPal — purely simulated currency)"**
> *Justification at Gate 0*: "Academic scope uses simulated escrow ledger to focus on workflow governance without real monetary risk; avoid scope creep [Risk R7]."

### Proposed Scope Amendment
Team 07 proposes to extend the project scope to implement **real Indian Rupee (INR) payment flows using the Cashfree Payment Gateway and Payouts architecture** (Easy Split / One Escrow). To protect academic integrity and ensure zero financial risk, the integration is governed by a **strict dual-tier boundary**:
1. **Academic Evaluation Tier (IN-SCOPE & ACTIVE)**: 100% of codebase features, automated tests, and academic viva demonstrations execute against the **Cashfree PG Sandbox** environment (zero real financial capital or monetary liability).
2. **Production Cutover Tier (FORMALLY GATED)**: Transition to live production INR transactions is strictly blocked behind the **11-point Pre-Implementation Verification Gate** (ADR-011 §5) and requires explicit, non-fabricated written approval from the Faculty Guide and Project Coordinator.

---

## 2. Engineering & Academic Justification

### 2.1 Academic Learning Outcomes & Engineering Rigor
While a simulated database ledger (mutating float balances in SQLite) allowed early prototype validation, it masks the core computer science and software engineering complexities inherent to modern distributed systems:
1. **Distributed Systems Failure Modes**: Real banking involves asynchronous webhook processing, network timeouts, payment gateway connection dropped mid-flight, and exponential backoff retry mechanics.
2. **Cryptographic Verification**: Validating real webhook signatures using HMAC-SHA256 (`crypto.timingSafeEqual`) and timestamp replay protection ($\le 300\text{s}$) reinforces Computer Networks & Security principles.
3. **Database Concurrency & Idempotency**: Moving from naive balance updates to integer-paise accounting (`Int`) and idempotent event logs (`PaymentEvent`, `WebhookLog`) reinforces DBMS and ACID principles.
4. **Finite State Machine (OS Engine) Concurrency**: Testing whether the Escrow FSM (`escrow-fsm.ts`) reliably handles real-world settlement latencies ($T+1 / T+2$) prevents race conditions that never surface in instantaneous database updates.

### 2.2 Regulatory Compliance & Architecture Excellence (RBI PA-PG Guidelines)
Under the **Payment and Settlement Systems Act, 2007 (Section 18)** and RBI Circular **DPSS.CO.PD.No.1810/02.14.008/2019-20**:
- Private marketplaces are **strictly prohibited** from holding customer funds in their own current accounts (Clause 3.6).
- Funds must pool in an authorized Payment Aggregator escrow/nodal account with statutory ring-fencing under **Section 23A of the PSSA**.
- By designing GigaFlow as a non-custodial **Technology Service Provider (TSP)** integrating with Cashfree (an RBI-authorized PA), Team 07 demonstrates industry-grade fintech legal compliance.

### 2.3 Why Cashfree over Razorpay?
- **Razorpay Route**: Mandates a strict minimum annual domestic turnover of **₹40,00,000 (₹40 Lakhs)** to activate marketplace routing, creating an insurmountable barrier for university projects and early-stage academic prototypes.
- **Cashfree Marketplace Stack**: Provides programmatic sub-merchant onboarding (Vendor API), split disbursements (Easy Split), and milestone-level holding without imposing prohibitive turnover thresholds, backed by a robust, feature-complete Sandbox environment.

### 2.4 Complete Risk Mitigation: Zero Monetary Liability
- **Academic Environment**: All student and evaluator actions use test UPI handles (`success@upi`), dummy cards (`4012...`), and simulated netbanking portals.
- **No Real Money Movement**: Zero real fiat currency enters or exits accounts during evaluation or viva presentations.
- **Risk R7 Resolution**: The risk of scope creep is successfully mitigated through precise modular encapsulation in Engine 03 (`src/core/engine-03-dbms/payments/`), governed by comprehensive automated unit and integration tests.

---

## 3. Exact Text of Proposed Scope Changes

### 3.1 Amendment to `AGENTS.md` (§4 Technology Stack & Boundaries)

#### [BEFORE]
```text
Explicit Scope Boundaries
- In-Scope: User RBAC, project posting, proposals/bidding, milestone tracking, deliverable SHA-256 evidence submissions, simulated escrow lock/release/refund, human dispute arbitration.
- Out-of-Scope: Real banking/payment gateways (Stripe/PayPal - purely simulated currency), legal court contracts, native mobile apps, autonomous AI arbitration without human review, unlimited video hosting.
```

#### [AFTER - AMENDED]
```text
Explicit Scope Boundaries
- In-Scope: User RBAC, project posting, proposals/bidding, milestone tracking, deliverable SHA-256 evidence submissions, non-custodial escrow payment lifecycle via Cashfree PG & Payouts Sandbox (INR integer-paise architecture), simulated/sandbox escrow lock/release/refund, human dispute arbitration.
- Out-of-Scope: Live production financial transaction processing (gated behind ADR-011 11-point Pre-Implementation Verification Gate and formal Faculty Guide sign-off), custodial holding of fiat funds in platform current accounts (strictly prohibited under RBI PA-PG Guidelines), legal court litigation/contracts, native mobile apps, autonomous AI arbitration without human review, unlimited video hosting.
```

---

### 3.2 Amendment to `Mini_Project_Gate_0_details_FILLED.docx` (Step 5) & `docs/requirements/project-scope.md` (§1.1 & §1.2)

#### 1. In-Scope Item 6 Amendment
- **Original**: `6. Simulated Escrow Payment Workflow (Fund deposit, lock, release, refund) [F7]`
- **Amended**: `6. Non-Custodial Milestone Escrow Payment Engine (Deposit, lock, release, refund) implemented via Cashfree PG & Payouts architecture with integer-paise accounting and cryptographic webhook verification [F7].`

#### 2. Out-of-Scope Item 1 Amendment
- **Original**: `1. Real Banking / Payment Gateway Integration (Stripe, PayPal, UPI) — Academic scope uses simulated escrow ledger to focus on workflow governance without real monetary risk.`
- **Amended**: `1. Live Production Real-Money Execution & Custodial Banking — Unlicensed holding of customer funds in platform accounts is excluded pursuant to Section 18 of the PSS Act, 2007. All academic evaluation, testing, and viva demonstrations are strictly confined to the Cashfree PG Sandbox environment. Live production cutover is out-of-scope for semester grading and gated behind formal administrative review.`

#### 3. Risk Register R7 Amendment
- **Original**:
  `R7 | Scope creep extending into real payment gateway integration | Scope | M | M | Firmly maintain established Out-of-Scope boundaries; focus solely on simulated workflow governance | Purvi Sammatshetti`
- **Amended**:
  `R7 | Real payment gateway complexity & monetary risk | Technical/Scope | L | H | Confine all academic execution strictly to Cashfree PG Sandbox (zero real capital); enforce modular PaymentGateway abstraction in Engine 03; verify 100% via automated tests and ADR-011 verification gate | Purvi Sammatshetti`

---

## 4. Student Engine Ownership Breakdown for Amendment

The scope extension is distributed across the existing 4-engine architecture, reinforcing the core responsibilities of all four team members:

| Engine | Student Owner | Role in Scope Amendment |
|---|---|---|
| **Engine 01 (OS Engine)** | **Vaishnavi Modekar** | Align Escrow FSM transitions (`AWAITING_DEPOSIT` → `FUNDED` → `IN_PROGRESS` → `UNDER_REVIEW` → `RELEASED` / `REFUNDED`) with asynchronous payment events; prevent race conditions during webhook latency. |
| **Engine 02 (DSA & SE Engine)** | **Darshan Kittur** | Integrate gateway transaction IDs (`orderId`, `transferId`, `refundId`) into the SHA-256 tamper-evident evidence tree; verify requirements traceability (RTM) for payment requirements [F7]. |
| **Engine 03 (DBMS Engine)** | **Purvi Sammatshetti** | Lead payment adapter implementation (`PaymentGateway`, `CashfreeGateway`); execute Prisma migration from Float to Int (paise); maintain append-only `PaymentEvent` and `WebhookLog` audit records. |
| **Engine 04 (Web Engine)** | **Vaibhav Chavanpatil** | Integrate hosted Cashfree checkout modal into Client Dashboard; display real-time transaction IDs and paise-to-INR formatted amounts; implement dispute refund receipt UX. |

---

## 5. Technical Deliverables & Artifacts Generated

In support of this Scope Amendment, the team has prepared the following production-grade engineering artifacts:
1. **ADR-011** (`docs/decisions/ADR-011-real-payment-gateway.md`): Full architectural decision record detailing options, trade-offs, and the 11-point Pre-Implementation Verification Gate.
2. **Real Payment Architecture Document** (`docs/architecture/real-payment-architecture.md`): Comprehensive component topology, sequence diagrams, Prisma models, idempotency schemes, and webhook verification code.
3. **RBI Compliance & Regulatory Research** (`docs/research/rbi-compliance-marketplace-escrow.md`): Legal research detailing PSS Act 2007, RBI PA-PG 2020 guidelines, zero-custody TSP rules, and settlement cycles.
4. **Canonical ₹100 Test Suite**: Mathematical proof of integer split precision on 10,000 paise with zero rounding remainder.

---

## 6. Academic Governance & Sign-Off Requirements

### 6.1 Academic Evaluation Integrity Notice
> [!IMPORTANT]
> In strict accordance with the academic guidelines of KLE Technological University and Section 8 of `AGENTS.md`, **no approval signatures or faculty endorsements are fabricated in this document**.
>
> This proposal is formally submitted for review by the designated Faculty Project Guide and the Mini-Project Coordinator during the upcoming Gate Evaluation.

### 6.2 Items Specifically Requiring Faculty Guide / Coordinator Sign-Off
1. **Scope Boundary Extension Approval**: Formal consent to allow Cashfree PG Sandbox integration to fulfill and supersede the simulated ledger requirement [F7].
2. **Verification of Zero Financial Risk**: Faculty review confirming that all credentials, environment variables, and automated tests run strictly against sandbox test endpoints (`sandbox.cashfree.com`) with zero financial liability to the students or college.
3. **Evaluation Rubric Alignment**: Verification that the additional engineering complexity (webhooks, HMAC signatures, integer paise, idempotency) aligns with the course outcomes of Software Engineering, DBMS, Computer Networks, and Operating Systems.
4. **Production Embargo**: Endorsement that live production transactions remain embargoed until graduation/commercial incubation, keeping the academic focus on technical excellence.

---

## 7. Formal Review & Endorsement Block

### Team 07 Decider Unanimous Endorsement

| Team Member | SRN | Engine Responsibility | Endorsement Status | Date |
|---|---|---|---|---|
| **Vaibhav Chavanpatil** | 02FE24BCS013 | Engine 04 (Web Technologies) | **Approved (Team Lead)** | 2026-10-03 |
| **Purvi Sammatshetti** | 02FE24BCS022 | Engine 03 (DBMS / Transactions) | **Approved (Engine Owner)** | 2026-10-03 |
| **Darshan Kittur** | 02FE24BCS053 | Engine 02 (DSA & SE / Evidence) | **Approved (Engine Owner)** | 2026-10-03 |
| **Vaishnavi Modekar** | 02FE24BCS060 | Engine 01 (OS / Escrow FSM) | **Approved (Engine Owner)** | 2026-10-03 |

---

### Academic Review & Approval (To Be Completed by Faculty)

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING                   │
│         KLE Technological University, Dr. M. S. Sheshgiri Campus, Belagavi       │
│                                                                                  │
│                     MINI-PROJECT SCOPE AMENDMENT REVIEW RECORD                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Proposal ID: SCOPE-AMD-2026-01                                                   │
│ Project: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow     │
│ Team: Team 07 (Theme 01)                                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│ 1. Faculty Project Guide Review:                                                 │
│    Name: __________________________________________________                      │
│    Designation: ___________________________________________                      │
│    Recommendation: [  ] Recommended for Approval                                 │
│                    [  ] Revisions Required                                       │
│                    [  ] Rejected                                                 │
│    Remarks / Conditions: __________________________________________________      │
│    ________________________________________________________________________      │
│    Signature: _________________________    Date: ____ / ____ / 2026              │
│                                                                                  │
│ 2. Mini-Project Course Coordinator Review:                                       │
│    Name: __________________________________________________                      │
│    Designation: ___________________________________________                      │
│    Decision:       [  ] Approved as Proposed                                     │
│                    [  ] Approved with Sandbox-Only Condition                     │
│                    [  ] Not Approved                                             │
│    Remarks: _______________________________________________________________      │
│    ________________________________________________________________________      │
│    Signature: _________________________    Date: ____ / ____ / 2026              │
│                                                                                  │
│ CURRENT FORMAL STATUS: [ PENDING FORMAL FACULTY REVIEW AT GATE 1 EVALUATION ]    │
└──────────────────────────────────────────────────────────────────────────────────┘
```
