# Tier 1 Coordinator Setup Checklist

## Pre-Setup Preparation

### Notion Setup
- [ ] Create "ALPHA Bridge Deployments" database
  - [ ] Add properties: Status, Version, PR Number, Commit SHA, Bindings, Smoke Test, Go/No-Go, Blockers
  - [ ] Set up relations to: Runbook page, Bindings Map page, Checklist page
- [ ] Verify "ALPHA All-Hands Runbook" page exists and is accessible
- [ ] Verify "Canonical Bindings Map" page exists and is accessible
- [ ] Create "Go/No-Go Checklist" if it doesn't exist
- [ ] Set up proper permissions for Automation Center bot

### GitHub Setup
- [ ] Verify GitHub token has necessary permissions
- [ ] Confirm Aether repository is accessible
- [ ] Identify which labels to use for ALPHA Bridge PRs
- [ ] Decide on Slack channel for notifications

### Slack Setup
- [ ] Identify target Slack workspace
- [ ] Create/designate channel for ALPHA Bridge notifications
- [ ] Get bot installation permissions
- [ ] Identify users to mention for approvals

## Automation Center Configuration

### Step 1: Create Custom Agent
- [ ] Navigate to Notion Automation Center
- [ ] Create new custom agent named "ALPHA-Bridge-Coordinator"
- [ ] Copy system prompt from TIER1_COORDINATOR_SPEC.md
- [ ] Configure agent capabilities (GitHub, Slack, Notion)
- [ ] Set up agent description and instructions

### Step 2: Configure GitHub Integration
- [ ] Connect GitHub account to Automation Center
- [ ] Select Aether repository
- [ ] Enable triggers:
  - [ ] Pull requests (opened, updated, closed)
  - [ ] Issues (opened, updated)
- [ ] Set up filters:
  - [ ] File paths: `apps/bridge/*`, `wrangler.toml`, `scripts/*`, `*.md`
  - [ ] Labels: `alpha-bridge`, `deployment`, `migration` (if used)
- [ ] Test integration with a sample PR

### Step 3: Configure Slack Integration
- [ ] Connect Slack workspace to Automation Center
- [ ] Install bot in workspace
- [ ] Authorize bot for target channel
- [ ] Configure notification preferences:
  - [ ] Deployment status changes
  - [ ] Smoke test results
  - [ ] Go/No-Go gate changes
  - [ ] High-impact PRs
- [ ] Test notification with sample message

### Step 4: Create Workflow Triggers

#### PR Monitoring Workflow
- [ ] Create trigger: "New PR in Aether repo"
- [ ] Add condition: Files match ALPHA Bridge paths
- [ ] Configure actions:
  - [ ] Parse PR for relevance
  - [ ] Analyze changes (bindings, routes, schema, tests)
  - [ ] Comment on PR with coordination checklist
  - [ ] Create/update deployment record
  - [ ] Notify Slack if high-impact
- [ ] Test with sample PR

#### Runbook Update Workflow
- [ ] Create trigger: "PR merged with runbook changes"
- [ ] Add condition: Runbook files modified
- [ ] Configure actions:
  - [ ] Identify affected runbook sections
  - [ ] Draft updates based on changes
  - [ ] Create update task in Notion
  - [ ] Link to PR and evidence
  - [ ] Notify responsible party
- [ ] Test with sample runbook change

#### Smoke Test Evidence Workflow
- [ ] Create trigger: "Smoke test evidence provided"
- [ ] Add condition: Manual trigger or scheduled
- [ ] Configure actions:
  - [ ] Parse smoke test output
  - [ ] Extract D1 query results
  - [ ] Store evidence in deployment record
  - [ ] Update Go/No-Go checklist
  - [ ] Notify Slack of results
- [ ] Test with sample smoke test output

#### All-Hands Checklist Workflow
- [ ] Create trigger: "Deployment milestone reached"
- [ ] Add condition: Status change in deployment record
- [ ] Configure actions:
  - [ ] Review checklist state
  - [ ] Update Go/No-Go status
  - [ ] Identify remaining blockers
  - [ ] Schedule next check-in
  - [ ] Notify team of status
