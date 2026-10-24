# Personal Engineering Record Book: Stage S1 (Gate 1 Baseline)
## Engine 04: Web Technologies Engine (Role-Based Workflow Dashboard)

**Student Lead**: Vaibhav Chavanpatil (Roll No: 04, SRN: `02FE24BCS013`)
**Department**: Department of Computer Science & Engineering
**Institution**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi)
**Team**: Team 07 (Theme 01)
**Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
**Evaluation Stage**: Gate 1 Requirements Baseline & Individual Course Synthesis

---

# Part I: Academic Framework & Evaluation Rubric

## 1. Academic Identity & Course Synthesis
Under the KLE Technological University Computer Science curriculum, this project models an advanced multi-tier software system synthesizing five foundational course areas.
- **Assigned Course Area**: Web Technologies, Computer Networks, and Human-Computer Interaction (HCI).
- **Assigned System Module**: **Engine 04 (Web Technologies Engine — Role-Based Workflow Dashboard)**.
- **Student Ownership**: Vaibhav Chavanpatil is the sole individual engineer responsible for the presentation tier, server-side RBAC boundary security, 5-second polling state synchronization, and client-facing workflow integration.

### KLE Tech Gate 1 Evaluation Rubric Alignment (10 Marks Total)
1. **Rubric 1: Problem Definition & Need Analysis (2 Marks)**: Addressed in Chapters 1 & 2 through symmetrical freelance trust analysis, stakeholder pain points, and strict scope boundaries.
2. **Rubric 2: Requirements Engineering Baseline (3 Marks)**: Addressed in Chapters 3 & 4 with formal mathematical/behavioral specifications for FR-07, FR-08, FR-09, FR-10 and quantified NFR KPIs.
3. **Rubric 3: System Modeling & User Stories (2 Marks)**: Addressed in Chapters 5 & 6 with complete actor catalogs, Use Cases UC-01 to UC-05, and Agile User Stories US-01 to US-08 with Gherkin acceptance criteria.
4. **Rubric 4: Technical Depth & Engine Boundaries (2 Marks)**: Addressed in Chapters 7, 8, & 9 via Next.js 16 App Router architecture, HMAC-SHA256 session crypto, and strict 4-engine separation.
5. **Rubric 5: Verification Discipline & Oral Defense (1 Mark)**: Addressed in Chapters 12, 13, 14, & 15 via 28 automated tests (100% pass), RTM slice, and viva defense answers.

---

# Part II: Problem Formulation & Stakeholder Need (Stage S0)

## 2. The Freelance Trust Dilemma
Freelance software contracting platforms suffer from two symmetrical trust failure modes:
1. **Client Default**: Freelancers commit labor, time, and intellectual property without any verifiable guarantee of payment or objective review.
2. **Deliverable Non-Performance**: Clients deposit funds upfront with no cryptographic assurance that the code adheres to requirements or is authentic.

Traditional platforms resolve disputes subjectively through opaque customer support tickets. This platform replaces subjective review with **Milestone-Based Escrow** and **Evidence-Based Dispute Resolution**.

### S0 Problem Statements Addressed by Engine 04:
- **Problem 1 (Lack of Role Segregation)**: Without strict role enforcement, clients can execute contractor actions, and parties can illegally tamper with dispute cases. Engine 04 solves this via `RbacEnforcer`.
- **Problem 2 (Stale Client States)**: Traditional SPAs suffer from stale data during long-running milestone transitions. Engine 04 solves this via a resilient 5-second polling synchronization engine (`StatePoller`).
- **Problem 3 (Unsecured Endpoints)**: Hiding UI buttons client-side leaves APIs vulnerable to curl/Postman spoofing. Engine 04 enforces 100% server-side RBAC.

### Explicit Scope Boundaries
- **In-Scope**: User RBAC, project posting, bidding, milestone tracking, deliverable SHA-256 evidence submissions, simulated escrow lock/release/refund, human dispute arbitration.
- **Out-of-Scope**: Real banking payment gateways (purely simulated currency), legal court contracts, native mobile apps, autonomous AI arbitration without human review.

