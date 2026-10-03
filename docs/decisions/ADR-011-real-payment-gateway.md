# ADR-011: Real Payment Gateway Selection & Integration Architecture

## Metadata
- **Status**: Proposed
- **Date**: 2026-10-03
- **Author(s)**: Engineering Team (Team 07)
- **Deciders**: Vaibhav Chavanpatil, Purvi Sammatshetti, Darshan Kittur, Vaishnavi Modekar
- **Consulted**: Engine 01 (OS — Vaishnavi Modekar), Engine 02 (DSA/Evidence — Darshan Kittur), Engine 03 (DBMS — Purvi Sammatshetti), Engine 04 (Web — Vaibhav Chavanpatil)

---

## 1. Context and Problem Statement

GigaFlow currently utilizes a simulated escrow ledger where monetary fields (`Float`) reside solely in application database records. `User.balance` is seeded with arbitrary numbers, and milestone deposit, release, and refund operations are internal database mutations moving float values between table rows.

The original project specification (`AGENTS.md` §4) established:
> **"Out-of-Scope: Real banking/payment gateways (Stripe/PayPal — purely simulated currency)"**

To prepare GigaFlow for real-world commercial viability and prove that its milestone-based dispute resolution workflow functions seamlessly with Indian banking infrastructure, the engineering team requires an architecture for integrating a real Indian payment gateway.

### Definition of "GF" (GigaFlow Currency Unit)
To avoid regulatory ambiguity, the platform denomination **"GF"** is explicitly defined:
- **1 GF = ₹1.00 INR (Indian Rupee)** display and internal accounting unit.
- **Internal Storage**: 100 paise (`1 GF = 100 paise = ₹1.00 INR`).
- **Regulatory Nature**: GF is strictly an internal display denomination and accounting presentation unit. It is **NOT** a Prepaid Payment Instrument (PPI), virtual digital asset (VDA), cryptocurrency, token, or proprietary closed-loop store of value under the Reserve Bank of India (RBI) Master Directions on Prepaid Payment Instruments (MD-PPIs).
- **Non-Custodial Escrow**: GigaFlow never holds user funds in platform-owned bank accounts or internal digital wallets. All client deposits flow directly into a licensed, regulated Payment Aggregator (PA) escrow/nodal account, and all payouts settle directly to vendor bank accounts.

### Key Decision Forces
1. **Marketplace Escrow & Split Settlement**: GigaFlow operates on a two-sided marketplace model: client deposit → platform milestone hold → freelancer release / split settlement. Simple two-party payment checkout is insufficient.
2. **RBI Regulatory Compliance**: Operating an escrow or marketplace fund holding mechanism in India requires authorization under the RBI Payment Aggregator (PA) guidelines. GigaFlow must rely on a licensed PA provider's infrastructure so the university/platform team does not need an independent banking/PA license.
3. **Turnover & Eligibility Thresholds**: Enterprise marketplace solutions (such as Razorpay Route) mandate strict minimum domestic business turnover thresholds (e.g., ₹40,00,000 / ₹40L) that student projects or early-stage university startups cannot satisfy.
4. **Real-Only Architecture**: Purely simulated ledger mutations mask banking race conditions, network latency, webhook failures, and cryptographic verification issues. All environments (development, testing, staging, and production) must operate against real gateway APIs (Cashfree PG Sandbox for non-live; Cashfree PG Production for live).
5. **Integer-Paise Accounting**: Eliminating floating-point arithmetic errors across contracts, milestones, and dispute awards by mandating 64-bit integer paise throughout the application layer and database schema.

---

## 2. Decision Outcome

> **Chosen Option**: Cashfree marketplace/escrow stack, subject to provider confirmation of eligibility and exact product configuration.
>
> **Rationale**: Cashfree's marketplace and escrow suite (Cashfree Easy Split with One Escrow / Escrow Account integration) delivers licensed RBI Payment Aggregator compliance, automated sub-merchant (vendor) onboarding, programmable split disbursements, and milestone-level fund holding capabilities without imposing a mandatory ₹40L turnover barrier. Cashfree provides a comprehensive, production-grade Sandbox environment with full API and webhook simulation, enabling a **real-only** integration where simulated database-only balance mutations are deprecated and completely removed.

