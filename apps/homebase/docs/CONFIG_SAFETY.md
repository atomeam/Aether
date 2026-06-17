# CONFIG_SAFETY.md

**Configuration Safety Guide**  
**Last Updated**: 2026-05-26  
**Purpose**: Provide safety guidance for automation_consolidation_v2 configuration

---

## Overview

The automation_consolidation_v2 system includes workflows with varying levels of risk. This document classifies workflows by safety level and provides guidance for safe configuration.

## Safety Classifications

### 🟢 SAFE Workflows
**Risk Level**: Minimal  
**Operations**: Read-only monitoring, health checks, data collection  
**Impact**: No system changes, no file modifications, no service disruptions

**Workflows**:
- `homebase_wrapper` - Health check for HomeBase service
- `aether_backend_wrapper` - Health check for Aether backend
- `project_health_check` - Health check across all projects
- `system_monitor` - System resource monitoring
- `failure_monitor` - Workflow failure monitoring
- `devour_wad_wrapper` - DOOM WAD processing (manual trigger)

**Recommendation**: Safe to enable for automated scheduling

---

### 🟡 CAUTION Workflows
**Risk Level**: Moderate  
**Operations**: File system operations (read/write/delete)  
**Impact**: Can modify or delete files, consume disk space

**Workflows**:
- `daily_backup` - Creates backup archives, deletes old backups
- `log_cleanup` - Compresses and deletes log files

**Risks**:
- **Backup**: Large files may consume significant disk space
- **Cleanup**: Old files are permanently deleted
- **Compression**: May temporarily use CPU/disk resources

**Recommendation**: 
- Review backup retention settings before enabling
- Ensure adequate disk space for backups
- Test manually before scheduling
- Monitor disk usage after first few runs

**Safety Settings**:
```yaml
daily_backup:
  retention_days: 7  # Adjust based on disk space
  
log_cleanup:
  compress_after_days: 1  # Don't compress too frequently
  delete_after_days: 30  # Keep logs for debugging
```

---

### 🔴 DANGEROUS Workflows
**Risk Level**: High  
**Operations**: Can start/stop services, kill processes  
**Impact**: Service disruption, process termination, system state changes

**Workflows**:
- `auto_restart` - Automatically restarts failed services
- `project_control` - Manual start/stop/restart of projects

**Risks**:
- **Service Disruption**: May stop services you want running
- **Data Loss**: Unstopped services may have unsaved data
- **Resource Conflicts**: May start services that conflict with each other
- **Loop Conditions**: May create restart loops if services fail repeatedly

**Recommendation**:
- **Test extensively** in non-production environments first
- **Review service dependencies** before enabling
- **Monitor closely** after first enablement
- **Consider disabling** if you have manual service management
- **Set up alerts** for unexpected restarts

**Safety Settings**:
```yaml
auto_restart:
  enabled: false  # Start disabled, test manually first
  max_restart_attempts: 3  # Prevent restart loops
  
project_control:
  enabled: true  # Manual trigger only - safer
  schedule: null  # Never schedule automatically
```

---

## Configuration Safety Checklist

Before enabling any workflow, review this checklist:

### For SAFE Workflows:
- [ ] Workflow purpose is understood
- [ ] Schedule frequency is appropriate
- [ ] Alert thresholds are reasonable
- [ ] Logging is enabled for troubleshooting

### For CAUTION Workflows:
- [ ] All SAFE checklist items
- [ ] Disk space requirements are understood
- [ ] Retention policies are reviewed
- [ ] Backup locations are verified
- [ ] Manual test completed successfully
- [ ] File permissions are correct
- [ ] Recovery procedures are documented

### For DANGEROUS Workflows:
- [ ] All CAUTION checklist items
- [ ] Service dependencies are mapped
- [ ] Impact on running services is understood
- [ ] Rollback procedures are documented
- [ ] Team/stakeholders are notified
- [ ] Monitoring is enhanced for initial period
- [ ] Emergency stop procedure is tested
- [ ] Start with manual trigger only (no schedule)

---

## Emergency Procedures

### If a DANGEROUS Workflow Causes Issues:

1. **Immediate Stop**:
   ```bash
   # Disable workflow in config
   # Edit backbone/config/config.yaml
   workflow_name:
     enabled: false
   
   # Restart orchestrator
   cd backbone
   npm run dev
   ```

