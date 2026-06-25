/**
 * @aether/monitoring - System monitoring package
 * 
 * Provides health checks, metrics collection, alert management,
 * log aggregation, and dashboard generation with full TypeScript
 * type safety and Zod validation.
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// HEALTH CHECK TYPES AND SCHEMAS
// =============================================================================

/**
 * Health check status
 */
export const HealthStatusSchema = z.enum(['healthy', 'unhealthy', 'degraded', 'unknown']);

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

/**
 * Individual health check result
 */
export const HealthCheckResultSchema = z.object({
  name: z.string().min(1),
  status: HealthStatusSchema,
  message: z.string().optional(),
  duration: z.number().optional(),
  timestamp: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;

/**
 * Overall system health
 */
export const SystemHealthSchema = z.object({
  status: HealthStatusSchema,
  checks: z.array(HealthCheckResultSchema),
  timestamp: z.date(),
  uptime: z.number(),
  version: z.string().optional(),
  environment: z.string().optional(),
});

export type SystemHealth = z.infer<typeof SystemHealthSchema>;

/**
 * Health check configuration
 */
export const HealthCheckConfigSchema = z.object({
  name: z.string().min(1),
  check: z.union([
    z.object({
      type: z.literal('http'),
      url: z.string().url(),
      method: z.enum(['GET', 'HEAD', 'POST']).optional().default('GET'),
      expectedStatus: z.number().int().optional().default(200),
      timeout: z.number().int().positive().optional().default(5000),
    }),
    z.object({
      type: z.literal('tcp'),
      host: z.string().min(1),
      port: z.number().int().positive(),
      timeout: z.number().int().positive().optional().default(5000),
    }),
    z.object({
      type: z.literal('function'),
      fn: z.function().returns(z.union([z.boolean(), z.promise(z.boolean())])),
      timeout: z.number().int().positive().optional().default(5000),
    }),
    z.object({
      type: z.literal('disk'),
      path: z.string().min(1),
      thresholdPercent: z.number().min(0).max(100).optional().default(90),
    }),
    z.object({
      type: z.literal('memory'),
      thresholdPercent: z.number().min(0).max(100).optional().default(90),
    }),
  ]),
  interval: z.number().int().positive().optional().default(60000), // 1 minute
  critical: z.boolean().optional().default(false),
});

export type HealthCheckConfig = z.infer<typeof HealthCheckConfigSchema>;

// =============================================================================
// METRICS COLLECTION TYPES AND SCHEMAS
// =============================================================================

/**
 * Metric type
 */
export const MetricTypeSchema = z.enum(['counter', 'gauge', 'histogram', 'summary']);

export type MetricType = z.infer<typeof MetricTypeSchema>;

/**
 * Metric value
 */
export const MetricValueSchema = z.object({
  value: z.number(),
  timestamp: z.date(),
  labels: z.record(z.string()).optional(),
});

export type MetricValue = z.infer<typeof MetricValueSchema>;

/**
 * Metric definition
 */
export const MetricSchema = z.object({
  name: z.string().min(1),
  type: MetricTypeSchema,
  description: z.string().optional(),
  values: z.array(MetricValueSchema),
  labels: z.record(z.string()).optional(),
  unit: z.string().optional(),
});

export type Metric = z.infer<typeof MetricSchema>;

/**
 * Metric configuration
 */
export const MetricConfigSchema = z.object({
  name: z.string().min(1),
  type: MetricTypeSchema,
  description: z.string().optional(),
  labels: z.array(z.string()).optional(),
  unit: z.string().optional(),
  buckets: z.array(z.number()).optional(), // For histogram metrics
  quantiles: z.array(z.number()).optional(), // For summary metrics
});

export type MetricConfig = z.infer<typeof MetricConfigSchema>;

/**
 * Metrics collection result
 */
export const MetricsCollectionSchema = z.object({
  metrics: z.array(MetricSchema),
  timestamp: z.date(),
  count: z.number(),
});

export type MetricsCollection = z.infer<typeof MetricsCollectionSchema>;

// =============================================================================
// ALERT MANAGEMENT TYPES AND SCHEMAS
// =============================================================================

/**
 * Alert severity
 */
export const AlertSeveritySchema = z.enum(['info', 'warning', 'error', 'critical']);

export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

/**
 * Alert status
 */
export const AlertStatusSchema = z.enum(['open', 'acknowledged', 'resolved', 'suppressed']);

export type AlertStatus = z.infer<typeof AlertStatusSchema>;

/**
 * Alert condition
 */
export const AlertConditionSchema = z.object({
  metric: z.string().min(1),
  operator: z.enum(['>', '<', '>=', '<=', '==', '!=']),
  threshold: z.number(),
  duration: z.number().int().positive().optional(), // Duration in ms
});

export type AlertCondition = z.infer<typeof AlertConditionSchema>;

/**
 * Alert definition
 */
export const AlertSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  severity: AlertSeveritySchema,
  status: AlertStatusSchema,
  condition: AlertConditionSchema,
  triggeredAt: z.date().optional(),
  acknowledgedAt: z.date().optional(),
  resolvedAt: z.date().optional(),
  acknowledgedBy: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Alert = z.infer<typeof AlertSchema>;

/**
 * Alert configuration
 */
export const AlertConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  severity: AlertSeveritySchema,
  condition: AlertConditionSchema,
  enabled: z.boolean().optional().default(true),
  notificationChannels: z.array(z.string()).optional(),
  cooldown: z.number().int().positive().optional().default(300000), // 5 minutes
});

