/**
 * @aether/observability - TypeScript Types
 * 
 * Core type definitions for observability features including
 * metrics, tracing, logging, alerts, and dashboard integration.
 */

// ============================================================================
// Metrics Types (Prometheus-compatible)
// ============================================================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricLabel {
  name: string;
  value: string;
}

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: MetricLabel[];
  timestamp?: number;
}

export interface Counter extends Metric {
  type: 'counter';
}

export interface Gauge extends Metric {
  type: 'gauge';
}

export interface HistogramBucket {
  upperBound: number;
  count: number;
}

export interface Histogram extends Metric {
  type: 'histogram';
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

export interface SummaryQuantile {
  quantile: number;
  value: number;
}

export interface Summary extends Metric {
  type: 'summary';
  quantiles: SummaryQuantile[];
  sum: number;
  count: number;
}

export interface MetricRegistry {
  register(metric: Metric): void;
  unregister(name: string): void;
  get(name: string): Metric | undefined;
  getAll(): Metric[];
  clear(): void;
}

// ============================================================================
// Distributed Tracing Types
// ============================================================================

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  tags: Record<string, string | number | boolean>;
  logs: SpanLog[];
  status: SpanStatus;
  service: string;
}

export interface SpanLog {
  timestamp: number;
  fields: Record<string, string | number | boolean>;
}

export type SpanStatus = 'ok' | 'error' | 'cancelled';

export interface TraceContext {
  traceId: string;
  spanId: string;
  baggage?: Record<string, string>;
}

export interface Trace {
  traceId: string;
  spans: TraceSpan[];
  startTime: number;
  endTime: number;
  duration: number;
  service: string;
  tags: Record<string, string>;
}

export interface Tracer {
  startSpan(operationName: string, parentContext?: TraceContext): TraceSpan;
  inject(context: TraceContext, carrier: any): void;
  extract(carrier: any): TraceContext | null;
  finishSpan(span: TraceSpan): void;
}

// ============================================================================
// Log Aggregation Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  service?: string;
  source?: string;
}

export interface LogFilter {
  level?: LogLevel;
  service?: string;
  traceId?: string;
  startTime?: number;
  endTime?: number;
  messagePattern?: string;
}

export interface LogAggregator {
  log(entry: LogEntry): void;
  query(filter: LogFilter): LogEntry[];
  clear(): void;
}

// ============================================================================
// Alert Management Types
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertConditionType = 'threshold' | 'rate' | 'anomaly' | 'pattern';

export interface AlertCondition {
  id: string;
  name: string;
  type: AlertConditionType;
  metric: string;
  threshold?: number;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  window?: number; // time window in milliseconds
  evaluationInterval: number;
}

export interface Alert {
  id: string;
  conditionId: string;
  severity: AlertSeverity;
  status: 'firing' | 'resolved' | 'acknowledged';
  message: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  conditions: AlertCondition[];
  severity: AlertSeverity;
  enabled: boolean;
  notificationChannels: string[];
}

export interface AlertManager {
  addRule(rule: AlertRule): void;
  removeRule(ruleId: string): void;
  evaluateRules(): Alert[];
  acknowledgeAlert(alertId: string): void;
  resolveAlert(alertId: string): void;
}

// ============================================================================
// Dashboard Integration Types
// ============================================================================

export type DashboardWidgetType = 'graph' | 'stat' | 'table' | 'heatmap' | 'gauge';

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  queries: DashboardQuery[];
  layout: WidgetLayout;
  options?: Record<string, any>;
}

export interface DashboardQuery {
  metric: string;
  labels?: Record<string, string>;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'rate';
  groupBy?: string[];
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  refreshInterval?: number;
  tags?: string[];
}

export interface DashboardIntegration {
  createDashboard(dashboard: Dashboard): Dashboard;
  updateDashboard(id: string, dashboard: Partial<Dashboard>): Dashboard;
  deleteDashboard(id: string): void;
  getDashboard(id: string): Dashboard | null;
  listDashboards(): Dashboard[];
  exportDashboard(id: string): string;
  importDashboard(data: string): Dashboard;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ObservabilityConfig {
  metrics?: {
    enabled: boolean;
    prometheusPort?: number;
    prometheusPath?: string;
  };
  tracing?: {
    enabled: boolean;
    sampleRate?: number;
    exporter?: 'jaeger' | 'zipkin' | 'console';
    exporterEndpoint?: string;
  };
  logging?: {
    enabled: boolean;
    level: LogLevel;
    maxEntries?: number;
  };
  alerts?: {
    enabled: boolean;
    evaluationInterval?: number;
  };
  dashboards?: {
    enabled: boolean;
  };
}
