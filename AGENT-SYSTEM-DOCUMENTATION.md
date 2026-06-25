# Aether Agent System - Comprehensive Documentation

## Overview
The Aether agent system is a sophisticated multi-agent architecture designed for autonomous AI operations, governance, and self-healing capabilities. Built as a Turborepo with 40+ packages, it provides a complete toolkit for building reliable, observable, and governed AI agents.

## Architecture

### Core Components

#### 1. Two-Agent System (Implemented)
```
User Request → Curator (validates) → APPROVED → Executor (runs tools) → Ledger
                                      → REJECTED → 422 error
```

**Components:**
- **Curator** - Default-deny security gate with allow-list and rate limiting
- **Executor** - Runs approved MCP tools and reports to ledger
- **Evaluator** - Watches ledger for patterns and suggests fixes
- **Ledger** - Execution ledger for audit trails

#### 2. MCP Tool Registry (Implemented)
9 sandboxed tools for agent operations:
- `file_read` - Read file contents (workspace-restricted)
- `file_write` - Write file contents (workspace-restricted)
- `git_status` - Check git repository status
- `git_commit` - Create git commits
- `git_diff` - Show uncommitted changes
- `http_request` - Make HTTP requests (GET/HEAD only)
- `lessons_write` - Write lessons to Lessons DB
- `get_agent_state` - Retrieve execution counts and failure rates
- `trigger_workflow` - Trigger predefined workflows
- `chaos_inject` - Inject synthetic failure patterns

#### 3. Advanced Features (Partially Implemented)

**Chaos Engineering:**
- Blast radius caps per cycle
- Quarantine for failed validations
- Canary deployment testing
- Auto-revert with checkpoint system
- Synthetic chaos injection (broken_package_json, corrupted_env_var, invalid_syntax, missing_dep, network_timeout)

**Operations:**
- Retry with exponential backoff
- Circuit breaker with state management
- Priority task queue
- Jitter for distributed systems

**Governance:**
- Audit middleware for decision logging
- Judge agent for offline evaluation
- Policy guardrails (confidence thresholds, latency limits)
- Decision record with intent/outcome tracking

**Daemon:**
- Autonomous background execution
- System health monitoring
- Issue scanning and resolution
- Throttled outbound outreach
- Autonomous Convene triggering

## Package Structure

### Core Agent Packages
- `@aether/mcp-tools` - MCP Tool Registry
- `@aether/curator` - Security gate
- `@aether/contracts` - Zod schemas
- `@aether/ledger` - Execution ledger
- `@aether/logger` - Logging system
- `@aether/metrics` - Metrics collection

### Advanced Feature Packages
- `@aether/chaos` - Chaos engineering
- `@aether/operations` - Retry, circuit breaker, task queue
- `@aether/governance` - Audit, judge, policy guardrails
- `@aether/daemon` - Autonomous background execution
- `@aether/kv-writers` - Cloudflare KV storage

### Supporting Packages
- `@aether/env` - Environment management
- `@aether/components` - Component library
- `@aether/context-truncate` - Context management
- `@aether/adversarial` - Adversarial testing
- `@aether/foresight` - Predictive analysis
- `@aether/panic` - Emergency response
- `@aether/tombstone` - Failure analysis
- `@aether/timecapsule` - State snapshots
- `@aether/replay` - Event replay
- `@aether/sandbox` - Code execution sandbox
- `@aether/rate-limiter` - Rate limiting
- `@aether/throttle` - Request throttling
- `@aether/network-health` - Network monitoring
- `@aether/telemetry` - Telemetry collection
- `@aether/human-queue` - Human intervention queue
- `@aether/secrets` - Secrets management
- `@aether/signed-provenance` - Signed provenance tracking
- `@aether/compactor` - Data compaction
- `@aether/dream` - Dream processing
- `@aether/goals` - Goal tracking
- `@aether/alerts` - Alerting system
- `@aether/council` - Council operations
- `@aether/convene` - Meeting/convene management
- `@aether/github-automation` - GitHub automation
- `@aether/scheduler` - Scheduling
- `@aether/storyteller` - Narrative generation
- `@aether/triage` - Issue triage
- `@aether/vitalsigns` - Health monitoring
- `@aether/curator-audit` - Curator auditing

## Integration Points

### Current Integration Status
- ✅ Executor imports MCP tools
- ✅ Evaluator reads from ledger
- ✅ Curator validates actions
- ✅ Ledger records all operations
- ⚠️ Agent loop not implemented
- ⚠️ Governance not enforced
- ⚠️ Chaos not integrated
- ⚠️ Daemon not connected

### Required Integrations
1. **Agent Loop** - Connect Curator → Executor → Evaluator → Reflector
2. **Governance** - Add audit middleware to executor
3. **Chaos** - Wire chaos injection to agent loop
4. **Operations** - Connect circuit breaker to actual system
5. **Daemon** - Connect to health checks and issue scanning

## API Endpoints

### Implemented
- `GET /api/agents` - Agent health check
- `GET /api/agents/evaluate` - Ledger pattern suggestions
- `POST /api/build` - Generate UI components
- `POST /api/test/curator` - Direct curator test
- `GET /api/stack` - Backend health
- `GET /api/nexus/*` - Integration proxy

