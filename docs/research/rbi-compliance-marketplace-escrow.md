# RBI Regulations & Legal Compliance for Marketplace Escrows and Payments

## Metadata
- **Document ID**: RESEARCH-RBI-ESCROW-2026-01
- **Project**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow (GigaFlow)
- **Academic Context**: KLE Technological University, Belagavi — Department of Computer Science & Engineering
- **Team**: Team 07 (Theme 01)
  - Vaibhav Chavanpatil (Roll No: 4, SRN: 02FE24BCS013) — Engine 04 (Web Technologies)
  - Purvi Sammatshetti (Roll No: 11, SRN: 02FE24BCS022) — Engine 03 (DBMS / Transaction Ledger)
  - Darshan Kittur (Roll No: 18, SRN: 02FE24BCS053) — Engine 02 (DSA & SE / Evidence Engine)
  - Vaishnavi Modekar (Roll No: 21, SRN: 02FE24BCS060) — Engine 01 (OS / Escrow FSM Scheduler)
- **Status**: Complete & Verified
- **Date**: 2026-10-03

---

## 1. Executive Summary & Regulatory Scope

In developing a milestone-based freelance marketplace with escrow mechanics, engineering teams frequently confuse **internal database ledger accounting** with **custodial fund holding**. In India, holding third-party customer funds is strictly regulated by the **Reserve Bank of India (RBI)** under the **Payment and Settlement Systems Act, 2007 (PSS Act, 2007)**.

This research document evaluates:
1. Statutory mandates under Section 18 and Section 23A of the PSS Act, 2007.
2. The RBI Master Directions and Guidelines for Payment Aggregators and Payment Gateways (PA-PG Guidelines, Circular DPSS.CO.PD.No.1810/02.14.008/2019-20).
3. The legal prohibition against private marketplaces holding customer funds in corporate current accounts.
4. Prescribed settlement cycles ($T_p+0/T_p+1$ inward, $T_s+1/T_d+1$ outward, and $T+1$ to $T+5$ refunds).
5. The legally compliant Technology Service Provider (TSP) architecture implemented by Team 07 using Cashfree Payments India Pvt. Ltd. (licensed RBI Payment Aggregator).

---

## 2. Statutory Framework: Payment & Settlement Systems Act, 2007

### 2.1 Section 4: Prohibition of Unauthorized Payment Systems
Under **Section 4(1)** of the PSS Act, 2007:
> *"No person other than the Reserve Bank shall commence or operate a payment system except under and in accordance with an authorisation issued by the Reserve Bank under this Act."*

Any entity that receives money from a payer (client) with an obligation to pay a payee (freelancer) upon conditional fulfillment is operating a **Payment System**. Commencing or operating such a system without an RBI certificate of authorization granted under **Section 7** is a criminal offense punishable under **Section 25 and Section 26** with imprisonment up to 10 years and punitive financial fines.

### 2.2 Section 18: Regulatory Directives & Oversight
Under **Section 18** of the PSS Act, 2007:
> *"The Reserve Bank may, if it considers necessary or expedient in the public interest, or for the regulation of payment systems generally, or to prevent the affairs of any payment system from being conducted in a manner prejudicial to the interests of the system or the public, give directions to system providers or system participants."*

The RBI exercises its powers under Section 18 read with Section 10(2) to prescribe binding operational instructions for intermediaries, payment aggregators, and escrow managers.

### 2.3 Section 23A: Statutory Protection of Escrow Funds (Ring-Fencing)
Inserted by Parliament via the Payment and Settlement Systems (Amendment) Act, 2015, **Section 23A** provides vital protection for customer funds:
1. Funds collected from customers and kept in dedicated escrow/nodal accounts with scheduled commercial banks are held in **trust** for the beneficiaries.
2. These funds **do not form part of the assets of the intermediary / payment aggregator**.
3. In the event of bankruptcy, insolvency, winding up, or legal claims against the intermediary, escrow balances are **immune from attachment, creditors' claims, liquidator seizure, or court garnishment orders**.

---

## 3. RBI Guidelines for Payment Aggregators (PA-PG Guidelines)

The governing regime for marketplace payments was codified in RBI Circular **DPSS.CO.PD.No.1810/02.14.008/2019-20** dated March 17, 2020 (*"Guidelines on Regulation of Payment Aggregators and Payment Gateways"*), replacing the legacy 2009 Intermediary Directions (DPSS.CO.OSD.No.863/06.11.001/2009-10).

### 3.1 Definition of Payment Aggregators vs. Payment Gateways
- **Payment Aggregators (PAs)** (Clause 1.1.1):
  Entities that facilitate e-commerce sites and merchants to accept payment instruments from customers. They connect merchants with acquirers. In the process, **they receive payments from customers, pool them, and transfer them on to merchants after a time period**. Handling funds mandates direct RBI authorization.
- **Payment Gateways (PGs)** (Clause 1.1.2):
  Entities that provide technology infrastructure to route and facilitate processing of electronic payment transactions without handling funds. Considered **Technology Service Providers (TSPs)** or outsourcing partners.

