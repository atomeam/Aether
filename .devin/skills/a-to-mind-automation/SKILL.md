---
name: a-to-mind-automation
description: a-to-mind enterprise automation platform - infrastructure, API endpoints, workflow management, and integration patterns
---

# a-to-mind Automation Platform

Enterprise automation platform for building, deploying, and scaling intelligent automation workflows.

## Project Structure

**Apps (40+ worker applications):**
- `apps/backend` - Main API server with 87 endpoints
- `apps/frontend` - React dashboard (Vite + TypeScript)
- `apps/bridge` - Cloudflare Workers bridge
- `apps/api-worker`, `apps/alert-manager`, `apps/billing-worker`, etc.

**Packages (20+ shared libraries):**
- `@aether/workflow` - Workflow execution engine
- `@aether/curator` - Security gate for AI actions
- `@aether/contracts` - Zod type definitions
- `@aether/mcp-tools` - MCP tool registry
- `@aether/chaos`, `@aether/alerts`, `@aether/telemetry`, etc.

## Key API Endpoints

**Automation Management:**
- `GET /api/automations` - List scheduled jobs and workflows
- `POST /api/automations/toggle` - Enable/disable jobs
- `POST /api/automations/trigger` - Trigger jobs manually

**Integrations:**
- `GET /api/integrations` - List connected services (PostgreSQL, Cloudflare, GitHub, n8n, OpenAI, Notion)

**Workflows:**
- `GET /api/workflows` - List available workflows
- `POST /api/workflows/trigger` - Execute workflow

**System:**
- `GET /api/stack` - Backend health check
- `GET /api/agents` - Agent system status
- `GET /api/health` - Unified health dashboard

**MCP Server:**
- `GET /api/mcp/status` - MCP server status
- `GET /api/mcp/tools` - List available MCP tools
- `POST /api/mcp/invoke` - Invoke MCP tool
- `GET /api/mcp/config` - MCP configuration

## Development Commands

```bash
# Install dependencies
npm install

# Run backend (port 3000)
npm run dev:backend

# Run frontend (port 5173)
npm run dev:frontend

# Build frontend
npm run build -w @aether/frontend

# Build backend
npm run build -w @aether/backend

# Run all workspaces
npm run dev
```

## Deployment

**Frontend (Vercel):**
```bash
cd apps/frontend
npm run build
vercel --prod --yes
```

**Backend (Vercel):**
```bash
cd apps/backend
npm run build
vercel --prod --yes
```

## Integration Patterns

**n8n Workflows:**
- Use n8n for complex multi-step automations
- Connect via webhook endpoints
- GitHub, Notion, Slack integrations available

**Cloudflare Workers:**
- Bridge app handles webhook routing
- KV storage for state management
- Queues for async processing

**MCP Tools:**
- 32 MCP tools available for AI agents
- System Health, Monitoring, Alerts, Workflows, Agents, Learning, Chaos, Journal, Configuration
- Use `POST /api/mcp/invoke` to execute tools

## Security

- Curator gate validates all AI-generated actions
- Default-deny policy for component types
- Rate limiting on tool usage
- Secrets managed via environment variables

## When to Use This Skill

Use this skill when:
- Working with a-to-mind automation platform codebase
- Adding new API endpoints or workflows
- Integrating new services (PostgreSQL, GitHub, n8n, etc.)
- Deploying to Vercel
- Debugging automation workflows
- Working with MCP tools
- Building new worker applications

## Important Notes

- Frontend uses relative API paths (`/api/...`) for production compatibility
- Backend serves frontend static files in production
- All API calls should use relative paths, not `localhost:3000`
- Use existing packages and patterns before creating new ones
- Follow the existing 40+ worker app structure for new automation components