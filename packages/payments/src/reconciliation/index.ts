/**
 * @aether/payments - Payment Reconciliation
 * 
 * Reconcile payments between internal records and payment providers
 * 
 * @version 1.0.0
 */

import type {
  ReconciliationReport,
  ReconciliationDiscrepancy,
  ReconciliationRule,
  PaymentIntent,
  PaymentTransaction,
  PaymentStatus,
  PaymentProvider,
} from '../types/index.js';
import { ReconciliationReportSchema, ReconciliationDiscrepancySchema } from '../schemas/index.js';

// =============================================================================
// RECONCILIATION INTERFACE
// =============================================================================

export interface ReconciliationConfig {
  toleranceAmount: number;
  autoResolveRules: boolean;
  notifyOnDiscrepancy: boolean;
}

export interface ReconciliationParams {
  provider: PaymentProvider;
  period: {
    start: Date;
    end: Date;
  };
  internalTransactions: PaymentTransaction[];
  providerTransactions: PaymentTransaction[];
}

export interface DiscrepancyDetectionParams {
  internalTransaction?: PaymentTransaction;
  providerTransaction?: PaymentTransaction;
  toleranceAmount: number;
}

// =============================================================================
// RECONCILIATION SERVICE CLASS
// =============================================================================

export class ReconciliationService {
  private config: ReconciliationConfig;
  private rules: ReconciliationRule[] = [];

  constructor(config: ReconciliationConfig) {
    this.config = config;
    this.initializeDefaultRules();
  }

  /**
   * Initialize default reconciliation rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'rule-1',
        name: 'Amount Mismatch Tolerance',
        description: 'Auto-resolve amount mismatches within tolerance',
        condition: 'type === "amount_mismatch" && Math.abs(expectedAmount - actualAmount) <= tolerance',
        action: 'auto_resolve',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rule-2',
        name: 'Missing Transaction',
        description: 'Flag missing transactions for manual review',
        condition: 'type === "missing"',
        action: 'manual_review',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rule-3',
        name: 'Duplicate Transaction',
        description: 'Flag duplicate transactions for manual review',
        condition: 'type === "duplicate"',
        action: 'manual_review',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Add a reconciliation rule
   */
  addRule(rule: Omit<ReconciliationRule, 'id' | 'createdAt' | 'updatedAt'>): ReconciliationRule {
    const newRule: ReconciliationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.push(newRule);
    return newRule;
  }

