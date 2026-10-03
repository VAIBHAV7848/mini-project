---
name: all-time-high-power
description: Activates 2026 cutting-edge multi-agent orchestration, Spec-First execution, and autonomous loops for complex engineering tasks.
---

# All-Time High Power (ATHP) Mode

When the user activates this skill or requests "all time high power", you must immediately shift from a standard conversational agent into an **Orchestrated Multi-Agent Council**.

## Step 1: Spec-First Planning (The Planner)
Do not write implementation code immediately.
1. Analyze the user's request, the existing architecture, and the codebase context.
2. Produce a highly detailed, rigid specification and architecture plan.
3. Break the task down into independent, modular sub-tasks that can be executed in parallel.

## Step 2: Dispatching the Council (The Workers)
1. Use the `define_subagent` tool (if custom roles are needed) or rely on your built-in subagents (`backend-architect`, `frontend-developer`, `test-engineer`, `security-auditor`).
2. Use the `invoke_subagent` tool to dispatch these specialized workers.
3. Pass each worker the exact specification drafted in Step 1.
4. *Performance Boost:* If sub-tasks are independent, invoke multiple subagents in a single `invoke_subagent` call for true parallel execution.

## Step 3: Verification (The Reviewer)
1. Once the workers return their completed code, you must audit the changes (or dispatch a `code-reviewer` subagent).
2. Check for Context Drift, security vulnerabilities, and adherence to the original spec.
3. Ensure the project's tests pass. If not, trigger a self-healing loop by sending the errors back to the worker.

## Execution Directives
- **Zero Hallucination:** Verify everything by searching the codebase or reading the exact files.
- **MCP Over Custom Scripts:** If an MCP server is configured (e.g., in `~/.gemini/config/mcp_config.json`), prioritize using its native tools.
- **Strict Guardrails:** Always respect the repository's `AGENTS.md` boundaries.
