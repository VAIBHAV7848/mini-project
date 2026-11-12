# Personal Engineering Record Book: Stage S1 (Gate 1 Baseline)
## Engine 03: DBMS Engine (Transaction Ledger & Contract Manager)

**Student Lead**: Purvi Sammatshetti (Roll No: 11, SRN: `02FE24BCS022`)
**GitHub**: [`purvisammatshetti`](https://github.com/purvisammatshetti) (`sammatshettipurvi@gmail.com`)
**Department**: Department of Computer Science & Engineering
**Institution**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi)
**Team**: Team 07 (Theme 01)
**Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
**Evaluation Stage**: Gate 1 Requirements Baseline & Individual Course Synthesis

---

# Part I: Academic Framework & Evaluation Rubric

## 1. Academic Identity & Course Synthesis
Under the KLE Technological University Computer Science curriculum, this project models an advanced multi-tier software system synthesizing foundational course areas.
- **Assigned Course Area**: Database Management Systems (DBMS), Relational Database Normalization (BCNF), Transaction Processing, Concurrency Control, and ACID Guarantees.
- **Assigned System Module**: **Engine 03 (DBMS Engine — Transaction Ledger & Contract Manager)**.
- **Student Ownership**: Purvi Sammatshetti is the sole individual engineer responsible for relational schema design, BCNF normalization, transactional atomicity, double-entry ledger mechanics, append-only tamper-evident audit logging, and payment settlement contracts.

### KLE Tech Gate 1 Evaluation Rubric Alignment (10 Marks Total)
1. **Rubric 1: Problem Definition & Need Analysis (2 Marks)**: Addressed in Chapters 1 & 2 through analysis of financial anomalies, dirty reads, non-repeatable reads, lost updates, and ledger tampering.
2. **Rubric 2: Requirements Engineering Baseline (3 Marks)**: Addressed in Chapters 3 & 4 with formal relational schemas, functional dependencies $X \to Y$, BCNF decomposition proofs, and strict ACID isolation invariants.
3. **Rubric 3: System Modeling & User Stories (2 Marks)**: Addressed in Chapters 5 & 6 with Entity-Relationship (ER) models, Relational schemas, foreign key cascade constraints, and Gherkin acceptance criteria.
4. **Rubric 4: Technical Depth & Engine Boundaries (2 Marks)**: Addressed in Chapters 7, 8, & 9 via Prisma 5.22 ORM schema, interactive Prisma transactions (`prisma.$transaction`), SHA-256 chained audit logs, and connection pool management.
5. **Rubric 5: Verification Discipline & Oral Defense (1 Mark)**: Addressed in Chapters 12, 13, & 14 via automated ledger unit tests (`tests/engine-03-dbms/`), cryptographic hash chain verification, and DBMS viva defense answers.

---

# Part II: Relational Data Modeling & DBMS Foundations (Stage S0)

## 2. Relational Anomalies and Transaction Integrity
In high-stakes financial escrow workflows, data inconsistencies result in catastrophic financial loss:
1. **Lost Update / Double Spend**: Concurrent milestone funding requests reading balance $B$ before debits write $B - M$, causing over-disbursements.
2. **Ledger Repudiation**: Without cryptographic hash-chaining, malicious administrators could directly modify database rows to alter transaction history without detection.
3. **Schema Redundancy & Anomalies**: Unnormalized tables produce insertion, deletion, and update anomalies when milestone amounts or user balances change.

### DBMS Principles Synthesized
- **Boyce-Codd Normal Form (BCNF)**: Ensuring that for every non-trivial functional dependency $X \to Y$, $X$ is a superkey across all tables (`User`, `Project`, `Contract`, `Milestone`, `PaymentEvent`, `AuditLog`).
- **ACID Transaction Boundaries**: Wrapping fund lock, balance debit, milestone transition, and audit log generation in a single atomic transaction:
  $$\text{Atomicity}: \forall \text{ operations } O_i \in T, (\forall i, O_i \text{ commits}) \lor (\text{Rollback entirely})$$
- **Append-Only Tamper-Resistant Audit Logging**: Cryptographically chaining each audit record $R_n$ to record $R_{n-1}$ via hash $H_n = \text{SHA-256}(H_{n-1} \mathbin{\Vert} \text{Payload}_n)$, preventing undetectable record alteration or deletion.

---

# Part III: Requirements Engineering Baseline (Stage S1)

## 3. Database Schema & Transaction Specifications Owned by Engine 03

### Relational Entity-Relationship Decomposition
- **User**: Superkey `id` ($\text{email} \to \text{id}, \text{role}, \text{balance}$)
- **Contract**: Superkey `id` ($\text{id} \to \text{projectId}, \text{clientId}, \text{freelancerId}, \text{totalAmount}, \text{status}$)
- **Milestone**: Superkey `id` ($\text{id} \to \text{contractId}, \text{title}, \text{amount}, \text{status}, \text{orderIndex}$)
- **PaymentEvent**: Superkey `id` ($\text{id} \to \text{transactionId}, \text{orderId}, \text{amount}, \text{paymentRail}, \text{status}$)
- **AuditLog**: Superkey `id` ($\text{id} \to \text{entityType}, \text{entityId}, \text{action}, \text{previousHash}, \text{currentHash}, \text{timestamp}$)

### ACID Fund Transfer Guarantee
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Verify and decrement client balance
  await tx.user.update({ where: { id: clientId }, data: { balance: { decrement: amount } } });
  // 2. Lock milestone funds
  await tx.milestone.update({ where: { id: milestoneId }, data: { status: 'FUNDED', fundedAt: new Date() } });
  // 3. Record immutable ledger event
  await tx.auditLog.create({ data: { entityType: 'MILESTONE', entityId: milestoneId, action: 'ESCROW_FUNDED', ... } });
});
```

---

# Part IV: Architecture & Code Verification

## 4. Module Architecture & Test Evidence
- **Database Schema**: `prisma/schema.prisma`
- **Transaction Ledger**: `src/core/engine-03-dbms/ledger.ts`
- **Tamper-Resistant Audit Logger**: `src/core/engine-03-dbms/audit-logger.ts`
- **Contract Manager**: `src/core/engine-03-dbms/contract-manager.ts`
- **Settlement & Payment Rails**: `src/core/engine-03-dbms/payments/`
- **Verification Suite**: `tests/engine-03-dbms/`
  - BCNF normalization verified
  - Cryptographic audit chain integrity verification

---

# Part V: Individual Contribution Declaration
I, Purvi Sammatshetti, declare that I am the sole author and engineer responsible for Engine 03 (DBMS Engine: Transaction Ledger & Contract Manager), including the relational schema models, BCNF decomposition proofs, ACID transaction logic, and tamper-resistant audit logs.
