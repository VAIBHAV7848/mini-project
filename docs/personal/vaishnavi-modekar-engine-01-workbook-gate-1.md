# Personal Engineering Record Book: Stage S1 (Gate 1 Baseline)
## Engine 01: OS Engine (Escrow FSM & State Scheduler)

**Student Lead**: Vaishnavi Modekar (Roll No: 21, SRN: `02FE24BCS060`)
**Department**: Department of Computer Science & Engineering
**Institution**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi)
**Team**: Team 07 (Theme 01)
**Project Title**: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
**Evaluation Stage**: Gate 1 Requirements Baseline & Individual Course Synthesis

---

# Part I: Academic Framework & Evaluation Rubric

## 1. Academic Identity & Course Synthesis
Under the KLE Technological University Computer Science curriculum, this project models an advanced multi-tier software system synthesizing foundational course areas.
- **Assigned Course Area**: Operating Systems, Process Synchronization, Concurrency Control, and Finite State Machines.
- **Assigned System Module**: **Engine 01 (OS Engine — Escrow FSM & State Scheduler)**.
- **Student Ownership**: Vaishnavi Modekar is the sole individual engineer responsible for the finite state machine transitions, timeout watchdog scheduling, mutual exclusion locks, race condition elimination, and deadlock mitigation.

### KLE Tech Gate 1 Evaluation Rubric Alignment (10 Marks Total)
1. **Rubric 1: Problem Definition & Need Analysis (2 Marks)**: Addressed in Chapters 1 & 2 through analysis of race conditions, fund double-allocation vulnerabilities, unhandled timeouts, and subjective dispute freezing.
2. **Rubric 2: Requirements Engineering Baseline (3 Marks)**: Addressed in Chapters 3 & 4 with formal state transition matrices for FR-01, FR-02, FR-03, FR-12, and strict NFR latency/determinism constraints.
3. **Rubric 3: System Modeling & User Stories (2 Marks)**: Addressed in Chapters 5 & 6 with deterministic FSM state models, actor interaction lifecycles, and Gherkin acceptance criteria.
4. **Rubric 4: Technical Depth & Engine Boundaries (2 Marks)**: Addressed in Chapters 7, 8, & 9 via deterministic FSM transition functions, in-memory mutex deadlock recovery, timer queue watchdog, and clean separation from persistence.
5. **Rubric 5: Verification Discipline & Oral Defense (1 Mark)**: Addressed in Chapters 12, 13, & 14 via automated test suites (`tests/engine-01-os/`), state exhaustiveness verification, and oral defense readiness.

---

# Part II: Problem Formulation & Operating Systems Synthesis (Stage S0)

## 2. Concurrency, Race Conditions, and State Drift
In multi-party financial escrow systems, concurrent actors (Client, Freelancer, Reviewer, Automated Watchdog) frequently trigger simultaneous state transitions:
1. **Double Release Vulnerability**: A client clicking "Approve" concurrently with an automated watchdog timeout could trigger duplicate fund disbursements without mutual exclusion.
2. **Illegal State Bypasses**: Malicious or buggy clients attempting to bypass review and release funds directly from `AWAITING_DEPOSIT` without intermediate `FUNDED` and `SUBMITTED` stages.
3. **Stale Review Deadlocks**: When a client abandons a submitted deliverable, funds remain locked indefinitely unless an asynchronous kernel-level timer watchdog auto-progresses the milestone state.

### Operating Systems Principles Synthesized
- **Critical Sections & Mutex Primitives**: Protecting milestone state modifications via non-blocking and timeout-guarded mutexes (`src/core/engine-01-os/mutex.ts`).
- **Deadlock Avoidance & Recovery**: Bounded acquisition timeouts and automated recovery routines to prevent orphaned locks when processes terminate abruptly.
- **Watchdog Timers & Preemption**: Asynchronous timer scheduler scanning active review windows and triggering state preemption upon deadline expiration (`src/core/engine-01-os/watchdog.ts`).

---

# Part III: Requirements Engineering Baseline (Stage S1)

## 3. Functional Requirements Owned by Engine 01

### FR-01: Escrow State Progression FSM
- **Formal Specification**: The system shall enforce a deterministic Finite State Machine governing contract and milestone lifecycles:
  $$\Sigma = \{\text{DEPOSIT}, \text{START}, \text{SUBMIT}, \text{APPROVE}, \text{DISPUTE}, \text{RESOLVE\_RELEASE}, \text{RESOLVE\_REFUND}\}$$
  $$S = \{\text{AWAITING\_DEPOSIT}, \text{FUNDED}, \text{IN\_PROGRESS}, \text{SUBMITTED}, \text{UNDER\_REVIEW}, \text{RELEASED}, \text{DISPUTED}, \text{REFUNDED}, \text{RESOLVED}\}$$
- **Invariant**: Any transition $\delta(s, \sigma) = \emptyset$ shall reject immediately with `InvalidStateTransitionError` before touching persistence.

### FR-02: Automated Watchdog Scheduler & Review Timeout
- **Formal Specification**: When a milestone enters `SUBMITTED`, an absolute review deadline $T_{\text{expire}} = T_{\text{submission}} + \Delta t_{\text{review}}$ is armed. If $t > T_{\text{expire}}$ and state remains `SUBMITTED`, the watchdog scheduler shall transition state to `REVIEW_TIMEOUT` and initiate automated payout.

### FR-03: Dispute Escalation & FSM Freezing
- **Formal Specification**: Raising a dispute must atomically freeze all pending state transitions and lock fund disbursement until formal arbitration verdict.

### FR-12: Sequential Milestone Dependency & Activation
- **Formal Specification**: Milestone $M_i$ cannot transition to `IN_PROGRESS` until milestone $M_{i-1}$ reaches terminal state `RELEASED` or `RESOLVED`.

---

# Part IV: Architecture & Code Verification

## 4. Module Architecture & Test Evidence
- **Core Engine File**: `src/core/engine-01-os/escrow-fsm.ts`
- **Watchdog Scheduler**: `src/core/engine-01-os/watchdog.ts`
- **Concurrency Mutex**: `src/core/engine-01-os/mutex.ts`
- **Verification Suite**: `tests/engine-01-os/escrow-fsm.test.ts` (15/15 tests passing)
- **Deadlock Recovery Suite**: `tests/engine-01-os/mutex-deadlock-recovery.test.ts` (1/1 tests passing)

```typescript
// Formal deterministic transition guard
export function canTransition(current: MilestoneStatus, next: MilestoneStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}
```

---

# Part V: Individual Contribution Declaration
I, Vaishnavi Modekar, declare that I am the sole author and engineer responsible for Engine 01 (OS Engine: Escrow FSM & State Scheduler), including all FSM transition matrices, timeout scheduling logic, and concurrency controls.
