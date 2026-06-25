/**
 * Tests for @aether/monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  HealthCheckConfigSchema,
  MetricConfigSchema,
  AlertConfigSchema,
  LogQuerySchema,
  DashboardConfigSchema,
  parseHealthCheckConfig,
  parseMetricConfig,
  parseAlertConfig,
  parseLogQuery,
  parseDashboardConfig,
  HealthCheckManager,
  MetricsCollector,
  AlertManager,
  LogAggregator,
  DashboardManager,
  Monitoring,
  monitoring,
  type HealthCheckConfig,
  type MetricConfig,
  type AlertConfig,
  type LogQuery,
  type DashboardConfig,
} from './index';

describe('HealthCheckConfigSchema', () => {
  it('parses a valid HTTP health check configuration', () => {
    const valid: HealthCheckConfig = {
      name: 'api-health',
      check: {
        type: 'http',
        url: 'https://api.example.com/health',
      },
    };

    const result = HealthCheckConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('api-health');
    }
  });

  it('parses a valid TCP health check configuration', () => {
    const valid: HealthCheckConfig = {
      name: 'database-health',
      check: {
        type: 'tcp',
        host: 'localhost',
        port: 5432,
      },
    };

    const result = HealthCheckConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.check.type).toBe('tcp');
    }
  });

  it('parses a valid function health check configuration', () => {
    const valid: HealthCheckConfig = {
      name: 'custom-health',
      check: {
        type: 'function',
        fn: () => true,
      },
    };

    const result = HealthCheckConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.check.type).toBe('function');
    }
  });

  it('rejects health check without name', () => {
    const invalid = {
      check: {
        type: 'http',
        url: 'https://api.example.com/health',
      },
    };

    const result = HealthCheckConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default interval', () => {
    const partial = {
      name: 'test',
      check: {
        type: 'http',
        url: 'https://api.example.com/health',
      },
    };

    const result = HealthCheckConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interval).toBe(60000);
    }
  });
});

describe('MetricConfigSchema', () => {
  it('parses a valid counter metric configuration', () => {
    const valid: MetricConfig = {
      name: 'requests_total',
      type: 'counter',
      description: 'Total number of requests',
    };

    const result = MetricConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('counter');
    }
  });

  it('parses a valid gauge metric configuration', () => {
    const valid: MetricConfig = {
      name: 'memory_usage',
      type: 'gauge',
      unit: 'bytes',
    };

    const result = MetricConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('gauge');
    }
  });

  it('parses a valid histogram metric configuration', () => {
    const valid: MetricConfig = {
      name: 'request_duration',
      type: 'histogram',
      buckets: [0.1, 0.5, 1, 5],
    };

    const result = MetricConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('histogram');
      expect(result.data.buckets).toHaveLength(4);
    }
  });

  it('rejects metric without name', () => {
    const invalid = {
      type: 'counter',
    };

    const result = MetricConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('AlertConfigSchema', () => {
  it('parses a valid alert configuration', () => {
    const valid: AlertConfig = {
      name: 'high-error-rate',
      severity: 'critical',
      condition: {
        metric: 'error_rate',
        operator: '>',
        threshold: 0.05,
      },
    };

    const result = AlertConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity).toBe('critical');
    }
  });

  it('rejects alert without name', () => {
    const invalid = {
      severity: 'critical',
      condition: {
        metric: 'error_rate',
        operator: '>',
        threshold: 0.05,
      },
    };

    const result = AlertConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default enabled', () => {
    const partial = {
      name: 'test-alert',
      severity: 'warning',
      condition: {
        metric: 'test_metric',
        operator: '>',
        threshold: 10,
      },
    };

    const result = AlertConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(true);
    }
  });

  it('applies default cooldown', () => {
    const partial = {
      name: 'test-alert',
      severity: 'warning',
      condition: {
        metric: 'test_metric',
        operator: '>',
        threshold: 10,
      },
    };

    const result = AlertConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cooldown).toBe(300000);
    }
  });
});

describe('LogQuerySchema', () => {
  it('parses a valid log query', () => {
    const valid: LogQuery = {
      level: 'error',
      service: 'api',
      limit: 50,
    };

    const result = LogQuerySchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe('error');
    }
  });

  it('applies default limit', () => {
    const partial = {
      level: 'info',
    };

    const result = LogQuerySchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });

  it('applies default offset', () => {
    const partial = {
      level: 'info',
    };

    const result = LogQuerySchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.offset).toBe(0);
    }
  });
});

describe('DashboardConfigSchema', () => {
  it('parses a valid dashboard configuration', () => {
    const valid: DashboardConfig = {
      id: 'main-dashboard',
      name: 'Main Dashboard',
      widgets: [
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Request Rate',
          query: 'rate(requests_total[5m])',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
      ],
    };

    const result = DashboardConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Main Dashboard');
    }
  });

  it('rejects dashboard without widgets', () => {
    const invalid = {
      id: 'test',
      name: 'Test Dashboard',
      widgets: [],
    };

    const result = DashboardConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default refreshInterval', () => {
    const partial = {
      id: 'test',
      name: 'Test Dashboard',
      widgets: [
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Test',
          query: 'test',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
      ],
    };

    const result = DashboardConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refreshInterval).toBe(30000);
    }
  });
});

describe('Validator Functions', () => {
  it('parseHealthCheckConfig throws on invalid data', () => {
    expect(() => parseHealthCheckConfig({})).toThrow();
  });

  it('parseHealthCheckConfig returns parsed data on success', () => {
    const input = {
      name: 'test',
      check: {
        type: 'http',
        url: 'https://api.example.com/health',
      },
    };
    const result = parseHealthCheckConfig(input);
    expect(result.name).toBe('test');
  });

  it('parseMetricConfig throws on invalid data', () => {
    expect(() => parseMetricConfig({})).toThrow();
  });

  it('parseAlertConfig throws on invalid data', () => {
    expect(() => parseAlertConfig({})).toThrow();
  });

  it('parseLogQuery throws on invalid data', () => {
    expect(() => parseLogQuery({ limit: -1 })).toThrow();
  });

  it('parseDashboardConfig throws on invalid data', () => {
    expect(() => parseDashboardConfig({})).toThrow();
  });
});

describe('HealthCheckManager', () => {
  let manager: HealthCheckManager;

  beforeEach(() => {
    manager = new HealthCheckManager();
  });

  it('registers a health check', async () => {
    const config: HealthCheckConfig = {
      name: 'test-check',
      check: {
        type: 'http',
        url: 'https://api.example.com/health',
      },
    };

    manager.register(config);
    const result = await manager.executeCheck('test-check');
    expect(result.name).toBe('test-check');
  });

  it('executes all health checks', async () => {
    manager.register({
      name: 'check-1',
      check: { type: 'http', url: 'https://api.example.com/health' },
    });
    manager.register({
      name: 'check-2',
      check: { type: 'tcp', host: 'localhost', port: 5432 },
    });

    const result = await manager.executeAll();
    expect(result.checks).toHaveLength(2);
    expect(result.status).toBe('healthy');
  });

  it('unregisters a health check', async () => {
    manager.register({
      name: 'test-check',
      check: { type: 'http', url: 'https://api.example.com/health' },
    });

    manager.unregister('test-check');
    const result = await manager.executeAll();
    expect(result.checks).toHaveLength(0);
  });

  it('validates config before registration', () => {
    expect(() => manager.register({} as HealthCheckConfig)).toThrow();
  });
});

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  it('registers a metric', () => {
    const config: MetricConfig = {
      name: 'test_metric',
      type: 'counter',
    };

    collector.register(config);
    const metric = collector.get('test_metric');
    expect(metric).toBeDefined();
    expect(metric?.name).toBe('test_metric');
  });

  it('records a metric value', () => {
    collector.register({
      name: 'test_metric',
      type: 'counter',
    });

    collector.record('test_metric', 42);
    const metric = collector.get('test_metric');
    expect(metric?.values).toHaveLength(1);
    expect(metric?.values[0].value).toBe(42);
  });

  it('increments a counter metric', () => {
    collector.register({
      name: 'requests_total',
      type: 'counter',
    });

    collector.increment('requests_total', 1);
    collector.increment('requests_total', 1);
    const metric = collector.get('requests_total');
    expect(metric?.values).toHaveLength(2);
  });

  it('sets a gauge metric value', () => {
    collector.register({
      name: 'memory_usage',
      type: 'gauge',
    });

    collector.gauge('memory_usage', 1024);
    const metric = collector.get('memory_usage');
    expect(metric?.values[0].value).toBe(1024);
  });

  it('throws when incrementing non-counter metric', () => {
    collector.register({
      name: 'test_gauge',
      type: 'gauge',
    });

    expect(() => collector.increment('test_gauge', 1)).toThrow();
  });

  it('resets a metric', () => {
    collector.register({
      name: 'test_metric',
      type: 'counter',
    });

    collector.record('test_metric', 42);
    collector.reset('test_metric');
    const metric = collector.get('test_metric');
    expect(metric?.values).toHaveLength(0);
  });

  it('resets all metrics', () => {
    collector.register({ name: 'metric-1', type: 'counter' });
    collector.register({ name: 'metric-2', type: 'gauge' });

    collector.record('metric-1', 1);
    collector.record('metric-2', 2);

    collector.resetAll();

    expect(collector.get('metric-1')?.values).toHaveLength(0);
    expect(collector.get('metric-2')?.values).toHaveLength(0);
  });

  it('validates config before registration', () => {
    expect(() => collector.register({} as MetricConfig)).toThrow();
  });
});

describe('AlertManager', () => {
  let manager: AlertManager;

  beforeEach(() => {
    manager = new AlertManager();
  });

  it('registers an alert', () => {
    const config: AlertConfig = {
      name: 'test-alert',
      severity: 'warning',
      condition: {
        metric: 'test_metric',
        operator: '>',
        threshold: 10,
      },
    };

    manager.register(config);
    const alerts = manager.getAll();
    expect(alerts).toHaveLength(0); // No alerts triggered yet
  });

  it('evaluates alert conditions', async () => {
    manager.register({
      name: 'high-value',
      severity: 'critical',
      condition: {
        metric: 'test_metric',
        operator: '>',
        threshold: 50,
      },
    });

    const metrics = {
      metrics: [
        {
          name: 'test_metric',
          type: 'gauge',
          values: [{ value: 100, timestamp: new Date() }],
          labels: {},
        },
      ],
      timestamp: new Date(),
      count: 1,
    };

    const triggered = await manager.evaluate(metrics);
    expect(triggered).toHaveLength(1);
    expect(triggered[0].severity).toBe('critical');
  });

  it('acknowledges an alert', () => {
    manager.register({
      name: 'test-alert',
      severity: 'warning',
      condition: { metric: 'test', operator: '>', threshold: 10 },
    });

    // Manually add an alert for testing
    const alertId = 'test-alert-id';
    manager['alerts'].set(alertId, {
      id: alertId,
      name: 'test-alert',
      severity: 'warning',
      status: 'open',
      condition: { metric: 'test', operator: '>', threshold: 10 },
    });

    manager.acknowledge(alertId, 'user-1');
    const alert = manager['alerts'].get(alertId);
    expect(alert?.status).toBe('acknowledged');
    expect(alert?.acknowledgedBy).toBe('user-1');
  });

  it('resolves an alert', () => {
    manager.register({
      name: 'test-alert',
      severity: 'warning',
      condition: { metric: 'test', operator: '>', threshold: 10 },
    });

    const alertId = 'test-alert-id';
    manager['alerts'].set(alertId, {
      id: alertId,
      name: 'test-alert',
      severity: 'warning',
      status: 'open',
      condition: { metric: 'test', operator: '>', threshold: 10 },
    });

    manager.resolve(alertId);
    const alert = manager['alerts'].get(alertId);
    expect(alert?.status).toBe('resolved');
  });

  it('gets alerts by status', () => {
    manager.register({
      name: 'alert-1',
      severity: 'warning',
      condition: { metric: 'test', operator: '>', threshold: 10 },
    });

    manager['alerts'].set('alert-1', {
      id: 'alert-1',
      name: 'alert-1',
      severity: 'warning',
      status: 'open',
      condition: { metric: 'test', operator: '>', threshold: 10 },
    });

    manager['alerts'].set('alert-2', {
      id: 'alert-2',
      name: 'alert-2',
      severity: 'error',
      status: 'resolved',
      condition: { metric: 'test', operator: '>', threshold: 10 },
    });

    const openAlerts = manager.getByStatus('open');
    expect(openAlerts).toHaveLength(1);
  });

  it('validates config before registration', () => {
    expect(() => manager.register({} as AlertConfig)).toThrow();
  });
});

describe('LogAggregator', () => {
  let aggregator: LogAggregator;

  beforeEach(() => {
    aggregator = new LogAggregator();
  });

  it('adds a log entry', () => {
    aggregator.add({
      timestamp: new Date(),
      level: 'info',
      message: 'Test message',
    });

    const result = aggregator.query({});
    expect(result.entries).toHaveLength(1);
  });

  it('queries logs by level', () => {
    aggregator.add({ timestamp: new Date(), level: 'info', message: 'Info message' });
    aggregator.add({ timestamp: new Date(), level: 'error', message: 'Error message' });

    const result = aggregator.query({ level: 'error' });
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].level).toBe('error');
  });

  it('queries logs by service', () => {
    aggregator.add({
      timestamp: new Date(),
      level: 'info',
      message: 'Message',
      service: 'api',
    });
    aggregator.add({
      timestamp: new Date(),
      level: 'info',
      message: 'Message',
      service: 'worker',
    });

    const result = aggregator.query({ service: 'api' });
    expect(result.entries).toHaveLength(1);
  });

  it('queries logs by message', () => {
    aggregator.add({ timestamp: new Date(), level: 'info', message: 'Test message' });
    aggregator.add({ timestamp: new Date(), level: 'info', message: 'Other message' });

    const result = aggregator.query({ message: 'Test' });
    expect(result.entries).toHaveLength(1);
  });

  it('applies pagination', () => {
    for (let i = 0; i < 10; i++) {
      aggregator.add({
        timestamp: new Date(),
        level: 'info',
        message: `Message ${i}`,
      });
    }

    const result = aggregator.query({ limit: 5, offset: 0 });
    expect(result.entries).toHaveLength(5);
    expect(result.total).toBe(10);
  });

  it('clears all logs', () => {
    aggregator.add({ timestamp: new Date(), level: 'info', message: 'Test' });
    aggregator.clear();

    const result = aggregator.query({});
    expect(result.entries).toHaveLength(0);
  });

  it('validates query before execution', () => {
    expect(() => aggregator.query({ limit: -1 })).toThrow();
  });
});

describe('DashboardManager', () => {
  let manager: DashboardManager;

  beforeEach(() => {
    manager = new DashboardManager();
  });

  it('creates a dashboard', () => {
    const config: DashboardConfig = {
      id: 'test-dashboard',
      name: 'Test Dashboard',
      widgets: [
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Test Widget',
          query: 'test',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
      ],
    };

    manager.create(config);
    const dashboard = manager.get('test-dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard?.name).toBe('Test Dashboard');
  });

  it('updates a dashboard', () => {
    const config: DashboardConfig = {
      id: 'test-dashboard',
      name: 'Test Dashboard',
      widgets: [
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Test Widget',
          query: 'test',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
      ],
    };

    manager.create(config);
    manager.update('test-dashboard', { name: 'Updated Dashboard' });

    const dashboard = manager.get('test-dashboard');
    expect(dashboard?.name).toBe('Updated Dashboard');
  });

  it('deletes a dashboard', () => {
    const config: DashboardConfig = {
      id: 'test-dashboard',
      name: 'Test Dashboard',
      widgets: [
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Test Widget',
          query: 'test',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
      ],
    };

    manager.create(config);
    manager.delete('test-dashboard');

    const dashboard = manager.get('test-dashboard');
    expect(dashboard).toBeUndefined();
  });

  it('gets all dashboards', () => {
    manager.create({
      id: 'dashboard-1',
      name: 'Dashboard 1',
      widgets: [
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Test',
          query: 'test',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
      ],
    });
    manager.create({
      id: 'dashboard-2',
      name: 'Dashboard 2',
      widgets: [
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Test',
          query: 'test',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
      ],
    });

    const dashboards = manager.getAll();
    expect(dashboards).toHaveLength(2);
  });

  it('generates dashboard data', async () => {
    const config: DashboardConfig = {
      id: 'test-dashboard',
      name: 'Test Dashboard',
      widgets: [
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Test Widget',
          query: 'test',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
      ],
    };

    manager.create(config);

    const data = await manager.generateData(
      'test-dashboard',
      { metrics: [], timestamp: new Date(), count: 0 },
      { entries: [], total: 0, query: {}, timestamp: new Date() },
      []
    );

    expect(data.dashboard.id).toBe('test-dashboard');
    expect(data.data).toBeDefined();
  });

  it('validates config before creation', () => {
    expect(() => manager.create({} as DashboardConfig)).toThrow();
  });
});

describe('Monitoring (Legacy)', () => {
  it('records a metric', () => {
    monitoring.recordMetric('test_metric', 42);
    const metrics = monitoring.getMetrics();
    expect(metrics.count).toBeGreaterThan(0);
  });
});
