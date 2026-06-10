# Phase 6: Monitoring & Alerting

## Overview
Implement comprehensive monitoring and alerting for the relay system.

## Current State
- Basic health check endpoint
- File-based error logging
- No metrics collection
- No alerting system

## Target State
- Comprehensive metrics collection
- Real-time monitoring dashboard
- Alerting system
- Performance tracking

## Implementation Steps

### Step 1: Update D1 Schema for Metrics

**File:** `apps/relay/migrations/0004_metrics.sql`

```sql
-- Add metrics table
CREATE TABLE IF NOT EXISTS relay_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  tags TEXT, -- JSON object with tags
  INDEX idx_relay_metrics_timestamp (timestamp),
  INDEX idx_relay_metrics_metric_name (metric_name)
);

-- Add alerts table
CREATE TABLE IF NOT EXISTS relay_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- info, warning, error, critical
  message TEXT NOT NULL,
  metadata TEXT, -- JSON object with additional context
  resolved_at TEXT,
  resolved_by TEXT,
  INDEX idx_relay_alerts_timestamp (timestamp),
  INDEX idx_relay_alerts_severity (severity),
  INDEX idx_relay_alerts_resolved (resolved_at)
);

-- Add SLA tracking table
CREATE TABLE IF NOT EXISTS relay_sla (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  task_id TEXT,
  sla_type TEXT NOT NULL, -- response_time, completion_time, uptime
  sla_value REAL,
  sla_threshold REAL,
  sla_status TEXT, -- pass, fail
  INDEX idx_relay_sla_timestamp (timestamp),
  INDEX idx_relay_sla_sla_type (sla_type)
);
```

### Step 2: Implement Metrics Collection

**File:** `apps/backend/server.ts`

```typescript
// Metrics collector
class MetricsCollector {
  private env: Env;
  
  constructor(env: Env) {
    this.env = env;
  }
  
  async recordMetric(name: string, value: number, tags: Record<string, any> = {}) {
    const timestamp = new Date().toISOString();
    
    await this.env.RELAY_DB.prepare(
      "INSERT INTO relay_metrics (timestamp, metric_name, metric_value, tags) VALUES (?, ?, ?, ?)"
    ).bind(timestamp, name, value, JSON.stringify(tags)).run();
  }
  
  async incrementCounter(name: string, tags: Record<string, any> = {}) {
    const timestamp = new Date().toISOString();
    
    await this.env.RELAY_DB.prepare(
      "INSERT INTO relay_metrics (timestamp, metric_name, metric_value, tags) VALUES (?, ?, ?, ?)"
    ).bind(timestamp, name, 1, JSON.stringify(tags)).run();
  }
  
  async recordTiming(name: string, duration: number, tags: Record<string, any> = {}) {
    const timestamp = new Date().toISOString();
    
    await this.env.RELAY_DB.prepare(
      "INSERT INTO relay_metrics (timestamp, metric_name, metric_value, tags) VALUES (?, ?, ?, ?)"
    ).bind(timestamp, name, duration, JSON.stringify(tags)).run();
  }
  
  async getMetrics(name: string, timeRange: string = '1h') {
    const startTime = new Date(Date.now() - this.parseTimeRange(timeRange)).toISOString();
    
    const metrics = await this.env.RELAY_DB.prepare(
      "SELECT * FROM relay_metrics WHERE metric_name = ? AND timestamp >= ? ORDER BY timestamp DESC"
    ).bind(name, startTime).all();
    
    return metrics.results;
  }
  
  private parseTimeRange(range: string): number {
    const units: Record<string, number> = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000,
    };
    
    const match = range.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      return value * units[unit];
    }
    
    return 3600000; // Default 1 hour
  }
}

// Use metrics collector
const metrics = new MetricsCollector(env);

// Record metrics on task assignment
app.post('/relay/assign', async (req, res) => {
  const startTime = Date.now();
  
  // ... task assignment logic ...
  
  const duration = Date.now() - startTime;
  await metrics.recordTiming('relay.assign.duration', duration, { agent: req.body.to });
  await metrics.incrementCounter('relay.assign.total', { agent: req.body.to });
  
  res.json({ ok: true });
});
```

### Step 3: Implement Alerting System

**File:** `apps/backend/server.ts`

