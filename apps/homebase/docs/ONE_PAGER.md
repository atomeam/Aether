# Automation Consolidation v2 - One-Pager

**Last Updated**: 2026-05-26  
**System Status**: ✅ Operational  
**Version**: 2.0.0

---

## 🎯 What Is It?

A centralized automation orchestrator that consolidates fragmented automation scripts across multiple projects (Aether, ALPHA, ALPHA-1, HomeBase) into a unified system with standardized scheduling, logging, and monitoring.

---

## 🚀 Quick Start

```bash
# Start the orchestrator (includes integrated web UI)
cd C:\Users\adamm\automation_consolidation_v2
npm run dev
```

**Access Points**:
- Orchestrator API & Web UI: http://localhost:3333
- Home Dashboard: http://localhost:3333/
- Workflows Management: http://localhost:3333/workflows
- Run History: http://localhost:3333/runs-page

---

## 📊 System Overview

### Architecture
- **Orchestrator**: Node.js/TypeScript backend on port 3333 with integrated web UI
- **Workflows**: 8 automated workflows with cron scheduling
- **Storage**: JSONL run history, JSON logging
- **Safety**: Workflow classifications (SAFE/CAUTION/DANGEROUS) with SKIPPED status support

### Projects Managed
- **Aether** (v1.0.0) - Mature monorepo with 40+ packages
- **ALPHA** (v0.0.0) - Standalone AI Studio app
- **ALPHA-1** (v0.0.0) - Consolidated monorepo (future state)
- **HomeBase** - Dashboard application
- **automation_consolidation_v2** - This orchestrator system

---

## ⚡ Active Workflows

### 🟢 SAFE (5 workflows) - Read-only monitoring
| Workflow | Schedule | Purpose |
|----------|----------|---------|
| homebase_wrapper | Every 30 min | HomeBase service health check |
| aether_backend_wrapper | Every 4 hours | Aether backend health check |
| project_health_check | Every 6 hours | Multi-project health status |
| system_monitor | Every 30 min | Disk/memory monitoring |
| failure_monitor | Every 15 min | Workflow failure tracking |

### 🟡 CAUTION (2 workflows) - File system operations
| Workflow | Schedule | Purpose |
|----------|----------|---------|
| daily_backup | 2 AM daily | Backup all projects (7-day retention) |
| log_cleanup | 3 AM daily | Compress/delete old logs |

### 🔴 DANGEROUS (1 workflow) - Service control
| Workflow | Schedule | Purpose |
|----------|----------|---------|
| project_control | Manual only | Manual start/stop/restart |

### ⚪ DISABLED (1 workflow)
| Workflow | Status | Reason |
|----------|--------|---------|
| auto_restart | DISABLED | Safety - requires manual testing before enabling |

**⚠️ See `docs/CONFIG_SAFETY.md` for detailed safety guidance**

**Status Handling**: Workflows return `skipped` status when disabled, preventing errors while maintaining audit trail.

---

## 📈 Key Features

### Core Capabilities
- ✅ Unified workflow management via REST API
- ✅ Integrated web UI at orchestrator root (port 3333)
- ✅ Cron-based scheduling with timezone support
- ✅ Automatic retry logic for transient failures
- ✅ Centralized logging (JSON format)
- ✅ Run history tracking (JSONL format)
- ✅ System resource monitoring
- ✅ Failure detection and alerting
- ✅ SKIPPED status for disabled workflows

### Safety Features
- ✅ Workflow safety classifications (SAFE/CAUTION/DANGEROUS)
- ✅ SKIPPED status prevents errors for disabled workflows
- ✅ Configuration safety warnings
- ✅ Manual trigger option for dangerous workflows
- ✅ Comprehensive error handling
- ✅ Rollback procedures documented

---

## 🔧 Configuration

### Main Config File
`backbone/config/config.yaml`

### Key Settings
- **Port**: 3333 (changed from 3000 to avoid conflicts)
- **Timezone**: America/New_York
- **Max Concurrent Jobs**: 4
- **Run History**: `runs/runs.jsonl`
- **Logs**: `logs/orchestrator.log`

### Environment Variables
`config/.env` (optional, for SMTP/notifications)

