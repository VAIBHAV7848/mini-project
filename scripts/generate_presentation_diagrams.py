#!/usr/bin/env python3
"""
Generate high-resolution dark-themed technical diagrams for KLE Tech CSE Gate 1 Presentation.
Produces:
1. four_engines.png
2. escrow_fsm.png
3. evidence_tree.png
4. double_entry_ledger.png
"""

import os
import subprocess
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = "/home/nethunter/Collage /BIG_PROJECT/assets/generated_diagrams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. Four Engines Architecture (Graphviz dot)
# -------------------------------------------------------------
dot_four_engines = """
digraph FourEngines {
    graph [bgcolor="#0F172A", fontname="Arial", fontsize=14, rankdir=TB, nodesep=0.6, ranksep=0.7];
    node [shape=record, style="filled,rounded", fontname="Arial", fontsize=11, penwidth=1.5];
    edge [fontname="Arial", fontsize=9, color="#94A3B8", fontcolor="#94A3B8", penwidth=1.5];

    // Engine 04: Web Technologies
    subgraph cluster_e4 {
        label = "Engine 04 · Web Technologies Engine\\n(Vaibhav Chavanpatil · 02FE24BCS013)";
        fontcolor = "#38BDF8";
        color = "#0284C7";
        style = "dashed,rounded";
        penwidth = 1.8;

        e4_ui [label="{Next.js 16 App Router | React 19 UI Composition | Tailwind CSS 4 Responsive Grids}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#38BDF8"];
        e4_rbac [label="{Server-Side RBAC Middleware | HTTP-Only Session Guards | Zod 4 Runtime Schema Validation}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#38BDF8"];
        e4_poll [label="{5-Second Poller | Real-time Milestone Progress | Reviewer Console & Dispute Forms}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#38BDF8"];
    }

    // Engine 01: OS Engine
    subgraph cluster_e1 {
        label = "Engine 01 · OS Engine\\n(Vaishnavi Modekar · 02FE24BCS060)";
        fontcolor = "#34D399";
        color = "#059669";
        style = "dashed,rounded";
        penwidth = 1.8;

        e1_fsm [label="{Deterministic Escrow FSM | Legal Transition Enforcement | Rejects Out-of-Order Jumps (422)}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#34D399"];
        e1_mutex [label="{Mutual Exclusion Critical Section | KeyedMutex Concurrency Guard | Double-Allocation Prevention}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#34D399"];
        e1_timer [label="{Timer Interrupt Watchdog | 7-Day Review Preemption | Prevents Freelancer Starvation}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#34D399"];
    }

    // Engine 02: DSA & SE Engine
    subgraph cluster_e2 {
        label = "Engine 02 · DSA & SE Engine\\n(Darshan Kittur · 02FE24BCS053)";
        fontcolor = "#FBBF24";
        color = "#D97706";
        style = "dashed,rounded";
        penwidth = 1.8;

        e2_crypto [label="{Streaming SHA-256 Hasher | 64-Hex Cryptographic Digest | 100% Avalanche Tamper Detection}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#FBBF24"];
        e2_tree [label="{Hierarchical N-ary EvidenceTree | In-Memory Dispute Timeline | O(V+E) Topological Traversal}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#FBBF24"];
        e2_rtm [label="{Bidirectional RTM Engine | S0 Needs to S1 Verification | Proposal Matcher Heuristic}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#FBBF24"];
    }

    // Engine 03: DBMS Engine
    subgraph cluster_e3 {
        label = "Engine 03 · DBMS Engine\\n(Purvi Sammatshetti · 02FE24BCS022)";
        fontcolor = "#A78BFA";
        color = "#7C3AED";
        style = "dashed,rounded";
        penwidth = 1.8;

        e3_bcnf [label="{BCNF Relational Data Models | Candidate Key Determinants | Eliminates Insertion/Update Anomalies}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#A78BFA"];
        e3_acid [label="{Atomic ACID Transactions | prisma.$transaction Rollback | Double-Entry Conservation (Sum dB=0)}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#A78BFA"];
        e3_audit [label="{Append-Only AuditLog | SHA-256 Chained Hashes | Triggers Denying UPDATE/DELETE}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#A78BFA"];
    }

    // Inter-Engine Data Flows
    e4_ui -> e1_fsm [label="1. Request Milestone Transition", color="#38BDF8", fontcolor="#38BDF8"];
    e4_ui -> e2_crypto [label="2. Stream Deliverable Binary", color="#FBBF24", fontcolor="#FBBF24"];
    e1_fsm -> e1_mutex [label="Check Preconditions"];
    e1_mutex -> e3_acid [label="3. Execute Atomic Balance Transfer", color="#34D399", fontcolor="#34D399"];
    e2_crypto -> e3_bcnf [label="4. Store Checksum in Deliverable", color="#A78BFA", fontcolor="#A78BFA"];
    e2_tree -> e4_poll [label="5. Render Tree to Arbiter Console", color="#38BDF8", fontcolor="#38BDF8"];
    e3_acid -> e3_audit [label="6. Immutably Log State & Hash", color="#A78BFA", fontcolor="#A78BFA"];
    e3_bcnf -> e4_poll [label="7. 5s Poller Reads Updated State", color="#94A3B8", fontcolor="#94A3B8"];
}
"""

