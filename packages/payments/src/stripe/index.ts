/**
 * @aether/payments - Stripe Integration
 * 
 * Stripe payment processing service
 * 
 * @version 1.0.0
 */

import type {
  PaymentIntent,
  PaymentMethodInfo,
  Refund,
  PaymentMethodSetup,
  WebhookEvent,
} from '../types/index.js';
import {
  PaymentProviderSchema,
  PaymentStatusSchema,
  RefundStatusSchema,
} from '../schemas/index.js';

// =============================================================================
// STRIPE CLIENT INTERFACE
// =============================================================================

export interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
  apiVersion?: string;
  maxRetries?: number;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer?: string;
  payment_method?: string;
  description?: string;
  metadata?: Record<string, string>;
  created: number;
  latest_charge?: string;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    fingerprint?: string;
    country?: string;
    funding?: string;
  };
}

export interface StripeRefund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_intent: string;
  charge?: string;
  reason?: string;
  metadata?: Record<string, string>;
  created: number;
}

// =============================================================================
// STRIPE SERVICE CLASS
// =============================================================================

export class StripeService {
  private config: StripeConfig;
  private stripe: any; // Stripe instance (optional peer dependency)

  constructor(config: StripeConfig) {
    this.config = config;
    
    // Try to load Stripe if available
    try {
      // @ts-ignore - Stripe is an optional peer dependency
      const Stripe = require('stripe');
      this.stripe = new Stripe(config.apiKey, {
        apiVersion: config.apiVersion || '2024-11-20.acacia',
        maxNetworkRetries: config.maxRetries || 3,
      });
    } catch (error) {
      console.warn('Stripe SDK not installed. Install stripe package to use StripeService.');
      this.stripe = null;
    }
  }