- [ ] Test with sample milestone

## Testing & Validation

### Unit Tests
- [ ] Test PR parsing with various PR types
- [ ] Test change detection (bindings, routes, schema, tests)
- [ ] Test impact level classification
- [ ] Test Notion database record creation
- [ ] Test Slack notification formatting

### Integration Tests
- [ ] Test end-to-end PR monitoring workflow
- [ ] Test runbook synchronization workflow
- [ ] Test smoke test evidence collection
- [ ] Test checklist management workflow
- [ ] Test error handling and recovery

### Real-World Validation
- [ ] Monitor next actual ALPHA Bridge PR
- [ ] Verify agent detects and analyzes correctly
- [ ] Check PR comments are appropriate
- [ ] Verify deployment records are accurate
- [ ] Confirm Slack notifications are timely
- [ ] Validate runbook updates are correct

## Current ALPHA Bridge Context Setup

### Initial Data Entry
- [ ] Create deployment record for current state (v0.2.0)
- [ ] Set status to "pending" (awaiting migration)
- [ ] Record current binding configuration
- [ ] Note pending migration: `0002_events_council_logs.sql`
- [ ] Document current blockers:
  - [ ] D1 schema alignment
  - [ ] Log-forwarding decision
- [ ] Set Go/No-Go status to "no-go"
- [ ] Link to relevant PRs and documentation

### Current State Tracking
- [ ] Record BRIDGE_DB binding addition
- [ ] Note migration file creation
- [ ] Track documentation updates (CANONICAL_BINDINGS_MAP.md)
- [ ] Monitor for migration application
- [ ] Prepare for staging deployment
- [ ] Set up smoke test evidence collection

## Ongoing Operations

### Daily Checks
- [ ] Review new PRs for ALPHA Bridge impact
- [ ] Check deployment record status updates
- [ ] Verify Slack notifications are working
- [ ] Monitor for any agent errors

### Weekly Reviews
- [ ] Review agent performance metrics
- [ ] Check runbook alignment accuracy
- [ ] Validate Go/No-Go checklist currency
- [ ] Assess evidence completeness

### Monthly Optimizations
- [ ] Review and refine agent instructions
- [ ] Update workflow triggers as needed
- [ ] Adjust notification preferences
- [ ] Update integration configurations

## Troubleshooting

### Common Issues
- [ ] Agent not detecting PRs → Check GitHub integration filters
- [ ] Slack notifications not sending → Verify bot permissions
- [ ] Notion records not creating → Check database permissions
- [ ] Runbook updates incorrect → Review parsing logic
- [ ] False positives on PR relevance → Adjust keyword matching

### Escalation Path
1. Check Automation Center logs for errors
2. Verify integration connections are active
3. Review agent instructions for clarity
4. Test with simple known-good scenario
5. Contact Notion support if platform issues

## Success Criteria

### Phase 1 (Week 1)
- [ ] Agent successfully monitors GitHub PRs
- [ ] Basic Slack notifications working
- [ ] Notion database records being created
- [ ] No critical errors in logs

### Phase 2 (Week 2)
- [ ] All workflows operational
- [ ] Runbook updates automated
- [ ] Go/No-Go checklist maintained
- [ ] Evidence collection working

### Phase 3 (Week 3+)
- [ ] 100% PR coverage achieved
- [ ] Runbook accuracy >95%
- [ ] Team satisfied with notifications
- [ ] Ready for Tier 2 extension planning

## Notes

### Customization for Your Environment
- Update repository name if different from "Aether"
- Adjust file path filters based on your structure
- Customize Slack channel and notification preferences
- Modify database schema to match your needs
- Adapt Go/No-Go criteria to your process

### Integration with Existing Tools
- If using Jira/Linear, can add issue tracking integration
- If using other CI systems, can adapt deployment monitoring
- If using different documentation system, can adjust runbook sync
- Consider adding PagerDuty/Opsgenie for critical alerts

### Security Considerations
- Limit GitHub token permissions to minimum required
- Use environment variables for sensitive data
- Regularly review and rotate integration tokens
- Monitor agent access logs for unusual activity
- Keep agent instructions updated with security best practices
