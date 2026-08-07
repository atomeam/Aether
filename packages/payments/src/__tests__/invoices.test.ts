/**
 * @aether/payments - Invoice Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InvoiceService } from '../invoices/index.js';

describe('InvoiceService', () => {
  let invoiceService: InvoiceService;

  beforeEach(() => {
    invoiceService = new InvoiceService({
      defaultCurrency: 'USD',
      taxRate: 0.1,
      invoicePrefix: 'INV',
      invoiceNumberLength: 6,
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate invoice numbers with prefix', () => {
      const number1 = invoiceService['generateInvoiceNumber']();
      const number2 = invoiceService['generateInvoiceNumber']();
      
      expect(number1).toBe('INV-000001');
      expect(number2).toBe('INV-000002');
    });

    it('should use custom prefix', () => {
      const customService = new InvoiceService({
        defaultCurrency: 'USD',
        invoicePrefix: 'BILL',
      });
      const number = customService['generateInvoiceNumber']();
      
      expect(number).toBe('BILL-000001');
    });
  });

  describe('createInvoice', () => {
    it('should create a valid invoice', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 2,
            unitPrice: 50,
            amount: 100,
          },
        ],
      });

      expect(invoice.id).toBeDefined();
      expect(invoice.number).toMatch(/^INV-\d{6}$/);
      expect(invoice.customerId).toBe('cus_123');
      expect(invoice.status).toBe('draft');
      expect(invoice.subtotal).toBe(100);
      expect(invoice.tax).toBe(10);
      expect(invoice.total).toBe(110);
      expect(invoice.lineItems).toHaveLength(1);
    });

    it('should calculate tax correctly', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
        taxRate: 0.2,
      });

      expect(invoice.subtotal).toBe(100);
      expect(invoice.tax).toBe(20);
      expect(invoice.total).toBe(120);
    });

    it('should apply discount', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
        discount: 10,
      });

      expect(invoice.subtotal).toBe(100);
      expect(invoice.tax).toBe(10);
      expect(invoice.discount).toBe(10);
      expect(invoice.total).toBe(100);
    });

    it('should handle multiple line items', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 2,
            unitPrice: 50,
            amount: 100,
          },
          {
            description: 'Product B',
            quantity: 1,
            unitPrice: 75,
            amount: 75,
          },
        ],
      });

      expect(invoice.subtotal).toBe(175);
      expect(invoice.tax).toBe(17.5);
      expect(invoice.total).toBe(192.5);
      expect(invoice.lineItems).toHaveLength(2);
    });
  });

  describe('addLineItem', () => {
    it('should add line item to invoice', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      });

      const updatedInvoice = invoiceService.addLineItem(invoice, {
        description: 'Product B',
        quantity: 1,
        unitPrice: 50,
        
      });

      expect(updatedInvoice.lineItems).toHaveLength(2);
      expect(updatedInvoice.subtotal).toBe(150);
      expect(updatedInvoice.total).toBe(165);
    });

    it('should recalculate totals after adding line item', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [],
      });

      const updatedInvoice = invoiceService.addLineItem(invoice, {
        description: 'Product A',
        quantity: 2,
        unitPrice: 25,
        
      });

      expect(updatedInvoice.subtotal).toBe(50);
      expect(updatedInvoice.tax).toBe(5);
      expect(updatedInvoice.total).toBe(55);
    });
  });

  describe('removeLineItem', () => {
    it('should remove line item from invoice', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
          {
            description: 'Product B',
            quantity: 1,
            unitPrice: 50,
            
          },
        ],
      });

      const lineItemId = invoice.lineItems[0].id;
      const updatedInvoice = invoiceService.removeLineItem(invoice, lineItemId);

      expect(updatedInvoice.lineItems).toHaveLength(1);
      expect(updatedInvoice.subtotal).toBe(50);
      expect(updatedInvoice.total).toBe(55);
    });
  });

  describe('finalizeInvoice', () => {
    it('should change status from draft to open', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      });

      const finalizedInvoice = invoiceService.finalizeInvoice(invoice);

      expect(finalizedInvoice.status).toBe('open');
    });

    it('should throw error for non-draft invoice', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [],
      });

      const finalizedInvoice = invoiceService.finalizeInvoice(invoice);

      expect(() => invoiceService.finalizeInvoice(finalizedInvoice)).toThrow();
    });
  });

  describe('markInvoiceAsPaid', () => {
    it('should mark invoice as paid when fully paid', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      });

      const paidInvoice = invoiceService.markInvoiceAsPaid(invoice, 110);

      expect(paidInvoice.status).toBe('paid');
      expect(paidInvoice.amountPaid).toBe(110);
      expect(paidInvoice.amountRemaining).toBe(0);
      expect(paidInvoice.paidAt).toBeDefined();
    });

    it('should handle partial payment', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      });

      const partiallyPaidInvoice = invoiceService.markInvoiceAsPaid(invoice, 50);

      expect(partiallyPaidInvoice.status).toBe('open');
      expect(partiallyPaidInvoice.amountPaid).toBe(50);
      expect(partiallyPaidInvoice.amountRemaining).toBe(60);
    });
  });

  describe('voidInvoice', () => {
    it('should void a draft invoice', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [],
      });

      const voidedInvoice = invoiceService.voidInvoice(invoice, 'Customer cancelled');

      expect(voidedInvoice.status).toBe('void');
      expect(voidedInvoice.voidedAt).toBeDefined();
      expect(voidedInvoice.description).toBe('Customer cancelled');
    });

    it('should throw error for paid invoice', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [],
      });

      const paidInvoice = invoiceService.markInvoiceAsPaid(invoice, 110);

      expect(() => invoiceService.voidInvoice(paidInvoice)).toThrow();
    });
  });

  describe('validateInvoice', () => {
    it('should validate a correct invoice', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
      });

      const validation = invoiceService.validateInvoice(invoice);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invoice with no line items', async () => {
      const invoice = await invoiceService.createInvoice({
        customerId: 'cus_123',
        type: 'one_time',
        currency: 'USD',
        lineItems: [],
      });

      const validation = invoiceService.validateInvoice(invoice);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invoice must have at least one line item');
    });
  });

  describe('generateSubscriptionInvoice', () => {
    it('should generate subscription invoice', async () => {
      const invoice = await invoiceService.generateSubscriptionInvoice({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        planName: 'Pro Plan',
        planPrice: 100,
        currency: 'USD',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        },
        taxRate: 0.1,
      });

      expect(invoice.type).toBe('subscription');
      expect(invoice.subscriptionId).toBe('sub_123');
      expect(invoice.lineItems).toHaveLength(1);
      expect(invoice.lineItems[0].description).toContain('Pro Plan');
      expect(invoice.total).toBe(110);
    });

    it('should include prorated amount', async () => {
      const invoice = await invoiceService.generateSubscriptionInvoice({
        customerId: 'cus_123',
        subscriptionId: 'sub_123',
        planName: 'Pro Plan',
        planPrice: 100,
        currency: 'USD',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-02-01'),
        },
        proratedAmount: 25,
        taxRate: 0.1,
      });

      expect(invoice.lineItems).toHaveLength(2);
      expect(invoice.lineItems[1].description).toBe('Prorated adjustment');
      expect(invoice.total).toBe(137.5); // (100 + 25) * 1.1
    });
  });

  describe('generateOneTimeInvoice', () => {
    it('should generate one-time invoice', async () => {
      const invoice = await invoiceService.generateOneTimeInvoice({
        customerId: 'cus_123',
        description: 'One-time purchase',
        
        currency: 'USD',
        taxRate: 0.1,
      });

      expect(invoice.type).toBe('one_time');
      expect(invoice.lineItems).toHaveLength(1);
      expect(invoice.lineItems[0].description).toBe('One-time purchase');
      expect(invoice.total).toBe(55);
    });
  });
});
