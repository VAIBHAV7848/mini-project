# Real Payment Architecture

## 1. Executive Summary

This document defines the architecture for migrating GigaFlow's simulated escrow ledger to real payment events backed by an Indian payment gateway (Cashfree Easy Split or Razorpay Route).

> [!IMPORTANT]
> The official project scope (AGENTS.md §4) explicitly states:
> **"Out-of-Scope: Real banking/payment gateways (Stripe/PayPal - purely simulated currency)"**
>
> This architecture is a **forward-looking design document** for production readiness. Implementation requires explicit team approval to override the scope boundary. Until approved, the existing simulated ledger remains the active system.

---

## 2. Current State: Simulated Money Audit

### 2.1 Money-Bearing Fields (Prisma Schema)

| Model | Field | Type | Purpose |
|---|---|---|---|
| `User` | `balance` | `Float` | Simulated wallet balance (seeded, no real source) |
| `Project` | `budget` | `Float` | Project budget estimate |
| `Proposal` | `bidAmount` | `Float` | Freelancer bid amount |
| `Contract` | `totalAmount` | `Float` | Agreed contract value |
| `Contract` | `escrowBalance` | `Float` | Currently locked escrow funds |
| `Milestone` | `amount` | `Float` | Per-milestone payment amount |
| `Order` | `amount` | `Float` | Gig order amount |
| `EscrowTransaction` | `amount` | `Float` | Ledger entry amount |

### 2.2 Money Operations (Engine 03 — Ledger Coordinator)

| Operation | File | What It Does |
|---|---|---|
| `depositEscrow()` | `engine-03-dbms/ledger.ts:54` | Decrements `User.balance`, increments `Contract.escrowBalance`, creates `EscrowTransaction(DEPOSIT)` |
| `releaseMilestoneEscrow()` | `engine-03-dbms/ledger.ts:160` | Decrements `Contract.escrowBalance`, increments freelancer `User.balance`, creates `EscrowTransaction(RELEASE)` |
| `refundMilestoneEscrow()` | `engine-03-dbms/ledger.ts:290` | Decrements `Contract.escrowBalance`, increments client `User.balance`, creates `EscrowTransaction(REFUND)` |

### 2.3 Critical Design Observations

1. **No real money source.** `User.balance` is seeded with arbitrary values (e.g., `10000.0`). Deposit checks `client.balance >= amount` but this balance has no banking origin.
2. **Float arithmetic.** All monetary fields use `Float`, which is susceptible to floating-point precision errors (e.g., `0.1 + 0.2 !== 0.3`).
3. **No idempotency.** Deposit/Release/Refund have no idempotency keys. A network retry could cause double-deposit.
4. **No external verification.** Success is determined entirely by DB writes. No external payment event confirms fund movement.
5. **Single currency assumed.** INR is implied by display (`₹`) but never enforced in the schema.
6. **Instant settlement.** Release immediately credits `User.balance`. Real settlement involves T+n day cycles.

---

## 3. Target Architecture

### 3.1 Design Principles

1. **Preserve the Escrow FSM.** The state machine (`escrow-fsm.ts`) is the single source of truth for contract lifecycle. Payment events feed into it; they do not replace it.
2. **Payment Gateway as External Oracle.** The gateway (Cashfree/Razorpay) holds real money. GigaFlow's DB records payment *intents* and *confirmations*, not balances.
3. **Event-Sourced Payment Log.** An append-only `PaymentEvent` table records every gateway interaction. The current `EscrowTransaction` table becomes a derived view.
4. **Integer Paise.** All internal amounts stored as `Int` (paise). Display conversion: `amount / 100` with `.toFixed(2)`. Eliminates floating-point bugs.
5. **Idempotent by Construction.** Every payment operation carries an idempotency key: `{contractId}:{milestoneId}:{action}:{attempt}`.
6. **Webhook-Driven Confirmation.** No state transition completes until a verified webhook confirms it. Optimistic UI is permitted; authoritative state waits for gateway.

### 3.2 Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                       │
│  Dashboard → Initiate Deposit → Gateway Checkout Page   │
└────────────────────┬────────────────────────────────────┘
                     │ POST /api/payments/create-order
                     ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTES (Engine 04)             │
