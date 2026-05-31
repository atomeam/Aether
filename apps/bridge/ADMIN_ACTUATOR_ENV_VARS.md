# Admin Actuator Endpoints - Required Environment Variables

## Overview
The admin actuator endpoints (`/admin/*`) require the following environment variables to be configured in Cloudflare Workers secrets.

## Required Secrets

### Admin Authentication
- `ADMIN_HMAC_SECRET` - Secret key for HMAC signature verification (generate with: `openssl rand -hex 32`)

### GitHub Integration
- `GITHUB_TOKEN` - GitHub personal access token with `repo:workflow` scope
- `GITHUB_REPO` - Repository in format "owner/repo" (e.g., "atomeam/Aether")
- `GITHUB_WORKFLOW` - Workflow filename (e.g., "deploy-aether-bridge.yml")

### Cloudflare Integration
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Worker deployment permissions
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

### Notion Integration
- `NOTION_RUNS_DB_ID` - Notion database ID for Runs ledger

## Existing Secrets (Already Configured)
- `NOTION_API_TOKEN` - Notion API integration token
- `NOTION_BRIDGE_COMMANDS_DB_ID` - Bridge Commands database ID
- `NOTION_BRIDGE_LOGS_DB_ID` - Bridge Logs database ID
- `ATOMIND_DEVIN_SECRET` - Devin agent secret
- `ATOMIND_GEMINI_SECRET` - Gemini agent secret
- `ATOMIND_VIKTOR_SECRET` - Viktor agent secret

## Setup Commands

```bash
# Generate admin HMAC secret
ADMIN_SECRET=$(openssl rand -hex 32)
echo "Save this secret: $ADMIN_SECRET"

# Set secrets in Cloudflare Workers
cd apps/bridge
wrangler secret put ADMIN_HMAC_SECRET
# Paste the generated secret when prompted

wrangler secret put GITHUB_TOKEN
# Paste your GitHub token

wrangler secret put GITHUB_REPO
# Enter: atomeam/Aether

wrangler secret put GITHUB_WORKFLOW
# Enter: deploy-aether-bridge.yml

wrangler secret put CLOUDFLARE_API_TOKEN
# Paste your Cloudflare API token

wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Enter your Cloudflare account ID

wrangler secret put NOTION_RUNS_DB_ID
# Enter your Notion Runs database ID

# Deploy
wrangler deploy
```

## Security Notes

1. **HMAC Secret**: Use a cryptographically secure random secret (32 bytes hex-encoded)
2. **GitHub Token**: Minimum scope: `repo:workflow` for workflow dispatch
3. **Cloudflare Token**: Requires permissions for Worker deployment and account management
4. **Replay Protection**: 300-second window prevents replay attacks
5. **Audit Logging**: All admin calls are logged to D1 `admin_audit_log` table

## Testing

After deployment, test the endpoints:

```bash
# Run test suite
cd apps/bridge
tsx test_admin_actuator.ts

# Manual test (requires ADMIN_HMAC_SECRET)
curl -X GET https://aether-bridge.atomicmoonbeam88.workers.dev/admin/cloudflare/verify-token-scopes \
  -H "X-Atomind-Timestamp: $(date +%s)" \
  -H "X-Atomind-Signature: sha256=$(echo -n "$(date +%s):" | openssl dgst -sha256 -hmac $ADMIN_SECRET | sed 's/^.*= //')"
```

## Migration

Run the D1 migration to create the audit log table:

```bash
cd apps/bridge
wrangler d1 execute BRIDGE_DB --file=migrations/0009_admin_audit_log.sql
```