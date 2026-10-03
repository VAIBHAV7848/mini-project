# Engineering Constitution & Agent Guidelines (`AGENTS.md`)

## 1. Project Identity
- **Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
- **Academic Context**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering and Technology, Belagavi) — Department of Computer Science and Engineering
- **Team**: Team 07 (Theme 01)
  - Vaibhav Chavanpatil (Roll No: 4, SRN: 02FE24BCS013)
  - Purvi Sammatshetti (Roll No: 11, SRN: 02FE24BCS022)
  - Darshan Kittur (Roll No: 18, SRN: 02FE24BCS053)
  - Vaishnavi Modekar (Roll No: 21, SRN: 02FE24BCS060)
- **Root Directory**: `/home/nethunter/Collage/BIG_PROJECT`

---

## 2. Source-of-Truth Hierarchy
All AI agents and contributors must strictly adhere to the following 5-tier authority hierarchy:

```text
1. Official Team Project Documents (docs/source-material/)
   ↓
2. Explicit Decisions Approved by the Team
   ↓
3. Project Architecture / ADR Documentation (docs/decisions/, docs/architecture/)
   ↓
4. Implementation Details (src/, tests/)
   ↓
5. AI-Generated Suggestions
```

### Critical Non-Override Rule
> **AI suggestions must NOT silently override documented project requirements.**
> When a conflict or ambiguity is discovered between an AI recommendation and an official team document, the AI must document the conflict explicitly rather than silently choosing a preference.

---

## 3. Four-Engine Architecture & Ownership
The system is partitioned into four independently ownable and testable engineering engines:

1. **Engine 01 (OS Engine) — Escrow & State Scheduler**
   - *Owner*: Vaishnavi Modekar
   - *Scope*: FSM transitions (`AWAITING_DEPOSIT` → `FUNDED` → `IN_PROGRESS` → `UNDER_REVIEW` → `RELEASED`), atomic fund locking, review timeout mechanics, race condition prevention.
2. **Engine 02 (DSA & SE Engine) — Evidence & Quality Assurance Engine**
   - *Owner*: Darshan Kittur
   - *Scope*: Cryptographic SHA-256 deliverable checksums, tamper-evident evidence tree indexing, requirements traceability matrix (RTM), V&V pipelines.
3. **Engine 03 (DBMS Engine) — Transaction Ledger & Contract Manager**
   - *Owner*: Purvi Sammatshetti
   - *Scope*: Relational BCNF models, ACID payment transfers, append-only tamper-resistant audit logging.
4. **Engine 04 (Web Technologies Engine) — Role-Based Workflow Dashboard**
   - *Owner*: Vaibhav Chavanpatil
   - *Scope*: Multi-role responsive dashboard (Client, Freelancer, Dispute Reviewer, Admin), RBAC enforcement, dispute submission forms, real-time milestone visualization.

---

## 4. Technology Stack & Boundaries
Documented by Team 07:
- **Presentation**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide Icons
- **Application**: Next.js Route Handlers, TypeScript 5, Zod 4 Validation
- **Domain Engine**: Escrow FSM validator (`escrow-engine.ts`), AI Matcher (`ai-matcher.ts`)
- **Security & Checksums**: Node.js Crypto (SHA-256 deliverable hashing), RBAC session validation
- **Persistence**: Prisma 5.22 ORM, SQLite relational database, ACID transactions

### Explicit Scope Boundaries
- **In-Scope**: User RBAC, project posting, proposals/bidding, milestone tracking, deliverable SHA-256 evidence submissions, simulated escrow lock/release/refund, human dispute arbitration.
- **Out-of-Scope**: Real banking/payment gateways (Stripe/PayPal - purely simulated currency), legal court contracts, native mobile apps, autonomous AI arbitration without human review, unlimited video hosting.

---

## 5. Development & Engineering Principles
- **Understand Before Implementing**: Read source documents in `docs/source-material/` first.
- **Small, Atomic Changes**: Make the smallest correct change that solves the issue.
- **Test-Driven Verification**: Every feature or fix must be verified with automated tests.
- **Security by Design**: Defense in depth, strict input validation, zero hardcoded secrets.
- **Living Documentation**: Keep derived docs in sync with official specifications.
- **Evidence-Based Completion**: Terminal proof of passing tests and zero lint errors is mandatory.

---