│                                                         │
│  /api/payments/create-order    → PaymentService         │
│  /api/payments/verify          → PaymentService         │
│  /api/payments/webhook         → WebhookHandler         │
│  /api/contracts/[id]/milestones → MilestoneRoute (existing) │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PAYMENT SERVICE (New — Engine 03)           │
│                                                         │
│  PaymentGateway (interface)                             │
│    ├── CashfreeGateway (implements)                     │
│    └── RazorpayGateway (implements)                     │
│                                                         │
│  PaymentEventStore                                      │
│    └── append-only PaymentEvent records                 │
│                                                         │
│  IdempotencyGuard                                       │
│    └── prevents duplicate operations                    │
│                                                         │
│  LedgerCoordinator (existing, adapted)                  │
│    └── now reads PaymentEvent confirmations              │
│        instead of mutating User.balance directly        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           PAYMENT GATEWAY (External)                    │
│                                                         │
│  Cashfree Easy Split  OR  Razorpay Route                │
│                                                         │
│  Holds real funds → settles to linked accounts          │
│  Sends webhooks → GigaFlow verifies signature           │
└─────────────────────────────────────────────────────────┘
```

### 3.3 New Database Models

```prisma
model PaymentEvent {
  id              String   @id @default(uuid())
  contractId      String   @map("contract_id")
  milestoneId     String?  @map("milestone_id")
  type            String   // ORDER_CREATED | PAYMENT_CAPTURED | TRANSFER_INITIATED | TRANSFER_COMPLETED | REFUND_INITIATED | REFUND_COMPLETED | PAYMENT_FAILED
  gatewayOrderId  String?  @map("gateway_order_id")
  gatewayPaymentId String? @map("gateway_payment_id")
  gatewayTransferId String? @map("gateway_transfer_id")
  idempotencyKey  String   @unique @map("idempotency_key")
  amountPaise     Int      @map("amount_paise")
  currency        String   @default("INR")
  status          String   // INITIATED | CONFIRMED | FAILED
  gatewayResponse String?  @map("gateway_response") // Raw JSON
  actorId         String   @map("actor_id")
  createdAt       DateTime @default(now()) @map("created_at")

  contract  Contract   @relation(fields: [contractId], references: [id])
  milestone Milestone? @relation(fields: [milestoneId], references: [id])

  @@index([contractId, type])
  @@index([gatewayOrderId])
  @@index([idempotencyKey])
  @@map("payment_events")
}

model WebhookLog {
  id              String   @id @default(uuid())
  provider        String   // CASHFREE | RAZORPAY
  eventType       String   @map("event_type")
  gatewayEventId  String   @unique @map("gateway_event_id")
  rawPayload      String   @map("raw_payload") // Full JSON
  signatureValid  Boolean  @map("signature_valid")
  processed       Boolean  @default(false)
  processedAt     DateTime? @map("processed_at")
  receivedAt      DateTime @default(now()) @map("received_at")

  @@index([gatewayEventId])
  @@index([processed, receivedAt])
  @@map("webhook_logs")
}

model PaymentReconciliation {
  id              String   @id @default(uuid())
  date            DateTime
  totalCollected  Int      @map("total_collected") // paise
  totalSettled    Int      @map("total_settled")   // paise
  totalRefunded   Int      @map("total_refunded")  // paise
  discrepancies   String?  // JSON array of mismatches
  status          String   @default("PENDING") // PENDING | MATCHED | DISCREPANCY
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("payment_reconciliations")
}
```

---

## 4. Payment Flows

### 4.1 Deposit (Client → Escrow)

```
1. Client clicks "Deposit" on dashboard
2. POST /api/payments/create-order
   - Validate RBAC (CLIENT only)
   - Validate FSM state (AWAITING_DEPOSIT)
   - Generate idempotencyKey: `dep:{contractId}:{timestamp}`
   - Call gateway.createOrder({ amountPaise, idempotencyKey })
   - Insert PaymentEvent(ORDER_CREATED, INITIATED)
   - Return { gatewayOrderId, checkoutSessionUrl }
3. Client redirected to gateway checkout page
4. Client completes payment on gateway
5. Gateway sends webhook: payment.captured
   - POST /api/payments/webhook
   - Verify signature (HMAC SHA256)
   - Store in WebhookLog
   - Check idempotency (deduplicate)
   - Insert PaymentEvent(PAYMENT_CAPTURED, CONFIRMED)
   - Trigger FSM transition: AWAITING_DEPOSIT → FUNDED
   - Update Contract.escrowBalance (paise)
   - Update Milestone[1].status → FUNDED
   - Create AuditLog entry
