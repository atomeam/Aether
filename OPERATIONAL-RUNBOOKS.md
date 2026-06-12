# Aether Operational Runbooks

## Runbook: Backend Deployment

### Objective
Deploy backend changes to production with zero downtime.

### Prerequisites
- All tests passing: `npm run test`
- Type check passing: `npm run typecheck`
- Build successful: `npm run build`
- Code reviewed and approved

### Steps

#### 1. Pre-Deployment Checks
```bash
cd C:\Users\adamm\Aether

# Run tests
npm run test

# Type check
npm run typecheck

# Build
npm run build

# Health check
pwsh scripts/health-check.ps1
```

**Success Criteria:** All checks pass, health shows "healthy"

#### 2. Create Backup
```bash
pwsh scripts/backup.ps1
```

**Success Criteria:** Backup created successfully

#### 3. Deploy to Vercel
```bash
pwsh scripts/deploy.ps1 -Target vercel
```

**Success Criteria:** Deployment shows "Ready" status

#### 4. Verify Deployment
```bash
# Check health endpoint
curl https://a-to-mind.com/api/health

# Check stack status
curl https://a-to-mind.com/api/stack

# Check agent system
curl https://a-to-mind.com/api/agents
```

**Success Criteria:** All endpoints return 200, status is "healthy"

#### 5. Smoke Test
```bash
npm run smoke
```

**Success Criteria:** 5/5 PASS

#### 6. Monitor
- Watch logs for 10 minutes
- Monitor error rates
- Check performance metrics

**Success Criteria:** No errors, performance within targets

### Rollback Procedure
If deployment fails:
1. Stop deployment
2. Go to Vercel Dashboard
3. Select previous successful deployment
4. Click "Redeploy"
5. Verify rollback successful

### Escalation
- If rollback fails: Contact infrastructure team
- If errors persist: Create incident ticket
- If data corruption: Restore from backup

---

## Runbook: Cloudflare Worker Deployment

### Objective
Deploy Cloudflare worker changes with minimal disruption.

### Prerequisites
- Worker code tested locally
- Wrangler configuration updated
- Secrets documented

### Steps

#### 1. Test Locally
```bash
cd C:\Users\adamm\Aether\apps\bridge
wrangler dev
```

**Success Criteria:** Worker starts without errors

#### 2. Update Secrets (if needed)
- Go to Cloudflare Dashboard
- Navigate to Workers → bridge
- Settings → Variables & Secrets
- Update/add secrets as needed

**Success Criteria:** Secrets updated successfully

#### 3. Deploy
```bash
wrangler deploy
```

**Success Criteria:** Deployment shows "Success"

#### 4. Verify
```bash
# Test worker endpoint
curl https://bridge.a-to-mind.com/api/health

# Test specific functionality
curl https://bridge.a-to-mind.com/api/billing/webhook
```

**Success Criteria:** Endpoints return expected responses

#### 5. Monitor
- Check Cloudflare Dashboard logs
- Monitor error rates
- Verify functionality

**Success Criteria:** No errors, functionality working

### Rollback Procedure
If deployment fails:
1. Go to Cloudflare Dashboard
2. Navigate to Workers → bridge
3. Click "Deployments" tab
4. Select previous successful deployment
5. Click "Rollback"

---

## Runbook: Agent Loop Management

### Objective
Manage agent loop lifecycle for autonomous operations.

### Start Agent Loop
```bash
curl -X POST https://a-to-mind.com/api/agents/loop/start
```

**Configuration Options:**
```json
{
  "tickIntervalMs": 60000,
  "maxActionsPerTick": 10,
  "enableLearning": true,
  "enableGovernance": true
}
```

**Success Criteria:** Loop status shows "isRunning: true"

### Stop Agent Loop
```bash
curl -X POST https://a-to-mind.com/api/agents/loop/stop
```

**Success Criteria:** Loop status shows "isRunning: false"

### Monitor Agent Loop
```bash
curl https://a-to-mind.com/api/agents/loop/status
```

**Key Metrics:**
- isRunning: Loop status
- uptimeSeconds: How long loop has been running
- tickCount: Number of ticks executed
- actionsExecuted: Total actions processed
- actionsApproved: Actions approved by curator
- actionsRejected: Actions rejected by curator

### Troubleshooting
**Loop not starting:**
- Check backend health: `/api/agents`
- Review backend logs
- Verify configuration

**Loop stuck:**
- Stop loop: `/api/agents/loop/stop`
- Check ledger for stuck actions
- Restart loop

**High rejection rate:**
- Review curator decisions: `/api/agents/curator/decisions`
- Check allow-list configuration
- Review action patterns

---

## Runbook: Incident Response

### Severity Levels

**P1 - Critical**
- System completely down
- Data loss or corruption
- Security breach

**P2 - High**
- Major functionality broken
- Performance severely degraded
- Data inconsistency

**P3 - Medium**
- Minor functionality broken
- Performance degraded
- Non-critical errors

**P4 - Low**
- Cosmetic issues
- Documentation errors
- Minor improvements

### P1 Incident Response

#### 1. Immediate Actions (0-15 minutes)
- Declare incident
- Identify scope
- Notify stakeholders
- Begin containment

