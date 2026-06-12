/**
 * @aether/billing - Zod Schemas
 * 
 * Runtime validation schemas for all billing types
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

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
// USAGE SCHEMAS
// =============================================================================

export const UsageRecordSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  subscriptionId: z.string().optional(),
  metric: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  timestamp: DateSchema,
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }),
  metadata: z.record(z.string()).optional(),
});

export const UsageMetricSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  aggregationType: z.enum(['sum', 'max', 'avg', 'last']),
  resetPeriod: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'never']),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const UsageAggregationSchema = z.object({
  customerId: z.string().min(1),
  metric: z.string().min(1),
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }),
  total: z.number().nonnegative(),
  unit: z.string().min(1),
  recordCount: z.number().nonnegative(),
  calculatedAt: DateSchema,
});

// =============================================================================
// TIERED PRICING SCHEMAS
// =============================================================================

export const PricingTierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  minQuantity: z.number().nonnegative(),
  maxQuantity: z.number().nonnegative().optional(),
  unitPrice: z.number().nonnegative(),
  currency: CurrencySchema,
  features: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const PricingPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  currency: CurrencySchema,
  billingInterval: z.enum(['monthly', 'yearly', 'weekly', 'daily']),
  tiers: z.array(PricingTierSchema),
  basePrice: z.number().nonnegative().optional(),
  trialDays: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const TieredPricingCalculationSchema = z.object({
  planId: z.string().min(1),
  quantity: z.number().nonnegative(),
  currency: CurrencySchema,
  totalAmount: z.number().nonnegative(),
  breakdown: z.array(z.object({
    tierId: z.string().min(1),
    tierName: z.string().min(1),
    quantity: z.number().nonnegative(),
    unitPrice: z.number().nonnegative(),
    amount: z.number().nonnegative(),
  })),
  calculatedAt: DateSchema,
});

// =============================================================================
// BILLING INVOICE SCHEMAS
// =============================================================================

export const BillingInvoiceStatusSchema = z.enum([
  'draft', 'pending', 'processing', 'paid', 'failed', 'void', 'refunded',
]);

export const BillingLineItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['usage', 'fixed', 'discount', 'tax']),
  description: z.string().min(1),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }).optional(),
  metric: z.string().optional(),
  tierId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export const BillingInvoiceSchema = z.object({
  id: z.string().min(1),
  invoiceNumber: z.string().min(1),
  customerId: z.string().min(1),
  subscriptionId: z.string().optional(),
  status: BillingInvoiceStatusSchema,
  currency: CurrencySchema,
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  amountDue: z.number().nonnegative(),
  amountPaid: z.number().nonnegative(),
  lineItems: z.array(BillingLineItemSchema),
  dueDate: DateSchema.optional(),
  paidAt: DateSchema.optional(),
  failedAt: DateSchema.optional(),
  voidedAt: DateSchema.optional(),
  refundedAt: DateSchema.optional(),
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }).optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// =============================================================================
// PAYMENT REMINDER SCHEMAS
// =============================================================================

export const ReminderStatusSchema = z.enum(['pending', 'sent', 'failed', 'cancelled']);

export const ReminderTriggerSchema = z.enum(['due_soon', 'overdue', 'payment_failed', 'dunning_level']);

export const PaymentReminderSchema = z.object({
  id: z.string().min(1),
  invoiceId: z.string().min(1),
  customerId: z.string().min(1),
  trigger: ReminderTriggerSchema,
  status: ReminderStatusSchema,
  scheduledFor: DateSchema,
  sentAt: DateSchema.optional(),
  failedAt: DateSchema.optional(),
  errorMessage: z.string().optional(),
  template: z.string().min(1),
  channel: z.enum(['email', 'sms', 'push', 'webhook']),
  dunningLevel: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const ReminderRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  trigger: ReminderTriggerSchema,
  offsetDays: z.number().int(),
  template: z.string().min(1),
  channel: z.enum(['email', 'sms', 'push', 'webhook']),
  enabled: z.boolean(),
  dunningLevel: z.number().int().nonnegative().optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// =============================================================================
// TAX SCHEMAS
// =============================================================================

export const TaxRateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  rate: z.number().min(0).max(1),
  type: z.enum(['vat', 'sales_tax', 'gst', 'other']),
  country: z.string().length(2).optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  appliesTo: z.array(z.string()),
  exemptCategories: z.array(z.string()).optional(),
  effectiveFrom: DateSchema,
  effectiveTo: DateSchema.optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const TaxCalculationSchema = z.object({
  customerId: z.string().min(1),
  currency: CurrencySchema,
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  breakdown: z.array(z.object({
    taxRateId: z.string().min(1),
    taxName: z.string().min(1),
    rate: z.number().min(0).max(1),
    taxableAmount: z.number().nonnegative(),
    taxAmount: z.number().nonnegative(),
  })),
  calculatedAt: DateSchema,
});

export const TaxExemptionSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  type: z.enum(['vat', 'sales_tax', 'gst', 'resale', 'non_profit', 'government']),
  certificateId: z.string().optional(),
  reason: z.string().min(1),
  effectiveFrom: DateSchema,
  effectiveTo: DateSchema.optional(),
  verified: z.boolean(),
  verifiedAt: DateSchema.optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// =============================================================================
// FINANCIAL REPORT SCHEMAS
// =============================================================================

export const ReportTypeSchema = z.enum(['revenue', 'mrr', 'arr', 'churn', 'usage', 'tax', 'aging', 'custom']);

export const ReportPeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);

export const ReportDataPointSchema = z.object({
  date: DateSchema,
  value: z.number(),
  currency: CurrencySchema,
  breakdown: z.record(z.number()).optional(),
  metadata: z.record(z.string()).optional(),
});

export const FinancialReportSchema = z.object({
  id: z.string().min(1),
  type: ReportTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }),
  granularity: ReportPeriodSchema,
  currency: CurrencySchema,
  data: z.array(ReportDataPointSchema),
  metadata: z.record(z.string()).optional(),
  generatedAt: DateSchema,
  generatedBy: z.string().min(1),
});

export const RevenueReportSchema = FinancialReportSchema.extend({
  type: z.literal('revenue'),
  data: z.array(ReportDataPointSchema.extend({
    recurring: z.number(),
    oneTime: z.number(),
    refunds: z.number(),
    net: z.number(),
  })),
});

export const MRRReportSchema = FinancialReportSchema.extend({
  type: z.literal('mrr'),
  data: z.array(ReportDataPointSchema.extend({
    newBusiness: z.number(),
    expansion: z.number(),
    contraction: z.number(),
    churn: z.number(),
    reactivation: z.number(),
    net: z.number(),
  })),
});

export const ChurnReportSchema = FinancialReportSchema.extend({
  type: z.literal('churn'),
  data: z.array(ReportDataPointSchema.extend({
    customers: z.number(),
    revenue: z.number(),
    rate: z.number(),
  })),
});

export const AgingReportSchema = FinancialReportSchema.extend({
  type: z.literal('aging'),
  data: z.array(z.object({
    bucket: z.string(),
    amount: z.number(),
    count: z.number(),
    currency: CurrencySchema,
  })),
});

// =============================================================================
// DISCOUNT SCHEMAS
// =============================================================================

export const DiscountTypeSchema = z.enum(['percentage', 'fixed', 'volume']);

export const DiscountSchema = z.object({
  id: z.string().min(1),
  code: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: DiscountTypeSchema,
  value: z.number().nonnegative(),
  currency: CurrencySchema.optional(),
  appliesTo: z.array(z.string()),
  maxUses: z.number().int().positive().optional(),
  currentUses: z.number().int().nonnegative(),
  validFrom: DateSchema,
  validTo: DateSchema.optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  firstTimeOnly: z.boolean(),
  recurring: z.boolean(),
  metadata: z.record(z.string()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const AppliedDiscountSchema = z.object({
  discountId: z.string().min(1),
  discountName: z.string().min(1),
  type: DiscountTypeSchema,
  value: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  appliedAt: DateSchema,
});

// =============================================================================
// REQUEST/RESPONSE SCHEMAS
// =============================================================================

export const CreateUsageRecordSchema = z.object({
  customerId: z.string().min(1),
  subscriptionId: z.string().optional(),
  metric: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  timestamp: DateSchema.optional().default(() => new Date()),
  metadata: z.record(z.string()).optional(),
});

export const CalculateTieredPricingSchema = z.object({
  planId: z.string().min(1),
  quantity: z.number().nonnegative(),
  currency: CurrencySchema,
});

export const CreateBillingInvoiceSchema = z.object({
  customerId: z.string().min(1),
  subscriptionId: z.string().optional(),
  currency: CurrencySchema,
  lineItems: z.array(BillingLineItemSchema.partial({ id: true }).required({
    type: true,
    description: true,
    quantity: true,
    unitPrice: true,
    amount: true,
  })),
  dueDate: DateSchema.optional(),
  period: z.object({
    start: DateSchema,
    end: DateSchema,
  }).optional(),
  metadata: z.record(z.string()).optional(),
});

export const CalculateTaxSchema = z.object({
  customerId: z.string().min(1),
  currency: CurrencySchema,
  subtotal: z.number().nonnegative(),
  lineItems: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    category: z.string().optional(),
  })).optional(),
  billingAddress: z.object({
    country: z.string().length(2),
    region: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
});

// =============================================================================
// VALIDATORS
// =============================================================================

export function parseUsageRecord(data: unknown) {
  return UsageRecordSchema.parse(data);
}

export function safeParseUsageRecord(data: unknown) {
  return UsageRecordSchema.safeParse(data);
}

export function parsePricingPlan(data: unknown) {
  return PricingPlanSchema.parse(data);
}

export function safeParsePricingPlan(data: unknown) {
  return PricingPlanSchema.safeParse(data);
}

export function parseBillingInvoice(data: unknown) {
  return BillingInvoiceSchema.parse(data);
}

export function safeParseBillingInvoice(data: unknown) {
  return BillingInvoiceSchema.safeParse(data);
}

export function parseTaxCalculation(data: unknown) {
  return TaxCalculationSchema.parse(data);
}

export function safeParseTaxCalculation(data: unknown) {
  return TaxCalculationSchema.safeParse(data);
}

export function parseFinancialReport(data: unknown) {
  return FinancialReportSchema.parse(data);
}

export function safeParseFinancialReport(data: unknown) {
  return FinancialReportSchema.safeParse(data);
}
