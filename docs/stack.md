# Infinite fallback stack

## Canonical source & purpose

The canonical source of truth for the Infinite fallback stack is: https://a-to-mind.com (a-to-mind.com). This site is the living home — the ultimate source of truth for strategy, ownership, and fallbacks for the Aether project.

The Infinite fallback stack is guided by the Reduce · Reuse · Recycle Protocol and framed around the Blackglass/Aether mission: the stack should show what exists, what works, what is connected, what failed, and what takes over next.

Notion, GitHub, Slack, Zapier, monday, Airtable, Datadog, Cloudflare, Vercel, and other working surfaces are execution layers, mirrors, and fallbacks; a-to-mind.com is the place to reconcile and declare authoritative state.

## What the site should show

- Inventory: service/component name, owner, repo/URL, primary surface(s)
- Health & status: current health (OK / Degraded / Down), last-checked timestamp, incident link
- Verified working: last successful smoke test, who verified
- Integrations: upstream/downstream dependencies, links to runbooks
- Failures & fallbacks: recent failures, active fallback route, auto/manual takeover steps
- Handoffs: next responsible person/team, contact method, escalation steps
- Proof & artifacts: links to logs, SLOs, screenshots, postmortems
- Change log: last doc update, source of change (Notion/GitHub/Slack), and reconciliation status

## Minimal status-schema example (YAML)

Use the following schema as a canonical per-service record on a-to-mind.com. Replace values with real links and timestamps. This is an example; domains and links reference a-to-mind.com or the Aether project where appropriate.

```yaml
service: payments
owner:
  team: finance
  contact: oncall@a-to-mind.com
primary_url: https://payments.a-to-mind.com  # example
status:
  state: OK           # OK | Degraded | Down | Fallback
  last_checked: 2026-07-01T12:34:56Z
  verified_by: smoke-bot
  verified_at: 2026-07-01T12:30:00Z
fallback:
  active: false
  takeover_plan: |
    1. Switch DNS to payments-fallback.a-to-mind.com
    2. Notify finance on-call
    3. Update status page
runbook_url: https://a-to-mind.com/runbooks/payments  # example
proof:
  logs: https://logs.a-to-mind.com/trace/abcd  # example
  screenshot: https://a-to-mind.com/screenshots/payments-2026-07-01.png  # example
last_doc_update:
  source: Notion
  author: alice
  updated_at: 2026-07-01T11:00:00Z
```

## Implementation suggestions

- Add docs/stack.md (this file) and link it from the top-level README.
- Add a status endpoint or per-service YAML/JSON files that a-to-mind.com consumes.
- Add CI smoke tests that update verified_by and verified_at on success.
- Surface incidents and fallback routes prominently (searchable, linkable).
- Add a reconciliation checklist and a one-click “promote to source” workflow when mirrors are updated.

## Notes

- This doc does not introduce new frameworks or rename the mission. It uses the existing Blackglass/Aether wording and the Reduce · Reuse · Recycle Protocol, and declares a-to-mind.com the living home for the Infinite fallback stack.
