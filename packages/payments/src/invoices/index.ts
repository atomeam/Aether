/**
 * @aether/payments - Invoice Generation
 * 
 * Generate and manage invoices for payments and subscriptions
 * 
 * @version 1.0.0
 */

import type {
  Invoice,
  InvoiceLineItem,
  InvoicePayment,
  InvoiceStatus,
  InvoiceType,
} from '../types/index.js';
import { InvoiceSchema, InvoiceLineItemSchema } from '../schemas/index.js';

// =============================================================================
// INVOICE GENERATION INTERFACE
// =============================================================================

export interface InvoiceConfig {
  defaultCurrency: string;
  taxRate?: number;
  invoicePrefix?: string;
  invoiceNumberLength?: number;
}

export interface CreateInvoiceParams {
  customerId: string;
  subscriptionId?: string;
  type: InvoiceType;
  currency: string;
  lineItems: Omit<InvoiceLineItem, 'id'>[];
  dueDate?: Date;
  description?: string;
  metadata?: Record<string, string>;
  taxRate?: number;
  discount?: number;
  discountDescription?: string;
}

export interface AddLineItemParams {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discountAmount?: number;
  period?: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, string>;
}

// =============================================================================
// INVOICE SERVICE CLASS
// =============================================================================

export class InvoiceService {
  private config: InvoiceConfig;
  private invoiceCounter: number = 1;

  constructor(config: InvoiceConfig) {
    this.config = config;
  }

  /**
   * Generate a unique invoice number
   */
  generateInvoiceNumber(): string {
    const prefix = this.config.invoicePrefix || 'INV';
    const length = this.config.invoiceNumberLength || 6;
    const number = this.invoiceCounter.toString().padStart(length, '0');
    this.invoiceCounter++;
    return `${prefix}-${number}`;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
    const lineItems: InvoiceLineItem[] = params.lineItems.map((item, index) => ({
      id: `line-${Date.now()}-${index}`,
      ...item,
    }));

    const subtotal = this.calculateSubtotal(lineItems);
    const tax = this.calculateTax(subtotal, params.taxRate || this.config.taxRate || 0);
    const discount = params.discount || 0;
    const total = subtotal + tax - discount;

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: this.generateInvoiceNumber(),
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      type: params.type,
      status: 'draft',
      currency: params.currency as any,
      subtotal,
      tax,
      discount,
      total,
      amountDue: total,
      amountPaid: 0,
      amountRemaining: total,
      lineItems,
      dueDate: params.dueDate,
      description: params.description,
      metadata: params.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return invoice;
  }

  /**
   * Add a line item to an invoice
   */
  addLineItem(invoice: Invoice, params: AddLineItemParams): Invoice {
    const lineItem: InvoiceLineItem = {
      id: `line-${Date.now()}`,
      description: params.description,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      amount: params.quantity * params.unitPrice,
      taxRate: params.taxRate,
      taxAmount: params.taxRate ? params.quantity * params.unitPrice * params.taxRate : undefined,
      discountAmount: params.discountAmount,
      period: params.period,
      metadata: params.metadata,
    };

    const updatedInvoice = {
      ...invoice,
      lineItems: [...invoice.lineItems, lineItem],
      updatedAt: new Date(),
    };

    // Recalculate totals
    const subtotal = this.calculateSubtotal(updatedInvoice.lineItems);
    const tax = this.calculateTax(subtotal, this.config.taxRate || 0);
    const total = subtotal + tax - updatedInvoice.discount;

    return {
      ...updatedInvoice,
      subtotal,
      tax,
      total,
      amountDue: total - updatedInvoice.amountPaid,
      amountRemaining: total - updatedInvoice.amountPaid,
    };
  }

  /**
   * Remove a line item from an invoice
   */
  removeLineItem(invoice: Invoice, lineItemId: string): Invoice {
    const updatedLineItems = invoice.lineItems.filter(item => item.id !== lineItemId);
    
    const updatedInvoice = {
      ...invoice,
      lineItems: updatedLineItems,
      updatedAt: new Date(),
    };

    // Recalculate totals
    const subtotal = this.calculateSubtotal(updatedInvoice.lineItems);
    const tax = this.calculateTax(subtotal, this.config.taxRate || 0);
    const total = subtotal + tax - updatedInvoice.discount;

    return {
      ...updatedInvoice,
      subtotal,
      tax,
      total,
      amountDue: total - updatedInvoice.amountPaid,
      amountRemaining: total - updatedInvoice.amountPaid,
    };
  }

  /**
   * Finalize an invoice (change status from draft to open)
   */
  finalizeInvoice(invoice: Invoice): Invoice {
    if (invoice.status !== 'draft') {
      throw new Error('Can only finalize draft invoices');
    }

    return {
      ...invoice,
      status: 'open',
      updatedAt: new Date(),
    };
  }

  /**
   * Mark invoice as paid
   */
  markInvoiceAsPaid(invoice: Invoice, paymentAmount: number): Invoice {
    const newAmountPaid = invoice.amountPaid + paymentAmount;
    const newAmountRemaining = invoice.amountRemaining - paymentAmount;

    let newStatus: InvoiceStatus = invoice.status;
    if (newAmountRemaining <= 0) {
      newStatus = 'paid';
    }

    return {
      ...invoice,
      amountPaid: newAmountPaid,
      amountRemaining: Math.max(0, newAmountRemaining),
      amountDue: Math.max(0, newAmountRemaining),
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date() : invoice.paidAt,
      updatedAt: new Date(),
    };
  }