---

# Part III: Requirements Engineering Baseline (Stage S1)

## 3. Functional Requirements Owned by Engine 04

### FR-07: Role-Based Workflow Dashboards
- **Formal Specification**: The system shall render customized, responsive dashboards and workflows for **Clients, Freelancers, Dispute Reviewers, and Administrators** when authenticated users navigate to protected views, producing role-tailored tooling, action buttons, and metric summaries.
- **Input**: Authenticated user session cookie / Bearer token.
- **Output**: Tailored React 19 UI component tree.
- **Error Mode**: Role mismatch $\implies$ HTTP 403 Forbidden redirected to unauthorized role notice.

### FR-08: Authentication & Server-Side RBAC Enforcement
- **Formal Specification**: The system shall validate credentials and enforce server-side Role-Based Access Control on 100% of API endpoints and server actions for **All HTTP Requests**, producing authorized data access or returning HTTP 401/403 error envelopes for unauthorized attempts.
- **Input**: HTTP Authorization header / session cookie.
- **Output**: Authorized controller execution or HTTP 401/403.
- **Error Modes**: Expired token $\implies$ 401 `INVALID_SESSION`; Insufficient permission $\implies$ 403 `INSUFFICIENT_PERMISSIONS`.

### FR-10: Real-Time Milestone State Poller
- **Formal Specification**: The system shall synchronize and visualize milestone FSM states without full-page reloads using a lightweight 5-second polling loop.
- **Input**: Active contract ID on `/contracts` or `/dashboard`.
- **Output**: 5-second polled JSON state snapshot (`useMilestonePoller`).
- **Error Mode**: Network failure $\implies$ Exponential backoff and retry without freezing UI.

---

# Part IV: System Architecture & Technical Diagrams

## 4. Multi-Tier Layered Web Architecture (Engine 04)

```text
+-----------------------------------------------------------------------------------+
|               PRESENTATION TIER (Next.js 16 App Router / React 19)                |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |  Client Dashboard  |  | Freelancer Workspace |  | Dispute Reviewer Console  |  |
|  |  (/dashboard)      |  | (/gigs, /projects)   |  | (/disputes)               |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |  Admin Inspector   |  | Contract Milestone   |  | 5s Poller Hook            |  |
|  |  (/audit)          |  | (/contracts)         |  | (useMilestonePoller)      |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTP Requests / JSON Payloads
                                           v
+-----------------------------------------------------------------------------------+
|               SECURITY TIER (Engine 04 Core Web & Security Guard)                 |
|  +-----------------------------------------------------------------------------+  |
|  | 1. SessionService: HMAC-SHA256 Bearer Token Verification (HTTP 401 Guard)   |  |
|  +-----------------------------------------------------------------------------+  |
|  | 2. RbacEnforcer: Role Claim & Permission Set Evaluation   (HTTP 403 Guard)  |  |
|  +-----------------------------------------------------------------------------+  |
|  | 3. Zod 4 Validator: Request Payload Allowlist Sanity Check (HTTP 400 Guard)  |  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | Sanitized & Authorized Method Invocations
                                           v
+-----------------------------------------------------------------------------------+
|                 APPLICATION ROUTE HANDLERS (/api/contracts, /api/disputes)        |
+--------------------+---------------------+--------------------+-------------------+
                     |                     |                    |
                     v                     v                    v
            +-----------------+   +------------------+   +------------------+
            | Engine 01 (OS)  |   | Engine 02 (DSA)  |   | Engine 03 (DBMS) |
            | Escrow FSM &    |   | SHA-256 Checksum |   | BCNF Tables,     |
            | Keyed Mutex     |   | & EvidenceTree   |   | ACID Ledger &    |
            | (Vaishnavi)     |   | (Darshan)        |   | Audit Log (Purvi)|
            +-----------------+   +------------------+   +------------------+
```

## 5. RBAC Authorization Decision Pipeline

