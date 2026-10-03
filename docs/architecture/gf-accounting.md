# GigaFlow Accounting & Currency Model (`docs/architecture/gf-accounting.md`)

## 1. Executive Summary & Core Principle
GigaFlow employs a strict 1:1 backed accounting model to ensure compliance with financial regulations and provide absolute transparency in escrow operations. The platform uses a localized internal unit of account called **GF**, which is directly pegged to the Indian Rupee (INR).

$$\mathbf{1\text{ GF} = \text{₹}1.00\text{ INR} = 100\text{ paise}}$$

GF is strictly an **internal accounting and display denomination**. It is **NOT** a cryptocurrency, **NOT** an unregulated stored-value facility, and **NOT** a Prepaid Payment Instrument (PPI).

---

## 2. Indivisible Integer-Paise Precision
To eliminate IEEE 754 floating-point inaccuracies (e.g. `0.1 + 0.2 !== 0.3`), all internal ledger operations, database persistence, gateway calculations, and dispute splits utilize **indivisible 64-bit integer paise**:

- ₹1.00 INR = 1 GF = `100` paise
- ₹1,000.50 INR = 1,000.50 GF = `100050` paise
- All database monetary fields use `Int` or `BigInt` with the `_paise` suffix (e.g. `amount_paise`, `balance_paise`, `escrow_balance_paise`).
- Conversion helper functions guarantee deterministic conversion with zero floating residue:
  $$\text{paise} = \text{Math.round}(\text{inr} \times 100)$$
  $$\text{gf} = (\text{paise} / 100).\text{toFixed}(2)$$

---

## 3. Regulatory Compliance: Non-Issuance of Unbacked Currency
Under Section 18 of the Payment and Settlement Systems Act, 2007 (PSS Act 2007) and Reserve Bank of India (RBI) Guidelines for Payment Aggregators (PA) and Payment Gateways (PG):
1. **No Unbacked Minting**: GigaFlow never mints, creates, or issues GF tokens independently.
2. **Zero Fiat Custody**: GigaFlow does not hold customer fiat balances in proprietary corporate current accounts. Customer money is directed through an authorized Payment Aggregator (Cashfree) nodal/escrow pool account.
3. **No Closed-Loop Stored Value Wallet**: Users cannot "top up" a standalone GigaFlow balance without an underlying contractual escrow milestone. Deposits are atomic commitments dedicated to a specific contract milestone.

---

## 4. Proof-of-Reserve / Escrow Backing Model
The platform enforces mathematical verification of all escrow commitments:

$$\sum \text{Active Escrow Balances (GF)} \equiv \sum \text{Cashfree Verified PG Collections} - \sum \text{Settled Payouts} - \sum \text{Processed Refunds}$$

1. **Deposit Verification**: A milestone transitions from `AWAITING_DEPOSIT` to `FUNDED` **only** upon cryptographic receipt and verification of an HMAC-SHA256 signed webhook (`PAYMENT_SUCCESS_WEBHOOK`) or authoritative API status from Cashfree Payment Gateway.
2. **Conditional Lock**: Funds remain locked in the Cashfree collection account, represented by `Contract.escrowBalancePaise`, throughout the delivery, QA, and review lifecycle.
3. **Settlement Release**: Upon client approval or watchdog review timeout expiry, Engine 01 (OS Engine) and Engine 03 (DBMS Engine) trigger an outbound Cashfree Transfer to the freelancer's registered bank account / UPI VPA.
4. **Dispute Reversal**: In the event of a dispute ruling awarding funds to the client, Cashfree PG Refund API is executed to return the funds to the original payment source.

---

## 5. Tamper-Evident Ledger & Audit Chaining
Every monetary state change produces an immutable record in `EscrowTransaction` and an append-only entry in `AuditLog` secured via SHA-256 Merkle-Damgård hash chaining:

$$\text{Hash}_n = \text{SHA256}(\text{Hash}_{n-1} + \text{Timestamp} + \text{EventType} + \text{AmountPaise} + \text{ProviderRef})$$

Any unauthorized modification of balance records or transaction logs is mathematically detectable by `auditLogger.verifyAuditChain()`.