  /**
   * Void an invoice
   */
  voidInvoice(invoice: Invoice, reason?: string): Invoice {
    if (invoice.status === 'paid' || invoice.status === 'void') {
      throw new Error('Cannot void paid or already voided invoices');
    }

    return {
      ...invoice,
      status: 'void',
      voidedAt: new Date(),
      description: reason || invoice.description,
      updatedAt: new Date(),
    };
  }

  /**
   * Add a payment to an invoice
   */
  addPayment(invoice: Invoice, paymentIntentId: string, amount: number): Invoice {
    const payment: InvoicePayment = {
      id: `payment-${Date.now()}`,
      invoiceId: invoice.id,
      paymentIntentId,
      amount,
      currency: invoice.currency,
      createdAt: new Date(),
    };

    return this.markInvoiceAsPaid(invoice, amount);
  }

  /**
   * Calculate subtotal from line items
   */
  private calculateSubtotal(lineItems: InvoiceLineItem[]): number {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  }

  /**
   * Calculate tax amount
   */
  private calculateTax(subtotal: number, taxRate: number): number {
    return subtotal * taxRate;
  }

  /**
   * Generate invoice for subscription
   */
  generateSubscriptionInvoice(params: {
    customerId: string;
    subscriptionId: string;
    planName: string;
    planPrice: number;
    currency: string;
    period: {
      start: Date;
      end: Date;
    };
    taxRate?: number;
    proratedAmount?: number;
    discount?: number;
  }): Promise<Invoice> {
    const lineItems: Omit<InvoiceLineItem, 'id'>[] = [
      {
        description: `${params.planName} - ${params.period.start.toLocaleDateString()} to ${params.period.end.toLocaleDateString()}`,
        quantity: 1,
        unitPrice: params.planPrice,
        amount: params.planPrice,
        taxRate: params.taxRate,
        taxAmount: params.taxRate ? params.planPrice * params.taxRate : undefined,
        period: params.period,
      },
    ];

    // Add prorated amount if applicable
    if (params.proratedAmount && params.proratedAmount > 0) {
      lineItems.push({
        description: 'Prorated adjustment',
        quantity: 1,
        unitPrice: params.proratedAmount,
        amount: params.proratedAmount,
        taxRate: params.taxRate,
        taxAmount: params.taxRate ? params.proratedAmount * params.taxRate : undefined,
      });
    }

    return this.createInvoice({
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      type: 'subscription',
      currency: params.currency,
      lineItems,
      taxRate: params.taxRate,
      discount: params.discount,
      description: `Subscription invoice for ${params.planName}`,
    });
  }

  /**
   * Generate one-time invoice
   */
  generateOneTimeInvoice(params: {
    customerId: string;
    description: string;
    amount: number;
    currency: string;
    taxRate?: number;
    discount?: number;
  }): Promise<Invoice> {
    const lineItems: Omit<InvoiceLineItem, 'id'>[] = [
      {
        description: params.description,
        quantity: 1,
        unitPrice: params.amount,
        amount: params.amount,
        taxRate: params.taxRate,
        taxAmount: params.taxRate ? params.amount * params.taxRate : undefined,
      },
    ];

    return this.createInvoice({
      customerId: params.customerId,
      type: 'one_time',
      currency: params.currency,
      lineItems,
      taxRate: params.taxRate,
      discount: params.discount,
    });
  }

  /**
   * Validate invoice
   */
  validateInvoice(invoice: Invoice): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (invoice.lineItems.length === 0) {
      errors.push('Invoice must have at least one line item');
    }

    if (invoice.total < 0) {
      errors.push('Invoice total cannot be negative');
    }

    if (invoice.amountPaid > invoice.total) {
      errors.push('Amount paid cannot exceed total');
    }

    if (invoice.status === 'paid' && invoice.amountRemaining > 0) {
      errors.push('Paid invoice cannot have remaining amount');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format invoice for display
   */
  formatInvoice(invoice: Invoice): string {
    const lines: string[] = [
      `Invoice: ${invoice.number}`,
      `Status: ${invoice.status}`,
      `Customer: ${invoice.customerId}`,
      '',
      'Line Items:',
      ...invoice.lineItems.map(item => 
        `  ${item.description} - ${item.quantity} x ${item.unitPrice.toFixed(2)} = ${item.amount.toFixed(2)}`
      ),
      '',
      `Subtotal: ${invoice.subtotal.toFixed(2)} ${invoice.currency}`,
      `Tax: ${invoice.tax.toFixed(2)} ${invoice.currency}`,
      `Discount: ${invoice.discount.toFixed(2)} ${invoice.currency}`,
      `Total: ${invoice.total.toFixed(2)} ${invoice.currency}`,
      `Amount Paid: ${invoice.amountPaid.toFixed(2)} ${invoice.currency}`,
      `Amount Due: ${invoice.amountDue.toFixed(2)} ${invoice.currency}`,
    ];

    if (invoice.dueDate) {
      lines.push(`Due Date: ${invoice.dueDate.toISOString()}`);
    }

    return lines.join('\n');
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { InvoiceConfig, CreateInvoiceParams, AddLineItemParams };
