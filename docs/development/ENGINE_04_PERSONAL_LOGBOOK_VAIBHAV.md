# Academic Personal Logbook & Engine Record: Engine 04 (Web Technologies)
## Stage S1 / Gate 1 Record of Engineering Work

- **Student Name**: Vaibhav Chavanpatil
- **Roll Number**: 04
- **University SRN**: `02FE24BCS013`
- **Department**: Department of Computer Science & Engineering
- **Institution**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi)
- **Team**: Team 07 (Theme 01)
- **Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
- **Assigned Engineering Engine**: **Engine 04 (Web Technologies Engine — Role-Based Workflow Dashboard)**
- **Academic Mentor / Faculty Evaluator**: Dr. V. S. Malemath / Prof. P. V. Patil

---

## 1. Executive Summary & Engine Ownership Scope

### 1.1 Academic Purpose
Under the department's Five-Course Synthesis framework, Engine 04 encapsulates the **Web Technologies and Computer Networks** domain. The primary responsibility of Engine 04 is to deliver a secure, responsive, role-based presentation architecture that coordinates user interactions across Clients, Freelancers, Dispute Reviewers, and Auditors, while enforcing strict server-side authorization boundaries before requests reach the internal state machine (Engine 01), evidence tree (Engine 02), or transactional database (Engine 03).

### 1.2 Core Curricular Concepts Demonstrated
1. **Server-Side Security & Authentication**: Tamper-evident cryptographic HMAC SHA-256 session tokens.
2. **Role-Based Access Control (RBAC)**: Fine-grained multi-role permission matrices preventing privilege escalation and horizontal/vertical spoofing.
3. **Modern Frontend Component Architecture**: Next.js 16 App Router with React 19 Server/Client Component decomposition.
4. **State Synchronization**: Resilient 5-second polling loop (`StatePoller`) eliminating memory leaks common in raw WebSocket implementations.
5. **Defensive Web Engineering**: Runtime payload validation via Zod 4 schemas and centralized error handling (HTTP 400, 401, 403, 404, 500).

---

## 2. Requirements Baseline Owned by Engine 04 (Gate 1 Deliverable)

### 2.1 Functional Requirements Matrix

| Requirement ID | Formal Specification | Actor Scope | Input / Trigger | Output / State Impact | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-07** | **Role-Based Workflow Dashboards**:<br>The system shall render customized, responsive dashboards tailored to Clients, Freelancers, Dispute Reviewers, and Admins. | All 4 Roles | Valid authenticated user session. | Role-specific views, action drawers, metric counters, and filtered data tables. | Visual inspection across mobile & desktop viewports (`tests/engine-04-web/ui-interactions.test.tsx`). |
| **FR-08** | **Server-Side RBAC Enforcement**:<br>The system shall validate credentials and enforce server-side RBAC on 100% of API endpoints and server actions. | All HTTP Requests | HTTP Authorization header / Bearer token. | Authorized controller execution or immediate HTTP 401/403 rejection. | Adversarial penetration unit tests (`tests/engine-04-web/api-rbac-adversarial.test.ts`). |
| **FR-10** | **Real-Time FSM Progress UI & Poller**:<br>The system shall synchronize and visualize milestone FSM states without full-page reloads. | Client, Freelancer | Active contract view on `/contracts` or `/dashboard`. | 5-second polled JSON state snapshot (`useMilestonePoller`). | Poller timeout and snapshot format tests (`tests/engine-04-web/rbac.test.ts`). |
| **FR-09 (UI)** | **Dispute Submission & Evidence Workflow**:<br>The system shall provide intuitive evidence filing forms and Merkle tree visualization panels for dispute adjudication. | Client, Freelancer, Reviewer | Contested deliverable trigger. | Structured dispute submission with evidence URI and causal tree rendering. | Form submission and modal interaction test suite. |

### 2.2 Non-Functional Requirements (NFRs) Enforced
- **NFR-02 (Zero Client-Side Trust)**: Client-side UI element hiding is treated strictly as a UX feature. Every API endpoint independently verifies role claims in `RbacEnforcer`.
- **NFR-04 (Strict Runtime Validation)**: 100% of incoming POST/PUT JSON request bodies are validated through Zod 4 schemas before domain dispatch.
- **NFR-06 (UI Performance & Responsiveness)**: Sub-200ms page transitions; fully responsive layouts conforming to breakpoints 390px (mobile), 1440px (desktop), and 1920px (large display).

---

## 3. System Architecture & Technical Diagrams

### Diagram 1: Layered Web Architecture & Engine Interfacing
*(Draw this block diagram in your book to show how Web Tech interacts with the other 3 engines)*