```text
                        [ Incoming HTTP Request ]
                                    |
                                    v
                     { Valid Bearer / Cookie Token? }
                               /         \
                            [NO]         [YES]
                             /             \
                            v               v
               ( 401 Unauthorized )   [ Decode Token Payload ]
                                      [ (userId, role, exp)  ]
                                            |
                                            v
                                  { Token Expired? }
                                     /          \
                                  [YES]         [NO]
                                   /              \
                                  v                v
                       ( 401 Unauthorized )  { Role Permitted for Action? }
                                                     /              \
                                                  [NO]             [YES]
                                                   /                 \
                                                  v                   v
                                       ( 403 Forbidden )      [ Dispatch to Domain ]
                                       "INSUFFICIENT_ROLES"   [ Engine Services    ]
```

## 6. Real-Time 5-Second Poller Sequence (FR-10)

```text
React 19 Client UI                StatePoller (Engine 04)             SQLite Database
      |                                      |                               |
      |--- 1. Mount /contracts page -------->|                               |
      |--- 2. Trigger 5s Poller Loop ------->|                               |
      |                                      |--- 3. Query indexed snapshot->|
      |                                      |<-- 4. Fast status return -----|
      |<-- 5. Return ContractPollSnapshot ---|                               |
      |       (status, balance, milestones)  |                               |
      |                                      |                               |
      | [Client Virtual DOM Diff]            |                               |
      | If changed: Update badge & buttons   |                               |
      | If unchanged: Suppress re-render     |                               |
      |                                      |                               |
      |--- 6. Repeat every 5,000ms --------->|                               |
```

---

# Part V: Implementation & Code Artifacts

### 7.1 Server-Side Role-Based Access Control (`src/core/engine-04-web/rbac.ts`)
```typescript
export class RbacEnforcer {
  private static readonly ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<string>> = {
    CLIENT: new Set([
      'project:create', 'project:view', 'proposal:view', 'proposal:accept',
      'contract:deposit', 'contract:view', 'deliverable:review',
      'deliverable:approve', 'dispute:raise', 'dispute:view',
    ]),
    FREELANCER: new Set([
      'project:view', 'project:browse', 'proposal:create', 'proposal:view_self',
      'contract:view', 'deliverable:submit', 'dispute:raise', 'dispute:view', 'gig:manage',
    ]),
    REVIEWER: new Set([
      'dispute:view_all', 'dispute:inspect_evidence', 'dispute:rule', 'audit:view', 'contract:view',
    ]),
    ADMIN: new Set([
      'project:create', 'project:view', 'proposal:view', 'contract:deposit',
      'contract:override', 'dispute:rule', 'audit:view', 'system:manage',
    ]),
  };

  static enforceAction(session: SessionContext, action: ContractAction): void {
    if (!session || !session.userId) throw new AuthenticationError('Authentication required');
    const requiredPermission = ACTION_PERMISSION_MAP[action];
    if (!this.hasPermission(session.role, requiredPermission)) {
      throw new AuthorizationError(`Role ${session.role} cannot perform action ${action}`);
    }
  }
}
```

### 7.2 Cryptographic HMAC Session Tokens (`src/core/engine-04-web/session.ts`)
```typescript
export class SessionService {
  static createToken(user: { id: string; email: string; role: UserRole; name: string }): string {
    const payload: TokenPayload = {
      userId: user.id, email: user.email, role: user.role, name: user.name,
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    return `${encoded}.${signature}`;
  }

  static verifyToken(token: string): SessionContext | null {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    if (signature !== expected) return null; // Cryptographic Tamper Detected
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (Date.now() / 1000 > payload.exp) return null; // Expired
    return { userId: payload.userId, role: payload.role, email: payload.email, name: payload.name };
  }
}
```

