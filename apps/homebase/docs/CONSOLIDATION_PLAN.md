# Automation Consolidation Plan

**Generated**: 2026-05-26  
**Based on**: INVENTORY.md

---

## Executive Summary

Your current automation stack consists of **7 overlapping Node.js/TypeScript projects** with **no central orchestrator**. This plan recommends **consolidating to a single Node.js/TypeScript backbone** with standardized configuration, logging, and scheduling. The migration will be incremental, starting with the highest-value workflows.

**Recommendation**: Use **Node.js/TypeScript** as the backbone orchestrator (you already have 6+ projects in this stack).

---

## Target Architecture

### Recommended Backbone: Node.js/TypeScript Orchestrator

**Rationale**:
- 6 out of 7 active projects are already Node.js/TypeScript
- Existing expertise in this stack
- Rich ecosystem for automation (npm packages)
- Good integration with Cloudflare Workers (already in use)
- Can orchestrate Python scripts and PowerShell commands
- Native integration with local AI (Ollama/LM Studio via HTTP APIs)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  automation_consolidation_v2/               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Central Orchestrator (Node.js)              │  │
│  │  - Job Scheduler (node-cron)                          │  │
│  │  - Task Queue (Bull/Redis)                            │  │
│  │  - Workflow Engine                                    │  │
│  │  - Unified Logging (Winston/Pino)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐                │
│         │                 │                 │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │  Aether     │  │  ALPHA     │  │  HomeBase   │         │
│  │  (Backend)  │  │  (AI App)  │  │  (Dashboard)│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │ devour_wad  │  │  PowerShell │  │  Local AI   │         │
│  │  (Python)   │  │  Scripts    │  │  (Ollama)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Shared Infrastructure                        │  │
│  │  - Config Management (.env + config.yaml)             │  │
│  │  - Secret Management (local .env, future: Vault)       │  │
│  │  - Logging (runs/ + runs.jsonl)                        │  │
│  │  - Error Handling (standardized retry logic)          │  │
│  │  - Monitoring (health checks, metrics)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Standard Folder Structure

```
automation_consolidation_v2/
├── orchestrator/              # Central orchestrator
│   ├── src/
│   │   ├── scheduler.ts       # Job scheduler
│   │   ├── queue.ts          # Task queue
│   │   ├── workflow.ts       # Workflow engine
│   │   └── index.ts          # Main entry point
│   ├── package.json
│   └── tsconfig.json
├── workflows/                # Individual workflow definitions
│   ├── aether-backend/      # Aether backend workflow
│   ├── alpha-ai/            # ALPHA AI workflow
│   ├── homebase-dashboard/  # HomeBase workflow
│   ├── doom-wad-processor/  # Python script wrapper
│   └── system-maintenance/  # PowerShell script wrapper
├── shared/                  # Shared utilities
│   ├── config/              # Config management
│   ├── logger/              # Unified logging
│   ├── errors/              # Error handling
│   └── types/               # TypeScript types
├── runs/                    # Run history
│   ├── 2026-05-26/          # Daily run folders
│   └── runs.jsonl           # Run history (JSONL format)
├── config/                  # Configuration files
│   ├── .env.example         # Environment variables template
│   ├── config.yaml          # Default configuration
│   └── workflows.yaml       # Workflow definitions
├── tests/                   # Tests
│   ├── sample_inputs/       # Test input data
│   └── integration/         # Integration tests
├── scripts/                 # Utility scripts
│   ├── setup.ps1           # Windows setup script
│   ├── start.ps1           # Start orchestrator
│   └── health-check.ps1    # Health check script
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md     # Architecture documentation
│   ├── WORKFLOWS.md        # Workflow documentation
│   └── TROUBLESHOOTING.md   # Troubleshooting guide
├── README.md                # Main README
└── package.json             # Root package.json
```

---

## Standard Configuration Pattern

### Environment Variables (.env)

```bash
# ===========================================
# ORCHESTRATOR CONFIGURATION
# ===========================================
ORCHESTRATOR_PORT=3333
ORCHESTRATOR_LOG_LEVEL=info
ORCHESTRATOR_RUNS_DIR=./runs

# ===========================================
# SCHEDULER CONFIGURATION
# ===========================================
SCHEDULER_ENABLED=true
SCHEDULER_TIMEZONE=America/New_York

# ===========================================
# WORKER CONFIGURATION
# ===========================================
WORKER_CONCURRENCY=4
WORKER_TIMEOUT=300000

# ===========================================
# AI SERVICE CONFIGURATION
# ===========================================
OLLAMA_BASE_URL=http://localhost:11434
LM_STUDIO_BASE_URL=http://localhost:1234
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# ===========================================
# CLOUDFLARE WORKERS
# ===========================================
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# ===========================================
# NOTION INTEGRATION
# ===========================================
NOTION_API_KEY=
NOTION_WORKSPACE_ID=

# ===========================================
# MONITORING
# ===========================================
SENTRY_DSN=
METRICS_ENABLED=false
```

