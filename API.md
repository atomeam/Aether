# Aether API Documentation

This document describes all available API endpoints in the Aether system.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Build API](#build-api)
  - [Agent System API](#agent-system-api)
  - [Nexus Gateway API](#nexus-gateway-api)
  - [System API](#system-api)
  - [MCP API](#mcp-api)
  - [Metrics API](#metrics-api)

## Overview

The Aether API is a RESTful API built with Express.js and deployed on Vercel. It provides endpoints for:

- UI generation and evolution
- Agent system management
- Integration gateway (Nexus)
- System monitoring
- MCP (Model Context Protocol) tool execution
- Metrics collection

## Authentication

### JWT Authentication

Most endpoints require JWT authentication via the `Authorization` header.

```http
Authorization: Bearer <token>
```

### API Key Authentication

Some endpoints support API key authentication via the `X-API-Key` header.

```http
X-API-Key: <api-key>
```

## Base URL

**Production**: `https://api.a-to-mind.com`
**Local**: `http://localhost:3000`

## Response Format

All API responses follow this structure:

```json
{
  "data": {},
  "error": null,
  "traceId": "trace_1234567890_abc123"
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "traceId": "trace_1234567890_abc123"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable Entity (Curator rejection) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |

## API Endpoints

### Build API

#### POST /api/build

Generate UI components based on a prompt.

**Authentication**: Required (JWT or API Key)

**Request Body**:

```json
{
  "prompt": "Add a chart showing system metrics",
  "currentComponents": [
    {
      "id": "comp_1",
      "type": "stat",
      "title": "CPU Usage"
    }
  ]
}
```

**Response** (Success):

```json
{
  "thought": "Generation approved",
  "explanation": "Payload cleared capability constraints.",
  "actions": [
    {
      "action": "ADD",
      "type": "chart",
      "id": "comp_2",
      "title": "System Metrics",
      "config": {}
    }
  ],
  "isFallback": false,
  "traceId": "trace_1234567890_abc123"
}
```

**Response** (Curator Rejection):

```json
{
  "error": "curator_denied",
  "reason": "Action type not in allow-list",
  "offendingActionIds": ["comp_2"],
  "traceId": "trace_1234567890_abc123"
}
```

**Rate Limit**: 10 requests per minute per user

#### POST /api/test/curator

Test the Curator validation without LLM generation.

**Authentication**: Optional

**Request Body**:

```json
{
  "actions": [
    {
      "action": "ADD",
      "type": "chart",
      "id": "comp_1"
    }
  ]
}
```

**Response** (Approved):

```json
{
  "approved": true,
  "actions": [...]
}
```

**Response** (Rejected):

```json
{
  "error": "curator_denied",
  "reason": "Action type not in allow-list",
  "offendingActionIds": ["comp_1"],
  "traceId": "trace_1234567890_abc123"
}
```

#### POST /api/evolve

Advanced UI evolution with persona-based generation and real-time context.

**Authentication**: Required (JWT)

**Request Body**:

```json
{
  "components": [],
  "theme": {},
  "drivers": [],
  "directives": [],
  "instanceId": "ANON",
  "rejectedIntents": [],
  "telemetryHistory": []
}
```

**Response**:

```json
{
  "actions": [...],
  "theme": {},
  "drivers": [],
  "directives": [],
  "persona": {
    "name": "Architect of Utility",
    "bias": "Focus on data density..."
  }
}
```

### Agent System API

#### GET /api/agents

Get the health status of the agent system.

**Authentication**: Optional

**Response**:

```json
{
  "curator": "active",
  "executor": "ready",
  "mcpServer": "active",
  "reflector": "ready",
  "circuitBreaker": "closed",
  "curatorAudit": "active",
  "loop": {
    "isRunning": false
  },
  "overall": {
    "status": "stopped",
    "healthy": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/agents/curator/decisions

Get recent Curator decisions and statistics.

**Authentication**: Optional

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| since | number | 3600000 | Time range in milliseconds (1 hour) |

**Response**:

```json
{
  "decisions": [
    {
      "id": "decision_1",
      "approved": true,
      "reason": "All actions valid",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "stats": {
    "total": 100,
    "approved": 95,
    "rejected": 5,
    "rejectionRate": 0.05
  }
}
```

#### GET /api/agents/curator/policy

Get the Curator policy (read-only).

**Authentication**: Optional

**Response**:

```json
{
  "policy": "allow-list:\n  - stat\n  - chart\n  - list\n...",
  "format": "yaml"
}
```

#### GET /api/agents/evaluate

Evaluate the ledger for patterns and suggestions.

**Authentication**: Optional

**Response**:

```json
{
  "suggestions": [
    {
      "pattern": "high_frequency_chart_additions",
      "confidence": 0.85,
      "suggestion": "Consider consolidating charts"
    }
  ]
}
```

#### POST /api/agents/reflect

Write a lesson to the Reflector.

**Authentication**: Required (JWT)

**Request Body**:

```json
{
  "pattern": "pattern_name",
  "confidence": 0.9,
  "lesson": "Lesson learned",
  "context": {}
}
```

**Response**:

```json
{
  "success": true,
  "patternId": "pattern_123"
}
```

#### GET /api/agents/reflect

Get learned patterns and their confidences.

**Authentication**: Optional

**Response**:

```json
{
  "patterns": [
    {
      "pattern": "pattern_name",
      "confidence": 0.9,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Nexus Gateway API

#### GET /api/nexus/registry

Get all registered integrations.

**Authentication**: Required (JWT)

**Response**:

```json
[
  {
    "id": "integration_1",
    "baseUrl": "https://api.example.com",
    "authConfig": {
      "type": "Bearer",
      "token": "token_value"
    },
    "status": "CONNECTED"
  }
]
```

#### POST /api/nexus/registry

Register a new integration.

**Authentication**: Required (JWT)

**Request Body**:

```json
{
  "id": "integration_1",
  "baseUrl": "https://api.example.com",
  "authConfig": {
    "type": "Bearer",
    "token": "token_value"
  }
}
```

**Response**:

```json
{
  "success": true
}
```

#### DELETE /api/nexus/registry/:id

Delete an integration.

**Authentication**: Required (JWT)

**Response**:

```json
{
  "success": true
}
```

#### ALL /api/nexus/route/:integrationId/*

Proxy requests to registered integrations.

**Authentication**: Required (JWT)

**URL Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| integrationId | string | Integration ID |
| * | string | Path to proxy |

**Response**: Proxied from the integration

### System API

#### GET /api/stack

Get backend health status.

**Authentication**: Optional

**Response**:

```json
{
  "status": "online",
  "backend": "alpha-backend",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/system/stream

Server-Sent Events (SSE) stream for system logs.

**Authentication**: Required (JWT)

**Response**: SSE stream with events:

```json
{
  "type": "LOG",
  "log": "[2024-01-01T00:00:00.000Z] Log message"
}
```

```json
{
  "type": "HEARTBEAT",
  "timestamp": 1234567890
}
```

```json
{
  "type": "INIT",
  "logs": ["log1", "log2", ...]
}
```

### MCP API

#### POST /api/mcp/rpc

MCP JSON-RPC endpoint for tool execution.

**Authentication**: Required (JWT)

**Request Body**:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "read_workspace_file",
    "arguments": {
      "path": "src/App.tsx"
    }
  },
  "id": 1
}
```

**Available Methods**:

- `resources/list` - List available resources
- `tools/list` - List available tools
- `tools/call` - Execute a tool

**Available Tools**:

- `read_workspace_file` - Read a file from the workspace
- `write_workspace_file` - Write/Patch a file in the workspace
- `execute_powershell_bus` - Invoke PowerShell automation

**Response** (Success):

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": "file content"
  },
  "id": 1
}
```

**Response** (Error):

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Error message"
  },
  "id": 1
}
```

### Metrics API

#### GET /api/metrics

Get metrics snapshot.

**Authentication**: Required (JWT)

**Response**:

```json
{
  "counters": {
    "api_requests_total": 1000,
    "api_errors_total": 10,
    "curator_approvals_total": 950,
    "curator_rejections_total": 50
  }
}
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/build | 10/min | 1 minute |
| /api/evolve | 5/min | 1 minute |
| /api/mcp/rpc | 100/min | 1 minute |
| Other endpoints | 100/min | 1 minute |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1234567890
```

## CORS

Allowed origins:

- `https://a-to-mind.com`
- `https://www.a-to-mind.com`
- `http://localhost:5173`
- `http://localhost:3000`

Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`

Allowed headers: `Content-Type, Authorization, X-API-Key`

## Security Headers

All responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Trace IDs

All requests include a trace ID for correlation:

```http
X-Trace-Id: trace_1234567890_abc123
```

You can provide your own trace ID:

```http
X-Trace-Id: custom_trace_id
```

## Webhooks

### Curator Decisions Webhook

When the Curator makes a decision, a webhook can be triggered.

**Payload**:

```json
{
  "decisionId": "decision_123",
  "approved": false,
  "reason": "Action type not in allow-list",
  "actions": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## SDK

### JavaScript/TypeScript

```typescript
import { AetherClient } from '@aether/client';

const client = new AetherClient({
  baseUrl: 'https://api.a-to-mind.com',
  apiKey: 'your-api-key'
});

// Generate UI
const result = await client.build({
  prompt: 'Add a chart',
  currentComponents: []
});

// Get agent health
const health = await client.getAgentHealth();
```

### Python

```python
from aether import AetherClient

client = AetherClient(
    base_url='https://api.a-to-mind.com',
    api_key='your-api-key'
)

# Generate UI
result = client.build(
    prompt='Add a chart',
    current_components=[]
)

# Get agent health
health = client.get_agent_health()
```

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Build API endpoints
- Agent System API
- Nexus Gateway API
- MCP API
- Metrics API

---

For more information, see:
- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
