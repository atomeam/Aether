/**
 * @aether/payments - Schema Tests
 */

import { describe, it, expect } from 'vitest';
import {
  PaymentIntentSchema,
  InvoiceSchema,
  RefundSchema,
  ReconciliationReportSchema,
  CreatePaymentIntentSchema,
  CreateRefundSchema,
  parsePaymentIntent,
  safeParsePaymentIntent,
  parseInvoice,
  safeParseInvoice,
} from '../schemas/index.js';

describe('Payment Schemas', () => {
  describe('PaymentIntentSchema', () => {
    it('should validate a valid payment intent', () => {
      const validPaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        providerPaymentId: 'pi_stripe_123',
        amount: 100.50,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        description: 'Test payment',
        metadata: { orderId: 'order_123' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-01'),
      };

      const result = PaymentIntentSchema.parse(validPaymentIntent);
      expect(result).toEqual(validPaymentIntent);
    });

    it('should reject invalid payment intent', () => {
      const invalidPaymentIntent = {
        id: 'pi_123',
        provider: 'invalid_provider',
        amount: -100,
        currency: 'INVALID',
        status: 'invalid_status',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => PaymentIntentSchema.parse(invalidPaymentIntent)).toThrow();
    });

    it('should accept optional fields', () => {
      const minimalPaymentIntent = {
        id: 'pi_123',
        provider: 'paypal',
        amount: 50,
        currency: 'EUR',
        status: 'pending',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = PaymentIntentSchema.parse(minimalPaymentIntent);
      expect(result).toEqual(minimalPaymentIntent);
    });
  });

  describe('InvoiceSchema', () => {
    it('should validate a valid invoice', () => {
      const validInvoice = {
        id: 'inv_123',
        number: 'INV-000001',
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        type: 'subscription',
        status: 'open',
        currency: 'USD',
        subtotal: 100,
        tax: 10,
        discount: 0,
        total: 110,
        amountDue: 110,
        amountPaid: 0,
        amountRemaining: 110,
        lineItems: [
          {
            id: 'line_1',
            description: 'Pro Plan',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
            taxRate: 0.1,
            taxAmount: 10,
          },
        ],
        dueDate: new Date('2024-02-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result = InvoiceSchema.parse(validInvoice);
      expect(result).toEqual(validInvoice);
    });

    it('should reject invoice with negative amounts', () => {
      const invalidInvoice = {
        id: 'inv_123',
        number: 'INV-000001',
        customerId: 'cus_123',
        type: 'one_time',
        status: 'draft',
        currency: 'USD',
        subtotal: -100,
        tax: 10,
        discount: 0,
        total: -90,
        amountDue: -90,
        amountPaid: 0,
        amountRemaining: -90,
        lineItems: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => InvoiceSchema.parse(invalidInvoice)).toThrow();
    });
  });

  describe('RefundSchema', () => {
    it('should validate a valid refund', () => {
      const validRefund = {
        id: 're_123',
        provider: 'stripe',
        providerRefundId: 're_stripe_123',
        paymentIntentId: 'pi_123',
        paymentTransactionId: 'ch_123',
        amount: 50,
        currency: 'USD',
        status: 'succeeded',
        reason: 'requested_by_customer',
        reasonDescription: 'Customer requested refund',
        metadata: { reason: 'dissatisfied' },
        createdAt: new Date(),
        processedAt: new Date(),
      };

      const result = RefundSchema.parse(validRefund);
      expect(result).toEqual(validRefund);
    });

    it('should reject refund with invalid reason', () => {
      const invalidRefund = {
        id: 're_123',
        provider: 'stripe',
        paymentIntentId: 'pi_123',
        amount: 50,
        currency: 'USD',
        status: 'pending',
        reason: 'invalid_reason',
        createdAt: new Date(),
      };

      expect(() => RefundSchema.parse(invalidRefund)).toThrow();
    });
  });

  describe('ReconciliationReportSchema', () => {
    it('should validate a valid reconciliation report', () => {
      const validReport = {
        id: 'recon_123',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        provider: 'stripe',
        status: 'matched',
        totalTransactions: 100,
        matchedTransactions: 100,
        unmatchedTransactions: 0,
        discrepancyAmount: 0,
        discrepancies: [],
        generatedAt: new Date(),
        completedAt: new Date(),
      };

      const result = ReconciliationReportSchema.parse(validReport);
      expect(result).toEqual(validReport);
    });

    it('should validate report with discrepancies', () => {
      const reportWithDiscrepancies = {
        id: 'recon_123',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        provider: 'stripe',
        status: 'discrepancy',
        totalTransactions: 100,
        matchedTransactions: 98,
        unmatchedTransactions: 2,
        discrepancyAmount: 10,
        discrepancies: [
          {
            id: 'disc_1',
            type: 'amount_mismatch',
            transactionId: 'tx_1',
            expectedAmount: 100,
            actualAmount: 90,
            description: 'Amount mismatch',
            resolved: false,
          },
        ],
        generatedAt: new Date(),
        completedAt: new Date(),
      };

      const result = ReconciliationReportSchema.parse(reportWithDiscrepancies);
      expect(result.discrepancies).toHaveLength(1);
    });
  });

  describe('Request Schemas', () => {
    it('should validate create payment intent request', () => {
      const validRequest = {
        amount: 100,
        currency: 'USD',
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        description: 'Test payment',
        metadata: { orderId: 'order_123' },
        provider: 'stripe',
      };

      const result = CreatePaymentIntentSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should validate create refund request', () => {
      const validRequest = {
        paymentIntentId: 'pi_123',
        amount: 50,
        reason: 'requested_by_customer',
        reasonDescription: 'Customer not satisfied',
        metadata: { supportTicket: 'ticket_123' },
      };

      const result = CreateRefundSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });
  });

  describe('Validator Functions', () => {
    it('should parse payment intent with parsePaymentIntent', () => {
      const data = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = parsePaymentIntent(data);
      expect(result).toEqual(data);
    });

    it('should throw on invalid data with parsePaymentIntent', () => {
      const invalidData = { id: 'pi_123' };
      expect(() => parsePaymentIntent(invalidData)).toThrow();
    });

    it('should return safe parse result with safeParsePaymentIntent', () => {
      const validData = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = safeParsePaymentIntent(validData);
      expect(result.success).toBe(true);
    });

    it('should return error on invalid data with safeParsePaymentIntent', () => {
      const invalidData = { id: 'pi_123' };
      const result = safeParsePaymentIntent(invalidData);
      expect(result.success).toBe(false);
    });

    it('should parse invoice with parseInvoice', () => {
      const data = {
        id: 'inv_123',
        number: 'INV-001',
        customerId: 'cus_123',
        type: 'one_time',
        status: 'draft',
        currency: 'USD',
        subtotal: 100,
        tax: 10,
        discount: 0,
        total: 110,
        amountDue: 110,
        amountPaid: 0,
        amountRemaining: 110,
        lineItems: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = parseInvoice(data);
      expect(result).toEqual(data);
    });
  });
});