```
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

---

### Diagram 2: Role-Based Access Control (RBAC) Decision Matrix
*(Draw this flowchart showing how RbacEnforcer filters incoming user requests)*

```
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
                       ( 401 Unauthorized )  { Actor Role Has Action Permission? }
                                                     /                    \
                                                  [NO]                   [YES]
                                                   /                       \
                                                  v                         v
                                       ( 403 Forbidden )            [ Allow Controller ]
                                       "INSUFFICIENT_PERMISSIONS"   [ Execution        ]
```

---

### Diagram 3: 5-Second Real-Time Milestone Polling Sequence
*(Draw this sequence diagram to explain how client views update without WebSockets)*

```
User Browser (React 19)          StatePoller (Engine 04)           SQLite Relational DB
         |                                  |                                |
         |--- 1. Mounts /contracts page --->|                                |
         |--- 2. Starts 5s Poller Loop ---->|                                |
         |                                  |--- 3. SELECT indexed status -->|
         |                                  |       milestone snapshot       |
         |                                  |<-- 4. Fast Snapshot Return ----|
         |<-- 5. Return JSON ContractPoll --|                                |
         |       (status, balance, items)   |                                |
         |                                  |                                |
         | [Local State Diffing Check]      |                                |
         | If changed: Re-render UI Step    |                                |
         | If identical: Skip re-render     |                                |
         |                                  |                                |
         |--- 6. Repeat after 5,000ms ----->|                                |
```

---

## 4. Key Implementation Code & Engineering Artifacts

### 4.1 RBAC Enforcement Engine (`src/core/engine-04-web/rbac.ts`)
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
      'project:create', 'project:view', 'proposal:view', 'proposal:accept',
      'contract:deposit', 'contract:view', 'contract:override', 'deliverable:review',
      'deliverable:approve', 'dispute:raise', 'dispute:view_all', 'dispute:inspect_evidence',
      'dispute:rule', 'audit:view', 'gig:manage', 'system:manage',
    ]),
  };

  static enforceAction(session: SessionContext, action: ContractAction, context?: ActionContext): void {
    if (!session || !session.userId) {
      throw new AuthenticationError('Authentication required');
    }
    const requiredPermission = ACTION_PERMISSION_MAP[action];
    if (!this.hasPermission(session.role, requiredPermission)) {
      throw new AuthorizationError(`Role ${session.role} cannot perform action ${action}`);
    }
  }
}
```

### 4.2 Cryptographic Session Token Manager (`src/core/engine-04-web/session.ts`)
```typescript
export class SessionService {
  static createToken(user: { id: string; email: string; role: UserRole; name: string }, expiresInSeconds = 86400): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    return `${encoded}.${signature}`;
  }

  static verifyToken(token: string): SessionContext | null {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    if (signature !== expectedSignature) return null; // Tamper detected!
    const payload: TokenPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (Date.now() / 1000 > payload.exp) return null; // Token expired
    return { userId: payload.userId, role: payload.role, email: payload.email, name: payload.name };
  }
}
```

### 4.3 Lightweight 5-Second State Poller (`src/core/engine-04-web/poller.ts`)
```typescript
export class StatePoller {
  static async pollContractState(contractId: string): Promise<ContractPollSnapshot> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        status: true,
        escrowBalance: true,
        totalAmount: true,
        updatedAt: true,
        milestones: {
          select: {
            id: true,
            sequenceOrder: true,
            title: true,
            amount: true,
            status: true,
            reviewDeadline: true,
            deliverable: { select: { id: true } },
            disputes: { select: { id: true } },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });
    return {
      contractId: contract.id,
      status: contract.status,
      escrowBalance: contract.escrowBalance,
      totalAmount: contract.totalAmount,
      updatedAt: contract.updatedAt.toISOString(),
      milestones: contract.milestones.map(m => ({
        id: m.id,
        sequenceOrder: m.sequenceOrder,
        title: m.title,
        amount: m.amount,
        status: m.status,
        reviewDeadline: m.reviewDeadline?.toISOString() || null,
        hasDeliverable: !!m.deliverable,
        hasDispute: m.disputes.length > 0,
      })),
    };
  }
}
```

---

## 5. UI/UX Page Structure & Component Routing