### 3.2 Escrow Account Mechanics (Clause 8.1 - 8.3)
1. **Mandatory Escrow**: Non-bank PAs must maintain the funds collected from customers in an **Escrow Account** opened with a Scheduled Commercial Bank (SCB).
2. **Designated Payment System**: Under Clause 8.1, for maintaining escrow accounts, operations of PAs are legally deemed to be "designated payment systems" under Section 23A of the PSSA.
3. **Double Escrow Diversification**: PAs may maintain an additional escrow account with a different SCB for business continuity.
4. **Intraday Minimum Balance**: At the end of every business day, the amount in the escrow account must not be less than the amount collected from customers or due to merchants (Clause 8.6).

### 3.3 Permissible Credits and Debits (Clause 8.9)
The RBI strictly limits operations in the escrow account to prevent embezzlement, speculation, or unauthorized money movement:

| Operation Type | Clause | Permissible Transaction | Regulatory Safeguard |
|---|---|---|---|
| **CREDIT** | 8.9.1.1(a) | Payments from customers for purchase of goods / services | Direct intake from client checkout |
| **CREDIT** | 8.9.1.1(b) | Pre-funding by merchants or Payment Aggregators | Liquidity buffer |
| **CREDIT** | 8.9.1.1(c) | Transfers representing refunds for failed / disputed transactions | Inward reversal routing |
| **CREDIT** | 8.9.1.1(d) | Payments for onward promotional incentives / cashbacks | Verified promotional allocations |
| **DEBIT** | 8.9.1.2(a) | Payments to merchants / service providers | Payout to freelancer upon milestone release |
| **DEBIT** | 8.9.1.2(b) | Payments to any other account on specific merchant direction | Sub-merchant bank disbursements |
| **DEBIT** | 8.9.1.2(c) | Transfers representing refunds for failed / disputed transactions | Payout to client upon dispute refund |
| **DEBIT** | 8.9.1.2(d) | Payment of commission to intermediaries at pre-determined rates | Platform fee debit to GigaFlow corporate account |
| **DEBIT** | 8.9.1.2(e) | Payment of promotional cashbacks | Direct promotional payout |

**Prohibited Transactions**:
- No cash withdrawals (Clause 8.8 bars Cash-on-Delivery operations through escrow).
- No co-mingling of merchant settlements with general operating expenses (Clause 8.12).
- No interest accrual on escrow balances unless a strictly audited "core portion" is established after 26 fortnights of audited operations (Clause 8.15).

---

## 4. Can a Private Marketplace Hold Customer Funds in its Own Current Account?

### Verdict: STRICT NO (Illegal & Unlicensed)

Under Indian law, an e-commerce freelance marketplace (like GigaFlow) is **strictly prohibited from holding customer deposit funds in its own corporate or current bank account**.

### 4.1 Legal and Regulatory Reasons

1. **Explicit Ban on E-Commerce Marketplaces Acting as PAs (Clause 3.6)**:
   > *"E-commerce marketplaces providing PA services shall not continue this activity... If they desire to pursue this activity, it shall be separated from the marketplace business and they shall apply for authorisation on or before June 30, 2021."*
   The RBI deliberately severed the marketplace business model from payment handling. An entity cannot simultaneously be an e-commerce platform and an unlicensed pooler of customer funds.

2. **Violation of PSS Act Section 4**:
   If GigaFlow were to accept client deposits into its corporate bank account and hold them until milestone completion before transferring them to freelancers, GigaFlow would be operating an **unauthorized payment and settlement system**. This exposes the platform founders and university entity to criminal liability under Sections 25 and 26.

3. **Banning of Unregulated Deposit Schemes Act, 2019 (BUDS Act)**:
   Holding customer money advances that are conditional or held indefinitely without statutory escrow authorization constitutes an unregulated deposit under the BUDS Act, 2019.

4. **Insolvency Risk & Lack of Section 23A Ring-Fencing**:
   A standard current account has zero statutory ring-fencing. If the operating company encounters financial distress, creditors or tax authorities could attach the current account, unlawfully seizing client and freelancer funds.

### 4.2 Compliant Engineering Architecture: Non-Custodial TSP Model

