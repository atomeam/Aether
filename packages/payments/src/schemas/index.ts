/**
 * @aether/payments - Zod Schemas
 * 
 * Runtime validation schemas for all payment types
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const PaymentProviderSchema = z.enum(['stripe', 'paypal', 'manual']);

export const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'canceled',
  'refunded',
  'partially_refunded',
]);

export const PaymentMethodSchema = z.enum([
  'card',
  'bank_account',
  'paypal',
  'sepa_debit',
  'ideal',
  'sofort',
  'bancontact',
  'giropay',
  'eps',
  'p24',
  'alipay',
  'wechat_pay',
  'klarna',
  'affirm',
  'afterpay_clearpay',
  'grabpay',
  'oxxo',
  'boleto',
  'link',
  'us_bank_account',
]);

export const CardBrandSchema = z.enum([
  'visa',
  'mastercard',
  'amex',
  'discover',
  'jcb',
  'unionpay',
  'diners_club',
  'unknown',
]);

export const CurrencySchema = z.enum([
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK',
  'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'BRL', 'MXN',
  'COP', 'CLP', 'PEN', 'ARS', 'INR', 'SGD', 'HKD', 'CNY', 'TWD', 'KRW',
  'THB', 'IDR', 'MYR', 'PHP', 'VND', 'ZAR', 'NGN', 'EGP', 'AED', 'SAR',
  'ILS', 'NZD',
]);

export const DateSchema = z.string().or(z.date()).transform((val) => {
  if (typeof val === 'string') return new Date(val);
  return val;
});

// =============================================================================
// PAYMENT SCHEMAS
// =============================================================================

export const CardInfoSchema = z.object({
  brand: CardBrandSchema,
  last4: z.string().length(4),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2020).max(2100),
  fingerprint: z.string().optional(),
  country: z.string().length(2).optional(),
  funding: z.enum(['credit', 'debit', 'prepaid', 'unknown']).optional(),
});

export const BankAccountInfoSchema = z.object({
  bankName: z.string().optional(),
  last4: z.string().min(2).max(4),
  country: z.string().length(2).optional(),
  currency: CurrencySchema.optional(),
  routingNumber: z.string().optional(),
});

export const PayPalInfoSchema = z.object({
  email: z.string().email().optional(),
  payerId: z.string().optional(),
});

export const PaymentMethodInfoSchema = z.object({
  id: z.string().min(1),
  type: PaymentMethodSchema,
  card: CardInfoSchema.optional(),
  bankAccount: BankAccountInfoSchema.optional(),
  paypal: PayPalInfoSchema.optional(),
  isDefault: z.boolean(),
  createdAt: DateSchema,
});

export const PaymentIntentSchema = z.object({
  id: z.string().min(1),
  provider: PaymentProviderSchema,
  providerPaymentId: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  status: PaymentStatusSchema,
  customerId: z.string().min(1),
  paymentMethodId: z.string().optional(),
  paymentMethod: PaymentMethodInfoSchema.optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  completedAt: DateSchema.optional(),
  failureCode: z.string().optional(),
  failureMessage: z.string().optional(),
});

export const PaymentTransactionSchema = z.object({
  id: z.string().min(1),
  paymentIntentId: z.string().min(1),
  provider: PaymentProviderSchema,
  providerTransactionId: z.string().optional(),
  type: z.enum(['charge', 'refund', 'capture', 'void']),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  status: PaymentStatusSchema,
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  processedAt: DateSchema.optional(),
});

// =============================================================================
// INVOICE SCHEMAS
// =============================================================================

export const InvoiceStatusSchema = z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']);

export const InvoiceTypeSchema = z.enum(['subscription', 'one_time', 'usage_based', 'manual']);

export const InvoiceLineItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  taxRate: z.number().min(0).max(1).optional(),
  taxAmount: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }).optional(),
  metadata: z.record(z.string()).optional(),
});

export const InvoiceSchema = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  customerId: z.string().min(1),
  subscriptionId: z.string().optional(),
  type: InvoiceTypeSchema,
  status: InvoiceStatusSchema,
  currency: CurrencySchema,
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  amountDue: z.number().nonnegative(),
  amountPaid: z.number().nonnegative(),
  amountRemaining: z.number().nonnegative(),
  lineItems: z.array(InvoiceLineItemSchema),
  dueDate: DateSchema.optional(),
  paidAt: DateSchema.optional(),
  voidedAt: DateSchema.optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const InvoicePaymentSchema = z.object({
  id: z.string().min(1),
  invoiceId: z.string().min(1),
  paymentIntentId: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  createdAt: DateSchema,
});

// =============================================================================
// REFUND SCHEMAS
// =============================================================================

export const RefundStatusSchema = z.enum(['pending', 'succeeded', 'failed', 'canceled']);

export const RefundReasonSchema = z.enum([
  'duplicate',
  'fraudulent',
  'requested_by_customer',
  'expired_uncaptured_charge',
  'product_unacceptable',
  'service_unacceptable',
  'other',
]);

export const RefundSchema = z.object({
  id: z.string().min(1),
  provider: PaymentProviderSchema,
  providerRefundId: z.string().optional(),
  paymentIntentId: z.string().min(1),
  paymentTransactionId: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  status: RefundStatusSchema,
  reason: RefundReasonSchema,
  reasonDescription: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  processedAt: DateSchema.optional(),
  failureCode: z.string().optional(),
  failureMessage: z.string().optional(),
});

export const PartialRefundSchema = RefundSchema.extend({
  originalAmount: z.number().nonnegative(),
  remainingAmount: z.number().nonnegative(),
});

// =============================================================================
// RECONCILIATION SCHEMAS
// =============================================================================

export const ReconciliationStatusSchema = z.enum(['pending', 'matched', 'unmatched', 'discrepancy']);

export const ReconciliationDiscrepancySchema = z.object({
  id: z.string().min(1),
  type: z.enum(['missing', 'amount_mismatch', 'currency_mismatch', 'status_mismatch', 'duplicate']),
  transactionId: z.string().optional(),
  providerTransactionId: z.string().optional(),
  expectedAmount: z.number().optional(),
  actualAmount: z.number().optional(),
  expectedCurrency: CurrencySchema.optional(),
  actualCurrency: CurrencySchema.optional(),
  expectedStatus: PaymentStatusSchema.optional(),
  actualStatus: PaymentStatusSchema.optional(),
  description: z.string().min(1),
  resolved: z.boolean(),
  resolvedAt: DateSchema.optional(),
  resolutionNotes: z.string().optional(),
});

export const ReconciliationReportSchema = z.object({
  id: z.string().min(1),
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }),
  provider: PaymentProviderSchema,
  status: ReconciliationStatusSchema,
  totalTransactions: z.number().nonnegative(),
  matchedTransactions: z.number().nonnegative(),
  unmatchedTransactions: z.number().nonnegative(),
  discrepancyAmount: z.number(),
  discrepancies: z.array(ReconciliationDiscrepancySchema),
  generatedAt: DateSchema,
  completedAt: DateSchema.optional(),
});

export const ReconciliationRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  condition: z.string().min(1),
  action: z.enum(['flag', 'auto_resolve', 'manual_review']),
  enabled: z.boolean(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// =============================================================================
// SUBSCRIPTION PAYMENT SCHEMAS
// =============================================================================

export const SubscriptionPaymentSchema = z.object({
  id: z.string().min(1),
  subscriptionId: z.string().min(1),
  paymentIntentId: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  status: PaymentStatusSchema,
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }),
  createdAt: DateSchema,
});

export const PaymentMethodSetupSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  provider: PaymentProviderSchema,
  providerSetupId: z.string().optional(),
  status: z.enum(['pending', 'succeeded', 'failed']),
  createdAt: DateSchema,
  completedAt: DateSchema.optional(),
  failureCode: z.string().optional(),
  failureMessage: z.string().optional(),
});

// =============================================================================
// WEBHOOK SCHEMAS
// =============================================================================

export const WebhookEventSchema = z.object({
  id: z.string().min(1),
  provider: PaymentProviderSchema,
  type: z.string().min(1),
  data: z.unknown(),
  createdAt: DateSchema,
  processed: z.boolean(),
  processedAt: DateSchema.optional(),
  error: z.string().optional(),
});

export const WebhookConfigSchema = z.object({
  id: z.string().min(1),
  provider: PaymentProviderSchema,
  endpoint: z.string().url(),
  secret: z.string().min(1),
  events: z.array(z.string().min(1)),
  enabled: z.boolean(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// =============================================================================
// REQUEST/RESPONSE SCHEMAS
// =============================================================================

export const CreatePaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: CurrencySchema,
  customerId: z.string().min(1),
  paymentMethodId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  provider: PaymentProviderSchema.optional(),
});

export const CreateRefundSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().positive(),
  reason: RefundReasonSchema,
  reasonDescription: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export const CreateInvoiceSchema = z.object({
  customerId: z.string().min(1),
  subscriptionId: z.string().optional(),
  type: InvoiceTypeSchema,
  currency: CurrencySchema,
  lineItems: z.array(InvoiceLineItemSchema.partial({ id: true }).required({
    description: true,
    quantity: true,
    unitPrice: true,
    amount: true,
  })),
  dueDate: DateSchema.optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

// =============================================================================
// VALIDATORS
// =============================================================================

export function parsePaymentIntent(data: unknown) {
  return PaymentIntentSchema.parse(data);
}

export function safeParsePaymentIntent(data: unknown) {
  return PaymentIntentSchema.safeParse(data);
}

export function parseInvoice(data: unknown) {
  return InvoiceSchema.parse(data);
}

export function safeParseInvoice(data: unknown) {
  return InvoiceSchema.safeParse(data);
}

export function parseRefund(data: unknown) {
  return RefundSchema.parse(data);
}

export function safeParseRefund(data: unknown) {
  return RefundSchema.safeParse(data);
}

export function parseReconciliationReport(data: unknown) {
  return ReconciliationReportSchema.parse(data);
}

export function safeParseReconciliationReport(data: unknown) {
  return ReconciliationReportSchema.safeParse(data);
}

export function parseWebhookEvent(data: unknown) {
  return WebhookEventSchema.parse(data);
}

export function safeParseWebhookEvent(data: unknown) {
  return WebhookEventSchema.safeParse(data);
}
