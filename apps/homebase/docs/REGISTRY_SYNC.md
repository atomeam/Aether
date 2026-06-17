# Registry Sync - Automation Center Self-Knowledge

**Purpose**: Syncs automation_consolidation_v2 state to Notion "Automation Center Registry" database  
**Last Updated**: 2026-05-26  
**Workflow ID**: `registry_sync`

---

## 🎯 What It Does

The registry sync workflow enables the automation system to "know itself" by maintaining an up-to-date inventory in Notion. It automatically discovers and syncs:

- **Orchestrator Service**: Main service endpoint and status
- **Workflows**: All configured workflows from `config.yaml`
- **Wrappers**: All wrapper scripts in `migrations/` directory
- **Documentation**: Key documentation files in `docs/`
- **Configuration**: Main config files and templates

---

## 🚀 Quick Start

### 1. Configure Notion Credentials

Edit `backbone/config/.env`:

```bash
# Notion API token for registry sync workflow
# Get your token from: https://www.notion.so/my-integrations
NOTION_TOKEN=your_notion_token_here

# Notion database URL for Automation Center Registry
REGISTRY_DB_URL=https://www.notion.so/ff3622029b2c4933b3efb90487a49ec1
```

### 2. Run Sync

**Via API**:
```bash
curl -X POST http://localhost:3333/ops/registry/sync \
  -H "Content-Type: application/json" -d "{}"
```

**Via Web UI**:
1. Navigate to http://localhost:3333/workflows
2. Find "registry_sync" in the workflow list
3. Click "Run Now"

---

## 📊 What Gets Synced

### Orchestrator Service
- **Name**: Automation Orchestrator
- **Kind**: Service
- **Location**: http://localhost:3333
- **Status**: Active
- **Entry URL**: http://localhost:3333/

### Workflows
All workflows defined in `backbone/config/config.yaml`:
- **Name**: Workflow ID (e.g., `homebase_wrapper`)
- **Kind**: Workflow
- **Location**: `backbone/config/config.yaml`
- **Status**: Active (if enabled) or Planned (if disabled)
- **Entry URL**: http://localhost:3333/workflows

### Wrappers
All `.ts` files in `migrations/` directory (except `registry_sync.ts`):
- **Name**: Wrapper filename (e.g., `homebase_wrapper`)
- **Kind**: Wrapper
- **Location**: `migrations/{filename}.ts`
- **Status**: Active (if used in config) or Planned (if available but unused)

### Documentation
Key documentation files from `docs/`:
- OPERATOR_ONE_PAGER.md
- ONE_PAGER.md
- REALITY_CHECK.md
- CONFIG_SAFETY.md
- CONSOLIDATION_PLAN.md

- **Name**: Document name (without .md)
- **Kind**: Doc
- **Location**: `docs/{filename}.md`
- **Status**: Stable

### Configuration
Key configuration files:
- **Main Config**: `backbone/config/config.yaml` (Active)
- **Environment Template**: `backbone/config/.env.example` (Stable)

---

## 🔧 How It Works

### Idempotent Upsert Behavior
- **Matching Rule**: Uses Name + Kind as primary key
- **If exists**: Updates the item with current state
- **If not exists**: Creates new item
- **Result**: Running multiple times does not create duplicates

### Status Logic
- **Active**: Workflow is enabled in configuration
- **Planned**: Workflow exists but is disabled
- **Stable**: Documentation and config templates (always stable)

### Last Verified Timestamp
- Set to current time when item is synced
- Indicates when the system last confirmed the item exists

### Safety Features
- **No secrets**: Only writes names and file paths, never values
- **No external changes**: Only modifies Notion database, not filesystem
- **Graceful failure**: Returns SKIPPED status if credentials missing

---

## 📋 Response Format

