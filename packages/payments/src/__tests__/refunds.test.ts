/**
 * @aether/payments - Refund Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RefundService } from '../refunds/index.js';
import type { PaymentIntent, Refund } from '../types/index.js';

describe('RefundService', () => {
  let refundService: RefundService;

  beforeEach(() => {
    refundService = new RefundService({
      defaultProvider: 'stripe',
      allowPartialRefunds: true,
      requireReason: true,
      refundWindowDays: 30,
    });
  });

  describe('validateRefund', () => {
    it('should validate a valid refund request', async () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const validation = await refundService.validateRefund(
        {
          paymentIntentId: 'pi_123',
          amount: 50,
          reason: 'requested_by_customer',
        },
        paymentIntent
      );

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject refund for non-succeeded payment', async () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation = await refundService.validateRefund(
        {
          paymentIntentId: 'pi_123',
          amount: 50,
          reason: 'requested_by_customer',
        },
        paymentIntent
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Payment must be succeeded to refund');
    });

    it('should reject refund after window', async () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        completedAt: new Date('2023-01-01'),
      };

      const validation = await refundService.validateRefund(
        {
          paymentIntentId: 'pi_123',
          amount: 50,
          reason: 'requested_by_customer',
        },
        paymentIntent
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Refund window of 30 days has expired');
    });

    it('should reject partial refund when not allowed', async () => {
      const strictService = new RefundService({
        defaultProvider: 'stripe',
        allowPartialRefunds: false,
        requireReason: true,
      });

      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const validation = await strictService.validateRefund(
        {
          paymentIntentId: 'pi_123',
          amount: 50,
          reason: 'requested_by_customer',
        },
        paymentIntent
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Partial refunds are not allowed');
    });

    it('should reject refund exceeding payment amount', async () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const validation = await refundService.validateRefund(
        {
          paymentIntentId: 'pi_123',
          amount: 150,
          reason: 'requested_by_customer',
        },
        paymentIntent
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Refund amount (150) cannot exceed payment amount (100)');
    });

    it('should require reason when configured', async () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const validation = await refundService.validateRefund(
        {
          paymentIntentId: 'pi_123',
          amount: 50,
          reason: undefined as any,
        },
        paymentIntent
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Refund reason is required');
    });
  });

  describe('calculateRefundableAmount', () => {
    it('should calculate full refundable amount with no existing refunds', () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const refundableAmount = refundService.calculateRefundableAmount(paymentIntent, []);

      expect(refundableAmount).toBe(100);
    });

    it('should subtract existing refunds', () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const existingRefunds: Refund[] = [
        {
          id: 're_1',
          provider: 'stripe',
          paymentIntentId: 'pi_123',
          amount: 30,
          currency: 'USD',
          status: 'succeeded',
          reason: 'requested_by_customer',
          createdAt: new Date(),
          processedAt: new Date(),
        },
        {
          id: 're_2',
          provider: 'stripe',
          paymentIntentId: 'pi_123',
          amount: 20,
          currency: 'USD',
          status: 'succeeded',
          reason: 'requested_by_customer',
          createdAt: new Date(),
          processedAt: new Date(),
        },
      ];

      const refundableAmount = refundService.calculateRefundableAmount(paymentIntent, existingRefunds);

      expect(refundableAmount).toBe(50);
    });

    it('should return zero when fully refunded', () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const existingRefunds: Refund[] = [
        {
          id: 're_1',
          provider: 'stripe',
          paymentIntentId: 'pi_123',
          amount: 100,
          currency: 'USD',
          status: 'succeeded',
          reason: 'requested_by_customer',
          createdAt: new Date(),
          processedAt: new Date(),
        },
      ];

      const refundableAmount = refundService.calculateRefundableAmount(paymentIntent, existingRefunds);

      expect(refundableAmount).toBe(0);
    });
  });

  describe('canRefund', () => {
    it('should return true for refundable payment', () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const result = refundService.canRefund(paymentIntent, []);

      expect(result.canRefund).toBe(true);
      expect(result.refundableAmount).toBe(100);
    });

    it('should return false for non-succeeded payment', () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = refundService.canRefund(paymentIntent, []);

      expect(result.canRefund).toBe(false);
      expect(result.refundableAmount).toBe(0);
      expect(result.reason).toBeDefined();
    });

    it('should return false for fully refunded payment', () => {
      const paymentIntent: PaymentIntent = {
        id: 'pi_123',
        provider: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        customerId: 'cus_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const existingRefunds: Refund[] = [
        {
          id: 're_1',
          provider: 'stripe',
          paymentIntentId: 'pi_123',
          amount: 100,
          currency: 'USD',
          status: 'succeeded',
          reason: 'requested_by_customer',
          createdAt: new Date(),
          processedAt: new Date(),
        },
      ];

      const result = refundService.canRefund(paymentIntent, existingRefunds);

      expect(result.canRefund).toBe(false);
      expect(result.refundableAmount).toBe(0);
    });
  });

  describe('getRefundStatistics', () => {
    it('should calculate refund statistics', () => {
      const refunds: Refund[] = [
        {
          id: 're_1',
          provider: 'stripe',
          paymentIntentId: 'pi_1',
          amount: 50,
          currency: 'USD',
          status: 'succeeded',
          reason: 'requested_by_customer',
          createdAt: new Date(),
          processedAt: new Date(),
        },
        {
          id: 're_2',
          provider: 'stripe',
          paymentIntentId: 'pi_2',
          amount: 30,
          currency: 'USD',
          status: 'succeeded',
          reason: 'requested_by_customer',
          createdAt: new Date(),
          processedAt: new Date(),
        },
        {
          id: 're_3',
          provider: 'stripe',
          paymentIntentId: 'pi_3',
          amount: 20,
          currency: 'USD',
          status: 'pending',
          reason: 'duplicate',
          createdAt: new Date(),
        },
      ];

      const stats = refundService.getRefundStatistics(refunds);

      expect(stats.totalRefunds).toBe(3);
      expect(stats.totalAmount).toBe(100);
      expect(stats.byReason.requested_by_customer).toBe(2);
      expect(stats.byReason.duplicate).toBe(1);
      expect(stats.byStatus.succeeded).toBe(2);
      expect(stats.byStatus.pending).toBe(1);
    });
  });

  describe('formatRefund', () => {
    it('should format refund for display', () => {
      const refund: Refund = {
        id: 're_123',
        provider: 'stripe',
        paymentIntentId: 'pi_123',
        amount: 50,
        currency: 'USD',
        status: 'succeeded',
        reason: 'requested_by_customer',
        reasonDescription: 'Customer not satisfied',
        createdAt: new Date('2024-01-01'),
        processedAt: new Date('2024-01-02'),
      };

      const formatted = refundService.formatRefund(refund);

      expect(formatted).toContain('re_123');
      expect(formatted).toContain('stripe');
      expect(formatted).toContain('50.00 USD');
      expect(formatted).toContain('succeeded');
      expect(formatted).toContain('requested_by_customer');
      expect(formatted).toContain('Customer not satisfied');
    });
  });
});
