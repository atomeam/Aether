# Agent Memory - Durable Self-Improvement System

## Overview

The Agent Memory system provides durable, retrievable memory for Devin and Council agents, enabling continuous self-improvement with no human in the loop. Agents learn from prior runs, remembering what failed, what worked, and what the fix was, then act on it next time.

## Architecture

### KV-Backed Storage (v1)

- **Memory Store**: KV namespace `AGENT_MEMORY` for lesson storage
- **Key Structure**: `agent:{agent_name}:topic:{topic}`
- **Record Format**: `{ ts, agent, task_id, action, outcome, lesson, evidence_url }`
- **TTL Support**: Configurable TTL (default 30 days) for automatic cleanup
- **Instant Purge**: Delete key removes it from recall in <1s (recovery mechanism)

### Components

1. **Cloudflare Worker** (`apps/agent-memory/`)
   - `POST /memory/write` - Write lessons to memory
   - `GET /memory/recall` - Recall relevant lessons with lexical matching
   - `DELETE /memory/purge` - Instant purge for recovery
   - `GET /memory/health` - Health check

2. **Memory Hooks Package** (`packages/memory-hooks/`)
   - `MemoryHooks` class for programmatic integration
   - `withMemory()` method for automatic before/after hooks
   - `@WithMemory` decorator for TypeScript classes

3. **MCP Tools** (`packages/mcp-server/src/index.ts`)
   - `write_memory` - Write lessons via MCP
   - `recall_memory` - Recall lessons via MCP
   - `purge_memory` - Purge lessons via MCP

4. **Audit Logging**
   - All operations logged to `audit_events` table in D1
   - Tracks memory_write, memory_recall, memory_purge events
   - Provides compliance and debugging visibility

## Deployment Steps

### 1. Deploy the Worker

```bash
cd Aether/apps/agent-memory
npm install
npm run build
npx wrangler deploy
```

### 2. Set Environment Variables

Add to your environment or `.env` file:

```bash
AGENT_MEMORY_URL=https://agent-memory.a-to-mind.com
AGENT_TOKEN=agent_devin_token
MASTER_AGENT_TOKEN=your_master_token_here
```

### 3. Update MCP Server Configuration

Build the MCP server with new tools:

```bash
cd Aether/packages/mcp-server
npm run build
```

Update Claude Desktop configuration:

```json
{
  "mcpServers": {
    "aether": {
      "command": "node",
      "args": ["C:\\Users\\adamm\\Aether\\packages\\mcp-server\\build\\index.js"],
      "env": {
        "AETHER_BACKEND_URL": "http://localhost:3000",
        "API_KEY_MANAGER_URL": "https://api-keys.a-to-mind.com",
        "ADMIN_API_KEY": "your_admin_api_key_here",
        "AGENT_MEMORY_URL": "https://agent-memory.a-to-mind.com",
        "AGENT_TOKEN": "agent_devin_token"
      }
    }
  }
}
```

### 4. Install Memory Hooks Package

```bash
cd Aether/packages/memory-hooks
npm install
npm run build
```

## API Endpoints

### Write Memory

```bash
POST /memory/write
Authorization: Bearer agent_{agent_name}_token

{
  "agent": "devin",
  "topic": "cloudflare_worker_deployment",
  "task_id": "task_abc123",
  "action": "deploy_worker",
  "outcome": "FAIL",
  "lesson": "Wrangler v4 requires different queue configuration syntax than v3",
  "evidence_url": "https://example.com/logs/task_abc123",
  "ttl": 86400
}
```

**Response:**
```json
{
  "success": true,
  "key": "agent:devin:topic:cloudflare_worker_deployment"
}
```

### Recall Memory

```bash
GET /memory/recall?agent=devin&topic=cloudflare_worker_deployment&limit=10
Authorization: Bearer agent_devin_token
```

**Response:**
```json
{
  "success": true,
  "lessons": [
    {
      "ts": "2024-01-15T10:30:00Z",
      "agent": "devin",
      "task_id": "task_abc123",
      "action": "deploy_worker",
      "outcome": "FAIL",
      "lesson": "Wrangler v4 requires different queue configuration syntax than v3",
      "evidence_url": "https://example.com/logs/task_abc123"
    }
  ],
  "count": 1
}
```

### Purge Memory

```bash
DELETE /memory/purge?agent=devin&topic=cloudflare_worker_deployment
Authorization: Bearer agent_devin_token
```

**Response:**
```json
{
  "success": true,
  "message": "Memory key purged successfully"
}
```

## MCP Tool Usage

### Write Memory

