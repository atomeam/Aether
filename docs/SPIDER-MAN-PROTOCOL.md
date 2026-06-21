# 🕷️ Spider-Man Protocol v1.3

**With great capability comes great responsibility.**

## Overview

Spider-Man Protocol is the Aether team standard for multi-agent operations. It replaces custom JSON plumbing with open standards (A2A + MCP) while preserving the evidence rule — the one rule that's truly ours.

**v1.3 Changes:** Dropped the "lanes" abstraction. Replaced custom JSON-RPC transport with A2A protocol. Retained the evidence rule as our core responsibility clause.

---

## Three Pillars

### 1. A2A Agent Cards

Each agent introduces itself accurately. No more "wait, which one of us does this?"

**Standard Agent Card format:**

```json
{
  "agentId": "unique-id",
  "name": "Human-Readable Name",
  "capabilities": ["tool1", "tool2"],
  "version": "1.0.0",
  "owner": "team-or-individual",
  "contact": "handoff-endpoint"
}
```

**When to use:** On first contact, handoff, or when context is unclear.

---

### 2. MCP — Model Context Protocol

Everyone uses their real tools. No tool abstraction layers.

**Principle:** If MCP has a standard tool for it, use it. Don't hand-roll.

**Available MCP tools in Aether:**
- `file_read` / `file_write` — workspace-restricted
- `git_status` / `git_commit` / `git_diff`
- `http_request` — GET/HEAD only
- `get_agent_state` / `trigger_workflow`

---

### 3. The Evidence Rule

**The Spider-Man clause.** Any deployed / fixed / live claim needs:

1. **URL** — where to verify
2. **Expected vs Actual** — what should happen vs what happens
3. **Two witnesses** for irreversible actions** — deletion, deployment to production, credential rotation

**Example:**
> ✅ **CLAIM:** Worker `aether-bridge-saas` deleted
> **URL:** `https://aether-bridge-saas.atomicmoonbeam88.workers.dev/`
> **Expected:** HTTP 404
> **Actual:** HTTP 404
> **Witness:** `curl` output in commit `abc123`

---

## Agent Cards — Aether Stack

### Axiom Agent
```json
{
  "agentId": "axiom",
  "name": "Axiom",
  "role": "Primary orchestrator",
  "capabilities": ["planning", "delegation", "verification"],
  "version": "1.3.0"
}
```

### Devin Agent
```json
{
  "agentId": "devin",
  "name": "Devin",
  "role": "Code executor",
  "capabilities": ["terminal", "git", "file_ops", "browser"],
  "version": "1.3.0"
}
```

### Evaluator Agent
```json
{
  "agentId": "evaluator",
  "name": "Evaluator",
  "role": "Code review and quality gate",
  "capabilities": ["static_analysis", "test_review", "pattern_detection"],
  "version": "1.3.0"
}
```

### Curator Agent
```json
{
  "agentId": "curator",
  "name": "Curator",
  "role": "Security gate and request validation",
  "capabilities": ["allowlist_filtering", "rate_limiting", "input_validation"],
  "version": "1.3.0"
}
```

---

## Quick Reference

| Check | Command |
|-------|---------|
| Verify worker deleted | `curl -s -w "%{http_code}" <url>` → expect 404 |
| Verify endpoint live | `curl -s <url>` → expect JSON |
| Verify auth gate | `curl -s -X POST <url> -d '{}'` → expect 401 |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.3 | 2026-06-21 | Drop lanes, adopt A2A, keep evidence rule |
| 1.2 | 2026-06-19 | Add lanes abstraction |
| 1.1 | 2026-06-15 | Initial MCP integration |
| 1.0 | 2026-06-01 | Original protocol |

---

*Spider-Man Protocol v1.3 — because we know what it's like to have power we didn't ask for.*
