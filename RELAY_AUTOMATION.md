# Relay Automation System

## Overview

The Relay Automation System enables autonomous task assignment and execution for AI agents without manual intervention. It provides webhook-based task assignment, error logging, health monitoring, and a roadmap for full automation.

## Current Implementation (Phase 1 - Quick Wins)

### 1. Webhook Endpoints

All endpoints are available on the backend server (port 3000):

#### POST /relay/assign
Assign a task to an agent.

**Request:**
```json
{
  "to": "Devin",
  "from": "manual",
  "task": "Implement feature X",
  "priority": "normal",
  "deadline": "2026-06-11T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "task_1718000000_abc123",
  "to": "Devin",
  "from": "manual",
  "task": "Implement feature X",
  "priority": "normal",
  "deadline": "2026-06-11T00:00:00Z",
  "status": "unread",
  "assignedAt": "2026-06-10T07:00:00.000Z"
}
```

#### POST /relay/status
Update task status.

**Request:**
```json
{
  "taskId": "task_1718000000_abc123",
  "status": "completed",
  "result": "Feature X implemented successfully",
  "error": null
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "task_1718000000_abc123",
  "status": "completed",
  "result": "Feature X implemented successfully",
  "error": null,
  "updatedAt": "2026-06-10T08:00:00.000Z"
}
```

#### GET /relay/queue
View task queue for an agent.

**Request:**
```
GET /relay/queue?agent=Devin
```

**Response:**
```json
{
  "tasks": [],
  "agent": "Devin",
  "timestamp": "2026-06-10T07:00:00.000Z"
}
```

#### GET /relay/health
Health check for relay system.

**Response:**
```json
{
  "status": "healthy",
  "poller": "active",
  "lastPoll": "2026-06-10T07:00:00.000Z",
  "queueDepth": 0,
  "agent": "Devin",
  "uptime": 3600
}
```

#### GET /relay/errors
Retrieve error logs.

**Request:**
```
GET /relay/errors?limit=50&level=error
```

**Response:**
```json
{
  "errors": [
    {
      "timestamp": "2026-06-10T07:00:00.000Z",
      "level": "error",
      "source": "relay/assign",
      "message": "Missing required fields: to, task",
      "context": {}
    }
  ],
  "count": 1
}
```

### 2. Error Logging

**File-based logging** (will move to D1 in Phase 2):
- Location: `apps/backend/relay_errors.log`
- Format: JSONL (one JSON object per line)
- Levels: `error`, `warn`, `info`
- Automatic rotation: Not yet implemented

**Log Entry Structure:**
```typescript
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  source: string;
  message: string;
  stack?: string;
  taskId?: string;
  context?: Record<string, any>;
}
```

### 3. Health Monitoring

**Health check endpoint** provides:
- System status (healthy/unhealthy)
- Poller status (active/inactive)
- Last poll timestamp
- Queue depth
- Agent name
- Server uptime

## Usage Examples

### Assign a Task via cURL
```bash
curl -X POST http://localhost:3000/relay/assign \
  -H "Content-Type: application/json" \
  -d '{
    "to": "Devin",
    "from": "manual",
    "task": "Fix the authentication bug",
    "priority": "high"
  }'
```

### Check Health
```bash
curl http://localhost:3000/relay/health
```

### View Error Logs
```bash
curl "http://localhost:3000/relay/errors?limit=10&level=error"
```

## Roadmap

### Phase 1: Quick Wins ✅ (COMPLETED)
- [x] Webhook endpoint for task assignment
- [x] Error logging (file-based)
- [x] Health check endpoint

### Phase 2: Cloudflare Workers Migration (PENDING)
- [ ] Convert relay poller to Cloudflare Worker
- [ ] Add cron trigger (every 30 minutes)
- [ ] Add D1 database for relay queue
- [ ] Add KV for state/locks
- [ ] Deploy to Cloudflare

**Benefits:**
- No local machine dependency
- Automatic scaling
- Better reliability
- Centralized logging

### Phase 3: Webhook-Based Task Assignment (PENDING)
- [ ] Replace polling with webhooks
- [ ] Immediate task processing
- [ ] Real-time notifications
- [ ] Better resource efficiency

### Phase 4: Self-Healing & Error Recovery (PENDING)
- [ ] Add retry logic for failed tasks
- [ ] Add automatic error classification
- [ ] Add exponential backoff
- [ ] Add dead letter queue
- [ ] Add automatic task reassignment

### Phase 5: Task Dependencies & Orchestration (PENDING)
- [ ] Add task dependency graph
- [ ] Add parallel task execution
- [ ] Add task priority system
- [ ] Add task chaining
- [ ] Add task timeout handling

### Phase 6: Monitoring & Alerting (PENDING)
- [ ] Add metrics collection
- [ ] Add alerting (email, Slack, webhook)
- [ ] Add dashboard for visibility
- [ ] Add health check endpoint
- [ ] Add log aggregation

## Integration with Existing Poller

The existing `relay_poller.js` can be updated to use the new webhook endpoints:

1. **Task Assignment:** Use `POST /relay/assign` instead of manual file edits
2. **Status Updates:** Use `POST /relay/status` to update task progress
3. **Queue Monitoring:** Use `GET /relay/queue` to check for new tasks
4. **Health Checks:** Use `GET /relay/health` for monitoring

## Migration Plan

### Step 1: Update Poller
Modify `relay_poller.js` to use webhook endpoints instead of file-based operations.

### Step 2: Test Locally
Run the poller with the new endpoints and verify task assignment works.

### Step 3: Deploy to Cloudflare
Move the poller to Cloudflare Workers with D1 database.

### Step 4: Monitor & Iterate
Add metrics, alerts, and self-healing capabilities.

## Security Considerations

### Current Implementation
- No authentication on relay endpoints (add in Phase 2)
- No rate limiting (add in Phase 3)
- No input validation beyond basic checks (add in Phase 2)

### Recommended Security
- Add API key authentication to all relay endpoints
- Add rate limiting to prevent abuse
- Add input validation and sanitization
- Add CORS configuration for frontend access
- Add audit logging for all task operations

## Testing

### Manual Testing
```bash
# Start backend
cd C:\Users\adamm\Aether
npm run dev:backend

# Test endpoints in another terminal
curl http://localhost:3000/relay/health
curl -X POST http://localhost:3000/relay/assign -H "Content-Type: application/json" -d '{"to":"Devin","task":"Test task"}'
curl http://localhost:3000/relay/errors
```

### Automated Testing
- Add integration tests for relay endpoints
- Add load testing for webhook endpoints
- Add error injection testing for retry logic

## Troubleshooting

### Common Issues

**Issue:** Task assignment returns 400 error
**Solution:** Check that required fields (`to`, `task`) are present in request

**Issue:** Error log file not created
**Solution:** Check file permissions in `apps/backend/` directory

**Issue:** Health check returns unhealthy
**Solution:** Check backend server is running on port 3000

## Next Steps

1. **Immediate:** Test the webhook endpoints with cURL or Postman
2. **Short-term:** Update `relay_poller.js` to use webhook endpoints
3. **Medium-term:** Move to Cloudflare Workers with D1 database
4. **Long-term:** Add full automation with self-healing and monitoring

## Related Files

- `apps/backend/server.ts` - Relay endpoints implementation
- `relay_poller.js` - Existing poller (to be updated)
- `RELAY_SYSTEM_STATUS.md` - Relay system status
- `CLERK_INTEGRATION.md` - Clerk authentication integration

## Contact

For questions or issues with the relay automation system, refer to the AGENTS.md file or contact the development team.