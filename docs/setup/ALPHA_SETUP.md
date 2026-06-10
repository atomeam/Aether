# Alpha Configuration Guide

This document outlines the environment variables and configuration keys needed to run Alpha with the IntegrationManager, VictusBridge, and Orchestrator.

## Environment Variables

### External API Keys

Set these in your local `.env` file or environment:

```bash
# Stripe - Payment Processing
STRIPE_API_KEY=sk_test_...

# HubSpot - CRM
HUBSPOT_API_KEY=...

# Slack - Team Communication  
SLACK_BOT_TOKEN=xoxb-...

# Sentry - Error Monitoring (optional)
SENTRY_AUTH_TOKEN=...
```

### Local Runtime

```bash
# Victus Runtime (default port 8080)
VICTUS_RUNTIME_URL=http://localhost:8080

# Victus MCP Server (if using filesystem-mcp)
MCP_SERVER_URL=http://localhost:3100
```

## Configuration (`config/integrations.json`)

The `config/integrations.json` file defines integrations. Example structure:

```json
{
  "integrations": [
    {
      "name": "stripe",
      "type": "api",
      "enabled": true,
      "baseUrl": "https://api.stripe.com/v1",
      "apiKeyEnvVar": "STRIPE_API_KEY"
    },
    {
      "name": "hubspot",
      "type": "api", 
      "enabled": true,
      "baseUrl": "https://api.hubapi.com",
      "apiKeyEnvVar": "HUBSPOT_API_KEY"
    },
    {
      "name": "slack",
      "type": "api",
      "enabled": true,
      "baseUrl": "https://slack.com/api",
      "apiKeyEnvVar": "SLACK_BOT_TOKEN"
    },
    {
      "name": "filesystem-mcp",
      "type": "mcp",
      "enabled": true,
      "mcpServerUrl": "http://localhost:3100",
      "mcpTools": ["read_file", "write_file", "list_directory"]
    }
  ]
}
```

## Quick Setup

1. **Copy `.env.example` to `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Add your API keys** to the `.env` file

3. **Verify health** before running:
   ```bash
   curl http://localhost:8080/health
   ```

## VictusBridge Default Config

- Runtime URL: `http://localhost:8080`
- Health endpoint: `/health`
- Command endpoint: `/execute`

## IntegrationManager Features

- **Auth Types:** `bearer` (default), `basic`, `api_key`
- Auto-injects API keys from env vars into request headers
- Supports both REST APIs and MCP servers

## Troubleshooting

- **Missing API key:** Set the variable in `.env` and restart
- **Connection refused:** Verify Victus is running on port 8080
- **Integration disabled:** Check `enabled: true` in `integrations.json`