6. Client polls or receives SSE: contract now FUNDED
```

### 4.2 Release (Escrow → Freelancer)

```
1. Client clicks "Release Funds" on approved milestone
2. POST /api/contracts/[id]/milestones { action: RELEASE_ESCROW }
   - Validate RBAC + FSM (APPROVED → RELEASED)
   - Generate idempotencyKey: `rel:{contractId}:{milestoneId}`
   - Call gateway.createTransfer({
       vendorId: freelancer.gatewayLinkedAccountId,
       amountPaise: milestone.amountPaise
     })
   - Insert PaymentEvent(TRANSFER_INITIATED, INITIATED)
3. Gateway processes transfer (T+0 to T+3)
4. Gateway webhook: transfer.completed
   - Verify signature
   - Insert PaymentEvent(TRANSFER_COMPLETED, CONFIRMED)
   - Update Milestone.status → RELEASED
   - Decrement Contract.escrowBalance
   - Create AuditLog entry
```

### 4.3 Refund (Escrow → Client)

```
1. Dispute resolved with ruling: REFUND_TO_CLIENT
2. System triggers refund
   - Generate idempotencyKey: `ref:{contractId}:{milestoneId}`
   - Call gateway.createRefund({ paymentId, amountPaise })
   - Insert PaymentEvent(REFUND_INITIATED, INITIATED)
3. Gateway processes refund (T+5 to T+7)
4. Gateway webhook: refund.completed
   - Verify signature
   - Insert PaymentEvent(REFUND_COMPLETED, CONFIRMED)
   - Update Milestone.status → REFUNDED
   - Decrement Contract.escrowBalance
   - Create AuditLog entry
```

---

## 5. Gateway Interface (Provider-Agnostic)

```typescript
interface PaymentGateway {
  // Payment collection
  createOrder(input: {
    amountPaise: number;
    currency: string;
    customerEmail: string;
    customerPhone: string;
    idempotencyKey: string;
    returnUrl: string;
    metadata: Record<string, string>;
  }): Promise<{ orderId: string; checkoutUrl: string }>;

  verifyPayment(input: {
    orderId: string;
  }): Promise<{ status: 'CAPTURED' | 'FAILED'; paymentId: string; amountPaise: number }>;

  // Vendor settlement
  createTransfer(input: {
    vendorAccountId: string;
    amountPaise: number;
    idempotencyKey: string;
    metadata: Record<string, string>;
  }): Promise<{ transferId: string; status: string }>;

  // Refund
  createRefund(input: {
    paymentId: string;
    amountPaise: number;
    idempotencyKey: string;
    reason: string;
  }): Promise<{ refundId: string; status: string }>;

  // Webhook verification
  verifyWebhookSignature(input: {
    rawBody: string;
    signature: string;
  }): boolean;
}
```

---

## 6. Idempotency

### Key Format

```
{operation}:{contractId}:{milestoneId}:{attempt_uuid}
```

Examples:
- `dep:c1234:_:a1b2c3`
- `rel:c1234:m5678:d4e5f6`
- `ref:c1234:m5678:g7h8i9`

### Enforcement

1. Before calling the gateway, check `PaymentEvent` for an existing record with the same `idempotencyKey`.
2. If found and `status = CONFIRMED`, return the existing receipt (no gateway call).
3. If found and `status = INITIATED`, check gateway status and update.
4. If not found, proceed with gateway call and insert `INITIATED` record.
5. Gateway-level idempotency keys are also sent (Cashfree and Razorpay both support `x-idempotency-key` headers).

---

## 7. Webhook Verification

### Cashfree
```typescript
import crypto from 'crypto';

