/**
 * @aether/observability - Metrics Collection
 * 
 * Prometheus-compatible metrics collection system supporting
 * counters, gauges, histograms, and summaries.
 */

import type {
  Counter,
  Gauge,
  Histogram,
  Summary,
  Metric,
  MetricLabel,
  HistogramBucket,
  SummaryQuantile,
  MetricRegistry,
} from './types';

// ============================================================================
// Counter Implementation
// ============================================================================

export class CounterMetric implements Counter {
  type: 'counter' = 'counter';
  name: string;
  value: number;
  labels?: MetricLabel[];
  timestamp?: number;

  constructor(name: string, labels?: MetricLabel[]) {
    this.name = name;
    this.value = 0;
    this.labels = labels;
    this.timestamp = Date.now();
  }

  increment(amount: number = 1): void {
    if (amount < 0) {
      throw new Error('Counter can only be incremented by positive values');
    }
    this.value += amount;
    this.timestamp = Date.now();
  }

  reset(): void {
    this.value = 0;
    this.timestamp = Date.now();
  }

  toMetric(): Counter {
    return {
      type: this.type,
      name: this.name,
      value: this.value,
      labels: this.labels,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// Gauge Implementation
// ============================================================================

export class GaugeMetric implements Gauge {
  type: 'gauge' = 'gauge';
  name: string;
  value: number;
  labels?: MetricLabel[];
  timestamp?: number;

  constructor(name: string, labels?: MetricLabel[]) {
    this.name = name;
    this.value = 0;
    this.labels = labels;
    this.timestamp = Date.now();
  }

  set(value: number): void {
    this.value = value;
    this.timestamp = Date.now();
  }

  increment(amount: number = 1): void {
    this.value += amount;
    this.timestamp = Date.now();
  }

  decrement(amount: number = 1): void {
    this.value -= amount;
    this.timestamp = Date.now();
  }

  toMetric(): Gauge {
    return {
      type: this.type,
      name: this.name,
      value: this.value,
      labels: this.labels,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// Histogram Implementation
// ============================================================================

const DEFAULT_HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export class HistogramMetric implements Histogram {
  type: 'histogram' = 'histogram';
  name: string;
  value: number;
  labels?: MetricLabel[];
  timestamp?: number;
  buckets: HistogramBucket[];
  sum: number;
  count: number;

  private bucketBounds: number[];

  constructor(name: string, buckets?: number[], labels?: MetricLabel[]) {
    this.name = name;
    this.value = 0;
    this.labels = labels;
    this.timestamp = Date.now();
    this.bucketBounds = buckets || DEFAULT_HISTOGRAM_BUCKETS;
    this.buckets = this.bucketBounds.map(bound => ({
      upperBound: bound,
      count: 0,
    }));
    this.sum = 0;
    this.count = 0;
  }

  observe(value: number): void {
    if (value < 0) {
      throw new Error('Histogram can only observe positive values');
    }
    this.value = value;
    this.sum += value;
    this.count += 1;
    this.timestamp = Date.now();

    // Update bucket counts
    for (const bucket of this.buckets) {
      if (value <= bucket.upperBound) {
        bucket.count += 1;
      }
    }
  }

  reset(): void {
    this.buckets = this.bucketBounds.map(bound => ({
      upperBound: bound,
      count: 0,
    }));
    this.sum = 0;
    this.count = 0;
    this.timestamp = Date.now();
  }

  toMetric(): Histogram {
    return {
      type: this.type,
      name: this.name,
      value: this.value,
      labels: this.labels,
      timestamp: this.timestamp,
      buckets: this.buckets,
      sum: this.sum,
      count: this.count,
    };
  }
}

// ============================================================================
// Summary Implementation
// ============================================================================

const DEFAULT_SUMMARY_QUANTILES = [0.5, 0.9, 0.95, 0.99];

export class SummaryMetric implements Summary {
  type: 'summary' = 'summary';
  name: string;
  value: number;
  labels?: MetricLabel[];
  timestamp?: number;
  quantiles: SummaryQuantile[];
  sum: number;
  count: number;

  private quantileValues: number[];
  private observations: number[];

  constructor(name: string, quantiles?: number[], labels?: MetricLabel[]) {
    this.name = name;
    this.value = 0;
    this.labels = labels;
    this.timestamp = Date.now();
    this.quantileValues = quantiles || DEFAULT_SUMMARY_QUANTILES;
    this.quantiles = this.quantileValues.map(q => ({
      quantile: q,
      value: 0,
    }));
    this.sum = 0;
    this.count = 0;
    this.observations = [];
  }

  observe(value: number): void {
    if (value < 0) {
      throw new Error('Summary can only observe positive values');
    }
    this.value = value;
    this.sum += value;
    this.count += 1;
    this.observations.push(value);
    this.timestamp = Date.now();

    // Recalculate quantiles
    this.observations.sort((a, b) => a - b);
    this.quantiles = this.quantileValues.map(q => {
      const index = Math.floor(q * (this.observations.length - 1));
      return {
        quantile: q,
        value: this.observations[index] || 0,
      };
    });
  }

  reset(): void {
    this.observations = [];
    this.sum = 0;
    this.count = 0;
    this.quantiles = this.quantileValues.map(q => ({
      quantile: q,
      value: 0,
    }));
    this.timestamp = Date.now();
  }

  toMetric(): Summary {
    return {
      type: this.type,
      name: this.name,
      value: this.value,
      labels: this.labels,
      timestamp: this.timestamp,
      quantiles: this.quantiles,
      sum: this.sum,
      count: this.count,
    };
  }
}

// ============================================================================
// Metric Registry
// ============================================================================

export class PrometheusMetricRegistry implements MetricRegistry {
  private metrics: Map<string, CounterMetric | GaugeMetric | HistogramMetric | SummaryMetric> =
    new Map();

  register(metric: Metric): void {
    if (this.metrics.has(metric.name)) {
      throw new Error(`Metric ${metric.name} already registered`);
    }

    let metricInstance: CounterMetric | GaugeMetric | HistogramMetric | SummaryMetric;

    switch (metric.type) {
      case 'counter':
        metricInstance = new CounterMetric(metric.name, metric.labels);
        metricInstance.value = metric.value;
        break;
      case 'gauge':
        metricInstance = new GaugeMetric(metric.name, metric.labels);
        metricInstance.value = metric.value;
        break;
      case 'histogram':
        metricInstance = new HistogramMetric(metric.name, undefined, metric.labels);
        metricInstance.value = metric.value;
        metricInstance.sum = (metric as Histogram).sum;
        metricInstance.count = (metric as Histogram).count;
        metricInstance.buckets = (metric as Histogram).buckets;
        break;
      case 'summary':
        metricInstance = new SummaryMetric(metric.name, undefined, metric.labels);
        metricInstance.value = metric.value;
        metricInstance.sum = (metric as Summary).sum;
        metricInstance.count = (metric as Summary).count;
        metricInstance.quantiles = (metric as Summary).quantiles;
        break;
      default:
        throw new Error(`Unknown metric type: ${(metric as any).type}`);
    }

    this.metrics.set(metric.name, metricInstance);
  }

  unregister(name: string): void {
    this.metrics.delete(name);
  }

  get(name: string): Metric | undefined {
    const metric = this.metrics.get(name);
    return metric?.toMetric();
  }

  getAll(): Metric[] {
    return Array.from(this.metrics.values()).map(m => m.toMetric());
  }

  clear(): void {
    this.metrics.clear();
  }

  // Convenience methods for creating metrics
  createCounter(name: string, labels?: MetricLabel[]): CounterMetric {
    const counter = new CounterMetric(name, labels);
    this.metrics.set(name, counter);
    return counter;
  }

  createGauge(name: string, labels?: MetricLabel[]): GaugeMetric {
    const gauge = new GaugeMetric(name, labels);
    this.metrics.set(name, gauge);
    return gauge;
  }

  createHistogram(name: string, buckets?: number[], labels?: MetricLabel[]): HistogramMetric {
    const histogram = new HistogramMetric(name, buckets, labels);
    this.metrics.set(name, histogram);
    return histogram;
  }

  createSummary(name: string, quantiles?: number[], labels?: MetricLabel[]): SummaryMetric {
    const summary = new SummaryMetric(name, quantiles, labels);
    this.metrics.set(name, summary);
    return summary;
  }

  // Get specific metric types
  getCounter(name: string): CounterMetric | undefined {
    const metric = this.metrics.get(name);
    return metric instanceof CounterMetric ? metric : undefined;
  }

  getGauge(name: string): GaugeMetric | undefined {
    const metric = this.metrics.get(name);
    return metric instanceof GaugeMetric ? metric : undefined;
  }

  getHistogram(name: string): HistogramMetric | undefined {
    const metric = this.metrics.get(name);
    return metric instanceof HistogramMetric ? metric : undefined;
  }

  getSummary(name: string): SummaryMetric | undefined {
    const metric = this.metrics.get(name);
    return metric instanceof SummaryMetric ? metric : undefined;
  }
}

// ============================================================================
// Prometheus Export Format
// ============================================================================

export function formatPrometheusMetrics(metrics: Metric[]): string {
  const lines: string[] = [];

  for (const metric of metrics) {
    const labelStr = formatLabels(metric.labels);

    switch (metric.type) {
      case 'counter':
        lines.push(`# TYPE ${metric.name} counter`);
        lines.push(`${metric.name}${labelStr} ${metric.value} ${metric.timestamp || Date.now()}`);
        break;

      case 'gauge':
        lines.push(`# TYPE ${metric.name} gauge`);
        lines.push(`${metric.name}${labelStr} ${metric.value} ${metric.timestamp || Date.now()}`);
        break;

      case 'histogram':
        lines.push(`# TYPE ${metric.name} histogram`);
        lines.push(`${metric.name}${labelStr} ${metric.value} ${metric.timestamp || Date.now()}`);
        lines.push(`${metric.name}_sum${labelStr} ${(metric as Histogram).sum} ${metric.timestamp || Date.now()}`);
        lines.push(`${metric.name}_count${labelStr} ${(metric as Histogram).count} ${metric.timestamp || Date.now()}`);
        for (const bucket of (metric as Histogram).buckets) {
          const bucketLabel = labelStr ? `${labelStr.slice(0, -1)},le="${bucket.upperBound}"}"` : `{le="${bucket.upperBound}"}`;
          lines.push(`${metric.name}_bucket${bucketLabel} ${bucket.count} ${metric.timestamp || Date.now()}`);
        }
        break;

      case 'summary':
        lines.push(`# TYPE ${metric.name} summary`);
        lines.push(`${metric.name}${labelStr} ${metric.value} ${metric.timestamp || Date.now()}`);
        lines.push(`${metric.name}_sum${labelStr} ${(metric as Summary).sum} ${metric.timestamp || Date.now()}`);
        lines.push(`${metric.name}_count${labelStr} ${(metric as Summary).count} ${metric.timestamp || Date.now()}`);
        for (const quantile of (metric as Summary).quantiles) {
          const quantileLabel = labelStr ? `${labelStr.slice(0, -1)},quantile="${quantile.quantile}"}"` : `{quantile="${quantile.quantile}"}`;
          lines.push(`${metric.name}${quantileLabel} ${quantile.value} ${metric.timestamp || Date.now()}`);
        }
        break;
    }

    lines.push(''); // Empty line between metrics
  }

  return lines.join('\n');
}

function formatLabels(labels?: MetricLabel[]): string {
  if (!labels || labels.length === 0) {
    return '';
  }
  const labelStr = labels.map(l => `${l.name}="${l.value}"`).join(',');
  return `{${labelStr}}`;
}

// ============================================================================
// Global Registry Instance
// ============================================================================

export const globalMetricRegistry = new PrometheusMetricRegistry();

// Convenience functions for global registry
export function createCounter(name: string, labels?: MetricLabel[]): CounterMetric {
  return globalMetricRegistry.createCounter(name, labels);
}

export function createGauge(name: string, labels?: MetricLabel[]): GaugeMetric {
  return globalMetricRegistry.createGauge(name, labels);
}

export function createHistogram(name: string, buckets?: number[], labels?: MetricLabel[]): HistogramMetric {
  return globalMetricRegistry.createHistogram(name, buckets, labels);
}

export function createSummary(name: string, quantiles?: number[], labels?: MetricLabel[]): SummaryMetric {
  return globalMetricRegistry.createSummary(name, quantiles, labels);
}

export function getMetric(name: string): Metric | undefined {
  return globalMetricRegistry.get(name);
}

export function getAllMetrics(): Metric[] {
  return globalMetricRegistry.getAll();
}

export function exportPrometheusMetrics(): string {
  return formatPrometheusMetrics(globalMetricRegistry.getAll());
}
