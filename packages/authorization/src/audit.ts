/**
 * @aether/authorization - Audit Logging Module
 * 
 * Audit logging for authorization decisions with configurable
 * log levels, retention, and context inclusion
 */

import {
  AuditLog,
  AuditConfig,
  PolicyEvaluationContext
} from './types.js';
import { AuditLogSchema, AuditConfigSchema } from './schemas.js';

export class AuditLogger {
  private config: AuditConfig;
  private logs: AuditLog[];

  constructor(config?: Partial<AuditConfig>) {
    this.config = AuditConfigSchema.parse(config || {});
    this.logs = [];
  }

  /**
   * Log an authorization decision
   */
  log(
    subject: string,
    resource: string,
    action: string,
    result: 'allow' | 'deny',
    reason?: string,
    context?: Record<string, any>
  ): AuditLog | null {
    if (!this.config.enabled) {
      return null;
    }

    // Check log level
    if (this.config.logLevel === 'none') {
      return null;
    }

    if (this.config.logLevel === 'denied' && result === 'allow') {
      return null;
    }

    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      subject,
      resource,
      action,
      result,
      reason,
      metadata: this.config.includeContext ? context : undefined
    };

    const validated = AuditLogSchema.parse(log);
    this.logs.push(validated);

    // Clean up old logs based on retention
    this.cleanupOldLogs();

    return validated;
  }

  /**
   * Log from policy evaluation context
   */
  logFromContext(
    context: PolicyEvaluationContext,
    result: 'allow' | 'deny',
    reason?: string
  ): AuditLog | null {
    return this.log(
      context.subject.id,
      `${context.resource.type}:${context.resource.id}`,
      context.action,
      result,
      reason,
      { context }
    );
  }

  /**
   * Get logs by subject
   */
  getLogsBySubject(subjectId: string): AuditLog[] {
    return this.logs.filter(log => log.subject === subjectId);
  }

  /**
   * Get logs by resource
   */
  getLogsByResource(resource: string): AuditLog[] {
    return this.logs.filter(log => log.resource === resource);
  }

  /**
   * Get logs by action
   */
  getLogsByAction(action: string): AuditLog[] {
    return this.logs.filter(log => log.action === action);
  }

  /**
   * Get logs by result
   */
  getLogsByResult(result: 'allow' | 'deny'): AuditLog[] {
    return this.logs.filter(log => log.result === result);
  }

  /**
   * Get logs by date range
   */
  getLogsByDateRange(startDate: Date, endDate: Date): AuditLog[] {
    return this.logs.filter(log => 
      log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * Get all logs
   */
  getAllLogs(): AuditLog[] {
    return [...this.logs];
  }

  /**
   * Get log count
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Clean up old logs based on retention policy
   */
  private cleanupOldLogs(): void {
    if (!this.config.retentionDays) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AuditConfig>): void {
    this.config = AuditConfigSchema.parse({ ...this.config, ...config });
  }

  /**
   * Get current configuration
   */
  getConfig(): AuditConfig {
    return { ...this.config };
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    total: number;
    allowed: number;
    denied: number;
    allowRate: number;
  } {
    const total = this.logs.length;
    const allowed = this.logs.filter(log => log.result === 'allow').length;
    const denied = this.logs.filter(log => log.result === 'deny').length;

    return {
      total,
      allowed,
      denied,
      allowRate: total > 0 ? allowed / total : 0
    };
  }

  /**
   * Export logs to JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Import logs from JSON
   */
  importLogs(json: string): void {
    try {
      const imported = JSON.parse(json);
      const validated = imported.map((log: any) => AuditLogSchema.parse(log));
      this.logs = [...this.logs, ...validated];
    } catch (error) {
      throw new Error('Invalid log data format');
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalAuditLogger: AuditLogger | null = null;

export function setupAuditLogger(config?: Partial<AuditConfig>): AuditLogger {
  globalAuditLogger = new AuditLogger(config);
  return globalAuditLogger;
}

export function getAuditLogger(): AuditLogger | null {
  return globalAuditLogger;
}

export function createAuditLogger(config?: Partial<AuditConfig>): AuditLogger {
  return new AuditLogger(config);
}