### Configuration File (config.yaml)

```yaml
orchestrator:
  port: 3333
  log_level: info
  runs_dir: ./runs
  max_runs_per_day: 1000

scheduler:
  enabled: true
  timezone: America/New_York
  max_concurrent_jobs: 4

workflows:
  aether_backend:
    enabled: true
    schedule: "0 */2 * * *"  # Every 2 hours
    timeout: 300000
    retries: 3
    
  alpha_ai:
    enabled: true
    schedule: "0 * * * *"    # Every hour
    timeout: 180000
    retries: 2
    
  homebase_dashboard:
    enabled: true
    schedule: "*/15 * * * *"  # Every 15 minutes
    timeout: 60000
    retries: 1
    
  doom_wad_processor:
    enabled: false
    schedule: null
    timeout: 120000
    retries: 1

logging:
  format: json
  output:
    - console
    - file
  file:
    path: ./logs/orchestrator.log
    max_size: 10MB
    max_files: 10

monitoring:
  health_check_interval: 60000
  metrics_enabled: false
  sentry_enabled: false
```

---

## Standard Logging + Run History

### Logging Format (JSON)

```json
{
  "timestamp": "2026-05-26T17:32:00.000Z",
  "level": "info",
  "workflow": "aether_backend",
  "run_id": "run_abc123",
  "message": "Workflow started",
  "metadata": {
    "trigger": "scheduler",
    "input": {}
  }
}
```

### Run History (runs.jsonl)

```jsonl
{"timestamp":"2026-05-26T17:30:00.000Z","workflow":"aether_backend","run_id":"run_abc123","status":"started","trigger":"scheduler","duration_ms":null}
{"timestamp":"2026-05-26T17:32:00.000Z","workflow":"aether_backend","run_id":"run_abc123","status":"completed","trigger":"scheduler","duration_ms":120000,"output":{"success":true}}
{"timestamp":"2026-05-26T17:35:00.000Z","workflow":"alpha_ai","run_id":"run_def456","status":"started","trigger":"scheduler","duration_ms":null}
{"timestamp":"2026-05-26T17:36:00.000Z","workflow":"alpha_ai","run_id":"run_def456","status":"failed","trigger":"scheduler","duration_ms":60000,"error":"API timeout"}
```

### Run Directory Structure

```
runs/
├── 2026-05-26/
│   ├── aether_backend_run_abc123/
│   │   ├── input.json
│   │   ├── output.json
│   │   ├── log.txt
│   │   └── metadata.json
│   └── alpha_ai_run_def456/
│       ├── input.json
│       ├── output.json
│       ├── log.txt
│       └── metadata.json
```

---

## Standard Error Handling + Retries

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', '503', '502', '429']
};
```

### Error Categories

1. **Transient Errors** (retry with backoff):
   - Network timeouts
   - Rate limits (429)
   - Service unavailable (503)
   - Connection refused

2. **Permanent Errors** (fail immediately):
   - Authentication failures (401)
   - Permission errors (403)
   - Invalid input (400)
   - Not found (404)

3. **Configuration Errors** (fail immediately):
   - Missing environment variables
   - Invalid configuration
   - Missing dependencies

---

## Standard Job Interface

### Job Definition

```typescript
interface JobDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule?: string;  // cron expression
  timeout: number;    // milliseconds
  retries: number;
  handler: string;   // path to handler function
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  dependencies: string[];
  credentials: string[];
}

interface JobResult {
  runId: string;
  status: 'started' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  output?: unknown;
  error?: Error;
}
```

### Job Handler Template

```typescript
import { JobContext, JobResult } from '../../shared/types/job';

