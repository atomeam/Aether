/**
 * @aether/observability - Zod Schemas
 * 
 * Validation schemas for all observability data structures.
 */

import { z } from 'zod';

// ============================================================================
// Metrics Schemas
// ============================================================================

export const MetricTypeSchema = z.enum(['counter', 'gauge', 'histogram', 'summary']);

export const MetricLabelSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.string().max(500),
});

export const MetricBaseSchema = z.object({
  name: z.string().min(1).max(200),
  type: MetricTypeSchema,
  value: z.number(),
  labels: z.array(MetricLabelSchema).optional(),
  timestamp: z.number().optional(),
});

export const CounterSchema = MetricBaseSchema.extend({
  type: z.literal('counter'),
});

export const GaugeSchema = MetricBaseSchema.extend({
  type: z.literal('gauge'),
});

export const HistogramBucketSchema = z.object({
  upperBound: z.number(),
  count: z.number().int().min(0),
});

export const HistogramSchema = MetricBaseSchema.extend({
  type: z.literal('histogram'),
  buckets: z.array(HistogramBucketSchema),
  sum: z.number(),
  count: z.number().int().min(0),
});

export const SummaryQuantileSchema = z.object({
  quantile: z.number().min(0).max(1),
  value: z.number(),
});

export const SummarySchema = MetricBaseSchema.extend({
  type: z.literal('summary'),
  quantiles: z.array(SummaryQuantileSchema),
  sum: z.number(),
  count: z.number().int().min(0),
});

export const MetricSchema = z.discriminatedUnion('type', [
  CounterSchema,
  GaugeSchema,
  HistogramSchema,
  SummarySchema,
]);

// ============================================================================
// Tracing Schemas
// ============================================================================

export const SpanStatusSchema = z.enum(['ok', 'error', 'cancelled']);

export const SpanLogSchema = z.object({
  timestamp: z.number(),
  fields: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

export const TraceSpanSchema = z.object({
  traceId: z.string().min(1).max(64),
  spanId: z.string().min(1).max(64),
  parentSpanId: z.string().max(64).optional(),
  operationName: z.string().min(1).max(500),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number().min(0),
  tags: z.record(z.union([z.string(), z.number(), z.boolean()])),
  logs: z.array(SpanLogSchema),
  status: SpanStatusSchema,
  service: z.string().min(1).max(200),
});

export const TraceContextSchema = z.object({
  traceId: z.string().min(1).max(64),
  spanId: z.string().min(1).max(64),
  baggage: z.record(z.string()).optional(),
});

export const TraceSchema = z.object({
  traceId: z.string().min(1).max(64),
  spans: z.array(TraceSpanSchema),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number().min(0),
  service: z.string().min(1).max(200),
  tags: z.record(z.string()),
});

// ============================================================================
// Logging Schemas
// ============================================================================

export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'fatal']);

export const LogEntrySchema = z.object({
  timestamp: z.number(),
  level: LogLevelSchema,
  message: z.string().min(1).max(10000),
  context: z.record(z.any()).optional(),
  traceId: z.string().max(64).optional(),
  spanId: z.string().max(64).optional(),
  service: z.string().max(200).optional(),
  source: z.string().max(200).optional(),
});

export const LogFilterSchema = z.object({
  level: LogLevelSchema.optional(),
  service: z.string().max(200).optional(),
  traceId: z.string().max(64).optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  messagePattern: z.string().max(500).optional(),
});

// ============================================================================
// Alert Schemas
// ============================================================================

export const AlertSeveritySchema = z.enum(['info', 'warning', 'critical']);

export const AlertConditionTypeSchema = z.enum(['threshold', 'rate', 'anomaly', 'pattern']);

export const AlertConditionSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  type: AlertConditionTypeSchema,
  metric: z.string().min(1).max(200),
  threshold: z.number().optional(),
  operator: z.enum(['>', '<', '>=', '<=', '==', '!=']).optional(),
  window: z.number().int().positive().optional(),
  evaluationInterval: z.number().int().positive(),
});

