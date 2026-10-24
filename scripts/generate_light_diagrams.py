#!/usr/bin/env python3
"""
Generate high-contrast light-themed technical diagrams for KLE Tech CSE Gate 1 Presentation.
Produces:
1. assets/generated_diagrams/four_engines_light.png
2. assets/generated_diagrams/escrow_fsm_light.png
3. assets/generated_diagrams/evidence_tree_light.png
4. assets/generated_diagrams/double_entry_ledger_light.png
"""

import os
import subprocess
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = "/home/nethunter/Collage /BIG_PROJECT/assets/generated_diagrams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. Four Engines Architecture (Light Mode)
# -------------------------------------------------------------
dot_four_engines = """
digraph FourEngines {
    graph [bgcolor="#FFFFFF", fontname="Arial", fontsize=15, rankdir=TB, nodesep=0.7, ranksep=0.8, pad=0.3];
    node [shape=record, style="filled,rounded", fontname="Arial", fontsize=12, penwidth=2.0];
    edge [fontname="Arial", fontsize=11, color="#475569", fontcolor="#1E293B", penwidth=2.0];

    // Engine 04: Web Technologies
    subgraph cluster_e4 {
        label = "Engine 04 · Web Technologies Engine\\n(Vaibhav Chavanpatil · Roll 04 · 02FE24BCS013)";
        fontcolor = "#1D4ED8";
        color = "#2563EB";
        style = "dashed,rounded";
        penwidth = 2.2;

        e4_ui [label="{Next.js 16 App Router | React 19 UI Composition | Tailwind CSS 4 Responsive Grids}", fillcolor="#EFF6FF", fontcolor="#0F172A", color="#2563EB"];
        e4_rbac [label="{Server-Side RBAC Middleware | HTTP-Only Session Guards | Zod 4 Runtime Schema Validation}", fillcolor="#EFF6FF", fontcolor="#0F172A", color="#2563EB"];
        e4_poll [label="{5-Second Poller | Real-time Milestone Progress | Reviewer Console & Dispute Forms}", fillcolor="#EFF6FF", fontcolor="#0F172A", color="#2563EB"];
    }

    // Engine 01: OS Engine
    subgraph cluster_e1 {
        label = "Engine 01 · OS Engine\\n(Vaishnavi Modekar · Roll 21 · 02FE24BCS060)";
        fontcolor = "#047857";
        color = "#059669";
        style = "dashed,rounded";
        penwidth = 2.2;

        e1_fsm [label="{Deterministic Escrow FSM | Legal Transition Enforcement | Rejects Out-of-Order Jumps (422)}", fillcolor="#ECFDF5", fontcolor="#0F172A", color="#059669"];
        e1_mutex [label="{Mutual Exclusion Critical Section | KeyedMutex Concurrency Guard | Double-Allocation Prevention}", fillcolor="#ECFDF5", fontcolor="#0F172A", color="#059669"];
        e1_timer [label="{Timer Interrupt Watchdog | 7-Day Review Preemption | Prevents Freelancer Starvation}", fillcolor="#ECFDF5", fontcolor="#0F172A", color="#059669"];
    }

    // Engine 02: DSA & SE Engine
    subgraph cluster_e2 {
        label = "Engine 02 · DSA & SE Engine\\n(Darshan Kittur · Roll 18 · 02FE24BCS053)";
        fontcolor = "#B45309";
        color = "#D97706";
        style = "dashed,rounded";
        penwidth = 2.2;

        e2_crypto [label="{Streaming SHA-256 Hasher | 64-Hex Cryptographic Digest | 100% Avalanche Tamper Detection}", fillcolor="#FFFBEB", fontcolor="#0F172A", color="#D97706"];
        e2_tree [label="{Hierarchical N-ary EvidenceTree | In-Memory Dispute Timeline | O(V+E) Topological Traversal}", fillcolor="#FFFBEB", fontcolor="#0F172A", color="#D97706"];
        e2_rtm [label="{Bidirectional RTM Engine | S0 Needs to S1 Verification | Proposal Matcher Heuristic}", fillcolor="#FFFBEB", fontcolor="#0F172A", color="#D97706"];
    }

    // Engine 03: DBMS Engine
    subgraph cluster_e3 {
        label = "Engine 03 · DBMS Engine\\n(Purvi Sammatshetti · Roll 11 · 02FE24BCS022)";
        fontcolor = "#6D28D9";
        color = "#7C3AED";
        style = "dashed,rounded";
        penwidth = 2.2;

        e3_bcnf [label="{BCNF Relational Data Models | Candidate Key Determinants | Eliminates Insertion/Update Anomalies}", fillcolor="#F5F3FF", fontcolor="#0F172A", color="#7C3AED"];
        e3_acid [label="{Atomic ACID Transactions | prisma.$transaction Rollback | Double-Entry Conservation (Sum dB=0)}", fillcolor="#F5F3FF", fontcolor="#0F172A", color="#7C3AED"];
        e3_audit [label="{Append-Only AuditLog | SHA-256 Chained Hashes | Triggers Denying UPDATE/DELETE}", fillcolor="#F5F3FF", fontcolor="#0F172A", color="#7C3AED"];
    }

    // Inter-Engine Data Flows
    e4_ui -> e1_fsm [label="1. Request Milestone Transition", color="#2563EB", fontcolor="#1D4ED8"];
    e4_ui -> e2_crypto [label="2. Stream Deliverable Binary", color="#D97706", fontcolor="#B45309"];
    e1_fsm -> e1_mutex [label="Check Preconditions"];
    e1_mutex -> e3_acid [label="3. Execute Atomic Balance Transfer", color="#059669", fontcolor="#047857"];
    e2_crypto -> e3_bcnf [label="4. Store Checksum in Deliverable", color="#7C3AED", fontcolor="#6D28D9"];
    e2_tree -> e4_poll [label="5. Render Tree to Arbiter Console", color="#2563EB", fontcolor="#1D4ED8"];
    e3_acid -> e3_audit [label="6. Immutably Log State & Hash", color="#7C3AED", fontcolor="#6D28D9"];
    e3_bcnf -> e4_poll [label="7. 5s Poller Reads Updated State", color="#475569", fontcolor="#334155"];
}
"""

