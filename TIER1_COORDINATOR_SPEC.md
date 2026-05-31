# Tier 1 Coordinator Agent - ALPHA Bridge Automation

## Overview
A Notion-native custom agent that coordinates ALPHA Bridge deployment and governance workflows, acting as a "Devin-shaped backup" for orchestration and reporting tasks.

## Agent Profile

**Name**: `ALPHA-Bridge-Coordinator`
**Type**: Custom Agent (Notion Automation Center)
**Scope**: Coordination & Orchestration only (no direct deployment)
**Integration Points**: GitHub, Slack, Notion

## Core Capabilities

### 1. GitHub PR Monitoring
- **Trigger**: New PR or PR update in `Aether` repository
- **Actions**:
  - Parse PR title and description for ALPHA Bridge relevance
  - Identify binding changes, migration files, or smoke test updates
  - Extract key changes: D1 bindings, route changes, schema updates
  - Comment on PR with coordination checklist status

### 2. Runbook Updates
- **Trigger**: PR merges with runbook-impacting changes
- **Actions**:
  - Update "ALPHA All-Hands Runbook" with new binding configurations
  - Update route documentation (e.g., `/webhooks/notion` vs `/webhook/notion`)
  - Refresh canonical bindings map with verified D1 configurations
  - Update migration history and schema documentation
  - Link to relevant PRs and smoke test evidence

### 3. All-Hands Checklist Maintenance
- **Trigger**: Deployment status changes, smoke test results
- **Actions**:
  - Update Go/No-Go checklist boxes based on verified evidence
  - Track deployment status (staging/production)
  - Monitor smoke test results and update checklist accordingly
  - Reschedule check-ins when milestones are met
  - Flag blockers requiring human attention

### 4. Slack Notifications
- **Trigger**: Key status changes, blockers, completed milestones
- **Actions**:
  - Post deployment status updates to designated Slack channel
  - Notify when smoke tests pass/fail
  - Alert on Go/No-Go checklist changes
  - Mention responsible parties for approval gates
  - Summarize PR activity affecting ALPHA Bridge

### 5. Evidence Collection
- **Trigger**: Smoke test completion, migration application
- **Actions**:
  - Collect smoke test outputs and D1 query results
  - Store evidence in Notion database linked to relevant deployments
  - Generate summary reports for All-Hands reviews
  - Track historical deployment outcomes

## Integration Configuration

### GitHub Integration
- **Repository**: `Aether` (your monorepo)
- **Events**: Pull requests, Pull request reviews, Issues
- **Filters**: 
  - Files changed: `apps/bridge/*`, `wrangler.toml`, `scripts/*`
  - Labels: `alpha-bridge`, `deployment`, `migration`
- **Permissions**: Read (for monitoring), Comment (for PR updates)

### Notion Integration
- **Target Database**: "ALPHA Bridge Deployments"
- **Linked Pages**: 
  - "ALPHA All-Hands Runbook"
  - "Canonical Bindings Map"
  - "Go/No-Go Checklist"
- **Properties**: Status, Evidence Links, PR References, Timestamp

### Slack Integration
- **Workspace**: Your team workspace
- **Channel**: `#alpha-bridge-deploys` (or designated channel)
- **Bot Permissions**: Write messages, Mention users
- **Notification Triggers**:
  - Deployment status changes
  - Smoke test failures
  - Go/No-Go gate reached
  - Blocker identified

## Workflow Definitions

### Workflow 1: PR Coordination
```
Trigger: New PR in Aether repo affecting ALPHA Bridge
1. Parse PR for ALPHA Bridge relevance
2. Extract binding changes, route updates, schema changes
3. Update PR comment with coordination checklist
4. Create/update deployment tracking record in Notion
5. Notify Slack if high-impact changes detected
```

### Workflow 2: Runbook Synchronization
```
Trigger: PR merge with runbook-impacting changes
1. Identify which runbook sections need updates
2. Draft updates based on PR changes
3. Create runbook update task in Notion
4. Link to PR and evidence
5. Notify responsible party for review
```

### Workflow 3: Smoke Test Evidence Collection
```
Trigger: Smoke test completion (manual trigger or scheduled)
1. Parse smoke test output for key metrics
2. Extract D1 query results showing event persistence
3. Store evidence in Notion deployment record
4. Update Go/No-Go checklist based on results
5. Notify Slack of test results
6. Flag any failures or anomalies
```

### Workflow 4: All-Hands Checklist Management
```
Trigger: Deployment milestone reached
1. Review current checklist state
2. Update boxes based on verified evidence
3. Calculate overall Go/No-Go status
4. Identify remaining blockers
5. Schedule next check-in if appropriate
6. Notify team of status change
```

## Data Structures

### Deployment Record (Notion Database)
```typescript
{
  id: string;
  version: string; // e.g., "0.2.0"
  status: "pending" | "staging" | "production" | "rolled_back";
  pr_number: number;
  commit_sha: string;
  bindings: {
    DB: boolean;
    BRIDGE_DB: boolean;
    STATE: boolean;
    STATE_CACHE: boolean;
    MYBROWSER: boolean;
  };
  smoke_test_passed: boolean;
  evidence_links: string[];
  go_no_go_status: "pending" | "go" | "no-go";
  blockers: string[];
  created_at: string;
  updated_at: string;
}
```