with open(f"{OUTPUT_DIR}/four_engines.dot", "w") as f:
    f.write(dot_four_engines)

subprocess.run(["dot", "-Tpng", "-Gdpi=200", f"{OUTPUT_DIR}/four_engines.dot", "-o", f"{OUTPUT_DIR}/four_engines.png"])
print("Generated four_engines.png")

# -------------------------------------------------------------
# 2. Escrow FSM State Diagram (Graphviz dot)
# -------------------------------------------------------------
dot_fsm = """
digraph EscrowFSM {
    graph [bgcolor="#0F172A", fontname="Arial", fontsize=14, rankdir=LR, ranksep=0.8, nodesep=0.5];
    node [shape=box, style="filled,rounded", fontname="Arial", fontsize=11, penwidth=1.5];
    edge [fontname="Arial", fontsize=9, color="#94A3B8", fontcolor="#94A3B8", penwidth=1.5];

    start [shape=circle, label="", width=0.3, fillcolor="#38BDF8", color="#38BDF8"];

    await [label="AWAITING_DEPOSIT\\n(Initial State)", fillcolor="#1E293B", fontcolor="#94A3B8", color="#475569"];
    funded [label="FUNDED\\n(Escrow Vault Locked)", fillcolor="#1E293B", fontcolor="#34D399", color="#059669"];
    progress [label="IN_PROGRESS\\n(Freelancer Executing)", fillcolor="#1E293B", fontcolor="#38BDF8", color="#0284C7"];
    subm [label="SUBMITTED\\n(SHA-256 Fingerprinted)", fillcolor="#1E293B", fontcolor="#FBBF24", color="#D97706"];
    review [label="UNDER_REVIEW\\n(7-Day Watchdog Active)", fillcolor="#1E293B", fontcolor="#F59E0B", color="#B45309"];

    released [label="RELEASED\\n(Terminal Success · Paid)", shape=doubleoctagon, fillcolor="#064E3B", fontcolor="#34D399", color="#34D399", penwidth=2.5];
    disputed [label="DISPUTED\\n(Funds Frozen · In Arbiter)", fillcolor="#7F1D1D", fontcolor="#F87171", color="#EF4444", penwidth=2];
    timeout [label="REVIEW_TIMEOUT\\n(Watchdog Preempted)", fillcolor="#451A03", fontcolor="#FBBF24", color="#F59E0B"];
    refunded [label="REFUNDED\\n(Terminal Refund · Reverted)", shape=doubleoctagon, fillcolor="#1E293B", fontcolor="#F87171", color="#EF4444"];

    start -> await [color="#38BDF8"];
    await -> funded [label="Client Deposits Funds\\n(FR-01, Mutex Lock)", color="#34D399", fontcolor="#34D399"];
    funded -> progress [label="Freelancer Accepts / Begins", color="#38BDF8", fontcolor="#38BDF8"];
    progress -> subm [label="Upload Deliverable\\n(FR-03, SHA-256 Hash)", color="#FBBF24", fontcolor="#FBBF24"];
    subm -> review [label="Client Notification Sent", color="#94A3B8"];

    review -> released [label="Client Approves Work\\n(FR-05, ACID Payout)", color="#34D399", fontcolor="#34D399", penwidth=2.5];
    review -> progress [label="Revision Requested\\n(Notes Stored)", color="#FBBF24", fontcolor="#FBBF24"];
    review -> disputed [label="Either Party Contests\\n(FR-09, Funds Frozen)", color="#F87171", fontcolor="#F87171", penwidth=2];

    review -> timeout [label="7 Days Inactivity\\n(Watchdog Timer)", color="#FBBF24", fontcolor="#FBBF24", style=dashed];
    timeout -> disputed [label="Auto-Escalate to Arbiter", color="#F87171", fontcolor="#F87171"];
    timeout -> released [label="Auto-Approval Policy", color="#34D399", fontcolor="#34D399", style=dashed];

    disputed -> released [label="Arbiter Rules for Dev\\n(EvidenceTree Verified)", color="#34D399", fontcolor="#34D399"];
    disputed -> refunded [label="Arbiter Rules for Client\\n(Full Refund)", color="#F87171", fontcolor="#F87171"];
}
"""