function verifyCashfreeWebhook(rawBody: string, timestamp: string, signature: string): boolean {
  const payload = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET!)
    .update(payload)
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Razorpay
```typescript
import crypto from 'crypto';

function verifyRazorpayWebhook(rawBody: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

---

## 8. GF Accounting Unit

| Aspect | Current (Simulated) | Target (Real) |
|---|---|---|
| Storage type | `Float` | `Int` (paise) |
| Internal unit | Rupees (e.g., `4000.0`) | Paise (e.g., `400000`) |
| Display conversion | None needed | `(amountPaise / 100).toFixed(2)` |
| Currency field | None | `currency: String @default("INR")` |
| Precision risk | High (floating-point) | Zero (integer arithmetic) |

### Migration

All existing `Float` money fields must be migrated to `Int` paise:
- `User.balance` → `User.balancePaise` (Int)
- `Contract.totalAmount` → `Contract.totalAmountPaise` (Int)
- `Contract.escrowBalance` → `Contract.escrowBalancePaise` (Int)
- `Milestone.amount` → `Milestone.amountPaise` (Int)
- `EscrowTransaction.amount` → `EscrowTransaction.amountPaise` (Int)
- `Project.budget` → `Project.budgetPaise` (Int)
- `Proposal.bidAmount` → `Proposal.bidAmountPaise` (Int)
- `Order.amount` → `Order.amountPaise` (Int)

---

## 9. Secrets Management

| Secret | Env Variable | Scope |
|---|---|---|
| Gateway API Key | `PAYMENT_GATEWAY_KEY_ID` | Server-only |
| Gateway API Secret | `PAYMENT_GATEWAY_KEY_SECRET` | Server-only |
| Webhook Secret | `PAYMENT_WEBHOOK_SECRET` | Server-only |
| Vendor Onboarding Key | `PAYMENT_VENDOR_API_KEY` | Server-only |

### Rules

1. All payment secrets use `PAYMENT_` prefix (not provider-specific) for gateway abstraction.
2. **Never** expose in `NEXT_PUBLIC_*` variables.
3. Store in `.env.local` (dev) or secure vault (production).
4. `.env.local` is in `.gitignore`. Verified by `scripts/security-check`.
5. Key rotation: webhook secrets rotated quarterly. API keys rotated on compromise.

---

## 10. Failure Handling

| Failure | Detection | Recovery |
|---|---|---|
| Payment timeout (client abandons checkout) | No `payment.captured` webhook within 30 min | Mark PaymentEvent as FAILED. Contract stays AWAITING_DEPOSIT. |
| Gateway API error (500) | HTTP status code | Retry with exponential backoff (max 3 attempts). Log failure. |
| Webhook delivery failure | Gateway retry (built-in, up to 24h) | Idempotent processing ensures safe replay. |
| Transfer failure | `transfer.failed` webhook | Alert admin. Retry transfer. Hold milestone in APPROVED (not RELEASED). |
| Refund failure | `refund.failed` webhook | Alert admin. Manual intervention required. Log in PaymentEvent. |
| Double webhook | Duplicate `gatewayEventId` | `WebhookLog.gatewayEventId` is `@unique`. Second insert rejected silently. |
| Amount mismatch | Webhook amount ≠ expected amount | Reject processing. Create DISCREPANCY reconciliation entry. Alert admin. |

---

## 11. Reconciliation

Daily automated job:

1. Query all `PaymentEvent` records for the day where `status = CONFIRMED`.
2. Sum by type: deposits collected, transfers completed, refunds processed.
3. Compare against gateway settlement report (fetched via API).
4. If totals match → `MATCHED`.
5. If mismatch → `DISCREPANCY` with details logged.
6. Admin dashboard shows reconciliation status.

---

## 12. Audit Trail Integration

Every payment operation creates entries in:

1. **PaymentEvent** — gateway-level event log (append-only)
2. **WebhookLog** — raw webhook payload storage (append-only)
3. **EscrowTransaction** — existing ledger (created only on CONFIRMED events)
4. **AuditLog** — existing tamper-evident chain (links to PaymentEvent)

The `AuditLog.verificationHash` chain remains intact. Payment events extend it; they do not replace it.

---

## 13. Migration Strategy

### Phase 0: Design Review (Current)
- This document + ADR approval
- Team signs off on provider choice

### Phase 1: Schema Migration
- Add `PaymentEvent`, `WebhookLog`, `PaymentReconciliation` models
- Migrate all Float money fields to Int paise
- Add `gatewayLinkedAccountId` to User model
- Preserve backward compatibility with a `formatCurrency()` utility

### Phase 2: Gateway Abstraction Layer
- Implement `PaymentGateway` interface
- Implement chosen provider adapter
- Implement `SimulatedGateway` for dev/test (preserves current behavior)
- Feature flag: `PAYMENT_MODE=simulated|live`

### Phase 3: API Routes
- Add `/api/payments/create-order`
- Add `/api/payments/verify`
- Add `/api/payments/webhook`
- Adapt existing milestone action route to call PaymentService

### Phase 4: UI Integration
- Add gateway checkout redirect from Deposit button
- Add payment status polling/SSE
- Show real transaction IDs in receipt

### Phase 5: Testing & Go-Live
- End-to-end tests with sandbox/test mode
- Reconciliation dry run
- Production switchover with `PAYMENT_MODE=live`