### Architectural Policy
1. **Deprecation of Simulated Gateway**: The previously proposed dual-mode `SimulatedGateway` is deprecated and removed. All non-live environments (local development, CI/CD, staging, and academic demonstration) shall execute against the **Cashfree PG Sandbox**. The live environment shall connect to **Cashfree Production**.
2. **Non-Custodial Processing**: GigaFlow maintains zero custody over fiat currency. The Escrow FSM (`escrow-fsm.ts`) acts as the state oracle, while Cashfree acts as the external monetary execution oracle.

---

## 3. Considered Options

### Option A: Cashfree Marketplace / Escrow Stack (Easy Split & One Escrow) — [SELECTED]
- **Description**: Cashfree's regulated marketplace solution combining Easy Split (vendor split settlement) and One Escrow (milestone fund holding and conditional release).
- **Pros**:
  - Purpose-built for Indian marketplace split settlements and milestone escrow holds.
  - Cashfree holds an authorized RBI Payment Aggregator (PA) license; GigaFlow does not hold customer funds.
  - **No ₹40L turnover prerequisite**, making it accessible for KLE Technological University evaluation and deployment.
  - Production-grade Sandbox environment simulating UPI, Netbanking, cards, and automated webhooks.
  - Robust Node.js SDK (`cashfree-pg`) and direct RESTful API endpoints.
  - Secure webhook signatures using HMAC-SHA256 with timestamp verification.
  - Programmatic vendor (freelancer) onboarding and KYC verification APIs.
  - Competitive transaction pricing (~2% payment processing + nominal split fee).
- **Cons**:
  - Specific product combination (One Escrow with Easy Split) requires provider confirmation of merchant eligibility and underwriting configuration.
  - Developer documentation has specialized edge cases requiring coordination with Cashfree technical support.

### Option B: Razorpay Route (Marketplace Transfers) — [REJECTED]
- **Description**: Razorpay's marketplace solution using Linked Accounts and the Transfer API for splitting payments.
- **Pros**:
  - Extensive Indian developer ecosystem, comprehensive documentation, and mature Node.js SDK (`razorpay`).
  - Broad payment method coverage and developer tooling.
  - Authorized RBI PA license.
- **Cons**:
  - **Strict ₹40,00,000 (₹40L) minimum domestic annual turnover requirement** to activate Razorpay Route; disqualifies university-based academic and early-stage deployments.
  - No out-of-the-box milestone-level escrow hold; fund holding logic must be synthesized application-side.
  - Complex Linked Account onboarding and KYC approval hurdles for academic test accounts.

### Option C: Retain Simulated Gateway with Abstraction — [REJECTED / DEPRECATED]
- **Description**: Maintain internal database balance mutations via a `SimulatedGateway` class alongside a real gateway interface.
- **Pros**:
  - Zero external dependencies and zero setup friction for basic offline tests.
- **Cons**:
  - Masks critical production realities: asynchronous webhook delivery, network timeouts, signature forgery, and settlement lags.
  - Leaves the application vulnerable to state desynchronization between simulated ledger columns and external banking reality.
  - Contradicts the real-only architectural standard required for verifiable fintech workflows.

---

## 4. Pros and Cons of the Chosen Option

### Positive Consequences
- **Complete Real-Gateway Parity**: By adopting Cashfree Sandbox for all dev/test environments and Cashfree Production for live, 100% of codebase execution paths test real HTTP payloads, real cryptographic signatures, and real asynchronous webhook handling.
- **Direct Escrow FSM Alignment**: Cashfree One Escrow / Easy Split hold-and-release mechanics map directly to GigaFlow's Escrow FSM states (`AWAITING_DEPOSIT` → `FUNDED` → `IN_PROGRESS` → `UNDER_REVIEW` → `RELEASED`).
- **No Turnover Disqualification**: Unlike Razorpay Route, Cashfree enables onboarding and sandbox verification without requiring ₹40L in historical revenue.
- **Elimination of Floating-Point Vulnerabilities**: The integration mandates 64-bit integer paise across the schema, matching Cashfree's paise-based API contract.
- **Regulatory Protection**: GigaFlow remains strictly a Technology Service Provider (TSP); all regulatory nodal/escrow compliance is assumed by Cashfree.