with open(f"{OUTPUT_DIR}/four_engines_light.dot", "w") as f:
    f.write(dot_four_engines)

subprocess.run(["dot", "-Tpng", "-Gdpi=220", f"{OUTPUT_DIR}/four_engines_light.dot", "-o", f"{OUTPUT_DIR}/four_engines_light.png"])
print("Generated four_engines_light.png")

# -------------------------------------------------------------
# 2. Escrow FSM State Diagram (Light Mode)
# -------------------------------------------------------------
dot_fsm = """
digraph EscrowFSM {
    graph [bgcolor="#FFFFFF", fontname="Arial", fontsize=15, rankdir=LR, ranksep=0.9, nodesep=0.6, pad=0.3];
    node [shape=box, style="filled,rounded", fontname="Arial", fontsize=12, penwidth=2.0];
    edge [fontname="Arial", fontsize=10, color="#475569", fontcolor="#0F172A", penwidth=2.0];

    start [shape=circle, label="", width=0.35, fillcolor="#2563EB", color="#1D4ED8"];

    await [label="AWAITING_DEPOSIT\\n(Initial State)", fillcolor="#F1F5F9", fontcolor="#334155", color="#64748B"];
    funded [label="FUNDED\\n(Escrow Vault Locked)", fillcolor="#ECFDF5", fontcolor="#065F46", color="#059669", penwidth=2.5];
    progress [label="IN_PROGRESS\\n(Freelancer Executing)", fillcolor="#EFF6FF", fontcolor="#1E40AF", color="#2563EB"];
    subm [label="SUBMITTED\\n(SHA-256 Fingerprinted)", fillcolor="#FFFBEB", fontcolor="#92400E", color="#D97706"];
    review [label="UNDER_REVIEW\\n(7-Day Watchdog Active)", fillcolor="#FEF3C7", fontcolor="#78350F", color="#B45309"];

    released [label="RELEASED\\n(Terminal Success · Paid)", shape=doubleoctagon, fillcolor="#D1FAE5", fontcolor="#065F46", color="#047857", penwidth=3.0];
    disputed [label="DISPUTED\\n(Funds Frozen · In Arbiter)", fillcolor="#FEE2E2", fontcolor="#991B1B", color="#DC2626", penwidth=2.5];
    timeout [label="REVIEW_TIMEOUT\\n(Watchdog Preempted)", fillcolor="#FFEDD5", fontcolor="#9A3412", color="#EA580C"];
    refunded [label="REFUNDED\\n(Terminal Refund · Reverted)", shape=doubleoctagon, fillcolor="#FEE2E2", fontcolor="#991B1B", color="#B91C1C", penwidth=3.0];

    start -> await [color="#2563EB"];
    await -> funded [label="Client Deposits Funds\\n(FR-01, Mutex Lock)", color="#059669", fontcolor="#065F46"];
    funded -> progress [label="Freelancer Accepts / Begins", color="#2563EB", fontcolor="#1E40AF"];
    progress -> subm [label="Upload Deliverable\\n(FR-03, SHA-256 Hash)", color="#D97706", fontcolor="#92400E"];
    subm -> review [label="Client Notification Sent", color="#475569"];

    review -> released [label="Client Approves Work\\n(FR-05, ACID Payout)", color="#047857", fontcolor="#065F46", penwidth=3.0];
    review -> progress [label="Revision Requested\\n(Notes Stored)", color="#D97706", fontcolor="#92400E"];
    review -> disputed [label="Either Party Contests\\n(FR-09, Funds Frozen)", color="#DC2626", fontcolor="#991B1B", penwidth=2.5];

    review -> timeout [label="7 Days Inactivity\\n(Watchdog Timer)", color="#EA580C", fontcolor="#9A3412", style=dashed];
    timeout -> disputed [label="Auto-Escalate to Arbiter", color="#DC2626", fontcolor="#991B1B"];
    timeout -> released [label="Auto-Approval Policy", color="#059669", fontcolor="#065F46", style=dashed];

    disputed -> released [label="Arbiter Rules for Dev\\n(EvidenceTree Verified)", color="#047857", fontcolor="#065F46", penwidth=2.5];
    disputed -> refunded [label="Arbiter Rules for Client\\n(Full Refund)", color="#DC2626", fontcolor="#991B1B", penwidth=2.5];
}
"""