export const AlertSchema = z.object({
  id: z.string().min(1).max(100),
  conditionId: z.string().min(1).max(100),
  severity: AlertSeveritySchema,
  status: z.enum(['firing', 'resolved', 'acknowledged']),
  message: z.string().min(1).max(1000),
  value: z.number(),
  timestamp: z.number(),
  labels: z.record(z.string()),
  annotations: z.record(z.string()).optional(),
});

export const AlertRuleSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  conditions: z.array(AlertConditionSchema),
  severity: AlertSeveritySchema,
  enabled: z.boolean(),
  notificationChannels: z.array(z.string()),
});

// ============================================================================
// Dashboard Schemas
// ============================================================================

export const DashboardWidgetTypeSchema = z.enum(['graph', 'stat', 'table', 'heatmap', 'gauge']);

export const DashboardQuerySchema = z.object({
  metric: z.string().min(1).max(200),
  labels: z.record(z.string()).optional(),
  aggregation: z.enum(['sum', 'avg', 'min', 'max', 'count']).optional(),
  groupBy: z.array(z.string()).optional(),
});

export const WidgetLayoutSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

export const DashboardWidgetSchema = z.object({
  id: z.string().min(1).max(100),
  type: DashboardWidgetTypeSchema,
  title: z.string().min(1).max(200),
  queries: z.array(DashboardQuerySchema).min(1),
  layout: WidgetLayoutSchema,
  options: z.record(z.any()).optional(),
});

export const DashboardSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  widgets: z.array(DashboardWidgetSchema),
  refreshInterval: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// Configuration Schemas
// ============================================================================

export const ObservabilityConfigSchema = z.object({
  metrics: z.object({
    enabled: z.boolean(),
    prometheusPort: z.number().int().positive().optional(),
    prometheusPath: z.string().optional(),
  }).optional(),
  tracing: z.object({
    enabled: z.boolean(),
    sampleRate: z.number().min(0).max(1).optional(),
    exporter: z.enum(['jaeger', 'zipkin', 'console']).optional(),
    exporterEndpoint: z.string().url().optional(),
  }).optional(),
  logging: z.object({
    enabled: z.boolean(),
    level: LogLevelSchema,
    maxEntries: z.number().int().positive().optional(),
  }).optional(),
  alerts: z.object({
    enabled: z.boolean(),
    evaluationInterval: z.number().int().positive().optional(),
  }).optional(),
  dashboards: z.object({
    enabled: z.boolean(),
  }).optional(),
});

// ============================================================================
// Parse Functions
// ============================================================================

export function parseMetric(data: unknown): z.infer<typeof MetricSchema> {
  return MetricSchema.parse(data);
}

export function safeParseMetric(data: unknown) {
  return MetricSchema.safeParse(data);
}

export function parseTraceSpan(data: unknown): z.infer<typeof TraceSpanSchema> {
  return TraceSpanSchema.parse(data);
}

export function safeParseTraceSpan(data: unknown) {
  return TraceSpanSchema.safeParse(data);
}

export function parseLogEntry(data: unknown): z.infer<typeof LogEntrySchema> {
  return LogEntrySchema.parse(data);
}

export function safeParseLogEntry(data: unknown) {
  return LogEntrySchema.safeParse(data);
}

export function parseAlert(data: unknown): z.infer<typeof AlertSchema> {
  return AlertSchema.parse(data);
}

export function safeParseAlert(data: unknown) {
  return AlertSchema.safeParse(data);
}

export function parseDashboard(data: unknown): z.infer<typeof DashboardSchema> {
  return DashboardSchema.parse(data);
}

export function safeParseDashboard(data: unknown) {
  return DashboardSchema.safeParse(data);
}

export function parseConfig(data: unknown): z.infer<typeof ObservabilityConfigSchema> {
  return ObservabilityConfigSchema.parse(data);
}

export function safeParseConfig(data: unknown) {
  return ObservabilityConfigSchema.safeParse(data);
}
