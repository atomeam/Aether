# API Key Manager - Secure Lifecycle Management

## Overview

The API Key Manager is a highly secure, automated API key lifecycle tool that integrates directly into the Aether infrastructure. It implements a default-deny architecture with one-way hashing and edge caching to ensure plain-text secrets are never persisted.

## Architecture

### Default-Deny Security Model

- **Secure Generation**: Uses Web Crypto API (`crypto.getRandomValues`) to generate high-entropy keys
- **One-Way Hashing**: Keys are hashed with SHA-256 before storage; plain-text is returned only once
- **Edge Caching**: KV cache for `key_hash -> permissions` mapping to prevent D1 bottlenecks
- **Admin-Only Access**: All key generation and revocation endpoints require admin authentication
- **Audit Trail**: All key operations are logged in the `api_key_audit_log` table

### Components

1. **Cloudflare Worker** (`apps/api-key-manager/`)
   - Handles key generation, validation, revocation, and listing
   - Implements secure crypto operations
   - Manages KV caching and D1 persistence

2. **D1 Database Schema** (`apps/bridge/migrations/0010_api_keys.sql`)
   - `api_keys` table for key metadata (no plain-text storage)
   - `api_key_audit_log` table for audit trail
   - Indexed for performance on common queries

3. **MCP Tools** (`packages/mcp-server/src/index.ts`)
   - `generate_api_key` - Generate new keys (admin only)
   - `revoke_api_key` - Revoke keys by ID (admin only)
   - `validate_api_key` - Validate keys and return permissions
   - `list_api_keys` - List keys with filters (admin only)

## Deployment Steps

### 1. Run Database Migration

```bash
cd Aether/apps/bridge
npx wrangler d1 execute aether-bridge-db --local --file=./migrations/0010_api_keys.sql
```

For production:
```bash
npx wrangler d1 execute aether-bridge-db --file=./migrations/0010_api_keys.sql
```

### 2. Create Custom Domain (Optional)

The worker is configured to use `api-keys.a-to-mind.com`. Create this domain in Cloudflare:

```bash
npx wrangler domains create api-keys.a-to-mind.com
```

### 3. Deploy the Worker

```bash
cd Aether/apps/api-key-manager
npm install
npm run build
npx wrangler deploy
```

### 4. Set Environment Variables

Add the following to your environment or `.env` file:

```bash
ADMIN_API_KEY=your_secure_admin_key_here
API_KEY_MANAGER_URL=https://api-keys.a-to-mind.com
```

### 5. Update MCP Server Configuration

Build the MCP server with the new tools:

```bash
cd Aether/packages/mcp-server
npm run build
```

Update your Claude Desktop configuration to include the new environment variables:

```json
{
  "mcpServers": {
    "aether": {
      "command": "node",
      "args": ["C:\\Users\\adamm\\Aether\\packages\\mcp-server\\build\\index.js"],
      "env": {
        "AETHER_BACKEND_URL": "http://localhost:3000",
        "API_KEY_MANAGER_URL": "https://api-keys.a-to-mind.com",
        "ADMIN_API_KEY": "your_admin_api_key_here"
      }
    }
  }
}
```

## API Endpoints

### Generate API Key (Admin Only)

```bash
POST /api/admin/keys/generate
Authorization: Bearer ADMIN_API_KEY

{
  "owner_id": "integration_123",
  "permissions": "read",
  "expires_in_days": 30
}
```

**Response:**
```json
{
  "success": true,
  "key": "atm_live_abc123def456...",
  "key_id": "key_abc123",
  "key_prefix": "abc123de",
  "permissions": "read",
  "expires_at": "2024-02-15T10:30:00Z"
}
```

**IMPORTANT**: The full `key` is only returned once. Store it securely.

### Validate API Key

```bash
POST /api/keys/validate

{
  "key": "atm_live_abc123def456..."
}
```

**Response:**
```json
{
  "valid": true,
  "key_id": "key_abc123",
  "permissions": "read"
}
```

### Revoke API Key (Admin Only)

```bash
POST /api/admin/keys/{key_id}/revoke
Authorization: Bearer ADMIN_API_KEY
```

**Response:**
```json
{
  "success": true
}
```

### List API Keys (Admin Only)

```bash
GET /api/admin/keys?owner_id=integration_123&status=active
Authorization: Bearer ADMIN_API_KEY
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "id": "key_abc123",
      "key_prefix": "abc123de",
      "owner_id": "integration_123",
      "permissions": "read",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-02-15T10:30:00Z",
      "last_used_at": "2024-01-16T14:20:00Z"
    }
  ]
}
```