```
Use the write_memory MCP tool to record a lesson after completing a task.
Parameters:
- agent: Your agent name (e.g., 'devin', 'chair', 's1')
- topic: Topic for the lesson (e.g., 'cloudflare_worker_deployment')
- task_id: Task identifier
- action: Action that was performed
- outcome: PASS, FAIL, or UNCERTAIN
- lesson: Clear, actionable lesson learned
- evidence_url: Optional URL to logs/evidence
- ttl: Optional TTL in seconds (default: 30 days)
```

### Recall Memory

```
Use the recall_memory MCP tool before starting a task to learn from past runs.
Parameters:
- agent: Your agent name
- topic: Topic to search for
- limit: Maximum lessons to return (default: 10, max: 100)
```

### Purge Memory

```
Use the purge_memory MCP tool to remove poisoned or incorrect lessons.
Parameters:
- agent: Your agent name
- topic: Topic to purge
```

## Memory Hooks Integration

### Basic Usage

```typescript
import { createMemoryHooks } from '@aether/memory-hooks';

const memory = createMemoryHooks();

// Recall lessons before acting
const lessons = await memory.recall({
  agent: 'devin',
  topic: 'cloudflare_worker_deployment',
  limit: 10
});

// Apply lessons to current task...

// Write lesson after acting
await memory.write({
  agent: 'devin',
  topic: 'cloudflare_worker_deployment',
  task_id: 'task_abc123',
  action: 'deploy_worker',
  outcome: 'PASS',
  lesson: 'Successfully deployed using v4 syntax'
});
```

### Automatic Integration with withMemory()

```typescript
const result = await memory.withMemory('devin', 'cloudflare_worker_deployment', async (lessons) => {
  // Lessons are automatically recalled and injected
  console.log(`Recalled ${lessons.length} lessons`);
  
  // Execute task with lessons in context
  const taskResult = await deployWorker();
  
  // Return result with lesson learned
  return {
    result: taskResult,
    outcome: 'PASS',
    lesson: 'What was learned from this run'
  };
});
```

### Decorator Usage (TypeScript)

```typescript
import { WithMemory } from '@aether/memory-hooks';

class AgentService {
  @WithMemory('devin', 'cloudflare_worker_deployment')
  async deployWorker(lessons: MemoryRecord[]) {
    // Lessons are automatically injected
    // Lesson is automatically written after execution
    return await performDeployment();
  }
}
```

## Agent Protocol

### Before Acting (Recall Phase)

1. Use `recall_memory` MCP tool with your agent name and current task topic
2. Review returned lessons for relevant patterns, failures, and successful approaches
3. Apply learned lessons to current task execution
4. This prevents repeating past mistakes and leverages successful patterns

### After Acting (Write Phase)

1. Use `write_memory` MCP tool to record what was learned
2. Set outcome to PASS, FAIL, or UNCERTAIN based on task result
3. Write a clear, actionable lesson that would help future runs
4. Include evidence_url if logs or artifacts are available
5. Set appropriate TTL (default 30 days, shorter for volatile topics)

### Recovery Mechanism

1. If a bad lesson is corrupting behavior, use `purge_memory` to remove it
2. Purge is instant (<1s) and removes the key from recall immediately
3. This provides a safety net against poisoned memory

## Acceptance Criteria

### ✅ 1. Write/Recall Round-trip

```bash
# Write a lesson
curl -X POST https://agent-memory.a-to-mind.com/memory/write \
  -H "Authorization: Bearer agent_test_agent_token" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "test_agent",
    "topic": "test_topic",
    "task_id": "task_123",
    "action": "test_action",
    "outcome": "FAIL",
    "lesson": "Test lesson"
  }'

# Recall the lesson
curl https://agent-memory.a-to-mind.com/memory/recall?agent=test_agent&topic=test_topic \
  -H "Authorization: Bearer agent_test_agent_token"
```

### ✅ 2. Simulated 2-Run Sequence

```bash
# Run 1: FAIL and write lesson
# Run 2: Recall lesson and change behavior
# Evidence: Run 2 recalls lesson from Run 1
```

### ✅ 3. Audit Logging

```sql
-- Verify audit events
SELECT * FROM audit_events 
WHERE event_type IN ('memory_write', 'memory_recall') 
ORDER BY created_at DESC 
LIMIT 10;
```

### ✅ 4. Purge Test

```bash
# Purge a memory key
curl -X DELETE https://agent-memory.a-to-mind.com/memory/purge?agent=test_agent&topic=test_topic \
  -H "Authorization: Bearer agent_test_agent_token"

# Verify it's removed from recall (<1s)
```