  /**
   * Update a reconciliation rule
   */
  updateRule(ruleId: string, updates: Partial<Omit<ReconciliationRule, 'id' | 'createdAt'>>): ReconciliationRule {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    this.rules[index] = {
      ...this.rules[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.rules[index];
  }

  /**
   * Delete a reconciliation rule
   */
  deleteRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Get all rules
   */
  getRules(): ReconciliationRule[] {
    return [...this.rules];
  }

  /**
   * Perform reconciliation
   */
  async reconcile(params: ReconciliationParams): Promise<ReconciliationReport> {
    const discrepancies = this.detectDiscrepancies(
      params.internalTransactions,
      params.providerTransactions,
      params.toleranceAmount
    );

    // Apply rules to discrepancies
    if (this.config.autoResolveRules) {
      await this.applyRules(discrepancies);
    }

    const matchedTransactions = params.internalTransactions.length - discrepancies.length;
    const discrepancyAmount = discrepancies.reduce((sum, d) => {
      if (d.type === 'amount_mismatch' && d.expectedAmount && d.actualAmount) {
        return sum + Math.abs(d.expectedAmount - d.actualAmount);
      }
      return sum;
    }, 0);

    const report: ReconciliationReport = {
      id: `recon-${Date.now()}`,
      period: params.period,
      provider: params.provider,
      status: discrepancies.length === 0 ? 'matched' : 'discrepancy',
      totalTransactions: params.internalTransactions.length,
      matchedTransactions,
      unmatchedTransactions: discrepancies.length,
      discrepancyAmount,
      discrepancies,
      generatedAt: new Date(),
      completedAt: new Date(),
    };

    return report;
  }

  /**
   * Detect discrepancies between internal and provider transactions
   */
  private detectDiscrepancies(
    internalTransactions: PaymentTransaction[],
    providerTransactions: PaymentTransaction[],
    toleranceAmount: number
  ): ReconciliationDiscrepancy[] {
    const discrepancies: ReconciliationDiscrepancy[] = [];
    const internalMap = new Map(internalTransactions.map(t => [t.id, t]));
    const providerMap = new Map(providerTransactions.map(t => [t.providerTransactionId || t.id, t]));

    // Check for missing transactions in provider
    for (const [id, internalTx] of internalMap) {
      const providerTx = providerTransactions.find(pt => 
        pt.providerTransactionId === id || pt.id === id
      );

      if (!providerTx) {
        discrepancies.push({
          id: `disc-${Date.now()}-${discrepancies.length}`,
          type: 'missing',
          transactionId: id,
          description: `Transaction ${id} found in internal records but not in provider`,
          resolved: false,
        });
        continue;
      }

      // Check for amount mismatch
      if (Math.abs(internalTx.amount - providerTx.amount) > toleranceAmount) {
        discrepancies.push({
          id: `disc-${Date.now()}-${discrepancies.length}`,
          type: 'amount_mismatch',
          transactionId: id,
          providerTransactionId: providerTx.providerTransactionId,
          expectedAmount: internalTx.amount,
          actualAmount: providerTx.amount,
          description: `Amount mismatch for transaction ${id}: expected ${internalTx.amount}, got ${providerTx.amount}`,
          resolved: false,
        });
      }

      // Check for currency mismatch
      if (internalTx.currency !== providerTx.currency) {
        discrepancies.push({
          id: `disc-${Date.now()}-${discrepancies.length}`,
          type: 'currency_mismatch',
          transactionId: id,
          providerTransactionId: providerTx.providerTransactionId,
          expectedCurrency: internalTx.currency,
          actualCurrency: providerTx.currency,
          description: `Currency mismatch for transaction ${id}: expected ${internalTx.currency}, got ${providerTx.currency}`,
          resolved: false,
        });
      }

      // Check for status mismatch
      if (internalTx.status !== providerTx.status) {
        discrepancies.push({
          id: `disc-${Date.now()}-${discrepancies.length}`,
          type: 'status_mismatch',
          transactionId: id,
          providerTransactionId: providerTx.providerTransactionId,
          expectedStatus: internalTx.status,
          actualStatus: providerTx.status,
          description: `Status mismatch for transaction ${id}: expected ${internalTx.status}, got ${providerTx.status}`,
          resolved: false,
        });
      }
    }

    // Check for extra transactions in provider (potential duplicates)
    for (const [providerId, providerTx] of providerMap) {
      const internalTx = internalTransactions.find(it => 
        it.id === providerId || it.providerTransactionId === providerId
      );

      if (!internalTx) {
        discrepancies.push({
          id: `disc-${Date.now()}-${discrepancies.length}`,
          type: 'duplicate',
          providerTransactionId: providerId,
          description: `Transaction ${providerId} found in provider but not in internal records`,
          resolved: false,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Apply reconciliation rules to discrepancies
   */
  private async applyRules(discrepancies: ReconciliationDiscrepancy[]): Promise<void> {
    for (const discrepancy of discrepancies) {
      if (discrepancy.resolved) continue;

      for (const rule of this.rules.filter(r => r.enabled)) {
        try {
          const shouldApply = this.evaluateRule(rule, discrepancy);
          
          if (shouldApply) {
            switch (rule.action) {
              case 'auto_resolve':
                discrepancy.resolved = true;
                discrepancy.resolvedAt = new Date();
                discrepancy.resolutionNotes = `Auto-resolved by rule: ${rule.name}`;
                break;
              
              case 'flag':
                // Flag for attention (no auto-resolution)
                break;
              
              case 'manual_review':
                // No action, requires manual review
                break;
            }
            break; // Stop after first matching rule
          }
        } catch (error) {
          console.error(`Error evaluating rule ${rule.id}:`, error);
        }
      }
    }
  }

  /**
   * Evaluate a rule against a discrepancy
   */
  private evaluateRule(rule: ReconciliationRule, discrepancy: ReconciliationDiscrepancy): boolean {
    // In a real implementation, this would use a safe expression evaluator
    // For now, we'll implement basic rule matching
    
    if (rule.condition.includes('type === "amount_mismatch"') && discrepancy.type === 'amount_mismatch') {
      if (discrepancy.expectedAmount && discrepancy.actualAmount) {
        const diff = Math.abs(discrepancy.expectedAmount - discrepancy.actualAmount);
        return diff <= this.config.toleranceAmount;
      }
    }

    if (rule.condition.includes('type === "missing"') && discrepancy.type === 'missing') {
      return true;
    }

    if (rule.condition.includes('type === "duplicate"') && discrepancy.type === 'duplicate') {
      return true;
    }

    return false;
  }

  /**
   * Resolve a discrepancy manually
   */
  resolveDiscrepancy(
    discrepancyId: string,
    resolutionNotes: string
  ): ReconciliationDiscrepancy {
    // In a real implementation, this would update the discrepancy in the database
    throw new Error('Resolve discrepancy not implemented - requires database integration');
  }

  /**
   * Get reconciliation summary
   */
  getSummary(reports: ReconciliationReport[]): {
    totalReports: number;
    matchedReports: number;
    discrepancyReports: number;
    totalDiscrepancies: number;
    totalDiscrepancyAmount: number;
  } {
    return {
      totalReports: reports.length,
      matchedReports: reports.filter(r => r.status === 'matched').length,
      discrepancyReports: reports.filter(r => r.status === 'discrepancy').length,
      totalDiscrepancies: reports.reduce((sum, r) => sum + r.discrepancies.length, 0),
      totalDiscrepancyAmount: reports.reduce((sum, r) => sum + r.discrepancyAmount, 0),
    };
  }

  /**
   * Export reconciliation report
   */
  exportReport(report: ReconciliationReport, format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    if (format === 'csv') {
      const headers = ['ID', 'Type', 'Transaction ID', 'Provider Transaction ID', 'Description', 'Resolved'];
      const rows = report.discrepancies.map(d => [
        d.id,
        d.type,
        d.transactionId || '',
        d.providerTransactionId || '',
        d.description,
        d.resolved ? 'Yes' : 'No',
      ]);

      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    throw new Error(`Unsupported format: ${format}`);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ReconciliationConfig, ReconciliationParams, DiscrepancyDetectionParams };