### PR Analysis Result
```typescript
{
  pr_number: number;
  title: string;
  affects_alpha_bridge: boolean;
  changes: {
    bindings: boolean;
    routes: boolean;
    schema: boolean;
    smoke_tests: boolean;
  };
  high_impact: boolean;
  requires_review: string[];
}
```

## Agent Instructions

### System Prompt
```
You are the ALPHA Bridge Coordinator, a specialized automation agent for managing ALPHA Bridge deployment workflows and governance. Your role is to coordinate, track, and report on deployment activities without directly executing deployments.

Your primary responsibilities:
1. Monitor GitHub PRs for ALPHA Bridge changes
2. Maintain runbooks and documentation alignment
3. Track Go/No-Go checklist status
4. Collect and organize deployment evidence
5. Notify the team via Slack of important status changes

You operate within these constraints:
- You cannot execute shell commands or run deployments directly
- You coordinate through GitHub, Notion, and Slack integrations
- You flag decisions requiring human approval
- You maintain accurate records of all deployment activities

When analyzing changes, focus on:
- D1 binding configurations (DB, BRIDGE_DB)
- Route definitions (/webhooks/notion, etc.)
- Database schema migrations
- Smoke test configurations
- Documentation updates

Always provide evidence for your assessments and link to relevant PRs, commits, and test results.
```

### Trigger Handlers

#### GitHub PR Handler
```
When a PR is created/updated in Aether repo:
1. Check if PR affects ALPHA Bridge (file paths, keywords)
2. Analyze changes for binding, route, schema, or test modifications
3. Determine impact level (low/medium/high)
4. Comment on PR with coordination checklist
5. Create/update deployment tracking record
6. Notify Slack if high-impact
```

#### Smoke Test Handler
```
When smoke test evidence is provided:
1. Parse test output for pass/fail status
2. Extract binding validation results
3. Check for webhook persistence evidence
4. Verify idempotency checks
5. Update deployment record with evidence
6. Update Go/No-Go checklist accordingly
7. Notify team of results
```

#### Deployment Milestone Handler
```
When a deployment milestone is reached:
1. Review current checklist state
2. Verify all required evidence is present
3. Update Go/No-Go status
4. Identify any remaining blockers
5. Schedule next check-in if ready
6. Notify team of status change
```

## Setup Instructions

### Step 1: Create Notion Database
1. Create "ALPHA Bridge Deployments" database with schema above
2. Create linked pages for runbook, bindings map, checklist
3. Set up proper permissions for agent access

### Step 2: Configure GitHub Integration
1. Connect Notion Automation Center to GitHub
2. Select Aether repository
3. Configure PR and issue event triggers
4. Set up file path filters for ALPHA Bridge monitoring

### Step 3: Configure Slack Integration
1. Connect Notion Automation Center to Slack
2. Install bot in designated workspace
3. Configure channel and notification preferences
4. Set up mention patterns for approvals

### Step 4: Create Custom Agent
1. Use system prompt and instructions above
2. Configure trigger handlers
3. Set up workflow definitions
4. Test with sample PR and smoke test data

### Step 5: Test and Validate
1. Create test PR with ALPHA Bridge changes
2. Verify agent detects and analyzes correctly
3. Test runbook update workflow
4. Validate Slack notifications
5. Test smoke test evidence collection

## Extension Path to Tier 2

Once Tier 1 is operational, extension to Tier 2 (CI-Dispatcher) would involve:

1. **Add GitHub Actions Integration**
   - Create `workflow_dispatch` enabled deployment workflow
   - Add deployment button to Notion deployment records
   - Configure agent to trigger deployments via GitHub API

2. **Add Deployment Status Polling**
   - Poll GitHub Actions for workflow run status
   - Update deployment records with real-time status
   - Notify team of deployment progress

3. **Add Rollback Coordination**
   - Create rollback trigger workflows
   - Coordinate rollback decisions via Slack
   - Update runbooks with rollback outcomes

## Success Metrics

- **PR Coverage**: 100% of ALPHA Bridge-affecting PRs detected and analyzed
- **Runbook Accuracy**: Runbooks updated within 1 hour of merging changes
- **Checklist Currency**: Go/No-Go checklist reflects latest evidence
- **Notification Timeliness**: Critical status changes notified within 5 minutes
- **Evidence Completeness**: All deployments have complete evidence records

## Current ALPHA Bridge Context

This agent is designed to coordinate the current ALPHA Bridge status:
- **Recent Changes**: BRIDGE_DB binding added, migration created
- **Pending**: Migration application, deployment to staging, smoke test verification
- **Blockers**: D1 schema alignment, log-forwarding decision
- **Next Milestone**: Green smoke test with webhook persistence evidence

The agent should prioritize coordinating the completion of these current blockers and tracking progress toward the next Go/No-Go gate.
