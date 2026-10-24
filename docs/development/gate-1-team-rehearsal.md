# Gate 1 Review — Team 07 Master Rehearsal Script & Defense Guide

> **Institution**: KLE Technological University (Dr. M. S. Sheshgiri College of Engineering & Technology, Belagavi)
> **Department**: Computer Science and Engineering
> **Course / Theme**: Theme 01 | **Team**: Team 07
> **Review Gate**: Stage S1 Requirements Baseline (**Gate 1: 15 Marks**)
> **Date**: October 23, 2026
> **Allocated Presentation Time**: **5 Minutes** (+ 3 Minutes Viva Voce Q&A)
> **Presentation Deck**: `docs/Team07_Gate_1_Master_Presentation.pptx` / `docs/Team07_Gate_1_Master_Presentation.pdf`

---

## ⏱️ 5-Minute Synchronized Speaking Schedule

| Minute | Slide Range | Speaker | Topic / Engine Focus | Key Visual Anchor |
| :---: | :---: | :--- | :--- | :--- |
| **0:00 – 1:00** | Slides 1 – 3 | **Vaibhav Chavanpatil** (Roll 04) | Cover, Team Roster, S0 Problem Space & Gate Progression | 4 Stakeholder Failure Modes |
| **1:00 – 1:55** | Slides 4, 7, 8 | **Vaishnavi Modekar** (Roll 21) | Four Engines Intro & Engine 01 (OS: FSM & Watchdog) | `escrow_fsm_light.png` |
| **1:55 – 2:50** | Slide 9 | **Darshan Kittur** (Roll 18) | Engine 02 (DSA & SE: EvidenceTree & SHA-256) | `evidence_tree_light.png` |
| **2:50 – 3:45** | Slide 10 | **Purvi Sammatshetti** (Roll 11) | Engine 03 (DBMS: BCNF Normalization & ACID Ledger) | `double_entry_ledger_light.png` |
| **3:45 – 5:00** | Slides 11 – 15 | **Vaibhav Chavanpatil** & Team | Engine 04 (Web RBAC), Deliverables (7/7), KPIs, & Conclusion | Live UI & Deliverables Checklist |

---

## 🎤 Minute-by-Minute Word-for-Word Script

### Minute 1:00 (0:00 – 1:00) — Vaibhav Chavanpatil (Roll 04)
*Display: Slides 1, 2, 3*

> *"Respected evaluators, faculty members, and fellow peers, good morning. We are Team 07 representing Theme 01. Our project is the **Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow**.*
>
> *Today we present our **Stage S1 Requirements Engineering Baseline for Gate 1 (15 Marks)**. Our team comprises four student engineers, each owning an independent curricular engine: Vaishnavi Modekar on OS, Darshan Kittur on DSA and Software Engineering, Purvi Sammatshetti on DBMS, and myself on Web Technologies.*
>
> *In Stage S0, we identified four crippling pain points in digital freelancing: payment uncertainty, evidence fragmentation, subjective arbitration, and project abandonment. Gate 1 evaluates **what** our system guarantees, **who** is technically accountable, and **how** quality is measured before writing architecture or code."*

---

### Minute 2:00 (1:00 – 1:55) — Vaishnavi Modekar (Roll 21)
*Display: Slides 4, 7, 8*

> *"Thank you, Vaibhav. I lead **Engine 01: The Escrow & State Scheduler**, grounded in core **Operating Systems** principles.*
>
> *We model financial escrow as a **shared critical resource requiring strict mutual exclusion**. Milestone progression behaves exactly like OS process lifecycles. We have engineered a deterministic Finite State Machine: milestones transition from `AWAITING_DEPOSIT` to `FUNDED`, `IN_PROGRESS`, `UNDER_REVIEW`, and finally `RELEASED` or `DISPUTED`.*
>
> *Crucially, we solve the industry-wide 'freelancer starvation problem' where clients abandon reviews indefinitely. Using an operating systems timer interrupt analog, we enforce a **7-calendar-day review watchdog**. If a client remains idle for 7 days post-submission, the watchdog preempts the milestone to `REVIEW_TIMEOUT`, triggering automated escalation. Invariants INV-01 and INV-02 guarantee zero illegal transitions and complete absence of double-spending."*

---

### Minute 3:00 (1:55 – 2:50) — Darshan Kittur (Roll 18)
*Display: Slide 9*

> *"Good morning. I am Darshan Kittur, owning **Engine 02: Evidence & Quality Assurance**, combining **Data Structures & Algorithms** and **Software Engineering**.*
>
> *Traditional dispute systems store evidence in flat database tables, which completely loses causal chronology. In Engine 02, we index every milestone deliverable, client feedback, and dispute claim into an in-memory **hierarchical N-ary EvidenceTree**. When a human arbiter reviews a dispute, our engine executes an $O(V+E)$ topological traversal, presenting the exact chronological chain of evidence.*
>
> *To guarantee tamper-proof non-repudiation, we compute a **streaming 64-character SHA-256 cryptographic checksum** at the moment of upload. Modifying even a single character flips roughly 50% of digest bits via the avalanche effect, guaranteeing a 100% tamper detection rate. In SE, I maintain our bidirectional Requirements Traceability Matrix, linking 100% of S0 needs to our 12 functional requirements."*

---

### Minute 4:00 (2:50 – 3:45) — Purvi Sammatshetti (Roll 11)
*Display: Slide 10*

