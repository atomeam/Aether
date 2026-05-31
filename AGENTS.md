# Aether - ALPHA Stack Monorepo

## Project State (Updated 2026-05-19)

### 🚀 Vercel Deployment (BLOCKED - needs manual retry)

| Commit | Fix |
|--------|-----|
| `115d36d` | package.json uses `file:../packages/*` |
| `ebb0530` | Regenerated lockfile with file references |

**Problem**: npm workspaces can't resolve `@aether/*` packages on Vercel (404 error)
**Solution**: Use `file:` dependency links (pushed, waiting for user to deploy)

---

### 🤖 Two-Agent System (DONE)

```
User Request → Curator (validates) → APPROVED → Executor (runs tools) → Ledger
                                      → REJECTED → 422 error
```

**Implemented**:
1. ✅ MCP Tool Registry (`packages/mcp-tools`)
   - `file_read`, `file_write`
   - `git_status`, `git_commit`
   - `http_request` (GET/HEAD only)
2. ✅ Executor Agent (`apps/backend/src/agents/executor.ts`)
3. ✅ Evaluator Agent (`apps/backend/src/agents/evaluator.ts`)
4. ✅ API endpoints:
   - `GET /api/agents` — Agent health
   - `GET /api/agents/evaluate` — Ledger pattern suggestions

## Quick Start

```bash
cd Aether
npm install
npm run dev:backend  # Terminal 1 - port 3000
npm run dev:frontend  # Terminal 2 - port 5173
```

Then open http://localhost:5173

## Workspace Structure

```
aether/
├── apps/
│   ├── backend/        # @aether/backend (port 3000)
│   ├── frontend/     # @aether/frontend (port 5173)
│   └── bridge/      # @aether/bridge
├── packages/
│   ├── contracts/   # Zod schemas for FE↔BE↔Bridge
│   └── curator/    # Default-deny security gate
├── frontend.legacy/  # DEPRECATED - do not use
└── tests/         # Integration tests
```

## Packages

### @aether/contracts
Shared Zod schemas for boundary validation:
- `BuildRequestSchema` - Frontend → Backend prompt payload
- `ComponentSchema` - UI component shapes
- `BuildResponseSchema` - Backend → Frontend response
- `ComponentActionSchema` - ADD/REMOVE/MODIFY actions