### Planned
- `POST /api/agents/execute` - Execute approved action
- `GET /api/agents/loop/status` - Agent loop status
- `POST /api/governance/audit` - Capture decision intent
- `POST /api/governance/evaluate` - Evaluate decision
- `GET /api/daemon/status` - Daemon status
- `POST /api/chaos/inject` - Inject chaos scenario

## Environment Variables

### Required
- `GEMINI_API_KEY` - Google Gemini API key for AI operations

### Optional
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token (for Workers operations)
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `STRIPE_API_KEY` - Stripe API key (for billing)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

## Development Workflow

### Local Development
```bash
cd Aether
npm install
npm run dev:backend  # Terminal 1 - port 3000
npm run dev:frontend  # Terminal 2 - port 5173
```

### Testing
```bash
npm run test           # Run all tests
npm run typecheck     # Type check all packages
npm run build         # Build all packages
npm run smoke         # Smoke test endpoints
npm run verify:billing # Verify billing integration
```

### Deployment
```bash
# Vercel deployment
vercel --prod --yes

# Cloudflare deployment
cd apps/bridge
wrangler deploy

# Automated deployment
pwsh scripts/deploy.ps1 -Target both
```

## Security Considerations

### Implemented
- Workspace-restricted file operations
- Default-deny security gate (Curator)
- Rate limiting on generated UI
- Safe HTTP methods only (GET/HEAD)
- Chaos injection sandboxed

### Planned
- Policy guardrails enforcement
- Audit trail for all decisions
- Signed provenance tracking
- Secrets management integration

## Monitoring & Observability

### Implemented
- Ledger for execution tracking
- Metrics collection
- Health check endpoints
- Error pattern detection

### Planned
- Real-time agent loop monitoring
- Governance dashboard
- Chaos injection tracking
- Autonomous issue detection

## Troubleshooting

### Common Issues

**Wrangler Auth Conflicts**
- Symptom: "You are logged in with an API Token"
- Solution: Use Cloudflare Dashboard for manual operations
- Workaround: Clear environment variables and try OAuth login

**TypeScript Errors**
- Symptom: Build fails with type errors
- Solution: Run `npm run typecheck` to identify issues
- Common: Missing imports, incorrect types, undefined properties

**Package Resolution**
- Symptom: 404 errors for @aether/* packages
- Solution: Use `file:` dependencies in package.json
- Example: `"@aether/contracts": "file:../packages/contracts"`

**Stripe Integration**
- Symptom: Billing endpoints return 404
- Solution: Set STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET on bridge worker
- Location: Cloudflare Dashboard → Workers → Settings → Variables & Secrets

## Best Practices

### Development
1. **Type Safety** - Always run `npm run typecheck` before committing
2. **Testing** - Write tests for new packages and features
3. **Documentation** - Update AGENTS.md for architectural changes
4. **Security** - Use Curator for all generated content
5. **Observability** - Log all decisions to ledger

### Deployment
1. **Test Locally** - Verify smoke tests pass before deployment
2. **Incremental** - Deploy one component at a time
3. **Monitor** - Check health endpoints after deployment
4. **Rollback** - Keep previous deployment ready for quick rollback

### Agent Operations
1. **Validation** - Always use Curator before Executor
2. **Audit** - Capture intent before execution
3. **Evaluation** - Judge decisions after execution
4. **Learning** - Use Reflector to capture lessons
5. **Governance** - Enforce policy guardrails

## Future Roadmap

### Phase 1: Complete Core Integration (Current)
- Wire agent loop (Curator → Executor → Evaluator → Reflector)
- Integrate governance (audit middleware, policy enforcement)
- Connect daemon to health checks
- Complete chaos integration

### Phase 2: Advanced Features
- Implement autonomous issue resolution
- Add advanced chaos scenarios
- Complete operations features (circuit breaker, task queue)
- Build comprehensive testing suite

### Phase 3: Production Readiness
- Add comprehensive monitoring
- Implement alerting system
- Create operational dashboards
- Add disaster recovery procedures

### Phase 4: Optimization
- Simplify package structure
- Remove unused packages
- Optimize performance
- Improve documentation

## Related Documentation

- **Assessment:** C:\Users\adamm\Aether\AGENT-HUB-ASSESSMENT.md
- **Security:** C:\Users\adamm\Aether\SECURITY-VULNERABILITIES.md
- **Deployment:** C:\Users\adamm\Aether\scripts\deploy.ps1
- **Quest Testing:** C:\Users\adamm\QUEST-3S-IMMERSED-TESTING-GUIDE.md
- **Notion Content:** C:\Users\adamm\NOTION-AGENT-HUB-ASSESSMENT.md
- **AGENTS.md:** C:\Users\adamm\Aether\AGENTS.md

## Support

For issues or questions:
1. Check AGENTS.md for architecture details
2. Review assessment for current status
3. Check security vulnerabilities for known issues
4. Use deployment scripts for automated deployment
5. Follow troubleshooting guide for common issues

---

**Documentation Version:** 1.0
**Last Updated:** 2026-06-11
**Maintained By:** Devin (Cognition Labs)