> *"Good morning evaluators. I lead **Engine 03: The Transaction Ledger & Contract Manager**, rooted in **Database Management Systems**.*
>
> *Financial escrow requires absolute mathematical and relational integrity. First, our 10 conceptual entities are strictly normalized to **Boyce-Codd Normal Form (BCNF)**: every non-trivial functional dependency has a candidate key as its determinant, mathematically eliminating insertion, update, and deletion anomalies.*
>
> *Second, we enforce **double-entry balance conservation**: the sum of balance changes across Client, Escrow, and Freelancer accounts strictly equals zero ($\sum \Delta B = 0$). All disbursements execute inside atomic SQLite ACID transactions. If a single ledger check fails, the entire transaction rolls back with zero balance drift. Finally, we maintain an **append-only AuditLog** with SHA-256 hash chaining, where database-level triggers strictly prohibit `UPDATE` or `DELETE` operations."*

---

### Minute 5:00 (3:45 – 5:00) — Vaibhav Chavanpatil (Roll 04) & Team Wrap-Up
*Display: Slides 11, 12, 13, 14, 15*

> *"Thank you, Purvi. In **Engine 04: The Role-Based Workflow Dashboard**, grounded in **Web Technologies and Networks**, we enforce server-side RBAC middleware across Client, Freelancer, Reviewer, and Admin roles. UI client-side rendering is purely ergonomic—every API route cryptographically validates session authority and parses incoming payloads through runtime **Zod 4 schemas** to prevent XSS and SQL injection.*
>
> *To summarize our Gate 1 submission:*
> 1. *All **7 Gate 1 Deliverables** are complete, audited, and frozen in Git VCS (commit `926869b` on October 2nd).*
> 2. *Our **3-Tier KPI Sheet** establishes measurable targets: 0% balance drift, 100% RBAC protection, and 100% SHA-256 tampering detection.*
> 3. *Our requirements are prioritized via **MoSCoW**, with core CS mechanisms locked under Must-Have P0.*
>
> *Team 07 is fully prepared and welcomes your questions for our viva voce defense. Thank you."*

---

## 🎯 Evaluator Viva Voce: Top 5 Tough Questions & Rehearsed Answers

### Q1: "Gate 1 is about Requirements. Why do you already have database schemas and scripts in your repository?"
**Speaker: Darshan Kittur (SE Lead) or Vaibhav Chavanpatil**
> *"Sir/Madam, in our disciplined engineering workflow, we established and frozen our Stage S1 requirements baseline first on October 2nd, as verified in commit `926869b`. While exploratory technical spikes for subsequent gates have begun in parallel, our Gate 1 defense today strictly evaluates the **Requirements Baseline**: the 12 Functional Requirements, 5 Use Cases, 8 User Stories, 3-Tier KPIs, and 4-Engine ownership decomposition. None of our subsequent work alters the frozen S1 specification."*

### Q2: "What prevents a race condition if a client clicks 'Release' twice rapidly, or simultaneously with a dispute filing?"
**Speaker: Vaishnavi Modekar (OS Lead)**
> *"Engine 01 isolates milestone state transitions within critical sections governed by mutual exclusion locks. When the first release request enters the critical section, the FSM verifies that the milestone is in state `UNDER_REVIEW` and atomically updates it to terminal state `RELEASED`. The second concurrent request is evaluated when the milestone is already in `RELEASED`, immediately failing state validation and throwing HTTP 422 `INVALID_STATE_TRANSITION`. This completely prevents race-induced double disbursements."*

### Q3: "Why build a custom in-memory EvidenceTree rather than querying relational database tables?"
**Speaker: Darshan Kittur (DSA Lead)**
> *"While relational tables store rows efficiently, resolving disputes requires analyzing causal parent-child dependencies—such as a deliverable submission being directly rebutted by a client rejection, followed by a revised counter-submission. An N-ary EvidenceTree models these causal relationships natively. Our topological sorting algorithm traverses the dispute graph in $O(V+E)$ time, allowing the human arbiter to review the dispute chronologically without running complex, recursive SQL joins."*

### Q4: "How do you prove that your database schema is in BCNF?"
**Speaker: Purvi Sammatshetti (DBMS Lead)**
> *"In our schema of 10 entities (Users, Projects, Milestones, Contracts, EscrowLedger, Deliverables, Disputes, EvidenceNodes, AuditLogs, SystemKPIs), every non-trivial functional dependency $X \to Y$ satisfies the BCNF condition: $X$ is a superkey. For example, in `Milestone`, attributes like `amount`, `status`, and `deadline` are determined strictly by `milestoneId`, which is the primary candidate key. We have eliminated transitive and partial functional dependencies, guaranteeing zero redundancy and zero update anomalies."*

### Q5: "Are you planning to integrate real banking gateways like Stripe or Razorpay?"
**Speaker: Vaibhav Chavanpatil (Web Lead)**
> *"No, sir. We explicitly demarcated our scope boundaries in our MoSCoW prioritization matrix: real custodial banking gateways are classified as **Won't Have (P3)**. Integrating real banking involves third-party merchant compliance, KYC regulations, and financial liability that distracts from our academic objective. Instead, Engine 03 implements a fully autonomous, simulated double-entry ACID escrow ledger with zero-sum balance conservation ($\sum \Delta B = 0$), which rigorously demonstrates computer science and database principles."*