---

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | System health check |
| `/scheduler/workflows` | GET | List all workflows |
| `/workflows/{name}/execute` | POST | Execute workflow manually |
| `/runs` | GET | Get run history |
| `/workflows/{name}/status` | GET | Get workflow status |

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3333/health
```

### View Workflows
```bash
curl http://localhost:3333/scheduler/workflows
```

### View Run History
```bash
curl http://localhost:3333/runs?limit=10
```

### Dashboard
Open http://localhost:8080 for visual monitoring

---

## 📁 File Locations

### Important Files
- **Config**: `backbone/config/config.yaml`
- **Run History**: `runs/runs.jsonl`
- **Logs**: `logs/orchestrator.log`
- **Workflows**: `migrations/*.ts` (workflow implementations)
- **Web UI**: Integrated at orchestrator root (`/`, `/workflows`, `/runs-page`)

### Documentation
- **Quick Start**: `README.md`
- **System Status**: `docs/REALITY_CHECK.md`
- **Safety Guide**: `docs/CONFIG_SAFETY.md`
- **Architecture**: `docs/CONSOLIDATION_PLAN.md`

---

## ⚠️ Important Notes

### Safety Considerations
- **auto_restart** and **project_control** can start/stop services
- **daily_backup** and **log_cleanup** perform file system operations
- Review `docs/CONFIG_SAFETY.md` before enabling dangerous workflows
- Test workflows manually before scheduling

### Known Issues
- homebase_wrapper shows "unreachable" (HomeBase not running - expected)
- aether_backend_wrapper has historical failures (Aether not running - expected)
- auto_restart disabled for safety (requires manual testing)

### Port Configuration
- Orchestrator & Web UI run on port **3333** (not 3000)
- Update documentation if changing ports

---

## 🛠️ Troubleshooting

### Workflow Not Executing
1. Check if workflow is enabled in `config.yaml`
2. Verify schedule syntax (cron expression)
3. Check logs: `tail -f logs/orchestrator.log`
4. Test manually via API

### Service Won't Start
1. Check if port 3333 is available
2. Verify Node.js dependencies: `npm install`
3. Check configuration syntax
4. Review error logs

### Web UI Issues
1. Ensure orchestrator is running on port 3333
2. Access http://localhost:3333/ for main dashboard
3. Verify browser console for errors
4. Test API endpoints directly

---

## 📞 Support & Documentation

### Documentation Files
- `README.md` - Quick start and overview
- `docs/REALITY_CHECK.md` - Current system state
- `docs/CONFIG_SAFETY.md` - Safety classifications
- `docs/CONSOLIDATION_PLAN.md` - Architecture details
- `docs/PROJECT_INVESTIGATION.md` - Project analysis

### Log Files
- `logs/orchestrator.log` - Main orchestrator log
- `runs/runs.jsonl` - Execution history

### Getting Help
1. Check relevant documentation files
2. Review logs for error messages
3. Test API endpoints with curl
4. Verify configuration settings

---

## 🎯 Next Steps

### Immediate Actions
- ✅ System is operational and verified
- ✅ Dashboard is functional and user-friendly
- ✅ Configuration is safety-classified
- ✅ Documentation is updated and accurate

### Optional Enhancements
- Configure SMTP for email notifications
- Set up Windows Service for production deployment
- Add custom workflows for specific needs
- Integrate with external monitoring systems
- Implement secret management for credentials

---

## 📋 System Status Summary

**Overall Status**: ✅ Fully Operational

**Components**:
- Orchestrator: ✅ Running on port 3333 with integrated web UI
- Scheduler: ✅ Active with 7 workflows (1 disabled for safety)
- Web UI: ✅ Available at http://localhost:3333/
- Workflows: ✅ 7 active (5 SAFE, 2 CAUTION, 1 DANGEROUS manual), 1 disabled
- Logging: ✅ JSON format, file output
- Run History: ✅ JSONL format with SKIPPED status support

**Safety Status**: ✅ Configured with safety classifications and SKIPPED status

**Documentation Status**: ✅ Updated and accurate

---

**System Maintained By**: Devin Automation Agent  
**Last Verification**: 2026-05-26  
**Next Review**: 2026-06-26