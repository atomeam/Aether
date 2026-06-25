# Error Catalog

## Error Code Format: AETHER_{MODULE}_{NUMBER}

### Build Errors

| Code | Message | Fix |
|------|---------|-----|
| AETHER_BUILD_001 | Invalid build request | Check request schema |
| AETHER_BUILD_002 | Curator rejected | Review curator config |
| AETHER_BUILD_003 | Gemini API error | Check GEMINI_API_KEY |
| AETHER_BUILD_004 | Migration validation failed | Reduce component count |
| AETHER_BUILD_005 | Executor failure | Check tool parameters |

### Auth Errors

| Code | Message | Fix |
|------|---------|-----|
| AETHER_AUTH_001 | Missing API key | Include API key |
| AETHER_AUTH_002 | Invalid API key | Verify key |
| AETHER_AUTH_003 | Rate limited | Wait and retry |
| AETHER_AUTH_004 | Tier exceeded | Upgrade tier |

### Database Errors

| Code | Message | Fix |
|------|---------|-----|
| AETHER_DB_001 | Query failed | Check query syntax |
| AETHER_DB_002 | Table not found | Run migrations |
| AETHER_DB_003 | Connection failed | Check D1 status |

### Worker Errors

| Code | Message | Fix |
|------|---------|-----|
| AETHER_WORKER_001 | Binding not found | Check wrangler.toml |
| AETHER_WORKER_002 | Queue error | Check queue config |
| AETHER_WORKER_003 | Cron error | Check cron logs |

### Gemini Errors

| Code | Message | Fix |
|------|---------|-----|
| AETHER_GEMINI_001 | Quota exceeded | Wait or upgrade |
| AETHER_GEMINI_002 | Invalid response | Check API version |
| AETHER_GEMINI_003 | Timeout | Retry with shorter prompt |