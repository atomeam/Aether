/**
 * @aether/observability - Comprehensive Observability Package
 * 
 * A complete observability solution providing:
 * - Metrics collection (Prometheus-compatible)
 * - Distributed tracing
 * - Log aggregation
 * - Alert management
 * - Dashboard integration
 * 
 * @example
 * ```typescript
 * import { createCounter, startSpan, logInfo, addAlertRule, createDashboard } from '@aether/observability';
 * 
 * // Create metrics
 * const requestCounter = createCounter('http_requests_total');
 * requestCounter.increment();
 * 
 * // Create traces
 * const span = startSpan('http_request');
 * span.setTag('method', 'GET');
 * span.finish();
 * 
 * // Log events
 * logInfo('Request processed', { status: 200 });
 * 
 * // Export metrics in Prometheus format
 * const prometheusMetrics = exportPrometheusMetrics();
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export * from './types';

// ============================================================================
// Schemas
// ============================================================================

export * from './schemas';

// ============================================================================
// Metrics
// ============================================================================

export {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  SummaryMetric,
  PrometheusMetricRegistry,
  formatPrometheusMetrics,
  globalMetricRegistry,
  createCounter,
  createGauge,
  createHistogram,
  createSummary,
  getMetric,
  getAllMetrics,
  exportPrometheusMetrics,
} from './metrics';

// ============================================================================
// Tracing
// ============================================================================

export {
  Span,
  DistributedTracer,
  AsyncContext,
  globalTracer,
  startSpan,
  injectContext,
  extractContext,
  finishSpan,
  getTrace,
  getAllTraces,
  traceAsync,
  traceSync,
} from './tracing';

// ============================================================================
// Logging
// ============================================================================

export {
  Logger,
  InMemoryLogAggregator,
  globalLogAggregator,
  globalLogger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logFatal,
  queryLogs,
  getAllLogs,
  clearLogs,
  createLogger,
  withTraceContext,
  exportLogsAsJSON,
  exportLogsAsText,
  exportLogsAsCSV,
} from './logging';

// ============================================================================
// Alerts
// ============================================================================

export {
  ConditionEvaluator,
  DefaultAlertManager,
  globalAlertManager,
  addAlertRule,
  removeAlertRule,
  getAlertRule,
  getAllAlertRules,
  evaluateAlerts,
  acknowledgeAlert,
  resolveAlert,
  getActiveAlerts,
  getAlertHistory,
  registerNotificationChannel,
  unregisterNotificationChannel,
  AlertRuleBuilder,
  AlertConditionBuilder,
  createHighErrorRateAlert,
  createHighLatencyAlert,
  createLowMemoryAlert,
} from './alerts';

// ============================================================================
// Dashboard
// ============================================================================

export {
  DefaultDashboardIntegration,
  globalDashboardIntegration,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getDashboard,
  listDashboards,
  exportDashboard,
  importDashboard,
  addWidget,
  updateWidget,
  removeWidget,
  queryWidgetData,
  queryDashboardData,
  DashboardBuilder,
  DashboardWidgetBuilder,
  DashboardQueryBuilder,
  createSystemOverviewDashboard,
  createApplicationPerformanceDashboard,
  createBusinessMetricsDashboard,
} from './dashboard';