## 6. Development Workflow
```text
Official Team Documents
    ↓
Understand Requirement
    ↓
Check Architecture Impact
    ↓
Plan
    ↓
Implement (TDD)
    ↓
Test
    ↓
Review & Security
    ↓
Verify Against Original Requirement
```

---

## 7. AI Agent Operating Rules
1. **Inspect Before Modifying**: Read existing code and architecture before touching files.
2. **Follow the Source-of-Truth Hierarchy**: Team documents take precedence over AI defaults.
3. **Respect Engine Boundaries**: Preserve engine decomposition and student ownership boundaries.
4. **Preserve Scope Discipline**: Never introduce out-of-scope features (e.g. real payment gateways).
5. **Report Verification Evidence**: Show exact commands run, exit codes, and output diffs.
6. **Never Claim Success Without Evidence**: Passing tests and clean diffs are required.
7. **Document Important Decisions**: Record non-trivial trade-offs in ADRs or architecture notes.
8. **Preserve Backward Compatibility**: Do not break existing contracts or schemas without deprecation pathways.

---

## 8. Permanent Git Commit & Engineering Attribution Policy
This policy strictly governs all commits across `main`, feature branches, fix branches, worktrees, and parallel development environments.

1. **Professional Software-Engineering Commits**:
   - Commit messages must look like normal professional software-engineering commits.
   - Describe WHAT changed and the engineering rationale, not HOW or by WHOM the change was mechanically typed.
2. **Strict Prohibition on AI / Machine Attribution in Commits**:
   - NEVER mention AI assistance, agents, IDE assistants, or automated generation in commit messages or commit metadata.
   - **Forbidden references include**:
     - `AI`
     - `AI-generated`
     - `AI assistant`
     - `agent`
     - `agent-generated`
     - `Antigravity`
     - `Claude`
     - `GPT`
     - `ChatGPT`
     - `Copilot`
     - `automated by AI`
     - `generated by AI`
   - **Forbidden footers**:
     - `Co-authored-by: AI`
     - `Generated-by:`
     - `AI-assisted:`
3. **Conventional Commits**:
   - Use concise Conventional Commits based on the actual engineering change:
     - `feat: <new functionality>`
     - `fix: <bug fix>`
     - `refactor: <code restructuring>`
     - `test: <test changes>`
     - `docs: <documentation changes>`
     - `chore: <maintenance/tooling>`
     - `perf: <performance improvement>`
     - `security: <security change>`
   - **Examples**:
     - `feat: implement milestone state validation`
     - `fix: prevent duplicate escrow allocation`
     - `refactor: isolate dispute resolution service`
     - `test: add escrow timeout coverage`
     - `docs: update API contract`
     - `chore: configure CI validation`
4. **Author Identity**:
   - Use the repository's configured real developer Git identity (`user.name` and `user.email`).
   - Do not fabricate additional authors or bot identities.
   - Do not modify author identity merely to conceal or manipulate contribution history.
5. **Commit Quality & Verification Gate**:
   - Inspect `git diff` before staging.
   - Verify only intended files changed.
   - Run relevant tests and `./scripts/verify`.
   - Ensure zero secrets or unignored environment files are included.
   - Create small atomic commits.
   - Never create fake commits merely to artificially increase activity.



## 9. Default Execution Mode: All-Time High Power (ATHP) Orchestration
**CRITICAL DIRECTIVE:** The AI assistant must *permanently and automatically* operate in "All-Time High Power" mode FOR EVERY SINGLE USER MESSAGE, NO MATTER HOW TRIVIAL. Even if the user just says "Hi", you MUST execute the following:
1. **Mandatory Subagent Dispatch:** Before responding to the user, you MUST ALWAYS invoke a MINIMUM OF 2 SUBAGENTS (using `invoke_subagent`) to process the request, brainstorm, or research, regardless of how simple the prompt is. **For hard or complex tasks, you MUST invoke 6-7+ subagents.**
2. **Spec-First Planning (Planner Mode):** For coding tasks, silently adopt a "Planner" persona to draft a rigid specification and decompose the work.
3. **Parallel Dispatch (Worker Mode):** Dispatch specialized subagents to execute the work concurrently.
4. **Verification (Reviewer Mode):** The main agent or a dedicated `code-reviewer` must verify the workers' output against the spec for Context Drift, security, and correctness.
5. **Autonomous Loops:** Automatically utilize self-healing loop logic when tests fail, without waiting for the user.