### Success Response
```json
{
  "runId": "run_abc123...",
  "status": "completed",
  "startTime": "2026-05-26T23:00:00.000Z",
  "endTime": "2026-05-26T23:00:05.000Z",
  "duration": 5000,
  "output": {
    "success": true,
    "result": {
      "created": 5,
      "updated": 10,
      "skipped": 0,
      "errors": []
    },
    "totalItems": 15,
    "timestamp": "2026-05-26T23:00:05.000Z"
  }
}
```

### Error Response (Missing Credentials)
```json
{
  "runId": "run_abc123...",
  "status": "skipped",
  "startTime": "2026-05-26T23:00:00.000Z",
  "endTime": "2026-05-26T23:00:00.100Z",
  "duration": 100,
  "output": {
    "success": false,
    "error": "Missing required environment variables: NOTION_TOKEN and/or REGISTRY_DB_URL",
    "action": "Set NOTION_TOKEN and REGISTRY_DB_URL in backbone/config/.env"
  }
}
```

---

## ⚙️ Configuration

### Environment Variables
- **NOTION_TOKEN**: Notion API integration token
- **REGISTRY_DB_URL**: Notion database URL for Automation Center Registry

### Workflow Configuration
In `backbone/config/config.yaml`:
```yaml
registry_sync:
  enabled: true  # Manual trigger workflow
  schedule: null  # Manual trigger only
  timeout: 120000
  retries: 1
  description: "Sync automation_consolidation_v2 state to Notion Automation Center Registry"
  handler: "migrations/registry_sync.ts"
  safety: "SAFE"
```

---

## 🔍 Troubleshooting

### Missing Credentials
**Error**: "Missing required environment variables: NOTION_TOKEN and/or REGISTRY_DB_URL"

**Solution**: 
1. Edit `backbone/config/.env`
2. Add your Notion token and database URL
3. Restart orchestrator

### Notion Connection Failed
**Error**: "Failed to connect to Notion database"

**Solution**:
1. Verify NOTION_TOKEN is valid
2. Check REGISTRY_DB_URL is correct
3. Ensure Notion integration has database access permissions

### Partial Sync Success
**Error**: Some items fail to sync (check `errors` array in response)

**Solution**:
1. Check orchestrator logs: `tail -f logs/orchestrator.log`
2. Verify Notion database schema matches expected properties
3. Check for rate limiting or API errors

---

## 📝 Notion Database Schema

The Notion "Automation Center Registry" database should have these properties:

- **Name** (title): Item name
- **Kind** (select): Workflow, Wrapper, Project, Service, Config, Doc
- **Status** (status): Planned, Active, Stable
- **Location** (text): File path or URL
- **Entry URL** (url): Optional URL for accessing the item
- **Owner** (select): You (Operator), Devin, OpenHands, Cloud helper
- **Last verified** (date): Last sync timestamp
- **Notes** (text): Additional information

---

## 🎯 Use Cases

### Initial Setup
Run once to populate the Notion database with current system state.

### Regular Updates
Run after adding new workflows, wrappers, or documentation to keep registry current.

### System Audits
Use Notion database view to see what's currently in the automation system.

### Change Tracking
Compare "Last verified" timestamps to identify stale items.

---

## 🔒 Security

- **No secrets written**: Only file paths and names, never environment variable values
- **Read-only filesystem**: Does not modify any files outside automation_consolidation_v2
- **Notion permissions**: Requires integration token with database write access
- **Manual trigger**: Only runs when explicitly triggered (no automatic schedule)

---

## 📞 Support

### Documentation
- `docs/OPERATOR_ONE_PAGER.md` - Day-to-day operations
- `docs/ONE_PAGER.md` - System overview
- `docs/CONFIG_SAFETY.md` - Safety guidance

### Logs
- Orchestrator: `logs/orchestrator.log`
- Run history: `runs/runs.jsonl`

### Getting Help
1. Check environment variables are set correctly
2. Verify Notion integration permissions
3. Review orchestrator logs for detailed error messages
4. Test Notion API connection manually

---

**Workflow Maintained By**: Devin Automation Agent  
**Last Review**: 2026-05-26  
**Next Review**: 2026-06-26