# 🏗️ Fable-Class Architecture — Replicating Frontier Capabilities via Orchestration

> **Status:** ✅ PROPOSED · **Date:** 2026-06-21 · **Companion to:** Spider-Man Protocol v1.3

## Core thesis
You **cannot** clone a frontier model's raw IQ with free models — that's a brute-force hardware problem. But **~80% of what makes a model feel "magical" is scaffolding** (autonomy, verification, planning), not raw reasoning. We reconstruct that 80% with an orchestra of free models, and escalate to a paid frontier model **only** for the small slice of genuinely hard single-shot reasoning.

## Capability mapping — free-model orchestra vs. Fable 5

| Fable 5 capability | Replaced via scaffolding? | Mechanism |
|---|---|---|
| Long-horizon autonomy | ✅ Mostly | Autonomy loops, persistent state, CI gates |
| Proactive self-verification | ✅ Fully | Evidence Rule (Spider-Man Protocol, Pillar III) |
| Sub-agent delegation | ✅ Fully | A2A Agent Cards + multi-agent routing |
| Vision (diagrams / PDFs) | ✅ Mostly | Routed to dedicated free vision models |
| Large-codebase coherence | 🟡 Partial | Context management + RAG (not raw model memory) |
| Frontier single-shot reasoning | ❌ Hard gap | Escalate to a paid frontier model (Bedrock / Azure Foundry / API) |

## The four layers of Fable-class orchestration

### 1. The Router Layer — the efficiency engine
A frontier model routes ~95% of work to itself. We **invert** it: **cheap by default, frontier on demand.**
- **Routine execution:** standard logic, formatting, and simple code go to free-tier models via OpenRouter / Fusion.
- **Edge-case escalation:** only the truly difficult, novel architectural leaps are routed to a paid frontier model.

### 2. The Ensemble — the Council
A single free model loses a reasoning battle to a frontier model. A **diverse ensemble** that debates and cross-checks narrows the gap.
- **Diversity is the cheat code:** blind spots rarely overlap across different model families.
- **Functional roles (interchangeable):** e.g. one model plans/orchestrates, one executes code, one runs adversarial review — per the v1.3 principle that the roster is swappable, not fixed.

### 3. Proactive Self-Verification — the Evidence Rule
The trust required for multi-day autonomous runs is built on **verifiable success criteria.**
- **Two-witness verification:** every loop has a concrete pass/fail target, confirmed by an independent reader — not the actor's own say-so.
- **Artifacts over assertions:** models must present URLs, expected-vs-actual results, or raw outputs before a phase is marked complete.

### 4. Long-Horizon Autonomy — state & infrastructure
Autonomy is an **infrastructure** problem, not an intelligence problem. "Self-healing" requires memory and environment awareness.
- **Persistent state:** Cloudflare Workers + D1 + R2 maintain context and run-ledgers across isolated agent instances.
- **CI gates:** hard stops that prevent runaway loops and pause for human review on irreversible actions.

## 🛑 The honest gap
The remaining **~20% — hard single-shot reasoning** — is where free models genuinely fall short (the gnarliest CS / architectural leaps). In practice only a small fraction of real tasks hit that ceiling, so frontier escalation stays **rare and cheap**. The fix is **strict routing, not forced capability inflation** — don't pretend a free model did something it didn't.

## Safety boundary
Much of the public "Fable 5" hype was about the **Mythos** configuration with safety classifiers *lifted* — which is precisely the export-restricted part. **This architecture rebuilds the *capability* (reasoning, autonomy, verification) but explicitly rejects bypassing guardrails.** The capability to act autonomously never waives the responsibility to act safely — same spirit as the Evidence Rule's hard floors.

---

*Provenance note: this doc's canonical source is the Notion page of the same name. A copy is considered VERIFIED in a repo only after the commit → mirror → independent-read loop completes.*
