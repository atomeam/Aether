# Aether

Monorepo for the AtoMind platform (a-to-mind.com): an agent-operated
automation system built on npm workspaces + Turborepo.

## Architecture at a glance

| Layer | What | Where |
|-------|------|-------|
| Production edge | Cloudflare Workers + D1 serving the a-to-mind.com subdomains (bridge, home, billing, crew, grants, notion, alpha, ...) | `apps/*-worker`, `apps/bridge`, `apps/homebase`; see `docs/worker-catalog.md` |
| API backend | Express app (`@aether/backend`), deployed to Vercel via root `server.mjs` entry | `apps/backend`, `vercel.json` |
| Frontend | Vite + React SPA on the apex domain | `apps/frontend` |
| Shared libraries | env validation, logging, contracts, Curator safety gate, workflow engine, and others | `packages/*` |
| CI/CD | GitHub Actions (build, Vercel deploy, worker deploy, Slack run reports) | `.github/workflows` |
| Governance | Evidence-gated runs ledger (Notion), runbooks, retros | `docs/` |

## Quick start (local dev)

```bash
npm install
npm run dev:backend    # Express API on :3000
npm run dev:frontend   # Vite SPA on :5173
```

Backend requires a `.env` with `GEMINI_API_KEY` (see `.env.example`).

## Build & test

```bash
npm run build                      # turbo build, all workspaces
npm run build -w @aether/backend   # backend only (what Vercel runs)
npm run test                       # turbo test
npm run typecheck                  # turbo typecheck
```

To verify the backend serverless bundle boots under plain Node (this is
what Vercel runs — tsx hides broken imports):

```bash
npm run build -w @aether/backend && node apps/backend/dist/server.js
```

## Deployment

- **Vercel (`aether-production`)**: deploy root is the repo root.
  `vercel.json` builds only `@aether/backend`; `/server.mjs` re-exports
  the bundled app for the Express framework preset. `GEMINI_API_KEY`
  must be set in Vercel project env vars.
- **Cloudflare Workers**: `wrangler deploy` per app, or
  `.github/workflows/deploy-worker.yml`.

## Repo conventions

- Many `apps/` and `packages/` entries are agent-generated scaffolding
  at varying maturity. Check `docs/worker-catalog.md` for what is
  actually live before depending on anything.
- Background daemons (`daemon.ps1`, `learning-system.ps1`) run on the
  host and may touch repo files; stop them before manual git surgery.
- Runs are evidence-gated: deploys aren't "done" until the acceptance
  check passes (e.g. `/api/stack` returns 200) and the Notion runs
  ledger is updated.