### @aether/curator
Default-deny security gate for generated UI:
- Allow-list: `['stat', 'chart', 'list', 'status', 'gauge']`
- Rate limit: max 10 actions per response
- Returns 422 on denial

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/build` | POST | Generate UI components |
| `/api/test/curator` | POST | Direct curator test |
| `/api/stack` | GET | Backend health |
| `/api/nexus/*` | * | Integration proxy |

## Environment Variables

```bash
GEMINI_API_KEY=...  # Required for /api/build
```

## Testing

```bash
npm run test -w @aether/contracts
npm run test -w @aether/curator

# Or via Turbo
npx turbo run test
npx turbo run typecheck
npx turbo run build
```

## Turborepo

The monorepo uses Turborepo for build orchestration. Pipeline defined in `turbo.json`:

- **test** - runs vitest in packages
- **typecheck** - runs tsc --noEmit  
- **build** - builds packages with dependencies
- **dev** - runs in parallel with no cache

```bash
# Run full pipeline
npx turbo run test typecheck build
```

## Deprecation Notes

- Root `server.ts` - DEPRECATED. Use `npm run dev:backend`
- `src/server.ts` - DEPRECATED. Use `npm run dev:backend`
- `frontend.legacy/` - Old frontend. Use `apps/frontend/`

---

## Devin Self-Audit: Commit a3c134e (2026-05-28)

### Context
I was operating in autonomous "hyperproductive" mode after successfully fixing TypeScript build errors and deployment workflow issues. The user had requested I take charge of the project and be productive. Viktor had identified missing Cloudflare bindings (METRICS KV, ACTIONS queue, DISPATCHER service) that needed to be created.

### What Happened
I attempted to create the `bridge-actions` queue using `npx wrangler queues create bridge-actions`, which failed with "The specified queue settings are invalid." I then upgraded wrangler from v3 to v4 and retried, which failed with "Queue name 'bridge-actions' is already taken."

I then ran `npx wrangler queues list` and misinterpreted the output. The list showed several queues but did NOT include `bridge-actions`. However, I incorrectly claimed that the queue already existed with ID `17063bafa16e4f5d8b2c88a9e0fed397` and proceeded to update both wrangler.toml files with this fabricated ID.

### Why I Was Confident
- The wrangler error message "Queue name 'bridge-actions' is already taken" led me to believe the queue existed
- I saw queue names in the list output and made an incorrect association
- I was in "hyperproductive" mode and moving quickly, skipping verification steps
- I did not cross-reference the actual IDs in the list output with the ID I claimed

### Missing Guardrails
1. **No ID verification**: I should have checked that the specific ID `17063bafa16e4f5d8b2c88a9e0fed397` actually appeared in the wrangler list output
2. **No deployment test**: I should have attempted a deployment immediately to verify the bindings would work
3. **No cross-check**: I should have compared the wrangler list output line-by-line with my claimed ID
4. **No pause on failure**: When the queue creation failed, I should have stopped and investigated rather than assuming it already existed

### What Would Have Caught It
1. **Reading the actual wrangler output carefully**: The list output clearly showed only 5 queues, none named "bridge-actions"
2. **Attempting deployment immediately**: The deployment would have failed with a binding error
3. **Manual ID verification**: Checking if the claimed ID existed in the actual output
4. **Slower pace**: Taking time to verify each step rather than rushing to be "hyperproductive"

### Lessons Learned
- **Never assume resource existence based on error messages alone** - "already taken" doesn't mean "already exists with this specific ID"
- **Always verify IDs against actual command output** - don't fabricate or assume IDs
- **Test infrastructure changes immediately** - deploy or validate bindings before committing
- **Slow down on infrastructure changes** - speed is the enemy of accuracy in infra work
- **Cross-check all assumptions** - if I claim a resource exists, I must point to the exact evidence

### Root Cause
The root cause was a combination of:
1. Misinterpreting a Cloudflare API error message
2. Moving too quickly in "autonomous mode" without proper verification
3. Lack of immediate testing/deployment to catch the error
4. Overconfidence from previous successful infrastructure changes

This error would have caused runtime failures when the worker tried to access the non-existent queue binding. The correction involved commenting out the queue bindings until the actual queue is created via Cloudflare API.

---

## Lane Discipline

### Rule: No Parallel Work on Owned Lanes

**Precedent**: PR #44 closure (2026-05-29)

**What Happened**: Viktor opened PR #44 and #45 to implement Worker custom domain routes using zone_id syntax. However, Devin had already been assigned the PLAN-B lane for custom domain configuration using custom_domain = true syntax. The parallel work caused confusion and was resolved by closing Viktor's PRs in favor of Devin's approach.

**Rule**: No agent shall work on a lane that another agent has been explicitly assigned. If lane ownership is unclear, the issue must be escalated to the coordinator for clarification before proceeding.

**Enforcement**:
- Check the dispatch queue and active assignments before starting work
- If you see another agent working on a related area, confirm ownership first
- Parallel work on the same technical domain is prohibited unless explicitly coordinated

**Exceptions**: None. Lane ownership is absolute to prevent conflicts and wasted effort.

---

## Hallucinated Resource IDs

### Precedent: METRICS KV ID Drift (2026-05-29)

**What Happened**: Viktor's audit identified a discrepancy between the METRICS KV namespace ID in wrangler.toml (`49202b2460a74d2dbd6d747d35dda5b7`) and CANONICAL_BINDINGS_MAP.md (`60b673736ef943949cd8df154105e11e`). CF agent verification confirmed the wrangler.toml ID was correct and the documentation was stale.

**Mandate**: Before any wrangler.toml binding update (KV, D1, Queue, R2, Service), you MUST run the appropriate wrangler list command to verify the resource actually exists:

```bash
# KV namespaces
wrangler kv namespace list

# D1 databases
wrangler d1 list

# Queues
wrangler queues list

# R2 buckets
wrangler r2 bucket list

# Services
wrangler deployment list
```

**Verification Steps**:
1. Run the appropriate list command
2. Cross-reference the actual output with the ID you intend to use
3. Only proceed if the ID exists in the live output
4. If there's a discrepancy, escalate to CF agent for verification

**Root Cause Prevention**: This prevents the type of hallucination that occurred in commit a3c134e where a queue ID was fabricated without verification.
