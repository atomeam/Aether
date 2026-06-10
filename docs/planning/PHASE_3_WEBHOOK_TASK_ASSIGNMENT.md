# Phase 3: Webhook-Based Task Assignment

## Overview
Move from polling-based task assignment to webhook-based push notifications for real-time task distribution.

## Current State
- Backend has webhook endpoints (POST /relay/assign, /relay/status)
- Local relay_poller.js uses polling
- No real-time notification system
- Tasks are assigned via manual polling

## Target State
- Cloudflare Worker with webhook receiver
- Real-time task assignment via webhooks
- Push-based notification system
- No polling required

## Implementation Steps

### Step 1: Create Webhook Receiver Worker

**File:** `apps/relay-webhook/worker.ts`

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // POST /webhook/task - Receive task assignment
    if (url.pathname === '/webhook/task' && request.method === 'POST') {
      const body = await request.json() as {
        to: string;
        from: string;
        task: string;
        priority: string;
        deadline?: string;
      };
      
      // Validate request
      if (!body.to || !body.task) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
      }
      
      // Store task in D1
      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timestamp = new Date().toISOString();
      
      await env.RELAY_DB.prepare(
        "INSERT INTO relay_tasks (id, assigned_to, assigned_from, task, priority, deadline, status, assigned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(taskId, body.to, body.from, body.task, body.priority, body.deadline || null, 'unread', timestamp).run();
      
      // Send notification via KV (for real-time)
      await env.RELAY_STATE.put(`notification:${body.to}`, JSON.stringify({
        type: 'task_assigned',
        task_id: taskId,
        task: body.task,
        priority: body.priority,
        timestamp,
      }), { expirationTtl: 300 });
      
      return new Response(JSON.stringify({ ok: true, task_id: taskId }), { status: 200 });
    }
    
    // GET /notifications/:agent - Get notifications for agent
    if (url.pathname.match(/^\/notifications\/[^/]+$/) && request.method === 'GET') {
      const agent = url.pathname.split('/')[2];
      const notification = await env.RELAY_STATE.get(`notification:${agent}`);
      
      if (notification) {
        // Delete after reading (one-time notification)
        await env.RELAY_STATE.delete(`notification:${agent}`);
        return new Response(notification, { status: 200 });
      }
      
      return new Response(JSON.stringify({ ok: true, notification: null }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
};
```

### Step 2: Create wrangler.toml

**File:** `apps/relay-webhook/wrangler.toml`

```toml
name = "aether-relay-webhook"
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

# Routes
routes = [
  { pattern = "relay-webhook.a-to-mind.com/*", custom_domain = true }
]
```

### Step 3: Update Backend to Use Webhooks

**File:** `apps/backend/server.ts`

```typescript
// POST /relay/assign - Now sends webhook instead of storing locally
app.post('/relay/assign', async (req, res) => {
  const { to, from, task, priority, deadline } = req.body;
  
  // Send webhook to relay-webhook worker
  const webhookResponse = await fetch('https://relay-webhook.a-to-mind.com/webhook/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, from, task, priority, deadline }),
  });
  
  if (webhookResponse.ok) {
    const result = await webhookResponse.json();
    res.json({ ok: true, task_id: result.task_id });
  } else {
    res.status(500).json({ ok: false, error: 'Webhook failed' });
  }
});
```

### Step 4: Update Local Poller to Use Webhooks

**File:** `relay_poller.js`

```javascript
// Instead of polling, listen for notifications
async function listenForNotifications(agentId) {
  while (true) {
    const response = await fetch(`https://relay-webhook.a-to-mind.com/notifications/${agentId}`);
    const data = await response.json();
    
    if (data.notification) {
      console.log('New task:', data.notification);
      // Process task
      await processTask(data.notification);
    }
    
    // Wait before checking again
    await sleep(5000);
  }
}
```

### Step 5: Deploy Webhook Worker

```bash
cd apps/relay-webhook
wrangler deploy
```

### Step 6: Test Webhook Flow

1. Send task via backend webhook
2. Verify task stored in D1
3. Verify notification sent via KV
4. Verify notification received by poller
5. Verify task processed

## Migration Checklist

- [ ] Create webhook receiver worker
- [ ] Create wrangler.toml
- [ ] Update backend to use webhooks
- [ ] Update local poller to use webhooks
- [ ] Deploy webhook worker
- [ ] Test webhook task assignment
- [ ] Test notification delivery
- [ ] Test task processing
- [ ] Remove old polling logic
- [ ] Update documentation

## Rollback Plan

If webhook system fails:
1. Keep polling system running
2. Disable webhook worker
3. Revert backend to polling
4. Revert local poller to polling

## Benefits

1. **Real-time** - Tasks assigned immediately via webhooks
2. **No polling** - Reduces API calls and latency
3. **Scalable** - Webhooks scale better than polling
4. **Efficient** - Only process tasks when assigned

## Estimated Time

- Webhook worker creation: 1 hour
- Backend updates: 30 minutes
- Poller updates: 30 minutes
- Testing: 1 hour
- Total: ~3 hours

## Next Steps

1. Get approval for migration
2. Create webhook worker
3. Test thoroughly
4. Deploy to production
5. Monitor for issues