### 7.3 Lightweight 5-Second State Poller (`src/core/engine-04-web/poller.ts`)
```typescript
export class StatePoller {
  static async pollContractState(contractId: string): Promise<ContractPollSnapshot> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true, status: true, escrowBalance: true, totalAmount: true, updatedAt: true,
        milestones: {
          select: {
            id: true, sequenceOrder: true, title: true, amount: true,
            status: true, reviewDeadline: true, deliverable: { select: { id: true } },
            disputes: { select: { id: true } },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });
    return {
      contractId: contract.id, status: contract.status, escrowBalance: contract.escrowBalance,
      totalAmount: contract.totalAmount, updatedAt: contract.updatedAt.toISOString(),
      milestones: contract.milestones.map(m => ({
        id: m.id, sequenceOrder: m.sequenceOrder, title: m.title, amount: m.amount,
        status: m.status, reviewDeadline: m.reviewDeadline?.toISOString() || null,
        hasDeliverable: !!m.deliverable, hasDispute: m.disputes.length > 0,
      })),
    };
  }
}
```

---

# Part VI: Test Verification & Viva Defense

## 8. Automated Test Evidence (Vitest Engine 04 Suite)

| Test File | Tests Run | Result | What Is Empirically Asserted |
| :--- | :---: | :---: | :--- |
| `tests/engine-04-web/rbac.test.ts` | 6 | **PASS** | Evaluates role permissions, ensures correct allowed actions, blocks invalid roles. |
| `tests/engine-04-web/api-rbac-adversarial.test.ts` | 7 | **PASS** | Role-spoofing tests assert that unauthorized API calls yield strict `HTTP 401/403`. |
| `tests/engine-04-web/ui-interactions.test.tsx` | 7 | **PASS** | Modals, persona selection dropdown, and button click state transitions. |
| `tests/engine-04-web/marketplace-gigs.test.ts` | 5 | **PASS** | Marketplace search filters, gig publication RBAC, and proposal placement. |
| `tests/engine-04-web/theme-toggle.test.tsx` | 3 | **PASS** | Verifies dark/light DOM classes, colorScheme, and localStorage persistence. |
| **Total Engine 04 Automated Tests** | **28** | **100% PASS** | Zero regressions across all Web Technology suites. |

---

## 9. Top 5 Evaluator Viva-Voce Defense Inquiries

**Q1: Why did you choose Next.js 16 App Router over standard React or Vite SPA?**
*Answer*: The App Router provides React Server Components (RSC). RSCs fetch data on the server without shipping unnecessary JavaScript to the client. Most importantly, secret keys (like the HMAC session secret) remain server-only, guaranteeing zero secret exposure to client browsers.

**Q2: What is the difference between client-side authorization and server-side RBAC in your engine?**
*Answer*: Client-side authorization is purely a UX enhancement (hiding or disabling buttons). Server-side RBAC in `RbacEnforcer` is the actual security barrier. Every single incoming API route verifies the HMAC token and permissions, returning `HTTP 403 Forbidden` if unauthorized.

**Q3: Why use a 5-second polling loop instead of WebSockets for milestone updates?**
*Answer*: WebSockets maintain long-lived stateful TCP connections that frequently drop on mobile networks and risk memory leaks in long-running tabs. Our `StatePoller` queries a lean, indexed projection (<1KB payload) in under 15ms, satisfying our real-time requirements (FR-10) with zero memory leak risk.

**Q4: How do you handle authentication securely without third-party auth services?**
*Answer*: We implemented `SessionService` using Node.js built-in `crypto.createHmac('sha256', SESSION_SECRET)`. The token consists of `base64url(payload).base64url(signature)`. If an attacker alters the `userId` or `role` in the payload, the HMAC signature verification fails immediately, returning HTTP 401.

**Q5: What is an Insecure Direct Object Reference (IDOR), and how does Engine 04 prevent it?**
*Answer*: IDOR occurs when an authenticated user modifies another user's contract by simply guessing or changing the contract ID in the URL. `RbacEnforcer.enforceContractAccess` explicitly verifies that the caller's `userId` matches either the `clientId` or `freelancerId` on that specific contract, rejecting third parties with HTTP 403.

---

### Student Sign-Off
I confirm that this record book reflects my individual engineering contributions for **Engine 04 (Web Technologies)** for Stage S1 Gate 1 submission.

**Student Name**: Vaibhav Chavanpatil
**Roll No**: 04 (SRN: `02FE24BCS013`)
**Date**: October 23, 2026
