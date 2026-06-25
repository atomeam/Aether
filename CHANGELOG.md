# Changelog

All notable changes to the AtoMind platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Bridge worker `wrangler.toml`: removed duplicate `[browser]` binding
- Bridge worker `wrangler.toml`: removed duplicate `[[routes]]` section
- Backend `packages/alerts`: fixed missing `super()` call in AlertEngine
- Backend `packages/sandbox`: fixed missing `DEFAULT_PATH_POLICY` export
- Backend `packages/logger`: fixed missing `readRecords` export
- Backend `packages/foresight`: fixed `correct++` on const (shadowed counter)
- Backend `server.ts`: fixed missing imports (`GoogleGenAI`, `EventEmitter`, `path`)
- Backend `server.ts`: fixed ~60 routes referencing `app` outside `startServer()` scope
- Backend `packages/env`: added `ALLOW_DEGRADED=1` mode for missing API keys
- Vercel `vercel.json`: now builds the backend with `buildCommand`
- Frontend `index.html`: branding updated from generic title to AtoMind

### Added
- `.editorconfig` for consistent editor formatting
- `.prettierrc` and `.prettierignore` for code formatting
- `LICENSE` file (Apache 2.0)
- `CHANGELOG.md` — this file
- `CONTRIBUTING.md` — contribution guidelines
- Bridge worker billing routes: `POST /api/billing/webhook`, `GET /api/billing/key`
- Bridge worker leads route: `POST /api/leads`
- Bridge worker proposal review: `POST /api/proposals/review`
- `STATUS.md` — project status and money roadmap
- `DEPLOYMENT-CHECKLIST.md` — deployment steps
- `SECURITY-VULNERABILITIES.md` — npm audit report

### Changed
- Backend esbuild config: workspace packages are now bundled (were externalized)
- Root `docs/specs/` — spec docs moved from root
- Root `docs/setup/` — setup docs moved from root

## [0.1.0] - 2026-05-19

### Added
- Initial monorepo structure with Turborepo
- Two-agent system: Curator (validates) → Executor (runs tools)
- MCP Tool Registry with 9 sandboxed tools
- Evaluator agent for pattern detection
- Ledger for execution audit trails
- Frontend React dashboard (Vite + TypeScript)
- Bridge Cloudflare Worker for webhook relay
- Shared Zod contracts (`@aether/contracts`)
- Curator security gate (`@aether/curator`)
- Chaos engineering package (`@aether/chaos`)
- Operations package (retry, circuit breaker, task queue)
- Governance package (audit, judge, policy guardrails)
- Daemon package for autonomous background execution
- 35+ shared packages across the monorepo
- 40+ worker applications