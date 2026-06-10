# Phase 2: Cloudflare Workers Migration Plan

## Overview
Move the relay poller from local file-based system to Cloudflare Workers with D1 database for reliability and scalability.

## Current State
- File-based relay database (manual JSON files)
- Local relay_poller.js script
- Manual Windows Task Scheduler setup
- No centralized logging
- No automatic scaling

## Target State
- Cloudflare Worker with cron trigger
- D1 database for relay queue
- KV for state/locks
- Centralized logging
- Automatic scaling
- No local machine dependency

## Implementation Steps

### Step 1: Create D1 Database Schema

**File:** `apps/relay/migrations/0001_relay_queue.sql`

```sql
-- Relay queue table
CREATE TABLE IF NOT EXISTS relay_tasks (
  id TEXT PRIMARY KEY,
  assigned_to TEXT NOT NULL,
  assigned_from TEXT,
  task TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  deadline TEXT,
  status TEXT DEFAULT 'unread',
  assigned_at TEXT NOT NULL,
  updated_at TEXT,
  result TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_status (status),
  INDEX idx_assigned_at (assigned_at)
);

-- Error logs table
CREATE TABLE IF NOT EXISTS relay_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  level TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  task_id TEXT,
  context TEXT,
  INDEX idx_timestamp (timestamp),
  INDEX idx_level (level)
);

-- Metrics table
CREATE TABLE IF NOT EXISTS relay_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  tags TEXT,
  INDEX idx_timestamp (timestamp),
  INDEX idx_metric_name (metric_name)
);
```

**Action:** Run migration via wrangler
```bash
wrangler d1 migrations apply relay-db --remote
```

### Step 2: Create Cloudflare Worker

**File:** `apps/relay/worker.ts`

```typescript
// Relay poller as Cloudflare Worker
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const timestamp = new Date().toISOString();
    
    // 1. Check for unread tasks
    const tasks = await env.RELAY_DB.prepare(
      "SELECT * FROM relay_tasks WHERE status = 'unread' AND assigned_to = ? LIMIT 10"
    ).bind('Devin').all();
    
    // 2. Process each task
    for (const task of tasks.results) {
      try {
        // Update status to in_progress
        await env.RELAY_DB.prepare(
          "UPDATE relay_tasks SET status = 'in_progress', updated_at = ? WHERE id = ?"
        ).bind(timestamp, task.id).run();
        
        // Here we would call the agent to process the task
        // For now, just log it
        console.log(`Processing task ${task.id}: ${task.task}`);
        
        // Update status to completed
        await env.RELAY_DB.prepare(
          "UPDATE relay_tasks SET status = 'completed', updated_at = ?, result = 'Processed' WHERE id = ?"
        ).bind(timestamp, task.id).run();
        
      } catch (error) {
        // Update status to failed
        await env.RELAY_DB.prepare(
          "UPDATE relay_tasks SET status = 'failed', updated_at = ?, error = ?, retry_count = retry_count + 1 WHERE id = ?"
        ).bind(timestamp, String(error), task.id).run();
        
        // Log error
        await env.RELAY_DB.prepare(
          "INSERT INTO relay_errors (timestamp, level, source, message, task_id) VALUES (?, 'error', 'relay_worker', ?, ?)"
        ).bind(timestamp, String(error), task.id).run();
      }
    }
    
    // 3. Record metrics
    await env.RELAY_DB.prepare(
      "INSERT INTO relay_metrics (timestamp, metric_name, metric_value) VALUES (?, 'tasks_processed', ?)"
    ).bind(timestamp, tasks.results.length).run();
  }
};
```

### Step 3: Create wrangler.toml

**File:** `apps/relay/wrangler.toml`

```toml
name = "aether-relay"
main = "worker.ts"
compatibility_date = "2024-12-01"

# D1 Database
[[d1_databases]]
binding = "RELAY_DB"
database_name = "relay-db"
database_id = "<to-be-created>"

# KV for state/locks
[[kv_namespaces]]
binding = "RELAY_STATE"
id = "<to-be-created>"

# Cron trigger - every 30 minutes
[triggers]
crons = ["*/30 * * * *"]
```

### Step 4: Create D1 Database

```bash
wrangler d1 create relay-db
```

Update wrangler.toml with the returned database_id.

### Step 5: Create KV Namespace

```bash
wrangler kv namespace create RELAY_STATE
```

Update wrangler.toml with the returned id.

### Step 6: Run Migrations

```bash
cd apps/relay
wrangler d1 migrations apply relay-db --remote
```

### Step 7: Deploy Worker

```bash
cd apps/relay
wrangler deploy
```

### Step 8: Update Backend Endpoints

Modify backend endpoints to use D1 instead of file-based operations:

**POST /relay/assign:**
```typescript
await env.RELAY_DB.prepare(
  "INSERT INTO relay_tasks (id, assigned_to, assigned_from, task, priority, deadline, status, assigned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
).bind(taskId, to, from, task, priority, deadline, 'unread', timestamp).run();
```

**GET /relay/queue:**
```typescript
const tasks = await env.RELAY_DB.prepare(
  "SELECT * FROM relay_tasks WHERE assigned_to = ? AND status = 'unread' ORDER BY assigned_at DESC LIMIT 50"
).bind(agent).all();
```

**POST /relay/status:**
```typescript
await env.RELAY_DB.prepare(
  "UPDATE relay_tasks SET status = ?, result = ?, error = ?, updated_at = ? WHERE id = ?"
).bind(status, result, error, timestamp, taskId).run();
```

**GET /relay/errors:**
```typescript
const errors = await env.RELAY_DB.prepare(
  "SELECT * FROM relay_errors ORDER BY timestamp DESC LIMIT ?"
).bind(limit).all();
```

### Step 9: Update Local Poller

Modify `relay_poller.js` to use D1 instead of file-based operations.

### Step 10: Remove Local Dependencies

- Remove Windows Task Scheduler task
- Remove relay_poller.js
- Remove file-based relay database

## Migration Checklist

- [ ] Create D1 database schema
- [ ] Create D1 database via wrangler
- [ ] Create KV namespace via wrangler
- [ ] Create Cloudflare Worker
- [ ] Create wrangler.toml
- [ ] Run migrations
- [ ] Deploy Worker
- [ ] Update backend endpoints to use D1
- [ ] Update local poller to use D1
- [ ] Test Worker cron trigger
- [ ] Test task assignment via backend
- [ ] Test task processing by Worker
- [ ] Test error logging
- [ ] Test metrics collection
- [ ] Remove local dependencies
- [ ] Update documentation

## Rollback Plan

If migration fails:
1. Keep local poller running
2. Keep file-based database
3. Disable Worker cron trigger
4. Revert backend endpoints to file-based

## Benefits

1. **No local machine dependency** - Worker runs on Cloudflare
2. **Automatic scaling** - Cloudflare handles load
3. **Better reliability** - D1 is more reliable than file system
4. **Centralized logging** - All logs in one place
5. **Better monitoring** - Metrics in D1
6. **Global availability** - Worker runs everywhere

## Estimated Time

- D1 setup: 30 minutes
- Worker creation: 1 hour
- Backend updates: 1 hour
- Testing: 1 hour
- Total: ~3.5 hours

## Next Steps

1. Get approval for migration
2. Create D1 database
3. Implement Worker
4. Test thoroughly
5. Deploy to production
6. Monitor for issues