with open(f"{OUTPUT_DIR}/escrow_fsm.dot", "w") as f:
    f.write(dot_fsm)

subprocess.run(["dot", "-Tpng", "-Gdpi=200", f"{OUTPUT_DIR}/escrow_fsm.dot", "-o", f"{OUTPUT_DIR}/escrow_fsm.png"])
print("Generated escrow_fsm.png")

# -------------------------------------------------------------
# 3. Evidence Tree Diagram (Graphviz dot)
# -------------------------------------------------------------
dot_evidence_tree = """
digraph EvidenceTree {
    graph [bgcolor="#0F172A", fontname="Arial", fontsize=14, rankdir=TB, ranksep=0.6, nodesep=0.4];
    node [shape=record, style="filled,rounded", fontname="Arial", fontsize=10, penwidth=1.5];
    edge [fontname="Arial", fontsize=9, color="#94A3B8", fontcolor="#94A3B8", penwidth=1.5];

    root [label="{Dispute Case #DSP-2026-001 | Contested Milestone: #2 (Authentication Module) | Escrow Frozen: $1,200.00 | Arbiter: Assigned Reviewer}", fillcolor="#1E293B", fontcolor="#F87171", color="#EF4444", penwidth=2];

    c_spec [label="{Contract Agreement Node | Contract ID: #CTR-0982 | Phased Milestones: 3 agreed | Client: Acme Corp · Dev: Alex}", fillcolor="#1E293B", fontcolor="#38BDF8", color="#0284C7"];

    m2_req [label="{Milestone 2 Specification | Description: OAuth2 + JWT Auth Route | Budget: $1,200 | Due: 2026-10-01}", fillcolor="#1E293B", fontcolor="#F8FAFC", color="#475569"];

    d1 [label="{Deliverable v1.0 (Initial Submission) | File: auth-service-v1.zip (14.2 MB) | SHA-256: 7f83b1657ff1fc53b92dc181... | Timestamp: 2026-09-30 18:22:10 UTC}", fillcolor="#1E293B", fontcolor="#FBBF24", color="#D97706"];

    rej1 [label="{Client Rejection #1 | Reason: 'Missing Refresh Token Rotation' | Timestamp: 2026-10-01 11:05:00 UTC}", fillcolor="#1E293B", fontcolor="#F87171", color="#DC2626"];

    d2 [label="{Deliverable v2.0 (Revision Upload) | File: auth-service-v2-fixed.zip (14.8 MB) | SHA-256: 3a94a8fe5ccb19ba61c4c087... | Timestamp: 2026-10-02 16:40:00 UTC}", fillcolor="#1E293B", fontcolor="#34D399", color="#059669"];

    dispute_claim [label="{Freelancer Dispute Filing | Claim: 'Client requested out-of-scope SAML SSO' | Log Dump: server-audit.log (SHA-256 verified) | Timestamp: 2026-10-02 21:10:00 UTC}", fillcolor="#1E293B", fontcolor="#F87171", color="#EF4444"];

    ruling [label="{Binding Arbitration Ruling | Ruling: RELEASE_TO_FREELANCER (Split 90/10) | Arbiter Notes: 'v2 delivered agreed OAuth2 spec' | Executed: ACID Transaction #TX-7781}", fillcolor="#064E3B", fontcolor="#34D399", color="#34D399", penwidth=2.5];

    root -> c_spec [label="Bounds Scope"];
    c_spec -> m2_req [label="Phase 2 Definition"];
    m2_req -> d1 [label="Initial Proof"];
    d1 -> rej1 [label="Disputed Acceptance"];
    rej1 -> d2 [label="Submitted Fix"];
    rej1 -> dispute_claim [label="Conflict Escalation"];
    d2 -> ruling [label="O(V+E) Traversal Analysis", color="#34D399", fontcolor="#34D399", penwidth=2];
    dispute_claim -> ruling [label="Evidence Adjudicated", color="#34D399", fontcolor="#34D399", penwidth=2];
}
"""

