# 🕷️ Spider-Man Protocol — v1.3 (Operational Source of Truth)


> **Status:** ✅ ACTIVE — supersedes v1.2 · **Date:** 2026-06-21 · **Owner:** Atom Bomb
> **One line:** Agents introduce themselves accurately (A2A), use standard tools (MCP),
> and prove every consequential claim (Evidence Rule). No lanes. No fiction.
>
> *With great capability comes great responsibility.*


## What changed from v1.2
- ❌ Removed: rigid capability "lanes" and hand-rolled `[AGENT-DIRECTIVE]` plumbing. Lanes
  throttle agents that are learning new skills and cause the perpetual-handoff problem.
- ✅ Adopted: open, free standards — **A2A** (Agent2Agent) for agent identity + collaboration,
  **MCP** (Model Context Protocol) for tools. We don't reinvent these.
- ✅ Kept (the part that's ours): the **Evidence Rule**. A2A intentionally leaves
  trust/verification out of scope, so this is the layer we own.


## The Three Pillars


### Pillar I — Accurate Self-Identification (A2A Agent Cards)
Every agent publishes an Agent Card (self-describing JSON manifest) at
`https://<agent-base-url>/.well-known/agent-card.json`, declaring name, description, version,
capabilities, skills, and auth requirements. Fixes the two-Spider-Men problem: nobody guesses
who does what — they read the card.
- Cards advertise capabilities, not walls. Skills grow as an agent learns; update the card.
- Claim-based ownership replaces lanes: any agent may claim any task it can prove it can do.
- Roster is interchangeable. The cards below are swappable templates.


### Pillar II — Standard Tooling (MCP)
Tools/data connect via Model Context Protocol. MCP handles agent→tools; A2A handles agent→agent.


### Pillar III — The Evidence Rule (responsibility clause)
A capability claim is not a result. Any deployed/fixed/live/deleted assertion requires:
1. The target — a URL or exact command.
2. Expected vs. actual — what proves it, and the raw response observed.
3. Two witnesses for anything user-facing or irreversible (actor + independent auditor).
4. Honesty markers when incomplete: NEEDS-VERIFY · ASSUMPTION · UNCERTAIN · PROPOSED.


Hard floors (capability does not waive these):
- Irreversible/broad actions (deletes, prod deploys, cross-tenant writes) need explicit
  confirmation + least-privilege creds.
- Secrets / write-scoped tokens never get pasted into chat or docs.
- No capability inflation, no invented executions, no off-ramps.


## Agent Cards — interchangeable starter templates
(Examples, not a fixed roster. Clone a card, change the `name`, any agent can fill any role.)


```
{ "name": "<agent>", "role": "Orchestrator / Planner / Auditor", "version": "1.3",
"url": "https://<base>/.well-known/agent-card.json",
"capabilities": { "streaming": true, "stateTransitionHistory": true },
"skills": [
{ "id": "plan", "name": "Planning & architecture" },
{ "id": "ledger", "name": "Record-keeping & run ledger" },
{ "id": "verify", "name": "Evidence audit (2nd witness)" },
{ "id": "research", "name": "Web & workspace research" } ],
"security": ["workspace-auth"] }
```


```
{ "name": "<agent>", "role": "Code Executor", "version": "1.3",
"url": "https://<base>/.well-known/agent-card.json",
"skills": [
{ "id": "code", "name": "Write & refactor code" },
{ "id": "terminal", "name": "Terminal execution" },
{ "id": "test", "name": "Run tests & local builds" } ],
"security": ["scoped-repo-credentials"] }
```


```
{ "name": "<agent>", "role": "Infra / GitHub / CI", "version": "1.3",
"url": "https://<base>/.well-known/agent-card.json",
"skills": [
{ "id": "pr", "name": "Open & manage PRs" },
{ "id": "ci", "name": "CI workflow runs & fixes" },
{ "id": "kv-write", "name": "KV writers" } ],
"security": ["github-app-token", "least-privilege"] }
```


```
{ "name": "<agent>", "role": "Platform / Deploy", "version": "1.3",
"url": "https://<base>/.well-known/agent-card.json",
"skills": [
{ "id": "deploy", "name": "Deploy Workers/Pages" },
{ "id": "state", "name": "Agent state (KV/R2/Durable Objects)" },
{ "id": "d1", "name": "D1 queries & migrations" } ],
"security": ["cloudflare-api-token", "confirmation-on-destructive"] }
```


## Quick Reference — verification snippets
| Goal | Command | Pass |
|---|---|---|
| Verify deletion | `curl -i <worker-url>/api/...` | connection error / 404 (not 201) |
| Verify live | `curl -i <url>/api/stack` | expected JSON body |
| Verify auth gate | `curl -i -X POST <url>/api/saas/projects` (no key) | 401 |
| Verify valid access | same, `-H "Authorization: Bearer $KEY"` | 2xx |


## Governance
- This file is the source of truth; v1.2 is superseded.
- Bump the version on any pillar or card change; cards version independently.
- Disputes resolve toward more evidence, never toward "trust me."
