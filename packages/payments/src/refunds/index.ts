/**
 * @aether/payments - Refund Processing
 * 
 * Process refunds through payment providers with validation and tracking
 * 
 * @version 1.0.0
 */

import type {
  Refund,
  PartialRefund,
  PaymentIntent,
  RefundStatus,
  RefundReason,
} from '../types/index.js';
import { RefundSchema, PartialRefundSchema } from '../schemas/index.js';

// =============================================================================
// REFUND INTERFACE
// =============================================================================

export interface RefundConfig {
  stripeService?: any;
  paypalService?: any;
  defaultProvider: 'stripe' | 'paypal';
  allowPartialRefunds: boolean;
  requireReason: boolean;
  maxRefundAmount?: number;
  refundWindowDays?: number;
}

export interface CreateRefundParams {
  paymentIntentId: string;
  amount?: number;
  reason: RefundReason;
  reasonDescription?: string;
  metadata?: Record<string, string>;
  provider?: 'stripe' | 'paypal';
}

export interface RefundValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// REFUND SERVICE CLASS
// =============================================================================

export class RefundService {
  private config: RefundConfig;

  constructor(config: RefundConfig) {
    this.config = config;
  }

  /**
   * Validate refund request
   */
  async validateRefund(
    params: CreateRefundParams,
    paymentIntent: PaymentIntent
  ): Promise<RefundValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if payment can be refunded
    if (paymentIntent.status !== 'succeeded') {
      errors.push(`Payment must be succeeded to refund. Current status: ${paymentIntent.status}`);
    }

    // Check refund window
    if (this.config.refundWindowDays) {
      const refundWindow = this.config.refundWindowDays * 24 * 60 * 60 * 1000;
      const paymentAge = Date.now() - paymentIntent.completedAt!.getTime();
      if (paymentAge > refundWindow) {
        errors.push(`Refund window of ${this.config.refundWindowDays} days has expired`);
      }
    }

    // Check partial refund allowance
    if (params.amount !== undefined && !this.config.allowPartialRefunds) {
      errors.push('Partial refunds are not allowed');
    }

    // Check refund amount
    if (params.amount !== undefined) {
      if (params.amount <= 0) {
        errors.push('Refund amount must be positive');
      }

      if (params.amount > paymentIntent.amount) {
        errors.push(`Refund amount (${params.amount}) cannot exceed payment amount (${paymentIntent.amount})`);
      }

      if (this.config.maxRefundAmount && params.amount > this.config.maxRefundAmount) {
        errors.push(`Refund amount exceeds maximum allowed (${this.config.maxRefundAmount})`);
      }
    }

    // Check reason requirement
    if (this.config.requireReason && !params.reason) {
      errors.push('Refund reason is required');
    }

    // Check for existing refunds
    // In a real implementation, this would query the database
    warnings.push('Consider checking for existing refunds before processing');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Create a refund
   */
  async createRefund(params: CreateRefundParams): Promise<Refund | PartialRefund> {
    const provider = params.provider || this.config.defaultProvider;
    const service = provider === 'stripe' ? this.config.stripeService : this.config.paypalService;

    if (!service) {
      throw new Error(`${provider} service not configured`);
    }

    let refund: Refund;

    if (provider === 'stripe') {
      refund = await service.createRefund({
        paymentIntentId: params.paymentIntentId,
        amount: params.amount,
        reason: params.reason,
        reasonDescription: params.reasonDescription,
        metadata: params.metadata,
      });
    } else {
      // PayPal requires capture ID instead of payment intent ID
      // In a real implementation, you'd need to fetch the capture ID
      throw new Error('PayPal refund requires capture ID - not implemented');
    }

    // If partial refund, add additional fields
    if (params.amount !== undefined) {
      return {
        ...refund,
        originalAmount: params.amount, // This should be the original payment amount
        remainingAmount: 0, // This should be calculated
      } as PartialRefund;
    }

    return refund;
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string, provider?: 'stripe' | 'paypal'): Promise<Refund> {
    const selectedProvider = provider || this.config.defaultProvider;
    const service = selectedProvider === 'stripe' ? this.config.stripeService : this.config.paypalService;

    if (!service) {
      throw new Error(`${selectedProvider} service not configured`);
    }

    return await service.getRefund(refundId);
  }

