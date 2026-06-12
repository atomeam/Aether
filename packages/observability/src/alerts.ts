/**
 * @aether/observability - Alert Management
 * 
 * Alert management system with rule evaluation,
 * notification channels, and alert lifecycle management.
 */

import type {
  Alert,
  AlertCondition,
  AlertRule,
  AlertManager,
  AlertSeverity,
  AlertConditionType,
} from './types';
import { globalMetricRegistry } from './metrics';

// ============================================================================
// Alert Condition Evaluator
// ============================================================================

export class ConditionEvaluator {
  evaluate(condition: AlertCondition, metricValue: number): boolean {
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThreshold(condition, metricValue);

      case 'rate':
        return this.evaluateRate(condition, metricValue);

      case 'anomaly':
        return this.evaluateAnomaly(condition, metricValue);

      case 'pattern':
        return this.evaluatePattern(condition, metricValue);

      default:
        return false;
    }
  }

  private evaluateThreshold(condition: AlertCondition, value: number): boolean {
    if (condition.threshold === undefined || condition.operator === undefined) {
      return false;
    }

    switch (condition.operator) {
      case '>':
        return value > condition.threshold;
      case '<':
        return value < condition.threshold;
      case '>=':
        return value >= condition.threshold;
      case '<=':
        return value <= condition.threshold;
      case '==':
        return value === condition.threshold;
      case '!=':
        return value !== condition.threshold;
      default:
        return false;
    }
  }

  private evaluateRate(condition: AlertCondition, value: number): boolean {
    // Simplified rate evaluation - in production, would calculate rate over time window
    if (condition.threshold === undefined || condition.operator === undefined) {
      return false;
    }
    return this.evaluateThreshold(condition, value);
  }

  private evaluateAnomaly(condition: AlertCondition, value: number): boolean {
    // Simplified anomaly detection - in production, would use statistical methods
    // For now, just check if value exceeds threshold
    if (condition.threshold === undefined) {
      return false;
    }
    return Math.abs(value) > condition.threshold;
  }

  private evaluatePattern(condition: AlertCondition, value: number): boolean {
    // Simplified pattern matching - in production, would use more sophisticated pattern matching
    if (condition.threshold === undefined || condition.operator === undefined) {
      return false;
    }
    return this.evaluateThreshold(condition, value);
  }
}

// ============================================================================
// Alert Manager Implementation
// ============================================================================

export class DefaultAlertManager implements AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private evaluator: ConditionEvaluator;
  private notificationCallbacks: Map<string, (alert: Alert) => void> = new Map();

  constructor() {
    this.evaluator = new ConditionEvaluator();
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    // Also resolve any active alerts for this rule
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.conditionId === ruleId) {
        this.resolveAlert(alertId);
      }
    }
  }

  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  evaluateRules(): Alert[] {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) {
        continue;
      }

      for (const condition of rule.conditions) {
        const metric = globalMetricRegistry.get(condition.metric);
        if (!metric) {
          continue;
        }

        const isFiring = this.evaluator.evaluate(condition, metric.value);

        if (isFiring) {
          const alertId = `${condition.id}-${Date.now()}`;
          const existingAlert = this.findActiveAlert(condition.id);

          if (!existingAlert) {
            const alert: Alert = {
              id: alertId,
              conditionId: condition.id,
              severity: rule.severity,
              status: 'firing',
              message: `${rule.name}: ${condition.name} - Current value: ${metric.value}`,
              value: metric.value,
              timestamp: Date.now(),
              labels: {
                rule: rule.name,
                condition: condition.name,
                metric: condition.metric,
              },
            };

            this.activeAlerts.set(alertId, alert);
            this.alertHistory.push(alert);
            newAlerts.push(alert);

            // Send notifications
            this.sendNotifications(alert, rule.notificationChannels);
          }
        } else {
          // Resolve any active alerts for this condition
          const activeAlert = this.findActiveAlert(condition.id);
          if (activeAlert) {
            this.resolveAlert(activeAlert.id);
          }
        }
      }
    }

    return newAlerts;
  }

  private findActiveAlert(conditionId: string): Alert | undefined {
    for (const alert of this.activeAlerts.values()) {
      if (alert.conditionId === conditionId && alert.status === 'firing') {
        return alert;
      }
    }
    return undefined;
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.timestamp = Date.now();
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.timestamp = Date.now();
      this.activeAlerts.delete(alertId);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(): Alert[] {
    return [...this.alertHistory];
  }

  clearHistory(): void {
    this.alertHistory = [];
  }

  // Notification management
  registerNotificationChannel(channelId: string, callback: (alert: Alert) => void): void {
    this.notificationCallbacks.set(channelId, callback);
  }

  unregisterNotificationChannel(channelId: string): void {
    this.notificationCallbacks.delete(channelId);
  }

  private sendNotifications(alert: Alert, channels: string[]): void {
    for (const channelId of channels) {
      const callback = this.notificationCallbacks.get(channelId);
      if (callback) {
        try {
          callback(alert);
        } catch (error) {
          console.error(`Failed to send notification to channel ${channelId}:`, error);
        }
      }
    }
  }

  // Start automatic evaluation
  startEvaluation(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      this.evaluateRules();
    }, intervalMs);
  }

  stopEvaluation(timer: NodeJS.Timeout): void {
    clearInterval(timer);
  }
}

// ============================================================================
// Global Alert Manager
// ============================================================================

export const globalAlertManager = new DefaultAlertManager();

