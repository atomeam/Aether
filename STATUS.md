# AtoMind — Status & Money Roadmap

_Updated 2026-06-10 by the council (Claude/Cowork session)._

## Live state

| Plane | Endpoint | Status |
|---|---|---|
| Cloudflare Worker | bridge.a-to-mind.com (/health, /api/stack) | ✅ LIVE, all bindings bound |
| Vercel apex | a-to-mind.com (SPA shell) | ✅ serves |
| Vercel apex APIs | a-to-mind.com/api/* | 🔧 FIXED in repo — redeploy required (see below) |

## What was fixed (2026-06-10)

1. `apps/aether-verifier`: `workspace:*` deps → `*` (npm install was failing for the entire monorepo).
2. `apps/backend/package.json`: wrong `file:../packages/*` paths → `file:../../packages/*`.
3. Backend esbuild config: workspace packages are now bundled (were externalized → unloadable TS at runtime).
4. `server.ts`: missing imports (`GoogleGenAI`, `EventEmitter`, `path`, vite via dynamic import).
5. `server.ts`: ~60 routes referenced `app` outside `startServer()` scope → `app` hoisted to module scope; serverless export added (`export default app`, no `listen` when `VERCEL` is set).
6. `packages/env`: new `ALLOW_DEGRADED=1` mode — missing GEMINI_API_KEY no longer kills the whole API plane.
7. `packages/foresight`: `correct++` on a const (shadowed counter) — accuracy was never counted.
8. `packages/logger`: missing `readRecords` export (evaluator agent import error).
9. `packages/sandbox`: `DEFAULT_PATH_POLICY` not exported (admin sandbox routes broken).
10. `packages/alerts`: `AlertEngine` missing `super()` → /api/alerts 500.
11. `vercel.json`: now builds the backend (`buildCommand`) and the bundle is committed (`.gitignore` exception).
12. Branding: index.html was titled "My Google AI Studio App" → proper AtoMind title/meta/OG tags.
13. Root cleanup: spec docs → `docs/specs/`, setup docs → `docs/setup/`.

All verified locally: backend boots in degraded mode, /api/health, /api/workflows, /api/alerts, /api/nexus/registry all return 200.

## To go live (human/owner steps)

1. `git push` (this clone has the commits; sandbox has no GitHub creds).
2. In Vercel project settings, set env vars: `GEMINI_API_KEY` (required for AI routes), `ALLOW_DEGRADED=1` (safety net), `NODE_ENV=production`.
3. Redeploy. Verify https://a-to-mind.com/api/health returns JSON.

## Money roadmap

The bridge worker already has **API-key tiers** (`getApiKeyTier`, hashed keys in STATE KV) — monetization scaffolding exists.

1. **Now:** lead capture on the landing page → atomicmoonbeam88@gmail.com; position as "AI agent ops, done for you".
2. **Next:** Stripe checkout issuing API keys into STATE KV (tier: free/pro). ProfitLoopMetrics component already references Stripe + HubSpot.
3. **Then:** productize the council (crew-room, weekly-digest, notion-worker apps) as a hosted automation dashboard subscription.

## Added 2026-06-10 (round 2)

- **Billing**: bridge routes `POST /api/billing/webhook` (Stripe signature-verified; checkout.session.completed → hashed API key in STATE KV, tier from metadata) and `GET /api/billing/key?session_id=` (one-time key retrieval). Needs `STRIPE_WEBHOOK_SECRET` wrangler secret + a Stripe Payment Link/Checkout with `metadata.tier`.
- **Leads**: bridge `POST /api/leads` → D1 `leads` table; SPA now has a pricing + contact section posting to it.
- **Webhook hygiene**: notion-webhook now skips bot-echo events and titleless junk; dedups and caps proposals/lessons snapshots at 200.
- **Proposal review**: new `POST /api/proposals/review` {id, action: approve|reject} — the 12 stuck proposals finally have a transition path.

## Stripe go-live staging (one pass, post-merge)

1. Stripe dashboard → Developers → Webhooks → Add endpoint: `https://bridge.a-to-mind.com/api/billing/webhook`, event `checkout.session.completed`. Copy the `whsec_...` signing secret.
2. `wrangler secret put STRIPE_WEBHOOK_SECRET` (bridge worker, via CI/operator — not the sandbox).
3. Create a Payment Link or Checkout for the Pro tier with `metadata.tier=pro`; set success URL to `https://a-to-mind.com/welcome?session_id={CHECKOUT_SESSION_ID}` (key retrieval uses that session_id).
4. Evidence: `STRIPE_WEBHOOK_SECRET=whsec_... npm run verify:billing` — 6 PASS lines expected.

## Known remaining issues

- ~~notion-worker unreachable~~ RESOLVED: it lives at notion.a-to-mind.com (healthy, verified 2026-06-10 23:06 UTC); the workers.dev alias is intentionally disabled. Duplicate route block in its wrangler.toml removed.
- Deployed bridge runs uncommitted local code (drift); standing rule: no `wrangler deploy` from local.
- Curator: 12 proposals stuck pending_review; notion-webhook writes junk rows (echo-loop suspicion).
- Backend tests fail under vitest due to env hard-exit — run with `ALLOW_DEGRADED=1`.