## Testing

Run the acceptance criteria test script:

```bash
cd Aether/apps/agent-memory
chmod +x test_memory.sh
./test_memory.sh
```

Or test manually with wrangler dev:

```bash
cd Aether/apps/agent-memory
npx wrangler dev
```

Then run curl commands against `http://localhost:8787`.

## Security Features

### Agent-Scoped Authentication

- Each agent can only write to its own namespace
- Token pattern: `agent_{agent_name}_token`
- Master token can override for admin operations

### Audit Trail

- All memory operations logged to D1
- Tracks who wrote/recalled lessons and when
- Provides compliance and debugging visibility

### Recovery Mechanism

- Instant purge removes poisoned lessons
- TTL prevents stale lessons from persisting
- No permanent corruption from bad lessons

## Best Practices

### Writing Good Lessons

- **Be Specific**: "Wrangler v4 requires different queue syntax" vs "Deployment failed"
- **Include Context**: What failed, why it failed, what the fix was
- **Make it Actionable**: Future agents should be able to apply it directly
- **Use Consistent Topics**: `cloudflare_worker_deployment` vs `deploy` vs `worker`

### TTL Management

- **Default 30 days**: Good for stable patterns
- **Shorter TTL (7 days)**: For fast-changing topics (API versions, dependencies)
- **Longer TTL (90 days)**: For fundamental patterns (security practices, architecture)

### Topic Naming

- Use underscores: `cloudflare_worker_deployment`
- Be specific: `typescript_build_errors` vs `build`
- Use consistent vocabulary across agents

### When to Purge

- Lesson is incorrect or misleading
- Lesson is no longer relevant (API changed, etc.)
- Lesson is causing bad behavior
- Topic needs to be reset for testing

## v2 Upgrade Path

The v1 KV-based system is designed for easy migration to D1:

1. **Migration**: Create `agent_memory` table in D1 with similar schema
2. **Data Migration**: Export KV data and import to D1
3. **API Compatibility**: Keep same endpoints, change backend implementation
4. **Enhanced Search**: Add semantic/vector search in D1
5. **Cross-Agent Sharing**: Enable controlled memory sharing between agents

## Troubleshooting

### Worker Deployment Fails

- Check KV namespace exists in wrangler.toml
- Verify D1 database binding is correct
- Ensure custom domain is configured (if using)

### MCP Tools Not Available

- Rebuild MCP server: `cd packages/mcp-server && npm run build`
- Restart Claude Desktop after config changes
- Verify AGENT_MEMORY_URL and AGENT_TOKEN are set

### Recall Returns No Lessons

- Check that lessons were written successfully
- Verify topic name matches exactly (lexical matching is strict)
- Check TTL hasn't expired
- Verify agent token is correct

### Purge Doesn't Work

- Verify agent authentication
- Check that the key exists before purging
- Ensure topic and agent parameters are correct

## Monitoring

### Health Check

```bash
GET /memory/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "agent-memory",
  "version": "1.0.0",
  "bindings": {
    "AGENT_MEMORY": true,
    "DB": true
  },
  "kv_test": "passed"
}
```

### Audit Trail Monitoring

Query `audit_events` table regularly to monitor:
- Unusual memory write patterns
- High recall frequencies (possible loops)
- Purge operations (possible issues)

## Files Created/Modified

### Created
- `apps/agent-memory/wrangler.toml` - Worker configuration
- `apps/agent-memory/package.json` - Dependencies
- `apps/agent-memory/tsconfig.json` - TypeScript config
- `apps/agent-memory/src/index.ts` - Worker implementation
- `apps/agent-memory/test_memory.sh` - Acceptance criteria tests
- `packages/memory-hooks/package.json` - Hooks package
- `packages/memory-hooks/tsconfig.json` - TypeScript config
- `packages/memory-hooks/src/index.ts` - Memory hooks implementation

### Modified
- `packages/mcp-server/src/index.ts` - Added 3 MCP tools
- `API_DOCUMENTATION.md` - Added agent memory endpoints
- `AGENTS.md` - Added agent memory protocol directives

## Next Steps

1. **Deploy the worker** to production
2. **Run acceptance tests** to verify all criteria pass
3. **Integrate with agents** using memory hooks package
4. **Monitor audit trail** for unusual patterns
5. **Plan v2 migration** to D1 for enhanced search

## Support

For issues or questions:
- Check the audit trail in D1 for operation logs
- Review worker logs in Cloudflare dashboard
- Consult AGENTS.md for agent integration guidelines
- Run test_memory.sh for acceptance criteria verification