// Convenience functions for global alert manager
export function addAlertRule(rule: AlertRule): void {
  globalAlertManager.addRule(rule);
}

export function removeAlertRule(ruleId: string): void {
  globalAlertManager.removeRule(ruleId);
}

export function getAlertRule(ruleId: string): AlertRule | undefined {
  return globalAlertManager.getRule(ruleId);
}

export function getAllAlertRules(): AlertRule[] {
  return globalAlertManager.getAllRules();
}

export function evaluateAlerts(): Alert[] {
  return globalAlertManager.evaluateRules();
}

export function acknowledgeAlert(alertId: string): void {
  globalAlertManager.acknowledgeAlert(alertId);
}

export function resolveAlert(alertId: string): void {
  globalAlertManager.resolveAlert(alertId);
}

export function getActiveAlerts(): Alert[] {
  return globalAlertManager.getActiveAlerts();
}

export function getAlertHistory(): Alert[] {
  return globalAlertManager.getAlertHistory();
}

export function registerNotificationChannel(
  channelId: string,
  callback: (alert: Alert) => void,
): void {
  globalAlertManager.registerNotificationChannel(channelId, callback);
}

export function unregisterNotificationChannel(channelId: string): void {
  globalAlertManager.unregisterNotificationChannel(channelId);
}

// ============================================================================
// Alert Rule Builders
// ============================================================================

export class AlertRuleBuilder {
  private rule: Partial<AlertRule> = {
    conditions: [],
    enabled: true,
    notificationChannels: [],
  };

  withId(id: string): AlertRuleBuilder {
    this.rule.id = id;
    return this;
  }

  withName(name: string): AlertRuleBuilder {
    this.rule.name = name;
    return this;
  }

  withSeverity(severity: AlertSeverity): AlertRuleBuilder {
    this.rule.severity = severity;
    return this;
  }

  withCondition(condition: AlertCondition): AlertRuleBuilder {
    this.rule.conditions!.push(condition);
    return this;
  }

  withNotificationChannel(channel: string): AlertRuleBuilder {
    this.rule.notificationChannels!.push(channel);
    return this;
  }

  disabled(): AlertRuleBuilder {
    this.rule.enabled = false;
    return this;
  }

  build(): AlertRule {
    if (!this.rule.id || !this.rule.name || !this.rule.severity) {
      throw new Error('Alert rule must have id, name, and severity');
    }
    if (this.rule.conditions!.length === 0) {
      throw new Error('Alert rule must have at least one condition');
    }
    return this.rule as AlertRule;
  }
}

export class AlertConditionBuilder {
  private condition: Partial<AlertCondition> = {};

  withId(id: string): AlertConditionBuilder {
    this.condition.id = id;
    return this;
  }

  withName(name: string): AlertConditionBuilder {
    this.condition.name = name;
    return this;
  }

  withType(type: AlertConditionType): AlertConditionBuilder {
    this.condition.type = type;
    return this;
  }

  withMetric(metric: string): AlertConditionBuilder {
    this.condition.metric = metric;
    return this;
  }

  withThreshold(threshold: number, operator: '>' | '<' | '>=' | '<=' | '==' | '!='): AlertConditionBuilder {
    this.condition.threshold = threshold;
    this.condition.operator = operator;
    return this;
  }

  withWindow(window: number): AlertConditionBuilder {
    this.condition.window = window;
    return this;
  }

  withEvaluationInterval(interval: number): AlertConditionBuilder {
    this.condition.evaluationInterval = interval;
    return this;
  }

  build(): AlertCondition {
    if (!this.condition.id || !this.condition.name || !this.condition.type || !this.condition.metric) {
      throw new Error('Alert condition must have id, name, type, and metric');
    }
    if (!this.condition.evaluationInterval) {
      this.condition.evaluationInterval = 60000; // Default 1 minute
    }
    return this.condition as AlertCondition;
  }
}

// ============================================================================
// Predefined Common Alert Rules
// ============================================================================

export function createHighErrorRateAlert(errorThreshold: number = 10): AlertRule {
  const condition = new AlertConditionBuilder()
    .withId('high-error-rate')
    .withName('High Error Rate')
    .withType('threshold')
    .withMetric('error_count')
    .withThreshold(errorThreshold, '>=')
    .withWindow(60000)
    .withEvaluationInterval(60000)
    .build();

  return new AlertRuleBuilder()
    .withId('high-error-rate-rule')
    .withName('High Error Rate Alert')
    .withSeverity('critical')
    .withCondition(condition)
    .build();
}

export function createHighLatencyAlert(latencyThreshold: number = 1000): AlertRule {
  const condition = new AlertConditionBuilder()
    .withId('high-latency')
    .withName('High Latency')
    .withType('threshold')
    .withMetric('request_latency')
    .withThreshold(latencyThreshold, '>')
    .withEvaluationInterval(60000)
    .build();

  return new AlertRuleBuilder()
    .withId('high-latency-rule')
    .withName('High Latency Alert')
    .withSeverity('warning')
    .withCondition(condition)
    .build();
}

export function createLowMemoryAlert(memoryThreshold: number = 10): AlertRule {
  const condition = new AlertConditionBuilder()
    .withId('low-memory')
    .withName('Low Memory')
    .withType('threshold')
    .withMetric('memory_available_mb')
    .withThreshold(memoryThreshold, '<')
    .withEvaluationInterval(30000)
    .build();

  return new AlertRuleBuilder()
    .withId('low-memory-rule')
    .withName('Low Memory Alert')
    .withSeverity('critical')
    .withCondition(condition)
    .build();
}
