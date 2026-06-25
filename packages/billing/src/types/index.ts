/**
 * @aether/billing - Core Types
 * 
 * TypeScript types for billing, usage tracking, tiered pricing, tax, and reporting
 * 
 * @version 1.0.0
 */

// =============================================================================
// USAGE TYPES
// =============================================================================

export interface UsageRecord {
  id: string;
  customerId: string;
  subscriptionId?: string;
  metric: string;
  quantity: number;
  unit: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, string>;
}

export interface UsageMetric {
  id: string;
  name: string;
  description: string;
  unit: string;
  aggregationType: 'sum' | 'max' | 'avg' | 'last';
  resetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageAggregation {
  customerId: string;
  metric: string;
  period: {
    start: Date;
    end: Date;
  };
  total: number;
  unit: string;
  recordCount: number;
  calculatedAt: Date;
}

// =============================================================================
// TIERED PRICING TYPES
// =============================================================================

export interface PricingTier {
  id: string;
  name: string;
  description?: string;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  currency: string;
  features?: string[];
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  currency: string;
  billingInterval: 'monthly' | 'yearly' | 'weekly' | 'daily';
  tiers: PricingTier[];
  basePrice?: number;
  trialDays?: number;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TieredPricingCalculation {
  planId: string;
  quantity: number;
  currency: string;
  totalAmount: number;
  breakdown: Array<{
    tierId: string;
    tierName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  calculatedAt: Date;
}

// =============================================================================
// BILLING INVOICE TYPES
// =============================================================================

export type BillingInvoiceStatus = 'draft' | 'pending' | 'processing' | 'paid' | 'failed' | 'void' | 'refunded';

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId?: string;
  status: BillingInvoiceStatus;
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  lineItems: BillingLineItem[];
  dueDate?: Date;
  paidAt?: Date;
  failedAt?: Date;
  voidedAt?: Date;
  refundedAt?: Date;
  period?: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingLineItem {
  id: string;
  type: 'usage' | 'fixed' | 'discount' | 'tax';
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  period?: {
    start: Date;
    end: Date;
  };
  metric?: string;
  tierId?: string;
  metadata?: Record<string, string>;
}

// =============================================================================
// PAYMENT REMINDER TYPES
// =============================================================================

export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export type ReminderTrigger = 'due_soon' | 'overdue' | 'payment_failed' | 'dunning_level';

export interface PaymentReminder {
  id: string;
  invoiceId: string;
  customerId: string;
  trigger: ReminderTrigger;
  status: ReminderStatus;
  scheduledFor: Date;
  sentAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  template: string;
  channel: 'email' | 'sms' | 'push' | 'webhook';
  dunningLevel?: number;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderRule {
  id: string;
  name: string;
  description: string;
  trigger: ReminderTrigger;
  offsetDays: number;
  template: string;
  channel: 'email' | 'sms' | 'push' | 'webhook';
  enabled: boolean;
  dunningLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// TAX TYPES
// =============================================================================

export interface TaxRate {
  id: string;
  name: string;
  description?: string;
  rate: number;
  type: 'vat' | 'sales_tax' | 'gst' | 'other';
  country?: string;
  region?: string;
  postalCode?: string;
  appliesTo: string[];
  exemptCategories?: string[];
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxCalculation {
  customerId: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  breakdown: Array<{
    taxRateId: string;
    taxName: string;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  calculatedAt: Date;
}

export interface TaxExemption {
  id: string;
  customerId: string;
  type: 'vat' | 'sales_tax' | 'gst' | 'resale' | 'non_profit' | 'government';
  certificateId?: string;
  reason: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  verified: boolean;
  verifiedAt?: Date;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// FINANCIAL REPORT TYPES
// =============================================================================

export type ReportType = 'revenue' | 'mrr' | 'arr' | 'churn' | 'usage' | 'tax' | 'aging' | 'custom';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface FinancialReport {
  id: string;
  type: ReportType;
  name: string;
  description?: string;
  period: {
    start: Date;
    end: Date;
  };
  granularity: ReportPeriod;
  currency: string;
  data: ReportDataPoint[];
  metadata?: Record<string, string>;
  generatedAt: Date;
  generatedBy: string;
}

export interface ReportDataPoint {
  date: Date;
  value: number;
  currency: string;
  breakdown?: Record<string, number>;
  metadata?: Record<string, string>;
}

export interface RevenueReport extends FinancialReport {
  type: 'revenue';
  data: Array<ReportDataPoint & {
    recurring: number;
    oneTime: number;
    refunds: number;
    net: number;
  }>;
}

export interface MRRReport extends FinancialReport {
  type: 'mrr';
  data: Array<ReportDataPoint & {
    newBusiness: number;
    expansion: number;
    contraction: number;
    churn: number;
    reactivation: number;
    net: number;
  }>;
}

export interface ChurnReport extends FinancialReport {
  type: 'churn';
  data: Array<ReportDataPoint & {
    customers: number;
    revenue: number;
    rate: number;
  }>;
}

export interface AgingReport {
  type: 'aging';
  data: Array<{
    bucket: string;
    amount: number;
    count: number;
    currency: string;
  }>;
}

// =============================================================================
// BILLING CYCLE TYPES
// =============================================================================

export interface BillingCycle {
  id: string;
  customerId: string;
  subscriptionId?: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  invoiceId?: string;
  usageRecords: string[];
  totalUsage: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// DISCOUNT TYPES
// =============================================================================

export type DiscountType = 'percentage' | 'fixed' | 'volume';

export interface Discount {
  id: string;
  code?: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  currency?: string;
  appliesTo: string[];
  maxUses?: number;
  currentUses: number;
  validFrom: Date;
  validTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  firstTimeOnly: boolean;
  recurring: boolean;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppliedDiscount {
  discountId: string;
  discountName: string;
  type: DiscountType;
  value: number;
  amount: number;
  currency: string;
  appliedAt: Date;
}
