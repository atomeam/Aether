# Wix rail — ground truth (2026-06-12)

The `atomeam/wix` repo is a Wix Git Integration (Velo) project. The live storefront tracks its `main` branch: **git push = site publish, no secrets, no CLI auth**.

## Live (pushed, pending CI verification per issue #120)

- `GET /_functions/health` — publish-lane proof, version 2 (commit `1ec2e36`, bumped in `d24ec33`).
- `GET /_functions/offer` — machine-readable offer surface for apex/aether frontends.
- `POST /_functions/lead` — validates `{email, note}`, forwards to `https://bridge.a-to-mind.com/api/leads` (live D1 lead store) with `source=wix-storefront`.

## Rules for the wix repo

- Additive backend changes only; page-code/design edits need human approval — the store is live and earning (proven: $116, week of 6/3).
- Never push secrets. Velo Secrets Manager is human-gated — design around it.
- Verification belongs in CI (sandbox agents have no network): curl the endpoints from health-monitor.yml.

## Remaining tasks

Tracked in atomeam/Aether issue #120: find site domain → curl health (expect `version: 2`) → add to health-monitor.yml → confirm the buyable product is surfaced → wire pricing → checkout.

## Billing note

Billing relocation is ALREADY DONE in this repo: bridge worker serves `POST /api/billing/webhook` (Stripe signature-verified) and `GET /api/billing/key?session_id=`, tested by `scripts/verify-billing.mjs`. Do not add duplicate billing handlers. Outstanding: `STRIPE_WEBHOOK_SECRET` + Stripe Product/Price (issue #117) — optional while the Wix rail sells.
