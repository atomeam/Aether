# API Reference

## Backend Endpoints (a-to-mind.com/api)

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Overall health status |
| GET | /api/stack | Stack component status |
| GET | /api/agents | Agent health + metrics |
| GET | /api/agents/evaluate | Pattern analysis |

### Build

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/build | Generate UI components |
| POST | /api/test/curator | Direct curator test |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workflows | List workflows |
| POST | /api/workflows/trigger | Execute workflow |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/alerts | List alerts |
| POST | /api/alerts | Create alert |

### MCP

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/mcp/status | MCP server status |
| GET | /api/mcp/tools | List tools |
| POST | /api/mcp/invoke | Invoke tool |
| GET | /api/mcp/config | MCP config |

### Proposals & Lessons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/proposals | List proposals |
| POST | /api/proposals/review | Review proposal |
| GET | /api/lessons | List lessons |

### Integrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/integrations | List integrations |
| GET | /api/nexus/registry | Registry |
| GET | /api/automations | List automations |
| POST | /api/automations/toggle | Toggle automation |
| POST | /api/automations/trigger | Trigger automation |

### Billing & Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/billing/webhook | Stripe webhook |
| GET | /api/billing/key | Get API key |
| POST | /api/leads | Create lead |

## Bridge Worker Endpoints (bridge.a-to-mind.com)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Worker health |
| GET | /crew/status | Crew status |
| GET | /dashboard | HTML dashboard |
| POST | /webhooks/notion | Notion webhook |
| GET | /proposals | List proposals |
| POST | /proposals | Create proposal |
| GET | /lessons | List lessons |
| POST | /lessons | Create lesson |
| POST | /api/council/log | Council log |

## Common Response Shapes

### Success

```json
{
  "status": "ok",
  "data": { ... }
}
```

### Error

```json
{
  "error": "Error message",
  "code": "AETHER_BUILD_001"
}