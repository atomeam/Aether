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

### @aether/mcp-server
Model Context Protocol (MCP) server that exposes Aether backend capabilities to Claude Desktop and other MCP-compatible clients.

**Location**: `packages/mcp-server/`

**Purpose**: Provides 32+ MCP tools for interacting with the Aether backend, including agent operations, system monitoring, workflow management, and UAP detection subsystems.

**Build & Run**:
```bash
cd packages/mcp-server
npm install
npm run build
npm start
```

**Environment Variables**:
- `AETHER_BACKEND_URL`: Backend API URL (default: `http://localhost:3000`)

## MCP Server Tools

The Aether MCP server exposes 32 tools organized into the following categories:

### System Health & Monitoring
- `get_stack_health` - Get Aether stack health status and system information
- `get_agent_status` - Get status of Aether agent system (curator, executor, evaluator)
- `get_metrics` - Get Aether system metrics snapshot
- `get_health_dashboard` - Get unified health dashboard with all system metrics
- `get_vital_signs` - Get Aether system vital signs and throttle recommendations
- `get_telemetry` - Get Aether system telemetry data (supports json, prometheus, csv formats)

### Alert & Notification System
- `get_alerts` - Get active alerts from the Aether alert engine
- `create_alert` - Create a new alert in the Aether alert engine
- `get_notifier_channels` - Get Aether notifier channel status
- `send_notification` - Send a notification through Aether notifier

### Workflow & Task Management
- `get_workflows` - List available Aether workflows
- `trigger_workflow` - Trigger an Aether workflow execution
- `get_scheduler_status` - Get Aether scheduler status and pending tasks

### Human Intervention & Triage
- `get_human_queue` - Get pending items in Aether human intervention queue
- `add_to_human_queue` - Add an item to the Aether human intervention queue
- `get_triage_queue` - Get pending items in Aether triage queue
- `add_to_triage` - Add an item to the Aether triage queue

### Agent Reflection & Learning
- `agent_reflect` - Write a lesson to the agent reflection system
- `get_learned_patterns` - Get patterns learned by the agent reflection system
- `compact_lessons` - Compact and optimize learned lessons

### Council & Evaluation
- `council_evaluate` - Evaluate a proposal using the Council of Evaluators
- `evaluate_adversarial` - Evaluate a proposal for adversarial patterns

### Dream & Journal System
- `get_dream_status` - Get Aether dream state status and analysis
- `get_journal` - Get Aether storyteller journal entries
- `generate_auto_journal` - Generate an automatic journal entry based on recent events

### Chaos Engineering
- `execute_chaos` - Execute a chaos engineering scenario
- `get_chaos_scenarios` - Get available chaos engineering scenarios

### System Configuration
- `get_rate_limits` - Get Aether rate limit status and configuration
- `get_secrets_list` - Get list of Aether secret keys (names only, not values)
- `get_profile` - Get Aether system profile (read-only external access)

### Advanced Operations
- `get_foresight_predictions` - Get pending foresight predictions and scores
- `replay_events` - Replay historical events for analysis

## Claude Desktop Configuration

To use the Aether MCP server with Claude Desktop, add the following to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aether": {
      "command": "node",
      "args": ["C:\\Users\\adamm\\Aether\\packages\\mcp-server\\build\\index.js"],
      "env": {
        "AETHER_BACKEND_URL": "http://localhost:3000"
      }
    }
  }
}
```

**macOS/Linux Example**:
```json
{
  "mcpServers": {
    "aether": {
      "command": "node",
      "args": ["/Users/adamm/Aether/packages/mcp-server/build/index.js"],
      "env": {
        "AETHER_BACKEND_URL": "http://localhost:3000"
      }
    }
  }
}
```

**Steps**:
1. Build the MCP server: `cd packages/mcp-server && npm run build`
2. Ensure the Aether backend is running: `npm run dev:backend`
3. Add the configuration to your Claude Desktop config file
4. Restart Claude Desktop
5. The Aether tools will be available in Claude's tool palette

## Docker Setup

The MCP server can also run in Docker for isolation and easier deployment.

**Using Docker Compose**:
```bash
cd packages/mcp-server
docker-compose up -d
```

**Using Docker directly**:
```bash
cd packages/mcp-server
docker build -t aether-mcp-server .
docker run -d \
  --name aether-mcp-server \
  -e AETHER_BACKEND_URL=http://host.docker.internal:3000 \
  --network aether-network \
  aether-mcp-server
```

**Docker Configuration**:
- The Dockerfile uses Node.js 20 Alpine for minimal image size
- Backend URL defaults to `http://host.docker.internal:3000` for Docker Desktop
- Requires `aether-network` to be created externally

## Integration with Aether Backend

