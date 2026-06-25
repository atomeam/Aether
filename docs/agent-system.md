# Agent System

## Overview

AtoMind uses a multi-agent architecture for autonomous AI operations. The system includes specialized agents that work together to validate, execute, and evaluate tasks.

## Architecture

### Two-Agent System (Core)

```
User Request → Curator (validates) → APPROVED → Executor (runs tools) → Ledger
                                    → REJECTED → 422 error
```

### Extended System

```
User Request → Curator → Executor → Ledger
                       → Evaluator (watches ledger for patterns)
                       → Reflector (self-analysis and improvement)
                       → Daemon (autonomous background execution)
```

## Agents

### 1. Curator (`@aether/curator`)

**Role:** Security gate for all AI-generated actions.

**Responsibilities:**
- Validate actions against allow-list
- Enforce rate limits (max 10 actions per response)
- Log all decisions via `logCuratorVerdict()`
- Return 422 on denial

**Allow-List:**
```typescript
['stat', 'chart', 'list', 'status', 'gauge']
```

**Usage:**
```typescript
import { curateActions, logCuratorVerdict } from '@aether/curator';

const result = curateActions(actions, { maxActions: 10 });
if (!result.approved) {
  return res.status(422).json({ error: result.reason });
}
logCuratorVerdict(result);
```

### 2. Executor (`apps/backend/src/agents/executor.ts`)

**Role:** Runs approved MCP tools and reports to ledger.

**Responsibilities:**
- Execute approved actions via MCP tool registry
- Record execution results in ledger
- Handle execution errors gracefully
- Report metrics

**Execution Flow:**
1. Receive approved action from curator
2. Look up tool in MCP registry
3. Execute tool with parameters
4. Record result in ledger
5. Return execution result

### 3. Evaluator (`apps/backend/src/agents/evaluator.ts`)

**Role:** Watches ledger for patterns and suggests fixes.

**Responsibilities:**
- Analyze execution patterns
- Detect recurring failures
- Suggest improvements
- Track accuracy metrics

**Pattern Detection:**
- Repeated tool failures
- Performance degradation
- Resource usage anomalies
- Accuracy drift

### 4. Reflector (`apps/backend/src/agents/reflector.ts`)

**Role:** Self-analysis and continuous improvement.

**Responsibilities:**
- Analyze past decisions
- Identify improvement opportunities
- Generate lessons learned
- Update policies

### 5. Daemon (`@aether/daemon`)

**Role:** Autonomous background execution.

**Responsibilities:**
- Monitor system health
- Scan for issues
- Execute autonomous fixes
- Trigger council convene
- Throttled outbound outreach

## MCP Tool Registry

The MCP Tool Registry (`@aether/mcp-tools`) provides sandboxed tools for agent operations.

### Available Tools

| Tool | Description |
|------|-------------|
| `file_read` | Read file contents (workspace-restricted) |
| `file_write` | Write file contents (workspace-restricted) |
| `git_status` | Check git repository status |
| `git_commit` | Create git commits |
| `git_diff` | Show uncommitted changes |
| `http_request` | Make HTTP requests (GET/HEAD only) |
| `lessons_write` | Write lessons to Lessons DB |
| `get_agent_state` | Retrieve execution counts and failure rates |
| `trigger_workflow` | Trigger predefined workflows |
| `chaos_inject` | Inject synthetic failure patterns |

### Tool Invocation

```typescript
import { invokeTool } from '@aether/mcp-tools';

const result = await invokeTool('file_read', {
  path: '/path/to/file'
});
```

### Tool Registration

```typescript
import { registerTool } from '@aether/mcp-tools';

registerTool({
  name: 'my_tool',
  description: 'My custom tool',
  schema: myZodSchema,
  handler: async (params) => {
    // Tool implementation
    return { success: true, data: result };
  }
});
```

## Agent Loop

The agent loop (`apps/backend/src/agents/agent-loop.ts`) orchestrates agent execution.

### Loop Lifecycle

1. **Receive** — incoming request
2. **Curate** — validate with curator
3. **Plan** — determine execution steps
4. **Execute** — run tools via executor
5. **Evaluate** — check results
6. **Reflect** — learn from execution
7. **Record** — log to ledger

### Error Handling

- Retry transient failures (up to 3 times)
- Timeout after 5 minutes
- Circuit breaker on repeated failures
- Graceful degradation in degraded mode

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | Agent health status |
| `/api/agents/evaluate` | GET | Ledger pattern suggestions |
| `/api/build` | POST | Build request (triggers agent system) |
| `/api/test/curator` | POST | Direct curator test |

## Monitoring

### Agent Metrics

- Execution count (by tool)
- Success rate
- Average execution time
- Error rate
- Circuit breaker state

### Health Checks

- Agent loop status
- Tool availability
- Ledger connectivity
- Memory usage

## Configuration

### Environment Variables

```bash
GEMINI_API_KEY=...        # Required for AI routes
ALLOW_DEGRADED=1          # Allow boot without API key
```

### Curator Settings

```typescript
const CURATOR_CONFIG = {
  maxActions: 10,           // Max actions per response
  allowList: ['stat', 'chart', 'list', 'status', 'gauge'],
  rateLimitWindow: 60000,   // 1 minute window
  rateLimitMax: 10,         // Max requests per window
};
```

## Adding New Agents

1. Create agent file in `apps/backend/src/agents/`
2. Implement agent interface:
   ```typescript
   interface Agent {
     name: string;
     execute(input: any): Promise<AgentResult>;
     evaluate?(result: AgentResult): EvaluationResult;
   }
   ```
3. Register in agent loop
4. Add tests
5. Document in this file

## Adding New MCP Tools

1. Add tool definition to `packages/mcp-tools/src/index.ts`
2. Implement handler function
3. Add Zod schema for input validation
4. Add tests
5. Update this documentation