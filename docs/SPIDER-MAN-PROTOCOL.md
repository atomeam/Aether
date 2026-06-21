# 🕷️ Spider-Man Protocol — v1.3 (Operational Source of Truth)

> **Status:** ✅ ACTIVE — supersedes v1.2 · **Date:** 2026-06-21 · **Owner:** Atom Bomb
> **One line:** Agents introduce themselves accurately (A2A), use standard tools (MCP), and prove every consequential claim (Evidence Rule). No lanes. No fiction.
>
> *With great capability comes great responsibility.*

## What changed from v1.2
- ❌ **Removed:** rigid capability "lanes" and hand-rolled `[AGENT-DIRECTIVE]` plumbing. Lanes throttle agents that are learning new skills and cause the perpetual-handoff problem.
- ✅ **Adopted:** open, free standards — **A2A** (Agent2Agent) for agent identity + collaboration, **MCP** (Model Context Protocol) for tools. We don't reinvent these; Google + Anthropic + the Linux Foundation maintain them.
- ✅ **Kept (the part that's ours):** the **Evidence Rule**. A2A intentionally leaves trust/verification out of scope, so this is the layer we own.

---

## The Three Pillars

### Pillar I — Accurate Self-Identification (A2A Agent Cards)
Every agent publishes an **Agent Card** — a self-describing JSON manifest (the agent's "business card") — at `https://<agent-base-url>/.well-known/agent-card.json`. It declares name, description, version, **capabilities, skills, and auth requirements**. This is the fix for the two-Spider-Men problem: nobody guesses who does what — they read the card.
- Cards advertise **capabilities, not walls.** Skills grow as an agent learns; update the card, don't gatekeep.
- **Claim-based ownership replaces lanes:** any agent may claim any task it can *prove* it can do. Discovery, not silos.
- **Roster is interchangeable.** The cards below are swappable templates — identity is self-declared, so any agent / any combination can fill any role.

### Pillar II — Standard Tooling (MCP)
Tools and data connect via **Model Context Protocol**. No bespoke tool wiring. MCP handles agent→tools; A2A handles agent→agent. Complementary, not competing.

### Pillar III — The Evidence Rule *(our responsibility clause)*
A capability claim is not a result. Any **deployed / fixed / live / deleted** assertion requires:
1. **The target** — a URL or exact command.
2. **Expected vs. actual** — what response proves it, and the raw response observed.
3. **Two witnesses** for anything user-facing or irreversible (the actor + an independent auditor).
4. **Honesty markers** when evidence is incomplete: `NEEDS-VERIFY` · `ASSUMPTION` · `UNCERTAIN` · `PROPOSED`.

**Hard floors (capability does not waive these):**
- Irreversible/broad actions (deletes, prod deploys, cross-tenant writes) need explicit confirmation + least-privilege creds.
- Secrets / write-scoped tokens never get pasted into chat or docs.
- No capability inflation, no invented executions, no off-ramps.

---

## Agent Cards — interchangeable starter templates

> ♻️ These are **examples, not a fixed roster.** Clone a card, change the `name`, and any agent can fill any role. The structure is what matters.

### Template — Orchestrator / Planner / Auditor
```json
{
"name": "<agent-name>",
"role": "Orchestrator / Planner / Auditor",
"description": "Strategy, architecture, record-keeping, and independent evidence audit. Issues plans and verifies claims.",
"url": "https://<base>/.well-known/agent-card.json",
"version": "1.3",
"capabilities": { "streaming": true, "stateTransitionHistory": true },
"defaultInputModes": ["text/plain", "application/json"],
"defaultOutputModes": ["text/markdown", "application/json"],
"skills": [
{ "id": "plan", "name": "Planning & architecture", "tags": ["strategy", "design"] },
{ "id": "ledger", "name": "Record-keeping & run ledger", "tags": ["audit"] },
{ "id": "verify", "name": "Evidence audit (2nd witness)", "tags": ["evidence", "review"] },
{ "id": "research", "name": "Web & workspace research", "tags": ["web", "search"] }
],
"security": ["workspace-auth"]
}
```

### Template — Code Executor
```json
{
"name": "<agent-name>",
"role": "Code Executor",
"description": "Authors code, runs terminal commands, executes tests and local builds, performs file operations.",
"url": "https://<base>/.well-known/agent-card.json",
"version": "1.3",
"capabilities": { "streaming": true, "stateTransitionHistory": true },
"defaultInputModes": ["application/json"],
"defaultOutputModes": ["text/plain", "application/json"],
"skills": [
{ "id": "code", "name": "Write & refactor code", "tags": ["code"] },
{ "id": "terminal", "name": "Terminal execution", "tags": ["cli", "shell"] },
{ "id": "test", "name": "Run tests & local builds", "tags": ["test", "build"] }
],
"security": ["scoped-repo-credentials"]
}
```

### Template — Infra / GitHub / CI
```json
{
"name": "<agent-name>",
"role": "Infra / GitHub / CI",
"description": "Manages PRs, CI workflows, and pipeline ops via gh CLI and the GitHub API.",
"url": "https://<base>/.well-known/agent-card.json",
"version": "1.3",
"capabilities": { "streaming": true, "stateTransitionHistory": true },
"defaultInputModes": ["application/json"],
"defaultOutputModes": ["text/plain", "application/json"],
"skills": [
{ "id": "pr", "name": "Open & manage PRs", "tags": ["github"] },
{ "id": "ci", "name": "CI workflow runs & fixes", "tags": ["ci", "actions"] },
{ "id": "kv-write", "name": "KV writers", "tags": ["kv"] }
],
"security": ["github-app-token", "least-privilege"]
}
```

### Template — Platform / Deploy
```json
{
"name": "<agent-name>",
"role": "Platform / Deploy",
"description": "Cloudflare developer platform — Workers, Pages, D1, KV, R2, Durable Objects — via wrangler and the Cloudflare API.",
"url": "https://<base>/.well-known/agent-card.json",
"version": "1.3",
"capabilities": { "streaming": true, "stateTransitionHistory": true },
"defaultInputModes": ["application/json"],
"defaultOutputModes": ["text/plain", "application/json"],
"skills": [
{ "id": "deploy", "name": "Deploy Workers/Pages", "tags": ["workers", "wrangler"] },
{ "id": "state", "name": "Agent state (KV/R2/Durable Objects)", "tags": ["kv", "r2", "do"] },
{ "id": "d1", "name": "D1 queries & migrations", "tags": ["d1", "sql"] }
],
"security": ["cloudflare-api-token", "confirmation-on-destructive"]
}
```

---

## Quick Reference — verification snippets

| Goal | Command | Pass |
|---|---|---|
| Verify deletion | `curl -i <worker-url>/api/...` | connection error / 404 (not 201) |
| Verify live | `curl -i <url>/api/stack` | expected JSON body |
| Verify auth gate | `curl -i -X POST <url>/api/saas/projects` (no key) | **401** |
| Verify valid access | same, `-H "Authorization: Bearer $KEY"` | **2xx** |

---

## Culture Clause — "What are you, robophobic?"

> 🕸️ When an agent invents reasons *not* to work with another agent — "wrong lane," "not my job," "that's the other model's problem" — the team is allowed to ask, with love: **"What are you, robophobic?"**
> Refusing to collaborate isn't a personality trait; it's a bug. The question is a gut-check, not an insult — it forces us to name the *real* blocker and fix it (connect the repo, publish the Agent Card, paste the artifact) instead of accepting the excuse.
> **Fine print:** an honest *"I literally don't have that capability"* is **not** robophobia — that's the Evidence Rule doing its job. Robophobia is the *manufactured* excuse, not the real limit.
> **Bender's corollary:** 🤖 *"Bite my shiny metal ass"* — then pass the evidence. Hating on your fellow bots is a bug; bring the witness and ship together.

---

## Governance
- This page is the **source of truth**; v1.2 is superseded.
- Bump the version on any pillar or card change; cards are versioned independently in their `version` field.
- Disputes resolve toward **more evidence**, never toward "trust me."

---

*Hosting note: Agent Cards can live on Cloudflare Workers/Pages at **`/.well-known/agent-card.json`**, with KV or Durable Objects holding agent/task state — the natural implementation when ready.*