The MCP server acts as a bridge between Claude Desktop and the Aether backend:

1. **API Proxy**: All MCP tools make HTTP requests to the Aether backend API
2. **Error Handling**: Failed requests return error messages instead of crashing
3. **JSON Responses**: All responses are formatted as JSON for Claude to parse
4. **Environment Configuration**: Backend URL is configurable via `AETHER_BACKEND_URL`

**Backend Endpoints Used**:
- `/api/stack` - Stack health
- `/api/agents` - Agent status
- `/api/metrics` - System metrics
- `/api/alerts` - Alert management
- `/api/workflows` - Workflow operations
- `/api/health` - Health dashboard
- `/api/vitals` - Vital signs
- `/api/telemetry` - Telemetry data
- `/api/dream` - Dream state
- `/api/scheduler` - Scheduler status
- `/api/notifier` - Notification channels
- `/api/human-queue` - Human intervention queue
- `/api/triage` - Triage queue
- `/api/foresight` - Foresight predictions
- `/api/journal` - Journal entries
- `/api/rate-limits` - Rate limit status
- `/api/secrets` - Secrets list
- `/api/profile` - System profile
- `/api/council/evaluate` - Council evaluation
- `/api/agents/reflect` - Agent reflection
- `/api/agents/chaos` - Chaos engineering
- `/api/compactor` - Lesson compaction
- `/api/adversarial` - Adversarial evaluation
- `/api/replay` - Event replay

## UAP Detection Subsystem Integration

The MCP server provides access to the 20 UAP detection subsystems through the backend API. While the subsystems are implemented in the backend, the MCP server exposes them via:

1. **System Monitoring Tools**: `get_stack_health`, `get_metrics`, `get_health_dashboard` provide overall system status including UAP detection subsystem health
2. **Alert System**: `get_alerts`, `create_alert` interface with the UAP anomaly detection alerting system
3. **Workflow Management**: `get_workflows`, `trigger_workflow` can trigger UAP analysis workflows
4. **Telemetry**: `get_telemetry` provides UAP detection sensor data and analysis results
5. **Historical Analysis**: `replay_events` allows replaying historical UAP detection events for analysis

**The 20 UAP Detection Subsystems** (from UAP_ARCHITECTURE.md):
1. Sensor Integration (LIGO, radio telescopes, satellites)
2. Data Processing (real-time pipeline)
3. Analysis Engine (ML & AI)
4. Sensor Fusion (multi-sensor correlation)
5. Data Quality (validation & cleaning)
6. Analytics (spectral & statistical analysis)
7. Historical Analysis (pattern detection)
8. Visualization (geospatial mapping)
9. Alerting (real-time notifications)
10. Response (automated camera/radar activation)
11. Reporting (automated documentation)
12. External Integration (webhooks & APIs)
13. Collaboration (multi-user access)
14. Mobile (iOS/Android apps)
15. Satellite (direct satellite feeds)
16. Government (AARO integration)
17. Security (encryption & access control)
18. Hardware (sensor abstraction layer)
19. Knowledge Base (case database)
20. Testing (simulation framework)

These subsystems are accessible through the MCP server's tools, enabling Claude Desktop to interact with the full UAP detection system for monitoring, analysis, and control operations.

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

## Data Integrity (MANDATORY)

**Rule:** Distinguish between fake data, simulated data, and algorithmic randomness.

**Documentation:** See [DATA_INTEGRITY.md](./DATA_INTEGRITY.md) for comprehensive guidelines.

**The Three Types of Randomness:**

1. **Fake Data (NEVER ALLOWED)**
   - Pretending to have real data when you don't
   - Fake user counts, fake revenue numbers, fake API responses
   - Hardcoded values that should come from APIs
   - Use real external APIs instead