To operate in 100% compliance with RBI directives:
- GigaFlow acts strictly as a **Technology Service Provider (TSP)**.
- GigaFlow integrates with an **RBI-Authorized Payment Aggregator** (Cashfree Payments India Pvt. Ltd. — PA License No. authorized by RBI).
- All funds flow directly from the client into Cashfree’s RBI-regulated Escrow Account maintained with a Scheduled Commercial Bank.
- GigaFlow’s Escrow State Machine (`escrow-fsm.ts`) acts as an **instructional state oracle**, communicating cryptographically signed release and refund events to Cashfree.
- Payouts disburse directly from Cashfree's Escrow Account to the freelancer’s verified bank account via IMPS/NEFT/UPI rails.
- GigaFlow never possesses custody of fiat funds at any millisecond of the transaction lifecycle.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RBI COMPLIANT FLOW (ZERO CUSTODY)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [ Client Browser ]                                                        │
│           │                                                                 │
│           ▼ (1. Deposit Order)                                              │
│   [ GigaFlow Platform (TSP) ] ──── (2. Create Order) ───► [ Cashfree API ]  │
│                                                                  │          │
│   [ Client Bank / UPI ] ──────── (3. Direct Fiat Deposit) ───────┼──────────┤
│                                                                  │          │
│                                                                  ▼          │
│                                                   ┌──────────────────────┐  │
│                                                   │ Cashfree PA Escrow   │  │
│                                                   │ Account at SCB       │  │
│                                                   │ (Sec 23A Ring-Fenced)│  │
│                                                   └──────────┬───────────┘  │
│                                                              │              │
│   [ Milestone Approved / Dispute Ruling ]                    │              │
│           │                                                  │              │
│           ▼ (4. Release / Refund Webhook Instruction)        │              │
│   [ GigaFlow Escrow FSM ] ─────── (5. Split / Payout) ───────┤              │
│                                                              │              │
│                                      ┌───────────────────────┴──────────┐   │
│                                      ▼                                  ▼   │
│                          [ Freelancer Bank Account ]         [ GigaFlow Current ]
│                          (Net Milestone Payout: 95%)         (Platform Fee: 5%)
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Settlement Cycles: RBI Timelines & Rules

The RBI PA-PG Guidelines mandate precise settlement schedules to protect merchants and vendors from liquidity hold-ups.

### 5.1 Inward Processing Cycle ($T_p$)
Under **Clause 8.3**:
- $T_p$ represents the date/time when money is deducted from the customer's payment instrument (card, UPI, netbanking).
- Funds must be remitted by the acquiring bank to the PA escrow account on a **$T_p+0$ or $T_p+1$** basis.

### 5.2 Outward Settlement Cycle to Merchants/Vendors ($T_s / T_d / T_r$)
Under **Clause 8.4**, final settlement from the escrow account to the merchant is bound by delivery terms:

1. **PA Responsible for Delivery ($T_s+1$)**:
   Where the PA is responsible for delivery of goods/services, settlement to the merchant shall be no later than **$T_s+1$** (where $T_s$ is the date of intimation of completion of transaction/delivery).
2. **Merchant Responsible for Delivery ($T_d+1$)**:
   Where the merchant is responsible for delivery, settlement shall be no later than **$T_d+1$** (where $T_d$ is the date of confirmed delivery).
3. **Refund Period Holding ($T_r+1$)**:
   Where the merchant agreement explicitly provides for retaining funds until the expiry of a dispute/refund window, settlement shall occur no later than **$T_r+1$** (where $T_r$ is the date of expiry of the refund period).

### 5.3 Application to Milestone Escrow Contracts
In GigaFlow’s freelance workflow:
- The agreement establishes that funds remain secured in the Cashfree escrow holding structure throughout the `FUNDED`, `IN_PROGRESS`, and `UNDER_REVIEW` states.
- The approval of the deliverable by the client or a binding ruling by the dispute reviewer constitutes the **Milestone Acceptance Event ($T_d / T_s$)**.
- Upon receipt of the acceptance instruction, the payout settlement must be initiated no later than **$T+1$ banking business days**.
- Cashfree Payout rails execute this transfer via IMPS/NEFT/UPI within minutes, well within the RBI $T+1$ statutory limit.

### 5.4 Refund Timelines (Dispute Rulings)
Under **Clause 8.5** and RBI Circular **DPSS.CO.PD No.629/02.01.014/2019-20** (*"Harmonisation of Turn Around Time (TAT) and customer compensation for failed transactions"*):
- When a dispute is arbitrated with a ruling of `REFUND_TO_CLIENT` (or split refund):
  - The refund must be initiated immediately through the original escrow channel back to the source instrument.
  - **UPI Transactions**: Refund settlement within **$T+1$ day**.
  - **Cards & Netbanking**: Refund settlement within **$T+5$ business days**.
  - Delay beyond prescribed TAT incurs mandatory compensation of ₹100 per day payable to the customer.

---

## 6. Summary of Engineering Requirements for GigaFlow

1. **Zero-Custody Guarantee**: No code, database model, or API route shall route client fiat money to GigaFlow internal accounts prior to verified completion.
2. **Integer Paise Standard**: All monetary values are handled as integer paise (`Int`) to prevent float discrepancies during splits.
3. **Cryptographic Webhook Signatures**: All incoming payment notifications from Cashfree must verify HMAC-SHA256 signatures with timestamp validation ($\le 300\text{s}$) to prevent replay attacks.
4. **Idempotency Guard**: Every order, transfer, and refund instruction must carry a deterministic idempotency key (`{contractId}:{milestoneId}:{action}:{uuid}`).
5. **Audit Trail Alignment**: All gateway event IDs, transfer IDs, and refund UTR numbers must be permanently logged in `PaymentEvent` and anchored to Engine 02's SHA-256 tamper-evident verification chain.
