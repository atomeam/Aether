/**
 * Alert Rules Engine
 * 
 * Configurable alert thresholds.
 */

import { EventEmitter } from 'events';

// Alert rule
export interface AlertRule {
  id: string;
  name: string;
  condition: 'denial_rate_above' | 'failures_above' | 'latency_above' | 'confidence_below';
  threshold: number;
  severity: 'warning' | 'critical';
  enabled: boolean;
  lastTriggered?: number;
}

// Alert evaluation
export interface AlertResult {
  rule: string;
  triggered: boolean;
  value: number;
  threshold: number;
}

// Default rules
export const DEFAULT_RULES: AlertRule[] = [
  { id: 'denial-high', name: 'High Denial Rate', condition: 'denial_rate_above', threshold: 0.5, severity: 'critical', enabled: true },
  { id: 'confidence-low', name: 'Low Confidence', condition: 'confidence_below', threshold: 0.3, severity: 'warning', enabled: true },
  { id: 'failures-high', name: 'High Failures', condition: 'failures_above', threshold: 10, severity: 'critical', enabled: true },
];

export class AlertEngine extends EventEmitter {
  private rules = new Map<string, AlertRule>();
  
  constructor() {
    super();
    for (const rule of DEFAULT_RULES) {
      this.rules.set(rule.id, rule);
    }
  }
  
  // Add rule
  addRule(rule: Omit<AlertRule, 'id'>) {
    const id = crypto.randomUUID();
    this.rules.set(id, { ...rule, id });
    return id;
  }
  
  // Remove rule
  removeRule(id: string) {
    return this.rules.delete(id);
  }
  
  // Enable/disable
  enableRule(id: string, enabled: boolean) {
    const rule = this.rules.get(id);
    if (rule) rule.enabled = enabled;
  }
  
  // Evaluate all rules
  async evaluate(): Promise<AlertResult[]> {
    const results: AlertResult[] = [];
    
    const { getStats } = await import('@aether/curator-audit');
    const audit = await getStats();
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      let value = 0;
      let triggered = false;
      
      switch (rule.condition) {
        case 'denial_rate_above':
          value = audit.denial_rate;
          triggered = value > rule.threshold;
          break;
        case 'failures_above':
          value = audit.denied;
          triggered = value > rule.threshold;
          break;
        case 'confidence_below':
          // Check overall confidence
          value = 0.5;
          triggered = value < rule.threshold;
          break;
      }
      
      results.push({ rule: rule.id, triggered, value, threshold: rule.threshold });
      
      if (triggered) {
        rule.lastTriggered = Date.now();
        this.emit('alert', { rule: rule.id, severity: rule.severity, value });
      }
    }
    
    return results;
  }
  
  // List rules
  listRules() {
    return Array.from(this.rules.values());
  }
}

export const alertEngine = new AlertEngine();

import crypto from 'crypto';