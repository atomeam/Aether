# Aether API Documentation

## Overview

The Aether backend provides a comprehensive REST API for agent operations, system health, and integration management. All endpoints are served from the backend server running on port 3000 (development) or deployed to a-to-mind.com (production).

## Base URL

- **Development:** `http://localhost:3000`
- **Production:** `https://a-to-mind.com`

## Authentication

Currently, the API does not require authentication. Future versions will implement authentication mechanisms.

## Response Format

All endpoints return JSON responses with the following structure:

```json
{
  "status": "success|error",
  "data": {},
  "error": "Error message (if applicable)",
  "timestamp": "ISO 8601 timestamp"
}
```

## Endpoints

### Health & Status

#### GET /api/health

Get the overall health status of the backend system.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-11T12:00:00Z"
}
```

**Status Codes:**
- 200: System is healthy
- 503: System is unhealthy

---

#### GET /api/stack

Get detailed stack information including package versions and system status.

**Response:**
```json
{
  "backend": {
    "status": "running",
    "version": "1.0.0",
    "uptime": 3600
  },
  "packages": {
    "@aether/contracts": "1.0.0",
    "@aether/curator": "1.0.0",
    "@aether/logger": "1.0.0"
  },
  "timestamp": "2026-06-11T12:00:00Z"
}
```

---

### Agent System

#### GET /api/agents

Get comprehensive health status of the agent system including executor, evaluator, and loop status.

**Response:**
```json
{
  "executor": {
    "status": "running",
    "tools": 15,
    "availableTools": ["file_read", "file_write", "git_status", "git_commit", "http_request", "lessons_write", "get_agent_state", "trigger_workflow", "chaos_inject", "directory_list", "file_search", "http_post", "json_parse", "json_stringify", "uuid_generate", "env_get", "log_write"]
  },
  "evaluator": {
    "status": "ready",
    "patternsFound": 0,
    "lastEvaluation": null
  },
  "loop": {
    "isRunning": false,
    "uptimeSeconds": 0,
    "tickCount": 0,
    "actionsExecuted": 0,
    "actionsApproved": 0,
    "actionsRejected": 0,
    "lastTickAt": null
  },
  "overall": {
    "status": "healthy",
    "healthy": true
  },
  "timestamp": "2026-06-11T12:00:00Z"
}
```

---

#### POST /api/agents/loop/start

Start the agent loop for autonomous operations.

**Request Body:**
```json
{
  "tickIntervalMs": 60000,
  "maxActionsPerTick": 10,
  "enableLearning": true,
  "enableGovernance": true
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Agent loop started",
  "loopStatus": {
    "isRunning": true,
    "uptimeSeconds": 0,
    "tickCount": 0
  }
}
```

---

#### POST /api/agents/loop/stop

Stop the agent loop.

**Response:**
```json
{
  "status": "success",
  "message": "Agent loop stopped",
  "loopStatus": {
    "isRunning": false,
    "uptimeSeconds": 1234,
    "tickCount": 20
  }
}
```

---

#### GET /api/agents/loop/status

Get the current status of the agent loop.

**Response:**
```json
{
  "isRunning": true,
  "uptimeSeconds": 3600,
  "tickCount": 60,
  "actionsExecuted": 120,
  "actionsApproved": 115,
  "actionsRejected": 5,
  "lastTickAt": "2026-06-11T12:00:00Z"
}
```

---

#### GET /api/agents/evaluate

Evaluate the ledger for concerning patterns and get suggestions.

**Query Parameters:**
- `since` (optional): Time in milliseconds to look back (default: 3600000 = 1 hour)

**Response:**
```json
{
  "patterns": [
    {
      "pattern": "repeated_file_write_errors",
      "suggestion": "Check file permissions and disk space",
      "priority": "high",
      "confidence": 0.85
    }
  ],
  "timestamp": "2026-06-11T12:00:00Z"
}
```

---

#### GET /api/agents/curator/decisions

Get recent curator decisions for audit purposes.

**Response:**
```json
{
  "decisions": [
    {
      "traceId": "trace_123",
      "verdict": "APPROVED",
      "reason": "Action matches allow-list",
      "timestamp": "2026-06-11T12:00:00Z"
    }
  ],
  "timestamp": "2026-06-11T12:00:00Z"
}
```

---

### Chaos Engineering

#### POST /api/agents/chaos

Inject a chaos scenario into the system for testing resilience.

**Request Body:**
```json
{
  "scenario": "broken_package_json",
  "targetPath": "sandbox"
}
```

**Response:**
```json
{
  "status": "success",
  "scenario": "broken_package_json",
  "injectedAt": "2026-06-11T12:00:00Z",
  "message": "Chaos scenario injected successfully"
}
```

**Available Scenarios:**
- `broken_package_json`: Corrupts package.json
- `missing_dependency`: Removes a dependency
- `circular_dependency`: Creates circular dependency
- `memory_leak`: Simulates memory leak
- `network_timeout`: Simulates network timeout

---

#### GET /api/agents/chaos

List available chaos scenarios.

**Response:**
```json
{
  "scenarios": [
    {
      "name": "broken_package_json",
      "description": "Corrupts package.json to test build resilience",
      "severity": "medium"
    },
    {
      "name": "missing_dependency",
      "description": "Removes a dependency to test dependency resolution",
      "severity": "high"
    }
  ],
  "timestamp": "2026-06-11T12:00:00Z"
}
```

---

### Build & Components

#### POST /api/build

Generate UI components based on user prompt.

**Request Body:**
```json
{
  "prompt": "Create a dashboard with system metrics",
  "context": {
    "theme": "dark",
    "layout": "grid"
  }
}
```

**Response:**
```json
{
  "components": [
    {
      "type": "stat",
      "props": {
        "label": "CPU Usage",
        "value": "75%"
      }
    }
  ],
  "timestamp": "2026-06-11T12:00:00Z"
}
```

---

#### POST /api/test/curator

Test the curator security gate directly.

**Request Body:**
```json
{
  "actions": [
    {
      "type": "stat",
      "props": {}
    }
  ]
}
```

**Response:**
```json
{
  "verdict": "APPROVED",
  "reason": "All actions match allow-list",
  "approvedActions": 1,
  "rejectedActions": 0,
  "rejectedIds": []
}
```

---

### Integration Proxy

#### GET /api/nexus/*

Proxy requests to registered integrations (n8n, GitHub, etc.).

**Path Parameters:**
- `*`: Integration-specific path

**Response:**
```json
{
  "status": "success",
  "data": {},
  "timestamp": "2026-06-11T12:00:00Z"
}
```

---

## Error Handling

All endpoints may return error responses:

```json
{
  "status": "error",
  "error": "Error message",
  "timestamp": "2026-06-11T12:00:00Z"
}
```

**Common Error Codes:**
- 400: Bad Request - Invalid input
- 404: Not Found - Resource not found
- 422: Unprocessable Entity - Curator rejection
- 500: Internal Server Error - Server error
- 503: Service Unavailable - System unhealthy

## Rate Limiting

Currently, there is no rate limiting. Future versions will implement rate limiting per IP address.

## Webhooks

### Stripe Webhook

**Endpoint:** `POST /api/billing/webhook`

**Headers:**
- `Stripe-Signature`: Webhook signature for verification

**Supported Events:**
- `checkout.session.completed`
- `payment_intent.succeeded`

---

## Governance & Audit

All API requests are automatically logged through the governance audit middleware:

- **Intent Capture:** Records request intent before execution
- **Outcome Recording:** Records response status and latency
- **Decision Logging:** Stores agent decisions for audit trail

Audit logs are stored in `./logs/agent-decisions.jsonl`

---

## MCP Tools

The following MCP tools are available for agent operations:

1. **file_read** - Read file contents (workspace-restricted)
2. **file_write** - Write file contents (workspace-restricted)
3. **git_status** - Check git status
4. **git_commit** - Create git commits
5. **http_request** - HTTP GET/HEAD requests
6. **lessons_write** - Write lessons to database
7. **get_agent_state** - Get execution metrics
8. **trigger_workflow** - Trigger workflows
9. **chaos_inject** - Inject failure patterns
10. **directory_list** - List directory contents
11. **file_search** - Search for files by pattern
12. **http_post** - HTTP POST requests
13. **json_parse** - Parse JSON strings
14. **json_stringify** - Stringify objects to JSON
15. **uuid_generate** - Generate UUIDs
16. **env_get** - Get environment variables
17. **log_write** - Write to log files

---

## Versioning

Current API version: v1

Future versions will be versioned using URL paths (e.g., `/api/v2/health`).

---

## Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Agent System Health
```bash
curl http://localhost:3000/api/agents
```

### Start Agent Loop
```bash
curl -X POST http://localhost:3000/api/agents/loop/start \
  -H "Content-Type: application/json" \
  -d '{"tickIntervalMs": 60000, "maxActionsPerTick": 10}'
```

### Inject Chaos Scenario
```bash
curl -X POST http://localhost:3000/api/agents/chaos \
  -H "Content-Type: application/json" \
  -d '{"scenario": "broken_package_json", "targetPath": "sandbox"}'
```

---

## Support

For API issues or questions:
- Check the troubleshooting guide: `TROUBLESHOOTING.md`
- Review operational runbooks: `OPERATIONAL-RUNBOOKS.md`
- Check system health: `GET /api/health`

---

**Documentation Version:** 1.0
**Last Updated:** 2026-06-11
**API Version:** v1