```typescript
// Alert manager
class AlertManager {
  private env: Env;
  private alertRules: AlertRule[];
  
  constructor(env: Env) {
    this.env = env;
    this.alertRules = [
      {
        name: 'high_error_rate',
        condition: async () => {
          const errors = await this.env.RELAY_DB.prepare(
            "SELECT COUNT(*) as count FROM relay_errors WHERE timestamp >= datetime('now', '-5 minutes')"
          ).first();
          return errors.count > 10;
        },
        severity: 'error',
        message: 'High error rate detected (>10 errors in 5 minutes)',
      },
      {
        name: 'slow_response_time',
        condition: async () => {
          const metrics = await this.env.RELAY_DB.prepare(
            "SELECT AVG(metric_value) as avg FROM relay_metrics WHERE metric_name = 'relay.assign.duration' AND timestamp >= datetime('now', '-5 minutes')"
          ).first();
          return metrics.avg > 5000; // 5 seconds
        },
        severity: 'warning',
        message: 'Slow response time detected (>5s average)',
      },
      {
        name: 'task_backlog',
        condition: async () => {
          const tasks = await this.env.RELAY_DB.prepare(
            "SELECT COUNT(*) as count FROM relay_tasks WHERE status = 'unread'"
          ).first();
          return tasks.count > 50;
        },
        severity: 'warning',
        message: 'Task backlog detected (>50 unread tasks)',
      },
    ];
  }
  
  async checkAlerts() {
    for (const rule of this.alertRules) {
      const triggered = await rule.condition();
      
      if (triggered) {
        await this.createAlert(rule.severity, rule.message, { rule: rule.name });
      }
    }
  }
  
  async createAlert(severity: string, message: string, metadata: Record<string, any> = {}) {
    const timestamp = new Date().toISOString();
    
    await this.env.RELAY_DB.prepare(
      "INSERT INTO relay_alerts (timestamp, alert_type, severity, message, metadata) VALUES (?, ?, ?, ?, ?)"
    ).bind(timestamp, 'system_alert', severity, message, JSON.stringify(metadata)).run();
    
    // Send notification for critical alerts
    if (severity === 'critical') {
      await this.sendNotification(severity, message);
    }
  }
  
  async resolveAlert(alertId: number, resolvedBy: string) {
    const timestamp = new Date().toISOString();
    
    await this.env.RELAY_DB.prepare(
      "UPDATE relay_alerts SET resolved_at = ?, resolved_by = ? WHERE id = ?"
    ).bind(timestamp, resolvedBy, alertId).run();
  }
  
  private async sendNotification(severity: string, message: string) {
    // Send to Slack, email, or other notification system
    console.log(`[${severity.toUpperCase()}] ${message}`);
  }
}

interface AlertRule {
  name: string;
  condition: () => Promise<boolean>;
  severity: string;
  message: string;
}

// Use alert manager
const alerts = new AlertManager(env);

// Check alerts periodically
setInterval(() => alerts.checkAlerts(), 60000); // Every minute
```

### Step 4: Implement SLA Tracking

**File:** `apps/backend/server.ts`

```typescript
// SLA tracker
class SLATracker {
  private env: Env;
  private thresholds: Record<string, number> = {
    response_time: 5000, // 5 seconds
    completion_time: 300000, // 5 minutes
    uptime: 99.9, // 99.9%
  };
  
  constructor(env: Env) {
    this.env = env;
  }
  
  async recordSLA(type: string, value: number, taskId?: string) {
    const timestamp = new Date().toISOString();
    const threshold = this.thresholds[type];
    const status = value <= threshold ? 'pass' : 'fail';
    
    await this.env.RELAY_DB.prepare(
      "INSERT INTO relay_sla (timestamp, task_id, sla_type, sla_value, sla_threshold, sla_status) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(timestamp, taskId || null, type, value, threshold, status).run();
    
    if (status === 'fail') {
      await alerts.createAlert('warning', `SLA violation: ${type} (${value} > ${threshold})`, { task_id: taskId });
    }
  }
  
  async getSLAReport(timeRange: string = '24h') {
    const startTime = new Date(Date.now() - this.parseTimeRange(timeRange)).toISOString();
    
    const report = await this.env.RELAY_DB.prepare(
      "SELECT sla_type, COUNT(*) as total, SUM(CASE WHEN sla_status = 'pass' THEN 1 ELSE 0 END) as passed FROM relay_sla WHERE timestamp >= ? GROUP BY sla_type"
    ).bind(startTime).all();
    
    return report.results.map(row => ({
      type: row.sla_type,
      total: row.total,
      passed: row.passed,
      pass_rate: (row.passed / row.total) * 100,
    }));
  }
  
  private parseTimeRange(range: string): number {
    const units: Record<string, number> = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000,
    };
    
    const match = range.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      return value * units[unit];
    }
    
    return 86400000; // Default 24 hours
  }
}

// Use SLA tracker
const sla = new SLATracker(env);

// Record SLA on task completion
app.post('/relay/status', async (req, res) => {
  const { task_id, status } = req.body;
  
  if (status === 'completed') {
    const task = await env.RELAY_DB.prepare(
      "SELECT assigned_at FROM relay_tasks WHERE id = ?"
    ).bind(task_id).first();
    
    if (task) {
      const completionTime = Date.now() - new Date(task.assigned_at).getTime();
      await sla.recordSLA('completion_time', completionTime, task_id);
    }
  }
  
  res.json({ ok: true });
});
```