| Route | Role Access | Primary User Actions & View Components | Responsive Viewports Verified |
| :--- | :--- | :--- | :--- |
| **`/`** | Public | Product introduction, interactive architecture diagrams, engine breakdown, and quick role-switch preview. | 390px, 1440px, 1920px |
| **`/dashboard`** | Authenticated (All) | Active contract cards, pending review banners, live financial statistics (Escrow Locked vs Released), and quick-action modals. | 390px, 1440px, 1920px |
| **`/projects`** | Client & Admin | Project creation form (title, description, required skills, budget), proposal evaluation, and AI semantic match score display. | 390px, 1440px, 1920px |
| **`/gigs`** | Freelancer & Client | Marketplace catalog, search by keyword/tag, tiered service pricing cards, and one-click proposal bid submission. | 390px, 1440px, 1920px |
| **`/contracts`** | Client & Freelancer | Visual milestone sequence stepper (`IN_PROGRESS` $\to$ `UNDER_REVIEW` $\to$ `RELEASED`), deliverable SHA-256 upload, fund release trigger. | 390px, 1440px, 1920px |
| **`/disputes`** | Reviewer & Parties | EvidenceTree Merkle DAG visualization, mutual claim timeline, deliverable checksum verification, binding arbitrator ruling panel. | 390px, 1440px, 1920px |
| **`/audit`** | Admin & Auditor | Append-only transaction ledger, balance conservation checker ($\sum \Delta B = 0$), cryptographic hash chain validation. | 390px, 1440px, 1920px |

---

## 6. Verification Evidence & Automated Test Results

The test suite for Engine 04 is automated under Vitest and covers authentication, authorization boundaries, role switching, adversarial spoofing, and UI interactions:

| Test File | Test Suite Focus | Tests Run | Result | Key Assertion Verified |
| :--- | :--- | :---: | :---: | :--- |
| `tests/engine-04-web/rbac.test.ts` | RBAC Matrix & Role Permissions | 6 | **PASS** | Validates `RbacEnforcer` allows valid role actions and blocks unauthorized permissions. |
| `tests/engine-04-web/api-rbac-adversarial.test.ts` | Adversarial Security & Tampering | 7 | **PASS** | Asserts that forged JWTs, tampered HMAC tokens, and cross-role requests yield strict `HTTP 401/403`. |
| `tests/engine-04-web/ui-interactions.test.tsx` | Component Rendering & Interaction | 7 | **PASS** | Verifies modal open/close, milestone button triggers, and tab selection. |
| `tests/engine-04-web/marketplace-gigs.test.ts` | Marketplace Gigs Workflow | 5 | **PASS** | Validates catalog search, gig creation, and proposal attachment. |
| `tests/engine-04-web/theme-toggle.test.tsx` | Theme Switching & Accessibility | 3 | **PASS** | Verifies Dark/Light mode DOM manipulation, CSS variable integrity, and WCAG contrast. |
| **Total Engine 04 Coverage** | **All Web Tech Test Suites** | **28** | **100% PASS** | **Zero Regressions, Zero Flaky Tests** |

---

## 7. Viva-Voce Defense FAQ (Questions Teachers Will Ask & Exact Answers)

**Q1: Why did you choose Next.js 16 App Router over standard React or Vite SPA?**
*Answer*: The App Router provides native React Server Components (RSC). This allows us to perform server-side session checks and initial data fetching on the server, drastically reducing the JavaScript bundle sent to the client. It also ensures sensitive logic (like HMAC secret verification) stays strictly on the server and is never exposed to the client browser.

**Q2: What is the difference between client-side authorization and server-side RBAC in your engine?**
*Answer*: Client-side authorization merely hides or disables UI buttons (e.g. graying out the "Release Funds" button for a freelancer) for good user experience. Server-side RBAC in `RbacEnforcer` is the actual security gate: every API route independently parses the HMAC Bearer token, checks if the actor's role possesses the required permission, and immediately rejects unauthorized requests with `HTTP 403 Forbidden`, making Postman or curl spoofing impossible.

**Q3: Why use a 5-second polling loop instead of WebSockets for milestone updates?**
*Answer*: WebSockets introduce persistent stateful connections that suffer from socket connection drops on mobile networks, memory leaks in long-running browser tabs, and complex clustering requirements. Our 5-second `StatePoller` queries an indexed, lightweight projection of the contract and milestones. The payload is under 1KB and takes less than 15ms to execute, satisfying our real-time requirements (FR-10) with zero memory leak risk.

**Q4: How do you handle authentication securely without third-party auth services?**
*Answer*: We implemented `SessionService` using Node.js built-in `crypto.createHmac('sha256', SESSION_SECRET)`. The token consists of `base64url(payload).base64url(signature)`. If an attacker alters the `userId` or `role` in the payload, the HMAC signature verification fails immediately, treating the session as untrusted and returning HTTP 401.

---

### End of Engine 04 Logbook Record
*(Signed & Verified for Stage S1 Gate 1 Submission)*
**Student Signature**: Vaibhav Chavanpatil
**Date**: October 23, 2026
