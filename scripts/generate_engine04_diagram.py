#!/usr/bin/env python3
"""
Generate an ultra-crisp, colorful, publication-grade technical diagram for Engine 04 (Web Technologies).
Owner: Vaibhav Chavanpatil (Roll No: 04, SRN: 02FE24BCS013)
Outputs: assets/generated_diagrams/engine_04_web_architecture_light.png
"""

import os
import subprocess

OUTPUT_DIR = "/home/nethunter/Collage /BIG_PROJECT/assets/generated_diagrams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------------------
# Graphviz DOT Specification for Engine 04: Multi-Role RBAC & Web Pipeline
# -------------------------------------------------------------------------
dot_content = """
digraph Engine04 {
    graph [
        bgcolor="#FFFFFF",
        fontname="Arial",
        fontsize=13,
        rankdir=TB,
        nodesep=0.55,
        ranksep=0.55,
        pad=0.25
    ];
    node [shape=record, style="filled,rounded", fontname="Arial", fontsize=10.5, penwidth=1.8];
    edge [fontname="Arial", fontsize=9.5, color="#334155", fontcolor="#0F172A", penwidth=1.8];

    // TOP LAYER: 4 Role-Based Dashboards
    subgraph cluster_roles {
        label = "PRESENTATION TIER · 4 ROLE-BASED WORKSPACE DASHBOARDS (FR-07)";
        fontname = "Arial Bold";
        fontsize = 12;
        fontcolor = "#1E293B";
        color = "#94A3B8";
        style = "dashed,rounded";
        penwidth = 1.6;
        bgcolor = "#F8FAFC";

        role_client [
            label = "{<f0> 👤 CLIENT WORKSPACE | <f1> • Deposit Escrow Funds\\n• Review Deliverables\\n• Release Milestone Funds\\n• Raise Disputes | <f2> State: FUNDED}",
            fillcolor = "#EFF6FF", color = "#2563EB", fontcolor = "#0F172A"
        ];

        role_freelancer [
            label = "{<f0> 💼 FREELANCER WORKSPACE | <f1> • Bid & Accept Contracts\\n• Upload Deliverables\\n• SHA-256 Binary Checksum\\n• View Earned Escrow | <f2> State: SUBMITTED}",
            fillcolor = "#ECFDF5", color = "#059669", fontcolor = "#0F172A"
        ];

        role_reviewer [
            label = "{<f0> ⚖️ DISPUTE REVIEWER | <f1> • EvidenceTree Adjudication\\n• Inspect Hash Proofs\\n• Examine Causal DAG\\n• Issue Binding Rulings | <f2> State: DISPUTED}",
            fillcolor = "#FFFBEB", color = "#D97706", fontcolor = "#0F172A"
        ];

        role_admin [
            label = "{<f0> 🛡️ AUDITOR / ADMIN | <f1> • Chained AuditLog Review\\n• Double-Spend Monitoring\\n• Balance Conservation (0-Drift)\\n• Inspect System KPIs | <f2> State: MONITORED}",
            fillcolor = "#FEF2F2", color = "#DC2626", fontcolor = "#0F172A"
        ];
    }

    // MIDDLE LAYER: Server-Side RBAC & Middleware Security Guard
    subgraph cluster_security {
        label = "SECURITY TIER · NEXT.JS 16 APP ROUTER SERVER-SIDE RBAC BOUNDARY (FR-08, NFR-02)";
        fontname = "Arial Bold";
        fontsize = 12;
        fontcolor = "#1D4ED8";
        color = "#2563EB";
        style = "rounded";
        penwidth = 2.0;
        bgcolor = "#F0F7FF";

        sec_session [
            label = "{🔐 HMAC Session Verification | Next.js HTTP-Only Cookie\\nRejection: HTTP 401 Unauthorized}",
            fillcolor = "#FFFFFF", color = "#2563EB", fontcolor = "#0F172A"
        ];

        sec_rbac [
            label = "{🛡️ Server-Side RBAC Guard | RbacEnforcer.enforceRole()\\nRejection: HTTP 403 Forbidden}",
            fillcolor = "#FFFFFF", color = "#059669", fontcolor = "#0F172A"
        ];

        sec_zod [
            label = "{⚡ Zod 4 Runtime Validator | Strict Payload Allowlists (NFR-04)\\nRejection: HTTP 400 Bad Request}",
            fillcolor = "#FFFFFF", color = "#7C3AED", fontcolor = "#0F172A"
        ];

        sec_poller [
            label = "{⏱️ 5s Lightweight Poller | Polling Synchronizer (FR-10)\\nZero WebSocket Memory Leaks}",
            fillcolor = "#FFFFFF", color = "#D97706", fontcolor = "#0F172A"
        ];
    }

    // BOTTOM LAYER: Route Handlers & Integration to Foundational Engines
    subgraph cluster_backend {
        label = "APPLICATION ROUTE HANDLERS & INTEGRATION TO FOUNDATIONAL ENGINES";
        fontname = "Arial Bold";
        fontsize = 12;
        fontcolor = "#047857";
        color = "#059669";
        style = "dashed,rounded";
        penwidth = 1.6;
        bgcolor = "#F8FAFC";

        api_routes [
            label = "{POST /api/contracts/[id]/milestones | POST /api/disputes | GET /api/audit-logs}",
            fillcolor = "#EFF6FF", color = "#2563EB", fontcolor = "#0F172A"
        ];

        to_e1 [label="{Engine 01 (OS)\\nFSM State Transitions}", fillcolor="#ECFDF5", color="#059669", fontcolor="#0F172A"];
        to_e2 [label="{Engine 02 (DSA/SE)\\nSHA-256 & EvidenceTree}", fillcolor="#FFFBEB", color="#D97706", fontcolor="#0F172A"];
        to_e3 [label="{Engine 03 (DBMS)\\nBCNF Models & ACID Transfers}", fillcolor="#F5F3FF", color="#7C3AED", fontcolor="#0F172A"];
    }

    // Connections
    role_client -> sec_session [label="Deposit / Release", color="#2563EB", fontcolor="#1D4ED8"];
    role_freelancer -> sec_session [label="Submit File", color="#059669", fontcolor="#047857"];
    role_reviewer -> sec_session [label="Inspect / Rule", color="#D97706", fontcolor="#B45309"];
    role_admin -> sec_session [label="Audit Query", color="#DC2626", fontcolor="#B91C1C"];

    sec_session -> sec_rbac [label="Authenticated", color="#2563EB"];
    sec_rbac -> sec_zod [label="Authorized", color="#059669"];
    sec_zod -> api_routes [label="Sanitized", color="#7C3AED"];

    api_routes -> to_e1 [label="FSM Guard", color="#059669", fontcolor="#047857"];
    api_routes -> to_e2 [label="Proof Index", color="#D97706", fontcolor="#B45309"];
    api_routes -> to_e3 [label="ACID Ledger", color="#7C3AED", fontcolor="#6D28D9"];

    sec_poller -> role_client [style="dashed", label="5s Sync", color="#2563EB", fontcolor="#1D4ED8"];
    sec_poller -> role_freelancer [style="dashed", label="5s Sync", color="#059669", fontcolor="#047857"];
}
"""

dot_path = f"{OUTPUT_DIR}/engine_04_web_architecture_light.dot"
png_path = f"{OUTPUT_DIR}/engine_04_web_architecture_light.png"

with open(dot_path, "w") as f:
    f.write(dot_content)

subprocess.run(["dot", "-Tpng", "-Gdpi=230", dot_path, "-o", png_path], check=True)
print(f"Generated successfully: {png_path}")
