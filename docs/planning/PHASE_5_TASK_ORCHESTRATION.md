# Phase 5: Task Dependencies & Orchestration

## Overview
Implement task dependency management and orchestration for complex multi-step workflows.

## Current State
- Independent task execution
- No task dependencies
- No workflow orchestration
- No task chaining

## Target State
- Task dependency graph
- Workflow orchestration
- Task chaining
- Parallel task execution

## Implementation Steps

### Step 1: Update D1 Schema for Dependencies

**File:** `apps/relay/migrations/0003_task_dependencies.sql`

```sql
-- Add dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  depends_on_task_id TEXT NOT NULL,
  dependency_type TEXT DEFAULT 'sequential', -- sequential, parallel, conditional
  condition TEXT, -- SQL condition for conditional dependencies
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES relay_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES relay_tasks(id) ON DELETE CASCADE,
  INDEX idx_task_dependencies_task_id (task_id),
  INDEX idx_task_dependencies_depends_on (depends_on_task_id)
);

-- Add workflow table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
  created_at TEXT NOT NULL,
  updated_at TEXT,
  created_by TEXT,
  INDEX idx_workflows_status (status),
  INDEX idx_workflows_created_by (created_by)
);

-- Add workflow_tasks table
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES relay_tasks(id) ON DELETE CASCADE,
  INDEX idx_workflow_tasks_workflow_id (workflow_id),
  INDEX idx_workflow_tasks_task_id (task_id)
);

-- Add workflow_id to relay_tasks
ALTER TABLE relay_tasks ADD COLUMN workflow_id TEXT;
CREATE INDEX IF NOT EXISTS idx_relay_tasks_workflow_id ON relay_tasks(workflow_id);
```

### Step 2: Create Workflow API

**File:** `apps/backend/server.ts`

```typescript
// POST /relay/workflows - Create workflow
app.post('/relay/workflows', async (req, res) => {
  const { name, description, tasks, created_by } = req.body;
  
  const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();
  
  // Create workflow
  await env.RELAY_DB.prepare(
    "INSERT INTO workflows (id, name, description, status, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(workflowId, name, description, 'pending', timestamp, created_by).run();
  
  // Create tasks and link to workflow
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    await env.RELAY_DB.prepare(
      "INSERT INTO relay_tasks (id, assigned_to, assigned_from, task, priority, status, assigned_at, workflow_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(taskId, task.to, task.from, task.task, task.priority, 'pending', timestamp, workflowId).run();
    
    await env.RELAY_DB.prepare(
      "INSERT INTO workflow_tasks (workflow_id, task_id, order_index, created_at) VALUES (?, ?, ?, ?)"
    ).bind(workflowId, taskId, i, timestamp).run();
    
    // Add dependencies if specified
    if (task.depends_on) {
      for (const depTaskId of task.depends_on) {
        await env.RELAY_DB.prepare(
          "INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type, created_at) VALUES (?, ?, ?, ?)"
        ).bind(taskId, depTaskId, task.dependency_type || 'sequential', timestamp).run();
      }
    }
  }
  
  res.json({ ok: true, workflow_id: workflowId });
});

// GET /relay/workflows/:id - Get workflow status
app.get('/relay/workflows/:id', async (req, res) => {
  const { id } = req.params;
  
  const workflow = await env.RELAY_DB.prepare(
    "SELECT * FROM workflows WHERE id = ?"
  ).bind(id).first();
  
  const tasks = await env.RELAY_DB.prepare(
    "SELECT rt.*, wt.order_index FROM relay_tasks rt JOIN workflow_tasks wt ON rt.id = wt.task_id WHERE wt.workflow_id = ? ORDER BY wt.order_index"
  ).bind(id).all();
  
  res.json({ ok: true, workflow, tasks: tasks.results });
});

// POST /relay/workflows/:id/start - Start workflow
app.post('/relay/workflows/:id/start', async (req, res) => {
  const { id } = req.params;
  
  // Update workflow status
  await env.RELAY_DB.prepare(
    "UPDATE workflows SET status = 'in_progress', updated_at = ? WHERE id = ?"
  ).bind(new Date().toISOString(), id).run();
  
  // Start first task (no dependencies)
  const firstTask = await env.RELAY_DB.prepare(
    "SELECT rt.id FROM relay_tasks rt JOIN workflow_tasks wt ON rt.id = wt.task_id WHERE wt.workflow_id = ? AND wt.order_index = 0"
  ).bind(id).first();
  
  if (firstTask) {
    await env.RELAY_DB.prepare(
      "UPDATE relay_tasks SET status = 'unread' WHERE id = ?"
    ).bind(firstTask.id).run();
  }
  
  res.json({ ok: true });
});
```

### Step 3: Create Orchestration Worker