### Negative Consequences / Trade-offs
- **Onboarding & Underwriting Dependency**: Formal activation of One Escrow requires merchant underwriting and legal documentation review by Cashfree.
- **Operational Webhook Resilience**: Requires dedicated webhook infrastructure, signature validation, idempotent event queues, and automated dead-letter replay handling.
- **Scope Boundary Amendment**: Overrides the original academic out-of-scope restriction in `AGENTS.md` §4, necessitating formal decider sign-off.

---

## 5. Pre-Implementation Verification Gate

Before any production or live financial transactions are enabled, the engineering team must satisfy and verify all **11 Mandatory Verification Gate Criteria**:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   PRE-IMPLEMENTATION VERIFICATION GATE (11 POINTS)               │
├─────┬──────────────────────────────────────────┬─────────────────────────────────┤
│ #   │ Verification Item                        │ Success Criteria / Proof        │
├─────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ 01  │ Provider Eligibility & Configuration     │ Written confirmation & product  │
│     │ Confirmation                             │ tier approval from Cashfree.    │
│ 02  │ Merchant & Sub-Merchant KYC Protocol     │ Master KYC + automated vendor   │
│     │                                          │ onboarding/penny-drop verified. │
│ 03  │ RBI PA/PG Regulatory Non-Circumvention   │ Zero-custody proof; funds pool  │
│     │                                          │ strictly in Cashfree PA nodal.  │
│ 04  │ Explicit "GF" Non-PPI Legal Definition   │ 1 GF = ₹1.00 accounting unit;   │
│     │                                          │ strict exclusion from PPI rules.│
│ 05  │ ₹100 Canonical Test Economics & Splits   │ Zero-loss integer split math on │
│     │                                          │ ₹100 (10,000 paise) milestone.  │
│ 06  │ Schema Migration to Integer Paise (Int)  │ 8 money fields converted from   │
│     │                                          │ Float to Int; zero precision bug│
│ 07  │ Cashfree PG Sandbox Lifecycle Test       │ 100% passing automated test suite│
│     │                                          │ on order, pay, split, refund.   │
│ 08  │ HMAC-SHA256 Webhooks & Replay Prevention │ Cryptographic signature check & │
│     │                                          │ 300s window & idempotency keys. │
│ 09  │ Atomic Ledger & FSM Concurrency          │ Prisma interactive transaction   │
│     │                                          │ binding FSM + payment events.   │
│ 10  │ Dispute Arbitration Refund Mechanics     │ Full/partial reverse settlement │
│     │                                          │ verified via Refund API.        │
│ 11  │ Production Cutover, Reconciliation & CB  │ Secrets audit, daily ledger cron│
│     │                                          │ match, and circuit breaker test.│
└─────┴──────────────────────────────────────────┴─────────────────────────────────┘
```

### Detailed Verification Specifications:

1. **Gate 1: Provider Eligibility & Product Configuration Confirmation**
   - Obtain formal written confirmation from Cashfree sales/partner engineering regarding the exact product stack (Easy Split standalone vs. Easy Split paired with One Escrow / Virtual Escrow).
   - Document KYC and business registration prerequisites for the operating entity (e.g., KLE Technological University startup incubator / team entity).

2. **Gate 2: Merchant & Sub-Merchant (Vendor) KYC Protocol**
   - Verify Master Merchant account activation with verified Business PAN, GSTIN, and linked settlement bank account.
   - Implement and test the automated sub-merchant (freelancer) onboarding pipeline using the Cashfree Vendor API (`POST /easy-split/vendors`).
   - Validate bank account verification via automated penny-drop before allowing vendor payout assignment.

3. **Gate 3: Regulatory & Licensing Non-Circumvention (RBI PA/PG Compliance)**
   - Architecturally prove zero custody: fiat currency must never hit GigaFlow corporate or university bank accounts.
   - Client checkout funds must route directly to Cashfree's RBI-regulated nodal/escrow account.
   - Payout disbursements must originate strictly from Cashfree nodal accounts to vendor bank accounts.

4. **Gate 4: Explicit "GF" Legal Classification (Non-PPI Status)**
   - Audit all UI/UX copy, legal terms of service, and documentation to affirm that "GF" is strictly a display alias and accounting notation (`1 GF = ₹1.00 INR = 100 paise`).
   - Enforce that GigaFlow does NOT operate a stored-value wallet, does NOT allow off-platform peer-to-peer balance transfers, and does NOT hold prepaid balances.

5. **Gate 5: ₹100 Canonical Test Economics & Split Precision Validation**
   - Validate mathematical exactness and fee absorption on a canonical ₹100.00 (10,000 paise) milestone payment:
     - **Milestone Budget**: 100 GF = ₹100.00 = 10,000 paise.
     - **Gross Client Deposit**: ₹100.00 (10,000 paise) collected at checkout.
     - **Payment Gateway Processing Fee**: 2.0% + 18% GST on processing fee:
       $$\text{Base Fee} = ₹100.00 \times 0.02 = ₹2.00 \ (200 \text{ paise})$$
       $$\text{GST (18\%)} = ₹2.00 \times 0.18 = ₹0.36 \ (36 \text{ paise})$$
       $$\text{Total Gateway Deduction} = ₹2.36 \ (236 \text{ paise})$$
     - **Platform Commission Split**: 5.0% platform fee = ₹5.00 (500 paise) allocated to GigaFlow master vendor account.
     - **Net Freelancer Vendor Disbursement**:
       $$\text{Disbursement (Fee Platform-Absorbed)} = 10,000 - 500 = 9,500 \text{ paise} \ (₹95.00)$$
       $$\text{Net Platform Gain} = 500 - 236 = 264 \text{ paise} \ (₹2.64)$$
       $$\text{Disbursement (Fee Freelancer-Deducted)} = 10,000 - 500 - 236 = 9,264 \text{ paise} \ (₹92.64)$$
     - **Arithmetic Validation**: Assert that sum of parts identically equals the whole ($9,264 + 500 + 236 = 10,000$) with zero floating-point remainder.

6. **Gate 6: Schema Migration & Integer-Paise Precision Gate**
   - Execute Prisma migration converting all 8 monetary fields from `Float` to `Int` (paise):
     - `User.balancePaise`, `Contract.totalAmountPaise`, `Contract.escrowBalancePaise`, `Milestone.amountPaise`, `EscrowTransaction.amountPaise`, `Project.budgetPaise`, `Proposal.bidAmountPaise`, `Order.amountPaise`.
   - Add new audit tables: `PaymentEvent`, `WebhookLog`, and `PaymentReconciliation`.
   - Verify zero data loss on legacy test records via deterministic paise conversion: `paise = Math.round(floatVal * 100)`.

7. **Gate 7: Cashfree PG Sandbox Lifecycle Verification**
   - Execute end-to-end integration test suite in Cashfree PG Sandbox:
     1. Order creation (`POST /pg/orders`) generating valid checkout session.
     2. Automated payment simulation using test UPI IDs / card credentials.
     3. Webhook receipt and processing (`payment.captured`).
     4. Vendor split authorization (`POST /easy-split/orders/{order_id}/split`).
     5. Refund execution (`POST /pg/orders/{order_id}/refunds`).

8. **Gate 8: Webhook Cryptographic Integrity, Idempotency & Replay Prevention**
   - Implement HMAC-SHA256 signature verification using `crypto.timingSafeEqual`:
     $$\text{Signature} = \text{Base64}(\text{HMAC-SHA256}(\text{timestamp} + \text{rawBody}, \text{CASHFREE\_WEBHOOK\_SECRET}))$$
   - Enforce timestamp freshness check: reject any webhook payload where $|\text{currentTime} - \text{timestamp}| > 300\text{ seconds}$ to prevent replay attacks.
   - Enforce idempotency: store incoming `gatewayEventId` with `@unique` constraint in `WebhookLog`; duplicate deliveries immediately return HTTP 200 without executing side effects.

9. **Gate 9: Atomic Ledger & FSM Concurrency Alignment**
   - Bind payment event processing and FSM state mutations within a single Prisma interactive transaction (`prisma.$transaction`).
   - Milestone state changes to `FUNDED` only upon confirmed `PAYMENT_CAPTURED` webhook.
   - Milestone state changes to `RELEASED` only upon confirmed `TRANSFER_COMPLETED` webhook.
   - Milestone state changes to `REFUNDED` only upon confirmed `REFUND_COMPLETED` webhook.
   - Validate that race conditions (e.g., client attempting release while dispute is lodged) are rejected at database level.

10. **Gate 10: Dispute Arbitration Refund Mechanics**
    - Verify full and partial refund pathways triggered by dispute arbitrator rulings (`REFUND_TO_CLIENT` or split percentage awards).
    - Validate asynchronous refund settlement tracking (T+5 to T+7 bank working days) via Cashfree Refund APIs and webhooks (`refund.completed`, `refund.failed`).
    - Cryptographically seal dispute refund transactions into Engine 02's tamper-evident SHA-256 audit log chain.

11. **Gate 11: Production Cutover, Daily Reconciliation & Emergency Circuit Breaker**
    - Security audit: verify that all secrets (`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`) reside in server environment variables and are excluded from git.
    - Automated daily reconciliation job: cross-verify internal `PaymentEvent` sums against Cashfree Settlement API exports; flag any mismatch as `DISCREPANCY`.
    - Emergency circuit breaker: verify that setting `PAYMENT_CHECKOUT_ENABLED=false` halts new deposit orders while preserving read access and contract state integrity for in-flight escrows.

---

## 6. Implementation & Migration Plan

> Architectural reference: [`docs/architecture/real-payment-architecture.md`](../architecture/real-payment-architecture.md)

### Phase 0: ADR Approval & Eligibility Verification (Current)
- Review and formal sign-off of ADR-011 by all deciders.
- Initiate eligibility and onboarding validation with Cashfree.
- Scope boundary amendment recorded for `AGENTS.md` §4.

### Phase 1: Database Schema & Paise Migration
- Execute Prisma schema migration converting all `Float` monetary fields to `Int` (paise).
- Deploy `PaymentEvent`, `WebhookLog`, and `PaymentReconciliation` models.
- Deploy currency formatting utility: `formatPaiseToRupees(paise: number): string`.

### Phase 2: Gateway Adapter Layer (Real-Only Sandbox)
- Implement `PaymentGateway` TypeScript interface in `src/core/engine-03-dbms/payments/`.
- Implement `CashfreeGateway` targeting the Cashfree PG Sandbox environment.
- Deprecate and remove simulated ledger mutation paths.
- Configure `.env` with `PAYMENT_ENV=sandbox` (local/test) and `PAYMENT_ENV=production` (live).

### Phase 3: Webhook Routing, Idempotency & FSM Binding
- Implement API routes:
  - `POST /api/payments/create-order`: Client deposit initiation.
  - `POST /api/payments/webhook`: Webhook handler with HMAC-SHA256 verification and replay guard.
  - `POST /api/payments/verify`: Fallback client-side verification query.
- Adapt `LedgerCoordinator` and `EscrowFSM` to advance milestone states solely on verified payment events.

### Phase 4: UI/UX & Checkout Integration
- Update client dashboard: "Deposit Funds" initiates hosted Cashfree checkout session.
- Update milestone card: show real payment status, gateway transaction IDs, and settlement state.
- Ensure all monetary displays format paise to INR (`₹XX.XX`).

### Phase 5: Verification Gate Execution & Go-Live
- Execute all 11 Pre-Implementation Verification Gate checks.
- Conduct simulated end-to-end milestone lifecycle runs in Cashfree Sandbox.
- Perform daily reconciliation dry runs.
- Switch `PAYMENT_ENV=production` upon provider underwriting approval.

---

## 7. Links & References

- Technical Architecture: [`docs/architecture/real-payment-architecture.md`](../architecture/real-payment-architecture.md)
- Project Scope Boundary: [`AGENTS.md`](../../AGENTS.md) §4
- Escrow FSM Implementation: [`src/core/engine-01-os/escrow-fsm.ts`](../../src/core/engine-01-os/escrow-fsm.ts)
- Ledger Coordinator: [`src/core/engine-03-dbms/ledger.ts`](../../src/core/engine-03-dbms/ledger.ts)
- Related ADRs:
  - [ADR-005: Escrow State Machine](ADR-005-escrow-fsm.md)
  - [ADR-007: Database Transactions and Concurrency](ADR-007-database-transactions.md)
  - [ADR-009: Evidence Tree and Tamper-Resistance](ADR-009-evidence-integrity.md)
- External Documentation:
  - Cashfree Payment Gateway & Easy Split Docs: `https://docs.cashfree.com/`
  - Cashfree One Escrow API: `https://www.cashfree.com/escrow-payments/`
  - RBI Guidelines on Regulation of Payment Aggregators and Payment Gateways (DPSS.CO.PD.No.1810/02.14.008/2019-20)
  - RBI Master Directions on Issuance and Operation of Prepaid Payment Instruments (MD-PPIs)