#### 2. Investigation (15-60 minutes)
- Gather logs
- Identify root cause
- Assess impact
- Determine fix approach

#### 3. Resolution (1-4 hours)
- Implement fix
- Test thoroughly
- Deploy to production
- Verify resolution

#### 4. Post-Incident (4-24 hours)
- Document incident
- Create post-mortem
- Implement preventive measures
- Update runbooks

### Communication
- Internal: Update team every 30 minutes
- External: Communicate as needed
- Stakeholders: Provide regular updates

---

## Runbook: Performance Degradation

### Detection
- Health check shows "degraded"
- Response times >200ms
- Error rates >5%
- User complaints

### Investigation
```bash
# Check performance metrics
pwsh scripts/health-check.ps1 -Verbose

# Check agent system
curl https://a-to-mind.com/api/agents

# Review logs
# Check database performance
# Check network connectivity
```

### Common Causes
- High load
- Memory leaks
- Database issues
- Network problems
- Code inefficiencies

### Resolution
- Scale resources if needed
- Restart services
- Optimize queries
- Implement caching
- Rate limit if necessary

### Prevention
- Set up monitoring
- Implement alerts
- Regular performance reviews
- Load testing

---

## Runbook: Security Incident

### Detection
- Unauthorized access
- Data breach
- Malicious activity
- Security vulnerabilities

### Immediate Actions
1. Isolate affected systems
2. Preserve evidence
3. Change credentials
4. Notify security team

### Investigation
- Review access logs
- Identify breach scope
- Determine data exposure
- Assess impact

### Resolution
- Patch vulnerabilities
- Rotate all secrets
- Implement additional security
- Monitor for recurrence

### Post-Incident
- Document incident
- Conduct security review
- Update security policies
- Train team

---

## Runbook: Data Recovery

### Scenario: Accidental Data Deletion

#### 1. Stop Writes
- Stop all write operations
- Prevent further data loss

#### 2. Assess Damage
- Identify deleted data
- Determine impact
- Check backups

#### 3. Restore from Backup
```bash
pwsh scripts/restore.ps1 -BackupPath "path\to\backup.zip"
```

#### 4. Verify Recovery
- Check data integrity
- Verify functionality
- Test critical operations

#### 5. Resume Operations
- Restart services
- Monitor for issues
- Document incident

### Scenario: Database Corruption

#### 1. Identify Corruption
- Check database logs
- Verify data integrity
- Determine scope

#### 2. Restore from Backup
- Select appropriate backup
- Restore database
- Verify data

#### 3. Repair if Possible
- Attempt database repair
- Migrate to new instance if needed
- Test thoroughly

#### 4. Prevent Recurrence
- Identify root cause
- Implement safeguards
- Monitor closely

---

## Runbook: Maintenance Windows

### Planned Maintenance

#### Pre-Maintenance
- Schedule maintenance window
- Notify stakeholders
- Create backup
- Test rollback procedure

#### During Maintenance
- Perform maintenance
- Monitor progress
- Test changes
- Document changes

#### Post-Maintenance
- Verify functionality
- Monitor for issues
- Update documentation
- Communicate completion

### Emergency Maintenance

#### Immediate Actions
- Declare emergency
- Notify stakeholders
- Begin immediate work
- Document progress

#### Resolution
- Fix issue
- Test thoroughly
- Restore service
- Document incident

---

## Runbook: Monitoring & Alerting

### Key Metrics to Monitor
- Backend health: `/api/health`
- Agent status: `/api/agents`
- Response times
- Error rates
- Uptime
- Resource usage

### Alert Thresholds
- Backend down: Immediate alert
- Error rate >5%: Warning
- Response time >200ms: Warning
- Error rate >10%: Critical
- Response time >500ms: Critical

### Monitoring Tools
- Health check script: `pwsh scripts/health-check.ps1`
- Project Ops Companion: Performance tab
- Cloudflare Dashboard: Worker logs
- Vercel Dashboard: Deployment logs

### Alerting
- Set up automated alerts
- Define escalation procedures
- Document on-call rotation
- Test alerting system

---

## Runbook: Disaster Recovery

### Disaster Scenarios
- Complete system failure
- Data center outage
- Security breach
- Major data loss

### Recovery Objectives
- RPO (Recovery Point Objective): 1 hour
- RTO (Recovery Time Objective): 4 hours

### Recovery Steps

#### 1. Assessment (0-30 minutes)
- Assess damage
- Identify affected systems
- Determine recovery priority
- Declare disaster

#### 2. Recovery (30 minutes - 4 hours)
- Restore from backup
- Rebuild systems
- Verify functionality
- Test critical operations

#### 3. Validation (4-8 hours)
- Comprehensive testing
- Data integrity checks
- Performance validation
- Security review

#### 4. Restoration (8-24 hours)
- Full service restoration
- Monitor for issues
- Update documentation
- Conduct post-mortem

### Communication
- Stakeholders: Regular updates
- Users: Service status page
- Team: Incident channel
- Public: As needed

---

**Version:** 1.0
**Last Updated:** 2026-06-11
**Purpose:** Operational procedures for common scenarios