with open(f"{OUTPUT_DIR}/escrow_fsm_light.dot", "w") as f:
    f.write(dot_fsm)

subprocess.run(["dot", "-Tpng", "-Gdpi=220", f"{OUTPUT_DIR}/escrow_fsm_light.dot", "-o", f"{OUTPUT_DIR}/escrow_fsm_light.png"])
print("Generated escrow_fsm_light.png")

# -------------------------------------------------------------
# 3. Evidence Tree Diagram (Light Mode)
# -------------------------------------------------------------
dot_evidence_tree = """
digraph EvidenceTree {
    graph [bgcolor="#FFFFFF", fontname="Arial", fontsize=15, rankdir=TB, ranksep=0.7, nodesep=0.5, pad=0.3];
    node [shape=record, style="filled,rounded", fontname="Arial", fontsize=11, penwidth=2.0];
    edge [fontname="Arial", fontsize=10, color="#475569", fontcolor="#0F172A", penwidth=2.0];

    root [label="{Dispute Case #DSP-2026-001 | Contested Milestone: #2 (Authentication Module) | Escrow Frozen: $1,200.00 | Arbiter: Assigned Reviewer}", fillcolor="#FEE2E2", fontcolor="#991B1B", color="#DC2626", penwidth=2.5];

    c_spec [label="{Contract Agreement Node | Contract ID: #CTR-0982 | Phased Milestones: 3 agreed | Client: Acme Corp · Dev: Alex}", fillcolor="#EFF6FF", fontcolor="#1E40AF", color="#2563EB"];

    m2_req [label="{Milestone 2 Specification | Description: OAuth2 + JWT Auth Route | Budget: $1,200 | Due: 2026-10-01}", fillcolor="#F8FAFC", fontcolor="#0F172A", color="#64748B"];

    d1 [label="{Deliverable v1.0 (Initial Submission) | File: auth-service-v1.zip (14.2 MB) | SHA-256: 7f83b1657ff1fc53b92dc181... | Timestamp: 2026-09-30 18:22:10 UTC}", fillcolor="#FFFBEB", fontcolor="#92400E", color="#D97706"];

    rej1 [label="{Client Rejection #1 | Reason: 'Missing Refresh Token Rotation' | Timestamp: 2026-10-01 11:05:00 UTC}", fillcolor="#FEE2E2", fontcolor="#991B1B", color="#DC2626"];

    d2 [label="{Deliverable v2.0 (Revision Upload) | File: auth-service-v2-fixed.zip (14.8 MB) | SHA-256: 3a94a8fe5ccb19ba61c4c087... | Timestamp: 2026-10-02 16:40:00 UTC}", fillcolor="#ECFDF5", fontcolor="#065F46", color="#059669"];

    dispute_claim [label="{Freelancer Dispute Filing | Claim: 'Client requested out-of-scope SAML SSO' | Log Dump: server-audit.log (SHA-256 verified) | Timestamp: 2026-10-02 21:10:00 UTC}", fillcolor="#FEE2E2", fontcolor="#991B1B", color="#DC2626"];

    ruling [label="{Binding Arbitration Ruling | Ruling: RELEASE_TO_FREELANCER (Split 90/10) | Arbiter Notes: 'v2 delivered agreed OAuth2 spec' | Executed: ACID Transaction #TX-7781}", fillcolor="#D1FAE5", fontcolor="#065F46", color="#047857", penwidth=3.0];

    root -> c_spec [label="Bounds Scope"];
    c_spec -> m2_req [label="Phase 2 Definition"];
    m2_req -> d1 [label="Initial Proof"];
    d1 -> rej1 [label="Disputed Acceptance"];
    rej1 -> d2 [label="Submitted Fix"];
    rej1 -> dispute_claim [label="Conflict Escalation"];
    d2 -> ruling [label="O(V+E) Traversal Analysis", color="#047857", fontcolor="#065F46", penwidth=2.5];
    dispute_claim -> ruling [label="Evidence Adjudicated", color="#047857", fontcolor="#065F46", penwidth=2.5];
}
"""