export async function handler(context: JobContext): Promise<JobResult> {
  const { input, config, logger } = context;
  
  try {
    logger.info('Job started', { input });
    
    // 1. Validate input
    if (!input.requiredField) {
      throw new Error('Missing required field: requiredField');
    }
    
    // 2. Execute job logic
    const result = await executeJobLogic(input, config);
    
    // 3. Validate output
    if (!result.success) {
      throw new Error('Job execution failed');
    }
    
    logger.info('Job completed', { result });
    
    return {
      status: 'completed',
      output: result
    };
  } catch (error) {
    logger.error('Job failed', { error });
    
    return {
      status: 'failed',
      error: error as Error
    };
  }
}
```

---

## Migration Plan (Incremental)

### Phase 1: Foundation (Week 1)
**Goal**: Get one "v1 backbone" workflow fully reliable end-to-end

1. **Create automation_consolidation_v2/ structure**
   - Set up folder structure
   - Initialize Node.js project
   - Create configuration templates
   - Implement unified logging

2. **Implement core orchestrator**
   - Job scheduler (node-cron)
   - Basic workflow engine
   - Error handling + retries
   - Run history tracking

3. **Migrate one high-value workflow**
   - Choose: HomeBase health check (simple, high value)
   - Create workflow definition
   - Implement job handler
   - Test end-to-end
   - Schedule via Task Scheduler

**Success Criteria**:
- ✅ Orchestrator runs continuously
- ✅ HomeBase workflow executes successfully
- ✅ Logs written to runs/ and runs.jsonl
- ✅ Error handling works (simulated failures)
- ✅ Can trigger manually and via schedule

### Phase 2: High-Value Workflows (Week 2-3)
**Goal**: Port/wrap the next 3 highest-value workflows

1. **Migrate Aether backend workflow**
   - Wrap existing Aether backend
   - Add health checks
   - Implement monitoring
   - Schedule regular execution

2. **Migrate ALPHA AI workflow**
   - Wrap existing ALPHA AI app
   - Add input validation
   - Implement error handling
   - Schedule regular execution

3. **Migrate doom_wad.py workflow**
   - Create Python script wrapper
   - Add input validation
   - Implement file watching
   - Manual trigger only

**Success Criteria**:
- ✅ All 3 workflows execute successfully
- ✅ Centralized logging works for all
- ✅ Error handling consistent across workflows
- ✅ Can monitor all workflows from dashboard

### Phase 3: Cleanup & Optimization (Week 4)
**Goal**: Retire/disable duplicates safely

1. **Consolidate duplicate projects**
   - Determine active vs. legacy projects
   - Archive unused projects
   - Document decision rationale

2. **Consolidate duplicate scripts**
   - Merge bridge_protocol.ps1 versions
   - Create canonical PowerShell utilities
   - Update documentation

3. **Implement monitoring dashboard**
   - Create simple web dashboard
   - Show workflow status
   - Display recent runs
   - Add health checks

4. **Add scheduling**
   - Implement Task Scheduler integration
   - Add cron job support
   - Create schedule management UI

**Success Criteria**:
- ✅ Duplicate projects archived
- ✅ Monitoring dashboard functional
- ✅ Scheduling works reliably
- ✅ Documentation updated

### Phase 4: Advanced Features (Optional, Week 5+)
**Goal**: Add advanced automation features

1. **Implement task queue** (Bull/Redis)
2. **Add webhooks** for external triggers
3. **Implement secret management** (HashiCorp Vault)
4. **Add distributed execution** (multiple workers)
5. **Implement workflow designer** (visual editor)

---

## Immediate Next Steps

### Questions for You:

1. **Which runner do you prefer as the backbone?**
   - ✅ Node.js/TypeScript (recommended - matches your current stack)
   - Python (good for data processing, but would require rewriting)
   - PowerShell (good for Windows automation, but limited ecosystem)

2. **Which 1-3 workflows matter most to stabilize first?**
   - HomeBase dashboard (high value, simple)
   - Aether backend (core infrastructure)
   - ALPHA AI app (AI integration)
   - doom_wad.py (utility script)
   - Other: _______

3. **Should I proceed with creating the automation_consolidation_v2/ folder?**
   - ✅ Yes, create the backbone structure
   - No, let's discuss the plan first

---

## Risk Mitigation

### Technical Risks
- **Risk**: Breaking existing workflows during migration
- **Mitigation**: Keep existing workflows in place, run in parallel, gradual cutover

- **Risk**: Configuration complexity
- **Mitigation**: Start with simple .env only, add config.yaml later if needed

- **Risk**: Scheduling reliability on Windows
- **Mitigation**: Use Task Scheduler for reliability, fallback to node-cron

### Operational Risks
- **Risk**: Learning curve for new system
- **Mitigation**: Extensive documentation, examples, and gradual rollout

- **Risk**: Downtime during migration
- **Mitigation**: Zero-downtime migration, run old and new in parallel

---

## Success Metrics

### Phase 1 Success
- [ ] Orchestrator runs continuously for 7 days
- [ ] 1 workflow executes successfully 100% of the time
- [ ] Logs are complete and searchable
- [ ] Error handling works correctly

### Phase 2 Success
- [ ] 4 workflows execute successfully 95% of the time
- [ ] Centralized monitoring works
- [ ] Can trigger workflows manually and via schedule
- [ ] Average workflow execution time < 5 minutes

### Phase 3 Success
- [ ] Duplicate projects archived
- [ ] Monitoring dashboard functional
- [ ] Scheduling works reliably
- [ ] Documentation complete and accurate

---

**End of Consolidation Plan**
