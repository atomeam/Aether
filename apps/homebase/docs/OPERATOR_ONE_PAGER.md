# Operator One-Pager - Automation Orchestrator

**Purpose**: Day-to-day operation guide for automation_consolidation_v2  
**Last Updated**: 2026-05-26  
**System Status**: ✅ Operational

---

## 🚀 Quick Start

```bash
# Start the system
cd C:\Users\adamm\automation_consolidation_v2
npm run dev
```

**Access**: http://localhost:3333/

---

## 🎯 What This System Does

Centralizes automation for multiple projects (Aether, HomeBase, etc.) with:
- Scheduled health checks and monitoring
- Automated backups and log cleanup
- Manual project control capabilities
- Web-based management interface

---

## 📊 Daily Operations

### Start/Stop
```bash
# Start
cd C:\Users\adamm\automation_consolidation_v2
npm run dev

# Stop: Ctrl+C in terminal
```

### Check Status
- **Web UI**: http://localhost:3333/ (recommended)
- **API**: `curl http://localhost:3333/health`
- **Logs**: `tail -f logs/orchestrator.log`

### Monitor Workflows
- **Web UI**: http://localhost:3333/workflows
- **API**: `curl http://localhost:3333/scheduler/workflows`
- **Run History**: http://localhost:3333/runs-page

---

## ⚡ Active Workflows

### SAFE (No risk - read-only)
- `homebase_wrapper` - HomeBase health check (every 30 min)
- `aether_backend_wrapper` - Aether health check (every 4 hours)
- `project_health_check` - Multi-project health (every 6 hours)
- `system_monitor` - Disk/memory monitoring (every 30 min)
- `failure_monitor` - Failure tracking (every 15 min)

### CAUTION (File operations)
- `daily_backup` - Backups at 2 AM daily (7-day retention)
- `log_cleanup` - Log cleanup at 3 AM daily

### DANGEROUS (Service control)
- `project_control` - Manual start/stop/restart (manual trigger only)

### DISABLED
- `auto_restart` - Disabled for safety (requires testing)

---

## 🛠️ Common Tasks

### Run Workflow Manually
```bash
# Via Web UI: http://localhost:3333/workflows → Click "Run Now"

# Via API
curl -X POST http://localhost:3333/workflows/{workflow_name}/execute \
  -H "Content-Type: application/json" -d "{}"
```

### View Recent Runs
```bash
# Via Web UI: http://localhost:3333/runs-page

# Via API
curl http://localhost:3333/runs?limit=20
```

### Check Workflow Status
```bash
curl http://localhost:3333/workflows/{workflow_name}/status
```

### Disable Workflow
Edit `backbone/config/config.yaml`:
```yaml
workflows:
  workflow_name:
    enabled: false
```
Then restart orchestrator.

---

## ⚠️ Safety Notes

### DANGEROUS Workflows
- `project_control` can start/stop services
- Always test manually in non-production first
- Review service dependencies before use

### CAUTION Workflows  
- `daily_backup` consumes disk space
- `log_cleanup` permanently deletes old files
- Monitor disk usage after enabling

### SKIPPED Status
- Disabled workflows return "skipped" status (not errors)
- This maintains audit trail without system disruption
- Check run history for skipped workflow executions

---

## 🔧 Configuration

### Main Config
`backbone/config/config.yaml`

### Key Settings
- **Port**: 3333
- **Timezone**: America/New_York
- **Run History**: `runs/runs.jsonl`
- **Logs**: `logs/orchestrator.log`

### Workflow Safety
See `docs/CONFIG_SAFETY.md` for detailed safety classifications.

---

## 🐛 Troubleshooting

### Workflow Not Running
1. Check if enabled in config.yaml
2. Verify schedule syntax (cron expression)
3. Check logs: `tail -f logs/orchestrator.log`
4. Test manually via API

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3333
taskkill //F //PID {process_id}
```

### Service Won't Start
1. Check Node.js dependencies: `npm install`
2. Verify config syntax
3. Review error logs
4. Ensure port 3333 is available

### Web UI Not Loading
1. Ensure orchestrator is running
2. Check http://localhost:3333/ (not 8080)
3. Verify browser console for errors
4. Test API endpoints directly

---

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3333/health
```

### View Logs
```bash
# Orchestrator logs
tail -f logs/orchestrator.log

# Run history
cat runs/runs.jsonl | tail -20
```

### System Resources
- `system_monitor` workflow tracks disk/memory
- Alerts trigger at 80% disk, 85% memory usage
- Check run history for resource alerts

---

## 📞 Support

### Documentation
- `docs/ONE_PAGER.md` - System overview
- `docs/CONFIG_SAFETY.md` - Safety guidance
- `docs/REALITY_CHECK.md` - Current system state
- `README.md` - Quick start guide

### Log Files
- `logs/orchestrator.log` - Main system log
- `runs/runs.jsonl` - Execution history

### Getting Help
1. Check relevant documentation
2. Review logs for errors
3. Test API endpoints with curl
4. Verify configuration settings

---

## 🎯 Key Points

1. **Single Command Start**: `npm run dev` from project root
2. **Web UI**: http://localhost:3333/ (integrated, no separate dashboard)
3. **Safety First**: DANGEROUS workflows are manual-only or disabled
4. **SKIPPED Status**: Disabled workflows skip gracefully, don't error
5. **Port 3333**: Orchestrator + web UI (not 3000 or 8080)
6. **Run History**: All executions logged to `runs/runs.jsonl`

---

**System Maintained By**: Devin Automation Agent  
**Last Review**: 2026-05-26  
**Next Review**: 2026-06-26