# Tier 1 Coordinator - Quick Start Guide

## What You're Getting
A Notion-native automation agent that coordinates ALPHA Bridge deployment workflows - your "Devin-shaped backup" for orchestration and reporting.

## What It Does
- **Monitors GitHub PRs** for ALPHA Bridge changes
- **Updates runbooks** automatically when things change
- **Maintains Go/No-Go checklist** based on real evidence
- **Sends Slack notifications** for important status changes
- **Collects deployment evidence** for audit trails

## What It Doesn't Do (Intentionally)
- No shell command execution
- No direct deployments
- No wrangler operations
- Those stay with your existing GitHub Actions

## Setup Time: ~30 minutes

## Immediate Next Steps

### 1. Prepare Notion (5 minutes)
- Create "ALPHA Bridge Deployments" database
- Ensure your runbook and bindings map pages exist
- Set up proper permissions

### 2. Connect Integrations (10 minutes)
- Connect GitHub to Notion Automation Center
- Connect Slack to Notion Automation Center
- Test both connections

### 3. Create the Agent (10 minutes)
- Use the system prompt from `TIER1_COORDINATOR_SPEC.md`
- Configure GitHub and Slack triggers
- Set up the 4 core workflows

### 4. Test & Validate (5 minutes)
- Create a test PR to verify detection
- Send a test Slack notification
- Create a sample deployment record

## Key Files Created

1. **`TIER1_COORDINATOR_SPEC.md`** - Complete agent specification
   - System prompt and instructions
   - Workflow definitions
   - Data structures
   - Integration configuration

2. **`TIER1_SETUP_CHECKLIST.md`** - Step-by-step setup guide
   - Pre-setup preparation
   - Automation Center configuration
   - Testing & validation
   - Troubleshooting guide

3. **`TIER1_QUICKSTART.md`** - This file

## Current ALPHA Bridge Context

The agent is designed to handle your current situation:

**Recent Changes Completed:**
- ✅ BRIDGE_DB binding added to wrangler.toml
- ✅ Migration file created (0002_events_council_logs.sql)
- ✅ Documentation updated (CANONICAL_BINDINGS_MAP.md)
- ✅ Smoke tests updated

**Pending Blockers:**
- ⏳ Migration application to aether-bridge-db
- ⏳ Deployment to staging
- ⏳ Smoke test verification with webhook persistence
- ⏳ Log-forwarding decision

**First Task for Agent:**
Once set up, the agent should:
1. Create a deployment record for current v0.2.0 state
2. Monitor for the migration application
3. Track the staging deployment
4. Collect smoke test evidence
5. Update the Go/No-Go checklist as blockers clear

## Extension Path

After Tier 1 is working, you can extend to:
- **Tier 2**: Add CI-dispatch capabilities (trigger GitHub Actions deployments from Notion)
- **Tier 3**: Direct execution via MCP tools (requires infra work)

## Success Metrics

You'll know it's working when:
- GitHub PRs are automatically analyzed
- Runbook updates happen without manual intervention
- Go/No-Go checklist stays current
- Slack notifications keep the team informed
- Deployment evidence is automatically collected

## Support

If you run into issues:
1. Check `TIER1_SETUP_CHECKLIST.md` troubleshooting section
2. Review Automation Center logs for errors
3. Verify integration connections are active
4. Test with simple scenarios first

## Ready to Start?

1. Open `TIER1_SETUP_CHECKLIST.md`
2. Follow the pre-setup preparation steps
3. Configure your Automation Center
4. Test with your current ALPHA Bridge context

The agent will immediately start providing value by coordinating your current deployment workflow and keeping everything in sync.