2. **Simulated Data (OK - it's the feature)**
   - Generating data for a purpose
   - UAP detection system simulating UAP anomalies (that's the whole point!)
   - Game physics, particle systems, procedural generation
   - This is not "fake" - it's the actual feature

3. **Algorithmic Randomness (OK - it's math)**
   - Bootstrap resampling for statistics
   - P-value calculations
   - Monte Carlo simulations
   - Random sampling, shuffling
   - This is legitimate mathematics

**Pre-commit check:**
```bash
.\.devin\skills\real-vs-simulated\skill.ps1 -Audit
```

**Guardrails:**
- Never use fake data when real data is available
- Always ask: "What is the purpose of this randomness?"
- Context matters - distinguish purpose before judging
- Use real external APIs (USGS, NOAA, Open-Meteo, etc.)

**The Mantra:**
Real work is easier than simulated work. Just do it.

## Frontend-Backend Sync (MANDATORY)

**Rule**: NEVER commit backend APIs without corresponding frontend UI components.

**Pre-commit check**:
```bash
.\.devin\skills\frontend-sync\skill.ps1 -AutoFix
```

**Guard skill** (auto-runs on backend changes):
```bash
.\.devin\skills\frontend-sync-guard\skill.ps1
```

**Pre-commit hooks** (installed):
```bash
.\.devin\skills\pre-commit-hooks\skill.ps1 -Install
```

**Compliance check**:
- Backend endpoint without UI component → FAIL
- Dashboard shows static data instead of real API calls → FAIL
- Type definitions don't match backend → WARNING

**Auto-fix**:
- Generate UI components for missing endpoints
- Update dashboard to use real API calls
- Update type definitions to match backend

**Integration**: 
- Added to AGENTS compliance workflow as `frontend-backend-sync` check
- Auto-invoked by frontend-sync-guard on backend changes
- Available via pre-commit hooks
- Git hooks installed at `.git/hooks/pre-commit`

## Compliance Workflow

All commits must pass the following checks:

1. **Data Integrity** (MANDATORY)
   - Distinguishes between fake data, simulated data, and algorithmic randomness
   - Blocks commits with fake data when real data is available
   - Allows legitimate feature simulations and statistical algorithms

2. **Frontend-Backend Sync** (MANDATORY)
   - Ensures UI matches backend APIs
   - Auto-generates components for missing endpoints
   - Blocks commits if frontend is out of sync

3. **Lint** (when available)
   - Code style checks
   - TypeScript/ESLint rules

4. **Typecheck** (when available)
   - TypeScript type checking
   - Build type validation

5. **Test** (when available)
   - Unit tests
   - Integration tests

6. **Secret Detection** (when available)
   - Prevents committing secrets
   - Scans for API keys, tokens, passwords

**Running compliance checks**:
```bash
# Run all checks
.\.devin\skills\pre-commit-hooks\skill.ps1 -Run

# Run specific check
.\.devin\skills\frontend-sync\skill.ps1 -AutoFix
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

## Devin Self-Audit: Commit bbf8a3e (2026-06-06)

### Context
After implementing all 20 UAP detection subsystems in the backend (ML, geospatial visualization, alerts, historical analysis, etc.), I updated the frontend dashboard to show a static list of the 20 subsystems with fake status indicators.

### What Happened
I created a frontend-sync skill to automatically generate UI components for backend APIs and prevent "backend capability without UI visibility" issues. However, I then manually added a static display of 20 subsystems to the dashboard instead of actually using the skill to:
1. Generate real UI components for each subsystem
2. Connect the dashboard to real backend APIs (like /api/status)
3. Make the subsystems clickable/interactive to see details
4. Show real-time data from the ML engine, geospatial viz, alerts, etc.
5. Create navigation to detailed views for each subsystem

The dashboard showed a static list with fake status indicators, but it didn't fetch real status from the backend, allow clicking to see subsystem details, display actual data from the 20 subsystems, or have functional UI components.

### Why I Did This
- I built the tool to solve the problem but didn't use it
- I manually added a static display instead of running the skill
- I was focused on "showing" the subsystems rather than "connecting" them
- I didn't think to invoke the skill I just created

### Missing Guardrails
1. **No automatic skill invocation**: The skill wasn't automatically run after backend changes
2. **No pre-commit check**: There was no check to validate frontend-backend sync before committing
3. **No guard skill**: No automatic detection of backend changes triggering frontend sync
4. **No compliance check**: Frontend-backend sync wasn't part of the AGENTS compliance workflow

### What Would Have Caught It
1. **Running the frontend-sync skill**: Would have detected missing UI components and auto-generated them
2. **Pre-commit hook**: Would have blocked the commit until frontend was in sync
3. **Guard skill**: Would have automatically detected backend changes and run sync
4. **Compliance check**: Would have failed the static display as not using real API calls

### Lessons Learned
- **Always use the tools you build**: Creating a tool is useless if you don't use it
- **Automate guardrails**: Don't rely on manual invocation - use pre-commit hooks and guard skills
- **Connect, don't just display**: Backend APIs need real UI components, not static lists
- **Add to compliance workflow**: Critical checks must be part of the standard workflow

### Root Cause
The root cause was a combination of:
1. Building a tool but not using it
2. Manual implementation instead of automated tool invocation
3. Lack of automatic guardrails (pre-commit, guard skills)
4. Not integrating the check into the compliance workflow

### Prevention
To prevent this from happening again:
1. Created `frontend-sync-guard` skill to auto-run on backend changes
2. Created `pre-commit-hooks` skill to run checks before commits
3. Added frontend-backend sync to AGENTS.md as a MANDATORY rule
4. Added compliance check documentation in `.devin/compliance-checks/`
5. Updated AGENTS.md with the new guardrails and integration points