### Step 5: Create Monitoring Dashboard API

**File:** `apps/backend/server.ts`

```typescript
// GET /relay/monitoring/dashboard - Monitoring dashboard
app.get('/relay/monitoring/dashboard', async (req, res) => {
  const timeRange = req.query.range || '1h';
  
  // Get metrics
  const taskAssignments = await metrics.getMetrics('relay.assign.total', timeRange);
  const responseTimes = await metrics.getMetrics('relay.assign.duration', timeRange);
  
  // Get alerts
  const activeAlerts = await env.RELAY_DB.prepare(
    "SELECT * FROM relay_alerts WHERE resolved_at IS NULL ORDER BY timestamp DESC LIMIT 20"
  ).all();
  
  // Get SLA report
  const slaReport = await sla.getSLAReport(timeRange);
  
  // Get task queue status
  const queueStatus = await env.RELAY_DB.prepare(
    "SELECT status, COUNT(*) as count FROM relay_tasks GROUP BY status"
  ).all();
  
  res.json({
    time_range: timeRange,
    metrics: {
      task_assignments: taskAssignments.length,
      avg_response_time: responseTimes.reduce((sum, m) => sum + m.metric_value, 0) / responseTimes.length,
    },
    alerts: {
      active: activeAlerts.results.length,
      recent: activeAlerts.results,
    },
    sla: slaReport,
    queue: queueStatus.results,
  });
});
```

### Step 6: Create Monitoring Worker

**File:** `apps/relay-monitoring/worker.ts`

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const metrics = new MetricsCollector(env);
    const alerts = new AlertManager(env);
    const sla = new SLATracker(env);
    
    // Check alerts
    await alerts.checkAlerts();
    
    // Record system metrics
    const timestamp = new Date().toISOString();
    await metrics.recordMetric('system.uptime', 1);
    
    // Check SLA compliance
    const slaReport = await sla.getSLAReport('1h');
    for (const item of slaReport) {
      if (item.pass_rate < 95) {
        await alerts.createAlert('warning', `SLA pass rate below 95%: ${item.type} (${item.pass_rate}%)`);
      }
    }
  }
};
```

### Step 7: Create wrangler.toml for Monitoring Worker

**File:** `apps/relay-monitoring/wrangler.toml`

```toml
name = "aether-relay-monitoring"
main = "worker.ts"
compatibility_date = "2024-12-01"

# D1 Database
[[d1_databases]]
binding = "RELAY_DB"
database_name = "relay-db"
database_id = "<from Phase 2>"

# Cron trigger - every 5 minutes
[triggers]
crons = ["*/5 * * * *"]
```

### Step 8: Run Migration

```bash
cd apps/relay
wrangler d1 migrations apply relay-db --remote
```

### Step 9: Deploy Monitoring Worker

```bash
cd apps/relay-monitoring
wrangler deploy
```

### Step 10: Test Monitoring System

1. Generate test metrics
2. Trigger alert conditions
3. Verify alerts created
4. Check monitoring dashboard
5. Verify SLA tracking
6. Test alert resolution

## Migration Checklist

- [ ] Update D1 schema for metrics
- [ ] Implement metrics collection
- [ ] Implement alerting system
- [ ] Implement SLA tracking
- [ ] Create monitoring dashboard API
- [ ] Create monitoring worker
- [ ] Create wrangler.toml
- [ ] Run migration
- [ ] Deploy monitoring worker
- [ ] Test metrics collection
- [ ] Test alerting
- [ ] Test SLA tracking
- [ ] Test monitoring dashboard
- [ ] Update documentation

## Rollback Plan

If monitoring fails:
1. Keep basic health check
2. Disable metrics collection
3. Disable alerting system
4. Disable SLA tracking
5. Remove monitoring worker

## Benefits

1. **Visibility** - Real-time metrics and alerts
2. **Proactive** - Detect issues before they impact users
3. **SLA tracking** - Monitor service level agreements
4. **Performance** - Track system performance over time
5. **Debugging** - Easier troubleshooting with metrics

## Estimated Time

- D1 schema update: 30 minutes
- Metrics collection: 1 hour
- Alerting system: 1 hour
- SLA tracking: 1 hour
- Monitoring dashboard: 30 minutes
- Monitoring worker: 30 minutes
- Testing: 1 hour
- Total: ~5.5 hours

## Next Steps

1. Get approval for implementation
2. Implement monitoring system
3. Test thoroughly
4. Deploy to production
5. Monitor metrics and alerts
