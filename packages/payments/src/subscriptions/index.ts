/**
 * @aether/payments - Subscription Payment Management
 * 
 * Handle subscription payments, recurring billing, and payment method management
 * 
 * @version 1.0.0
 */

import type {
  PaymentIntent,
  SubscriptionPayment,
  PaymentMethodSetup,
  PaymentMethodInfo,
} from '../types/index.js';
import { PaymentStatusSchema } from '../schemas/index.js';

// =============================================================================
// SUBSCRIPTION PAYMENT INTERFACE
// =============================================================================

export interface SubscriptionPaymentConfig {
  stripeService?: any;
  paypalService?: any;
  defaultProvider: 'stripe' | 'paypal';
}

export interface CreateSubscriptionPaymentParams {
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  provider?: 'stripe' | 'paypal';
  period: {
    start: Date;
    end: Date;
  };
  description?: string;
  metadata?: Record<string, string>;
}

export interface RetryPaymentParams {
  subscriptionPaymentId: string;
  paymentMethodId?: string;
  maxRetries?: number;
}

// =============================================================================
// SUBSCRIPTION PAYMENT SERVICE CLASS
// =============================================================================

export class SubscriptionPaymentService {
  private config: SubscriptionPaymentConfig;

  constructor(config: SubscriptionPaymentConfig) {
    this.config = config;
  }

  /**
   * Create a subscription payment
   */
  async createSubscriptionPayment(
    params: CreateSubscriptionPaymentParams
  ): Promise<SubscriptionPayment> {
    const provider = params.provider || this.config.defaultProvider;
    const service = provider === 'stripe' ? this.config.stripeService : this.config.paypalService;

    if (!service) {
      throw new Error(`${provider} service not configured`);
    }

    let paymentIntent: PaymentIntent;

    if (provider === 'stripe') {
      paymentIntent = await service.createPaymentIntent({
        amount: params.amount,
        currency: params.currency,
        customerId: params.customerId,
        paymentMethodId: params.paymentMethodId,
        description: params.description,
        metadata: {
          ...params.metadata,
          subscriptionId: params.subscriptionId,
        },
        confirm: true,
        offSession: true,
      });
    } else {
      // PayPal order creation
      paymentIntent = await service.createOrder({
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        customId: params.subscriptionId,
        metadata: params.metadata,
      });
    }

    return {
      id: paymentIntent.id,
      subscriptionId: params.subscriptionId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      period: params.period,
      createdAt: new Date(),
    };
  }

  /**
   * Retry a failed subscription payment
   */
  async retryPayment(params: RetryPaymentParams): Promise<SubscriptionPayment> {
    // In a real implementation, this would:
    // 1. Fetch the original payment details
    // 2. Attempt to charge again with the same or new payment method
    // 3. Update the payment status
    
    throw new Error('Retry payment not implemented - requires database integration');
  }

  /**
   * Setup payment method for future use
   */
  async setupPaymentMethod(params: {
    customerId: string;
    paymentMethodParams: any;
    provider?: 'stripe' | 'paypal';
  }): Promise<PaymentMethodSetup> {
    const provider = params.provider || this.config.defaultProvider;
    const service = provider === 'stripe' ? this.config.stripeService : this.config.paypalService;

    if (!service) {
      throw new Error(`${provider} service not configured`);
    }

    if (provider === 'stripe') {
      return await service.createSetupIntent({
        customerId: params.customerId,
        paymentMethodTypes: ['card'],
      });
    } else {
      // PayPal doesn't have setup intents in the same way
      // This would be handled differently
      throw new Error('PayPal setup not implemented');
    }
  }

  /**
   * Get customer's payment methods
   */
  async getPaymentMethods(
    customerId: string,
    provider?: 'stripe' | 'paypal'
  ): Promise<PaymentMethodInfo[]> {
    const selectedProvider = provider || this.config.defaultProvider;
    const service = selectedProvider === 'stripe' ? this.config.stripeService : this.config.paypalService;

    if (!service) {
      throw new Error(`${selectedProvider} service not configured`);
    }

    if (selectedProvider === 'stripe') {
      return await service.listPaymentMethods(customerId, 'card');
    } else {
      // PayPal payment methods are handled differently
      throw new Error('PayPal payment methods not implemented');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    provider?: 'stripe' | 'paypal'
  ): Promise<void> {
    const selectedProvider = provider || this.config.defaultProvider;
    
    // This would update the customer's default payment method in the database
    // and optionally in the payment provider
    throw new Error('Set default payment method not implemented - requires database integration');
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(
    paymentMethodId: string,
    provider?: 'stripe' | 'paypal'
  ): Promise<void> {
    const selectedProvider = provider || this.config.defaultProvider;
    const service = selectedProvider === 'stripe' ? this.config.stripeService : this.config.paypalService;

    if (!service) {
      throw new Error(`${selectedProvider} service not configured`);
    }

    if (selectedProvider === 'stripe') {
      await service.detachPaymentMethod(paymentMethodId);
    } else {
      throw new Error('PayPal payment method removal not implemented');
    }
  }

  /**
   * Calculate prorated amount for plan changes
   */
  calculateProratedAmount(params: {
    currentPlanPrice: number;
    newPlanPrice: number;
    daysRemaining: number;
    daysInPeriod: number;
  }): number {
    const dailyRate = (params.newPlanPrice - params.currentPlanPrice) / params.daysInPeriod;
    return Math.abs(dailyRate * params.daysRemaining);
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(subscriptionPaymentId: string): Promise<{
    shouldRetry: boolean;
    retryDate?: Date;
    dunningLevel: number;
  }> {
    // This would implement dunning management logic
    // Based on the number of failed attempts, determine:
    // - Whether to retry
    // - When to retry
    // - What dunning level to set
    
    return {
      shouldRetry: true,
      retryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Retry in 24 hours
      dunningLevel: 1,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SubscriptionPaymentConfig, CreateSubscriptionPaymentParams, RetryPaymentParams };