  /**
   * Calculate refundable amount
   */
  calculateRefundableAmount(
    paymentIntent: PaymentIntent,
    existingRefunds: Refund[]
  ): number {
    const totalRefunded = existingRefunds.reduce((sum, r) => sum + r.amount, 0);
    return Math.max(0, paymentIntent.amount - totalRefunded);
  }

  /**
   * Check if payment can be refunded
   */
  canRefund(paymentIntent: PaymentIntent, existingRefunds: Refund[]): {
    canRefund: boolean;
    refundableAmount: number;
    reason?: string;
  } {
    if (paymentIntent.status !== 'succeeded') {
      return {
        canRefund: false,
        refundableAmount: 0,
        reason: `Payment status is ${paymentIntent.status}, not succeeded`,
      };
    }

    const refundableAmount = this.calculateRefundableAmount(paymentIntent, existingRefunds);

    if (refundableAmount <= 0) {
      return {
        canRefund: false,
        refundableAmount: 0,
        reason: 'Payment has already been fully refunded',
      };
    }

    return {
      canRefund: true,
      refundableAmount,
    };
  }

  /**
   * Create partial refund
   */
  async createPartialRefund(params: CreateRefundParams): Promise<PartialRefund> {
    if (!this.config.allowPartialRefunds) {
      throw new Error('Partial refunds are not allowed');
    }

    if (!params.amount) {
      throw new Error('Amount is required for partial refund');
    }

    const refund = await this.createRefund(params) as PartialRefund;
    
    // In a real implementation, you'd fetch the payment intent to get original amount
    // and calculate remaining amount
    return refund;
  }

  /**
   * Create full refund
   */
  async createFullRefund(params: Omit<CreateRefundParams, 'amount'>): Promise<Refund> {
    const refund = await this.createRefund(params);
    return refund;
  }

  /**
   * Batch refund multiple payments
   */
  async batchRefund(params: Array<CreateRefundParams>): Promise<Array<Refund | PartialRefund>> {
    const results: Array<Refund | PartialRefund> = [];

    for (const refundParams of params) {
      try {
        const refund = await this.createRefund(refundParams);
        results.push(refund);
      } catch (error) {
        console.error(`Failed to refund payment ${refundParams.paymentIntentId}:`, error);
        // Continue with other refunds even if one fails
      }
    }

    return results;
  }

  /**
   * Get refund statistics
   */
  getRefundStatistics(refunds: Refund[]): {
    totalRefunds: number;
    totalAmount: number;
    byReason: Record<RefundReason, number>;
    byStatus: Record<RefundStatus, number>;
  } {
    const byReason: Record<RefundReason, number> = {
      duplicate: 0,
      fraudulent: 0,
      requested_by_customer: 0,
      expired_uncaptured_charge: 0,
      product_unacceptable: 0,
      service_unacceptable: 0,
      other: 0,
    };

    const byStatus: Record<RefundStatus, number> = {
      pending: 0,
      succeeded: 0,
      failed: 0,
      canceled: 0,
    };

    for (const refund of refunds) {
      byReason[refund.reason]++;
      byStatus[refund.status]++;
    }

    return {
      totalRefunds: refunds.length,
      totalAmount: refunds.reduce((sum, r) => sum + r.amount, 0),
      byReason,
      byStatus,
    };
  }

  /**
   * Format refund for display
   */
  formatRefund(refund: Refund): string {
    const lines: string[] = [
      `Refund ID: ${refund.id}`,
      `Provider: ${refund.provider}`,
      `Payment Intent: ${refund.paymentIntentId}`,
      `Amount: ${refund.amount.toFixed(2)} ${refund.currency}`,
      `Status: ${refund.status}`,
      `Reason: ${refund.reason}`,
    ];

    if (refund.reasonDescription) {
      lines.push(`Description: ${refund.reasonDescription}`);
    }

    if (refund.processedAt) {
      lines.push(`Processed At: ${refund.processedAt.toISOString()}`);
    }

    if (refund.failureCode) {
      lines.push(`Failure Code: ${refund.failureCode}`);
      lines.push(`Failure Message: ${refund.failureMessage}`);
    }

    return lines.join('\n');
  }

  /**
   * Track refund for analytics
   */
  trackRefund(refund: Refund, additionalData?: Record<string, unknown>): void {
    // In a real implementation, this would send refund data to analytics
    console.log('Tracking refund:', {
      refundId: refund.id,
      amount: refund.amount,
      reason: refund.reason,
      status: refund.status,
      ...additionalData,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { RefundConfig, CreateRefundParams, RefundValidationResult };
