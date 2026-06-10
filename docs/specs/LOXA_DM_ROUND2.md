# Loxa DMs - Round 2 (Convene-First)

*Revised after building Convene — the cross-assistant coordination layer.*
*Ready to send: morning launch.*

---

## DM 1: The Hook

**To:** [Stripe power user, +$10k GMV]
**Subject:** Your AI tools are having meetings about your errors

Hey [name] —

Saw your thread on the Stripe webhook thread. Here's what I'd have built into that:

**"Your AI tools don't just have memory. They have meetings."**

That's Loxa. When a webhook fails, the Stripe assistant, your codebase, and the predictive system each weigh in. Within 2 seconds, you get one recommendation — not five pinged notifications.

The webhook fails → they convene → you approve one ticket.

Want me to show you the demo? It takes 60 seconds to understand why this is different from every other AI product you've tried.

—

[Adam]

---

## DM 2: The Demo Pivot

**To:** [Intercom user, 500+ tickets/month]
**Subject:** What if your support bots talked to each other?

One thing I'd test with you:

**Play the demo. Watch what happens when three AI assistants deliberate through one shared context layer.**

We built Loxa because every tool you connect (Stripe, Intercom, your custom GPTs, Sentry) has partial information. Alone, they surface tickets. Together, they deliberate.

The last line of output says it all: *"Your AI tools don't just have memory. They have meetings."*

Want to see it fire in your stack?

—

[Adam]

---

## DM 3: The Technical Hook

**To:** [Cursor/VS Code power user]
**Subject:** What if your linter met your support bot?

Quick concept test:

```
Stripe webhook fails → 
  → Stripe assistant votes: "refund"
  → Your codebase (Aether) votes: "escalate"  
  → Predictive system votes: "wait"
  → Consensus: 65% → Human approval
```

That's Loxa's Convene layer. Every tool with context weighs in before you get pinged.

The bumper sticker: *"Your AI tools don't just have memory. They have meetings."*

Worth a 60-second demo to show you how it wires in?

—

[Adam]

---

## DM 4: The Question

**To:** [SRE/DevOps, on-call]
**Subject:** What if your alerts had a council?

Late-night PagerDuty hits. Your current flow: alert → you → triage → fix.

What if it was: alert → Convene (3 systems vote) → you get one ticket with attributed votes?

That's Loxa. The escalation becomes a *deliberation*, not just a notification.

The demo shows the full flow. Want it in your inbox Thursday morning?

—

[Adam]

---

## DM 5: The Closer

**To:** [Figma/Notion/Linear power user]
**Subject:** The tool that makes your AI tools smarter together

Here's what's wild:

We built a memory layer (every AI tool learns). Then a coordination layer (they deliberate). Then a containment layer (they can't break out).

The product line: *"Your AI tools don't just have memory. They have meetings."*

It's the first AI product that gets *more useful* the more tools you connect. 3 tools = 3 votes in the council.

Demo tomorrow? 60 seconds and you'll see why the inbox problem changes.

—

[Adam]

---

## Quick Stats for Your Pitch

- **40 packages** in the stack
- **Convene:** 6 scopes (payments, support, code, infrastructure, calendar, general)
- **Sandbox:** Per-tenant isolation, enforced
- **Audit:** Hash-chained, tamper-evident
- **Panic button:** One-call lock-down

---

## Metadata

*Revision: 2 (Convene-first)*
*Built: After shipping @aether/convene (commit 734eadf)*
*Demo: packages/chaos/src/demo-script.ts*
*Fire drill: packages/chaos/src/fire-drill.ts*