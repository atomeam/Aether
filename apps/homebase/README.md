# Automation Consolidation v2

**Consolidated automation backbone for managing workflows across multiple projects.**

## 🚀 Quick Start (One-Command Run)

### Start Orchestrator with Integrated Web UI
```bash
cd C:\Users\adamm\automation_consolidation_v2
npm run dev
```

The orchestrator will start on port 3333 with integrated web UI.

**Access Points**:
- Main Dashboard: http://localhost:3333/
- Workflows: http://localhost:3333/workflows
- Run History: http://localhost:3333/runs-page

## 🚀 Deployment Options

### Option 1: Manual Start (Development)
```bash
cd automation_consolidation_v2
./start.ps1
```

### Option 2: Windows Service (Production)
Requires [NSSM](https://nssm.cc/download):
```bash
cd automation_consolidation_v2
./scripts/install-service.ps1
```

### Option 3: Task Scheduler (Recommended)
Built-in Windows Task Scheduler:
```bash
cd automation_consolidation_v2
./scripts/install-task-scheduler.ps1
```

## 📁 Folder Structure

```
automation_consolidation_v2/
├── backbone/              # Core orchestrator system
│   ├── orchestrator/     # Main orchestrator code
│   ├── workflows/        # Workflow implementations
│   ├── shared/          # Shared utilities
│   ├── config/          # Configuration files
│   ├── tests/           # Tests and sample inputs
│   └── scripts/         # Setup and management scripts
├── inventory/           # Complete system inventory
├── migrations/          # Workflow wrappers for existing projects
├── backups/            # Safety backups before cutover
├── runs/               # Run history (auto-created)
└── docs/               # Documentation
```

## 🎯 What This Does

This system consolidates your fragmented automation stack into a single orchestrator:

- **Unified Management**: Single interface for all workflows
- **Standardized Logging**: Centralized logs and run history
- **Reliable Scheduling**: Automated job execution with cron schedules
- **Error Handling**: Automatic retries for transient failures
- **Safe Migration**: Wrapper approach preserves existing systems
- **System Monitoring**: Resource monitoring and failure alerting
- **Project Health**: Multi-project health checks and service monitoring

## 📋 Current Inventory

See `inventory/INVENTORY.md` for complete details of your existing automation stack.

## 🔄 Migration Status

- **Phase 1**: ✅ Backbone implemented and tested
- **Phase 2**: ✅ Core workflows enabled (health checks, monitoring)
- **Phase 3**: ✅ Project integration workflows (Aether, HomeBase)
- **Phase 4**: ✅ System monitoring and alerting
- **Phase 5**: ✅ Windows service deployment scripts

## 📊 Active Workflows

### Core Monitoring Workflows (SAFE)
- `homebase_wrapper` - Health check for HomeBase service (every 30 minutes)
- `aether_backend_wrapper` - Health check for Aether backend (every 4 hours)
- `project_health_check` - Health check across all major projects (every 6 hours)
- `system_monitor` - Monitor system resources (disk, memory) (every 30 minutes)
- `failure_monitor` - Monitor workflow failures and send alerts (every 15 minutes)

### Maintenance Workflows (CAUTION)
- `daily_backup` - Daily backup of all projects with 7-day retention (2 AM daily)
- `log_cleanup` - Compress and clean up old log files (3 AM daily)

### Service Control Workflows (DANGEROUS)
- `project_control` - Manual project control (start/stop/restart) - manual trigger only

### Disabled Workflows
- `auto_restart` - DISABLED for safety (requires manual testing before enabling)

**Note**: See `docs/CONFIG_SAFETY.md` for detailed safety classifications and guidance.

## 🛠️ Setup

First-time setup:
```bash
cd ~/automation_consolidation_v2
./backbone/scripts/setup.ps1
```

## 🧪 Testing

Test the orchestrator health:
```bash
./scripts/health-check.ps1
```

Or via API:
```bash
curl http://localhost:3333/health
```

Test a workflow manually:
```bash
curl http://localhost:3333/workflows/homebase_health_check/execute
```

View scheduled workflows:
```bash
curl http://localhost:3333/scheduler/workflows
```

View run history:
```bash
curl http://localhost:3333/runs
```

## 📖 Documentation

- **Quick Start**: This file (README.md)
- **Operator Guide**: `docs/OPERATOR_ONE_PAGER.md` (day-to-day operations)
- **System Overview**: `docs/ONE_PAGER.md` (complete system overview)
- **System Status**: `docs/REALITY_CHECK.md` (current system state and verification)
- **Safety Guide**: `docs/CONFIG_SAFETY.md` (workflow safety classifications)
- **Architecture**: `docs/CONSOLIDATION_PLAN.md`
- **Executive Summary**: `docs/EXECUTIVE_SUMMARY.md`
- **Project Investigation**: `docs/PROJECT_INVESTIGATION.md` (Aether/ALPHA/ALPHA-1 analysis)

## 📈 Monitoring & Alerts

The orchestrator includes built-in monitoring:

- **System Resources**: Disk usage (>80% alert), Memory usage (>85% alert)
- **Workflow Failures**: Failure rate monitoring, consecutive failure detection
- **Project Health**: Service availability checks across all projects

Alert thresholds are configurable in `backbone/config/config.yaml`:
```yaml
monitoring:
  alert_thresholds:
    failure_rate: 10
    consecutive_failures: 3
    disk_usage: 80
    memory_usage: 85
```

## 📝 Logs & Run History

- **Orchestrator Logs**: `logs/orchestrator.log` (JSON format)
- **Run History**: `runs/runs.jsonl` (JSONL format)
- **Service Logs** (if using Windows service): `logs/service-stdout.log`

## 🎨 Web Dashboard

A modern web-based dashboard is integrated directly into the orchestrator:

- **Modern UI**: Gradient-based design with glassmorphism effects
- **Real-time Stats**: Active workflows, success rates, system uptime
- **Manual Control**: Execute workflows on demand
- **Run History**: View recent workflow executions with filtering
- **Auto-refresh**: Updates every 30 seconds
- **SKIPPED Status**: Visual indication for disabled workflows
- **Registry Sync**: Built-in Notion database sync for self-knowledge

**Access**: http://localhost:3333/ (starts automatically with orchestrator)

**Dashboard features**:
- System status monitoring
- Workflow management interface
- Execution history with status indicators (completed/failed/skipped)
- Manual workflow execution
- Visual health indicators
- Filterable run history by workflow and status
- Registry sync via POST /ops/registry/sync

## ⚠️ Safety Notes

- **Read-Only Approach**: Existing projects are not modified
- **Wrapper Strategy**: New workflows wrap existing functionality
- **Gradual Cutover**: Switch usage pointers only after validation
- **Archive First**: Old projects moved to `_archive/` before deletion

## 🆘 Support

Check logs in `backbone/logs/orchestrator.log` for issues.

---

**Generated**: 2026-05-26  
**Version**: 2.0.0 (Restructured)
