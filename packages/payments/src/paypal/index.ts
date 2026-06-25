/**
 * @aether/payments - PayPal Integration
 * 
 * PayPal payment processing service
 * 
 * @version 1.0.0
 */

import type {
  PaymentIntent,
  PaymentMethodInfo,
  Refund,
  WebhookEvent,
} from '../types/index.js';
import {
  PaymentProviderSchema,
  PaymentStatusSchema,
  RefundStatusSchema,
} from '../schemas/index.js';

// =============================================================================
// PAYPAL CLIENT INTERFACE
// =============================================================================

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode?: 'sandbox' | 'live';
  webhookId?: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
    custom_id?: string;
  }>;
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCapture {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  create_time: string;
  update_time: string;
}

export interface PayPalRefund {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  create_time: string;
}

// =============================================================================
// PAYPAL SERVICE CLASS
// =============================================================================

export class PayPalService {
  private config: PayPalConfig;
  private paypal: any; // PayPal SDK instance (optional peer dependency)
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: PayPalConfig) {
    this.config = config;
    
    // Try to load PayPal SDK if available
    try {
      // @ts-ignore - PayPal SDK is an optional peer dependency
      const PayPal = require('@paypal/checkout-server-sdk');
      this.paypal = PayPal;
    } catch (error) {
      console.warn('PayPal SDK not installed. Install @paypal/checkout-server-sdk to use PayPalService.');
      this.paypal = null;
    }
  }

  /**
   * Check if PayPal SDK is available
   */
  isAvailable(): boolean {
    return this.paypal !== null;
  }

  /**
   * Get PayPal environment
   */
  private getEnvironment() {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    const mode = this.config.mode || 'sandbox';
    return mode === 'live' 
      ? new this.paypal.core.LiveEnvironment(this.config.clientId, this.config.clientSecret)
      : new this.paypal.core.SandboxEnvironment(this.config.clientId, this.config.clientSecret);
  }

  /**
   * Get PayPal client with authentication
   */
  private async getClient() {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return new this.paypal.core.PayPalHttpClient(this.getEnvironment());
    }

    // Refresh token
    const environment = this.getEnvironment();
    const client = new this.paypal.core.PayPalHttpClient(environment);
    
    const authRequest = new this.paypal.core.AccessTokenRequest();
    const authResponse = await client.execute(authRequest);
    
    this.accessToken = authResponse.result.access_token;
    this.tokenExpiry = Date.now() + (authResponse.result.expires_in * 1000) - 60000; // 1 minute buffer
    
    return client;
  }

  /**
   * Create an order
   */
  async createOrder(params: {
    amount: number;
    currency: string;
    description?: string;
    customId?: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    const client = await this.getClient();
    const request = new this.paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: params.currency.toUpperCase(),
          value: params.amount.toFixed(2),
        },
        description: params.description,
        custom_id: params.customId,
      }],
    });

    const response = await client.execute(request);
    const order = response.result;
    
    return this.mapPayPalOrder(order);
  }

  /**
   * Get an order
   */
  async getOrder(orderId: string): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    const client = await this.getClient();
    const request = new this.paypal.orders.OrdersGetRequest(orderId);
    const response = await client.execute(request);
    const order = response.result;
    
    return this.mapPayPalOrder(order);
  }

  /**
   * Capture payment for an order
   */
  async captureOrder(orderId: string): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    const client = await this.getClient();
    const request = new this.paypal.orders.OrdersCaptureRequest(orderId);
    request.prefer('return=representation');
    request.requestBody({});
    
    const response = await client.execute(request);
    const order = response.result;
    
    return this.mapPayPalOrder(order);
  }

  /**
   * Authorize payment for an order
   */
  async authorizeOrder(orderId: string): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    const client = await this.getClient();
    const request = new this.paypal.orders.OrdersAuthorizeRequest(orderId);
    request.prefer('return=representation');
    request.requestBody({});
    
    const response = await client.execute(request);
    const order = response.result;
    
    return this.mapPayPalOrder(order);
  }

  /**
   * Void an authorized order
   */
  async voidOrder(orderId: string): Promise<PaymentIntent> {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    const client = await this.getClient();
    const request = new this.paypal.orders.OrdersVoidRequest(orderId);
    request.prefer('return=representation');
    request.requestBody({});
    
    const response = await client.execute(request);
    const order = response.result;
    
    return this.mapPayPalOrder(order);
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    captureId: string;
    amount?: number;
    currency?: string;
    reason?: string;
    metadata?: Record<string, string>;
  }): Promise<Refund> {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    const client = await this.getClient();
    const request = new this.paypal.payments.CapturesRefundRequest(params.captureId);
    request.prefer('return=representation');
    
    const requestBody: any = {
      note_to_payer: params.reason,
    };

    if (params.amount !== undefined) {
      requestBody.amount = {
        currency_code: params.currency || 'USD',
        value: params.amount.toFixed(2),
      };
    }

    request.requestBody(requestBody);
    
    const response = await client.execute(request);
    const refund = response.result;
    
    return this.mapPayPalRefund(refund, params.captureId);
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string): Promise<Refund> {
    if (!this.isAvailable()) {
      throw new Error('PayPal SDK not available');
    }

    const client = await this.getClient();
    const request = new this.paypal.payments.RefundsGetRequest(refundId);
    const response = await client.execute(request);
    const refund = response.result;
    
    return this.mapPayPalRefund(refund, '');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    headers: Record<string, string>,
    body: string
  ): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const crypto = require('crypto');
      
      const authAlgo = headers['paypal-auth-algo'];
      const certId = headers['paypal-cert-id'];
      const transmissionId = headers['paypal-transmission-id'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const transmissionTime = headers['paypal-transmission-time'];
      const webhookId = headers['paypal-webhook-id'];
      
      if (!authAlgo || !certId || !transmissionId || !transmissionSig || !transmissionTime || !webhookId) {
        return false;
      }

      // In production, you would verify against PayPal's public certificate
      // This is a simplified version
      const expectedPayload = `${transmissionId}|${transmissionTime}|${webhookId}|${crypto.createHash('sha256').update(body).digest('hex')}`;
      const expectedSig = crypto.createHmac(authAlgo.replace('-', '').toLowerCase(), this.config.clientSecret)
        .update(expectedPayload)
        .digest('base64');
      
      return crypto.timingSafeEqual(
        Buffer.from(transmissionSig),
        Buffer.from(expectedSig)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(body: string): WebhookEvent {
    const event = JSON.parse(body);
    
    return {
      id: event.id,
      provider: 'paypal',
      type: event.event_type,
      data: event.resource,
      createdAt: new Date(event.create_time),
      processed: false,
    };
  }

  // =============================================================================
  // MAPPING HELPERS
  // =============================================================================

  private mapPayPalOrder(order: PayPalOrder): PaymentIntent {
    const status = this.mapPayPalStatus(order.status);
    const purchaseUnit = order.purchase_units[0];
    
    return {
      id: order.id,
      provider: 'paypal',
      providerPaymentId: order.id,
      amount: parseFloat(purchaseUnit.amount.value),
      currency: purchaseUnit.amount.currency_code.toUpperCase() as any,
      status,
      customerId: purchaseUnit.custom_id || '',
      description: purchaseUnit.description,
      createdAt: new Date(order.create_time),
      updatedAt: new Date(order.update_time),
      completedAt: status === 'succeeded' ? new Date(order.update_time) : undefined,
    };
  }

  private mapPayPalRefund(refund: PayPalRefund, captureId: string): Refund {
    const status = this.mapRefundStatus(refund.status);
    
    return {
      id: refund.id,
      provider: 'paypal',
      providerRefundId: refund.id,
      paymentIntentId: captureId,
      paymentTransactionId: captureId,
      amount: parseFloat(refund.amount.value),
      currency: refund.amount.currency_code.toUpperCase() as any,
      status,
      reason: 'other',
      createdAt: new Date(refund.create_time),
      processedAt: status === 'succeeded' ? new Date(refund.create_time) : undefined,
    };
  }

  private mapPayPalStatus(paypalStatus: string): any {
    const statusMap: Record<string, any> = {
      'CREATED': 'pending',
      'SAVED': 'pending',
      'APPROVED': 'processing',
      'VOIDED': 'canceled',
      'COMPLETED': 'succeeded',
      'PAYER_ACTION_REQUIRED': 'processing',
    };
    return statusMap[paypalStatus] || 'pending';
  }

  private mapRefundStatus(paypalStatus: string): any {
    const statusMap: Record<string, any> = {
      'PENDING': 'pending',
      'COMPLETED': 'succeeded',
      'FAILED': 'failed',
      'CANCELLED': 'canceled',
    };
    return statusMap[paypalStatus] || 'pending';
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { PayPalConfig };