with open(f"{OUTPUT_DIR}/evidence_tree_light.dot", "w") as f:
    f.write(dot_evidence_tree)

subprocess.run(["dot", "-Tpng", "-Gdpi=220", f"{OUTPUT_DIR}/evidence_tree_light.dot", "-o", f"{OUTPUT_DIR}/evidence_tree_light.png"])
print("Generated evidence_tree_light.png")

# -------------------------------------------------------------
# 4. Double-Entry Balance Conservation (Light Mode)
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5), facecolor="#FFFFFF")
ax.set_facecolor("#FFFFFF")

# Draw 3 Vault Boxes
boxes = [
    {"name": "Client Available Balance", "sub": "User Account (Debit Source)", "x": 0.5, "y": 2.5, "w": 2.6, "h": 1.8, "col": "#2563EB", "fill": "#EFF6FF"},
    {"name": "Contract Escrow Vault", "sub": "Isolated Holding Pool", "x": 4.5, "y": 2.5, "w": 2.6, "h": 1.8, "col": "#D97706", "fill": "#FFFBEB"},
    {"name": "Freelancer Wallet", "sub": "Recipient Ledger (Credit)", "x": 8.5, "y": 2.5, "w": 2.6, "h": 1.8, "col": "#059669", "fill": "#ECFDF5"},
]

for b in boxes:
    rect = patches.FancyBboxPatch((b["x"], b["y"]), b["w"], b["h"], boxstyle="round,pad=0.15", linewidth=2.2, edgecolor=b["col"], facecolor=b["fill"])
    ax.add_patch(rect)
    ax.text(b["x"] + b["w"]/2, b["y"] + b["h"]*0.65, b["name"], color="#0F172A", fontsize=11, fontweight="bold", ha="center")
    ax.text(b["x"] + b["w"]/2, b["y"] + b["h"]*0.35, b["sub"], color="#475569", fontsize=9, ha="center")

# Arrow 1: Lock Escrow
ax.annotate("", xy=(4.4, 3.8), xytext=(3.2, 3.8), arrowprops=dict(arrowstyle="->", color="#2563EB", lw=2.5))
ax.text(3.8, 4.05, "1. Lock Deposit (-$1,000 / +$1,000)", color="#1D4ED8", fontsize=10, ha="center", fontweight="bold")

# Arrow 2: Release Funds
ax.annotate("", xy=(8.4, 3.8), xytext=(7.2, 3.8), arrowprops=dict(arrowstyle="->", color="#059669", lw=2.5))
ax.text(7.8, 4.05, "2. Release Payout (-$1,000 / +$1,000)", color="#047857", fontsize=10, ha="center", fontweight="bold")

# Arrow 3: Refund
ax.annotate("", xy=(3.2, 2.8), xytext=(4.4, 2.8), arrowprops=dict(arrowstyle="->", color="#DC2626", lw=2.5, linestyle="dashed"))
ax.text(3.8, 2.45, "3. Dispute Refund (+1,000 / -$1,000)", color="#B91C1C", fontsize=10, ha="center", fontweight="bold")

# Invariant Formula Banner at bottom
banner = patches.FancyBboxPatch((0.8, 0.4), 10.0, 1.3, boxstyle="round,pad=0.15", linewidth=2.2, edgecolor="#059669", facecolor="#ECFDF5")
ax.add_patch(banner)
ax.text(5.8, 1.25, "INVARIANT INV-03: STRICT CONSERVATION OF VALUE", color="#065F46", fontsize=12, fontweight="bold", ha="center")
ax.text(5.8, 0.75, "Δ ClientBalance + Δ EscrowLocked + Δ FreelancerBalance = 0.00  (Zero-Sum Double Entry)", color="#0F172A", fontsize=12, fontfamily="monospace", fontweight="bold", ha="center")

ax.set_xlim(-0.2, 11.8)
ax.set_ylim(0, 5.0)
ax.axis("off")
plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/double_entry_ledger_light.png", dpi=220, facecolor="#FFFFFF")
plt.close()
print("Generated double_entry_ledger_light.png")
