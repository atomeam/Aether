/**
 * Comprehensive tests for @aether/observability
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Metrics
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  SummaryMetric,
  PrometheusMetricRegistry,
  formatPrometheusMetrics,
  createCounter,
  createGauge,
  createHistogram,
  createSummary,
  exportPrometheusMetrics,
  // Tracing
  Span,
  DistributedTracer,
  startSpan,
  traceAsync,
  traceSync,
  // Logging
  Logger,
  InMemoryLogAggregator,
  logInfo,
  logError,
  queryLogs,
  clearLogs,
  exportLogsAsJSON,
  exportLogsAsText,
  // Alerts
  DefaultAlertManager,
  addAlertRule,
  evaluateAlerts,
  getActiveAlerts,
  AlertRuleBuilder,
  AlertConditionBuilder,
  // Dashboard
  DefaultDashboardIntegration,
  createDashboard,
  getDashboard,
  listDashboards,
  DashboardBuilder,
  DashboardWidgetBuilder,
  DashboardQueryBuilder,
  // Schemas
  parseMetric,
  safeParseMetric,
  parseLogEntry,
  safeParseLogEntry,
  parseAlert,
  safeParseAlert,
  parseDashboard,
  safeParseDashboard,
} from './index';

describe('@aether/observability', () => {
  beforeEach(() => {
    // Clear global state before each test
    clearLogs();
  });

  // ============================================================================
  // Metrics Tests
  // ============================================================================

  describe('Metrics', () => {
    describe('CounterMetric', () => {
      it('should create a counter with initial value 0', () => {
        const counter = new CounterMetric('test_counter');
        expect(counter.value).toBe(0);
        expect(counter.type).toBe('counter');
      });

      it('should increment counter by default amount', () => {
        const counter = new CounterMetric('test_counter');
        counter.increment();
        expect(counter.value).toBe(1);
      });

      it('should increment counter by custom amount', () => {
        const counter = new CounterMetric('test_counter');
        counter.increment(5);
        expect(counter.value).toBe(5);
      });

      it('should throw error when incrementing by negative value', () => {
        const counter = new CounterMetric('test_counter');
        expect(() => counter.increment(-1)).toThrow();
      });

      it('should reset counter to 0', () => {
        const counter = new CounterMetric('test_counter');
        counter.increment(10);
        counter.reset();
        expect(counter.value).toBe(0);
      });
    });

    describe('GaugeMetric', () => {
      it('should create a gauge with initial value 0', () => {
        const gauge = new GaugeMetric('test_gauge');
        expect(gauge.value).toBe(0);
        expect(gauge.type).toBe('gauge');
      });

      it('should set gauge value', () => {
        const gauge = new GaugeMetric('test_gauge');
        gauge.set(42);
        expect(gauge.value).toBe(42);
      });

      it('should increment gauge', () => {
        const gauge = new GaugeMetric('test_gauge');
        gauge.set(10);
        gauge.increment(5);
        expect(gauge.value).toBe(15);
      });

      it('should decrement gauge', () => {
        const gauge = new GaugeMetric('test_gauge');
        gauge.set(10);
        gauge.decrement(3);
        expect(gauge.value).toBe(7);
      });
    });

    describe('HistogramMetric', () => {
      it('should create a histogram with default buckets', () => {
        const histogram = new HistogramMetric('test_histogram');
        expect(histogram.type).toBe('histogram');
        expect(histogram.buckets.length).toBeGreaterThan(0);
      });

      it('should observe values and update buckets', () => {
        const histogram = new HistogramMetric('test_histogram');
        histogram.observe(0.05);
        expect(histogram.count).toBe(1);
        expect(histogram.sum).toBe(0.05);
      });

      it('should throw error when observing negative value', () => {
        const histogram = new HistogramMetric('test_histogram');
        expect(() => histogram.observe(-1)).toThrow();
      });

      it('should reset histogram', () => {
        const histogram = new HistogramMetric('test_histogram');
        histogram.observe(1);
        histogram.observe(2);
        histogram.reset();
        expect(histogram.count).toBe(0);
        expect(histogram.sum).toBe(0);
      });
    });

    describe('SummaryMetric', () => {
      it('should create a summary with default quantiles', () => {
        const summary = new SummaryMetric('test_summary');
        expect(summary.type).toBe('summary');
        expect(summary.quantiles.length).toBeGreaterThan(0);
      });

      it('should observe values and calculate quantiles', () => {
        const summary = new SummaryMetric('test_summary');
        summary.observe(1);
        summary.observe(2);
        summary.observe(3);
        expect(summary.count).toBe(3);
        expect(summary.sum).toBe(6);
      });

      it('should throw error when observing negative value', () => {
        const summary = new SummaryMetric('test_summary');
        expect(() => summary.observe(-1)).toThrow();
      });
    });

    describe('PrometheusMetricRegistry', () => {
      it('should register and retrieve metrics', () => {
        const registry = new PrometheusMetricRegistry();
        const counter = registry.createCounter('test_counter');
        counter.increment();
        const metric = registry.get('test_counter');
        expect(metric).toBeDefined();
        expect(metric?.value).toBe(1);
      });

      it('should throw error when registering duplicate metric', () => {
        const registry = new PrometheusMetricRegistry();
        registry.createCounter('test_counter');
        expect(() => registry.createCounter('test_counter')).toThrow();
      });

      it('should unregister metrics', () => {
        const registry = new PrometheusMetricRegistry();
        registry.createCounter('test_counter');
        registry.unregister('test_counter');
        expect(registry.get('test_counter')).toBeUndefined();
      });

      it('should get all metrics', () => {
        const registry = new PrometheusMetricRegistry();
        registry.createCounter('counter1');
        registry.createGauge('gauge1');
        const metrics = registry.getAll();
        expect(metrics.length).toBe(2);
      });
    });

    describe('formatPrometheusMetrics', () => {
      it('should format counter in Prometheus format', () => {
        const registry = new PrometheusMetricRegistry();
        const counter = registry.createCounter('test_counter');
        counter.increment(5);
        const formatted = formatPrometheusMetrics(registry.getAll());
        expect(formatted).toContain('# TYPE test_counter counter');
        expect(formatted).toContain('test_counter 5');
      });

      it('should format gauge in Prometheus format', () => {
        const registry = new PrometheusMetricRegistry();
        const gauge = registry.createGauge('test_gauge');
        gauge.set(42);
        const formatted = formatPrometheusMetrics(registry.getAll());
        expect(formatted).toContain('# TYPE test_gauge gauge');
        expect(formatted).toContain('test_gauge 42');
      });
    });
  });

  // ============================================================================
  // Tracing Tests
  // ============================================================================

  describe('Tracing', () => {
    describe('Span', () => {
      it('should create a span with unique IDs', () => {
        const span = new Span('test_operation', 'test-service');
        expect(span.spanId).toBeDefined();
        expect(span.traceId).toBeDefined();
        expect(span.operationName).toBe('test_operation');
      });

      it('should set tags', () => {
        const span = new Span('test_operation', 'test-service');
        span.setTag('key', 'value');
        expect(span.tags['key']).toBe('value');
      });

      it('should add logs', () => {
        const span = new Span('test_operation', 'test-service');
        span.log({ event: 'test' });
        expect(span.logs.length).toBe(1);
      });

      it('should set status', () => {
        const span = new Span('test_operation', 'test-service');
        span.setStatus('error');
        expect(span.status).toBe('error');
      });

      it('should calculate duration on finish', () => {
        const span = new Span('test_operation', 'test-service');
        span.finish();
        expect(span.duration).toBeGreaterThanOrEqual(0);
      });
    });

    describe('DistributedTracer', () => {
      it('should start a new span', () => {
        const tracer = new DistributedTracer('test-service');
        const span = tracer.startSpan('test_operation');
        expect(span.operationName).toBe('test_operation');
      });

      it('should create child spans with parent context', () => {
        const tracer = new DistributedTracer('test-service');
        const parent = tracer.startSpan('parent') as Span;
        const child = tracer.startSpan('child', parent.getContext());
        expect(child.parentSpanId).toBe(parent.spanId);
        expect(child.traceId).toBe(parent.traceId);
      });

      it('should inject and extract context', () => {
        const tracer = new DistributedTracer('test-service');
        const span = tracer.startSpan('test') as Span;
        const context = span.getContext();
        const carrier: any = {};
        tracer.inject(context, carrier);
        const extracted = tracer.extract(carrier);
        expect(extracted?.traceId).toBe(context.traceId);
        expect(extracted?.spanId).toBe(context.spanId);
      });

      it('should trace async operations', async () => {
        const tracer = new DistributedTracer('test-service');
        const result = await tracer.traceAsync('async_op', async (span) => {
          span.setTag('test', 'value');
          return 42;
        });
        expect(result).toBe(42);
      });

      it('should trace sync operations', () => {
        const tracer = new DistributedTracer('test-service');
        const result = tracer.traceSync('sync_op', (span) => {
          span.setTag('test', 'value');
          return 42;
        });
        expect(result).toBe(42);
      });
    });
  });

  // ============================================================================
  // Logging Tests
  // ============================================================================

  describe('Logging', () => {
    describe('Logger', () => {
      it('should create log entries', () => {
        const aggregator = new InMemoryLogAggregator();
        const logger = new Logger('test-service', aggregator);
        logger.info('Test message');
        const logs = aggregator.getAll();
        expect(logs.length).toBe(1);
        expect(logs[0].message).toBe('Test message');
      });

      it('should respect minimum log level', () => {
        const aggregator = new InMemoryLogAggregator();
        const logger = new Logger('test-service', aggregator, 'warn');
        logger.debug('Debug message');
        logger.info('Info message');
        logger.warn('Warn message');
        const logs = aggregator.getAll();
        expect(logs.length).toBe(1);
        expect(logs[0].level).toBe('warn');
      });

      it('should include context in log entries', () => {
        const aggregator = new InMemoryLogAggregator();
        const logger = new Logger('test-service', aggregator);
        logger.info('Test message', { key: 'value' });
        const logs = aggregator.getAll();
        expect(logs[0].context).toEqual({ key: 'value' });
      });
    });

    describe('InMemoryLogAggregator', () => {
      it('should query logs by level', () => {
        const aggregator = new InMemoryLogAggregator();
        aggregator.log({ timestamp: Date.now(), level: 'info', message: 'info' });
        aggregator.log({ timestamp: Date.now(), level: 'error', message: 'error' });
        const errorLogs = aggregator.query({ level: 'error' });
        expect(errorLogs.length).toBe(1);
        expect(errorLogs[0].level).toBe('error');
      });

      it('should query logs by service', () => {
        const aggregator = new InMemoryLogAggregator();
        aggregator.log({ timestamp: Date.now(), level: 'info', message: 'test', service: 'service1' });
        aggregator.log({ timestamp: Date.now(), level: 'info', message: 'test', service: 'service2' });
        const service1Logs = aggregator.query({ service: 'service1' });
        expect(service1Logs.length).toBe(1);
      });

      it('should enforce max entries limit', () => {
        const aggregator = new InMemoryLogAggregator(3);
        for (let i = 0; i < 5; i++) {
          aggregator.log({ timestamp: Date.now(), level: 'info', message: `test${i}` });
        }
        expect(aggregator.getCount()).toBe(3);
      });
    });

    describe('Log Export', () => {
      it('should export logs as JSON', () => {
        const aggregator = new InMemoryLogAggregator();
        aggregator.log({ timestamp: Date.now(), level: 'info', message: 'test' });
        const exported = exportLogsAsJSON(aggregator.getAll());
        const parsed = JSON.parse(exported);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(1);
      });

      it('should export logs as text', () => {
        const aggregator = new InMemoryLogAggregator();
        aggregator.log({ timestamp: Date.now(), level: 'info', message: 'test', service: 'test' });
        const exported = exportLogsAsText(aggregator.getAll());
        expect(exported).toContain('INFO');
        expect(exported).toContain('test');
      });
    });
  });

  // ============================================================================
  // Alerts Tests
  // ============================================================================

  describe('Alerts', () => {
    describe('DefaultAlertManager', () => {
      it('should add and retrieve alert rules', () => {
        const manager = new DefaultAlertManager();
        const rule = new AlertRuleBuilder()
          .withId('test-rule')
          .withName('Test Rule')
          .withSeverity('warning')
          .withCondition(
            new AlertConditionBuilder()
              .withId('test-condition')
              .withName('Test Condition')
              .withType('threshold')
              .withMetric('test_metric')
              .withThreshold(10, '>')
              .withEvaluationInterval(60000)
              .build(),
          )
          .build();
        manager.addRule(rule);
        const retrieved = manager.getRule('test-rule');
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Test Rule');
      });

      it('should remove alert rules', () => {
        const manager = new DefaultAlertManager();
        const rule = new AlertRuleBuilder()
          .withId('test-rule')
          .withName('Test Rule')
          .withSeverity('warning')
          .withCondition(
            new AlertConditionBuilder()
              .withId('test-condition')
              .withName('Test Condition')
              .withType('threshold')
              .withMetric('test_metric')
              .withThreshold(10, '>')
              .withEvaluationInterval(60000)
              .build(),
          )
          .build();
        manager.addRule(rule);
        manager.removeRule('test-rule');
        expect(manager.getRule('test-rule')).toBeUndefined();
      });

      it('should acknowledge alerts', () => {
        const manager = new DefaultAlertManager();
        const alert = {
          id: 'test-alert',
          conditionId: 'test-condition',
          severity: 'warning' as const,
          status: 'firing' as const,
          message: 'Test alert',
          value: 15,
          timestamp: Date.now(),
          labels: {},
        };
        manager['activeAlerts'].set('test-alert', alert);
        manager.acknowledgeAlert('test-alert');
        const updated = manager['activeAlerts'].get('test-alert');
        expect(updated?.status).toBe('acknowledged');
      });

      it('should resolve alerts', () => {
        const manager = new DefaultAlertManager();
        const alert = {
          id: 'test-alert',
          conditionId: 'test-condition',
          severity: 'warning' as const,
          status: 'firing' as const,
          message: 'Test alert',
          value: 15,
          timestamp: Date.now(),
          labels: {},
        };
        manager['activeAlerts'].set('test-alert', alert);
        manager.resolveAlert('test-alert');
        expect(manager['activeAlerts'].has('test-alert')).toBe(false);
      });
    });

    describe('AlertRuleBuilder', () => {
      it('should build valid alert rule', () => {
        const rule = new AlertRuleBuilder()
          .withId('test-rule')
          .withName('Test Rule')
          .withSeverity('critical')
          .withCondition(
            new AlertConditionBuilder()
              .withId('test-condition')
              .withName('Test Condition')
              .withType('threshold')
              .withMetric('test_metric')
              .withThreshold(100, '>')
              .withEvaluationInterval(60000)
              .build(),
          )
          .build();
        expect(rule.id).toBe('test-rule');
        expect(rule.name).toBe('Test Rule');
        expect(rule.severity).toBe('critical');
        expect(rule.conditions.length).toBe(1);
      });

      it('should throw error when building incomplete rule', () => {
        expect(() => new AlertRuleBuilder().build()).toThrow();
      });
    });

    describe('AlertConditionBuilder', () => {
      it('should build valid alert condition', () => {
        const condition = new AlertConditionBuilder()
          .withId('test-condition')
          .withName('Test Condition')
          .withType('threshold')
          .withMetric('test_metric')
          .withThreshold(50, '<')
          .withEvaluationInterval(30000)
          .build();
        expect(condition.id).toBe('test-condition');
        expect(condition.type).toBe('threshold');
        expect(condition.metric).toBe('test_metric');
        expect(condition.threshold).toBe(50);
      });
    });
  });

  // ============================================================================
  // Dashboard Tests
  // ============================================================================

  describe('Dashboard', () => {
    describe('DefaultDashboardIntegration', () => {
      it('should create and retrieve dashboards', () => {
        const integration = new DefaultDashboardIntegration();
        const dashboard = new DashboardBuilder()
          .withId('test-dashboard')
          .withName('Test Dashboard')
          .build();
        integration.createDashboard(dashboard);
        const retrieved = integration.getDashboard('test-dashboard');
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Test Dashboard');
      });

      it('should update dashboards', () => {
        const integration = new DefaultDashboardIntegration();
        const dashboard = new DashboardBuilder()
          .withId('test-dashboard')
          .withName('Test Dashboard')
          .build();
        integration.createDashboard(dashboard);
        const updated = integration.updateDashboard('test-dashboard', { name: 'Updated Name' });
        expect(updated.name).toBe('Updated Name');
      });

      it('should delete dashboards', () => {
        const integration = new DefaultDashboardIntegration();
        const dashboard = new DashboardBuilder()
          .withId('test-dashboard')
          .withName('Test Dashboard')
          .build();
        integration.createDashboard(dashboard);
        integration.deleteDashboard('test-dashboard');
        expect(integration.getDashboard('test-dashboard')).toBeNull();
      });

      it('should list all dashboards', () => {
        const integration = new DefaultDashboardIntegration();
        integration.createDashboard(
          new DashboardBuilder().withId('dash1').withName('Dashboard 1').build(),
        );
        integration.createDashboard(
          new DashboardBuilder().withId('dash2').withName('Dashboard 2').build(),
        );
        const dashboards = integration.listDashboards();
        expect(dashboards.length).toBe(2);
      });

      it('should export and import dashboards', () => {
        const integration = new DefaultDashboardIntegration();
        const dashboard = new DashboardBuilder()
          .withId('test-dashboard')
          .withName('Test Dashboard')
          .build();
        integration.createDashboard(dashboard);
        const exported = integration.exportDashboard('test-dashboard');
        integration.deleteDashboard('test-dashboard');
        const imported = integration.importDashboard(exported);
        expect(imported.id).toBe('test-dashboard');
        expect(imported.name).toBe('Test Dashboard');
      });
    });

    describe('DashboardBuilder', () => {
      it('should build valid dashboard', () => {
        const dashboard = new DashboardBuilder()
          .withId('test-dashboard')
          .withName('Test Dashboard')
          .withDescription('Test description')
          .withRefreshInterval(5000)
          .withTag('test')
          .build();
        expect(dashboard.id).toBe('test-dashboard');
        expect(dashboard.name).toBe('Test Dashboard');
        expect(dashboard.description).toBe('Test description');
        expect(dashboard.refreshInterval).toBe(5000);
        expect(dashboard.tags).toContain('test');
      });
    });

    describe('DashboardWidgetBuilder', () => {
      it('should build valid widget', () => {
        const widget = new DashboardWidgetBuilder()
          .withId('test-widget')
          .withType('graph')
          .withTitle('Test Widget')
          .withQuery(new DashboardQueryBuilder().withMetric('test_metric').build())
          .withLayout(0, 0, 6, 4)
          .build();
        expect(widget.id).toBe('test-widget');
        expect(widget.type).toBe('graph');
        expect(widget.title).toBe('Test Widget');
        expect(widget.queries.length).toBe(1);
      });
    });

    describe('DashboardQueryBuilder', () => {
      it('should build valid query', () => {
        const query = new DashboardQueryBuilder()
          .withMetric('test_metric')
          .withLabel('env', 'prod')
          .withAggregation('sum')
          .withGroupBy('instance')
          .build();
        expect(query.metric).toBe('test_metric');
        expect(query.labels).toEqual({ env: 'prod' });
        expect(query.aggregation).toBe('sum');
        expect(query.groupBy).toContain('instance');
      });
    });
  });

  // ============================================================================
  // Schema Validation Tests
  // ============================================================================

  describe('Schema Validation', () => {
    describe('Metric Schema', () => {
      it('should validate valid counter', () => {
        const valid = {
          name: 'test_counter',
          type: 'counter' as const,
          value: 10,
        };
        const result = safeParseMetric(valid);
        expect(result.success).toBe(true);
      });

      it('should reject invalid metric type', () => {
        const invalid = {
          name: 'test_metric',
          type: 'invalid' as const,
          value: 10,
        };
        const result = safeParseMetric(invalid);
        expect(result.success).toBe(false);
      });
    });

    describe('LogEntry Schema', () => {
      it('should validate valid log entry', () => {
        const valid = {
          timestamp: Date.now(),
          level: 'info' as const,
          message: 'Test message',
        };
        const result = safeParseLogEntry(valid);
        expect(result.success).toBe(true);
      });

      it('should reject invalid log level', () => {
        const invalid = {
          timestamp: Date.now(),
          level: 'invalid' as const,
          message: 'Test message',
        };
        const result = safeParseLogEntry(invalid);
        expect(result.success).toBe(false);
      });
    });

    describe('Alert Schema', () => {
      it('should validate valid alert', () => {
        const valid = {
          id: 'test-alert',
          conditionId: 'test-condition',
          severity: 'warning' as const,
          status: 'firing' as const,
          message: 'Test alert',
          value: 15,
          timestamp: Date.now(),
          labels: {},
        };
        const result = safeParseAlert(valid);
        expect(result.success).toBe(true);
      });
    });

    describe('Dashboard Schema', () => {
      it('should validate valid dashboard', () => {
        const valid = {
          id: 'test-dashboard',
          name: 'Test Dashboard',
          widgets: [
            {
              id: 'test-widget',
              type: 'graph' as const,
              title: 'Test Widget',
              queries: [{ metric: 'test_metric' }],
              layout: { x: 0, y: 0, w: 6, h: 4 },
            },
          ],
        };
        const result = safeParseDashboard(valid);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration', () => {
    it('should integrate metrics and alerts', () => {
      const counter = createCounter('test_metric');
      counter.increment(15);

      const condition = new AlertConditionBuilder()
        .withId('test-condition')
        .withName('Test Condition')
        .withType('threshold')
        .withMetric('test_metric')
        .withThreshold(10, '>')
        .withEvaluationInterval(60000)
        .build();

      const rule = new AlertRuleBuilder()
        .withId('test-rule')
        .withName('Test Rule')
        .withSeverity('warning')
        .withCondition(condition)
        .build();

      addAlertRule(rule);
      const alerts = evaluateAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should integrate tracing and logging', () => {
      const span = startSpan('test_operation') as Span;
      logInfo('Operation started', { spanId: span.spanId });
      span.finish();
      logInfo('Operation completed', { spanId: span.spanId });

      const logs = queryLogs({});
      expect(logs.length).toBe(2);
    });
  });
});