**File:** `apps/relay-orchestrator/worker.ts`

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const timestamp = new Date().toISOString();
    
    // Find in-progress workflows
    const workflows = await env.RELAY_DB.prepare(
      "SELECT * FROM workflows WHERE status = 'in_progress'"
    ).all();
    
    for (const workflow of workflows.results) {
      // Find completed tasks
      const completedTasks = await env.RELAY_DB.prepare(
        "SELECT rt.id FROM relay_tasks rt JOIN workflow_tasks wt ON rt.id = wt.task_id WHERE wt.workflow_id = ? AND rt.status = 'completed'"
      ).bind(workflow.id).all();
      
      // Find tasks that can be started (dependencies satisfied)
      const readyTasks = await env.RELAY_DB.prepare(`
        SELECT DISTINCT rt.id, rt.assigned_to
        FROM relay_tasks rt
        JOIN workflow_tasks wt ON rt.id = wt.task_id
        WHERE wt.workflow_id = ?
        AND rt.status = 'pending'
        AND NOT EXISTS (
          SELECT 1 FROM task_dependencies td
          WHERE td.task_id = rt.id
          AND td.depends_on_task_id NOT IN (
            SELECT rt2.id FROM relay_tasks rt2 WHERE rt2.status = 'completed'
          )
        )
      `).bind(workflow.id).all();
      
      // Start ready tasks
      for (const task of readyTasks.results) {
        await env.RELAY_DB.prepare(
          "UPDATE relay_tasks SET status = 'unread' WHERE id = ?"
        ).bind(task.id).run();
        
        // Send notification
        await env.RELAY_STATE.put(`notification:${task.assigned_to}`, JSON.stringify({
          type: 'task_assigned',
          task_id: task.id,
          workflow_id: workflow.id,
          timestamp,
        }), { expirationTtl: 300 });
      }
      
      // Check if workflow is complete
      const allTasks = await env.RELAY_DB.prepare(
        "SELECT COUNT(*) as total FROM workflow_tasks WHERE workflow_id = ?"
      ).bind(workflow.id).first();
      
      const completedCount = await env.RELAY_DB.prepare(
        "SELECT COUNT(*) as total FROM relay_tasks rt JOIN workflow_tasks wt ON rt.id = wt.task_id WHERE wt.workflow_id = ? AND rt.status = 'completed'"
      ).bind(workflow.id).first();
      
      if (allTasks.total === completedCount.total) {
        await env.RELAY_DB.prepare(
          "UPDATE workflows SET status = 'completed', updated_at = ? WHERE id = ?"
        ).bind(timestamp, workflow.id).run();
      }
    }
  }
};
```

### Step 4: Create wrangler.toml for Orchestrator

**File:** `apps/relay-orchestrator/wrangler.toml`

```toml
name = "aether-relay-orchestrator"
main = "worker.ts"
compatibility_date = "2024-12-01"

# D1 Database
[[d1_databases]]
binding = "RELAY_DB"
database_name = "relay-db"
database_id = "<from Phase 2>"

# KV for notifications
[[kv_namespaces]]
binding = "RELAY_STATE"
id = "<from Phase 2>"

# Cron trigger - every 1 minute
[triggers]
crons = ["* * * * *"]
```

### Step 5: Run Migration

```bash
cd apps/relay
wrangler d1 migrations apply relay-db --remote
```

### Step 6: Deploy Orchestrator Worker

```bash
cd apps/relay-orchestrator
wrangler deploy
```

### Step 7: Test Workflow Orchestration

1. Create workflow with multiple tasks
2. Add task dependencies
3. Start workflow
4. Verify tasks execute in correct order
5. Verify parallel execution works
6. Verify workflow completes when all tasks done

## Migration Checklist

- [ ] Update D1 schema for dependencies
- [ ] Create workflow API
- [ ] Create orchestration worker
- [ ] Create wrangler.toml
- [ ] Run migration
- [ ] Deploy orchestrator worker
- [ ] Test workflow creation
- [ ] Test task dependencies
- [ ] Test parallel execution
- [ ] Test workflow completion
- [ ] Update documentation

## Rollback Plan

If orchestration fails:
1. Keep simple task execution
2. Disable orchestrator worker
3. Revert to manual task assignment
4. Remove workflow tables

## Benefits

1. **Complex workflows** - Support multi-step processes
2. **Task dependencies** - Ensure tasks execute in correct order
3. **Parallel execution** - Run independent tasks simultaneously
4. **Workflow tracking** - Monitor workflow progress
5. **Better organization** - Group related tasks

## Estimated Time

- D1 schema update: 30 minutes
- Workflow API: 2 hours
- Orchestrator worker: 2 hours
- Testing: 1 hour
- Total: ~5.5 hours

## Next Steps

1. Get approval for implementation
2. Implement workflow system
3. Test thoroughly
4. Deploy to production
5. Monitor workflow execution
