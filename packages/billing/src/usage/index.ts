/**
 * @aether/billing - Usage-Based Billing
 * 
 * Track usage records, aggregate metrics, and calculate usage-based charges
 * 
 * @version 1.0.0
 */

import type { UsageRecord, UsageMetric, UsageAggregation } from '../types/index.js';
import { UsageRecordSchema, UsageMetricSchema } from '../schemas/index.js';

// =============================================================================
// USAGE BILLING INTERFACE
// =============================================================================

export interface UsageConfig {
  aggregationInterval: number; // minutes
  retentionPeriod: number; // days
}

export interface CreateUsageRecordParams {
  customerId: string;
  subscriptionId?: string;
  metric: string;
  quantity: number;
  unit: string;
  timestamp?: Date;
  metadata?: Record<string, string>;
}

export interface AggregationParams {
  customerId: string;
  metric: string;
  period: {
    start: Date;
    end: Date;
  };
}

// =============================================================================
// USAGE SERVICE CLASS
// =============================================================================

export class UsageService {
  private config: UsageConfig;
  private metrics: Map<string, UsageMetric> = new Map();
  private records: UsageRecord[] = [];

  constructor(config: UsageConfig) {
    this.config = config;
  }

  /**
   * Register a usage metric
   */
  registerMetric(metric: Omit<UsageMetric, 'id' | 'createdAt' | 'updatedAt'>): UsageMetric {
    const newMetric: UsageMetric = {
      ...metric,
      id: `metric-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.metrics.set(newMetric.id, newMetric);
    return newMetric;
  }

  /**
   * Get a metric by ID
   */
  getMetric(metricId: string): UsageMetric | undefined {
    return this.metrics.get(metricId);
  }

  /**
   * Get metric by name
   */
  getMetricByName(name: string): UsageMetric | undefined {
    return Array.from(this.metrics.values()).find(m => m.name === name);
  }

  /**
   * Create a usage record
   */
  createUsageRecord(params: CreateUsageRecordParams): UsageRecord {
    const metric = this.getMetricByName(params.metric);
    if (!metric) {
      throw new Error(`Metric ${params.metric} not found`);
    }

    const record: UsageRecord = {
      id: `usage-${Date.now()}`,
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      metric: params.metric,
      quantity: params.quantity,
      unit: params.unit,
      timestamp: params.timestamp || new Date(),
      period: this.calculatePeriod(metric, params.timestamp || new Date()),
      metadata: params.metadata,
    };

    this.records.push(record);
    return record;
  }

  /**
   * Batch create usage records
   */
  batchCreateUsageRecords(params: CreateUsageRecordParams[]): UsageRecord[] {
    return params.map(p => this.createUsageRecord(p));
  }

  /**
   * Get usage records for a customer
   */
  getUsageRecords(customerId: string, metric?: string): UsageRecord[] {
    let filtered = this.records.filter(r => r.customerId === customerId);
    if (metric) {
      filtered = filtered.filter(r => r.metric === metric);
    }
    return filtered;
  }

  /**
   * Aggregate usage for a customer and metric
   */
  aggregateUsage(params: AggregationParams): UsageAggregation {
    const metric = this.getMetricByName(params.metric);
    if (!metric) {
      throw new Error(`Metric ${params.metric} not found`);
    }

    const records = this.records.filter(r => 
      r.customerId === params.customerId &&
      r.metric === params.metric &&
      r.timestamp >= params.period.start &&
      r.timestamp <= params.period.end
    );

    let total = 0;
    const recordCount = records.length;

    switch (metric.aggregationType) {
      case 'sum':
        total = records.reduce((sum, r) => sum + r.quantity, 0);
        break;
      case 'max':
        total = Math.max(...records.map(r => r.quantity));
        break;
      case 'avg':
        total = recordCount > 0 ? records.reduce((sum, r) => sum + r.quantity, 0) / recordCount : 0;
        break;
      case 'last':
        total = records.length > 0 ? records[records.length - 1].quantity : 0;
        break;
    }

    return {
      customerId: params.customerId,
      metric: params.metric,
      period: params.period,
      total,
      unit: metric.unit,
      recordCount,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate billing period for a metric
   */
  private calculatePeriod(metric: UsageMetric, timestamp: Date): { start: Date; end: Date } {
    const start = new Date(timestamp);
    const end = new Date(timestamp);

    switch (metric.resetPeriod) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'never':
        start.setFullYear(1970, 0, 1);
        end.setFullYear(2099, 11, 31);
        break;
    }

    return { start, end };
  }

  /**
   * Get usage summary for a customer
   */
  getUsageSummary(customerId: string, period: { start: Date; end: Date }): Record<string, number> {
    const summary: Record<string, number> = {};
    const customerRecords = this.records.filter(r =>
      r.customerId === customerId &&
      r.timestamp >= period.start &&
      r.timestamp <= period.end
    );

    for (const record of customerRecords) {
      if (!summary[record.metric]) {
        summary[record.metric] = 0;
      }
      summary[record.metric] += record.quantity;
    }

    return summary;
  }

  /**
   * Delete old usage records based on retention period
   */
  cleanupOldRecords(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

    const beforeCount = this.records.length;
    this.records = this.records.filter(r => r.timestamp >= cutoffDate);
    const afterCount = this.records.length;

    return beforeCount - afterCount;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): UsageMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Update a metric
   */
  updateMetric(metricId: string, updates: Partial<Omit<UsageMetric, 'id' | 'createdAt'>>): UsageMetric {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      throw new Error(`Metric ${metricId} not found`);
    }

    const updatedMetric: UsageMetric = {
      ...metric,
      ...updates,
      updatedAt: new Date(),
    };

    this.metrics.set(metricId, updatedMetric);
    return updatedMetric;
  }

  /**
   * Delete a metric
   */
  deleteMetric(metricId: string): void {
    this.metrics.delete(metricId);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================