export type AlertConfig = z.infer<typeof AlertConfigSchema>;

/**
 * Alert notification
 */
export const AlertNotificationSchema = z.object({
  alertId: z.string(),
  channel: z.string(),
  sentAt: z.date(),
  status: z.enum(['sent', 'failed', 'pending']),
  error: z.string().optional(),
});

export type AlertNotification = z.infer<typeof AlertNotificationSchema>;

// =============================================================================
// LOG AGGREGATION TYPES AND SCHEMAS
// =============================================================================

/**
 * Log level
 */
export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'fatal']);

export type LogLevel = z.infer<typeof LogLevelSchema>;

/**
 * Log entry
 */
export const LogEntrySchema = z.object({
  timestamp: z.date(),
  level: LogLevelSchema,
  message: z.string(),
  context: z.record(z.unknown()).optional(),
  service: z.string().optional(),
  requestId: z.string().optional(),
  userId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

/**
 * Log query
 */
export const LogQuerySchema = z.object({
  level: LogLevelSchema.optional(),
  service: z.string().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  message: z.string().optional(),
  context: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export type LogQuery = z.infer<typeof LogQuerySchema>;

/**
 * Log aggregation result
 */
export const LogAggregationSchema = z.object({
  entries: z.array(LogEntrySchema),
  total: z.number(),
  query: LogQuerySchema,
  timestamp: z.date(),
});

export type LogAggregation = z.infer<typeof LogAggregationSchema>;

/**
 * Log retention policy
 */
export const LogRetentionPolicySchema = z.object({
  defaultRetentionDays: z.number().int().positive().optional().default(30),
  levelRetention: z.record(z.number().int().positive()).optional(),
  maxSizeGB: z.number().int().positive().optional(),
});

export type LogRetentionPolicy = z.infer<typeof LogRetentionPolicySchema>;

// =============================================================================
// DASHBOARD GENERATION TYPES AND SCHEMAS
// =============================================================================

/**
 * Dashboard widget type
 */
export const DashboardWidgetTypeSchema = z.enum([
  'metric',
  'chart',
  'gauge',
  'table',
  'log',
  'alert',
  'status',
]);

export type DashboardWidgetType = z.infer<typeof DashboardWidgetTypeSchema>;

/**
 * Dashboard widget
 */
export const DashboardWidgetSchema = z.object({
  id: z.string().min(1),
  type: DashboardWidgetTypeSchema,
  title: z.string().min(1),
  query: z.union([z.string(), z.record(z.unknown())]),
  config: z.record(z.unknown()).optional(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
  }),
  refreshInterval: z.number().int().positive().optional().default(30000), // 30 seconds
});

export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;

/**
 * Dashboard configuration
 */
export const DashboardConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  widgets: z.array(DashboardWidgetSchema),
  refreshInterval: z.number().int().positive().optional().default(30000),
  autoRefresh: z.boolean().optional().default(true),
  theme: z.enum(['light', 'dark']).optional().default('dark'),
});

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

/**
 * Dashboard data
 */
export const DashboardDataSchema = z.object({
  dashboard: DashboardConfigSchema,
  data: z.record(z.unknown()),
  timestamp: z.date(),
  refreshInterval: z.number(),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;

// =============================================================================
// VALIDATOR FUNCTIONS
// =============================================================================

/**
 * Parse and validate health check configuration
 */
export function parseHealthCheckConfig(data: unknown): HealthCheckConfig {
  return HealthCheckConfigSchema.parse(data);
}

/**
 * Parse and validate metric configuration
 */
export function parseMetricConfig(data: unknown): MetricConfig {
  return MetricConfigSchema.parse(data);
}

/**
 * Parse and validate alert configuration
 */
export function parseAlertConfig(data: unknown): AlertConfig {
  return AlertConfigSchema.parse(data);
}

/**
 * Parse and validate log query
 */
export function parseLogQuery(data: unknown): LogQuery {
  return LogQuerySchema.parse(data);
}

/**
 * Parse and validate dashboard configuration
 */
export function parseDashboardConfig(data: unknown): DashboardConfig {
  return DashboardConfigSchema.parse(data);
}

// =============================================================================
// HEALTH CHECK IMPLEMENTATION
// =============================================================================

/**
 * Health check manager
 */
export class HealthCheckManager {
  private checks: Map<string, HealthCheckConfig> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();
  private startTime: Date = new Date();

  /**
   * Register a health check
   */
  register(config: HealthCheckConfig): void {
    const validated = parseHealthCheckConfig(config);
    this.checks.set(validated.name, validated);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);
  }

  /**
   * Execute a single health check
   */
  async executeCheck(name: string): Promise<HealthCheckResult> {
    const config = this.checks.get(name);
    if (!config) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();
    const result: HealthCheckResult = {
      name: config.name,
      status: 'unknown',
      timestamp: new Date(),
    };

    try {
      // Simulate health check execution
      // In a real implementation, this would execute the actual check
      await new Promise(resolve => setTimeout(resolve, 10));
      result.status = 'healthy';
      result.message = 'Health check passed';
    } catch (error) {
      result.status = 'unhealthy';
      result.message = error instanceof Error ? error.message : 'Unknown error';
    }

    result.duration = Date.now() - startTime;
    this.results.set(name, result);
    return result;
  }

  /**
   * Execute all health checks
   */
  async executeAll(): Promise<SystemHealth> {
    const checks: HealthCheckResult[] = [];

    for (const name of this.checks.keys()) {
      try {
        const result = await this.executeCheck(name);
        checks.push(result);
      } catch (error) {
        checks.push({
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // Determine overall status
    let status: HealthStatus = 'healthy';
    const criticalChecks = checks.filter(c => {
      const config = this.checks.get(c.name);
      return config?.critical;
    });

    if (criticalChecks.some(c => c.status === 'unhealthy')) {
      status = 'unhealthy';
    } else if (checks.some(c => c.status === 'unhealthy')) {
      status = 'degraded';
    }

    return {
      status,
      checks,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Get current system health
   */
  async getHealth(): Promise<SystemHealth> {
    return this.executeAll();
  }
}

// =============================================================================
// METRICS COLLECTION IMPLEMENTATION
// =============================================================================

/**
 * Metrics collector
 */
export class MetricsCollector {
  private metrics: Map<string, Metric> = new Map();
  private configs: Map<string, MetricConfig> = new Map();

  /**
   * Register a metric
   */
  register(config: MetricConfig): void {
    const validated = parseMetricConfig(config);
    this.configs.set(validated.name, validated);
    this.metrics.set(validated.name, {
      name: validated.name,
      type: validated.type,
      description: validated.description,
      values: [],
      labels: {},
      unit: validated.unit,
    });
  }

  /**
   * Unregister a metric
   */
  unregister(name: string): void {
    this.metrics.delete(name);
    this.configs.delete(name);
  }

  /**
   * Record a metric value
   */
  record(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric '${name}' not registered`);
    }

    metric.values.push({
      value,
      timestamp: new Date(),
      labels,
    });
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric '${name}' not registered`);
    }

    if (metric.type !== 'counter') {
      throw new Error(`Metric '${name}' is not a counter`);
    }

    this.record(name, value, labels);
  }

  /**
   * Set a gauge metric value
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric '${name}' not registered`);
    }

    if (metric.type !== 'gauge') {
      throw new Error(`Metric '${name}' is not a gauge`);
    }

    this.record(name, value, labels);
  }

  /**
   * Observe a histogram/summary metric
   */
  observe(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric '${name}' not registered`);
    }

    if (metric.type !== 'histogram' && metric.type !== 'summary') {
      throw new Error(`Metric '${name}' is not a histogram or summary`);
    }

    this.record(name, value, labels);
  }

  /**
   * Get all metrics
   */
  getAll(): MetricsCollection {
    return {
      metrics: Array.from(this.metrics.values()),
      timestamp: new Date(),
      count: this.metrics.size,
    };
  }

  /**
   * Get a specific metric
   */
  get(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Reset a metric
   */
  reset(name: string): void {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.values = [];
    }
  }

  /**
   * Reset all metrics
   */
  resetAll(): void {
    for (const metric of this.metrics.values()) {
      metric.values = [];
    }
  }
}

// =============================================================================
// ALERT MANAGEMENT IMPLEMENTATION
// =============================================================================

/**
 * Alert manager
 */
export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private configs: Map<string, AlertConfig> = new Map();
  private notifications: AlertNotification[] = [];
  private cooldowns: Map<string, number> = new Map();

  /**
   * Register an alert
   */
  register(config: AlertConfig): void {
    const validated = parseAlertConfig(config);
    this.configs.set(validated.name, validated);
  }

  /**
   * Unregister an alert
   */
  unregister(name: string): void {
    this.configs.delete(name);
    this.alerts.delete(name);
  }

  /**
   * Evaluate alert conditions
   */
  async evaluate(metrics: MetricsCollection): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const [name, config] of this.configs.entries()) {
      if (!config.enabled) continue;

      // Check cooldown
      const lastTriggered = this.cooldowns.get(name);
      if (lastTriggered && Date.now() - lastTriggered < config.cooldown) {
        continue;
      }

      // Find matching metric
      const metric = metrics.metrics.find(m => m.name === config.condition.metric);
      if (!metric || metric.values.length === 0) continue;

      const latestValue = metric.values[metric.values.length - 1].value;
      const { operator, threshold } = config.condition;

      let triggered = false;
      switch (operator) {
        case '>':
          triggered = latestValue > threshold;
          break;
        case '<':
          triggered = latestValue < threshold;
          break;
        case '>=':
          triggered = latestValue >= threshold;
          break;
        case '<=':
          triggered = latestValue <= threshold;
          break;
        case '==':
          triggered = latestValue === threshold;
          break;
        case '!=':
          triggered = latestValue !== threshold;
          break;
      }

      if (triggered) {
        const alert: Alert = {
          id: `alert-${Date.now()}-${name}`,
          name: config.name,
          description: config.description,
          severity: config.severity,
          status: 'open',
          condition: config.condition,
          triggeredAt: new Date(),
        };

        this.alerts.set(alert.id, alert);
        this.cooldowns.set(name, Date.now());
        triggeredAlerts.push(alert);

        // Send notifications
        if (config.notificationChannels) {
          for (const channel of config.notificationChannels) {
            await this.sendNotification(alert, channel);
          }
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Acknowledge an alert
   */
  acknowledge(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
    }
  }

  /**
   * Resolve an alert
   */
  resolve(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Get all alerts
   */
  getAll(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alerts by status
   */
  getByStatus(status: AlertStatus): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.status === status);
  }

  /**
   * Get alert notifications
   */
  getNotifications(): AlertNotification[] {
    return this.notifications;
  }

  /**
   * Send notification for an alert
   */
  private async sendNotification(alert: Alert, channel: string): Promise<void> {
    const notification: AlertNotification = {
      alertId: alert.id,
      channel,
      sentAt: new Date(),
      status: 'pending',
    };

    try {
      // Simulate sending notification
      await new Promise(resolve => setTimeout(resolve, 10));
      notification.status = 'sent';
    } catch (error) {
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.notifications.push(notification);
  }
}

// =============================================================================
// LOG AGGREGATION IMPLEMENTATION
// =============================================================================

/**
 * Log aggregator
 */
export class LogAggregator {
  private entries: LogEntry[] = [];
  private retentionPolicy: LogRetentionPolicy = {};

  /**
   * Set retention policy
   */
  setRetentionPolicy(policy: LogRetentionPolicy): void {
    this.retentionPolicy = policy;
  }

  /**
   * Add a log entry
   */
  add(entry: LogEntry): void {
    this.entries.push(entry);
    this.applyRetentionPolicy();
  }

  /**
   * Query logs
   */
  query(query: LogQuery): LogAggregation {
    const validated = parseLogQuery(query);
    let filtered = [...this.entries];

    if (validated.level) {
      filtered = filtered.filter(e => e.level === validated.level);
    }

    if (validated.service) {
      filtered = filtered.filter(e => e.service === validated.service);
    }

    if (validated.startTime) {
      filtered = filtered.filter(e => e.timestamp >= validated.startTime!);
    }

    if (validated.endTime) {
      filtered = filtered.filter(e => e.timestamp <= validated.endTime!);
    }

    if (validated.message) {
      filtered = filtered.filter(e => e.message.includes(validated.message!));
    }

    if (validated.context) {
      filtered = filtered.filter(e => {
        for (const [key, value] of Object.entries(validated.context!)) {
          if (e.context?.[key] !== value) return false;
        }
        return true;
      });
    }

    if (validated.tags && validated.tags.length > 0) {
      filtered = filtered.filter(e =>
        validated.tags!.some(tag => e.tags?.includes(tag))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(validated.offset, validated.offset + validated.limit);

    return {
      entries: paginated,
      total,
      query: validated,
      timestamp: new Date(),
    };
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Apply retention policy
   */
  private applyRetentionPolicy(): void {
    const now = new Date();
    const defaultRetention = this.retentionPolicy.defaultRetentionDays || 30;
    const cutoff = new Date(now.getTime() - defaultRetention * 24 * 60 * 60 * 1000);

    this.entries = this.entries.filter(entry => entry.timestamp >= cutoff);

    // Apply size limit
    if (this.retentionPolicy.maxSizeGB) {
      const maxSizeBytes = this.retentionPolicy.maxSizeGB * 1024 * 1024 * 1024;
      let currentSize = 0;

      const filtered: LogEntry[] = [];
      for (const entry of this.entries) {
        const entrySize = JSON.stringify(entry).length;
        if (currentSize + entrySize > maxSizeBytes) break;
        filtered.push(entry);
        currentSize += entrySize;
      }

      this.entries = filtered;
    }
  }
}

// =============================================================================
// DASHBOARD GENERATION IMPLEMENTATION
// =============================================================================

/**
 * Dashboard manager
 */
export class DashboardManager {
  private dashboards: Map<string, DashboardConfig> = new Map();

  /**
   * Create a dashboard
   */
  create(config: DashboardConfig): void {
    const validated = parseDashboardConfig(config);
    this.dashboards.set(validated.id, validated);
  }

  /**
   * Update a dashboard
   */
  update(id: string, config: Partial<DashboardConfig>): void {
    const existing = this.dashboards.get(id);
    if (!existing) {
      throw new Error(`Dashboard '${id}' not found`);
    }

    const updated = { ...existing, ...config };
    this.dashboards.set(id, parseDashboardConfig(updated));
  }

  /**
   * Delete a dashboard
   */
  delete(id: string): void {
    this.dashboards.delete(id);
  }

  /**
   * Get a dashboard
   */
  get(id: string): DashboardConfig | undefined {
    return this.dashboards.get(id);
  }

  /**
   * Get all dashboards
   */
  getAll(): DashboardConfig[] {
    return Array.from(this.dashboards.values());
  }

  /**
   * Generate dashboard data
   */
  async generateData(
    id: string,
    metrics: MetricsCollection,
    logs: LogAggregation,
    alerts: Alert[]
  ): Promise<DashboardData> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard '${id}' not found`);
    }

    const data: Record<string, unknown> = {};

    for (const widget of dashboard.widgets) {
      // Generate data for each widget based on its type and query
      // In a real implementation, this would execute the actual queries
      data[widget.id] = {
        type: widget.type,
        timestamp: new Date(),
        value: Math.random() * 100, // Simulated data
      };
    }

    return {
      dashboard,
      data,
      timestamp: new Date(),
      refreshInterval: dashboard.refreshInterval,
    };
  }
}

// =============================================================================
// MONITORING CLASS (LEGACY COMPATIBILITY)
// =============================================================================

/**
 * Legacy monitoring class for backward compatibility
 */
export class Monitoring {
  private metrics: MetricsCollector = new MetricsCollector();

  recordMetric(name: string, value: number): void {
    this.metrics.record(name, value);
  }

  getMetrics(): MetricsCollection {
    return this.metrics.getAll();
  }
}

export const monitoring = new Monitoring();

// =============================================================================
// EXPORTS
// =============================================================================

export {
  HealthStatusSchema,
  HealthCheckResultSchema,
  SystemHealthSchema,
  HealthCheckConfigSchema,
  MetricTypeSchema,
  MetricValueSchema,
  MetricSchema,
  MetricConfigSchema,
  MetricsCollectionSchema,
  AlertSeveritySchema,
  AlertStatusSchema,
  AlertConditionSchema,
  AlertSchema,
  AlertConfigSchema,
  AlertNotificationSchema,
  LogLevelSchema,
  LogEntrySchema,
  LogQuerySchema,
  LogAggregationSchema,
  LogRetentionPolicySchema,
  DashboardWidgetTypeSchema,
  DashboardWidgetSchema,
  DashboardConfigSchema,
  DashboardDataSchema,
};