## MCP Tool Usage

### Generate API Key

```
Use the generate_api_key MCP tool to create a new API key for an integration.
Parameters:
- owner_id: The integration or system identifier
- permissions: Scope of access (read, write, admin)
- expires_in_days: Optional expiration in days
```

### Validate API Key

```
Use the validate_api_key MCP tool to check if a key is valid and return its permissions.
Parameters:
- key: The API key to validate
```

### Revoke API Key

```
Use the revoke_api_key MCP tool to revoke a key by ID.
Parameters:
- key_id: The ID of the key to revoke
```

### List API Keys

```
Use the list_api_keys MCP tool to audit existing keys.
Parameters:
- owner_id: Optional filter by owner
- status: Optional filter by status (active, revoked)
```

## Security Features

### 1. One-Way Hashing
- Keys are hashed with SHA-256 before storage
- Only the hash is stored in D1
- Plain-text keys are never persisted

### 2. Edge Caching
- KV cache for fast authorization lookups
- Reduces D1 load on every API request
- Cache expires naturally or on key revocation

### 3. Audit Trail
- All key operations are logged
- Tracks who created/revoked keys and when
- Stores old/new status for compliance

### 4. Default-Deny Access
- Admin endpoints require authentication
- Key generation is restricted to authorized users
- Permissions are scoped to minimum required access

### 5. Key Prefix Display
- First 8 characters stored as `key_prefix`
- Safe for UI display in Homebase
- Allows identification without exposing full key

## Agent Integration

The system includes persistent memory integration through:

1. **MCP Tool Registration**: Tools are registered in the MCP server manifest
2. **System Prompt Directives**: AGENTS.md includes protocol for all operational agents
3. **Canonical Route Mapping**: API_DOCUMENTATION.md includes all endpoints
4. **Environment Configuration**: MCP server config includes API_KEY_MANAGER_URL

### Agent Protocol

When an agent needs to provision API access:

1. Use `generate_api_key` MCP tool
2. Specify appropriate permissions (minimum required scope)
3. Store the returned key securely (only shown once)
4. Log key_id and key_prefix for reference
5. Set expiration if temporary access is needed

When validating access:

1. Use `validate_api_key` MCP tool
2. Cache the result to avoid repeated calls
3. Handle invalid/expired keys appropriately

## Troubleshooting

### Worker Deployment Fails

- Check that the custom domain exists in Cloudflare
- Verify wrangler.toml configuration
- Ensure D1 database exists and is accessible

### MCP Tools Not Available

- Rebuild the MCP server: `cd packages/mcp-server && npm run build`
- Restart Claude Desktop after configuration changes
- Verify environment variables are set correctly

### Key Validation Fails

- Check that the key hasn't been revoked
- Verify the key hasn't expired
- Ensure KV cache is not stale (will auto-expire)

### Database Migration Fails

- Verify D1 database exists: `npx wrangler d1 list`
- Check migration file syntax
- Run with `--local` flag for local testing first

## Monitoring

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "api-key-manager",
  "version": "1.0.0",
  "bindings": {
    "KEY_CACHE": true,
    "DB": true
  }
}
```

### Audit Trail Monitoring

Query the `api_key_audit_log` table regularly to monitor:
- Unauthorized key generation attempts
- Suspicious revocation patterns
- Keys created by unknown actors

## Next Steps

1. **Deploy the worker** to production
2. **Run the migration** on production D1 database
3. **Set up monitoring** for the audit trail
4. **Integrate with Homebase** to display key_prefix in UI
5. **Configure rotation policies** for long-lived keys
6. **Set up alerts** for suspicious key activity

## Files Created/Modified

### Created
- `apps/api-key-manager/wrangler.toml` - Worker configuration
- `apps/api-key-manager/package.json` - Dependencies
- `apps/api-key-manager/tsconfig.json` - TypeScript config
- `apps/api-key-manager/src/index.ts` - Worker implementation
- `apps/bridge/migrations/0010_api_keys.sql` - Database schema

### Modified
- `packages/mcp-server/src/index.ts` - Added 4 MCP tools
- `API_DOCUMENTATION.md` - Added API key management endpoints
- `AGENTS.md` - Added agent protocol directives and MCP tool documentation

## Support

For issues or questions:
- Check the audit trail in D1 for operation logs
- Review worker logs in Cloudflare dashboard
- Consult AGENTS.md for agent integration guidelines
