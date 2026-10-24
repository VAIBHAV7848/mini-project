#!/usr/bin/env python3
"""
Team 07 — Gate 1 Architecture & Technical Diagrams Generator
============================================================
Project: Milestone-Based Escrow & Evidence-Based Dispute Resolution Workflow
Academic Context: KLE Technological University (Dr. M. S. Sheshgiri CET, Belagavi)
Course / Framework: Engine-Based Mini-Project Framework with Hybrid SDLC (Theme 01)

Team 07 Members & Engines:
- Engine 01 (Operating Systems): Vaishnavi Modekar (Roll No: 21, SRN: 02FE24BCS060)
- Engine 02 (DSA & Software Engineering): Darshan Kittur (Roll No: 18, SRN: 02FE24BCS053)
- Engine 03 (DBMS): Purvi Sammatshetti (Roll No: 11, SRN: 02FE24BCS022)
- Engine 04 (Web Technologies): Vaibhav Chavanpatil (Roll No: 4, SRN: 02FE24BCS013)

Outputs 4 high-resolution, dark-themed 300 DPI PNG diagrams:
1. diagram_four_engines.png: High-level 4-Engine architectural diagram with interactions.
2. diagram_escrow_fsm.png: Complete Finite State Machine with watchdog timeout and triggers.
3. diagram_evidence_tree.png: Hierarchical N-ary EvidenceTree data structure for dispute resolution.
4. diagram_acid_ledger.png: Double-entry financial balance conservation diagram (sum(delta B) = 0).
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
from PIL import Image

# Palette definition
BG_COLOR = "#0F172A"       # Dark Slate background
CARD_BG = "#1E293B"        # Slate-800 card fill
TEXT_LIGHT = "#F8FAFC"     # Slate-50 bright text
TEXT_MUTED = "#94A3B8"     # Slate-400 muted text
CYAN = "#38BDF8"           # Sky/Cyan accent (Engine 04 / Core)
EMERALD = "#34D399"        # Mint/Emerald accent (Engine 02 / Success)
AMBER = "#FBBF24"          # Amber accent (Engine 01 / Watchdog)
PURPLE = "#A78BFA"         # Purple/Violet accent (Engine 03 / DBMS)
ROSE = "#F43F5E"           # Rose/Red accent (Dispute / Rejection)


def run_dot(dot_source: str, output_path: Path):
    """Executes dot compiler to produce high-resolution 300 DPI PNG."""
    cmd = ["dot", "-Tpng", "-Gdpi=300", "-o", str(output_path)]
    result = subprocess.run(cmd, input=dot_source.encode("utf-8"), capture_output=True)
    if result.returncode != 0:
        print(f"Error compiling Graphviz DOT for {output_path.name}:", file=sys.stderr)
        print(result.stderr.decode("utf-8"), file=sys.stderr)
        sys.exit(result.returncode)

    file_size = output_path.stat().st_size
    with Image.open(output_path) as img:
        width, height = img.size
        img.save(output_path, dpi=(300, 300))
    print(f"✓ Generated {output_path.name}: {width}x{height} px, {file_size / 1024:.1f} KB (300 DPI)")


def generate_diagram_four_engines(out_dir: Path):
    """1. diagram_four_engines.png: 4-Engine architecture and interactions."""
    dot = f"""digraph FourEngines {{
    graph [
        bgcolor="{BG_COLOR}",
        fontname="DejaVu Sans",
        fontsize=16,
        fontcolor="{TEXT_LIGHT}",
        rankdir="TB",
        nodesep=0.7,
        ranksep=0.8,
        pad=0.5,
        compound=true,
        label=<<table border="0" cellborder="0" cellspacing="4">
            <tr><td align="center"><font color="{CYAN}" point-size="22"><b>TEAM 07 — FOUR-ENGINE ARCHITECTURAL TOPOLOGY</b></font></td></tr>
            <tr><td align="center"><font color="{TEXT_MUTED}" point-size="13">Milestone-Based Escrow &amp; Evidence-Based Dispute Resolution Workflow • KLE Technological University</font></td></tr>
        </table>>,
        labelloc="t"
    ];

    node [
        fontname="DejaVu Sans",
        fontsize=11,
        shape=none
    ];

    edge [
        fontname="DejaVu Sans",
        fontsize=10,
        fontcolor="{TEXT_LIGHT}",
        penwidth=2.2,
        arrowsize=0.8
    ];

    // External Stakeholders & Actors
    subgraph cluster_actors {{
        graph [
            style="dashed,rounded",
            color="#475569",
            fillcolor="{CARD_BG}",
            label=<<font color="{TEXT_MUTED}" point-size="11"><b>AUTHENTICATED ACTORS &amp; SYSTEM SERVICES</b></font>>,
            labelloc="t",
            margin=16
        ];
        actors_node [label=<<table border="0" cellborder="1" cellspacing="8" cellpadding="6" color="#475569">
            <tr>
                <td bgcolor="{BG_COLOR}" color="{CYAN}"><font color="{CYAN}"><b>👤 Client</b><br/><font point-size="9" color="{TEXT_MUTED}">Posts Projects, Funds Escrow, Reviews</font></font></td>
                <td bgcolor="{BG_COLOR}" color="{EMERALD}"><font color="{EMERALD}"><b>⚡ Freelancer</b><br/><font point-size="9" color="{TEXT_MUTED}">Submits Bids, Uploads Work, Claims Funds</font></font></td>
                <td bgcolor="{BG_COLOR}" color="{ROSE}"><font color="{ROSE}"><b>⚖️ Dispute Reviewer</b><br/><font point-size="9" color="{TEXT_MUTED}">Inspects Evidence Tree, Issues Ruling</font></font></td>
                <td bgcolor="{BG_COLOR}" color="{AMBER}"><font color="{AMBER}"><b>⏱️ System Watchdog</b><br/><font point-size="9" color="{TEXT_MUTED}">Automated Timeout Daemon (7-Day Limit)</font></font></td>
            </tr>
        </table>>];
    }}

    // Engine 04: Web Technologies
    subgraph cluster_e4 {{
        graph [
            style="filled,rounded",
            color="{CYAN}",
            fillcolor="{CARD_BG}",
            penwidth=2.5,
            label=<<font color="{CYAN}" point-size="14"><b>ENGINE 04 (WEB TECHNOLOGIES): Role-Based Workflow Dashboard</b></font><br/><font color="{TEXT_MUTED}" point-size="10">Student Owner: Vaibhav Chavanpatil (Roll No: 4 | SRN: 02FE24BCS013)</font>>,
            labelloc="t",
            margin=18
        ];
        e4_content [label=<<table border="0" cellborder="0" cellspacing="6" cellpadding="4">
            <tr><td align="left"><font color="{TEXT_LIGHT}"><b>Core Framework:</b> Next.js 16 (App Router) • React 19 • Tailwind CSS 4</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Multi-Role Dashboards:</b> Tailored Client, Freelancer, Reviewer, Admin console views (FR-07)</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Authentication &amp; RBAC:</b> Zero-bypass server middleware &amp; Zod 4 request validation (FR-08)</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Dispute Workflow UI:</b> Claim submission, evidence upload, and reviewer console (FR-09)</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Real-Time Visualizer:</b> Interactive milestone timeline reflecting FSM transitions (FR-10)</font></td></tr>
        </table>>];
    }}

    // Subgraph containing Engine 01 (OS) and Engine 02 (DSA/SE)
    {{
        rank=same;

        // Engine 01: OS
        subgraph cluster_e1 {{
            graph [
                style="filled,rounded",
                color="{AMBER}",
                fillcolor="{CARD_BG}",
                penwidth=2.5,
                label=<<font color="{AMBER}" point-size="14"><b>ENGINE 01 (OPERATING SYSTEMS): Escrow &amp; State Scheduler</b></font><br/><font color="{TEXT_MUTED}" point-size="10">Student Owner: Vaishnavi Modekar (Roll No: 21 | SRN: 02FE24BCS060)</font>>,
                labelloc="t",
                margin=18
            ];
            e1_content [label=<<table border="0" cellborder="0" cellspacing="6" cellpadding="4">
                <tr><td align="left"><font color="{TEXT_LIGHT}"><b>Core Model:</b> Deterministic FSM &amp; Concurrency Scheduler</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Atomic Fund Locking:</b> Locks milestone funds prior to work (FR-01)</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>FSM State Machine:</b> Strict transition validation (FR-02)</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Watchdog Interrupt:</b> 7-day client review timer daemon</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Race Condition Guard:</b> Mutual exclusion on state mutations (FR-12)</font></td></tr>
            </table>>];
        }}

        // Engine 02: DSA & SE
        subgraph cluster_e2 {{
            graph [
                style="filled,rounded",
                color="{EMERALD}",
                fillcolor="{CARD_BG}",
                penwidth=2.5,
                label=<<font color="{EMERALD}" point-size="14"><b>ENGINE 02 (DSA &amp; SE): Evidence &amp; Quality Assurance</b></font><br/><font color="{TEXT_MUTED}" point-size="10">Student Owner: Darshan Kittur (Roll No: 18 | SRN: 02FE24BCS053)</font>>,
                labelloc="t",
                margin=18
            ];
            e2_content [label=<<table border="0" cellborder="0" cellspacing="6" cellpadding="4">
                <tr><td align="left"><font color="{TEXT_LIGHT}"><b>Core Data Structure:</b> Hierarchical N-ary Merkle Evidence Tree</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>SHA-256 Checksums:</b> Cryptographic deliverable integrity (FR-03)</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Evidence Tree:</b> Root → Contract → Milestone → Deliverable (FR-04)</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Tree Traversal:</b> O(V+E) post-order DFS Merkle verification</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Heuristic Matcher:</b> Tag-based Jaccard similarity matcher (FR-11)</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Software Quality:</b> Bidirectional Requirements Traceability Matrix</font></td></tr>
            </table>>];
        }}
    }}

    // Engine 03: DBMS
    subgraph cluster_e3 {{
        graph [
            style="filled,rounded",
            color="{PURPLE}",
            fillcolor="{CARD_BG}",
            penwidth=2.5,
            label=<<font color="{PURPLE}" point-size="14"><b>ENGINE 03 (DBMS): Transaction Ledger &amp; Contract Manager</b></font><br/><font color="{TEXT_MUTED}" point-size="10">Student Owner: Purvi Sammatshetti (Roll No: 11 | SRN: 02FE24BCS022)</font>>,
            labelloc="t",
            margin=18
        ];
        e3_content [label=<<table border="0" cellborder="0" cellspacing="6" cellpadding="4">
            <tr><td align="left"><font color="{TEXT_LIGHT}"><b>Core Persistence:</b> Relational BCNF Schema • Prisma 5.22 • SQLite WAL Mode</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">• <b>ACID Transactions:</b> Double-entry fund transfer: &Delta;Client + &Delta;Escrow + &Delta;Freelancer = 0 (FR-05)</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Append-Only Audit Log:</b> Tamper-resistant historical mutation ledger with monotonic sequence (FR-06)</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Relational Constraints:</b> Foreign keys, check constraints, and non-negative balance invariants</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">• <b>Index Optimization:</b> B-Tree index optimization for rapid dispute evidence retrieval</font></td></tr>
        </table>>];
    }}

    // Inter-Engine Communication Edges
    actors_node -> e4_content [
        color="{CYAN}",
        label=<<font color="{CYAN}">HTTP / JSON REST Requests<br/><font color="{TEXT_MUTED}" point-size="9">(RBAC Sessions &amp; JWT Claims)</font></font>>,
        penwidth=2.2
    ];

    e4_content -> e1_content [
        color="{AMBER}",
        label=<<font color="{AMBER}">1. Milestone Actions<br/><font color="{TEXT_MUTED}" point-size="9">assertValidTransition()</font></font>>,
        weight=2
    ];

    e4_content -> e2_content [
        color="{EMERALD}",
        label=<<font color="{EMERALD}">2. Deliverable Payload<br/><font color="{TEXT_MUTED}" point-size="9">computeDigest() &amp; addNode()</font></font>>,
        weight=2
    ];

    e1_content -> e3_content [
        color="{PURPLE}",
        label=<<font color="{PURPLE}">3. Execute ACID Transfers<br/><font color="{TEXT_MUTED}" point-size="9">depositEscrow(), release(), refund()</font></font>>,
        weight=3
    ];

    e2_content -> e3_content [
        color="{EMERALD}",
        label=<<font color="{EMERALD}">4. Store SHA-256 Checksums<br/><font color="{TEXT_MUTED}" point-size="9">Persist hashes into Deliverable &amp; Audit</font></font>>,
        dir=both,
        weight=1
    ];

    e3_content -> e4_content [
        color="{PURPLE}",
        constraint=false,
        label=<<font color="{PURPLE}">5. Transaction Receipts &amp; Balances<br/><font color="{TEXT_MUTED}" point-size="9">Balance sync &amp; audit trail response</font></font>>,
        style="dashed"
    ];

    e2_content -> e4_content [
        color="{EMERALD}",
        constraint=false,
        label=<<font color="{EMERALD}">6. Evidence Tree Hierarchy<br/><font color="{TEXT_MUTED}" point-size="9">Rendered in Dispute Reviewer Console</font></font>>,
        style="dashed"
    ];

    e1_content -> e4_content [
        color="{AMBER}",
        constraint=false,
        label=<<font color="{AMBER}">7. Watchdog Timeout Event<br/><font color="{TEXT_MUTED}" point-size="9">Automatic transition to REVIEW_TIMEOUT</font></font>>,
        style="dashed"
    ];
}}
"""
    run_dot(dot, out_dir / "diagram_four_engines.png")


def generate_diagram_escrow_fsm(out_dir: Path):
    """2. diagram_escrow_fsm.png: Complete Finite State Machine."""
    dot = f"""digraph EscrowFSM {{
    graph [
        bgcolor="{BG_COLOR}",
        fontname="DejaVu Sans",
        fontsize=16,
        fontcolor="{TEXT_LIGHT}",
        rankdir="TB",
        nodesep=0.65,
        ranksep=0.75,
        pad=0.5,
        label=<<table border="0" cellborder="0" cellspacing="4">
            <tr><td align="center"><font color="{AMBER}" point-size="22"><b>ENGINE 01 (OPERATING SYSTEMS) — ESCROW FINITE STATE MACHINE</b></font></td></tr>
            <tr><td align="center"><font color="{TEXT_MUTED}" point-size="13">Deterministic Lifecycle • Concurrency-Safe State Invariants • 7-Day Watchdog Timer Preemption</font></td></tr>
        </table>>,
        labelloc="t"
    ];

    node [
        fontname="DejaVu Sans",
        fontsize=11,
        style="filled,rounded",
        shape="box",
        penwidth=2.2,
        color="{CYAN}",
        fillcolor="{CARD_BG}",
        fontcolor="{TEXT_LIGHT}",
        margin="0.24,0.15"
    ];

    edge [
        fontname="DejaVu Sans",
        fontsize=9,
        fontcolor="{TEXT_LIGHT}",
        penwidth=2.0,
        arrowsize=0.8
    ];

    // Rank 1: Initial creation and active preparation
    {{
        rank=same;
        start [shape=circle, width=0.35, height=0.35, label="", style=filled, fillcolor="{CYAN}", color="{TEXT_LIGHT}"];

        awaiting [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{CYAN}"><b>AWAITING_DEPOSIT</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Milestone initialized</font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Balance uncommitted</font></td></tr>
        </table>>];

        funded [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{EMERALD}"><b>FUNDED</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Escrow funds locked</font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">&Delta;Escrow = +$Amount</font></td></tr>
        </table>>, color="{EMERALD}", fillcolor="#064E3B"];

        in_progress [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{CYAN}"><b>IN_PROGRESS</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Freelancer working</font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Artifact in development</font></td></tr>
        </table>>];
    }}

    // Rank 2: Submission and Client Review Window
    {{
        rank=same;
        submitted [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="#60A5FA"><b>SUBMITTED</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Artifact uploaded</font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">SHA-256 digested</font></td></tr>
        </table>>, color="#60A5FA"];

        under_review [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{PURPLE}"><b>UNDER_REVIEW</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Client evaluation window</font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">7-Day Watchdog Active</font></td></tr>
        </table>>, color="{PURPLE}"];

        approved [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{EMERALD}"><b>APPROVED</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Client accepted work</font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Ready for settlement</font></td></tr>
        </table>>, color="{EMERALD}", fillcolor="#064E3B"];
    }}

    // Rank 3: Exceptions, Timeout & Dispute Resolution
    {{
        rank=same;
        review_timeout [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{AMBER}"><b>⏱️ REVIEW_TIMEOUT</b></font></td></tr>
            <tr><td><font point-size="8" color="#FEF08A">7-Day Window Expired</font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Anti-starvation interrupt</font></td></tr>
        </table>>, color="{AMBER}", fillcolor="#451A03", penwidth=2.5];

        disputed [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{ROSE}"><b>⚠️ DISPUTED</b></font></td></tr>
            <tr><td><font point-size="8" color="#FECDD3">Escalated to Arbiter</font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_MUTED}">Evidence Tree compiled</font></td></tr>
        </table>>, color="{ROSE}", fillcolor="#4C0519", penwidth=2.5];
    }}

    // Rank 4: Terminal Absorbing States
    {{
        rank=same;
        released [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{EMERALD}" point-size="13"><b>🏁 RELEASED</b></font></td></tr>
            <tr><td><font point-size="8" color="#A7F3D0">Funds → Freelancer</font></td></tr>
            <tr><td><font point-size="8" color="#6EE7B7">TERMINAL STATE</font></td></tr>
        </table>>, shape="box", peripheries=2, color="{EMERALD}", fillcolor="#022C22", penwidth=3.0];

        refunded [label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="#FB923C" point-size="13"><b>🛑 REFUNDED</b></font></td></tr>
            <tr><td><font point-size="8" color="#FED7AA">Funds → Client</font></td></tr>
            <tr><td><font point-size="8" color="#FDBA74">TERMINAL STATE</font></td></tr>
        </table>>, shape="box", peripheries=2, color="#FB923C", fillcolor="#431407", penwidth=3.0];
    }}

    // State Transitions
    start -> awaiting [color="{CYAN}", label=<<font color="{CYAN}">Create</font>>];

    awaiting -> funded [
        color="{EMERALD}",
        penwidth=2.5,
        label=<<font color="{EMERALD}"><b>DEPOSIT</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[CLIENT, SYSTEM]</font>>
    ];

    funded -> in_progress [
        color="{CYAN}",
        label=<<font color="{CYAN}"><b>START_WORK</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[FREELANCER]</font>>
    ];

    in_progress -> submitted [
        color="#60A5FA",
        label=<<font color="#60A5FA"><b>SUBMIT_DELIVERABLE</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[FREELANCER] + SHA-256</font>>
    ];

    in_progress -> disputed [
        color="{ROSE}",
        style="dashed",
        label=<<font color="{ROSE}"><b>RAISE_DISPUTE</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[CLIENT]</font>>
    ];

    submitted -> under_review [
        color="{PURPLE}",
        label=<<font color="{PURPLE}">Client Inspection Window</font>>
    ];

    under_review -> approved [
        color="{EMERALD}",
        penwidth=2.5,
        label=<<font color="{EMERALD}"><b>APPROVE_MILESTONE</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[CLIENT]</font>>
    ];

    submitted -> approved [
        color="{EMERALD}",
        label=<<font color="{EMERALD}"><b>APPROVE</b></font>>
    ];

    under_review -> review_timeout [
        color="{AMBER}",
        penwidth=2.2,
        style="dashed",
        label=<<font color="{AMBER}"><b>TIMEOUT_WATCHDOG</b></font><br/><font color="#FEF08A" point-size="8">[SYSTEM] 7-Day Inactivity</font>>
    ];

    submitted -> review_timeout [
        color="{AMBER}",
        style="dashed"
    ];

    under_review -> disputed [
        color="{ROSE}",
        style="dashed",
        label=<<font color="{ROSE}"><b>RAISE_DISPUTE</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[CLIENT, FREELANCER]</font>>
    ];

    approved -> released [
        color="{EMERALD}",
        penwidth=3.0,
        label=<<font color="{EMERALD}"><b>RELEASE_ESCROW</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[CLIENT, SYSTEM]</font>>
    ];

    review_timeout -> released [
        color="{AMBER}",
        penwidth=2.2,
        label=<<font color="{AMBER}"><b>RELEASE_ESCROW</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[SYSTEM Auto-Release]</font>>
    ];

    review_timeout -> disputed [
        color="{ROSE}",
        style="dashed",
        label=<<font color="{ROSE}"><b>RAISE_DISPUTE</b></font>>
    ];

    review_timeout -> approved [
        color="{EMERALD}",
        style="dotted",
        label=<<font color="{EMERALD}"><b>APPROVE</b></font>>
    ];

    disputed -> released [
        color="{EMERALD}",
        penwidth=2.2,
        label=<<font color="{EMERALD}"><b>RESOLVE_RELEASE</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[REVIEWER] Ruling for Freelancer</font>>
    ];

    disputed -> refunded [
        color="#FB923C",
        penwidth=2.2,
        label=<<font color="#FB923C"><b>RESOLVE_REFUND</b></font><br/><font color="{TEXT_MUTED}" point-size="8">[REVIEWER] Ruling for Client</font>>
    ];

    // Informational Callout Box
    subgraph cluster_info {{
        graph [
            style="dashed,rounded",
            color="#475569",
            fillcolor="{CARD_BG}",
            label=<<font color="{AMBER}" point-size="11"><b>OPERATING SYSTEMS ENGINE GUARANTEES (Vaishnavi Modekar - Roll No: 21, SRN: 02FE24BCS060)</b></font>>,
            labelloc="b"
        ];
        info_node [label=<<table border="0" cellborder="0" cellspacing="4" cellpadding="2">
            <tr><td align="left"><font color="{EMERALD}">• <b>Deterministic State Transitions:</b> Closed finite state space, rejecting invalid or re-entrant paths (NFR-01)</font></td></tr>
            <tr><td align="left"><font color="{AMBER}">• <b>Watchdog Preemption Interrupt:</b> 7-day daemon protects freelancer against client starvation deadlock</font></td></tr>
            <tr><td align="left"><font color="{ROSE}">• <b>Dispute Escalation:</b> Freezes active release and redirects to human arbiter evidence review</font></td></tr>
            <tr><td align="left"><font color="{PURPLE}">• <b>Terminal State Invariance:</b> {{RELEASED, REFUNDED}} are immutable absorbing nodes (TERMINAL_STATE_IMMUTABLE)</font></td></tr>
        </table>>];
    }}
}}
"""
    run_dot(dot, out_dir / "diagram_escrow_fsm.png")


def generate_diagram_evidence_tree(out_dir: Path):
    """3. diagram_evidence_tree.png: Hierarchical N-ary EvidenceTree."""
    dot = f"""digraph EvidenceTree {{
    graph [
        bgcolor="{BG_COLOR}",
        fontname="DejaVu Sans",
        fontsize=16,
        fontcolor="{TEXT_LIGHT}",
        rankdir="TB",
        nodesep=0.5,
        ranksep=0.7,
        pad=0.5,
        label=<<table border="0" cellborder="0" cellspacing="4">
            <tr><td align="center"><font color="{EMERALD}" point-size="22"><b>ENGINE 02 (DSA &amp; SE) — HIERARCHICAL MERKLE EVIDENCE TREE</b></font></td></tr>
            <tr><td align="center"><font color="{TEXT_MUTED}" point-size="13">N-ary Tamper-Evident Data Structure • SHA-256 Cryptographic Leaves • O(V+E) Post-Order DFS Adjudication</font></td></tr>
        </table>>,
        labelloc="t"
    ];

    node [
        fontname="DejaVu Sans",
        fontsize=10,
        style="filled,rounded",
        shape="box",
        penwidth=2.0,
        color="{CYAN}",
        fillcolor="{CARD_BG}",
        fontcolor="{TEXT_LIGHT}",
        margin="0.2,0.12"
    ];

    edge [
        fontname="DejaVu Sans",
        fontsize=9,
        fontcolor="{TEXT_LIGHT}",
        penwidth=1.8,
        arrowsize=0.75
    ];

    // ROOT NODE
    root [
        label=<<table border="0" cellborder="0" cellspacing="3">
            <tr><td bgcolor="{BG_COLOR}" color="{CYAN}"><font color="{CYAN}" point-size="11"><b>ROOT: DISPUTE CASE #DISP-007</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Type: <b>EvidenceNodeType.ROOT</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Title: Dispute on Milestone #MS-01 Deliverable</font></td></tr>
            <tr><td align="left"><font color="{EMERALD}">Merkle Root: <b>9b4e7a82c1...d0f4</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Integrity: <font color="{EMERALD}"><b>TAMPER_FREE (isValid: true)</b></font></font></td></tr>
        </table>>,
        color="{CYAN}",
        penwidth=3.0,
        fillcolor="#0F2942"
    ];

    // LEVEL 1: CONTRACT & MILESTONE
    subgraph cluster_l1 {{
        graph [style="invis"];
        {{ rank=same; n_contract; n_milestone; }}
    }}

    n_contract [
        label=<<table border="0" cellborder="0" cellspacing="3">
            <tr><td bgcolor="{BG_COLOR}" color="{PURPLE}"><font color="{PURPLE}" point-size="10"><b>CLAIM: CONTRACT CLAUSES</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">ID: <b>contract_con_901</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Agreed Budget: $1,200.00</font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Scope: Next.js 16 Web Dashboard</font></td></tr>
            <tr><td align="left"><font color="{PURPLE}">Merkle: <b>c3a71b...</b></font></td></tr>
        </table>>,
        color="{PURPLE}",
        fillcolor="#1E1B4B"
    ];

    n_milestone [
        label=<<table border="0" cellborder="0" cellspacing="3">
            <tr><td bgcolor="{BG_COLOR}" color="{PURPLE}"><font color="{PURPLE}" point-size="10"><b>CLAIM: MILESTONE #MS-01</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">ID: <b>ms_01_escrow</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Escrow Locked: $600.00</font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Status: <b>UNDER_DISPUTE</b></font></td></tr>
            <tr><td align="left"><font color="{PURPLE}">Merkle: <b>7f1e94...</b></font></td></tr>
        </table>>,
        color="{PURPLE}",
        fillcolor="#1E1B4B"
    ];

    // LEVEL 2: DELIVERABLES, REJECTIONS & TEST LOGS
    subgraph cluster_l2 {{
        graph [style="invis"];
        {{ rank=same; n_deliv1; n_reject; n_deliv2; n_testlog; }}
    }}

    n_deliv1 [
        label=<<table border="0" cellborder="0" cellspacing="3">
            <tr><td bgcolor="{BG_COLOR}" color="#60A5FA"><font color="#60A5FA" point-size="10"><b>DELIVERABLE v1.0</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Author: Freelancer</font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Payload: src_v1.zip</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Timestamp: T+02d</font></td></tr>
            <tr><td align="left"><font color="#60A5FA">Merkle: <b>e28fa0...</b></font></td></tr>
        </table>>,
        color="#60A5FA"
    ];

    n_reject [
        label=<<table border="0" cellborder="0" cellspacing="3">
            <tr><td bgcolor="{BG_COLOR}" color="{ROSE}"><font color="{ROSE}" point-size="10"><b>REJECTION / FEEDBACK</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Author: Client</font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Reason: Layout breaks at 360px</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Timestamp: T+04d</font></td></tr>
            <tr><td align="left"><font color="{ROSE}">Merkle: <b>d14c82...</b></font></td></tr>
        </table>>,
        color="{ROSE}",
        fillcolor="#4C0519"
    ];

    n_deliv2 [
        label=<<table border="0" cellborder="0" cellspacing="3">
            <tr><td bgcolor="{BG_COLOR}" color="{EMERALD}"><font color="{EMERALD}" point-size="10"><b>DELIVERABLE v2.0 (REVISED)</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Author: Freelancer</font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Payload: src_v2_fixed.zip</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Timestamp: T+05d</font></td></tr>
            <tr><td align="left"><font color="{EMERALD}">Merkle: <b>5a8b11...</b></font></td></tr>
        </table>>,
        color="{EMERALD}",
        fillcolor="#064E3B"
    ];

    n_testlog [
        label=<<table border="0" cellborder="0" cellspacing="3">
            <tr><td bgcolor="{BG_COLOR}" color="{PURPLE}"><font color="{PURPLE}" point-size="10"><b>TEST_LOG: AUTOMATED CI</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Runner: Vitest / Playwright</font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Result: 42/42 Tests Passed</font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Timestamp: T+05d</font></td></tr>
            <tr><td align="left"><font color="{PURPLE}">Merkle: <b>8c20de...</b></font></td></tr>
        </table>>,
        color="{PURPLE}",
        fillcolor="#2E1065"
    ];

    // LEVEL 3: CRYPTOGRAPHIC SHA-256 LEAVES
    subgraph cluster_l3 {{
        graph [style="invis"];
        {{ rank=same; hash1; hash2; hash3; hash4; }}
    }}

    hash1 [
        shape=note,
        label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{AMBER}"><b>SHA-256 LEAF DIGEST</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_LIGHT}">7a82b9e144a...31f0</font></td></tr>
            <tr><td><font point-size="7" color="{TEXT_MUTED}">size: 4.2 MB • uncompressed</font></td></tr>
        </table>>,
        color="{AMBER}",
        fillcolor="#292524"
    ];

    hash2 [
        shape=note,
        label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{ROSE}"><b>SHA-256 LEAF DIGEST</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_LIGHT}">3d18c4e09fa...6a81</font></td></tr>
            <tr><td><font point-size="7" color="{TEXT_MUTED}">size: 18 KB • feedback note</font></td></tr>
        </table>>,
        color="{ROSE}",
        fillcolor="#292524"
    ];

    hash3 [
        shape=note,
        label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{EMERALD}"><b>SHA-256 LEAF DIGEST</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_LIGHT}">5f91e0a273b...12ca</font></td></tr>
            <tr><td><font point-size="7" color="{TEXT_MUTED}">size: 4.3 MB • verified fix</font></td></tr>
        </table>>,
        color="{EMERALD}",
        fillcolor="#292524"
    ];

    hash4 [
        shape=note,
        label=<<table border="0" cellborder="0" cellspacing="2">
            <tr><td><font color="{PURPLE}"><b>SHA-256 LEAF DIGEST</b></font></td></tr>
            <tr><td><font point-size="8" color="{TEXT_LIGHT}">b4c239f1590...ef83</font></td></tr>
            <tr><td><font point-size="7" color="{TEXT_MUTED}">size: 120 KB • execution log</font></td></tr>
        </table>>,
        color="{PURPLE}",
        fillcolor="#292524"
    ];

    // ARBITER RULING & ADJUDICATION VERDICT
    ruling [
        label=<<table border="0" cellborder="0" cellspacing="4">
            <tr><td bgcolor="{BG_COLOR}" color="{AMBER}"><font color="{AMBER}" point-size="12"><b>⚖️ ARBITER RULING &amp; ADJUDICATION VERDICT</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Reviewer ID: <b>usr_rev_042</b> (Human Dispute Specialist)</font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Traversal Method: <b>Post-Order Depth-First Search (DFS)</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_LIGHT}">Findings: Deliverable v2.0 (SHA-256: 5f91e0...) matches specifications &amp; passed automated tests</font></td></tr>
            <tr><td align="left"><font color="{EMERALD}" point-size="11">Verdict: <b>RESOLVE_RELEASE ($600.00 Awarded to Freelancer)</b></font></td></tr>
            <tr><td align="left"><font color="{TEXT_MUTED}">Ruling Signature: <b>SHA256(Verdict + MerkleRoot + ReviewerKey)</b></font></td></tr>
        </table>>,
        color="{AMBER}",
        penwidth=3.0,
        fillcolor="#422006"
    ];

    // EDGES / TREE RELATIONSHIPS
    root -> n_contract [color="{CYAN}", label="Clause Link"];
    root -> n_milestone [color="{CYAN}", label="Milestone Link"];

    n_milestone -> n_deliv1 [color="#60A5FA", label="Initial Submission"];
    n_milestone -> n_reject [color="{ROSE}", label="Client Rejection"];
    n_milestone -> n_deliv2 [color="{EMERALD}", penwidth=2.2, label="Cured Submission"];
    n_milestone -> n_testlog [color="{PURPLE}", label="V&amp;V Verification"];

    n_deliv1 -> hash1 [color="{AMBER}", style="dotted", label="digest()"];
    n_reject -> hash2 [color="{ROSE}", style="dotted", label="digest()"];
    n_deliv2 -> hash3 [color="{EMERALD}", style="dotted", penwidth=2.0, label="digest()"];
    n_testlog -> hash4 [color="{PURPLE}", style="dotted", label="digest()"];

    // Adjudication flow
    root -> ruling [
        color="{AMBER}",
        penwidth=2.5,
        style="dashed",
        label=<<font color="{AMBER}"><b>Adjudication Inspection Path</b><br/><font color="{TEXT_MUTED}" point-size="8">verifyTreeIntegrity(root) returns isValid: true</font></font>>
    ];

    // DSA Explanatory Box
    subgraph cluster_dsa_box {{
        graph [
            style="dashed,rounded",
            color="#475569",
            fillcolor="{CARD_BG}",
            label=<<font color="{EMERALD}" point-size="11"><b>DSA &amp; SE THEORETICAL PRINCIPLES (Darshan Kittur - Roll No: 18, SRN: 02FE24BCS053)</b></font>>,
            labelloc="b"
        ];
        dsa_notes [label=<<table border="0" cellborder="0" cellspacing="4" cellpadding="2">
            <tr><td align="left"><font color="{EMERALD}">• <b>Merkle Bottom-Up Property:</b> Parent Hash H(P) = SHA256(Checksum : H(C₁) + ... + H(Cₖ))</font></td></tr>
            <tr><td align="left"><font color="{CYAN}">• <b>Algorithmic Complexity:</b> Tree construction &amp; DFS integrity verification in <b>O(V + E)</b> time</font></td></tr>
            <tr><td align="left"><font color="{ROSE}">• <b>Anti-Tamper Invariant:</b> Any byte modified in leaves invalidates ancestor hashes up to Root</font></td></tr>
            <tr><td align="left"><font color="{PURPLE}">• <b>Software Engineering QA:</b> Bidirectional Traceability (RTM) from Gate 0 needs to FR-03/04</font></td></tr>
        </table>>];
    }}
}}
"""
    run_dot(dot, out_dir / "diagram_evidence_tree.png")


def generate_diagram_acid_ledger(out_dir: Path):
    """4. diagram_acid_ledger.png: Double-entry financial balance conservation diagram."""
    dot = f"""digraph AcidLedger {{
    graph [
        bgcolor="{BG_COLOR}",
        fontname="DejaVu Sans",
        fontsize=16,
        fontcolor="{TEXT_LIGHT}",
        rankdir="TB",
        nodesep=0.6,
        ranksep=0.7,
        pad=0.5,
        label=<<table border="0" cellborder="0" cellspacing="4">
            <tr><td align="center"><font color="{PURPLE}" point-size="22"><b>ENGINE 03 (DBMS) — ACID TRANSACTION &amp; DOUBLE-ENTRY BALANCE CONSERVATION</b></font></td></tr>
            <tr><td align="center"><font color="{TEXT_MUTED}" point-size="13">Mathematical Invariant: &Sigma; &Delta;B = &Delta;B(Client) + &Delta;B(Escrow) + &Delta;B(Freelancer) = 0 • Zero Financial Leaks</font></td></tr>
        </table>>,
        labelloc="t"
    ];

    node [
        fontname="DejaVu Sans",
        fontsize=11,
        style="filled,rounded",
        shape="box",
        penwidth=2.2,
        color="{PURPLE}",
        fillcolor="{CARD_BG}",
        fontcolor="{TEXT_LIGHT}",
        margin="0.22,0.14"
    ];

    edge [
        fontname="DejaVu Sans",
        fontsize=10,
        fontcolor="{TEXT_LIGHT}",
        penwidth=2.0,
        arrowsize=0.8
    ];

    // TOP SECTION: THREE CORE BALANCE POOLS
    subgraph cluster_accounts {{
        graph [
            style="filled,rounded",
            color="#475569",
            fillcolor="{BG_COLOR}",
            label=<<font color="{CYAN}" point-size="14"><b>CORE FINANCIAL ENTITIES (CLOSED-LOOP SYSTEM)</b></font>>,
            labelloc="t",
            margin=16
        ];

        {{ rank=same; acc_client; acc_escrow; acc_freelancer; }}

        acc_client [
            label=<<table border="0" cellborder="0" cellspacing="4" cellpadding="4">
                <tr><td bgcolor="#0284C7"><font color="#FFFFFF" point-size="12"><b>👤 CLIENT ACCOUNT (B_Client)</b></font></td></tr>
                <tr><td align="left"><font color="{TEXT_LIGHT}">Role: Project Employer / Funder</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">Initial Balance: <b>$1,000.00</b></font></td></tr>
                <tr><td align="left"><font color="{CYAN}">Invariant: B_Client &ge; 0 (No Overdraft)</font></td></tr>
            </table>>,
            color="{CYAN}",
            fillcolor="#082F49"
        ];

        acc_escrow [
            label=<<table border="0" cellborder="0" cellspacing="4" cellpadding="4">
                <tr><td bgcolor="#7C3AED"><font color="#FFFFFF" point-size="12"><b>🔒 ESCROW POOL (B_Escrow)</b></font></td></tr>
                <tr><td align="left"><font color="{TEXT_LIGHT}">Role: Atomic Fund Lock Container</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">Critical Section State Storage</font></td></tr>
                <tr><td align="left"><font color="{PURPLE}">Invariant: B_Escrow &ge; 0 (Locked Pool)</font></td></tr>
            </table>>,
            color="{PURPLE}",
            fillcolor="#2E1065"
        ];

        acc_freelancer [
            label=<<table border="0" cellborder="0" cellspacing="4" cellpadding="4">
                <tr><td bgcolor="#059669"><font color="#FFFFFF" point-size="12"><b>⚡ FREELANCER (B_Freelancer)</b></font></td></tr>
                <tr><td align="left"><font color="{TEXT_LIGHT}">Role: Contractor / Earner</font></td></tr>
                <tr><td align="left"><font color="{TEXT_MUTED}">Initial Balance: <b>$0.00</b></font></td></tr>
                <tr><td align="left"><font color="{EMERALD}">Invariant: Earned on Milestone Release</font></td></tr>
            </table>>,
            color="{EMERALD}",
            fillcolor="#064E3B"
        ];
    }}

    // PHASE 1: DEPOSIT TRANSACTION
    subgraph cluster_tx1 {{
        graph [
            style="filled,rounded",
            color="{CYAN}",
            fillcolor="{CARD_BG}",
            label=<<font color="{CYAN}" point-size="12"><b>TRANSACTION 1: ATOMIC ESCROW DEPOSIT (Contract Creation / Milestone Funding)</b></font>>,
            labelloc="t",
            margin=14
        ];
        tx1_box [label=<<table border="0" cellborder="1" cellspacing="6" cellpadding="4" color="#475569">
            <tr>
                <td bgcolor="{BG_COLOR}"><font color="{ROSE}"><b>DEBIT Client Balance</b><br/>&Delta;B_Client = <b>-$500.00</b></font></td>
                <td bgcolor="{BG_COLOR}"><font color="{EMERALD}"><b>CREDIT Escrow Pool</b><br/>&Delta;B_Escrow = <b>+$500.00</b></font></td>
                <td bgcolor="{BG_COLOR}"><font color="{TEXT_MUTED}"><b>Freelancer Balance</b><br/>&Delta;B_Freelancer = <b>$0.00</b></font></td>
                <td bgcolor="#064E3B"><font color="{EMERALD}"><b>CONSERVATION SUM</b><br/>(-$500) + (+$500) + $0 = <b>$0.00</b></font></td>
            </tr>
        </table>>];
    }}

    // PHASE 2: IN-PROGRESS LOCK STATE
    subgraph cluster_lock {{
        graph [
            style="dashed,rounded",
            color="{AMBER}",
            fillcolor="{CARD_BG}",
            label=<<font color="{AMBER}" point-size="12"><b>LOCKED STATE: IN-PROGRESS CRITICAL SECTION (FSM: FUNDED / IN_PROGRESS)</b></font>>,
            labelloc="t",
            margin=14
        ];
        lock_box [label=<<table border="0" cellborder="0" cellspacing="4" cellpadding="2">
            <tr><td><font color="{AMBER}" point-size="11"><b>🔒 Funds Safely Encapsulated: B_Escrow = $500.00 | Neither Party Can Unilaterally Withdraw</b></font></td></tr>
            <tr><td><font color="{TEXT_MUTED}" point-size="10">Client cannot recall funds arbitrarily • Freelancer cannot claim funds without verification • Watchdog monitors review deadlines</font></td></tr>
        </table>>];
    }}

    // PHASE 3: SETTLEMENT PATHS
    subgraph cluster_tx3 {{
        graph [
            style="filled,rounded",
            color="{EMERALD}",
            fillcolor="{CARD_BG}",
            label=<<font color="{EMERALD}" point-size="12"><b>TRANSACTION 2: TERMINAL SETTLEMENT BRANCHES (Zero-Sum Invariant Strictly Enforced)</b></font>>,
            labelloc="t",
            margin=14
        ];
        {{ rank=same; tx3a_box; tx3b_box; }}

        tx3a_box [label=<<table border="0" cellborder="1" cellspacing="6" cellpadding="4" color="{EMERALD}">
            <tr><td bgcolor="#064E3B" colspan="2"><font color="{EMERALD}" point-size="11"><b>BRANCH A: MILESTONE RELEASE (Happy Path / Arbiter Release)</b></font></td></tr>
            <tr>
                <td bgcolor="{BG_COLOR}"><font color="{ROSE}"><b>DEBIT Escrow Pool</b><br/>&Delta;B_Escrow = <b>-$500.00</b></font></td>
                <td bgcolor="{BG_COLOR}"><font color="{EMERALD}"><b>CREDIT Freelancer</b><br/>&Delta;B_Freelancer = <b>+$500.00</b></font></td>
            </tr>
            <tr>
                <td bgcolor="{BG_COLOR}"><font color="{TEXT_MUTED}"><b>Client Change</b><br/>&Delta;B_Client = <b>$0.00</b></font></td>
                <td bgcolor="#064E3B"><font color="{EMERALD}"><b>CONSERVATION:</b><br/>$0 + (-$500) + (+$500) = <b>$0.00</b></font></td>
            </tr>
        </table>>, color="{EMERALD}", fillcolor="#022C22"];

        tx3b_box [label=<<table border="0" cellborder="1" cellspacing="6" cellpadding="4" color="#FB923C">
            <tr><td bgcolor="#431407" colspan="2"><font color="#FB923C" point-size="11"><b>BRANCH B: DISPUTE REFUND (Arbiter Rules for Client)</b></font></td></tr>
            <tr>
                <td bgcolor="{BG_COLOR}"><font color="{ROSE}"><b>DEBIT Escrow Pool</b><br/>&Delta;B_Escrow = <b>-$500.00</b></font></td>
                <td bgcolor="{BG_COLOR}"><font color="{CYAN}"><b>CREDIT Client</b><br/>&Delta;B_Client = <b>+$500.00</b></font></td>
            </tr>
            <tr>
                <td bgcolor="{BG_COLOR}"><font color="{TEXT_MUTED}"><b>Freelancer Change</b><br/>&Delta;B_Freelancer = <b>$0.00</b></font></td>
                <td bgcolor="#431407"><font color="#FB923C"><b>CONSERVATION:</b><br/>(+$500) + (-$500) + $0 = <b>$0.00</b></font></td>
            </tr>
        </table>>, color="#FB923C", fillcolor="#290B04"];
    }}

    // FLOW ARROWS
    acc_client -> tx1_box [color="{CYAN}", label="depositEscrow() input"];
    tx1_box -> lock_box [color="{AMBER}", label="Lock Transition"];
    lock_box -> tx3a_box [color="{EMERALD}", penwidth=2.5, label="Client Approves / Timeout Release"];
    lock_box -> tx3b_box [color="#FB923C", penwidth=2.0, style="dashed", label="Dispute Arbiter Issues Refund"];

    // ACID AND DBMS THEORY EXPLANATION BOX
    subgraph cluster_dbms_theory {{
        graph [
            style="dashed,rounded",
            color="{PURPLE}",
            fillcolor="{CARD_BG}",
            label=<<font color="{PURPLE}" point-size="11"><b>DBMS ACID GUARANTEES (Purvi Sammatshetti - Roll No: 11, SRN: 02FE24BCS022)</b></font>>,
            labelloc="b"
        ];
        theory_node [label=<<table border="0" cellborder="0" cellspacing="4" cellpadding="2">
            <tr><td align="left"><font color="{CYAN}">• <b>Atomicity (A):</b> prisma.$transaction() wraps all balance mutations; any failure triggers complete zero-leak rollback</font></td></tr>
            <tr><td align="left"><font color="{EMERALD}">• <b>Consistency (C):</b> CHECK (balance &ge; 0) invariants &amp; foreign key cascades maintain strict Boyce-Codd Normal Form (BCNF)</font></td></tr>
            <tr><td align="left"><font color="{AMBER}">• <b>Isolation (I):</b> Serializable database transactions eliminate dirty reads, non-repeatable reads, and race conditions (NFR-09)</font></td></tr>
            <tr><td align="left"><font color="{PURPLE}">• <b>Durability (D):</b> SQLite Write-Ahead Logging (WAL) + Monotonic append-only AuditLog with SHA-256 state tracking</font></td></tr>
        </table>>];
    }}
}}
"""
    run_dot(dot, out_dir / "diagram_acid_ledger.png")


def main():
    repo_root = Path("/home/nethunter/Collage /BIG_PROJECT")

    # Destination directories
    primary_dir = repo_root / "assets" / "generated_diagrams"
    assets_dir = repo_root / "assets"

    primary_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(parents=True, exist_ok=True)

    print(f"============================================================")
    print(f"Generating Team 07 Gate 1 Diagrams in: {primary_dir}")
    print(f"Theme: Dark Slate ({BG_COLOR}), Cyan ({CYAN}), Emerald ({EMERALD}), 300 DPI")
    print(f"============================================================")

    generate_diagram_four_engines(primary_dir)
    generate_diagram_escrow_fsm(primary_dir)
    generate_diagram_evidence_tree(primary_dir)
    generate_diagram_acid_ledger(primary_dir)

    # Also sync copies to assets/ root for convenience
    for filename in [
        "diagram_four_engines.png",
        "diagram_escrow_fsm.png",
        "diagram_evidence_tree.png",
        "diagram_acid_ledger.png"
    ]:
        src = primary_dir / filename
        dst = assets_dir / filename
        shutil.copy2(src, dst)
        print(f"✓ Synced to {dst}")

    print(f"============================================================")
    print("All 4 diagrams generated and verified successfully!")
    print(f"============================================================")


if __name__ == "__main__":
    main()