with open(f"{OUTPUT_DIR}/evidence_tree.dot", "w") as f:
    f.write(dot_evidence_tree)

subprocess.run(["dot", "-Tpng", "-Gdpi=200", f"{OUTPUT_DIR}/evidence_tree.dot", "-o", f"{OUTPUT_DIR}/evidence_tree.png"])
print("Generated evidence_tree.png")

# -------------------------------------------------------------
# 4. Double-Entry Balance Conservation (Matplotlib)
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5), facecolor="#0F172A")
ax.set_facecolor("#0F172A")

# Draw 3 Vault Boxes
boxes = [
    {"name": "Client Available Balance", "sub": "User Account (Debit Source)", "x": 0.5, "y": 2.5, "w": 2.5, "h": 1.8, "col": "#38BDF8"},
    {"name": "Contract Escrow Vault", "sub": "Isolated Holding Pool", "x": 4.5, "y": 2.5, "w": 2.5, "h": 1.8, "col": "#FBBF24"},
    {"name": "Freelancer Wallet", "sub": "Recipient Ledger (Credit)", "x": 8.5, "y": 2.5, "w": 2.5, "h": 1.8, "col": "#34D399"},
]

for b in boxes:
    rect = patches.FancyBboxPatch((b["x"], b["y"]), b["w"], b["h"], boxstyle="round,pad=0.15", linewidth=2, edgecolor=b["col"], facecolor="#1E293B")
    ax.add_patch(rect)
    ax.text(b["x"] + b["w"]/2, b["y"] + b["h"]*0.65, b["name"], color="#F8FAFC", fontsize=11, fontweight="bold", ha="center")
    ax.text(b["x"] + b["w"]/2, b["y"] + b["h"]*0.35, b["sub"], color="#94A3B8", fontsize=9, ha="center")

# Arrow 1: Lock Escrow
ax.annotate("", xy=(4.4, 3.8), xytext=(3.1, 3.8), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=2.5))
ax.text(3.75, 4.05, "1. Lock Deposit (-$1,000 / +$1,000)", color="#38BDF8", fontsize=9, ha="center", fontweight="bold")

# Arrow 2: Release Funds
ax.annotate("", xy=(8.4, 3.8), xytext=(7.1, 3.8), arrowprops=dict(arrowstyle="->", color="#34D399", lw=2.5))
ax.text(7.75, 4.05, "2. Release Payout (-$1,000 / +$1,000)", color="#34D399", fontsize=9, ha="center", fontweight="bold")

# Arrow 3: Refund
ax.annotate("", xy=(3.1, 2.8), xytext=(4.4, 2.8), arrowprops=dict(arrowstyle="->", color="#F87171", lw=2.5, linestyle="dashed"))
ax.text(3.75, 2.45, "3. Dispute Refund (+1,000 / -$1,000)", color="#F87171", fontsize=9, ha="center", fontweight="bold")

# Invariant Formula Banner at bottom
banner = patches.FancyBboxPatch((1.0, 0.4), 9.5, 1.2, boxstyle="round,pad=0.15", linewidth=2, edgecolor="#34D399", facecolor="#064E3B")
ax.add_patch(banner)
ax.text(5.75, 1.15, "INVARIANT INV-03: STRICT CONSERVATION OF VALUE", color="#34D399", fontsize=11, fontweight="bold", ha="center")
ax.text(5.75, 0.75, "Δ ClientBalance + Δ EscrowLocked + Δ FreelancerBalance = 0.00  (Zero-Sum Double Entry)", color="#F8FAFC", fontsize=11, fontfamily="monospace", ha="center")

ax.set_xlim(-0.2, 11.7)
ax.set_ylim(0, 5.0)
ax.axis("off")
plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/double_entry_ledger.png", dpi=200, facecolor="#0F172A")
plt.close()
print("Generated double_entry_ledger.png")