2. **Service Recovery**:
   ```bash
   # Manually start affected services
   cd Aether
   npm run dev:backend
   
   cd HomeBase  
   npm run dev
   ```

3. **Investigation**:
   - Check runs log: `cat runs/runs.jsonl | tail -20`
   - Check orchestrator log: `tail -f logs/orchestrator.log`
   - Review workflow execution history

4. **Prevention**:
   - Adjust workflow configuration
   - Add additional safety checks
   - Implement approval workflow
   - Consider disabling permanently

---

## Monitoring and Alerts

### Critical Metrics to Monitor:

**For CAUTION Workflows**:
- Disk usage before/after backups
- Backup file sizes
- Log cleanup effectiveness
- Available disk space trends

**For DANGEROUS Workflows**:
- Service uptime/downtime
- Restart frequency
- Service health after restart
- Error rates in applications
- Resource usage patterns

### Alert Thresholds (Current Config):

```yaml
monitoring:
  alert_thresholds:
    failure_rate: 10  # Alert if failure rate > 10%
    consecutive_failures: 3  # Alert if 3+ consecutive failures
    disk_usage: 80  # Alert if disk usage > 80%
    memory_usage: 85  # Alert if memory usage > 85%
```

**Recommendation**: Set up additional monitoring for DANGEROUS workflows:
- Service uptime monitoring
- Restart frequency alerts
- Application error rate monitoring
- Manual review after each restart

---

## Best Practices

### 1. Gradual Enablement
- Start with SAFE workflows only
- Test CAUTION workflows manually first
- Enable DANGEROUS workflows only after extensive testing
- Monitor closely after each enablement

### 2. Schedule Optimization
- Avoid overlapping heavy operations
- Schedule CAUTION workflows during low-usage periods
- Space out DANGEROUS workflow executions
- Consider timezone implications

### 3. Resource Management
- Monitor disk space for backup workflows
- Set appropriate retention policies
- Clean up temporary files regularly
- Monitor system resources during heavy operations

### 4. Documentation
- Document any workflow modifications
- Keep run logs for troubleshooting
- Maintain incident reports for issues
- Update this document with lessons learned

### 5. Team Communication
- Notify team before enabling DANGEROUS workflows
- Share workflow schedules with stakeholders
- Document emergency procedures
- Establish on-call procedures for automation issues

---

## Current Configuration Status

**As of 2026-05-26**:

| Workflow | Safety | Enabled | Schedule | Status |
|----------|--------|---------|----------|--------|
| homebase_health_check | SAFE | ❌ Disabled | */15 * * * * | Deprecated (simulated data) |
| homebase_wrapper | SAFE | ✅ Enabled | */30 * * * * | Operational |
| aether_backend_wrapper | SAFE | ✅ Enabled | 0 */4 * * * | Operational |
| project_health_check | SAFE | ✅ Enabled | 0 */6 * * * | Operational |
| system_monitor | SAFE | ✅ Enabled | */30 * * * * | Operational |
| failure_monitor | SAFE | ✅ Enabled | */15 * * * * | Operational |
| daily_backup | CAUTION | ✅ Enabled | 0 2 * * * | Operational |
| log_cleanup | CAUTION | ✅ Enabled | 0 3 * * * | Operational |
| auto_restart | DANGEROUS | ✅ Enabled | */10 * * * * | ⚠️ Review recommended |
| project_control | DANGEROUS | ✅ Enabled | Manual only | Manual trigger only |
| devour_wad_wrapper | SAFE | ❌ Disabled | Manual only | Special purpose |

**Recommendations**:
1. Consider disabling `auto_restart` if not needed
2. Review `daily_backup` retention settings based on disk space
3. Test `project_control` manually before relying on it
4. Monitor disk usage after backup operations

---

## Support and Troubleshooting

If you encounter issues with workflow safety:

1. **Check Logs**: 
   - Orchestrator: `logs/orchestrator.log`
   - Run history: `runs/runs.jsonl`

2. **Review Configuration**: 
   - Main config: `backbone/config/config.yaml`
   - This document: `docs/CONFIG_SAFETY.md`

3. **Test Manually**: 
   - Use API to trigger workflows manually
   - Verify behavior before scheduling

4. **Get Help**: 
   - Check documentation in `docs/` directory
   - Review `REALITY_CHECK.md` for current system state
   - Review workflow handler files for implementation details

---

**Document Maintained By**: Devin Automation Agent  
**Last Review**: 2026-05-26  
**Next Review Date**: 2026-06-26