  /**
   * Check if Stripe SDK is available
   */
  isAvailable(): boolean {
    return this.stripe !== null;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, string>;
    confirm?: boolean;
    offSession?: boolean;
  }): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const stripeParams: any = {
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      customer: params.customerId,
      description: params.description,
      metadata: params.metadata || {},
    };

    if (params.paymentMethodId) {
      stripeParams.payment_method = params.paymentMethodId;
    }

    if (params.confirm) {
      stripeParams.confirm = true;
      stripeParams.off_session = params.offSession || false;
    }

    const stripeIntent = await this.stripe.paymentIntents.create(stripeParams);

    return this.mapStripePaymentIntent(stripeIntent);
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const stripeIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return this.mapStripePaymentIntent(stripeIntent);
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const params: any = {};
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }

    const stripeIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, params);
    return this.mapStripePaymentIntent(stripeIntent);
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const stripeIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
    return this.mapStripePaymentIntent(stripeIntent);
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(params: {
    type: string;
    card?: {
      token?: string;
      number?: string;
      exp_month?: number;
      exp_year?: number;
      cvc?: string;
    };
    billing_details?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
    };
    metadata?: Record<string, string>;
  }): Promise<PaymentMethodInfo> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const stripeMethod = await this.stripe.paymentMethods.create(params);
    return this.mapStripePaymentMethod(stripeMethod);
  }

  /**
   * Attach a payment method to a customer
   */
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<PaymentMethodInfo> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const stripeMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    return this.mapStripePaymentMethod(stripeMethod);
  }

  /**
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethodInfo> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const stripeMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
    return this.mapStripePaymentMethod(stripeMethod);
  }

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(
    customerId: string,
    type: string = 'card'
  ): Promise<PaymentMethodInfo[]> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const methods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type,
    });

    return methods.data.map((method: any) => this.mapStripePaymentMethod(method));
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    metadata?: Record<string, string>;
  }): Promise<Refund> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const stripeParams: any = {
      payment_intent: params.paymentIntentId,
      metadata: params.metadata || {},
    };

    if (params.amount) {
      stripeParams.amount = Math.round(params.amount * 100);
    }

    if (params.reason) {
      stripeParams.reason = params.reason;
    }

    const stripeRefund = await this.stripe.refunds.create(stripeParams);
    return this.mapStripeRefund(stripeRefund, params.paymentIntentId);
  }

  /**
   * Retrieve a refund
   */
  async getRefund(refundId: string): Promise<Refund> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const stripeRefund = await this.stripe.refunds.retrieve(refundId);
    return this.mapStripeRefund(stripeRefund, stripeRefund.payment_intent);
  }

  /**
   * Setup intent for saving payment methods
   */
  async createSetupIntent(params: {
    customerId: string;
    paymentMethodTypes?: string[];
    metadata?: Record<string, string>;
  }): Promise<PaymentMethodSetup> {
    if (!this.isAvailable()) {
      throw new Error('Stripe SDK not available');
    }

    const setupIntent = await this.stripe.setupIntents.create({
      customer: params.customerId,
      payment_method_types: params.paymentMethodTypes || ['card'],
      metadata: params.metadata || {},
    });

    return {
      id: setupIntent.id,
      customerId: params.customerId,
      paymentMethodId: setupIntent.payment_method as string || '',
      provider: 'stripe',
      providerSetupId: setupIntent.id,
      status: setupIntent.status === 'succeeded' ? 'succeeded' : 
              setupIntent.status === 'processing' ? 'pending' : 'failed',
      createdAt: new Date(setupIntent.created * 1000),
      completedAt: setupIntent.status === 'succeeded' ? new Date(setupIntent.created * 1000) : undefined,
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.isAvailable() || !this.config.webhookSecret) {
      return false;
    }

    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
      const digest = hmac.update(payload).digest('hex');
      
      const signatureParts = signature.split(',');
      const timestamp = signatureParts[0]?.split('=')[1];
      const expectedSignature = `t=${timestamp},v1=${digest}`;
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string): WebhookEvent {
    const event = JSON.parse(payload);
    
    return {
      id: event.id,
      provider: 'stripe',
      type: event.type,
      data: event.data,
      createdAt: new Date(event.created * 1000),
      processed: false,
    };
  }

  // =============================================================================
  // MAPPING HELPERS
  // =============================================================================

  private mapStripePaymentIntent(stripeIntent: StripePaymentIntent): PaymentIntent {
    const status = this.mapStripeStatus(stripeIntent.status);
    
    return {
      id: stripeIntent.id,
      provider: 'stripe',
      providerPaymentId: stripeIntent.id,
      amount: stripeIntent.amount / 100, // Convert from cents
      currency: stripeIntent.currency.toUpperCase() as any,
      status,
      customerId: stripeIntent.customer || '',
      paymentMethodId: stripeIntent.payment_method,
      description: stripeIntent.description,
      metadata: stripeIntent.metadata,
      createdAt: new Date(stripeIntent.created * 1000),
      updatedAt: new Date(stripeIntent.created * 1000),
      completedAt: status === 'succeeded' ? new Date(stripeIntent.created * 1000) : undefined,
    };
  }

  private mapStripePaymentMethod(stripeMethod: StripePaymentMethod): PaymentMethodInfo {
    return {
      id: stripeMethod.id,
      type: stripeMethod.type as any,
      card: stripeMethod.card ? {
        brand: stripeMethod.card.brand as any,
        last4: stripeMethod.card.last4,
        expMonth: stripeMethod.card.exp_month,
        expYear: stripeMethod.card.exp_year,
        fingerprint: stripeMethod.card.fingerprint,
        country: stripeMethod.card.country,
        funding: stripeMethod.card.funding as any,
      } : undefined,
      isDefault: false, // Stripe doesn't track this directly
      createdAt: new Date(),
    };
  }

  private mapStripeRefund(stripeRefund: StripeRefund, paymentIntentId: string): Refund {
    const status = this.mapRefundStatus(stripeRefund.status);
    
    return {
      id: stripeRefund.id,
      provider: 'stripe',
      providerRefundId: stripeRefund.id,
      paymentIntentId,
      paymentTransactionId: stripeRefund.charge,
      amount: stripeRefund.amount / 100, // Convert from cents
      currency: stripeRefund.currency.toUpperCase() as any,
      status,
      reason: (stripeRefund.reason || 'other') as any,
      metadata: stripeRefund.metadata,
      createdAt: new Date(stripeRefund.created * 1000),
      processedAt: status === 'succeeded' ? new Date(stripeRefund.created * 1000) : undefined,
    };
  }

  private mapStripeStatus(stripeStatus: string): any {
    const statusMap: Record<string, any> = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'processing',
      'processing': 'processing',
      'requires_capture': 'processing',
      'canceled': 'canceled',
      'succeeded': 'succeeded',
    };
    return statusMap[stripeStatus] || 'pending';
  }

  private mapRefundStatus(stripeStatus: string): any {
    const statusMap: Record<string, any> = {
      'pending': 'pending',
      'succeeded': 'succeeded',
      'failed': 'failed',
      'canceled': 'canceled',
    };
    return statusMap[stripeStatus] || 'pending';
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { StripeConfig };
